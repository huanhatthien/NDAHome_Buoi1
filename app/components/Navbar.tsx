"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navItems = [
  { href: "/", label: "Tổng quan" },
  { href: "/thu", label: "Khoản thu" },
  { href: "/chi", label: "Khoản chi" },
  { href: "/bao-cao", label: "Báo cáo" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0c] border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="shrink-0 flex items-center">
            <img
                src="/logo.png"
                alt="NDAHOME"
                className="h-8 w-auto object-contain"
            />
            </Link>

          <nav className="hidden md:flex items-center gap-1 h-14">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative h-full flex items-center px-3 text-sm transition-colors ${
                    active
                      ? "text-neutral-100 font-medium"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-yellow-400" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-xs text-neutral-500">
            Quản lý Thu – Chi nội bộ
          </span>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-1.5 rounded-md border border-neutral-800 text-neutral-300 hover:bg-neutral-900"
            aria-label="Mở menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-neutral-800 bg-[#0a0a0c] px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm ${
                  active
                    ? "bg-neutral-900 text-yellow-400 font-medium"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}