import {
  LiveKitRoom,
  type LocalUserChoices,
} from "@livekit/components-react";
import { useCallback, useState } from "react";
import type {
  MeetingSettings,
  MeetingSummary,
  MeetingTranslationSettings,
  RoomSessionResponse,
} from "@voice/shared";
import { Info, Users } from "@phosphor-icons/react";
import { VideoPresets, type DisconnectReason, type RoomOptions } from "livekit-client";
import { Brand } from "./Brand";
import { HostAdmissionPanel } from "./HostAdmissionPanel";
import { HostToolsPanel } from "./HostToolsPanel";
import { CustomVideoConference } from "./CustomVideoConference";
import { MeetingInfoPanel } from "./MeetingInfoPanel";

const roomOptions: RoomOptions = {
  // Rooms are limited to a few active cameras, so prefer the highest remote layer
  // instead of lowering quality based on tile dimensions.
  adaptiveStream: false,
  dynacast: true,
  videoCaptureDefaults: {
    // Browser media constraints treat this as the ideal target and fall back to
    // the camera's highest supported resolution when 1080p is unavailable.
    resolution: VideoPresets.h1080.resolution,
  },
  publishDefaults: {
    videoCodec: "vp8",
    simulcast: true,
    videoEncoding: {
      maxBitrate: VideoPresets.h1080.encoding.maxBitrate,
      maxFramerate: 30,
    },
    // Retain usable fallbacks without dropping a participant to a very blurry 180p tile.
    videoSimulcastLayers: [VideoPresets.h360, VideoPresets.h720],
  },
};

export interface MeetingRoomProps {
  meetingTitle: string;
  session: RoomSessionResponse;
  choices: LocalUserChoices;
  meetingId?: string;
  meeting?: MeetingSummary;
  initialHostSettings?: MeetingSettings;
  onLeave(reason?: DisconnectReason): void;
  onEndMeeting?(): Promise<void>;
}

export function MeetingRoom({ meetingTitle, session, choices, meetingId, meeting, initialHostSettings, onLeave, onEndMeeting }: MeetingRoomProps) {
  const [activeHostPanel, setActiveHostPanel] = useState<"info" | "waiting" | "tools" | null>(
    session.role === "host" && meeting ? "info" : null,
  );
  const [hostSettings, setHostSettings] = useState<MeetingSettings>(
    initialHostSettings ?? { isLocked: false, waitingRoomEnabled: true },
  );
  const [translationSettings, setTranslationSettings] = useState<MeetingTranslationSettings>(
    session.translation,
  );
  const [waitingCount, setWaitingCount] = useState(0);
  const [isEndingMeeting, setIsEndingMeeting] = useState(false);
  const [endMeetingError, setEndMeetingError] = useState("");
  const setWaitingRoom = useCallback((open: boolean) => setActiveHostPanel(open ? "waiting" : null), []);
  const setWaitingRoomCount = useCallback((count: number) => setWaitingCount(count), []);
  const closeHostPanel = useCallback(() => setActiveHostPanel(null), []);
  const endMeetingForEveryone = useCallback(async () => {
    if (!onEndMeeting || isEndingMeeting) return;
    setIsEndingMeeting(true);
    setEndMeetingError("");
    try {
      await onEndMeeting();
    } catch (caught) {
      setEndMeetingError(caught instanceof Error ? caught.message : "Could not end the meeting");
      setIsEndingMeeting(false);
    }
  }, [isEndingMeeting, onEndMeeting]);

  return (
    <main className="livekit-page" data-lk-theme="default">
      <header className="room-topbar">
        <Brand />
        <div className="room-heading">
          {session.role === "host" && meetingId && (
            <button
              className={`waiting-toggle room-header-waiting-toggle ${waitingCount ? "has-waiting" : ""}`}
              type="button"
              onClick={() => setActiveHostPanel((current) => current === "waiting" ? null : "waiting")}
              aria-expanded={activeHostPanel === "waiting"}
            >
              <Users size={16} weight="fill" />
              <span className="waiting-toggle-label">Waiting room</span>
              <span className="waiting-toggle-count">{waitingCount}</span>
            </button>
          )}
          {session.role === "host" && meeting && (
            <button
              className={`room-info-toggle ${activeHostPanel === "info" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveHostPanel((current) => current === "info" ? null : "info")}
              aria-expanded={activeHostPanel === "info"}
            >
              <Info size={17} weight="bold" /><span>Meeting info</span>
            </button>
          )}
          <strong>{meetingTitle}</strong>
          <span>{session.role === "host" ? "Host" : "Guest"}</span>
        </div>
      </header>
      <div className="meeting-room-stage">
        <LiveKitRoom
          serverUrl={session.serverUrl}
          token={session.participantToken}
          connect
          audio={choices.audioEnabled ? { deviceId: choices.audioDeviceId } : false}
          video={choices.videoEnabled ? {
            deviceId: choices.videoDeviceId,
            resolution: VideoPresets.h1080.resolution,
          } : false}
          options={roomOptions}
          onDisconnected={onLeave}
          onError={(error) => console.error("LiveKit room error", error)}
        >
          <CustomVideoConference
            meetingId={session.meetingId}
            participantRole={session.role}
            translationSettings={translationSettings}
            showHostTools={session.role === "host" && Boolean(meetingId)}
            isHostToolsOpen={activeHostPanel === "tools"}
            isHostPanelOpen={activeHostPanel !== null}
            onToggleHostTools={() => setActiveHostPanel((current) => current === "tools" ? null : "tools")}
            onCloseHostPanel={closeHostPanel}
            onEndMeeting={() => void endMeetingForEveryone()}
            isEndingMeeting={isEndingMeeting}
            endMeetingError={endMeetingError}
          />
        </LiveKitRoom>
        {session.role === "host" && meetingId && (
          <div className={`host-side-panel-slot ${activeHostPanel ? "open" : "closed"}`}>
            <HostAdmissionPanel
              meetingId={meetingId}
              open={activeHostPanel === "waiting"}
              onOpenChange={setWaitingRoom}
              onCountChange={setWaitingRoomCount}
            />
            <HostToolsPanel
              meetingId={meetingId}
              participantIdentity={session.participantIdentity}
              open={activeHostPanel === "tools"}
              settings={hostSettings}
              translationSettings={translationSettings}
              onOpenChange={(open) => setActiveHostPanel(open ? "tools" : null)}
              onSettingsChange={setHostSettings}
              onTranslationSettingsChange={setTranslationSettings}
            />
            {meeting && (
              <MeetingInfoPanel
                meeting={meeting}
                open={activeHostPanel === "info"}
                onOpenChange={(open) => setActiveHostPanel(open ? "info" : null)}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
