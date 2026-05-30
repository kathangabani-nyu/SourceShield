import { createKravaUserClient } from "./client";
import { isKravaRuntimeError } from "./runtime";

export type MemorySaveResult = {
  saved: boolean;
  skipped: boolean;
};

export async function saveRawTranscript(
  userToken: string,
  transcript: string
): Promise<MemorySaveResult> {
  const client = createKravaUserClient(userToken);
  const res = await client.memory.save(transcript, "transcript");

  if (res.skipped) {
    return { saved: false, skipped: true };
  }

  return { saved: Boolean(res.success), skipped: false };
}

/** Pull prior context from Krava encrypted memory for conversational follow-up. */
export async function searchMemoryContext(
  userToken: string,
  query: string,
  limit = 5
): Promise<string> {
  try {
    const client = createKravaUserClient(userToken);
    const { memories, message } = await client.memory.search(query, limit);

    if (message || !memories?.length) {
      return "";
    }

    return memories
      .map((m) => m.content)
      .join("\n---\n")
      .slice(0, 2000);
  } catch (err) {
    if (isKravaRuntimeError(err)) return "";
    throw err;
  }
}
