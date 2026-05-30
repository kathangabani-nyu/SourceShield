"use client";

import { useEffect, useState } from "react";

type ChipData = {
  configured: boolean;
  live: boolean;
  label: string;
  detail: string;
};

type StatusPayload = {
  status: string;
  integrations: {
    krava: ChipData;
    memory: ChipData;
    database: ChipData;
    linq: ChipData;
    demo_ready: boolean;
  };
};

function Chip({ chip }: { chip: ChipData }) {
  const tone = chip.live ? "ok" : chip.configured ? "warn" : "error";
  const tones = {
    ok: "border-emerald-800/60 bg-emerald-950/40 text-emerald-200",
    warn: "border-amber-800/60 bg-amber-950/40 text-amber-200",
    error: "border-red-900/60 bg-red-950/40 text-red-200",
  };

  return (
    <li
      className={`rounded-md border px-3 py-2 text-sm ${tones[tone]}`}
      title={chip.detail}
    >
      <span className="font-medium">{chip.label}</span>
      <p className="mt-0.5 text-xs opacity-80">{chip.detail}</p>
    </li>
  );
}

export function IntegrationStatusChips({ showBanner = true }: { showBanner?: boolean }) {
  const [status, setStatus] = useState<StatusPayload | null>(null);

  useEffect(() => {
    void fetch("/api/health")
      .then((r) => r.json())
      .then((data: StatusPayload) => setStatus(data))
      .catch(() => setStatus(null));
  }, []);

  if (!status) {
    return (
      <ul className="grid gap-2 sm:grid-cols-2">
        <li className="rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-500">
          Checking integrations…
        </li>
      </ul>
    );
  }

  const { integrations } = status;

  return (
    <div className="space-y-3">
      {showBanner && !integrations.demo_ready && (
        <p className="rounded-md border border-amber-800/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
          Demo degraded — fix red/amber chips before judging. Mock sanitization may still run on
          intake, but cards need a live database.
        </p>
      )}
      {showBanner && integrations.demo_ready && (
        <p className="rounded-md border border-emerald-800/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">
          Golden path ready — Krava inference and sanitized DB are live.
        </p>
      )}
      <ul className="grid gap-2 sm:grid-cols-2">
        <Chip chip={integrations.krava} />
        <Chip chip={integrations.memory} />
        <Chip chip={integrations.database} />
        <Chip chip={integrations.linq} />
      </ul>
    </div>
  );
}
