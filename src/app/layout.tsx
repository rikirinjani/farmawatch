import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FarmaWatch - Platform Pengawasan Farmasi Indonesia",
  description:
    "Platform pelaporan penyalahgunaan obat OTC dan pelanggaran penjualan obat keras oleh pengecer non-apotek di Indonesia.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-50`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontSize: "14px",
              borderRadius: "8px",
            },
          }}
        />
      </body>
    </html>
  );
}
