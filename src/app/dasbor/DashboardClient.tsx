"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import * as XLSX from "xlsx";
import {
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  Download,
  Filter,
} from "lucide-react";
import { formatDateShort } from "@/lib/utils";

// Warna untuk chart
const CHART_COLORS = [
  "#0d9488",
  "#f59e0b",
  "#6366f1",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
];

interface TicketData {
  id: string;
  status: string;
  province: string;
  city: string;
  category_id: string;
  ai_tags: string[] | null;
  ai_summary: string | null;
  description: string | null;
  created_at: string;
  resolved_at: string | null;
  is_anonymous: boolean;
  category?: { name: string } | null;
}

export type { TicketData };

interface Props {
  tickets: TicketData[];
  totalTickets: number;
  ticketsThisMonth: number;
  resolvedTickets: number;
  pendingTickets: number;
  recentResolved: TicketData[];
}

export default function DashboardClient({
  tickets,
  totalTickets,
  ticketsThisMonth,
  resolvedTickets,
  pendingTickets,
  recentResolved,
}: Props) {
  const [filterProvince, setFilterProvince] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Apply filters
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (filterProvince && t.province !== filterProvince) return false;
      if (filterCategory && t.category_id !== filterCategory) return false;
      if (filterStartDate && t.created_at < filterStartDate) return false;
      if (filterEndDate && t.created_at > filterEndDate + "T23:59:59")
        return false;
      return true;
    });
  }, [tickets, filterProvince, filterCategory, filterStartDate, filterEndDate]);

  // Unique provinces & categories for filter dropdowns
  const provinces = useMemo(
    () => [...new Set(tickets.map((t) => t.province))].sort(),
    [tickets]
  );

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    tickets.forEach((t) => {
      if (t.category) map.set(t.category_id, t.category.name);
    });
    return Array.from(map.entries());
  }, [tickets]);

  // Province → city drill-down data
  const provinceCityData = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    filteredTickets.forEach((t) => {
      if (!map.has(t.province)) map.set(t.province, new Map());
      const cityMap = map.get(t.province)!;
      cityMap.set(t.city, (cityMap.get(t.city) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([province, cities]) => ({
        province,
        total: Array.from(cities.values()).reduce((a, b) => a + b, 0),
        cities: Array.from(cities.entries())
          .map(([city, count]) => ({ city, count }))
          .sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTickets]);

  // Monthly data for time series
  const monthlyData = useMemo(() => {
    const months = new Map<string, number>();
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.set(key, 0);
    }
    filteredTickets.forEach((t) => {
      const d = new Date(t.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (months.has(key)) months.set(key, (months.get(key) || 0) + 1);
    });
    return Array.from(months.entries()).map(([month, count]) => {
      const [y, m] = month.split("-");
      const labels = [
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
        "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
      ];
      return { month: labels[parseInt(m) - 1] + " " + y, count };
    });
  }, [filteredTickets]);

  // Category distribution
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    filteredTickets.forEach((t) => {
      const name = t.category?.name || "Tidak Diketahui";
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [filteredTickets]);

  // Top tags
  const topTags = useMemo(() => {
    const map = new Map<string, number>();
    filteredTickets.forEach((t) => {
      if (t.ai_tags) {
        t.ai_tags.forEach((tag) => {
          map.set(tag, (map.get(tag) || 0) + 1);
        });
      }
    });
    return Array.from(map.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [filteredTickets]);

  // Province map data (for choropleth-like bar chart)
  const provinceChartData = useMemo(() => {
    return provinceCityData.slice(0, 15).map((p) => ({
      name: p.province,
      total: p.total,
    }));
  }, [provinceCityData]);

  function sanitizeCell(value: string): string {
    if (typeof value === "string" && /^[=+\-@]/.test(value)) {
      return "'" + value;
    }
    return value;
  }

  function exportToExcel() {
    const exportData = filteredTickets.map((t) => ({
      "ID Tiket": sanitizeCell(t.id),
      Kategori: sanitizeCell(t.category?.name || "-"),
      Provinsi: sanitizeCell(t.province),
      "Kota/Kabupaten": sanitizeCell(t.city),
      Deskripsi: sanitizeCell(t.description || "-"),
      Status: sanitizeCell(t.status),
      "Ringkasan AI": sanitizeCell(t.ai_summary || "-"),
      Tags: sanitizeCell(t.ai_tags?.join(", ") || "-"),
      "Tanggal Laporan": sanitizeCell(t.created_at),
      "Tanggal Selesai": sanitizeCell(t.resolved_at || "-"),
      "Jenis Laporan": t.is_anonymous ? "Anonim" : "Terdaftar",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tiket");
    XLSX.writeFile(wb, `farmawatch-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dasbor</h1>
        <button onClick={exportToExcel} className="btn-secondary text-sm flex items-center gap-2">
          <Download className="w-4 h-4" />
          Ekspor Excel
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-teal-100 p-2.5 rounded-lg">
              <FileText className="w-5 h-5 text-teal-700" />
            </div>
            <p className="text-sm text-gray-500">Total Laporan</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalTickets}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-amber-100 p-2.5 rounded-lg">
              <TrendingUp className="w-5 h-5 text-amber-700" />
            </div>
            <p className="text-sm text-gray-500">Bulan Ini</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{ticketsThisMonth}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 p-2.5 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-700" />
            </div>
            <p className="text-sm text-gray-500">Selesai</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{resolvedTickets}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2.5 rounded-lg">
              <Clock className="w-5 h-5 text-blue-700" />
            </div>
            <p className="text-sm text-gray-500">Menunggu</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{pendingTickets}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 mb-6 flex flex-wrap items-end gap-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Provinsi</label>
          <select
            className="select-field text-sm"
            value={filterProvince}
            onChange={(e) => setFilterProvince(e.target.value)}
          >
            <option value="">Semua</option>
            {provinces.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Kategori</label>
          <select
            className="select-field text-sm"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Semua</option>
            {categories.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Dari</label>
          <input
            type="date"
            className="input-field text-sm"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Sampai</label>
          <input
            type="date"
            className="input-field text-sm"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Tickets by Time Period */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Laporan per Bulan</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#0d9488"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name="Laporan"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tickets by Category */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Laporan per Kategori</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="count"
                  nameKey="name"
                  label={({ name, percent }: { name: string; percent: number }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  labelLine={{ strokeWidth: 1 }}
                >
                  {categoryData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-16">Belum ada data</p>
          )}
        </div>
      </div>

      {/* Province distribution bar chart */}
      <div className="card p-5 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Laporan per Provinsi</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={provinceChartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11 }}
              width={130}
            />
            <Tooltip />
            <Bar dataKey="total" fill="#0d9488" radius={[0, 4, 4, 0]} name="Laporan" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Province → City drill-down */}
      <div className="card p-5 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">
          Detail Provinsi → Kota/Kabupaten
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-4 py-2 font-medium text-gray-600">Provinsi</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Total</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Kota/Kabupaten</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {provinceCityData.map((prov) => (
                <tr key={prov.province}>
                  <td className="px-4 py-2 font-medium text-gray-900">{prov.province}</td>
                  <td className="px-4 py-2 text-teal-700 font-semibold">{prov.total}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      {prov.cities.map((city) => (
                        <span
                          key={city.city}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                        >
                          {city.city} ({city.count})
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Tags */}
      <div className="card p-5 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Tag Teratas</h3>
        {topTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {topTags.map(({ tag, count }) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm"
                style={{
                  backgroundColor: `rgba(13, 148, 136, ${Math.max(0.1, Math.min(0.9, count / topTags[0].count))})`,
                  color: count === topTags[0].count ? "white" : "#0f766e",
                }}
              >
                {tag} ({count})
              </span>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">
            Belum ada tag tersedia. Tag akan muncul setelah laporan diterima dan dianalisis.
          </p>
        )}
      </div>

      {/* Recent Resolved */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-4">
          Laporan Terbaru Diselesaikan
        </h3>
        {recentResolved.length > 0 ? (
          <div className="space-y-4">
            {recentResolved.map((t) => (
              <div
                key={t.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 line-clamp-1">
                    {t.ai_summary || "Tidak ada ringkasan"}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span className="text-xs text-gray-500">
                      {t.city}, {t.province}
                    </span>
                    <span className="text-xs text-gray-400">
                      {t.category?.name}
                    </span>
                    {t.resolved_at && (
                      <span className="text-xs text-gray-400">
                        {formatDateShort(t.resolved_at)}
                      </span>
                    )}
                  </div>
                </div>
                {t.ai_tags && t.ai_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {t.ai_tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex px-1.5 py-0.5 rounded text-xs bg-teal-50 text-teal-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">
            Belum ada laporan yang diselesaikan.
          </p>
        )}
      </div>
    </div>
  );
}
