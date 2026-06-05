"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Profile } from "@/types";
import { Menu, X, ChevronDown, Shield, User, LogOut } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push("/");
    router.refresh();
  };

  const isAdmin =
    profile?.role === "admin" || profile?.role === "superadmin";
  const isApproved = profile?.status === "approved";

  return (
    <nav className="bg-teal-800 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <Shield className="w-6 h-6 text-amber-400" />
              <span>FarmaWatch</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/laporkan"
              className="btn-amber text-sm py-2 px-4 font-medium"
            >
              Laporkan
            </Link>

            {user ? (
              <>
                {isAdmin && isApproved && (
                  <>
                    <Link
                      href="/dasbor"
                      className="text-white/90 hover:text-white text-sm"
                    >
                      Dasbor
                    </Link>
                    <Link
                      href="/admin/tiket"
                      className="text-white/90 hover:text-white text-sm"
                    >
                      Kelola Tiket
                    </Link>
                    <Link
                      href="/admin/pengguna"
                      className="text-white/90 hover:text-white text-sm"
                    >
                      Pengguna
                    </Link>
                    {profile?.role === "superadmin" && (
                      <Link
                        href="/admin/pengaturan"
                        className="text-white/90 hover:text-white text-sm"
                      >
                        Pengaturan
                      </Link>
                    )}
                  </>
                )}

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 text-white/90 hover:text-white text-sm"
                  >
                    <User className="w-4 h-4" />
                    <span className="max-w-[120px] truncate">
                      {profile?.full_name || user.email}
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {dropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {profile?.full_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {profile?.role === "superadmin"
                              ? "Super Admin"
                              : profile?.role === "admin"
                              ? "Admin"
                              : "Pengguna"}
                          </p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Keluar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/masuk"
                  className="text-white/90 hover:text-white text-sm"
                >
                  Masuk
                </Link>
                <Link
                  href="/daftar"
                  className="bg-white text-teal-800 hover:bg-teal-50 text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-white"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-teal-900 border-t border-teal-700">
          <div className="px-4 py-3 space-y-2">
            <Link
              href="/laporkan"
              className="block py-2 text-white/90 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              Laporkan
            </Link>

            {user ? (
              <>
                {isAdmin && isApproved && (
                  <>
                    <Link
                      href="/dasbor"
                      className="block py-2 text-white/90 hover:text-white"
                      onClick={() => setMobileOpen(false)}
                    >
                      Dasbor
                    </Link>
                    <Link
                      href="/admin/tiket"
                      className="block py-2 text-white/90 hover:text-white"
                      onClick={() => setMobileOpen(false)}
                    >
                      Kelola Tiket
                    </Link>
                    <Link
                      href="/admin/pengguna"
                      className="block py-2 text-white/90 hover:text-white"
                      onClick={() => setMobileOpen(false)}
                    >
                      Pengguna
                    </Link>
                    {profile?.role === "superadmin" && (
                      <Link
                        href="/admin/pengaturan"
                        className="block py-2 text-white/90 hover:text-white"
                        onClick={() => setMobileOpen(false)}
                      >
                        Pengaturan
                      </Link>
                    )}
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 text-red-300 hover:text-red-200"
                >
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/masuk"
                  className="block py-2 text-white/90 hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  Masuk
                </Link>
                <Link
                  href="/daftar"
                  className="block py-2 text-white/90 hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
