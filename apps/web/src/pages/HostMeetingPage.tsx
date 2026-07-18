import { useEffect, useState } from "react";
import type { HostMeetingResponse, RoomSessionResponse } from "@voice/shared";
import type { LocalUserChoices } from "@livekit/components-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createHostRoomSession, endMeeting, getHostMeeting } from "../api";
import { useAuth } from "../auth/AuthContext";
import { MeetingRoom } from "../components/MeetingRoom";
import { RoomPreJoin } from "../components/RoomPreJoin";
import { Brand } from "../components/Brand";

export function HostMeetingPage() {
  const { meetingId = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [result, setResult] = useState<HostMeetingResponse | null>(null);
  const [session, setSession] = useState<RoomSessionResponse | null>(null);
  const [choices, setChoices] = useState<LocalUserChoices | null>(null);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    getHostMeeting(meetingId).then(setResult).catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Meeting not found");
    });
  }, [meetingId]);

  const join = async (selectedChoices: LocalUserChoices) => {
    setError("");
    setJoining(true);
    try {
      setChoices(selectedChoices);
      setSession(await createHostRoomSession(meetingId));
    } catch (caught) {
      setChoices(null);
      setError(caught instanceof Error ? caught.message : "Could not enter the room");
    } finally {
      setJoining(false);
    }
  };

  if (result && session && choices) {
    return (
      <MeetingRoom
        meetingTitle={result.meeting.title}
        session={session}
        choices={choices}
        meetingId={result.meeting.id}
        meeting={result.meeting}
        initialHostSettings={result.settings}
        onLeave={() => navigate("/webinar-service", { replace: true })}
        onEndMeeting={async () => {
          await endMeeting(meetingId);
          navigate("/webinar-service", { replace: true });
        }}
      />
    );
  }

  if (result) {
    return (
      <RoomPreJoin
        title={result.meeting.title}
        subtitle={`Signed in as ${user?.name}. Check your camera and microphone before entering.`}
        defaultName={user?.name ?? result.meeting.organizerName}
        joining={joining}
        error={error}
        role="host"
        onSubmit={(selectedChoices) => void join(selectedChoices)}
      />
    );
  }

  return (
    <main className="site-shell">
      <header className="topbar"><Brand /><span className="step-pill">Host access</span></header>
      <section className="host-room-card">
        {error ? (
          <><p className="eyebrow">Unavailable</p><h1>{error}</h1><Link className="button ghost inline-button" to="/webinar-service">Back to meetings</Link></>
        ) : <p>Verifying host access...</p>}
      </section>
    </main>
  );
}
