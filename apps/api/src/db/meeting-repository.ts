import type { AdmissionStatus, CreateMeetingInput, InvitationStatus } from "@voice/shared";

export interface StoredMeeting {
  id: string;
  joinCode: string;
  livekitRoomName: string;
  title: string;
  description: string;
  organizerName: string;
  organizerEmail: string;
  createdBy: string | null;
  scheduledFor: Date | null;
  status: "scheduled" | "active" | "ended";
  createdAt: Date;
}

export interface StoredInvitation {
  id: string;
  meetingId: string;
  recipientEmail: string;
  recipientName: string;
  status: InvitationStatus;
  providerRequestId: string | null;
  lastError: string | null;
}

export interface NewMeetingRecord {
  id: string;
  joinCode: string;
  livekitRoomName: string;
  creator: { id: string; name: string; email: string };
  input: CreateMeetingInput;
  invitations: Array<{
    id: string;
    email: string;
    name: string;
  }>;
}

export interface DeliveryUpdate {
  status: Exclude<InvitationStatus, "pending">;
  providerRequestId?: string;
  error?: string;
}

export interface StoredAdmissionRequest {
  id: string;
  meetingId: string;
  displayName: string;
  tokenHash: string;
  status: AdmissionStatus;
  requestedAt: Date;
  decidedAt: Date | null;
}

export interface MeetingRepository {
  createMeeting(record: NewMeetingRecord): Promise<{
    meeting: StoredMeeting;
    invitations: StoredInvitation[];
  }>;
  updateInvitationDelivery(invitationId: string, update: DeliveryUpdate): Promise<void>;
  findByJoinCode(joinCode: string): Promise<StoredMeeting | null>;
  findByIdForHost(meetingId: string, userId: string): Promise<StoredMeeting | null>;
  listByOwner(userId: string): Promise<StoredMeeting[]>;
  deleteByOwner(meetingId: string, userId: string): Promise<boolean>;
  createAdmissionRequest(record: {
    id: string;
    meetingId: string;
    displayName: string;
    tokenHash: string;
  }): Promise<StoredAdmissionRequest>;
  findAdmissionRequest(
    meetingId: string,
    admissionId: string,
    tokenHash: string,
  ): Promise<StoredAdmissionRequest | null>;
  listPendingAdmissionRequests(meetingId: string, userId: string): Promise<StoredAdmissionRequest[]>;
  decideAdmissionRequest(
    meetingId: string,
    admissionId: string,
    userId: string,
    decision: Exclude<AdmissionStatus, "pending">,
  ): Promise<StoredAdmissionRequest | null>;
}
