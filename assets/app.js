(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Funnel analytics hook. Wire to GA4 / Segment / PostHog by reading window.dataLayer.
  const track = (event, props = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...props });
  };
  $$("[data-track]").forEach((el) => el.addEventListener("click", () => track("cta_click", { id: el.dataset.track })));

  /* ---------- Sticky nav border + mobile dock ---------- */
  const nav = $(".nav");
  const dock = $("#dock");
  const applySection = $("#apply");
  let applyVisible = false;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 8);
    dock.classList.toggle("is-shown", y > window.innerHeight * 0.8 && !applyVisible);
    updateTimeline();
  };

  /* ---------- EBITDA bridge (waterfall) ---------- */
  const steps = [
    { label: "Before", value: 8.2, kind: "total" },
    { label: "Pricing", value: 2.1 },
    { label: "Sourcing", value: 1.6 },
    { label: "Throughput", value: 1.4 },
    { label: "Practices", value: 0.6 },
    { label: "After", value: 13.9, kind: "total" },
  ];
  const drawBridge = () => {
    const host = $("#bridge");
    if (!host) return;
    const W = 480, H = 260, padL = 30, padR = 6, padT = 26, padB = 34;
    const max = 15;
    const y = (v) => padT + (H - padT - padB) * (1 - v / max);
    const slot = (W - padL - padR) / steps.length;
    const bw = slot * 0.62;
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("aria-hidden", "true");
    const el = (tag, attrs, style) => {
      const n = document.createElementNS(NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      if (style) n.setAttribute("style", style);
      svg.appendChild(n);
      return n;
    };
    const text = (x, yy, str, style, anchor = "middle") => {
      const t = el("text", { x, y: yy, "text-anchor": anchor }, style);
      t.textContent = str;
      return t;
    };

    [0, 5, 10, 15].forEach((g) => {
      el("line", { x1: padL, x2: W - padR, y1: y(g), y2: y(g) }, "stroke:var(--rule);stroke-width:1" + (g ? ";stroke-dasharray:2 4" : ""));
      text(padL - 8, y(g) + 4, `${g}%`, "fill:var(--ink-soft);font:10px var(--f-mono)", "end");
    });

    let running = 0;
    steps.forEach((s, i) => {
      const x = padL + slot * i + (slot - bw) / 2;
      const base = s.kind === "total" ? 0 : running;
      const top = s.kind === "total" ? s.value : running + s.value;
      const delay = reduceMotion ? 0 : 350 + i * 180;
      const fill = s.kind === "total" ? (i === 0 ? "var(--ink-soft)" : "var(--petrol)") : "var(--gain)";
      const bar = el("rect", { x, y: y(top), width: bw, height: Math.max(1, y(base) - y(top)), rx: 2, class: "bar bar--anim" },
        `fill:${fill};animation-delay:${delay}ms`);
      bar.style.opacity = s.kind === "total" && i === 0 ? ".55" : "1";
      if (i < steps.length - 1) {
        el("line", { x1: x + bw, x2: x + slot, y1: y(top), y2: y(top), class: "bar-label--anim" },
          `stroke:var(--ink-soft);stroke-width:1;stroke-dasharray:3 3;animation-delay:${delay + 500}ms`);
      }
      const valStr = s.kind === "total" ? `${s.value.toFixed(1)}%` : `+${s.value.toFixed(1)}`;
      text(x + bw / 2, y(top) - 8, valStr,
        `fill:${s.kind === "total" ? "var(--ink)" : "var(--gain)"};font:600 12px var(--f-mono);animation-delay:${delay + 400}ms`)
        .setAttribute("class", "bar-label--anim");
      text(x + bw / 2, H - padB + 18, s.label, "fill:var(--ink-soft);font:11px var(--f-body)");
      running = top;
    });
    host.appendChild(svg);
  };

  /* ---------- Scroll reveals (visible at rest; only below-fold items get a pre-state) ---------- */
  const setupReveals = () => {
    const items = $$(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    const vh = window.innerHeight;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        e.target.classList.remove("pre");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach((el) => {
      if (el.getBoundingClientRect().top < vh) return;
      const siblings = $$(":scope > .reveal", el.parentElement);
      el.style.setProperty("--stagger", `${Math.min(siblings.indexOf(el), 4) * 90}ms`);
      el.classList.add("pre");
      io.observe(el);
    });
  };

  /* ---------- Counters ---------- */
  const setupCounters = () => {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    const fmt = (el, v) => {
      const dec = +(el.dataset.decimals || 0);
      el.textContent = v.toFixed(dec) + (el.dataset.suffix || "");
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const el = e.target, to = parseFloat(el.dataset.to), dur = 1400, t0 = performance.now();
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / dur);
          fmt(el, to * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    $$(".count").forEach((el) => io.observe(el));
  };

  /* ---------- Timeline progress line ---------- */
  const timeline = $("#timeline");
  function updateTimeline() {
    if (!timeline) return;
    const r = timeline.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
    timeline.style.setProperty("--progress", reduceMotion ? 1 : p.toFixed(3));
  }

  /* ---------- Hide dock while the apply section is on screen ---------- */
  if ("IntersectionObserver" in window && applySection) {
    new IntersectionObserver(([e]) => { applyVisible = e.isIntersecting; onScroll(); }, { threshold: 0.15 }).observe(applySection);
  }

  drawBridge();
  setupReveals();
  setupCounters();
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateTimeline, { passive: true });
})();
