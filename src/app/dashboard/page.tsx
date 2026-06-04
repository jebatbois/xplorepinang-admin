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

// Definisi setiap menu kartu CMS
const menuCards = [
  {
    title: "Kelola Petualangan",
    description:
      "Tambah, edit, dan hapus paket petualangan wisata alam di Tanjungpinang.",
    icon: Compass,
    href: "/adventures",
    color: "bg-emerald-50 text-emerald-600",
    border: "border-emerald-100",
    badge: "Adventures",
  },
  {
    title: "Cerita Pinang (Blog)",
    description:
      "Kelola artikel, cerita perjalanan, dan konten editorial pariwisata.",
    icon: BookOpen,
    href: "/blogs",
    color: "bg-blue-50 text-blue-600",
    border: "border-blue-100",
    badge: "Blog Posts",
  },
  {
    title: "Direktori Kuliner",
    description:
      "Manajemen data restoran, kafe, dan kuliner khas yang wajib dikunjungi.",
    icon: UtensilsCrossed,
    href: "/food-beverages",
    color: "bg-orange-50 text-orange-600",
    border: "border-orange-100",
    badge: "Food & Beverages",
  },
  {
    title: "Agenda Event",
    description:
      "Publikasikan festival, pameran, dan acara wisata yang akan datang.",
    icon: CalendarDays,
    href: "/events",
    color: "bg-purple-50 text-purple-600",
    border: "border-purple-100",
    badge: "Events",
  },
  {
    title: "Rekomendasi Tempat",
    description:
      "Kurasi destinasi wisata unggulan dan tempat-tempat menarik di Tanjungpinang.",
    icon: MapPin,
    href: "/places",
    color: "bg-rose-50 text-rose-600",
    border: "border-rose-100",
    badge: "Places",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  // Gunakan state untuk menghindari hydration mismatch (localStorage hanya ada di client)
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Pengecekan autentikasi di sisi client
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    // Jadikan callback terpisah agar tidak dianggap setState synchronous langsung
    const timer = setTimeout(() => setIsReady(true), 0);
    return () => clearTimeout(timer);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    router.push("/login");
  };

  // Tampilkan loading sementara pengecekan auth berjalan
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
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
          <span className="text-sm">Memuat dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & nama */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-green-600">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">
                XplorePinang
              </p>
            </div>
          </div>

          {/* Tombol Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors duration-150 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Greeting section */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-600 uppercase tracking-wide">
              Dashboard
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Selamat Datang, Admin! 👋
          </h1>
          <p className="text-gray-500 mt-1.5 text-sm sm:text-base">
            Pilih menu di bawah untuk mengelola konten pariwisata XplorePinang.
          </p>
        </div>

        {/* Stats bar singkat */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
          {menuCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.badge}
                className={`flex items-center gap-2 rounded-xl border px-4 py-3 ${card.color} ${card.border}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-xs font-semibold truncate">
                  {card.badge}
                </span>
              </div>
            );
          })}
        </div>

        {/* Grid kartu menu utama */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {menuCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col"
              >
                {/* Card body */}
                <div className="p-6 flex-1">
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${card.color}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-900 mb-1.5">
                    {card.title}
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                {/* Card footer — tombol aksi */}
                <div className="px-6 pb-6">
                  <Link
                    href={card.href}
                    className="flex items-center justify-between w-full bg-gray-50 group-hover:bg-green-600 group-hover:text-white text-gray-600 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors duration-200"
                  >
                    <span>Kelola Data</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-4 border-t border-gray-100">
        <p className="text-xs text-center text-gray-400">
          &copy; {new Date().getFullYear()} XplorePinang Admin CMS. Dibuat untuk
          mengelola konten pariwisata Tanjungpinang.
        </p>
      </footer>
    </div>
  );
}
