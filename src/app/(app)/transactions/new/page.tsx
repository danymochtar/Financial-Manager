import { TransactionForm } from "@/components/TransactionForm";

export default function NewTransactionPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Transaksi baru</h1>
      <div className="card p-5">
        <TransactionForm />
      </div>
    </div>
  );
}
