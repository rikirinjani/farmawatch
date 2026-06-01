"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { provinsiData } from "@/lib/indonesia-data";
import { safeExternalUrl } from "@/lib/utils";
import { TicketCategory } from "@/types";
import toast from "react-hot-toast";
import { Upload, X, Info } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

const MAX_IMAGES = 3;
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB

export default function LaporkanPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const [form, setForm] = useState({
    categoryId: "",
    province: "",
    city: "",
    description: "",
    hyperlinks: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // drug_product field reserved for future use
  // const [drugProduct, setDrugProduct] = useState("");

  // Cek user & fetch categories
  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      const { data: cats } = await supabase
        .from("ticket_categories")
        .select("*")
        .eq("is_active", true);
      if (cats) setCategories(cats);
    };
    init();
  }, [supabase]);

  const cities = form.province
    ? provinsiData.find((p) => p.name === form.province)?.cities || []
    : [];

  // Drag & Drop handlers for the rich text area
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    addImages(files);
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    addImages(files);
  }

  function addImages(files: File[]) {
    const remaining = MAX_IMAGES - uploadedImages.length;
    if (remaining <= 0) {
      toast.error(`Maksimal ${MAX_IMAGES} gambar per laporan.`);
      return;
    }

    const valid = files.slice(0, remaining).filter((f) => {
      if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
        toast.error(`${f.name} bukan format JPG, PNG, atau WEBP.`);
        return false;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name} melebihi batas 8 MB.`);
        return false;
      }
      return true;
    });

    if (valid.length === 0) return;

    const newPreviews = valid.map((f) => URL.createObjectURL(f));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    setUploadedImages((prev) => [...prev, ...valid]);
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!isAnonymous && !user) {
      errs.general = "Anda harus masuk untuk mengirim laporan terdaftar.";
    }
    if (!form.categoryId) errs.categoryId = "Kategori wajib dipilih";
    if (!form.province) errs.province = "Provinsi wajib dipilih";
    if (!form.city) errs.city = "Kota/Kabupaten wajib dipilih";
    if (!form.description.trim()) errs.description = "Deskripsi wajib diisi";
    else if (form.description.trim().length < 20)
      errs.description = "Deskripsi minimal 20 karakter";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function uploadImagesToStorage(
    ticketId: string
  ): Promise<string[]> {
    if (uploadedImages.length === 0) return [];

    const urls: string[] = [];
    for (let i = 0; i < uploadedImages.length; i++) {
      const file = uploadedImages[i];
      const ext = file.name.split(".").pop();
      const path = `tickets/${ticketId}/${uuidv4()}.${ext}`;
      const { data, error } = await supabase.storage
        .from("ticket-images")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        toast.error(`Gagal upload gambar ${i + 1}: ${error.message}`);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("ticket-images").getPublicUrl(path);

      urls.push(publicUrl);
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      // Parse hyperlinks from comma-separated input; only accept http(s) URLs.
      const rawLinks = form.hyperlinks
        ? form.hyperlinks
            .split(/[,;\n]+/)
            .map((l) => l.trim())
            .filter((l) => l.length > 0)
        : [];
      const validLinks = rawLinks.map(safeExternalUrl).filter((u): u is string => !!u);
      if (rawLinks.length > 0 && validLinks.length !== rawLinks.length) {
        toast.error("Hanya tautan http:// atau https:// yang diterima.");
        setLoading(false);
        return;
      }
      const hyperlinks = validLinks.length > 0 ? validLinks : null;

      // Create ticket via server API (bypasses client-side RLS)
      const res = await fetch("/api/submit-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submitted_by: isAnonymous ? null : user?.id,
          is_anonymous: isAnonymous,
          category_id: form.categoryId,
          province: form.province,
          city: form.city,
          description: form.description,
          hyperlinks,
        }),
      });

      const ticketResult = await res.json();
      if (!res.ok) {
        toast.error("Gagal mengirim laporan: " + (ticketResult.error || "Unknown error"));
        setLoading(false);
        return;
      }

      const ticket = { id: ticketResult.ticketId };

      // Upload images now that we have the ticket ID
      const imageUrls = await uploadImagesToStorage(ticket.id);

      // Update ticket with image URLs via server API
      if (imageUrls.length > 0) {
        await fetch("/api/submit-ticket", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId: ticket.id, image_urls: imageUrls }),
        });
      }

      toast.success("Laporan berhasil dikirim! Tim kami akan meninjau laporan Anda.");
      router.push("/");
    } catch (err: any) {
      toast.error("Terjadi kesalahan: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Kirim Laporan</h1>
        <p className="text-gray-600 mt-1">
          Laporkan penyalahgunaan obat atau pelanggaran penjualan obat keras
        </p>
      </div>

      {/* Anonymous toggle */}
      {!user && (
        <div className="card p-4 mb-6 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-amber-800 font-medium">
                Anda belum masuk
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Anda dapat mengirim laporan secara anonim tanpa akun, atau{" "}
                <a href="/masuk?redirect=/laporkan" className="underline font-medium">
                  masuk
                </a>{" "}
                terlebih dahulu untuk melacak status laporan.
              </p>
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-gray-300 text-teal-700 focus:ring-teal-500"
                />
                <span className="text-sm text-amber-800">
                  Kirim sebagai laporan anonim
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kategori Laporan
          </label>
          <select
            className="select-field"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            <option value="">Pilih kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>
          )}
        </div>

        {/* Drug Product - reserved for future dropdown */}
        {/* <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Produk Obat (opsional)
          </label>
          <select
            className="select-field"
            value={drugProduct}
            onChange={(e) => setDrugProduct(e.target.value)}
          >
            <option value="">Pilih produk obat</option>
          </select>
        </div> */}

        {/* Province of Event */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Provinsi Kejadian
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

        {/* City of Event */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kota/Kabupaten Kejadian
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

        {/* Description + Image Upload Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deskripsi Kejadian
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Jelaskan kejadian secara detail. Anda dapat menyeret gambar ke area
            ini.
          </p>

          <div
            className={`relative border-2 border-dashed rounded-lg transition-colors ${
              dragActive
                ? "border-teal-500 bg-teal-50"
                : "border-gray-300 bg-white"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <textarea
              className="w-full px-4 pt-4 pb-2 rounded-lg resize-y min-h-[140px] text-sm focus:outline-none bg-transparent"
              placeholder="Tulis deskripsi kejadian di sini... (minimal 20 karakter)"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />

            {/* Image previews inside the text area */}
            {imagePreviews.length > 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20">
                    <img
                      src={src}
                      alt={`Pratinjau ${i + 1}`}
                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom bar: upload button + drag hint */}
            <div className="px-4 pb-3 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer hover:text-teal-700 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah Gambar</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
              <span className="text-xs text-gray-400">
                {uploadedImages.length}/{MAX_IMAGES} gambar &bull; Seret ke area di atas
              </span>
            </div>
          </div>

          {errors.description && (
            <p className="text-red-500 text-xs mt-1">{errors.description}</p>
          )}
        </div>

        {/* Hyperlinks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tautan (opsional)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Tautan akan menjadi tidak bisa diklik sampai laporan diterima admin.
            Pisahkan dengan koma untuk beberapa tautan.
          </p>
          <input
            type="text"
            className="input-field"
            placeholder="https://contoh.com/artikel, https://..."
            value={form.hyperlinks}
            onChange={(e) => setForm({ ...form, hyperlinks: e.target.value })}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full text-base"
        >
          {loading ? "Mengirim Laporan..." : "Kirim Laporan"}
        </button>
      </form>
    </div>
  );
}
