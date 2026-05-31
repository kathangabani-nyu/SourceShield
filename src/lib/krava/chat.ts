import { platformChat } from "./client";

/**
 * Stream text from Krava for a platform-provisioned user.
 *
 * Uses the documented BYO-Agent path (`/api/platform/chat`, `Authorization:
 * Bearer <userToken>`) — NOT the OpenClaw agent path (`getGatewayCredentials`
 * + `v1.agentChat`), which requires a Telegram-paired pod and 404s with
 * `not_found:agent` for platform users.
 *
 * `temperature` is accepted for call-site compatibility but ignored: the
 * platform chat endpoint does not expose it.
 */
export async function streamKravaText(
  userToken: string,
  system: string,
  userContent: string,
  _temperature = 0.2
): Promise<string> {
  void _temperature;
  return platformChat(userToken, system, userContent);
}
