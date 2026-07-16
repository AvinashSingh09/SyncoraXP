import { PreJoin, type LocalUserChoices } from "@livekit/components-react";
import { Brand } from "./Brand";

interface RoomPreJoinProps {
  title: string;
  subtitle: string;
  defaultName: string;
  joining: boolean;
  error: string;
  role: "host" | "guest";
  onSubmit(choices: LocalUserChoices): void;
}

export function RoomPreJoin({
  title,
  subtitle,
  defaultName,
  joining,
  error,
  role,
  onSubmit,
}: RoomPreJoinProps) {
  return (
    <main className="site-shell livekit-prejoin-page" data-lk-theme="default">
      <header className="topbar"><Brand /><span className="step-pill">{role === "host" ? "Host pre-join" : "Guest pre-join"}</span></header>
      <section className="livekit-prejoin-layout">
        <div className="prejoin-copy">
          <p className="eyebrow">{role === "host" ? "Host access confirmed" : "You are invited"}</p>
          <h1>{title}</h1>
          <p className="lead compact">{subtitle}</p>
          {role === "host" && (
            <div className="host-permissions"><span>Room admin</span><span>Publish and subscribe</span><span>Screen sharing</span></div>
          )}
          {joining && <p className="room-status">Creating your secure room session...</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
        <div className="prejoin-component-shell">
          <PreJoin
            defaults={{ username: defaultName, audioEnabled: true, videoEnabled: true }}
            joinLabel={joining ? "Joining..." : role === "host" ? "Enter as host" : "Join meeting"}
            userLabel="Display name"
            persistUserChoices
            onValidate={(choices) => !joining && choices.username.trim().length >= 2}
            onSubmit={onSubmit}
            onError={(mediaError) => console.warn("Media preview unavailable", mediaError)}
          />
        </div>
      </section>
    </main>
  );
}
