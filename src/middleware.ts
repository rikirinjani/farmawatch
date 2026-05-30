import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (pathname.startsWith("/admin") || pathname.startsWith("/dasbor")) {
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = "/masuk";
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", user.id)
        .single();

      if (!profile || profile.status !== "approved" ||
          (profile.role !== "admin" && profile.role !== "superadmin")) {
        return NextResponse.redirect(new URL("/", request.url));
      }

      if (pathname.startsWith("/admin/pengaturan") && profile.role !== "superadmin") {
        return NextResponse.redirect(new URL("/admin/tiket", request.url));
      }
    }
  } catch (e) {
    console.error("Middleware error:", e);
    if (pathname.startsWith("/admin") || pathname.startsWith("/dasbor")) {
      const url = request.nextUrl.clone();
      url.pathname = "/masuk";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};