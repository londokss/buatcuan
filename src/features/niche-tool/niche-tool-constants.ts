import type {
  NicheJalurCuan,
  NicheLamp,
  NicheLevel,
  NichePersonalCinta,
  NichePersonalModalWaktu,
  NichePersonalOkeDikuasai,
  NicheTampilMuka,
} from "@/lib/api";

// Disclaimer baku — wajib tampil di Layar Hasil, kata-per-kata sesuai kontrak produk. Jangan ubah.
export const NICHE_RESULT_DISCLAIMER =
  "Bukan janji hasil instan. Hasil tiap orang beda tergantung praktik, konsistensi, kualitas konten, dan respons audiens.";

export const NICHE_COMMISSION_GUARDRAIL =
  "Komisi Affiliate BuatCuan berpotensi, bukan dijamin. Single-level, NO MLM/downline — beda dari TikTok Shop Affiliate (jualan barang seller lain).";

export const JALUR_OPTIONS: Array<{ value: NicheJalurCuan; emoji: string; label: string; description: string; isDefault?: boolean }> = [
  {
    value: "AFFILIATE_BUATCUAN",
    emoji: "⭐",
    label: "Affiliate BuatCuan",
    description: "Jalur utama: komisi membership single-level (NO MLM). Sudah ke-pilih duluan.",
    isDefault: true,
  },
  {
    value: "TIKTOK_AFFILIATE",
    emoji: "🛍️",
    label: "TikTok Affiliate",
    description: "Jualan barang seller lain lewat TikTok Shop.",
  },
  {
    value: "GABUNGAN",
    emoji: "🔗",
    label: "Gabungan",
    description: "Konten + jualan produk dalam satu niche.",
  },
  {
    value: "KONTEN_UMUM",
    emoji: "🎙️",
    label: "Konten Umum",
    description: "Fokus konten/hiburan tanpa jualan produk.",
  },
];

export const LEVEL_OPTIONS: Array<{ value: NicheLevel; label: string }> = [
  { value: "RINGAN", label: "Ringan" },
  { value: "SEDANG", label: "Sedang" },
  { value: "BERAT", label: "Berat" },
];

export const TAMPIL_MUKA_OPTIONS: Array<{ value: NicheTampilMuka; label: string }> = [
  { value: "TIDAK", label: "Tidak mau tampil muka" },
  { value: "OPSIONAL", label: "Boleh, tapi tidak wajib" },
  { value: "WAJIB", label: "Siap tampil muka" },
];

export const PERSONAL_CINTA_OPTIONS: Array<{ value: NichePersonalCinta; label: string }> = [
  { value: "KURANG", label: "Kurang suka" },
  { value: "LUMAYAN", label: "Lumayan suka" },
  { value: "BANGET", label: "Suka banget" },
];

export const PERSONAL_OKE_DIKUASAI_OPTIONS: Array<{ value: NichePersonalOkeDikuasai; label: string }> = [
  { value: "BELUM", label: "Belum bisa" },
  { value: "LUMAYAN", label: "Lumayan bisa" },
  { value: "UDAH", label: "Udah jago" },
];

export const PERSONAL_MODAL_WAKTU_OPTIONS: Array<{ value: NichePersonalModalWaktu; label: string }> = [
  { value: "BERAT", label: "Berat buat aku" },
  { value: "SEDANG", label: "Sedang, masih oke" },
  { value: "RINGAN", label: "Ringan, gampang" },
];

export const LAMP_META: Record<NicheLamp, { label: string; badgeClass: string; description: string }> = {
  UTAMA: {
    label: "Niche Utama",
    badgeClass: "bg-emerald-500/15 text-emerald-600",
    description: "Skor tinggi — ini niche yang paling berpotensi cocok buat kamu sekarang.",
  },
  LAYAK: {
    label: "Layak Dicoba",
    badgeClass: "bg-sky-500/15 text-sky-600",
    description: "Cukup cocok, bisa jadi pilihan kedua.",
  },
  CADANGAN: {
    label: "Cadangan",
    badgeClass: "bg-amber-500/15 text-amber-600",
    description: "Masih bisa dicoba nanti, belum prioritas.",
  },
  CARI_LAIN: {
    label: "Cari Niche Lain",
    badgeClass: "bg-muted text-muted-foreground",
    description: "Kurang cocok untuk sekarang — sistem akan arahkan ke Affiliate BuatCuan.",
  },
};

export const NICHE_TOOL_STEPS = ["jalur", "profil", "kandidat", "saringan", "skor", "hasil"] as const;
export type NicheToolStep = (typeof NICHE_TOOL_STEPS)[number];

export const NICHE_TOOL_STEP_LABELS: Record<NicheToolStep, string> = {
  jalur: "Pilih Jalur",
  profil: "Profil",
  kandidat: "Saran Niche",
  saringan: "Saringan Aman",
  skor: "Skor",
  hasil: "Hasil",
};

export const DEFAULT_JALUR: NicheJalurCuan = "AFFILIATE_BUATCUAN";

export const MAX_SELECTED_CANDIDATES = 3;
