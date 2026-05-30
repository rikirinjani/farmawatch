import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ valid: false, reason: "not_authenticated" });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("status, role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ valid: false, reason: "no_profile" });
    }

    if (profile.status === "pending") {
      return NextResponse.json({ valid: false, reason: "pending" });
    }

    if (profile.status === "rejected") {
      return NextResponse.json({ valid: false, reason: "rejected" });
    }

    return NextResponse.json({ valid: true, role: profile.role });
  } catch (error: any) {
    console.error("Verify session error:", error);
    return NextResponse.json(
      { valid: false, reason: "error" },
      { status: 500 }
    );
  }
}
