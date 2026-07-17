import { useEffect, useRef, useState } from "react";
import type { HostAdmissionRequest } from "@voice/shared";
import { X } from "@phosphor-icons/react";
import { decideAdmission, getPendingAdmissions } from "../api";

interface HostAdmissionPanelProps {
  meetingId: string;
  open: boolean;
  onOpenChange(open: boolean): void;
  onCountChange(count: number): void;
}

export function HostAdmissionPanel({
  meetingId,
  open,
  onOpenChange,
  onCountChange,
}: HostAdmissionPanelProps) {
  const [requests, setRequests] = useState<HostAdmissionRequest[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const previousCount = useRef(0);

  useEffect(() => {
    let active = true;
    let timer: number | undefined;
    const poll = async () => {
      try {
        const response = await getPendingAdmissions(meetingId);
        if (!active) return;
        setRequests(response.requests);
        onCountChange(response.requests.length);
        setError("");
        if (response.requests.length > previousCount.current) onOpenChange(true);
        previousCount.current = response.requests.length;
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Could not refresh the waiting room");
      } finally {
        if (active) timer = window.setTimeout(poll, 2_000);
      }
    };
    void poll();
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [meetingId, onCountChange, onOpenChange]);

  const decide = async (request: HostAdmissionRequest, decision: "admitted" | "denied") => {
    setBusyId(request.id);
    setError("");
    try {
      await decideAdmission(meetingId, request.id, decision);
      setRequests((current) => current.filter((item) => item.id !== request.id));
      previousCount.current = Math.max(0, previousCount.current - 1);
      onCountChange(previousCount.current);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update this guest");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={`host-admission-control ${open ? "open" : "closed"}`}>
      {open && (
        <aside className="host-admission-panel" aria-label="Waiting room guests">
          <div className="admission-panel-heading">
            <div><strong>Waiting room</strong><small>Only admitted guests receive room access.</small></div>
            <button type="button" aria-label="Close waiting room" onClick={() => onOpenChange(false)}><X size={19} weight="bold" /></button>
          </div>
          {error && <p className="admission-error" role="alert">{error}</p>}
          {requests.length === 0 ? (
            <p className="admission-empty">No guests are waiting.</p>
          ) : requests.map((request) => (
            <div className="admission-row" key={request.id}>
              <div className="admission-avatar" aria-hidden="true">{request.displayName.slice(0, 1).toUpperCase()}</div>
              <div className="admission-person">
                <strong>{request.displayName}</strong>
                <small>Waiting since {new Date(request.requestedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
              </div>
              <div className="admission-actions">
                <button disabled={busyId === request.id} type="button" onClick={() => void decide(request, "denied")}>Deny</button>
                <button className="admit" disabled={busyId === request.id} type="button" onClick={() => void decide(request, "admitted")}>Admit</button>
              </div>
            </div>
          ))}
        </aside>
      )}
    </div>
  );
}
