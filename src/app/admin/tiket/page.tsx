import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  escapePostgrestFilter,
  formatDate,
  getStatusBadgeClass,
  getStatusLabel,
} from "@/lib/utils";
import AdminTicketFilter from "./AdminTicketFilter";

interface SearchParams {
  status?: string;
  category?: string;
  province?: string;
  search?: string;
}

export default async function AdminTiketPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();

  // Fetch categories for filter
  const { data: categories } = await supabase
    .from("ticket_categories")
    .select("*")
    .eq("is_active", true);

  // Build query
  let query = supabase
    .from("tickets")
    .select(
      "*, category:ticket_categories(name), submitter:profiles!tickets_submitted_by_fkey(full_name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }
  if (searchParams.category) {
    query = query.eq("category_id", searchParams.category);
  }
  if (searchParams.province) {
    query = query.eq("province", searchParams.province);
  }
  if (searchParams.search) {
    const safe = escapePostgrestFilter(searchParams.search);
    if (safe.length > 0) {
      query = query.or(
        `description.ilike.%${safe}%,province.ilike.%${safe}%,city.ilike.%${safe}%`
      );
    }
  }

  const { data: tickets, count } = await query;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Tiket</h1>
        <Link href="/dasbor" className="btn-secondary text-sm">
          Lihat Dasbor
        </Link>
      </div>

      {/* Filter */}
      <AdminTicketFilter
        categories={categories || []}
        currentStatus={searchParams.status}
        currentCategory={searchParams.category}
        currentSearch={searchParams.search}
      />

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Kategori
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Lokasi
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">
                  Pelapor
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">
                  Tanggal
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  &nbsp;
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets && tickets.length > 0 ? (
                tickets.map((ticket: any) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={getStatusBadgeClass(ticket.status)}>
                        {getStatusLabel(ticket.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {ticket.category?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {ticket.city}, {ticket.province}
                    </td>
                    <td className="px-4 py-3 text-gray-700 hidden md:table-cell">
                      {ticket.is_anonymous
                        ? "Anonim"
                        : ticket.submitter?.full_name || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {formatDate(ticket.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/tiket/${ticket.id}`}
                        className="text-teal-700 hover:underline text-sm font-medium"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Tidak ada tiket ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {count !== undefined && (
          <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
            Total: {count} tiket
          </div>
        )}
      </div>
    </div>
  );
}
