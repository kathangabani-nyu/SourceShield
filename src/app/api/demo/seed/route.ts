import { NextRequest, NextResponse } from "next/server";
import { requireDashboardAuth } from "@/lib/server-auth";
import { seedDemoTips } from "@/lib/seed-demo";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Dashboard-accessible demo seed (same data as /api/seed). */
export async function POST(request: NextRequest) {
  const authError = requireDashboardAuth(request);
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: "database_not_configured",
        message: "SUPABASE_SERVICE_ROLE_KEY missing — cannot seed cards.",
      },
      { status: 503 }
    );
  }

  try {
    const { claim_group_id, tip_ids } = await seedDemoTips();
    return NextResponse.json({
      ok: true,
      claim_group_id,
      tip_ids,
      message: "Demo case cards loaded.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "seed_failed",
        message: err instanceof Error ? err.message : "Seed failed",
      },
      { status: 500 }
    );
  }
}
