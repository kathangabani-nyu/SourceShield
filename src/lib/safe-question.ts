import { isKravaConfigured } from "./krava/client";
import { rewriteSafeQuestionWithKrava } from "./krava/intake-llm";

const UNSAFE_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  {
    pattern: /\b(on|by|before|after|since)\s+\w+\s+\d{1,2},?\s+\d{4}\b/gi,
    replacement: "at a recent time",
  },
  { pattern: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, replacement: "a recent date" },
  {
    pattern:
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/gi,
    replacement: "a recent date",
  },
  {
    pattern: /\b(mr|mrs|ms|dr|prof)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g,
    replacement: "the person involved",
  },
  { pattern: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, replacement: "someone involved" },
  { pattern: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, replacement: "[redacted contact]" },
  {
    pattern:
      /\b\d+\s+[A-Za-z]+\s+(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln)\b/gi,
    replacement: "a specific location",
  },
  { pattern: /\bwho\s+(is|was|are|were)\b/gi, replacement: "what role" },
  { pattern: /\bwhere\s+(exactly|specifically)\b/gi, replacement: "in what general area" },
  { pattern: /\bwhen\s+(exactly|specifically)\b/gi, replacement: "roughly when" },
];

export type SafeQuestionResult = {
  original: string;
  rewritten: string;
  wasRewritten: boolean;
  /** How the rewrite was produced (for demo transparency). */
  via: "regex" | "regex+krava" | "krava";
};

function applyRegexPass(text: string): string {
  let rewritten = text.trim();

  for (const { pattern, replacement } of UNSAFE_PATTERNS) {
    rewritten = rewritten.replace(pattern, replacement);
  }

  rewritten = rewritten.replace(/\s{2,}/g, " ").trim();

  if (!rewritten.endsWith("?") && rewritten.length > 0) {
    rewritten = `${rewritten}?`;
  }

  return rewritten;
}

/** Fast regex pass (sync). */
export function safeQuestionRewriteRegex(text: string): SafeQuestionResult {
  const original = text.trim();
  const rewritten = applyRegexPass(original);

  return {
    original,
    rewritten,
    wasRewritten: rewritten !== original,
    via: "regex",
  };
}

/**
 * Regex first, then Krava LLM polish when configured — catches edge cases regex misses.
 */
export async function safeQuestionRewrite(
  text: string
): Promise<SafeQuestionResult> {
  const original = text.trim();
  const regexPass = applyRegexPass(original);

  if (!isKravaConfigured()) {
    return {
      original,
      rewritten: regexPass,
      wasRewritten: regexPass !== original,
      via: "regex",
    };
  }

  const kravaPass = await rewriteSafeQuestionWithKrava(regexPass);
  if (!kravaPass) {
    return {
      original,
      rewritten: regexPass,
      wasRewritten: regexPass !== original,
      via: "regex",
    };
  }

  const rewritten = kravaPass.endsWith("?") ? kravaPass : `${kravaPass}?`;

  return {
    original,
    rewritten,
    wasRewritten: rewritten !== original,
    via: rewritten !== regexPass ? "regex+krava" : "regex",
  };
}
