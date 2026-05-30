import { createHash } from "crypto";

/** Hash a Linq handle (phone/email) — never store the raw value. */
export function hashHandle(handle: string): string {
  return createHash("sha256").update(handle).digest("hex");
}
