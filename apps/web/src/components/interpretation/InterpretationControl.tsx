import {
  TRANSLATION_LANGUAGES,
  SyncoraRoomMetadataSchema,
  TranslationDataMessageSchema,
  type MeetingTranslationSettings,
  type TranslationLanguageCode,
  type TranslationLanguageStatus,
  type TranslationPreference,
} from "@voice/shared";
import {
  ClosedCaptioning,
  DownloadSimple,
  DotsThreeCircle,
  FileText,
  GlobeHemisphereWest,
  Users,
  X,
} from "@phosphor-icons/react";
import { useParticipants, useRoomContext } from "@livekit/components-react";
import {
  RoomEvent,
  Track,
  type RemoteParticipant,
} from "livekit-client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { updateMeetingTranslation } from "../../api";

const DATA_TOPIC = "syncoraxp.translation";

interface InterpretationControlProps {
  meetingId: string;
  settings: MeetingTranslationSettings;
  participantRole: "host" | "guest";
  initialPreference: TranslationPreference;
  captionsOpen: boolean;
  roomsOpen: boolean;
  panelHost: HTMLElement | null;
  onCaptionsOpenChange(open: boolean): void;
  onRoomsOpenChange(open: boolean): void;
  onSettingsChange(settings: MeetingTranslationSettings): void;
}

interface TranslatorDetails {
  identity: string;
  runId: string;
  sourceParticipantIdentity: string;
  allowedLanguages: TranslationLanguageCode[];
  joinedAtMs: number;
}

interface CaptionEntry {
  text: string;
  spokenAt: string;
}

function roomStatusLabel(
  status: TranslationLanguageStatus | undefined,
  workerConnected: boolean,
): string {
  if (!status) return workerConnected ? "Ready" : "Starting";
  if (status === "idle") return "Ready";
  if (status === "live") return "Live";
  if (status === "starting") return "Starting";
  if (status === "delayed" || status === "reconnecting") return "Reconnecting";
  if (status === "draining") return "Stopping";
  return "Unavailable";
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
  participantRole,
  initialPreference,
  captionsOpen,
  roomsOpen,
  panelHost,
  onCaptionsOpenChange,
  onRoomsOpenChange,
  onSettingsChange,
}: InterpretationControlProps) {
  const room = useRoomContext();
  const participants = useParticipants();
  const startingPreference =
    settings.enabled &&
    initialPreference !== "original" &&
    settings.allowedTargetLanguages.includes(initialPreference)
      ? initialPreference
      : "original";
  const [liveSettings, setLiveSettings] = useState(settings);
  const [preference, setPreferenceState] =
    useState<TranslationPreference>(startingPreference);
  const [captionPreference, setCaptionPreferenceState] =
    useState<TranslationPreference>(startingPreference);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"captions" | "transcript">("captions");
  const [statuses, setStatuses] = useState<
    Partial<Record<TranslationLanguageCode, TranslationLanguageStatus>>
  >({});
  const [listenerCounts, setListenerCounts] = useState<
    Partial<Record<TranslationLanguageCode, number>>
  >({});
  const [roomsBusy, setRoomsBusy] = useState(false);
  const [roomsError, setRoomsError] = useState("");
  const [roomsNotice, setRoomsNotice] = useState("");
  const [caption, setCaption] = useState("");
  const [captionHistory, setCaptionHistory] = useState<
    Partial<Record<TranslationLanguageCode | "source", CaptionEntry[]>>
  >({});
  const [inactiveRunIds, setInactiveRunIds] = useState<ReadonlySet<string>>(() => new Set());
  const [subscriptionRevision, setSubscriptionRevision] = useState(0);
  const sequence = useRef(0);
  const lastWorkerSequence = useRef<{ runId: string; sequence: number } | null>(null);
  const captionEnd = useRef<HTMLDivElement>(null);

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
  const isHost = participantRole === "host";
  const guestCount = participants.filter((participant) => participant.attributes.role === "guest").length;
  const translatedGuestCount = allowedLanguages.reduce(
    (total, language) => total + (listenerCounts[language] ?? 0),
    0,
  );
  const originalGuestCount = Math.max(0, guestCount - translatedGuestCount);

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
    setCaptionPreferenceState("original");
    setCaption("");
    setStatuses({});
    setListenerCounts({});
    if (!isHost) onRoomsOpenChange(false);
    if (!liveSettings.subtitlesEnabled && captionsOpen) onCaptionsOpenChange(false);
  }, [
    captionsOpen,
    isHost,
    liveSettings.enabled,
    liveSettings.subtitlesEnabled,
    onCaptionsOpenChange,
    onRoomsOpenChange,
  ]);

  useEffect(() => {
    // Status from an earlier worker run must not affect routing for its
    // replacement after interpretation is toggled off and back on.
    setStatuses({});
    setListenerCounts({});
    lastWorkerSequence.current = translator
      ? { runId: translator.runId, sequence: -1 }
      : null;
    setSubscriptionRevision((revision) => revision + 1);
  }, [translator?.runId]);

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

  const sendCaptionPreference = useCallback(async (language: TranslationPreference) => {
    if (!translator) return;
    await room.localParticipant.publishData(
      new TextEncoder().encode(
        JSON.stringify({
          version: 1,
          meetingId,
          translationRunId: translator.runId,
          sequence: sequence.current++,
          sentAt: new Date().toISOString(),
          type: "translation.caption.preference.set",
          language,
        }),
      ),
      {
        reliable: true,
        topic: DATA_TOPIC,
        destinationIdentities: [translator.identity],
      },
    );
  }, [meetingId, room.localParticipant, translator]);

  const selectPreference = useCallback(
    (language: TranslationPreference) => {
      setPreferenceState(language);
      setCaptionPreferenceState(language);
      setCaption("");
      setRoomsError("");
      setRoomsNotice("");
      if (language === "original" && captionsOpen && !liveSettings.subtitlesEnabled) {
        onCaptionsOpenChange(false);
      }
      void sendCaptionPreference(language).catch(() => undefined);
      void sendPreference(language).catch(() => {
        if (language !== "original") {
          setStatuses((current) => ({ ...current, [language]: "unavailable" }));
        }
      });
    },
    [
      captionsOpen,
      liveSettings.subtitlesEnabled,
      onCaptionsOpenChange,
      sendCaptionPreference,
      sendPreference,
    ],
  );

  const returnToOriginal = useCallback(
    (message: string) => {
      selectPreference("original");
      setRoomsNotice(message);
    },
    [selectPreference],
  );

  useEffect(() => {
    if (
      !liveSettings.enabled ||
      preference === "original" ||
      liveSettings.allowedTargetLanguages.includes(preference)
    ) return;
    returnToOriginal("Your selected language is no longer available. You are hearing Original audio.");
  }, [liveSettings.allowedTargetLanguages, liveSettings.enabled, preference, returnToOriginal]);

  const toggleRooms = useCallback(async () => {
    if (!isHost || roomsBusy) return;
    setRoomsBusy(true);
    setRoomsError("");
    try {
      const response = await updateMeetingTranslation(meetingId, {
        enabled: !liveSettings.enabled,
        designatedSpeakerIdentity: room.localParticipant.identity,
        ...(!liveSettings.enabled ? { provider: "gemini" as const } : {}),
      });
      setLiveSettings(response.settings);
      onSettingsChange(response.settings);
      setRoomsNotice(response.settings.enabled ? "Language rooms are now available." : "");
    } catch (caught) {
      setRoomsError(caught instanceof Error ? caught.message : "Could not update language rooms");
    } finally {
      setRoomsBusy(false);
    }
  }, [
    isHost,
    liveSettings.enabled,
    meetingId,
    onSettingsChange,
    room.localParticipant.identity,
    roomsBusy,
  ]);

  const selectCaptionPreference = useCallback(
    (language: TranslationPreference) => {
      setCaptionPreferenceState(language);
      setCaption("");
      void sendCaptionPreference(language).catch(() => undefined);
    },
    [sendCaptionPreference],
  );

  useEffect(() => {
    if (!captionsOpen) return;
    if (panelMode === "transcript") {
      if (!liveSettings.transcriptionEnabled) onCaptionsOpenChange(false);
      return;
    }
    if (captionPreference !== "original" || liveSettings.subtitlesEnabled) return;
    const firstTargetLanguage = liveSettings.enabled
      ? liveSettings.allowedTargetLanguages[0]
      : undefined;
    if (firstTargetLanguage) {
      selectCaptionPreference(firstTargetLanguage);
    } else {
      onCaptionsOpenChange(false);
    }
  }, [
    captionPreference,
    captionsOpen,
    liveSettings.allowedTargetLanguages,
    liveSettings.enabled,
    liveSettings.subtitlesEnabled,
    liveSettings.transcriptionEnabled,
    onCaptionsOpenChange,
    panelMode,
    selectCaptionPreference,
  ]);

  useEffect(() => {
    if (!translator) return;
    void sendPreference(preference).catch(() => {
      if (preference !== "original") {
        setStatuses((current) => ({ ...current, [preference]: "unavailable" }));
      }
    });
  }, [translator?.identity, translator?.runId, sendPreference]);

  useEffect(() => {
    void sendCaptionPreference(captionPreference).catch(() => undefined);
  }, [
    captionPreference,
    sendCaptionPreference,
    translator?.identity,
    translator?.runId,
  ]);

  useEffect(() => {
    if (!liveSettings.enabled) void sendPreference("original").catch(() => undefined);
  }, [liveSettings.enabled, sendPreference]);

  useEffect(() => {
    const refreshSubscriptions = () => setSubscriptionRevision((revision) => revision + 1);
    const handleReconnected = () => {
      refreshSubscriptions();
      void sendPreference(preference).catch(() => undefined);
      void sendCaptionPreference(captionPreference).catch(() => undefined);
    };
    room.on(RoomEvent.TrackPublished, refreshSubscriptions);
    room.on(RoomEvent.TrackUnpublished, refreshSubscriptions);
    room.on(RoomEvent.TrackSubscribed, refreshSubscriptions);
    room.on(RoomEvent.TrackUnsubscribed, refreshSubscriptions);
    room.on(RoomEvent.ParticipantConnected, refreshSubscriptions);
    room.on(RoomEvent.ParticipantDisconnected, refreshSubscriptions);
    room.on(RoomEvent.Reconnected, handleReconnected);
    return () => {
      room.off(RoomEvent.TrackPublished, refreshSubscriptions);
      room.off(RoomEvent.TrackUnpublished, refreshSubscriptions);
      room.off(RoomEvent.TrackSubscribed, refreshSubscriptions);
      room.off(RoomEvent.TrackUnsubscribed, refreshSubscriptions);
      room.off(RoomEvent.ParticipantConnected, refreshSubscriptions);
      room.off(RoomEvent.ParticipantDisconnected, refreshSubscriptions);
      room.off(RoomEvent.Reconnected, handleReconnected);
    };
  }, [captionPreference, preference, room, sendCaptionPreference, sendPreference]);

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
        const lastMessage = lastWorkerSequence.current;
        if (
          lastMessage?.runId === message.translationRunId &&
          message.sequence <= lastMessage.sequence
        ) return;
        lastWorkerSequence.current = {
          runId: message.translationRunId,
          sequence: message.sequence,
        };
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
          }
          if (message.status === "failed" && preference !== "original") {
            returnToOriginal("Your language room became unavailable. You are hearing Original audio.");
          }
          return;
        }
        if (message.type === "translation.language.status") {
          const { language, status, listenerCount } = message;
          setStatuses((current) => ({
            ...current,
            [language]: status,
          }));
          setListenerCounts((current) => ({
            ...current,
            [language]: listenerCount,
          }));
          if (status === "unavailable" && preference === language) {
            returnToOriginal(
              `${TRANSLATION_LANGUAGES.find((item) => item.code === language)?.label ?? language} is unavailable. You are hearing Original audio.`,
            );
          }
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
        const sourceTranscript =
          message.type === "translation.transcript.source.delta" ||
          message.type === "translation.transcript.source.final" ||
          message.type === "translation.caption.source.delta" ||
          message.type === "translation.caption.source.final";
        const targetCaption =
          (message.type === "translation.caption.target.delta" ||
            message.type === "translation.caption.target.final") &&
          message.language === captionPreference;
        if (sourceTranscript || targetCaption) {
          const { text, type } = message;
          const historyKey =
            sourceTranscript ? "source" : "language" in message ? message.language : undefined;
          if (!historyKey) return;
          const visible =
            sourceTranscript
              ? (panelMode === "transcript" && liveSettings.transcriptionEnabled) ||
                (panelMode === "captions" &&
                  liveSettings.subtitlesEnabled &&
                  captionPreference === "original")
              : panelMode === "captions";
          if (type.endsWith(".final")) {
            if (visible) setCaption("");
            if (!text.trim()) return;
            setCaptionHistory((current) => ({
              ...current,
              [historyKey]: [
                ...(current[historyKey] ?? []),
                { text, spokenAt: new Date().toISOString() },
              ],
            }));
          } else if (visible) {
            setCaption((current) => current + text);
          }
        }
      } catch {
        // Ignore malformed room data from untrusted participants.
      }
    };
    room.on(RoomEvent.DataReceived, onData);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
    };
  }, [
    liveSettings.enabled,
    liveSettings.subtitlesEnabled,
    liveSettings.transcriptionEnabled,
    captionPreference,
    meetingId,
    panelMode,
    preference,
    room,
    returnToOriginal,
    translator?.identity,
    translator?.runId,
  ]);

  useEffect(() => {
    if (captionsOpen) captionEnd.current?.scrollIntoView({ block: "end" });
  }, [caption, captionHistory, captionsOpen]);

  useEffect(() => {
    if (!roomsNotice) return;
    const timer = window.setTimeout(() => setRoomsNotice(""), 5_000);
    return () => window.clearTimeout(timer);
  }, [roomsNotice]);

  useEffect(() => {
    const remoteParticipants = room.remoteParticipants;
    const selectedLanguage = preference === "original" ? null : preference;

    for (const participant of remoteParticipants.values()) {
      const isActiveTranslator = participant.identity === translator?.identity;
      for (const publication of participant.audioTrackPublications.values()) {
        if (
          participant.attributes.role !== "translator" ||
          !publication.trackName.startsWith("translation-")
        ) continue;
        const language = publication.trackName.slice(
          "translation-".length,
        ) as TranslationLanguageCode;
        const shouldSubscribe = isActiveTranslator && language === selectedLanguage;
        publication.setSubscribed(shouldSubscribe);
      }
    }

    // The listener's explicit selection is authoritative. Waiting for both a
    // status packet and TrackSubscribed before dropping source audio creates a
    // race where the original microphone can remain subscribed indefinitely.
    // A target-language selection must never silently play the source channel.
    // Keep the original while a replacement worker is joining, then suppress
    // it as soon as the active translator is known.
    const shouldHearOriginal = !selectedLanguage || !translator;
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

  const selectedLanguage =
    preference === "original"
      ? null
      : TRANSLATION_LANGUAGES.find((language) => language.code === preference);
  const selectedCaptionLanguage =
    captionPreference === "original"
      ? null
      : TRANSLATION_LANGUAGES.find((language) => language.code === captionPreference);

  const visibleCaptions =
    captionHistory[
      panelMode === "transcript" || captionPreference === "original"
        ? "source"
        : captionPreference
    ] ?? [];
  const downloadTranscript = () => {
    const lines = (captionHistory.source ?? []).map(
      (entry) =>
        `[${new Date(entry.spokenAt).toLocaleTimeString()}] Host: ${entry.text}`,
    );
    const url = URL.createObjectURL(new Blob([lines.join("\n\n")], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `transcript-${meetingId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const captionPanel = captionsOpen && panelHost && createPortal(
    <aside
      className="translation-caption-panel"
      aria-label={panelMode === "transcript" ? "Transcript" : "Captions"}
    >
      <header>
        <span>
          {panelMode === "transcript"
            ? <FileText size={21} weight="bold" />
            : <ClosedCaptioning size={21} weight="bold" />}
          <span>
            <strong>{panelMode === "transcript" ? "Transcript" : "Captions"}</strong>
            <small>
              {panelMode === "transcript"
                ? "Original language · Saved for the host"
                : selectedCaptionLanguage?.nativeLabel ?? "Original language · Auto-detect"}
            </small>
            {panelMode === "captions" && (
              <select
                className="translation-caption-language"
                aria-label="Caption language"
                value={captionPreference}
                onChange={(event) =>
                  selectCaptionPreference(event.target.value as TranslationPreference)
                }
              >
                {liveSettings.subtitlesEnabled && (
                  <option value="original">Original · Auto-detect</option>
                )}
                {TRANSLATION_LANGUAGES.filter((language) =>
                  allowedLanguages.includes(language.code),
                ).map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.label}
                  </option>
                ))}
              </select>
            )}
          </span>
        </span>
        <span className="translation-caption-actions">
          {panelMode === "transcript" && (
            <button
              type="button"
              onClick={downloadTranscript}
              disabled={!captionHistory.source?.length}
              aria-label="Download transcript"
              title="Download transcript"
            >
              <DownloadSimple size={18} weight="bold" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onCaptionsOpenChange(false)}
            aria-label={`Close ${panelMode}`}
          >
            <X size={18} weight="bold" />
          </button>
        </span>
      </header>
      <div className="translation-caption-history" role="log" aria-live="polite">
        {visibleCaptions.map((entry, index) => (
          <p key={index}>
            {panelMode === "transcript" && (
              <small>
                Host · {new Date(entry.spokenAt).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </small>
            )}
            {entry.text}
          </p>
        ))}
        {caption && <p className="is-live">{caption}</p>}
        {!visibleCaptions.length && !caption && (
          <div className="translation-caption-empty">
            {panelMode === "transcript"
              ? <FileText size={32} weight="duotone" />
              : <ClosedCaptioning size={32} weight="duotone" />}
            <strong>Waiting for speech</strong>
            <small>
              {panelMode === "transcript"
                ? "Finalized speech is saved and remains available after the meeting."
                : "New captions will stay here for this meeting."}
            </small>
          </div>
        )}
        <div ref={captionEnd} />
      </div>
    </aside>,
    panelHost,
  );

  const availableRooms = TRANSLATION_LANGUAGES.filter((language) =>
    allowedLanguages.includes(language.code),
  );
  const selectedRoomStatus = selectedLanguage
    ? roomStatusLabel(statuses[selectedLanguage.code], Boolean(translator))
    : "Original audio";
  const roomsPanel = roomsOpen && panelHost && createPortal(
    <aside className="language-rooms-panel" aria-label="Language rooms">
      <header>
        <span>
          <GlobeHemisphereWest size={21} weight="bold" />
          <span>
            <strong>Rooms</strong>
            <small>
              {isHost
                ? "Manage language listening rooms"
                : `Listening to ${selectedLanguage?.label ?? "Original"}`}
            </small>
          </span>
        </span>
        <button
          type="button"
          onClick={() => onRoomsOpenChange(false)}
          aria-label="Close language rooms"
        >
          <X size={18} weight="bold" />
        </button>
      </header>

      <div className="language-rooms-body">
        {isHost && (
          <section className="language-rooms-master" aria-labelledby="language-rooms-master-title">
            <span>
              <strong id="language-rooms-master-title">Language rooms</strong>
              <small>Let guests listen to your audio in their preferred language.</small>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={liveSettings.enabled}
              aria-label="Enable language rooms"
              className={`language-rooms-switch ${liveSettings.enabled ? "on" : "off"}`}
              disabled={roomsBusy}
              onClick={() => void toggleRooms()}
            >
              <span />
            </button>
          </section>
        )}

        {roomsError && <p className="language-rooms-error" role="alert">{roomsError}</p>}

        <section className="language-rooms-list-section" aria-labelledby="language-rooms-list-title">
          <div className="language-rooms-list-heading">
            <span>
              <strong id="language-rooms-list-title">
                {isHost ? "Available rooms" : "Listening language"}
              </strong>
              <small>
                {isHost
                  ? liveSettings.enabled
                    ? "Guests can switch rooms at any time."
                    : "Turn on Rooms when you are ready."
                  : "Video, chat, and participants stay shared when you switch."}
              </small>
            </span>
            {isHost && <Users size={18} weight="bold" />}
          </div>

          {isHost ? (
            <div className="language-rooms-list">
              <div className="language-room-row original">
                <span className="language-room-icon" aria-hidden="true">O</span>
                <span className="language-room-copy">
                  <strong>Original</strong>
                  <small>Host audio · Always available</small>
                </span>
                <span className="language-room-count">
                  {originalGuestCount} {originalGuestCount === 1 ? "listener" : "listeners"}
                </span>
              </div>
              {availableRooms.map((language) => {
                const status = statuses[language.code];
                const statusLabel = liveSettings.enabled
                  ? roomStatusLabel(status, Boolean(translator))
                  : "Off";
                const unavailable = status === "unavailable" || status === "draining";
                const count = listenerCounts[language.code] ?? 0;
                return (
                <div
                  className={`language-room-row ${unavailable ? "unavailable" : ""}`}
                  key={language.code}
                >
                  <span className="language-room-icon" aria-hidden="true">
                    {language.label.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="language-room-copy">
                    <strong>{language.label}</strong>
                    <small><span className={`language-room-status-dot ${statusLabel.toLowerCase()}`} />{statusLabel}</small>
                  </span>
                  <span className="language-room-count">
                    {count} {count === 1 ? "listener" : "listeners"}
                  </span>
                </div>
                );
              })}
            </div>
          ) : (
            <>
              <div className={`language-room-current ${preference === "original" ? "original" : ""}`} aria-live="polite">
                <span className="language-room-icon" aria-hidden="true">
                  {selectedLanguage ? selectedLanguage.label.slice(0, 2).toUpperCase() : "O"}
                </span>
                <span className="language-room-copy">
                  <small>Currently listening</small>
                  <strong>{selectedLanguage?.label ?? "Original"}</strong>
                </span>
                <span className="language-room-current-status">{selectedRoomStatus}</span>
              </div>
              <details className="language-room-picker">
                <summary>Change language</summary>
                <div className="language-rooms-list">
                  {preference !== "original" && (
                    <button
                      type="button"
                      className="language-room-row original"
                      onClick={() => selectPreference("original")}
                    >
                      <span className="language-room-icon" aria-hidden="true">O</span>
                      <span className="language-room-copy">
                        <strong>Original</strong>
                        <small>Hear the host without translation</small>
                      </span>
                      <span className="language-room-action">Choose</span>
                    </button>
                  )}
                  {availableRooms.filter((language) => language.code !== preference).map((language) => {
                    const status = statuses[language.code];
                    const statusLabel = roomStatusLabel(status, Boolean(translator));
                    const unavailable = status === "unavailable" || status === "draining";
                    return (
                      <button
                        type="button"
                        key={language.code}
                        className="language-room-row"
                        disabled={unavailable}
                        onClick={() => selectPreference(language.code)}
                      >
                        <span className="language-room-icon" aria-hidden="true">
                          {language.label.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="language-room-copy">
                          <strong>{language.label}</strong>
                          <small><span className={`language-room-status-dot ${statusLabel.toLowerCase()}`} />{statusLabel}</small>
                        </span>
                        <span className="language-room-action">
                          {unavailable ? "Unavailable" : "Choose"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </details>
            </>
          )}
        </section>
      </div>
    </aside>,
    panelHost,
  );

  return (
    <>
      <div className="interpretation-controls">
          {(isHost || interpretationAvailable) && <div className="interpretation-control">
            <button
              type="button"
              className={`lk-button interpretation-toggle ${roomsOpen ? "is-active" : ""}`}
              onClick={() => {
                setMoreMenuOpen(false);
                onRoomsOpenChange(!roomsOpen);
              }}
              aria-expanded={roomsOpen}
              aria-label="Language rooms"
            >
              <GlobeHemisphereWest size={18} weight="bold" />
              <span>Rooms</span>
            </button>
          </div>}
          {(liveSettings.subtitlesEnabled ||
            liveSettings.transcriptionEnabled ||
            liveSettings.enabled) && <div className="meeting-more-control">
            <button
              type="button"
              className={`lk-button meeting-more-toggle ${moreMenuOpen ? "is-active" : ""}`}
              onClick={() => {
                setMoreMenuOpen((open) => !open);
                onRoomsOpenChange(false);
              }}
              aria-expanded={moreMenuOpen}
            >
              <DotsThreeCircle size={19} weight="bold" />
              <span>More</span>
            </button>
            {moreMenuOpen && (
              <div className="meeting-more-menu" role="menu">
                {(liveSettings.subtitlesEnabled || liveSettings.enabled) && <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={captionsOpen && panelMode === "captions"}
                  onClick={() => {
                    const open = !captionsOpen || panelMode !== "captions";
                    setPanelMode("captions");
                    setCaption("");
                    onCaptionsOpenChange(open);
                    setMoreMenuOpen(false);
                  }}
                >
                  <ClosedCaptioning size={20} weight="bold" />
                  <span><strong>Show captions</strong><small>Choose original or translated captions</small></span>
                  <span className={`meeting-more-check ${captionsOpen && panelMode === "captions" ? "checked" : ""}`} aria-hidden="true" />
                </button>}
                {liveSettings.transcriptionEnabled && <button
                  type="button"
                  onClick={() => {
                    setPanelMode("transcript");
                    setCaption("");
                    onCaptionsOpenChange(true);
                    setMoreMenuOpen(false);
                  }}
                >
                  <FileText size={20} weight="bold" />
                  <span><strong>Transcript</strong><small>View and download the meeting record</small></span>
                </button>}
              </div>
            )}
          </div>}
        </div>
      {captionPanel}
      {roomsPanel}
      {roomsNotice && <div className="language-room-notice" role="status">{roomsNotice}</div>}
    </>
  );
}
