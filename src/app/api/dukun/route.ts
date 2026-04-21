import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, getAuthedUser, serverError, unauthorized } from "@/lib/api";
import { askDukun, buildSnapshot } from "@/lib/dukun";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  question: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .default([]),
});

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const data = schema.parse(await req.json());
    const snapshot = await buildSnapshot(user.id);
    const answer = await askDukun(snapshot, data.question, data.history);
    return NextResponse.json({ answer, snapshot });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const snapshot = await buildSnapshot(user.id);
    return NextResponse.json({ snapshot });
  } catch (err) {
    return serverError(err);
  }
}
