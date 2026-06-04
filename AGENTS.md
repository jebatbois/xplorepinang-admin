# XplorePinang Admin CMS - AI Agent Context

## 1. Project Overview
Proyek ini adalah Dashboard Admin (CMS) berbasis web untuk aplikasi pariwisata "XplorePinang".
Sistem ini digunakan oleh administrator untuk melakukan operasi CRUD (Create, Read, Update, Delete) pada konten pariwisata yang akan ditampilkan di aplikasi mobile (Flutter).

## 2. Tech Stack
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase (PostgreSQL)
- **Icons:** Lucide React / Heroicons
- **Language:** JavaScript/TypeScript modern

## 3. Database Schema (Supabase)
Berikut adalah struktur tabel yang digunakan. Semua operasi fetch/insert harus merujuk ke skema ini:

1. **adventures**: id (uuid), title (text), description (text), image_url (text), created_at (timestamp).
2. **blog_posts**: id (uuid), title (text), description (text), content (text), category (text), image_url (text), is_hero (boolean), published_at (date).
3. **food_beverages**: id (uuid), name (text), category (text), description (text), rating (float), opening_hours (text), image_url (text), latitude (float), longitude (float).
4. **events**: id (uuid), title (text), event_date (text), image_url (text), location (text).
5. **places**: id (uuid), name (text), location_name (text), image_url (text).

## 4. Coding Guidelines & Rules untuk AI
Setiap kali kamu diminta membuat kode untuk proyek ini, patuhi aturan ketat berikut:
- **Gunakan Next.js App Router:** Gunakan konvensi `app/page.js`, `app/layout.js`.
- **Client vs Server Components:** Gunakan Server Components secara default. Tambahkan `"use client"` HANYA jika komponen membutuhkan interaktivitas (`useState`, form).
- **Supabase Integration:** Gunakan `@supabase/supabase-js`.
- **STRICT UI/UX RULES (ANTI-AI SLOP):**
  - **DILARANG KERAS** menggunakan emoji sistem bawaan (seperti 🚀, ✨, 📦). Jika butuh ikonografi, WAJIB menggunakan library `lucide-react` (SVG murni) atau custom SVG.
  - Hindari layout "Generic AI" yang menggunakan terlalu banyak Card (kotak bersarang), box-shadow yang berlebihan, atau border-radius yang terlalu bulat.
  - Gunakan pendekatan desain yang flat, tipografi yang kuat, garis pemisah (border-b / divider tipis), dan whitespace (padding/margin) yang luas untuk memisahkan konten.
  - Desain harus terlihat seperti dashboard editorial atau sistem korporat modern: bersih, elegan, dan fungsional.
- **Form UI:** Saat membuat form, gunakan style minimalis (misal: input field dengan outline tipis tanpa shadow).

## 5. Tone & Output
- Jangan berikan penjelasan yang bertele-tele. Langsung berikan blok kode yang siap pakai.
- Tuliskan komentar singkat pada bagian kode yang kompleks.