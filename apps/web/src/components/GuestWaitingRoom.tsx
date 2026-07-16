import type { AdmissionStatus } from "@voice/shared";
import { Brand } from "./Brand";

interface GuestWaitingRoomProps {
  meetingTitle: string;
  displayName: string;
  status: AdmissionStatus;
  error: string;
  onCancel(): void;
}

export function GuestWaitingRoom({
  meetingTitle,
  displayName,
  status,
  error,
  onCancel,
}: GuestWaitingRoomProps) {
  const denied = status === "denied";
  return (
    <main className="site-shell waiting-room-page">
      <header className="topbar"><Brand /><span className="step-pill">Waiting room</span></header>
      <section className="waiting-room-card">
        <div className={`waiting-orb ${denied ? "denied" : ""}`} aria-hidden="true">
          {denied ? "×" : <span />}
        </div>
        <p className="eyebrow">{denied ? "Request declined" : "Waiting for the host"}</p>
        <h1>{meetingTitle}</h1>
        <p className="lead compact">
          {denied
            ? "The host did not admit this request. You can return to pre-join and request access again."
            : `${displayName}, the host has been notified. You will enter automatically when admitted.`}
        </p>
        {!denied && (
          <div className="waiting-note">
            <span className="waiting-pulse" />
            Keep this page open. Your camera and microphone will start only after admission.
          </div>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button ghost" type="button" onClick={onCancel}>
          {denied ? "Back to pre-join" : "Cancel request"}
        </button>
      </section>
    </main>
  );
}
