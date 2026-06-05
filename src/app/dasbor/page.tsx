import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import DashboardClient, { TicketData } from "./DashboardClient";

export const dynamic = "force-dynamic";

interface RawTicket {
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
  category: { name: string } | { name: string }[] | null;
}

function normalizeCategory(item: RawTicket): TicketData {
  return {
    ...item,
    category: Array.isArray(item.category) ? item.category[0] : item.category,
  };
}

async function runQueries(supabase: ReturnType<typeof createClient>) {
  const firstOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString();

  const results = await Promise.allSettled([
    supabase
      .from("tickets")
      .select(
        `id, status, province, city, category_id, ai_tags, ai_summary,
         created_at, resolved_at, is_anonymous, description,
         category:ticket_categories(name)`
      )
      .in("status", ["accepted", "under_review", "resolved"])
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .gte("created_at", firstOfMonth),
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("status", "resolved"),
    supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("status", "submitted"),
    supabase
      .from("tickets")
      .select(
        "id, province, city, ai_summary, ai_tags, resolved_at, description, status, category_id, created_at, is_anonymous, category:ticket_categories(name)"
      )
      .eq("status", "resolved")
      .order("resolved_at", { ascending: false })
      .limit(10),
  ]);

  function unwrapData<T>(r: PromiseSettledResult<any>, fallback: T): T {
    if (r.status === "rejected") {
      console.error("Dashboard query rejected:", r.reason);
      return fallback;
    }
    if (r.value?.error) {
      console.error("Dashboard query error:", r.value.error);
      return fallback;
    }
    return (r.value?.data ?? fallback) as T;
  }

  function unwrapCount(r: PromiseSettledResult<any>): number {
    if (r.status === "rejected") {
      console.error("Dashboard count query rejected:", r.reason);
      return 0;
    }
    if (r.value?.error) {
      console.error("Dashboard count query error:", r.value.error);
      return 0;
    }
    return r.value?.count ?? 0;
  }

  const rawTickets = unwrapData<RawTicket[]>(results[0], []);
  const totalTickets = unwrapCount(results[1]);
  const ticketsThisMonth = unwrapCount(results[2]);
  const resolvedTickets = unwrapCount(results[3]);
  const pendingTickets = unwrapCount(results[4]);
  const rawResolved = unwrapData<RawTicket[]>(results[5], []);

  const tickets: TicketData[] = rawTickets.map(normalizeCategory);
  const recentResolved: TicketData[] = rawResolved.map(normalizeCategory);

  return { tickets, totalTickets, ticketsThisMonth, resolvedTickets, pendingTickets, recentResolved };
}

async function DashboardData() {
  const supabase = createClient();
  const data = await runQueries(supabase);

  return <DashboardClient {...data} />;
}

export default function DasborPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-32 mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-2 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gray-200" />
              <div className="h-4 w-24 rounded bg-gray-200" />
            </div>
            <div className="h-8 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 h-5 w-40 rounded bg-gray-200" />
            <div className="h-[280px] rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
