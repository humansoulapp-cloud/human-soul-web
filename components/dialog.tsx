"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "@/app/dialog.css";

/**
 * App-styled replacements for window.confirm and window.alert.
 *
 *   if (!(await askConfirm({ title: "Delete this reflection?", confirm: "Delete", tone: "danger" }))) return;
 *   await showNotice({ title: "Something went wrong", body: message });
 *
 * <DialogHost /> is mounted once in the root layout and renders whichever is open.
 */

type Request = {
  kind: "confirm" | "notice";
  title: string;
  body?: React.ReactNode;
  confirm?: string;
  cancel?: string;
  tone?: "default" | "danger";
  resolve: (ok: boolean) => void;
};

let push: ((r: Request) => void) | null = null;

export function askConfirm(opts: { title: string; body?: React.ReactNode; confirm?: string; cancel?: string; tone?: "default" | "danger" }) {
  return new Promise<boolean>((resolve) => {
    if (!push) return resolve(typeof window !== "undefined" ? window.confirm(opts.title) : false);
    push({ kind: "confirm", ...opts, resolve });
  });
}

export function showNotice(opts: { title: string; body?: React.ReactNode; confirm?: string }) {
  return new Promise<void>((resolve) => {
    if (!push) {
      if (typeof window !== "undefined") window.alert(opts.title);
      return resolve();
    }
    push({ kind: "notice", ...opts, resolve: () => resolve() });
  });
}

export function DialogHost() {
  const [queue, setQueue] = useState<Request[]>([]);
  const [mounted, setMounted] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const current = queue[0];

  useEffect(() => {
    setMounted(true);
    push = (r) => setQueue((q) => [...q, r]);
    return () => {
      push = null;
    };
  }, []);

  const close = useCallback(
    (ok: boolean) => {
      if (!current) return;
      current.resolve(ok);
      setQueue((q) => q.slice(1));
      returnFocus.current?.focus?.();
    },
    [current]
  );

  useEffect(() => {
    if (!current) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => {
      // Destructive actions start on Cancel so Enter never deletes by accident.
      const target = card.current?.querySelector<HTMLButtonElement>(current.tone === "danger" ? "[data-cancel]" : "[data-ok]");
      target?.focus();
    }, 10);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(false);
      }
      if (e.key === "Tab" && card.current) {
        const items = Array.from(card.current.querySelectorAll<HTMLButtonElement>("button"));
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [current, close]);

  if (!mounted || !current) return null;

  return createPortal(
    <div className="hsd" onMouseDown={(e) => e.target === e.currentTarget && close(false)}>
      <div
        ref={card}
        className="hsd-card"
        role={current.kind === "confirm" ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby="hsd-t"
        aria-describedby={current.body ? "hsd-b" : undefined}
      >
        <h2 id="hsd-t" className="hsd-t">
          {current.title}
        </h2>
        {current.body ? (
          <div id="hsd-b" className="hsd-b">
            {current.body}
          </div>
        ) : null}
        <div className="hsd-acts">
          {current.kind === "confirm" ? (
            <button type="button" className="hsd-btn ghost" data-cancel onClick={() => close(false)}>
              {current.cancel ?? "Cancel"}
            </button>
          ) : null}
          <button type="button" className={`hsd-btn ${current.tone === "danger" ? "danger" : "pri"}`} data-ok onClick={() => close(true)}>
            {current.confirm ?? (current.kind === "notice" ? "OK" : "Continue")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
