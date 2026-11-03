/**
 * HumanSoul emails, as plain HTML strings with inline styles so they render the
 * same in every mail client. Designs live in the canvas, page "Emails".
 *
 * Fonts: Hedvig Letters Serif and Instrument Sans load where the client allows it; others
 * fall back to Georgia and the system sans.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://humansoul.co").replace(/\/$/, "");

const C = {
  page: "#E9E4DB",
  card: "#FFFFFF",
  soft: "#F4F1EB",
  ink: "#1E1C19",
  body: "#4A453F",
  muted: "#8A847A",
  mid: "#6A645B",
  green: "#4F6E55",
  greenSoft: "#E8EFE7",
  greenInk: "#3B5641",
};
const SERIF = `'Hedvig Letters Serif', Georgia, 'Times New Roman', serif`;
const SANS = `'Instrument Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`;

export function esc(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function absolute(url: string | null | undefined) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

const over = (text: string) =>
  `<div style="font:600 12px/16px ${SANS};letter-spacing:.08em;text-transform:uppercase;color:${C.green}">${esc(text)}</div>`;
const h1 = (text: string) =>
  `<h1 style="margin:10px 0 0;font:400 32px/38px ${SERIF};letter-spacing:-.015em;color:${C.ink}">${esc(text)}</h1>`;
const p = (html: string) => `<p style="margin:16px 0 0;font:400 16px/26px ${SANS};color:${C.body}">${html}</p>`;
const small = (html: string) => `<p style="margin:24px 0 0;font:400 14px/22px ${SANS};color:${C.muted}">${html}</p>`;
const b = (text: string) => `<strong style="color:${C.ink};font-weight:600">${esc(text)}</strong>`;
const link = (href: string, text: string) => `<a href="${esc(href)}" style="color:${C.green}">${esc(text)}</a>`;

function button(href: string, label: string, secondary?: { href: string; label: string }) {
  const second = secondary
    ? `<td style="padding-left:16px"><a href="${esc(secondary.href)}" style="font:600 15px/20px ${SANS};color:${C.green};text-decoration:none">${esc(secondary.label)}</a></td>`
    : "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px"><tr>
<td style="border-radius:9999px;background:${C.green}"><a href="${esc(href)}" style="display:inline-block;padding:15px 28px;font:600 16px/20px ${SANS};color:#FFFFFF;text-decoration:none;border-radius:9999px">${esc(label)}</a></td>${second}
</tr></table>`;
}

function journeyRow(image: string | null, title: string, meta: string) {
  const img = image
    ? `<td width="96" style="padding-right:16px"><img src="${esc(image)}" width="96" height="72" alt="" style="display:block;width:96px;height:72px;border-radius:12px;object-fit:cover"></td>`
    : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:${C.soft};border-radius:18px"><tr><td style="padding:14px">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>${img}<td>
<div style="font:500 18px/24px ${SERIF};color:${C.ink}">${esc(title)}</div>
<div style="margin-top:2px;font:400 14px/20px ${SANS};color:${C.mid}">${esc(meta)}</div>
</td></tr></table></td></tr></table>`;
}

function layout({ preheader, hero, body, footer }: { preheader: string; hero?: string | null; body: string; footer: string }) {
  const heroImg = hero
    ? `<tr><td style="padding-top:28px"><img src="${esc(hero)}" width="600" alt="" style="display:block;width:100%;max-width:600px;height:240px;object-fit:cover"></td></tr>`
    : "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light">
<link href="https://fonts.googleapis.com/css2?family=Hedvig+Letters+Serif:opsz@12..24&family=Instrument+Sans:wght@400;600&display=swap" rel="stylesheet">
<title>HumanSoul</title></head>
<body style="margin:0;padding:0;background:${C.page}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page}"><tr><td align="center" style="padding:32px 16px 48px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${C.card};border-radius:24px;overflow:hidden">
<tr><td style="padding:32px 40px 0;font-size:22px;line-height:1;color:${C.ink};white-space:nowrap"><span style="font-family:${SANS};font-weight:500;letter-spacing:-.04em">Human</span><span style="font-family:'Hedvig Letters Serif',Georgia,'Times New Roman',serif;font-weight:400;font-size:22.6px;letter-spacing:-.03em;margin-left:1px;color:#617D65">Soul</span></td></tr>
${heroImg}
<tr><td style="padding:32px 40px 40px">${body}</td></tr>
<tr><td style="padding:24px 40px 32px;background:${C.soft};font:400 13px/20px ${SANS};color:${C.muted}">${footer}</td></tr>
</table></td></tr></table></body></html>`;
}

const productFooter = (why: string) =>
  `${why}<div style="margin-top:8px"><a href="${SITE_URL}/profile#reminders" style="color:${C.mid}">Email settings</a> · <a href="${SITE_URL}/profile#reminders" style="color:${C.mid}">Unsubscribe</a> · <a href="${SITE_URL}/privacy" style="color:${C.mid}">Privacy</a></div><div style="margin-top:8px">HumanSoul · humansoul.co</div>`;

export type Email = { subject: string; html: string; text: string };

// ─── 4 · Welcome ────────────────────────────────────────────────────────────
export function welcomeEmail({ name, journey }: { name: string; journey: { id: string; title: string; image: string | null } | null }): Email {
  const greet = name ? `Hi ${esc(name)}, thank you` : "Thank you";
  const begin = journey ? `${SITE_URL}/journeys/${journey.id}?day=1` : `${SITE_URL}/dashboard`;
  const step = (n: number, title: string, text: string) =>
    `<tr><td width="42" valign="top" style="padding:7px 0"><div style="width:28px;height:28px;border-radius:9999px;background:${C.greenSoft};color:${C.greenInk};font:600 13px/28px ${SANS};text-align:center">${n}</div></td>
<td style="padding:7px 0;font:400 15px/23px ${SANS};color:${C.body}"><strong style="display:block;color:${C.ink};font-weight:600">${title}</strong>${text}</td></tr>`;
  const body =
    over("Welcome") +
    h1("A quiet place is ready for you") +
    p(`${greet} for being here. HumanSoul is a place to slow down and notice yourself, a little at a time.`) +
    (journey ? journeyRow(journey.image, journey.title, "Your first journey · Day 1 is open") : "") +
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px">${step(1, "Read, then write", "Each day has a short reading and one question.")}${step(2, "One day at a time", "The next day opens the morning after you write.")}${step(3, "Write freely too", "Your Journal is always there, for whatever comes to mind.")}</table>` +
    button(begin, journey ? "Begin Day 1" : "Open HumanSoul");
  return {
    subject: name ? `Welcome to HumanSoul, ${name}` : "Welcome to HumanSoul",
    html: layout({ preheader: journey ? `Day 1 of ${journey.title} is open.` : "Your space is ready.", hero: journey?.image, body, footer: productFooter("You're getting this because you created a HumanSoul account.") }),
    text: `${name ? `Hi ${name}, thank` : "Thank"} you for being here.\n\n${journey ? `Your first journey: ${journey.title}. Day 1 is open.\n\n` : ""}Begin: ${begin}\n\nHumanSoul · humansoul.co`,
  };
}

// ─── 5 · Daily reminder ─────────────────────────────────────────────────────
export function reminderEmail({
  journey,
  day,
  total,
  title,
  question,
  hour,
}: {
  journey: { id: string; title: string; image: string | null };
  day: number;
  total: number;
  title: string;
  question: string | null;
  hour: string;
}): Email {
  const href = `${SITE_URL}/journeys/${journey.id}?day=${day}`;
  const quote = question
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:${C.soft};border-radius:18px"><tr><td style="padding:20px 22px;font:400 18px/28px ${SERIF};color:${C.ink}">“${esc(question)}”<div style="margin-top:8px;font:500 13px/18px ${SANS};color:${C.muted}">Today's question</div></td></tr></table>`
    : "";
  const body = over(`${journey.title} · Day ${day} of ${total}`) + h1(title || `Day ${day}`) + quote + button(href, `Open Day ${day}`);
  return {
    subject: `Day ${day} is open`,
    html: layout({
      preheader: `${journey.title} · Day ${day} of ${total}.`,
      hero: journey.image,
      body,
      footer: productFooter(
        `You get this at ${esc(hour)} because you asked for a reminder. <a href="${SITE_URL}/profile#reminders" style="color:${C.mid}">Change the time</a> or <a href="${SITE_URL}/profile#reminders" style="color:${C.mid}">turn it off</a>.`
      ),
    }),
    text: `${journey.title} · Day ${day} of ${total}\n${title}\n\n${question ? `“${question}”\n\n` : ""}Open Day ${day}: ${href}\n\nChange or turn off reminders: ${SITE_URL}/profile#reminders`,
  };
}

// ─── 6 · Journey finished ───────────────────────────────────────────────────
export function finishedEmail({
  journey,
  days,
  words,
  span,
  next,
}: {
  journey: { id: string; title: string; image: string | null };
  days: number;
  words: number;
  span: number;
  next: { id: string; title: string; image: string | null; days: number } | null;
}): Email {
  const stat = (v: string, l: string) =>
    `<td width="33%" style="padding:0 6px"><div style="padding:16px 18px;border-radius:18px;background:${C.soft}"><div style="font:400 28px/34px ${SERIF};color:${C.ink}">${v}</div><div style="font:400 13px/18px ${SANS};color:${C.mid}">${l}</div></div></td>`;
  const body =
    over("Journey complete") +
    h1(`You finished ${journey.title}`) +
    p("One question at a time, all the way through. That's not small. Everything you wrote is kept in your Journal, ready to read again.") +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px -6px 0;width:calc(100% + 12px)"><tr>${stat(String(days), "days written")}${stat(words.toLocaleString("en-US"), "words")}${stat(String(span), span === 1 ? "day, start to end" : "days, start to end")}</tr></table>` +
    (next ? p("When you're ready, there's more to explore.") + journeyRow(next.image, next.title, `Suggested next · ${next.days} days`) : "") +
    button(next ? `${SITE_URL}/journeys/${next.id}` : `${SITE_URL}/journeys`, "Choose your next journey", { href: `${SITE_URL}/journal`, label: "Read what you wrote" });
  return {
    subject: `You finished ${journey.title}`,
    html: layout({ preheader: "Every day, written. Here's what's next.", hero: journey.image, body, footer: productFooter("You're getting this because you finished a journey on HumanSoul.") }),
    text: `You finished ${journey.title}.\n${days} days written · ${words} words.\n\nChoose your next journey: ${SITE_URL}/journeys\nRead what you wrote: ${SITE_URL}/journal`,
  };
}

// ─── 7 · Waitlist: your place is ready ──────────────────────────────────────
export function placeReadyEmail({ email }: { email: string }): Email {
  const href = `${SITE_URL}/sign-up`;
  const body =
    over("Private beta") +
    h1("Your place is ready") +
    p(`Thank you for waiting. You can now create your HumanSoul account with ${b(email)}.`) +
    p("It takes a minute. Then we'll help you choose your first journey.") +
    button(href, "Create my account") +
    small(`Use this same email when you sign up. Questions? Just reply, or write to ${link("mailto:hello@humansoul.co", "hello@humansoul.co")}.`);
  return {
    subject: "Your place at HumanSoul is ready",
    html: layout({ preheader: "Thanks for waiting. You can create your account now.", hero: absolute("/auth/sign-up.jpg"), body, footer: productFooter("You're getting this because you joined the HumanSoul waitlist.") }),
    text: `Your place is ready. Create your account with ${email}: ${href}`,
  };
}

// ─── 1 to 3 · Account emails, pasted into Supabase (Authentication, Emails) ──
// Supabase fills {{ .ConfirmationURL }}, {{ .Email }} and {{ .NewEmail }}.
const accountFooter = `You got this email because someone used this address on HumanSoul.<div style="margin-top:8px">HumanSoul · <a href="${SITE_URL}" style="color:${C.mid}">humansoul.co</a> · <a href="${SITE_URL}/privacy" style="color:${C.mid}">Privacy</a></div>`;

export const SUPABASE_TEMPLATES = {
  confirm_signup: {
    subject: "Confirm your email",
    html: layout({
      preheader: "One tap and your account is ready.",
      body:
        over("Welcome") +
        h1("Confirm your email") +
        p("One tap and your HumanSoul account is ready. Then we'll help you choose where to begin.") +
        button("{{ .ConfirmationURL }}", "Confirm my email") +
        small("This link works for 24 hours. If you didn't create an account, you can ignore this email."),
      footer: accountFooter,
    }),
  },
  reset_password: {
    subject: "Choose a new password",
    html: layout({
      preheader: "The link works for one hour.",
      body:
        over("Password reset") +
        h1("Choose a new password") +
        p(`Someone asked to reset the password for <strong style="color:${C.ink};font-weight:600">{{ .Email }}</strong>. If it was you, choose a new one below.`) +
        button("{{ .ConfirmationURL }}", "Choose a new password") +
        small("The link works for one hour. If you didn't ask for this, ignore this email. Your password stays the same and nothing you wrote is affected."),
      footer: accountFooter,
    }),
  },
  change_email: {
    subject: "Confirm your new email",
    html: layout({
      preheader: "You asked to change the email on your account.",
      body:
        over("Account") +
        h1("Confirm your new email") +
        p(`You asked to change the email on your HumanSoul account from <strong style="color:${C.ink};font-weight:600">{{ .Email }}</strong> to <strong style="color:${C.ink};font-weight:600">{{ .NewEmail }}</strong>.`) +
        button("{{ .ConfirmationURL }}", "Confirm the change") +
        small(`Until you confirm, you keep signing in with your current email. If you didn't ask for this, ignore this email and ${link("mailto:hello@humansoul.co", "let us know")}.`),
      footer: accountFooter,
    }),
  },
};
