import { NextResponse } from "next/server";

// Lightweight health check for uptime monitors (UptimeRobot, Vercel, etc.)
export async function GET() {
  return NextResponse.json({ status: "ok", service: "diamondpriceiq-web" });
}
