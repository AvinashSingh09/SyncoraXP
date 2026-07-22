import type {
  MeetingSettings,
  MeetingTranslationSettings,
  UpdateMeetingSettingsInput,
} from "@voice/shared";
import {
  CaretDown,
  GlobeHemisphereWest,
  LockKey,
  Microphone,
  Monitor,
  Users,
  VideoCamera,
  X,
} from "@phosphor-icons/react";
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
    const enabled = !translationSettings.enabled;
    setTranslationBusy(true);
    setError("");
    try {
      const response = await updateMeetingTranslation(meetingId, {
        enabled,
        designatedSpeakerIdentity: participantIdentity,
        ...(enabled ? { provider: "gemini" as const } : {}),
      });
      onTranslationSettingsChange(response.settings);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update interpretation");
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

            <details className="host-tools-advanced">
              <summary>
                <span>
                  <strong>Advanced settings</strong>
                  <small>Guest media permissions and interpretation.</small>
                </span>
                <CaretDown className="host-tools-advanced-caret" size={17} weight="bold" />
              </summary>

              <div className="host-tools-advanced-content">
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
                  <span className="host-tool-icon"><Monitor size={18} weight="bold" /></span>
                  <span className="host-tool-copy">
                    <strong>Allow guest screen sharing</strong>
                    <small>Let guests present their screen to the meeting.</small>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-label="Allow guest screen sharing"
                    aria-checked={settings.allowGuestScreenShare}
                    className={`host-tool-switch ${settings.allowGuestScreenShare ? "on" : "off"}`}
                    disabled={busySetting !== null}
                    onClick={() => void updateSetting({
                      allowGuestScreenShare: !settings.allowGuestScreenShare,
                    })}
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

              </div>
            </details>
          </div>

          <p className="host-tools-note">
            {translationSettings.enabled
              ? "Gemini Live interpretation is starting. Guests can select Hindi, Bengali, Marathi, Tamil, or Telugu."
              : !settings.allowGuestScreenShare
                ? "Only the host can share their screen."
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
