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
