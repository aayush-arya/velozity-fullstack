import { formatDistanceToNowStrict, isPast } from "date-fns";

export function formatRelativeTime(dateIso: string): string {
  return formatDistanceToNowStrict(new Date(dateIso), { addSuffix: true });
}

export function isOverdueDate(dateIso: string): boolean {
  return isPast(new Date(dateIso));
}

export function formatDate(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
