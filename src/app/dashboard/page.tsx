"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Leaf,
  Compass,
  BookOpen,
  UtensilsCrossed,
  CalendarDays,
  MapPin,
  LogOut,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";

const menuItems = [
  {
    title: "Kelola Petualangan",
    description:
      "Tambah, edit, dan hapus paket petualangan wisata alam di Tanjungpinang.",
    icon: Compass,
    href: "/adventures",
    tag: "Adventures",
  },
  {
    title: "Cerita Pinang (Blog)",
    description:
      "Kelola artikel, cerita perjalanan, dan konten editorial pariwisata.",
    icon: BookOpen,
    href: "/blogs",
    tag: "Blog Posts",
  },
  {
    title: "Direktori Kuliner",
    description:
      "Manajemen data restoran, kafe, dan kuliner khas yang wajib dikunjungi.",
    icon: UtensilsCrossed,
    href: "/food-beverages",
    tag: "Food & Beverages",
  },
  {
    title: "Agenda Event",
    description:
      "Publikasikan festival, pameran, dan acara wisata yang akan datang.",
    icon: CalendarDays,
    href: "/events",
    tag: "Events",
  },
  {
    title: "Rekomendasi Tempat",
    description:
      "Kurasi destinasi wisata unggulan dan tempat-tempat menarik di Tanjungpinang.",
    icon: MapPin,
    href: "/places",
    tag: "Places",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    const timer = setTimeout(() => setIsReady(true), 0);
    return () => clearTimeout(timer);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    router.push("/login");
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <span className="text-sm">Memuat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── Header ── */}
      <header className="border-b border-gray-200 sticky top-0 z-10 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-green-600">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900">
              XplorePinang
            </span>
            <span className="text-gray-200 select-none">·</span>
            <span className="text-sm text-gray-400">Admin CMS</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-4xl mx-auto px-6 lg:px-8 py-12 w-full flex-1">
        {/* Page title */}
        <div className="mb-10 pb-8 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <LayoutDashboard className="w-4 h-4 text-green-600" />
            <span className="text-xs font-semibold text-green-600 uppercase tracking-widest">
              Manajemen Konten
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Selamat Datang, Admin.
          </h1>
          <p className="text-sm text-gray-400">
            {menuItems.length} modul tersedia — pilih untuk mulai mengelola
            konten.
          </p>
        </div>

        {/* ── Menu — flat list dengan border-b ── */}
        <nav aria-label="Menu utama CMS">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-5 py-5 border-b border-gray-100 hover:border-gray-200 transition-colors"
              >
                {/* Icon */}
                <div className="shrink-0 w-9 h-9 flex items-center justify-center rounded-md bg-gray-100 group-hover:bg-green-600 transition-colors">
                  <Icon className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {item.description}
                  </p>
                </div>

                {/* Tag + arrow */}
                <div className="shrink-0 flex items-center gap-2.5 text-gray-300 group-hover:text-green-600 transition-colors">
                  <span className="text-xs hidden sm:block">{item.tag}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </nav>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 max-w-4xl mx-auto w-full px-6 lg:px-8 py-5">
        <p className="text-xs text-gray-400">
          &copy; {new Date().getFullYear()} XplorePinang Admin CMS
        </p>
      </footer>
    </div>
  );
}
