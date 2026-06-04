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
  Compass,
  X,
  ImageOff,
  Loader2,
  AlertCircle,
  Search,
  UploadCloud,
} from "lucide-react";

// ─── Tipe Data ─────────────────────────────────────────────────────────────
type Adventure = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  created_at: string;
};

type FormData = {
  title: string;
  description: string;
  image_url: string;
};

const EMPTY_FORM: FormData = { title: "", description: "", image_url: "" };

// ─── Komponen Utama ─────────────────────────────────────────────────────────
export default function AdventuresPage() {
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // State modal
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  // "idle" | "uploading" | "saving" — untuk label tombol submit
  const [savingStep, setSavingStep] = useState<"idle" | "uploading" | "saving">(
    "idle",
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch semua data adventures dari Supabase ──────────────────────────
  const fetchAdventures = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("adventures")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAdventures(data ?? []);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat data petualangan.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // setTimeout agar tidak dianggap setState sinkron oleh React Compiler
    const t = setTimeout(() => fetchAdventures(), 0);
    return () => clearTimeout(t);
  }, [fetchAdventures]);

  // ── Filter pencarian — derived state via useMemo, tanpa useEffect ──────
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return adventures;
    return adventures.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q),
    );
  }, [searchQuery, adventures]);

  // ── Buka modal Tambah ─────────────────────────────────────────────────
  const openAddModal = () => {
    setFormData(EMPTY_FORM);
    setFormError("");
    setIsEditing(false);
    setEditingId(null);
    setImageFile(null);
    setImagePreview("");
    setModalOpen(true);
  };

  // ── Buka modal Edit ───────────────────────────────────────────────────
  const openEditModal = (item: Adventure) => {
    setFormData({
      title: item.title,
      description: item.description,
      image_url: item.image_url,
    });
    setFormError("");
    setIsEditing(true);
    setEditingId(item.id);
    // Reset file — tampilkan gambar lama sebagai preview awal
    setImageFile(null);
    setImagePreview(item.image_url ?? "");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormData(EMPTY_FORM);
    setFormError("");
    // Bebaskan object URL agar tidak bocor memori
    if (imageFile && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Upload gambar ke Supabase Storage ────────────────────────────────
  const uploadImage = async (file: File): Promise<string> => {
    // Validasi ukuran: maks 2 MB
    if (file.size > 2 * 1024 * 1024) {
      throw new Error("Ukuran file terlalu besar. Maksimal 2MB.");
    }

    // Nama file unik: timestamp + nama asli
    const uniqueName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const storagePath = `adventures/${uniqueName}`;

    const { error: uploadError } = await supabase.storage
      .from("assets")
      .upload(storagePath, file, { upsert: false });

    if (uploadError) throw uploadError;

    // Ambil public URL hasil upload
    const { data } = supabase.storage.from("assets").getPublicUrl(storagePath);
    return data.publicUrl;
  };

  // ── Simpan data (INSERT atau UPDATE) ─────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError("Judul tidak boleh kosong.");
      return;
    }
    setFormError("");

    try {
      let finalImageUrl = formData.image_url;

      // Jika ada file baru dipilih, upload dulu ke Storage
      if (imageFile) {
        setSavingStep("uploading");
        finalImageUrl = await uploadImage(imageFile);
      }

      // Simpan ke tabel adventures
      setSavingStep("saving");

      if (isEditing && editingId) {
        // UPDATE
        const { error } = await supabase
          .from("adventures")
          .update({
            title: formData.title.trim(),
            description: formData.description.trim(),
            image_url: finalImageUrl,
          })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        // INSERT
        const { error } = await supabase.from("adventures").insert({
          title: formData.title.trim(),
          description: formData.description.trim(),
          image_url: finalImageUrl,
        });
        if (error) throw error;
      }

      closeModal();
      await fetchAdventures();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Gagal menyimpan data.",
      );
    } finally {
      setSavingStep("idle");
    }
  };

  // ── Hapus data dengan konfirmasi ──────────────────────────────────────
  const handleDelete = async (item: Adventure) => {
    const confirmed = window.confirm(
      `Hapus petualangan "${item.title}"?\n\nData yang dihapus tidak dapat dikembalikan.`,
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("adventures")
        .delete()
        .eq("id", item.id);
      if (error) throw error;
      await fetchAdventures();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menghapus data.");
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-green-600 shrink-0">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">
                Kelola Petualangan
              </p>
              <p className="text-xs text-gray-400 leading-tight">
                XplorePinang CMS
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-700 hover:bg-green-50 px-3 py-2 rounded-lg transition-colors duration-150"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali ke Dashboard</span>
          </Link>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar: judul, search, tombol tambah */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Daftar Petualangan
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {filtered.length} entri ditemukan
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari petualangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-48 sm:w-56 transition"
              />
            </div>

            {/* Tombol Tambah */}
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors duration-150 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </div>
        </div>

        {/* Error global */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button
              onClick={fetchAdventures}
              className="ml-auto text-red-600 underline text-xs hover:no-underline"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* ── Tabel ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-24 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Memuat data...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <Compass className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">
                {searchQuery
                  ? "Tidak ada hasil pencarian."
                  : "Belum ada data petualangan."}
              </p>
              {!searchQuery && (
                <button
                  onClick={openAddModal}
                  className="mt-4 text-green-600 text-sm font-medium hover:underline"
                >
                  + Tambah petualangan pertama
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
                      Judul
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Deskripsi
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
                      {/* Thumbnail */}
                      <td className="px-5 py-4">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.title}
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

                      {/* Judul */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 line-clamp-1">
                          {item.title}
                        </p>
                        {/* Deskripsi singkat di mobile */}
                        <p className="text-gray-400 text-xs mt-0.5 line-clamp-1 md:hidden">
                          {item.description || "—"}
                        </p>
                      </td>

                      {/* Deskripsi (desktop only) */}
                      <td className="px-5 py-4 hidden md:table-cell max-w-xs">
                        <p className="text-gray-500 line-clamp-2 leading-relaxed">
                          {item.description || "—"}
                        </p>
                      </td>

                      {/* Tombol Aksi */}
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

      {/* ── Modal Tambah / Edit ─────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            // Tutup saat klik backdrop
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-green-100">
                  <Compass className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-base font-bold text-gray-900">
                  {isEditing ? "Edit Petualangan" : "Tambah Petualangan"}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body — Form */}
            <form
              onSubmit={handleSave}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                {/* Error form */}
                {formError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Input: Judul */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Judul <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Contoh: Susur Mangrove Sungai Carang"
                    required
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  />
                </div>

                {/* Input: Deskripsi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Deskripsikan petualangan ini secara singkat dan menarik..."
                    rows={4}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
                  />
                </div>

                {/* Input: Upload Gambar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Gambar
                  </label>

                  {/* Drop-zone / tombol pilih file */}
                  <label
                    htmlFor="file-upload"
                    className={`flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed rounded-xl px-4 py-6 cursor-pointer transition-colors ${
                      savingStep !== "idle"
                        ? "opacity-50 pointer-events-none border-gray-200 bg-gray-50"
                        : "border-green-200 bg-green-50/40 hover:bg-green-50 hover:border-green-400"
                    }`}
                  >
                    <UploadCloud className="w-7 h-7 text-green-500" />
                    <span className="text-sm text-gray-600">
                      {imageFile ? imageFile.name : "Klik untuk pilih gambar"}
                    </span>
                    <span className="text-xs text-gray-400">
                      JPG, PNG, WebP · Maks. 2 MB
                    </span>
                    <input
                      id="file-upload"
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={savingStep !== "idle"}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        if (!file) return;

                        // Validasi ukuran sebelum set state
                        if (file.size > 2 * 1024 * 1024) {
                          setFormError(
                            "Ukuran file terlalu besar. Maksimal 2MB.",
                          );
                          e.target.value = "";
                          return;
                        }

                        setFormError("");
                        // Bebaskan object URL lama jika ada
                        if (imagePreview.startsWith("blob:")) {
                          URL.revokeObjectURL(imagePreview);
                        }
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }}
                    />
                  </label>

                  {/* Preview gambar — lokal (blob) atau URL lama saat edit */}
                  {imagePreview && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-gray-100 h-44 bg-gray-50 relative">
                      <Image
                        src={imagePreview}
                        alt="Preview gambar"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {/* Tombol hapus pilihan file */}
                      {imageFile && (
                        <button
                          type="button"
                          onClick={() => {
                            if (imagePreview.startsWith("blob:"))
                              URL.revokeObjectURL(imagePreview);
                            setImageFile(null);
                            // Kembalikan ke gambar lama (jika edit) atau kosong
                            setImagePreview(
                              isEditing ? formData.image_url : "",
                            );
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          }}
                          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                          aria-label="Hapus pilihan gambar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="shrink-0 px-6 py-4 bg-gray-50 rounded-b-2xl flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingStep !== "idle"}
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
