import type { InvitationMailer, InvitationMessage } from "./invitation-mailer";

interface ZeptoMailConfig {
  apiUrl: string;
  token: string;
  fromAddress: string;
  fromName: string;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ] ?? character,
  );
}

function formatSchedule(date: Date | null): string {
  return date ? date.toUTCString() : "The meeting can be joined using the link below.";
}

export class ZeptoMailInvitationMailer implements InvitationMailer {
  constructor(private readonly config: ZeptoMailConfig) {}

  async sendInvitation(message: InvitationMessage) {
    const recipientName = message.recipientName || message.recipientEmail;
    const schedule = formatSchedule(message.scheduledFor);
    const response = await fetch(this.config.apiUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Zoho-enczapikey ${this.config.token}`,
      },
      body: JSON.stringify({
        from: { address: this.config.fromAddress, name: this.config.fromName },
        to: [{ email_address: { address: message.recipientEmail, name: recipientName } }],
        subject: `${message.organizerName} invited you to ${message.meetingTitle}`,
        textbody: `${message.organizerName} invited you to ${message.meetingTitle}. ${schedule} Join: ${message.joinUrl}`,
        htmlbody: `
          <div style="font-family:Arial,sans-serif;color:#172033;line-height:1.6;max-width:600px">
            <p>Hello ${escapeHtml(recipientName)},</p>
            <p><strong>${escapeHtml(message.organizerName)}</strong> invited you to
              <strong>${escapeHtml(message.meetingTitle)}</strong>.</p>
            <p>${escapeHtml(schedule)}</p>
            <p><a href="${escapeHtml(message.joinUrl)}" style="display:inline-block;background:#4459e8;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none">Join meeting</a></p>
            <p style="color:#65708a;font-size:13px">Or copy this link: ${escapeHtml(message.joinUrl)}</p>
          </div>`,
        track_clicks: false,
        track_opens: false,
        client_reference: message.invitationId,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    const body = (await response.json().catch(() => ({}))) as {
      request_id?: string;
      error?: { message?: string; request_id?: string };
      message?: string;
    };
    if (!response.ok) {
      throw new Error(
        body.error?.message ?? body.message ?? `ZeptoMail returned HTTP ${response.status}`,
      );
    }

    return {
      status: "sent" as const,
      providerRequestId: body.request_id ?? message.invitationId,
    };
  }
}
