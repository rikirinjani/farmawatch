import Link from "next/link";
import { Shield, FileText, BarChart3, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-800 to-teal-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Laporkan Penyalahgunaan Obat di Lingkungan Anda
            </h1>
            <p className="text-lg md:text-xl text-teal-200 mb-8">
              FarmaWatch adalah platform pengawasan farmasi berbasis partisipasi
              publik. Bersama kita awasi peredaran obat keras ilegal dan
              penyalahgunaan obat OTC di Indonesia.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/laporkan"
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors"
              >
                Laporkan Sekarang
              </Link>
              <Link
                href="/daftar"
                className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-8 rounded-lg border border-white/30 text-lg transition-colors"
              >
                Daftar Akun
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats / Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-teal-100 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-teal-700" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Laporkan Mudah</h3>
              <p className="text-gray-600 text-sm">
                Kirim laporan dengan atau tanpa akun. Proses cepat dan mudah
                melalui ponsel.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-amber-100 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-amber-700" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Privasi Terjaga</h3>
              <p className="text-gray-600 text-sm">
                Identitas pelapor dilindungi. Opsi laporan anonim tersedia.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-teal-100 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-7 h-7 text-teal-700" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Analisis Cerdas</h3>
              <p className="text-gray-600 text-sm">
                Laporan dianalisis dan ditandai secara otomatis dengan AI untuk
                identifikasi pola.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-amber-100 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-amber-700" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Partisipasi Publik</h3>
              <p className="text-gray-600 text-sm">
                Warga, tenaga kesehatan, dan komunitas bersama mengawasi
                keamanan farmasi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Cara Kerja
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-6 text-center">
              <div className="bg-teal-700 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Laporkan</h3>
              <p className="text-gray-600 text-sm">
                Isi formulir laporan dengan deskripsi kejadian, lokasi, dan
                lampirkan bukti foto.
              </p>
            </div>
            <div className="card p-6 text-center">
              <div className="bg-teal-700 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Tinjau</h3>
              <p className="text-gray-600 text-sm">
                Tim kami meninjau laporan, memverifikasi, dan melakukan analisis
                otomatis berbasis AI.
              </p>
            </div>
            <div className="card p-6 text-center">
              <div className="bg-teal-700 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Tindak Lanjut</h3>
              <p className="text-gray-600 text-sm">
                Laporan yang valid ditindaklanjuti dan digunakan untuk pemetaan
                pola pelanggaran di seluruh Indonesia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-teal-800 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Mulai Berkontribusi Hari Ini
          </h2>
          <p className="text-teal-200 mb-8">
            Setiap laporan Anda membantu menciptakan lingkungan yang lebih aman
            dari penyalahgunaan obat.
          </p>
          <Link
            href="/laporkan"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors"
          >
            Kirim Laporan
          </Link>
        </div>
      </section>
    </div>
  );
}
