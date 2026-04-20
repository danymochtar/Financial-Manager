import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";

export type AuthedUser = { id: string; primaryCurrency: string };

export async function getAuthedUser(): Promise<AuthedUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, primaryCurrency: session.user.primaryCurrency ?? "IDR" };
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function badRequest(error: unknown) {
  const payload =
    error instanceof z.ZodError
      ? { error: error.flatten() }
      : { error: (error as Error)?.message ?? "Bad request" };
  return NextResponse.json(payload, { status: 400 });
}

export function notFound(msg = "Not found") {
  return NextResponse.json({ error: msg }, { status: 404 });
}

export function serverError(err: unknown) {
  // eslint-disable-next-line no-console
  console.error(err);
  return NextResponse.json(
    { error: (err as Error)?.message ?? "Internal server error" },
    { status: 500 }
  );
}
