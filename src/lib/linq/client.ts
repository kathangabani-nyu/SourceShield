import LinqAPIV3 from "@linqapp/sdk";

let client: LinqAPIV3 | null = null;

export function getLinqClient(): LinqAPIV3 {
  if (client) return client;

  const apiKey = process.env.LINQ_API_KEY;
  if (!apiKey) {
    throw new Error("LINQ_API_KEY not configured");
  }

  client = new LinqAPIV3({ apiKey });
  return client;
}

export function isLinqConfigured(): boolean {
  return Boolean(process.env.LINQ_API_KEY);
}

export async function sendLinqTextMessage(
  chatId: string,
  text: string,
  idempotencyKey: string
): Promise<void> {
  const linq = getLinqClient();

  await linq.chats.messages.send(chatId, {
    message: {
      parts: [{ type: "text", value: text }],
      idempotency_key: idempotencyKey.slice(0, 255),
      preferred_service: "iMessage",
    },
  });
}
