import { PrismaClient } from "@prisma/client";

// Seed script ini cuma buat referensi struktur. Default kategori & source
// sebenarnya di-provision per-user oleh src/lib/auth-actions.ts saat register,
// bukan lewat seed global. Jadi seed ini no-op aman.

const prisma = new PrismaClient();

async function main() {
  // eslint-disable-next-line no-console
  console.log(
    "Seed: default categories & sources di-provision per user saat register. Nothing to do here."
  );
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
