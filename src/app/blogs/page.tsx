"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import Image from "next/image";
import {
  Plus, Pencil, Trash2, ArrowLeft, BookOpen,
  X, ImageOff, Loader2, AlertCircle, Search, UploadCloud,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
type BlogPost = {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  image_url: string;
  is_hero: boolean;
  published_at: string;
};

type FormData = {
  title: string;
  description: string;
  content: string;
  category: string;
  is_hero: boolean;
  image_url: string;
};

const CATEGORIES = ["Wisata", "Kuliner", "Budaya", "Event", "Tips & Trik"];

const EMPTY_FORM: FormData = {
  title: "", description: "", content: "",
  category: CATEGORIES[0], is_hero: false, image_url: "",
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function BlogsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [savingStep, setSavingStep] = useState<"idle" | "uploading" | "saving">("idle");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBusy = savingStep !== "idle";

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw error;
      setPosts(data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchPosts(), 0);
    return () => clearTimeout(t);
  }, [fetchPosts]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [searchQuery, posts]);

  // ── Modal helpers ────────────────────────────────────────────────────────
  const openAddModal = () => {
    setFormData(EMPTY_FORM); setFormError(""); setIsEditing(false);
    setEditingId(null); setImageFile(null); setImagePreview(""); setModalOpen(true);
  };

  const openEditModal = (item: BlogPost) => {
    setFormData({ title: item.title, description: item.description, content: item.content, category: item.category, is_hero: item.is_hero, image_url: item.image_url });
    setFormError(""); setIsEditing(true); setEditingId(item.id);
    setImageFile(null); setImagePreview(item.image_url ?? ""); setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false); setFormData(EMPTY_FORM); setFormError("");
    if (imageFile && imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(null); setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Upload ke Storage ────────────────────────────────────────────────────
  const uploadImage = async (file: File): Promise<string> => {
    if (file.size > 2 * 1024 * 1024) throw new Error("Ukuran file terlalu besar. Maksimal 2MB.");
    const path = `blogs/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { error } = await supabase.storage.from("assets").upload(path, file, { upsert: false });
    if (error) throw error;
    return supabase.storage.from("assets").getPublicUrl(path).data.publicUrl;
  };

  // ── Save (INSERT / UPDATE) ───────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { setFormError("Judul tidak boleh kosong."); return; }
    setFormError("");
    try {
      let finalImageUrl = formData.image_url;
      if (imageFile) { setSavingStep("uploading"); finalImageUrl = await uploadImage(imageFile); }
      setSavingStep("saving");
      const payload = {
        title: formData.title.trim(), description: formData.description.trim(),
        content: formData.content.trim(), category: formData.category,
        is_hero: formData.is_hero, image_url: finalImageUrl,
      };
      if (isEditing && editingId) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert({ ...payload, published_at: new Date().toISOString().split("T")[0] });
        if (error) throw error;
      }
      closeModal(); await fetchPosts();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan data.");
    } finally { setSavingStep("idle"); }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (item: BlogPost) => {
    if (!window.confirm(`Hapus artikel "${item.title}"?\n\nData yang dihapus tidak dapat dikembalikan.`)) return;
    try {
      const { error } = await supabase.from("blog_posts").delete().eq("id", item.id);
      if (error) throw error;
      await fetchPosts();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Gagal menghapus data."); }
  };

  // ── File input handler ───────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setFormError("Ukuran file terlalu besar. Maksimal 2MB."); e.target.value = ""; return; }
    setFormError("");
    if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(file); setImagePreview(URL.createObjectURL(file));
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">Cerita Pinang (Blog)</p>
              <p className="text-xs text-gray-400 leading-tight">XplorePinang CMS</p>
            </div>
          </div>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-700 hover:bg-green-50 px-3 py-2 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Kembali ke Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Daftar Artikel Blog</h1>
            <p className="text-sm text-gray-400 mt-0.5">{filtered.length} entri ditemukan</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input type="text" placeholder="Cari artikel..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-48 sm:w-56 transition" />
            </div>
            <button onClick={openAddModal} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer shrink-0">
              <Plus className="w-4 h-4" /><span>Tambah</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
            <button onClick={fetchPosts} className="ml-auto text-red-600 underline text-xs">Coba Lagi</button>
          </div>
        )}

        {/* Tabel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-24 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Memuat data...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <BookOpen className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">{searchQuery ? "Tidak ada hasil." : "Belum ada artikel."}</p>
              {!searchQuery && <button onClick={openAddModal} className="mt-4 text-green-600 text-sm font-medium hover:underline">+ Tambah artikel pertama</button>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left">
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Gambar</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Judul</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Kategori</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Hero</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                          {item.image_url ? <Image src={item.image_url} alt={item.title} width={56} height={56} className="w-full h-full object-cover" unoptimized /> : <ImageOff className="w-5 h-5 text-gray-300" />}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 line-clamp-1">{item.title}</p>
                        <p className="text-gray-400 text-xs mt-0.5 md:hidden">{item.category}</p>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{item.category}</span>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        {item.is_hero
                          ? <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">Hero</span>
                          : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditModal(item)} className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                            <Pencil className="w-3.5 h-3.5" /><span className="hidden sm:inline">Edit</span>
                          </button>
                          <button onClick={() => handleDelete(item)} className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Hapus</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-100">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-base font-bold text-gray-900">{isEditing ? "Edit Artikel" : "Tambah Artikel"}</h2>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                {formError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                    <AlertCircle className="w-4 h-4 shrink-0" /><span>{formError}</span>
                  </div>
                )}

                {/* Judul */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Judul <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Contoh: Menjelajahi Pantai Trikora" required
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi Singkat</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ringkasan artikel dalam 1-2 kalimat..." rows={2}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none" />
                </div>

                {/* Konten */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Konten Artikel</label>
                  <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Tulis isi artikel lengkap di sini..." rows={5}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none" />
                </div>

                {/* Kategori + Toggle Hero */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori</label>
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col justify-end pb-0.5">
                    <p className="text-sm font-medium text-gray-700 mb-2">Artikel Hero</p>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" checked={formData.is_hero} onChange={(e) => setFormData({ ...formData, is_hero: e.target.checked })} className="sr-only peer" />
                        <div className="w-10 h-6 bg-gray-200 peer-checked:bg-green-600 rounded-full transition-colors" />
                        <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                      </div>
                      <span className="text-sm text-gray-500">{formData.is_hero ? "Aktif" : "Nonaktif"}</span>
                    </label>
                  </div>
                </div>

                {/* Upload Gambar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Gambar</label>
                  <label htmlFor="file-blog"
                    className={`flex flex-col items-center gap-2 w-full border-2 border-dashed rounded-xl px-4 py-5 cursor-pointer transition-colors ${isBusy ? "opacity-50 pointer-events-none border-gray-200 bg-gray-50" : "border-green-200 bg-green-50/40 hover:bg-green-50 hover:border-green-400"}`}>
                    <UploadCloud className="w-7 h-7 text-green-500" />
                    <span className="text-sm text-gray-600">{imageFile ? imageFile.name : "Klik untuk pilih gambar"}</span>
                    <span className="text-xs text-gray-400">JPG, PNG, WebP · Maks. 2 MB</span>
                    <input id="file-blog" ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={isBusy} onChange={handleFileChange} />
                  </label>
                  {imagePreview && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-gray-100 h-40 bg-gray-50 relative">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized />
                      {imageFile && (
                        <button type="button" onClick={() => { if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview); setImageFile(null); setImagePreview(isEditing ? formData.image_url : ""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors" aria-label="Hapus pilihan">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="shrink-0 px-6 py-4 bg-gray-50 rounded-b-2xl flex items-center justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer">Batal</button>
                <button type="submit" disabled={isBusy} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors cursor-pointer">
                  {savingStep === "uploading" ? <><Loader2 className="w-4 h-4 animate-spin" />Mengunggah...</>
                    : savingStep === "saving" ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</>
                    : isEditing ? <><Pencil className="w-4 h-4" />Simpan Perubahan</>
                    : <><Plus className="w-4 h-4" />Tambah Data</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
