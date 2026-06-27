import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Crown,
  Mail,
  MapPin,
  Phone,
  Play,
  Sparkles,
  TrendingUp,
  Users,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ThemeModeToggle } from "@/components/ThemeModeToggle";
import { useApp } from "@/context/AppContext";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { api, assetUrl, type LandingContent, type LandingTestimonial } from "@/lib/api";
import { legalConfig } from "@/data/legal";
import { cn } from "@/lib/utils";

// Gates only the new hero visual polish (video bg / animated glow border) — see HeroBackgroundMedia.
// Compliance fixes elsewhere on this page (badges, testimonials, disclaimers, CTA, footer) are
// unconditional, not flag-gated, since they are not optional. Default-on, same convention as
// VITE_NICHE_TOOL_V1 — flip to "false" only for an emergency rollback of the hero visual.
const HOME_V2_ENABLED = import.meta.env.VITE_HOME_V2 !== "false";

const freeFeatures = [
  { text: "4 alat bantu gratis", ok: true },
  { text: "Modul awal untuk mulai praktek", ok: true },
  { text: "Batas harian bahan video/foto", ok: true },
  { text: "Komisi 10% saat member upgrade", ok: true },
  { text: "Semua 24 alat bantu", ok: false },
  { text: "31 modul penuh + strategi cuan", ok: false },
  { text: "Bimbingan mentor + AI + tim", ok: false },
  { text: "Komisi 50% berulang", ok: false },
] as const;

const proFeatures = [
  "Semua 24 alat bantu tanpa batas utama",
  "31 modul penuh dari pemula sampai cuan",
  "Bahan video & foto rutin diperbarui",
  "Hook, caption, musik, script, ide konten terbaru",
  "Bimbingan mentor, AI 24 jam, dan tim BuatCuan",
  "Komisi 50% berulang setiap member perpanjang",
  "Roadmap fitur baru: webinar, offline meeting, paket tambahan",
  "Sistem progress, badge, dan laporan perkembangan",
] as const;

const faqItems = [
  {
    question: "Aku gaptek banget, beneran bisa?",
    answer: "Bisa. Semua diajarin pelan-pelan lewat video yang bisa diulang, plus ada komunitas & mentor buat nanya kapan aja.",
  },
  {
    question: "Harus tampil muka, ya?",
    answer: "Nggak. Banyak yang mulai tanpa tampil muka — cukup rekam layar + bahan siap pakai.",
  },
  {
    question: "Ini beneran aman? Bukan tipu-tipu?",
    answer:
      "Aman. BuatCuan dikelola perusahaan resmi (PT) dan pembayaran lewat QRIS & e-wallet. Komisi datang sebagai terima kasih pas teman yang kamu ajak ikut belajar bareng — santai, nggak ada target atau kewajiban apa pun.",
  },
  {
    question: "Berapa lama sampai dapat hasil?",
    answer: "Hasil tiap orang beda-beda dan butuh proses — ini bukan janji cuan instan. Yang penting konsisten.",
  },
  {
    question: "Harus bayar buat mulai?",
    answer: "Nggak. Mulai dari GRATIS. Mau materi lengkap & komisi lebih besar, baru upgrade ke paket lengkap.",
  },
  {
    question: "Komisinya gimana cairnya?",
    answer: "Tercatat di Dompet \"Komisi Saya\", cair otomatis ke rekening (min. withdraw Rp50.000).",
  },
] as const;

const valueStripItems = ["ILMUNYA DIAJARIN", "ALAT & BAHANNYA DISEDIAIN", "KOMISI OTOMATIS"] as const;

const audienceStarterItems = [
  "🤝 Affiliate pemula — udah coba tapi bingung mulai & belum nemu cara yang pas.",
  "🎬 Calon kreator konten — pengen mulai di TikTok tapi belum pede atau belum ngerti caranya.",
  "🏠 Ibu rumah tangga — pengen penghasilan tambahan tanpa ninggalin rumah.",
  "🎓 Mahasiswa & fresh graduate — mau punya pemasukan sendiri dari HP.",
  "💼 Karyawan / pekerja — nyari side income tanpa ganggu kerjaan utama.",
] as const;

const audienceAdvancedItems = [
  "📹 Affiliate & kreator aktif — butuh amunisi siap pakai: video affiliate, footage, & alat AI biar makin cepet dan nggak abis ide.",
  "🛍️ Punya produk / pelaku UMKM — mau produknya makin laku lewat konten.",
  "📈 Yang mau naik level — dari sekadar bisa jadi makin mahir lewat modul lanjutan + feedback mentor.",
] as const;

const instantStartCards = [
  {
    title: "🔁 Cuan Berkali-kali",
    desc: "Sekali bikin konten, komisi bisa masuk berulang. Makin banyak teman belajar bareng, cuan makin nambah tiap bulan.",
  },
  {
    title: "🧰 Alat & Bahan Disediain",
    desc: "Nggak mulai dari kosong. Video affiliate, footage, sampai alat bantu AI — tinggal pakai.",
  },
  {
    title: "🛒 Toko Lengkap",
    desc: "Semua bahan konten ada di satu tempat, toko BuatCuan buka 24 jam.",
  },
] as const;

const stepCards = [
  { title: "1 — Belajar", desc: "Tonton video step-by-step, tinggal contek. Pelan-pelan dari nol." },
  { title: "2 — Bikin Konten", desc: "Pakai bahan & alat bantu siap pakai, upload tiap hari — tanpa harus tampil muka." },
  { title: "3 — Cuan Berkali-kali", desc: "Ajak teman belajar bareng — tiap teman yang ikut belajar lewat kamu kasih kamu komisi, dan masuk lagi tiap bulan selama mereka aktif belajar." },
] as const;

const storeItems = [
  {
    title: "🎬 Video Affiliate Anti-Pasaran",
    desc: "Video pendek 15-20 detik per produk, 1 video cuma jadi milik kamu (anti-pasaran). Pilih versi mentah (tinggal edit) atau siap upload (langsung posting).",
  },
  {
    title: "🤖 Alat Bantu AI Premium",
    desc: "Bantu bikin ide, hook, caption, sampai voiceover natural. Tinggal ketik produknya, AI yang racik — hemat waktu, nggak abis ide.",
  },
  {
    title: "📹 Footage Video & Foto",
    desc: "Bahan mentah berkualitas siap edit buat konten kamu. Tinggal pilih & gabungin jadi video yang enak ditonton, tanpa harus syuting sendiri.",
  },
  {
    title: "📘 Ebook & Modul",
    desc: "Panduan praktis yang bisa langsung dipraktekin. Dari nol sampai jago, dijelasin step-by-step biar gampang diikutin pemula.",
  },
  {
    title: "🎥 Agency Livestreaming",
    desc: "Pelatihan jadi host live streaming. Belajar teknik nge-host, narik penonton, sampai closing jualan pas lagi live.",
  },
] as const;

const freeFirstItems = [
  "📚 Modul awal \"Cuan Pertama dari HP\" — belajar dari nol, tinggal contek",
  "💰 Dompet Link \"Komisi Saya\" langsung aktif — komisi tercatat & semua otomatis",
  "🤖 Cobain alat bantu pintar (AI) buat ide & caption",
  "📹 Akses awal bahan konten siap pakai",
] as const;

const upgradeItems = [
  "75+ modul & 200+ video dari nol sampai jago",
  "Alat bantu AI & bahan konten lebih lega (tanpa batas wajar)",
  "Feedback akun dari mentor + komisi lebih besar",
] as const;

const recurringItems = [
  "🎬 Tiap video tetap kerja buat kamu — bisa ditonton & ditemuin orang kapan aja, bahkan pas kamu rebahan.",
  "👥 Tiap teman yang kamu ajak belajar bareng = komisi yang masuk lagi tiap bulan selama mereka aktif belajar.",
  "🧠 Tiap praktek = skill yang nempel selamanya.",
] as const;

const differenceItems = [
  "🎮 Belajar serasa scroll tiktok — modul pendek & bertahap. Nggak bikin pusing.",
  "💸 Komisi cair otomatis — langsung ke rekening, tanpa nunggu konfirmasi manual.",
  "🎯 Fokus TikTok aja — nggak nyampur banyak topik yang bikin pemula overwhelm.",
  "🤖 Alat bantu AI nempel di pelajaran — bikin ide, hook, caption, sampai voiceover.",
] as const;

const defaultLandingContent: LandingContent = {
  heroBadge: "FREE vs PRO BuatCuan",
  heroTitle: "BELAJAR BUATCUAN TIAP HARI, CUAN BERKALI-KALI.",
  heroSubtitle: "BuatCuan membantu member mulai dari nol: belajar step-by-step, ambil bahan konten yang terus update, pakai tools viral, dan dibimbing sampai lebih terarah.",
  primaryCta: "Mulai PRO",
  secondaryCta: "Coba Gratis Dulu",
  // Bar statistik hero (member/komisi/AI support/mulai gratis) sengaja dihapus total — angka
  // tersebut dulu karangan dan tidak ada sumber datanya. Tidak dirender lagi di Hero sama sekali,
  // lihat komentar di section Hero. heroStats tetap ada di tipe LandingContent untuk kompatibilitas
  // CMS lama, tapi nilainya dikosongkan dan TIDAK dibaca ulang oleh normalizeLandingContent di bawah.
  heroStats: [],
  previewLabel: "PLATFORM DEMO",
  previewTitle: "Lintas cara kerja BuatCuan",
  demoEyebrow: "Video Demo",
  demoTitle: "Platform ini kerjanya seperti apa?",
  demoSubtitle: "Tonton gambaran singkat: materi belajar, alat bantu, bahan konten, bimbingan, dan sistem mentor.",
  demoVideoTitle: "Lintas cara kerja BuatCuan",
  demoVideoDuration: "3 menit",
  demoVideoNote: "Mentor bisa kirim halaman ini ke calon member agar mereka paham bedanya FREE dan PRO tanpa perlu dijelaskan panjang.",
  demoVideoUrl: "",
  benefitsTitle: "Platform ini membantu apa saja?",
  benefits: [
    { icon: "zap", title: "Belajar step-by-step", desc: "Modul dibuat pendek, urut, dan langsung bisa dipraktekkan." },
    { icon: "trending", title: "Tools siap pakai", desc: "Hook, caption, tagar, musik, skrip promosi, dan ide konten." },
    { icon: "users", title: "Bimbingan aktif", desc: "Mentor dulu, AI 24 jam, lalu tim BuatCuan untuk kasus penting." },
  ],
  infoCards: [
    { icon: "video", title: "Belajar", desc: "Step-by-step" },
    { icon: "sparkles", title: "Tools", desc: "Siap pakai" },
    { icon: "users", title: "Bimbingan", desc: "Aktif" },
  ],
  promoLabel: "Update terus dari tim BuatCuan",
  promoTitle: "Satu keputusan yang bisa ubah penghasilan kamu",
  promoCta: "Mulai GRATIS Sekarang",
  // Testimoni karangan (nama, nominal, dan jumlah followers fiktif) dihapus total — bukan cuma
  // disembunyikan. Default kosong: TestimonialsSection di bawah tidak merender apa pun selama
  // kosong. Kalau nanti CMS diisi testimoni sungguhan/skenario ilustrasi, komponennya tetap
  // memaksa label "Contoh skenario, bukan testimoni nyata" + disclaimer hasil — lihat
  // TestimonialsSection, tidak bisa ditampilkan tanpa label itu.
  testimonialsTitle: "",
  testimonials: [],
  finalTitle: "Satu keputusan yang bisa ubah penghasilan kamu",
  finalSubtitle: "Fasilitas dasar sudah jalan sekarang. Ke depan akan ada tambahan seperti webinar, pertemuan offline, paket baru, dan fitur lain yang membuat nilai PRO semakin besar.",
  finalCta: "Mulai GRATIS Sekarang",
  shareCta: "Bagikan Halaman Ini",
  footer: "BuatCuan 2026. Belajar, konten, dan cuan berulang.",
};

function normalizeLandingContent(content?: LandingContent): LandingContent {
  return {
    ...defaultLandingContent,
    ...(content ?? {}),
    // heroStats deliberately NOT merged back in from defaultLandingContent here (unlike the other
    // fallbacks below) — the hero stats bar must stay gone even if some CMS payload sets it.
    benefits: content?.benefits?.length ? content.benefits : defaultLandingContent.benefits,
    infoCards: content?.infoCards?.length ? content.infoCards : defaultLandingContent.infoCards,
    testimonials: content?.testimonials?.length ? content.testimonials : defaultLandingContent.testimonials,
  };
}

const Landing = () => {
  const { user, loading } = useApp();
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const explicitReferral = searchParams.get("ref") ?? searchParams.get("referral") ?? slug ?? "";
  const referral = explicitReferral || user?.wa || "";
  const registerUrl = referral ? `/register?ref=${encodeURIComponent(referral)}` : "/register";
  const appUrl = user?.role === "admin" ? "/admin" : "/app";
  const { data: landingContent } = useQuery({
    queryKey: ["landing-content", slug, searchParams.toString()],
    queryFn: () => api.landing({
      slug,
      campaign: searchParams.get("campaign") ?? undefined,
      role: searchParams.get("role") ?? undefined,
      ref: referral || undefined,
    }),
    staleTime: 60_000,
  });
  const content = normalizeLandingContent(landingContent);
  const infoIconMap: Record<string, LucideIcon> = {
    video: Video,
    Video,
    sparkles: Sparkles,
    Sparkles,
    users: Users,
    Users,
    trending: TrendingUp,
    TrendingUp,
  };

  return (
    <div className="landing-type-scale min-h-screen bg-background text-foreground dark:bg-[#020402] dark:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[740px] w-[360px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_top,hsl(var(--accent)/0.18),hsl(var(--primary)/0.11)_42%,transparent_72%)] blur-3xl sm:h-[860px] sm:w-[520px]" />
        <div className="absolute -left-28 top-40 h-64 w-64 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.16)_0%,transparent_68%)] blur-2xl" />
        <div className="absolute -right-24 top-56 h-72 w-72 rounded-full bg-[radial-gradient(circle,hsl(var(--accent)/0.14)_0%,transparent_70%)] blur-2xl" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-background to-transparent dark:from-[#071107]" />
      </div>

      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl dark:border-white/10 dark:bg-[#020402]/80">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <img src="/images/logo/buatcuan-icon.png" alt="BuatCuan" className="h-7 w-7 object-contain" />
            <div className="min-w-0">
              <img src="/images/logo/buatcuan-text.png" alt="BuatCuan" className="h-5 object-contain" />
              <p className="text-[8px] font-bold leading-tight text-muted-foreground dark:text-white/65 sm:text-[9px]">Dari nol sampai cuan — ilmunya diajarin, alatnya disediain.</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeModeToggle className="h-8 w-8 rounded-full dark:border-white/10 dark:bg-white/5 dark:text-white" />
            {user ? (
              <Link to={appUrl} className="rounded-full border border-primary/35 bg-primary/10 px-3 py-1.5 text-[11px] font-black text-primary">
                Dashboard
              </Link>
            ) : loading ? null : (
              <Link to="/login" className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-black text-muted-foreground hover:text-foreground dark:border-white/15 dark:bg-white/5 dark:text-white/80">
                Masuk
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="relative pb-24 md:pb-0">
        <section className="relative isolate flex min-h-svh w-full items-center overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
          {HOME_V2_ENABLED ? <HeroBackgroundMedia videoUrl={content.heroVideoUrl} posterUrl={content.heroVideoPoster} /> : null}
          <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center lg:text-left"
            >
              <span className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-yellow-500/35 bg-yellow-500/10 px-3 py-1 text-[10px] font-black text-yellow-700 shadow-[0_0_24px_rgba(250,204,21,0.12)] dark:border-yellow-400/35 dark:bg-yellow-400/10 dark:text-yellow-300 lg:mx-0">
                <Crown className="h-3 w-3" />
                {content.heroBrandTagline ?? "Dari nol sampai cuan — ilmunya diajarin, alatnya disediain."}
              </span>
              <h1 className="mt-5 text-[clamp(2rem,4.8vw,4rem)] font-black leading-[1.02] tracking-tight">
                <HeroHeadline title="BELAJAR BUATCUAN TIAP HARI, CUAN BERKALI-KALI." />
              </h1>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.12em] text-primary sm:text-[11px]">{content.heroValueStrip ?? valueStripItems.join(" · ")}</p>
              <p className="mt-5 max-w-2xl text-[clamp(0.97rem,2.2vw,1.25rem)] font-semibold leading-relaxed text-muted-foreground dark:text-white/60 lg:max-w-xl">
                {content.heroSubtitle}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
                <Link to={registerUrl} className="rounded-full bg-primary px-5 py-2.5 text-xs font-black text-black shadow-[0_0_22px_rgba(0,200,83,0.25)] transition-transform duration-300 hover:-translate-y-0.5">
                  Mulai GRATIS Sekarang <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                </Link>
                <Link to="/login" className="rounded-full border border-border bg-card px-4 py-2.5 text-xs font-black text-foreground shadow-sm transition-colors hover:border-primary/35 dark:border-white/15 dark:bg-white/5 dark:text-white">
                  {content.secondaryCta}
                </Link>
                <a href="#video-demo" className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-2.5 text-xs font-black text-primary transition-transform duration-300 hover:-translate-y-0.5">
                  {content.heroTertiaryCta ?? "▶ Lihat Cara Kerjanya"}
                </a>
              </div>
              <p className="mt-4 text-[11px] font-semibold leading-relaxed text-muted-foreground dark:text-white/62 lg:max-w-lg">
                {content.heroMicrocopy ?? "✅ Gratis selamanya · ✅ Daftar cukup pakai nomor HP· ✅ Dikelola PT Akademi BuatCuan Indonesia"}
              </p>
            </motion.div>

            <HeroPhoneMockup content={content} registerUrl={registerUrl} />
          </div>
        </section>

        <LandingSection id="video-demo" eyebrow="Video Demo" title="Lihat Cara Kerjanya" subtitle="Tonton gambaran singkat onboarding biar kamu paham alur belajar, konten, dan cara cuannya.">
          <LandingDemoVideoCard content={content} />
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(content.infoCards ?? []).slice(0, 3).map((item) => (
              <InfoCard key={`${item.title}-${item.desc}`} icon={infoIconMap[item.icon] ?? Sparkles} title={item.title} desc={item.desc} />
            ))}
          </div>
        </LandingSection>

        <AudienceSection content={content} />
        <ReasonsToStartSection registerUrl={registerUrl} content={content} />
        <ThreeStepsSection content={content} />
        <StoreTeaserSection registerUrl={registerUrl} content={content} />
        <FreeFirstSection content={content} />
        <RecurringSection content={content} />
        <DifferenceSection content={content} />
        <ConcernsSection content={content} />
        <StartNowSection registerUrl={registerUrl} content={content} />
        <FaqSection content={content} />
        <FinalSingleStepSection registerUrl={registerUrl} content={content} />
      </main>

      <footer className="relative border-t border-border bg-background py-8 text-center text-[11px] font-semibold text-muted-foreground dark:border-white/10 dark:bg-[#020402] dark:text-white/42">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/5 px-4 py-3 text-[10px] leading-relaxed text-yellow-800 dark:border-yellow-400/25 dark:bg-yellow-400/[0.06] dark:text-yellow-200/80">
            {content.footerDisclaimer ?? "Hasil tiap orang berbeda tergantung praktik, konsistensi, kualitas konten & respons audiens. Ini bukan janji hasil instan. Komisi berpotensi, bukan dijamin."}
          </div>

          <div className="mt-4">{content.footerCopyright ?? "© PT Akademi BuatCuan Indonesia"}</div>
          <nav className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
            <Link to="/terms" className="hover:text-foreground dark:hover:text-white">Syarat & Ketentuan</Link>
            <Link to="/privacy" className="hover:text-foreground dark:hover:text-white">Kebijakan Privasi</Link>
            <Link to="/refund-policy" className="hover:text-foreground dark:hover:text-white">Kebijakan Refund</Link>
            <Link to="/affiliate-rules" className="hover:text-foreground dark:hover:text-white">Aturan Affiliate/Komisi</Link>
          </nav>

          <FooterContactBlock />
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 p-3 backdrop-blur md:hidden dark:border-white/10 dark:bg-[#020402]/95">
        <Link to={registerUrl} className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-black text-black shadow-[0_0_22px_rgba(0,200,83,0.25)]">
          Mulai GRATIS Sekarang
        </Link>
      </div>
    </div>
  );
};

function FooterContactBlock() {
  return (
    <div className="mt-6 rounded-2xl border border-border bg-card/60 p-4 text-left text-[10px] leading-relaxed dark:border-white/10 dark:bg-white/[0.03]">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">Kontak & Pengaduan Konsumen</p>
      <p className="mt-1 font-bold text-foreground dark:text-white/80">{legalConfig.legalEntityName}</p>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
        <a href={`mailto:${legalConfig.supportEmail}`} className="flex items-center gap-1.5 hover:text-foreground dark:hover:text-white">
          <Mail className="h-3 w-3 shrink-0" /> {legalConfig.supportEmail}
        </a>
        <span className="flex items-center gap-1.5">
          <Phone className="h-3 w-3 shrink-0" /> {legalConfig.supportWhatsApp.startsWith("[") ? legalConfig.supportWhatsApp : `WA ${legalConfig.supportWhatsApp}`}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3 shrink-0" /> {legalConfig.companyAddress}
        </span>
      </div>
    </div>
  );
}

// Splits the literal word "BUATCUAN" out of the headline and colors it green ("BUAT") + gold
// ("CUAN") to match the logo. Falls back to plain text untouched if the word isn't present, so a
// CMS-edited headline without "BUATCUAN" in it never crashes or renders oddly.
function HeroHeadline({ title }: { title: string }) {
  const match = /buatcuan/i.exec(title);
  if (!match) return <>{title}</>;

  const start = match.index;
  const end = start + match[0].length;
  const word = match[0];
  const mid = Math.ceil(word.length / 2);

  return (
    <>
      {title.slice(0, start)}
      <span className="text-primary">{word.slice(0, mid)}</span>
      <span className="text-accent">{word.slice(mid)}</span>
      {title.slice(end)}
    </>
  );
}

// Hero background: a dimmed video (once heroVideoUrl is set via CMS) or poster fallback, behind a
// top fade so text stays legible. Stays inert (no <video> mounted at all, zero network cost) when
// there's no video configured, when the user prefers reduced motion, or on a flagged slow/limited
// connection (navigator.connection — best-effort, most browsers don't expose it, which is fine:
// the default in that case is to allow playback rather than block it).
function HeroBackgroundMedia({ videoUrl, posterUrl }: { videoUrl?: string; posterUrl?: string }) {
  const reducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
    if (!connection) return;
    const update = () => setSaveData(Boolean(connection.saveData) || ["slow-2g", "2g"].includes(connection.effectiveType ?? ""));
    update();
    connection.addEventListener?.("change", update);
    return () => connection.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onVisibilityChange = () => {
      if (document.hidden) video.pause();
      else if (!reducedMotion) void video.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [reducedMotion]);

  const canPlayVideo = Boolean(videoUrl) && !reducedMotion && !saveData;

  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
      {canPlayVideo && videoUrl ? (
        <video
          ref={videoRef}
          data-testid="hero-bg-video"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
          src={assetUrl(videoUrl)}
          poster={posterUrl ? assetUrl(posterUrl) : undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
        />
      ) : posterUrl ? (
        <img
          src={assetUrl(posterUrl)}
          alt=""
          loading="lazy"
          data-testid="hero-bg-fallback-image"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
      ) : (
        <div data-testid="hero-bg-fallback-gradient" className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.16),hsl(var(--accent)/0.1)_45%,transparent_75%)]" />
      )}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-background to-transparent dark:from-[#071107]" />
    </div>
  );
}

type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (event: string, callback: () => void) => void;
  removeEventListener?: (event: string, callback: () => void) => void;
};

function HeroPhoneMockup({ content, registerUrl }: { content: LandingContent; registerUrl: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
      className="relative mx-auto w-full max-w-[420px]"
    >
      <div className="pointer-events-none absolute -left-8 top-8 h-24 w-24 rounded-full bg-primary/20 blur-xl" />
      <div className="pointer-events-none absolute -right-8 bottom-10 h-24 w-24 rounded-full bg-yellow-500/25 blur-xl" />

      <div className="relative rounded-[34px] border border-primary/35 bg-[linear-gradient(155deg,rgba(0,200,83,0.18),rgba(255,215,0,0.1)_45%,rgba(7,10,9,0.95)_100%)] p-2 shadow-[0_26px_70px_-35px_rgba(0,200,83,0.6)]">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#090f0b]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-[11px] font-black text-white/80">
            <span>{content.previewLabel}</span>
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary">LIVE</span>
          </div>
          <div className="relative aspect-[9/16] bg-gradient-to-br from-[#0f2517] via-[#09110d] to-[#261f07]">
            {content.demoVideoUrl ? (
              <video src={assetUrl(content.demoVideoUrl)} className="h-full w-full object-cover opacity-90" muted loop playsInline autoPlay />
            ) : (
              <div className="grid h-full place-items-center">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-white/10 backdrop-blur">
                  <Play className="h-6 w-6 fill-white text-white" />
                </div>
              </div>
            )}
            <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/15 bg-black/45 px-3 py-2 backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary">Onboarding Cepat</p>
              <p className="mt-1 text-xs font-semibold text-white/88">Step-by-step dari nol sampai siap jalan.</p>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.45 }}
        className="absolute -left-2 top-8 rounded-xl border border-primary/40 bg-primary/15 px-3 py-2 text-[10px] font-black text-primary shadow-lg backdrop-blur"
      >
        Komisi berulang
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.45 }}
        className="absolute -right-1 bottom-10 rounded-xl border border-yellow-500/50 bg-yellow-500/15 px-3 py-2 text-[10px] font-black text-yellow-700 shadow-lg backdrop-blur dark:text-yellow-300"
      >
        Daftar 1 menit
      </motion.div>

      <div className="mt-4 flex justify-center">
        <Link to={registerUrl} className="rounded-full border border-primary/35 bg-primary/10 px-4 py-2 text-[11px] font-black text-primary transition-transform duration-300 hover:-translate-y-0.5">
          Coba demo lalu mulai
        </Link>
      </div>
    </motion.div>
  );
}

function LandingSection({ id, eyebrow, title, subtitle, children }: { id?: string; eyebrow: string; title: string; subtitle: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-12 border-t border-border bg-background dark:border-white/10 dark:bg-[#020402]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-7 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-black leading-tight">{title}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-[12px] font-semibold leading-relaxed text-muted-foreground dark:text-white/52 sm:text-sm">{subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

function AudienceSection({ content }: { content: LandingContent }) {
  const starterItems = content.section2StarterItems?.length ? content.section2StarterItems : [...audienceStarterItems];
  const advancedItems = content.section2AdvancedItems?.length ? content.section2AdvancedItems : [...audienceAdvancedItems];
  return (
    <LandingSection
      eyebrow="Ini Buat Kamu"
      title={content.section2Title ?? "INI BUAT KAMU YANG PENGEN CUAN DARI HP"}
      subtitle={content.section2Intro ?? "Dari yang baru mulai sampai yang udah jalan — semua ada tempatnya. Soalnya di BuatCuan ada dua hal sekaligus: ilmu buat belajar dari nol, dan produk + alat buat yang pengen gas lebih cepet."}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.42 }}
          className="rounded-2xl border border-border bg-card p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.4)] transition-transform duration-300 hover:-translate-y-1 dark:border-white/10 dark:bg-white/[0.045]"
        >
          <h3 className="text-sm font-black text-primary">{content.section2StarterTitle ?? "🌱 Buat yang baru mulai:"}</h3>
          <div className="mt-3 space-y-2">
            {starterItems.map((item) => (
              <p key={item} className="text-[12px] font-semibold leading-relaxed text-muted-foreground dark:text-white/65">{item}</p>
            ))}
          </div>
        </motion.article>
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.42, delay: 0.08 }}
          className="rounded-2xl border border-yellow-500/35 bg-yellow-500/10 p-4 shadow-[0_16px_40px_-28px_rgba(250,204,21,0.5)] transition-transform duration-300 hover:-translate-y-1 dark:border-yellow-400/35 dark:bg-yellow-400/10"
        >
          <h3 className="text-sm font-black text-yellow-700 dark:text-yellow-300">{content.section2AdvancedTitle ?? "🚀 Buat yang udah jalan / mau makin jago:"}</h3>
          <div className="mt-3 space-y-2">
            {advancedItems.map((item) => (
              <p key={item} className="text-[12px] font-semibold leading-relaxed text-yellow-800/90 dark:text-yellow-100">{item}</p>
            ))}
          </div>
        </motion.article>
      </div>
      <p className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-center text-[12px] font-black text-primary">
        {content.section2Outro ?? "Modal cukup 1 HP + internet — mulai dari GRATIS, naik level kapan kamu siap."}
      </p>
    </LandingSection>
  );
}

function ReasonsToStartSection({ registerUrl, content }: { registerUrl: string; content: LandingContent }) {
  const cards = content.section3Items?.length ? content.section3Items : [...instantStartCards];
  return (
    <LandingSection eyebrow="Langsung Mutusin" title={content.section3Title ?? "YANG LANGSUNG BIKIN KAMU PENGEN MULAI"} subtitle={content.section3Intro ?? ""}>
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((item, idx) => (
          <motion.article
            key={item.title}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.42, delay: idx * 0.07 }}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-transform duration-300 hover:-translate-y-1 dark:border-white/10 dark:bg-white/[0.045]"
          >
            <h3 className="text-sm font-black">{item.title}</h3>
            <p className="mt-2 text-[12px] font-semibold leading-relaxed text-muted-foreground dark:text-white/65">{item.desc}</p>
          </motion.article>
        ))}
      </div>
      <div className="mt-5 flex justify-center">
        <Link to={registerUrl} className="rounded-full bg-primary px-5 py-2.5 text-xs font-black text-black">{content.section3Cta ?? "Mulai GRATIS Sekarang"}</Link>
      </div>
    </LandingSection>
  );
}

function ThreeStepsSection({ content }: { content: LandingContent }) {
  const cards = content.section4Items?.length ? content.section4Items : [...stepCards];
  return (
    <LandingSection eyebrow="3 Langkah" title={content.section4Title ?? "CUMA 3 LANGKAH, LANGSUNG JALAN"} subtitle="">
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((item, index) => (
          <motion.article
            key={item.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.42, delay: index * 0.08 }}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-transform duration-300 hover:-translate-y-1 dark:border-white/10 dark:bg-white/[0.045]"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary">STEP {index + 1}</p>
            <h3 className="mt-2 text-sm font-black">{item.title}</h3>
            <p className="mt-2 text-[12px] font-semibold leading-relaxed text-muted-foreground dark:text-white/65">{item.desc}</p>
          </motion.article>
        ))}
      </div>
    </LandingSection>
  );
}

function StoreTeaserSection({ registerUrl, content }: { registerUrl: string; content: LandingContent }) {
  const cards = content.section5Items?.length ? content.section5Items : [...storeItems];
  return (
    <LandingSection
      eyebrow="Toko BuatCuan"
      title={content.section5Title ?? "TOKO BUATCUAN — TINGGAL PILIH SESUAI KEBUTUHAN, LANGSUNG GAS"}
      subtitle={content.section5Intro ?? "Tiap yang kamu pelajarin, ada bekal siap pakainya di Toko BuatCuan — biar kamu gas lebih cepat, nggak mulai dari kosong:"}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((item, idx) => (
          <motion.article
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.38, delay: idx * 0.05 }}
            className="rounded-2xl border border-border bg-card p-4 transition-transform duration-300 hover:-translate-y-1 hover:border-primary/35 dark:border-white/10 dark:bg-white/[0.045]"
          >
            <h3 className="text-sm font-black">{item.title}</h3>
            <p className="mt-2 text-[12px] font-semibold leading-relaxed text-muted-foreground dark:text-white/65">{item.desc}</p>
          </motion.article>
        ))}
      </div>
      <p className="mt-4 text-center text-[11px] font-semibold leading-relaxed text-muted-foreground dark:text-white/62">
        {content.section5Note ?? "Teaser aja — harga & detail dibuka di dalam setelah daftar. CTA tetap Daftar GRATIS, jangan ada tombol beli di home. Item lain tampil di dalam setelah daftar."}
      </p>
      <div className="mt-4 flex justify-center">
        <Link to={registerUrl} className="rounded-full bg-primary px-5 py-2.5 text-xs font-black text-black">{content.section5Cta ?? "Daftar GRATIS"}</Link>
      </div>
    </LandingSection>
  );
}

function FreeFirstSection({ content }: { content: LandingContent }) {
  const freeItems = content.section6FreeItems?.length ? content.section6FreeItems : [...freeFirstItems];
  const upgradeRows = content.section6UpgradeItems?.length ? content.section6UpgradeItems : [...upgradeItems];
  return (
    <LandingSection eyebrow="Gratis Duluan" title={content.section6Title ?? "SEGINI BANYAK YANG KAMU DAPET — GRATIS DULUAN"} subtitle="">
      <div className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
          <h3 className="text-sm font-black text-primary">{content.section6FreeTitle ?? "🎁 Mulai GRATIS, langsung dapat:"}</h3>
          <div className="mt-3 space-y-2">
            {freeItems.map((item) => (
              <p key={item} className="text-[12px] font-semibold leading-relaxed text-muted-foreground dark:text-white/68">{item}</p>
            ))}
          </div>
        </article>
        <article className="rounded-2xl border border-yellow-500/35 bg-yellow-500/10 p-4 dark:border-yellow-400/35 dark:bg-yellow-400/10">
          <h3 className="text-sm font-black text-yellow-700 dark:text-yellow-300">{content.section6UpgradeTitle ?? "🚀 Makin lengkap pas kamu siap upgrade:"}</h3>
          <div className="mt-3 space-y-2">
            {upgradeRows.map((item) => (
              <p key={item} className="text-[12px] font-semibold leading-relaxed text-yellow-800/90 dark:text-yellow-100">{item}</p>
            ))}
          </div>
        </article>
      </div>
    </LandingSection>
  );
}

function RecurringSection({ content }: { content: LandingContent }) {
  const rows = content.section7Items?.length ? content.section7Items : [...recurringItems];
  return (
    <LandingSection eyebrow="Belajar Tiap Hari" title={content.section7Title ?? "BELAJAR TIAP HARI, CUAN BERKALI-KALI"} subtitle={content.section7Intro ?? "Di BuatCuan, cuan bisa datang berulang, bukan sekali lewat:"}>
      <div className="grid gap-3 sm:grid-cols-3">
        <CycleCard icon={Video} label="Video" text={rows[0] ?? recurringItems[0]} />
        <CycleCard icon={Users} label="Orang" text={rows[1] ?? recurringItems[1]} />
        <CycleCard icon={TrendingUp} label="Dompet" text={rows[2] ?? recurringItems[2]} />
      </div>
    </LandingSection>
  );
}

function DifferenceSection({ content }: { content: LandingContent }) {
  const rows = content.section8Items?.length ? content.section8Items : [...differenceItems];
  return (
    <LandingSection eyebrow="BuatCuan Beda" title={content.section8Title ?? "INI YANG BIKIN BUATCUAN BEDA"} subtitle="">
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((item) => (
          <article key={item} className="rounded-2xl border border-border bg-card p-4 dark:border-white/10 dark:bg-white/[0.045]">
            <p className="text-[12px] font-semibold leading-relaxed text-muted-foreground dark:text-white/66">{item}</p>
          </article>
        ))}
      </div>
    </LandingSection>
  );
}

function ConcernsSection({ content }: { content: LandingContent }) {
  return (
    <LandingSection
      eyebrow="Tenang"
      title={content.section9Title ?? "KAMU NGERASA GINI? TENANG, SEMUA ADA JAWABANNYA"}
      subtitle=""
    >
      <div className="rounded-2xl border border-border bg-card p-4 dark:border-white/10 dark:bg-white/[0.045]">
        <p className="text-[12px] font-semibold leading-relaxed text-muted-foreground dark:text-white/65">
          {content.section9Paragraph1 ?? "Wajar kalau masih ada yang ngeganjel — pengen nambah penghasilan dari HP tapi bingung mulai, takut ribet, malu tampil muka, atau udah nyoba sendiri tapi belum nemu caranya. Tenang, kamu nggak sendirian — dan kamu nggak harus jago dulu buat mulai. Semua diajarin pelan-pelan dari nol, tinggal contek."}
        </p>
        <p className="mt-3 text-[12px] font-semibold leading-relaxed text-muted-foreground dark:text-white/65">
          {content.section9Paragraph2 ?? "Soal aman? Ini beneran. Dikelola badan usaha resmi (PT Akademi BuatCuan Indonesia) dan pembayaran lewat QRIS & e-wallet. Komisinya pun simpel & jujur: kamu tinggal ajak teman belajar bareng, dan komisi datang dari produk & materi belajar yang asli — bukan dari biaya pendaftaran atau ngerekrut anggota. Nggak ada target, nggak ada paksaan."}
        </p>
      </div>
    </LandingSection>
  );
}

function StartNowSection({ registerUrl, content }: { registerUrl: string; content: LandingContent }) {
  const rows = content.section10Items?.length ? content.section10Items : [
    "✅ Langsung dapet akses awal + link ajak teman belajar kamu sendiri",
    "✅ Belajar dari nol, tinggal contek sampai jago",
    "✅ Mau lebih lengkap? Bisa upgrade kapan aja — santai, opsional",
  ];
  return (
    <LandingSection eyebrow="Mulai Sekarang" title={content.section10Title ?? "MULAI GRATIS SEKARANG, JANGAN NUNGGU NANTI"} subtitle={content.section10Subtitle ?? "Mulai dari GRATIS. Nggak perlu modal, daftar cukup pakai nomor HP."}>
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-4 text-left dark:border-white/10 dark:bg-white/[0.045]">
        <div className="space-y-2 text-[12px] font-semibold leading-relaxed text-muted-foreground dark:text-white/66">
          {rows.map((item) => <p key={item}>{item}</p>)}
        </div>
        <div className="mt-4 flex justify-center sm:justify-start">
          <Link to={registerUrl} className="rounded-full bg-primary px-5 py-2.5 text-xs font-black text-black">{content.section10Cta ?? "Mulai GRATIS Sekarang"}</Link>
        </div>
      </div>
    </LandingSection>
  );
}

function FinalSingleStepSection({ registerUrl, content }: { registerUrl: string; content: LandingContent }) {
  return (
    <LandingSection eyebrow="Satu Langkah Lagi" title={content.section12Title ?? "TINGGAL SATU LANGKAH LAGI MENUJU CUAN PERTAMAMU"} subtitle={content.section12Subtitle ?? "Nggak usah nunggu sempurna — langkah pertamamu cuma SATU."}>
      <div className="mx-auto max-w-3xl rounded-2xl border border-primary/30 bg-primary/10 p-5 text-center">
        <h3 className="text-xl font-black leading-tight sm:text-2xl">{content.section12Subtitle ?? "Nggak usah nunggu sempurna — langkah pertamamu cuma SATU."}</h3>
        <Link to={registerUrl} className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-xs font-black text-black">Mulai GRATIS Sekarang</Link>
        <p className="mt-3 text-[11px] font-semibold leading-relaxed text-muted-foreground dark:text-white/64">{content.section12Microcopy ?? "Gratis · daftar cukup pakai nomor HP · bisa langsung mulai hari ini."}</p>
      </div>
    </LandingSection>
  );
}

function CycleCard({ icon: Icon, label, text }: { icon: LucideIcon; label: string; text: string }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4 dark:border-white/10 dark:bg-white/[0.045]">
      <div className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-black text-primary">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className="mt-3 text-[12px] font-semibold leading-relaxed text-muted-foreground dark:text-white/65">{text}</p>
    </article>
  );
}

function InfoCard({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.045]">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <h3 className="mt-3 text-xs font-black">{title}</h3>
      <p className="mt-1 text-[10px] font-semibold leading-snug text-muted-foreground dark:text-white/45">{desc}</p>
    </div>
  );
}

function LandingDemoVideoCard({ content }: { content: LandingContent }) {
  return (
    <div className="relative z-10">
      {HOME_V2_ENABLED ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-2 -z-10 rounded-[26px] border-2 border-primary/70 motion-safe:animate-pulse-glow-brand"
        />
      ) : null}
      <div className="overflow-hidden rounded-[18px] border border-primary/20 bg-card shadow-sm dark:bg-[#101010]">
        <div className="relative aspect-video bg-gradient-to-br from-emerald-950 via-zinc-950 to-yellow-950">
          {content.demoVideoUrl ? (
            <video src={assetUrl(content.demoVideoUrl)} controls preload="metadata" className="h-full w-full bg-black object-contain" />
          ) : (
            <div className="grid h-full place-items-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-background/80 text-foreground dark:bg-white/15 dark:text-white">
                <Play className="ml-0.5 h-5 w-5 fill-white" />
              </div>
            </div>
          )}
          <span className="absolute bottom-3 right-3 rounded-full bg-primary px-2 py-1 text-[9px] font-black text-primary-foreground">
            {content.demoVideoDuration ?? "3 menit"}
          </span>
        </div>
        <div className="p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground dark:text-white/45">{content.previewLabel}</p>
          <p className="mt-1 text-sm font-black">{content.demoVideoTitle ?? content.previewTitle}</p>
          <p className="mt-1 text-[10px] font-semibold leading-relaxed text-muted-foreground dark:text-white/45">{content.demoVideoNote}</p>
        </div>
      </div>
    </div>
  );
}

function PlanComparison({ registerUrl, proRegisterUrl, content }: { registerUrl: string; proRegisterUrl: string; content: LandingContent }) {
  const freeFeatureRows = content.freeFeatures ?? freeFeatures;
  const proFeatureRows = content.proFeatures ?? proFeatures.map((text) => ({ text, ok: true }));
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      <PlanCard
        name={content.freePlanTitle ?? "FREE"}
        price={content.freePlanPrice ?? "Rp0"}
        desc={content.freePlanDesc ?? "Cocok untuk coba platform dan mulai langkah awal."}
        features={freeFeatureRows}
        cta={content.freePlanCta ?? "Coba Gratis"}
        to={registerUrl}
      />
      <PlanCard
        name={content.proPlanTitle ?? "PRO"}
        price={content.proPlanPrice ?? "Rp297.000"}
        desc={content.proPlanDesc ?? "Akses penuh selama 3 bulan, termasuk materi mentor dan komisi berulang."}
        features={proFeatureRows}
        cta={content.proPlanCta ?? "Mulai PRO"}
        to={proRegisterUrl}
        highlighted
      />
    </div>
  );
}

function PlanCard({
  name,
  price,
  desc,
  features,
  cta,
  to,
  highlighted = false,
}: {
  name: string;
  price: string;
  desc: string;
  features: ReadonlyArray<{ text: string; ok: boolean }>;
  cta: string;
  to: string;
  highlighted?: boolean;
}) {
  return (
    <article
      className={cn(
        "relative min-w-0 rounded-[18px] border p-3 sm:p-4",
        highlighted
          ? "border-yellow-500/45 bg-yellow-500/10 shadow-[0_0_30px_rgba(250,204,21,0.12)] dark:border-yellow-400/45 dark:bg-yellow-400/[0.095]"
          : "border-border bg-card shadow-sm dark:border-white/10 dark:bg-white/[0.045]",
      )}
    >
      {highlighted && (
        <span className="absolute right-2 top-2 rounded-full bg-yellow-500/15 px-2 py-0.5 text-[8px] font-black text-yellow-700 dark:bg-yellow-400/15 dark:text-yellow-300">
          Paling lengkap
        </span>
      )}
      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-muted-foreground dark:text-white/52">{name}</p>
      <p className={cn("mt-2 text-2xl font-black leading-none", highlighted ? "text-yellow-700 dark:text-yellow-300" : "text-primary")}>{price}</p>
      <p className="mt-2 min-h-12 text-[10px] font-semibold leading-relaxed text-muted-foreground dark:text-white/52 sm:text-[11px]">{desc}</p>
      <Link
        to={to}
        className={cn(
          "mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl text-[10px] font-black sm:text-xs",
          highlighted
            ? "bg-yellow-400 text-black dark:bg-yellow-300"
            : "border border-border bg-background text-foreground dark:border-white/15 dark:bg-white/5 dark:text-white",
        )}
      >
        {cta}
      </Link>
      <div className="mt-3 space-y-1.5">
        {features.map((item) => (
          <div key={item.text} className="flex min-w-0 items-start gap-1.5 rounded-full bg-secondary px-2 py-1.5 dark:bg-black/20">
            {item.ok ? (
              <Check className={cn("mt-0.5 h-3 w-3 shrink-0", highlighted ? "text-yellow-700 dark:text-yellow-300" : "text-primary")} />
            ) : (
              <X className="mt-0.5 h-3 w-3 shrink-0 text-red-400" />
            )}
            <span className="min-w-0 text-[9px] font-semibold leading-snug text-muted-foreground dark:text-white/60 sm:text-[10px]">{item.text}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

// No testimonials configured (the default, post-cleanup state) -> renders nothing at all. If the
// CMS is ever populated with real or illustrative testimonials, this unconditionally prepends the
// "Contoh skenario, bukan testimoni nyata" label + a results disclaimer — there is no code path
// that can show a testimonial without it, by design (see the compliance task this enforces).
function TestimonialsSection({ content }: { content: LandingContent }) {
  if (!content.testimonials.length) return null;

  return (
    <LandingSection eyebrow="Bukti Member" title={content.testimonialsTitle || "Contoh skenario member"} subtitle="Ilustrasi cara mentor/member memakai BuatCuan — bukan klaim hasil yang pasti didapat semua orang.">
      <div className="mb-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-center text-[11px] font-black text-yellow-800 dark:border-yellow-400/30 dark:bg-yellow-400/10 dark:text-yellow-200">
        Contoh skenario, bukan testimoni nyata. Hasil tiap orang berbeda, bukan jaminan.
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {content.testimonials.map((item) => (
          <TestimonialCard key={item.name} {...item} />
        ))}
      </div>
    </LandingSection>
  );
}

function TestimonialCard({ name, role, result, text }: LandingTestimonial) {
  return (
    <article className="rounded-2xl border border-border bg-card p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.045]">
      {result ? <p className="rounded-full bg-primary/12 px-2 py-1 text-[10px] font-black text-primary">{result}</p> : null}
      <p className="mt-3 text-[11px] font-semibold leading-relaxed text-muted-foreground dark:text-white/62">"{text}"</p>
      <div className="mt-4 border-t border-border pt-3 dark:border-white/10">
        <p className="text-xs font-black">{name}</p>
        <p className="text-[10px] font-semibold text-muted-foreground dark:text-white/42">{role}</p>
      </div>
    </article>
  );
}

function FaqSection({ content }: { content: LandingContent }) {
  const [openIndex, setOpenIndex] = useState(0);
  const items = content.section11FaqItems?.length ? content.section11FaqItems : [...faqItems];

  return (
    <section className="border-t border-border bg-muted/35 dark:border-white/10 dark:bg-[#070707]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="relative overflow-hidden rounded-[26px] border border-border bg-card/95 p-3 shadow-[0_22px_70px_-30px_rgba(15,23,42,0.65)] dark:border-white/10 dark:bg-[#030303] sm:p-6 lg:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.22)_0%,transparent_66%)] blur-2xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,hsl(var(--accent)/0.22)_0%,transparent_66%)] blur-2xl" />

          <div className="relative mb-5 border-b border-border/80 pb-3 dark:border-white/10 sm:mb-8 sm:pb-5">
            <p className="max-w-[18ch] text-[clamp(1.15rem,4.7vw,2.4rem)] font-black leading-[1.1] tracking-tight text-foreground">{content.section11Title ?? "MASIH RAGU? INI JAWABANNYA"}</p>
          </div>

          <div className="relative space-y-1">
            {items.map((item, idx) => {
              const isOpen = openIndex === idx;

              return (
                <article
                  key={item.question}
                  className={cn(
                    "rounded-2xl border border-transparent px-2 py-1 transition-all duration-300",
                    isOpen ? "bg-primary/8 dark:bg-primary/10" : "hover:bg-white/50 dark:hover:bg-white/5",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex((prev) => (prev === idx ? -1 : idx))}
                    className="group flex w-full items-center gap-2.5 rounded-xl px-1.5 py-2.5 text-left sm:gap-3 sm:py-3"
                    aria-expanded={isOpen}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-[11px] transition-all duration-300",
                        isOpen
                          ? "border-primary/45 bg-primary/20 text-primary shadow-[0_0_22px_rgba(16,185,129,0.2)]"
                          : "border-border bg-background text-muted-foreground group-hover:text-foreground dark:border-white/15 dark:bg-white/[0.04]",
                      )}
                    >
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", isOpen ? "rotate-180" : "rotate-[-90deg]")} />
                    </span>
                    <h3
                      className={cn(
                        "pr-1 text-[clamp(1rem,4.1vw,1.45rem)] font-black leading-[1.24] tracking-tight transition-colors duration-200 sm:pr-2",
                        isOpen ? "text-primary" : "text-foreground/85",
                      )}
                    >
                      {item.question}
                    </h3>
                  </button>

                  <div className={cn("grid transition-all duration-300 ease-out", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                    <div className="overflow-hidden">
                      <p className="pl-10 pr-2 pb-3 text-[clamp(0.92rem,3.35vw,1.04rem)] font-semibold leading-[1.68] text-muted-foreground dark:text-white/70 sm:pl-11 sm:pr-3">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="relative mt-5 rounded-2xl border border-border bg-secondary/45 p-3 text-[clamp(0.78rem,2.7vw,0.92rem)] font-semibold leading-[1.65] text-muted-foreground dark:border-white/10 dark:bg-black/20 dark:text-white/62 sm:p-3.5">
            Mulai dari gratis, pelajari pelan-pelan, lalu upgrade saat kamu sudah siap gas lebih jauh.
          </div>
        </div>
      </div>
    </section>
  );
}

export default Landing;
