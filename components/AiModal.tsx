"use client";

import { useState } from "react";
import { AI_PROVIDERS, aiIsOn, providerMeta } from "../lib/ai-config";
import type { AiConfig } from "../lib/types";

export default function AiModal({
  value,
  onClose,
  onSave,
}: {
  value: AiConfig;
  onClose: () => void;
  onSave: (next: AiConfig) => void;
}) {
  const [draft, setDraft] = useState<AiConfig>(value);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [noteOk, setNoteOk] = useState(false);
  const meta = providerMeta(draft.provider);
  const active = aiIsOn(draft.provider, draft.apiKey);

  async function check() {
    setBusy(true);
    setNote("");
    setNoteOk(false);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: draft.provider,
          apiKey: draft.apiKey,
          model: draft.model || meta?.defaultModel,
          mode: "ping",
        }),
      });
      const data = await res.json();
      setNoteOk(res.ok);
      setNote(res.ok ? `${meta?.label || "AI"} replied. The key works.` : data.error || "The key was not accepted.");
    } catch {
      setNote("Could not reach the server. Check that the app is running.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="ai-title">
        <p className="kicker">Optional</p>
        <h2 id="ai-title">Turn on AI help</h2>
        <p className="lede">You do not need this. The plan works without it. If you add a key, AI will write extra ideas for your meeting.</p>
        <label className="field">Provider
          <select
            className="select"
            value={draft.provider}
            onChange={(e) => {
              const provider = e.target.value as AiConfig["provider"];
              const next = providerMeta(provider);
              setDraft({ provider, apiKey: draft.apiKey, model: next?.defaultModel || "" });
            }}
          >
            <option value="">No AI</option>
            {AI_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </label>
        {meta && (
          <label className="field">Model
            <select className="select" value={draft.model || meta.defaultModel} onChange={(e) => setDraft({ ...draft, model: e.target.value })}>
              {meta.models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
        )}
        <label className="field">{meta ? meta.keyHint : "API key"}
          <input
            type={show ? "text" : "password"}
            autoComplete="off"
            placeholder={meta ? "Paste the key" : "Choose a provider first"}
            value={draft.apiKey}
            disabled={!meta}
            onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
          />
        </label>
        <button className="text-btn" type="button" onClick={() => setShow((v) => !v)}>{show ? "Hide key" : "Show key"}</button>
        <div className={active ? "status" : "status off"}>{active ? `${meta?.label} is on` : "AI is off"}</div>
        {note && <p className={noteOk ? "fine" : "error"}>{note}</p>}
        <button className="primary" type="button" onClick={() => onSave({ ...draft, model: draft.model || meta?.defaultModel || "" })}>Save</button>
        <div className="nav">
          <button className="secondary" type="button" disabled={!active || busy} onClick={check}>{busy ? "Checking…" : "Check key"}</button>
          <button className="secondary" type="button" onClick={onClose}>Close</button>
        </div>
        <p className="fine">Your key is kept only on this device. It is used only when you ask for AI ideas.</p>
      </div>
    </div>
  );
}
