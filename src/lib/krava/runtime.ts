/** True when Krava is configured but the live API rejected the call (bad key, tier, outage). */
export function isKravaRuntimeError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;

  const e = err as { name?: string; status?: number; message?: string };
  if (e.name === "KravaApiError") return true;
  if (typeof e.status === "number" && e.status >= 400) return true;

  const msg = String(e.message ?? "").toLowerCase();
  return msg.includes("unauthorized") || msg.includes("krava");
}
