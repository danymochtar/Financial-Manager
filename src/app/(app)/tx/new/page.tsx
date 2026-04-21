import { TransactionForm } from "@/components/TransactionForm";

export default function NewTransactionPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold tracking-tight">Catat Manual</h1>
      <div className="card p-4">
        <TransactionForm />
      </div>
    </div>
  );
}
