const UNSAFE_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\b(on|by|before|after|since)\s+\w+\s+\d{1,2},?\s+\d{4}\b/gi, replacement: "at a recent time" },
  { pattern: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, replacement: "a recent date" },
  { pattern: /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/gi, replacement: "a recent date" },
  { pattern: /\b(mr|mrs|ms|dr|prof)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g, replacement: "the person involved" },
  { pattern: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, replacement: "someone involved" },
  { pattern: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, replacement: "[redacted contact]" },
  { pattern: /\b\d+\s+[A-Za-z]+\s+(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln)\b/gi, replacement: "a specific location" },
  { pattern: /\bwho\s+(is|was|are|were)\b/gi, replacement: "what role" },
  { pattern: /\bwhere\s+(exactly|specifically)\b/gi, replacement: "in what general area" },
  { pattern: /\bwhen\s+(exactly|specifically)\b/gi, replacement: "roughly when" },
];

export type SafeQuestionResult = {
  original: string;
  rewritten: string;
  wasRewritten: boolean;
};

export function safeQuestionRewrite(text: string): SafeQuestionResult {
  let rewritten = text.trim();

  for (const { pattern, replacement } of UNSAFE_PATTERNS) {
    rewritten = rewritten.replace(pattern, replacement);
  }

  rewritten = rewritten.replace(/\s{2,}/g, " ").trim();

  if (!rewritten.endsWith("?") && rewritten.length > 0) {
    rewritten = `${rewritten}?`;
  }

  return {
    original: text,
    rewritten,
    wasRewritten: rewritten !== text.trim(),
  };
}
