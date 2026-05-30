import { isKravaConfigured } from "./krava/client";
import { isLinqConfigured } from "./linq/client";
import { isSupabaseConfigured } from "./supabase/server";
import type { LiveProbeResult } from "./health-probes";

export type IntegrationChip = {
  configured: boolean;
  live: boolean;
  label: string;
  detail: string;
};

export type IntegrationStatusPayload = {
  krava: IntegrationChip;
  memory: IntegrationChip;
  database: IntegrationChip;
  linq: IntegrationChip;
  demo_ready: boolean;
};

export function buildIntegrationStatus(
  probes: LiveProbeResult
): IntegrationStatusPayload {
  const linqConfigured = isLinqConfigured();

  const kravaLive = probes.krava.live;
  const dbLive = probes.database.live;

  return {
    krava: {
      configured: probes.krava.configured,
      live: kravaLive,
      label: kravaLive
        ? "Krava private inference — live"
        : probes.krava.configured
          ? "Krava — mock fallback active"
          : "Krava — mock intake",
      detail: probes.krava.detail,
    },
    memory: {
      configured: probes.krava.configured,
      live: kravaLive,
      label: kravaLive ? "Encrypted memory (Krava)" : "Encrypted memory — unavailable",
      detail: kravaLive
        ? "Raw text saved per source; never stored in Postgres"
        : "Requires a working Krava key",
    },
    database: {
      configured: probes.database.configured,
      live: dbLive,
      label: dbLive ? "Sanitized DB — live" : "Sanitized DB — error",
      detail: probes.database.detail,
    },
    linq: {
      configured: linqConfigured,
      live: linqConfigured,
      label: linqConfigured ? "Linq iMessage — live" : "Linq — follow-up preview only",
      detail: linqConfigured
        ? "Two-way iMessage enabled"
        : "Safe-question rewrite works on web tips without iMessage",
    },
    demo_ready: kravaLive && dbLive,
  };
}

/** Static snapshot without network probes (legacy). */
export function getIntegrationStatusStatic() {
  return buildIntegrationStatus({
    krava: {
      configured: isKravaConfigured(),
      live: false,
      detail: "Run /api/health for live probe",
    },
    database: {
      configured: isSupabaseConfigured(),
      live: false,
      detail: "Run /api/health for live probe",
    },
  });
}
