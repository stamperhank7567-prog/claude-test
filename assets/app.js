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
  const qualify = $("#qualify");
  let qualifyVisible = false;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 8);
    dock.classList.toggle("is-shown", y > window.innerHeight * 0.8 && !qualifyVisible);
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

  /* ---------- Qualifier quiz ---------- */
  const setupQuiz = () => {
    const form = $("#quiz");
    if (!form) return;
    const steps = $$(".q", form);
    const total = steps.length;
    const bar = $("#quiz-bar"), stepLabel = $("#quiz-step");
    const next = $("#quiz-next"), back = $("#quiz-back"), navRow = $("#quiz-nav");
    const err = $("#quiz-error");
    const results = { yes: $("#result-yes"), booked: $("#result-booked"), nurture: $("#result-nurture") };
    const QUALIFY_AT = 8; // out of a possible 11
    let current = 0;
    let started = false;
    let lead = {};

    const answered = (i) => {
      const fs = steps[i];
      const radios = $$("input[type=radio]", fs);
      return radios.length ? radios.some((r) => r.checked) : true;
    };

    const show = (i) => {
      steps.forEach((fs, k) => {
        fs.hidden = k !== i;
        fs.classList.toggle("is-active", k === i);
      });
      current = i;
      bar.style.width = `${((i + 1) / total) * 100}%`;
      stepLabel.textContent = `Question ${i + 1} of ${total}`;
      back.hidden = i === 0;
      next.textContent = i === total - 1 ? "See my result" : "Next";
      next.disabled = !answered(i);
    };

    form.addEventListener("change", (e) => {
      if (!started) { started = true; track("quiz_start"); }
      if (e.target.type === "radio") {
        next.disabled = false;
        track("quiz_answer", { step: current + 1, value: e.target.value });
        // Auto-advance on single-choice questions for a faster funnel.
        if (current < total - 1) setTimeout(() => show(current + 1), reduceMotion ? 0 : 260);
      }
    });

    back.addEventListener("click", () => show(Math.max(0, current - 1)));

    const validateContact = () => {
      const fields = $$("input, select", steps[total - 1]);
      let firstBad = null;
      fields.forEach((f) => {
        const ok = f.checkValidity() && f.value.trim() !== "";
        f.setAttribute("aria-invalid", ok ? "false" : "true");
        if (!ok && !firstBad) firstBad = f;
      });
      if (firstBad) {
        err.textContent = firstBad.type === "email" && firstBad.value
          ? "Enter a work email in the format name@company.com."
          : "Fill in all four fields so we know who to reply to.";
        err.hidden = false;
        firstBad.focus();
        return false;
      }
      err.hidden = true;
      return true;
    };

    const score = () => {
      let s = 0;
      $$("input[type=radio]:checked", form).forEach((r) => (s += +r.dataset.score));
      const role = $("#f-role");
      s += +(role.selectedOptions[0]?.dataset.score || 0);
      return s;
    };

    const fill = (root) => {
      $$("[data-fill]", root).forEach((n) => { n.textContent = lead[n.dataset.fill] || n.textContent; });
    };

    const submitLead = async (payload) => {
      const endpoint = form.dataset.endpoint;
      try { localStorage.setItem("hv_lead", JSON.stringify(payload)); } catch (_) { /* storage blocked */ }
      if (!endpoint) {
        console.info("[Halden & Vale] No form endpoint configured. Lead payload:", payload);
        return true;
      }
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        return res.ok;
      } catch (_) {
        return false;
      }
    };

    const showResult = (key) => {
      steps.forEach((fs) => (fs.hidden = true));
      navRow.hidden = true;
      $(".quiz__progress", form).hidden = true;
      stepLabel.hidden = true;
      Object.values(results).forEach((r) => (r.hidden = true));
      const r = results[key];
      fill(r);
      r.hidden = false;
      r.focus({ preventScroll: true });
    };

    next.addEventListener("click", async () => {
      if (current < total - 1) { if (answered(current)) show(current + 1); return; }
      if (!validateContact()) return;
      const data = Object.fromEntries(new FormData(form).entries());
      const s = score();
      lead = { ...data, score: s, qualified: s >= QUALIFY_AT };
      next.disabled = true;
      next.textContent = "Checking…";
      const ok = await submitLead({ ...lead, stage: "qualified_check", at: new Date().toISOString() });
      next.disabled = false;
      if (!ok) {
        next.textContent = "See my result";
        err.textContent = "We couldn't send your answers. Check your connection and try again, or email hello@haldenvale.example.";
        err.hidden = false;
        return;
      }
      track("quiz_complete", { score: s, qualified: lead.qualified });
      if (lead.qualified) { buildSlots(); showResult("yes"); } else { showResult("nurture"); }
    });

    // Keep Enter in text fields from submitting the whole form early.
    form.addEventListener("submit", (e) => { e.preventDefault(); next.click(); });

    /* Booking slots: next five business days, two times each, in the visitor's timezone. */
    const slotsEl = $("#slots"), bookBtn = $("#book");
    let chosen = null;
    const buildSlots = () => {
      slotsEl.innerHTML = "";
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      let days = 0;
      while (days < 4) {
        d.setDate(d.getDate() + 1);
        if (d.getDay() === 0 || d.getDay() === 6) continue;
        days++;
        [10, 14].forEach((h) => {
          const t = new Date(d);
          t.setHours(h);
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "slot";
          btn.setAttribute("role", "radio");
          btn.setAttribute("aria-checked", "false");
          const day = t.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
          const time = t.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
          btn.innerHTML = `${day}<small>${time}</small>`;
          btn.dataset.label = `${day}, ${time}`;
          btn.dataset.iso = t.toISOString();
          btn.addEventListener("click", () => {
            $$(".slot", slotsEl).forEach((b) => b.setAttribute("aria-checked", "false"));
            btn.setAttribute("aria-checked", "true");
            chosen = btn;
            bookBtn.disabled = false;
          });
          slotsEl.appendChild(btn);
        });
      }
    };

    bookBtn.addEventListener("click", async () => {
      if (!chosen) return;
      bookBtn.disabled = true;
      bookBtn.textContent = "Sending…";
      lead.slot = chosen.dataset.label;
      const ok = await submitLead({ ...lead, stage: "call_requested", slot_iso: chosen.dataset.iso, at: new Date().toISOString() });
      if (!ok) {
        bookBtn.disabled = false;
        bookBtn.textContent = "Try again";
        return;
      }
      track("call_requested", { slot: chosen.dataset.iso });
      showResult("booked");
    });

    $("#restart").addEventListener("click", () => {
      form.reset();
      Object.values(results).forEach((r) => (r.hidden = true));
      navRow.hidden = false;
      $(".quiz__progress", form).hidden = false;
      stepLabel.hidden = false;
      $$("[aria-invalid]", form).forEach((f) => f.removeAttribute("aria-invalid"));
      show(0);
    });

    show(0);
  };

  /* ---------- Hide dock while the quiz is on screen ---------- */
  if ("IntersectionObserver" in window && qualify) {
    new IntersectionObserver(([e]) => { qualifyVisible = e.isIntersecting; onScroll(); }, { threshold: 0.15 }).observe(qualify);
  }

  drawBridge();
  setupReveals();
  setupCounters();
  setupQuiz();
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateTimeline, { passive: true });
})();
