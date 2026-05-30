"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Ticket } from "@/types";
import { Pencil, Check, X } from "lucide-react";

interface Props {
  ticket: Ticket;
}

export default function AiTaggingResult({ ticket }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [summary, setSummary] = useState(ticket.ai_summary || "");
  const [tagsText, setTagsText] = useState(ticket.ai_tags?.join(", ") || "");
  const [saving, setSaving] = useState(false);

  if (!ticket.ai_summary && !ticket.ai_tags) return null;

  async function handleSave() {
    setSaving(true);
    try {
      const tags = tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const { error } = await supabase
        .from("tickets")
        .update({
          ai_summary: summary,
          ai_tags: tags,
        })
        .eq("id", ticket.id);

      if (error) throw error;

      toast.success("Analisis diperbarui.");
      setEditing(false);
      router.refresh();
    } catch (err: any) {
      toast.error("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Edit Analisis Otomatis</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Ringkasan</label>
            <textarea
              className="input-field text-sm"
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Tag (pisahkan dengan koma)
            </label>
            <input
              type="text"
              className="input-field text-sm"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="#Tag1, #Tag2, ..."
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary text-sm flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="btn-secondary text-sm flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Batal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-start justify-between mb-3">
        <h2 className="font-semibold text-gray-900">
          Analisis Otomatis{" "}
          {ticket.tagging_method && (
            <span className="text-xs text-gray-400 font-normal">
              ({ticket.tagging_method === "ai" ? "AI" : "Kata Kunci"})
            </span>
          )}
        </h2>
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-teal-700 hover:text-teal-800 flex items-center gap-1"
        >
              <Pencil className="w-3 h-3" />
              Sunting
        </button>
      </div>
      {ticket.ai_summary && (
        <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{ticket.ai_summary}</p>
      )}
      {ticket.ai_tags && ticket.ai_tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {ticket.ai_tags.map((tag: string, i: number) => (
            <span
              key={i}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
