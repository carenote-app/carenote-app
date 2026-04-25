import { NextRequest, NextResponse } from "next/server";
import { runWeeklySummaries } from "@/lib/jobs/weekly-summaries";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runWeeklySummaries();

  return NextResponse.json({
    message: `Generated ${result.generated} weekly summaries`,
    ...result,
  });
}
