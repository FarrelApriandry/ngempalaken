# System Architecture Documentation
## LaprakHub — Fullstack Next.js + Neon Serverless

---

## 1. Tinjauan Arsitektur

LaprakHub menerapkan pola **Fullstack Monolith Serverless** menggunakan **Next.js App Router**. Seluruh lapisan aplikasi — mulai dari antarmuka (*UI*), pemrosesan logika bisnis (*Server Actions*), hingga interaksi basis data (*Drizzle ORM*) — berjalan dalam satu ekosistem Next.js tanpa memerlukan server backend terpisah (*backendless architecture*).


```

+-------------------------------------------------------------------+
|                        CLIENT / BROWSER                           |
|          React Client Components + Tailwind CSS + Shadcn          |
+-------------------------------------------------------------------+
|
Server Actions / Server Components
v
+-------------------------------------------------------------------+
|                   NEXT.JS APP ROUTER (SERVER)                     |
|      React Server Components (RSC) + Zod + Server Actions        |
+-------------------------------------------------------------------+
|                                        |
HTTPS / Fetch API                            WebSocket / HTTP
v                                        v
+-----------------------+                +--------------------------+
|  EXTERNAL INTEGRATION |                |      DATABASE LAYER      |
|    GitHub REST API    |                | Neon Serverless Postgres |
| (Repo Visibility Check)                |  (via Drizzle ORM Driver) |
+-----------------------+                +--------------------------+

```

---

## 2. Rincian Layer Sistem

### 2.1 Presentation & Logic Layer (Next.js App Router)
* **React Server Components (RSC):** Mengambil data rekapitulasi dan matriks langsung dari Neon di sisi server tanpa pengiriman bundle JavaScript ekstra ke client untuk pembacaan data (*read-heavy operations*).
* **Server Actions:** Menangani mutasi data (submit link, re-verify repo, input nilai aslab) dengan tipe data terikat (*Type-safe*) dari schema Zod hingga Drizzle.
* **Client Components:** Digunakan terbatas pada elemen interaktif seperti modal dialog, form input dengan *real-time feedback*, dan *toast notifications*.

### 2.2 Database Layer (Neon + Drizzle ORM)
* **Engine:** **Neon Serverless PostgreSQL** yang mendukung *auto-scaling* dan *connection pooling* native untuk lingkungan *serverless/edge*.
* **ORM & Driver:** **Drizzle ORM** dikombinasikan dengan `@neondatabase/serverless` untuk *querying* cepat via HTTP/WebSocket tanpa kendala batas koneksi (*connection exhaustion*).
* **Database Branching:** Memanfaatkan fitur *Branching* Neon untuk mengisolasi database lingkungan `development` / `staging` dari `production`.

### 2.3 External Integration Layer
* **GitHub REST API:** Dipanggil secara langsung (*server-to-server*) di dalam Server Action untuk memverifikasi status HTTP repository (`200 OK` = Public, `404/403` = Private/Not Found).

---

## 3. Alur Data & Keamanan (Data Flow & Security)

### 3.1 End-to-End Type Safety
```text
Drizzle DB Schema  --->  Zod Validation Schema  --->  Server Action Input  --->  Client Form Validation

```

Perubahan pada struktur tabel database di `schema.ts` secara otomatis memberikan sinyal tipe data (*TypeScript error*) hingga ke level komponen form jika terjadi ketidakcocokan.

### 3.2 Keamanan & Akses Data

* **Session & Auth Management:** Menggunakan NextAuth.js / Auth.js atau Supabase Auth (stateless JWT session).
* **Secret Protection:** URL koneksi database (`DATABASE_URL`) hanya diakses pada layer server (*server-only environment*), mencegah kebocoran kredensial ke bundle browser.

---

## 4. Strategi Deployment & Infrastructure

```
                  +-----------------------+
                  |      Vercel Edge      |
                  |   (Next.js Hosting)   |
                  +-----------------------+
                              |
               WebSocket / HTTP (Serverless Driver)
                              v
                  +-----------------------+
                  | Neon Serverless DB    |
                  | (PostgreSQL Engine)   |
                  +-----------------------+

```

* **Frontend & Serverless Engine:** Vercel Platform (Deployment otomatis via integrasi repository GitHub).
* **Database Service:** Neon Cloud (Region: Singapore / `ap-southeast-1` untuk latensi terendah).
* **CI/CD Pipeline:** GitHub Actions untuk pengecekan `drizzle-kit check` (migrasi schema) dan pembentukan linting sebelum proses merge ke *branch* utama.