import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiTagTicket } from "@/lib/ai-tagging";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "superadmin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { ticketId } = await request.json();

    const { data: ticket } = await supabase
      .from("tickets")
      .select("description, category:ticket_categories(name)")
      .eq("id", ticketId)
      .single();

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const categoryName = (ticket.category as any)?.name || "Unknown";
    const { result, method } = await aiTagTicket(
      ticket.description,
      categoryName
    );

    return NextResponse.json({
      summary: result.summary,
      tags: result.tags,
      method,
    });
  } catch (error: any) {
    console.error("AI tagging error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
