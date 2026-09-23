Product Requirements Document (PRD) & Implementation Plan: ToDos App

1. Overview Proyek
   Nama Aplikasi: ToDos App
   Fokus Utama: Aplikasi web interaktif modular yang menggabungkan tiga fitur utama (Pencatatan Keuangan, Manajemen Tautan, dan Kuis Interaktif) dengan navigasi berbasis tab, penyimpanan lokal (localStorage), serta desain antarmuka modern yang terinspirasi dari gaya clean SaaS landing page (latar belakang bersih, aksen warna profesional, elemen card dengan soft shadow, serta tipografi Google Fonts Poppins) [cite: 1].
   Stack Teknologi:
   HTML5 Semantic (header, nav, main, section, footer) [cite: 1]
   Tailwind CSS (via CDN) + Custom Styles [cite: 1]
   Google Fonts (Poppins) [cite: 1]
   Vanilla JavaScript (ES6+ modular structure dalam satu file eksternal) [cite: 1]
   Struktur File:

if24055-pabwe-p3/
├── index.html
└── assets/

    ├── script.js

    └── img/          # Opsional (ikon/ilustrasi pendukung)

2. Panduan Desain & UI/UX (Referensi Desain)
   Mengacu pada referensi visual gaya modern SaaS dashboard/landing page:

Color Palette:
Background Utama: Abu-abu sangat terang (bg-slate-50 atau #F8FAFC).
Card/Container: Putih bersih (bg-white) dengan sudut melengkung (rounded-2xl) dan bayangan lembut (shadow-sm atau shadow-md).
Aksen Utama: Biru modern (text-blue-600, bg-blue-600 untuk tombol aksi utama, hover bg-blue-700).
Teks: Abu-abu gelap (text-slate-800 untuk judul, text-slate-500 untuk sub-teks/deskripsi).
Tipografi: Menggunakan Google Font Poppins secara konsisten dari ketebalan Light (300) hingga Bold (700) [cite: 1].
Responsivitas: Layout menggunakan sistem Grid dan Flexbox Tailwind yang fleksibel agar tampil optimal baik di layar perangkat seluler (mobile) maupun komputer (desktop) [cite: 1].

3. Fitur Utama & Spesifikasi Fungsional
   A. Sistem Navigasi Tab & Integrasi Global
   Tab Navigasi: Terdapat 3 tab utama [cite: 1]:
   Catatan Keuangan (Expense Tracker)
   Bookmark Manager
   Kuis Interaktif (Quiz App)
   Behavior: Hanya satu panel yang aktif ditampilkan dalam satu waktu. Sembunyikan panel lain menggunakan kelas utilitas hidden pada Tailwind.
   Persistensi Tab: Tab terakhir yang dibuka wajib disimpan ke localStorage (misal: dengan key active_tab) sehingga saat halaman direload, aplikasi kembali ke tab terakhir pengguna [cite: 1].

B. Fitur 1: Catatan Pengeluaran Harian (Expense Tracker) [cite: 1]
Struktur Data Transaksi (Array of Objects):

{

id: 1710000000000,

title: "Makan Siang",

category: "Konsumsi",

amount: 35000,

type: "pengeluaran", // "pemasukan" atau "pengeluaran"

date: "2026-09-23"

}

Fungsionalitas:
Ringkasan Saldo (Summary Cards): Menghitung secara otomatis Total Pemasukan, Total Pengeluaran, dan Saldo Akhir (Pemasukan - Pengeluaran) menggunakan method array reduce().
CRUD (Create, Read, Update, Delete):
Tambah: Form input dengan validasi ketat (judul wajib diisi, jumlah harus angka valid > 0, tipe & tanggal wajib dipilih) [cite: 1].
Ubah & Hapus: Menggunakan komponen Modal kustom (bukan alert/confirm bawaan browser) [cite: 1].
Pencarian & Filter:
Input pencarian berdasarkan judul transaksi [cite: 1].
Filter berdasarkan tipe (Semua / Pemasukan / Pengeluaran) dan kategori [cite: 1].
Sorting berdasarkan tanggal terbaru/terlama atau jumlah terbesar/terkecil [cite: 1].
Persistensi: Disimpan di localStorage dengan key khusus (misal: todos_expenses). Tampilkan empty state yang rapi jika data kosong [cite: 1].

C. Fitur 2: Bookmark / Link Manager [cite: 1]
Struktur Data Bookmark:

{

id: 1710000000001,

title: "Dokumentasi Tailwind",

url: "https://tailwindcss.com",

category: "Referensi",

notes: "Panduan styling CSS framework"

}

Fungsionalitas:
Validasi URL: Memastikan URL yang dimasukkan diawali dengan http:// atau https:// (menggunakan validasi string atau Regex sederhana) [cite: 1].
Akses Tautan: Setiap kartu bookmark menampilkan tautan yang dapat diklik langsung di tab baru (target="\_blank" rel="noopener noreferrer") [cite: 1].
CRUD dengan Modal: Fitur Ubah dan Hapus menggunakan Modal interaktif [cite: 1].
Pencarian & Sorting: Pencarian berdasarkan nama/URL/kategori dan sorting judul A–Z / Z–A / terbaru [cite: 1].
Persistensi: Disimpan di localStorage dengan key terpisah (misal: todos_bookmarks) [cite: 1].

D. Fitur 3: Kuis Interaktif (Quiz App) [cite: 1]
Struktur Data Soal (Array of Objects di JavaScript): Minimal 5 soal pilihan ganda seputar literasi digital / teknologi dasar [cite: 1]:

const quizData = [

{

    question: "Apa fungsi utama dari tag semantic <nav> dalam HTML5?",

    options: [

      "Membuat garis horizontal",

      "Menampung bagian navigasi tautan situs",

      "Mengatur warna latar belakang",

      "Menyimpan data database"

    ],

    correct: 1 // Indeks jawaban benar (0-3)

},

// ... minimal 5 soal

];

Fungsionalitas:
State Management: Melacak indeks soal aktif, skor saat ini, dan status kuis (sedang berjalan / selesai) [cite: 1].
Interaksi Jawab & Navigasi: Pengguna memilih opsi jawaban, sistem memberikan umpan balik (feedback benar/salah), lalu lanjut ke soal berikutnya [cite: 1].
Skor & High Score:
Menampilkan skor akhir (contoh: 4 / 5) [cite: 1].
Membandingkan dan menyimpan skor tertinggi (High Score) ke localStorage (key: todos_quiz_highscore) [cite: 1].
Menyediakan tombol "Ulangi Kuis" (Restart) [cite: 1].

4. Rencana Implementasi untuk Agent AI (Step-by-Step Execution Plan)
   Jika agen AI atau Anda akan mulai menuliskan kodenya, ikuti urutan langkah pengerjaan berikut:

Inisialisasi index.html:

Masukkan kerangka dasar HTML5, muat script CDN Tailwind CSS di bagian <head>, serta link font Google Poppins [cite: 1].
Buat struktur tata letak utama: Header aplikasi, Navigasi Tab (dengan tombol berpindah tab yang interaktif), dan Container utama yang membungkus 3 panel fitur (#expense-panel, #bookmark-panel, #quiz-panel).
Rancang markup modal generik untuk keperluan Edit/Delete di bagian bawah body.

Penyusunan Logika JavaScript (assets/script.js) - Arsitektur Modular:

State & Storage Helper: Buat fungsi utilitas pembantu untuk membaca dan menulis ke localStorage dengan aman (getItem, setItem).
Modul Tab Switching: Tangani event click pada tombol tab untuk mengubah kelas visibilitas panel (hidden / block) serta menyimpan status tab aktif ke localStorage [cite: 1].
Modul Expense Tracker:
Tangani DOM selector untuk form, tabel/list, ringkasan, dan filter [cite: 1].
Implementasikan fungsi render data, kalkulasi saldo (reduce), penambahan data baru, serta logika buka modal Edit/Hapus [cite: 1].
Modul Bookmark Manager:
Implementasikan fungsi validasi format URL (http:// / https://) [cite: 1].
Buat fungsi render kartu bookmark, pencarian, sorting, dan aksi CRUD dengan modal [cite: 1].
Modul Quiz App:
Inisialisasi array of objects berisi minimal 5 soal [cite: 1].
Buat fungsi startQuiz, render pertanyaan aktif beserta opsi pilihan ganda, evaluasi jawaban, kalkulasi skor, serta pembaruan High Score di localStorage [cite: 1].

Pengujian & Validasi Kualitas (Quality Control):

Pastikan tidak ada logika penting yang ditarik via atribut inline onclick="..." di HTML; semua event listener didaftarkan secara bersih di dalam script.js [cite: 1].
Uji coba fungsi refresh halaman: pastikan data tidak hilang (tersimpan di localStorage) dan tab aktif kembali ke posisi semula [cite: 1].
Uji responsivitas tampilan di peramban (baik tampilan mode desktop maupun mobile) [cite: 1].
