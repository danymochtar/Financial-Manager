"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, X, Check, RefreshCw, Edit3 } from "lucide-react";
import { useToast } from "@/components/Toast";

type QueueItem = {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "uploading" | "ocr" | "done" | "error";
  error?: string;
  receiptId?: string;
  merchant?: string;
  total?: number;
  currency?: string;
  suggestedCategoryId?: string | null;
};

export default function CatatPage() {
  const router = useRouter();
  const toast = useToast();
  const cameraInput = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [processing, setProcessing] = useState(false);

  function addFiles(files: FileList | File[]) {
    const batch = Array.from(files).map((file) => {
      const id = Math.random().toString(36).slice(2);
      return {
        id,
        file,
        previewUrl: URL.createObjectURL(file),
        status: "pending" as const,
      };
    });
    setQueue((prev) => [...prev, ...batch]);
  }

  function removeItem(id: string) {
    setQueue((prev) => {
      const target = prev.find((x) => x.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  }

  async function processOne(item: QueueItem) {
    setQueue((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: "uploading" } : x)));
    try {
      const fd = new FormData();
      fd.append("file", item.file);
      setQueue((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: "ocr" } : x)));
      const res = await fetch("/api/receipts/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setQueue((prev) =>
          prev.map((x) =>
            x.id === item.id ? { ...x, status: "error", error: data?.error ?? "Upload gagal" } : x
          )
        );
        return;
      }
      setQueue((prev) =>
        prev.map((x) =>
          x.id === item.id
            ? {
                ...x,
                status: "done",
                receiptId: data.receipt.id,
                merchant: data.receipt.merchant ?? undefined,
                total: data.receipt.totalAmount ? Number(data.receipt.totalAmount) : undefined,
                currency: data.receipt.currency ?? undefined,
                suggestedCategoryId: data.suggestedCategoryId ?? null,
              }
            : x
        )
      );
    } catch (err) {
      setQueue((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, status: "error", error: (err as Error).message } : x))
      );
    }
  }

  async function processAll() {
    setProcessing(true);
    try {
      const pending = queue.filter((q) => q.status === "pending" || q.status === "error");
      // Process up to 3 in parallel
      const chunks: QueueItem[][] = [];
      const size = 3;
      for (let i = 0; i < pending.length; i += size) chunks.push(pending.slice(i, i + size));
      for (const chunk of chunks) {
        await Promise.all(chunk.map((x) => processOne(x)));
      }
    } finally {
      setProcessing(false);
    }
  }

  const pendingCount = queue.filter((q) => q.status === "pending" || q.status === "error").length;
  const doneCount = queue.filter((q) => q.status === "done").length;
  const busyCount = queue.filter((q) => q.status === "uploading" || q.status === "ocr").length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Catat Keborosan 📸</h1>
        <p className="text-sm text-slate-600">
          Foto struk langsung dari kamera. Bisa banyak sekaligus — tap tombol "Ambil lagi" sampe puas.
        </p>
      </div>

      {/* Camera button */}
      <button
        type="button"
        onClick={() => cameraInput.current?.click()}
        className="card flex w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-pink-300 bg-pink-50/50 py-8 text-pink-700 active:scale-[0.99]"
      >
        <Camera className="h-10 w-10" />
        <div className="font-semibold">Ambil Foto Struk</div>
        <div className="text-xs text-slate-500">Kamera bakal kebuka — bisa ambil beberapa</div>
      </button>
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Queue */}
      {queue.length > 0 && (
        <>
          <div className="text-xs text-slate-500">
            {queue.length} struk · {doneCount} done · {busyCount} proses · {pendingCount} pending
          </div>
          <div className="grid grid-cols-2 gap-3">
            {queue.map((item) => (
              <QueueCard key={item.id} item={item} onRemove={removeItem} onRetry={() => processOne(item)} />
            ))}
          </div>
        </>
      )}

      {/* Action bar */}
      {queue.length > 0 && (
        <div className="sticky bottom-24 mx-auto flex max-w-md gap-2">
          {pendingCount > 0 && (
            <button
              className="btn-primary flex-1"
              onClick={processAll}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  OCR {busyCount}/{queue.length}...
                </>
              ) : (
                <>
                  🪄 Proses {pendingCount} struk
                </>
              )}
            </button>
          )}
          {doneCount > 0 && pendingCount === 0 && (
            <button
              className="btn-primary flex-1"
              onClick={() => router.push("/review")}
              disabled={processing}
            >
              Review {doneCount} struk →
            </button>
          )}
        </div>
      )}

      {queue.length === 0 && (
        <div className="card p-4 text-sm text-slate-600">
          <p>
            💡 Tips: foto dari atas, jangan miring. Makin jelas teks-nya makin akurat OCR-nya.
          </p>
        </div>
      )}
    </div>
  );
}

function QueueCard({
  item,
  onRemove,
  onRetry,
}: {
  item: QueueItem;
  onRemove: (id: string) => void;
  onRetry: () => void;
}) {
  const router = useRouter();
  return (
    <div className="card overflow-hidden">
      <div className="relative aspect-[3/4] bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
        <button
          className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
          onClick={() => onRemove(item.id)}
        >
          <X className="h-4 w-4" />
        </button>
        {item.status === "uploading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
        {item.status === "ocr" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white">
            <Loader2 className="h-6 w-6 animate-spin" />
            <div className="mt-1 text-xs">Ngintip struk...</div>
          </div>
        )}
        {item.status === "done" && (
          <div className="absolute left-1 top-1 rounded-full bg-emerald-500 p-1 text-white">
            <Check className="h-3 w-3" />
          </div>
        )}
      </div>
      <div className="p-2">
        {item.status === "done" ? (
          <div className="space-y-1">
            <div className="truncate text-sm font-medium">{item.merchant ?? "—"}</div>
            <div className="text-xs text-slate-500">
              {item.total ? `${item.currency ?? ""} ${item.total.toLocaleString()}` : "Total gak ke-baca"}
            </div>
            <button
              className="btn-outline w-full text-xs py-1.5"
              onClick={() => router.push(`/review/${item.receiptId}`)}
            >
              <Edit3 className="h-3 w-3" /> Review
            </button>
          </div>
        ) : item.status === "error" ? (
          <div>
            <div className="text-xs text-rose-600">{item.error ?? "Error"}</div>
            <button className="btn-ghost mt-1 w-full text-xs py-1.5" onClick={onRetry}>
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-500">Pending</div>
        )}
      </div>
    </div>
  );
}
