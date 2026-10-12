"use client";

import { useState } from "react";

/** Weekly active writers, 12 weeks: line + wash, crosshair and tooltip on hover. */
export default function DashboardHeroChart({ series }: { series: { label: string; count: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 600, H = 210, pl = 36, pr = 56, pt = 12, pb = 28;
  const max = Math.max(4, ...series.map((s) => s.count));
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / step) * step;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(top * f));
  const X = (i: number) => pl + (i * (W - pl - pr)) / Math.max(1, series.length - 1);
  const Y = (v: number) => pt + (1 - v / top) * (H - pt - pb);
  const pts = series.map((s, i) => `${X(i).toFixed(1)},${Y(s.count).toFixed(1)}`).join(" ");
  const last = series.length - 1;
  const area = `M${X(0)},${Y(0)} L${pts.replace(/ /g, " L")} L${X(last)},${Y(0)} Z`;
  const h = hover;

  return (
    <div className="ad-chart-box">
      <svg
        className="ad-chart"
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`Weekly active writers over the last ${series.length} weeks, from ${series[0]?.count ?? 0} to ${series[last]?.count ?? 0}`}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line className="g" x1={pl} x2={W - pr + 8} y1={Y(v)} y2={Y(v)} />
            <text className="tk" x={pl - 10} y={Y(v) + 4} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        <path className="area" d={area} />
        <polyline className="line" points={pts} />
        {[0, 4, 8, last].map((i) =>
          series[i] ? (
            <text key={i} className="tk" x={X(i)} y={H - 6} textAnchor="middle">
              {series[i].label}
            </text>
          ) : null
        )}
        {h !== null ? (
          <>
            <line className="cross" x1={X(h)} x2={X(h)} y1={pt} y2={Y(0)} />
            <circle className="dot" cx={X(h)} cy={Y(series[h].count)} r={5} />
          </>
        ) : null}
        <circle className="dot" cx={X(last)} cy={Y(series[last]?.count ?? 0)} r={5} />
        <text className="endl" x={X(last) + 10} y={Y(series[last]?.count ?? 0) + 4}>
          {series[last]?.count ?? 0}
        </text>
        {series.map((_, i) => (
          <rect
            key={i}
            className="hit"
            x={X(i) - (W - pl - pr) / (2 * Math.max(1, last))}
            y={0}
            width={(W - pl - pr) / Math.max(1, last)}
            height={H}
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>
      {h !== null ? (
        <div className="ad-tt" style={{ left: `${(X(h) / W) * 100}%`, top: `${(Y(series[h].count) / H) * 100}%` }}>
          <span className="ad-tt-k">Week of {series[h].label}</span>
          <span className="ad-tt-v">
            {series[h].count} {series[h].count === 1 ? "writer" : "writers"}
          </span>
          {h > 0 && series[h - 1].count ? (
            <span className="ad-tt-n">
              {(() => {
                const d = Math.round(((series[h].count - series[h - 1].count) / series[h - 1].count) * 100);
                return `${d > 0 ? "+" : d < 0 ? "−" : "±"}${Math.abs(d)}% on the week before`;
              })()}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
