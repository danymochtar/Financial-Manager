import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedUser, unauthorized } from "@/lib/api";

export async function POST() {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingDone: true },
  });
  return NextResponse.json({ ok: true });
}
