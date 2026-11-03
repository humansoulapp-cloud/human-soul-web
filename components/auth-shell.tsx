"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, Check, Compass, Eye, EyeOff, Sun } from "lucide-react";
import { Logo } from "@/components/ds";
import "@/app/auth.css";

export const QUOTE_IMAGE = "/landing/final.jpg";
export const SIGN_UP_IMAGE = "/auth/sign-up.jpg";

/**
 * Auth layout (Design System v2): a centred form on the left and a photo panel
 * on the right. Below 1024px only the form shows.
 */
export function AuthShell({
  children,
  panel,
  image,
}: {
  children: React.ReactNode;
  panel: React.ReactNode;
  image: string;
}) {
  return (
    <main className="au">
      {/* One centred column: the logo sits with the form it belongs to. */}
      <div className="au-side">
        <div className="au-form">
          <Link href="/" className="au-logo" aria-label="HumanSoul home">
            <Logo size={28} />
          </Link>
          {children}
        </div>
      </div>
      <aside className="au-ph" aria-hidden="true">
        <img src={image} alt="" />
        <div className="au-ph-in">{panel}</div>
      </aside>
    </main>
  );
}

export function QuotePanel() {
  return (
    <>
      <p className="au-q">“Most of life unfolds in ordinary moments that rarely seem important while they are happening.”</p>
      <div className="au-q-src">
        <Compass size={16} className="ai" aria-hidden="true" />
        From a HumanSoul journey
      </div>
    </>
  );
}

export function BenefitsPanel() {
  return (
    <>
      <h2 className="au-ph-h">A quiet place to notice yourself</h2>
      <ul className="au-ben">
        <li>
          <i>
            <Sun size={18} aria-hidden="true" />
          </i>
          A question each day, one day at a time
        </li>
        <li>
          <i>
            <Compass size={18} aria-hidden="true" />
          </i>
          Guided journeys at your own pace
        </li>
        <li>
          <i>
            <BookOpen size={18} aria-hidden="true" />
          </i>
          A private journal, kept and searchable
        </li>
      </ul>
    </>
  );
}

export function Field({
  label,
  action,
  children,
  hint,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <label className="au-f">
      <span className="au-lab">
        {label}
        {action}
      </span>
      {children}
      {hint}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span className="au-in">
      <input {...props} />
    </span>
  );
}

export function PasswordInput(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [show, setShow] = useState(false);
  return (
    <span className="au-in pw">
      <input {...props} type={show ? "text" : "password"} />
      <button
        type="button"
        className="au-eye"
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        onClick={() => setShow((v) => !v)}
      >
        {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </span>
  );
}

/** Four bars and a word; nothing until the person starts typing. */
export function Strength({ password }: { password: string }) {
  if (!password) return null;
  const level = password.length < 8 ? 1 : password.length < 10 ? 2 : password.length < 13 ? 3 : 4;
  const label = ["", "Too short", "Fine", "Good password", "Strong password"][level];
  return (
    <span className="au-str" aria-live="polite">
      <span className={`au-str-t${level < 2 ? " weak" : ""}`} aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={i <= level ? "on" : ""} />
        ))}
      </span>
      {label}
    </span>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} aria-label={label} className="au-ck" onClick={() => onChange(!checked)}>
      <Check size={14} strokeWidth={3} aria-hidden="true" />
    </button>
  );
}

export function AuthError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="au-err" role="alert">
      {children}
    </div>
  );
}
