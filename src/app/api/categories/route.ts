import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, serverError, unauthorized } from "@/lib/api";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: [{ kind: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ categories });
}

const createSchema = z.object({
  name: z.string().min(1).max(80),
  kind: z.enum(["income", "expense"]),
  icon: z.string().default("tag"),
  color: z.string().default("#64748b"),
});

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const created = await prisma.category.create({
      data: { ...data, userId: user.id },
    });
    return NextResponse.json({ category: created });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}
