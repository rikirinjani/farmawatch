import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";
import { TicketData } from "./DashboardClient";

export default async function DasborPage() {
  const supabase = createClient();

  // Fetch all non-submitted, non-rejected tickets for dashboards
  const { data: rawTickets } = await supabase
    .from("tickets")
    .select(
      `
      id, status, province, city, category_id, ai_tags, ai_summary,
      created_at, resolved_at, is_anonymous, description,
      category:ticket_categories(name)
    `
    )
    .in("status", ["accepted", "under_review", "resolved"])
    .order("created_at", { ascending: false })
    .limit(1000);

  // Normalize the nested category from array to single object
  const tickets: TicketData[] = (rawTickets || []).map((t: any) => ({
    ...t,
    category: Array.isArray(t.category) ? t.category[0] : t.category,
  }));

  // Fetch all tickets for "total" count
  const { count: totalTickets } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true });

  // Fetch tickets this month
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { count: ticketsThisMonth } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .gte("created_at", firstOfMonth);

  const { count: resolvedTickets } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .eq("status", "resolved");

  const { count: pendingTickets } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .eq("status", "submitted");

  // Recent resolved
  const { data: rawResolved } = await supabase
    .from("tickets")
    .select(
      "id, province, city, ai_summary, ai_tags, resolved_at, description, category:ticket_categories(name)"
    )
    .eq("status", "resolved")
    .order("resolved_at", { ascending: false })
    .limit(10);

  const recentResolved: TicketData[] = (rawResolved || []).map((t: any) => ({
    ...t,
    category: Array.isArray(t.category) ? t.category[0] : t.category,
  }));

  return (
    <DashboardClient
      tickets={tickets || []}
      totalTickets={totalTickets || 0}
      ticketsThisMonth={ticketsThisMonth || 0}
      resolvedTickets={resolvedTickets || 0}
      pendingTickets={pendingTickets || 0}
      recentResolved={recentResolved || []}
    />
  );
}
