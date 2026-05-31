import {
  createKravaClient,
  createKravaPlatformClient,
  type KravaClient,
} from "@kravalabs/api-client";

let platformClient: ReturnType<typeof createKravaPlatformClient> | null = null;

export function getKravaPlatform() {
  if (platformClient) return platformClient;

  const appKey = process.env.KRAVA_APP_KEY;
  if (!appKey) {
    throw new Error("KRAVA_APP_KEY not configured");
  }

  platformClient = createKravaPlatformClient({
    appKey,
    baseUrl: process.env.KRAVA_BASE_URL,
  });

  return platformClient;
}

export function isKravaConfigured(): boolean {
  return Boolean(process.env.KRAVA_APP_KEY);
}

export async function provisionKravaUser(externalUserId: string): Promise<{
  userId: string;
  userToken: string;
}> {
  const platform = getKravaPlatform();
  const { userId, userToken } = await platform.users.getOrCreate(externalUserId);
  return { userId, userToken };
}

export function createKravaUserClient(userToken: string): KravaClient {
  return createKravaClient({
    baseUrl: process.env.KRAVA_BASE_URL,
    getToken: () => userToken,
  });
}

export function getKravaBaseUrl(): string {
  return (process.env.KRAVA_BASE_URL || "https://krava.io").replace(/\/$/, "");
}

/**
 * Stream a chat completion for a platform-provisioned user.
 *
 * This is the documented BYO-Agent path: the `userToken` minted by
 * `provisionKravaUser` (getOrCreate) is sent as `Authorization: Bearer` to
 * `/api/platform/chat`. No agent provisioning / gateway credentials needed.
 * Memory writes happen automatically server-side.
 *
 * SSE frames: `{"chatId":"…"}` first, then `{"text":"…"}` deltas, ending `[DONE]`.
 */
export async function platformChat(
  userToken: string,
  system: string,
  message: string,
  opts?: { signal?: AbortSignal }
): Promise<string> {
  const res = await fetch(`${getKravaBaseUrl()}/api/platform/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userToken}`,
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ message, system }),
    signal: opts?.signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`platform_chat_failed:${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let out = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return out;
      try {
        const parsed = JSON.parse(data) as { text?: string };
        if (typeof parsed.text === "string") out += parsed.text;
      } catch {
        // ignore keepalives / non-JSON frames (e.g. the leading {"chatId":…})
      }
    }
  }

  return out;
}
