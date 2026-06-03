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

  return (
    <li className={`ss-integration-chip ss-integration-${tone}`} title={chip.detail}>
      <span>{chip.label}</span>
      <p>{chip.detail}</p>
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
      <ul className="ss-integration-grid">
        <li className="ss-integration-chip ss-integration-muted">Checking integrations...</li>
      </ul>
    );
  }

  const { integrations } = status;

  return (
    <div className="ss-integration-status">
      {showBanner && !integrations.demo_ready && (
        <p className="ss-integration-banner ss-integration-banner-warn">
          Degraded mode. Fix red/amber chips before going live. Mock sanitization may still run on
          intake, but cards need a live database.
        </p>
      )}
      {showBanner && integrations.demo_ready && (
        <p className="ss-integration-banner ss-integration-banner-ok">
          Golden path ready. Krava inference and sanitized DB are live.
        </p>
      )}
      <ul className="ss-integration-grid">
        <Chip chip={integrations.krava} />
        <Chip chip={integrations.memory} />
        <Chip chip={integrations.database} />
        <Chip chip={integrations.linq} />
      </ul>
    </div>
  );
}
