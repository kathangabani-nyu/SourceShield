import { createKravaUserClient } from "./client";
import { parseAgentChatStream } from "@kravalabs/api-client";

/** Stream text from Krava agent chat (TEE-routed when model is kimi-k2-5). */
export async function streamKravaText(
  userToken: string,
  system: string,
  userContent: string,
  temperature = 0.2
): Promise<string> {
  const client = createKravaUserClient(userToken);
  const { gatewayToken } = await client.agent.getGatewayCredentials();

  const response = await client.v1.agentChat(
    {
      model: "kimi-k2-5",
      stream: true,
      system,
      messages: [{ role: "user", content: userContent }],
      temperature,
    },
    { gatewayToken }
  );

  let text = "";
  for await (const event of parseAgentChatStream(response)) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      text += String((event.delta as { text?: string }).text ?? "");
    }
  }

  return text;
}
