"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Check } from "lucide-react";

export default function SubscriptionPage() {
  return (
    <div className="space-y-8 max-w-xl mx-auto">
      {/* Back button */}
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to profile</span>
      </Link>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-[var(--brand-primary)]/20 flex items-center justify-center text-[var(--brand-primary)] mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="font-serif-editorial text-4xl text-[var(--text-primary)]">
          The Human Soul Premium
        </h1>
        <p className="text-sm text-[var(--text-secondary)] font-light max-w-sm mx-auto">
          Support a distraction-free space and unlock all advanced features.
        </p>
      </div>

      {/* Pricing Card */}
      <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-3xl p-8 space-y-6 shadow-sm">
        <div className="text-center space-y-1">
          <span className="text-xs uppercase tracking-widest text-[var(--text-secondary)]">
            Monthly Plan
          </span>
          <div className="font-serif-editorial text-5xl text-[var(--text-primary)] font-normal">
            $4.99 <span className="text-sm font-sans text-[var(--text-secondary)]">/ month</span>
          </div>
          <p className="text-xs text-[var(--brand-primary)] font-medium pt-1">
            Cancel anytime
          </p>
        </div>

        <ul className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
          {[
            "Unlimited access to all Guided Journeys",
            "Unlimited reflections with photo attachments",
            "Secure cloud sync with Supabase",
            "No ads or distracting elements",
          ].map((benefit, i) => (
            <li key={i} className="flex items-center gap-3 text-xs text-[var(--text-primary)]">
              <div className="w-5 h-5 rounded-full bg-[var(--brand-primary)]/20 flex items-center justify-center text-[var(--brand-primary)] flex-shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => alert("Payment feature available at final MVP launch.")}
          className="w-full py-3.5 px-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--bg-surface)] text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          Subscribe to Premium
        </button>
      </div>
    </div>
  );
}
