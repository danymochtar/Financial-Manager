"use client";

import { useRef, useState } from "react";
import { Camera, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";

export function ReceiptUploader({ onUploaded }: { onUploaded?: (receiptId: string) => void }) {
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const router = useRouter();

  async function handle(file: File) {
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/receipts/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast({ kind: "error", message: data?.error?.formErrors?.[0] ?? data?.error ?? "Upload gagal" });
        return;
      }
      toast({ kind: "success", message: "Receipt berhasil di-upload, lanjut review." });
      if (onUploaded) onUploaded(data.receipt.id);
      else router.push(`/receipts/${data.receipt.id}`);
    } catch (err) {
      toast({ kind: "error", message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold">Upload Receipt</h2>
      <p className="mt-1 text-sm text-slate-600">
        Foto struk / receipt bakal di-OCR pake Claude Vision, terus auto-fill transaksi.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={busy}
          className="btn-outline flex-col h-32 border-dashed"
          onClick={() => cameraInput.current?.click()}
        >
          <Camera className="h-8 w-8 text-brand-600" />
          <span>Capture dari Kamera</span>
          <span className="text-xs text-slate-500">(akan langsung buka kamera di HP)</span>
        </button>
        <button
          type="button"
          disabled={busy}
          className="btn-outline flex-col h-32 border-dashed"
          onClick={() => fileInput.current?.click()}
        >
          <Upload className="h-8 w-8 text-brand-600" />
          <span>Upload dari Gallery / File</span>
          <span className="text-xs text-slate-500">JPG / PNG / HEIC, maks 10MB</span>
        </button>
      </div>

      {busy && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Nge-OCR receipt... tunggu bentar.
        </div>
      )}

      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
          e.target.value = "";
        }}
      />
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
