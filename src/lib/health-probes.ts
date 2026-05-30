import { isKravaConfigured, provisionKravaUser } from "./krava/client";
import { isKravaRuntimeError } from "./krava/runtime";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase/server";

export type LiveProbeResult = {
  krava: { configured: boolean; live: boolean; detail: string };
  database: { configured: boolean; live: boolean; detail: string };
};

export async function probeLiveIntegrations(): Promise<LiveProbeResult> {
  const [krava, database] = await Promise.all([probeKrava(), probeDatabase()]);
  return { krava, database };
}

async function probeKrava(): Promise<LiveProbeResult["krava"]> {
  if (!isKravaConfigured()) {
    return {
      configured: false,
      live: false,
      detail: "KRAVA_APP_KEY not set — mock intake only",
    };
  }

  try {
    await provisionKravaUser("health:probe");
    return {
      configured: true,
      live: true,
      detail: "Private inference reachable",
    };
  } catch (err) {
    if (isKravaRuntimeError(err)) {
      return {
        configured: true,
        live: false,
        detail: "Key rejected (401) — intake uses mock until key is fixed",
      };
    }
    return {
      configured: true,
      live: false,
      detail: "Krava unreachable — check KRAVA_BASE_URL",
    };
  }
}

async function probeDatabase(): Promise<LiveProbeResult["database"]> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      live: false,
      detail: "SUPABASE_SERVICE_ROLE_KEY missing on server",
    };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("tips").select("id", { head: true, count: "exact" });
    if (error) {
      return {
        configured: true,
        live: false,
        detail: `Query failed: ${error.message}`,
      };
    }
    return {
      configured: true,
      live: true,
      detail: "Sanitized tips table reachable",
    };
  } catch (err) {
    return {
      configured: true,
      live: false,
      detail: err instanceof Error ? err.message : "Database connection failed",
    };
  }
}
