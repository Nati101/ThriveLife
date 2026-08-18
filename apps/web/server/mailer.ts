/**
 * Local/dev mailer. Logs every message. Optionally sends via Resend when
 * RESEND_API_KEY is set. SMTP_URL is acknowledged but not a silent production send.
 */

export type MailMessage = {
  id: string;
  to: string;
  subject: string;
  text: string;
  kind: string;
  userKey: string;
};

export type MailResult = {
  provider: "log" | "resend" | "skipped";
  sent: boolean;
  error?: string;
};

export function mailerConfigured(): { resend: boolean; smtp: boolean } {
  return {
    resend: Boolean(process.env.RESEND_API_KEY?.trim()),
    smtp: Boolean(process.env.SMTP_URL?.trim()),
  };
}

export async function sendMail(message: MailMessage): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (key) {
    try {
      const from = process.env.MAIL_FROM?.trim() || "ThriveLife <noreply@localhost>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [message.to],
          subject: message.subject,
          text: message.text,
        }),
      });
      if (!res.ok) {
        const detail = await res.text();
        console.warn("[mailer:resend]", res.status, detail);
        console.info("[mailer:log]", message.kind, message.to, message.subject);
        return { provider: "resend", sent: false, error: `resend_${res.status}` };
      }
      return { provider: "resend", sent: true };
    } catch (error) {
      console.warn("[mailer:resend]", error);
      console.info("[mailer:log]", message.kind, message.to, message.subject);
      return {
        provider: "resend",
        sent: false,
        error: error instanceof Error ? error.message : "resend_error",
      };
    }
  }

  if (process.env.SMTP_URL?.trim()) {
    console.info(
      "[mailer:smtp] SMTP_URL is set but V1 has no SMTP client. Logging only — not pretending to send.",
      message.kind,
      message.to,
    );
  }

  console.info("[mailer:log]", JSON.stringify({
    kind: message.kind,
    to: message.to,
    subject: message.subject,
    userKey: message.userKey,
  }));
  return { provider: "log", sent: false };
}
