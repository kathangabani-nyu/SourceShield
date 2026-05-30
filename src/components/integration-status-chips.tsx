"use client";

import { useEffect, useState } from "react";

type StatusPayload = {
  integrations: {
    krava: { configured: boolean; label: string; detail: string };
    memory: { label: string; detail: string };
    database: { configured: boolean; label: string; detail: string };
    linq: { configured: boolean; label: string; detail: string };
  };
};

function Chip({
  label,
  detail,
  tone,
}: {
  label: string;
  detail: string;
  tone: "ok" | "warn" | "muted";
}) {
  const tones = {
    ok: "border-emerald-800/60 bg-emerald-950/40 text-emerald-200",
    warn: "border-amber-800/60 bg-amber-950/40 text-amber-200",
    muted: "border-slate-700 bg-slate-900/80 text-slate-300",
  };

  return (
    <li
      className={`rounded-md border px-3 py-2 text-sm ${tones[tone]}`}
      title={detail}
    >
      <span className="font-medium">{label}</span>
      <p className="mt-0.5 text-xs opacity-80">{detail}</p>
    </li>
  );
}

export function IntegrationStatusChips() {
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
          Loading integration status…
        </li>
      </ul>
    );
  }

  const { krava, memory, database, linq } = status.integrations;

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      <Chip
        label={krava.label}
        detail={krava.detail}
        tone={krava.configured ? "ok" : "warn"}
      />
      <Chip label={memory.label} detail={memory.detail} tone="ok" />
      <Chip
        label={database.label}
        detail={database.detail}
        tone={database.configured ? "ok" : "warn"}
      />
      <Chip
        label={linq.label}
        detail={linq.detail}
        tone={linq.configured ? "ok" : "warn"}
      />
    </ul>
  );
}
