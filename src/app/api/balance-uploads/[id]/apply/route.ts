import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, notFound, serverError, unauthorized } from "@/lib/api";

const schema = z.object({
  accountId: z.string().min(1),
  balance: z.number(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const data = schema.parse(await req.json());
    const upload = await prisma.balanceUpload.findFirst({ where: { id, userId: user.id } });
    if (!upload) return notFound();
    const account = await prisma.account.findFirst({
      where: { id: data.accountId, userId: user.id },
    });
    if (!account) return badRequest(new Error("Account gak ketemu"));

    await prisma.$transaction([
      prisma.account.update({
        where: { id: account.id },
        data: { balance: new Prisma.Decimal(data.balance) },
      }),
      prisma.balanceUpload.update({
        where: { id },
        data: { status: "applied", accountId: account.id },
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}
