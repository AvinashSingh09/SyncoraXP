import { randomUUID } from "node:crypto";
import type { InvitationMailer, InvitationMessage, DemoMessage } from "./invitation-mailer";

export class ConsoleInvitationMailer implements InvitationMailer {
  async sendInvitation(message: InvitationMessage) {
    console.log(
      `[email:simulated] Invitation for ${message.recipientEmail}: ${message.joinUrl}`,
    );
    return { status: "simulated" as const, providerRequestId: `console:${randomUUID()}` };
  }

  async sendDemoRequest(message: DemoMessage) {
    console.log(
      `[email:simulated] Demo Request from ${message.fullName} (${message.workEmail})`,
    );
    return { status: "simulated" as const, providerRequestId: `console:${randomUUID()}` };
  }
}

