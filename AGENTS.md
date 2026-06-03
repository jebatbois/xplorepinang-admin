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
Setiap kali kamu diminta membuat kode untuk proyek ini, patuhi aturan berikut:
- **Gunakan Next.js App Router:** Gunakan konvensi `app/page.js`, `app/layout.js`.
- **Client vs Server Components:** Gunakan Server Components secara default. Tambahkan `"use client"` di bagian atas file *HANYA* jika komponen membutuhkan interaktivitas (seperti `useState`, `onClick`, atau form submission).
- **Supabase Integration:** Gunakan `@supabase/supabase-js`. Untuk operasi CRUD sederhana di Client Component, gunakan `createClient` dari helper yang disediakan.
- **Styling:** Gunakan class Tailwind CSS murni. Desain harus minimalis, modern, bersih, dan responsif. Gunakan warna dominan hijau (tema alam/pariwisata).
- **Error Handling:** Selalu berikan blok `try-catch` pada operasi asynchronous ke Supabase dan sediakan feedback UI (loading state, error message, success toast).
- **Form UI:** Saat membuat form Tambah/Edit data, selalu sediakan input untuk semua kolom tabel yang relevan (termasuk input URL untuk `image_url`).

## 5. Tone & Output
- Jangan berikan penjelasan yang bertele-tele. Langsung berikan blok kode yang siap pakai.
- Tuliskan komentar singkat pada bagian kode yang kompleks.