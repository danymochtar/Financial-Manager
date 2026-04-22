import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, notFound, serverError, unauthorized } from "@/lib/api";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

const schema = z.object({
  employer: z.string().min(1).max(120).optional(),
  role: z.string().max(120).nullable().optional(),
  startDate: z.string().optional(),
  endDate: z.string().nullable().optional(),
  monthlySalary: z.number().positive().optional(),
  currency: z.enum(SUPPORTED_CURRENCIES).optional(),
  country: z.string().length(2).optional(),
  note: z.string().max(200).nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const data = schema.parse(await req.json());
    const existing = await prisma.jobRecord.findFirst({ where: { id, userId: user.id } });
    if (!existing) return notFound();
    const updated = await prisma.jobRecord.update({
      where: { id },
      data: {
        employer: data.employer,
        role: data.role,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate === null ? null : data.endDate ? new Date(data.endDate) : undefined,
        monthlySalary:
          data.monthlySalary != null ? new Prisma.Decimal(data.monthlySalary) : undefined,
        currency: data.currency,
        country: data.country ? data.country.toUpperCase() : undefined,
        note: data.note,
      },
    });
    return NextResponse.json({ job: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const existing = await prisma.jobRecord.findFirst({ where: { id, userId: user.id } });
  if (!existing) return notFound();
  await prisma.jobRecord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
