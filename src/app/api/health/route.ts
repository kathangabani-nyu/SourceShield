import { NextResponse } from "next/server";
import { getIntegrationStatus } from "@/lib/integration-status";

export async function GET() {
  const integrations = getIntegrationStatus();

  return NextResponse.json({
    status: "ok",
    service: "sourceshield",
    timestamp: new Date().toISOString(),
    integrations,
  });
}
