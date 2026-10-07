import type { Answers, Stance, Strategy } from "./types";

const clamp = (n: number) => Math.max(4, Math.min(96, Math.round(n)));

function has(a: Answers, id: string, value: string) {
  return a[id] === value;
}

export function analyse(a: Answers): Strategy {
  let score = 50;
  const bump = (when: boolean, n: number) => {
    if (when) score += n;
  };

  bump(has(a, "suppliers", "1"), -18);
  bump(has(a, "suppliers", "2"), -4);
  bump(has(a, "suppliers", "3"), 10);
  bump(has(a, "suppliers", "5"), 18);
  bump(has(a, "alternate", "quoted"), 16);
  bump(has(a, "alternate", "approved"), 8);
  bump(has(a, "alternate", "developing"), 1);
  bump(has(a, "alternate", "none"), -12);
  bump(has(a, "switching", "easy"), 10);
  bump(has(a, "switching", "hard"), -10);
  bump(has(a, "switching", "locked"), -16);
  bump(has(a, "volume", "more"), 10);
  bump(has(a, "volume", "same"), 2);
  bump(has(a, "volume", "less"), -6);
  bump(has(a, "volume", "once"), -4);
  bump(has(a, "commitment", "firm"), 6);
  bump(has(a, "commitment", "none"), -4);
  bump(has(a, "urgency", "planned"), 8);
  bump(has(a, "urgency", "quarter"), 2);
  bump(has(a, "urgency", "month"), -8);
  bump(has(a, "urgency", "down"), -18);
  bump(has(a, "walkaway", "comfortable"), 8);
  bump(has(a, "walkaway", "tight"), -4);
  bump(has(a, "walkaway", "none"), -10);
  bump(has(a, "walkaway", "must"), -14);
  bump(has(a, "supplierType", "many"), 10);
  bump(has(a, "supplierType", "trader"), 4);
  bump(has(a, "supplierType", "oem"), -8);
  bump(has(a, "supplierType", "monopoly"), -16);
  bump(has(a, "market", "falling"), 8);
  bump(has(a, "market", "rising"), -6);
  bump(has(a, "deal", "tender"), 8);
  bump(has(a, "deal", "emergency"), -10);
  bump(has(a, "deal", "spot"), -3);
  bump(has(a, "portfolio", "leverage"), 6);
  bump(has(a, "portfolio", "routine"), 4);
  bump(has(a, "portfolio", "bottleneck"), -8);
  bump(has(a, "portfolio", "strategic"), -6);
  bump(has(a, "quality", "high"), -4);
  bump(has(a, "quality", "critical"), -8);
  bump(has(a, "spec", "commodity"), 6);
  bump(has(a, "spec", "fixed"), -2);
  bump(has(a, "floor", "well-below"), 6);
  bump(has(a, "floor", "final"), -4);
  bump(has(a, "quoteMove", "up-big"), 3);
  bump(has(a, "quoteMove", "down"), -2);
  bump(has(a, "paymentOffer", "faster"), 4);
  bump(has(a, "paymentOffer", "slower") && has(a, "paymentNow", "d90"), -4);
  bump(has(a, "costData", "should"), 5);
  bump(has(a, "costData", "quotes"), 6);
  bump(has(a, "costData", "thin"), -8);
  bump(has(a, "gap", "unknown"), -6);

  const leverage = clamp(score);
  const power: Strategy["power"] = leverage >= 65 ? "Buyer" : leverage <= 40 ? "Supplier" : "Balanced";

  const plantDown = has(a, "urgency", "down");
  const noAlt = has(a, "alternate", "none");
  const single = has(a, "suppliers", "1");
  const extreme = has(a, "gap", "extreme");
  const noTarget = has(a, "gap", "unknown");
  const finalPrice = has(a, "floor", "final") || has(a, "theySaid", "final");
  const noRoom = has(a, "walkaway", "must") || has(a, "walkaway", "none");
  const thinData = has(a, "costData", "thin");

  let stance: Stance = "Trade";
  if (noTarget || (extreme && finalPrice && noRoom) || (extreme && single && noAlt && noRoom)) stance = "Reset";
  else if (plantDown || (single && noAlt) || leverage < 38) stance = "Protect";
  else if (leverage >= 67 && !plantDown) stance = "Press";

  const stanceReason =
    stance === "Reset"
      ? noTarget
        ? "You do not have a target price yet. Set one from the last price, another quote, or a simple cost estimate before you ask for a discount."
        : "The gap is big and you cannot really walk away. First change the scope, payment terms or supplier options. Do not fight only on price."
      : stance === "Protect"
        ? plantDown
          ? "You need material urgently. Secure the supply first. Discuss price later, when you have time and another supplier."
          : "Your backup is weak. Negotiate carefully and start building a second supplier at the same time."
        : stance === "Press"
          ? "You have choices, time or volume. Make a clear ask and give something only when you get something clear in return."
          : "Neither side can force the other. Exchange volume, payment terms, price validity or scope for a better price.";

  const opening = openingLine(a, stance);
  const target = targetLine(a);
  const walkAway = walkLine(a, stance);
  const zopa = zopaLine(a, stance);
  const batna = batnaLine(a);

  const levers = buildLevers(a, stance);
  const trades = buildTrades(a);
  const script = buildScript(a, stance, opening);
  const replies = buildReplies(a.theySaid);
  const risks = buildRisks(a, stance, thinData);
  const checklist = buildChecklist(a);
  const tips = categoryTips(a.category);

  const title =
    stance === "Press"
      ? "You are in a strong position. Make a clear ask."
      : stance === "Trade"
        ? "Give and take. Negotiate the whole package."
        : stance === "Protect"
          ? "Protect your supply. Do not bluff."
          : "Set your target before you negotiate.";

  const summary = `${stanceReason} Your main aim is ${aim(a.goal)}. Do not lose ${aim(a.alsoWant)} while you try.`;

  return {
    title,
    summary,
    stance,
    stanceReason,
    leverage,
    power,
    opening,
    target,
    walkAway,
    zopa,
    batna,
    levers,
    trades,
    script,
    replies,
    risks,
    checklist,
    tips,
  };
}

function aim(id?: string) {
  const map: Record<string, string> = {
    price: "a lower price",
    payment: "better payment",
    lead: "reliable delivery",
    quality: "lower quality risk",
    risk: "less dependency",
    package: "a better total package",
  };
  return map[id || ""] || "a workable package";
}

function openingLine(a: Answers, stance: Stance) {
  if (has(a, "gap", "unknown") || has(a, "costData", "thin")) {
    return "Do not ask for a discount yet. First ask what makes up their price. Make your offer only after you set a target.";
  }
  if (stance === "Reset") {
    return "Start by checking that both sides are quoting for the same item and scope. Arguing about percentages on the wrong specification wastes the meeting.";
  }
  if (stance === "Protect") {
    return has(a, "urgency", "down")
      ? "Start with the delivery date and a small urgent quantity. Ask for a small price benefit now, and fix a second meeting to discuss price properly."
      : "Offer 2–4% below their quote (or your target, if it is closer). Link it to a written package of terms.";
  }
  if (stance === "Press") {
    if (has(a, "gap", "wide") || has(a, "gap", "extreme")) {
      return "Offer about 8–12% below their quote. Be ready to explain why: other suppliers, your volume, or falling market prices.";
    }
    if (has(a, "gap", "tiny") || has(a, "gap", "small")) {
      return "Offer your target price. The gap is small, so spend the meeting on payment terms, price validity, freight and service.";
    }
    return "Offer about 5–8% below their quote. Keep your target as the price you can actually sign.";
  }
  if (has(a, "gap", "wide") || has(a, "gap", "extreme")) {
    return "Offer about 6–8% below their quote. Show what you give in return: volume, payment, contract length or specification.";
  }
  return "Offer your target price. Ask them to close the small gap with one clear give-and-take.";
}

function targetLine(a: Answers) {
  if (has(a, "gap", "unknown")) return "Set a target before the meeting. Use the last price adjusted for the market, a similar quote, or a simple cost estimate.";
  if (has(a, "gap", "tiny")) return "Your target is already close. Sign if the other terms are fine.";
  if (has(a, "gap", "small")) return "Stay on your target. Give something small only if it gets you the last 3–5%.";
  if (has(a, "gap", "medium")) return "To reach your target you need one real give-and-take: more volume, faster payment, a longer contract or a simpler specification.";
  if (has(a, "gap", "wide")) return "Reach your target in steps. Price, freight, minimum order and validity should all improve together.";
  return "A gap of more than 20% usually means the specification, scope or supplier is wrong. Check this before chasing your target.";
}

function walkLine(a: Answers, stance: Stance) {
  if (has(a, "walkaway", "must") || has(a, "urgency", "down")) {
    return "Do not threaten to walk away. Your limit is the best written package you can get, with a date to review it again.";
  }
  if (has(a, "walkaway", "comfortable") || has(a, "alternate", "quoted")) {
    return "Your walk-away is real: if this offer misses your limit, buy from your other approved supplier at their final cost at your plant.";
  }
  if (stance === "Reset") return "Pause the talks if they will not discuss scope, data or validity. Accepting the quote as it is would lock in a bad price.";
  return "If the offer misses your limit, pause and develop another supplier. Say this calmly, only once.";
}

function zopaLine(a: Answers, stance: Stance) {
  if (has(a, "gap", "unknown") || has(a, "floor", "unknown") || has(a, "costData", "thin")) {
    return "We cannot tell yet if a deal is possible. You need to know what drives their cost, and set your own target, to see where both sides can agree.";
  }
  if (has(a, "floor", "well-below") && (has(a, "walkaway", "comfortable") || has(a, "walkaway", "tight"))) {
    return "A deal is likely possible between their lowest price and your limit. Stay in that zone and move towards your target.";
  }
  if (has(a, "floor", "slight") || has(a, "floor", "final")) {
    return "The room looks small if their lowest price is real. Test it by changing other terms. If nothing else moves, their quote is the deal zone.";
  }
  if (stance === "Reset") return "There may be no deal possible with this specification and urgency. Change one of them first.";
  return "Assume there is a little room until another quote or their cost breakup shows otherwise.";
}

function batnaLine(a: Answers) {
  if (has(a, "alternate", "quoted")) return "Keep the other supplier's quote alive. Compare final cost, quality risk and delivery time. Show that comparison instead of just saying “we have options”.";
  if (has(a, "alternate", "approved")) return "Ask your approved supplier for an equal quote before the next meeting. That quote is your backup plan.";
  if (has(a, "alternate", "developing")) return "Your backup plan is not ready. Fix dates for samples, audit and first trial so it becomes real.";
  if (has(a, "deal", "tender")) return "The other tender offers are your backup. Bring freight, tax, payment and specification to the same basis before you compare them.";
  return "You have no backup plan yet. Build a second supplier, an alternative specification, or a small stop-gap order before you make a final demand.";
}

function buildLevers(a: Answers, stance: Stance): Strategy["levers"] {
  const use = "Use now";
  const hold = "Hold";
  const avoid = "Avoid";
  const levers: Strategy["levers"] = [];

  levers.push({
    name: has(a, "costLens", "tco") ? "Total cost of use" : has(a, "costLens", "landed") ? "Final cost at plant" : "Unit price",
    detail: "Negotiate on the cost you chose. Note freight, tax, payment and warranty next to it, so a low unit price cannot hide extra cost.",
    tag: use,
  });

  if (has(a, "volume", "more") || has(a, "commitment", "firm") || has(a, "commitment", "slab")) {
    levers.push({
      name: "Volume or slab pricing",
      detail: "Offer a fixed quantity or slabs only for a lower price or a promise of supply. Write the quantity and price together in the contract.",
      tag: use,
    });
  } else {
    levers.push({
      name: "Share your forecast",
      detail: "Share your forecast, but say it is not a commitment. Ask what price or delivery benefit they will give for it.",
      tag: hold,
    });
  }

  levers.push({
    name: "Payment",
    detail: has(a, "paymentOffer", "faster")
      ? "Faster payment is valuable to them. Agree the discount or priority you get before you reduce the credit days."
      : has(a, "paymentOffer", "slower")
        ? "Longer credit is a favour from them. Expect them to ask for a higher price or a credit limit."
        : has(a, "paymentOffer", "split")
          ? "Pay in parts: a small advance, a part on dispatch, and the balance after you accept the goods."
          : "Keep your current payment terms unless a change gets you a clear benefit.",
    tag: has(a, "paymentOffer", "same") ? hold : use,
  });

  levers.push({
    name: "Delivery time and reliability",
    detail: has(a, "lead", "late") || has(a, "reliability", "poor")
      ? "Ask for a dated plan to fix delays, a small urgent quantity, and a penalty if they are late again. Keep this separate from price."
      : "Do not pay extra for speed you do not need. If they deliver on time, appreciate it and move on to price.",
    tag: has(a, "lead", "late") || has(a, "reliability", "poor") || has(a, "goal", "lead") ? use : hold,
  });

  levers.push({
    name: "Price validity and formula",
    detail: has(a, "mechanism", "blanket")
      ? "Do not accept a flat percentage hike. Ask which material, which index, how much of the cost it is, and from which date."
      : has(a, "mechanism", "index") || has(a, "market", "volatile")
        ? "Agree a published index, how much of the cost it covers, a review date, and a maximum limit if your policy needs one."
        : "Ask them to hold the price for the period you chose. Allow changes only with proof.",
    tag: use,
  });

  levers.push({
    name: "Minimum order (MOQ) and part deliveries",
    detail: has(a, "moq", "high") || has(a, "moq", "vmi")
      ? "If they will not reduce the minimum order, ask for scheduled part deliveries or stock kept at their place, so your money is not blocked."
      : has(a, "moq", "more")
        ? "A bigger quantity can get you a lower price. Fix the price before you increase the order."
        : "Do not push on minimum order unless it is blocking your money in stock.",
    tag: has(a, "moq", "ok") ? hold : use,
  });

  if (has(a, "spec", "minor") || has(a, "spec", "redesign") || has(a, "spec", "commodity")) {
    levers.push({
      name: "Specification",
      detail: has(a, "spec", "commodity")
        ? "Make the specifications equal and change supplier, or ask your current supplier to match the other offer."
        : "Ask engineering what can change: tolerance, brand or packing. A small change in specification can save more than a long price discussion.",
      tag: use,
    });
  }

  if (stance === "Protect" && (has(a, "quality", "high") || has(a, "quality", "critical"))) {
    levers.push({
      name: "Quality and acceptance",
      detail: "A bad lot costs more than a price cut saves. Agree on inspection, rejection, replacement time, and who pays freight on rejected goods.",
      tag: use,
    });
  } else {
    levers.push({
      name: "Warranty and service",
      detail: has(a, "warranty", "standard")
        ? "Accept the normal warranty. Use your effort on price or delivery."
        : "A longer warranty, service contract or spares cover is a benefit for you. Write the response time, what is not covered, and the penalty if they miss it.",
      tag: has(a, "warranty", "standard") ? hold : use,
    });
  }

  if (has(a, "tooling", "supplier") || has(a, "tooling", "shared")) {
    levers.push({
      name: "Tool ownership",
      detail: "Write who owns the tool, its remaining value, and how fast it can be moved if you add another supplier or leave.",
      tag: use,
    });
  }

  levers.push({
    name: "Contract length",
    detail: has(a, "term", "y2")
      ? "A 2–3 year contract is a big favour to them. You should get a better price, supply promise and a way to review or exit."
      : has(a, "term", "spot")
        ? "Do not promise a long relationship for a one-time order."
        : "Match the contract length with the price validity. A long contract with an open price only creates long arguments.",
    tag: has(a, "term", "spot") ? avoid : hold,
  });

  return levers.slice(0, 8);
}

function buildTrades(a: Answers): Strategy["trades"] {
  const trades: Strategy["trades"] = [
    {
      give: "Nothing for free",
      get: "For every favour you give, note what you get, its value and who must approve it",
    },
  ];

  if (has(a, "volume", "more") || has(a, "commitment", "firm")) {
    trades.push({ give: "A fixed quantity or more business share", get: "A lower price or reserved capacity, written in the same clause" });
  } else if (has(a, "commitment", "slab")) {
    trades.push({ give: "Quantity as you buy it", get: "Prices that fall as your purchased quantity grows" });
  } else {
    trades.push({ give: "A rolling forecast", get: "Better delivery time or a fixed price review date" });
  }

  if (has(a, "paymentOffer", "faster")) {
    trades.push({ give: "Faster payment", get: "A clear early-payment discount or priority supply" });
  } else if (has(a, "paymentOffer", "slower")) {
    trades.push({ give: "A slightly higher price or a smaller discount", get: "The longer credit days you need" });
  } else if (has(a, "paymentOffer", "split")) {
    trades.push({ give: "An advance on a milestone", get: "Price held, a dispatch date and ownership terms you accept" });
  } else {
    trades.push({ give: "No change in payment", get: "Do not give payment terms away for free" });
  }

  if (has(a, "lead", "late") || has(a, "goal", "lead")) {
    trades.push({ give: "A fixed forecast or a slightly larger order", get: "Shorter delivery time, and a penalty if they miss it" });
  }

  if (has(a, "moq", "more")) {
    trades.push({ give: "A bigger order quantity", get: "A lower unit price before you increase the order" });
  } else if (has(a, "moq", "high") || has(a, "moq", "vmi")) {
    trades.push({ give: "A steady delivery schedule", get: "A lower minimum order, or stock kept at their risk" });
  }

  if (has(a, "term", "y1") || has(a, "term", "y2")) {
    trades.push({ give: "A longer contract", get: "Price protection, supply promise and a review or exit clause" });
  }

  if (has(a, "warranty", "extended") || has(a, "warranty", "amc") || has(a, "warranty", "spares")) {
    trades.push({ give: "A fair price on the main item", get: "The warranty, service or spares promise in writing" });
  }

  if (has(a, "mechanism", "blanket") || has(a, "market", "volatile") || has(a, "theySaid", "rm")) {
    trades.push({ give: "Acceptance of a fair index-based change", get: "No flat hike. Show the index, share of cost, start date and proof" });
  }

  if (has(a, "approval", "manager") || has(a, "approval", "committee")) {
    trades.push({ give: "A recommendation, not a signature in the meeting", get: "Their best offer kept valid until your approval date" });
  }

  return trades.slice(0, 7);
}

function buildScript(a: Answers, stance: Stance, opening: string): Strategy["script"] {
  let open =
    stance === "Protect"
      ? "We want supply to stay stable. The commercial terms must also work for us. Let us discuss the delivery date and the price separately and settle both properly."
      : stance === "Reset"
        ? "Before we talk about discount, let us confirm we are quoting for the same item and delivery. Otherwise we will discuss the wrong number."
        : "We want a long-term deal, but the current offer does not meet our target. Let us look at the whole offer, not only the unit price.";
  if (stance !== "Protect" && stance !== "Reset" && has(a, "style", "firm")) {
    open = "Let me be direct. The current offer does not meet our target. Let us settle price, validity and delivery today.";
  }
  if (stance !== "Protect" && stance !== "Reset" && has(a, "style", "collaborative")) {
    open = "We want this to work for both of us. The current offer misses our target, so let us find one or two changes that close the gap.";
  }

  const probe = has(a, "theySaid", "rm") || has(a, "mechanism", "blanket")
    ? "Which material or index went up, how much of the cost is it, and what is the effect per unit? A flat percentage is not enough to change the price."
    : has(a, "supplierType", "trader")
      ? "What do you get from the main maker, and which part of this offer can you change without asking them?"
      : "What makes up this price: material, making cost, freight or margin? And which of these can reduce if our volume, payment or forecast changes?";

  const trade = has(a, "volume", "more")
    ? "If we give you more volume, what price and supply promise can you give us in writing?"
    : has(a, "paymentOffer", "faster")
      ? "If we pay faster, what exact discount or priority will you give?"
      : "Which one change — volume, payment, minimum order or validity — would help you reach our price?";

  const close = has(a, "approval", "self")
    ? "If we agree price, validity, delivery time, payment, freight and quality terms today, I can confirm the order within my limit."
    : "I can recommend this offer to my management. I cannot approve new terms here. Please keep this offer valid until the approval date we agree.";

  const pause =
    stance === "Protect"
      ? "We will place the small urgent order we need. The price stays open for review on the date we write down."
      : "If we cannot agree, we will pause and use our other option. But I would rather agree a fair deal with you now.";

  return [
    { step: "Open", line: open },
    { step: "Probe", line: probe },
    { step: "Offer", line: opening },
    { step: "Trade", line: trade },
    { step: "Close", line: close },
    { step: "Pause", line: pause },
  ];
}

const REPLIES: { id: string; they: string; you: string }[] = [
  {
    id: "final",
    they: "This is our final price.",
    you: "Is this final for the unit price, or for the whole offer? If the price cannot move, what can improve in minimum order, payment, freight, validity or delivery time?",
  },
  {
    id: "rm",
    they: "Raw material prices have increased.",
    you: "Which material or index, from which date, and how many rupees per unit? We can agree a formula. We cannot accept a flat hike.",
  },
  {
    id: "margin",
    they: "Our margin is already very low.",
    you: "Then let us look at what helps you: volume, payment, specification or delivery. Which one reduces your cost the most?",
  },
  {
    id: "moq",
    they: "We cannot reduce the MOQ.",
    you: "Keep your batch size if you must. Can you deliver it in smaller parts, so our money is not blocked in stock?",
  },
  {
    id: "credit",
    they: "We cannot give credit.",
    you: "Then let us talk about cash. What discount can you give for advance or 15 days, and what credit limit at 30 or 45 days?",
  },
  {
    id: "lead",
    they: "Lead time cannot improve.",
    you: "What would help — a fixed forecast, ready stock, or part shipment? Please give us the best date in writing, with a penalty if it is missed.",
  },
  {
    id: "cheap",
    they: "The cheaper quote is not comparable.",
    you: "Fine. Let us make them equal: specification, delivery terms, tax, payment, warranty and delivery time. Then we compare what is left.",
  },
  {
    id: "allocation",
    they: "Material is on allocation.",
    you: "Let us first secure a small urgent quantity and a date. The price for it can be reviewed later. Please do not use the shortage to fix a high price for good.",
  },
  {
    id: "none",
    they: "(They have not said anything yet.)",
    you: "Let them speak first. Ask what drives their cost, how long the price is valid, and what they can change. Share your number after that.",
  },
];

function buildReplies(selected?: string): Strategy["replies"] {
  const list = REPLIES.map((r) => ({ ...r, pinned: r.id === selected }));
  return list.sort((x, y) => Number(y.pinned) - Number(x.pinned));
}

function buildRisks(a: Answers, stance: Stance, thinData: boolean) {
  const risks: string[] = [];
  if (thinData) risks.push("You are depending mostly on their quote. Any price you name may be only a guess.");
  if (has(a, "gap", "unknown")) risks.push("Without your own target, the supplier’s price becomes the target.");
  if (has(a, "urgency", "down")) risks.push("They can see your urgency. They will not believe a threat to walk away.");
  if (has(a, "suppliers", "1") || has(a, "alternate", "none")) risks.push("Only one supplier. Winning a price cut in a way that upsets them can put your supply at risk.");
  if (has(a, "quality", "critical") || has(a, "quality", "high")) risks.push("A cheaper supplier with poor quality will cost you more than the discount saves.");
  if (has(a, "switching", "locked") || has(a, "tooling", "supplier")) risks.push("Changing supplier is difficult because of design, tools or licence. Build another option before you threaten to leave.");
  if (has(a, "currency", "usd") || has(a, "currency", "eur") || has(a, "compliance", "import")) risks.push("Exchange rate, duty and freight can cancel a unit-price cut. Compare the final cost at your plant.");
  if (has(a, "quoteMove", "up-big") && has(a, "market", "falling")) risks.push("Their quote is higher but you believe the market is falling. Ask them to explain.");
  if (has(a, "paymentNow", "advance") && has(a, "relationship", "new")) risks.push("Do not pay a full advance to a new supplier. Start with a small trial order, a bank guarantee or part payments.");
  if (has(a, "approval", "committee")) risks.push("A verbal “yes” in the meeting may be rejected later by the committee. Get their offer in writing.");
  if (stance === "Press" && has(a, "relationship", "partner")) risks.push("You can ask a partner for a better price. Tell them in advance. Do not surprise them with a competing bid.");
  if (has(a, "spend", "unsure")) risks.push("Your yearly spend is not clear, so your volume strength may be smaller than you think. Check the yearly quantity before you promise anything.");
  if (!risks.length) risks.push("The main risk is a verbal agreement. If it is not written down, it is not agreed.");
  return risks.slice(0, 6);
}

function buildChecklist(a: Answers) {
  const items = [
    "Write the last price, this quote, your target and your walk-away limit on one page.",
    "Make specification, freight, GST, payment, delivery time and warranty equal before comparing offers.",
    "Decide the one thing you can give, and what you must get back.",
    "Know who must approve anything beyond your limit.",
  ];
  if (has(a, "alternate", "quoted") || has(a, "deal", "tender")) items.push("Carry your comparison sheet. Do not quote the other supplier’s price unless you are ready to place the order with them.");
  if (has(a, "mechanism", "index") || has(a, "mechanism", "blanket") || has(a, "market", "volatile")) {
    items.push("Note the index, how much of the cost it is, the start date and the next review date.");
  }
  if (has(a, "freight", "unsure") || has(a, "freight", "exw") || has(a, "freight", "cif")) {
    items.push("Convert every offer to the final delivered cost at your plant before you compare.");
  }
  if (has(a, "quality", "high") || has(a, "quality", "critical") || has(a, "compliance", "iso")) {
    items.push("Carry the quality standard, required certificates and rejection terms.");
  }
  if (has(a, "tooling", "supplier") || has(a, "tooling", "shared")) items.push("Carry the tool clause: ownership, remaining value and time to move it.");
  if (has(a, "urgency", "down")) items.push("Get the small urgent quantity and the last acceptable date from your plant team.");
  items.push("End with a written summary: price, validity, quantity, delivery time, payment, freight and quality.");
  return items.slice(0, 8);
}

function categoryTips(category?: string) {
  const common = [
    "Ask about GST rate, HSN code and whether freight is included. Compare final invoices, not only proforma invoices.",
    "If a government or PSU rule is not your company’s rule, do not follow it in the negotiation.",
  ];
  const extra: Record<string, string[]> = {
    "raw-materials": [
      "Split the price into material, making cost and freight. If the index explains the material price, negotiate the making cost.",
      "For polymers, metals and chemicals, a published index with a start date is better than a surprise every month.",
      "Check moisture, thickness, grade and packing. A lower price with poor yield is not a saving.",
    ],
    "oem-supplies": [
      "Ask whether the part is made only by them. If yes, negotiate spares and delivery time. There may be little room on price.",
      "An equal-quality alternative brand needs engineering and quality approval before you use it in the negotiation.",
    ],
    capex: [
      "Negotiate the full life cost: power, spares, installation, training and uptime, not only the machine price.",
      "Pay in parts. Hold back some payment until commissioning, and write down what “accepted” means.",
      "Get the price of two years of recommended spares in the same negotiation.",
    ],
    mro: [
      "Keep breakdown purchases separate from planned spares. An urgent price should not become your yearly rate.",
      "Ask for a price list with validity, and a list of critical spares with guaranteed delivery hours.",
    ],
    services: [
      "Define the scope, number of people or service level, and what is extra. If the scope is not clear, every invoice becomes an argument.",
      "Write the response time, penalties and notice period in the draft before you fix the rate.",
    ],
    general: [
      "Combine volumes from all your sites if you can, then ask for one rate list.",
      "Even small purchases need a second quote. Savings often come from the specification, not from loyalty.",
    ],
    vehicles: [
      "Keep vehicle price, freight rate, fuel formula and waiting charges separate. One “all-in” number hides where you can save.",
      "Ask for route-wise rates and a review linked to the fuel price.",
    ],
    it: [
      "Negotiate the licence type, renewal price cap, setup cost and exit terms (including your data), not only the first-year price.",
      "A discount on a ready product is easier than on people’s time. Ask which part of the price is which.",
    ],
    construction: [
      "Use a bill of quantities. Negotiate rates, extra work and price escalation separately.",
      "Agree how work is measured, rates for extra items and penalties for delay before work starts.",
    ],
    other: [
      "Write the scope in one paragraph before the meeting so both sides discuss the same job.",
    ],
  };
  return [...(extra[category || "other"] || extra.other), ...common];
}
