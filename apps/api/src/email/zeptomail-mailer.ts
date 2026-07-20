import type { InvitationMailer, InvitationMessage, DemoMessage } from "./invitation-mailer";

interface ZeptoMailConfig {
  apiUrl: string;
  token: string;
  fromAddress: string;
  fromName: string;
  demoReceiverEmail: string;
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

  async sendDemoRequest(message: DemoMessage) {
    const response = await fetch(this.config.apiUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Zoho-enczapikey ${this.config.token}`,
      },
      body: JSON.stringify({
        from: { address: this.config.fromAddress, name: this.config.fromName },
        to: [{ email_address: { address: this.config.demoReceiverEmail, name: "Syncora Demo Manager" } }],
        subject: message.category === "Call Back Request" 
          ? `New Call Back Request from ${message.fullName}` 
          : `New Demo Booking Request from ${message.fullName}`,
        htmlbody: `
          <div style="font-family:Arial,sans-serif;color:#172033;line-height:1.6;max-width:600px;border:1px solid #f1f0ff;padding:30px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.02)">
            <h2 style="color:#1e084a;margin-top:0;border-bottom:1.5px solid #f1f0ff;padding-bottom:15px">${escapeHtml(message.category === "Call Back Request" ? "New Call Back Request" : "New Demo Booking Request")}</h2>
            <table style="width:100%;border-collapse:collapse;margin-top:20px">
              <tr>
                <td style="padding:8px 0;font-weight:bold;color:#4b5563;width:140px">Full Name:</td>
                <td style="padding:8px 0;color:#1f2937">${escapeHtml(message.fullName)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-weight:bold;color:#4b5563">Work Email:</td>
                <td style="padding:8px 0;color:#1f2937"><a href="mailto:${escapeHtml(message.workEmail)}" style="color:#7c3aed;text-decoration:none">${escapeHtml(message.workEmail)}</a></td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-weight:bold;color:#4b5563">Phone Number:</td>
                <td style="padding:8px 0;color:#1f2937">${escapeHtml(message.countryCode)} ${escapeHtml(message.phone)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-weight:bold;color:#4b5563">City:</td>
                <td style="padding:8px 0;color:#1f2937">${escapeHtml(message.city)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-weight:bold;color:#4b5563">Company:</td>
                <td style="padding:8px 0;color:#1f2937">${escapeHtml(message.company)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-weight:bold;color:#4b5563">Business Category:</td>
                <td style="padding:8px 0;color:#1f2937">${escapeHtml(message.category)}</td>
              </tr>
            </table>
            <div style="margin-top:24px;padding-top:20px;border-top:1.5px solid #f1f0ff">
              <p style="font-weight:bold;color:#4b5563;margin:0 0 8px 0">Additional Message:</p>
              <p style="color:#4b5563;background:#faf9ff;padding:16px;border-radius:8px;margin:0;white-space:pre-wrap;line-height:1.5">${escapeHtml(message.message || "No additional message provided.")}</p>
            </div>
          </div>`,
        track_clicks: false,
        track_opens: false,
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
      providerRequestId: body.request_id ?? "demo-request",
    };
  }
}
