type TemplateOptions = {
  title: string;
  preheader?: string;
  body: string; // already HTML
  footerNote?: string;
};

export function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buttonHtml(label: string, url: string) {
  const safeLabel = escapeHtml(label);
  const safeUrl = escapeHtml(url);

  return `
  <div style="margin: 20px 0;">
    <a href="${safeUrl}"
       style="display:inline-block;text-decoration:none;padding:12px 16px;border-radius:10px;
              background:#111827;color:#ffffff;font-weight:600;">
      ${safeLabel}
    </a>
  </div>`;
}

export function baseEmailHtml(opts: TemplateOptions) {
  const title = escapeHtml(opts.title);
  const preheader = opts.preheader ? escapeHtml(opts.preheader) : "";
  const footerNote = opts.footerNote ? escapeHtml(opts.footerNote) : "If you didn’t request this, you can ignore this email.";

  // Preheader (hidden) improves inbox UX
  const preheaderSpan = preheader
    ? `<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${preheader}</span>`
    : "";

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
  </head>
  <body style="margin:0;background:#f3f4f6;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;">
    ${preheaderSpan}
    <div style="padding:24px;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,.06);">
        <div style="padding:20px 22px;border-bottom:1px solid #e5e7eb;">
          <div style="font-size:16px;font-weight:700;color:#111827;">${title}</div>
        </div>

        <div style="padding:22px;color:#111827;font-size:14px;line-height:1.55;">
          ${opts.body}
        </div>

        <div style="padding:16px 22px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;line-height:1.4;">
          ${footerNote}
        </div>
      </div>

      <div style="max-width:600px;margin:10px auto 0;color:#9ca3af;font-size:11px;text-align:center;">
        Please do not reply to this message.
      </div>
    </div>
  </body>
</html>`;
}

export function baseEmailText(title: string, lines: string[]) {
  return [
    title,
    "",
    ...lines,
    "",
    "If you didn’t request this, you can ignore this email.",
  ].join("\n");
}
