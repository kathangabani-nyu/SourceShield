import type { MessageEventV2 } from "@linqapp/sdk/resources/webhooks";

export type WorkerPayload = {
  event_id: string;
  event_type: string;
  data: MessageEventV2;
};

export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

/** Awaitable worker trigger — use with waitUntil() on Vercel so the fetch completes. */
export async function triggerWorker(payload: WorkerPayload): Promise<void> {
  const secret = process.env.INTERNAL_WORKER_SECRET;
  const url = `${getAppUrl()}/api/linq/process`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
    },
    body: JSON.stringify({ payload }),
  });

  if (!res.ok) {
    throw new Error(`worker_trigger_${res.status}`);
  }
}
