import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatMonth(dateString: string): string {
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
  });
}

export function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    submitted: "badge-submitted",
    accepted: "badge-accepted",
    under_review: "badge-review",
    resolved: "badge-resolved",
    rejected: "badge-rejected",
    pending: "badge bg-yellow-100 text-yellow-800",
    approved: "badge bg-green-100 text-green-800",
  };
  return map[status] || "badge bg-gray-100 text-gray-800";
}

/**
 * Escape a value before interpolating it into a PostgREST `.or()` / `.ilike()` filter.
 * Strips characters with special meaning in the PostgREST filter grammar
 * and SQL LIKE wildcards.
 */
export function escapePostgrestFilter(value: string): string {
  return value.replace(/[,()*%\\]/g, "").trim().slice(0, 100);
}

/**
 * Returns the URL if it is a safe http(s) URL, otherwise null.
 */
export function safeExternalUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
    return null;
  } catch {
    return null;
  }
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    submitted: "Terkirim",
    accepted: "Diterima",
    under_review: "Dalam Peninjauan",
    resolved: "Selesai",
    rejected: "Ditolak",
    pending: "Menunggu",
    approved: "Disetujui",
  };
  return map[status] || status;
}
