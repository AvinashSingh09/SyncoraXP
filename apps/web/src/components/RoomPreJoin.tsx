import { PreJoin, type LocalUserChoices } from "@livekit/components-react";
import {
  TRANSLATION_LANGUAGES,
  type PublicMeetingResponse,
  type TranslationPreference,
} from "@voice/shared";
import { useState } from "react";
import { Brand } from "./Brand";

interface RoomPreJoinProps {
  title: string;
  subtitle: string;
  defaultName: string;
  joining: boolean;
  error: string;
  role: "host" | "guest";
  interpretation?: PublicMeetingResponse["interpretation"];
  onSubmit(choices: LocalUserChoices, preferredLanguage: TranslationPreference): void;
}

export function RoomPreJoin({
  title,
  subtitle,
  defaultName,
  joining,
  error,
  role,
  interpretation,
  onSubmit,
}: RoomPreJoinProps) {
  const [preferredLanguage, setPreferredLanguage] =
    useState<TranslationPreference>("original");
  const availableLanguages = TRANSLATION_LANGUAGES.filter((language) =>
    interpretation?.allowedTargetLanguages.includes(language.code),
  );

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
          {role === "guest" && interpretation?.enabled && (
            <label className="prejoin-language">
              <span>Listening language</span>
              <select
                value={preferredLanguage}
                onChange={(event) =>
                  setPreferredLanguage(event.target.value as TranslationPreference)
                }
              >
                <option value="original">Original audio</option>
                {availableLanguages.map((language) => (
                  <option key={language.code} value={language.code}>{language.label}</option>
                ))}
              </select>
              <small>You can change this during the meeting.</small>
            </label>
          )}
          <PreJoin
            defaults={{ username: defaultName, audioEnabled: true, videoEnabled: true }}
            joinLabel={joining ? "Joining..." : role === "host" ? "Enter as host" : "Join meeting"}
            userLabel="Display name"
            persistUserChoices
            onValidate={(choices) => !joining && choices.username.trim().length >= 2}
            onSubmit={(choices) => onSubmit(choices, preferredLanguage)}
            onError={(mediaError) => console.warn("Media preview unavailable", mediaError)}
          />
        </div>
      </section>
    </main>
  );
}
