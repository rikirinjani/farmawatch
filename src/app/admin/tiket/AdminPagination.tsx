"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export default function AdminPagination({
  currentPage,
  totalPages,
  totalCount,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set("page", String(page));
    } else {
      params.delete("page");
    }
    router.push(`/admin/tiket?${params.toString()}`);
  }

  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-200">
      <div className="text-sm text-gray-500">
        Halaman {currentPage} dari {totalPages} ({totalCount} tiket)
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => goToPage(1)}
          disabled={currentPage <= 1}
          className="px-2.5 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          &laquo;
        </button>
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-2.5 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          &lsaquo;
        </button>
        {start > 1 && (
          <span className="px-2 text-gray-400 text-sm">...</span>
        )}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => goToPage(p)}
            className={`px-3 py-1.5 text-sm rounded-md border ${
              p === currentPage
                ? "bg-teal-700 text-white border-teal-700"
                : "border-gray-300 hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        ))}
        {end < totalPages && (
          <span className="px-2 text-gray-400 text-sm">...</span>
        )}
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-2.5 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          &rsaquo;
        </button>
        <button
          onClick={() => goToPage(totalPages)}
          disabled={currentPage >= totalPages}
          className="px-2.5 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          &raquo;
        </button>
      </div>
    </div>
  );
}
