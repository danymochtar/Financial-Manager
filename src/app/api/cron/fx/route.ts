import { NextResponse } from "next/server";
import { getFxMatrix } from "@/lib/fx";

export const runtime = "nodejs";

/**
 * Vercel Cron target — pre-warms the FX cache once a day around noon WIB.
 * Schedule: see vercel.json (`0 5 * * *` UTC = 12:00 WIB).
 * Vercel sends its cron jobs with a `x-vercel-cron` header; in production
 * we also require the CRON_SECRET bearer token. In local/dev this route
 * is open so you can warm the cache manually.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  const matrix = await getFxMatrix();
  return NextResponse.json({ ok: true, date: matrix.date, rates: matrix.rates });
}
