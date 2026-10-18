"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS: [string, string][] = [
  [
    "What kinds of topics does HumanSoul explore?",
    "HumanSoul journeys explore a wide range of human experiences, including identity, relationships, emotions, childhood, boundaries, choices, money, meaning, and much more.",
  ],
  [
    "Do I need to complete a journey in seven days?",
    "No. Each journey contains seven reflections, but there's no deadline to finish. The next reflection becomes available when you complete the previous one, so you can move through a journey at your own pace.",
  ],
  [
    "Is HumanSoul a self-improvement program?",
    "No. HumanSoul isn't here to tell you what to change or who you should become. It's a space to explore your experiences, develop self-awareness, and decide for yourself what that awareness means.",
  ],
  [
    "Is HumanSoul therapy?",
    "No. HumanSoul is a guided reflection and journaling experience. It isn't therapy, mental health treatment, or a substitute for professional care.",
  ],
  [
    "Is my writing private?",
    "Your journal entries are private by default and aren't shared with other HumanSoul members. You can learn more about how your information is handled in our Privacy Policy.",
  ],
  [
    "Can I cancel my membership?",
    "Yes. You can cancel your paid membership at any time through your account settings.",
  ],
  [
    "Will new journeys be added?",
    "Yes. The HumanSoul Library will continue to grow, with new journeys exploring different questions, themes, and aspects of the human experience.",
  ],
];

export default function LandingFaq() {
  const [open, setOpen] = useState(0);

  return (
    <div className="faq">
      {FAQS.map(([q, a], i) => {
        const isOpen = open === i;
        return (
          <div className="q" key={q} data-open={isOpen} data-reveal="" style={{ ["--d" as string]: i }}>
            <button
              type="button"
              className="q-h"
              aria-expanded={isOpen}
              aria-controls={`faq-${i}`}
              onClick={() => setOpen(isOpen ? -1 : i)}
            >
              {q}
              <ChevronDown className="ai" size={20} aria-hidden="true" />
            </button>
            <div className="q-b" id={`faq-${i}`} role="region" aria-hidden={!isOpen}>
              <div>
                <p>{a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
