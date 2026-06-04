"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  UtensilsCrossed,
  X,
  ImageOff,
  Loader2,
  AlertCircle,
  Search,
  UploadCloud,
  Star,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
type FoodBeverage = {
  id: string;
  name: string;
  category: string;
  description: string;
  rating: number;
  opening_hours: string;
  image_url: string;
};

type FormData = {
  name: string;
  category: string;
  description: string;
  rating: number;
  opening_hours: string;
  image_url: string;
};

const CATEGORIES = ["Restoran", "Kafe", "Warung", "Street Food", "Dessert"];

const EMPTY_FORM: FormData = {
  name: "",
  category: CATEGORIES[0],
  description: "",
  rating: 4.0,
  opening_hours: "",
  image_url: "",
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function FoodBeveragesPage() {
  const [items, setItems] = useState<FoodBeverage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [savingStep, setSavingStep] = useState<"idle" | "uploading" | "saving">(
    "idle",
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State lokal untuk time picker jam buka & tutup
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");

  const isBusy = savingStep !== "idle";

  // Parse "08.00 – 22.00 WIB" → { open: "08:00", close: "22:00" }
  const parseOpeningHours = (str: string) => {
    const match = str.match(/(\d{2})[.:](\d{2}).*?(\d{2})[.:](\d{2})/);
    if (!match) return { open: "", close: "" };
    return {
      open: `${match[1]}:${match[2]}`,
      close: `${match[3]}:${match[4]}`,
    };
  };

  // Format dua time input → string jam operasional
  const buildOpeningHours = (open: string, close: string) => {
    const fmt = (t: string) => t.replace(":", ".");
    if (open && close) return `${fmt(open)} \u2013 ${fmt(close)} WIB`;
    if (open) return `${fmt(open)} WIB`;
    return "";
  };

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("food_beverages")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      setItems(data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchItems(), 0);
    return () => clearTimeout(t);
  }, [fetchItems]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q),
    );
  }, [searchQuery, items]);

  // ── Modal helpers ────────────────────────────────────────────────────────
  const openAddModal = () => {
    setFormData(EMPTY_FORM);
    setFormError("");
    setIsEditing(false);
    setEditingId(null);
    setImageFile(null);
    setImagePreview("");
    setOpenTime("");
    setCloseTime("");
    setModalOpen(true);
  };

  const openEditModal = (item: FoodBeverage) => {
    setFormData({
      name: item.name,
      category: item.category,
      description: item.description,
      rating: item.rating,
      opening_hours: item.opening_hours,
      image_url: item.image_url,
    });
    setFormError("");
    setIsEditing(true);
    setEditingId(item.id);
    setImageFile(null);
    setImagePreview(item.image_url ?? "");
    // Parse jam operasional yang sudah ada ke dua time input
    const parsed = parseOpeningHours(item.opening_hours ?? "");
    setOpenTime(parsed.open);
    setCloseTime(parsed.close);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormData(EMPTY_FORM);
    setFormError("");
    if (imageFile && imagePreview.startsWith("blob:"))
      URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setOpenTime("");
    setCloseTime("");
  };

  // ── Upload ────────────────────────────────────────────────────────────────
  const uploadImage = async (file: File): Promise<string> => {
    if (file.size > 2 * 1024 * 1024)
      throw new Error("Ukuran file terlalu besar. Maksimal 2MB.");
    const path = `foods/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { error } = await supabase.storage
      .from("assets")
      .upload(path, file, { upsert: false });
    if (error) throw error;
    return supabase.storage.from("assets").getPublicUrl(path).data.publicUrl;
  };

  // ── Save ────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Nama tidak boleh kosong.");
      return;
    }
    setFormError("");
    try {
      let finalImageUrl = formData.image_url;
      if (imageFile) {
        setSavingStep("uploading");
        finalImageUrl = await uploadImage(imageFile);
      }
      setSavingStep("saving");
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        rating: Number(formData.rating),
        opening_hours: formData.opening_hours.trim(),
        image_url: finalImageUrl,
      };
      if (isEditing && editingId) {
        const { error } = await supabase
          .from("food_beverages")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("food_beverages").insert(payload);
        if (error) throw error;
      }
      closeModal();
      await fetchItems();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Gagal menyimpan data.",
      );
    } finally {
      setSavingStep("idle");
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (item: FoodBeverage) => {
    if (
      !window.confirm(
        `Hapus "${item.name}"?\n\nData yang dihapus tidak dapat dikembalikan.`,
      )
    )
      return;
    try {
      const { error } = await supabase
        .from("food_beverages")
        .delete()
        .eq("id", item.id);
      if (error) throw error;
      await fetchItems();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menghapus data.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setFormError("Ukuran file terlalu besar. Maksimal 2MB.");
      e.target.value = "";
      return;
    }
    setFormError("");
    if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-orange-500 shrink-0">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">
                Direktori Kuliner
              </p>
              <p className="text-xs text-gray-400 leading-tight">
                XplorePinang CMS
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-700 hover:bg-green-50 px-3 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali ke Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Daftar Kuliner</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {filtered.length} entri ditemukan
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari kuliner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-48 sm:w-56 transition"
              />
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button
              onClick={fetchItems}
              className="ml-auto text-red-600 underline text-xs"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Tabel */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-24 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Memuat data...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <UtensilsCrossed className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">
                {searchQuery ? "Tidak ada hasil." : "Belum ada data kuliner."}
              </p>
              {!searchQuery && (
                <button
                  onClick={openAddModal}
                  className="mt-4 text-green-600 text-sm font-medium hover:underline"
                >
                  + Tambah kuliner pertama
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left">
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                      Gambar
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Nama
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Kategori
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Rating
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Jam Buka
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/70 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <ImageOff className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5 md:hidden">
                          {item.category}
                        </p>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="flex items-center gap-1 text-amber-500 font-semibold text-sm">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {item.rating?.toFixed(1) ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell text-gray-500 text-sm">
                        {item.opening_hours || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-xl w-full max-w-lg flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-orange-100">
                  <UtensilsCrossed className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-base font-bold text-gray-900">
                  {isEditing ? "Edit Kuliner" : "Tambah Kuliner"}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSave}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                {formError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Nama */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nama <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Contoh: Warung Mak Cik Bintan"
                    required
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  />
                </div>

                {/* Kategori + Rating */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Kategori
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Rating (0–5)
                    </label>
                    <input
                      type="number"
                      value={formData.rating}
                      step="0.1"
                      min="0"
                      max="5"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rating: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Ceritakan tentang kuliner ini..."
                    rows={3}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
                  />
                </div>

                {/* Jam Operasional — dua time picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Jam Operasional
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1.5">Buka</p>
                      <input
                        type="time"
                        value={openTime}
                        onChange={(e) => {
                          setOpenTime(e.target.value);
                          setFormData({
                            ...formData,
                            opening_hours: buildOpeningHours(
                              e.target.value,
                              closeTime,
                            ),
                          });
                        }}
                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1.5">Tutup</p>
                      <input
                        type="time"
                        value={closeTime}
                        onChange={(e) => {
                          setCloseTime(e.target.value);
                          setFormData({
                            ...formData,
                            opening_hours: buildOpeningHours(
                              openTime,
                              e.target.value,
                            ),
                          });
                        }}
                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>
                  {/* Preview hasil format yang akan disimpan */}
                  {formData.opening_hours && (
                    <p className="text-xs text-gray-400 mt-2">
                      Tersimpan sebagai:{" "}
                      <span className="font-medium text-gray-600">
                        {formData.opening_hours}
                      </span>
                    </p>
                  )}
                </div>

                {/* Upload Gambar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Gambar
                  </label>
                  <label
                    htmlFor="file-food"
                    className={`flex flex-col items-center gap-2 w-full border-2 border-dashed rounded-xl px-4 py-5 cursor-pointer transition-colors ${isBusy ? "opacity-50 pointer-events-none border-gray-200 bg-gray-50" : "border-green-200 bg-green-50/40 hover:bg-green-50 hover:border-green-400"}`}
                  >
                    <UploadCloud className="w-7 h-7 text-green-500" />
                    <span className="text-sm text-gray-600">
                      {imageFile ? imageFile.name : "Klik untuk pilih gambar"}
                    </span>
                    <span className="text-xs text-gray-400">
                      JPG, PNG, WebP · Maks. 2 MB
                    </span>
                    <input
                      id="file-food"
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={isBusy}
                      onChange={handleFileChange}
                    />
                  </label>
                  {imagePreview && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-gray-100 h-40 bg-gray-50 relative">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {imageFile && (
                        <button
                          type="button"
                          onClick={() => {
                            if (imagePreview.startsWith("blob:"))
                              URL.revokeObjectURL(imagePreview);
                            setImageFile(null);
                            setImagePreview(
                              isEditing ? formData.image_url : "",
                            );
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          }}
                          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                          aria-label="Hapus pilihan"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="shrink-0 px-6 py-4 bg-gray-50 rounded-b-xl flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  {savingStep === "uploading" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengunggah...
                    </>
                  ) : savingStep === "saving" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : isEditing ? (
                    <>
                      <Pencil className="w-4 h-4" />
                      Simpan Perubahan
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Tambah Data
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
