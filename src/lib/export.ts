import Papa from "papaparse";
import ExcelJS from "exceljs";

export type ExportRow = {
  date: string;
  type: string;
  source: string;
  category: string;
  merchant: string;
  amount: string;
  currency: string;
  amountIDR: string;
  amountMYR: string;
  note: string;
};

const HEADERS: Array<keyof ExportRow> = [
  "date",
  "type",
  "source",
  "category",
  "merchant",
  "amount",
  "currency",
  "amountIDR",
  "amountMYR",
  "note",
];

export function toCsv(rows: ExportRow[]): string {
  return Papa.unparse({ fields: HEADERS as string[], data: rows.map((r) => HEADERS.map((h) => r[h])) });
}

export async function toXlsx(rows: ExportRow[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Transactions");
  ws.columns = HEADERS.map((h) => ({ header: h, key: h, width: h === "note" || h === "merchant" ? 28 : 14 }));
  ws.getRow(1).font = { bold: true };
  rows.forEach((r) => ws.addRow(r));
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
