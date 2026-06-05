import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatDate, getStatusLabel, getStatusBadgeClass } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import TicketActions from "./TicketActions";
import AiTaggingResult from "./AiTaggingResult";

type SubmitterInfo = { full_name: string; email: string } | null;
type AcceptorInfo = { full_name: string } | null;
type ResolverInfo = { full_name: string } | null;

export default async function TiketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: ticket } = await supabase
    .from("tickets")
    .select(
      `
      *,
      category:ticket_categories(*),
      rejection_reason:rejection_reasons(*),
      submitter:profiles!tickets_submitted_by_fkey(full_name, email),
      acceptor:profiles!tickets_accepted_by_fkey(full_name),
      resolver:profiles!tickets_resolved_by_fkey(full_name)
    `
    )
    .eq("id", params.id)
    .single();

  if (!ticket) notFound();

  // Access control: only submitter or admin can view
  let profile: { role: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const isAdmin = profile?.role === "admin" || profile?.role === "superadmin";
  const isOwner = user?.id === ticket.submitted_by;

  if (!isAdmin && !isOwner && !ticket.is_anonymous) {
    notFound();
  }

  // Determine if hyperlinks should be clickable (only when accepted or beyond)
  const linksClickable =
    ticket.status === "accepted" ||
    ticket.status === "under_review" ||
    ticket.status === "resolved";

  const submitter = ticket.submitter as SubmitterInfo;
  const rejectionReason = ticket.rejection_reason as { id: string; label: string } | null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href={isAdmin ? "/admin/tiket" : "/"}
        className="text-teal-700 hover:underline text-sm flex items-center gap-1 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {isAdmin ? "Kembali ke daftar tiket" : "Kembali"}
      </Link>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500">ID Tiket</p>
            <p className="font-mono text-sm">{ticket.id}</p>
          </div>
          <span className={getStatusBadgeClass(ticket.status)}>
            {getStatusLabel(ticket.status)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Kategori</p>
            <p className="font-medium">{ticket.category?.name || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">Lokasi</p>
            <p className="font-medium">
              {ticket.city}, {ticket.province}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Tanggal Laporan</p>
            <p className="font-medium">{formatDate(ticket.created_at)}</p>
          </div>
          <div>
            <p className="text-gray-500">Jenis Laporan</p>
            <p className="font-medium">
              {ticket.is_anonymous ? "Anonim" : "Terdaftar"}
            </p>
          </div>
          {submitter && (
            <div>
              <p className="text-gray-500">Pelapor</p>
              <p className="font-medium">
                {submitter?.full_name || "-"}
              </p>
            </div>
          )}
          {ticket.accepted_at && (
            <div>
              <p className="text-gray-500">Diterima Pada</p>
              <p className="font-medium">{formatDate(ticket.accepted_at)}</p>
            </div>
          )}
          {ticket.resolved_at && (
            <div>
              <p className="text-gray-500">Diselesaikan Pada</p>
              <p className="font-medium">{formatDate(ticket.resolved_at)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Deskripsi</h2>
        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
          {ticket.description}
        </div>
      </div>

      {/* Images */}
      {ticket.image_urls && ticket.image_urls.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Gambar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ticket.image_urls.map((url: string, i: number) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <img
                  src={url}
                  alt={`Gambar ${i + 1}`}
                  className="w-full h-40 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Hyperlinks */}
      {ticket.hyperlinks && ticket.hyperlinks.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Tautan</h2>
          <ul className="space-y-2">
            {ticket.hyperlinks.map((link: string, i: number) => (
              <li key={i} className="text-sm">
                {linksClickable ? (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 hover:underline flex items-center gap-1"
                  >
                    {link}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-gray-500">{link}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rejection reason */}
      {ticket.status === "rejected" && rejectionReason && (
        <div className="card p-6 mb-6 border-red-200 bg-red-50">
          <h2 className="font-semibold text-red-800 mb-2">
            Alasan Penolakan
          </h2>
          <p className="text-sm text-red-700">
            {rejectionReason?.label || "-"}
          </p>
        </div>
      )}

      {/* AI Tagging Result */}
      {(ticket.status === "accepted" ||
        ticket.status === "under_review" ||
        ticket.status === "resolved") && <AiTaggingResult ticket={ticket} />}

      {/* Admin Actions */}
      {isAdmin && <TicketActions ticket={ticket} />}
    </div>
  );
}
