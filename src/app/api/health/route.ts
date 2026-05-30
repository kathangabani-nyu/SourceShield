import { NextResponse } from "next/server";
import { probeLiveIntegrations } from "@/lib/health-probes";
import { buildIntegrationStatus } from "@/lib/integration-status";

export async function GET() {
  const probes = await probeLiveIntegrations();
  const integrations = buildIntegrationStatus(probes);

  return NextResponse.json({
    status: integrations.demo_ready ? "ready" : "degraded",
    service: "sourceshield",
    timestamp: new Date().toISOString(),
    integrations,
  });
}
