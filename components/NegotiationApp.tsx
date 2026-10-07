"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AiModal from "./AiModal";
import Results from "./Results";
import { aiIsOn, providerMeta } from "../lib/ai-config";
import { BRAND } from "../lib/brand";
import { analyse } from "../lib/engine";
import { SLUG, buildQuestions, questionLabel, type CustomTypes } from "../lib/questions";
import type { AiConfig, Answers } from "../lib/types";

const ANSWER_KEY = "thermo-dealdesk-answers";
const AI_KEY = "thermo-dealdesk-ai";
const SAVED_KEY = "thermo-dealdesk-saved";
const INFO_KEY = "thermo-dealdesk-info";
const CUSTOM_KEY = "thermo-dealdesk-custom-types";

const emptyAi: AiConfig = { provider: "", apiKey: "", model: "" };

type Info = { supplier: string; item: string };
type SavedPlan = { id: string; name: string; date: string; answers: Answers; info: Info };

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? ({ ...(Array.isArray(fallback) ? [] : fallback), ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

function store(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: the app still works without saving */
  }
}

export default function NegotiationApp() {
  const [screen, setScreen] = useState<"home" | "quiz" | "result">("home");
  const [answers, setAnswers] = useState<Answers>({});
  const [info, setInfo] = useState<Info>({ supplier: "", item: "" });
  const [saved, setSaved] = useState<SavedPlan[]>([]);
  const [index, setIndex] = useState(0);
  const [custom, setCustom] = useState<CustomTypes>({});
  const [newType, setNewType] = useState("");
  const [ai, setAi] = useState<AiConfig>(emptyAi);
  const [settings, setSettings] = useState(false);
  const [ready, setReady] = useState(false);
  const advanceTimer = useRef<number | null>(null);

  useEffect(() => {
    setAnswers(load<Answers>(ANSWER_KEY, {}));
    setInfo(load<Info>(INFO_KEY, { supplier: "", item: "" }));
    setAi(load<AiConfig>(AI_KEY, emptyAi));
    setCustom(load<CustomTypes>(CUSTOM_KEY, {}));
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (raw) setSaved(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
    return () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    };
  }, []);

  useEffect(() => {
    if (ready) store(ANSWER_KEY, answers);
  }, [answers, ready]);
  useEffect(() => {
    if (ready) store(INFO_KEY, info);
  }, [info, ready]);
  useEffect(() => {
    if (ready) store(SAVED_KEY, saved);
  }, [saved, ready]);
  useEffect(() => {
    if (ready) store(CUSTOM_KEY, custom);
  }, [custom, ready]);

  const questions = useMemo(() => buildQuestions(answers, custom), [answers, custom]);
  const question = questions[index];
  const strategy = useMemo(() => (screen === "result" ? analyse(answers) : null), [screen, answers]);
  const brief = useMemo(
    () => questions.map((q) => ({ question: q.title, answer: questionLabel(questions, q.id, answers[q.id] || "") })).filter((x) => x.answer),
    [questions, answers]
  );
  const meta = providerMeta(ai.provider);
  const on = aiIsOn(ai.provider, ai.apiKey);
  const hasAnswers = Object.keys(answers).length > 0;

  function next() {
    setIndex((i) => {
      if (i >= questions.length - 1) {
        setScreen("result");
        return i;
      }
      return i + 1;
    });
  }

  function toggle(optionId: string) {
    if (!question) return;
    setAnswers((prev) => {
      let list = (prev[question.id] || "").split(",").filter(Boolean);
      const exclusive = optionId === "none"; // "none" cannot be mixed with other answers
      if (list.includes(optionId)) list = list.filter((x) => x !== optionId);
      else list = exclusive ? [optionId] : [...list.filter((x) => x !== "none"), optionId];
      const nextAnswers = { ...prev, [question.id]: list.join(",") };
      if (!list.length) delete nextAnswers[question.id];
      if (question.id === "goal" && nextAnswers.alsoWant) {
        const rest = nextAnswers.alsoWant.split(",").filter((x) => !list.includes(x));
        if (rest.length) nextAnswers.alsoWant = rest.join(",");
        else delete nextAnswers.alsoWant;
      }
      return nextAnswers;
    });
  }

  function choose(optionId: string) {
    if (!question) return;
    setAnswers((prev) => {
      const nextAnswers = { ...prev, [question.id]: optionId };
      if (question.id === "category") delete nextAnswers.subcategory;
      return nextAnswers;
    });
    if (question.kind === "cards") {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
      advanceTimer.current = window.setTimeout(next, 180);
    }
  }

  function addType() {
    const label = newType.trim().replace(/\s+/g, " ").slice(0, 60);
    if (!label || !SLUG(label) || !question) return;
    const key = answers.category || "other";
    setCustom((c) => ((c[key] || []).includes(label) ? c : { ...c, [key]: [...(c[key] || []), label] }));
    setAnswers((prev) => ({ ...prev, [question.id]: SLUG(label) }));
    setNewType("");
  }

  function removeType() {
    if (!question) return;
    const key = answers.category || "other";
    const label = (custom[key] || []).find((c) => SLUG(c) === answers.subcategory);
    if (!label) return;
    setCustom((c) => ({ ...c, [key]: (c[key] || []).filter((x) => x !== label) }));
    setAnswers((prev) => {
      const next = { ...prev };
      delete next.subcategory;
      return next;
    });
  }

  function continueDropdown() {
    if (question && answers[question.id]) next();
  }

  function skip() {
    if (!question) return;
    setAnswers((prev) => {
      const nextAnswers = { ...prev };
      delete nextAnswers[question.id];
      return nextAnswers;
    });
    next();
  }

  function saveAi(nextAi: AiConfig) {
    const clean = nextAi.provider ? nextAi : emptyAi;
    setAi(clean);
    store(AI_KEY, clean);
    setSettings(false);
  }

  function startNew() {
    setAnswers({});
    setInfo({ supplier: "", item: "" });
    setIndex(0);
    setScreen("quiz");
  }

  function savePlan() {
    const name = [info.supplier, info.item].filter(Boolean).join(" – ") || "Plan " + (saved.length + 1);
    const plan: SavedPlan = {
      id: String(Date.now()),
      name,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      answers,
      info,
    };
    setSaved((list) => [plan, ...list].slice(0, 20));
  }

  function openPlan(plan: SavedPlan) {
    setAnswers(plan.answers);
    setInfo(plan.info);
    setScreen("result");
  }

  return (
    <main className={screen === "result" ? "app wide" : "app"}>
      <header className="topbar">
        <button className="brand" type="button" onClick={() => setScreen("home")} aria-label="Go to home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="mark" src={BRAND.logo} alt="Thermo Group logo" />
          <span>
            <em>{BRAND.company}</em>
            <strong>{BRAND.app}</strong>
          </span>
        </button>
        <button className={on ? "icon-btn on" : "icon-btn"} type="button" onClick={() => setSettings(true)}>
          {on ? `${meta?.label} on` : "AI help (optional)"}
        </button>
      </header>
      <div className="tagline">{BRAND.tagline}</div>

      {screen === "home" && (
        <section className="hero">
          <p className="kicker">For every Thermo Group buyer</p>
          <h1>Get ready for your next supplier meeting.</h1>
          <p className="lede">Answer a few simple questions. You get your target, what to say, what to give, and what to ask in return.</p>
          <ul className="points">
            <li><span className="dot">1</span><span>Simple questions. Tap one answer at a time.</span></li>
            <li><span className="dot alt">2</span><span>Made for Indian buying: GST, freight, price hikes, minimum order and approval limits.</span></li>
            <li><span className="dot">3</span><span>Check your numbers with the built-in price calculator, then print or share the plan.</span></li>
          </ul>
          <button className="primary" type="button" onClick={startNew}>Start a new plan</button>
          {hasAnswers && (
            <button className="secondary" type="button" onClick={() => setScreen("result")}>Open my last plan</button>
          )}
          {saved.length > 0 && (
            <div className="saved">
              <strong>Saved plans</strong>
              {saved.map((p) => (
                <div className="saved-item" key={p.id}>
                  <button className="open" type="button" onClick={() => openPlan(p)}>
                    {p.name}
                    <small>{p.date}</small>
                  </button>
                  <button type="button" onClick={() => setSaved((list) => list.filter((x) => x.id !== p.id))}>Delete</button>
                </div>
              ))}
            </div>
          )}
          <p className="fine">Your answers stay on this device. Nothing is uploaded.</p>
        </section>
      )}

      {screen === "quiz" && question && (
        <section className="sheet" key={question.id}>
          <div className="progress-row">
            <span>{question.kicker}</span>
            <span>{index + 1} of {questions.length}</span>
          </div>
          <div className="bar" aria-hidden><span style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
          {index === 0 && (
            <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
              <input className="input" placeholder="Supplier name (optional)" value={info.supplier} onChange={(e) => setInfo({ ...info, supplier: e.target.value })} />
              <input className="input" placeholder="Item you are buying (optional)" value={info.item} onChange={(e) => setInfo({ ...info, item: e.target.value })} />
            </div>
          )}
          <h2>{question.title}</h2>
          <p className="lede">{question.subtitle}</p>
          {question.why && <p className="hint-box" style={{ marginTop: 12 }}><b>Help: </b>{question.why}</p>}
          <div style={{ height: 14 }} />
          {question.kind === "multi" && (
            <div className="opts">
              {question.options.map((option) => {
                const selected = (answers[question.id] || "").split(",").includes(option.id);
                return (
                  <button key={option.id} type="button" role="checkbox" aria-checked={selected} className={selected ? "opt on" : "opt"} onClick={() => toggle(option.id)}>
                    <span className="badge-ico">{selected ? "✓" : option.icon || "•"}</span>
                    <span><strong>{option.label}</strong>{option.hint && <small>{option.hint}</small>}</span>
                  </button>
                );
              })}
              <button className="primary" type="button" disabled={!answers[question.id]} onClick={next}>Continue</button>
            </div>
          )}
          {question.kind === "multi" ? null : question.kind === "cards" ? (
            <div className="opts">
              {question.options.map((option) => {
                const selected = answers[question.id] === option.id;
                return (
                  <button key={option.id} type="button" className={selected ? "opt on" : "opt"} onClick={() => choose(option.id)}>
                    <span className="badge-ico">{option.icon || "•"}</span>
                    <span><strong>{option.label}</strong>{option.hint && <small>{option.hint}</small>}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <select className="select" value={answers[question.id] || ""} onChange={(e) => choose(e.target.value)}>
                <option value="">Choose one</option>
                {question.options.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
              {question.id === "subcategory" && (
                <div className="addtype">
                  <p className="plain">Cannot find your material? Type it below and add it. It will be saved in this list for next time.</p>
                  <div className="addrow">
                    <input className="input" placeholder="e.g. Copper wire, Silicone sheet" value={newType} maxLength={60} onChange={(e) => setNewType(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addType(); }} />
                    <button className="secondary" type="button" disabled={!newType.trim()} onClick={addType}>Add</button>
                  </div>
                  {(custom[answers.category || "other"] || []).some((c) => SLUG(c) === answers.subcategory) && (
                    <button className="text-btn" type="button" onClick={removeType}>Remove “{questions[index].options.find((o) => o.id === answers.subcategory)?.label}” from my list</button>
                  )}
                </div>
              )}
              <button className="primary" type="button" disabled={!answers[question.id]} onClick={continueDropdown}>Continue</button>
            </>
          )}
          <div className="nav">
            <button
              className="secondary"
              type="button"
              onClick={() => {
                if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
                if (index === 0) setScreen("home");
                else setIndex((i) => i - 1);
              }}
            >Back</button>
            {answers[question.id] && question.kind === "cards" && (
              <button className="secondary" type="button" onClick={next}>Next</button>
            )}
            <button className="secondary skip" type="button" onClick={skip}>Skip</button>
          </div>
        </section>
      )}

      {screen === "result" && strategy && (
        <Results
          strategy={strategy}
          brief={brief}
          ai={ai}
          info={info}
          onEdit={() => { setIndex(0); setScreen("quiz"); }}
          onHome={() => setScreen("home")}
          onSave={savePlan}
          onOpenAi={() => setSettings(true)}
        />
      )}

      {settings && <AiModal value={ai} onClose={() => setSettings(false)} onSave={saveAi} />}
    </main>
  );
}
