# API Verification (Task Zero)

Verified against public Linq docs + `@linqapp/sdk@0.25.0` + `@kravalabs/api-client@0.2.0` type definitions.
Re-confirm with sponsor reps at the hackathon before demo.

## Linq v3 — confirmed

| Item | Value |
|------|-------|
| Base URL | `https://api.linqapp.com/api/partner/v3` |
| Auth | `Authorization: Bearer $LINQ_API_KEY` |
| Inbound event | `message.received` |
| Webhook version pin | `target_url?version=2026-02-03` |
| Signature | HMAC-SHA256 over `{X-Webhook-Timestamp}.{rawBodyBytes}` |
| Dedupe | `event_id` UUID; at-least-once; 10s response timeout |
| Outbound | `POST /v3/chats/{chatId}/messages` |
| Idempotency | `message.idempotency_key` inside `message` (max 255 chars) |
| SDK send | `client.chats.messages.send(chatId, { message: { parts, idempotency_key } })` |

### `message.received` payload (2026-02-03 format)

From `@linqapp/sdk` `MessageReceivedWebhookEvent` / `MessageEventV2`:

```json
{
  "api_version": "v3",
  "event_type": "message.received",
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2026-05-30T12:00:00Z",
  "trace_id": "abc123def456",
  "webhook_version": "2026-02-03",
  "partner_id": "partner-uuid",
  "data": {
    "id": "message-uuid",
    "direction": "inbound",
    "chat": { "id": "chat-uuid", "is_group": false },
    "sender_handle": { "id": "handle-uuid", "handle": "+15551234567" },
    "parts": [{ "type": "text", "value": "I have a tip about..." }],
    "service": "iMessage",
    "sent_at": "2026-05-30T12:00:00Z"
  }
}
```

**Extraction rules:**
- `chat_id` → `data.chat.id`
- `message_id` → `data.id`
- Text → concatenate `data.parts` where `type === "text"`
- Media-only → no text; reply with text-only safety message
- Handle hash → `sha256(data.sender_handle.handle)` — never store raw handle
- Ignore `direction: "outbound"` (our own sends echoing back)

### Outbound send (confirmed)

```json
POST /api/partner/v3/chats/{chatId}/messages
{
  "message": {
    "parts": [{ "type": "text", "value": "Thank you. Can you share more detail?" }],
    "idempotency_key": "reply-550e8400-e29b-41d4-a716-446655440000",
    "preferred_service": "iMessage"
  }
}
```

## Krava — confirmed SDK surface

Both clients ship in `@kravalabs/api-client@0.2.0`:

### Platform (server-side, webhook worker)

```typescript
import { createKravaPlatformClient } from "@kravalabs/api-client";

const platform = createKravaPlatformClient({ appKey: process.env.KRAVA_APP_KEY });
const { userId, userToken } = await platform.users.getOrCreate(`source:${handleHash}`);
```

### Per-user client (memory + inference)

```typescript
import { createKravaClient, parseAgentChatStream } from "@kravalabs/api-client";

const userClient = createKravaClient({ getToken: () => userToken });
const { gatewayToken } = await userClient.agent.getGatewayCredentials();

const response = await userClient.v1.agentChat(
  {
    model: "kimi-k2-5",
    stream: true,
    system: "... intake prompt ...",
    messages: [{ role: "user", content: inboundText }],
  },
  { gatewayToken }
);

// Encrypted memory (raw transcript — never in app DB)
await userClient.memory.save(rawTranscript, "transcript");
```

### Open items for sponsor reps

- [ ] Confirm hackathon `KRAVA_APP_KEY` quota and TEE model availability (`kimi-k2-5` latency)
- [ ] Confirm `agent.getGatewayCredentials()` works for platform-provisioned users without agent pod
- [ ] Paste one real inbound webhook from staging after first test text

## Webhook subscription (run once after Vercel deploy)

```bash
curl -X POST "https://api.linqapp.com/api/partner/v3/webhook-subscriptions" \
  -H "Authorization: Bearer $LINQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "target_url": "https://YOUR_VERCEL_DOMAIN/api/linq/webhook?version=2026-02-03",
    "subscribed_events": ["message.received"]
  }'
```

Store the returned `signing_secret` as `LINQ_WEBHOOK_SECRET`.
