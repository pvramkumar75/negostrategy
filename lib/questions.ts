import categories from "../config/categories.json";
import type { Answers } from "./types";

export type QOption = { id: string; label: string; hint?: string; icon?: string };

export type Question = {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  kind: "cards" | "dropdown" | "multi";
  why?: string;
  options: QOption[];
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export type CustomTypes = Record<string, string[]>;

export const SLUG = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function buildQuestions(answers: Answers, custom: CustomTypes = {}): Question[] {
  const cat = categories.categories.find((c) => c.id === answers.category);
  const base = cat && cat.subcategories.length ? cat.subcategories : ["General", "Mixed basket", "Not listed"];
  const subs = [...base, ...(custom[answers.category || "other"] || []).filter((c) => !base.includes(c))];

  const goals: QOption[] = [
    { id: "price", label: "Lower price", hint: "Get closer to your target price", icon: "₹" },
    { id: "payment", label: "Better payment", hint: "More credit days, without a higher price", icon: "🏦" },
    { id: "lead", label: "Faster, reliable delivery", hint: "Shorter lead time, deliveries on time", icon: "🚚" },
    { id: "quality", label: "Lower quality risk", hint: "Fewer rejects, better warranty", icon: "✓" },
    { id: "risk", label: "Less dependency", hint: "A real second supplier you can use", icon: "⚖" },
    { id: "package", label: "A better total package", hint: "Price, terms and risk together", icon: "▣" },
  ];

  return [
    {
      id: "category",
      kicker: "The buy",
      title: "What are you buying?",
      subtitle: "Pick the group. The plan will use ideas that suit it.",
      kind: "cards",
      options: [
        { id: "raw-materials", label: "Raw materials", hint: "Polymers, metals, chemicals, packaging", icon: "⬡" },
        { id: "oem-supplies", label: "Branded / OEM parts", hint: "Electrical, mechanical, branded parts", icon: "⚙" },
        { id: "capex", label: "Machines & projects (Capex)", hint: "Machines, plant, tools, projects", icon: "🏗" },
        { id: "mro", label: "Maintenance spares (MRO)", hint: "Spares, breakdown and store items", icon: "🔧" },
        { id: "services", label: "Services", hint: "Service contracts, job work, manpower, transport", icon: "🤝" },
        { id: "general", label: "General / indirect", hint: "Stationery, safety, cleaning", icon: "📎" },
        { id: "vehicles", label: "Vehicles & transport", hint: "Vehicles, fleet, freight", icon: "🚛" },
        { id: "it", label: "IT / software", hint: "Hardware, software, support", icon: "💻" },
        { id: "construction", label: "Construction / projects", hint: "Civil, electrical, MEP", icon: "📐" },
        { id: "other", label: "Something else", hint: "We will keep the plan simple and general", icon: "＋" },
      ],
    },
    {
      id: "subcategory",
      kicker: "The buy",
      title: "Which type is it?",
      subtitle: "Choose the closest one. It is fine if it is not exact.",
      kind: "dropdown",
      options: subs.map((s) => ({ id: slug(s), label: s })),
    },
    {
      id: "deal",
      kicker: "The buy",
      title: "What type of deal is this?",
      subtitle: "Each type of deal needs a different approach.",
      kind: "cards",
      options: [
        { id: "renewal", label: "Renewal with current supplier", hint: "You already buy this from them", icon: "↻" },
        { id: "new", label: "New supplier, first contract", hint: "Quality is not proven yet", icon: "✦" },
        { id: "spot", label: "One-time buy", hint: "No promise of future orders", icon: "•" },
        { id: "tender", label: "Tender or many quotes", hint: "You have several offers", icon: "☰" },
        { id: "emergency", label: "Emergency buy", hint: "Material is late, short or stopped", icon: "!" },
      ],
    },
    {
      id: "portfolio",
      kicker: "Importance",
      title: "How big is the impact if this goes wrong?",
      subtitle: "Think about the effect on your profit and how easy it is to change supplier.",
      why: "Think of your plant: if this item stops or becomes costly, how badly are you affected? Pick the closest.",
      kind: "cards",
      options: [
        { id: "routine", label: "Routine", hint: "Small impact, easy to change supplier", icon: "○" },
        { id: "leverage", label: "Important, but many suppliers available", hint: "Big spend, real competition", icon: "◆" },
        { id: "bottleneck", label: "Small spend, big problem if it stops", hint: "Hard to replace", icon: "◇" },
        { id: "strategic", label: "Strategic", hint: "Big impact and hard to change", icon: "★" },
      ],
    },
    {
      id: "spend",
      kicker: "Money",
      title: "Rough yearly spend on this item?",
      subtitle: "A rough range is enough.",
      kind: "dropdown",
      options: [
        { id: "u5", label: "Under ₹5 lakh" },
        { id: "5-25", label: "₹5–25 lakh" },
        { id: "25-100", label: "₹25 lakh – ₹1 crore" },
        { id: "1-5", label: "₹1–5 crore" },
        { id: "5plus", label: "Above ₹5 crore" },
        { id: "unsure", label: "Not sure yet" },
      ],
    },
    {
      id: "currency",
      kicker: "Money",
      title: "Which currency is the quote in?",
      subtitle: "For imports, currency and freight matter as much as the unit price.",
      kind: "dropdown",
      options: [
        { id: "inr", label: "Indian Rupees (₹)" },
        { id: "usd", label: "US Dollars" },
        { id: "eur", label: "Euro" },
        { id: "other", label: "Another currency" },
      ],
    },
    {
      id: "quoteMove",
      kicker: "The quote",
      title: "How does this quote compare with the last price?",
      subtitle: "Compare with the last price you paid for the same item.",
      kind: "cards",
      options: [
        { id: "up-big", label: "Up more than 8%", hint: "A real increase", icon: "↑" },
        { id: "up-small", label: "Up a little, under 8%", hint: "They are testing how much you accept", icon: "↗" },
        { id: "same", label: "About the same", hint: "Same as last time", icon: "→" },
        { id: "down", label: "Lower than last time", hint: "Already in your favour", icon: "↓" },
        { id: "first", label: "First quote, no history", hint: "Nothing to compare with", icon: "?" },
      ],
    },
    {
      id: "gap",
      kicker: "The quote",
      title: "How far is the quote from your target?",
      subtitle: "Your target is the price you would be happy to sign. It is not your first offer.",
      why: "Gap = how much lower than their quote your target price is. Example: quote ₹100, target ₹92 means the gap is 8%.",
      kind: "cards",
      options: [
        { id: "tiny", label: "Within 2%", hint: "Almost there. Other terms may matter more", icon: "1" },
        { id: "small", label: "About 3–5% away", hint: "A normal gap", icon: "2" },
        { id: "medium", label: "About 6–10% away", hint: "Needs a real give-and-take, not just a request", icon: "3" },
        { id: "wide", label: "About 11–20% away", hint: "One change will not close this gap", icon: "4" },
        { id: "extreme", label: "More than 20% away", hint: "Check the specification, scope or supplier", icon: "5" },
        { id: "unknown", label: "I do not have a target yet", hint: "Set one before you meet", icon: "?" },
      ],
    },
    {
      id: "floor",
      kicker: "The quote",
      title: "What is the lowest price you think they can accept?",
      subtitle: "A guess is fine. Just be honest that it is a guess.",
      why: "Their lowest price is the least they would accept. You rarely know it, so a guess is fine.",
      kind: "cards",
      options: [
        { id: "well-below", label: "Much lower than the quote", hint: "You have seen lower prices, or your cost estimate says so", icon: "↓" },
        { id: "slight", label: "A little lower than the quote", hint: "Not much room", icon: "↘" },
        { id: "unknown", label: "I do not know", hint: "Ask them what drives the cost", icon: "?" },
        { id: "final", label: "They say it is their final price", hint: "Test it before you believe it", icon: "■" },
      ],
    },
    {
      id: "walkaway",
      kicker: "Your limit",
      title: "If they do not reduce, can you walk away?",
      subtitle: "Be honest. If you cannot really walk away, do not pretend.",
      why: "Walking away means you refuse the offer and buy from someone else, or wait. It only works if you really can.",
      kind: "cards",
      options: [
        { id: "comfortable", label: "Yes, comfortably", hint: "You have another real option", icon: "✓" },
        { id: "tight", label: "Only if I must", hint: "Difficult, but possible", icon: "△" },
        { id: "none", label: "Almost no room", hint: "Hard to leave this supplier now", icon: "▽" },
        { id: "must", label: "I have to buy this", hint: "Do not bluff", icon: "!" },
      ],
    },
    {
      id: "suppliers",
      kicker: "Competition",
      title: "How many qualified suppliers do you have?",
      subtitle: "“Qualified” means they can meet your specification, quality and delivery. A name on a list is not enough.",
      kind: "cards",
      options: [
        { id: "1", label: "Only this one", hint: "Single source for now", icon: "1" },
        { id: "2", label: "Two", hint: "A weak backup", icon: "2" },
        { id: "3", label: "Three or four", hint: "Good choice", icon: "3" },
        { id: "5", label: "Five or more", hint: "Very competitive", icon: "5" },
      ],
    },
    {
      id: "alternate",
      kicker: "Competition",
      title: "Is another supplier ready?",
      subtitle: "A quote you can really use is much stronger than a supplier you plan to develop later.",
      why: "This is your backup. The stronger it is, the better your position in the meeting.",
      kind: "cards",
      options: [
        { id: "quoted", label: "Yes, with a quote I can use", hint: "You could place the order", icon: "✓" },
        { id: "approved", label: "Approved, but no quote yet", hint: "They can quote, but have not", icon: "○" },
        { id: "developing", label: "Still being developed", hint: "Samples, trials or audits pending", icon: "…" },
        { id: "none", label: "No other supplier", hint: "Build one before asking for a big cut", icon: "×" },
      ],
    },
    {
      id: "switching",
      kicker: "Competition",
      title: "How hard is it to change supplier?",
      subtitle: "Think about tools, approvals, trials, training and the risk of a bad first lot.",
      why: "Think about how much time, cost and effort it takes to start buying from someone else.",
      kind: "cards",
      options: [
        { id: "easy", label: "Easy", hint: "A few weeks", icon: "→" },
        { id: "moderate", label: "A real effort", hint: "Some trials and paperwork", icon: "⇒" },
        { id: "hard", label: "Hard", hint: "Tools, testing or customer approval needed", icon: "▤" },
        { id: "locked", label: "Locked in", hint: "Design, licence or rules tie you in", icon: "🔒" },
      ],
    },
    {
      id: "supplierType",
      kicker: "The supplier",
      title: "What kind of supplier is this?",
      subtitle: "A trader, a maker and a sole-source brand react differently.",
      why: "A trader resells goods made by others. A manufacturer makes them. An OEM sells its own branded or special product.",
      kind: "cards",
      options: [
        { id: "many", label: "One of many makers", hint: "Many others can make it", icon: "▦" },
        { id: "trader", label: "Trader or distributor", hint: "They may buy from a main maker", icon: "⇄" },
        { id: "oem", label: "Brand or OEM", hint: "Fixed price list, small discounts", icon: "▣" },
        { id: "monopoly", label: "Almost the only source", hint: "Very few can supply it", icon: "●" },
      ],
    },
    {
      id: "market",
      kicker: "The market",
      title: "Where is the market price heading?",
      subtitle: "Think of the raw material or freight price you follow.",
      kind: "cards",
      options: [
        { id: "falling", label: "Falling", hint: "Hard for them to justify a hike", icon: "↓" },
        { id: "stable", label: "Stable", hint: "No new reason for a hike", icon: "→" },
        { id: "rising", label: "Rising", hint: "A cut may need something in return", icon: "↑" },
        { id: "volatile", label: "Going up and down", hint: "Agree a price formula, not a guess", icon: "↕" },
      ],
    },
    {
      id: "mechanism",
      kicker: "The market",
      title: "How should the price change after you sign?",
      subtitle: "A named index is better than “raw material has increased”.",
      why: "An index is a published price, for example for steel or polymer. Linking your price to it avoids random price hikes.",
      kind: "cards",
      options: [
        { id: "fixed", label: "Fixed for the whole contract", hint: "They take the market risk", icon: "▬" },
        { id: "index", label: "Linked to an index / formula", hint: "A published index with a start date", icon: "ƒ" },
        { id: "review", label: "Change only with proof", hint: "No change without data", icon: "☰" },
        { id: "blanket", label: "They want a flat increase", hint: "Do not accept a flat percentage", icon: "!" },
      ],
    },
    {
      id: "volume",
      kicker: "Volume",
      title: "What can you do with volume?",
      subtitle: "Volume only helps if you can really give it.",
      kind: "cards",
      options: [
        { id: "more", label: "I can offer more volume", hint: "Giving them more share, or growing demand", icon: "＋" },
        { id: "same", label: "About the same volume", hint: "Share a clear forecast, but no false promise", icon: "=" },
        { id: "less", label: "Volume is falling", hint: "Do not pretend to be a bigger customer", icon: "−" },
        { id: "once", label: "This is one-off", hint: "Negotiate this lot only. Do not promise future orders", icon: "1" },
      ],
    },
    {
      id: "commitment",
      kicker: "Volume",
      title: "What commitment can you sign?",
      subtitle: "A firm commitment should get a better price. A forecast is not a promise.",
      why: "Slab pricing means the price falls as you buy more. A forecast is only an estimate. It does not bind you.",
      kind: "cards",
      options: [
        { id: "firm", label: "Fixed yearly quantity", hint: "You can write a quantity in the contract", icon: "✓" },
        { id: "slab", label: "Slab pricing", hint: "Bigger quantity, bigger discount", icon: "▤" },
        { id: "forecast", label: "Forecast only", hint: "Estimate only, not a promise", icon: "◔" },
        { id: "none", label: "No commitment", hint: "Stay flexible, but expect less discount", icon: "○" },
      ],
    },
    {
      id: "paymentNow",
      kicker: "Cash",
      title: "What payment terms do you have today?",
      subtitle: "Count from the invoice date, not from a verbal promise.",
      kind: "dropdown",
      options: [
        { id: "advance", label: "Advance / payment before delivery" },
        { id: "d7", label: "Within 7 days" },
        { id: "d15", label: "15 days" },
        { id: "d30", label: "30 days" },
        { id: "d45", label: "45 days" },
        { id: "d60", label: "60 days" },
        { id: "d90", label: "90 days or more" },
      ],
    },
    {
      id: "paymentOffer",
      kicker: "Cash",
      title: "What payment move can you trade?",
      subtitle: "Change payment days only if you get something clear in return.",
      why: "Paying faster helps the supplier. Ask for a discount or priority in return.",
      kind: "cards",
      options: [
        { id: "faster", label: "I can pay faster", hint: "Use it to get a lower price or priority", icon: "⚡" },
        { id: "same", label: "Keep today’s terms", hint: "Do not give this away for free", icon: "=" },
        { id: "slower", label: "I need longer credit", hint: "Expect to pay more for longer credit", icon: "⏳" },
        { id: "split", label: "Part payments (milestones)", hint: "Useful for machines and projects", icon: "▤" },
      ],
    },
    {
      id: "lead",
      kicker: "Delivery",
      title: "Does their delivery time suit your plant?",
      subtitle: "Compare their delivery time with the date your plant needs it.",
      kind: "cards",
      options: [
        { id: "late", label: "Too slow", hint: "They will deliver after you need it", icon: "⏱" },
        { id: "tight", label: "Just about fits", hint: "No spare time if they are late", icon: "△" },
        { id: "ok", label: "Fits comfortably", hint: "Delivery time is not an issue", icon: "✓" },
        { id: "fast", label: "Faster than I need", hint: "Do not pay extra for speed you do not need", icon: "»" },
      ],
    },
    {
      id: "reliability",
      kicker: "Delivery",
      title: "How reliable have deliveries been?",
      subtitle: "Use your own records, not what the supplier says.",
      kind: "cards",
      options: [
        { id: "good", label: "On time", hint: "A good point you can appreciate", icon: "✓" },
        { id: "mixed", label: "Mixed", hint: "Sometimes late, sometimes fine", icon: "↔" },
        { id: "poor", label: "Often late", hint: "Get dates and penalties in writing", icon: "!" },
        { id: "unknown", label: "No track record", hint: "New supplier or new route", icon: "?" },
      ],
    },
    {
      id: "quality",
      kicker: "Risk",
      title: "What is the quality risk?",
      subtitle: "If quality problems can stop your line or hurt customers, do not push price too hard.",
      kind: "cards",
      options: [
        { id: "low", label: "Low", hint: "Easy to check, easy to replace", icon: "○" },
        { id: "medium", label: "Medium", hint: "A bad lot hurts, but you can recover", icon: "△" },
        { id: "high", label: "High", hint: "Rejects, rework or customer complaints", icon: "!" },
        { id: "critical", label: "Critical", hint: "Safety, legal or production stop", icon: "●" },
      ],
    },
    {
      id: "spec",
      kicker: "Risk",
      title: "Can the specification move?",
      subtitle: "A small change in specification can save more than hours of price talk.",
      why: "Specification means the technical details of what you buy: grade, size, tolerance, packing.",
      kind: "cards",
      options: [
        { id: "fixed", label: "Fixed. Cannot change", hint: "Customer, drawing or rule", icon: "▬" },
        { id: "minor", label: "Small flexibility", hint: "Packing, tolerance or equal brand", icon: "≈" },
        { id: "redesign", label: "We can redesign", hint: "Engineering can reduce cost", icon: "✎" },
        { id: "commodity", label: "It is a standard item", hint: "Compare equal items, then choose the cheaper", icon: "▦" },
      ],
    },
    {
      id: "moq",
      kicker: "Supply",
      title: "Is the minimum order a problem?",
      subtitle: "Minimum order (MOQ), part deliveries and your store space go together.",
      why: "MOQ means minimum order quantity: the smallest quantity the supplier will sell.",
      kind: "cards",
      options: [
        { id: "high", label: "MOQ is too high", hint: "Money and space are stuck in stock", icon: "↑" },
        { id: "ok", label: "MOQ is acceptable", hint: "Not a big issue", icon: "✓" },
        { id: "more", label: "I can take a bigger quantity", hint: "Ask for a lower price in return", icon: "＋" },
        { id: "vmi", label: "I want part deliveries or supplier-held stock", hint: "They keep stock, you call when needed", icon: "↻" },
      ],
    },
    {
      id: "freight",
      kicker: "Landed cost",
      title: "Who should pay the freight?",
      subtitle: "Compare the final cost at your plant. A cheap ex-works price can become costly after freight.",
      why: "Freight is the transport cost. The best price is the one that is lowest after freight and tax.",
      kind: "dropdown",
      options: [
        { id: "for", label: "Delivered to our plant (FOR)" },
        { id: "exw", label: "Ex-works or ex-godown" },
        { id: "cif", label: "Import up to our port (CIF/CFR)" },
        { id: "buyer", label: "We arrange our own logistics" },
        { id: "unsure", label: "Not decided" },
      ],
    },
    {
      id: "tooling",
      kicker: "Ownership",
      title: "Who owns the tools, dies or licences?",
      subtitle: "If they own the tool, changing supplier becomes hard.",
      why: "Tools are the moulds, dies or fixtures made for your parts. Whoever owns them has an advantage.",
      kind: "cards",
      options: [
        { id: "buyer", label: "We own the tool or licence", hint: "You can take it elsewhere", icon: "✓" },
        { id: "supplier", label: "Supplier owns it", hint: "Ask them to release it, or make a second tool", icon: "■" },
        { id: "shared", label: "Cost is shared or spread over orders", hint: "Write down what happens if you leave", icon: "⇄" },
        { id: "none", label: "No tools or licence", hint: "Nothing stops you changing supplier", icon: "○" },
      ],
    },
    {
      id: "warranty",
      kicker: "Service",
      title: "What support do you need after delivery?",
      subtitle: "Select all that you need.",
      kind: "multi",
      options: [
        { id: "standard", label: "Normal warranty is enough", hint: "Do not pay for cover you will not use", icon: "○" },
        { id: "extended", label: "I want longer warranty", hint: "Get it in return for price", icon: "＋" },
        { id: "amc", label: "Service contract or uptime promise", hint: "Write the response time and penalty", icon: "⏱" },
        { id: "spares", label: "Spares availability matters", hint: "Ask the price of spares, not only the machine", icon: "⚙" },
      ],
    },
    {
      id: "term",
      kicker: "Contract",
      title: "How long a deal do you want?",
      subtitle: "A longer contract is a favour to them. You should get a better price or supply promise.",
      kind: "dropdown",
      options: [
        { id: "spot", label: "This order only" },
        { id: "m6", label: "About 6 months" },
        { id: "y1", label: "1 year" },
        { id: "y2", label: "2–3 years" },
        { id: "unsure", label: "Not decided" },
      ],
    },
    {
      id: "validity",
      kicker: "Contract",
      title: "How long should the price stay valid?",
      subtitle: "Fix how long the price holds and when it can change.",
      kind: "dropdown",
      options: [
        { id: "d30", label: "30 days" },
        { id: "d90", label: "90 days" },
        { id: "m6", label: "6 months" },
        { id: "y1", label: "Through a 1-year contract" },
        { id: "formula", label: "Valid, but linked to a formula" },
      ],
    },
    {
      id: "urgency",
      kicker: "Timing",
      title: "How soon must this be finalised?",
      subtitle: "If they can see your urgency, do not make threats you cannot keep.",
      kind: "cards",
      options: [
        { id: "planned", label: "Planned, 90 days or more", hint: "You have time", icon: "◔" },
        { id: "quarter", label: "This quarter", hint: "Time to get another quote", icon: "◑" },
        { id: "month", label: "Within 30 days", hint: "Keep the talk focused", icon: "◕" },
        { id: "down", label: "Plant is stopped or stock is over", hint: "Get material first, discuss price later", icon: "!" },
      ],
    },
    {
      id: "relationship",
      kicker: "Relationship",
      title: "What is the relationship today?",
      subtitle: "A good relationship helps, but you still need to check the numbers.",
      kind: "cards",
      options: [
        { id: "new", label: "New to us", hint: "Check quality before a long commitment", icon: "✦" },
        { id: "transactional", label: "Transactional", hint: "Little loyalty on either side", icon: "⇄" },
        { id: "preferred", label: "Preferred supplier", hint: "Good supplier, but still negotiate", icon: "★" },
        { id: "partner", label: "Strategic partner", hint: "Be fair. No surprises", icon: "🤝" },
      ],
    },
    {
      id: "compliance",
      kicker: "Constraints",
      title: "Which constraint is real here?",
      subtitle: "Select all that apply. Pick only rules your company really follows.",
      kind: "multi",
      options: [
        { id: "none", label: "No special constraint", hint: "Commercial decision", icon: "○" },
        { id: "iso", label: "Quality certificate is compulsory", hint: "ISO, IATF, or customer approval", icon: "✓" },
        { id: "msme", label: "MSME / local supplier preference", hint: "Only if your company policy says so", icon: "⌂" },
        { id: "import", label: "Import, exchange rate or duty matters", hint: "Final cost and delivery time", icon: "✈" },
        { id: "audit", label: "Single source needing audit proof", hint: "Write down why you cannot change", icon: "☰" },
      ],
    },
    {
      id: "costLens",
      kicker: "The cost",
      title: "Which cost will you negotiate on?",
      subtitle: "Unit price alone hides freight, duty, rejects, stock cost and downtime.",
      why: "Choose Final cost at plant if freight, duty or handling are a big part of the price.",
      kind: "cards",
      options: [
        { id: "unit", label: "Unit price", hint: "Same item, same delivery, same terms", icon: "₹" },
        { id: "landed", label: "Final cost at plant", hint: "Price + freight + duty + handling", icon: "📦" },
        { id: "tco", label: "Total cost of use", hint: "Life, power, rejects, spares, downtime", icon: "∑" },
      ],
    },
    {
      id: "approval",
      kicker: "Your authority",
      title: "Who can approve the deal?",
      subtitle: "Do not offer something you still need approval for.",
      why: "This decides whether you can agree during the meeting, or must say you will check with your manager.",
      kind: "cards",
      options: [
        { id: "self", label: "I can close within my limit", hint: "You can agree during the meeting", icon: "✓" },
        { id: "manager", label: "My manager must approve", hint: "Do not agree new offers on the spot", icon: "↑" },
        { id: "committee", label: "A committee or board decides", hint: "Aim for a recommendation, not a signature", icon: "☰" },
      ],
    },
    {
      id: "goal",
      kicker: "Your aim",
      title: "What do you want from this meeting?",
      subtitle: "You can select more than one. Select all that matter.",
      kind: "multi",
      options: goals,
    },
    {
      id: "alsoWant",
      kicker: "Your aim",
      title: "What else must not become worse?",
      subtitle: "Select every point that must not become worse. You can give on small things.",
      kind: "multi",
      options: goals.filter((g) => !(answers.goal || "").split(",").includes(g.id)).length ? goals.filter((g) => !(answers.goal || "").split(",").includes(g.id)) : goals,
    },
    {
      id: "theySaid",
      kicker: "Their words",
      title: "What do you expect them to say?",
      subtitle: "Select all the things you expect to hear. The plan gives you a reply for each.",
      kind: "multi",
      options: [
        { id: "none", label: "Nothing yet", hint: "You are preparing for the first talk", icon: "○" },
        { id: "final", label: "This is our final price", hint: "A common closing line", icon: "■" },
        { id: "rm", label: "Raw material has increased", hint: "Ask which material and how much", icon: "↑" },
        { id: "margin", label: "Our margin is already thin", hint: "Discuss the whole package, not the slogan", icon: "−" },
        { id: "moq", label: "We cannot reduce MOQ", hint: "Ask for part deliveries instead", icon: "▤" },
        { id: "credit", label: "We cannot give credit", hint: "Ask what a cash discount would be", icon: "🏦" },
        { id: "lead", label: "Lead time cannot improve", hint: "Ask what quantity or forecast would help", icon: "⏱" },
        { id: "cheap", label: "The cheaper quote is not equal", hint: "Make a side-by-side comparison", icon: "≠" },
        { id: "allocation", label: "Material is in short supply", hint: "Keep supply and price separate", icon: "!" },
      ],
    },
    {
      id: "style",
      kicker: "Your style",
      title: "How do you want to run the meeting?",
      subtitle: "The words will match your style. The numbers will not change.",
      kind: "cards",
      options: [
        { id: "firm", label: "Firm and short", hint: "Clear ask, short talk", icon: "▬" },
        { id: "collaborative", label: "Collaborative", hint: "Solve the package together", icon: "🤝" },
        { id: "principled", label: "Fact-based", hint: "Facts, data and options", icon: "⚖" },
      ],
    },
    {
      id: "costData",
      kicker: "Your preparation",
      title: "How well do you know the cost?",
      subtitle: "Cost estimate, another quote or last price. A feeling is not a number.",
      why: "A cost estimate means you worked out what the item should cost: material + making cost + profit.",
      kind: "cards",
      options: [
        { id: "should", label: "I have a cost estimate", hint: "Material + making cost + overheads", icon: "∑" },
        { id: "quotes", label: "I have other quotes", hint: "Same item, same delivery terms", icon: "☰" },
        { id: "history", label: "I only have last price", hint: "Useful, but adjust for market change", icon: "↺" },
        { id: "thin", label: "Mostly their quote", hint: "Ask questions before naming a price", icon: "?" },
      ],
    },
  ];
}

export function questionLabel(questions: Question[], id: string, optionId: string) {
  const q = questions.find((item) => item.id === id);
  return optionId
    .split(",")
    .filter(Boolean)
    .map((one) => q?.options.find((o) => o.id === one)?.label ?? one)
    .join("; ");
}
