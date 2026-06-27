export interface Lesson {
  id: string;
  category: "TikTok" | "Instagram" | "YouTube" | "Facebook";
  title: string;
  desc: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  thumb: string; // gradient class
  steps: string[];
}

export const lessons: Lesson[] = [
  { id: "t1", category: "TikTok", title: "Bikin Akun TikTok yang Auto FYP", desc: "Setup profil, niche, dan strategi konten 7 hari pertama biar algoritma cinta sama kamu.", duration: "12 menit", level: "Beginner", thumb: "from-pink-500 via-fuchsia-500 to-cyan-400",
    steps: ["Pilih niche yang menghasilkan", "Setup bio & link affiliate", "Posting 3x sehari konsisten", "Analisis 1 video viral kompetitor"] },
  { id: "t2", category: "TikTok", title: "Hook 3 Detik Pertama yang Bikin Nempel", desc: "Formula hook viral yang dipakai creator 1M+ followers.", duration: "9 menit", level: "Beginner", thumb: "from-rose-500 to-orange-400",
    steps: ["Tulis 5 variasi hook", "Test hook dengan A/B caption", "Review retention 1 minggu"] },
  { id: "t3", category: "TikTok", title: "TikTok Ads buat Pemula", desc: "Setup pixel, kampanye pertama, dan budget 50rb/hari.", duration: "18 menit", level: "Advanced", thumb: "from-emerald-500 to-teal-400",
    steps: ["Buat business center", "Install pixel di landing", "Setup campaign CBO"] },
  { id: "i1", category: "Instagram", title: "Reels Strategy Dari 0 ke 10K", desc: "Cara reels kamu nyangkut di explore page tanpa modal.", duration: "14 menit", level: "Beginner", thumb: "from-purple-500 via-pink-500 to-orange-400",
    steps: ["Riset 10 reels viral", "Buat template editing", "Posting jam prime time"] },
  { id: "i2", category: "Instagram", title: "Story Selling yang Soft", desc: "Jualan tanpa terlihat jualan pakai 5 frame story.", duration: "8 menit", level: "Intermediate", thumb: "from-indigo-500 to-pink-500", steps: ["Frame 1 Hook", "Frame 2 Problem", "Frame 3 Solusi", "Frame 4 Bukti", "Frame 5 CTA"] },
  { id: "y1", category: "YouTube", title: "Channel Long Form yang Recurring Income", desc: "Setup channel, riset keyword, dan monetisasi pertama.", duration: "22 menit", level: "Intermediate", thumb: "from-red-500 to-rose-400",
    steps: ["Setup channel branding", "Riset 10 keyword low comp", "Bikin 3 video pillar"] },
  { id: "y2", category: "YouTube", title: "Shorts Funnel ke Long Form", desc: "Pakai shorts buat narik subscriber ke video panjang.", duration: "11 menit", level: "Intermediate", thumb: "from-orange-500 to-red-400",
    steps: ["Bikin shorts 15 detik", "End screen ke long form", "Track CTR shorts"] },
  { id: "f1", category: "Facebook", title: "Facebook Pro Mode = Cuan", desc: "Aktifin pro mode, monetisasi reels, dan in-stream ads.", duration: "15 menit", level: "Beginner", thumb: "from-blue-500 to-cyan-400",
    steps: ["Aktivasi pro mode", "Posting reels harian", "Apply monetisasi"] },
  { id: "f2", category: "Facebook", title: "Facebook Ads buat Affiliate", desc: "Campaign hemat budget tapi konversi tinggi.", duration: "20 menit", level: "Advanced", thumb: "from-blue-600 to-indigo-500",
    steps: ["Setup business manager", "Pixel & event setup", "Test 3 audience"] },
];

export const referralHistory = [
  { name: "Andi Saputra", wa: "0812****1234", date: "01/05/2026", status: "Aktif" },
  { name: "Siti Rahma", wa: "0813****5678", date: "29/04/2026", status: "Aktif" },
  { name: "Budi Hartono", wa: "0852****9012", date: "27/04/2026", status: "Pending" },
  { name: "Maya Putri", wa: "0821****3344", date: "25/04/2026", status: "Aktif" },
  { name: "Reza Maulana", wa: "0878****5566", date: "22/04/2026", status: "Aktif" },
];

export const withdrawHistory = [
  { id: 1, amount: 500_000, bank: "BCA •••• 1234", date: "20/04/2026", status: "Sukses" },
  { id: 2, amount: 1_200_000, bank: "BCA •••• 1234", date: "05/04/2026", status: "Sukses" },
  { id: 3, amount: 350_000, bank: "BCA •••• 1234", date: "20/03/2026", status: "Sukses" },
];

export const chartData = [
  { day: "Sen", joins: 2 }, { day: "Sel", joins: 4 }, { day: "Rab", joins: 3 },
  { day: "Kam", joins: 6 }, { day: "Jum", joins: 8 }, { day: "Sab", joins: 5 }, { day: "Min", joins: 9 },
];

export const plans = [
  { id: "3m", months: 3, price: 299_000, label: "3 Bulan", desc: "Coba dulu, mulai cuan", best: false },
  { id: "6m", months: 6, price: 499_000, label: "6 Bulan", desc: "Paling banyak dipilih", best: true, save: "Hemat 17%" },
  { id: "12m", months: 12, price: 799_000, label: "12 Bulan", desc: "Setahun full akses", best: false, save: "Hemat 33%" },
];
