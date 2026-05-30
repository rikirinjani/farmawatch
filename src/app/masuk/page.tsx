"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email: form.email,
          password: form.password,
        }
      );

      if (authError) {
        if (authError.message.includes("Invalid login credentials")) {
          setError("Email atau kata sandi salah.");
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      // Server-side profile status check
      if (data.user) {
        const res = await fetch("/api/verify-session");
        const session = await res.json();

        if (!session.valid) {
          await supabase.auth.signOut();
          const messages: Record<string, string> = {
            pending:
              "Akun Anda masih menunggu persetujuan admin. Anda akan menerima email setelah disetujui.",
            rejected:
              "Akun Anda telah ditolak. Silakan hubungi admin.",
            no_profile:
              "Profil tidak ditemukan. Silakan hubungi admin.",
          };
          toast.error(messages[session.reason] || "Sesi tidak valid.");
          setLoading(false);
          return;
        }
      }

      toast.success("Berhasil masuk!");
      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      setError("Terjadi kesalahan: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          className="input-field"
          placeholder="email@contoh.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kata Sandi
        </label>
        <input
          type="password"
          className="input-field"
          placeholder="Kata sandi Anda"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Memproses..." : "Masuk"}
      </button>

      <p className="text-center text-sm text-gray-600">
        Belum punya akun?{" "}
        <Link href="/daftar" className="text-teal-700 hover:underline">
          Daftar di sini
        </Link>
      </p>
    </form>
  );
}

export default function MasukPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Masuk</h1>
          <p className="text-gray-600 mt-2">
            Masuk ke akun FarmaWatch Anda
          </p>
        </div>
        <Suspense fallback={<div className="card p-6 text-center text-gray-500">Memuat...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
