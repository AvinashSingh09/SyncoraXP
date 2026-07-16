import { useEffect, useState, type FormEvent } from "react";
import type { CreateMeetingResponse, MeetingSummary } from "@voice/shared";
import { Link, useNavigate } from "react-router-dom";
import { Brand } from "../components/Brand";
import { createMeeting, deleteMeeting, getMyMeetings } from "../api";
import { useAuth } from "../auth/AuthContext";

interface InviteeField {
  email: string;
  name: string;
}

const emptyInvitee = (): InviteeField => ({ email: "", name: "" });

export function CreateMeetingPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [invitees, setInvitees] = useState<InviteeField[]>([emptyInvitee()]);
  const [result, setResult] = useState<CreateMeetingResponse | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    getMyMeetings().then((response) => setMeetings(response.meetings)).catch(() => undefined);
  }, []);

  const updateInvitee = (index: number, key: keyof InviteeField, value: string) => {
    setInvitees((current) =>
      current.map((invitee, inviteeIndex) =>
        inviteeIndex === index ? { ...invitee, [key]: value } : invitee,
      ),
    );
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await createMeeting({
        title,
        description,
        scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
        invitees: invitees.filter((invitee) => invitee.email.trim()),
      });
      setResult(response);
      setMeetings((current) => [response.meeting, ...current]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the meeting");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.meeting.joinUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2_000);
  };

  const removeMeeting = async (meeting: MeetingSummary) => {
    const confirmed = window.confirm(
      `Delete “${meeting.title}”? Its guest invitation link will stop working. This cannot be undone.`,
    );
    if (!confirmed) return;
    setDeleteError("");
    setDeletingMeetingId(meeting.id);
    try {
      await deleteMeeting(meeting.id);
      setMeetings((current) => current.filter((item) => item.id !== meeting.id));
    } catch (caught) {
      setDeleteError(caught instanceof Error ? caught.message : "Could not delete the meeting");
    } finally {
      setDeletingMeetingId(null);
    }
  };

  if (result) {
    return (
      <main className="site-shell">
        <header className="topbar"><Brand /><span className="step-pill">Host: {user?.name}</span></header>
        <section className="success-layout">
          <div className="success-orb" aria-hidden="true">✓</div>
          <p className="eyebrow">Your meeting is ready</p>
          <h1>{result.meeting.title}</h1>
          <p className="lead compact">Share this private link with anyone you want in the room.</p>
          <div className="share-card">
            <span>{result.meeting.joinUrl}</span>
            <button className="button primary" type="button" onClick={copyLink}>
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <Link className="button primary host-join-button" to={`/meetings/${result.meeting.id}/host`}>
            Join as host
          </Link>
          {result.invitations.length > 0 && (
            <div className="delivery-list">
              <h2>Invitations</h2>
              {result.invitations.map((invitation) => (
                <div className="delivery-row" key={invitation.id}>
                  <span className={`status-dot ${invitation.status}`} />
                  <span><strong>{invitation.name || invitation.email}</strong><small>{invitation.email}</small></span>
                  <span className="delivery-status">{invitation.status}</span>
                </div>
              ))}
            </div>
          )}
          <button className="button ghost" type="button" onClick={() => setResult(null)}>
            Create another meeting
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <Brand />
        <div className="account-actions"><span className="step-pill">{user?.name}</span><button className="text-button" type="button" onClick={() => void logout().then(() => navigate("/login"))}>Sign out</button></div>
      </header>
      <div className="create-layout">
        <section className="hero-copy">
          <p className="eyebrow">Meet without language barriers</p>
          <h1>Bring everyone into the conversation.</h1>
          <p className="lead">Create a room, invite your audience, and prepare a shared place for your next meeting or seminar.</p>
          <div className="promise-list">
            <span><b>01</b> Create one secure meeting link</span>
            <span><b>02</b> Send individual email invitations</span>
            <span><b>03</b> Welcome guests in a calm pre-join space</span>
          </div>
        </section>

        <form className="meeting-form" onSubmit={submit}>
          <div className="form-heading"><span>New meeting</span><small>All fields marked * are required</small></div>
          <label>Meeting title *<input required minLength={3} maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Quarterly product seminar" /></label>
          <label>Description<textarea maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add a short note for your guests" rows={3} /></label>
          <div className="signed-in-host"><span>Meeting host</span><strong>{user?.name}</strong><small>{user?.email}</small></div>
          <label>Date and time<input type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} /></label>

          <div className="invite-heading"><span>Invite people</span><small>Optional · up to 50 recipients</small></div>
          {invitees.map((invitee, index) => (
            <div className="invite-row" key={index}>
              <input aria-label={`Invitee ${index + 1} name`} value={invitee.name} onChange={(event) => updateInvitee(index, "name", event.target.value)} placeholder="Name" />
              <input aria-label={`Invitee ${index + 1} email`} type="email" value={invitee.email} onChange={(event) => updateInvitee(index, "email", event.target.value)} placeholder="guest@company.com" />
              {invitees.length > 1 && <button className="icon-button" type="button" aria-label={`Remove invitee ${index + 1}`} onClick={() => setInvitees((current) => current.filter((_, itemIndex) => itemIndex !== index))}>×</button>}
            </div>
          ))}
          {invitees.length < 50 && <button className="text-button" type="button" onClick={() => setInvitees((current) => [...current, emptyInvitee()])}>+ Add another person</button>}

          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button primary submit-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating meeting…" : "Create meeting"}
          </button>
          <p className="privacy-note">Invitation addresses are used only to deliver this meeting link.</p>
        </form>
      </div>
      {meetings.length > 0 && (
        <section className="my-meetings">
          <div><p className="eyebrow">Host dashboard</p><h2>Your meetings</h2></div>
          {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
          <div className="meeting-grid">
            {meetings.map((meeting) => (
              <article className="meeting-card" key={meeting.id}>
                <span className="step-pill">{meeting.status}</span>
                <h3>{meeting.title}</h3>
                <p>{meeting.scheduledFor ? new Date(meeting.scheduledFor).toLocaleString() : "Available now"}</p>
                <div className="meeting-card-actions">
                  <Link className="text-button" to={`/meetings/${meeting.id}/host`}>Open host room →</Link>
                  <button
                    className="text-button danger"
                    type="button"
                    disabled={deletingMeetingId === meeting.id}
                    onClick={() => void removeMeeting(meeting)}
                  >
                    {deletingMeetingId === meeting.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
