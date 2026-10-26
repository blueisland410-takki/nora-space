import { fromZonedTime } from "date-fns-tz";

export function dateKey(value: string | Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function dateFromKey(key: string) {
  return new Date(`${key}T12:00:00Z`);
}

export function addDaysToKey(key: string, days: number) {
  const date = dateFromKey(key);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function weekStartKey(key: string) {
  const weekday = dateFromKey(key).getUTCDay();
  return addDaysToKey(key, -(weekday === 0 ? 6 : weekday - 1));
}

export function dueAtFromDate(key: string | null, timezone: string) {
  if (!key) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || dateFromKey(key).toISOString().slice(0, 10) !== key) {
    throw new Error("截止日期无效。");
  }
  return fromZonedTime(`${key} 12:00:00`, timezone).toISOString();
}

export function isTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function displayDate(value: string | Date, timezone: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: timezone,
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  }).format(new Date(value));
}
