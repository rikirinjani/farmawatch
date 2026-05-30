"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Ticket, RejectionReason } from "@/types";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import toast from "react-hot-toast";

interface Props {
  ticket: Ticket;
}

function sendNotification(ticketId: string, action: string) {
  fetch("/api/ticket-notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticketId, action }),
  }).catch(() => {});
}

export default function TicketActions({ ticket }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<RejectionReason[]>(
    []
  );
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);

  useEffect(() => {
    const fetchReasons = async () => {
      const { data } = await supabase
        .from("rejection_reasons")
        .select("*")
        .eq("is_active", true);
      if (data) setRejectionReasons(data);
    };
    fetchReasons();
  }, [supabase]);

  async function handleAccept() {
    setLoading("accept");
    try {
      const adminId = (await supabase.auth.getUser()).data.user?.id;

      const { error } = await supabase
        .from("tickets")
        .update({
          status: "accepted",
          accepted_by: adminId,
          accepted_at: new Date().toISOString(),
        })
        .eq("id", ticket.id);

      if (error) throw error;

      // AI tagging as non-blocking (ticket tetap ter-accept walau AI gagal)
      try {
        const aiRes = await fetch("/api/ai-tag-ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId: ticket.id }),
        });
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          await supabase.from("tickets").update({
            ai_summary: aiData.summary,
            ai_tags: aiData.tags,
            tagging_method: aiData.method,
          }).eq("id", ticket.id);
        }
      } catch (aiErr) {
        console.warn("AI tagging non-blocking failed:", aiErr);
      }

      toast.success("Laporan diterima.");
      sendNotification(ticket.id, "accepted");
      router.refresh();
    } catch (err: any) {
      toast.error("Gagal menerima laporan: " + err.message);
    } finally {
      setLoading(null);
    }
  }

  async function handleUnderReview() {
    setLoading("review");
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: "under_review" })
        .eq("id", ticket.id);

      if (error) throw error;
      toast.success("Laporan dalam peninjauan.");
      router.refresh();
    } catch (err: any) {
      toast.error("Gagal memperbarui status: " + err.message);
    } finally {
      setLoading(null);
    }
  }

  async function handleReject() {
    if (!selectedReason) {
      toast.error("Pilih alasan penolakan.");
      return;
    }
    setShowRejectDialog(false);
    setLoading("reject");

    try {
      const { error } = await supabase
        .from("tickets")
        .update({
          status: "rejected",
          rejection_reason_id: selectedReason,
        })
        .eq("id", ticket.id);

      if (error) throw error;

      toast.success("Laporan ditolak.");
      sendNotification(ticket.id, "rejected");
      router.refresh();
    } catch (err: any) {
      toast.error("Gagal menolak laporan: " + err.message);
    } finally {
      setLoading(null);
    }
  }

  async function handleResolve() {
    setShowResolveDialog(false);
    setLoading("resolve");

    try {
      const { error } = await supabase
        .from("tickets")
        .update({
          status: "resolved",
          resolved_by: (await supabase.auth.getUser()).data.user?.id,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", ticket.id);

      if (error) throw error;

      toast.success("Laporan diselesaikan.");
      sendNotification(ticket.id, "resolved");
      router.refresh();
    } catch (err: any) {
      toast.error("Gagal menyelesaikan laporan: " + err.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Tindakan Admin</h2>
        <div className="flex flex-wrap gap-3">
          {ticket.status === "submitted" && (
            <>
              <button
                onClick={handleAccept}
                disabled={loading === "accept"}
                className="btn-primary text-sm"
              >
                {loading === "accept" ? "Memproses..." : "Terima Laporan"}
              </button>
              <button
                onClick={() => setShowRejectDialog(true)}
                disabled={loading === "reject"}
                className="btn-danger text-sm"
              >
                Tolak Laporan
              </button>
            </>
          )}

          {ticket.status === "accepted" && (
            <button
              onClick={handleUnderReview}
              disabled={loading === "review"}
              className="btn-amber text-sm"
            >
              {loading === "review"
                ? "Memproses..."
                : "Tandai Dalam Peninjauan"}
            </button>
          )}

          {ticket.status === "under_review" && (
            <button
              onClick={() => setShowResolveDialog(true)}
              disabled={loading === "resolve"}
              className="btn-primary text-sm"
            >
              {loading === "resolve" ? "Memproses..." : "Selesaikan Laporan"}
            </button>
          )}
        </div>
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowRejectDialog(false)}
          />
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full z-10 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tolak Laporan
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Pilih alasan penolakan laporan ini:
            </p>
            <select
              className="select-field mb-4"
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
            >
              <option value="">Pilih alasan penolakan</option>
              {rejectionReasons.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="btn-secondary text-sm"
              >
                Batal
              </button>
              <button onClick={handleReject} className="btn-danger text-sm">
                Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Confirm */}
      <ConfirmDialog
        open={showResolveDialog}
        title="Selesaikan Laporan"
        message="Apakah Anda yakin ingin menyelesaikan laporan ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Selesaikan"
        onConfirm={handleResolve}
        onCancel={() => setShowResolveDialog(false)}
      />
    </>
  );
}
