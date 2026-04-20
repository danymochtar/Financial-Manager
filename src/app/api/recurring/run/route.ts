import { NextResponse } from "next/server";
import { getAuthedUser, serverError, unauthorized } from "@/lib/api";
import { runDueRecurrings } from "@/lib/recurring";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST() {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const created = await runDueRecurrings(user.id);
    return NextResponse.json({ created });
  } catch (err) {
    return serverError(err);
  }
}
