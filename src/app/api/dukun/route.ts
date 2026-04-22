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
  locale: z.enum(["id", "en"]).default("id"),
});

function friendlyError(err: unknown, locale: "id" | "en"): string {
  const msg = (err as Error)?.message ?? String(err);
  if (/401|invalid x-api-key|authentication_error/i.test(msg)) {
    return locale === "en"
      ? "⚠️ ANTHROPIC_API_KEY in Vercel is invalid. Open Vercel → Settings → Environment Variables, paste a fresh key from console.anthropic.com, then Redeploy."
      : "⚠️ ANTHROPIC_API_KEY di Vercel gak valid. Vercel → Settings → Environment Variables, paste key baru dari console.anthropic.com, terus Redeploy.";
  }
  if (/rate_limit|rate limit/i.test(msg)) {
    return locale === "en"
      ? "⚠️ Anthropic rate limit hit. Try again in a minute."
      : "⚠️ Rate limit Anthropic kena. Coba lagi sebentar.";
  }
  if (/overloaded/i.test(msg)) {
    return locale === "en"
      ? "⚠️ Anthropic overloaded right now. Try again shortly."
      : "⚠️ Server Anthropic overload. Coba lagi bentar.";
  }
  return msg;
}

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const data = schema.parse(await req.json());
    const snapshot = await buildSnapshot(user.id);
    try {
      const result = await askDukun(user.id, snapshot, data.question, data.history, data.locale);
      // Re-build snapshot AFTER tools ran so UI shows updated balances.
      const freshSnapshot = result.toolCallCount > 0 ? await buildSnapshot(user.id) : snapshot;
      return NextResponse.json({
        answer: result.text,
        snapshot: freshSnapshot,
        toolsUsed: result.toolsUsed,
      });
    } catch (err) {
      return NextResponse.json(
        { error: friendlyError(err, data.locale) },
        { status: 502 }
      );
    }
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
