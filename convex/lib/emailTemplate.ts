/** Shared Hel Calafkaaga email markup (plain JS — safe in Convex actions + auth). */

export const EMAIL_BRAND = {
  name: "Hel Calafkaaga",
  tagline: "Halal marriage matchmaking with trust and respect.",
  primary: "#a61b2b",
  primaryDark: "#6b1220",
  gold: "#b45309",
  ink: "#1a1214",
  muted: "#6b5c5f",
  bg: "#faf7f7",
  card: "#ffffff",
  border: "#e8dcde",
} as const;

export function getEmailSiteUrl(): string {
  return (
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://www.helcalafkaaga.com"
  ).replace(/\/$/, "");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function paragraphsHtml(body: string): string {
  return body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = escapeHtml(block).replace(/\n/g, "<br />");
      return `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${EMAIL_BRAND.ink};">${lines}</p>`;
    })
    .join("");
}

export type BrandedEmailArgs = {
  /** Short preview text in inbox clients */
  preheader?: string;
  title: string;
  body: string;
  cta?: { label: string; url: string };
  /** Optional large code block (password reset) */
  code?: string;
  /** Trusted HTML inserted after the body (already escaped by caller) */
  extraHtml?: string;
  footerNote?: string;
};

export function buildBrandedEmailText(args: BrandedEmailArgs): string {
  const lines = [args.title, "", args.body];
  if (args.code) {
    lines.push("", `Code: ${args.code}`);
  }
  if (args.cta) {
    lines.push("", `${args.cta.label}: ${args.cta.url}`);
  }
  if (args.footerNote) {
    lines.push("", args.footerNote);
  }
  lines.push("", `— ${EMAIL_BRAND.name}`, EMAIL_BRAND.tagline);
  return lines.join("\n");
}

export function buildBrandedEmailHtml(args: BrandedEmailArgs): string {
  const siteUrl = getEmailSiteUrl();
  const preheader = escapeHtml(args.preheader ?? args.body.slice(0, 120));
  const title = escapeHtml(args.title);
  const bodyHtml = paragraphsHtml(args.body);
  const footerNote = args.footerNote
    ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:${EMAIL_BRAND.muted};">${escapeHtml(args.footerNote)}</p>`
    : "";

  const codeBlock = args.code
    ? `<div style="margin:8px 0 24px;padding:18px 20px;border-radius:14px;background:${EMAIL_BRAND.bg};border:1px solid ${EMAIL_BRAND.border};text-align:center;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:${EMAIL_BRAND.muted};font-weight:600;">Your code</p>
        <p style="margin:0;font-size:32px;letter-spacing:0.28em;font-weight:700;color:${EMAIL_BRAND.primaryDark};font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${escapeHtml(args.code)}</p>
      </div>`
    : "";

  const ctaBlock = args.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 8px;">
        <tr>
          <td style="border-radius:12px;background:${EMAIL_BRAND.primary};">
            <a href="${escapeHtml(args.cta.url)}" style="display:inline-block;padding:14px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;">
              ${escapeHtml(args.cta.label)}
            </a>
          </td>
        </tr>
      </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.bg};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BRAND.bg};padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${EMAIL_BRAND.card};border:1px solid ${EMAIL_BRAND.border};border-radius:20px;overflow:hidden;">
          <tr>
            <td style="padding:22px 28px;background:linear-gradient(135deg,${EMAIL_BRAND.primaryDark} 0%,${EMAIL_BRAND.primary} 100%);">
              <p style="margin:0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.78);font-weight:600;">Halal marriage</p>
              <p style="margin:6px 0 0;font-size:22px;line-height:1.25;color:#ffffff;font-weight:700;font-family:Georgia,'Times New Roman',serif;">${EMAIL_BRAND.name}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${EMAIL_BRAND.ink};font-weight:700;">${title}</h1>
              ${bodyHtml}
              ${args.extraHtml ?? ""}
              ${codeBlock}
              ${ctaBlock}
              ${footerNote}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 24px;border-top:1px solid ${EMAIL_BRAND.border};background:#fafcfb;">
              <p style="margin:0;font-size:13px;line-height:1.5;color:${EMAIL_BRAND.muted};">${EMAIL_BRAND.tagline}</p>
              <p style="margin:10px 0 0;font-size:12px;line-height:1.5;color:${EMAIL_BRAND.muted};">
                <a href="${escapeHtml(siteUrl)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;font-weight:600;">${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))}</a>
                &nbsp;·&nbsp;
                <a href="mailto:hello@helcalafkaaga.com" style="color:${EMAIL_BRAND.primary};text-decoration:none;">hello@helcalafkaaga.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
