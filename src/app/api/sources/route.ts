import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, serverError, unauthorized } from "@/lib/api";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const sources = await prisma.source.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ sources });
}

const createSchema = z.object({
  name: z.string().min(1).max(80),
  country: z.string().length(2).transform((s) => s.toUpperCase()),
  color: z.string().default("#3b82f6"),
});

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const created = await prisma.source.create({
      data: { ...data, userId: user.id },
    });
    return NextResponse.json({ source: created });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}
