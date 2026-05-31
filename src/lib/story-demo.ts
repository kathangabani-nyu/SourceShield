export type DemoTip = {
  id: string;
  channel: string;
  status: "new" | "review";
  raw: string;
  safe: string;
  summary: string;
  isNew?: boolean;
};

export const SEED_DEMO_TIPS: DemoTip[] = [
  {
    id: "TIP-4471",
    channel: "iMessage",
    status: "new",
    raw: "Sarah Chen from procurement told me that on March 15th, the Westfield distribution contracts were backdated by about six weeks to avoid the audit window. She has the original timestamps and can be reached at +1 415 555 0179.",
    safe: '<span class="sensitive">Sarah Chen</span> from procurement told me that on <span class="sensitive">March 15th</span>, the <span class="sensitive">Westfield distribution</span> contracts were backdated by about six weeks to avoid the audit window. She has the original timestamps and can be reached at <span class="sensitive">+1 415 555 0179</span>.',
    summary:
      '<span class="redact-token" data-t="[name]">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> from procurement reported that on <span class="redact-token" data-t="[date]">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, contracts at <span class="redact-token" data-t="[location]">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> were backdated to avoid an audit window. Source has original timestamps.',
  },
  {
    id: "TIP-4472",
    channel: "Web",
    status: "review",
    raw: "I work in facilities at the Hargrove plant on Route 9. On April 2nd management told us to remove all documentation from Server Room B before the inspector arrived. My supervisor Marcus Webb was present.",
    safe: 'I work in facilities at the <span class="sensitive">Hargrove plant on Route 9</span>. On <span class="sensitive">April 2nd</span> management told us to remove all documentation from Server Room B before the inspector arrived. My supervisor <span class="sensitive">Marcus Webb</span> was present.',
    summary:
      'Source at <span class="redact-token" data-t="[location]">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> reports that on <span class="redact-token" data-t="[date]">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, management directed removal of documentation ahead of an inspection. Named supervisor corroborates.',
  },
];

export const DEFAULT_DEMO_TIP_TEXT =
  "Sarah Chen from procurement told me that on March 15th, the Westfield distribution contracts were backdated by about six weeks to avoid the audit window. She can be reached at +1 415 555 0179.";

const REWRITE_RULES: [RegExp, string][] = [
  [
    /who (are|is) (they|their|this person|the source)/i,
    "Can you provide a reference identifier for this party without exposing their identity?",
  ],
  [
    /what.*(name|called)/i,
    "Can you share a pseudonymous reference I can use to corroborate this claim?",
  ],
  [
    /how (can|do) I (contact|reach|get in touch)/i,
    "Is there a secure channel or follow-up thread I can use for further questions?",
  ],
  [/phone|number|email/i, "Is there a secure way to continue this conversation without exchanging identifying details?"],
  [
    /where.*(they|this|located|happen)/i,
    "Can you describe the location in a way that doesn't reveal identifiable details?",
  ],
  [/address|location|place/i, "Can you reference the location without specifying an identifiable address?"],
  [/when|date|time/i, "Can you provide a general timeframe without an exact date that could narrow identification?"],
  [
    /proof|evidence|document/i,
    "Can you describe what you observed in your own words, without sharing physical documents?",
  ],
];

export function sanitizeText(text: string): string {
  let s = text;
  s = s.replace(/\+?1?[\s-]?\(?(\d{3})\)?[\s-]?(\d{3})[\s-]?(\d{4})/g, "+1 [contact]");
  s = s.replace(/\b[\w.+]+@[\w.]+\.\w{2,}\b/g, "[contact]");
  s = s.replace(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?\b/gi,
    "[date]",
  );
  s = s.replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, "[date]");
  s = s.replace(
    /(?<=[a-z,;.!?]\s)([A-Z][a-z]{1,14}\s+[A-Z][a-z]{1,14}(?:\s+[A-Z][a-z]{1,14})?)/g,
    "[name]",
  );
  s = s.replace(
    /\b(at|in|near|from|the)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*(?:\s+(?:warehouse|facility|building|depot|office|plant|center|centre|street|avenue|road|route)))\b/gi,
    (_m, prep: string) => `${prep} [location]`,
  );
  return s;
}

export function wrapSensitive(text: string): string {
  let s = text;
  s = s.replace(
    /\+?1?[\s-]?\(?(\d{3})\)?[\s-]?(\d{3})[\s-]?(\d{4})/g,
    '<span class="sensitive">$&</span>',
  );
  s = s.replace(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?\b/gi,
    '<span class="sensitive">$&</span>',
  );
  s = s.replace(
    /(?<=[a-z,;.!?]\s)([A-Z][a-z]{1,14}\s+[A-Z][a-z]{1,14}(?:\s+[A-Z][a-z]{1,14})?)/g,
    '<span class="sensitive">$&</span>',
  );
  s = s.replace(
    /\b(at|in|near|from|the)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*(?:\s+(?:warehouse|facility|building|depot|office|plant|center|centre|street|avenue|road|route)))\b/gi,
    (m) => `<span class="sensitive">${m}</span>`,
  );
  return s;
}

export function makeSummaryTokens(sanitized: string): string {
  return sanitized
    .replace(
      /\[name\]/g,
      '<span class="redact-token" data-t="[name]">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>',
    )
    .replace(
      /\[date\]/g,
      '<span class="redact-token" data-t="[date]">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>',
    )
    .replace(
      /\[location\]/g,
      '<span class="redact-token" data-t="[location]">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>',
    )
    .replace(
      /\[contact\]/g,
      '<span class="redact-token" data-t="[contact]">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>',
    );
}

export function rewriteQuestion(question: string): string {
  for (const [pattern, rewrite] of REWRITE_RULES) {
    if (pattern.test(question)) return rewrite;
  }

  const r = question
    .replace(/\b(name|names)\b/gi, "identifier")
    .replace(/\b(contact|reach|call|email)\b/gi, "communicate through secure channel with")
    .replace(/\b(where|location|address)\b/gi, "general area")
    .replace(/\b(phone|number)\b/gi, "secure contact method")
    .replace(/\b(when|date)\b/gi, "timeframe")
    .replace(/\bwho\b/gi, "which party");

  return `${r.charAt(0).toUpperCase()}${r.slice(1).replace(/\?$/, "")}?`;
}

export function createDemoTip(tipText: string, contact: string, nextIndex: number): DemoTip {
  const sanitized = sanitizeText(tipText);
  const channel =
    contact.startsWith("@") || contact.toLowerCase().includes("imessage") ? "iMessage" : "Web";

  return {
    id: `TIP-${4470 + nextIndex}`,
    channel,
    status: "new",
    raw: tipText,
    safe: wrapSensitive(tipText),
    summary: makeSummaryTokens(sanitized),
    isNew: true,
  };
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
