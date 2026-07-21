import type {
  MeetingSettings,
  MeetingTranslationSettings,
  TranslationProvider,
  UpdateMeetingSettingsInput,
} from "@voice/shared";
import { GlobeHemisphereWest, LockKey, Microphone, Users, VideoCamera, X } from "@phosphor-icons/react";
import { useState } from "react";
import { updateMeetingSettings, updateMeetingTranslation } from "../api";

interface HostToolsPanelProps {
  meetingId: string;
  participantIdentity: string;
  open: boolean;
  settings: MeetingSettings;
  translationSettings: MeetingTranslationSettings;
  onOpenChange(open: boolean): void;
  onSettingsChange(settings: MeetingSettings): void;
  onTranslationSettingsChange(settings: MeetingTranslationSettings): void;
}

export function HostToolsPanel({
  meetingId,
  participantIdentity,
  open,
  settings,
  translationSettings,
  onOpenChange,
  onSettingsChange,
  onTranslationSettingsChange,
}: HostToolsPanelProps) {
  const [busySetting, setBusySetting] = useState<keyof MeetingSettings | null>(null);
  const [error, setError] = useState("");
  const [translationBusy, setTranslationBusy] = useState(false);

  const updateSetting = async (change: UpdateMeetingSettingsInput) => {
    const setting = Object.keys(change)[0] as keyof MeetingSettings;
    setBusySetting(setting);
    setError("");
    try {
      const response = await updateMeetingSettings(meetingId, change);
      onSettingsChange(response.settings);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update host tools");
    } finally {
      setBusySetting(null);
    }
  };

  const toggleInterpretation = async () => {
    setTranslationBusy(true);
    setError("");
    try {
      const response = await updateMeetingTranslation(meetingId, {
        enabled: !translationSettings.enabled,
        designatedSpeakerIdentity: participantIdentity,
      });
      onTranslationSettingsChange(response.settings);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update interpretation");
    } finally {
      setTranslationBusy(false);
    }
  };

  const updateTranslationProvider = async (provider: TranslationProvider) => {
    if (translationSettings.enabled || provider === translationSettings.provider) return;
    setTranslationBusy(true);
    setError("");
    try {
      const response = await updateMeetingTranslation(meetingId, { provider });
      onTranslationSettingsChange(response.settings);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not change translation provider");
    } finally {
      setTranslationBusy(false);
    }
  };

  return (
    <div className={`host-tools-control ${open ? "open" : "closed"}`}>
      {open && (
        <aside className="host-tools-panel" aria-label="Host tools">
          <div className="host-tools-heading">
            <div>
              <strong>Host tools</strong>
              <small>Manage guest access and live interpretation.</small>
            </div>
            <button type="button" aria-label="Close host tools" onClick={() => onOpenChange(false)}>
              <X size={19} weight="bold" />
            </button>
          </div>

          {error && <p className="host-tools-error" role="alert">{error}</p>}

          <div className="host-tools-list">
            <div className="host-tool-row">
              <span className="host-tool-icon"><LockKey size={18} weight="bold" /></span>
              <span className="host-tool-copy">
                <strong>Lock meeting</strong>
                <small>Block all new guests from entering.</small>
              </span>
              <button
                type="button"
                role="switch"
                aria-label="Lock meeting"
                aria-checked={settings.isLocked}
                className={`host-tool-switch ${settings.isLocked ? "on" : "off"}`}
                disabled={busySetting !== null}
                onClick={() => void updateSetting({ isLocked: !settings.isLocked })}
              >
                <span />
              </button>
            </div>

            <div className="host-tool-row">
              <span className="host-tool-icon"><Users size={18} weight="bold" /></span>
              <span className="host-tool-copy">
                <strong>Enable waiting room</strong>
                <small>Require host approval before guests enter.</small>
              </span>
              <button
                type="button"
                role="switch"
                aria-label="Enable waiting room"
                aria-checked={settings.waitingRoomEnabled}
                className={`host-tool-switch ${settings.waitingRoomEnabled ? "on" : "off"}`}
                disabled={busySetting !== null}
                onClick={() => void updateSetting({ waitingRoomEnabled: !settings.waitingRoomEnabled })}
              >
                <span />
              </button>
            </div>

            <div className="host-tool-row">
              <span className="host-tool-icon"><VideoCamera size={18} weight="bold" /></span>
              <span className="host-tool-copy">
                <strong>Allow guest cameras</strong>
                <small>Let guests turn on their camera.</small>
              </span>
              <button
                type="button"
                role="switch"
                aria-label="Allow guest cameras"
                aria-checked={settings.allowGuestCamera}
                className={`host-tool-switch ${settings.allowGuestCamera ? "on" : "off"}`}
                disabled={busySetting !== null}
                onClick={() => void updateSetting({ allowGuestCamera: !settings.allowGuestCamera })}
              >
                <span />
              </button>
            </div>

            <div className="host-tool-row">
              <span className="host-tool-icon"><Microphone size={18} weight="bold" /></span>
              <span className="host-tool-copy">
                <strong>Allow guest microphones</strong>
                <small>Let guests turn on their microphone.</small>
              </span>
              <button
                type="button"
                role="switch"
                aria-label="Allow guest microphones"
                aria-checked={settings.allowGuestMicrophone}
                className={`host-tool-switch ${settings.allowGuestMicrophone ? "on" : "off"}`}
                disabled={busySetting !== null}
                onClick={() => void updateSetting({ allowGuestMicrophone: !settings.allowGuestMicrophone })}
              >
                <span />
              </button>
            </div>

            <div className="host-tool-row">
              <span className="host-tool-icon"><GlobeHemisphereWest size={18} weight="bold" /></span>
              <span className="host-tool-copy">
                <strong>Enable interpretation</strong>
                <small>Translate your English audio into five Indian languages.</small>
              </span>
              <button
                type="button"
                role="switch"
                aria-label="Enable interpretation"
                aria-checked={translationSettings.enabled}
                className={`host-tool-switch ${translationSettings.enabled ? "on" : "off"}`}
                disabled={busySetting !== null || translationBusy}
                onClick={() => void toggleInterpretation()}
              >
                <span />
              </button>
            </div>

            <div className="translation-provider-setting">
              <div className="translation-provider-heading">
                <strong>Translation provider</strong>
                <small>
                  {translationSettings.enabled
                    ? "Stop interpretation to switch providers."
                    : "Choose which realtime engine to test."}
                </small>
              </div>
              <div
                className="translation-provider-options"
                role="radiogroup"
                aria-label="Translation provider"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={translationSettings.provider === "openai"}
                  className={translationSettings.provider === "openai" ? "selected" : ""}
                  disabled={translationSettings.enabled || translationBusy}
                  onClick={() => void updateTranslationProvider("openai")}
                >
                  <strong>OpenAI</strong>
                  <small>Realtime Translate</small>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={translationSettings.provider === "gemini"}
                  className={translationSettings.provider === "gemini" ? "selected" : ""}
                  disabled={translationSettings.enabled || translationBusy}
                  onClick={() => void updateTranslationProvider("gemini")}
                >
                  <strong>Gemini</strong>
                  <small>Live Translate - Preview</small>
                </button>
              </div>
            </div>
          </div>

          <p className="host-tools-note">
            {translationSettings.enabled
              ? `${translationSettings.provider === "gemini" ? "Gemini Live" : "OpenAI Realtime"} interpretation is starting. Guests can select Hindi, Bengali, Marathi, Tamil, or Telugu.`
              : !settings.allowGuestCamera && !settings.allowGuestMicrophone
              ? "Guests cannot use cameras or microphones."
              : !settings.allowGuestCamera
                ? "Guests cannot use cameras."
                : !settings.allowGuestMicrophone
                  ? "Guests cannot use microphones."
              : settings.isLocked
              ? "This meeting is locked. Connected participants can remain."
              : settings.waitingRoomEnabled
                ? "New guests will wait for your approval."
                : "New guests can join immediately."}
          </p>
        </aside>
      )}
    </div>
  );
}
