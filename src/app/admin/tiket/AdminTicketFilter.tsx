"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { TicketCategory } from "@/types";
import { Search, X } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "submitted", label: "Terkirim" },
  { value: "accepted", label: "Diterima" },
  { value: "under_review", label: "Dalam Peninjauan" },
  { value: "resolved", label: "Selesai" },
  { value: "rejected", label: "Ditolak" },
];

interface Props {
  categories: TicketCategory[];
  currentStatus?: string;
  currentCategory?: string;
  currentSearch?: string;
}

export default function AdminTicketFilter({
  categories,
  currentStatus = "",
  currentCategory = "",
  currentSearch = "",
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [category, setCategory] = useState(currentCategory);
  const [search, setSearch] = useState(currentSearch);

  function applyFilters() {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    router.push(`/admin/tiket?${params.toString()}`);
  }

  function clearFilters() {
    setStatus("");
    setCategory("");
    setSearch("");
    router.push("/admin/tiket");
  }

  const hasFilters = status || category || search;

  return (
    <div className="card p-4 mb-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Cari
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="input-field pl-9"
              placeholder="Cari tiket..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Status
          </label>
          <select
            className="select-field text-sm"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Kategori
          </label>
          <select
            className="select-field text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button onClick={applyFilters} className="btn-primary text-sm py-2">
            Terapkan
          </button>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="btn-secondary text-sm py-2 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Hapus
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
