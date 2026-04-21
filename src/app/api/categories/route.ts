import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, serverError, unauthorized } from "@/lib/api";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: [{ kind: "asc" }, { nature: "desc" }, { name: "asc" }],
  });
  return NextResponse.json({ categories });
}

const schema = z.object({
  name: z.string().min(1).max(80),
  kind: z.enum(["income", "expense"]),
  nature: z.enum(["fixed", "variable"]).default("variable"),
  emoji: z.string().default("🏷️"),
  color: z.string().default("#ec4899"),
});

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const data = schema.parse(await req.json());
    const created = await prisma.category.create({ data: { ...data, userId: user.id } });
    return NextResponse.json({ category: created });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}
