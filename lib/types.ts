export type Answers = Record<string, string>;

export type Stance = "Press" | "Trade" | "Protect" | "Reset";

export type Strategy = {
  title: string;
  summary: string;
  stance: Stance;
  stanceReason: string;
  leverage: number;
  power: "Buyer" | "Balanced" | "Supplier";
  opening: string;
  target: string;
  walkAway: string;
  zopa: string;
  batna: string;
  levers: { name: string; detail: string; tag: string }[];
  trades: { give: string; get: string }[];
  script: { step: string; line: string }[];
  replies: { they: string; you: string; pinned?: boolean }[];
  risks: string[];
  checklist: string[];
  tips: string[];
};

export type AiProviderId = "deepseek" | "sarvam" | "gemini" | "openai";

export type AiConfig = {
  provider: AiProviderId | "";
  apiKey: string;
  model: string;
};
