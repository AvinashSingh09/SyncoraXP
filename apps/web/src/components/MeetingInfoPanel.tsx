import {
  CalendarDots,
  Check,
  Copy,
  EnvelopeSimple,
  LinkSimple,
  X,
} from "@phosphor-icons/react";
import type { MeetingSummary } from "@voice/shared";
import { useState } from "react";

interface MeetingInfoPanelProps {
  meeting: MeetingSummary;
  open: boolean;
  onOpenChange(open: boolean): void;
}

export function MeetingInfoPanel({ meeting, open, onOpenChange }: MeetingInfoPanelProps) {
  const [copied, setCopied] = useState<"link" | "invite" | null>(null);

  const displayJoinUrl = meeting.joinUrl
    ? `${window.location.origin}/join/${meeting.joinUrl.split("/join/").pop()}`
    : meeting.joinUrl;

  const copyText = async (kind: "link" | "invite") => {
    const text = kind === "link"
      ? displayJoinUrl
      : `${meeting.title}\nHosted by ${meeting.organizerName}\nJoin SyncoraXP: ${displayJoinUrl}`;
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2_000);
  };

  const emailHref = `mailto:?subject=${encodeURIComponent(`Join ${meeting.title} on SyncoraXP`)}&body=${encodeURIComponent(
    `${meeting.organizerName} invited you to a SyncoraXP meeting.\n\n${meeting.title}\n${meeting.scheduledFor ? new Date(meeting.scheduledFor).toLocaleString() : "Available now"}\n\nJoin meeting: ${displayJoinUrl}`,
  )}`;

  return (
    <div className={`meeting-info-control ${open ? "open" : "closed"}`}>
      {open && (
        <aside className="meeting-info-panel" aria-label="Meeting information">
          <div className="meeting-panel-heading">
            <strong>Meeting info</strong>
            <button type="button" aria-label="Close meeting information" onClick={() => onOpenChange(false)}><X size={19} weight="bold" /></button>
          </div>

          <div className="meeting-info-summary">
            <span className="meeting-info-icon"><LinkSimple size={24} weight="duotone" /></span>
            <div><small>Current meeting</small><h2>{meeting.title}</h2></div>
          </div>

          <section className="meeting-info-section">
            <div className="meeting-info-section-heading"><strong>Guest join link</strong><small>Anyone with this link can request access.</small></div>
            <div className="meeting-link-box"><span>{displayJoinUrl}</span></div>
            <button className="meeting-info-button primary" type="button" onClick={() => void copyText("link")}>
              {copied === "link" ? <Check size={18} weight="bold" /> : <Copy size={18} weight="bold" />}
              {copied === "link" ? "Link copied" : "Copy guest link"}
            </button>
            <button className="meeting-info-button" type="button" onClick={() => void copyText("invite")}>
              {copied === "invite" ? <Check size={18} weight="bold" /> : <Copy size={18} weight="bold" />}
              {copied === "invite" ? "Invitation copied" : "Copy invitation"}
            </button>
            <a className="meeting-info-button" href={emailHref}>
              <EnvelopeSimple size={18} weight="bold" /> Share by email
            </a>
          </section>

          <section className="meeting-info-section meeting-details-list">
            <div><span>Host</span><strong>{meeting.organizerName}</strong></div>
            <div><span>When</span><strong>{meeting.scheduledFor ? new Date(meeting.scheduledFor).toLocaleString() : "Available now"}</strong></div>
            <div><span>Meeting ID</span><strong>{meeting.id}</strong></div>
            {meeting.description && <div><span>Description</span><strong>{meeting.description}</strong></div>}
          </section>

          <div className="meeting-info-security-note">
            <CalendarDots size={20} weight="duotone" />
            <span>Guests remain in the waiting room until you admit them.</span>
          </div>
        </aside>
      )}
    </div>
  );
}
