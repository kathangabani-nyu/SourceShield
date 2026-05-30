import { createKravaUserClient } from "./client";

export async function saveRawTranscript(
  userToken: string,
  transcript: string
): Promise<void> {
  const client = createKravaUserClient(userToken);
  await client.memory.save(transcript, "transcript");
}
