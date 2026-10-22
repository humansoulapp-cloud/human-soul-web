import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/legal";

export const metadata: Metadata = {
  title: "Privacy Policy · HumanSoul",
  description: "What HumanSoul keeps, why, and what we never do with your writing.",
};

const CONTACT = "humansoul.app@gmail.com";

export default function PrivacyPage() {
  return (
    <LegalPage
      current="privacy"
      title="Privacy Policy"
      updated="October 22, 2026"
      summary={[
        "What you write is private to you. Other members never see it.",
        "We never sell your data, show you ads, or use your writing to train AI.",
        "You can download everything you wrote, or delete your account, from Profile at any time.",
      ]}
      sections={[
        {
          id: "who",
          title: "Who we are",
          body: (
            <>
              <p>
                HumanSoul is a guided reflection and journaling app at humansoul.co. This policy explains what information we
                collect when you use it, how we use it, and the choices you have. If anything here is unclear, write to us at{" "}
                <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
              </p>
            </>
          ),
        },
        {
          id: "collect",
          title: "What we collect",
          body: (
            <>
              <h3>Information you give us</h3>
              <ul>
                <li><b>Account details:</b> your name, email address and password (stored only as a secure hash).</li>
                <li><b>Your writing:</b> journal entries, journey reflections, the journals you create, favorites and any photos you add.</li>
                <li><b>Preferences:</b> an optional alias, your time zone, reminder time, appearance and what you told us during setup, such as what brings you here.</li>
              </ul>
              <h3>Information created as you use HumanSoul</h3>
              <ul>
                <li><b>Progress:</b> which journeys you started and which days you wrote, so the next day can open.</li>
                <li><b>Technical data:</b> basic logs such as browser type, device and IP address, kept by our hosting providers to run the service securely.</li>
              </ul>
              <p>We don't use advertising trackers, and we don't buy information about you from anyone.</p>
            </>
          ),
        },
        {
          id: "use",
          title: "How we use it",
          body: (
            <>
              <ul>
                <li>To run your account and show your writing back to you, on any device you sign in from.</li>
                <li>To open journey days in order and suggest journeys that fit what you told us.</li>
                <li>To send the emails you ask for, such as a reminder to write, and essential account emails like password resets.</li>
                <li>To keep HumanSoul secure, fix problems and understand, in aggregate, which parts of the app are used.</li>
              </ul>
              <p>
                <b>We never read your entries</b> except when you ask us to help with a specific problem and give us permission, or when
                the law requires it. We never use your writing to train artificial intelligence, and we never sell or rent your data.
              </p>
            </>
          ),
        },
        {
          id: "share",
          title: "Who we share it with",
          body: (
            <>
              <p>We share information only with the providers that help us run HumanSoul, and only what they need:</p>
              <ul>
                <li><b>Supabase</b> stores your account and your writing in a secured database.</li>
                <li><b>Vercel</b> hosts the website and app.</li>
                <li><b>Payments:</b> when paid plans open, card details go directly to our payment processor, Stripe. We never see or store your full card number.</li>
                <li><b>Email:</b> a provider that delivers the emails you ask for.</li>
              </ul>
              <p>
                These providers process data on our behalf under their own security and privacy commitments. We may also disclose
                information if the law requires it, or to protect the safety of a person. If HumanSoul is ever sold or merged, we will tell
                you before your information moves under a different policy.
              </p>
            </>
          ),
        },
        {
          id: "keep",
          title: "How long we keep it",
          body: (
            <p>
              We keep your account and writing for as long as you have an account. When you delete your account from Profile, your
              entries, journals and preferences are deleted from our live systems right away, and from backups within 30 days. We may keep a
              small amount of information longer when the law requires it, such as payment records.
            </p>
          ),
        },
        {
          id: "choices",
          title: "Your choices and rights",
          body: (
            <>
              <ul>
                <li><b>See and download</b> everything you wrote from <Link href="/profile">Profile</Link>, as one file.</li>
                <li><b>Correct</b> your name, alias and time zone in Profile at any time.</li>
                <li><b>Turn off</b> reminders and other emails in Profile.</li>
                <li><b>Delete</b> your account and everything in it from Profile.</li>
              </ul>
              <p>
                Depending on where you live, for example in the European Union, the United Kingdom or California, you may have further rights,
                such as to object to certain uses or to complain to your local data protection authority. Write to{" "}
                <a href={`mailto:${CONTACT}`}>{CONTACT}</a> and we will answer within 30 days.
              </p>
            </>
          ),
        },
        {
          id: "security",
          title: "Security",
          body: (
            <p>
              Your connection to HumanSoul is encrypted, data is encrypted at rest by our database provider, and access rules make sure each
              account can only read its own writing. No system is perfectly secure, so please use a password you don't use anywhere else.
            </p>
          ),
        },
        {
          id: "children",
          title: "Children",
          body: (
            <p>
              HumanSoul is meant for adults. You must be at least 16 to create an account. If you believe a younger person has signed up,
              tell us and we will delete the account.
            </p>
          ),
        },
        {
          id: "transfers",
          title: "International transfers",
          body: (
            <p>
              Our providers may store and process information in the United States and other countries. Where the law requires it, these
              transfers are protected by safeguards such as standard contractual clauses.
            </p>
          ),
        },
        {
          id: "changes",
          title: "Changes to this policy",
          body: (
            <p>
              If we change this policy in a way that matters, we will tell you by email or in the app before the change takes effect. The date
              at the top always shows the latest version.
            </p>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          body: (
            <p>
              Questions, requests or concerns: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. See also our{" "}
              <Link href="/terms">Terms of Service</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
