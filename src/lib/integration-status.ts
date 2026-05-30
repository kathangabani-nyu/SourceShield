import { isKravaConfigured } from "./krava/client";
import { isLinqConfigured } from "./linq/client";
import { isSupabaseConfigured } from "./supabase/server";

export type IntegrationStatus = {
  krava: {
    configured: boolean;
    label: string;
    detail: string;
  };
  memory: {
    label: string;
    detail: string;
  };
  database: {
    configured: boolean;
    label: string;
    detail: string;
  };
  linq: {
    configured: boolean;
    label: string;
    detail: string;
  };
  dashboard_auth: boolean;
  worker_auth: boolean;
};

export function getIntegrationStatus(): IntegrationStatus {
  const kravaConfigured = isKravaConfigured();
  const linqConfigured = isLinqConfigured();
  const supabaseConfigured = isSupabaseConfigured();

  return {
    krava: {
      configured: kravaConfigured,
      label: kravaConfigured ? "Krava private inference" : "Krava mock intake",
      detail: kravaConfigured
        ? "Live when API accepts key; auto-falls back to mock on 401/errors"
        : "Set KRAVA_APP_KEY or use keyword mock path",
    },
    memory: {
      label: kravaConfigured ? "Encrypted memory (Krava)" : "Encrypted memory (off)",
      detail: kravaConfigured
        ? "Raw transcripts saved server-side; may skip on non-premium tier"
        : "Requires Krava user token",
    },
    database: {
      configured: supabaseConfigured,
      label: supabaseConfigured ? "Sanitized DB (Supabase)" : "Sanitized DB (off)",
      detail: supabaseConfigured
        ? "Tips via service role; no raw text in Postgres"
        : "Set SUPABASE_SERVICE_ROLE_KEY for cards",
    },
    linq: {
      configured: linqConfigured,
      label: linqConfigured ? "Linq iMessage (live)" : "Linq unavailable — dry-run",
      detail: linqConfigured
        ? "Webhook + outbound sends enabled"
        : "Follow-ups preview rewrite only; web intake still works",
    },
    dashboard_auth: Boolean(process.env.DASHBOARD_SECRET),
    worker_auth: Boolean(process.env.INTERNAL_WORKER_SECRET),
  };
}
