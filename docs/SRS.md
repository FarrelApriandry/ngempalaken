# Software Requirements Specification (SRS)
## Platform Pengumpulan & Evaluasi Laporan Praktikum (LaprakHub)

---

## 1. Pendahuluan

### 1.1 Tujuan
Dokumen ini mendeskripsikan kebutuhan perangkat lunak untuk sistem **LaprakHub**, sebuah platform pengumpulan, validasi otomatis, dan rekapitulasi laporan praktikum berbasis web. Sistem ini dirancang untuk menggantikan alur pengumpulan manual via Google Form yang rentan terhadap galat input, rekaman ganda, dan kelambatan validasi.

### 1.2 Cakupan Sistem
Sistem mencakup:
1. Portal Mandiri Mahasiswa (Login, pengumpulan link Medium & GitHub, riwayat revisi).
2. Validasi Otomatis (Regex URL, pengecekan ketersediaan publik repository GitHub via API).
3. Dashboard Matriks Asisten Laboratorium (Matriks rekapitulasi M1–M14, grading, ekspor CSV/Excel).
4. Manajemen Praktikum & Modul (Pengaturan deadline, status pengumpulan, dan kelola kelas).

### 1.3 Definisi & Singkatan
* **SRS**: Software Requirements Specification
* **NPM**: Nomor Pokok Mahasiswa
* **Aslab**: Asisten Laboratorium
* **M1–M14**: Pertemuan/Materi Praktikum 1 sampai 14
* **RLS**: Row Level Security (Kebijakan Keamanan Tingkat Baris)

---

## 2. Deskripsi Umum

### 2.1 Perspektif Produk
LaprakHub adalah aplikasi web modern terpusat yang berinteraksi langsung dengan REST API eksternal (GitHub API) untuk verifikasi ketersediaan kode sumber praktikan.

### 2.2 Kategori Pengguna
1. **Praktikan (Mahasiswa):** Pengguna yang mengumpulkan tautan artikel Medium dan repository GitHub sesuai modul yang aktif.
2. **Asisten Laboratorium (Aslab):** Pengguna yang memantau rekapitulasi, mereview karya, memberikan nilai/catatan, dan mengunduh rekap.
3. **Administrator (Koordinator/Dosen):** Pengguna yang mengelola semester, mata kuliah, modul, dan alokasi aslab.

### 2.3 Lingkungan Operasi
* **Client Side:** Web Browser modern (Chrome, Firefox, Edge, Safari) pada perangkat Desktop atau Mobile.
* **Server Side:** Node.js / Bun Runtime, PostgreSQL / Supabase, Nginx Reverse Proxy.

---

## 3. Kebutuhan Fungsional (Functional Requirements)

### 3.1 Otentikasi & Autorisasi (REQ-AUTH)
* **REQ-AUTH-01:** Sistem harus mendukung autentikasi pengguna berbasis email/NPM dan kata sandi.
* **REQ-AUTH-02:** Sistem harus menerapkan Role-Based Access Control (RBAC) untuk peran `Student`, `Assistant`, dan `Admin`.

### 3.2 Manajemen Pengumpulan (REQ-SUB)
* **REQ-SUB-01:** Praktikan dapat memilih modul praktikum yang sedang aktif dan memasukkan tautan Medium serta GitHub.
* **REQ-SUB-02:** Sistem harus memvalidasi format URL secara eksplisit:
  * Domain Medium: `https://medium.com/@<username>/<slug>`
  * Domain GitHub: `https://github.com/<username>/<repo>`
* **REQ-SUB-03:** Sistem harus menolak pengumpulan ganda pada modul yang sama oleh praktikan yang sama (otomatis melakukan pembaruan/update record jika dikirim ulang sebelum deadline).
* **REQ-SUB-04:** Sistem harus mencatat *timestamp* submisi secara presisi dan menandai status `LATE` secara otomatis jika melewati deadline.

### 3.3 Validasi Otomatis & Integrasi (REQ-VAL)
* **REQ-VAL-01:** Sistem harus melakukan pengecekan ke GitHub REST API untuk mengonfirmasi bahwa repository bersangkutan berstatus *Public* dan dapat diakses.
* **REQ-VAL-02:** Jika repository GitHub bernilai *Private* atau *404 Not Found*, sistem harus memberi peringatan kepada praktikan sebelum data tersimpan.

### 3.4 Matriks & Dashboard Asisten (REQ-DASH)
* **REQ-DASH-01:** Aslab dapat melihat matriks rekapitulasi seluruh praktikan dalam bentuk grid (M1–M14) beserta indikator visual status (Terkumpul, Terlambat, Belum).
* **REQ-DASH-02:** Aslab dapat membuka *Quick View* untuk membaca artikel Medium atau inspeksi repository GitHub secara langsung.
* **REQ-DASH-03:** Aslab dapat mengunduh rekapitulasi nilai dan status pengumpulan dalam format `.csv` atau `.xlsx`.

---

## 4. Kebutuhan Non-Fungsional (Non-Functional Requirements)

### 4.1 Performa & Aksesibilitas
* **NFR-PERF-01:** Waktu muat halaman pertama (*First Contentful Paint*) tidak boleh melebihi 1.5 detik pada koneksi internet standar.
* **NFR-PERF-02:** Sistem harus sanggup menangani submisi simultan hingga 100 pengguna bersamaan saat mendekati *deadline*.

### 4.2 Keamanan (Security & Zero Trust)
* **NFR-SEC-01:** Seluruh komunikasi data wajib menggunakan protokol terenkripsi HTTPS (TLS 1.3).
* **NFR-SEC-02:** Penerapan prinsip *Zero Trust* pada layer database menggunakan PostgreSQL Row Level Security (RLS), sehingga praktikan hanya bisa mengubah datanya sendiri.
* **NFR-SEC-03:** Kunci otentikasi API eksternal dan variabel lingkungan sensitif disimpan secara aman pada environment terenkripsi.

### 4.3 Ketersediaan & Keandalan
* **NFR-REL-01:** Sistem harus memiliki ketersediaan (*uptime*) minimal 99.5% selama periode semester berjalan.