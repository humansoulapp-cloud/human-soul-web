import React from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bell,
  CalendarDays,
  CircleAlert,
  CreditCard,
  FileText,
  Lock,
  Minus,
  Radar,
  Users,
} from "lucide-react";
import { getDashboard, type Delta } from "@/lib/admin-dashboard";
import DashboardHeroChart from "@/components/admin/DashboardHeroChart";

const PERIODS = [7, 30, 90] as const;

function DeltaTag({ d, note }: { d: Delta; note: string }) {
  if (!d) return <span className="ad-dl-note" style={{ marginLeft: 0 }}>{note}</span>;
  const Icon = d.dir === "up" ? ArrowUp : d.dir === "down" ? ArrowDown : Minus;
  return (
    <>
      <span className={`ad-dl ${d.dir === "flat" ? "flat" : d.good ? "up" : "down"}`}>
        <Icon size={14} aria-hidden="true" />
        {d.text}
      </span>
      <span className="ad-dl-note">{note}</span>
    </>
  );
}

function Spark({ values }: { values: number[] }) {
  const w = 120, h = 32;
  const mx = Math.max(...values), mn = Math.min(...values);
  const y = (v: number) => h - 4 - ((v - mn) / (mx - mn || 1)) * (h - 8);
  const pts = values.map((v, i) => `${((i * (w - 8)) / (values.length - 1) + 4).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg className="ad-spark" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      <polyline points={pts} />
      <circle cx={w - 4} cy={y(values[values.length - 1])} r={3.5} />
    </svg>
  );
}

function Tile({ label, value, note, delta, deltaNote, spark }: { label: string; value: string; note: string; delta: Delta; deltaNote: string; spark?: number[] }) {
  return (
    <div className="ad-card ad-tile">
      <span className="ad-tile-l">{label}</span>
      <div className="ad-tile-row">
        <span className="ad-tile-v">{value}</span>
        {spark && spark.some((v) => v) ? <Spark values={spark} /> : null}
      </div>
      <span className="ad-tile-n">{note}</span>
      <span className="ad-tile-d">
        <DeltaTag d={delta} note={deltaNote} />
      </span>
    </div>
  );
}

function MiniCurve({ curve, worst }: { curve: number[]; worst: number }) {
  const bw = 14, gap = 4, h = 44;
  return (
    <svg viewBox={`0 0 ${curve.length * (bw + gap)} ${h}`} width={curve.length * (bw + gap)} height={h} aria-hidden="true" style={{ display: "block" }}>
      {curve.map((v, i) => {
        const bh = Math.max(3, (v / 100) * h);
        const x = i * (bw + gap), y = h - bh;
        return (
          <path
            key={i}
            className={`ad-mb${i === worst ? " warn" : ""}`}
            d={`M${x},${h} V${y + 4} Q${x},${y} ${x + 4},${y} H${x + bw - 4} Q${x + bw},${y} ${x + bw},${y + 4} V${h} Z`}
          >
            <title>{`Day ${i + 1}: ${v}% still writing`}</title>
          </path>
        );
      })}
    </svg>
  );
}

const num = (n: number) => n.toLocaleString("en-GB");
const orDash = (n: number | null, suffix = "%") => (n === null ? "—" : `${n}${suffix}`);

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ period?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const period = (PERIODS.find((p) => String(p) === params.period) ?? 7) as 7 | 30 | 90;
  const d = await getDashboard(period);
  const prevNote = `vs previous ${period} days`;

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Madrid" });
  const biggestFunnelDrop = d.funnel.reduce(
    (best, step, i) => (i && d.funnel[i - 1].n - step.n > best.loss ? { i, loss: d.funnel[i - 1].n - step.n } : best),
    { i: -1, loss: 0 }
  );
  const lostAtFirst = d.funnel[0].n ? Math.round(((d.funnel[0].n - d.funnel[1].n) / d.funnel[0].n) * 100) : 0;

  const attention = [
    d.quiet > 0 && {
      icon: Radar,
      warn: true,
      title: `${d.quiet} ${d.quiet === 1 ? "writer has" : "writers have"} gone quiet`,
      meta: "They wrote most weeks, then nothing for 7 days. Totals only — no names or entries.",
    },
    d.worstJourney && {
      icon: CircleAlert,
      warn: true,
      title: `Day ${d.worstJourney.worst + 1} of ${d.worstJourney.title} loses ${d.worstJourney.loss} points`,
      meta: "The biggest drop across live journeys.",
      href: `/admin/journeys/${d.worstJourney.id}`,
      action: `Edit day ${d.worstJourney.worst + 1}`,
    },
    d.noDays.length > 0 && {
      icon: CircleAlert,
      warn: true,
      title: `${d.noDays.length} ${d.noDays.length === 1 ? "journey has" : "journeys have"} no days yet`,
      meta: d.noDays.map((j) => j.title).join(", "),
      href: `/admin/journeys/${d.noDays[0].id}`,
      action: "Finish it",
    },
    d.scheduled.length > 0 && {
      icon: CalendarDays,
      title: `${d.scheduled.length} ${d.scheduled.length === 1 ? "journey" : "journeys"} scheduled to publish`,
      meta: d.scheduled
        .map((j) => `${j.title} on ${new Date(j.at).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`)
        .join(", "),
      href: "/admin/journeys?status=scheduled",
      action: "Check",
    },
    d.drafts.length > 0 && {
      icon: FileText,
      title: `${d.drafts.length} ${d.drafts.length === 1 ? "draft" : "drafts"} not published`,
      meta: d.drafts.map((j) => j.title).join(", "),
      href: "/admin/journeys?status=draft",
      action: "Review",
    },
  ].filter(Boolean) as { icon: typeof Radar; warn?: boolean; title: string; meta: string; href?: string; action?: string }[];

  return (
    <>
      <div className="ad-head">
        <div className="ad-head-t">
          <h1 className="text-h1" style={{ margin: 0 }}>
            Dashboard
          </h1>
          <span className="ad-sub">{today} · Are people finding a writing habit here?</span>
        </div>
        <nav className="ad-seg" aria-label="Period">
          {PERIODS.map((p) => (
            <Link key={p} href={`/admin?period=${p}`} aria-current={p === period ? "true" : undefined} scroll={false}>
              {p} days
            </Link>
          ))}
        </nav>
      </div>

      <div className="ad-top2">
        <section className="ad-card ad-hero" aria-labelledby="h-waw">
          <span className="ad-hero-l" id="h-waw">
            <Users size={16} aria-hidden="true" />
            Weekly active writers
          </span>
          <div className="ad-hero-v">
            <b>{num(d.waw)}</b>
            <DeltaTag d={d.wawDelta} note="vs previous 7 days" />
          </div>
          <span className="ad-hero-def">People who wrote at least once in the last 7 days.</span>
          <DashboardHeroChart series={d.wawSeries} />
        </section>
        <div className="ad-tiles">
          <Tile label="New sign-ups" value={num(d.signups)} note={`Last ${period} days`} delta={d.signupsDelta} deltaNote={prevNote} spark={d.signupSpark} />
          <Tile label="Activation" value={orDash(d.activation)} note="Wrote a first entry within 24 h" delta={d.activationDelta} deltaNote={prevNote} spark={d.activationSpark} />
          <Tile label="Coming back" value={orDash(d.back)} note="Weekly ÷ monthly writers" delta={d.backDelta} deltaNote="vs a week ago" spark={d.backSpark} />
          <Tile label="Journeys finished" value={orDash(d.finishedRate)} note="Of journeys started, reached the last day" delta={null} deltaNote={`${num(d.starts)} started, all time`} />
        </div>
      </div>

      <section className="ad-dsec" aria-labelledby="s-act">
        <div className="ad-dsec-h">
          <h2 className="text-h3" id="s-act">Activation &amp; retention</h2>
          <span className="ad-dsec-q">Do new people start writing, and do they come back?</span>
        </div>
        <div className="ad-g2">
          <div className="ad-card ad-pad">
            <div className="ad-card-h">
              <span className="ad-card-t">From sign-up to habit</span>
              <span className="ad-card-n">Signed up {d.funnelRange}</span>
            </div>
            {d.funnel[0].n ? (
              <>
                <ul className="ad-fns">
                  {d.funnel.map((s, i) => {
                    const p = Math.round((s.n / d.funnel[0].n) * 100);
                    const lost = i ? d.funnel[i - 1].n - s.n : 0;
                    const big = i === biggestFunnelDrop.i && lost > 0;
                    return (
                      <li key={s.label}>
                        <div className="ad-fn-top">
                          <span className="ad-fn-k">{s.label}</span>
                          {i && lost > 0 ? (
                            <span className={`ad-fn-drop${big ? " big" : ""}`}>
                              {big ? <CircleAlert size={14} aria-hidden="true" /> : null}−{lost} ({Math.round((lost / Math.max(1, d.funnel[i - 1].n)) * 100)}%)
                            </span>
                          ) : null}
                          <span className="ad-fn-v">
                            {s.n}
                            <span className="ad-fn-p">{p}%</span>
                          </span>
                        </div>
                        <div className="ad-track">
                          <span style={{ width: `${p}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {lostAtFirst >= 30 ? (
                  <div className="ad-callout">
                    <CircleAlert size={16} aria-hidden="true" className="ai" />
                    <span>{lostAtFirst}% of the people who sign up never write a first entry. The blank page is where most are lost.</span>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="ad-soft" style={{ margin: 0 }}>No sign-ups in that window yet.</p>
            )}
            <p className="ad-soft" style={{ margin: "14px 0 0" }}>Counts people who signed up two to {period === 7 ? "three" : period === 30 ? "six" : "fifteen"} weeks ago, so week 2 has happened for all of them.</p>
          </div>
          <div className="ad-card ad-pad">
            <div className="ad-card-h">
              <span className="ad-card-t">Still writing, by sign-up week</span>
              <span className="ad-card-n">% who wrote in that week</span>
            </div>
            <table className="ad-coh">
              <thead>
                <tr>
                  <th scope="col">Signed up</th>
                  <th scope="col">Week 1</th>
                  <th scope="col">Week 2</th>
                  <th scope="col">Week 4</th>
                  <th scope="col">Week 8</th>
                </tr>
              </thead>
              <tbody>
                {d.cohorts.map((c) => (
                  <tr key={c.label}>
                    <th scope="row">
                      {c.label}
                      <span className="c-n">{c.n} {c.n === 1 ? "person" : "people"}</span>
                    </th>
                    {c.cells.map((v, i) => (
                      <td key={i}>
                        {v === null ? (
                          <span className="ad-c empty">—</span>
                        ) : (
                          <span className="ad-c" style={{ background: `color-mix(in oklab, var(--primary) ${Math.round(10 + v * 0.75)}%, var(--card))` }}>
                            {v}%
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="ad-legend">
              <span>0%</span>
              <i />
              <span>100%</span>
              <span style={{ marginLeft: "auto" }}>— not reached yet</span>
            </div>
          </div>
        </div>
      </section>

      <section className="ad-dsec" aria-labelledby="s-j">
        <div className="ad-dsec-h">
          <h2 className="text-h3" id="s-j">Journeys</h2>
          <span className="ad-dsec-q">Do people finish them, and where do they stop?</span>
        </div>
        <div className="ad-card ad-pad">
          {d.journeyRows.length ? (
            <table className="ad-jt">
              <thead>
                <tr>
                  <th scope="col">Journey</th>
                  <th scope="col" className="num">Started</th>
                  <th scope="col" className="num">Finished</th>
                  <th scope="col">Still writing, day by day</th>
                  <th scope="col">Biggest drop</th>
                </tr>
              </thead>
              <tbody>
                {d.journeyRows.map((j) => (
                  <tr key={j.id}>
                    <th scope="row">
                      <Link href={`/admin/journeys/${j.id}`}>
                        <span className="ad-j-t">{j.title}</span>
                        <span className="ad-j-s">{j.days} days</span>
                      </Link>
                    </th>
                    <td className="num">{j.starts}</td>
                    <td className="num">
                      <b style={{ fontWeight: 600 }}>{orDash(j.finished)}</b>
                    </td>
                    <td>
                      <MiniCurve curve={j.curve} worst={j.worst} />
                    </td>
                    <td>
                      {j.worst > 0 ? (
                        <span className="ad-warn">
                          <CircleAlert size={14} aria-hidden="true" />
                          Day {j.worst + 1} · −{j.loss} pts
                        </span>
                      ) : (
                        <span className="ad-dash">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="ad-soft" style={{ margin: 0 }}>Nobody has started a journey yet.</p>
          )}
        </div>
      </section>

      <section className="ad-dsec" aria-labelledby="s-w">
        <div className="ad-dsec-h">
          <h2 className="text-h3" id="s-w">Writing</h2>
          <span className="ad-dsec-q">How much, when, and how often people write · last {period} days</span>
        </div>
        <div className="ad-g3">
          <div className="ad-card ad-pad">
            <div className="ad-card-h">
              <span className="ad-card-t">Last {period} days</span>
            </div>
            <div className="ad-stats">
              <div className="ad-stat"><span className="ad-stat-v">{num(d.writing.entries)}</span><span className="ad-stat-l">Entries written</span></div>
              <div className="ad-stat"><span className="ad-stat-v">{d.writing.perWriter.toFixed(1)}</span><span className="ad-stat-l">Entries per writer</span></div>
              <div className="ad-stat"><span className="ad-stat-v">{num(d.writing.words)}</span><span className="ad-stat-l">Words per entry</span></div>
              <div className="ad-stat"><span className="ad-stat-v">{orDash(d.writing.photo)}</span><span className="ad-stat-l">With a photo</span></div>
            </div>
            {d.writing.journeyShare !== null ? (
              <div className="ad-split">
                <div className="ad-split-bar" role="img" aria-label={`${d.writing.journeyShare}% from journeys, ${100 - d.writing.journeyShare}% free writing`}>
                  <span style={{ width: `${d.writing.journeyShare}%` }} />
                  <span style={{ width: `${100 - d.writing.journeyShare}%` }} />
                </div>
                <div className="ad-split-k">
                  <span><i className="ad-sw" style={{ background: "var(--primary)" }} /><b>{d.writing.journeyShare}%</b>From journeys</span>
                  <span><i className="ad-sw" style={{ background: "color-mix(in oklab, var(--primary) 40%, var(--card))" }} /><b>{100 - d.writing.journeyShare}%</b>Free writing</span>
                </div>
              </div>
            ) : null}
          </div>
          <div className="ad-card ad-pad">
            <div className="ad-card-h">
              <span className="ad-card-t">When people write</span>
              <span className="ad-card-n">Madrid time</span>
            </div>
            <div className="ad-heat" role="img" aria-label="Entries by weekday and time of day">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, di) => (
                <React.Fragment key={day}>
                  <span className="ad-hd">{day}</span>
                  {d.heat[di].map((v, bi) => (
                    <span
                      key={bi}
                      className="ad-hc"
                      title={`${day} ${bi * 3}–${bi * 3 + 3}h · ${v} ${v === 1 ? "entry" : "entries"}`}
                      style={{ background: `color-mix(in oklab, var(--primary) ${Math.round(6 + (v / d.heatMax) * 86)}%, var(--secondary))` }}
                    />
                  ))}
                </React.Fragment>
              ))}
              <span />
              {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
                <span key={h} className="ad-hb">{h}h</span>
              ))}
            </div>
            <div className="ad-legend">
              <span>Fewer</span>
              <i />
              <span>More</span>
            </div>
          </div>
          <div className="ad-card ad-pad">
            <div className="ad-card-h">
              <span className="ad-card-t">Writing streaks</span>
              <span className="ad-card-n">Writers, last 30 days</span>
            </div>
            <ul className="ad-sts">
              {d.streaks.map((s) => (
                <li key={s.label}>
                  <span className="ad-st-k">{s.label}</span>
                  <span className="ad-track"><span style={{ width: `${s.pct}%` }} /></span>
                  <span className="ad-st-v">{s.pct}%</span>
                </li>
              ))}
            </ul>
            {d.reminders.share !== null ? (
              <div className="ad-callout" style={{ marginTop: 22 }}>
                <Bell size={16} aria-hidden="true" className="ai" style={{ color: "var(--primary)" }} />
                <span>
                  {d.reminders.ratio && d.reminders.ratio >= 1.05
                    ? <>People with a reminder on write <b>{d.reminders.ratio.toFixed(1)}×</b> more often. </>
                    : null}
                  {d.reminders.share}% have one set.
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="ad-dsec" aria-labelledby="s-r">
        <div className="ad-dsec-h">
          <h2 className="text-h3" id="s-r">Plus</h2>
          <span className="ad-src">
            <CreditCard size={14} aria-hidden="true" />
            Members from profiles · revenue needs Stripe
          </span>
        </div>
        <div className="ad-rev">
          <div className="ad-card ad-tile">
            <span className="ad-tile-l">Plus members</span>
            <span className="ad-tile-v">{num(d.plus)}</span>
            <span className="ad-soft">{num(d.totalUsers)} accounts in total</span>
          </div>
          <div className="ad-card ad-tile">
            <span className="ad-tile-l">Free to Plus</span>
            <span className="ad-tile-v">{orDash(d.freeToPlus)}</span>
            <span className="ad-soft">Of all accounts</span>
          </div>
          {["Monthly revenue", "Cancelled"].map((k) => (
            <div key={k} className="ad-nt" style={{ gap: 6 }}>
              <span className="ad-nt-tag">
                <CreditCard size={14} aria-hidden="true" />
                Needs Stripe
              </span>
              <span className="ad-nt-t">{k}</span>
              <span className="ad-nt-d">Shows once payments are connected.</span>
            </div>
          ))}
        </div>
      </section>

      {attention.length ? (
        <section className="ad-dsec" aria-labelledby="s-a">
          <div className="ad-dsec-h">
            <h2 className="text-h3" id="s-a">Needs attention</h2>
          </div>
          <div className="ad-att">
            {attention.map((a) => (
              <div key={a.title} className="ad-att-row">
                <span className={`ad-att-ico${a.warn ? " w" : ""}`}>
                  <a.icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <div className="ad-att-t">{a.title}</div>
                  <div className="ad-att-m">{a.meta}</div>
                </div>
                {a.href ? (
                  <Link className="ad-att-a" href={a.href}>
                    {a.action}
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="ad-dsec" aria-labelledby="s-t">
        <div className="ad-dsec-h">
          <h2 className="text-h3" id="s-t">Coming with event tracking</h2>
          <span className="ad-dsec-q">Not measured yet — needs a small events table</span>
        </div>
        <div className="ad-g3">
          {[
            ["Opened without writing", "Daily app opens versus entries — shows people who visit but don't write."],
            ["Closed the blank page", "How often the writer opens and closes without saving — does the blank page intimidate?"],
            ["Where sign-ups come from", "Search, social, invites or press, to see which channel brings writers, not just sign-ups."],
          ].map(([t, desc]) => (
            <div key={t} className="ad-nt">
              <span className="ad-nt-tag">
                <Radar size={14} aria-hidden="true" />
                Needs tracking
              </span>
              <span className="ad-nt-t">{t}</span>
              <span className="ad-nt-d">{desc}</span>
              <div className="ad-nt-sk" />
            </div>
          ))}
        </div>
      </section>

      <p className="ad-priv">
        <Lock size={14} aria-hidden="true" />
        Only totals are shown here. Entries stay private and are never visible in Admin.
      </p>
    </>
  );
}
