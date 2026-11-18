import type { Metadata } from "next";
import "./globals.css";
import { TransactionProvider } from "./context/TransactionContext";
import Navbar from "./components/Navbar";
import AIChatBox from "./components/AIChatBox";

export const metadata: Metadata = {
  title: "NDAHOME · Quản lý Thu Chi",
  description: "Hệ thống quản lý tài chính và kiểm soát thu chi nội bộ NDAHOME",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="bg-[#0a0a0c] text-neutral-100 antialiased min-h-screen flex flex-col"
      >
        <TransactionProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {children}
          </main>
          <footer className="border-t border-neutral-800/80 py-5 text-center text-xs text-neutral-500">
            © 2026 NDA Home — Hệ thống quản lý Thu – Chi nội bộ
          </footer>
          <AIChatBox />
        </TransactionProvider>
      </body>
    </html>
  );
}