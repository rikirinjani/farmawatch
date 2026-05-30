import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} FarmaWatch. Platform Pengawasan Farmasi Indonesia.
            </p>
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/laporkan" className="hover:text-white transition-colors">
              Laporkan
            </Link>
            <Link href="/masuk" className="hover:text-white transition-colors">
              Masuk
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
