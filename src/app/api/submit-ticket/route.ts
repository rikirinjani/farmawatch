import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL env vars"
    );
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data: ticket, error } = await getServiceClient()
      .from("tickets")
      .insert({
        submitted_by: body.submitted_by ?? null,
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
    const body = await request.json();
    const { ticketId, image_urls } = body;

    if (!ticketId || !image_urls) {
      return NextResponse.json(
        { error: "ticketId and image_urls required" },
        { status: 400 }
      );
    }

    const { error } = await getServiceClient()
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
