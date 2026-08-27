export type EmailAddress = {
  name?: string;
  email: string;
};

export type SendEmailInput = {
  to: EmailAddress | EmailAddress[] | string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
};

export type SendEmailResult = {
  messageId: string;
  accepted: string[];
  rejected: string[];
};
