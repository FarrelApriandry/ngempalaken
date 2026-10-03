### 2. `sdd.md` (Software Design Document)

```markdown
# Software Design Document (SDD)
## Platform Pengumpulan & Evaluasi Laporan Praktikum (LaprakHub)

---

## 1. Arsitektur Data & Skema Database

Sistem menggunakan basis data relasional PostgreSQL dengan dukungan *Row Level Security* (RLS).

### 1.1 Diagram Entitas & Relasi (ERD)

[Users] 1 --- * [Submissions] * --- 1 [Assignments]
|                  |                     |
|                  + --- 1 [Grades]      + --- 1 [Courses]
*
[Course_Enrollments]

```

### 1.2 Skema Tabel Utama

#### Tabel `users`
| Nama Kolom | Tipe Data | Atribut | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key, Default `gen_random_uuid()` | ID unik pengguna |
| `npm_nip` | `VARCHAR(20)` | Unique, Not Null | NPM Praktikan atau NIP/ID Aslab |
| `full_name` | `VARCHAR(100)` | Not Null | Nama lengkap pengguna |
| `email` | `VARCHAR(100)` | Unique, Not Null | Email terdaftar |
| `role` | `ENUM` | 'student', 'assistant', 'admin' | Peran pengguna |
| `created_at` | `TIMESTAMPTZ` | Default `NOW()` | Waktu registrasi |

#### Tabel `assignments`
| Nama Kolom | Tipe Data | Atribut | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | ID unik penugasan |
| `course_id` | `UUID` | Foreign Key (`courses.id`) | Relasi ke mata kuliah |
| `title` | `VARCHAR(100)` | Not Null | Misal: "Pertemuan 1 - Identitas" |
| `module_number` | `INT` | Not Null | Urutan modul (1 s.d. 14) |
| `deadline` | `TIMESTAMPTZ` | Not Null | Batas waktu pengumpulan |
| `is_active` | `BOOLEAN` | Default `true` | Status keterbukaan modul |

#### Tabel `submissions`
| Nama Kolom | Tipe Data | Atribut | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | ID unik pengumpulan |
| `student_id` | `UUID` | Foreign Key (`users.id`) | ID praktikan |
| `assignment_id` | `UUID` | Foreign Key (`assignments.id`) | ID penugasan modul |
| `medium_url` | `TEXT` | Not Null | Tautan artikel Medium |
| `github_url` | `TEXT` | Not Null | Tautan repository GitHub |
| `github_repo_status` | `ENUM` | 'public', 'private', 'not_found' | Hasil pengecekan otomatis |
| `is_late` | `BOOLEAN` | Default `false` | Terlambat mengumpulkan |
| `submitted_at` | `TIMESTAMPTZ` | Default `NOW()` | Timestamp pengumpulan |

---

## 2. Perancangan Antarmuka Pengguna (UI/UX)

### 2.1 Portal Mahasiswa (Student Dashboard)
* **Form Submisi Modul:** Dropdown pilihan modul aktif, Input field URL Medium & GitHub dengan *real-time validation status badge*.
* **Tabel Riwayat Submisi:** Daftar modul yang sudah dikumpulkan, status verifikasi GitHub, status keterlambatan, dan tautan riwayat.

### 2.2 Dashboard Matriks Aslab (Assistant Dashboard)
* **Grid Matrix View:**
  * Sumbu X: Modul Praktikum (M1 s.d M14)
  * Sumbu Y: Daftar Mahasiswa (Urut NPM)
  * Cell Value: Badge Status (🟢 Tepat Waktu, 🟡 Terlambat, 🔴 Belum, ⚠️ Private Repo)
* **Modal Quick Review:** Pop-up panel untuk menampilkan tautan aktif, riwayat waktu submit, serta form input nilai dan catatan revisi.

---

## 3. Alur Logika Utama (Algoritma)

### 3.1 Normalisasi & Validasi URL
```text
ALGORITMA ValidateAndCheckSubmission(input_medium, input_github):
  1. Bersihkan whitespace dan parameter URL tidak penting.
  2. Uji Regex Medium: /^https?:\/\/(www\.)?medium\.com\/@[\w.-]+\/.+$/
     IF Regex gagal -> Kembalikan Error("URL Medium tidak valid")
  3. Uji Regex GitHub: /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/
     IF Regex gagal -> Kembalikan Error("URL GitHub tidak valid")
  4. Panggil GitHub API: GET [https://api.github.com/repos/](https://api.github.com/repos/){user}/{repo}
     IF Status == 200 -> github_status = 'public'
     ELSE IF Status == 404 -> github_status = 'not_found'
     ELSE -> github_status = 'private'
  5. SIMPAN atau UPDATE data pengumpulan ke database.

```