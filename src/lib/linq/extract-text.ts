type TextPart = { type: "text"; value: string };
type MediaPart = { type: "media" };
type LinkPart = { type: "link"; value: string };

export type MessagePart = TextPart | MediaPart | LinkPart | { type: string };

export type ExtractResult =
  | { kind: "text"; text: string; hasMedia: boolean }
  | { kind: "media_only" }
  | { kind: "empty" };

export function extractInboundText(parts: MessagePart[] | undefined): ExtractResult {
  if (!parts?.length) return { kind: "empty" };

  const textParts = parts.filter(
    (p): p is TextPart => p.type === "text" && typeof (p as TextPart).value === "string"
  );
  const hasMedia = parts.some((p) => p.type === "media");

  const text = textParts.map((p) => p.value.trim()).filter(Boolean).join("\n");

  if (!text && hasMedia) return { kind: "media_only" };
  if (!text) return { kind: "empty" };

  return { kind: "text", text, hasMedia };
}
