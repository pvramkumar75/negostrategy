"use client";

import { useEffect, useState } from "react";
import { aiIsOn, providerMeta } from "../lib/ai-config";
import { BRAND, POWER_LABEL, STANCE_LABEL } from "../lib/brand";
import type { AiConfig, Strategy } from "../lib/types";

function Rich({ text }: { text: string }) {
  return (
    <div className="ai-copy">
      {text.split("\n").map((line, i) => {
        const clean = line.trim();
        if (!clean) return <div key={i} style={{ height: 6 }} />;
        if (clean.startsWith("## ")) return <h3 key={i}>{clean.slice(3)}</h3>;
        if (clean.startsWith("# ")) return <h3 key={i}>{clean.slice(2)}</h3>;
        const body = clean.replace(/^[-*]\s+/, "");
        const html = body
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        const isBullet = /^[-*]\s+/.test(clean);
        return <p key={i} className={isBullet ? "bullet" : undefined} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </div>
  );
}

function planText(s: Strategy) {
  return [
    s.title,
    s.summary,
    `Approach: ${STANCE_LABEL[s.stance]}. Your strength: ${s.leverage}/100 (${POWER_LABEL[s.power]}).`,
    `First offer: ${s.opening}`,
    `Target: ${s.target}`,
    `Walk-away limit: ${s.walkAway}`,
    `Room for a deal: ${s.zopa}`,
    `Backup plan: ${s.batna}`,
    "",
    "What you can use",
    ...s.levers.map((l) => `- ${l.name} (${l.tag}): ${l.detail}`),
    "",
    "Give and get",
    ...s.trades.map((t) => `- Give: ${t.give}. Get: ${t.get}`),
    "",
    "What to say",
    ...s.script.map((x, n) => `${n + 1}. ${x.step}: ${x.line}`),
    "",
    "If they say",
    ...s.replies.map((r) => `- ${r.they} → ${r.you}`),
    "",
    "Watch-outs",
    ...s.risks.map((r) => `- ${r}`),
    "",
    "Before the meeting",
    ...s.checklist.map((r) => `- ${r}`),
  ].join("\n");
}

function Calculator() {
  const [v, setV] = useState({ last: "", quote: "", target: "", limit: "", qty: "", freight: "", gst: "18" });
  useEffect(() => {
    try {
      const raw = localStorage.getItem("thermo-dealdesk-calc");
      if (raw) setV((x) => ({ ...x, ...JSON.parse(raw) }));
    } catch {
      /* ignore */
    }
  }, []);
  function set(k: keyof typeof v, val: string) {
    const next = { ...v, [k]: val };
    setV(next);
    try {
      localStorage.setItem("thermo-dealdesk-calc", JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }
  const n = (x: string) => (x.trim() === "" || isNaN(Number(x)) ? null : Number(x));
  const last = n(v.last), quote = n(v.quote), target = n(v.target), limit = n(v.limit), qty = n(v.qty);
  const freight = n(v.freight) ?? 0, gst = n(v.gst) ?? 0;
  const inr = (x: number) => "₹" + x.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  const pct = (x: number) => x.toFixed(1) + "%";
  const rows: { cls?: string; text: string }[] = [];
  if (quote && last) {
    const ch = ((quote - last) / last) * 100;
    rows.push({ cls: ch > 0 ? "warn" : "good", text: `Quote is ${pct(Math.abs(ch))} ${ch > 0 ? "higher" : "lower"} than the last price.` });
  }
  if (quote && target) {
    const need = ((quote - target) / quote) * 100;
    rows.push({ text: need > 0 ? `To reach your target you need a ${pct(need)} reduction (${inr(quote - target)} per unit).` : "The quote is already at or below your target." });
    if (qty && need > 0) rows.push({ cls: "good", text: `Saving at your target: ${inr((quote - target) * qty)} on ${qty.toLocaleString("en-IN")} units.` });
  }
  if (quote && limit) {
    rows.push({ cls: quote > limit ? "warn" : "good", text: quote > limit ? `Quote is ${inr(quote - limit)} per unit above your walk-away limit.` : "Quote is within your walk-away limit." });
  }
  if (quote) {
    const landed = quote + freight;
    rows.push({ text: `Final cost per unit at your plant: ${inr(landed)} before GST, ${inr(landed * (1 + gst / 100))} with ${gst}% GST.` });
  }
  return (
    <section className="card no-print">
      <h3>Price calculator</h3>
      <p className="lede" style={{ fontSize: 14 }}>Enter the price per unit. Nothing leaves your device.</p>
      <div className="nums">
        <label>Last price paid<input inputMode="decimal" value={v.last} onChange={(e) => set("last", e.target.value)} placeholder="₹" /></label>
        <label>Their quote<input inputMode="decimal" value={v.quote} onChange={(e) => set("quote", e.target.value)} placeholder="₹" /></label>
        <label>Your target<input inputMode="decimal" value={v.target} onChange={(e) => set("target", e.target.value)} placeholder="₹" /></label>
        <label>Walk-away limit<input inputMode="decimal" value={v.limit} onChange={(e) => set("limit", e.target.value)} placeholder="₹" /></label>
        <label>Quantity<input inputMode="decimal" value={v.qty} onChange={(e) => set("qty", e.target.value)} placeholder="units" /></label>
        <label>Freight per unit<input inputMode="decimal" value={v.freight} onChange={(e) => set("freight", e.target.value)} placeholder="₹" /></label>
        <label>GST %<input inputMode="decimal" value={v.gst} onChange={(e) => set("gst", e.target.value)} /></label>
      </div>
      <div className="numres">{rows.map((r, i) => <div key={i} className={r.cls}>{r.text}</div>)}</div>
    </section>
  );
}

export default function Results({
  strategy,
  brief,
  ai,
  info,
  onEdit,
  onHome,
  onSave,
  onOpenAi,
}: {
  strategy: Strategy;
  brief: { question: string; answer: string }[];
  ai: AiConfig;
  info: { supplier: string; item: string };
  onEdit: () => void;
  onHome: () => void;
  onSave: () => void;
  onOpenAi: () => void;
}) {
  const on = aiIsOn(ai.provider, ai.apiKey);
  const meta = providerMeta(ai.provider);
  const [aiText, setAiText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function sharpen() {
    if (!on) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: ai.provider,
          apiKey: ai.apiKey,
          model: ai.model,
          mode: "enhance",
          brief,
          strategy,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiText("");
        setError(data.error || "The AI could not answer. Please try again.");
      } else {
        setAiText(data.text || "");
      }
    } catch {
      setError("Could not reach the AI. Your plan above is still ready to use.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    // Changing the key or the plan clears old AI text. Nothing is sent until the buyer asks.
    setAiText("");
    setError("");
  }, [ai.provider, ai.apiKey, ai.model, strategy.title, strategy.leverage, strategy.stance]);

  const heading = [info.supplier, info.item].filter(Boolean).join(" – ");

  function flash(msg: string) {
    setNote(msg);
    window.setTimeout(() => setNote(""), 2500);
  }

  function fullText() {
    const extra = aiText ? `\n\nAI help\n${aiText}` : "";
    return `${BRAND.company} ${BRAND.app}${heading ? "\n" + heading : ""}\n\n` + planText(strategy) + extra;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullText());
      flash("Plan copied.");
    } catch {
      flash("Could not copy. Use Print instead.");
    }
  }

  function whatsapp() {
    window.open("https://wa.me/?text=" + encodeURIComponent(fullText()), "_blank", "noopener");
  }

  return (
    <>
      <div className="printhead">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BRAND.logo} alt="" />
        <div><b>{BRAND.company} {BRAND.app}</b><div>{heading || "Negotiation plan"}</div></div>
      </div>
      <div className="row-actions no-print">
        <button className="text-btn" type="button" onClick={onEdit}>Change answers</button>
        <button className="text-btn" type="button" onClick={() => { onSave(); flash("Plan saved on this device."); }}>Save plan</button>
        <button className="text-btn" type="button" onClick={copy}>Copy</button>
        <button className="text-btn" type="button" onClick={whatsapp}>Share on WhatsApp</button>
        <button className="text-btn" type="button" onClick={() => window.print()}>Print / PDF</button>
        <button className="text-btn" type="button" onClick={onHome}>Home</button>
        {note && <span className="fine" style={{ margin: 0, alignSelf: "center" }}>{note}</span>}
      </div>
      <section className="card stance">
        <div>
          <p className="kicker" style={{ color: "#ffb3b4" }}>{STANCE_LABEL[strategy.stance]}{heading ? ` · ${heading}` : ""}</p>
          <h2>{strategy.title}</h2>
          <p>{strategy.summary}</p>
        </div>
        <div style={{ textAlign: "center", flex: "none" }}>
          <div className="meter" style={{ ["--p" as string]: strategy.leverage }}>
            <b>{strategy.leverage}</b>
          </div>
          <small style={{ display: "block", marginTop: 6, fontWeight: 700 }}>Your strength</small>
        </div>
      </section>
      <div className="split" style={{ marginTop: 14 }}>
        <div className="grid">
          <section className="card">
            <h3>Your position</h3>
            <p className="lede">{strategy.power === "Buyer" ? "You are stronger in this deal." : strategy.power === "Supplier" ? "The supplier is stronger in this deal." : "Both sides are about equal. Give and take. Do not threaten."}</p>
            <div className="metrics" style={{ marginTop: 12 }}>
              <article><small>Your first offer</small><strong>{strategy.opening}</strong></article>
              <article><small>Target</small><strong>{strategy.target}</strong></article>
              <article><small>Walk-away limit</small><strong>{strategy.walkAway}</strong></article>
              <article><small>Room for a deal</small><strong>{strategy.zopa}</strong></article>
            </div>
            <div className="tip"><b>Your backup plan (if this deal fails)</b><p>{strategy.batna}</p></div>
          </section>
          <section className="card">
            <h3>What to say</h3>
            {strategy.script.map((line, i) => (
              <div className="script" key={line.step}>
                <i>{i + 1}</i>
                <div><b>{line.step}</b><p>{line.line}</p></div>
              </div>
            ))}
          </section>
          <section className="card ai-card">
            <h3>{on ? `${meta?.label} helper` : "AI helper (optional)"}</h3>
            {!on && <p className="lede">Want more ideas? Add an AI key (DeepSeek, Sarvam, Gemini or ChatGPT) and it will write extra points from your answers. The plan already works without it.</p>}
            {!on && <button className="primary" type="button" onClick={onOpenAi}>Add an AI key</button>}
            {on && !busy && !aiText && <button className="primary" type="button" onClick={sharpen}>Get extra ideas from {meta?.label}</button>}
            {on && busy && <p className="lede">Please wait. {meta?.label} is writing…</p>}
            {error && <p className="error">{error}</p>}
            {aiText && <Rich text={aiText} />}
            {on && !busy && aiText && (
              <button className="secondary" type="button" onClick={sharpen}>Ask {meta?.label} again</button>
            )}
          </section>
        </div>
        <div className="grid">
          <Calculator />
          <section className="card">
            <h3>What you can use</h3>
            {strategy.levers.map((lever) => (
              <div className="lever" key={lever.name}>
                <span className={`tag ${lever.tag === "Use now" ? "use" : lever.tag === "Avoid" ? "avoid" : "hold"}`}>{lever.tag}</span>
                <b>{lever.name}</b>
                <p>{lever.detail}</p>
              </div>
            ))}
          </section>
          <section className="card">
            <h3>Give and get</h3>
            {strategy.trades.map((trade) => (
              <div className="trade" key={trade.give}>
                <small>Give</small>
                <b>{trade.give}</b>
                <small>Get</small>
                <span>{trade.get}</span>
              </div>
            ))}
          </section>
        </div>
      </div>
      <div className="split" style={{ marginTop: 14 }}>
        <section className="card">
          <h3>If they say this, reply like this</h3>
          {strategy.replies.map((reply) => (
            <div className={reply.pinned ? "reply pinned" : "reply"} key={reply.they}>
              {reply.pinned && <span className="tag use">You expect this</span>}
              <b>{reply.they}</b>
              <p>{reply.you}</p>
            </div>
          ))}
        </section>
        <div className="grid">
          <section className="card">
            <h3>Watch-outs</h3>
            <ul className="list">{strategy.risks.map((risk) => <li key={risk}>{risk}</li>)}</ul>
          </section>
          <section className="card">
            <h3>Before you walk in</h3>
            <ul className="list">{strategy.checklist.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section className="card">
            <h3>Tips for this type of buy</h3>
            {strategy.tips.map((tip) => <div className="tip" key={tip}><p>{tip}</p></div>)}
          </section>
        </div>
      </div>
      <p className="footer-note">This plan is only a guide. Before you agree, check market prices, tax, freight, specifications and your approval limit. The strength score comes from your answers. It does not predict what the supplier will accept.</p>
    </>
  );
}
