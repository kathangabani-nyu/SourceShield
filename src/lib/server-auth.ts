import { NextRequest, NextResponse } from "next/server";

function isProductionDeploy(): boolean {
  return (
    process.env.VERCEL_ENV === "production" ||
    (process.env.NODE_ENV === "production" && Boolean(process.env.VERCEL))
  );
}

/** Dashboard / tips API — requires DASHBOARD_SECRET on production deploys. */
export function requireDashboardAuth(
  request: NextRequest
): NextResponse | null {
  const secret = process.env.DASHBOARD_SECRET;

  if (!secret) {
    if (isProductionDeploy()) {
      return NextResponse.json(
        { error: "dashboard_auth_not_configured" },
        { status: 503 }
      );
    }
    return null;
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return null;
}

/** Background worker — requires INTERNAL_WORKER_SECRET on production deploys. */
export function requireWorkerAuth(
  request: NextRequest
): NextResponse | null {
  const secret = process.env.INTERNAL_WORKER_SECRET;

  if (!secret) {
    if (isProductionDeploy()) {
      return NextResponse.json(
        { error: "worker_auth_not_configured" },
        { status: 503 }
      );
    }
    return null;
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return null;
}

/** Seed + other privileged demo routes — same secret as worker. */
export function requirePrivilegedAuth(
  request: NextRequest
): NextResponse | null {
  return requireWorkerAuth(request);
}
