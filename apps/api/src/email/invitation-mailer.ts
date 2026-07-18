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

export interface DemoMessage {
  fullName: string;
  workEmail: string;
  phone: string;
  countryCode: string;
  city: string;
  company: string;
  category: string;
  message: string;
}

export interface InvitationMailer {
  sendInvitation(message: InvitationMessage): Promise<MailDelivery>;
  sendDemoRequest(message: DemoMessage): Promise<MailDelivery>;
}

