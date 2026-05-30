import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  sendTicketAcceptedEmail,
  sendTicketRejectedEmail,
  sendTicketResolvedEmail,
} from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "superadmin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { ticketId, action } = await request.json();

    if (!ticketId || !action) {
      return NextResponse.json({ error: "ticketId and action required" }, { status: 400 });
    }

    const { data: ticket } = await supabase
      .from("tickets")
      .select("is_anonymous, submitted_by, submitter:profiles!tickets_submitted_by_fkey(email, full_name), rejection_reason:rejection_reasons(label)")
      .eq("id", ticketId)
      .single();

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Skip email for anonymous tickets or if no submitter
    if (ticket.is_anonymous || !ticket.submitter || !(ticket.submitter as any)?.email) {
      return NextResponse.json({ skipped: true, reason: "anonymous or no submitter" });
    }

    const recipient = {
      email: (ticket.submitter as any).email,
      full_name: (ticket.submitter as any).full_name || "Pengguna",
    };

    const reasonLabel = (ticket.rejection_reason as any)?.label;

    switch (action) {
      case "accepted":
        await sendTicketAcceptedEmail(recipient, ticketId);
        break;
      case "rejected":
        await sendTicketRejectedEmail(recipient, ticketId, reasonLabel || "");
        break;
      case "resolved":
        await sendTicketResolvedEmail(recipient, ticketId);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ sent: true });
  } catch (error: any) {
    console.error("Ticket notify error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
