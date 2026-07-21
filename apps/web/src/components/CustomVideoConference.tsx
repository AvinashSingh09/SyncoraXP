import { RoomEvent, Track } from "livekit-client";
import * as React from "react";
import {
  MicrophoneSlash,
  ShieldCheck,
  SignOut,
  VideoCameraSlash,
  WarningCircle,
} from "@phosphor-icons/react";
import type { MeetingTranslationSettings } from "@voice/shared";
import type {
  MessageFormatter,
  MessageEncoder,
  MessageDecoder,
  TrackReferenceOrPlaceholder,
  TrackReference,
  WidgetState,
} from "@livekit/components-react";
import {
  CarouselLayout,
  ConnectionStateToast,
  DisconnectButton,
  FocusLayout,
  FocusLayoutContainer,
  GridLayout,
  LayoutContextProvider,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  Chat,
  useCreateLayoutContext,
  usePinnedTracks,
  useTracks,
  useParticipants,
  useLocalParticipantPermissions,
  isTrackReference,
} from "@livekit/components-react";
import { InterpretationControl } from "./interpretation/InterpretationControl";

export interface CustomVideoConferenceProps extends React.HTMLAttributes<HTMLDivElement> {
  chatMessageFormatter?: MessageFormatter;
  chatMessageEncoder?: MessageEncoder;
  chatMessageDecoder?: MessageDecoder;
  SettingsComponent?: React.ComponentType;
  showHostTools?: boolean;
  isHostToolsOpen?: boolean;
  isHostPanelOpen?: boolean;
  onToggleHostTools?: () => void;
  onCloseHostPanel?: () => void;
  onEndMeeting?: () => void;
  isEndingMeeting?: boolean;
  endMeetingError?: string;
  meetingId: string;
  participantRole: "host" | "guest";
  translationSettings: MeetingTranslationSettings;
}

function isEqualTrackRef(a?: TrackReferenceOrPlaceholder, b?: TrackReferenceOrPlaceholder): boolean {
  if (!a || !b) return a === b;
  return (
    a.participant.identity === b.participant.identity &&
    a.source === b.source &&
    a.publication?.trackSid === b.publication?.trackSid
  );
}

function DisabledMediaButton({ source }: { source: Track.Source }) {
  const isMicrophone = source === Track.Source.Microphone;
  const Icon = isMicrophone ? MicrophoneSlash : VideoCameraSlash;
  const label = `${isMicrophone ? "Microphone" : "Camera"} disabled by host`;
  return (
    <button
      type="button"
      className="meeting-disabled-media-button"
      aria-label={label}
      title={label}
      disabled
    >
      <Icon size={18} weight="bold" />
    </button>
  );
}

export function CustomVideoConference({
  chatMessageFormatter,
  chatMessageDecoder,
  chatMessageEncoder,
  SettingsComponent,
  showHostTools,
  isHostToolsOpen,
  isHostPanelOpen,
  onToggleHostTools,
  onCloseHostPanel,
  onEndMeeting,
  isEndingMeeting,
  endMeetingError,
  meetingId,
  participantRole,
  translationSettings,
  ...props
}: CustomVideoConferenceProps) {
  const [widgetState, setWidgetState] = React.useState<WidgetState>({
    showChat: false,
    unreadMessages: 0,
    showSettings: false,
  });

  const [showParticipants, setShowParticipants] = React.useState(false);
  const [showEndMeetingConfirmation, setShowEndMeetingConfirmation] = React.useState(false);
  const localPermissions = useLocalParticipantPermissions();
  const canPublishSource = (source: Track.Source) => {
    if (!localPermissions) return true;
    const protocolSource = source === Track.Source.Camera ? 1 : 2;
    return localPermissions.canPublish && (
      localPermissions.canPublishSources.length === 0 ||
      localPermissions.canPublishSources.includes(protocolSource)
    );
  };
  const canUseMicrophone = canPublishSource(Track.Source.Microphone);
  const canUseCamera = canPublishSource(Track.Source.Camera);
  const participants = useParticipants();
  const visibleParticipants = participants.filter(
    (participant) => participant.attributes.role !== "translator" && participant.attributes.hidden !== "true",
  );

  const lastAutoFocusedScreenShareTrack = React.useRef<TrackReferenceOrPlaceholder | null>(null);

  const allTracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );
  const tracks = allTracks.filter(
    (track) => track.participant.attributes.role !== "translator" && track.participant.attributes.hidden !== "true",
  );

  const widgetUpdate = React.useCallback((state: WidgetState) => {
    setWidgetState(state);
    if (state.showChat) {
      setShowParticipants(false);
      onCloseHostPanel?.();
    }
  }, [onCloseHostPanel]);

  const layoutContext = useCreateLayoutContext();

  const screenShareTracks: TrackReference[] = tracks
    .filter(isTrackReference)
    .filter((track) => track.publication.source === Track.Source.ScreenShare);

  const focusTrack = usePinnedTracks(layoutContext)?.[0];
  const carouselTracks = tracks.filter((track) => !isEqualTrackRef(track, focusTrack));

  // Host side panels, chat, and participants are mutually exclusive.
  React.useEffect(() => {
    if (isHostPanelOpen) {
      setShowParticipants(false);
      layoutContext.widget.dispatch?.({ msg: "hide_chat" });
    }
  }, [isHostPanelOpen]);

  React.useEffect(() => {
    const firstScreenShare = screenShareTracks[0];
    if (
      screenShareTracks.some((track) => track.publication.isSubscribed) &&
      firstScreenShare &&
      lastAutoFocusedScreenShareTrack.current === null
    ) {
      layoutContext.pin.dispatch?.({ msg: "set_pin", trackReference: firstScreenShare });
      lastAutoFocusedScreenShareTrack.current = firstScreenShare;
    } else if (
      lastAutoFocusedScreenShareTrack.current &&
      !screenShareTracks.some(
        (track) =>
          isTrackReference(lastAutoFocusedScreenShareTrack.current) &&
          track.publication.trackSid === lastAutoFocusedScreenShareTrack.current.publication.trackSid
      )
    ) {
      layoutContext.pin.dispatch?.({ msg: "clear_pin" });
      lastAutoFocusedScreenShareTrack.current = null;
    }
    if (focusTrack && !isTrackReference(focusTrack)) {
      const updatedFocusTrack = tracks.find(
        (tr) =>
          tr.participant.identity === focusTrack.participant.identity &&
          tr.source === focusTrack.source
      );
      if (updatedFocusTrack && isTrackReference(updatedFocusTrack)) {
        layoutContext.pin.dispatch?.({ msg: "set_pin", trackReference: updatedFocusTrack });
      }
    }
  }, [
    screenShareTracks
      .map((ref) => `${ref.publication.trackSid}_${ref.publication.isSubscribed}`)
      .join(),
    focusTrack?.publication?.trackSid,
    tracks,
  ]);

  const toggleParticipants = React.useCallback(() => {
    setShowParticipants((prev) => {
      const next = !prev;
      if (next) {
        layoutContext.widget.dispatch?.({ msg: "hide_chat" });
        onCloseHostPanel?.();
      }
      return next;
    });
  }, [layoutContext.widget, onCloseHostPanel]);

  return (
    <div className="lk-video-conference" {...props}>
      <LayoutContextProvider
        value={layoutContext}
        onWidgetChange={widgetUpdate}
      >
        <div className="lk-video-conference-inner">
          {!focusTrack ? (
            <div className="lk-grid-layout-wrapper">
              <GridLayout tracks={tracks}>
                <ParticipantTile />
              </GridLayout>
            </div>
          ) : (
            <div className="lk-focus-layout-wrapper">
              <FocusLayoutContainer>
                <CarouselLayout tracks={carouselTracks}>
                  <ParticipantTile />
                </CarouselLayout>
                {focusTrack && <FocusLayout trackRef={focusTrack} />}
              </FocusLayoutContainer>
            </div>
          )}
          <div className="lk-control-bar-container">
            <div className="meeting-device-controls">
              <ControlBar
                className="meeting-device-control-bar"
                variation="minimal"
                controls={{
                  microphone: canUseMicrophone,
                  camera: canUseCamera,
                  screenShare: false,
                  chat: false,
                  settings: false,
                  leave: false,
                }}
              />
              <div className="meeting-disabled-media-controls">
                {!canUseMicrophone && <DisabledMediaButton source={Track.Source.Microphone} />}
                {!canUseCamera && <DisabledMediaButton source={Track.Source.Camera} />}
              </div>
            </div>
            <div className="meeting-centered-controls">
              <ControlBar
                className="meeting-action-controls"
                controls={{
                  microphone: false,
                  camera: false,
                  screenShare: true,
                  chat: true,
                  settings: !!SettingsComponent,
                  leave: false,
                }}
              />
              <InterpretationControl
                meetingId={meetingId}
                settings={translationSettings}
                showControl={participantRole === "guest"}
              />
              <button
                type="button"
                className={`lk-button participants-toggle-button ${showParticipants ? "is-active" : ""}`}
                onClick={toggleParticipants}
                aria-pressed={showParticipants}
              >
                <div className="participants-toggle-top">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span className="participants-count-badge">{visibleParticipants.length}</span>
                  <svg className={`chevron-icon ${showParticipants ? "open" : ""}`} viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </div>
                <span className="participants-toggle-label">Participants</span>
              </button>
              {showHostTools && (
                <button
                  type="button"
                  className={`lk-button host-tools-toggle-button ${isHostToolsOpen ? "is-active" : ""}`}
                  onClick={onToggleHostTools}
                  aria-pressed={isHostToolsOpen}
                >
                  <ShieldCheck size={18} weight="bold" />
                  <span>Host tools</span>
                </button>
              )}
            </div>
            {showHostTools && (
              <button
                type="button"
                className="lk-button host-end-meeting-button"
                disabled={isEndingMeeting}
                onClick={() => setShowEndMeetingConfirmation(true)}
              >
                <SignOut size={18} weight="bold" />
                <span>{isEndingMeeting ? "Ending..." : "End meeting"}</span>
              </button>
            )}
            {!showHostTools && (
              <DisconnectButton className="lk-button guest-leave-button">
                <SignOut size={18} weight="bold" />
                <span>Leave</span>
              </DisconnectButton>
            )}
          </div>
          {endMeetingError && <div className="meeting-action-error" role="alert">{endMeetingError}</div>}
        </div>
        {showEndMeetingConfirmation && (
          <div
            className="end-meeting-modal-backdrop"
            onMouseDown={(event) => {
              if (event.currentTarget === event.target && !isEndingMeeting) {
                setShowEndMeetingConfirmation(false);
              }
            }}
          >
            <section
              className="end-meeting-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="end-meeting-title"
              aria-describedby="end-meeting-description"
              onKeyDown={(event) => {
                if (event.key === "Escape" && !isEndingMeeting) {
                  setShowEndMeetingConfirmation(false);
                }
              }}
            >
              <span className="end-meeting-modal-icon" aria-hidden="true">
                <WarningCircle size={28} weight="fill" />
              </span>
              <div className="end-meeting-modal-copy">
                <h2 id="end-meeting-title">End meeting for everyone?</h2>

              </div>
              {endMeetingError && <p className="end-meeting-modal-error" role="alert">{endMeetingError}</p>}
              <div className="end-meeting-modal-actions">
                <button
                  type="button"
                  className="end-meeting-cancel-button"
                  disabled={isEndingMeeting}
                  onClick={() => setShowEndMeetingConfirmation(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="end-meeting-confirm-button"
                  disabled={isEndingMeeting}
                  onClick={onEndMeeting}
                  autoFocus
                >
                  <SignOut size={17} weight="bold" />
                  {isEndingMeeting ? "Ending meeting..." : "End meeting"}
                </button>
              </div>
            </section>
          </div>
        )}
        <Chat
          style={{ display: widgetState.showChat ? "grid" : "none" }}
          messageFormatter={chatMessageFormatter}
          messageEncoder={chatMessageEncoder}
          messageDecoder={chatMessageDecoder}
        />
        <aside
          className="participants-panel lk-chat"
          style={{ display: showParticipants ? "flex" : "none" }}
        >
          <div className="participants-panel-header">
            <div className="participants-title">
              <strong>Participants</strong>
              <span className="participants-total-badge">{visibleParticipants.length}</span>
            </div>
            <button
              type="button"
              className="participants-close-btn"
              onClick={() => setShowParticipants(false)}
              aria-label="Close participants list"
            >
              &times;
            </button>
          </div>
          <ul className="participants-list">
            {visibleParticipants.map((p) => {
              const isMicOn = p.isMicrophoneEnabled;
              const isCamOn = p.isCameraEnabled;
              const initial = (p.name || p.identity || "?").charAt(0).toUpperCase();

              return (
                <li key={p.sid} className="participant-row">
                  <div className="participant-avatar">{initial}</div>
                  <div className="participant-info">
                    <span className="participant-name">
                      {p.name || p.identity}
                      {p.isLocal && <small className="local-tag"> (You)</small>}
                    </span>
                  </div>
                  <div className="participant-media-status">
                    <span className={`status-icon mic ${isMicOn ? "on" : "off"}`} title={isMicOn ? "Microphone On" : "Microphone Muted"}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {isMicOn ? (
                          <>
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                          </>
                        ) : (
                          <>
                            <line x1="1" y1="1" x2="23" y2="23" />
                            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                          </>
                        )}
                      </svg>
                    </span>
                    <span className={`status-icon cam ${isCamOn ? "on" : "off"}`} title={isCamOn ? "Camera On" : "Camera Off"}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {isCamOn ? (
                          <>
                            <path d="M23 7l-7 5 7 5V7z" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                          </>
                        ) : (
                          <>
                            <line x1="1" y1="1" x2="23" y2="23" />
                            <path d="M21 21l-4.15-4.15M23 7l-7 5v2.17l5.85 5.85L23 17V7z" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                          </>
                        )}
                      </svg>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="participants-footer">
            <span>Total Joined: <strong>{visibleParticipants.length}</strong></span>
          </div>
        </aside>
        {SettingsComponent && (
          <div
            className="lk-settings-menu-modal"
            style={{ display: widgetState.showSettings ? "block" : "none" }}
          >
            <SettingsComponent />
          </div>
        )}
      </LayoutContextProvider>
      <RoomAudioRenderer />
      <ConnectionStateToast />
    </div>
  );
}
