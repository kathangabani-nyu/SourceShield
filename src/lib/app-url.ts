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

export function triggerWorker(payload: WorkerPayload): void {
  const secret = process.env.INTERNAL_WORKER_SECRET;
  const url = `${getAppUrl()}/api/linq/process`;

  void fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
    },
    body: JSON.stringify({ payload }),
  }).catch(() => {
    // Never log webhook payload or processing details
  });
}
