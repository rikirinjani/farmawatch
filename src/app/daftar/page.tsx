"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { provinsiData } from "@/lib/indonesia-data";
import toast from "react-hot-toast";

export default function DaftarPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    province: "",
    city: "",
    email: "",
    whatsapp: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cities = form.province
    ? provinsiData.find((p) => p.name === form.province)?.cities || []
    : [];

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = "Nama lengkap wajib diisi";
    if (!form.province) errs.province = "Provinsi wajib dipilih";
    if (!form.city) errs.city = "Kota/Kabupaten wajib dipilih";
    if (!form.email.trim()) errs.email = "Email wajib diisi";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      errs.email = "Format email tidak valid";
    if (!form.whatsapp.trim()) errs.whatsapp = "Nomor WhatsApp wajib diisi";
    else if (!/^(\+62|0)8[1-9][0-9]{6,10}$/.test(form.whatsapp.replace(/[\s-]/g, "")))
      errs.whatsapp = "Format WhatsApp tidak valid (contoh: 08123456789)";
    if (!form.password) errs.password = "Kata sandi wajib diisi";
    else if (form.password.length < 8)
      errs.password = "Kata sandi minimal 8 karakter";
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Kata sandi tidak cocok";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          toast.error("Email sudah terdaftar. Silakan masuk.");
        } else {
          toast.error(authError.message);
        }
        setLoading(false);
        return;
      }

      // Update profile record (trigger on_auth_user_created already created the row)
      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            province: form.province,
            city: form.city,
            whatsapp: form.whatsapp,
          })
          .eq("id", authData.user.id);

        if (profileError) {
          toast.error("Gagal melengkapi profil: " + profileError.message);
          setLoading(false);
          return;
        }
      }

      toast.success(
        "Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan admin. Anda akan menerima email setelah disetujui."
      );
      router.push("/masuk");
    } catch (err: any) {
      toast.error("Terjadi kesalahan: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Daftar Akun</h1>
          <p className="text-gray-600 mt-2">
            Daftar untuk mulai melaporkan pelanggaran
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Nama lengkap Anda"
              value={form.fullName}
              onChange={(e) =>
                setForm({ ...form, fullName: e.target.value })
              }
            />
            {errors.fullName && (
              <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Province */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provinsi
            </label>
            <select
              className="select-field"
              value={form.province}
              onChange={(e) =>
                setForm({ ...form, province: e.target.value, city: "" })
              }
            >
              <option value="">Pilih provinsi</option>
              {provinsiData.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.province && (
              <p className="text-red-500 text-xs mt-1">{errors.province}</p>
            )}
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kota/Kabupaten
            </label>
            <select
              className="select-field"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              disabled={!form.province}
            >
              <option value="">Pilih kota/kabupaten</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.city && (
              <p className="text-red-500 text-xs mt-1">{errors.city}</p>
            )}
          </div>

          {/* Email */}
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
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nomor WhatsApp
            </label>
            <input
              type="tel"
              className="input-field"
              placeholder="08123456789"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            />
            {errors.whatsapp && (
              <p className="text-red-500 text-xs mt-1">{errors.whatsapp}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kata Sandi
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="Minimal 8 karakter"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konfirmasi Kata Sandi
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="Ulangi kata sandi"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Mendaftarkan..." : "Daftar"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Sudah punya akun?{" "}
            <Link href="/masuk" className="text-teal-700 hover:underline">
              Masuk
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
