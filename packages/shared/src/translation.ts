import { z } from "zod";

export const TRANSLATION_LANGUAGES = [
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు" },
] as const;

export const TranslationLanguageCodeSchema = z.enum(["hi", "bn", "mr", "ta", "te"]);
export type TranslationLanguageCode = z.infer<typeof TranslationLanguageCodeSchema>;

export const TranslationPreferenceSchema = z.union([
  z.literal("original"),
  TranslationLanguageCodeSchema,
]);
export type TranslationPreference = z.infer<typeof TranslationPreferenceSchema>;

export const TranslationProviderSchema = z.enum(["openai", "gemini"]);
export type TranslationProvider = z.infer<typeof TranslationProviderSchema>;

export const TRANSLATION_MODELS = {
  openai: "gpt-realtime-translate",
  gemini: "gemini-3.5-live-translate-preview",
} as const satisfies Record<TranslationProvider, string>;

export type TranslationModel = (typeof TRANSLATION_MODELS)[TranslationProvider];

export function translationModelForProvider(provider: TranslationProvider): TranslationModel {
  return TRANSLATION_MODELS[provider];
}

export const TranslationRunStatusSchema = z.enum([
  "idle",
  "queued",
  "starting",
  "active",
  "reconnecting",
  "stopping",
  "completed",
  "failed",
]);
export type TranslationRunStatus = z.infer<typeof TranslationRunStatusSchema>;

export const TranslationLanguageStatusSchema = z.enum([
  "idle",
  "starting",
  "live",
  "delayed",
  "reconnecting",
  "draining",
  "unavailable",
]);
export type TranslationLanguageStatus = z.infer<typeof TranslationLanguageStatusSchema>;

export interface MeetingTranslationSettings {
  enabled: boolean;
  sourceLanguage: "en";
  allowedTargetLanguages: TranslationLanguageCode[];
  provider: TranslationProvider;
  model: TranslationModel;
  designatedSpeakerIdentity: string | null;
}

export interface TranslationLanguageRuntime {
  language: TranslationLanguageCode;
  status: TranslationLanguageStatus;
  listenerCount: number;
  trackName: string | null;
  firstAudioLatencyMs?: number;
  errorCode?: string;
}

export interface MeetingTranslationRuntime {
  runId: string | null;
  status: TranslationRunStatus;
  workerConnected: boolean;
  languages: TranslationLanguageRuntime[];
}

export interface MeetingTranslationResponse {
  settings: MeetingTranslationSettings;
  runtime: MeetingTranslationRuntime;
}

export const UpdateMeetingTranslationInputSchema = z
  .object({
    enabled: z.boolean().optional(),
    allowedTargetLanguages: z
      .array(TranslationLanguageCodeSchema)
      .min(1, "Choose at least one translation language")
      .max(10)
      .transform((languages) => Array.from(new Set(languages)))
      .optional(),
    provider: TranslationProviderSchema.optional(),
    designatedSpeakerIdentity: z.string().trim().min(1).max(255).nullable().optional(),
  })
  .refine(
    (settings) =>
      settings.enabled !== undefined ||
      settings.allowedTargetLanguages !== undefined ||
      settings.provider !== undefined ||
      settings.designatedSpeakerIdentity !== undefined,
    "Choose at least one translation setting to update",
  );

export type UpdateMeetingTranslationInput = z.infer<typeof UpdateMeetingTranslationInputSchema>;

const TranslationMessageBaseSchema = z.object({
  version: z.literal(1),
  meetingId: z.string().uuid(),
  translationRunId: z.string().uuid(),
  sequence: z.number().int().nonnegative(),
  sentAt: z.string(),
});

export const TranslationPreferenceSetMessageSchema = TranslationMessageBaseSchema.extend({
  type: z.literal("translation.preference.set"),
  language: TranslationPreferenceSchema,
});

export const TranslationPreferenceAckMessageSchema = TranslationMessageBaseSchema.extend({
  type: z.literal("translation.preference.ack"),
  language: TranslationPreferenceSchema,
  status: TranslationLanguageStatusSchema,
});

export const TranslationLanguageStatusMessageSchema = TranslationMessageBaseSchema.extend({
  type: z.literal("translation.language.status"),
  language: TranslationLanguageCodeSchema,
  status: TranslationLanguageStatusSchema,
  listenerCount: z.number().int().nonnegative(),
  trackName: z.string().nullable(),
  sourceParticipantIdentity: z.string(),
  errorCode: z.string().optional(),
});

export const TranslationCaptionMessageSchema = TranslationMessageBaseSchema.extend({
  type: z.enum([
    "translation.caption.source.delta",
    "translation.caption.source.final",
    "translation.caption.target.delta",
    "translation.caption.target.final",
  ]),
  language: TranslationLanguageCodeSchema.optional(),
  text: z.string(),
});

export const TranslationWorkerStatusMessageSchema = TranslationMessageBaseSchema.extend({
  type: z.literal("translation.worker.status"),
  status: TranslationRunStatusSchema,
  sourceParticipantIdentity: z.string(),
});

export const TranslationDataMessageSchema = z.discriminatedUnion("type", [
  TranslationPreferenceSetMessageSchema,
  TranslationPreferenceAckMessageSchema,
  TranslationLanguageStatusMessageSchema,
  TranslationCaptionMessageSchema,
  TranslationWorkerStatusMessageSchema,
]);

export type TranslationDataMessage = z.infer<typeof TranslationDataMessageSchema>;

export const DEFAULT_TRANSLATION_SETTINGS: MeetingTranslationSettings = {
  enabled: false,
  sourceLanguage: "en",
  allowedTargetLanguages: TRANSLATION_LANGUAGES.map((language) => language.code),
  provider: "openai",
  model: TRANSLATION_MODELS.openai,
  designatedSpeakerIdentity: null,
};

export const IDLE_TRANSLATION_RUNTIME: MeetingTranslationRuntime = {
  runId: null,
  status: "idle",
  workerConnected: false,
  languages: [],
};
