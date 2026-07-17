import { RoomEvent, Track } from "livekit-client";
import * as React from "react";
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
  isTrackReference,
} from "@livekit/components-react";

export interface CustomVideoConferenceProps extends React.HTMLAttributes<HTMLDivElement> {
  chatMessageFormatter?: MessageFormatter;
  chatMessageEncoder?: MessageEncoder;
  chatMessageDecoder?: MessageDecoder;
  SettingsComponent?: React.ComponentType;
  isWaitingRoomOpen?: boolean;
  onCloseWaitingRoom?: () => void;
}

function isEqualTrackRef(a?: TrackReferenceOrPlaceholder, b?: TrackReferenceOrPlaceholder): boolean {
  if (!a || !b) return a === b;
  return (
    a.participant.identity === b.participant.identity &&
    a.source === b.source &&
    a.publication?.trackSid === b.publication?.trackSid
  );
}

export function CustomVideoConference({
  chatMessageFormatter,
  chatMessageDecoder,
  chatMessageEncoder,
  SettingsComponent,
  isWaitingRoomOpen,
  onCloseWaitingRoom,
  ...props
}: CustomVideoConferenceProps) {
  const [widgetState, setWidgetState] = React.useState<WidgetState>({
    showChat: false,
    unreadMessages: 0,
    showSettings: false,
  });

  const [showParticipants, setShowParticipants] = React.useState(false);
  const participants = useParticipants();

  const lastAutoFocusedScreenShareTrack = React.useRef<TrackReferenceOrPlaceholder | null>(null);

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false }
  );

  const widgetUpdate = (state: WidgetState) => {
    setWidgetState(state);
    if (state.showChat) {
      setShowParticipants(false);
      onCloseWaitingRoom?.();
    }
  };

  const layoutContext = useCreateLayoutContext();

  const screenShareTracks: TrackReference[] = tracks
    .filter(isTrackReference)
    .filter((track) => track.publication.source === Track.Source.ScreenShare);

  const focusTrack = usePinnedTracks(layoutContext)?.[0];
  const carouselTracks = tracks.filter((track) => !isEqualTrackRef(track, focusTrack));

  // When waiting room opens externally, close chat and participants
  React.useEffect(() => {
    if (isWaitingRoomOpen) {
      setShowParticipants(false);
      layoutContext.widget.dispatch?.({ msg: "hide_chat" });
    }
  }, [isWaitingRoomOpen, layoutContext.widget]);

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
        onCloseWaitingRoom?.();
      }
      return next;
    });
  }, [layoutContext.widget, onCloseWaitingRoom]);

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
            <ControlBar controls={{ chat: true, settings: !!SettingsComponent }} />
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
                <span className="participants-count-badge">{participants.length}</span>
                <svg className={`chevron-icon ${showParticipants ? "open" : ""}`} viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </div>
              <span className="participants-toggle-label">Participants</span>
            </button>
          </div>
        </div>
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
              <span className="participants-total-badge">{participants.length}</span>
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
            {participants.map((p) => {
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
            <span>Total Joined: <strong>{participants.length}</strong></span>
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
