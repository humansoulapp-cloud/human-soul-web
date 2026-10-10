/**
 * HumanSoul Design System v2 — React components.
 *
 * Markup and class names mirror the Claude Design system (HumanSoul -
 * Design System v2) so the styles in `app/ds.css` apply 1:1. Icons come
 * from lucide-react, which is the same Lucide set the design uses.
 */
import React from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Compass,
  Heart,
  Layers,
  Loader2,
  Sparkles,
  Tag,
  type LucideIcon,
} from "lucide-react";

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function Icon({ icon: I, size = 20, className }: { icon: LucideIcon; size?: number; className?: string }) {
  return <I className={cx("hs-icon", className)} width={size} height={size} strokeWidth={2} aria-hidden="true" />;
}

/* ── Logo ─────────────────────────────────────────────────────── */
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <span className="hs hs-logo" style={{ fontSize: size }} aria-label="HumanSoul">
      <span className="hs-logo-human">Human</span>
      <span className="hs-logo-soul">Soul</span>
    </span>
  );
}

/* ── Avatar ───────────────────────────────────────────────────── */
export function Avatar({ name, small = true }: { name?: string; small?: boolean }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <span className={cx("hs hs-avatar", small && "hs-avatar-sm")} role="img" aria-label={name || "Profile"}>
      {initial}
    </span>
  );
}

/* ── Button ───────────────────────────────────────────────────── */
type ButtonVariant = "default" | "secondary" | "ghost" | "destructive" | "link";
type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
  href?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  "aria-label"?: string;
};

export function Button({
  variant = "default",
  size = "md",
  icon,
  loading,
  disabled,
  full,
  href,
  type = "button",
  onClick,
  className,
  children,
  ...rest
}: ButtonProps) {
  const cls = cx(
    "hs hs-focusable hs-btn",
    `hs-btn-${variant}`,
    size === "sm" && "hs-btn-sm",
    size === "lg" && "hs-btn-lg",
    size === "icon" && "hs-btn-icon",
    full && "hs-btn-full",
    className
  );
  const lead = loading ? <Icon icon={Loader2} size={16} className="hs-spin" /> : icon ? <Icon icon={icon} size={18} /> : null;

  if (href && !disabled) {
    return (
      <Link href={href} className={cls} aria-label={rest["aria-label"]}>
        {lead}
        {children}
      </Link>
    );
  }
  return (
    <button
      type={type}
      className={cls}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading ? "true" : undefined}
      aria-label={rest["aria-label"]}
    >
      {lead}
      {children}
    </button>
  );
}

/* ── Chip ─────────────────────────────────────────────────────── */
export function Chip({
  selected,
  icon,
  onClick,
  href,
  children,
}: {
  selected?: boolean;
  icon?: LucideIcon;
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
}) {
  const content = (
    <>
      {icon ? <Icon icon={icon} size={14} /> : null}
      {children}
    </>
  );
  if (href) {
    return (
      <Link href={href} className="hs hs-focusable hs-chip" aria-current={selected ? "true" : undefined} aria-pressed={selected ? "true" : "false"}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className="hs hs-focusable hs-chip" aria-pressed={selected ? "true" : "false"} onClick={onClick}>
      {content}
    </button>
  );
}

/* ── Badge ────────────────────────────────────────────────────── */
export function Badge({
  variant = "neutral",
  icon,
  children,
}: {
  variant?: "neutral" | "primary" | "outline" | "success" | "warning" | "info" | "destructive";
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <span className={cx("hs hs-badge", `hs-badge-${variant}`)}>
      {icon ? <Icon icon={icon} size={14} /> : null}
      {children}
    </span>
  );
}

/* ── Inputs ───────────────────────────────────────────────────── */
export function Input({
  icon,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: LucideIcon }) {
  return (
    <div className={cx("hs hs-input-wrap", className)}>
      {icon ? <Icon icon={icon} size={18} className="hs-lead" /> : null}
      <input className={cx("hs-control", icon && "hs-has-lead")} type={props.type || "text"} {...props} />
    </div>
  );
}

export function Textarea({
  writing,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { writing?: boolean }) {
  return (
    <textarea
      className={cx("hs hs-control hs-textarea", writing && "hs-textarea-writing", className)}
      rows={props.rows ?? 5}
      {...props}
    />
  );
}

export function Select({
  options,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  return (
    <div className={cx("hs hs-select-wrap", className)}>
      <select className="hs-control hs-select" {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon icon={ChevronDown} size={18} className="hs-trail" />
    </div>
  );
}

/* ── Card ─────────────────────────────────────────────────────── */
export function Card({
  interactive,
  flat,
  className,
  style,
  children,
}: {
  interactive?: boolean;
  flat?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div className={cx("hs hs-card", interactive && "hs-card-interactive", flat && "hs-card-flat", className)} style={style}>
      {children}
    </div>
  );
}

/* ── SegmentProgress ─────────────────────────────────────────── */
export function SegmentProgress({
  total = 7,
  done = 0,
  current,
  width = 168,
  label,
}: {
  total?: number;
  done?: number;
  current?: number;
  width?: number | string;
  label?: string;
}) {
  return (
    <span
      className="hs hs-segs"
      style={{ width }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    >
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <span key={n} className={cx("hs-seg", n <= done && "hs-seg-done", n === current && n > done && "hs-seg-now")} />
      ))}
    </span>
  );
}

/* ── ReflectionCard ──────────────────────────────────────────── */
export function ReflectionCard({
  href,
  date,
  title,
  text,
  tags,
  photo,
  favorite,
  onToggleFavorite,
}: {
  href: string;
  date: string;
  title: string;
  text: string;
  tags?: string[];
  photo?: string | null;
  favorite?: boolean;
  onToggleFavorite?: () => void;
}) {
  return (
    <div className="hs hs-card hs-reflection">
      <div className="hs-reflection-head">
        <span className="hs-meta">
          <Icon icon={Calendar} size={16} />
          {date}
        </span>
        {onToggleFavorite ? (
          <button
            type="button"
            className="hs-focusable hs-fav"
            aria-pressed={favorite ? "true" : "false"}
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
            onClick={onToggleFavorite}
          >
            <Heart width={20} height={20} strokeWidth={2} fill={favorite ? "currentColor" : "none"} aria-hidden="true" />
          </button>
        ) : favorite ? (
          <span className="hs-fav" aria-label="In favorites" role="img" style={{ color: "var(--destructive)" }}>
            <Heart width={20} height={20} strokeWidth={2} fill="currentColor" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      {photo ? (
        <div className="hs-reflection-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="Attached photo" />
        </div>
      ) : null}
      <div>
        <Link href={href} className="hs-focusable hs-rf-title">
          {title}
        </Link>
        <p className="hs-reflection-text hs-rf-body">{text}</p>
      </div>
      {tags && tags.length ? (
        <div className="hs-tags">
          {tags.map((t) => (
            <Badge key={t} variant="outline" icon={Tag}>
              {t}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ── JourneyCard ─────────────────────────────────────────────── */
export function JourneyCard({
  href,
  image,
  category,
  title,
  tagline,
  days,
  time,
  featured,
  premium,
  cta = "Begin",
}: {
  href: string;
  image?: string | null;
  category?: string | null;
  title: string;
  tagline?: string | null;
  days: number;
  time?: string | null;
  featured?: boolean | null;
  premium?: boolean | null;
  cta?: string;
}) {
  return (
    <Link href={href} className="hs hs-card hs-card-interactive hs-journey hs-focusable" style={{ color: "var(--foreground)", textDecoration: "none" }}>
      <div className="hs-journey-media">
        {image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={image} alt="" loading="lazy" />
        ) : (
          <Icon icon={Compass} size={40} />
        )}
        {featured || premium ? (
          <div className="hs-journey-badges">
            {featured ? (
              <Badge variant="primary" icon={Sparkles}>
                Featured
              </Badge>
            ) : null}
            {premium ? <Badge variant="warning">Premium</Badge> : null}
          </div>
        ) : null}
      </div>
      <div className="hs-journey-body">
        {category ? <p className="text-overline hs-overline">{category}</p> : null}
        <h3 className="text-h3" style={{ margin: 0 }}>
          {title}
        </h3>
        {tagline ? <p className="text-body-sm hs-clamp-2 hs-muted">{tagline}</p> : null}
        <div className="hs-journey-foot">
          <span className="hs-meta">
            <Icon icon={Layers} size={16} />
            {days} days{time ? <span> · {time}</span> : null}
          </span>
          <span className="text-label" style={{ color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: 4 }}>
            {cta}
            <Icon icon={ChevronRight} size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── EmptyState ──────────────────────────────────────────────── */
export function EmptyState({
  icon,
  title,
  description,
  actions,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="hs hs-empty">
      <div className="hs-empty-icon">
        <Icon icon={icon} size={28} />
      </div>
      <h3 className="text-h3" style={{ margin: 0 }}>
        {title}
      </h3>
      {description ? <p className="hs-empty-text">{description}</p> : null}
      {actions ? <div className="hs-empty-actions">{actions}</div> : null}
    </div>
  );
}
