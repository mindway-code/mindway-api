import { baseEmailHtml, baseEmailText, buttonHtml, escapeHtml } from "./email.templates.js";
import { sendEmail } from "./email.client.js";

export async function sendNotificationEmail(params: {
  to: string;
  title: string;
  message: string;
}) {
  const body = `
    <p style="margin:0 0 10px;">${escapeHtml(params.message)}</p>
  `;

  return sendEmail({
    to: params.to,
    subject: params.title,
    html: baseEmailHtml({ title: params.title, preheader: params.message, body }),
    text: baseEmailText(params.title, [params.message]),
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name?: string;
  resetUrl: string;
}) {
  const hello = params.name ? `Hi ${escapeHtml(params.name)},` : "Hi,";
  const body = `
    <p style="margin:0 0 10px;">${hello}</p>
    <p style="margin:0 0 10px;">
      We received a request to reset your password. Click the button below to continue.
    </p>
    ${buttonHtml("Reset password", params.resetUrl)}
    <p style="margin:12px 0 0;color:#6b7280;font-size:12px;">
      If the button doesn't work, copy and paste this link:
      <br/>
      <span style="word-break:break-all;">${escapeHtml(params.resetUrl)}</span>
    </p>
  `;

  return sendEmail({
    to: params.to,
    subject: "Reset your password",
    html: baseEmailHtml({
      title: "Reset your password",
      preheader: "Use this link to reset your password.",
      body,
      footerNote: "If you didn’t request a password reset, you can safely ignore this email.",
    }),
    text: baseEmailText("Reset your password", [
      params.name ? `Hi ${params.name},` : "Hi,",
      "We received a request to reset your password.",
      `Open this link: ${params.resetUrl}`,
    ]),
  });
}
