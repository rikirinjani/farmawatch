"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import toast from "react-hot-toast";

interface Props {
  userId: string;
  currentStatus: string;
  currentRole: string;
  isSuperAdmin: boolean;
  userName: string;
}

export default function UserManagementClient({
  userId,
  currentStatus,
  currentRole,
  isSuperAdmin,
  userName,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showPromote, setShowPromote] = useState(false);

  async function handleApprove() {
    setShowApprove(false);
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "approved" })
        .eq("id", userId);

      if (error) throw error;

      toast.success(`Akun ${userName} telah disetujui.`);
      router.refresh();
    } catch (err: any) {
      toast.error("Gagal menyetujui: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    setShowReject(false);
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "rejected" })
        .eq("id", userId);

      if (error) throw error;

      toast.success(`Akun ${userName} telah ditolak.`);
      router.refresh();
    } catch (err: any) {
      toast.error("Gagal menolak: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePromote() {
    setShowPromote(false);
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", userId);

      if (error) throw error;

      toast.success(`${userName} telah dipromosikan menjadi Admin.`);
      router.refresh();
    } catch (err: any) {
      toast.error("Gagal mempromosikan: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        {currentStatus === "pending" && (
          <>
            <button
              onClick={() => setShowApprove(true)}
              className="text-green-600 hover:text-green-800 text-xs font-medium"
            >
              Setujui
            </button>
            <button
              onClick={() => setShowReject(true)}
              className="text-red-600 hover:text-red-800 text-xs font-medium"
            >
              Tolak
            </button>
          </>
        )}
        {currentStatus === "approved" &&
          currentRole === "user" &&
          isSuperAdmin && (
            <button
              onClick={() => setShowPromote(true)}
              className="text-teal-600 hover:text-teal-800 text-xs font-medium"
            >
              Jadikan Admin
            </button>
          )}
      </div>

      <ConfirmDialog
        open={showApprove}
        title="Setujui Pengguna"
        message={`Apakah Anda yakin ingin menyetujui akun ${userName}?`}
        confirmLabel="Setujui"
        onConfirm={handleApprove}
        onCancel={() => setShowApprove(false)}
      />
      <ConfirmDialog
        open={showReject}
        title="Tolak Pengguna"
        message={`Apakah Anda yakin ingin menolak akun ${userName}?`}
        confirmLabel="Tolak"
        variant="danger"
        onConfirm={handleReject}
        onCancel={() => setShowReject(false)}
      />
      <ConfirmDialog
        open={showPromote}
        title="Promosikan ke Admin"
        message={`Apakah Anda yakin ingin mempromosikan ${userName} menjadi Admin?`}
        confirmLabel="Promosikan"
        onConfirm={handlePromote}
        onCancel={() => setShowPromote(false)}
      />
    </>
  );
}
