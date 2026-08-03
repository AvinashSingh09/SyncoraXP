import {
  ArrowLeft,
  CalendarDots,
  CheckCircle,
  ClosedCaptioning,
  FileText,
  GlobeHemisphereWest,
  Microphone,
  Monitor,
  Users,
  VideoCamera,
  X,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  TRANSLATION_LANGUAGES,
  formatTimeZoneOption,
  zonedDateTimeToIso,
  type CreateMeetingResponse,
  type TranslationLanguageCode,
} from "@voice/shared";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Brand } from "../components/Brand";
import { createMeeting } from "../api";
import { useAuth } from "../auth/AuthContext";

interface InviteeField {
  email: string;
  name: string;
}

const emptyInvitee = (): InviteeField => ({ email: "", name: "" });

function browserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

const TIME_ZONE_OPTIONS = Array.from(
  new Set([browserTimeZone(), ...Intl.supportedValuesOf("timeZone")]),
)
  .filter((timeZone) => timeZone !== "UTC")
  .map((timeZone) => formatTimeZoneOption(timeZone))
  .sort(
    (left, right) =>
      left.offsetMinutes - right.offsetMinutes || left.label.localeCompare(right.label),
  );

function SettingToggle({
  checked,
  description,
  icon,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  icon: ReactNode;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      className="meeting-setting"
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="meeting-setting-icon">{icon}</span>
      <span className="meeting-setting-copy">
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <span className={`meeting-switch${checked ? " is-on" : ""}`} aria-hidden="true"><i /></span>
    </button>
  );
}

interface CreateMeetingPageProps {
  modal?: boolean;
  onClose?: () => void;
  onCreated?: (response: CreateMeetingResponse) => void;
  scheduling?: boolean;
}

export function CreateMeetingPage({
  modal = false,
  onClose,
  onCreated,
  scheduling,
}: CreateMeetingPageProps = {}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isScheduling = scheduling ?? searchParams.get("schedule") === "1";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [timeZone, setTimeZone] = useState(browserTimeZone);
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(true);
  const [allowGuestCamera, setAllowGuestCamera] = useState(true);
  const [allowGuestMicrophone, setAllowGuestMicrophone] = useState(true);
  const [allowGuestScreenShare, setAllowGuestScreenShare] = useState(false);
  const [transcriptionEnabled, setTranscriptionEnabled] = useState(false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [interpretationEnabled, setInterpretationEnabled] = useState(false);
  const [interpretationLanguages, setInterpretationLanguages] = useState<
    TranslationLanguageCode[]
  >(TRANSLATION_LANGUAGES.map((language) => language.code));
  const [invitees, setInvitees] = useState<InviteeField[]>([emptyInvitee()]);
  const [result, setResult] = useState<CreateMeetingResponse | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!modal) return;
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose?.();
      if (event.key !== "Tab") return;
      const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)',
      ) ?? [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      previouslyFocused?.focus();
    };
  }, [isSubmitting, modal, onClose]);

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
        scheduledFor: scheduledFor ? zonedDateTimeToIso(scheduledFor, timeZone) : null,
        timeZone,
        settings: {
          waitingRoomEnabled,
          allowGuestCamera,
          allowGuestMicrophone,
          allowGuestScreenShare,
          transcriptionEnabled,
          subtitlesEnabled,
          interpretationEnabled,
          interpretationProvider: "gemini",
          interpretationLanguages,
        },
        invitees: invitees.filter((invitee) => invitee.email.trim()),
      });
      setResult(response);
      onCreated?.(response);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the meeting");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayJoinUrl = result?.meeting.joinUrl
    ? `${window.location.origin}/join/${result.meeting.joinUrl.split("/join/").pop()}`
    : result?.meeting.joinUrl || "";
  const displayScheduledTime = result?.meeting.scheduledFor
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: result.meeting.timeZone,
      }).format(new Date(result.meeting.scheduledFor))
    : "";

  const copyLink = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(displayJoinUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2_000);
  };

  const meetingForm = (
    <form className={`meeting-form${modal ? " schedule-modal-form" : ""}`} onSubmit={submit}>
      {!modal && <div className="form-heading"><span>{isScheduling ? "Schedule meeting" : "New meeting"}</span><small>All fields marked * are required</small></div>}
      <label>Meeting title *<input autoFocus={modal} required minLength={3} maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Quarterly product seminar" /></label>
      <label><span className="field-label">Description <small className="optional-label">Optional</small></span><textarea maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add a short note for your guests" rows={2} /></label>
      <div className="signed-in-host"><span>Meeting host</span><strong>{user?.name}</strong><small>{user?.email}</small></div>
      <div className="field-grid">
        <label>Date and time {isScheduling ? "*" : ""}<input required={isScheduling} type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} /></label>
        <label>Time zone
          <select value={timeZone} onChange={(event) => setTimeZone(event.target.value)}>
            {TIME_ZONE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <details className="meeting-advanced" open={!modal}>
        <summary>
          <span>Meeting options</span>
          <small>Transcription, subtitles, interpretation, and guest access</small>
        </summary>
        <div className="meeting-settings-section">
          <div className="meeting-settings-heading">
            <span>Language tools</span>
            <small>Choose what is available when the host joins.</small>
          </div>
          <div className="meeting-settings-grid">
            <SettingToggle
              checked={transcriptionEnabled}
              onChange={setTranscriptionEnabled}
              icon={<FileText size={19} />}
              label="Meeting transcription"
              description="Save finalized speech as a meeting transcript."
            />
            <SettingToggle
              checked={subtitlesEnabled}
              onChange={setSubtitlesEnabled}
              icon={<ClosedCaptioning size={19} />}
              label="Live subtitles"
              description="Show real-time source-language captions."
            />
            <SettingToggle
              checked={interpretationEnabled}
              onChange={setInterpretationEnabled}
              icon={<GlobeHemisphereWest size={19} />}
              label="Live interpretation"
              description="Let guests listen in their preferred language."
            />
          </div>
          {interpretationEnabled && (
            <div className="interpretation-options">
              <fieldset>
                <legend>Available languages</legend>
                <div className="language-options">
                  {TRANSLATION_LANGUAGES.map((language) => {
                    const selected = interpretationLanguages.includes(language.code);
                    return (
                      <label className={`language-option${selected ? " is-selected" : ""}`} key={language.code}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => setInterpretationLanguages((current) =>
                            selected
                              ? current.length === 1
                                ? current
                                : current.filter((code) => code !== language.code)
                              : [...current, language.code]
                          )}
                        />
                        <span>{language.label}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          )}
        </div>
        <div className="meeting-settings-section">
          <div className="meeting-settings-heading">
            <span>Guest access</span>
            <small>These defaults apply to everyone joining as a guest.</small>
          </div>
          <div className="meeting-settings-grid">
            <SettingToggle checked={waitingRoomEnabled} onChange={setWaitingRoomEnabled} icon={<Users size={19} />} label="Waiting room" description="Admit guests before they enter." />
            <SettingToggle checked={allowGuestCamera} onChange={setAllowGuestCamera} icon={<VideoCamera size={19} />} label="Camera access" description="Allow guests to turn on video." />
            <SettingToggle checked={allowGuestMicrophone} onChange={setAllowGuestMicrophone} icon={<Microphone size={19} />} label="Microphone access" description="Allow guests to unmute." />
            <SettingToggle checked={allowGuestScreenShare} onChange={setAllowGuestScreenShare} icon={<Monitor size={19} />} label="Screen sharing" description="Allow guests to present their screen." />
          </div>
        </div>
      </details>

      <details className="invite-section" open={!modal}>
        <summary><span>Invite people</span><small>Optional · up to 50 recipients</small></summary>
        <div className="invite-section-body">
          {invitees.map((invitee, index) => (
            <div className="invite-row" key={index}>
              <input aria-label={`Invitee ${index + 1} name`} value={invitee.name} onChange={(event) => updateInvitee(index, "name", event.target.value)} placeholder="Name" />
              <input aria-label={`Invitee ${index + 1} email`} type="email" value={invitee.email} onChange={(event) => updateInvitee(index, "email", event.target.value)} placeholder="guest@company.com" />
              {invitees.length > 1 && <button className="icon-button" type="button" aria-label={`Remove invitee ${index + 1}`} onClick={() => setInvitees((current) => current.filter((_, itemIndex) => itemIndex !== index))}>×</button>}
            </div>
          ))}
          {invitees.length < 50 && <button className="text-button" type="button" onClick={() => setInvitees((current) => [...current, emptyInvitee()])}>+ Add another person</button>}
        </div>
      </details>

      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button primary submit-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? (isScheduling ? "Scheduling meeting…" : "Creating meeting…") : (isScheduling ? "Schedule meeting" : "Create meeting")}
      </button>
      <p className="privacy-note">Invitation addresses are used only to deliver this meeting link.</p>
    </form>
  );

  if (result && modal) {
    return (
      <div className="schedule-modal-backdrop" onMouseDown={(event) => event.currentTarget === event.target && onClose?.()}>
        <section ref={dialogRef} className="schedule-modal" role="dialog" aria-modal="true" aria-labelledby="schedule-modal-title">
          <header className="schedule-modal-header">
            <div><CheckCircle size={24} weight="fill" /><span><strong id="schedule-modal-title">Meeting scheduled</strong><small>Your meeting is ready to share.</small></span></div>
            <button type="button" onClick={onClose} aria-label="Close meeting setup"><X size={19} weight="bold" /></button>
          </header>
          <div className="schedule-modal-success">
            <p className="eyebrow">Your meeting is ready</p>
            <h2>{result.meeting.title}</h2>
            <p>Share this private link with anyone you want in the room.</p>
            {displayScheduledTime && <p className="scheduled-confirmation-time">{displayScheduledTime} · {result.meeting.timeZone.replaceAll("_", " ")}</p>}
            <div className="share-card">
              <span>{displayJoinUrl}</span>
              <button className="button primary" type="button" onClick={copyLink}>{copied ? "Copied" : "Copy link"}</button>
            </div>
            <div className="schedule-modal-actions">
              <button className="button ghost" type="button" onClick={() => setResult(null)}>Schedule another</button>
              <Link className="button primary button-link" to={`/meetings/${result.meeting.id}/host`}>Open host controls</Link>
              <button className="button ghost" type="button" onClick={onClose}>Done</button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (result) {
    return (
      <main className="site-shell">
        <header className="topbar"><Brand /><Link className="text-button back-home-link" to="/webinar-service/meetings"><ArrowLeft size={16} weight="bold" /> Back to meetings</Link></header>
        <section className="success-layout">
          <div className="success-orb" aria-hidden="true">✓</div>
          <p className="eyebrow">Your meeting is ready</p>
          <h1>{result.meeting.title}</h1>
          <p className="lead compact">Share this private link with anyone you want in the room.</p>
          {displayScheduledTime && <p className="scheduled-confirmation-time">{displayScheduledTime} · {result.meeting.timeZone.replaceAll("_", " ")}</p>}
          <div className="share-card">
            <span>{displayJoinUrl}</span>
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
          <div className="success-actions">
            <button className="button ghost" type="button" onClick={() => setResult(null)}>Create another meeting</button>
            <Link className="button ghost button-link" to="/webinar-service/meetings">Return to meetings</Link>
          </div>
        </section>
      </main>
    );
  }

  if (modal) {
    return (
      <div className="schedule-modal-backdrop" onMouseDown={(event) => event.currentTarget === event.target && !isSubmitting && onClose?.()}>
        <section ref={dialogRef} className="schedule-modal" role="dialog" aria-modal="true" aria-labelledby="schedule-modal-title">
          <header className="schedule-modal-header">
            <div><CalendarDots size={22} weight="fill" /><span><strong id="schedule-modal-title">Schedule a meeting</strong><small>Add the essentials, then adjust options if needed.</small></span></div>
            <button type="button" disabled={isSubmitting} onClick={onClose} aria-label="Close meeting setup"><X size={19} weight="bold" /></button>
          </header>
          <div className="schedule-modal-body">{meetingForm}</div>
        </section>
      </div>
    );
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <Brand />
        <div className="account-actions"><span className="step-pill">{user?.name}</span><button className="text-button" type="button" onClick={() => void logout().then(() => navigate("/login"))}>Sign out</button></div>
      </header>
      <Link className="text-button back-home-link create-back-link" to="/webinar-service/meetings"><ArrowLeft size={16} weight="bold" /> Back to meetings</Link>
      <div className="create-layout">
        <section className="hero-copy">
          <p className="eyebrow">{isScheduling ? "Plan your next conversation" : "Meet without language barriers"}</p>
          <h1>{isScheduling ? "Make time for everyone." : "Bring everyone into the conversation."}</h1>
          <p className="lead">{isScheduling ? "Choose a time, invite your audience, and give everyone one secure place to meet." : "Create a room, invite your audience, and prepare a shared place for your next meeting or seminar."}</p>
          <div className="promise-list">
            <span><b>01</b> Create one secure meeting link</span>
            <span><b>02</b> Send individual email invitations</span>
            <span><b>03</b> Welcome guests in a calm pre-join space</span>
          </div>
        </section>

        {meetingForm}
      </div>
    </main>
  );
}
