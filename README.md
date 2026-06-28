# BuatCuan Hub

BuatCuan Hub adalah aplikasi React untuk platform belajar bisnis digital, affiliate marketing, dan monetisasi konten.

## Mode Local (Tanpa Database)

Kalau kamu mau fokus edit login, register, dan UI dulu tanpa backend/database:

1. Copy file `.env.example` jadi `.env`.
2. Pastikan `VITE_LOCAL_MODE=true`.
3. Jalankan `npm install` lalu `npm run dev`.

Local mode menyediakan data auth sederhana di browser (`localStorage`) dengan akun default:

- Admin: WA `628000000001`, password `admin12345`
- Member: WA `628000000002`, password `member12345`

## Scripts

- `npm run dev` menjalankan server lokal.
- `npm run build` membuat build produksi.
- `npm run lint` menjalankan ESLint.
- `npm run test` menjalankan Vitest.
