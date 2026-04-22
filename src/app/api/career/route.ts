import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, serverError, unauthorized } from "@/lib/api";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const jobs = await prisma.jobRecord.findMany({
    where: { userId: user.id },
    orderBy: { startDate: "asc" },
  });
  return NextResponse.json({ jobs });
}

const schema = z.object({
  employer: z.string().min(1).max(120),
  role: z.string().max(120).nullable().optional(),
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
  monthlySalary: z.number().positive(),
  currency: z.enum(SUPPORTED_CURRENCIES),
  country: z.string().length(2).default("ID"),
  note: z.string().max(200).nullable().optional(),
});

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const data = schema.parse(await req.json());
    const created = await prisma.jobRecord.create({
      data: {
        userId: user.id,
        employer: data.employer,
        role: data.role ?? null,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        monthlySalary: new Prisma.Decimal(data.monthlySalary),
        currency: data.currency,
        country: data.country.toUpperCase(),
        note: data.note ?? null,
      },
    });
    return NextResponse.json({ job: created });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}
