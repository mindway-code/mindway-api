import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../../core/config/env.js";
import type { SendEmailInput, SendEmailResult } from "./email.types.js";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const user = env.GMAIL_USER;
  const from = env.EMAIL_FROM;

  if (!user || !from) {
    throw new Error("EMAIL_FROM and GMAIL_USER are required to send emails");
  }

  // Option A: App Password (simple)
  if (env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass: env.GMAIL_APP_PASSWORD,
      },
    });
    return transporter;
  }

  // Option B: OAuth2 (recommended long-term)
  if (env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET && env.GMAIL_REFRESH_TOKEN) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user,
        clientId: env.GMAIL_CLIENT_ID,
        clientSecret: env.GMAIL_CLIENT_SECRET,
        refreshToken: env.GMAIL_REFRESH_TOKEN,
      },
    });
    return transporter;
  }

  throw new Error("Missing Gmail auth config. Use GMAIL_APP_PASSWORD or OAuth2 env vars.");
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const tx = getTransporter();

  const info = await tx.sendMail({
    from: env.EMAIL_FROM,
    to: input.to as any,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo,
    headers: input.headers,
  });

  return {
    messageId: info.messageId,
    accepted: (info.accepted as string[]) ?? [],
    rejected: (info.rejected as string[]) ?? [],
  };
}
