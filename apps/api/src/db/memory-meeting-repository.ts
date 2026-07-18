import type {
  DeliveryUpdate,
  MeetingRepository,
  NewMeetingRecord,
  StoredAdmissionRequest,
  StoredInvitation,
  StoredMeeting,
} from "./meeting-repository";

export class MemoryMeetingRepository implements MeetingRepository {
  private readonly meetings = new Map<string, StoredMeeting>();
  private readonly meetingsById = new Map<string, StoredMeeting>();
  private readonly invitations = new Map<string, StoredInvitation>();
  private readonly admissions = new Map<string, StoredAdmissionRequest>();

  async createMeeting(record: NewMeetingRecord) {
    const meeting: StoredMeeting = {
      id: record.id,
      joinCode: record.joinCode,
      livekitRoomName: record.livekitRoomName,
      title: record.input.title,
      description: record.input.description,
      organizerName: record.creator.name,
      organizerEmail: record.creator.email,
      createdBy: record.creator.id,
      scheduledFor: record.input.scheduledFor ? new Date(record.input.scheduledFor) : null,
      status: "scheduled",
      isLocked: false,
      waitingRoomEnabled: true,
      createdAt: new Date(),
    };
    this.meetings.set(meeting.joinCode, meeting);
    this.meetingsById.set(meeting.id, meeting);

    const invitations = record.invitations.map<StoredInvitation>((invitee) => ({
      id: invitee.id,
      meetingId: meeting.id,
      recipientEmail: invitee.email,
      recipientName: invitee.name,
      status: "pending",
      providerRequestId: null,
      lastError: null,
    }));
    invitations.forEach((invitation) => this.invitations.set(invitation.id, invitation));
    return { meeting, invitations };
  }

  async updateInvitationDelivery(invitationId: string, update: DeliveryUpdate): Promise<void> {
    const invitation = this.invitations.get(invitationId);
    if (!invitation) return;
    invitation.status = update.status;
    invitation.providerRequestId = update.providerRequestId ?? null;
    invitation.lastError = update.error ?? null;
  }

  async findByJoinCode(joinCode: string): Promise<StoredMeeting | null> {
    return this.meetings.get(joinCode) ?? null;
  }

  async findByIdForHost(meetingId: string, userId: string): Promise<StoredMeeting | null> {
    const meeting = this.meetingsById.get(meetingId);
    return meeting?.createdBy === userId ? meeting : null;
  }

  async updateSettingsForHost(
    meetingId: string,
    userId: string,
    settings: { isLocked?: boolean; waitingRoomEnabled?: boolean },
  ): Promise<StoredMeeting | null> {
    const meeting = this.meetingsById.get(meetingId);
    if (!meeting || meeting.createdBy !== userId) return null;
    if (settings.isLocked !== undefined) meeting.isLocked = settings.isLocked;
    if (settings.waitingRoomEnabled !== undefined) {
      meeting.waitingRoomEnabled = settings.waitingRoomEnabled;
      if (!settings.waitingRoomEnabled) {
        for (const admission of this.admissions.values()) {
          if (admission.meetingId === meetingId && admission.status === "pending") {
            admission.status = "admitted";
            admission.decidedAt = new Date();
          }
        }
      }
    }
    return meeting;
  }

  async endForHost(meetingId: string, userId: string): Promise<StoredMeeting | null> {
    const meeting = this.meetingsById.get(meetingId);
    if (!meeting || meeting.createdBy !== userId) return null;
    meeting.status = "ended";
    for (const admission of this.admissions.values()) {
      if (admission.meetingId === meetingId && admission.status === "pending") {
        admission.status = "denied";
        admission.decidedAt = new Date();
      }
    }
    return meeting;
  }

  async listByOwner(userId: string): Promise<StoredMeeting[]> {
    return [...this.meetingsById.values()]
      .filter((meeting) => meeting.createdBy === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteByOwner(meetingId: string, userId: string): Promise<boolean> {
    const meeting = this.meetingsById.get(meetingId);
    if (!meeting || meeting.createdBy !== userId) return false;
    this.meetingsById.delete(meeting.id);
    this.meetings.delete(meeting.joinCode);
    for (const [invitationId, invitation] of this.invitations) {
      if (invitation.meetingId === meeting.id) this.invitations.delete(invitationId);
    }
    for (const [admissionId, admission] of this.admissions) {
      if (admission.meetingId === meeting.id) this.admissions.delete(admissionId);
    }
    return true;
  }

  async createAdmissionRequest(record: {
    id: string;
    meetingId: string;
    displayName: string;
    tokenHash: string;
    status?: StoredAdmissionRequest["status"];
  }): Promise<StoredAdmissionRequest> {
    const admission: StoredAdmissionRequest = {
      ...record,
      status: record.status ?? "pending",
      requestedAt: new Date(),
      decidedAt: record.status === "admitted" ? new Date() : null,
    };
    this.admissions.set(admission.id, admission);
    return admission;
  }

  async findAdmissionRequest(
    meetingId: string,
    admissionId: string,
    tokenHash: string,
  ): Promise<StoredAdmissionRequest | null> {
    const admission = this.admissions.get(admissionId);
    if (!admission || admission.meetingId !== meetingId || admission.tokenHash !== tokenHash) return null;
    return admission;
  }

  async listPendingAdmissionRequests(
    meetingId: string,
    userId: string,
  ): Promise<StoredAdmissionRequest[]> {
    const meeting = this.meetingsById.get(meetingId);
    if (!meeting || meeting.createdBy !== userId) return [];
    return [...this.admissions.values()]
      .filter((admission) => admission.meetingId === meetingId && admission.status === "pending")
      .sort((a, b) => a.requestedAt.getTime() - b.requestedAt.getTime());
  }

  async decideAdmissionRequest(
    meetingId: string,
    admissionId: string,
    userId: string,
    decision: "admitted" | "denied",
  ): Promise<StoredAdmissionRequest | null> {
    const meeting = this.meetingsById.get(meetingId);
    const admission = this.admissions.get(admissionId);
    if (
      !meeting ||
      meeting.createdBy !== userId ||
      !admission ||
      admission.meetingId !== meetingId ||
      admission.status !== "pending"
    ) return null;
    admission.status = decision;
    admission.decidedAt = new Date();
    return admission;
  }
}
