# Project Manager — NextyLabs Workspace

Workspace untuk mengelola proyek, task, board, aktivitas, dan ringkasan keuangan dalam satu antarmuka. Repository ini adalah implementasi Next.js yang juga memiliki integrasi Firebase, WebSocket, dan modul asistensi AI.

## Fitur yang tampak di source

- Dashboard serta daftar dan detail proyek.
- Board tugas dan aktivitas tim.
- Ringkasan keuangan dan pengaturan.
- Pencarian global melalui command palette serta keyboard shortcuts.
- Komponen notifikasi, lampiran, komentar, dan fitur asisten.

Alur autentikasi dan integrasi eksternal harus diuji pada environment yang dikonfigurasi; keberadaan komponen bukan bukti seluruh layanan telah siap produksi.

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS, Zustand, TanStack Query, Firebase, Firebase Admin SDK, Socket.IO client, Recharts, dan Zod. Lihat `package.json` untuk versi yang dipakai.

## Menjalankan

```bash
npm install
npm run dev
```

Aplikasi dibuka di `http://localhost:3000`. Konfigurasikan layanan data dan autentikasi untuk environment development sebelum mencoba operasi proyek.

## Struktur

```text
app/                    Entry point UI dan API
components/views/       Tampilan dashboard, proyek, board, keuangan
components/project/     Komponen detail proyek
components/ai/          Fitur asisten dan insight
stores/                 State aplikasi
hooks/                  Custom hooks termasuk sinkronisasi aktivitas
lib/                    Integrasi dan utilities
```

## Verifikasi

```bash
npm run lint
npm run build
```

**Keamanan:** Jangan simpan file `.env`, kredensial service, atau data internal dalam repository. Audit riwayat commit dan rotasi secret yang pernah terpublikasi sebelum memakai integrasi production.
