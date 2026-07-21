import {
  ArrowRight,
  CalendarBlank,
  CalendarDots,
  DotsThree,
  LinkSimple,
  ListDashes,
  Trash,
  VideoCamera,
  X,
} from "@phosphor-icons/react";
import type { MeetingSummary } from "@voice/shared";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Brand } from "../components/Brand";
import { createMeeting, deleteMeeting, getMyMeetings } from "../api";
import { useAuth } from "../auth/AuthContext";

function occursToday(meeting: MeetingSummary, now: Date) {
  if (!meeting.scheduledFor) return false;
  const scheduled = new Date(meeting.scheduledFor);
  return scheduled.getFullYear() === now.getFullYear()
    && scheduled.getMonth() === now.getMonth()
    && scheduled.getDate() === now.getDate();
}

// get meeting time for today's meetings
function meetingTime(meeting: MeetingSummary) {
  if (!meeting.scheduledFor) return "Available now";
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" })
    .format(new Date(meeting.scheduledFor));
}

function meetingDate(meeting: MeetingSummary) {
  if (!meeting.scheduledFor) return "Available now";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    weekday: "short",
  }).format(new Date(meeting.scheduledFor));
}

function parseJoinCode(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/join\/([^/?#]+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : "";
  } catch {
    const match = trimmed.match(/(?:^|\/join\/)([^/?#\s]+)$/);
    return match?.[1] ?? "";
  }
}

export function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [meetingError, setMeetingError] = useState("");
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinValue, setJoinValue] = useState("");
  const [joinError, setJoinError] = useState("");
  const [creatingInstant, setCreatingInstant] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    getMyMeetings()
      .then((response) => setMeetings(response.meetings))
      .catch((caught) => setMeetingError(caught instanceof Error ? caught.message : "Could not load your meetings"))
      .finally(() => setLoadingMeetings(false));
  }, []);

  const todayMeetings = useMemo(
    () => meetings
      .filter((meeting) => occursToday(meeting, now))
      .sort((left, right) => new Date(left.scheduledFor ?? 0).getTime() - new Date(right.scheduledFor ?? 0).getTime()),
    [meetings, now],
  );

  const submitJoin = (event: FormEvent) => {
    event.preventDefault();
    const joinCode = parseJoinCode(joinValue);
    if (!joinCode) {
      setJoinError("Paste a valid SyncoraXP invitation link or meeting code.");
      return;
    }
    navigate(`/join/${encodeURIComponent(joinCode)}`);
  };

  const startInstantMeeting = async () => {
    if (creatingInstant) return;
    setMeetingError("");
    setCreatingInstant(true);
    try {
      const response = await createMeeting({
        title: `${user?.name ?? "My"}'s SyncoraXP Meeting`,
        description: "Instant meeting",
        scheduledFor: null,
        invitees: [],
      });
      navigate(`/meetings/${response.meeting.id}/host`);
    } catch (caught) {
      setMeetingError(caught instanceof Error ? caught.message : "Could not start a new meeting");
      setCreatingInstant(false);
    }
  };

  const removeMeeting = async (meeting: MeetingSummary) => {
    const confirmed = window.confirm(
      `Delete “${meeting.title}”? Its guest invitation link will stop working. This cannot be undone.`,
    );
    if (!confirmed) return;
    setMeetingError("");
    setDeletingMeetingId(meeting.id);
    try {
      await deleteMeeting(meeting.id);
      setMeetings((current) => current.filter((item) => item.id !== meeting.id));
    } catch (caught) {
      setMeetingError(caught instanceof Error ? caught.message : "Could not delete the meeting");
    } finally {
      setDeletingMeetingId(null);
    }
  };

  return (
    <main className="site-shell dashboard-shell">
      <header className="topbar dashboard-topbar">
        <Brand />
        <div className="account-actions">
          <span className="step-pill">{user?.name}</span>
          <button className="text-button" type="button" onClick={() => void logout().then(() => navigate("/login"))}>
            Sign out
          </button>
        </div>
      </header>

      <section className="dashboard-main" aria-labelledby="dashboard-greeting">
        <div className="dashboard-clock">
          <p id="dashboard-greeting">Good {now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening"}, {user?.name?.split(" ")[0]}</p>
          <time dateTime={now.toISOString()}>{new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(now)}</time>
          <span>{new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(now)}</span>
        </div>

        <nav className="dashboard-actions" aria-label="Meeting actions">
          <button className="dashboard-action primary" type="button" disabled={creatingInstant} onClick={() => void startInstantMeeting()}>
            <span className="dashboard-action-icon"><VideoCamera size={27} weight="fill" /></span>
            <span><strong>{creatingInstant ? "Starting…" : "New meeting"}</strong><small>Start instantly</small></span>
          </button>
          <button className={`dashboard-action ${joinOpen ? "active" : ""}`} type="button" aria-expanded={joinOpen} onClick={() => { setJoinOpen((current) => !current); setJoinError(""); }}>
            <span className="dashboard-action-icon"><LinkSimple size={27} weight="bold" /></span>
            <span><strong>Join</strong><small>Use a meeting link</small></span>
          </button>
          <Link className="dashboard-action" to="/meetings/new?schedule=1">
            <span className="dashboard-action-icon"><CalendarDots size={27} weight="fill" /></span>
            <span><strong>Schedule</strong><small>Plan for later</small></span>
          </Link>
          <button className="dashboard-action" type="button" onClick={() => document.querySelector("#all-meetings")?.scrollIntoView({ behavior: "smooth" })}>
            <span className="dashboard-action-icon"><ListDashes size={27} weight="bold" /></span>
            <span><strong>My meetings</strong><small>Open or manage</small></span>
          </button>
        </nav>

        {joinOpen && (
          <form className="quick-join-card" onSubmit={submitJoin}>
            <div>
              <strong>Join a meeting</strong>
              <small>Paste the invitation link from your email or enter its meeting code.</small>
            </div>
            <div className="quick-join-fields">
              <input autoFocus aria-label="Invitation link or meeting code" value={joinValue} onChange={(event) => { setJoinValue(event.target.value); setJoinError(""); }} placeholder="Invitation link or meeting code" />
              <button className="button primary" type="submit">Continue <ArrowRight size={17} weight="bold" /></button>
              <button className="quick-join-close" type="button" aria-label="Close join form" onClick={() => setJoinOpen(false)}><X size={18} weight="bold" /></button>
            </div>
            {joinError && <p className="form-error" role="alert">{joinError}</p>}
          </form>
        )}

        <section className="agenda-card" aria-labelledby="today-heading">
          <div className="agenda-heading">
            <div>
              <p className="eyebrow">Your agenda</p>
              <h1 id="today-heading">Today</h1>
            </div>
            <span>{todayMeetings.length} {todayMeetings.length === 1 ? "meeting" : "meetings"}</span>
          </div>

          <div className="agenda-body">
            {loadingMeetings ? (
              <p className="dashboard-muted">Loading today’s meetings…</p>
            ) : todayMeetings.length ? (
              <div className="agenda-list">
                {todayMeetings.map((meeting) => (
                  <article className="agenda-row" key={meeting.id}>
                    <time>{meetingTime(meeting)}</time>
                    <span className="agenda-line" aria-hidden="true" />
                    <div><strong>{meeting.title}</strong><small>{meeting.description || "Hosted by you"}</small></div>
                    {meeting.status !== "ended" && (
                      <Link className="button agenda-open" to={`/meetings/${meeting.id}/host`}>Open room <ArrowRight size={16} weight="bold" /></Link>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="agenda-empty">
                <span><CalendarBlank size={42} weight="duotone" /></span>
                <strong>No meetings scheduled for today</strong>
                <small>Create a room now or schedule one for later.</small>
                <Link className="text-button" to="/meetings/new?schedule=1">Schedule a meeting <ArrowRight size={15} weight="bold" /></Link>
              </div>
            )}
          </div>
        </section>
      </section>

      <section className="my-meetings dashboard-meetings" id="all-meetings">
        <div className="dashboard-section-heading">
          <div><h2>My meetings</h2></div>
          <button className="button primary compact-button" type="button" disabled={creatingInstant} onClick={() => void startInstantMeeting()}>{creatingInstant ? "Starting…" : "New meeting"}</button>
        </div>
        {meetingError && <p className="form-error" role="alert">{meetingError}</p>}
        {!loadingMeetings && meetings.length === 0 ? (
          <div className="meetings-empty"><CalendarBlank size={28} weight="duotone" /><span>Your created meetings will appear here.</span></div>
        ) : (
          <div className="meeting-list-panel">
            <div className="meeting-list-toolbar">
              <div>
                <CalendarBlank size={18} weight="bold" />
                <strong>All meetings</strong>
              </div>
              <span>{meetings.length} {meetings.length === 1 ? "meeting" : "meetings"}</span>
            </div>
            <div className="meeting-list" role="list">
              {meetings.map((meeting) => (
                <article className="meeting-list-row" key={meeting.id} role="listitem">
                  <div className="meeting-list-content">
                    <div className="meeting-list-title-line">
                      {meeting.status === "ended"
                        ? <strong>{meeting.title}</strong>
                        : <Link to={`/meetings/${meeting.id}/host`}>{meeting.title}</Link>}
                      <span className={`meeting-status ${meeting.status}`}>{meeting.status}</span>
                    </div>
                    <span>{meetingDate(meeting)}</span>
                    <small>Host: {user?.name ?? meeting.organizerName}</small>
                  </div>
                  <div className="meeting-list-actions">
                    {meeting.status !== "ended" && (
                      <Link className="button meeting-list-open" to={`/meetings/${meeting.id}/host`}>
                        Open room <ArrowRight size={15} weight="bold" />
                      </Link>
                    )}
                    <button className="meeting-more-button" type="button" aria-label={`Delete ${meeting.title}`} title="Delete meeting" disabled={deletingMeetingId === meeting.id} onClick={() => void removeMeeting(meeting)}>
                      {deletingMeetingId === meeting.id ? <span className="meeting-action-progress">Deleting</span> : <><DotsThree size={22} weight="bold" /><Trash size={15} weight="bold" /></>}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
