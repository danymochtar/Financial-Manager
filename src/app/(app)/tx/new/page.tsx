"use client";

import { TransactionForm } from "@/components/TransactionForm";
import { useT } from "@/lib/i18n";

export default function NewTransactionPage() {
  const { t } = useT();
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold tracking-tight">{t("tx.manualTitle")}</h1>
      <div className="card p-4">
        <TransactionForm />
      </div>
    </div>
  );
}
