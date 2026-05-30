import { createHmac, timingSafeEqual } from "crypto";

const MAX_AGE_SECONDS = 5 * 60;

export type WebhookVerifyResult =
  | { ok: true }
  | { ok: false; reason: string };

export function verifyLinqWebhook(
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
  secret: string
): WebhookVerifyResult {
  if (!timestamp || !signature) {
    return { ok: false, reason: "missing_headers" };
  }

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) {
    return { ok: false, reason: "invalid_timestamp" };
  }

  const age = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (age > MAX_AGE_SECONDS) {
    return { ok: false, reason: "stale_timestamp" };
  }

  const message = `${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", secret).update(message).digest("hex");

  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signature, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: "bad_signature" };
    }
  } catch {
    return { ok: false, reason: "bad_signature" };
  }

  return { ok: true };
}
