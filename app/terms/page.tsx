import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/legal";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The agreement between you and HumanSoul when you use the app.",
};

const CONTACT = "humansoul.app@gmail.com";

export default function TermsPage() {
  const month = PLANS.find((p) => p.key === "month")!;
  const year = PLANS.find((p) => p.key === "year")!;
  return (
    <LegalPage
      current="terms"
      title="Terms of Service"
      updated="October 22, 2026"
      summary={[
        "HumanSoul is a reflection and journaling space. It is not therapy or medical care.",
        "What you write stays yours. We only store it so we can show it back to you.",
        "Plus renews until you cancel, and you can cancel any time from your account.",
      ]}
      sections={[
        {
          id: "agreement",
          title: "The agreement",
          body: (
            <p>
              These terms are an agreement between you and HumanSoul for the use of humansoul.co and the HumanSoul app. By creating an
              account you accept them, together with our <Link href="/privacy">Privacy Policy</Link>. If you don't agree, please don't use
              HumanSoul.
            </p>
          ),
        },
        {
          id: "not-therapy",
          title: "Not therapy or medical care",
          body: (
            <>
              <p>
                HumanSoul offers guided reflections and a private journal. It is <b>not therapy, counseling, mental health treatment or a
                substitute for professional care</b>, and nothing in the app is medical or psychological advice.
              </p>
              <p>
                If you are in crisis or thinking about harming yourself, contact your local emergency number or a crisis line in your country
                right away.
              </p>
            </>
          ),
        },
        {
          id: "account",
          title: "Your account",
          body: (
            <ul>
              <li>You must be at least 16 years old to create an account.</li>
              <li>Give accurate details and keep your password to yourself. You're responsible for what happens under your account.</li>
              <li>Tell us right away at <a href={`mailto:${CONTACT}`}>{CONTACT}</a> if you think someone else has accessed it.</li>
            </ul>
          ),
        },
        {
          id: "content",
          title: "Your writing",
          body: (
            <>
              <p>
                <b>You own everything you write in HumanSoul.</b> You give us only the limited permission we need to store it, keep it in
                sync across your devices and show it back to you. We don't publish it, share it with other members or use it to train
                artificial intelligence.
              </p>
              <p>You can download your writing or delete it, together with your account, from Profile at any time.</p>
            </>
          ),
        },
        {
          id: "ours",
          title: "Our content",
          body: (
            <p>
              Journeys, readings, prompts, images and the design of HumanSoul belong to us or to those who license them to us. You may use
              them for your own personal reflection. Please don't copy, resell or republish them without our written permission.
            </p>
          ),
        },
        {
          id: "plus",
          title: "Plans, trials and payments",
          body: (
            <>
              <p>
                HumanSoul has a free plan and a paid plan, HumanSoul Plus, at {month.price} a month or {year.price} a year (US dollars).
                Prices and what each plan includes are shown in the app before you pay, and taxes may apply where you live.
              </p>
              <ul>
                <li><b>Free trial:</b> when offered, a trial is free for its stated length. We email you before it ends, and you're charged only if you don't cancel before then.</li>
                <li><b>Renewal:</b> Plus renews automatically at the end of each month or year until you cancel.</li>
                <li><b>Cancelling:</b> cancel any time from your account. You keep Plus until the end of the period you paid for.</li>
                <li><b>Refunds:</b> payments are not refundable except where the law requires it. If something went wrong, write to us and we'll look at it fairly.</li>
                <li><b>Price changes:</b> we'll tell you at least 30 days before a new price applies to you, so you can cancel first.</li>
              </ul>
              <p>Payments are handled by our payment processor, Stripe, under its own terms.</p>
            </>
          ),
        },
        {
          id: "use",
          title: "Acceptable use",
          body: (
            <>
              <p>Please don't:</p>
              <ul>
                <li>break the law using HumanSoul, or use it to harm or harass anyone;</li>
                <li>try to access other people's accounts or data, or get around the way days and plans open;</li>
                <li>interfere with the service, overload it, or scrape it with automated tools.</li>
              </ul>
              <p>We may suspend or close an account that breaks these rules. Where we can, we'll tell you first and give you a chance to download your writing.</p>
            </>
          ),
        },
        {
          id: "changes",
          title: "Changes to HumanSoul and to these terms",
          body: (
            <p>
              HumanSoul will keep changing: we add journeys and features, and sometimes retire them. If we change these terms in a way that
              matters, we'll tell you by email or in the app before the change takes effect. If you keep using HumanSoul after that, the new
              terms apply.
            </p>
          ),
        },
        {
          id: "ending",
          title: "Ending the agreement",
          body: (
            <p>
              You can stop using HumanSoul and delete your account at any time from Profile. If we ever shut HumanSoul down, we'll give you at
              least 30 days' notice so you can download what you wrote, and refund any time you've paid for but can't use.
            </p>
          ),
        },
        {
          id: "liability",
          title: "Warranties and liability",
          body: (
            <p>
              We work hard to keep HumanSoul available and your writing safe, but the service is provided “as is”, without warranties of any
              kind beyond those the law requires. To the extent the law allows, HumanSoul isn't liable for indirect or consequential losses,
              and our total liability to you is limited to what you paid us in the 12 months before the claim. Nothing in these terms limits
              rights you have under consumer law that can't be limited.
            </p>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          body: (
            <p>
              Questions about these terms: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
