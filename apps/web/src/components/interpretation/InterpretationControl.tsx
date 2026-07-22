import {
  TRANSLATION_LANGUAGES,
  SyncoraRoomMetadataSchema,
  TranslationDataMessageSchema,
  type MeetingTranslationSettings,
  type TranslationLanguageCode,
  type TranslationLanguageStatus,
  type TranslationPreference,
} from "@voice/shared";
import { GlobeHemisphereWest } from "@phosphor-icons/react";
import { useParticipants, useRoomContext } from "@livekit/components-react";
import {
  RoomEvent,
  Track,
  type RemoteParticipant,
} from "livekit-client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DATA_TOPIC = "syncoraxp.translation";

interface InterpretationControlProps {
  meetingId: string;
  settings: MeetingTranslationSettings;
  showControl: boolean;
}

interface TranslatorDetails {
  identity: string;
  runId: string;
  sourceParticipantIdentity: string;
  allowedLanguages: TranslationLanguageCode[];
  joinedAtMs: number;
}

function translatorDetails(participant: ReturnType<typeof useParticipants>[number]): TranslatorDetails | null {
  if (participant.attributes.role !== "translator") return null;
  const runId = participant.attributes.translationRunId;
  const sourceParticipantIdentity = participant.attributes.sourceParticipantIdentity;
  if (!runId || !sourceParticipantIdentity) return null;
  const allowed = (participant.attributes.allowedTargetLanguages ?? "")
    .split(",")
    .filter((code): code is TranslationLanguageCode =>
      TRANSLATION_LANGUAGES.some((language) => language.code === code),
    );
  return {
    identity: participant.identity,
    runId,
    sourceParticipantIdentity,
    allowedLanguages: allowed,
    joinedAtMs: participant.joinedAt?.getTime() ?? 0,
  };
}

export function InterpretationControl({
  meetingId,
  settings,
  showControl,
}: InterpretationControlProps) {
  const room = useRoomContext();
  const participants = useParticipants();
  const [liveSettings, setLiveSettings] = useState(settings);
  const [preference, setPreferenceState] = useState<TranslationPreference>("original");
  const [menuOpen, setMenuOpen] = useState(false);
  const [statuses, setStatuses] = useState<
    Partial<Record<TranslationLanguageCode, TranslationLanguageStatus>>
  >({});
  const [caption, setCaption] = useState("");
  const [inactiveRunIds, setInactiveRunIds] = useState<ReadonlySet<string>>(() => new Set());
  const [subscriptionRevision, setSubscriptionRevision] = useState(0);
  const sequence = useRef(0);
  const captionTimer = useRef<number | undefined>(undefined);

  const translator = useMemo(
    () =>
      participants
        .map(translatorDetails)
        .filter((details): details is TranslatorDetails => details !== null)
        .filter((details) => !inactiveRunIds.has(details.runId))
        .sort((left, right) => right.joinedAtMs - left.joinedAtMs)[0] ?? null,
    [inactiveRunIds, participants],
  );
  const allowedLanguages = translator?.allowedLanguages.length
    ? translator.allowedLanguages
    : liveSettings.allowedTargetLanguages;
  const interpretationAvailable = liveSettings.enabled;

  useEffect(() => {
    setLiveSettings(settings);
  }, [settings]);

  useEffect(() => {
    const applyMetadata = (metadata?: string) => {
      if (!metadata) return;
      try {
        const parsed = SyncoraRoomMetadataSchema.safeParse(JSON.parse(metadata));
        const nextSettings = parsed.success
          ? parsed.data.syncoraxp?.translation?.settings
          : undefined;
        if (nextSettings) setLiveSettings(nextSettings);
      } catch {
        // Ignore metadata owned by another integration or malformed room data.
      }
    };
    applyMetadata(room.metadata);
    room.on(RoomEvent.RoomMetadataChanged, applyMetadata);
    return () => {
      room.off(RoomEvent.RoomMetadataChanged, applyMetadata);
    };
  }, [room]);

  useEffect(() => {
    if (liveSettings.enabled) return;
    setPreferenceState("original");
    setCaption("");
    setMenuOpen(false);
    setStatuses({});
  }, [liveSettings.enabled]);

  const sendPreference = useCallback(
    async (language: TranslationPreference) => {
      if (!translator) return;
      await room.localParticipant.publishData(
        new TextEncoder().encode(
          JSON.stringify({
            version: 1,
            meetingId,
            translationRunId: translator.runId,
            sequence: sequence.current++,
            sentAt: new Date().toISOString(),
            type: "translation.preference.set",
            language,
          }),
        ),
        {
          reliable: true,
          topic: DATA_TOPIC,
          destinationIdentities: [translator.identity],
        },
      );
    },
    [meetingId, room.localParticipant, translator],
  );

  const selectPreference = useCallback(
    (language: TranslationPreference) => {
      setPreferenceState(language);
      setCaption("");
      setMenuOpen(false);
      void sendPreference(language).catch(() => {
        if (language !== "original") {
          setStatuses((current) => ({ ...current, [language]: "unavailable" }));
        }
      });
    },
    [sendPreference],
  );

  useEffect(() => {
    if (!translator) return;
    void sendPreference(preference).catch(() => {
      if (preference !== "original") {
        setStatuses((current) => ({ ...current, [preference]: "unavailable" }));
      }
    });
  }, [translator?.identity, translator?.runId, sendPreference]);

  useEffect(() => {
    const refreshSubscriptions = () => setSubscriptionRevision((revision) => revision + 1);
    room.on(RoomEvent.TrackPublished, refreshSubscriptions);
    room.on(RoomEvent.TrackSubscribed, refreshSubscriptions);
    room.on(RoomEvent.TrackUnsubscribed, refreshSubscriptions);
    room.on(RoomEvent.ParticipantConnected, refreshSubscriptions);
    room.on(RoomEvent.ParticipantDisconnected, refreshSubscriptions);
    room.on(RoomEvent.Reconnected, refreshSubscriptions);
    return () => {
      room.off(RoomEvent.TrackPublished, refreshSubscriptions);
      room.off(RoomEvent.TrackSubscribed, refreshSubscriptions);
      room.off(RoomEvent.TrackUnsubscribed, refreshSubscriptions);
      room.off(RoomEvent.ParticipantConnected, refreshSubscriptions);
      room.off(RoomEvent.ParticipantDisconnected, refreshSubscriptions);
      room.off(RoomEvent.Reconnected, refreshSubscriptions);
    };
  }, [room]);

  useEffect(() => {
    const onData = (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      _kind?: unknown,
      topic?: string,
    ) => {
      if (topic !== DATA_TOPIC || participant?.identity !== translator?.identity) return;
      try {
        const parsed = TranslationDataMessageSchema.safeParse(
          JSON.parse(new TextDecoder().decode(payload)),
        );
        if (
          !parsed.success ||
          parsed.data.meetingId !== meetingId ||
          parsed.data.translationRunId !== translator?.runId
        ) return;
        const message = parsed.data;
        if (message.type === "translation.worker.status") {
          if (["stopping", "completed", "failed"].includes(message.status)) {
            setInactiveRunIds((current) => {
              if (current.has(message.translationRunId)) return current;
              const next = new Set(current);
              next.add(message.translationRunId);
              return next;
            });
          }
          if (
            !liveSettings.enabled &&
            ["stopping", "completed"].includes(message.status)
          ) {
            setPreferenceState("original");
            setCaption("");
            setMenuOpen(false);
          }
          if (message.status === "failed" && preference !== "original") {
            setStatuses((current) => ({ ...current, [preference]: "unavailable" }));
            setSubscriptionRevision((revision) => revision + 1);
          }
          return;
        }
        if (message.type === "translation.language.status") {
          const { language, status } = message;
          setStatuses((current) => ({
            ...current,
            [language]: status,
          }));
          setSubscriptionRevision((revision) => revision + 1);
          return;
        }
        if (message.type === "translation.preference.ack") {
          if (message.language !== "original") {
            setStatuses((current) => ({
              ...current,
              [message.language]: message.status,
            }));
            setSubscriptionRevision((revision) => revision + 1);
          }
          return;
        }
        if (
          (message.type === "translation.caption.target.delta" ||
            message.type === "translation.caption.target.final") &&
          message.language === preference
        ) {
          const { text, type } = message;
          setCaption((current) =>
            type.endsWith(".final") ? text : current + text,
          );
          if (captionTimer.current) window.clearTimeout(captionTimer.current);
          captionTimer.current = window.setTimeout(() => setCaption(""), 6_000);
        }
      } catch {
        // Ignore malformed room data from untrusted participants.
      }
    };
    room.on(RoomEvent.DataReceived, onData);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
      if (captionTimer.current) window.clearTimeout(captionTimer.current);
    };
  }, [liveSettings.enabled, meetingId, preference, room, translator?.identity, translator?.runId]);

  useEffect(() => {
    const remoteParticipants = room.remoteParticipants;
    const selectedLanguage = preference === "original" ? null : preference;

    for (const participant of remoteParticipants.values()) {
      const isTranslator = participant.attributes.role === "translator";
      for (const publication of participant.audioTrackPublications.values()) {
        if (!isTranslator || !publication.trackName.startsWith("translation-")) continue;
        const language = publication.trackName.slice(
          "translation-".length,
        ) as TranslationLanguageCode;
        const shouldSubscribe = language === selectedLanguage;
        publication.setSubscribed(shouldSubscribe);
      }
    }

    // The listener's explicit selection is authoritative. Waiting for both a
    // status packet and TrackSubscribed before dropping source audio creates a
    // race where the original microphone can remain subscribed indefinitely.
    // Keep the original only for "original" or when the provider explicitly
    // reports that the selected translation is unavailable.
    const shouldHearOriginal =
      !selectedLanguage || !translator || statuses[selectedLanguage] === "unavailable";
    const sourceIdentity = translator?.sourceParticipantIdentity;
    if (sourceIdentity) {
      const sourceParticipant = remoteParticipants.get(sourceIdentity);
      for (const publication of sourceParticipant?.audioTrackPublications.values() ?? []) {
        if (publication.source === Track.Source.Microphone) {
          publication.setSubscribed(shouldHearOriginal);
        }
      }
    }
  }, [preference, room, statuses, subscriptionRevision, translator]);

  useEffect(() => {
    return () => {
      const sourceIdentity = translator?.sourceParticipantIdentity;
      if (!sourceIdentity) return;
      const sourceParticipant = room.remoteParticipants.get(sourceIdentity);
      for (const publication of sourceParticipant?.audioTrackPublications.values() ?? []) {
        if (publication.source === Track.Source.Microphone) publication.setSubscribed(true);
      }
    };
  }, [room, translator?.sourceParticipantIdentity]);

  if (!interpretationAvailable) return null;

  const selectedLanguage =
    preference === "original"
      ? null
      : TRANSLATION_LANGUAGES.find((language) => language.code === preference);
  const selectedStatus = preference === "original" ? "idle" : statuses[preference] ?? "starting";
  const statusLabel =
    preference === "original"
      ? "Original"
      : selectedStatus === "live"
        ? selectedLanguage?.nativeLabel ?? preference
        : `${selectedLanguage?.label ?? preference} · ${selectedStatus}`;

  return (
    <>
      {showControl && (
        <div className="interpretation-control">
          <button
            type="button"
            className={`lk-button interpretation-toggle ${menuOpen ? "is-active" : ""}`}
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
          >
            <GlobeHemisphereWest size={18} weight="bold" />
            <span>{statusLabel}</span>
          </button>
          {menuOpen && (
            <div className="interpretation-menu" role="menu" aria-label="Interpretation language">
              <button
                type="button"
                className={preference === "original" ? "selected" : ""}
                onClick={() => selectPreference("original")}
              >
                <strong>Original audio</strong>
                <small>Hear the speaker without translation</small>
              </button>
              {TRANSLATION_LANGUAGES.filter((language) =>
                allowedLanguages.includes(language.code),
              ).map((language) => (
                <button
                  type="button"
                  key={language.code}
                  className={preference === language.code ? "selected" : ""}
                  onClick={() => selectPreference(language.code)}
                >
                  <strong>{language.nativeLabel}</strong>
                  <small>{language.label}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {caption && preference !== "original" && (
        <div className="translation-caption" aria-live="polite">{caption}</div>
      )}
    </>
  );
}
