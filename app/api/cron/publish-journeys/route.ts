import { NextResponse } from "next/server";
import { publishOverdueJourneys } from "@/lib/actions/journeys";

/**
 * Automated Cron Route Handler:
 * Transitions all scheduled journeys whose scheduled_publish_at <= NOW()
 * to status = 'published'.
 *
 * Can be triggered automatically by Vercel Cron (e.g. every 5-15 mins)
 * or via external webhook / admin ping.
 */
export async function GET(request: Request) {
  try {
    // Vercel Cron sends "Authorization: Bearer $CRON_SECRET" when the variable
    // is set in the project. Without it the route stays closed.
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await publishOverdueJourneys();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
