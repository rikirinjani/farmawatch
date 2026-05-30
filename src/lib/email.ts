import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

type EmailRecipient = {
  email: string;
  full_name: string;
};

/**
 * Mengirim email notifikasi saat tiket diterima admin.
 */
export async function sendTicketAcceptedEmail(
  recipient: EmailRecipient,
  ticketId: string
) {
  if (!resend) {
    console.warn("Resend not configured, skipping email");
    return;
  }

  try {
    const ticketUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/tiket/${ticketId}`;

    await resend.emails.send({
      from: "FarmaWatch <noreply@farmawatch.id>",
      to: recipient.email,
      subject: "Laporan Anda Telah Diterima - FarmaWatch",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0f766e;">FarmaWatch</h1>
          <p>Halo ${recipient.full_name},</p>
          <p>Laporan Anda dengan ID <strong>${ticketId}</strong> telah <strong>diterima</strong> oleh tim kami.</p>
          <p>Tim kami sedang meninjau laporan Anda. Anda akan menerima pembaruan lebih lanjut.</p>
          <p style="margin-top: 16px;">
            <a href="${ticketUrl}" style="display: inline-block; background-color: #0f766e; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px;">
              Lihat Detail Laporan
            </a>
          </p>
          <p>Terima kasih telah berkontribusi dalam pengawasan farmasi di Indonesia.</p>
          <hr style="border: 1px solid #e5e7eb;" />
          <p style="color: #6b7280; font-size: 12px;">Email ini dikirim otomatis oleh FarmaWatch. Mohon tidak membalas email ini.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send accepted email:", error);
  }
}

/**
 * Mengirim email notifikasi saat tiket ditolak.
 */
export async function sendTicketRejectedEmail(
  recipient: EmailRecipient,
  ticketId: string,
  reason: string
) {
  if (!resend) {
    console.warn("Resend not configured, skipping email");
    return;
  }

  try {
    const ticketUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/tiket/${ticketId}`;

    await resend.emails.send({
      from: "FarmaWatch <noreply@farmawatch.id>",
      to: recipient.email,
      subject: "Laporan Anda Ditolak - FarmaWatch",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0f766e;">FarmaWatch</h1>
          <p>Halo ${recipient.full_name},</p>
          <p>Laporan Anda dengan ID <strong>${ticketId}</strong> telah <strong>ditolak</strong>.</p>
          <p><strong>Alasan penolakan:</strong> ${reason}</p>
          <p style="margin-top: 16px;">
            <a href="${ticketUrl}" style="display: inline-block; background-color: #0f766e; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px;">
              Lihat Detail Laporan
            </a>
          </p>
          <p>Jika Anda memiliki pertanyaan, silakan kirim laporan baru dengan informasi yang lebih lengkap.</p>
          <hr style="border: 1px solid #e5e7eb;" />
          <p style="color: #6b7280; font-size: 12px;">Email ini dikirim otomatis oleh FarmaWatch. Mohon tidak membalas email ini.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send rejected email:", error);
  }
}

/**
 * Mengirim email notifikasi saat tiket diselesaikan.
 */
export async function sendTicketResolvedEmail(
  recipient: EmailRecipient,
  ticketId: string
) {
  if (!resend) {
    console.warn("Resend not configured, skipping email");
    return;
  }

  try {
    const ticketUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/tiket/${ticketId}`;

    await resend.emails.send({
      from: "FarmaWatch <noreply@farmawatch.id>",
      to: recipient.email,
      subject: "Laporan Anda Telah Diselesaikan - FarmaWatch",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0f766e;">FarmaWatch</h1>
          <p>Halo ${recipient.full_name},</p>
          <p>Laporan Anda dengan ID <strong>${ticketId}</strong> telah <strong>diselesaikan</strong> oleh tim kami.</p>
          <p style="margin-top: 16px;">
            <a href="${ticketUrl}" style="display: inline-block; background-color: #0f766e; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px;">
              Lihat Detail Laporan
            </a>
          </p>
          <p>Terima kasih atas kontribusi Anda dalam menjaga keamanan farmasi di Indonesia.</p>
          <hr style="border: 1px solid #e5e7eb;" />
          <p style="color: #6b7280; font-size: 12px;">Email ini dikirim otomatis oleh FarmaWatch. Mohon tidak membalas email ini.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send resolved email:", error);
  }
}

/**
 * Mengirim email notifikasi saat akun disetujui.
 */
export async function sendAccountApprovedEmail(recipient: EmailRecipient) {
  if (!resend) {
    console.warn("Resend not configured, skipping email");
    return;
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    await resend.emails.send({
      from: "FarmaWatch <noreply@farmawatch.id>",
      to: recipient.email,
      subject: "Akun Anda Telah Disetujui - FarmaWatch",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0f766e;">FarmaWatch</h1>
          <p>Halo ${recipient.full_name},</p>
          <p>Pendaftaran akun Anda di <strong>FarmaWatch</strong> telah <strong>disetujui</strong>.</p>
          <p>Anda sekarang dapat masuk dan mulai melaporkan pelanggaran atau penyalahgunaan obat di lingkungan Anda.</p>
          <p>Silakan <a href="${siteUrl}/masuk" style="color: #0f766e;">masuk ke akun Anda</a>.</p>
          <hr style="border: 1px solid #e5e7eb;" />
          <p style="color: #6b7280; font-size: 12px;">Email ini dikirim otomatis oleh FarmaWatch. Mohon tidak membalas email ini.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send account approved email:", error);
  }
}
