import {
  LiveKitRoom,
  type LocalUserChoices,
} from "@livekit/components-react";
import { useCallback, useState } from "react";
import type { RoomSessionResponse } from "@voice/shared";
import { VideoPresets, type RoomOptions } from "livekit-client";
import { Brand } from "./Brand";
import { HostAdmissionPanel } from "./HostAdmissionPanel";
import { CustomVideoConference } from "./CustomVideoConference";

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
  onLeave(): void;
}

export function MeetingRoom({ meetingTitle, session, choices, meetingId, onLeave }: MeetingRoomProps) {
  const [waitingRoomOpen, setWaitingRoomOpen] = useState(false);
  const [waitingCount, setWaitingCount] = useState(0);
  const setWaitingRoom = useCallback((open: boolean) => setWaitingRoomOpen(open), []);
  const setWaitingRoomCount = useCallback((count: number) => setWaitingCount(count), []);

  return (
    <main className="livekit-page" data-lk-theme="default">
      <header className="room-topbar">
        <Brand />
        <div className="room-heading">
          {session.role === "host" && meetingId && (
            <button
              className={`waiting-toggle room-header-waiting-toggle ${waitingCount ? "has-waiting" : ""}`}
              type="button"
              onClick={() => setWaitingRoomOpen((current) => !current)}
              aria-expanded={waitingRoomOpen}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15">
                <path d="M16 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM8.5 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.5 1c-3.3 0-6 1.9-6 4.25V20h12v-2.75C22 14.9 19.3 13 16 13ZM8.5 14C4.9 14 2 16 2 18.5V20h6v-2.75c0-1.18.48-2.25 1.3-3.14A8.9 8.9 0 0 0 8.5 14Z" fill="currentColor" />
              </svg>
              <span className="waiting-toggle-label">Waiting room</span>
              <span className="waiting-toggle-count">{waitingCount}</span>
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
            isWaitingRoomOpen={waitingRoomOpen}
            onCloseWaitingRoom={() => setWaitingRoomOpen(false)}
          />
        </LiveKitRoom>
        {session.role === "host" && meetingId && (
          <HostAdmissionPanel
            meetingId={meetingId}
            open={waitingRoomOpen}
            onOpenChange={setWaitingRoom}
            onCountChange={setWaitingRoomCount}
          />
        )}
      </div>
    </main>
  );
}
