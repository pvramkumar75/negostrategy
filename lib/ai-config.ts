import type { AiProviderId } from "./types";

export const AI_PROVIDERS: {
  id: AiProviderId;
  label: string;
  models: string[];
  defaultModel: string;
  keyHint: string;
}[] = [
  {
    id: "deepseek",
    label: "DeepSeek",
    models: ["deepseek-chat", "deepseek-reasoner"],
    defaultModel: "deepseek-chat",
    keyHint: "Key from platform.deepseek.com",
  },
  {
    id: "sarvam",
    label: "Sarvam AI",
    models: ["sarvam-30b", "sarvam-105b"],
    defaultModel: "sarvam-30b",
    keyHint: "Subscription key from sarvam.ai",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    models: ["gemini-2.5-flash", "gemini-2.0-flash"],
    defaultModel: "gemini-2.5-flash",
    keyHint: "Key from Google AI Studio",
  },
  {
    id: "openai",
    label: "ChatGPT (OpenAI)",
    models: ["gpt-4.1-mini", "gpt-4o-mini", "gpt-4o"],
    defaultModel: "gpt-4.1-mini",
    keyHint: "Key from platform.openai.com",
  },
];

export function providerMeta(id: string) {
  return AI_PROVIDERS.find((p) => p.id === id);
}

export function aiIsOn(provider: string, apiKey: string) {
  return Boolean(providerMeta(provider) && apiKey.trim().length >= 8);
}
