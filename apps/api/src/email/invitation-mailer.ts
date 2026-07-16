export interface InvitationMessage {
  invitationId: string;
  recipientEmail: string;
  recipientName: string;
  organizerName: string;
  meetingTitle: string;
  joinUrl: string;
  scheduledFor: Date | null;
}

export interface MailDelivery {
  status: "sent" | "simulated";
  providerRequestId: string;
}

export interface InvitationMailer {
  sendInvitation(message: InvitationMessage): Promise<MailDelivery>;
}
