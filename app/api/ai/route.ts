import { NextResponse } from "next/server";
import { providerMeta } from "../../../lib/ai-config";
import type { AiProviderId, Strategy } from "../../../lib/types";

export const runtime = "nodejs";

type Brief = { question: string; answer: string };

function clip(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function asStrategy(value: unknown): Strategy | null {
  if (!value || typeof value !== "object") return null;
  const s = value as Strategy;
  if (!s.stance || !s.summary || !Array.isArray(s.script)) return null;
  return s;
}

function buildMessages(mode: string, brief: Brief[], strategy: Strategy | null) {
  if (mode === "ping") {
    return [
      {
        role: "system" as const,
        content: "Reply with the single word READY.",
      },
      { role: "user" as const, content: "Confirm the key works." },
    ];
  }

  const facts = brief
    .slice(0, 40)
    .map((b) => `- ${clip(b.question, 120)}: ${clip(b.answer, 160)}`)
    .join("\n");

  const base = strategy
    ? [
        `Stance: ${strategy.stance}. Leverage score: ${strategy.leverage}/100. Power: ${strategy.power}.`,
        `Summary: ${clip(strategy.summary, 500)}`,
        `Opening: ${clip(strategy.opening, 400)}`,
        `Target: ${clip(strategy.target, 400)}`,
        `Walk-away: ${clip(strategy.walkAway, 400)}`,
        `ZOPA: ${clip(strategy.zopa, 400)}`,
        `BATNA: ${clip(strategy.batna, 400)}`,
        "Script:",
        ...strategy.script.slice(0, 8).map((x) => `- ${clip(x.step, 40)}: ${clip(x.line, 400)}`),
      ].join("\n")
    : "No rule-based plan was provided.";

  return [
    {
      role: "system" as const,
      content:
        "You are a procurement negotiation coach for an Indian industrial buyer. Use very simple English, short sentences and everyday words that any buyer can follow. Avoid jargon such as BATNA, ZOPA or leverage. Do not invent supplier costs, market prices, savings rupees, or facts the buyer did not provide. Do not claim a law applies unless the buyer said it is their rule. Sharpen the plan they already have.",
    },
    {
      role: "user" as const,
      content: `Buyer answers:\n${facts}\n\nRule-based plan:\n${base}\n\nWrite:\n## What to do in the meeting\n- 5 specific moves\n## Lines to say\n- 5 short lines they can read aloud\n## Trades\n- 3 give-and-get trades\n## Check before you sign\n- 4 facts still to verify\n\nStay consistent with the stance. If data is thin, say so.`,
    },
  ];
}

async function callProvider(provider: AiProviderId, apiKey: string, model: string, messages: { role: "system" | "user"; content: string }[]) {
  if (provider === "gemini") {
    const system = messages.find((m) => m.role === "system")?.content ?? "";
    const user = messages.filter((m) => m.role === "user").map((m) => m.content).join("\n\n");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.4 },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message || `Gemini returned ${res.status}`;
      throw new Error(msg);
    }
    const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("\n");
    if (!text) throw new Error("Gemini returned an empty reply.");
    return text as string;
  }

  const endpoint =
    provider === "deepseek"
      ? "https://api.deepseek.com/chat/completions"
      : provider === "sarvam"
        ? "https://api.sarvam.ai/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (provider === "sarvam") headers["api-subscription-key"] = apiKey;
  else headers.Authorization = `Bearer ${apiKey}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      temperature: provider === "deepseek" && model.includes("reasoner") ? undefined : 0.4,
      messages,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || data?.message || `${provider} returned ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : "The AI provider rejected the request.");
  }
  const text = data?.choices?.[0]?.message?.content;
  if (!text || typeof text !== "string") throw new Error("The AI provider returned an empty reply.");
  return text;
}

export async function POST(req: Request) {
  let body: {
    provider?: string;
    apiKey?: string;
    model?: string;
    mode?: string;
    brief?: Brief[];
    strategy?: Strategy;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "The request could not be read." }, { status: 400 });
  }

  const provider = body.provider || "";
  const meta = providerMeta(provider);
  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  if (!meta || apiKey.length < 8) {
    return NextResponse.json({ error: "Choose a provider and add a key first." }, { status: 400 });
  }

  const model = meta.models.includes(body.model || "") ? (body.model as string) : meta.defaultModel;
  const mode = body.mode === "ping" ? "ping" : "enhance";
  const brief = Array.isArray(body.brief) ? body.brief : [];
  const strategy = asStrategy(body.strategy);
  if (mode === "enhance" && !strategy) {
    return NextResponse.json({ error: "Build the rule-based plan before asking AI." }, { status: 400 });
  }

  try {
    const text = await callProvider(provider as AiProviderId, apiKey, model, buildMessages(mode, brief, strategy));
    return NextResponse.json({ text, provider: meta.label, model });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The AI call failed.";
    return NextResponse.json({ error: message.slice(0, 400) }, { status: 502 });
  }
}
