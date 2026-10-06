/* @ds-bundle: {"format":4,"namespace":"HumanSoul","components":[{"name":"Logo"},{"name":"Icon"},{"name":"Button"},{"name":"Field"},{"name":"Input"},{"name":"Textarea"},{"name":"Select"},{"name":"Checkbox"},{"name":"Switch"},{"name":"Chip"},{"name":"Badge"},{"name":"Card"},{"name":"Alert"},{"name":"Tabs"},{"name":"Dialog"},{"name":"Sheet"},{"name":"Skeleton"},{"name":"EmptyState"},{"name":"ErrorState"},{"name":"Sidebar"},{"name":"BottomNav"},{"name":"DataList"},{"name":"ReflectionCard"},{"name":"CuadernoCard"},{"name":"JourneyCard"},{"name":"Stat"},{"name":"Avatar"},{"name":"PageHeader"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;
  var cx = function () { return Array.prototype.slice.call(arguments).filter(Boolean).join(" "); };

  /* ── Iconos (trazos de lucide, 24×24) ── */
  var P = {
    plus: ["M5 12h14", "M12 5v14"],
    x: ["M18 6 6 18", "m6 6 12 12"],
    check: ["M20 6 9 17l-5-5"],
    search: ["M21 21l-4.3-4.3", { c: [11, 11, 8] }],
    heart: ["M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"],
    home: ["m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
    book: ["M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z", "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"],
    compass: ["m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z", { c: [12, 12, 10] }],
    user: ["M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", { c: [12, 7, 4] }],
    moon: ["M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"],
    sun: ["M12 2v2", "M12 20v2", "m4.93 4.93 1.41 1.41", "m17.66 17.66 1.41 1.41", "M2 12h2", "M20 12h2", "m6.34 17.66-1.41 1.41", "m19.07 4.93-1.41 1.41", { c: [12, 12, 4] }],
    logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9"],
    trash: ["M3 6h18", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"],
    chevronRight: ["m9 18 6-6-6-6"],
    chevronDown: ["m6 9 6 6 6-6"],
    arrowLeft: ["m12 19-7-7 7-7", "M19 12H5"],
    arrowUpRight: ["M7 7h10v10", "M7 17 17 7"],
    calendar: ["M16 2v4", "M8 2v4", "M3 10h18", { r: [3, 4, 18, 18, 2] }],
    tag: ["M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z", { c: [7.5, 7.5, 0.5] }],
    pen: ["M12 20h9", "M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"],
    alert: ["M12 8v4", "M12 16h.01", { c: [12, 12, 10] }],
    info: ["M12 16v-4", "M12 8h.01", { c: [12, 12, 10] }],
    checkCircle: ["m9 12 2 2 4-4", { c: [12, 12, 10] }],
    loader: ["M21 12a9 9 0 1 1-6.219-8.56"],
    camera: ["M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z", { c: [12, 13, 3] }],
    shield: ["M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"],
    clock: ["M12 6v6l4 2", { c: [12, 12, 10] }],
    menu: ["M4 12h16", "M4 6h16", "M4 18h16"],
    layers: ["m12 2 10 5-10 5L2 7z", "m2 17 10 5 10-5", "m2 12 10 5 10-5"],
    archive: ["M3 4h18v4H3z", "M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8", "M10 12h4"],
    send: ["m22 2-7 20-4-9-9-4z", "M22 2 11 13"],
    users: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", { c: [9, 7, 4] }, "M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
    eye: ["M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z", { c: [12, 12, 3] }],
    wifiOff: ["M2 2l20 20", "M8.5 16.5a5 5 0 0 1 7 0", "M2 8.82a15 15 0 0 1 4.17-2.65", "M10.66 5c4.01-.36 8.14.9 11.34 3.76", "M12 20h.01"],
    sparkles: ["M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z", "M19 17v4", "M17 19h4"]
  };
  function Icon(p) {
    var size = p.size || 20, d = P[p.name] || [];
    return h("svg", { className: cx("hs-icon", p.className, p.spin && "hs-spin"), width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: p.stroke || 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": p.label ? undefined : "true", role: p.label ? "img" : undefined, "aria-label": p.label },
      d.map(function (s, i) {
        if (typeof s === "string") return h("path", { key: i, d: s });
        if (s.c) return h("circle", { key: i, cx: s.c[0], cy: s.c[1], r: s.c[2] });
        return h("rect", { key: i, x: s.r[0], y: s.r[1], width: s.r[2], height: s.r[3], rx: s.r[4] });
      }));
  }

  /* ── Logo ── */
  function Logo(p) {
    return h("span", { className: cx("hs hs-logo", p.className), style: { fontSize: p.size || 28 }, "aria-label": "HumanSoul" },
      h("span", { className: "hs-logo-human" }, "Human"), h("span", { className: "hs-logo-soul" }, "Soul"));
  }

  /* ── Button ── */
  function Button(p) {
    var variant = p.variant || "default", size = p.size || "md";
    var disabled = p.disabled || p.state === "disabled";
    var cls = cx("hs hs-focusable hs-btn", "hs-btn-" + variant, size === "sm" && "hs-btn-sm", size === "lg" && "hs-btn-lg", (size === "icon" || size === "icon-sm") && "hs-btn-icon", size === "icon-sm" && "hs-btn-sm", size === "fab" && "hs-btn-fab", p.full && "hs-btn-full", p.className);
    var Tag = p.href ? "a" : "button";
    var props = { className: cls, "data-state": p.state, "aria-busy": p.loading ? "true" : undefined, "aria-label": p["aria-label"], onClick: p.onClick };
    if (p.href) props.href = p.href; else { props.type = p.type || "button"; props.disabled = disabled || p.loading; }
    return h(Tag, props, p.loading ? h(Icon, { name: "loader", size: 16, spin: true }) : p.icon ? h(Icon, { name: p.icon, size: 18 }) : null, p.children);
  }

  /* ── Field / Input / Textarea / Select ── */
  var uid = 0;
  function useId(given) { var r = React.useRef(); if (!r.current) r.current = given || "hs-" + (++uid); return given || r.current; }
  function Field(p) {
    var id = useId(p.id);
    var child = React.Children.only(p.children);
    var describedBy = [p.hint && id + "-hint", p.error && id + "-error"].filter(Boolean).join(" ") || undefined;
    var control = React.cloneElement(child, { id: id, "aria-describedby": describedBy, "aria-invalid": p.error ? "true" : undefined, required: p.required });
    return h("div", { className: cx("hs hs-field", p.className) },
      p.label ? h("label", { className: "hs-label", htmlFor: id }, p.label, p.optional ? h("span", { className: "hs-label-opt" }, " (opcional)") : null) : null,
      control,
      p.hint && !p.error ? h("span", { id: id + "-hint", className: "hs-hint" }, p.hint) : null,
      p.error ? h("span", { id: id + "-error", className: "hs-error", role: "alert" }, h(Icon, { name: "alert", size: 16 }), p.error) : null);
  }
  function Input(p) {
    var q = Object.assign({}, p); delete q.icon; delete q.state; delete q.className;
    return h("div", { className: "hs hs-input-wrap" },
      p.icon ? h(Icon, { name: p.icon, size: 18, className: "hs-lead" }) : null,
      h("input", Object.assign({ className: cx("hs-control", p.icon && "hs-has-lead", p.className), "data-state": p.state, type: p.type || "text" }, q)));
  }
  function Textarea(p) {
    var q = Object.assign({}, p); delete q.state; delete q.className;
    return h("textarea", Object.assign({ className: cx("hs hs-control hs-textarea", p.className), "data-state": p.state, rows: p.rows || 5 }, q));
  }
  function Select(p) {
    var q = Object.assign({}, p); delete q.state; delete q.className; delete q.options;
    return h("div", { className: "hs hs-select-wrap" },
      h("select", Object.assign({ className: cx("hs-control", p.className), "data-state": p.state }, q),
        (p.options || []).map(function (o) { return h("option", { key: o.value, value: o.value }, o.label); })),
      h(Icon, { name: "chevronDown", size: 18, className: "hs-trail" }));
  }

  /* ── Checkbox / Switch ── */
  function Checkbox(p) {
    return h("label", { className: cx("hs hs-check", p.className), "data-state": p.state },
      h("input", { type: "checkbox", checked: p.checked, defaultChecked: p.defaultChecked, disabled: p.disabled || p.state === "disabled", onChange: p.onChange }),
      h("span", { className: "hs-check-box" }, h(Icon, { name: "check", size: 14, stroke: 3 })), p.children);
  }
  function Switch(p) {
    return h("label", { className: cx("hs hs-check", p.className), "data-state": p.state },
      h("input", { type: "checkbox", role: "switch", checked: p.checked, defaultChecked: p.defaultChecked, disabled: p.disabled || p.state === "disabled", onChange: p.onChange }),
      h("span", { className: "hs-switch" }), p.children);
  }

  /* ── Chip / Badge ── */
  function Chip(p) {
    return h("button", { type: "button", className: cx("hs hs-focusable hs-chip", p.className), "aria-pressed": p.selected ? "true" : "false", disabled: p.disabled || p.state === "disabled", "data-state": p.state, onClick: p.onClick },
      p.icon ? h(Icon, { name: p.icon, size: 14 }) : null, p.children);
  }
  function Badge(p) {
    return h("span", { className: cx("hs hs-badge", "hs-badge-" + (p.variant || "neutral"), p.className) }, p.icon ? h(Icon, { name: p.icon, size: 12 }) : null, p.children);
  }

  /* ── Card ── */
  function Card(p) {
    var Tag = p.as || "div";
    return h(Tag, { className: cx("hs hs-card", p.interactive && "hs-card-interactive", p.variant === "flat" && "hs-card-flat", p.variant === "dashed" && "hs-card-dashed", p.className), "data-state": p.state, style: p.style, href: p.href, onClick: p.onClick }, p.children);
  }

  /* ── Alert ── */
  var ALERT_ICON = { info: "info", success: "checkCircle", warning: "alert", destructive: "alert" };
  function Alert(p) {
    var v = p.variant || "info";
    return h("div", { className: cx("hs hs-alert", "hs-alert-" + v, p.className), role: v === "destructive" ? "alert" : "status" },
      h(Icon, { name: ALERT_ICON[v], size: 20 }),
      h("div", { className: "hs-alert-body" }, p.title ? h("span", { className: "hs-alert-title" }, p.title) : null, p.children),
      p.action || null);
  }

  /* ── Tabs ── */
  function Tabs(p) {
    var items = p.items || [];
    return h("div", { className: cx("hs hs-tabs", p.variant === "underline" && "hs-tabs-underline", p.className), role: "tablist" },
      items.map(function (t) {
        return h("button", { key: t.value, type: "button", role: "tab", className: "hs-focusable hs-tab", "aria-selected": t.value === p.value ? "true" : "false", "data-state": t.state, onClick: function () { p.onChange && p.onChange(t.value); } },
          t.icon ? h(Icon, { name: t.icon, size: 16 }) : null, t.label, t.count != null ? h("span", { className: "hs-tab-count" }, t.count) : null);
      }));
  }

  /* ── Dialog / Sheet ── */
  function Panel(p, sheet) {
    return h("div", { className: cx("hs hs-dialog", sheet && "hs-sheet", p.className), role: "dialog", "aria-modal": "true", "aria-label": p.title },
      sheet ? h("div", { className: "hs-sheet-handle" }) : null,
      h(Button, { variant: "ghost", size: "icon-sm", icon: "x", className: "hs-dialog-close", "aria-label": "Cerrar", onClick: p.onClose }),
      h("div", null, h("h3", { className: "text-h3 hs-dialog-title" }, p.title), p.description ? h("p", { className: "hs-dialog-desc" }, p.description) : null),
      p.children,
      p.footer ? h("div", { className: "hs-dialog-footer" }, p.footer) : null);
  }
  function Dialog(p) { return Panel(p, false); }
  function Sheet(p) { return Panel(p, true); }

  /* ── Skeleton ── */
  function Skeleton(p) {
    return h("div", { className: cx("hs hs-skeleton", p.className), style: Object.assign({ width: p.width || "100%", height: p.height || 16, borderRadius: p.circle ? "9999px" : undefined }, p.style), "aria-hidden": "true" });
  }

  /* ── EmptyState / ErrorState ── */
  function EmptyState(p) {
    return h("div", { className: cx("hs hs-empty", p.error && "hs-empty-error", p.className) },
      h("div", { className: "hs-empty-icon" }, h(Icon, { name: p.icon || "book", size: 28 })),
      h("h3", { className: "text-h3", style: { margin: 0 } }, p.title),
      p.description ? h("p", { className: "hs-empty-text" }, p.description) : null,
      p.children,
      p.actions ? h("div", { className: "hs-empty-actions" }, p.actions) : null);
  }
  function ErrorState(p) {
    return h(EmptyState, { error: true, icon: p.icon || "alert", title: p.title || "No hemos podido cargar esto", description: p.description || "Revisa tu conexión e inténtalo de nuevo. Tus reflexiones siguen a salvo.", className: p.className,
      actions: h(Button, { variant: "outline", icon: "loader", onClick: p.onRetry }, p.retryLabel || "Reintentar") });
  }

  /* ── Navegación ── */
  function Sidebar(p) {
    return h("aside", { className: cx("hs hs-sidebar", p.className), "aria-label": "Navegación principal" },
      h("div", { className: "hs-sidebar-logo" }, h(Logo, { size: 28 })),
      h("nav", { className: "hs-sidebar-nav" },
        (p.items || []).map(function (it) {
          return h("a", { key: it.href, href: it.href, className: cx("hs-focusable hs-nav-item", it.admin && "hs-nav-item-admin"), "aria-current": it.href === p.active ? "page" : undefined, "data-state": it.state },
            h(Icon, { name: it.icon, size: 20 }), it.label);
        })),
      h("div", { className: "hs-sidebar-foot" },
        p.writeLabel ? h(Button, { icon: "pen", full: true, href: p.writeHref || "/journal/new" }, p.writeLabel) : null,
        h("button", { type: "button", className: "hs-focusable hs-nav-item", onClick: p.onToggleTheme }, h(Icon, { name: p.dark ? "sun" : "moon", size: 20 }), p.dark ? "Modo claro" : "Modo oscuro"),
        h("button", { type: "button", className: "hs-focusable hs-nav-item", onClick: p.onSignOut }, h(Icon, { name: "logout", size: 20 }), "Cerrar sesión")));
  }
  function BottomNav(p) {
    return h("nav", { className: cx("hs hs-bottomnav", p.className), "aria-label": "Navegación principal" },
      (p.items || []).map(function (it) {
        return h("a", { key: it.href, href: it.href, className: "hs-focusable hs-bottomnav-item", "aria-current": it.href === p.active ? "page" : undefined, "data-state": it.state },
          h(Icon, { name: it.icon, size: 22 }), it.label);
      }));
  }

  /* ── DataList: tabla (≥640px) o tarjetas (<640px) ── */
  function DataList(p) {
    var cols = p.columns || [], rows = p.rows || [];
    return h("div", { className: cx("hs hs-datalist", p.className) },
      h("div", { className: "hs-table-wrap" },
        h("table", { className: "hs-table" },
          h("thead", null, h("tr", null, cols.map(function (c) { return h("th", { key: c.key, scope: "col", style: { textAlign: c.align } }, c.label); }))),
          h("tbody", null, rows.map(function (r, i) {
            return h("tr", { key: r.id || i }, cols.map(function (c) { return h("td", { key: c.key, style: { textAlign: c.align } }, r[c.key]); }));
          })))),
      h("div", { className: "hs-records" },
        rows.map(function (r, i) {
          var main = cols.filter(function (c) { return !c.action; });
          var act = cols.filter(function (c) { return c.action; })[0];
          return h(Card, { key: r.id || i, className: "hs-record" },
            main.map(function (c) { return h("div", { key: c.key, className: "hs-record-row" }, h("span", { className: "hs-record-key" }, c.label), h("span", null, r[c.key])); }),
            act ? h("div", { className: "hs-record-actions" }, r[act.key]) : null);
        })));
  }

  /* ── Tarjetas de dominio ── */
  function fmtDate(d) { return d; }
  function ReflectionCard(p) {
    return h(Card, { className: cx("hs-reflection", p.className) },
      h("div", { className: "hs-reflection-head" },
        h("span", { className: "hs-meta" }, h(Icon, { name: "calendar", size: 16 }), p.date),
        h("button", { type: "button", className: "hs-focusable hs-fav", "aria-pressed": p.favorite ? "true" : "false", "aria-label": p.favorite ? "Quitar de favoritas" : "Marcar como favorita", "data-state": p.state, onClick: p.onToggleFavorite },
          h(Icon, { name: "heart", size: 20, className: null }), null)),
      p.photo ? h("div", { className: "hs-reflection-photo" }, h("img", { src: p.photo, alt: p.photoAlt || "Foto adjunta" })) : null,
      h("p", { className: "hs-reflection-text" }, p.children),
      p.tags && p.tags.length ? h("div", { className: "hs-tags" }, p.tags.map(function (t) { return h(Badge, { key: t, variant: "outline", icon: "tag" }, t); })) : null);
  }
  function CuadernoCard(p) {
    return h(Card, { className: cx("hs-cuaderno", p.className), interactive: true, state: p.state },
      h("div", null,
        h("div", { className: "hs-cuaderno-top" },
          h(Badge, { variant: "neutral", icon: "layers" }, p.count + (p.count === 1 ? " reflexión" : " reflexiones")),
          p.confirmingDelete
            ? h("span", { className: "hs-confirm" }, h(Button, { variant: "destructive", size: "sm", onClick: p.onConfirmDelete }, "Eliminar"), h(Button, { variant: "ghost", size: "icon-sm", icon: "x", "aria-label": "Cancelar", onClick: p.onCancelDelete }))
            : h(Button, { variant: "ghost", size: "icon-sm", icon: "trash", "aria-label": "Eliminar cuaderno", onClick: p.onDelete })),
        h("h3", { className: "text-h3 hs-cuaderno-title" }, p.title)),
      h("div", { className: "hs-cuaderno-foot" },
        h("span", { className: "hs-meta" }, h(Icon, { name: "calendar", size: 16 }), p.date),
        h("span", { className: "hs-cuaderno-actions" },
          h(Button, { variant: "outline", size: "sm", icon: "pen", href: p.writeHref }, "Escribir"),
          h(Button, { size: "sm", href: p.openHref }, "Abrir", h(Icon, { name: "arrowUpRight", size: 16 })))));
  }
  function JourneyCard(p) {
    return h(Card, { className: cx("hs-journey", p.className), interactive: true, state: p.state },
      h("div", { className: "hs-journey-media" },
        p.image ? h("img", { src: p.image, alt: "" }) : h(Icon, { name: "compass", size: 40 }),
        (p.featured || p.premium || p.status) ? h("div", { className: "hs-journey-badges" },
          p.featured ? h(Badge, { variant: "primary", icon: "sparkles" }, "Destacado") : null,
          p.premium ? h(Badge, { variant: "warning" }, "Premium") : null,
          p.status ? h(Badge, { variant: p.status.variant, icon: p.status.icon }, p.status.label) : null) : null),
      h("div", { className: "hs-journey-body" },
        h("p", { className: "text-overline hs-overline" }, p.category),
        h("h3", { className: "text-h3", style: { margin: 0 } }, p.title),
        h("p", { className: "text-body-sm hs-clamp-2 hs-muted" }, p.tagline),
        h("div", { className: "hs-journey-foot" },
          h("span", { className: "hs-meta" }, h(Icon, { name: "layers", size: 16 }), p.days + " días", p.time ? h("span", null, " · " + p.time) : null),
          h("span", { className: "text-label", style: { color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: 4 } }, p.cta || "Comenzar", h(Icon, { name: "chevronRight", size: 16 })))));
  }

  /* ── Stat / Avatar / PageHeader ── */
  function Stat(p) {
    return h(Card, { className: cx("hs-stat", p.className), variant: "flat", href: p.href, as: p.href ? "a" : "div", interactive: !!p.href, style: { textAlign: "center", textDecoration: "none" } },
      h("p", { className: "text-h2 hs-stat-value", style: { color: p.accent ? "var(--primary)" : undefined } }, p.value),
      h("span", { className: "text-body-sm hs-muted" }, p.label));
  }
  function Avatar(p) {
    var initial = (p.name || "?").trim().charAt(0).toUpperCase();
    return h("span", { className: cx("hs hs-avatar", p.size === "sm" && "hs-avatar-sm", p.className), role: "img", "aria-label": p.name }, initial);
  }
  function PageHeader(p) {
    return h("header", { className: cx("hs hs-pageheader", p.className) },
      h("div", { className: "hs-pageheader-text" },
        p.eyebrow ? h("span", { className: "text-overline hs-muted" }, p.eyebrow) : null,
        h("h1", { className: "text-h1" }, p.title),
        p.subtitle ? h("p", { className: "text-body hs-muted" }, p.subtitle) : null),
      p.actions || null);
  }

  window.HumanSoul = { Logo: Logo, Icon: Icon, Button: Button, Field: Field, Input: Input, Textarea: Textarea, Select: Select, Checkbox: Checkbox, Switch: Switch, Chip: Chip, Badge: Badge, Card: Card, Alert: Alert, Tabs: Tabs, Dialog: Dialog, Sheet: Sheet, Skeleton: Skeleton, EmptyState: EmptyState, ErrorState: ErrorState, Sidebar: Sidebar, BottomNav: BottomNav, DataList: DataList, ReflectionCard: ReflectionCard, CuadernoCard: CuadernoCard, JourneyCard: JourneyCard, Stat: Stat, Avatar: Avatar, PageHeader: PageHeader };
})();
