"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { esc } from "@/lib/email/templates";

export type FeedbackKind = "problem" | "idea" | "feeling";

const KIND_LABEL: Record<FeedbackKind, string> = {
  problem: "Something didn't work",
  idea: "An idea",
  feeling: "How it feels",
};

/**
 * Beta feedback from inside the app. It arrives as an email to the team
 * (FEEDBACK_TO, or hello@humansoul.co), and replying goes straight to the
 * person who wrote it. Nothing is stored in the database.
 */
export async function sendFeedback(input: { kind: FeedbackKind; message: string; page?: string }): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "Sign in to send feedback." };

  const message = (input.message ?? "").trim().slice(0, 5000);
  if (message.length < 3) return { ok: false, error: "Write a few words first." };
  const kind: FeedbackKind = input.kind in KIND_LABEL ? input.kind : "feeling";
  const name = String(user.user_metadata?.display_name ?? "").trim();
  const page = (input.page ?? "").slice(0, 200);
  const from = name ? `${name} (${user.email})` : user.email;

  const text = `${KIND_LABEL[kind]}\nFrom: ${from}${page ? `\nPage: ${page}` : ""}\n\n${message}\n\nReply to this email to answer them.`;
  const html =
    `<div style="font:15px/1.6 -apple-system,Segoe UI,sans-serif;color:#1E1C19;max-width:560px">` +
    `<p style="margin:0 0 4px;font-weight:600">${esc(KIND_LABEL[kind])}</p>` +
    `<p style="margin:0 0 16px;color:#6A645B">From ${esc(from)}${page ? ` · ${esc(page)}` : ""}</p>` +
    `<p style="margin:0 0 16px;white-space:pre-wrap">${esc(message)}</p>` +
    `<p style="margin:0;color:#6A645B;font-size:13px">Reply to this email to answer them.</p></div>`;

  const res = await sendEmail({
    to: process.env.FEEDBACK_TO || "hello@humansoul.co",
    subject: `Beta feedback · ${KIND_LABEL[kind]}${name ? ` · ${name}` : ""}`,
    html,
    text,
    tag: "feedback",
    replyTo: user.email,
  });
  if (!res.ok) return { ok: false, error: "Couldn't send it right now. Try again in a moment, or write to hello@humansoul.co." };
  return { ok: true };
}
