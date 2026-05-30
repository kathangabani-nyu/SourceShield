import { z } from "zod";

export const DuressSignal = z.enum(["low", "medium", "high"]);
export type DuressSignal = z.infer<typeof DuressSignal>;

export const IntakeResultSchema = z.object({
  assistant_reply: z.string().max(500),
  sanitized_summary: z.string().max(1000),
  duress_signal: DuressSignal,
  claims: z.array(
    z.object({
      text: z.string(),
      fingerprint: z.string(),
    })
  ),
  next_safe_question: z.string().max(300),
});

export type IntakeResult = z.infer<typeof IntakeResultSchema>;

export const DURESS_PAUSE_REPLY =
  "I'll pause here. You can return when it feels safe.";

export const TEXT_ONLY_REPLY =
  "For your safety, please share details in text only — no photos or files. What would you like us to know?";

export const MEDIA_ONLY_REPLY =
  "We can't accept files through this channel. Please describe what you know in a text message.";

export const FALLBACK_INTAKE_REPLY =
  "Thank you for reaching out. Please share what you know in text — we read every message.";
