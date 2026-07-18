import { useEffect, useState } from "react";
import type { GuestAdmissionResponse, PublicMeetingResponse, RoomSessionResponse } from "@voice/shared";
import type { LocalUserChoices } from "@livekit/components-react";
import { DisconnectReason } from "livekit-client";
import { useParams } from "react-router-dom";
import {
  createGuestRoomSession,
  getGuestAdmissionStatus,
  getPublicMeeting,
  requestGuestAdmission,
} from "../api";
import { Brand } from "../components/Brand";
import { GuestWaitingRoom } from "../components/GuestWaitingRoom";
import { MeetingRoom } from "../components/MeetingRoom";
import { RoomPreJoin } from "../components/RoomPreJoin";

export function JoinMeetingPage() {
  const { joinCode = "" } = useParams();
  const [meeting, setMeeting] = useState<PublicMeetingResponse["meeting"] | null>(null);
  const [session, setSession] = useState<RoomSessionResponse | null>(null);
  const [choices, setChoices] = useState<LocalUserChoices | null>(null);
  const [admission, setAdmission] = useState<GuestAdmissionResponse | null>(null);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let active = true;
    getPublicMeeting(joinCode)
      .then((response) => active && setMeeting(response.meeting))
      .catch((caught) => active && setError(caught instanceof Error ? caught.message : "Meeting not found"));
    return () => { active = false; };
  }, [joinCode]);

  const requestAccess = async (selectedChoices: LocalUserChoices) => {
    setError("");
    setJoining(true);
    try {
      setChoices(selectedChoices);
      setAdmission(await requestGuestAdmission(joinCode, selectedChoices.username));
    } catch (caught) {
      setChoices(null);
      setError(caught instanceof Error ? caught.message : "Could not request access");
    } finally {
      setJoining(false);
    }
  };

  useEffect(() => {
    if (!admission || !choices || admission.status === "denied" || session) return;
    let active = true;
    let timer: number | undefined;
    let connecting = false;
    const check = async () => {
      try {
        const response = await getGuestAdmissionStatus(
          joinCode,
          admission.admissionId,
          admission.admissionToken,
        );
        if (!active) return;
        setAdmission((current) => current ? { ...current, status: response.status } : current);
        if (response.status === "denied") return;
        if (response.status === "admitted" && !connecting) {
          connecting = true;
          setJoining(true);
          const roomSession = await createGuestRoomSession(
            joinCode,
            admission.admissionId,
            admission.admissionToken,
          );
          if (active) setSession(roomSession);
          return;
        }
        timer = window.setTimeout(check, 2_000);
      } catch (caught) {
        if (!active) return;
        connecting = false;
        setJoining(false);
        setError(caught instanceof Error ? caught.message : "Could not check the waiting room");
        timer = window.setTimeout(check, 3_000);
      }
    };
    void check();
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [admission?.admissionId, admission?.admissionToken, choices, joinCode, session]);

  const resetToPreJoin = () => {
    setSession(null);
    setAdmission(null);
    setChoices(null);
    setJoining(false);
    setError("");
  };

  const leaveMeeting = (reason?: DisconnectReason) => {
    resetToPreJoin();
    if (reason === DisconnectReason.ROOM_DELETED) {
      setError("The host ended this meeting.");
    }
  };

  if (meeting && session && choices) {
    return (
      <MeetingRoom
        meetingTitle={meeting.title}
        session={session}
        choices={choices}
        onLeave={leaveMeeting}
      />
    );
  }

  if (meeting && admission && choices) {
    return (
      <GuestWaitingRoom
        meetingTitle={meeting.title}
        displayName={choices.username}
        status={admission.status}
        error={error}
        onCancel={resetToPreJoin}
      />
    );
  }

  if (meeting) {
    return (
      <RoomPreJoin
        title={meeting.title}
        subtitle={`Hosted by ${meeting.organizerName}${meeting.scheduledFor ? ` - ${new Date(meeting.scheduledFor).toLocaleString()}` : ""}. Check your devices before joining.`}
        defaultName=""
        joining={joining}
        error={error}
        role="guest"
        onSubmit={(selectedChoices) => void requestAccess(selectedChoices)}
      />
    );
  }

  return (
    <main className="site-shell">
      <header className="topbar"><Brand /><span className="step-pill">Pre-join</span></header>
      <div className="empty-state">
        {error ? <><p className="eyebrow">Link unavailable</p><h1>We could not find this meeting.</h1><p>{error}</p></> : <div className="loading-card">Preparing your meeting...</div>}
      </div>
    </main>
  );
}
