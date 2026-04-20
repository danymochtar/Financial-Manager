import { prisma } from "@/lib/db";
import { getAuthedUser } from "@/lib/api";
import { readReceiptImage } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const receipt = await prisma.receipt.findFirst({ where: { id, userId: user.id } });
  if (!receipt) return new Response("Not found", { status: 404 });
  try {
    const buf = await readReceiptImage(receipt.imagePath);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": receipt.mimeType || "image/jpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response("Image missing", { status: 404 });
  }
}
