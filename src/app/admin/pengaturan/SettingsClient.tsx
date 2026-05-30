"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TicketCategory, RejectionReason } from "@/types";
import { Plus, Pencil, X, Check, Ban } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  initialCategories: TicketCategory[];
  initialRejectionReasons: RejectionReason[];
}

export default function SettingsClient({
  initialCategories,
  initialRejectionReasons,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [categories, setCategories] = useState(initialCategories);
  const [rejectionReasons, setRejectionReasons] = useState(initialRejectionReasons);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [editingReason, setEditingReason] = useState<string | null>(null);
  const [editingReasonLabel, setEditingReasonLabel] = useState("");
  const [newReasonLabel, setNewReasonLabel] = useState("");

  // === Categories ===
  async function addCategory() {
    if (!newCatName.trim()) return;
    const { data, error } = await supabase
      .from("ticket_categories")
      .insert({ name: newCatName.trim() })
      .select()
      .single();

    if (error) {
      toast.error("Gagal menambah kategori: " + error.message);
      return;
    }
    setCategories([...categories, data]);
    setNewCatName("");
    toast.success("Kategori ditambahkan.");
  }

  async function updateCategory(id: string) {
    if (!editingCatName.trim()) return;
    const { error } = await supabase
      .from("ticket_categories")
      .update({ name: editingCatName.trim() })
      .eq("id", id);

    if (error) {
      toast.error("Gagal mengedit: " + error.message);
      return;
    }
    setCategories(
      categories.map((c) =>
        c.id === id ? { ...c, name: editingCatName.trim() } : c
      )
    );
    setEditingCat(null);
    toast.success("Kategori diperbarui.");
  }

  async function toggleCategoryActive(id: string, current: boolean) {
    const { error } = await supabase
      .from("ticket_categories")
      .update({ is_active: !current })
      .eq("id", id);

    if (error) {
      toast.error("Gagal: " + error.message);
      return;
    }
    setCategories(
      categories.map((c) => (c.id === id ? { ...c, is_active: !current } : c))
    );
    toast.success(current ? "Kategori dinonaktifkan." : "Kategori diaktifkan.");
  }

  // === Rejection Reasons ===
  async function addReason() {
    if (!newReasonLabel.trim()) return;
    const { data, error } = await supabase
      .from("rejection_reasons")
      .insert({ label: newReasonLabel.trim() })
      .select()
      .single();

    if (error) {
      toast.error("Gagal menambah alasan: " + error.message);
      return;
    }
    setRejectionReasons([...rejectionReasons, data]);
    setNewReasonLabel("");
    toast.success("Alasan penolakan ditambahkan.");
  }

  async function updateReason(id: string) {
    if (!editingReasonLabel.trim()) return;
    const { error } = await supabase
      .from("rejection_reasons")
      .update({ label: editingReasonLabel.trim() })
      .eq("id", id);

    if (error) {
      toast.error("Gagal mengedit: " + error.message);
      return;
    }
    setRejectionReasons(
      rejectionReasons.map((r) =>
        r.id === id ? { ...r, label: editingReasonLabel.trim() } : r
      )
    );
    setEditingReason(null);
    toast.success("Alasan diperbarui.");
  }

  async function toggleReasonActive(id: string, current: boolean) {
    const { error } = await supabase
      .from("rejection_reasons")
      .update({ is_active: !current })
      .eq("id", id);

    if (error) {
      toast.error("Gagal: " + error.message);
      return;
    }
    setRejectionReasons(
      rejectionReasons.map((r) =>
        r.id === id ? { ...r, is_active: !current } : r
      )
    );
    toast.success(current ? "Alasan dinonaktifkan." : "Alasan diaktifkan.");
  }

  return (
    <div className="space-y-8">
      {/* Categories */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Kategori Laporan
        </h2>
        <div className="space-y-2 mb-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between gap-2 py-2 px-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {editingCat === cat.id ? (
                  <input
                    type="text"
                    className="input-field text-sm"
                    value={editingCatName}
                    onChange={(e) => setEditingCatName(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <span
                    className={`text-sm ${
                      cat.is_active ? "text-gray-900" : "text-gray-400 line-through"
                    }`}
                  >
                    {cat.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {editingCat === cat.id ? (
                  <>
                    <button
                      onClick={() => updateCategory(cat.id)}
                      className="p-1 text-green-600 hover:text-green-800"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingCat(null)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingCat(cat.id);
                        setEditingCatName(cat.name);
                      }}
                      className="p-1 text-gray-400 hover:text-teal-600"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleCategoryActive(cat.id, cat.is_active)}
                      className={`p-1 ${
                        cat.is_active
                          ? "text-red-400 hover:text-red-600"
                          : "text-green-400 hover:text-green-600"
                      }`}
                    >
                      {cat.is_active ? (
                        <Ban className="w-3.5 h-3.5" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add new category */}
        <div className="flex gap-2">
          <input
            type="text"
            className="input-field text-sm flex-1"
            placeholder="Nama kategori baru"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <button
            onClick={addCategory}
            className="btn-primary text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Tambah
          </button>
        </div>
      </section>

      {/* Rejection Reasons */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Alasan Penolakan Laporan
        </h2>
        <div className="space-y-2 mb-4">
          {rejectionReasons.map((reason) => (
            <div
              key={reason.id}
              className="flex items-center justify-between gap-2 py-2 px-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {editingReason === reason.id ? (
                  <input
                    type="text"
                    className="input-field text-sm"
                    value={editingReasonLabel}
                    onChange={(e) => setEditingReasonLabel(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <span
                    className={`text-sm ${
                      reason.is_active
                        ? "text-gray-900"
                        : "text-gray-400 line-through"
                    }`}
                  >
                    {reason.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {editingReason === reason.id ? (
                  <>
                    <button
                      onClick={() => updateReason(reason.id)}
                      className="p-1 text-green-600 hover:text-green-800"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingReason(null)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingReason(reason.id);
                        setEditingReasonLabel(reason.label);
                      }}
                      className="p-1 text-gray-400 hover:text-teal-600"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        toggleReasonActive(reason.id, reason.is_active)
                      }
                      className={`p-1 ${
                        reason.is_active
                          ? "text-red-400 hover:text-red-600"
                          : "text-green-400 hover:text-green-600"
                      }`}
                    >
                      {reason.is_active ? (
                        <Ban className="w-3.5 h-3.5" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add new reason */}
        <div className="flex gap-2">
          <input
            type="text"
            className="input-field text-sm flex-1"
            placeholder="Alasan penolakan baru"
            value={newReasonLabel}
            onChange={(e) => setNewReasonLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addReason()}
          />
          <button
            onClick={addReason}
            className="btn-primary text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Tambah
          </button>
        </div>
      </section>
    </div>
  );
}
