/**
 * Date-range helpers buat budget & analytics period.
 * Semua pake waktu lokal Indonesia (WIB, UTC+7) supaya "hari ini" = hari kalender user.
 */

const TZ_OFFSET_HOURS = 7; // WIB

function toLocal(d: Date): Date {
  return new Date(d.getTime() + TZ_OFFSET_HOURS * 3600 * 1000);
}

function fromLocal(d: Date): Date {
  return new Date(d.getTime() - TZ_OFFSET_HOURS * 3600 * 1000);
}

export function startOfDay(date = new Date()): Date {
  const l = toLocal(date);
  l.setUTCHours(0, 0, 0, 0);
  return fromLocal(l);
}

export function endOfDay(date = new Date()): Date {
  const l = toLocal(date);
  l.setUTCHours(23, 59, 59, 999);
  return fromLocal(l);
}

export function startOfWeek(date = new Date()): Date {
  // Monday as start-of-week
  const l = toLocal(date);
  const day = l.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  l.setUTCDate(l.getUTCDate() + diff);
  l.setUTCHours(0, 0, 0, 0);
  return fromLocal(l);
}

export function endOfWeek(date = new Date()): Date {
  const s = startOfWeek(date);
  const e = new Date(s);
  e.setUTCDate(e.getUTCDate() + 6);
  const l = toLocal(e);
  l.setUTCHours(23, 59, 59, 999);
  return fromLocal(l);
}

export function startOfMonth(date = new Date()): Date {
  const l = toLocal(date);
  l.setUTCDate(1);
  l.setUTCHours(0, 0, 0, 0);
  return fromLocal(l);
}

export function endOfMonth(date = new Date()): Date {
  const l = toLocal(date);
  l.setUTCMonth(l.getUTCMonth() + 1, 0);
  l.setUTCHours(23, 59, 59, 999);
  return fromLocal(l);
}

export function periodRange(period: "daily" | "weekly" | "monthly", date = new Date()): { from: Date; to: Date } {
  if (period === "daily") return { from: startOfDay(date), to: endOfDay(date) };
  if (period === "weekly") return { from: startOfWeek(date), to: endOfWeek(date) };
  return { from: startOfMonth(date), to: endOfMonth(date) };
}

/** yyyy-mm-dd in WIB */
export function localDateKey(date = new Date()): string {
  return toLocal(date).toISOString().slice(0, 10);
}
