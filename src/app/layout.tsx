import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Toaster } from "react-hot-toast";

const headingFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
});

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

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
    <html lang="id" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body className="flex min-h-screen flex-col bg-gradient-to-br from-teal-50 via-white to-amber-50 bg-fixed">
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
