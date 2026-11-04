/**
 * Sends one email through Resend's HTTP API. Server only: it reads
 * RESEND_API_KEY, which must never reach the browser.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  tag,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
  tag?: string;
  /** Where replies go, e.g. the person who sent feedback. */
  replyTo?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY is not set" };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "HumanSoul <hello@humansoul.co>",
      to: [to],
      subject,
      html,
      text,
      ...(tag ? { tags: [{ name: "type", value: tag }] } : {}),
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok || !data.id) return { ok: false, error: data.message || `Resend answered ${res.status}` };
  return { ok: true, id: data.id };
}
