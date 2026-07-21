import { z } from "zod";

export * from "./translation";

const trimmedEmail = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .transform((value) => value.toLowerCase());

export const RegisterInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: trimmedEmail,
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(128, "Password must be at most 128 characters"),
});

export const LoginInputSchema = z.object({
  email: trimmedEmail,
  password: z.string().min(1, "Enter your password").max(128),
});

export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: AuthUser;
}

export const InviteeSchema = z.object({
  email: trimmedEmail,
  name: z.string().trim().max(120).optional().default(""),
});

export const CreateMeetingInputSchema = z.object({
  title: z.string().trim().min(3, "Meeting title must be at least 3 characters").max(160),
  description: z.string().trim().max(1_000).optional().default(""),
  scheduledFor: z.iso.datetime({ offset: true }).nullable().optional(),
  invitees: z.array(InviteeSchema).max(50, "A meeting can initially invite up to 50 people").default([]),
});

export type CreateMeetingInput = z.infer<typeof CreateMeetingInputSchema>;

export type InvitationStatus = "pending" | "sent" | "simulated" | "failed";

export interface MeetingSummary {
  id: string;
  title: string;
  description: string;
  organizerName: string;
  scheduledFor: string | null;
  joinUrl: string;
  hostUrl: string;
  status: "scheduled" | "active" | "ended";
  createdAt: string;
}

export interface InvitationSummary {
  id: string;
  email: string;
  name: string;
  status: InvitationStatus;
  error?: string;
}

export interface CreateMeetingResponse {
  meeting: MeetingSummary;
  invitations: InvitationSummary[];
}

export interface PublicMeetingResponse {
  meeting: Pick<
    MeetingSummary,
    "id" | "title" | "description" | "organizerName" | "scheduledFor" | "status"
  >;
}

export interface HostMeetingResponse {
  meeting: MeetingSummary;
  role: "host";
  settings: MeetingSettings;
}

export interface MyMeetingsResponse {
  meetings: MeetingSummary[];
}

export const GuestAdmissionInputSchema = z.object({
  displayName: z.string().trim().min(2, "Enter a display name").max(80),
});

export type GuestAdmissionInput = z.infer<typeof GuestAdmissionInputSchema>;

export type AdmissionStatus = "pending" | "admitted" | "denied";

export interface GuestAdmissionResponse {
  admissionId: string;
  admissionToken: string;
  status: AdmissionStatus;
}

export interface GuestAdmissionStatusResponse {
  status: AdmissionStatus;
}

export interface HostAdmissionRequest {
  id: string;
  displayName: string;
  status: AdmissionStatus;
  requestedAt: string;
}

export interface HostAdmissionListResponse {
  requests: HostAdmissionRequest[];
}

export interface MeetingSettings {
  isLocked: boolean;
  waitingRoomEnabled: boolean;
  allowGuestCamera: boolean;
  allowGuestMicrophone: boolean;
}

export const UpdateMeetingSettingsInputSchema = z.object({
  isLocked: z.boolean().optional(),
  waitingRoomEnabled: z.boolean().optional(),
  allowGuestCamera: z.boolean().optional(),
  allowGuestMicrophone: z.boolean().optional(),
}).refine(
  (settings) => Object.values(settings).some((value) => value !== undefined),
  "Choose at least one setting to update",
);

export type UpdateMeetingSettingsInput = z.infer<typeof UpdateMeetingSettingsInputSchema>;

export interface MeetingSettingsResponse {
  settings: MeetingSettings;
}

export const AdmissionDecisionInputSchema = z.object({
  decision: z.enum(["admitted", "denied"]),
});

export const GuestRoomSessionInputSchema = z.object({
  admissionId: z.string().uuid(),
});

export type GuestRoomSessionInput = z.infer<typeof GuestRoomSessionInputSchema>;

export interface RoomSessionResponse {
  serverUrl: string;
  participantToken: string;
  meetingId: string;
  roomName: string;
  participantIdentity: string;
  role: "host" | "guest";
  translation: import("./translation").MeetingTranslationSettings;
}
