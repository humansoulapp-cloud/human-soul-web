import Link from "next/link";
import "@/app/legal.css";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

const Wordmark = () => (
  <span>
    <span style={{ fontFamily: "var(--hs-font-wordmark)", fontWeight: 500 }}>Human</span>
    <span style={{ fontFamily: "var(--hs-font-wordmark-serif)" }}>Soul</span>
  </span>
);

export default function LegalPage({
  current,
  title,
  updated,
  summary,
  sections,
}: {
  current: "privacy" | "terms";
  title: string;
  updated: string;
  summary: string[];
  sections: LegalSection[];
}) {
  return (
    <div className="lg">
      <header className="lg-bar">
        <div className="lg-in">
          <Link className="lg-logo" href="/" aria-label="HumanSoul home">
            <Wordmark />
          </Link>
          <nav className="lg-nav" aria-label="Legal">
            <Link href="/privacy" aria-current={current === "privacy" ? "page" : undefined}>
              Privacy
            </Link>
            <Link href="/terms" aria-current={current === "terms" ? "page" : undefined}>
              Terms
            </Link>
          </nav>
        </div>
      </header>
      <div className="lg-wrap">
        <nav className="lg-toc" aria-label="On this page">
          <span>On this page</span>
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.title}
            </a>
          ))}
        </nav>
        <article className="lg-doc">
          <div className="lg-over">Legal</div>
          <h1 className="lg-h1">{title}</h1>
          <p className="lg-meta">Last updated {updated}</p>
          <div className="lg-sum">
            <h2>The short version</h2>
            <ul>
              {summary.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          {sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`}>
              <h2 className="lg-h2" id={`${s.id}-h`}>
                {s.title}
              </h2>
              {s.body}
            </section>
          ))}
        </article>
      </div>
      <footer className="lg-foot">
        <span>© {new Date().getFullYear()} HumanSoul</span>
        <Link href="/">Home</Link>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms of Service</Link>
        <a href="mailto:humansoul.app@gmail.com">Contact</a>
      </footer>
    </div>
  );
}
