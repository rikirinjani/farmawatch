import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const body = await request.json();

    // Authenticated: use server client (RLS enforces submitted_by = auth.uid())
    // Anonymous: use service role key (RLS blocks anon inserts)
    const client = user ? supabase : getServiceClient();
    const submittedBy = user?.id ?? null;

    const { data: ticket, error } = await client
      .from("tickets")
      .insert({
        submitted_by: submittedBy,
        is_anonymous: !!body.is_anonymous,
        category_id: body.category_id,
        province: body.province,
        city: body.city,
        description: body.description,
        drug_product: null,
        hyperlinks: body.hyperlinks ?? null,
        image_urls: [],
        status: "submitted",
      })
      .select("id")
      .single();

    if (error) {
      console.error("submit-ticket insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ticketId: ticket.id });
  } catch (error: any) {
    console.error("submit-ticket POST error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const svc = getServiceClient();

    const body = await request.json();
    const { ticketId, image_urls } = body;

    if (!ticketId || !image_urls) {
      return NextResponse.json(
        { error: "ticketId and image_urls required" },
        { status: 400 }
      );
    }

    // Use service role to fetch ticket (anonymous tickets not readable via RLS)
    const { data: ticket, error: fetchError } = await svc
      .from("tickets")
      .select("submitted_by, image_urls")
      .eq("id", ticketId)
      .single();

    if (fetchError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const isAnonymousTicket = ticket.submitted_by === null;
    const isOwner = user !== null && ticket.submitted_by === user.id;
    const isAdmin = user !== null && await (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      return profile?.role === "admin" || profile?.role === "superadmin";
    })();

    if (!isOwner && !isAdmin && !isAnonymousTicket) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (isAnonymousTicket && !user) {
      const existingUrls = ticket.image_urls as string[] | null;
      if (existingUrls && existingUrls.length > 0) {
        return NextResponse.json({ error: "Already updated" }, { status: 409 });
      }
    }

    const { error } = await svc
      .from("tickets")
      .update({ image_urls })
      .eq("id", ticketId);

    if (error) {
      console.error("submit-ticket PATCH error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("submit-ticket PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
