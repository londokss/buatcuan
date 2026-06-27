import { Children, FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Bell, BellRing, BookOpen, CalendarIcon, Check, ChevronsUpDown, Clock, Compass, Copy, Crown, Download, Edit, Eye, FileText, Hash, Heart, Image, KeyRound, Lightbulb, Megaphone, MessageCircle, Play, Plus, Search, Sparkles, Star, Trash2, TrendingUp, Trophy, Upload, Users, Video, Wallet, Wrench, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { Link, useParams } from "react-router-dom";
import { api, assetUrl, getErrorMessage, type AdminActionLogDto, type AdminNotificationAudience, type AdminUpdateNotificationDto, type AdminUpdateTarget, type HookIdeaDto, type LandingContent, type LandingPageDto, type LessonDto, type MemberToolCategoryDto, type MemberToolDto, type MemberToolItemDto, type MentorLevel, type MentorReportDto, type MentorStatus, type PasswordResetRequestDto, type PasswordResetStatus, type UsageVideoDto, type UserMasterDto } from "@/lib/api";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { PasswordInput } from "@/components/ui/password-input";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { formatIDR, useApp } from "@/context/AppContext";
import { gradientBackground } from "@/lib/content-colors";
import { cn } from "@/lib/utils";

type AdminNotificationForm = { notificationAudience?: AdminNotificationAudience | "" };
type AdminUpdateForm = {
  target: AdminUpdateTarget;
  title: string;
  body: string;
  type: "UPDATE" | "SYSTEM" | "PAYMENT" | "COMMISSION";
  href: string;
  icon: string;
  color: string;
  sourceType: string;
  sourceId: string;
  priority: number;
};
type LessonForm = LessonDto & { sortOrder: number; isPublished: boolean } & AdminNotificationForm;
export type Option = { label: string; value: string };
type AdminToolForm = Omit<MemberToolDto, "itemCount" | "createdAt" | "updatedAt"> & { isActive: boolean } & AdminNotificationForm;
type AdminToolItemForm = Omit<MemberToolItemDto, "toolId" | "createdAt" | "updatedAt"> & AdminNotificationForm;
type AdminUsageVideoForm = UsageVideoDto & AdminNotificationForm;
type AdminHookIdeaForm = HookIdeaDto & AdminNotificationForm;
type AdminToolCategoryForm = MemberToolCategoryDto & AdminNotificationForm;
type AdminUserMasterForm = UserMasterDto & AdminNotificationForm;
type AdminUserRow = {
  id: string;
  name: string;
  wa: string;
  referralCode: string;
  role: string;
  level: string;
  balance: number;
  membershipExpiresAt?: string | null;
  vipStatus?: "FREE" | "PRO";
  activePlan?: { id: string; label: string; isFree: boolean; months: number } | null;
  mentorStatus: MentorStatus;
  mentorLevel: MentorLevel;
  mentorInactiveUntil?: string | null;
  mentorInactiveReason?: string | null;
  mentorTermsAcceptedAt?: string | null;
  mentorRatingAvg?: number | null;
  referralCount?: number;
  mentorReportCount?: number;
  joinedAt: string;
};
type AdminWithdrawalRow = {
  id: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName?: string | null;
  status: string;
  processedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  user: { name: string; wa: string };
};
type AdminPasswordResetRow = PasswordResetRequestDto;
type AdminGuidanceRow = {
  id: string;
  type: string;
  title: string;
  description: string;
  cta: string;
  colorGradient: string;
  sortOrder: number;
  isActive: boolean;
};
type GuidanceForm = {
  id: string;
  type: string;
  title: string;
  desc: string;
  cta: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
} & AdminNotificationForm;
type PlanForm = {
  id: string;
  months: number;
  price: number;
  label: string;
  desc: string;
  best: boolean;
  save: string;
  isFree: boolean;
  affiliateCommissionRate: number;
  features: string[];
  lessonIds: string[];
  toolAccess: Array<{ slug: string; dailyLimit?: number | null }>;
  guidanceAccess: string[];
  sortOrder: number;
  isActive: boolean;
} & AdminNotificationForm;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const codePattern = /^[A-Z0-9_]+$/;
const cleanText = (value?: string | null) => String(value ?? "").trim();
const optionValues = (options: Option[]) => new Set(options.map((option) => option.value));
const hasLength = (value: string | undefined | null, min: number, max: number) => {
  const length = cleanText(value).length;
  return length >= min && length <= max;
};
const isIntInRange = (value: number, min: number, max = Number.MAX_SAFE_INTEGER) => Number.isInteger(value) && value >= min && value <= max;
const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};
const isValidOptionalAssetUrl = (value?: string | null) => {
  const text = cleanText(value);
  return !text || text.startsWith("/") || isHttpUrl(text);
};
const invalid = (message: string) => {
  toast.error(message);
  return false;
};
const validateSortOrder = (value: number, label = "Urutan") => isIntInRange(value, 0) || invalid(`${label} harus angka bulat minimal 0.`);
const validateSlugValue = (value: string, label = "Slug") => slugPattern.test(cleanText(value)) || invalid(`${label} hanya boleh huruf kecil, angka, dan tanda minus; tidak boleh diawali atau diakhiri tanda minus.`);
const normalizeSlugValue = (value: string) => value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

const validateLandingPage = (page: LandingPageDto) => {
  if (!validateSlugValue(page.slug, "Slug landing")) return false;
  if (!hasLength(page.name, 2, 120)) return invalid("Nama landing wajib diisi minimal 2 karakter.");
  if (cleanText(page.description).length > 300) return invalid("Deskripsi landing maksimal 300 karakter.");
  if (cleanText(page.campaign).length > 80) return invalid("Kampanye maksimal 80 karakter.");
  if (cleanText(page.referralCode).length > 40) return invalid("Referral khusus maksimal 40 karakter.");
  if (!validateSortOrder(Number(page.sortOrder))) return false;
  const memberOptions = page.content?.memberOptions ?? [];
  if (memberOptions.length && memberOptions.some((item) => !Number.isFinite(item) || item <= 0)) return invalid("Opsi member harus berisi angka positif.");
  const commission = Number(page.content?.commissionPerMember ?? 0);
  if (!Number.isFinite(commission) || commission < 0) return invalid("Komisi per member harus angka minimal 0.");
  return true;
};

const validateUsageVideo = (form: AdminUsageVideoForm) => {
  const targetPath = cleanText(form.targetPath);
  if (!targetPath) return invalid("Target URL wajib dipilih.");
  if (targetPath === "/" || targetPath.startsWith("/l/")) return invalid("Video landing wajib diupload dari menu Landing CMS, bukan dari Video Cara Pakai.");
  if (!hasLength(form.label, 2, 60)) return invalid("Label video wajib diisi minimal 2 karakter.");
  if (!hasLength(form.title, 3, 180)) return invalid("Judul video wajib diisi minimal 3 karakter.");
  if (!hasLength(form.subtitle, 3, 260)) return invalid("Subtitle video wajib diisi minimal 3 karakter.");
  if (!hasLength(form.durationLabel, 1, 40)) return invalid("Durasi video wajib diisi.");
  if (cleanText(form.videoUrl).length > 500) return invalid("URL video manual maksimal 500 karakter.");
  if (cleanText(form.ctaLabel).length > 80) return invalid("Teks tombol maksimal 80 karakter.");
  if (cleanText(form.ctaUrl).length > 500) return invalid("Link tombol maksimal 500 karakter.");
  if (!validateSortOrder(Number(form.sortOrder))) return false;
  return true;
};

const validateLesson = (form: LessonForm) => {
  if (!hasLength(form.id, 2, 40)) return invalid("ID materi wajib diisi 2-40 karakter.");
  if (cleanText(form.sectionSlug) && !slugPattern.test(cleanText(form.sectionSlug))) return invalid("Slug section hanya boleh huruf kecil, angka, dan tanda minus.");
  if (!optionValues(categories).has(form.category)) return invalid("Kategori materi wajib dipilih.");
  if (!hasLength(form.title, 3, 180)) return invalid("Judul materi wajib diisi minimal 3 karakter.");
  if (!hasLength(form.desc, 3, 500)) return invalid("Deskripsi materi wajib diisi minimal 3 karakter.");
  if (!hasLength(form.duration, 2, 40)) return invalid("Durasi materi wajib diisi.");
  if (!optionValues(levels).has(form.level)) return invalid("Level materi wajib dipilih.");
  if (!hasLength(form.thumb, 3, 200)) return invalid("Warna materi wajib dipilih atau diisi.");
  if (!validateSortOrder(Number(form.sortOrder))) return false;
  if (!isIntInRange(Number(form.pointCost), 0)) return invalid("Biaya buka poin harus angka bulat minimal 0.");
  if (!isIntInRange(Number(form.pointReward), 0)) return invalid("Reward poin per klik harus angka bulat minimal 0.");
  if (!form.steps.map(cleanText).filter(Boolean).length) return invalid("Checklist materi wajib memiliki minimal 1 langkah.");
  return true;
};

const validateGuidance = (form: GuidanceForm) => {
  if (!optionValues(guidanceTypes).has(form.type)) return invalid("Tipe bimbingan wajib dipilih.");
  if (!hasLength(form.title, 3, 160)) return invalid("Judul bimbingan wajib diisi minimal 3 karakter.");
  if (!hasLength(form.desc, 3, 300)) return invalid("Deskripsi bimbingan wajib diisi minimal 3 karakter.");
  if (!hasLength(form.cta, 2, 80)) return invalid("CTA bimbingan wajib diisi minimal 2 karakter.");
  if (!hasLength(form.color, 3, 200)) return invalid("Warna bimbingan wajib dipilih atau diisi.");
  return validateSortOrder(Number(form.sortOrder));
};

const validateHookIdea = (form: AdminHookIdeaForm) => {
  if (!hasLength(form.title, 3, 180)) return invalid("Judul ide wajib diisi minimal 3 karakter.");
  if (!hasLength(form.openingHook, 3, 500)) return invalid("Hook pembuka wajib diisi minimal 3 karakter.");
  if (!hasLength(form.caption, 3, 1500)) return invalid("Caption wajib diisi minimal 3 karakter.");
  if (!hasLength(form.hashtags, 1, 500)) return invalid("Hashtag wajib diisi.");
  if (!hasLength(form.category, 2, 80)) return invalid("Kategori wajib diisi minimal 2 karakter.");
  if (!hasLength(form.niche, 2, 80)) return invalid("Niche wajib diisi minimal 2 karakter.");
  if (!hasLength(form.theme, 2, 80)) return invalid("Tema wajib diisi minimal 2 karakter.");
  return validateSortOrder(Number(form.sortOrder));
};

const validateToolCategory = (form: AdminToolCategoryForm) => {
  if (!validateSlugValue(form.slug, "Slug kategori")) return false;
  if (!hasLength(form.name, 2, 120)) return invalid("Nama kategori wajib diisi minimal 2 karakter.");
  if (cleanText(form.description).length > 300) return invalid("Deskripsi kategori maksimal 300 karakter.");
  if (!hasLength(form.colorGradient, 3, 200)) return invalid("Warna kategori wajib dipilih atau diisi.");
  return validateSortOrder(Number(form.sortOrder));
};

const validateTool = (form: AdminToolForm, categories: Option[]) => {
  if (!validateSlugValue(form.slug, "Slug alat bantu")) return false;
  if (!hasLength(form.name, 2, 120)) return invalid("Nama alat bantu wajib diisi minimal 2 karakter.");
  if (!hasLength(form.description, 3, 300)) return invalid("Deskripsi alat bantu wajib diisi minimal 3 karakter.");
  if (cleanText(form.categorySlug) && !optionValues(categories).has(cleanText(form.categorySlug))) return invalid("Kategori alat bantu tidak valid.");
  if (!hasLength(form.cadenceLabel, 2, 60)) return invalid("Jadwal update wajib diisi minimal 2 karakter.");
  if (!hasLength(form.icon, 2, 80)) return invalid("Icon alat bantu wajib dipilih.");
  if (!optionValues(contentTypeOptions).has(form.contentType)) return invalid("Tipe konten wajib dipilih.");
  if (!hasLength(form.colorGradient, 3, 200)) return invalid("Warna alat bantu wajib dipilih atau diisi.");
  if (!form.config || Array.isArray(form.config) || typeof form.config !== "object") return invalid("Pengaturan generator harus berupa object JSON.");
  return validateSortOrder(Number(form.sortOrder));
};

const validateToolItem = (form: AdminToolItemForm) => {
  if (!hasLength(form.title, 2, 180)) return invalid("Judul item wajib diisi minimal 2 karakter.");
  if (cleanText(form.openingHook).length > 700) return invalid("Hook / pembuka maksimal 700 karakter.");
  if (cleanText(form.content).length > 4000) return invalid("Isi utama maksimal 4000 karakter.");
  if (cleanText(form.caption).length > 2000) return invalid("Caption maksimal 2000 karakter.");
  if (cleanText(form.hashtags).length > 700) return invalid("Hashtag maksimal 700 karakter.");
  if (cleanText(form.category).length > 80) return invalid("Kategori item maksimal 80 karakter.");
  if (cleanText(form.niche).length > 80) return invalid("Niche item maksimal 80 karakter.");
  if (cleanText(form.theme).length > 80) return invalid("Tema item maksimal 80 karakter.");
  if (!isValidOptionalAssetUrl(form.mediaUrl)) return invalid("Media URL harus berupa URL lengkap atau path internal yang diawali /.");
  if (!isValidOptionalAssetUrl(form.sourceUrl)) return invalid("URL sumber harus berupa URL lengkap atau path internal yang diawali /.");
  if (!form.metadata || Array.isArray(form.metadata) || typeof form.metadata !== "object") return invalid("Metadata harus berupa object JSON.");
  return validateSortOrder(Number(form.sortOrder));
};

const validatePlan = (form: PlanForm) => {
  if (!hasLength(form.id, 2, 40)) return invalid("ID paket wajib diisi 2-40 karakter.");
  if (/\s/.test(form.id)) return invalid("ID paket tidak boleh memakai spasi.");
  if (!isIntInRange(Number(form.months), 0, 60)) return invalid("Durasi bulan harus angka bulat 0-60.");
  if (!isIntInRange(Number(form.price), 0)) return invalid("Harga harus angka bulat minimal 0.");
  if (!hasLength(form.label, 2, 80)) return invalid("Nama paket wajib diisi minimal 2 karakter.");
  if (!hasLength(form.desc, 2, 180)) return invalid("Deskripsi paket wajib diisi minimal 2 karakter.");
  if (cleanText(form.save).length > 80) return invalid("Label hemat maksimal 80 karakter.");
  if (!Number.isFinite(form.affiliateCommissionRate) || form.affiliateCommissionRate < 0 || form.affiliateCommissionRate > 1) return invalid("Komisi affiliate harus berada di antara 0% sampai 100%.");
  if (!validateSortOrder(Number(form.sortOrder))) return false;
  if ((form.features ?? []).some((feature) => !hasLength(feature, 1, 180))) return invalid("Fitur paket tidak boleh kosong dan maksimal 180 karakter.");
  const seenTools = new Set<string>();
  for (const access of form.toolAccess ?? []) {
    const slug = cleanText(access.slug);
    if (!slug) return invalid("Akses alat bantu tidak boleh kosong.");
    if (seenTools.has(slug)) return invalid(`Akses alat bantu ${slug} duplikat.`);
    seenTools.add(slug);
    if (access.dailyLimit != null && !isIntInRange(Number(access.dailyLimit), 1)) return invalid(`Limit harian ${slug} harus angka bulat minimal 1 atau dikosongkan.`);
  }
  if ((form.guidanceAccess ?? []).some((item) => !cleanText(item))) return invalid("Akses bimbingan tidak boleh kosong.");
  return true;
};

const validateUserMaster = (form: AdminUserMasterForm) => {
  const code = cleanText(form.code).toUpperCase();
  if (!codePattern.test(code) || code.length < 2 || code.length > 40) return invalid("Kode wajib 2-40 karakter, hanya huruf besar, angka, dan underscore.");
  if (!hasLength(form.label, 2, 80)) return invalid("Label wajib diisi minimal 2 karakter.");
  if (cleanText(form.description).length > 240) return invalid("Deskripsi maksimal 240 karakter.");
  return validateSortOrder(Number(form.sortOrder));
};

const validateAdminUpdate = (form: AdminUpdateForm) => {
  if (!hasLength(form.title, 2, 140)) return invalid("Judul notifikasi wajib diisi 2-140 karakter.");
  if (!hasLength(form.body, 2, 500)) return invalid("Isi notifikasi wajib diisi 2-500 karakter.");
  if (cleanText(form.href).length > 240) return invalid("Link tujuan maksimal 240 karakter.");
  if (cleanText(form.icon).length > 60) return invalid("Icon maksimal 60 karakter.");
  if (!hasLength(form.color, 3, 200)) return invalid("Warna notifikasi wajib dipilih atau diisi.");
  if (cleanText(form.sourceType).length > 60) return invalid("Sumber notifikasi maksimal 60 karakter.");
  if (cleanText(form.sourceId).length > 120) return invalid("ID/Slug sumber maksimal 120 karakter.");
  if (!isIntInRange(Number(form.priority), 0, 100)) return invalid("Prioritas harus angka bulat 0-100.");
  return true;
};

const categories: Option[] = ["TikTok", "Instagram", "YouTube", "Facebook"].map((value) => ({ label: value, value }));
const levels: Option[] = ["Beginner", "Intermediate", "Advanced"].map((value) => ({ label: value, value }));
const roles: Option[] = ["MEMBER", "MENTOR", "ADMIN"].map((value) => ({ label: value, value }));
const notificationAudienceOptions: Option[] = [
  { label: "User FREE", value: "FREE" },
  { label: "User PRO", value: "PRO" },
];
const updateTargetOptions: Option[] = [
  { label: "Semua User", value: "USER_ALL" },
  { label: "User FREE", value: "FREE" },
  { label: "User PRO", value: "PRO" },
];
const notificationTypeOptions: Option[] = [
  { label: "Update", value: "UPDATE" },
  { label: "Sistem", value: "SYSTEM" },
  { label: "Pembayaran", value: "PAYMENT" },
  { label: "Komisi", value: "COMMISSION" },
];
const guidanceTypes: Option[] = [
  { label: "WhatsApp Chat", value: "WHATSAPP_CHAT" },
  { label: "Live Class", value: "LIVE_CLASS" },
  { label: "Group Class", value: "GROUP_CLASS" },
];
const planFeaturePresets: Option[] = [
  { label: "Modul 1-3 gratis (Level 1 Basic)", value: "Modul 1-3 gratis (Level 1 Basic)" },
  { label: "Modul Belajar Khusus Gratis", value: "Modul Belajar Khusus Gratis" },
  { label: "Modul 2 Tipe Content", value: "Modul 2 Tipe Content" },
  { label: "Langkah-langkah Sampai siap jualan", value: "Langkah-langkah Sampai siap jualan" },
  { label: "Kreator 5 menit: Video+Teks dan Foto+Teks", value: "Kreator 5 menit: Video+Teks dan Foto+Teks" },
  { label: "Video onboarding harian", value: "Video onboarding harian" },
  { label: "Alat bantu gratis dengan limit harian", value: "Alat bantu gratis dengan limit harian" },
  { label: "WA Group Buletin", value: "WA Group Buletin" },
  { label: "Komisi Affiliate 10%", value: "Komisi Affiliate 10%" },
  { label: "Semua 31 Modul (Level 1-3)", value: "Semua 31 Modul (Level 1-3)" },
  { label: "Level Khusus: Affiliate", value: "Level Khusus: Affiliate" },
  { label: "Semua alat bantu premium", value: "Semua alat bantu premium" },
  { label: "Bimbingan & review konten", value: "Bimbingan & review konten" },
  { label: "Update viral tiap minggu", value: "Update viral tiap minggu" },
  { label: "Komisi Affiliate 50%", value: "Komisi Affiliate 50%" },
  { label: "Akses grup WA member", value: "Akses grup WA member" },
];
const guidanceAccessPresets: Option[] = [
  { label: "WA Group Buletin", value: "WA_BULLETIN" },
  { label: "Mentor Chat", value: "MENTOR_CHAT" },
  { label: "Review Konten", value: "CONTENT_REVIEW" },
  { label: "Live Class", value: "LIVE_CLASS" },
];
const statusOptions: Option[] = ["PENDING", "PROCESSING", "SUCCESS", "REJECTED"].map((value) => ({ label: value, value }));
const withdrawalStatusCopy: Record<string, { label: string; tone: string; title: string; desc: string; confirm: string }> = {
  PENDING: {
    label: "Pending",
    tone: "bg-yellow-500/15 text-yellow-300 border-yellow-500/20",
    title: "Kembalikan withdraw ke pending?",
    desc: "Request akan masuk antrean review lagi. Gunakan jika status sebelumnya salah pilih atau butuh verifikasi ulang.",
    confirm: "Ya, jadikan pending",
  },
  PROCESSING: {
    label: "Diproses",
    tone: "bg-sky-500/15 text-sky-300 border-sky-500/20",
    title: "Tandai withdraw sedang diproses?",
    desc: "Admin lain akan melihat request ini sedang ditangani. Pastikan data rekening sudah dicek sebelum lanjut.",
    confirm: "Ya, proses withdraw",
  },
  SUCCESS: {
    label: "Berhasil",
    tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
    title: "Setujui dan selesaikan withdraw?",
    desc: "Status akan berubah menjadi berhasil dan waktu proses akan dicatat. Pastikan transfer ke rekening member sudah benar-benar selesai.",
    confirm: "Ya, withdraw berhasil",
  },
  REJECTED: {
    label: "Ditolak",
    tone: "bg-red-500/15 text-red-300 border-red-500/20",
    title: "Tolak request withdraw?",
    desc: "Status akan berubah menjadi ditolak. Gunakan hanya jika data rekening tidak valid, saldo tidak memenuhi ketentuan, atau ada alasan operasional yang jelas.",
    confirm: "Ya, tolak withdraw",
  },
};
const passwordResetStatusCopy: Record<PasswordResetStatus, { label: string; tone: string }> = {
  PENDING: { label: "Menunggu", tone: "bg-yellow-500/15 text-yellow-300 border-yellow-500/20" },
  APPROVED: { label: "Disetujui", tone: "bg-sky-500/15 text-sky-300 border-sky-500/20" },
  USED: { label: "Dipakai", tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20" },
  EXPIRED: { label: "Expired", tone: "bg-zinc-500/15 text-zinc-300 border-zinc-500/20" },
  REJECTED: { label: "Ditolak", tone: "bg-red-500/15 text-red-300 border-red-500/20" },
};
const adminButtonTone = {
  add: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400/60 hover:bg-emerald-500/15 hover:text-emerald-200",
  save: "gradient-primary text-primary-foreground shadow-[var(--shadow-glow-sm)] hover:opacity-95",
  edit: "border-sky-500/35 bg-sky-500/10 text-sky-300 hover:border-sky-400/60 hover:bg-sky-500/15 hover:text-sky-200",
  view: "border-violet-500/35 bg-violet-500/10 text-violet-300 hover:border-violet-400/60 hover:bg-violet-500/15 hover:text-violet-200",
  download: "border-cyan-500/35 bg-cyan-500/10 text-cyan-300 hover:border-cyan-400/60 hover:bg-cyan-500/15 hover:text-cyan-200",
  reset: "border-amber-500/35 bg-amber-500/10 text-amber-300 hover:border-amber-400/60 hover:bg-amber-500/15 hover:text-amber-200",
  warning: "border-yellow-500/35 bg-yellow-500/10 text-yellow-300 hover:border-yellow-400/60 hover:bg-yellow-500/15 hover:text-yellow-200",
  delete: "border-red-500/35 bg-red-500/10 text-red-300 hover:border-red-400/60 hover:bg-red-500/15 hover:text-red-200",
  cancel: "border-white/10 bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground",
  neutral: "border-white/10 bg-secondary/50 text-foreground hover:bg-secondary",
} as const;
type AdminButtonTone = keyof typeof adminButtonTone;
export const adminButton = (tone: AdminButtonTone, className = "") => cn(adminButtonTone[tone], "disabled:cursor-not-allowed disabled:opacity-60", className);
export const adminIconButton = (tone: AdminButtonTone, className = "") => adminButton(tone, cn("h-9 w-9 p-0", className));
const mentorStatusOptions: Option[] = [
  { label: "Aktif", value: "ACTIVE" },
  { label: "Tidak aktif sementara", value: "TEMPORARILY_INACTIVE" },
  { label: "Teguran", value: "WARNING" },
  { label: "Komisi ditahan", value: "COMMISSION_HELD" },
  { label: "Diblokir", value: "BLOCKED" },
];
const mentorLevelOptions: Option[] = [
  { label: "Affiliate Baru", value: "NEW" },
  { label: "Affiliate Aktif", value: "ACTIVE" },
  { label: "Affiliate Bintang", value: "STAR" },
  { label: "Affiliate Elite", value: "ELITE" },
];
const mentorReportStatusOptions: Option[] = [
  { label: "Open", value: "OPEN" },
  { label: "Review", value: "IN_REVIEW" },
  { label: "Selesai", value: "RESOLVED" },
  { label: "Ditolak", value: "REJECTED" },
];
const vipStatusLabel = (user: Pick<AdminUserRow, "vipStatus" | "membershipExpiresAt" | "activePlan">) => {
  const isPro = user.vipStatus === "PRO" || Boolean(user.membershipExpiresAt && new Date(user.membershipExpiresAt) > new Date());
  if (!isPro) return "Gratis";
  return user.activePlan?.label ? `Pro - ${user.activePlan.label}` : "Pro";
};
function mergePresetOptions(base: Option[], values: string[]) {
  const seen = new Set(base.map((option) => option.value));
  return [
    ...base,
    ...values
      .filter((value) => !seen.has(value))
      .map((value) => ({ label: value, value })),
  ];
}
const gradientPresets = [
  "from-emerald-500 to-teal-400",
  "from-yellow-500 to-amber-400",
  "from-pink-500 to-rose-400",
  "from-violet-500 to-purple-400",
  "from-orange-500 to-amber-400",
  "from-sky-500 to-cyan-400",
  "from-zinc-500 to-neutral-400",
  "from-lime-500 to-emerald-400",
  "from-blue-500 to-cyan-400",
  "from-rose-500 to-orange-400",
  "from-indigo-500 to-pink-500",
  "from-pink-500 via-fuchsia-500 to-cyan-400",
];
const landingIconOptions: Option[] = [
  { label: "Zap", value: "zap" },
  { label: "Trending", value: "trending" },
  { label: "Users", value: "users" },
  { label: "Video", value: "video" },
  { label: "Sparkles", value: "sparkles" },
];
const toolIconOptions: Option[] = [
  "BadgeInfo",
  "BarChart3",
  "Bot",
  "CalendarDays",
  "ClipboardCheck",
  "ClipboardList",
  "Crown",
  "Hash",
  "Headphones",
  "Heart",
  "Image",
  "LifeBuoy",
  "Lightbulb",
  "ListChecks",
  "Megaphone",
  "MessageCircle",
  "MessagesSquare",
  "Music",
  "Search",
  "Trophy",
  "Type",
  "Utensils",
  "Users",
  "Video",
].map((value) => ({ label: value, value }));
const notificationIconOptions: Option[] = mergePresetOptions(toolIconOptions, [
  "Bell",
  "BellRing",
  "BookOpen",
  "Check",
  "Download",
  "FileText",
  "KeyRound",
  "Play",
  "ShieldCheck",
  "Sparkles",
  "Star",
  "Wallet",
  "Wrench",
]);
const notificationPreviewIcons: Record<string, typeof Megaphone> = {
  Bell,
  BellRing,
  BookOpen,
  Check,
  Crown,
  Download,
  FileText,
  Hash,
  Heart,
  Image,
  KeyRound,
  Lightbulb,
  Megaphone,
  MessageCircle,
  Play,
  Search,
  Sparkles,
  Star,
  Trophy,
  Users,
  Video,
  Wallet,
  Wrench,
  Zap,
};
const cadenceOptions: Option[] = ["Rutin", "Tiap hari", "Harian", "Tiap minggu", "On-demand", "Real-time"].map((value) => ({ label: value, value }));
const contentTypeOptions: Option[] = [
  { label: "Teks / Script", value: "TEXT" },
  { label: "Video Upload", value: "VIDEO" },
  { label: "Foto Upload", value: "IMAGE" },
];
const sourceTypeOptions: Option[] = [
  "ADMIN_UPDATE",
  "UsageVideo",
  "Lesson",
  "GuidanceItem",
  "HookIdea",
  "MemberTool",
  "MemberToolCategory",
  "MemberToolItem",
  "Plan",
  "Payment",
  "Withdrawal",
  "PasswordResetRequest",
  "UserRoleMaster",
  "UserLevelMaster",
].map((value) => ({ label: value, value }));
const ctaUrlOptions: Option[] = [
  { label: "Notifikasi", value: "/app/notifications" },
  { label: "Dashboard Member", value: "/app" },
  { label: "Materi", value: "/app/materi" },
  { label: "Alat Bantu", value: "/app/tools" },
  { label: "Pembayaran / Upgrade", value: "/app/payment" },
  { label: "Bimbingan", value: "/app/bimbingan" },
  { label: "Wallet", value: "/app/wallet" },
  { label: "Affiliate", value: "/app/affiliate" },
];
const itemCategoryPresets: Option[] = [
  "TikTok",
  "Instagram",
  "YouTube Shorts",
  "Affiliate",
  "Visual",
  "Audio",
  "Teks",
  "Konversi",
  "Upload",
  "Jalanan",
  "Pagi Hari",
  "Malam",
  "Lifestyle",
  "Edukasi",
  "Review",
  "Storytelling",
].map((value) => ({ label: value, value }));
const itemNichePresets: Option[] = [
  "Affiliate",
  "Beauty",
  "Edukasi",
  "Kuliner",
  "Parenting",
  "Lifestyle",
  "Bisnis",
  "Finance",
  "Motivasi",
  "Produk Digital",
  "TikTok",
  "Instagram",
  "YouTube",
  "Caption",
  "Hashtag",
  "CTA",
  "Cover",
  "Urban",
].map((value) => ({ label: value, value }));
const itemThemePresets: Option[] = [
  "Review Produk",
  "Storytelling",
  "Tutorial",
  "Before After",
  "Problem Solution",
  "Testimoni",
  "Closing",
  "Hook",
  "Caption",
  "Tagar",
  "Mood",
  "Filter",
  "Efek",
  "Sampul",
  "Rutinitas",
  "Pagi Hari",
  "Promo",
].map((value) => ({ label: value, value }));
const metadataAccessOptions: Option[] = ["FREE", "PRO"].map((value) => ({ label: value, value }));
const metadataResolutionOptions: Option[] = ["720p", "1080p", "2K", "4K"].map((value) => ({ label: value, value }));
const metadataOrientationOptions: Option[] = ["Vertical", "Horizontal", "Square"].map((value) => ({ label: value, value }));
const metadataAccentOptions: Option[] = ["emerald", "yellow", "violet", "blue", "pink", "teal", "lime", "orange", "rose"].map((value) => ({ label: value, value }));
const benefitIcons = { zap: Zap, trending: TrendingUp, TrendingUp, users: Users, Users, video: Video, Video, sparkles: Sparkles, Sparkles };
const emptyLesson: LessonForm = {
  id: "",
  displayCode: "",
  sectionSlug: "modul-cepat",
  category: "TikTok",
  title: "",
  desc: "",
  duration: "10 menit",
  level: "Beginner",
  thumb: gradientPresets[0],
  steps: ["Langkah pertama"],
  sortOrder: 0,
  isPublished: true,
  isPointLocked: false,
  pointCost: 0,
  pointReward: 1,
  notificationAudience: "",
};

const emptyLandingContent: LandingContent = {
  heroBadge: "FREE vs PRO BuatCuan",
  heroTitle: "BELAJAR BUATCUAN TIAP HARI, CUAN BERKALI-KALI.",
  heroSubtitle: "Saatnya cuan dari HP. Belajarnya gampang, alat & bahannya lengkap, ilmunya selalu update — tinggal contek, jalanin, praktekin. Coba GRATIS hari ini.",
  heroBrandTagline: "Dari nol sampai cuan — ilmunya diajarin, alatnya disediain.",
  heroValueStrip: "ILMUNYA DIAJARIN · ALAT & BAHANNYA DISEDIAIN · KOMISI OTOMATIS",
  heroMicrocopy: "✅ Gratis selamanya · ✅ Daftar cukup pakai nomor HP· ✅ Dikelola PT Akademi BuatCuan Indonesia",
  heroTertiaryCta: "▶ Lihat Cara Kerjanya",
  primaryCta: "Mulai GRATIS Sekarang",
  secondaryCta: "Sudah Punya akun? Masuk Disini",
  heroStats: [
    { value: "2.400+", label: "member belajar" },
    { value: "50%", label: "komisi PRO" },
    { value: "24/7", label: "bantuan otomatis" },
    { value: "Rp0", label: "mulai gratis" },
  ],
  previewLabel: "PREVIEW MODUL",
  previewTitle: "Strategi konten pertama",
  demoEyebrow: "Video Demo",
  demoTitle: "Platform ini kerjanya seperti apa?",
  demoSubtitle: "Tonton gambaran singkat onboarding biar kamu paham alur belajar, konten, dan cara cuannya.",
  demoVideoTitle: "Lintas cara kerja BuatCuan",
  demoVideoDuration: "3 menit",
  demoVideoNote: "Mentor bisa kirim halaman ini ke calon member.",
  demoVideoUrl: "",
  benefitsTitle: "Kenapa harus mulai sekarang?",
  benefits: [
    { icon: "zap", title: "Materi praktis", desc: "Langsung ikuti langkah yang sudah disusun." },
    { icon: "trending", title: "Fokus progres", desc: "Setiap modul punya target tindakan yang jelas." },
    { icon: "users", title: "Ada mentor", desc: "Bisa tanya saat butuh arahan." },
  ],
  infoCards: [
    { icon: "video", title: "Belajar", desc: "Step-by-step" },
    { icon: "sparkles", title: "Alat Bantu", desc: "Siap pakai" },
    { icon: "users", title: "Bimbingan", desc: "Aktif" },
  ],
  freePlanTitle: "FREE",
  freePlanPrice: "Rp0",
  freePlanDesc: "Cocok untuk coba platform dan mulai langkah awal.",
  freePlanCta: "Coba Gratis",
  freeFeatures: [
    { text: "4 alat bantu gratis", ok: true },
    { text: "Semua 24 alat bantu", ok: false },
  ],
  proPlanTitle: "PRO",
  proPlanPrice: "Rp297.000",
  proPlanDesc: "Akses penuh selama 3 bulan.",
  proPlanCta: "Mulai PRO",
  proFeatures: [
    { text: "Semua 24 alat bantu", ok: true },
    { text: "Komisi 50% berulang", ok: true },
  ],
  promoLabel: "",
  promoTitle: "",
  promoCta: "",
  testimonialsTitle: "",
  testimonials: [],
  calculatorEyebrow: "",
  calculatorTitle: "",
  calculatorSubtitle: "",
  commissionPerMember: 148500,
  memberOptions: [10, 20, 50, 100, 1000],
  finalEyebrow: "",
  finalTitle: "",
  finalSubtitle: "",
  finalCta: "",
  shareCta: "",
  footer: "© PT Akademi BuatCuan Indonesia",

  section2Title: "INI BUAT KAMU YANG PENGEN CUAN DARI HP",
  section2Intro: "Dari yang baru mulai sampai yang udah jalan — semua ada tempatnya. Soalnya di BuatCuan ada dua hal sekaligus: ilmu buat belajar dari nol, dan produk + alat buat yang pengen gas lebih cepet.",
  section2StarterTitle: "🌱 Buat yang baru mulai:",
  section2StarterItems: [
    "🤝 Affiliate pemula — udah coba tapi bingung mulai & belum nemu cara yang pas.",
    "🎬 Calon kreator konten — pengen mulai di TikTok tapi belum pede atau belum ngerti caranya.",
    "🏠 Ibu rumah tangga — pengen penghasilan tambahan tanpa ninggalin rumah.",
    "🎓 Mahasiswa & fresh graduate — mau punya pemasukan sendiri dari HP.",
    "💼 Karyawan / pekerja — nyari side income tanpa ganggu kerjaan utama.",
  ],
  section2AdvancedTitle: "🚀 Buat yang udah jalan / mau makin jago:",
  section2AdvancedItems: [
    "📹 Affiliate & kreator aktif — butuh amunisi siap pakai: video affiliate, footage, & alat AI biar makin cepet dan nggak abis ide.",
    "🛍️ Punya produk / pelaku UMKM — mau produknya makin laku lewat konten.",
    "📈 Yang mau naik level — dari sekadar bisa jadi makin mahir lewat modul lanjutan + feedback mentor.",
  ],
  section2Outro: "Modal cukup 1 HP + internet — mulai dari GRATIS, naik level kapan kamu siap.",

  section3Title: "YANG LANGSUNG BIKIN KAMU PENGEN MULAI",
  section3Intro: "",
  section3Items: [
    { title: "🔁 Cuan Berkali-kali", desc: "Sekali bikin konten, komisi bisa masuk berulang. Makin banyak teman belajar bareng, cuan makin nambah tiap bulan." },
    { title: "🧰 Alat & Bahan Disediain", desc: "Nggak mulai dari kosong. Video affiliate, footage, sampai alat bantu AI — tinggal pakai." },
    { title: "🛒 Toko Lengkap", desc: "Semua bahan konten ada di satu tempat, toko BuatCuan buka 24 jam." },
  ],
  section3Cta: "Mulai GRATIS Sekarang",

  section4Title: "CUMA 3 LANGKAH, LANGSUNG JALAN",
  section4Items: [
    { title: "1 — Belajar", desc: "Tonton video step-by-step, tinggal contek. Pelan-pelan dari nol." },
    { title: "2 — Bikin Konten", desc: "Pakai bahan & alat bantu siap pakai, upload tiap hari — tanpa harus tampil muka." },
    { title: "3 — Cuan Berkali-kali", desc: "Ajak teman belajar bareng — tiap teman yang ikut belajar lewat kamu kasih kamu komisi, dan masuk lagi tiap bulan selama mereka aktif belajar." },
  ],

  section5Title: "TOKO BUATCUAN — TINGGAL PILIH SESUAI KEBUTUHAN, LANGSUNG GAS",
  section5Intro: "Tiap yang kamu pelajarin, ada bekal siap pakainya di Toko BuatCuan — biar kamu gas lebih cepat, nggak mulai dari kosong:",
  section5Items: [
    { title: "🎬 Video Affiliate Anti-Pasaran", desc: "Video pendek 15–20 detik per produk, 1 video cuma jadi milik kamu (anti-pasaran). Pilih versi mentah (tinggal edit) atau siap upload (langsung posting)." },
    { title: "🤖 Alat Bantu AI Premium", desc: "Bantu bikin ide, hook, caption, sampai voiceover natural. Tinggal ketik produknya, AI yang racik — hemat waktu, nggak abis ide." },
    { title: "📹 Footage Video & Foto", desc: "Bahan mentah berkualitas siap edit buat konten kamu. Tinggal pilih & gabungin jadi video yang enak ditonton, tanpa harus syuting sendiri." },
    { title: "📘 Ebook & Modul", desc: "Panduan praktis yang bisa langsung dipraktekin. Dari nol sampai jago, dijelasin step-by-step biar gampang diikutin pemula." },
    { title: "🎥 Agency Livestreaming", desc: "Pelatihan jadi host live streaming. Belajar teknik nge-host, narik penonton, sampai closing jualan pas lagi live." },
  ],
  section5Note: "Teaser aja — harga & detail dibuka di dalam setelah daftar. CTA tetap Daftar GRATIS, jangan ada tombol beli di home. Item lain (buku fisik, dll.) tampil di dalam setelah daftar.",
  section5Cta: "Daftar GRATIS",

  section6Title: "SEGINI BANYAK YANG KAMU DAPET — GRATIS DULUAN",
  section6FreeTitle: "🎁 Mulai GRATIS, langsung dapat:",
  section6FreeItems: [
    "📚 Modul awal \"Cuan Pertama dari HP\" — belajar dari nol, tinggal contek",
    "💰 Dompet Link \"Komisi Saya\" langsung aktif — komisi tercatat & Semua otomatis",
    "🤖 Cobain alat bantu pintar (AI) buat ide & caption",
    "📹 Akses awal bahan konten siap pakai",
  ],
  section6UpgradeTitle: "🚀 Makin lengkap pas kamu siap upgrade:",
  section6UpgradeItems: [
    "75+ modul & 200+ video dari nol sampai jago",
    "Alat bantu AI & bahan konten lebih lega (tanpa batas wajar)",
    "Feedback akun dari mentor + komisi lebih besar",
  ],

  section7Title: "BELAJAR TIAP HARI, CUAN BERKALI-KALI",
  section7Intro: "Di BuatCuan, cuan bisa datang berulang, bukan sekali lewat:",
  section7Items: [
    "🎬 Tiap video tetap kerja buat kamu — bisa ditonton & ditemuin orang kapan aja, bahkan pas kamu rebahan.",
    "👥 Tiap teman yang kamu ajak belajar bareng = komisi yang masuk lagi tiap bulan selama mereka aktif belajar.",
    "🧠 Tiap praktek = skill yang nempel selamanya.",
  ],

  section8Title: "INI YANG BIKIN BUATCUAN BEDA",
  section8Items: [
    "🎮 Belajar serasa scroll tiktok — modul pendek & bertahap. Nggak bikin pusing.",
    "💸 Komisi cair otomatis — langsung ke rekening, tanpa nunggu konfirmasi manual.",
    "🎯 Fokus TikTok aja — nggak nyampur banyak topik yang bikin pemula overwhelm.",
    "🤖 Alat bantu AI nempel di pelajaran — bikin ide, hook, caption, sampai voiceover.",
  ],

  section9Title: "KAMU NGERASA GINI? TENANG, SEMUA ADA JAWABANNYA",
  section9Paragraph1: "Wajar kalau masih ada yang ngeganjel — pengen nambah penghasilan dari HP tapi bingung mulai, takut ribet, malu tampil muka, atau udah nyoba sendiri tapi belum nemu caranya. Tenang, kamu nggak sendirian — dan kamu nggak harus jago dulu buat mulai. Semua diajarin pelan-pelan dari nol, tinggal contek.",
  section9Paragraph2: "Soal aman? Ini beneran. Dikelola badan usaha resmi (PT Akademi BuatCuan Indonesia) dan pembayaran lewat QRIS & e-wallet. Komisinya pun simpel & jujur: kamu tinggal ajak teman belajar bareng, dan komisi datang dari produk & materi belajar yang asli — bukan dari biaya pendaftaran atau ngerekrut anggota. Nggak ada target, nggak ada paksaan.",

  section10Title: "MULAI GRATIS SEKARANG, JANGAN NUNGGU NANTI",
  section10Subtitle: "Mulai dari GRATIS. Nggak perlu modal, daftar cukup pakai nomor HP.",
  section10Items: [
    "✅ Langsung dapet akses awal + link ajak teman belajar kamu sendiri",
    "✅ Belajar dari nol, tinggal contek sampai jago",
    "✅ Mau lebih lengkap? Bisa upgrade kapan aja — santai, opsional",
  ],
  section10Cta: "Mulai GRATIS Sekarang",

  section11Title: "MASIH RAGU? INI JAWABANNYA",
  section11FaqItems: [
    { question: "Aku gaptek banget, beneran bisa?", answer: "Bisa. Semua diajarin pelan-pelan lewat video yang bisa diulang, plus ada komunitas & mentor buat nanya kapan aja." },
    { question: "Harus tampil muka, ya?", answer: "Nggak. Banyak yang mulai tanpa tampil muka — cukup rekam layar + bahan siap pakai." },
    { question: "Ini beneran aman? Bukan tipu-tipu?", answer: "Aman. BuatCuan dikelola perusahaan resmi (PT) dan pembayaran lewat QRIS & e-wallet. Komisi datang sebagai terima kasih pas teman yang kamu ajak ikut belajar bareng — santai, nggak ada target atau kewajiban apa pun." },
    { question: "Berapa lama sampai dapat hasil?", answer: "Hasil tiap orang beda-beda dan butuh proses — ini bukan janji cuan instan. Yang penting konsisten." },
    { question: "Harus bayar buat mulai?", answer: "Nggak. Mulai dari GRATIS. Mau materi lengkap & komisi lebih besar, baru upgrade ke paket lengkap." },
    { question: "Komisinya gimana cairnya?", answer: "Tercatat di Dompet \"Komisi Saya\", cair otomatis ke rekening (min. withdraw Rp50.000)." },
  ],
  section12Title: "TINGGAL SATU LANGKAH LAGI MENUJU CUAN PERTAMAMU",
  section12Subtitle: "Nggak usah nunggu sempurna — langkah pertamamu cuma SATU.",
  section12Microcopy: "Gratis · daftar cukup pakai nomor HP · bisa langsung mulai hari ini.",

  footerDisclaimer: "Hasil tiap orang berbeda tergantung praktik, konsistensi, kualitas konten & respons audiens. Ini bukan janji hasil instan. Komisi berpotensi, bukan dijamin.",
  footerCopyright: "© PT Akademi BuatCuan Indonesia",
};

const emptyLandingPage: LandingPageDto = {
  id: "",
  slug: "",
  name: "",
  description: "",
  audienceRole: "",
  campaign: "",
  referralCode: "",
  content: emptyLandingContent,
  isPublished: true,
  isDefault: false,
  sortOrder: 0,
};

const usageVideoTargets = [
  { label: "Halaman Daftar", value: "/register" },
  { label: "Sukses Daftar", value: "/register/success" },
  { label: "Halaman Masuk", value: "/login" },
  { label: "Lupa Password", value: "/forgot-password" },
  { label: "Home member", value: "/app" },
  { label: "Bahan Video", value: "/app/tools/video-footage" },
  { label: "Bahan Foto", value: "/app/tools/foto-footage" },
  { label: "Ide Hook", value: "/app/tools/ide-hook" },
  { label: "Ide Teks Foto/Video", value: "/app/tools/ide-teks-foto-video" },
  { label: "Teks Tutorial", value: "/app/tools/ide-teks-tutorial" },
  { label: "Teks Resep", value: "/app/tools/ide-teks-resep-masakan" },
  { label: "Caption & Tagar", value: "/app/tools/ide-caption-hashtag" },
  { label: "Teks Komentar", value: "/app/tools/ide-teks-komentar" },
  { label: "Musik Trending", value: "/app/tools/ide-sound-musik-trending" },
  { label: "Skrip Promosi", value: "/app/tools/script-promosi-buatcuan" },
  { label: "Closing DM & WA", value: "/app/tools/script-closing-dm-wa" },
  { label: "Ide Konten Harian", value: "/app/tools/ide-konten-harian" },
  { label: "Bank Bio & Nama Akun", value: "/app/tools/bank-bio-nama-akun" },
  { label: "Inspirasi Akun Referensi", value: "/app/tools/inspirasi-akun-referensi" },
  { label: "Panduan Komisi", value: "/app/tools/panduan-affiliate-lengkap" },
];

const emptyUsageVideo: AdminUsageVideoForm = {
  id: "",
  targetPath: "/app",
  label: "Cara Pakai",
  title: "",
  subtitle: "",
  durationLabel: "2 menit",
  videoUrl: "",
  thumbnailGradient: gradientPresets[0],
  icon: "Play",
  ctaLabel: "",
  ctaUrl: "",
  autoplay: false,
  isPublished: true,
  sortOrder: 0,
  notificationAudience: "",
};

const emptyHookIdea: AdminHookIdeaForm = {
  id: "",
  title: "",
  caption: "",
  hashtags: "",
  openingHook: "",
  category: "TikTok",
  niche: "Affiliate",
  theme: "Review Produk",
  sortOrder: 0,
  isPublished: true,
  notificationAudience: "",
};

const emptyTool: AdminToolForm = {
  id: "",
  categorySlug: "",
  slug: "",
  name: "",
  description: "",
  cadenceLabel: "Rutin",
  contentType: "TEXT",
  icon: "Lightbulb",
  colorGradient: gradientPresets[0],
  config: {},
  sortOrder: 0,
  isActive: true,
  notificationAudience: "",
};

const emptyToolCategory: AdminToolCategoryForm = {
  id: "",
  slug: "",
  name: "",
  description: "",
  colorGradient: gradientPresets[0],
  sortOrder: 0,
  isActive: true,
  notificationAudience: "",
};

const emptyToolItem: AdminToolItemForm = {
  id: "",
  title: "",
  openingHook: "",
  content: "",
  caption: "",
  hashtags: "",
  category: "",
  niche: "",
  theme: "",
  mediaUrl: "",
  mediaStoragePath: "",
  mediaOriginalName: "",
  mediaMimeType: "",
  mediaSize: null,
  sourceUrl: "",
  metadata: {},
  sortOrder: 0,
  isPublished: true,
  notificationAudience: "",
};

export const AdminOverview = () => {
  const { data: stats } = useQuery({ queryKey: ["admin-dashboard"], queryFn: api.admin.dashboard });
  const { data: users = [] } = useQuery({ queryKey: ["admin-users"], queryFn: api.admin.users.list });
  const { data: lessons = [] } = useQuery({ queryKey: ["admin-lessons"], queryFn: api.admin.lessons.list });
  const { data: withdrawals = [] } = useQuery({ queryKey: ["admin-withdrawals"], queryFn: api.admin.withdrawals.list });
  const { data: tools = [] } = useQuery({ queryKey: ["admin-tools"], queryFn: api.admin.tools.list });
  const { data: categoriesData = [] } = useQuery({ queryKey: ["admin-tool-categories"], queryFn: api.admin.toolCategories.list });
  const { data: reports = [] } = useQuery({ queryKey: ["admin-mentor-reports"], queryFn: api.admin.mentorReports.list });

  const pendingWithdrawalAmount = withdrawals
    .filter((item) => ["PENDING", "PROCESSING"].includes(item.status))
    .reduce((sum, item) => sum + item.amount, 0);
  const proUsers = users.filter((user) => user.membershipExpiresAt && new Date(user.membershipExpiresAt) > new Date()).length;
  const blockedMentors = users.filter((user) => user.mentorStatus === "BLOCKED").length;
  const warningMentors = users.filter((user) => ["WARNING", "COMMISSION_HELD"].includes(user.mentorStatus)).length;
  const openReports = reports.filter((report) => ["OPEN", "IN_REVIEW"].includes(report.status)).length;
  const draftLessons = lessons.filter((lesson) => !lesson.isPublished).length;
  const inactiveTools = tools.filter((tool) => !tool.isActive).length;

  return (
    <Page title="Admin Dashboard" desc="Pusat kontrol konten, mentor, komisi, dan fasilitas member.">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard title="Member aktif PRO" value={stats?.activeMembers ?? proUsers} desc={`${stats?.users ?? users.length} total akun`} tone="green" />
        <AdminMetricCard title="Pendapatan masuk" value={formatIDR(stats?.paidRevenue ?? 0)} desc={`${stats?.pendingPayments ?? 0} pembayaran menunggu`} tone="yellow" />
        <AdminMetricCard title="Komisi mentor" value={formatIDR(stats?.paidCommissions ?? 0)} desc={`${formatIDR(stats?.pendingCommissions ?? 0)} masih menunggu`} tone="pink" />
        <AdminMetricCard title="Klik referral hari ini" value={stats?.referralClicksToday ?? 0} desc="Sinyal promosi mentor" tone="blue" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Panel className="space-y-4">
          <SectionHeading title="Operasional Hari Ini" desc="Hal yang perlu dicek agar aplikasi member tetap rapi." />
          <div className="grid gap-3 md:grid-cols-2">
            <ActionCard
              title="Laporan mentor"
              value={openReports}
              desc={`${stats?.openMentorReports ?? reports.filter((item) => item.status === "OPEN").length} open, ${stats?.reviewMentorReports ?? reports.filter((item) => item.status === "IN_REVIEW").length} review`}
              to="/admin/master-data/users"
              cta="Cek mentor"
              urgent={openReports > 0}
            />
            <ActionCard
              title="Withdraw menunggu"
              value={stats?.pendingWithdrawals ?? 0}
              desc={`${formatIDR(pendingWithdrawalAmount)} perlu diproses`}
              to="/admin/withdrawals"
              cta="Proses withdraw"
              urgent={(stats?.pendingWithdrawals ?? 0) > 0}
            />
            <ActionCard
              title="Materi draft"
              value={stats?.draftLessons ?? draftLessons}
              desc={`${stats?.publishedLessons ?? lessons.length - draftLessons} materi tayang`}
              to="/admin/master-data/videos"
              cta="Kelola materi"
            />
            <ActionCard
              title="Alat bantu nonaktif"
              value={inactiveTools}
              desc={`${stats?.activeTools ?? tools.length - inactiveTools} alat bantu aktif dari ${stats?.tools ?? tools.length}`}
              to="/admin/tools"
              cta="Kelola alat bantu"
            />
          </div>
        </Panel>

        <Panel className="space-y-4">
          <SectionHeading title="Kesehatan Mentor" desc="Sistem mentor affiliate harus dijaga ketat." />
          <div className="grid gap-3">
            <HealthRow label="Mentor peringatan/komisi ditahan" value={stats?.warningMentors ?? warningMentors} tone="yellow" />
            <HealthRow label="Mentor diblokir" value={stats?.blockedMentors ?? blockedMentors} tone="red" />
            <HealthRow label="Kategori alat bantu aktif" value={stats?.toolCategories ?? categoriesData.length} tone="green" />
            <HealthRow label="Item alat bantu tayang" value={`${stats?.publishedToolItems ?? 0}/${stats?.toolItems ?? 0}`} tone="blue" />
          </div>
        </Panel>
      </div>

      <Panel className="space-y-4">
        <SectionHeading title="Pusat Data Aplikasi" desc="Akses cepat untuk data yang paling sering diperbarui." />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <QuickLinkCard title="Landing publik" desc={`${stats?.publishedLandingPages ?? 0}/${stats?.landingPages ?? 0} landing tayang`} to="/admin/master-data/landing" />
          <QuickLinkCard title="Video cara pakai" desc={`${stats?.publishedUsageVideos ?? 0} dari ${stats?.usageVideos ?? 0} video tampil di aplikasi`} to="/admin/master-data/usage-videos" />
          <QuickLinkCard title="Materi belajar" desc={`${stats?.lessonSections ?? 0} section, ${stats?.publishedLessons ?? 0} materi tayang`} to="/admin/master-data/videos" />
          <QuickLinkCard title="Alat bantu member" desc={`${stats?.toolCategories ?? categoriesData.length} kategori, ${stats?.toolItems ?? 0} item konten`} to="/admin/tools" />
          <QuickLinkCard title="Paket & akses" desc={`${stats?.activePlans ?? 0} paket aktif dan akses member`} to="/admin/master-data/plans" />
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel className="space-y-4">
          <SectionHeading title="Member Terbaru" desc="Pantau pendaftaran dan mentor referral." />
          <ShowMoreAdminList
            items={users.slice(0, 8)}
            empty="Belum ada user."
            initial={4}
            renderItem={(user) => (
              <div key={user.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/50 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.wa} · {user.role} · {user.referralCount ?? 0} referral</p>
                </div>
                <span className={cn("shrink-0 rounded-full px-2 py-1 text-[10px] font-bold", user.membershipExpiresAt && new Date(user.membershipExpiresAt) > new Date() ? "bg-yellow-500/15 text-yellow-300" : "bg-secondary text-muted-foreground")}>
                  {user.membershipExpiresAt && new Date(user.membershipExpiresAt) > new Date() ? "PRO" : "FREE"}
                </span>
              </div>
            )}
          />
        </Panel>

        <Panel className="space-y-4">
          <SectionHeading title="Alat Bantu Terbaru" desc="Pastikan kategori, tipe media, dan item konten sesuai halaman aplikasi member." />
          <ShowMoreAdminList
            items={tools.slice(0, 8)}
            empty="Belum ada alat bantu."
            initial={4}
            renderItem={(tool) => (
              <Link key={tool.id} to={`/admin/tools/${tool.slug}`} className="block rounded-xl bg-secondary/50 p-3 transition-colors hover:bg-secondary">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{tool.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{tool.category?.name ?? "Tanpa kategori"} · {tool.contentType} · {tool.itemCount ?? 0} item</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2 py-1 text-[10px] font-bold", tool.isActive ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground")}>
                    {tool.isActive ? "Aktif" : "Draf"}
                  </span>
                </div>
              </Link>
            )}
          />
        </Panel>
      </div>
    </Page>
  );
};

export const AdminLanding = () => {
  const qc = useQueryClient();
  const { data: pages = [], isLoading } = useQuery({ queryKey: ["admin-landing-pages"], queryFn: api.admin.landingPages.list });
  const [form, setForm] = useState<LandingPageDto | null>(null);
  const [landingVideoFile, setLandingVideoFile] = useState<File | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmLandingVideoRemove, setConfirmLandingVideoRemove] = useState(false);

  useEffect(() => {
    if (!form && pages.length) setForm(structuredClone(pages[0]));
  }, [form, pages]);

  const save = useMutation({
    mutationFn: (payload: { page: LandingPageDto; videoFile?: File | null }) => api.admin.landingPages.saveWithVideo(payload.page, payload.videoFile),
    onSuccess: (savedPage) => {
      toast.success(landingVideoFile ? "Landing dan video demo disimpan" : "Landing disimpan");
      setLandingVideoFile(null);
      setForm(structuredClone(savedPage));
      void qc.invalidateQueries({ queryKey: ["landing-content"] });
      void qc.invalidateQueries({ queryKey: ["admin-landing-pages"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal menyimpan landing")),
  });

  const remove = useMutation({
    mutationFn: api.admin.landingPages.remove,
    onSuccess: () => {
      toast.success("Landing dihapus atau dinonaktifkan");
      setConfirmId(null);
      setForm(null);
      void qc.invalidateQueries({ queryKey: ["admin-landing-pages"] });
      void qc.invalidateQueries({ queryKey: ["landing-content"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal menghapus landing")),
  });

  const removeLandingVideo = useMutation({
    mutationFn: api.admin.landingPages.removeVideo,
    onSuccess: (savedPage) => {
      toast.success("Video demo landing dihapus, preview kembali ke tampilan sementara");
      setLandingVideoFile(null);
      setConfirmLandingVideoRemove(false);
      setForm(structuredClone(savedPage));
      void qc.invalidateQueries({ queryKey: ["landing-content"] });
      void qc.invalidateQueries({ queryKey: ["admin-landing-pages"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal menghapus video demo landing")),
  });

  const activeForm = form ?? structuredClone(emptyLandingPage);
  const content = activeForm.content;
  const setContent = (next: LandingContent) => setForm({ ...activeForm, content: next });
  const patchPage = (key: keyof LandingPageDto, value: unknown) => setForm({ ...activeForm, [key]: value });
  const patch = (key: keyof LandingContent, value: unknown) => setContent({ ...content, [key]: value });

  const patchBenefit = (index: number, key: "icon" | "title" | "desc", value: string) => {
    const benefits = [...content.benefits];
    benefits[index] = { ...benefits[index], [key]: value };
    patch("benefits", benefits);
  };
  const patchInfoCard = (index: number, key: "icon" | "title" | "desc", value: string) => {
    const infoCards = [...(content.infoCards ?? emptyLandingContent.infoCards ?? [])];
    infoCards[index] = { ...infoCards[index], [key]: value };
    patch("infoCards", infoCards);
  };
  const patchTestimonial = (index: number, key: "name" | "role" | "result" | "text", value: string) => {
    const testimonials = [...content.testimonials];
    testimonials[index] = { ...testimonials[index], [key]: value };
    patch("testimonials", testimonials);
  };
  const patchLines = (key: keyof LandingContent, value: string) => {
    const lines = value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    patch(key, lines);
  };
  const patchCards = (key: keyof LandingContent, value: string) => {
    const cards = value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [title, ...rest] = line.split("|");
        return { title: (title ?? "").trim(), desc: rest.join("|").trim() };
      })
      .filter((item) => item.title || item.desc);
    patch(key, cards);
  };
  const patchFaqCards = (value: string) => {
    const items = value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [question, ...rest] = line.split("|");
        return { question: (question ?? "").trim(), answer: rest.join("|").trim() };
      })
      .filter((item) => item.question || item.answer);
    patch("section11FaqItems", items);
  };
  const createNew = () => {
    let nextNumber = pages.length + 1;
    const usedSlugs = new Set(pages.map((page) => page.slug));
    while (usedSlugs.has(`landing-${nextNumber}`)) nextNumber += 1;

    setLandingVideoFile(null);
    setForm({
      ...structuredClone(emptyLandingPage),
      id: "",
      slug: `landing-${nextNumber}`,
      name: `Landing ${nextNumber}`,
      sortOrder: nextNumber,
    });
  };

  const publish = () => {
    if (save.isPending) return;
    if (!validateLandingPage(activeForm)) return;
    save.mutate({ page: activeForm, videoFile: landingVideoFile });
  };

  return (
    <Page
      title="Landing CMS"
      desc="Buat beberapa versi landing untuk campaign, target pengunjung, atau referral tertentu."
      action={
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={createNew} className={adminButton("add")}><Plus className="w-4 h-4 mr-1" />Landing Baru</Button>
          <Button onClick={publish} disabled={save.isPending} className={adminButton("save")}>
            {save.isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      }
    >
      <div className="grid w-full gap-4 xl:grid-cols-[280px_minmax(0,1fr)_380px] 2xl:grid-cols-[300px_minmax(0,1fr)_420px]">
        <Panel className="h-auto space-y-3 self-start xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold">Versi Landing</p>
              <p className="text-xs text-muted-foreground">Pilih versi untuk diedit admin.</p>
            </div>
            <span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-bold text-muted-foreground">{pages.length} versi</span>
          </div>
          {isLoading && <p className="text-sm text-muted-foreground">Memuat landing...</p>}
          <div className="space-y-2">
            {pages.map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => {
                  setLandingVideoFile(null);
                  setForm(structuredClone(page));
                }}
                className={cn(
                  "w-full rounded-2xl border p-3 text-left transition-colors",
                  activeForm.id === page.id ? "border-primary/50 bg-primary/10 shadow-[var(--shadow-glow-sm)]" : "border-white/10 bg-secondary/40 hover:border-primary/25 hover:bg-secondary/70",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold">{page.name}</p>
                  {page.isDefault && <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">Default</span>}
                </div>
                <p className="mt-1 truncate font-mono text-xs text-muted-foreground">/l/{page.slug}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", page.isPublished ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground")}>
                    {page.isPublished ? "Tayang" : "Draf"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Urutan {page.sortOrder}</span>
                </div>
              </button>
            ))}
            {!pages.length && !isLoading && <p className="text-sm text-muted-foreground">Belum ada landing. Buat landing pertama.</p>}
          </div>
        </Panel>

        <Panel className="h-auto min-w-0 space-y-3 self-start">
          <div className="border-b border-white/10 pb-3">
            <p className="font-bold">Form Landing</p>
            <p className="text-xs text-muted-foreground">Semua pengaturan landing dalam satu kolom editor.</p>
          </div>

          <LandingFormSection title="Pengaturan Versi" desc="Target promosi dan status landing.">
            <div className="grid gap-3 rounded-2xl bg-secondary/25 p-3">
              <Field label="Nama Landing"><Input value={activeForm.name} onChange={(e) => patchPage("name", e.target.value)} /></Field>
              <Field label="Slug URL" hint="Bagian akhir alamat landing, misalnya /l/promo-tiktok. Gunakan huruf kecil, angka, dan tanda minus.">
                <Input
                  value={activeForm.slug}
                  disabled={Boolean(activeForm.id)}
                  onChange={(e) => patchPage("slug", normalizeSlugValue(e.target.value))}
                  placeholder="contoh: promo-tiktok"
                />
              </Field>
              <Field label="Kampanye" hint="Opsional. Dipakai untuk membedakan halaman promosi antar kanal atau periode."><Input value={activeForm.campaign ?? ""} onChange={(e) => patchPage("campaign", e.target.value)} placeholder="contoh: tiktok-mei" /></Field>
              <Field label="Target Pengunjung"><SearchSelect value={activeForm.audienceRole ?? ""} onChange={(value) => patchPage("audienceRole", value)} options={[{ label: "Umum", value: "" }, { label: "Member", value: "MEMBER" }, { label: "Mentor", value: "MENTOR" }]} placeholder="Pilih target" /></Field>
              <Field label="Referral Khusus"><Input value={activeForm.referralCode ?? ""} onChange={(e) => patchPage("referralCode", e.target.value.toUpperCase())} placeholder="Nomor WA atau kode referral opsional" /></Field>
              <Field label="Urutan"><Input type="number" value={activeForm.sortOrder} onChange={(e) => patchPage("sortOrder", Number(e.target.value))} /></Field>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-background/50 p-3 text-sm font-semibold">
                  <Checkbox checked={activeForm.isPublished} onCheckedChange={(checked) => patchPage("isPublished", Boolean(checked))} />
                  Tayang
                </label>
                <label className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-background/50 p-3 text-sm font-semibold">
                  <Checkbox checked={activeForm.isDefault} onCheckedChange={(checked) => patchPage("isDefault", Boolean(checked))} />
                  Jadikan default
                </label>
              </div>
              <Field label="Deskripsi">
                <Textarea value={activeForm.description ?? ""} onChange={(e) => patchPage("description", e.target.value)} placeholder="Catatan internal admin atau mentor" />
              </Field>
            </div>
            {activeForm.id && (
              <Button type="button" variant="outline" disabled={remove.isPending} onClick={() => setConfirmId(activeForm.id)} className={adminButton("delete")}>
                <Trash2 className="w-4 h-4 mr-1" />Hapus Landing
              </Button>
            )}
          </LandingFormSection>

          <LandingFormSection title="Hero" desc="Copy utama, badge, dan tombol CTA.">
            <div className="grid gap-3 rounded-2xl bg-secondary/25 p-3">
              <Field label="Badge" compact><Input value={content.heroBadge} onChange={(e) => patch("heroBadge", e.target.value)} /></Field>
              <Field label="Subtitle" compact><Input value={content.heroSubtitle} onChange={(e) => patch("heroSubtitle", e.target.value)} /></Field>
              <Field label="Headline" compact><Input value={content.heroTitle} onChange={(e) => patch("heroTitle", e.target.value)} /></Field>
              <Field label="Preview Modul" compact><Input value={content.previewTitle} onChange={(e) => patch("previewTitle", e.target.value)} /></Field>
              <Field label="CTA Utama" compact><Input value={content.primaryCta} onChange={(e) => patch("primaryCta", e.target.value)} /></Field>
              <Field label="CTA Sekunder" compact><Input value={content.secondaryCta} onChange={(e) => patch("secondaryCta", e.target.value)} /></Field>
            </div>
          </LandingFormSection>

          <LandingFormSection title="Video Demo Landing" desc="Video ini khusus landing publik dan tidak masuk ke master Video Cara Pakai. Upload file landing dari sini.">
            <div className="grid gap-3 rounded-2xl bg-secondary/25 p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {(content.heroStats ?? []).map((stat, index) => (
                  <div key={index} className="grid gap-2 rounded-xl border border-white/10 bg-background/50 p-3">
                    <Field label={`Stat ${index + 1}`} compact><Input value={stat.value} onChange={(e) => {
                      const next = [...(content.heroStats ?? [])];
                      next[index] = { ...stat, value: e.target.value };
                      patch("heroStats", next);
                    }} /></Field>
                    <Field label="Label" compact><Input value={stat.label} onChange={(e) => {
                      const next = [...(content.heroStats ?? [])];
                      next[index] = { ...stat, label: e.target.value };
                      patch("heroStats", next);
                    }} /></Field>
                  </div>
                ))}
              </div>
              <Field label="Eyebrow Demo"><Input value={content.demoEyebrow ?? ""} onChange={(e) => patch("demoEyebrow", e.target.value)} /></Field>
              <Field label="Judul Demo"><Input value={content.demoTitle ?? ""} onChange={(e) => patch("demoTitle", e.target.value)} /></Field>
              <Field label="Subtitle Demo"><Textarea value={content.demoSubtitle ?? ""} onChange={(e) => patch("demoSubtitle", e.target.value)} /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Judul Video"><Input value={content.demoVideoTitle ?? ""} onChange={(e) => patch("demoVideoTitle", e.target.value)} /></Field>
                <Field label="Durasi Video"><Input value={content.demoVideoDuration ?? ""} onChange={(e) => patch("demoVideoDuration", e.target.value)} /></Field>
              </div>
              <Field label="URL Video Demo Landing"><Input value={content.demoVideoUrl ?? ""} onChange={(e) => patch("demoVideoUrl", e.target.value)} placeholder="/uploads/videos/landing-video-..." /></Field>
              <UsageVideoDropzone
                existingUrl={content.demoVideoUrl ?? ""}
                selectedFile={landingVideoFile}
                onSelect={setLandingVideoFile}
                title="Upload Video Demo Landing"
                desc="Video ini hanya untuk landing publik. Tidak masuk ke master Video Cara Pakai."
                inputId="landing-video-upload"
              >
                {activeForm.id && content.demoVideoUrl && !landingVideoFile ? (
                  <Button type="button" size="sm" variant="outline" disabled={removeLandingVideo.isPending} onClick={() => setConfirmLandingVideoRemove(true)} className={adminButton("reset", "h-9")}>
                    <X className="mr-1 h-4 w-4" />Kembalikan ke tampilan sementara
                  </Button>
                ) : null}
              </UsageVideoDropzone>
              <Field label="Catatan Video"><Textarea value={content.demoVideoNote ?? ""} onChange={(e) => patch("demoVideoNote", e.target.value)} /></Field>
            </div>
          </LandingFormSection>

          <LandingFormSection title="Kartu Platform" desc="Tiga kartu kecil di bawah video demo pada landing publik.">
            <RepeaterAdd onClick={() => patch("infoCards", [...(content.infoCards ?? []), { icon: "sparkles", title: "", desc: "" }])}>Tambah Kartu</RepeaterAdd>
            {(content.infoCards ?? []).map((item, index) => (
              <div key={index} className="rounded-2xl border border-white/10 bg-secondary/35 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold">Kartu {index + 1}</p>
                  <Button size="sm" variant="outline" type="button" onClick={() => patch("infoCards", (content.infoCards ?? []).filter((_, i) => i !== index))} className={adminIconButton("delete")} title="Hapus kartu">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid gap-3">
                  <Field label="Icon">
                    <SearchSelect
                      value={item.icon}
                      onChange={(value) => patchInfoCard(index, "icon", value)}
                      options={landingIconOptions}
                      placeholder="Icon"
                    />
                  </Field>
                  <Field label="Judul"><Input value={item.title} onChange={(e) => patchInfoCard(index, "title", e.target.value)} placeholder="Judul" /></Field>
                  <Field label="Deskripsi"><Input value={item.desc} onChange={(e) => patchInfoCard(index, "desc", e.target.value)} placeholder="Deskripsi singkat" /></Field>
                </div>
              </div>
            ))}
          </LandingFormSection>

          <LandingFormSection title="Konten Briefing Landing" desc="Semua teks utama landing sesuai briefing. Untuk list: 1 baris = 1 item. Untuk kartu: format judul|deskripsi per baris.">
            <div className="grid gap-3 rounded-2xl bg-secondary/25 p-3">
              <Field label="Tagline Brand (dekat logo)"><Input value={content.heroBrandTagline ?? ""} onChange={(e) => patch("heroBrandTagline", e.target.value)} /></Field>
              <Field label="Strip Nilai Hero"><Input value={content.heroValueStrip ?? ""} onChange={(e) => patch("heroValueStrip", e.target.value)} /></Field>
              <Field label="Microcopy Hero"><Input value={content.heroMicrocopy ?? ""} onChange={(e) => patch("heroMicrocopy", e.target.value)} /></Field>
              <Field label="Tombol Kedua Hero"><Input value={content.heroTertiaryCta ?? ""} onChange={(e) => patch("heroTertiaryCta", e.target.value)} /></Field>

              <Field label="Section 2 - Judul"><Input value={content.section2Title ?? ""} onChange={(e) => patch("section2Title", e.target.value)} /></Field>
              <Field label="Section 2 - Intro"><Textarea value={content.section2Intro ?? ""} onChange={(e) => patch("section2Intro", e.target.value)} /></Field>
              <Field label="Section 2 - Subjudul mulai"><Input value={content.section2StarterTitle ?? ""} onChange={(e) => patch("section2StarterTitle", e.target.value)} /></Field>
              <Field label="Section 2 - Item mulai (tiap baris)"><Textarea value={(content.section2StarterItems ?? []).join("\n")} onChange={(e) => patchLines("section2StarterItems", e.target.value)} className="min-h-[120px]" /></Field>
              <Field label="Section 2 - Subjudul lanjutan"><Input value={content.section2AdvancedTitle ?? ""} onChange={(e) => patch("section2AdvancedTitle", e.target.value)} /></Field>
              <Field label="Section 2 - Item lanjutan (tiap baris)"><Textarea value={(content.section2AdvancedItems ?? []).join("\n")} onChange={(e) => patchLines("section2AdvancedItems", e.target.value)} className="min-h-[96px]" /></Field>
              <Field label="Section 2 - Penutup"><Input value={content.section2Outro ?? ""} onChange={(e) => patch("section2Outro", e.target.value)} /></Field>

              <Field label="Section 3 - Judul"><Input value={content.section3Title ?? ""} onChange={(e) => patch("section3Title", e.target.value)} /></Field>
              <Field label="Section 3 - Kartu (judul|deskripsi)"><Textarea value={(content.section3Items ?? []).map((item) => `${item.title}|${item.desc}`).join("\n")} onChange={(e) => patchCards("section3Items", e.target.value)} className="min-h-[110px]" /></Field>
              <Field label="Section 3 - Tombol"><Input value={content.section3Cta ?? ""} onChange={(e) => patch("section3Cta", e.target.value)} /></Field>

              <Field label="Section 4 - Judul"><Input value={content.section4Title ?? ""} onChange={(e) => patch("section4Title", e.target.value)} /></Field>
              <Field label="Section 4 - Kartu (judul|deskripsi)"><Textarea value={(content.section4Items ?? []).map((item) => `${item.title}|${item.desc}`).join("\n")} onChange={(e) => patchCards("section4Items", e.target.value)} className="min-h-[110px]" /></Field>

              <Field label="Section 5 - Judul"><Input value={content.section5Title ?? ""} onChange={(e) => patch("section5Title", e.target.value)} /></Field>
              <Field label="Section 5 - Intro"><Textarea value={content.section5Intro ?? ""} onChange={(e) => patch("section5Intro", e.target.value)} /></Field>
              <Field label="Section 5 - Item (judul|deskripsi)"><Textarea value={(content.section5Items ?? []).map((item) => `${item.title}|${item.desc}`).join("\n")} onChange={(e) => patchCards("section5Items", e.target.value)} className="min-h-[130px]" /></Field>
              <Field label="Section 5 - Catatan"><Textarea value={content.section5Note ?? ""} onChange={(e) => patch("section5Note", e.target.value)} /></Field>
              <Field label="Section 5 - Tombol"><Input value={content.section5Cta ?? ""} onChange={(e) => patch("section5Cta", e.target.value)} /></Field>

              <Field label="Section 6 - Judul"><Input value={content.section6Title ?? ""} onChange={(e) => patch("section6Title", e.target.value)} /></Field>
              <Field label="Section 6 - Judul Gratis"><Input value={content.section6FreeTitle ?? ""} onChange={(e) => patch("section6FreeTitle", e.target.value)} /></Field>
              <Field label="Section 6 - Item Gratis (tiap baris)"><Textarea value={(content.section6FreeItems ?? []).join("\n")} onChange={(e) => patchLines("section6FreeItems", e.target.value)} className="min-h-[110px]" /></Field>
              <Field label="Section 6 - Judul Upgrade"><Input value={content.section6UpgradeTitle ?? ""} onChange={(e) => patch("section6UpgradeTitle", e.target.value)} /></Field>
              <Field label="Section 6 - Item Upgrade (tiap baris)"><Textarea value={(content.section6UpgradeItems ?? []).join("\n")} onChange={(e) => patchLines("section6UpgradeItems", e.target.value)} className="min-h-[90px]" /></Field>

              <Field label="Section 7 - Judul"><Input value={content.section7Title ?? ""} onChange={(e) => patch("section7Title", e.target.value)} /></Field>
              <Field label="Section 7 - Intro"><Input value={content.section7Intro ?? ""} onChange={(e) => patch("section7Intro", e.target.value)} /></Field>
              <Field label="Section 7 - Item (tiap baris)"><Textarea value={(content.section7Items ?? []).join("\n")} onChange={(e) => patchLines("section7Items", e.target.value)} className="min-h-[110px]" /></Field>

              <Field label="Section 8 - Judul"><Input value={content.section8Title ?? ""} onChange={(e) => patch("section8Title", e.target.value)} /></Field>
              <Field label="Section 8 - Item (tiap baris)"><Textarea value={(content.section8Items ?? []).join("\n")} onChange={(e) => patchLines("section8Items", e.target.value)} className="min-h-[100px]" /></Field>

              <Field label="Section 9 - Judul"><Input value={content.section9Title ?? ""} onChange={(e) => patch("section9Title", e.target.value)} /></Field>
              <Field label="Section 9 - Paragraf 1"><Textarea value={content.section9Paragraph1 ?? ""} onChange={(e) => patch("section9Paragraph1", e.target.value)} className="min-h-[120px]" /></Field>
              <Field label="Section 9 - Paragraf 2"><Textarea value={content.section9Paragraph2 ?? ""} onChange={(e) => patch("section9Paragraph2", e.target.value)} className="min-h-[120px]" /></Field>

              <Field label="Section 10 - Judul"><Input value={content.section10Title ?? ""} onChange={(e) => patch("section10Title", e.target.value)} /></Field>
              <Field label="Section 10 - Subjudul"><Input value={content.section10Subtitle ?? ""} onChange={(e) => patch("section10Subtitle", e.target.value)} /></Field>
              <Field label="Section 10 - Item (tiap baris)"><Textarea value={(content.section10Items ?? []).join("\n")} onChange={(e) => patchLines("section10Items", e.target.value)} className="min-h-[100px]" /></Field>
              <Field label="Section 10 - Tombol"><Input value={content.section10Cta ?? ""} onChange={(e) => patch("section10Cta", e.target.value)} /></Field>

              <Field label="Section 11 - Judul FAQ"><Input value={content.section11Title ?? ""} onChange={(e) => patch("section11Title", e.target.value)} /></Field>
              <Field label="Section 11 - Item FAQ (pertanyaan|jawaban)"><Textarea value={(content.section11FaqItems ?? []).map((item) => `${item.question}|${item.answer}`).join("\n")} onChange={(e) => patchFaqCards(e.target.value)} className="min-h-[140px]" /></Field>
              <Field label="Section 12 - Judul"><Input value={content.section12Title ?? ""} onChange={(e) => patch("section12Title", e.target.value)} /></Field>
              <Field label="Section 12 - Subjudul"><Input value={content.section12Subtitle ?? ""} onChange={(e) => patch("section12Subtitle", e.target.value)} /></Field>
              <Field label="Section 12 - Microcopy"><Input value={content.section12Microcopy ?? ""} onChange={(e) => patch("section12Microcopy", e.target.value)} /></Field>

              <Field label="Footer Disclaimer"><Textarea value={content.footerDisclaimer ?? ""} onChange={(e) => patch("footerDisclaimer", e.target.value)} /></Field>
              <Field label="Footer Copyright"><Input value={content.footerCopyright ?? ""} onChange={(e) => patch("footerCopyright", e.target.value)} /></Field>
            </div>
          </LandingFormSection>

        </Panel>

        <LandingPreview content={content} />
      </div>
      <ConfirmDialog
        open={Boolean(confirmId)}
        setOpen={(value) => !value && setConfirmId(null)}
        title="Hapus landing?"
        desc="Jika landing default, sistem akan menonaktifkan landing agar fallback tetap aman."
        onConfirm={() => confirmId && !remove.isPending && remove.mutate(confirmId)}
        loading={remove.isPending}
      />
      <ConfirmDialog
        open={confirmLandingVideoRemove}
        setOpen={setConfirmLandingVideoRemove}
        title="Kembalikan video landing ke tampilan sementara?"
        desc="URL video demo akan dikosongkan dan file upload lama akan dihapus dari penyimpanan jika berasal dari aplikasi ini."
        onConfirm={() => activeForm.id && !removeLandingVideo.isPending && removeLandingVideo.mutate(activeForm.id)}
        loading={removeLandingVideo.isPending}
      />
    </Page>
  );
};

export const AdminUsageVideos = () => {
  const qc = useQueryClient();
  const { data: videos = [], isLoading } = useQuery({ queryKey: ["admin-usage-videos"], queryFn: api.admin.usageVideos.list });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AdminUsageVideoForm>(emptyUsageVideo);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmVideoResetId, setConfirmVideoResetId] = useState<string | null>(null);
  const groupedTargets = useMemo(() => new Set(videos.map((item) => item.targetPath)), [videos]);
  const published = videos.filter((item) => item.isPublished).length;
  const hidden = videos.length - published;
  const usageVideoColumns = useMemo<ColumnDef<UsageVideoDto>[]>(() => [
    {
      accessorKey: "targetPath",
      header: "Target URL",
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.targetPath}</span>,
    },
    {
      accessorKey: "title",
      header: "Judul",
      cell: ({ row }) => (
        <div className="min-w-[220px]">
          <p className="font-semibold">{row.original.title}</p>
          <p className="text-xs text-muted-foreground">{row.original.subtitle}</p>
        </div>
      ),
    },
    { accessorKey: "label", header: "Label" },
    { accessorKey: "durationLabel", header: "Durasi" },
    { accessorKey: "sortOrder", header: "Urutan" },
    {
      accessorKey: "isPublished",
      header: "Status",
      cell: ({ row }) => (
        <span className={cn("rounded-full px-2 py-1 text-[10px] font-bold", row.original.isPublished ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground")}>
          {row.original.isPublished ? "Tayang" : "Disembunyikan"}
        </span>
      ),
    },
    {
      id: "video",
      header: "File",
      accessorFn: (row) => row.videoUrl ?? "",
      cell: ({ row }) => (
        <span className={cn("rounded-full px-2 py-1 text-[10px] font-bold", row.original.videoUrl ? "bg-sky-500/15 text-sky-300" : "bg-secondary text-muted-foreground")}>
          {row.original.videoUrl ? "Ada video" : "Tampilan sementara"}
        </span>
      ),
    },
  ], []);

  const save = useMutation({
    mutationFn: (payload: { form: UsageVideoDto; file?: File | null }) => api.admin.usageVideos.saveWithVideo(payload.form, payload.file),
    onSuccess: () => {
      toast.success(videoFile ? "Video cara pakai dan file berhasil disimpan" : "Video cara pakai disimpan");
      setOpen(false);
      setVideoFile(null);
      void qc.invalidateQueries({ queryKey: ["admin-usage-videos"] });
      void qc.invalidateQueries({ queryKey: ["usage-videos"] });
      void qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal menyimpan video")),
  });
  const remove = useMutation({
    mutationFn: api.admin.usageVideos.remove,
    onSuccess: () => {
      toast.success("Video cara pakai dihapus");
      setConfirmId(null);
      void qc.invalidateQueries({ queryKey: ["admin-usage-videos"] });
      void qc.invalidateQueries({ queryKey: ["usage-videos"] });
      void qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal menghapus video")),
  });
  const resetVideo = useMutation({
    mutationFn: api.admin.usageVideos.removeVideo,
    onSuccess: (_data, videoId) => {
      toast.success("File video dihapus, kartu kembali memakai tampilan sementara");
      setForm((current) => current.id === videoId ? { ...current, videoUrl: "" } : current);
      setVideoFile(null);
      setConfirmVideoResetId(null);
      void qc.invalidateQueries({ queryKey: ["admin-usage-videos"] });
      void qc.invalidateQueries({ queryKey: ["usage-videos"] });
      void qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal menghapus file video")),
  });
  const edit = (video?: UsageVideoDto) => {
    setForm(video ? structuredClone(video) : structuredClone(emptyUsageVideo));
    setVideoFile(null);
    setOpen(true);
  };
  const patch = (key: keyof UsageVideoDto, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (save.isPending || !validateUsageVideo(form)) return;
    save.mutate({ form, file: videoFile });
  };

  return (
    <Page
      title="Video Cara Pakai"
      desc="Kelola video cara pakai yang tampil di home member dan halaman tool. Video landing publik diupload dari menu Landing CMS."
      action={<Button onClick={() => edit()} className={adminButton("add")}><Plus className="mr-1 h-4 w-4" />Tambah Video</Button>}
    >
      <div className="grid gap-3 md:grid-cols-4">
        <AdminMetricCard title="Total video" value={videos.length} desc="Semua konfigurasi URL" tone="blue" icon={Video} />
        <AdminMetricCard title="Tayang" value={published} desc="Tampil di aplikasi member" tone="green" icon={Check} />
        <AdminMetricCard title="Disembunyikan" value={hidden} desc="Tidak tampil di member" tone="yellow" icon={Eye} />
        <AdminMetricCard title="Target URL" value={groupedTargets.size} desc="URL yang sudah diatur" tone="purple" icon={Hash} />
      </div>

      {isLoading ? <Panel><p className="text-sm text-muted-foreground">Memuat video...</p></Panel> : null}
      <AdminDataTable
        data={videos}
        columns={usageVideoColumns}
        exportFileName="usage-videos"
        exportRows={(video) => ({
          targetPath: video.targetPath,
          label: video.label,
          title: video.title,
          subtitle: video.subtitle,
          durationLabel: video.durationLabel,
          videoUrl: video.videoUrl ?? "",
          isPublished: video.isPublished,
          autoplay: video.autoplay,
          sortOrder: video.sortOrder,
        })}
        renderDetail={(video) => (
          <div className="space-y-4">
            <DetailGrid
              items={[
                ["Target URL", video.targetPath],
                ["Label", video.label],
                ["Judul", video.title],
                ["Subtitle", video.subtitle],
                ["Durasi", video.durationLabel],
                ["Status", video.isPublished ? "Tayang" : "Disembunyikan"],
                ["Autoplay", video.autoplay ? "Ya" : "Tidak"],
                ["Urutan", String(video.sortOrder)],
                ["Video URL", video.videoUrl || "Belum ada file"],
              ]}
            />
            <div className="rounded-2xl border border-white/10 bg-secondary/35 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Preview</p>
              {video.videoUrl ? (
                <video src={assetUrl(video.videoUrl)} controls preload="metadata" className="aspect-video w-full rounded-xl bg-black object-contain" />
              ) : (
                <div className="grid aspect-video place-items-center rounded-xl text-xs font-semibold text-white/80" style={gradientBackground(video.thumbnailGradient)}>
                  Tampilan sementara tanpa file video
                </div>
              )}
            </div>
          </div>
        )}
        rowActions={(video) => (
          <>
            <Button size="sm" variant="outline" type="button" onClick={() => edit(video)} title="Edit" className={adminIconButton("edit")}>
              <Edit className="w-4 h-4" />
            </Button>
            {video.videoUrl ? (
              <Button size="sm" variant="outline" type="button" onClick={() => setConfirmVideoResetId(video.id)} title="Kembalikan ke tampilan sementara" className={adminIconButton("reset")}>
                <X className="w-4 h-4" />
              </Button>
            ) : null}
            <Button size="sm" variant="outline" type="button" onClick={() => setConfirmId(video.id)} title="Hapus" className={adminIconButton("delete")}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Video Cara Pakai" : "Tambah Video Cara Pakai"}</DialogTitle>
            <DialogDescription>Target URL menentukan lokasi kartu video tampil di aplikasi member. URL video boleh dikosongkan jika file akan diunggah dari form ini.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
            <Field label="Target URL">
              <SearchSelect value={form.targetPath} onChange={(value) => patch("targetPath", value)} options={usageVideoTargets} placeholder="Pilih URL" />
            </Field>
            <Field label="Target Custom" hint="Gunakan hanya jika halaman tujuan belum tersedia di daftar preset. Contoh: /app/tools/slug-baru.">
              <Input value={form.targetPath} onChange={(event) => patch("targetPath", event.target.value)} placeholder="/app/tools/slug-baru" />
            </Field>
            <Field label="Label"><Input value={form.label} onChange={(event) => patch("label", event.target.value)} /></Field>
            <Field label="Durasi"><Input value={form.durationLabel} onChange={(event) => patch("durationLabel", event.target.value)} placeholder="3 menit" /></Field>
            <Field label="Judul" className="md:col-span-2"><Input value={form.title} onChange={(event) => patch("title", event.target.value)} /></Field>
            <Field label="Subtitle" className="md:col-span-2"><Textarea value={form.subtitle} onChange={(event) => patch("subtitle", event.target.value)} /></Field>
            <Field label="URL Video Manual" hint="Opsional. Isi hanya jika video sudah berada di URL tertentu; jika upload file dari form ini, biarkan kosong." className="md:col-span-2"><Input value={form.videoUrl ?? ""} onChange={(event) => patch("videoUrl", event.target.value)} placeholder="/uploads/videos/cara-pakai.mp4 atau https://..." /></Field>
            <div className="md:col-span-2">
              <UsageVideoDropzone existingUrl={form.videoUrl ?? ""} selectedFile={videoFile} onSelect={setVideoFile}>
                {form.id && form.videoUrl && !videoFile ? (
                  <Button type="button" size="sm" variant="outline" disabled={resetVideo.isPending} onClick={() => setConfirmVideoResetId(form.id)} className={adminButton("reset", "h-9")}>
                    <X className="mr-1 h-4 w-4" />Kembalikan ke tampilan sementara
                  </Button>
                ) : null}
              </UsageVideoDropzone>
            </div>
            <Field label="Gradient"><GradientPicker value={form.thumbnailGradient} onChange={(value) => patch("thumbnailGradient", value)} /></Field>
            <Field label="Icon">
              <SearchSelect value={form.icon} onChange={(value) => patch("icon", value)} options={notificationIconOptions} placeholder="Pilih icon" />
            </Field>
            <Field label="Teks Tombol"><Input value={form.ctaLabel ?? ""} onChange={(event) => patch("ctaLabel", event.target.value)} placeholder="Opsional" /></Field>
            <Field label="Link Tombol">
              <SearchSelect value={form.ctaUrl ?? ""} onChange={(value) => patch("ctaUrl", value)} options={ctaUrlOptions} placeholder="Pilih tujuan" allowCustom />
            </Field>
            <Field label="Urutan"><Input type="number" value={form.sortOrder} onChange={(event) => patch("sortOrder", Number(event.target.value))} /></Field>
            <div className="grid gap-2 md:col-span-2 md:grid-cols-2">
              <label className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-secondary/30 p-3 text-sm font-semibold">
                <Checkbox checked={form.isPublished} onCheckedChange={(checked) => patch("isPublished", Boolean(checked))} />
                Tampilkan di aplikasi member
              </label>
              <label className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-secondary/30 p-3 text-sm font-semibold">
                <Checkbox checked={form.autoplay} onCheckedChange={(checked) => patch("autoplay", Boolean(checked))} />
                Autoplay saat video punya URL
              </label>
            </div>
            <AdminNotificationToggle form={form} setForm={setForm} className="md:col-span-2" />
            <DialogActions onCancel={() => setOpen(false)} loading={save.isPending} />
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={Boolean(confirmId)}
        setOpen={(value) => !value && setConfirmId(null)}
        title="Hapus video cara pakai?"
        desc="Card pada target URL ini akan memakai fallback kode jika tidak ada konfigurasi lain. Aksi ini tidak menghapus file video fisik."
        onConfirm={() => confirmId && !remove.isPending && remove.mutate(confirmId)}
        loading={remove.isPending}
      />
      <ConfirmDialog
        open={Boolean(confirmVideoResetId)}
        setOpen={(value) => !value && setConfirmVideoResetId(null)}
        title="Kembalikan video ke tampilan sementara?"
        desc="URL video akan dikosongkan dan file upload lama akan dihapus dari penyimpanan jika berasal dari aplikasi ini."
        onConfirm={() => confirmVideoResetId && !resetVideo.isPending && resetVideo.mutate(confirmVideoResetId)}
        loading={resetVideo.isPending}
      />
    </Page>
  );
};

export const AdminVideos = () => {
  const qc = useQueryClient();
  const { data: lessons = [] } = useQuery({ queryKey: ["admin-lessons"], queryFn: api.admin.lessons.list });
  const { data: plans = [] } = useQuery({ queryKey: ["admin-plans"], queryFn: api.admin.plans.list });
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmPdfRemove, setConfirmPdfRemove] = useState(false);
  const [confirmVideoRemove, setConfirmVideoRemove] = useState<{ lessonId: string; videoId?: string } | null>(null);
  const [form, setForm] = useState<LessonForm>(emptyLesson);

  const lessonColumns = useMemo<ColumnDef<LessonForm>[]>(() => [
    { accessorKey: "title", header: "Judul", cell: ({ row }) => <span className="font-semibold">{row.original.title}</span> },
    { accessorKey: "category", header: "Kategori" },
    { accessorKey: "level", header: "Level" },
    { accessorKey: "duration", header: "Durasi" },
    { accessorKey: "sortOrder", header: "Urutan" },
    {
      accessorKey: "isPublished",
      header: "Status",
      cell: ({ row }) => (
        <span className={cn("rounded-full px-2 py-1 text-[10px] font-bold", row.original.isPublished ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground")}>
          {row.original.isPublished ? "Tayang" : "Draf"}
        </span>
      ),
    },
    {
      id: "assets",
      header: "Aset",
      accessorFn: (row) => `${row.videos?.map((video) => video.originalName).join(" ") ?? row.video?.originalName ?? ""} ${row.pdf?.originalName ?? ""}`,
      cell: ({ row }) => (
        <div className="space-y-1 text-xs">
          <p>{row.original.videos?.length ? `${row.original.videos.length} sub materi` : row.original.video ? "1 sub materi" : "Belum ada video"}</p>
          <p className="text-muted-foreground">{row.original.pdf ? "PDF ada" : "Belum ada PDF"}</p>
        </div>
      ),
    },
  ], []);

  const save = useMutation({
    mutationFn: async (payload: { videoFile?: File | null; videoTitle?: string; videoDescription?: string; videoDuration?: string; videoSortOrder?: number; pdfFile?: File | null; requiredPlanId?: string }) => {
      const lesson = await api.admin.lessons.save(form);
      if (payload.videoFile) {
        await api.admin.lessons.uploadVideo(form.id, payload.videoFile, {
          title: payload.videoTitle,
          description: payload.videoDescription,
          durationLabel: payload.videoDuration,
          sortOrder: payload.videoSortOrder,
        });
      }
      if (payload.pdfFile || form.pdf) {
        await api.admin.lessons.uploadPdf(form.id, { pdf: payload.pdfFile, requiredPlanId: payload.requiredPlanId });
      }
      return lesson;
    },
    onSuccess: () => {
      toast.success("Materi disimpan");
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["admin-lessons"] });
      void qc.invalidateQueries({ queryKey: ["lessons"] });
      void qc.invalidateQueries({ queryKey: ["lesson", form.id] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal menyimpan materi video")),
  });

  const removePdf = useMutation({
    mutationFn: api.admin.lessons.removePdf,
    onSuccess: () => {
      toast.success("PDF materi dihapus, area PDF kembali kosong");
      setForm({ ...form, pdf: null });
      setConfirmPdfRemove(false);
      void qc.invalidateQueries({ queryKey: ["admin-lessons"] });
      void qc.invalidateQueries({ queryKey: ["lesson", form.id] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal menghapus PDF materi")),
  });

  const removeVideo = useMutation({
    mutationFn: ({ lessonId, videoId }: { lessonId: string; videoId?: string }) => videoId ? api.admin.lessons.removeSubVideo(lessonId, videoId) : api.admin.lessons.removeVideo(lessonId),
    onSuccess: () => {
      toast.success("Video sub materi dihapus");
      setConfirmVideoRemove(null);
      void qc.invalidateQueries({ queryKey: ["admin-lessons"] });
      void qc.invalidateQueries({ queryKey: ["lessons"] });
      void qc.invalidateQueries({ queryKey: ["lesson", form.id] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal menghapus video materi")),
  });

  const remove = useMutation({
    mutationFn: api.admin.lessons.remove,
    onSuccess: () => {
      toast.success("Materi dinonaktifkan");
      setConfirmId(null);
      void qc.invalidateQueries({ queryKey: ["admin-lessons"] });
    },
  });

  return (
    <Page title="Konten Video" desc="Kelola materi video, kategori, level akses, dan checklist praktek." action={<Button onClick={() => { setForm(emptyLesson); setOpen(true); }} className={adminButton("add")}><Plus className="w-4 h-4 mr-1" />Tambah Video</Button>}>
      <AdminDataTable
        data={lessons}
        columns={lessonColumns}
        exportFileName="admin-video"
        exportRows={(lesson) => ({
          ID: lesson.id,
          Judul: lesson.title,
          Kategori: lesson.category,
          Level: lesson.level,
          Durasi: lesson.duration,
          Urutan: lesson.sortOrder,
          Status: lesson.isPublished ? "Tayang" : "Draf",
          Warna: lesson.thumb,
          Checklist: `${lesson.steps.length} langkah`,
          "Sub Materi Video": lesson.videos?.length ?? (lesson.video ? 1 : 0),
          PDF: lesson.pdf?.originalName ?? "Belum ada PDF",
          Poin: lesson.isPointLocked ? `${lesson.pointCost} poin buka / ${lesson.pointReward} poin klik` : `Gratis / ${lesson.pointReward} poin klik`,
        })}
        rowActions={(lesson) => (
          <>
            <Button size="sm" variant="outline" type="button" onClick={() => { setForm(lesson); setOpen(true); }} title="Edit video" className={adminIconButton("edit")}><Edit className="w-4 h-4" /></Button>
            {lesson.video ? (
              <Button size="sm" variant="outline" type="button" onClick={() => { setForm(lesson); setConfirmVideoRemove({ lessonId: lesson.id, videoId: lesson.video?.id }); }} title="Hapus video pertama" className={adminIconButton("reset")}><X className="w-4 h-4" /></Button>
            ) : null}
            {lesson.pdf ? (
              <Button size="sm" variant="outline" type="button" onClick={() => { setForm(lesson); setConfirmPdfRemove(true); }} title="Kosongkan PDF materi" className={adminIconButton("reset")}><FileText className="w-4 h-4" /></Button>
            ) : null}
            <Button size="sm" variant="outline" type="button" onClick={() => setConfirmId(lesson.id)} title="Nonaktifkan video" className={adminIconButton("warning")}><Trash2 className="w-4 h-4" /></Button>
          </>
        )}
        renderDetail={(lesson) => (
          <DetailGrid items={[
            ["ID", lesson.id],
            ["Kategori", lesson.category],
            ["Level", lesson.level],
            ["Status", lesson.isPublished ? "Tayang" : "Draf"],
            ["Warna", lesson.thumb],
            ["Durasi", lesson.duration],
            ["Urutan", String(lesson.sortOrder)],
            ["Checklist", `${lesson.steps.length} langkah`],
            ["Sub Materi Video", `${lesson.videos?.length ?? (lesson.video ? 1 : 0)} video`],
            ["PDF", lesson.pdf?.originalName ?? "Belum ada PDF"],
            ["Poin", lesson.isPointLocked ? `${lesson.pointCost} poin buka / ${lesson.pointReward} poin klik` : `Gratis / ${lesson.pointReward} poin klik`],
            ["Deskripsi", lesson.desc],
          ]} />
        )}
      />
      <VideoDialog
        open={open}
        setOpen={setOpen}
        form={form}
        setForm={setForm}
        plans={plans.map((plan) => ({ label: `${plan.label} (${plan.months} bulan)`, value: plan.id }))}
        isSaving={save.isPending}
        isRemovingVideo={removeVideo.isPending}
        isRemovingPdf={removePdf.isPending}
        onRemoveVideo={(videoId) => form.id && !removeVideo.isPending && setConfirmVideoRemove({ lessonId: form.id, videoId })}
        onRemovePdf={() => form.id && !removePdf.isPending && setConfirmPdfRemove(true)}
        onSubmit={(payload) => {
          if (save.isPending || !validateLesson(form)) return;
          save.mutate(payload);
        }}
      />
      <ConfirmDialog
        open={Boolean(confirmVideoRemove)}
        setOpen={(value) => !value && setConfirmVideoRemove(null)}
        title="Hapus video sub materi?"
        desc="File video akan dihapus dari materi ini. Kartu materi tetap ada dan sub materi lain tidak ikut dihapus."
        onConfirm={() => confirmVideoRemove && !removeVideo.isPending && removeVideo.mutate(confirmVideoRemove)}
        loading={removeVideo.isPending}
      />
      <ConfirmDialog
        open={confirmPdfRemove}
        setOpen={setConfirmPdfRemove}
        title="Kosongkan PDF materi?"
        desc="File PDF akan dihapus dari materi ini. Materi tetap ada, tetapi area PDF kembali kosong sampai admin upload ulang."
        onConfirm={() => form.id && !removePdf.isPending && removePdf.mutate(form.id)}
        loading={removePdf.isPending}
      />
      <ConfirmDialog open={Boolean(confirmId)} setOpen={(v) => !v && setConfirmId(null)} title="Nonaktifkan materi?" desc="Materi tidak dihapus permanen, hanya disembunyikan dari member." onConfirm={() => confirmId && !remove.isPending && remove.mutate(confirmId)} loading={remove.isPending} />
    </Page>
  );
};

export const AdminGuidance = () => {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({ queryKey: ["admin-guidance"], queryFn: api.admin.guidance.list });
  const empty: GuidanceForm = { id: "", type: "WHATSAPP_CHAT", title: "", desc: "", cta: "", color: gradientPresets[1], sortOrder: 0, isActive: true, notificationAudience: "" };
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const guidanceColumns = useMemo<ColumnDef<AdminGuidanceRow>[]>(() => [
    { accessorKey: "title", header: "Judul", cell: ({ row }) => <span className="font-semibold">{row.original.title}</span> },
    { accessorKey: "type", header: "Tipe" },
    { accessorKey: "cta", header: "CTA" },
    { accessorKey: "sortOrder", header: "Urutan" },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <span className={cn("rounded-full px-2 py-1 text-[10px] font-bold", row.original.isActive ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground")}>
          {row.original.isActive ? "Aktif" : "Draf"}
        </span>
      ),
    },
  ], []);

  const save = useMutation({
    mutationFn: () => form.id ? api.admin.guidance.update(form.id, form) : api.admin.guidance.create(form),
    onSuccess: () => {
      toast.success("Bimbingan disimpan");
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["admin-guidance"] });
      void qc.invalidateQueries({ queryKey: ["guidance"] });
    },
  });
  const remove = useMutation({ mutationFn: api.admin.guidance.remove, onSuccess: () => { setConfirmId(null); void qc.invalidateQueries({ queryKey: ["admin-guidance"] }); } });

  return (
    <Page title="Bimbingan" desc="Kelola kartu chat mentor, live class, dan group class." action={<Button onClick={() => { setForm(empty); setOpen(true); }} className={adminButton("add")}><Plus className="w-4 h-4 mr-1" />Tambah</Button>}>
      <AdminDataTable
        data={items}
        columns={guidanceColumns}
        exportFileName="admin-bimbingan"
        exportRows={(item) => ({
          ID: item.id,
          Judul: item.title,
          Tipe: item.type,
          CTA: item.cta,
          Urutan: item.sortOrder,
          Status: item.isActive ? "Aktif" : "Draf",
          Gradient: item.colorGradient,
          Deskripsi: item.description,
        })}
        rowActions={(item) => (
          <>
            <Button size="sm" variant="outline" type="button" onClick={() => { setForm({ id: item.id, type: item.type, title: item.title, desc: item.description, cta: item.cta, color: item.colorGradient, sortOrder: item.sortOrder, isActive: item.isActive }); setOpen(true); }} title="Edit bimbingan" className={adminIconButton("edit")}><Edit className="w-4 h-4" /></Button>
            <Button size="sm" variant="outline" type="button" onClick={() => setConfirmId(item.id)} title="Hapus bimbingan" className={adminIconButton("delete")}><Trash2 className="w-4 h-4" /></Button>
          </>
        )}
        renderDetail={(item) => (
          <DetailGrid items={[
            ["ID", item.id],
            ["Tipe", item.type],
            ["Urutan", String(item.sortOrder)],
            ["Status", item.isActive ? "Aktif" : "Draf"],
            ["CTA", item.cta],
            ["Gradient", item.colorGradient],
            ["Deskripsi", item.description],
          ]} />
        )}
      />
      <GuidanceDialog open={open} setOpen={setOpen} form={form} setForm={setForm} onSubmit={() => {
        if (save.isPending || !validateGuidance(form)) return;
        save.mutate();
      }} isSaving={save.isPending} />
      <ConfirmDialog open={Boolean(confirmId)} setOpen={(v) => !v && setConfirmId(null)} title="Hapus item bimbingan?" desc="Item akan hilang dari halaman member." onConfirm={() => confirmId && !remove.isPending && remove.mutate(confirmId)} loading={remove.isPending} />
    </Page>
  );
};

export const AdminHookIdeas = () => {
  const qc = useQueryClient();
  const { data: ideas = [] } = useQuery({ queryKey: ["admin-hook-ideas"], queryFn: api.admin.hookIdeas.list });
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminHookIdeaForm>(emptyHookIdea);
  const hookIdeaColumns = useMemo<ColumnDef<HookIdeaDto>[]>(() => [
    { accessorKey: "title", header: "Judul", cell: ({ row }) => <span className="font-semibold">{row.original.title}</span> },
    { accessorKey: "category", header: "Kategori" },
    { accessorKey: "niche", header: "Niche" },
    { accessorKey: "theme", header: "Tema" },
    { accessorKey: "sortOrder", header: "Urutan" },
    {
      accessorKey: "isPublished",
      header: "Status",
      cell: ({ row }) => (
        <span className={cn("rounded-full px-2 py-1 text-[10px] font-bold", row.original.isPublished ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground")}>
          {row.original.isPublished ? "Tayang" : "Draf"}
        </span>
      ),
    },
  ], []);
  const hookCategoryOptions = useMemo(() => mergeOptions(itemCategoryPresets, ideas.map((idea) => ({ label: idea.category, value: idea.category }))), [ideas]);
  const hookNicheOptions = useMemo(() => mergeOptions(itemNichePresets, ideas.map((idea) => ({ label: idea.niche, value: idea.niche }))), [ideas]);
  const hookThemeOptions = useMemo(() => mergeOptions(itemThemePresets, ideas.map((idea) => ({ label: idea.theme, value: idea.theme }))), [ideas]);

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        title: form.title,
        caption: form.caption,
        hashtags: form.hashtags,
        openingHook: form.openingHook,
        category: form.category,
        niche: form.niche,
        theme: form.theme,
        sortOrder: form.sortOrder,
        isPublished: form.isPublished,
        notificationAudience: form.notificationAudience,
      };
      return form.id ? api.admin.hookIdeas.update(form.id, payload) : api.admin.hookIdeas.create(payload);
    },
    onSuccess: () => {
      toast.success("Ide hook disimpan");
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["admin-hook-ideas"] });
      void qc.invalidateQueries({ queryKey: ["hook-ideas"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Gagal menyimpan ide"),
  });

  const remove = useMutation({
    mutationFn: api.admin.hookIdeas.remove,
    onSuccess: () => {
      toast.success("Ide hook dihapus");
      setConfirmId(null);
      void qc.invalidateQueries({ queryKey: ["admin-hook-ideas"] });
      void qc.invalidateQueries({ queryKey: ["hook-ideas"] });
    },
  });

  return (
    <Page
      title="Ide Hook"
      desc="Kelola ide konten yang bisa digunakan mentor dan member."
      action={<Button onClick={() => { setForm({ ...emptyHookIdea, sortOrder: ideas.length + 1 }); setOpen(true); }} className={adminButton("add")}><Plus className="w-4 h-4 mr-1" />Tambah Ide</Button>}
    >
      <AdminDataTable
        data={ideas}
        columns={hookIdeaColumns}
        exportFileName="admin-ide-hook"
        exportRows={(idea) => ({
          ID: idea.id,
          Judul: idea.title,
          Kategori: idea.category,
          Niche: idea.niche,
          Tema: idea.theme,
          Urutan: idea.sortOrder,
          Status: idea.isPublished ? "Tayang" : "Draf",
          Hook: idea.openingHook,
          Caption: idea.caption,
          Hashtag: idea.hashtags,
        })}
        rowActions={(idea) => (
          <>
            <Button size="sm" variant="outline" type="button" onClick={() => { setForm(idea); setOpen(true); }} title="Edit ide hook" className={adminIconButton("edit")}><Edit className="w-4 h-4" /></Button>
            <Button size="sm" variant="outline" type="button" onClick={() => setConfirmId(idea.id)} title="Hapus ide hook" className={adminIconButton("delete")}><Trash2 className="w-4 h-4" /></Button>
          </>
        )}
        renderDetail={(idea) => (
          <DetailGrid items={[
            ["ID", idea.id],
            ["Kategori", idea.category],
            ["Niche", idea.niche],
            ["Tema", idea.theme],
            ["Status", idea.isPublished ? "Tayang" : "Draf"],
            ["Urutan", String(idea.sortOrder)],
            ["Hook", idea.openingHook],
            ["Caption", idea.caption],
            ["Hashtag", idea.hashtags],
          ]} />
        )}
      />
      <HookIdeaDialog
        open={open}
        setOpen={setOpen}
        form={form}
        setForm={setForm}
        categoryOptions={hookCategoryOptions}
        nicheOptions={hookNicheOptions}
        themeOptions={hookThemeOptions}
        onSubmit={() => {
          if (save.isPending || !validateHookIdea(form)) return;
          save.mutate();
        }}
        isSaving={save.isPending}
      />
      <ConfirmDialog open={Boolean(confirmId)} setOpen={(value) => !value && setConfirmId(null)} title="Hapus ide hook?" desc="Ide akan hilang dari halaman mentor dan member." onConfirm={() => confirmId && !remove.isPending && remove.mutate(confirmId)} loading={remove.isPending} />
    </Page>
  );
};

export const AdminTools = () => {
  const { slug } = useParams();
  return slug ? <AdminToolItems slug={slug} /> : <AdminToolList />;
};

const AdminToolList = () => {
  const qc = useQueryClient();
  const { data: tools = [] } = useQuery({ queryKey: ["admin-tools"], queryFn: api.admin.tools.list });
  const { data: categories = [] } = useQuery({ queryKey: ["admin-tool-categories"], queryFn: api.admin.toolCategories.list });
  const [open, setOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmCategoryId, setConfirmCategoryId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminToolForm>(emptyTool);
  const [categoryForm, setCategoryForm] = useState<AdminToolCategoryForm>(emptyToolCategory);
  const columns = useMemo<ColumnDef<MemberToolDto>[]>(() => [
    { accessorKey: "sortOrder", header: "#" },
    { accessorKey: "name", header: "Nama Alat Bantu", cell: ({ row }) => <Link to={`/admin/tools/${row.original.slug}`} className="font-semibold text-primary hover:underline">{row.original.name}</Link> },
    { accessorKey: "category.name", header: "Kategori", cell: ({ row }) => row.original.category?.name ?? "-" },
    { accessorKey: "cadenceLabel", header: "Jadwal" },
    { accessorKey: "contentType", header: "Tipe" },
    { accessorKey: "slug", header: "Slug" },
    { accessorKey: "itemCount", header: "Item" },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <span className={cn("rounded-full px-2 py-1 text-[10px] font-bold", row.original.isActive ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground")}>
          {row.original.isActive ? "Aktif" : "Draf"}
        </span>
      ),
    },
  ], []);
  const save = useMutation({
    mutationFn: () => api.admin.tools.save(form),
    onSuccess: () => {
      toast.success("Alat bantu disimpan");
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["admin-tools"] });
      void qc.invalidateQueries({ queryKey: ["admin-tools-nav"] });
      void qc.invalidateQueries({ queryKey: ["tools"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Gagal menyimpan alat bantu"),
  });
  const remove = useMutation({
    mutationFn: api.admin.tools.remove,
    onSuccess: (result) => {
      toast.success(result.deactivated ? "Alat bantu dinonaktifkan karena sudah punya item" : "Alat bantu dihapus");
      setConfirmId(null);
      void qc.invalidateQueries({ queryKey: ["admin-tools"] });
      void qc.invalidateQueries({ queryKey: ["admin-tools-nav"] });
      void qc.invalidateQueries({ queryKey: ["tools"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Gagal menghapus alat bantu"),
  });
  const saveCategory = useMutation({
    mutationFn: () => api.admin.toolCategories.save(categoryForm),
    onSuccess: () => {
      toast.success("Kategori alat bantu disimpan");
      setCategoryOpen(false);
      void qc.invalidateQueries({ queryKey: ["admin-tool-categories"] });
      void qc.invalidateQueries({ queryKey: ["admin-tools"] });
      void qc.invalidateQueries({ queryKey: ["admin-tools-nav"] });
      void qc.invalidateQueries({ queryKey: ["tools"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Gagal menyimpan kategori"),
  });
  const removeCategory = useMutation({
    mutationFn: api.admin.toolCategories.remove,
    onSuccess: (result) => {
      toast.success(result.deactivated ? "Kategori dinonaktifkan karena masih dipakai alat bantu" : "Kategori dihapus");
      setConfirmCategoryId(null);
      void qc.invalidateQueries({ queryKey: ["admin-tool-categories"] });
      void qc.invalidateQueries({ queryKey: ["admin-tools"] });
      void qc.invalidateQueries({ queryKey: ["admin-tools-nav"] });
      void qc.invalidateQueries({ queryKey: ["tools"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Gagal menghapus kategori"),
  });
  const activeTools = tools.filter((tool) => tool.isActive).length;
  const totalItems = tools.reduce((sum, tool) => sum + Number(tool.itemCount ?? 0), 0);
  const mediaTools = tools.filter((tool) => tool.contentType === "VIDEO" || tool.contentType === "IMAGE").length;
  const emptyTools = tools.filter((tool) => Number(tool.itemCount ?? 0) === 0).length;

  return (
    <Page
      title="Alat Bantu"
      desc="Kelola daftar alat bantu member dan urutan menu."
        action={<Button onClick={() => { setForm({ ...emptyTool, categorySlug: categories[0]?.slug ?? "", sortOrder: tools.length + 1 }); setOpen(true); }} className={adminButton("add")}><Plus className="w-4 h-4 mr-1" />Tambah Alat Bantu</Button>}
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label="Kategori Aktif" value={String(categories.filter((category) => category.isActive).length)} hint={`${categories.length} total kategori`} icon={Hash} tone="green" />
        <AdminMetricCard label="Alat Bantu Aktif" value={`${activeTools}/${tools.length}`} hint="tampil di aplikasi member" icon={Lightbulb} tone="blue" />
        <AdminMetricCard label="Item Konten" value={String(totalItems)} hint={`${mediaTools} alat bantu media`} icon={FileText} tone="purple" />
        <AdminMetricCard label="Perlu Diisi" value={String(emptyTools)} hint="alat bantu tanpa item" icon={Clock} tone={emptyTools ? "yellow" : "green"} />
      </div>
      <Panel className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SectionHeading title="Kategori Alat Bantu" desc="Kategori menentukan pengelompokan di halaman Alat Bantu member." />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setCategoryForm({ ...emptyToolCategory, sortOrder: categories.length + 1 });
              setCategoryOpen(true);
            }}
            className={adminButton("add", "shrink-0")}
          >
            <Plus className="mr-1 h-4 w-4" />Tambah Kategori
          </Button>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <div key={category.id} className="rounded-xl border border-white/10 bg-secondary/40 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-8 w-8 shrink-0 rounded-xl bg-gradient-to-br", category.colorGradient)} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{category.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{category.slug} · urutan {category.sortOrder}</p>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{category.description || "Tanpa deskripsi"}</p>
                </div>
                <span className={cn("rounded-full px-2 py-1 text-[10px] font-bold", category.isActive ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground")}>
                  {category.isActive ? "Aktif" : "Draf"}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCategoryForm({ ...emptyToolCategory, ...category, description: category.description ?? "", isActive: Boolean(category.isActive) });
                    setCategoryOpen(true);
                  }}
                  className={adminButton("edit", "h-9 flex-1")}
                >
                  <Edit className="mr-1 h-4 w-4" />Edit
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setConfirmCategoryId(category.id)} className={adminButton("delete", "h-9 w-10 p-0")} title="Hapus kategori">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <AdminDataTable
        data={tools}
        columns={columns}
        exportFileName="admin-tools"
        exportRows={(tool) => ({
          ID: tool.id,
          Urutan: tool.sortOrder,
          Kategori: tool.category?.name ?? "-",
          Nama: tool.name,
          Slug: tool.slug,
          Deskripsi: tool.description,
          Jadwal: tool.cadenceLabel,
          Tipe: tool.contentType,
          Icon: tool.icon,
          Gradient: tool.colorGradient,
          Status: tool.isActive ? "Aktif" : "Draf",
          Item: tool.itemCount,
        })}
        rowActions={(tool) => (
          <>
            <Button size="sm" variant="outline" type="button" onClick={() => { setForm({ ...tool, categorySlug: tool.categorySlug ?? "", cadenceLabel: tool.cadenceLabel ?? "Rutin", config: tool.config ?? {}, isActive: Boolean(tool.isActive) }); setOpen(true); }} title="Edit alat bantu" className={adminIconButton("edit")}><Edit className="w-4 h-4" /></Button>
            <Button size="sm" variant="outline" type="button" onClick={() => setConfirmId(tool.id)} title="Hapus alat bantu" className={adminIconButton("delete")}><Trash2 className="w-4 h-4" /></Button>
          </>
        )}
        renderDetail={(tool) => (
          <DetailGrid items={[
            ["ID", tool.id],
            ["Nama", tool.name],
            ["Kategori", tool.category?.name ?? "-"],
            ["Slug", tool.slug],
            ["Jadwal", tool.cadenceLabel],
            ["Tipe", tool.contentType],
            ["Item", String(tool.itemCount ?? 0)],
            ["Status", tool.isActive ? "Aktif" : "Draf"],
            ["Icon", tool.icon],
            ["Gradient", tool.colorGradient],
            ["Pengaturan Generator", JSON.stringify(tool.config ?? {}, null, 2)],
            ["Deskripsi", tool.description],
          ]} />
        )}
      />
      <ToolCategoryDialog open={categoryOpen} setOpen={setCategoryOpen} form={categoryForm} setForm={setCategoryForm} onSubmit={() => {
        if (saveCategory.isPending || !validateToolCategory(categoryForm)) return;
        saveCategory.mutate();
      }} isSaving={saveCategory.isPending} />
      <ToolDialog open={open} setOpen={setOpen} form={form} setForm={setForm} categories={categories.map((category) => ({ label: category.name, value: category.slug }))} onSubmit={() => {
        const categoryOptions = categories.map((category) => ({ label: category.name, value: category.slug }));
        if (save.isPending || !validateTool(form, categoryOptions)) return;
        save.mutate();
      }} isSaving={save.isPending} />
      <ConfirmDialog open={Boolean(confirmId)} setOpen={(value) => !value && setConfirmId(null)} title="Hapus alat bantu?" desc="Alat bantu tanpa item akan dihapus. Jika sudah punya item, alat bantu akan dinonaktifkan." onConfirm={() => confirmId && !remove.isPending && remove.mutate(confirmId)} loading={remove.isPending} />
      <ConfirmDialog open={Boolean(confirmCategoryId)} setOpen={(value) => !value && setConfirmCategoryId(null)} title="Hapus kategori alat bantu?" desc="Kategori tanpa alat bantu akan dihapus. Jika masih dipakai, kategori akan dinonaktifkan agar data member tetap aman." onConfirm={() => confirmCategoryId && !removeCategory.isPending && removeCategory.mutate(confirmCategoryId)} loading={removeCategory.isPending} />
    </Page>
  );
};

const AdminToolItems = ({ slug }: { slug: string }) => {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-tool-items", slug], queryFn: () => api.admin.tools.items(slug) });
  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const tool = data?.tool;
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmMediaResetId, setConfirmMediaResetId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminToolItemForm>(emptyToolItem);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const columns = useMemo<ColumnDef<MemberToolItemDto>[]>(() => [
    { accessorKey: "sortOrder", header: "#" },
    { accessorKey: "title", header: "Judul", cell: ({ row }) => <span className="font-semibold">{row.original.title}</span> },
    { accessorKey: "category", header: "Kategori", cell: ({ row }) => row.original.category ?? "-" },
    { accessorKey: "niche", header: "Niche", cell: ({ row }) => row.original.niche ?? "-" },
    { accessorKey: "theme", header: "Tema", cell: ({ row }) => row.original.theme ?? "-" },
    {
      accessorKey: "isPublished",
      header: "Status",
      cell: ({ row }) => (
        <span className={cn("rounded-full px-2 py-1 text-[10px] font-bold", row.original.isPublished ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground")}>
          {row.original.isPublished ? "Tayang" : "Draf"}
        </span>
      ),
    },
  ], []);
  const save = useMutation({
    mutationFn: async (payload?: AdminToolItemForm) => {
      const saved = await api.admin.tools.saveItem(slug, payload ?? form);
      if (mediaFile) return api.admin.tools.uploadItemMedia(saved.id, mediaFile);
      return saved;
    },
    onSuccess: () => {
      toast.success("Item alat bantu disimpan");
      setOpen(false);
      setMediaFile(null);
      void qc.invalidateQueries({ queryKey: ["admin-tool-items", slug] });
      void qc.invalidateQueries({ queryKey: ["admin-tools"] });
      void qc.invalidateQueries({ queryKey: ["admin-tools-nav"] });
      void qc.invalidateQueries({ queryKey: ["tool", slug] });
      void qc.invalidateQueries({ queryKey: ["hook-ideas"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal menyimpan item")),
  });
  const remove = useMutation({
    mutationFn: api.admin.tools.removeItem,
    onSuccess: () => {
      toast.success("Item alat bantu dihapus");
      setConfirmId(null);
      void qc.invalidateQueries({ queryKey: ["admin-tool-items", slug] });
      void qc.invalidateQueries({ queryKey: ["admin-tools"] });
      void qc.invalidateQueries({ queryKey: ["tool", slug] });
      void qc.invalidateQueries({ queryKey: ["hook-ideas"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal menghapus item")),
  });
  const resetMedia = useMutation({
    mutationFn: api.admin.tools.removeItemMedia,
    onSuccess: (_data, itemId) => {
      toast.success("File media dihapus, item kembali memakai tampilan sementara");
      if (form.id === itemId) {
        setForm({
          ...form,
          mediaUrl: "",
          mediaStoragePath: "",
          mediaOriginalName: "",
          mediaMimeType: "",
          mediaSize: null,
        });
        setMediaFile(null);
      }
      setConfirmMediaResetId(null);
      void qc.invalidateQueries({ queryKey: ["admin-tool-items", slug] });
      void qc.invalidateQueries({ queryKey: ["admin-tools"] });
      void qc.invalidateQueries({ queryKey: ["tool", slug] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal menghapus file media")),
  });
  const itemSummary = useMemo(() => {
    const metadataAccess = (item: MemberToolItemDto) => String(item.metadata?.access ?? "").toUpperCase();
    return {
      published: items.filter((item) => item.isPublished).length,
      media: items.filter((item) => item.mediaUrl || item.sourceUrl).length,
      free: items.filter((item) => metadataAccess(item) === "FREE").length,
      pro: items.filter((item) => metadataAccess(item) === "PRO").length,
      categories: new Set(items.map((item) => item.category).filter(Boolean)).size,
    };
  }, [items]);
  const itemCategoryOptions = useMemo(() => mergeOptions(itemCategoryPresets, items.map((item) => ({ label: item.category ?? "", value: item.category ?? "" }))), [items]);
  const itemNicheOptions = useMemo(() => mergeOptions(itemNichePresets, items.map((item) => ({ label: item.niche ?? "", value: item.niche ?? "" }))), [items]);
  const itemThemeOptions = useMemo(() => mergeOptions(itemThemePresets, items.map((item) => ({ label: item.theme ?? "", value: item.theme ?? "" }))), [items]);
  const contentGuide = {
    VIDEO: "Gunakan item untuk footage video. Isi kategori seperti Terbaru, Jalanan, Pagi Hari, Malam, Drone, lalu upload file atau isi URL sumber.",
    IMAGE: "Gunakan item untuk foto footage. Metadata resolusi, orientasi, dan akses FREE/PRO membantu label tampil konsisten di aplikasi member.",
    TEXT: "Gunakan item untuk template, skrip, hook, caption, atau referensi. Kategori, niche, dan tema dipakai untuk filter di aplikasi member.",
  }[tool?.contentType ?? "TEXT"];

  return (
    <Page
      title={tool?.name ?? "Alat Bantu"}
      desc={tool?.description ?? "Kelola item konten alat bantu."}
      action={<Button onClick={() => { setForm({ ...emptyToolItem, sortOrder: items.length + 1 }); setMediaFile(null); setOpen(true); }} className={adminButton("add")}><Plus className="w-4 h-4 mr-1" />Tambah Item</Button>}
    >
      <div className="mb-3">
        <BackButton to="/admin/tools" label="Semua alat bantu" />
      </div>
      <Panel className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <SectionHeading title="Kontrol Item Alat Bantu" desc={contentGuide} />
          <span className="inline-flex w-fit rounded-full bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground">
            {tool?.contentType ?? "TEXT"} · {tool?.slug ?? slug}
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <HealthRow label="Tayang" value={`${itemSummary.published}/${items.length}`} tone="green" />
          <HealthRow label="Media/Sumber" value={itemSummary.media} tone="blue" />
          <HealthRow label="FREE" value={itemSummary.free} tone="green" />
          <HealthRow label="PRO" value={itemSummary.pro} tone="yellow" />
          <HealthRow label="Kategori Item" value={itemSummary.categories} tone="blue" />
        </div>
      </Panel>
      <AdminDataTable
        data={items}
        columns={columns}
        exportFileName={`admin-${slug}`}
        exportRows={(item) => ({
          ID: item.id,
          Judul: item.title,
          Hook: item.openingHook,
          Isi: item.content,
          Caption: item.caption,
          Hashtag: item.hashtags,
          Kategori: item.category,
          Niche: item.niche,
          Tema: item.theme,
          Media: item.mediaUrl,
          "URL Sumber": item.sourceUrl,
          Metadata: JSON.stringify(item.metadata ?? {}),
          "Nama File": item.mediaOriginalName,
          Urutan: item.sortOrder,
          Status: item.isPublished ? "Tayang" : "Draf",
        })}
        rowActions={(item) => (
          <>
            <Button size="sm" variant="outline" type="button" onClick={() => { setForm({ ...emptyToolItem, ...item, openingHook: item.openingHook ?? "", caption: item.caption ?? "", hashtags: item.hashtags ?? "", category: item.category ?? "", niche: item.niche ?? "", theme: item.theme ?? "", mediaUrl: item.mediaUrl ?? "", mediaStoragePath: item.mediaStoragePath ?? "", mediaOriginalName: item.mediaOriginalName ?? "", mediaMimeType: item.mediaMimeType ?? "", mediaSize: item.mediaSize ?? null, sourceUrl: item.sourceUrl ?? "", metadata: item.metadata ?? {} }); setMediaFile(null); setOpen(true); }} title="Edit item" className={adminIconButton("edit")}><Edit className="w-4 h-4" /></Button>
            {item.mediaUrl ? (
              <Button size="sm" variant="outline" type="button" onClick={() => setConfirmMediaResetId(item.id)} title="Kembalikan media ke tampilan sementara" className={adminIconButton("reset")}><X className="w-4 h-4" /></Button>
            ) : null}
            <Button size="sm" variant="outline" type="button" onClick={() => setConfirmId(item.id)} title="Hapus item" className={adminIconButton("delete")}><Trash2 className="w-4 h-4" /></Button>
          </>
        )}
        renderDetail={(item) => (
          <DetailGrid items={[
            ["ID", item.id],
            ["Kategori", item.category ?? "-"],
            ["Niche", item.niche ?? "-"],
            ["Tema", item.theme ?? "-"],
            ["Status", item.isPublished ? "Tayang" : "Draf"],
            ["Urutan", String(item.sortOrder)],
            ["Hook", item.openingHook ?? "-"],
            ["Isi", item.content],
            ["Caption", item.caption ?? "-"],
            ["Hashtag", item.hashtags ?? "-"],
            ["Media", item.mediaUrl ?? "-"],
            ["Nama File", item.mediaOriginalName ?? "-"],
            ["URL Sumber", item.sourceUrl ?? "-"],
            ["Metadata", JSON.stringify(item.metadata ?? {}, null, 2)],
          ]} />
        )}
      />
      <ToolItemDialog
        open={open}
        setOpen={setOpen}
        form={form}
        setForm={setForm}
        contentType={tool?.contentType ?? "TEXT"}
        mediaFile={mediaFile}
        setMediaFile={setMediaFile}
        categoryOptions={itemCategoryOptions}
        nicheOptions={itemNicheOptions}
        themeOptions={itemThemeOptions}
        onResetMedia={() => form.id && !resetMedia.isPending && setConfirmMediaResetId(form.id)}
        isResettingMedia={resetMedia.isPending}
        onSubmit={(nextForm) => {
          if (save.isPending || !nextForm || !validateToolItem(nextForm)) return;
          save.mutate(nextForm);
        }}
        isSaving={save.isPending}
      />
      <ConfirmDialog
        open={Boolean(confirmMediaResetId)}
        setOpen={(value) => !value && setConfirmMediaResetId(null)}
        title="Kembalikan media alat bantu ke tampilan sementara?"
        desc="File foto/video akan dihapus dari item ini. Item tetap ada dan halaman member akan memakai tampilan sementara atau URL sumber jika tersedia."
        onConfirm={() => confirmMediaResetId && !resetMedia.isPending && resetMedia.mutate(confirmMediaResetId)}
        loading={resetMedia.isPending}
      />
      <ConfirmDialog open={Boolean(confirmId)} setOpen={(value) => !value && setConfirmId(null)} title="Hapus item alat bantu?" desc="Item akan hilang dari halaman member." onConfirm={() => confirmId && !remove.isPending && remove.mutate(confirmId)} loading={remove.isPending} />
    </Page>
  );
};

export const AdminPlans = () => {
  const qc = useQueryClient();
  const { data: plans = [] } = useQuery({ queryKey: ["admin-plans"], queryFn: api.admin.plans.list });
  const { data: lessons = [] } = useQuery({ queryKey: ["admin-lessons"], queryFn: api.admin.lessons.list });
  const { data: tools = [] } = useQuery({ queryKey: ["admin-tools"], queryFn: api.admin.tools.list });
  const { data: guidanceItems = [] } = useQuery({ queryKey: ["admin-guidance"], queryFn: api.admin.guidance.list });
  const empty: PlanForm = { id: "", months: 1, price: 0, label: "", desc: "", best: false, save: "", isFree: false, affiliateCommissionRate: 0, features: [], lessonIds: [], toolAccess: [], guidanceAccess: [], sortOrder: 0, isActive: true, notificationAudience: "" };
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const featureOptions = useMemo(() => mergeOptions(
    planFeaturePresets,
    plans.flatMap((plan) => (plan.features ?? []).map((feature) => ({ label: feature, value: feature }))),
  ), [plans]);
  const lessonOptions = useMemo(() => lessons.map((lesson) => ({ label: `${lesson.id} - ${lesson.title}`, value: lesson.id })), [lessons]);
  const toolOptions = useMemo(() => tools.map((tool) => ({ label: `${tool.name} (${tool.slug})`, value: tool.slug })), [tools]);
  const guidanceOptions = useMemo(() => mergeOptions(
    guidanceAccessPresets,
    guidanceItems.map((item) => ({ label: item.title, value: guidanceAccessCode(item.type) })),
  ), [guidanceItems]);
  const save = useMutation({
    mutationFn: () => api.admin.plans.save(form),
    onSuccess: () => {
      toast.success("Paket disimpan");
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["admin-plans"] });
      void qc.invalidateQueries({ queryKey: ["plans"] });
    },
  });
  const remove = useMutation({
    mutationFn: api.admin.plans.remove,
    onSuccess: (result) => {
      toast.success(result.deactivated ? "Paket dinonaktifkan karena sudah punya transaksi" : "Paket dihapus");
      setConfirmId(null);
      void qc.invalidateQueries({ queryKey: ["admin-plans"] });
      void qc.invalidateQueries({ queryKey: ["plans"] });
    },
  });

  return (
    <Page title="Paket Membership" desc="Kelola harga, durasi, label hemat, dan status paket." action={<Button onClick={() => { setForm(empty); setOpen(true); }} className={adminButton("add")}><Plus className="w-4 h-4 mr-1" />Tambah Paket</Button>}>
      <DataGrid>{plans.map((plan) => (
        <Row
          key={plan.id}
          title={plan.label}
          details={[
            ["Harga", formatIDR(Number(plan.price))],
            ["Durasi", plan.isFree ? "Selamanya" : `${plan.months} bulan`],
            ["Komisi", `${Math.round(Number(plan.affiliateCommissionRate ?? 0) * 100)}%`],
            ["Akses Materi", `${plan.lessonIds?.length ?? 0} materi`],
            ["Akses Alat Bantu", `${plan.toolAccess?.length ?? 0} item`],
            ["Tipe", plan.isBest ? "Unggulan" : "Reguler"],
            ["Paket Gratis", plan.isFree ? "Ya" : "Tidak"],
            ["Status", plan.isActive ? "Aktif" : "Draf"],
            ["Label Hemat", plan.saveLabel ?? "-"],
            ["Urutan", String(plan.sortOrder)],
          ]}
        >
          <Button size="sm" variant="outline" onClick={() => { setForm({ id: plan.id, months: plan.months, price: Number(plan.price), label: plan.label, desc: plan.desc, best: plan.isBest, save: plan.saveLabel ?? "", isFree: plan.isFree, affiliateCommissionRate: Number(plan.affiliateCommissionRate ?? 0), features: plan.features ?? [], lessonIds: plan.lessonIds ?? [], toolAccess: plan.toolAccess ?? [], guidanceAccess: plan.guidanceAccess ?? [], sortOrder: plan.sortOrder, isActive: plan.isActive }); setOpen(true); }} className={adminIconButton("edit")}><Edit className="w-4 h-4" /></Button>
          <Button size="sm" variant="outline" onClick={() => setConfirmId(plan.id)} className={adminIconButton("delete")}><Trash2 className="w-4 h-4" /></Button>
        </Row>
      ))}</DataGrid>
      <PlanDialog
        open={open}
        setOpen={setOpen}
        form={form}
        setForm={setForm}
        featureOptions={featureOptions}
        lessonOptions={lessonOptions}
        toolOptions={toolOptions}
        guidanceOptions={guidanceOptions}
        onSubmit={() => {
          if (save.isPending || !validatePlan(form)) return;
          save.mutate();
        }}
        isSaving={save.isPending}
      />
      <ConfirmDialog open={Boolean(confirmId)} setOpen={(v) => !v && setConfirmId(null)} title="Hapus paket?" desc="Paket tanpa transaksi akan dihapus permanen. Jika sudah punya transaksi, paket akan dinonaktifkan agar histori pembayaran tetap aman." onConfirm={() => confirmId && !remove.isPending && remove.mutate(confirmId)} loading={remove.isPending} />
    </Page>
  );
};

export const AdminUsers = () => {
  const qc = useQueryClient();
  const { data: users = [] } = useQuery({ queryKey: ["admin-users"], queryFn: api.admin.users.list });
  const { data: mentorReports = [] } = useQuery({ queryKey: ["admin-mentor-reports"], queryFn: api.admin.mentorReports.list });
  const { data: roleMasters = [] } = useQuery({ queryKey: ["admin-user-roles"], queryFn: api.admin.userRoles.list });
  const { data: levelMasters = [] } = useQuery({ queryKey: ["admin-user-levels"], queryFn: api.admin.userLevels.list });
  const roleOptions = useMemo(() => roleMasters.filter((role) => role.isActive).map((role) => ({ label: role.label, value: role.code })), [roleMasters]);
  const levelOptions = useMemo(() => levelMasters.filter((level) => level.isActive).map((level) => ({ label: level.label, value: level.code })), [levelMasters]);
  const update = useMutation({ mutationFn: ({ id, role, level }: { id: string; role?: string; level?: string }) => api.admin.users.update(id, { role, level }), onSuccess: () => { toast.success("User diupdate"); void qc.invalidateQueries({ queryKey: ["admin-users"] }); } });
  const updateMentor = useMutation({
    mutationFn: ({ id, mentorStatus, mentorLevel }: { id: string; mentorStatus?: MentorStatus; mentorLevel?: MentorLevel }) => api.admin.users.updateMentorStatus(id, { mentorStatus, mentorLevel }),
    onSuccess: () => {
      toast.success("Status affiliate diupdate");
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
      void qc.invalidateQueries({ queryKey: ["admin-mentor-reports"] });
    },
  });
  const updateReport = useMutation({
    mutationFn: ({ id, status, mentorStatus }: { id: string; status: MentorReportDto["status"]; mentorStatus?: MentorStatus }) => api.admin.mentorReports.update(id, { status, mentorStatus }),
    onSuccess: () => {
      toast.success("Laporan mentor diupdate");
      void qc.invalidateQueries({ queryKey: ["admin-mentor-reports"] });
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
  const downloadEvidence = useMutation({
    mutationFn: async (report: MentorReportDto) => {
      const blob = await api.admin.mentorReports.evidence(report.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = report.evidenceOriginalName || `bukti-laporan-${report.id}.jpg`;
      anchor.click();
      URL.revokeObjectURL(url);
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal mengunduh bukti laporan")),
  });
  const columns = useMemo<ColumnDef<AdminUserRow>[]>(() => [
    { accessorKey: "name", header: "Nama", cell: ({ row }) => <span className="font-semibold">{row.original.name}</span> },
    { accessorKey: "wa", header: "Telepon" },
    {
      accessorKey: "role",
      header: "Role Sistem",
      cell: ({ row }) => <SearchSelect value={row.original.role} onChange={(role) => !update.isPending && update.mutate({ id: row.original.id, role })} options={roleOptions} placeholder="Pilih peran" disabled={update.isPending} />,
    },
    {
      accessorKey: "level",
      header: "Level",
      cell: ({ row }) => <SearchSelect value={row.original.level} onChange={(level) => !update.isPending && update.mutate({ id: row.original.id, level })} options={levelOptions} placeholder="Level" disabled={update.isPending} />,
    },
    {
      id: "vipStatus",
      accessorFn: vipStatusLabel,
      header: "Status VIP",
      cell: ({ row }) => {
        const isPro = vipStatusLabel(row.original) !== "Gratis";
        return (
          <span className={cn("inline-flex max-w-[180px] items-center rounded-full px-3 py-1 text-xs font-black", isPro ? "bg-emerald-500/15 text-emerald-300" : "bg-secondary text-muted-foreground")}>
            <Crown className={cn("mr-1.5 h-3.5 w-3.5", !isPro && "opacity-50")} />
            <span className="truncate">{vipStatusLabel(row.original)}</span>
          </span>
        );
      },
    },
    {
      accessorKey: "mentorStatus",
      header: "Status Affiliate",
      cell: ({ row }) => (
        <SearchSelect
          value={row.original.mentorStatus}
          onChange={(mentorStatus) => !updateMentor.isPending && updateMentor.mutate({ id: row.original.id, mentorStatus: mentorStatus as MentorStatus })}
          options={mentorStatusOptions}
          placeholder="Status"
          disabled={updateMentor.isPending}
        />
      ),
    },
    {
      accessorKey: "mentorLevel",
      header: "Level Affiliate",
      cell: ({ row }) => (
        <SearchSelect
          value={row.original.mentorLevel}
          onChange={(mentorLevel) => !updateMentor.isPending && updateMentor.mutate({ id: row.original.id, mentorLevel: mentorLevel as MentorLevel })}
          options={mentorLevelOptions}
          placeholder="Level affiliate"
          disabled={updateMentor.isPending}
        />
      ),
    },
    { accessorKey: "balance", header: "Saldo", cell: ({ row }) => formatIDR(row.original.balance) },
    { accessorKey: "referralCode", header: "Referral" },
  ], [levelOptions, roleOptions, update, updateMentor]);

  return (
    <Page title="User & Akses" desc="Kelola role sistem, status VIP Gratis/Pro, plan aktif, dan penanganan affiliate.">
      <Panel className="mb-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-bold">Laporan Mentor Affiliate</p>
            <p className="text-xs text-muted-foreground">Review laporan member yang merasa ditinggal mentor. Jika terbukti, admin bisa memberi teguran, menahan komisi, atau blokir.</p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground">{mentorReports.length} laporan</span>
        </div>
        <ShowMoreAdminList
          items={mentorReports}
          empty="Belum ada laporan mentor."
          renderItem={(report) => (
            <div key={report.id} className="rounded-xl border border-border bg-secondary/40 p-3">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
                <div className="min-w-0">
                  <p className="text-sm font-bold">{report.member?.name ?? "Member"} melaporkan {report.mentor?.name ?? "Mentor"}</p>
                  <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{report.reason}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-muted-foreground">
                    <span>Member: {report.member?.wa ?? "-"}</span>
                    <span>Mentor: {report.mentor?.wa ?? "-"}</span>
                    <span>{format(new Date(report.createdAt), "dd MMM yyyy HH:mm")}</span>
                    <span>Bukti: {report.evidenceOriginalName ?? "-"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <SearchSelect
                    value={report.status}
                    onChange={(status) => !updateReport.isPending && updateReport.mutate({ id: report.id, status: status as MentorReportDto["status"] })}
                    options={mentorReportStatusOptions}
                    placeholder="Status laporan"
                    disabled={updateReport.isPending}
                  />
                  <Button type="button" variant="outline" className={adminButton("download", "h-10 w-full rounded-xl")} disabled={!report.evidenceOriginalName || downloadEvidence.isPending} onClick={() => downloadEvidence.mutate(report)}>
                    <Download className="mr-2 h-4 w-4" />
                    Bukti WA
                  </Button>
                </div>
                <SearchSelect
                  value={report.mentor?.mentorStatus ?? "ACTIVE"}
                  onChange={(mentorStatus) => !updateReport.isPending && updateReport.mutate({ id: report.id, status: report.status, mentorStatus: mentorStatus as MentorStatus })}
                  options={mentorStatusOptions}
                  placeholder="Aksi mentor"
                  disabled={updateReport.isPending}
                />
              </div>
            </div>
          )}
        />
      </Panel>
      <AdminDataTable
        data={users}
        columns={columns}
        exportFileName="admin-user"
        exportRows={(user) => ({
          ID: user.id,
          Nama: user.name,
          Telepon: user.wa,
          "Role Sistem": user.role,
          Level: user.level,
          "Status VIP": vipStatusLabel(user),
          "Status Affiliate": user.mentorStatus,
          "Level Affiliate": user.mentorLevel,
          "Referral Aktif": user.referralCount ?? 0,
          "Laporan Mentor": user.mentorReportCount ?? 0,
          Saldo: user.balance,
          Referral: user.referralCode,
          "Membership Expiry": user.membershipExpiresAt ? format(new Date(user.membershipExpiresAt), "dd MMM yyyy") : "-",
          "Tanggal Gabung": format(new Date(user.joinedAt), "dd MMM yyyy"),
        })}
        renderDetail={(user) => (
          <DetailGrid
            items={[
              ["User ID", user.id],
              ["Nama", user.name],
              ["Telepon", user.wa],
              ["Role Sistem", user.role],
              ["Level", user.level],
              ["Status VIP", vipStatusLabel(user)],
              ["Plan VIP", vipStatusLabel(user) !== "Gratis" ? user.activePlan?.label ?? "Pro" : "Gratis"],
              ["Status Affiliate", user.mentorStatus],
              ["Level Affiliate", user.mentorLevel],
              ["Mode Tidak Aktif", user.mentorInactiveUntil ? format(new Date(user.mentorInactiveUntil), "dd MMM yyyy HH:mm") : "-"],
              ["Alasan Tidak Aktif", user.mentorInactiveReason ?? "-"],
              ["S&K Affiliate", user.mentorTermsAcceptedAt ? format(new Date(user.mentorTermsAcceptedAt), "dd MMM yyyy HH:mm") : "Belum setuju"],
              ["Rating Affiliate", user.mentorRatingAvg ? `${user.mentorRatingAvg.toFixed(1)}/5` : "-"],
              ["Referral Dibawa", String(user.referralCount ?? 0)],
              ["Laporan Diterima", String(user.mentorReportCount ?? 0)],
              ["Saldo", formatIDR(user.balance)],
              ["Kode Referral", user.referralCode],
              ["Membership Expiry", user.membershipExpiresAt ? format(new Date(user.membershipExpiresAt), "dd MMM yyyy") : "-"],
              ["Tanggal Gabung", format(new Date(user.joinedAt), "dd MMM yyyy")],
            ]}
          />
        )}
      />
    </Page>
  );
};

export const AdminWithdrawals = () => {
  const qc = useQueryClient();
  const { data: withdrawals = [] } = useQuery({ queryKey: ["admin-withdrawals"], queryFn: api.admin.withdrawals.list });
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pendingUpdate, setPendingUpdate] = useState<{ withdrawal: AdminWithdrawalRow; status: string } | null>(null);
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.admin.withdrawals.update(id, status),
    onSuccess: () => {
      toast.success("Status withdraw diupdate");
      setPendingUpdate(null);
      void qc.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      void qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal mengupdate withdraw")),
  });
  const filteredWithdrawals = useMemo(() => withdrawals.filter((item) => statusFilter === "ALL" || item.status === statusFilter), [statusFilter, withdrawals]);
  const summary = useMemo(() => {
    const byStatus = withdrawals.reduce<Record<string, { count: number; amount: number }>>((acc, item) => {
      const current = acc[item.status] ?? { count: 0, amount: 0 };
      acc[item.status] = { count: current.count + 1, amount: current.amount + item.amount };
      return acc;
    }, {});
    const pendingAmount = (byStatus.PENDING?.amount ?? 0) + (byStatus.PROCESSING?.amount ?? 0);
    const successAmount = byStatus.SUCCESS?.amount ?? 0;
    return {
      pendingCount: (byStatus.PENDING?.count ?? 0) + (byStatus.PROCESSING?.count ?? 0),
      pendingAmount,
      successAmount,
      rejectedCount: byStatus.REJECTED?.count ?? 0,
    };
  }, [withdrawals]);
  const columns = useMemo<ColumnDef<AdminWithdrawalRow>[]>(() => [
    { accessorFn: (row) => row.user.name, id: "userName", header: "Member", cell: ({ row }) => <span className="font-semibold">{row.original.user.name}</span> },
    { accessorFn: (row) => row.user.wa, id: "wa", header: "Telepon" },
    { accessorKey: "amount", header: "Nominal", cell: ({ row }) => formatIDR(row.original.amount) },
    { accessorKey: "bankName", header: "Bank", cell: ({ row }) => <span>{row.original.bankName} · {row.original.accountNumber}</span> },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="min-w-[150px]">
          <SearchSelect
            value={row.original.status}
            onChange={(status) => {
              if (status !== row.original.status) setPendingUpdate({ withdrawal: row.original, status });
            }}
            options={statusOptions}
            placeholder="Status"
            disabled={update.isPending}
          />
        </div>
      ),
    },
    { accessorKey: "createdAt", header: "Tanggal", cell: ({ row }) => format(new Date(row.original.createdAt), "dd MMM yyyy") },
  ], [update]);
  const pendingCopy = pendingUpdate ? withdrawalStatusCopy[pendingUpdate.status] ?? withdrawalStatusCopy.PENDING : withdrawalStatusCopy.PENDING;

  return (
    <Page title="Withdraw" desc="Review dan update status penarikan saldo member.">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label="Butuh Diproses" value={String(summary.pendingCount)} hint={formatIDR(summary.pendingAmount)} icon={Clock} tone="yellow" />
        <AdminMetricCard label="Total Berhasil" value={formatIDR(summary.successAmount)} hint="withdraw sukses" icon={Check} tone="green" />
        <AdminMetricCard label="Ditolak" value={String(summary.rejectedCount)} hint="perlu alasan jelas" icon={X} tone="red" />
        <AdminMetricCard label="Total Request" value={String(withdrawals.length)} hint="semua status" icon={Download} tone="blue" />
      </div>
      <Panel className="space-y-3">
        <SectionHeading title="Filter Withdraw" desc="Pilih status untuk fokus ke antrean yang perlu ditangani." />
        <div className="max-w-xs">
          <SearchSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ label: "Semua status", value: "ALL" }, ...statusOptions]}
            placeholder="Filter status"
          />
        </div>
      </Panel>
      <AdminDataTable
        data={filteredWithdrawals}
        columns={columns}
        exportFileName="admin-withdraw"
        exportRows={(wd) => ({
          ID: wd.id,
          Member: wd.user.name,
          Telepon: wd.user.wa,
          Nominal: wd.amount,
          Bank: wd.bankName,
          "No Rekening": wd.accountNumber,
          "Nama Rekening": wd.accountName ?? "-",
          Status: wd.status,
          "Tanggal Request": format(new Date(wd.createdAt), "dd MMM yyyy"),
          "Tanggal Proses": wd.processedAt ? format(new Date(wd.processedAt), "dd MMM yyyy HH:mm") : "-",
        })}
        renderDetail={(wd) => (
          <div className="space-y-3">
            <div className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-bold", withdrawalStatusCopy[wd.status]?.tone ?? withdrawalStatusCopy.PENDING.tone)}>
              {withdrawalStatusCopy[wd.status]?.label ?? wd.status}
            </div>
            <DetailGrid
              items={[
                ["Withdrawal ID", wd.id],
                ["Member", wd.user.name],
                ["Telepon", wd.user.wa],
                ["Nominal", formatIDR(wd.amount)],
                ["Bank", wd.bankName],
                ["No Rekening", wd.accountNumber],
                ["Nama Rekening", wd.accountName ?? "-"],
                ["Status", withdrawalStatusCopy[wd.status]?.label ?? wd.status],
                ["Tanggal Request", format(new Date(wd.createdAt), "dd MMM yyyy HH:mm")],
                ["Tanggal Proses", wd.processedAt ? format(new Date(wd.processedAt), "dd MMM yyyy HH:mm") : "-"],
              ]}
            />
          </div>
        )}
      />
      <ConfirmActionDialog
        open={Boolean(pendingUpdate)}
        onOpenChange={(value) => !value && setPendingUpdate(null)}
        title={pendingCopy.title}
        description={pendingUpdate ? `${pendingCopy.desc} Member: ${pendingUpdate.withdrawal.user.name}. Nominal: ${formatIDR(pendingUpdate.withdrawal.amount)}.` : pendingCopy.desc}
        confirmLabel={pendingCopy.confirm}
        destructive={pendingUpdate?.status === "REJECTED"}
        loading={update.isPending}
        onConfirm={() => pendingUpdate && !update.isPending && update.mutate({ id: pendingUpdate.withdrawal.id, status: pendingUpdate.status })}
      />
    </Page>
  );
};

const whatsappNumber = (wa: string) => {
  const digits = wa.replace(/\D/g, "");
  return digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
};

export const AdminPasswordResets = () => {
  const qc = useQueryClient();
  const { data: requests = [] } = useQuery({ queryKey: ["admin-password-resets"], queryFn: api.admin.passwordResets.list });
  const [approved, setApproved] = useState<(PasswordResetRequestDto & { resetToken: string; tokenExpiresAt: string }) | null>(null);
  const [rejecting, setRejecting] = useState<AdminPasswordResetRow | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const approve = useMutation({
    mutationFn: (id: string) => api.admin.passwordResets.approve(id),
    onSuccess: (data) => {
      setApproved(data);
      toast.success("Request reset password disetujui");
      void qc.invalidateQueries({ queryKey: ["admin-password-resets"] });
      void qc.invalidateQueries({ queryKey: ["admin-action-logs"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal approve request reset password")),
  });
  const reject = useMutation({
    mutationFn: ({ id, adminNote }: { id: string; adminNote?: string }) => api.admin.passwordResets.reject(id, { adminNote }),
    onSuccess: () => {
      setRejecting(null);
      setRejectNote("");
      toast.success("Request reset password ditolak");
      void qc.invalidateQueries({ queryKey: ["admin-password-resets"] });
      void qc.invalidateQueries({ queryKey: ["admin-action-logs"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal menolak request reset password")),
  });
  const resetUrl = approved ? `${window.location.origin}/reset-password?token=${encodeURIComponent(approved.resetToken)}` : "";
  const userWhatsappUrl = approved?.user?.wa
    ? `https://wa.me/${whatsappNumber(approved.user.wa)}?text=${encodeURIComponent(`Halo ${approved.user.name}, link reset password BuatCuan kamu: ${resetUrl}\n\nLink ini hanya berlaku 15 menit dan hanya bisa dipakai sekali.`)}`
    : "";
  const summary = useMemo(() => ({
    pending: requests.filter((item) => item.status === "PENDING").length,
    approved: requests.filter((item) => item.status === "APPROVED").length,
    used: requests.filter((item) => item.status === "USED").length,
    rejected: requests.filter((item) => item.status === "REJECTED").length,
  }), [requests]);
  const columns = useMemo<ColumnDef<AdminPasswordResetRow>[]>(() => [
    { accessorKey: "requestCode", header: "Kode", cell: ({ row }) => <span className="font-mono text-xs font-bold">{row.original.requestCode}</span> },
    { accessorKey: "requestedWa", header: "WA Request" },
    { accessorFn: (row) => row.user?.name ?? "-", id: "userName", header: "Akun", cell: ({ row }) => <span className="font-semibold">{row.original.user?.name ?? "Akun tidak ditemukan"}</span> },
    { accessorFn: (row) => row.user?.wa ?? "-", id: "accountWa", header: "WA Akun" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const copy = passwordResetStatusCopy[row.original.status];
        return <span className={cn("rounded-full border px-2 py-1 text-[10px] font-bold", copy.tone)}>{copy.label}</span>;
      },
    },
    { accessorKey: "createdAt", header: "Dibuat", cell: ({ row }) => format(new Date(row.original.createdAt), "dd MMM yyyy HH:mm") },
  ], []);

  return (
    <Page title="Reset Password" desc="Review request lupa password, cocokkan WA pengirim dengan WA akun, lalu kirim link reset sekali pakai.">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label="Menunggu" value={String(summary.pending)} hint="butuh verifikasi WA" icon={Clock} tone="yellow" />
        <AdminMetricCard label="Disetujui" value={String(summary.approved)} hint="link masih aktif" icon={KeyRound} tone="blue" />
        <AdminMetricCard label="Selesai" value={String(summary.used)} hint="token sudah dipakai" icon={Check} tone="green" />
        <AdminMetricCard label="Ditolak" value={String(summary.rejected)} hint="request invalid" icon={X} tone="red" />
      </div>
      <Panel className="space-y-2">
        <SectionHeading title="Checklist Verifikasi" desc="Approve hanya jika user chat dari nomor WhatsApp yang sama dengan WA akun dan kode request cocok." />
        <p className="text-xs font-semibold text-muted-foreground">Setelah approve, salin link atau buka WhatsApp user. Link berlaku 15 menit, sekali pakai, dan reset password akan mencabut sesi lama user.</p>
      </Panel>
      <AdminDataTable
        data={requests}
        columns={columns}
        exportFileName="admin-password-reset"
        exportRows={(item) => ({
          ID: item.id,
          Kode: item.requestCode,
          "WA Request": item.requestedWa,
          "Nama Akun": item.user?.name ?? "-",
          "WA Akun": item.user?.wa ?? "-",
          Status: item.status,
          "Admin Approve": item.approvedBy?.name ?? "-",
          "Request Expired": format(new Date(item.requestExpiresAt), "dd MMM yyyy HH:mm"),
          "Token Expired": item.tokenExpiresAt ? format(new Date(item.tokenExpiresAt), "dd MMM yyyy HH:mm") : "-",
          Dibuat: format(new Date(item.createdAt), "dd MMM yyyy HH:mm"),
        })}
        rowActions={(item) => (
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={item.status !== "PENDING" || !item.user || approve.isPending}
              onClick={() => approve.mutate(item.id)}
              title="Approve request"
              className={adminIconButton("save")}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!["PENDING", "APPROVED"].includes(item.status) || reject.isPending}
              onClick={() => {
                setRejecting(item);
                setRejectNote("");
              }}
              title="Tolak request"
              className={adminIconButton("delete")}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
        renderDetail={(item) => (
          <div className="space-y-3">
            <div className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-bold", passwordResetStatusCopy[item.status].tone)}>
              {passwordResetStatusCopy[item.status].label}
            </div>
            <DetailGrid
              items={[
                ["Request ID", item.id],
                ["Kode Request", item.requestCode],
                ["WA Request", item.requestedWa],
                ["Akun", item.user ? `${item.user.name} (${item.user.wa})` : "Tidak ditemukan"],
                ["WA Cocok", item.user?.wa === item.requestedWa ? "Ya" : "Perlu cek manual"],
                ["Status", item.status],
                ["Admin Approve", item.approvedBy ? `${item.approvedBy.name} (${item.approvedBy.wa})` : "-"],
                ["Catatan", item.adminNote ?? "-"],
                ["Request Expired", format(new Date(item.requestExpiresAt), "dd MMM yyyy HH:mm")],
                ["Token Expired", item.tokenExpiresAt ? format(new Date(item.tokenExpiresAt), "dd MMM yyyy HH:mm") : "-"],
                ["Approved At", item.approvedAt ? format(new Date(item.approvedAt), "dd MMM yyyy HH:mm") : "-"],
                ["Used At", item.usedAt ? format(new Date(item.usedAt), "dd MMM yyyy HH:mm") : "-"],
                ["Rejected At", item.rejectedAt ? format(new Date(item.rejectedAt), "dd MMM yyyy HH:mm") : "-"],
                ["Dibuat", format(new Date(item.createdAt), "dd MMM yyyy HH:mm")],
              ]}
            />
          </div>
        )}
      />
      <Dialog open={Boolean(approved)} onOpenChange={(open) => !open && setApproved(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Link Reset Password</DialogTitle>
            <DialogDescription>Link ini hanya tampil sekali di layar admin. Kirim ke user lewat WhatsApp setelah verifikasi nomor selesai.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-background/60 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">User</p>
              <p className="mt-1 text-sm font-bold">{approved?.user?.name ?? "-"} · {approved?.user?.wa ?? "-"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-background/60 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Reset URL</p>
              <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{resetUrl}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" className={adminButton("download", "h-11 rounded-xl")} onClick={() => { void navigator.clipboard.writeText(resetUrl); toast.success("Link disalin"); }}>
                <Copy className="mr-2 h-4 w-4" />
                Salin Link
              </Button>
              <Button asChild disabled={!userWhatsappUrl} className="h-11 rounded-xl bg-[#25D366] font-bold text-black hover:bg-[#1ebe5d]">
                <a href={userWhatsappUrl || "#"} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Kirim via WA
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(rejecting)} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Request Reset?</DialogTitle>
            <DialogDescription>Gunakan jika kode tidak cocok, nomor pengirim tidak sama, atau akun tidak ditemukan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Catatan Admin">
              <Textarea value={rejectNote} onChange={(event) => setRejectNote(event.target.value)} placeholder="Opsional" className="min-h-24" />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" className={adminButton("cancel")} onClick={() => setRejecting(null)}>Batal</Button>
              <Button type="button" variant="outline" disabled={reject.isPending} className={adminButton("delete")} onClick={() => rejecting && reject.mutate({ id: rejecting.id, adminNote: rejectNote })}>
                {reject.isPending ? "Memproses..." : "Tolak Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Page>
  );
};

export const AdminActionLogs = () => {
  const { data: logs = [] } = useQuery({ queryKey: ["admin-action-logs"], queryFn: () => api.admin.actionLogs.list({ limit: 100 }) });
  const columns = useMemo<ColumnDef<AdminActionLogDto>[]>(() => [
    { accessorKey: "createdAt", header: "Waktu", cell: ({ row }) => format(new Date(row.original.createdAt), "dd MMM yyyy HH:mm") },
    { accessorKey: "adminName", header: "Admin", cell: ({ row }) => <span className="font-semibold">{row.original.adminName}</span> },
    { accessorKey: "action", header: "Aksi", cell: ({ row }) => <span className="font-mono text-xs">{row.original.action}</span> },
    { accessorKey: "path", header: "Endpoint" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${row.original.status === "SUCCESS" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
          {row.original.status} {row.original.statusCode}
        </span>
      ),
    },
  ], []);

  return (
    <Page title="Log Admin" desc="Audit trail semua aksi perubahan data yang dilakukan dari dashboard admin.">
      <AdminDataTable
        data={logs}
        columns={columns}
        exportFileName="admin-log"
        exportRows={(log) => ({
          ID: log.id,
          Admin: log.adminName,
          "Telepon Admin": log.adminWa,
          Aksi: log.action,
          Method: log.method,
          Endpoint: log.path,
          Target: [log.targetType, log.targetId].filter(Boolean).join(" / ") || "-",
          Status: `${log.status} ${log.statusCode}`,
          IP: log.ipAddress ?? "-",
          "User Agent": log.userAgent ?? "-",
          Waktu: format(new Date(log.createdAt), "dd MMM yyyy HH:mm:ss"),
        })}
        renderDetail={(log) => (
          <div className="space-y-3">
            <DetailGrid
              items={[
                ["Log ID", log.id],
                ["Admin", `${log.adminName} (${log.adminWa})`],
                ["Aksi", log.action],
                ["Method", log.method],
                ["Endpoint", log.path],
                ["Target", [log.targetType, log.targetId].filter(Boolean).join(" / ") || "-"],
                ["Status", `${log.status} ${log.statusCode}`],
                ["IP", log.ipAddress ?? "-"],
                ["User Agent", log.userAgent ?? "-"],
                ["Waktu", format(new Date(log.createdAt), "dd MMM yyyy HH:mm:ss")],
              ]}
            />
            <div className="rounded-xl border border-white/10 bg-background/60 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Metadata</p>
              <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
                {JSON.stringify(log.metadata ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      />
    </Page>
  );
};

export const AdminSettings = () => {
  const { user, refreshUser } = useApp();
  const [name, setName] = useState(user?.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  const nameChanged = Boolean(user && name.trim() !== user.name);
  const passwordChanged = Boolean(newPassword);
  const canChangeName = !user?.nameCanChangeAt || new Date(user.nameCanChangeAt) <= new Date();

  const saveAccount = useMutation({
    mutationFn: () => api.auth.updateAccount({
      ...(nameChanged ? { name: name.trim() } : {}),
      currentPassword: currentPassword || undefined,
      newPassword: newPassword || undefined,
    }),
    onSuccess: () => {
      toast.success("Pengaturan admin berhasil disimpan");
      void refreshUser();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setConfirmOpen(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Pengaturan admin gagal disimpan"));
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (nameChanged && !canChangeName) return toast.error(`Nama baru bisa diubah lagi pada ${formatAdminDate(user.nameCanChangeAt)}.`);
    if (nameChanged && name.trim().length < 2) return toast.error("Nama admin wajib diisi minimal 2 karakter.");
    if (passwordChanged && !currentPassword) return toast.error("Password saat ini wajib diisi untuk mengganti password.");
    if (passwordChanged && newPassword.length < 8) return toast.error("Password baru minimal 8 karakter.");
    if (passwordChanged && newPassword !== confirmPassword) return toast.error("Konfirmasi password baru belum sama.");
    if (!nameChanged && !passwordChanged) return toast.error("Belum ada perubahan yang perlu disimpan.");
    setConfirmOpen(true);
  };

  if (!user) return null;

  return (
    <Page title="Pengaturan Admin" desc="Ubah profil dan keamanan akun admin yang sedang login. Akun admin tidak tampil di manajemen user.">
      <Panel className="max-w-2xl">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <p className="font-bold">Akun Admin</p>
            <p className="mt-1 text-sm text-muted-foreground">Data ini hanya berlaku untuk akun admin yang sedang login.</p>
          </div>
          <Field label="Nama Admin">
            <Input value={name} onChange={(event) => setName(event.target.value)} disabled={!canChangeName} />
            {!canChangeName ? (
              <p className="mt-2 text-xs font-semibold text-muted-foreground">Nama bisa diubah lagi pada {formatAdminDate(user.nameCanChangeAt)}.</p>
            ) : null}
          </Field>
          <Field label="Nomor WhatsApp Admin">
            <p className="rounded-xl border border-white/10 bg-secondary/50 px-3 py-2 text-sm font-semibold">{user.wa}</p>
          </Field>
          <div className="rounded-2xl border border-white/10 bg-secondary/35 p-4">
            <p className="text-sm font-black">Ganti Password</p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">Isi hanya jika ingin mengganti password. Gunakan password kuat dan jangan bagikan akses admin.</p>
          </div>
          <Field label="Password Saat Ini">
            <PasswordInput value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" />
          </Field>
          <Field label="Password Baru">
            <PasswordInput value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Konfirmasi Password Baru">
            <PasswordInput value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" />
          </Field>
          <Button type="submit" disabled={saveAccount.isPending} className={adminButton("save", "h-11 rounded-xl font-bold")}>
            {saveAccount.isPending ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </form>
      </Panel>
      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Simpan pengaturan admin?"
        description={[
          nameChanged ? `Nama admin akan diganti menjadi ${name.trim()}.` : "",
          passwordChanged ? "Password admin akan diganti. Login berikutnya harus memakai password baru." : "",
        ].filter(Boolean).join(" ")}
        confirmLabel="Ya, simpan"
        loading={saveAccount.isPending}
        onConfirm={() => !saveAccount.isPending && saveAccount.mutate()}
      />
    </Page>
  );
};

function formatAdminDate(iso?: string | null) {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMM yyyy");
}

const emptyAdminUpdateForm: AdminUpdateForm = {
  target: "USER_ALL",
  title: "",
  body: "",
  type: "UPDATE",
  href: "/app/notifications",
  icon: "Megaphone",
  color: gradientPresets[0],
  sourceType: "ADMIN_UPDATE",
  sourceId: "",
  priority: 16,
};

export const AdminUpdates = () => {
  const qc = useQueryClient();
  const { data: items = [], isFetching } = useQuery({ queryKey: ["admin-updates"], queryFn: api.admin.updates.list });
  const [form, setForm] = useState<AdminUpdateForm>(emptyAdminUpdateForm);
  const [open, setOpen] = useState(false);

  const columns = useMemo<ColumnDef<AdminUpdateNotificationDto>[]>(() => [
    { accessorKey: "title", header: "Judul", cell: ({ row }) => <span className="font-semibold">{row.original.title}</span> },
    {
      accessorKey: "audience",
      header: "Target",
      cell: ({ row }) => (
        <span className={cn("rounded-full px-2 py-1 text-[10px] font-bold", row.original.audience === "PRO" ? "bg-yellow-500/15 text-yellow-300" : "bg-sky-500/15 text-sky-300")}>
          {row.original.audience === "PRO" ? "User PRO" : "User FREE"}
        </span>
      ),
    },
    { accessorKey: "type", header: "Tipe" },
    { accessorKey: "priority", header: "Prioritas" },
    {
      accessorKey: "createdAt",
      header: "Tanggal",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{format(new Date(row.original.createdAt), "dd/MM/yyyy HH:mm")}</span>,
    },
  ], []);

  const publish = useMutation({
    mutationFn: () => api.admin.updates.publish(form),
    onSuccess: (result) => {
      toast.success(`Update dikirim ke ${result.createdCount} segmen user`);
      setForm(emptyAdminUpdateForm);
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["admin-updates"] });
      void qc.invalidateQueries({ queryKey: ["notifications"] });
      void qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal mengirim update")),
  });

  const submit = () => {
    if (publish.isPending) return;
    if (!validateAdminUpdate(form)) return;
    publish.mutate();
  };

  return (
    <Page
      title="Master Update"
      desc="Buat update dari admin. Hasilnya masuk ke inbox notifikasi user, bukan ke page Updates terpisah."
      action={
        <Button
          type="button"
          onClick={() => {
            setForm(emptyAdminUpdateForm);
            setOpen(true);
          }}
          className={adminButton("add")}
        >
          <Plus className="mr-1 h-4 w-4" />Buat Update
        </Button>
      }
    >
      <Panel className="mb-4">
        <SectionHeading title="Broadcast Notifikasi" desc="Buat pengumuman ke inbox user tanpa mengubah halaman riwayat broadcast." />
      </Panel>
      <AdminUpdateDialog
        open={open}
        setOpen={setOpen}
        form={form}
        setForm={setForm}
        onSubmit={submit}
        isSaving={publish.isPending}
      />
      <div className="space-y-3">
        <SectionHeading title="Riwayat Broadcast" desc={isFetching ? "Memuat data terbaru..." : `${items.length} notifikasi broadcast user`} />
        <AdminDataTable
          data={items}
          columns={columns}
          exportFileName="admin-update-notifikasi"
          exportRows={(item) => ({
            ID: item.id,
            Target: item.audience,
            Judul: item.title,
            Isi: item.body,
            Tipe: item.type,
            Link: item.href ?? "",
            Icon: item.icon ?? "",
            Warna: item.color ?? "",
            "Sumber Notifikasi": item.sourceType ?? "",
            "ID/Slug Sumber": item.sourceId ?? "",
            Prioritas: item.priority,
            Tanggal: item.createdAt,
          })}
          renderDetail={(item) => (
            <DetailGrid items={[
              ["ID", item.id],
              ["Target", item.audience],
              ["Tipe", item.type],
              ["Prioritas", String(item.priority)],
              ["Icon", item.icon ?? "-"],
              ["Warna", item.color ?? "-"],
              ["Link", item.href ?? "-"],
              ["Sumber Notifikasi", item.sourceType ?? "-"],
              ["ID/Slug Sumber", item.sourceId ?? "-"],
              ["Tanggal", format(new Date(item.createdAt), "dd/MM/yyyy HH:mm")],
              ["Judul", item.title],
              ["Isi", item.body],
            ]} />
          )}
        />
      </div>
    </Page>
  );
};

const AdminUpdateDialog = ({
  open,
  setOpen,
  form,
  setForm,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  form: AdminUpdateForm;
  setForm: (value: AdminUpdateForm) => void;
  onSubmit: () => void;
  isSaving: boolean;
}) => (
  <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
      <DialogHeader>
        <DialogTitle>Buat Update</DialogTitle>
        <DialogDescription>Broadcast akan masuk ke inbox notifikasi user sesuai target yang dipilih.</DialogDescription>
      </DialogHeader>
      <form onSubmit={(event) => { event.preventDefault(); if (!isSaving) onSubmit(); }} className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Target User">
            <SearchSelect
              value={form.target}
              onChange={(target) => setForm({ ...form, target: target as AdminUpdateTarget })}
              options={updateTargetOptions}
              placeholder="Pilih target"
            />
          </Field>
          <Field label="Tipe Notifikasi">
            <SearchSelect
              value={form.type}
              onChange={(type) => setForm({ ...form, type: type as AdminUpdateForm["type"] })}
              options={notificationTypeOptions}
              placeholder="Pilih tipe"
            />
          </Field>
          <Field label={`Judul (${form.title.length}/140)`} className="md:col-span-2">
            <Input value={form.title} maxLength={140} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Contoh: Materi hook baru sudah tersedia" />
          </Field>
          <Field label={`Isi Notifikasi (${form.body.length}/500)`} className="md:col-span-2">
            <Textarea value={form.body} maxLength={500} onChange={(event) => setForm({ ...form, body: event.target.value })} placeholder="Tulis informasi yang akan dibaca user di inbox notifikasi." className="min-h-32" />
          </Field>
          <Field label="Link Tujuan">
            <SearchSelect value={form.href} onChange={(href) => setForm({ ...form, href })} options={ctaUrlOptions} placeholder="Pilih link" allowCustom />
          </Field>
          <Field label="Icon">
            <SearchSelect value={form.icon} onChange={(icon) => setForm({ ...form, icon })} options={notificationIconOptions} placeholder="Pilih icon" />
          </Field>
          <Field label="Warna" hint="Warna dipakai untuk icon dan aksen notifikasi di inbox user." className="md:col-span-2">
            <GradientPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
          </Field>
          <Field label="Sumber Notifikasi" hint="Penanda asal notifikasi untuk riwayat sistem. Untuk broadcast manual, biarkan ADMIN_UPDATE.">
            <SearchSelect value={form.sourceType} onChange={(sourceType) => setForm({ ...form, sourceType })} options={sourceTypeOptions} placeholder="Pilih sumber" />
          </Field>
          <Field label="ID/Slug Sumber" hint="Opsional. Isi jika update terkait data tertentu, misalnya slug alat bantu atau ID materi.">
            <Input value={form.sourceId} onChange={(event) => setForm({ ...form, sourceId: event.target.value })} placeholder="slug/id opsional" />
          </Field>
          <Field label="Prioritas" hint="Angka lebih besar ditampilkan lebih penting di daftar notifikasi. Gunakan 0-100.">
            <Input type="number" min={0} max={100} value={form.priority} onChange={(event) => setForm({ ...form, priority: Number(event.target.value) })} />
          </Field>
          <div className="flex items-end justify-end gap-2">
            <Button type="button" variant="outline" disabled={isSaving} onClick={() => setForm(emptyAdminUpdateForm)} className={adminButton("cancel")}>
              Reset
            </Button>
            <Button type="submit" disabled={isSaving} className={adminButton("save")}>
              {isSaving ? "Mengirim..." : "Kirim Update"}
            </Button>
          </div>
        </div>
        <AdminUpdatePreview form={form} />
      </form>
    </DialogContent>
  </Dialog>
);

const AdminUpdatePreview = ({ form }: { form: AdminUpdateForm }) => {
  const Icon = notificationPreviewIcons[form.icon] ?? Megaphone;
  const targetLabel = updateTargetOptions.find((option) => option.value === form.target)?.label ?? "Semua User";
  const typeLabel = notificationTypeOptions.find((option) => option.value === form.type)?.label ?? form.type;
  const hrefLabel = ctaUrlOptions.find((option) => option.value === form.href)?.label ?? form.href;

  return (
    <div className="space-y-4">
      <SectionHeading title="Preview" desc="Berubah langsung mengikuti input di kiri." />
      <div className="rounded-2xl border border-primary/25 bg-primary/10 p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 text-white shadow-sm" style={gradientBackground(form.color)}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="break-words text-sm font-black">{form.title || "Judul update"}</p>
            <p className="mt-1 whitespace-pre-line break-words text-xs font-semibold leading-relaxed text-muted-foreground">{form.body || "Isi notifikasi akan muncul di sini."}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase text-muted-foreground">
              <span className="rounded-full bg-background/60 px-2 py-1">{targetLabel}</span>
              <span className="rounded-full bg-background/60 px-2 py-1">{typeLabel}</span>
              <span className="rounded-full bg-background/60 px-2 py-1">Prioritas {form.priority || 0}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-secondary/35 p-4 text-xs font-semibold leading-relaxed text-muted-foreground">
        <p className="font-bold text-foreground">Detail Pengiriman</p>
        <div className="mt-3 space-y-2">
          <p>Target Semua User akan membuat satu notifikasi untuk FREE dan satu untuk PRO. Admin tidak ikut menerima broadcast ini.</p>
          <p>Link: <span className="font-bold text-foreground">{hrefLabel || "-"}</span></p>
          <p>Warna: <span className="font-bold text-foreground">{form.color || "-"}</span></p>
          <p>Sumber: <span className="font-bold text-foreground">{form.sourceType || "-"}{form.sourceId ? ` / ${form.sourceId}` : ""}</span></p>
        </div>
      </div>
    </div>
  );
};

const masterDataGroups = [
  {
    title: "Konten & Halaman",
    desc: "Data yang langsung terlihat di aplikasi member dan halaman publik.",
    links: [
      { title: "Landing", desc: "Konten landing page dan halaman promosi publik.", to: "/admin/master-data/landing", icon: FileText },
      { title: "Video Cara Pakai", desc: "Atur video pembuka per URL, status tampil, CTA, dan sumber video.", to: "/admin/master-data/usage-videos", icon: Video },
      { title: "Video Materi", desc: "Materi, video, PDF, dan urutan pembelajaran.", to: "/admin/master-data/videos", icon: Play },
      { title: "Update", desc: "Broadcast informasi admin ke inbox notifikasi user.", to: "/admin/master-data/updates", icon: BellRing },
    ],
  },
  {
    title: "Alat Bantu",
    desc: "Kelola kategori, daftar alat bantu, dan item konten harian.",
    links: [
      { title: "Semua Alat Bantu", desc: "Daftar alat bantu, kategori, warna, jadwal, dan status tayang.", to: "/admin/tools", icon: Lightbulb },
      { title: "Ide Hook", desc: "Bank hook dan konten cepat yang tampil di alat bantu.", to: "/admin/hook-ideas", icon: Zap },
      { title: "Penentuan Niche", desc: "Daftar niche dan bobot/ambang skor Alat Penentuan Niche.", to: "/admin/niche-tool", icon: Compass },
    ],
  },
  {
    title: "Membership & Mentor",
    desc: "Data monetisasi, paket, komisi, dan bimbingan member.",
    links: [
      { title: "Paket", desc: "Harga, durasi, fitur, akses materi, dan akses alat bantu.", to: "/admin/master-data/plans", icon: Star },
      { title: "Withdraw", desc: "Review penarikan saldo dan status pencairan komisi.", to: "/admin/withdrawals", icon: Download },
      { title: "Bimbingan", desc: "Tombol bantuan, dukungan otomatis, tim, dan kanal konsultasi.", to: "/admin/master-data/guidance", icon: Users },
    ],
  },
  {
    title: "User & Sistem",
    desc: "Data internal untuk akses admin dan segmentasi member.",
    links: [
      { title: "User", desc: "Role sistem, level, saldo, status VIP, dan status affiliate.", to: "/admin/master-data/users", icon: Users },
      { title: "Peran User", desc: "Master peran untuk akses sistem.", to: "/admin/master-data/user-roles", icon: Check },
      { title: "Level User", desc: "Master level untuk segmentasi member.", to: "/admin/master-data/user-levels", icon: Hash },
      { title: "Pengaturan", desc: "Preferensi dashboard dan informasi admin.", to: "/admin/master-data/settings", icon: Edit },
    ],
  },
];

export const AdminMasterData = () => (
  <Page title="Master Data" desc="Kelola data inti yang dipakai oleh dashboard admin dan aplikasi member.">
    <div className="space-y-4">
      {masterDataGroups.map((group) => (
        <Panel key={group.title} className="space-y-4">
          <SectionHeading title={group.title} desc={group.desc} />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {group.links.map(({ title, desc, to, icon: Icon }) => (
              <Link key={to} to={to} className="rounded-2xl border border-white/10 bg-secondary/30 p-4 transition-colors hover:border-primary/30 hover:bg-primary/5">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-extrabold">{title}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{desc}</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  </Page>
);

export const AdminUserRoles = () => (
  <Page title="Master Peran User" desc="Kelola peran user untuk dropdown admin. Kode ADMIN, MENTOR, dan MEMBER tetap dipakai oleh akses sistem.">
    <UserMasterPanel
      title="Peran User"
      desc="Peran menentukan akses fitur dan dashboard."
      queryKey="admin-user-roles"
      list={api.admin.userRoles.list}
      save={api.admin.userRoles.save}
      remove={api.admin.userRoles.remove}
    />
  </Page>
);

export const AdminUserLevels = () => (
  <Page title="Master Level User" desc="Kelola level user untuk segmentasi dan tampilan profil.">
    <UserMasterPanel
      title="Level User"
      desc="Level dipakai untuk label profil dan segmentasi member."
      queryKey="admin-user-levels"
      list={api.admin.userLevels.list}
      save={api.admin.userLevels.save}
      remove={api.admin.userLevels.remove}
    />
  </Page>
);

const AdminNotificationToggle = <T extends AdminNotificationForm,>({
  form,
  setForm,
  className = "",
}: {
  form: T;
  setForm: (value: T) => void;
  className?: string;
}) => {
  const enabled = Boolean(form.notificationAudience);
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-secondary/45 p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black">Kirim notifikasi ke user</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">Nonaktif secara bawaan. Aktifkan hanya jika perubahan ini perlu diumumkan.</p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(checked) => setForm({ ...form, notificationAudience: checked ? "FREE" : "" })}
          aria-label="Kirim notifikasi ke user"
        />
      </div>
      {enabled && (
        <div className="mt-3">
          <SearchSelect
            value={form.notificationAudience || "FREE"}
            onChange={(notificationAudience) => setForm({ ...form, notificationAudience: notificationAudience as AdminNotificationAudience })}
            options={notificationAudienceOptions}
            placeholder="Pilih target penerima"
          />
        </div>
      )}
    </div>
  );
};

const VideoDialog = ({
  open,
  setOpen,
  form,
  setForm,
  plans,
  isSaving,
  isRemovingVideo,
  isRemovingPdf,
  onRemoveVideo,
  onRemovePdf,
  onSubmit,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  form: LessonForm;
  setForm: (v: LessonForm) => void;
  plans: Option[];
  isSaving: boolean;
  isRemovingVideo: boolean;
  isRemovingPdf: boolean;
  onRemoveVideo: (videoId?: string) => void;
  onRemovePdf: () => void;
  onSubmit: (payload: { videoFile?: File | null; videoTitle?: string; videoDescription?: string; videoDuration?: string; videoSortOrder?: number; pdfFile?: File | null; requiredPlanId?: string }) => void;
}) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoDuration, setVideoDuration] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [requiredPlanId, setRequiredPlanId] = useState("");

  useEffect(() => {
    if (!open) return;
    setVideoFile(null);
    setVideoTitle("");
    setVideoDescription("");
    setVideoDuration(form.duration);
    setPdfFile(null);
    setRequiredPlanId(form.pdf?.requiredPlanId ?? "");
  }, [form.duration, form.pdf?.requiredPlanId, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-5xl max-h-[88vh] overflow-auto">
        <DialogHeader><DialogTitle>Materi Video</DialogTitle><DialogDescription>Isi detail materi, upload file video, PDF, dan checklist praktek.</DialogDescription></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (!isSaving) onSubmit({ videoFile, videoTitle, videoDescription, videoDuration, videoSortOrder: (form.videos?.length ?? 0) + 1, pdfFile, requiredPlanId }); }} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="ID"><Input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} /></Field>
            <Field label="Kode Tampil"><Input value={form.displayCode ?? ""} onChange={(e) => setForm({ ...form, displayCode: e.target.value })} placeholder="1 / Modul 0 / Modul A" /></Field>
            <Field label="Slug Section" hint="Kode kelompok materi untuk menyusun materi di halaman member. Gunakan huruf kecil, angka, dan tanda minus."><Input value={form.sectionSlug ?? ""} onChange={(e) => setForm({ ...form, sectionSlug: normalizeSlugValue(e.target.value) })} placeholder="modul-cepat" /></Field>
            <Field label="Judul"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="Kategori"><SearchSelect value={form.category} onChange={(value) => setForm({ ...form, category: value as LessonDto["category"] })} options={categories} placeholder="Pilih kategori" /></Field>
            <Field label="Level"><SearchSelect value={form.level} onChange={(value) => setForm({ ...form, level: value as LessonDto["level"] })} options={levels} placeholder="Pilih level" /></Field>
            <Field label="Durasi"><Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></Field>
            <Field label="Urutan"><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></Field>
            <Field label="Warna Materi"><GradientPicker value={form.thumb} onChange={(thumb) => setForm({ ...form, thumb })} /></Field>
            <PremiumCheckbox label="Tayang" checked={form.isPublished} onChange={(isPublished) => setForm({ ...form, isPublished })} className="self-end" />
            <PremiumCheckbox label="Kunci dengan poin" checked={form.isPointLocked} onChange={(isPointLocked) => setForm({ ...form, isPointLocked })} />
            <Field label="Biaya buka poin"><Input type="number" value={form.pointCost} onChange={(e) => setForm({ ...form, pointCost: Number(e.target.value) })} /></Field>
            <Field label="Reward poin per klik"><Input type="number" value={form.pointReward} onChange={(e) => setForm({ ...form, pointReward: Number(e.target.value) })} /></Field>
            <Field label="Deskripsi"><Textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} className="min-h-24" /></Field>
            <Field label="Checklist"><Textarea value={form.steps.join("\n")} onChange={(e) => setForm({ ...form, steps: e.target.value.split("\n").filter(Boolean) })} className="min-h-24" /></Field>
          </div>
          <div className="space-y-4">
            <div className="space-y-3 rounded-2xl border border-white/10 bg-secondary/35 p-3">
              <p className="text-sm font-black">Tambah Sub Materi Video</p>
              <Field label="Judul Sub Materi" compact>
                <Input value={videoTitle} onChange={(event) => setVideoTitle(event.target.value)} placeholder={form.title || "Judul video sub materi"} />
              </Field>
              <Field label="Durasi Sub Materi" compact>
                <Input value={videoDuration} onChange={(event) => setVideoDuration(event.target.value)} placeholder="Contoh: 8 menit" />
              </Field>
              <Field label="Deskripsi Sub Materi" compact>
                <Textarea value={videoDescription} onChange={(event) => setVideoDescription(event.target.value)} className="min-h-20" placeholder="Opsional. Jika kosong akan mengikuti deskripsi materi utama." />
              </Field>
              <VideoDropzone selectedFile={videoFile} onSelect={setVideoFile} />
            </div>
            <LessonVideoList videos={form.videos ?? (form.video ? [form.video] : [])} onRemove={onRemoveVideo} isRemoving={isRemovingVideo} />
            <PdfDropzone
              existingPdf={form.pdf ?? null}
              selectedFile={pdfFile}
              requiredPlanId={requiredPlanId}
              plans={plans}
              onRequiredPlanChange={setRequiredPlanId}
              onSelect={setPdfFile}
              onRemove={onRemovePdf}
              isRemoving={isRemovingPdf}
            />
          </div>
          <AdminNotificationToggle form={form} setForm={setForm} className="lg:col-span-2" />
          <DialogActions onCancel={() => setOpen(false)} loading={isSaving} />
        </form>
      </DialogContent>
    </Dialog>
  );
};

const GuidanceDialog = ({ open, setOpen, form, setForm, onSubmit, isSaving }: { open: boolean; setOpen: (v: boolean) => void; form: GuidanceForm; setForm: (v: GuidanceForm) => void; onSubmit: () => void; isSaving: boolean }) => (
  <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>Bimbingan</DialogTitle><DialogDescription>Kelola kartu bantuan untuk member.</DialogDescription></DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); if (!isSaving) onSubmit(); }} className="grid gap-4 md:grid-cols-2">
        <Field label="Tipe"><SearchSelect value={form.type} onChange={(type) => setForm({ ...form, type })} options={guidanceTypes} placeholder="Tipe" /></Field>
        <Field label="Urutan"><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></Field>
        <Field label="Judul"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="CTA"><Input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} /></Field>
        <Field label="Deskripsi"><Textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} /></Field>
        <Field label="Warna"><GradientPicker value={form.color} onChange={(color) => setForm({ ...form, color })} /></Field>
        <PremiumCheckbox label="Aktif" checked={form.isActive} onChange={(isActive) => setForm({ ...form, isActive })} />
        <AdminNotificationToggle form={form} setForm={setForm} className="md:col-span-2" />
        <DialogActions onCancel={() => setOpen(false)} loading={isSaving} />
      </form>
    </DialogContent>
  </Dialog>
);

const ToolCategoryDialog = ({ open, setOpen, form, setForm, onSubmit, isSaving }: { open: boolean; setOpen: (v: boolean) => void; form: AdminToolCategoryForm; setForm: (v: AdminToolCategoryForm) => void; onSubmit: () => void; isSaving: boolean }) => (
  <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Kategori Alat Bantu</DialogTitle>
        <DialogDescription>Atur kelompok alat bantu yang tampil sebagai bagian dan filter di halaman Alat Bantu.</DialogDescription>
      </DialogHeader>
      <form onSubmit={(event) => { event.preventDefault(); if (!isSaving) onSubmit(); }} className="grid gap-4 md:grid-cols-2">
        <Field label="Nama Kategori">
          <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Bahan Konten" />
        </Field>
        <Field label="Slug" hint="Kode URL untuk kategori. Gunakan huruf kecil, angka, dan tanda minus.">
          <Input value={form.slug} onChange={(event) => setForm({ ...form, slug: normalizeSlugValue(event.target.value) })} placeholder="bahan-konten" />
        </Field>
        <Field label="Urutan">
          <Input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} />
        </Field>
        <PremiumCheckbox label="Aktif" checked={Boolean(form.isActive)} onChange={(isActive) => setForm({ ...form, isActive })} className="self-end" />
        <Field label="Deskripsi" className="md:col-span-2">
          <Textarea value={form.description ?? ""} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Kelompok alat bantu untuk bahan video, foto, dan hook awal." />
        </Field>
        <Field label="Warna" className="md:col-span-2">
          <GradientPicker value={form.colorGradient} onChange={(colorGradient) => setForm({ ...form, colorGradient })} />
        </Field>
        <AdminNotificationToggle form={form} setForm={setForm} className="md:col-span-2" />
        <DialogActions onCancel={() => setOpen(false)} loading={isSaving} />
      </form>
    </DialogContent>
  </Dialog>
);

const JsonTextarea = ({ value, onChange, placeholder, onValidityChange }: { value?: Record<string, unknown> | null; onChange: (value: Record<string, unknown>) => void; placeholder?: string; onValidityChange?: (valid: boolean) => void }) => {
  const [text, setText] = useState(() => JSON.stringify(value ?? {}, null, 2));
  const [error, setError] = useState("");

  useEffect(() => {
    setText(JSON.stringify(value ?? {}, null, 2));
    setError("");
    onValidityChange?.(true);
  }, [onValidityChange, value]);

  const parse = (nextText: string) => {
    setText(nextText);
    try {
      const parsed = JSON.parse(nextText || "{}");
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
        setError("Pengaturan harus berupa object JSON.");
        onValidityChange?.(false);
        return;
      }
      setError("");
      onValidityChange?.(true);
      onChange(parsed as Record<string, unknown>);
    } catch {
      setError("Format JSON belum valid.");
      onValidityChange?.(false);
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={text}
        onChange={(event) => parse(event.target.value)}
        placeholder={placeholder}
        className="min-h-40 font-mono text-xs"
      />
      {error ? <p className="text-xs font-semibold text-destructive">{error}</p> : null}
    </div>
  );
};

const ToolDialog = ({ open, setOpen, form, setForm, categories, onSubmit, isSaving }: { open: boolean; setOpen: (v: boolean) => void; form: AdminToolForm; setForm: (v: AdminToolForm) => void; categories: Option[]; onSubmit: () => void; isSaving: boolean }) => {
  const [configJsonValid, setConfigJsonValid] = useState(true);
  const submit = () => {
    if (!configJsonValid) {
      toast.error("Pengaturan generator JSON belum valid.");
      return;
    }
    onSubmit();
  };

  return (
  <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Alat Bantu Member</DialogTitle>
        <DialogDescription>Atur nama, slug, icon, warna, urutan, status, dan cara konten ditampilkan.</DialogDescription>
      </DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); if (!isSaving) submit(); }} className="grid gap-4 md:grid-cols-2">
        <Field label="Nama Alat Bantu">
          <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ide Hook" />
        </Field>
        <Field label="Slug" hint="Kode URL untuk halaman alat bantu. Gunakan huruf kecil, angka, dan tanda minus.">
          <Input value={form.slug} onChange={(event) => setForm({ ...form, slug: normalizeSlugValue(event.target.value) })} placeholder="ide-hook" />
        </Field>
        <Field label="Kategori">
          <SearchSelect
            value={form.categorySlug ?? ""}
            onChange={(categorySlug) => setForm({ ...form, categorySlug })}
            options={categories}
            placeholder="Pilih kategori"
          />
        </Field>
        <Field label="Jadwal Update">
          <SearchSelect value={form.cadenceLabel} onChange={(cadenceLabel) => setForm({ ...form, cadenceLabel })} options={cadenceOptions} placeholder="Pilih jadwal" allowCustom />
        </Field>
        <Field label="Icon">
          <SearchSelect value={form.icon} onChange={(icon) => setForm({ ...form, icon })} options={toolIconOptions} placeholder="Pilih icon" />
        </Field>
        <Field label="Tipe Konten">
          <SearchSelect
            value={form.contentType}
            onChange={(contentType) => setForm({ ...form, contentType: contentType as AdminToolForm["contentType"] })}
            options={contentTypeOptions}
            placeholder="Tipe"
          />
        </Field>
        <Field label="Urutan">
          <Input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} />
        </Field>
        <Field label="Deskripsi" className="md:col-span-2">
          <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </Field>
        <Field label="Warna" className="md:col-span-2">
          <GradientPicker value={form.colorGradient} onChange={(colorGradient) => setForm({ ...form, colorGradient })} />
        </Field>
        <Field label="Pengaturan Generator (JSON)" hint="Khusus untuk alat bantu berbasis data admin. Biarkan {} jika tidak perlu filter atau konfigurasi khusus." className="md:col-span-2">
          <JsonTextarea
            value={form.config}
            onChange={(config) => setForm({ ...form, config })}
            onValidityChange={setConfigJsonValid}
            placeholder='{"generator":{"filters":[{"key":"category","label":"Platform"}]}}'
          />
        </Field>
        <PremiumCheckbox label="Aktif" checked={form.isActive} onChange={(isActive) => setForm({ ...form, isActive })} />
        <AdminNotificationToggle form={form} setForm={setForm} className="md:col-span-2" />
        <DialogActions onCancel={() => setOpen(false)} loading={isSaving} />
      </form>
    </DialogContent>
  </Dialog>
  );
};

const ToolItemDialog = ({
  open,
  setOpen,
  form,
  setForm,
  contentType,
  mediaFile,
  setMediaFile,
  categoryOptions,
  nicheOptions,
  themeOptions,
  onResetMedia,
  isResettingMedia,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  form: AdminToolItemForm;
  setForm: (v: AdminToolItemForm) => void;
  contentType: "TEXT" | "VIDEO" | "IMAGE";
  mediaFile: File | null;
  setMediaFile: (file: File | null) => void;
  categoryOptions: Option[];
  nicheOptions: Option[];
  themeOptions: Option[];
  onResetMedia: () => void;
  isResettingMedia: boolean;
  onSubmit: (nextForm?: AdminToolItemForm) => void;
  isSaving: boolean;
}) => {
  const [metadataText, setMetadataText] = useState(() => JSON.stringify(form.metadata ?? {}, null, 2));
  const [metadataError, setMetadataError] = useState("");

  useEffect(() => {
    if (open) {
      setMetadataText(JSON.stringify(form.metadata ?? {}, null, 2));
      setMetadataError("");
    }
  }, [form.id, open]);

  const submit = () => {
    try {
      const parsed = metadataText.trim() ? JSON.parse(metadataText) : {};
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
        setMetadataError("Metadata harus berupa object JSON.");
        return;
      }
      const nextForm = { ...form, metadata: parsed as Record<string, unknown> };
      setForm(nextForm);
      onSubmit(nextForm);
    } catch {
      setMetadataError("Metadata JSON tidak valid.");
    }
  };
  const readMetadata = () => {
    try {
      const parsed = metadataText.trim() ? JSON.parse(metadataText) : {};
      return parsed && !Array.isArray(parsed) && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  };
  const patchMetadata = (key: string, value: string) => {
    const next = { ...readMetadata(), [key]: value };
    if (!value) delete next[key];
    setMetadataText(JSON.stringify(next, null, 2));
    setMetadataError("");
  };
  const metadataValue = (key: string) => String(readMetadata()[key] ?? "");

  return (
  <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="max-w-5xl max-h-[88vh] overflow-auto">
      <DialogHeader>
        <DialogTitle>Item Alat Bantu</DialogTitle>
        <DialogDescription>Isi konten yang akan tampil di halaman alat bantu member.</DialogDescription>
      </DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); if (!isSaving) submit(); }} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Judul" className="md:col-span-2">
            <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </Field>
          <Field label="Kategori">
            <SearchSelect value={form.category ?? ""} onChange={(category) => setForm({ ...form, category })} options={categoryOptions} placeholder="Pilih kategori" allowCustom />
          </Field>
          <Field label="Niche">
            <SearchSelect value={form.niche ?? ""} onChange={(niche) => setForm({ ...form, niche })} options={nicheOptions} placeholder="Pilih niche" allowCustom />
          </Field>
          <Field label="Tema">
            <SearchSelect value={form.theme ?? ""} onChange={(theme) => setForm({ ...form, theme })} options={themeOptions} placeholder="Pilih tema" allowCustom />
          </Field>
          <Field label="Urutan">
            <Input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} />
          </Field>
          <Field label="Hook / Pembuka" className="md:col-span-2">
            <Textarea value={form.openingHook ?? ""} onChange={(event) => setForm({ ...form, openingHook: event.target.value })} className="min-h-20" />
          </Field>
          <Field label="Isi Utama" className="md:col-span-2">
            <Textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} className="min-h-36" />
          </Field>
          {contentType !== "TEXT" && (
            <Field label={contentType === "VIDEO" ? "Upload Video Footage" : "Upload Foto Footage"} className="md:col-span-2">
              <MediaPicker
                contentType={contentType}
                mediaFile={mediaFile}
                existingUrl={form.mediaUrl ?? ""}
                existingName={form.mediaOriginalName ?? ""}
                onSelect={setMediaFile}
                onReset={onResetMedia}
                isResetting={isResettingMedia}
              />
            </Field>
          )}
          <Field label="Caption" className="md:col-span-2">
            <Textarea value={form.caption ?? ""} onChange={(event) => setForm({ ...form, caption: event.target.value })} className="min-h-24" />
          </Field>
          <Field label="Hashtag" className="md:col-span-2">
            <Textarea value={form.hashtags ?? ""} onChange={(event) => setForm({ ...form, hashtags: event.target.value })} className="min-h-16 font-mono text-xs" />
          </Field>
          <Field label="Media URL">
            <Input value={form.mediaUrl ?? ""} onChange={(event) => setForm({ ...form, mediaUrl: event.target.value })} />
          </Field>
          <Field label="URL Sumber" hint="Opsional. Link referensi atau sumber luar untuk item ini.">
            <Input value={form.sourceUrl ?? ""} onChange={(event) => setForm({ ...form, sourceUrl: event.target.value })} />
          </Field>
          <Field label="Metadata JSON" hint="Data tambahan untuk badge atau filter. Gunakan kontrol cepat di atas jika tidak perlu edit JSON langsung." className="md:col-span-2">
            <div className="mb-3 grid gap-3 md:grid-cols-2">
              <Field label="Akses" compact>
                <SearchSelect value={metadataValue("access")} onChange={(value) => patchMetadata("access", value)} options={metadataAccessOptions} placeholder="Pilih akses" />
              </Field>
              <Field label="Resolusi" compact>
                <SearchSelect value={metadataValue("resolution")} onChange={(value) => patchMetadata("resolution", value)} options={metadataResolutionOptions} placeholder="Pilih resolusi" />
              </Field>
              <Field label="Orientasi" compact>
                <SearchSelect value={metadataValue("orientation")} onChange={(value) => patchMetadata("orientation", value)} options={metadataOrientationOptions} placeholder="Pilih orientasi" />
              </Field>
              <Field label="Icon Metadata" compact>
                <SearchSelect value={metadataValue("icon")} onChange={(value) => patchMetadata("icon", value)} options={notificationIconOptions} placeholder="Pilih icon" />
              </Field>
              <Field label="Warna Aksen" compact>
                <SearchSelect value={metadataValue("accent")} onChange={(value) => patchMetadata("accent", value)} options={metadataAccentOptions} placeholder="Pilih warna" />
              </Field>
            </div>
            <Textarea
              value={metadataText}
              onChange={(event) => {
                setMetadataText(event.target.value);
                if (metadataError) setMetadataError("");
              }}
              className="min-h-40 font-mono text-xs"
              placeholder={'{"access":"FREE","resolution":"4K","tags":["No face"]}'}
            />
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Nama key tetap memakai bahasa sistem agar dibaca aplikasi. Untuk footage gunakan access/resolution/orientation; untuk musik gunakan artist/genre/duration/moods; untuk akun referensi gunakan username/followers/learnings/tags.
            </p>
            {metadataError ? <p className="mt-1 text-xs font-bold text-destructive">{metadataError}</p> : null}
          </Field>
          <PremiumCheckbox label="Tayang" checked={form.isPublished} onChange={(isPublished) => setForm({ ...form, isPublished })} />
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Preview</p>
            <p className="mt-2 font-extrabold">{form.title || "Judul item"}</p>
            {form.openingHook && <p className="mt-2 text-sm font-semibold">{form.openingHook}</p>}
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{form.content || "Isi utama akan tampil di sini."}</p>
          </div>
          {form.caption && <div className="rounded-2xl bg-secondary/60 p-4 text-sm">{form.caption}</div>}
          {form.hashtags && <div className="rounded-2xl bg-secondary/60 p-4 font-mono text-xs">{form.hashtags}</div>}
        </div>
        <AdminNotificationToggle form={form} setForm={setForm} className="lg:col-span-2" />
        <DialogActions onCancel={() => setOpen(false)} loading={isSaving} />
      </form>
    </DialogContent>
  </Dialog>
  );
};

const MediaPicker = ({
  contentType,
  mediaFile,
  existingUrl,
  existingName,
  onSelect,
  onReset,
  isResetting,
}: {
  contentType: "VIDEO" | "IMAGE";
  mediaFile: File | null;
  existingUrl: string;
  existingName: string;
  onSelect: (file: File | null) => void;
  onReset: () => void;
  isResetting: boolean;
}) => {
  const previewUrl = useMemo(() => mediaFile ? URL.createObjectURL(mediaFile) : assetUrl(existingUrl), [existingUrl, mediaFile]);

  useEffect(() => {
    if (!mediaFile || !previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [mediaFile, previewUrl]);

  const pickFile = (file?: File | null) => {
    if (!file) return;
    if (contentType === "VIDEO") {
      if (isAllowedVideoFile(file) && file.size <= VIDEO_MAX_BYTES) {
        onSelect(file);
        return;
      }
      toast.error(file.size > VIDEO_MAX_BYTES ? "Ukuran video maksimal 500 MB" : `Video footage harus MP4 atau WebM. File ini terbaca: ${file.type || "mime kosong"} ${extensionOfFile(file) || "tanpa ekstensi"}`);
      return;
    }

    if (imageMimeTypes.has(file.type) && file.size <= IMAGE_MAX_BYTES) {
      onSelect(file);
      return;
    }
    toast.error(file.size > IMAGE_MAX_BYTES ? "Ukuran foto maksimal 20 MB" : "Foto footage harus JPG, PNG, atau WebP");
  };

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-background/50 p-3">
      <input
        id={`tool-media-${contentType}`}
        type="file"
        accept={contentType === "VIDEO" ? "video/mp4,video/webm,.mp4,.webm" : "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"}
        className="sr-only"
        onChange={(event) => pickFile(event.target.files?.item(0))}
      />
      <label htmlFor={`tool-media-${contentType}`} className="flex min-h-[112px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-secondary/60 p-4 text-center transition hover:border-primary/40 hover:bg-primary/10">
        <Upload className="h-5 w-5 text-primary" />
        <span className="mt-2 text-sm font-bold">{contentType === "VIDEO" ? "Pilih video footage" : "Pilih foto footage"}</span>
        <span className="mt-1 text-xs text-muted-foreground">
          {contentType === "VIDEO" ? "MP4/WebM maks 500 MB" : "JPG/PNG/WebP maks 20 MB"}
        </span>
      </label>
      {(mediaFile || existingUrl) && (
        <div className="rounded-xl bg-secondary/50 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">{mediaFile?.name ?? existingName ?? "Media tersimpan"}</p>
            {mediaFile ? (
              <Button type="button" size="sm" variant="outline" onClick={() => onSelect(null)} className={adminIconButton("cancel")}>
                <X className="h-4 w-4" />
              </Button>
            ) : existingUrl ? (
              <Button type="button" size="sm" variant="outline" disabled={isResetting} onClick={onReset} className={adminButton("reset", "h-9 shrink-0")}>
                <X className="mr-1 h-4 w-4" />Kembalikan ke tampilan sementara
              </Button>
            ) : null}
          </div>
          {contentType === "VIDEO" ? (
            <video src={previewUrl} controls preload="metadata" className="aspect-video w-full rounded-xl bg-black object-contain" />
          ) : (
            <img src={previewUrl} alt="Preview footage" className="max-h-72 w-full rounded-xl bg-black object-contain" />
          )}
        </div>
      )}
    </div>
  );
};

const HookIdeaDialog = ({
  open,
  setOpen,
  form,
  setForm,
  categoryOptions,
  nicheOptions,
  themeOptions,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  form: AdminHookIdeaForm;
  setForm: (v: AdminHookIdeaForm) => void;
  categoryOptions: Option[];
  nicheOptions: Option[];
  themeOptions: Option[];
  onSubmit: () => void;
  isSaving: boolean;
}) => (
  <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="max-w-4xl max-h-[88vh] overflow-auto">
      <DialogHeader>
        <DialogTitle>Ide Hook</DialogTitle>
        <DialogDescription>Isi ide konten yang bisa dipakai ulang oleh mentor dan member.</DialogDescription>
      </DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); if (!isSaving) onSubmit(); }} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Judul" className="md:col-span-2">
            <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Judul ide konten" />
          </Field>
          <Field label="Kategori">
            <SearchSelect value={form.category} onChange={(category) => setForm({ ...form, category })} options={categoryOptions} placeholder="Pilih kategori" allowCustom />
          </Field>
          <Field label="Niche">
            <SearchSelect value={form.niche} onChange={(niche) => setForm({ ...form, niche })} options={nicheOptions} placeholder="Pilih niche" allowCustom />
          </Field>
          <Field label="Tema">
            <SearchSelect value={form.theme} onChange={(theme) => setForm({ ...form, theme })} options={themeOptions} placeholder="Pilih tema" allowCustom />
          </Field>
          <Field label="Urutan">
            <Input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} />
          </Field>
          <Field label="Hook Pembuka" className="md:col-span-2">
            <Textarea value={form.openingHook} onChange={(event) => setForm({ ...form, openingHook: event.target.value })} className="min-h-24" />
          </Field>
          <Field label="Caption" className="md:col-span-2">
            <Textarea value={form.caption} onChange={(event) => setForm({ ...form, caption: event.target.value })} className="min-h-32" />
          </Field>
          <Field label="Hashtag" className="md:col-span-2">
            <Textarea value={form.hashtags} onChange={(event) => setForm({ ...form, hashtags: event.target.value })} className="min-h-20 font-mono text-xs" />
          </Field>
          <PremiumCheckbox label="Tayang" checked={form.isPublished} onChange={(isPublished) => setForm({ ...form, isPublished })} />
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
            <div className="mb-2 flex items-center gap-2 text-primary">
              <Lightbulb className="h-4 w-4" />
              <p className="text-xs font-bold uppercase tracking-wider">Preview Hook</p>
            </div>
            <p className="text-sm font-semibold leading-relaxed">{form.openingHook || "Hook pembuka akan tampil di sini."}</p>
          </div>
          <div className="rounded-2xl bg-secondary/60 p-4">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <p className="text-xs font-bold uppercase tracking-wider">Caption</p>
            </div>
            <p className="text-sm leading-relaxed">{form.caption || "Caption akan tampil di sini."}</p>
          </div>
          <div className="rounded-2xl bg-secondary/60 p-4">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <Hash className="h-4 w-4" />
              <p className="text-xs font-bold uppercase tracking-wider">Hashtag</p>
            </div>
            <p className="font-mono text-xs leading-relaxed">{form.hashtags || "#hashtag"}</p>
          </div>
        </div>
        <AdminNotificationToggle form={form} setForm={setForm} className="lg:col-span-2" />
        <DialogActions onCancel={() => setOpen(false)} loading={isSaving} />
      </form>
    </DialogContent>
  </Dialog>
);

const mergeOptions = (...groups: Option[][]) => {
  const seen = new Set<string>();
  return groups.flat().filter((option) => {
    if (!option.value || seen.has(option.value)) return false;
    seen.add(option.value);
    return true;
  });
};

const guidanceAccessCode = (type: string) => {
  if (type === "WHATSAPP_CHAT") return "MENTOR_CHAT";
  if (type === "GROUP_CLASS") return "CONTENT_REVIEW";
  return type;
};

const PlanDialog = ({
  open,
  setOpen,
  form,
  setForm,
  featureOptions,
  lessonOptions,
  toolOptions,
  guidanceOptions,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  form: PlanForm;
  setForm: (v: PlanForm) => void;
  featureOptions: Option[];
  lessonOptions: Option[];
  toolOptions: Option[];
  guidanceOptions: Option[];
  onSubmit: () => void;
  isSaving: boolean;
}) => (
  <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="max-w-4xl max-h-[88vh] overflow-auto">
      <DialogHeader><DialogTitle>Paket Membership</DialogTitle><DialogDescription>Atur harga, durasi, fitur, akses materi, akses alat bantu, bimbingan, dan komisi affiliate.</DialogDescription></DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); if (!isSaving) onSubmit(); }} className="grid gap-4 md:grid-cols-2">
        <Field label="ID Paket" hint="Kode paket untuk sistem. Gunakan singkat tanpa spasi, misalnya PRO_3M.">
          <Input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
        </Field>
        <Field label="Nama Paket">
          <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        </Field>
        <Field label="Deskripsi" className="md:col-span-2">
          <Input value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
        </Field>
        <Field label="Label Hemat">
          <MoneyInput value={parseMoney(String(form.save ?? ""))} onChange={(value) => setForm({ ...form, save: value > 0 ? formatIDR(value) : "" })} />
        </Field>
        <Field label="Durasi Bulan" hint="Isi 0 untuk paket gratis atau akses tanpa batas waktu.">
          <Input type="number" value={form.months} onChange={(e) => setForm({ ...form, months: Number(e.target.value) })} />
        </Field>
        <Field label="Harga">
          <MoneyInput value={Number(form.price ?? 0)} onChange={(price) => setForm({ ...form, price })} />
        </Field>
        <Field label="Komisi Affiliate">
          <PercentInput value={Number(form.affiliateCommissionRate ?? 0)} onChange={(affiliateCommissionRate) => setForm({ ...form, affiliateCommissionRate })} />
        </Field>
        <Field label="Urutan"><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></Field>
        <Field label="Fitur Paket" className="md:col-span-2">
          <MultiSelect value={form.features ?? []} onChange={(features) => setForm({ ...form, features })} options={featureOptions} placeholder="Pilih fitur paket" />
        </Field>
        <Field label="Akses Materi" className="md:col-span-2">
          <MultiSelect value={form.lessonIds ?? []} onChange={(lessonIds) => setForm({ ...form, lessonIds })} options={lessonOptions} placeholder="Pilih materi yang dibuka" />
        </Field>
        <Field label="Akses Alat Bantu + Limit" hint="Pilih alat bantu yang terbuka untuk paket ini. Limit harian kosong berarti tidak dibatasi." className="md:col-span-2">
          <ToolAccessEditor value={form.toolAccess ?? []} onChange={(toolAccess) => setForm({ ...form, toolAccess })} options={toolOptions} />
        </Field>
        <Field label="Akses Bimbingan" className="md:col-span-2">
          <MultiSelect value={form.guidanceAccess ?? []} onChange={(guidanceAccess) => setForm({ ...form, guidanceAccess })} options={guidanceOptions} placeholder="Pilih akses bimbingan" />
        </Field>
        <PremiumCheckbox label="Paket gratis" checked={form.isFree} onChange={(isFree) => setForm({ ...form, isFree, price: isFree ? 0 : form.price, months: isFree ? 0 : form.months })} />
        <PremiumCheckbox label="Paket unggulan" checked={form.best} onChange={(best) => setForm({ ...form, best })} />
        <PremiumCheckbox label="Aktif" checked={form.isActive} onChange={(isActive) => setForm({ ...form, isActive })} />
        <AdminNotificationToggle form={form} setForm={setForm} className="md:col-span-2" />
        <DialogActions onCancel={() => setOpen(false)} loading={isSaving} />
      </form>
    </DialogContent>
  </Dialog>
);

const parseMoney = (value: string) => Number(value.replace(/[^\d]/g, "")) || 0;

const formatMoneyInput = (value: number) => new Intl.NumberFormat("id-ID").format(value || 0);

const MoneyInput = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => (
  <div className="relative">
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-primary">Rp</span>
    <Input
      inputMode="numeric"
      value={formatMoneyInput(value)}
      onChange={(event) => onChange(parseMoney(event.target.value))}
      className="pl-11 font-semibold tabular-nums"
    />
  </div>
);

const PercentInput = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => (
  <div className="relative">
    <Input
      inputMode="decimal"
      type="number"
      min="0"
      max="100"
      step="1"
      value={Math.round((value || 0) * 100)}
      onChange={(event) => onChange(Math.max(0, Math.min(100, Number(event.target.value) || 0)) / 100)}
      className="pr-10 font-semibold tabular-nums"
    />
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-primary">%</span>
  </div>
);

const MultiSelect = ({ value, onChange, options, placeholder }: { value: string[]; onChange: (value: string[]) => void; options: Option[]; placeholder: string }) => {
  const [open, setOpen] = useState(false);
  const selected = new Set(value);
  const selectedLabels = options.filter((option) => selected.has(option.value)).map((option) => option.label);

  const toggle = (optionValue: string) => {
    onChange(selected.has(optionValue) ? value.filter((item) => item !== optionValue) : [...value, optionValue]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className={adminButton("neutral", "min-h-11 w-full justify-between whitespace-normal text-left")}>
          <span className={cn("line-clamp-2", selectedLabels.length ? "text-foreground" : "text-muted-foreground")}>
            {selectedLabels.length ? selectedLabels.join(", ") : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(720px,calc(100vw-2rem))] p-0" align="start">
        <Command>
          <CommandInput placeholder="Cari opsi..." />
          <CommandList>
            <CommandEmpty>Opsi tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem key={option.value} value={`${option.label} ${option.value}`} onSelect={() => toggle(option.value)}>
                  <Check className={cn("mr-2 h-4 w-4", selected.has(option.value) ? "opacity-100" : "opacity-0")} />
                  <span>{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((item) => {
            const label = options.find((option) => option.value === item)?.label ?? item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onChange(value.filter((selectedItem) => selectedItem !== item))}
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
              >
                <span className="truncate">{label}</span>
                <X className="h-3 w-3 shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </Popover>
  );
};

const ToolAccessEditor = ({ value, onChange, options }: { value: Array<{ slug: string; dailyLimit?: number | null }>; onChange: (value: Array<{ slug: string; dailyLimit?: number | null }>) => void; options: Option[] }) => {
  const patchRow = (index: number, patch: Partial<{ slug: string; dailyLimit: number | null }>) => {
    onChange(value.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };
  const addRow = () => {
    const used = new Set(value.map((item) => item.slug));
    const firstAvailable = options.find((option) => !used.has(option.value))?.value ?? options[0]?.value ?? "";
    onChange([...value, { slug: firstAvailable, dailyLimit: null }]);
  };
  const removeRow = (index: number) => onChange(value.filter((_, itemIndex) => itemIndex !== index));

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/15 bg-secondary/40 px-3 py-4 text-sm text-muted-foreground">
          Belum ada alat bantu yang dibuka untuk paket ini.
        </div>
      )}
      {value.map((item, index) => (
        <div key={`${item.slug}-${index}`} className="grid gap-2 rounded-xl border border-white/10 bg-secondary/50 p-3 md:grid-cols-[1fr_160px_40px]">
          <SearchSelect value={item.slug} onChange={(slug) => patchRow(index, { slug })} options={options} placeholder="Pilih alat bantu" />
          <Input
            type="number"
            min="1"
            value={item.dailyLimit ?? ""}
            onChange={(event) => patchRow(index, { dailyLimit: event.target.value ? Number(event.target.value) : null })}
            placeholder="Tanpa batas"
            className="tabular-nums"
          />
          <Button type="button" variant="outline" onClick={() => removeRow(index)} className={adminButton("delete", "h-10 w-10 p-0")} title="Hapus alat bantu">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addRow} disabled={options.length === 0} className={adminButton("add", "w-full")}>
        <Plus className="mr-2 h-4 w-4" />
        Tambah Alat Bantu
      </Button>
    </div>
  );
};

const PremiumCheckbox = ({ label, checked, onChange, className = "" }: { label: string; checked: boolean; onChange: (checked: boolean) => void; className?: string }) => (
  <label className={cn("flex min-h-10 cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-secondary/70 px-3 py-2 text-sm font-semibold shadow-inner transition hover:border-primary/30 hover:bg-secondary", className)}>
    <Checkbox checked={checked} onCheckedChange={(value) => onChange(Boolean(value))} />
    <span>{label}</span>
  </label>
);

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};
const VIDEO_MAX_BYTES = 500 * 1024 * 1024;
const PDF_MAX_BYTES = 50 * 1024 * 1024;
const IMAGE_MAX_BYTES = 20 * 1024 * 1024;
const videoMimeTypes = new Set(["video/mp4", "video/webm", "video/x-m4v", "application/octet-stream", ""]);
const videoExtensions = new Set([".mp4", ".webm"]);
const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function extensionOfFile(file: File) {
  const index = file.name.lastIndexOf(".");
  return index >= 0 ? file.name.slice(index).toLowerCase() : "";
}

function isAllowedVideoFile(file: File) {
  return videoMimeTypes.has(file.type) && videoExtensions.has(extensionOfFile(file));
}

const VideoDropzone = ({ selectedFile, onSelect }: { selectedFile: File | null; onSelect: (file: File | null) => void }) => {
  const [isDragging, setIsDragging] = useState(false);
  const previewUrl = useMemo(() => selectedFile ? URL.createObjectURL(selectedFile) : "", [selectedFile]);

  useEffect(() => {
    if (!selectedFile || !previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl, selectedFile]);

  const pickFile = (file?: File | null) => {
    if (file && isAllowedVideoFile(file) && file.size <= VIDEO_MAX_BYTES) {
      onSelect(file);
      return;
    }
    if (file) toast.error(file.size > VIDEO_MAX_BYTES ? "Ukuran video maksimal 500 MB" : `File video harus MP4 atau WebM. File ini terbaca: ${file.type || "mime kosong"} ${extensionOfFile(file) || "tanpa ekstensi"}`);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          pickFile(event.dataTransfer.files.item(0));
        }}
        className={cn(
          "relative min-h-[178px] rounded-2xl border border-dashed border-white/15 bg-secondary/60 p-4 transition",
          isDragging && "border-primary bg-primary/10 shadow-[0_0_28px_hsl(var(--primary)/0.18)]",
        )}
      >
        <input
          id="video-upload"
          type="file"
          accept="video/mp4,video/webm,.mp4,.webm"
          className="sr-only"
          onChange={(event) => pickFile(event.target.files?.item(0))}
        />
        <label htmlFor="video-upload" className="flex h-full min-h-[146px] cursor-pointer flex-col items-center justify-center rounded-xl text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Upload className="h-5 w-5" />
          </span>
          <span className="mt-3 text-sm font-bold">Tarik video ke sini</span>
          <span className="mt-1 text-xs text-muted-foreground">atau klik untuk memilih file lokal</span>
          <span className="mt-3 rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold text-muted-foreground">MP4 atau WebM, maks 500 MB</span>
        </label>
      </div>

      <div className="rounded-2xl border border-white/10 bg-background/50 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preview Upload Baru</p>
            <p className="truncate text-sm font-semibold">
              {selectedFile?.name ?? "Belum ada file dipilih"}
            </p>
          </div>
          {selectedFile && (
            <Button type="button" size="sm" variant="outline" onClick={() => onSelect(null)} className={adminIconButton("cancel")}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {previewUrl ? (
          <video src={previewUrl} controls preload="metadata" className="aspect-video w-full rounded-xl bg-black object-contain" />
        ) : (
          <div className="grid aspect-video place-items-center rounded-xl text-xs font-semibold text-white/80" style={gradientBackground(emptyLesson.thumb)}>
            Video belum diupload
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          {selectedFile ? `File baru: ${formatFileSize(selectedFile.size)}` : "Upload akan ditambahkan sebagai sub materi baru."}
        </p>
      </div>
    </div>
  );
};

const LessonVideoList = ({ videos, onRemove, isRemoving }: { videos: Array<{ id: string; url: string; originalName: string; title?: string; duration?: string }>; onRemove: (videoId: string) => void; isRemoving: boolean }) => {
  if (!videos.length) {
    return <div className="rounded-2xl border border-white/10 bg-background/50 p-3 text-sm font-semibold text-muted-foreground">Belum ada sub materi video.</div>;
  }
  return (
    <div className="space-y-2 rounded-2xl border border-white/10 bg-background/50 p-3">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sub Materi Tersimpan</p>
      {videos.map((video, index) => (
        <div key={video.id} className="flex gap-3 rounded-xl bg-secondary/55 p-2">
          <video src={assetUrl(video.url)} muted playsInline preload="metadata" className="h-16 w-11 shrink-0 rounded-lg bg-black object-cover" />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-black">{video.title || `Sub Materi ${index + 1}`}</p>
            <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">{video.duration || "Durasi belum diisi"} · {video.originalName}</p>
          </div>
          <Button type="button" size="sm" variant="outline" disabled={isRemoving} onClick={() => onRemove(video.id)} className={adminIconButton("reset", "shrink-0")}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};

const UsageVideoDropzone = ({
  existingUrl,
  selectedFile,
  onSelect,
  title = "Upload Video Cara Pakai",
  desc = "Tarik file ke area upload. Nama file otomatis disesuaikan dari tujuan, sumber, dan waktu upload.",
  inputId = "usage-video-upload",
  children,
}: {
  existingUrl?: string | null;
  selectedFile: File | null;
  onSelect: (file: File | null) => void;
  title?: string;
  desc?: string;
  inputId?: string;
  children?: ReactNode;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const previewUrl = useMemo(() => selectedFile ? URL.createObjectURL(selectedFile) : assetUrl(existingUrl), [existingUrl, selectedFile]);

  useEffect(() => {
    if (!selectedFile || !previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl, selectedFile]);

  const pickFile = (file?: File | null) => {
    if (!file) return;
    if (!isAllowedVideoFile(file)) {
      toast.error(`File video harus MP4 atau WebM. File ini terbaca: ${file.type || "mime kosong"} ${extensionOfFile(file) || "tanpa ekstensi"}`);
      return;
    }
    if (file.size > VIDEO_MAX_BYTES) {
      toast.error("Ukuran video maksimal 500 MB");
      return;
    }
    onSelect(file);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-secondary/30 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        {selectedFile && (
          <Button type="button" size="sm" variant="outline" onClick={() => onSelect(null)} className={adminButton("cancel", "h-9")}>
            <X className="mr-1 h-4 w-4" />Batal
          </Button>
        )}
        {!selectedFile && children}
      </div>
      <div
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          pickFile(event.dataTransfer.files.item(0));
        }}
        className={cn(
          "rounded-2xl border border-dashed border-white/15 bg-background/45 p-4 transition",
          isDragging && "border-primary bg-primary/10 shadow-[0_0_28px_hsl(var(--primary)/0.18)]",
        )}
      >
        <input
          id={inputId}
          type="file"
          accept="video/mp4,video/webm,.mp4,.webm"
          className="sr-only"
          onChange={(event) => pickFile(event.target.files?.item(0))}
        />
        <label htmlFor={inputId} className="flex min-h-[130px] cursor-pointer flex-col items-center justify-center rounded-xl text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Upload className="h-5 w-5" />
          </span>
          <span className="mt-3 text-sm font-bold">Letakkan video di sini</span>
          <span className="mt-1 text-xs text-muted-foreground">atau klik untuk memilih MP4/WebM</span>
          <span className="mt-3 rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold text-muted-foreground">Maks 500 MB</span>
        </label>
      </div>

      <div className="rounded-2xl border border-white/10 bg-background/50 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preview File</p>
            <p className="truncate text-sm font-semibold">
              {selectedFile?.name ?? existingUrl ?? "Belum ada video"}
            </p>
          </div>
          {selectedFile ? <span className="rounded-full bg-primary/15 px-2 py-1 text-[10px] font-bold text-primary">{formatFileSize(selectedFile.size)}</span> : null}
        </div>
        {previewUrl ? (
          <video src={previewUrl} controls preload="metadata" className="aspect-video w-full rounded-xl bg-black object-contain" />
        ) : (
          <div className="grid aspect-video place-items-center rounded-xl border border-dashed border-white/10 bg-secondary/50 text-xs font-semibold text-muted-foreground">
            Belum ada file video
          </div>
        )}
      </div>
    </div>
  );
};

const PdfDropzone = ({
  existingPdf,
  selectedFile,
  requiredPlanId,
  plans,
  onRequiredPlanChange,
  onSelect,
  onRemove,
  isRemoving,
}: {
  existingPdf: LessonDto["pdf"];
  selectedFile: File | null;
  requiredPlanId: string;
  plans: Option[];
  onRequiredPlanChange: (value: string) => void;
  onSelect: (file: File | null) => void;
  onRemove: () => void;
  isRemoving: boolean;
}) => {
  const pickFile = (file?: File | null) => {
    if (file && file.type === "application/pdf" && file.name.toLowerCase().endsWith(".pdf") && file.size <= PDF_MAX_BYTES) {
      onSelect(file);
      return;
    }
    if (file) toast.error(file.size > PDF_MAX_BYTES ? "Ukuran PDF maksimal 50 MB" : "File harus berupa PDF");
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-background/50 p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">File PDF</p>
          <p className="text-sm text-muted-foreground">PDF hanya bisa didownload lewat akun yang memenuhi akses.</p>
        </div>
        {existingPdf && !selectedFile && (
          <Button type="button" size="sm" variant="outline" disabled={isRemoving} onClick={onRemove} className={adminButton("reset", "h-9 shrink-0")}>
            <X className="mr-1 h-4 w-4" />Kosongkan PDF
          </Button>
        )}
      </div>

      <input
        id="pdf-upload"
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(event) => pickFile(event.target.files?.item(0))}
      />
      <label htmlFor="pdf-upload" className="flex min-h-[112px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-secondary/60 p-4 text-center transition hover:border-primary/40 hover:bg-primary/10">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary">
          <FileText className="h-5 w-5" />
        </span>
        <span className="mt-2 text-sm font-bold">Upload PDF materi</span>
        <span className="mt-1 max-w-[260px] truncate text-xs text-muted-foreground">
          {selectedFile?.name ?? existingPdf?.originalName ?? "Belum ada PDF"}
        </span>
      </label>

      <div className="mt-3 space-y-2">
        <Field label="Akses Download PDF">
          <SearchSelect
            value={requiredPlanId}
            onChange={onRequiredPlanChange}
            options={[{ label: "Semua akun aktif", value: "" }, ...plans]}
            placeholder="Akses"
          />
        </Field>
        <p className="text-xs text-muted-foreground">
          {selectedFile
            ? `File baru: ${formatFileSize(selectedFile.size)}`
            : existingPdf
              ? `Tersimpan: ${formatFileSize(existingPdf.size)}`
              : "Jika paket dipilih, user wajib aktif dan pernah membayar paket tersebut."}
        </p>
        {selectedFile && (
          <Button type="button" size="sm" variant="outline" onClick={() => onSelect(null)} className={adminButton("cancel", "h-9")}>
            <X className="mr-1 h-4 w-4" /> Batal pilih PDF
          </Button>
        )}
      </div>
    </div>
  );
};

export const SearchSelect = ({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  allowCustom = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  disabled?: boolean;
  allowCustom?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.value === value);
  const customValue = query.trim();
  const canUseCustom = allowCustom && customValue.length > 0 && !options.some((option) => option.value.toLowerCase() === customValue.toLowerCase() || option.label.toLowerCase() === customValue.toLowerCase());
  return (
    <Popover open={open && !disabled} onOpenChange={(nextOpen) => { if (!disabled) { setOpen(nextOpen); if (!nextOpen) setQuery(""); } }}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" disabled={disabled} className={adminButton("neutral", "w-full justify-between")}>
          <span className={cn("min-w-0 truncate text-left", !selected && !value && "text-muted-foreground")}>{selected?.label ?? (value || placeholder)}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[260px] p-0">
        <Command>
          <CommandInput placeholder="Cari opsi..." value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {canUseCustom ? (
                <CommandItem
                  key={`custom-${customValue}`}
                  value={customValue}
                  onSelect={() => {
                    onChange(customValue);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <Plus className="mr-2 h-4 w-4 text-primary" />
                  <span className="min-w-0 truncate">Gunakan "{customValue}"</span>
                </CommandItem>
              ) : null}
              {options.map((option) => (
                <CommandItem key={option.value} value={`${option.label} ${option.value}`} onSelect={() => { if (disabled) return; onChange(option.value); setOpen(false); setQuery(""); }}>
                  <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                  <span className="min-w-0 truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const DatePicker = ({ value, onChange }: { value?: string; onChange: (value: string) => void }) => {
  const selected = value ? new Date(value) : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={adminButton("neutral", "w-full justify-start")}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, "dd MMM yyyy") : "Pilih tanggal"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={selected} onSelect={(date) => date && onChange(date.toISOString())} initialFocus />
      </PopoverContent>
    </Popover>
  );
};

const GradientPicker = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <div className="space-y-2">
    <div className="grid grid-cols-4 gap-2">
      {gradientPresets.map((preset) => (
        <button
          key={preset}
          type="button"
          onClick={() => onChange(preset)}
          className={cn("h-10 rounded-xl border-2", value === preset ? "border-primary" : "border-white/10")}
          style={gradientBackground(preset)}
        />
      ))}
    </div>
    <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs" />
  </div>
);

const emptyUserMaster: AdminUserMasterForm = { code: "", label: "", description: "", sortOrder: 0, isActive: true, notificationAudience: "" };

const UserMasterPanel = ({
  title,
  desc,
  queryKey,
  list,
  save,
  remove,
}: {
  title: string;
  desc: string;
  queryKey: string;
  list: () => Promise<UserMasterDto[]>;
  save: (payload: AdminUserMasterForm) => Promise<UserMasterDto>;
  remove: (code: string) => Promise<{ code: string; deleted: boolean; deactivated: boolean }>;
}) => {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({ queryKey: [queryKey], queryFn: list });
  const [form, setForm] = useState<AdminUserMasterForm>(emptyUserMaster);
  const [open, setOpen] = useState(false);
  const [confirmCode, setConfirmCode] = useState<string | null>(null);
  const saveMaster = useMutation({
    mutationFn: () => save({ ...form, code: form.code.trim().toUpperCase() }),
    onSuccess: () => {
      toast.success("Master data disimpan");
      setOpen(false);
      void qc.invalidateQueries({ queryKey: [queryKey] });
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
  const removeMaster = useMutation({
    mutationFn: remove,
    onSuccess: (result) => {
      toast.success(result.deactivated ? "Master data dinonaktifkan karena masih dipakai user" : "Master data dihapus");
      setConfirmCode(null);
      void qc.invalidateQueries({ queryKey: [queryKey] });
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  return (
    <Panel>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
        </div>
        <Button size="sm" onClick={() => { setForm(emptyUserMaster); setOpen(true); }} className={adminButton("add")}>
          <Plus className="w-4 h-4 mr-1" />Tambah
        </Button>
      </div>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div key={item.code} className="rounded-2xl border border-white/10 bg-secondary/50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{item.label} <span className="text-xs font-mono text-muted-foreground">({item.code})</span></p>
                <p className="text-xs text-muted-foreground">{item.description || "-"}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {item.isActive ? "Aktif" : "Nonaktif"} • Urutan {item.sortOrder}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={() => { setForm({ ...item, description: item.description ?? "" }); setOpen(true); }} className={adminIconButton("edit")}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setConfirmCode(item.code)} className={adminIconButton("delete")}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>Tambah atau edit master data user.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!saveMaster.isPending && validateUserMaster(form)) saveMaster.mutate();
            }}
          >
            <Field label="Kode">
              <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="CONTOH_KODE" disabled={items.some((item) => item.code === form.code)} />
            </Field>
            <Field label="Label">
              <Input value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} placeholder="Label tampilan" />
            </Field>
            <Field label="Deskripsi">
              <Textarea value={form.description ?? ""} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Deskripsi singkat" />
            </Field>
            <Field label="Urutan">
              <Input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.isActive} onCheckedChange={(checked) => setForm({ ...form, isActive: Boolean(checked) })} />
              Aktif
            </label>
            <AdminNotificationToggle form={form} setForm={setForm} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={saveMaster.isPending} onClick={() => setOpen(false)} className={adminButton("cancel")}>Batal</Button>
              <Button type="submit" disabled={saveMaster.isPending} className={adminButton("save")}>{saveMaster.isPending ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={Boolean(confirmCode)} setOpen={(v) => !v && setConfirmCode(null)} title="Hapus master data?" desc="Jika masih dipakai user, data akan dinonaktifkan agar relasi user tetap aman." onConfirm={() => confirmCode && !removeMaster.isPending && removeMaster.mutate(confirmCode)} loading={removeMaster.isPending} />
    </Panel>
  );
};

export const ConfirmDialog = ({ open, setOpen, title, desc, onConfirm, loading = false }: { open: boolean; setOpen: (v: boolean) => void; title: string; desc: string; onConfirm: () => void; loading?: boolean }) => (
  <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent>
      <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{desc}</DialogDescription></DialogHeader>
      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={loading} onClick={() => setOpen(false)} className={adminButton("cancel")}>Batal</Button>
        <Button variant="outline" disabled={loading} onClick={onConfirm} className={adminButton("delete")}>{loading ? "Memproses..." : "Konfirmasi"}</Button>
      </div>
    </DialogContent>
  </Dialog>
);

const LandingPreview = ({ content }: { content: LandingContent }) => {
  const infoCards = content.infoCards?.length ? content.infoCards : emptyLandingContent.infoCards ?? [];
  const stats = content.heroStats?.length ? content.heroStats : emptyLandingContent.heroStats ?? [];

  return (
    <Panel className="h-auto min-w-0 overflow-hidden flex flex-col self-start xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between gap-3 shrink-0">
        <div>
          <p className="font-bold">Live Preview</p>
          <p className="text-xs text-muted-foreground">Disamakan dengan landing publik terbaru.</p>
        </div>
        <span className="rounded-full bg-primary/15 px-2 py-1 text-[10px] font-bold text-primary">LANDING VIEW</span>
      </div>
      <div className="mt-4 min-h-0 rounded-[1.75rem] border border-white/10 bg-black p-2 shadow-2xl">
        <div className="h-[560px] max-h-[calc(100vh-172px)] overflow-y-auto rounded-[1.35rem] bg-[#020402] text-white hide-scrollbar">
          <div className="sticky top-0 z-10 flex h-11 items-center justify-between border-b border-white/10 bg-[#020402]/90 px-3 backdrop-blur">
            <div className="flex items-center gap-2">
              <img src="/buatcuan-mark.svg" alt="BuatCuan" className="h-5 w-5 rounded-md" />
              <span className="text-xs font-black">Buat<span className="text-primary">Cuan</span></span>
            </div>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-black text-white/75">Masuk</span>
          </div>

          <section className="flex min-h-[520px] flex-col items-center justify-center px-4 py-16 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/35 bg-yellow-400/10 px-3 py-1 text-[10px] font-black text-yellow-300">
              <Star className="h-3 w-3" />
              {content.heroBadge}
            </span>
            <h2 className="mt-4 max-w-[320px] text-3xl font-black leading-[0.98]">{content.heroTitle}</h2>
            <p className="mt-4 max-w-[330px] text-xs font-semibold leading-relaxed text-white/55">{content.heroSubtitle}</p>
            <div className="mt-5 flex gap-2">
              <div className="rounded-full bg-primary px-4 py-2 text-xs font-black text-black">{content.primaryCta}</div>
              <div className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-black text-white">{content.secondaryCta}</div>
            </div>
            <div className="mt-7 grid w-full max-w-[330px] grid-cols-4 gap-2 border-y border-white/10 py-4 text-left">
              {stats.slice(0, 4).map((stat) => (
                <div key={`${stat.value}-${stat.label}`} className="min-w-0">
                  <p className="truncate text-sm font-black text-yellow-300">{stat.value}</p>
                  <p className="text-[9px] font-bold leading-tight text-white/45">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-black text-white/75">Lihat detail</div>
          </section>

          <PreviewLandingSection eyebrow={content.demoEyebrow ?? "Video Demo"} title={content.demoTitle ?? "Platform ini kerjanya seperti apa?"} desc={content.demoSubtitle ?? ""}>
            <div className="overflow-hidden rounded-[18px] border border-primary/20 bg-[#101010]">
              <div className="aspect-video bg-gradient-to-br from-emerald-950 via-zinc-950 to-yellow-950 grid place-items-center">
                {content.demoVideoUrl ? (
                  <video src={assetUrl(content.demoVideoUrl)} controls preload="metadata" className="h-full w-full bg-black object-contain" />
                ) : (
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white"><Play className="h-5 w-5 fill-white" /></div>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-black">{content.demoVideoTitle ?? content.previewTitle}</p>
                <p className="mt-1 text-[10px] font-semibold text-white/45">{content.demoVideoNote ?? ""}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {infoCards.slice(0, 3).map((item) => {
                const Icon = benefitIcons[item.icon as keyof typeof benefitIcons] ?? Sparkles;
                return (
                  <div key={`${item.title}-${item.desc}`} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary"><Icon className="h-4 w-4" /></span>
                    <p className="mt-2 text-[11px] font-black">{item.title}</p>
                    <p className="mt-1 text-[9px] font-semibold text-white/45">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </PreviewLandingSection>

          <section className="border-t border-white/10 bg-[#070707] px-4 py-14 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-300">{content.section10Title ?? "MULAI GRATIS SEKARANG, JANGAN NUNGGU NANTI"}</p>
            <h3 className="mt-3 text-2xl font-black leading-tight">{content.section12Title ?? "TINGGAL SATU LANGKAH LAGI MENUJU CUAN PERTAMAMU"}</h3>
            <p className="mt-3 text-xs font-semibold leading-relaxed text-white/50">{content.section12Subtitle ?? "Nggak usah nunggu sempurna — langkah pertamamu cuma SATU."}</p>
            <div className="mt-5 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-black text-black">{content.section10Cta ?? "Mulai GRATIS Sekarang"}</div>
          </section>
          <footer className="border-t border-white/10 py-6 text-center text-[10px] text-white/40">{content.footerCopyright ?? content.footer}</footer>
        </div>
      </div>
    </Panel>
  );
};

const PreviewLandingSection = ({ eyebrow, title, desc, children }: { eyebrow: string; title: string; desc: string; children: ReactNode }) => (
  <section className="border-t border-white/10 px-4 py-12">
    <div className="mb-5 text-center">
      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
      <h3 className="mt-2 text-xl font-black leading-tight">{title}</h3>
      <p className="mt-2 text-[10px] font-semibold leading-relaxed text-white/45">{desc}</p>
    </div>
    {children}
  </section>
);

const PreviewSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="py-6">
    <h3 className="text-xl font-extrabold mb-4">{title}</h3>
    <div className="space-y-3">{children}</div>
  </section>
);

export const SectionHeading = ({ title, desc }: { title: string; desc: string }) => (
  <div className="min-w-0">
    <p className="font-bold">{title}</p>
    <p className="text-xs text-muted-foreground">{desc}</p>
  </div>
);

export const AdminMetricCard = ({ title, label, value, desc, hint, tone, icon: Icon }: { title?: string; label?: string; value: ReactNode; desc?: string; hint?: string; tone: "green" | "yellow" | "pink" | "blue" | "red" | "purple"; icon?: React.ComponentType<{ className?: string }> }) => {
  const toneClass = {
    green: "border-emerald-500 text-emerald-600 dark:text-emerald-300",
    yellow: "border-yellow-500 text-yellow-600 dark:text-yellow-300",
    pink: "border-pink-500 text-pink-600 dark:text-pink-300",
    blue: "border-sky-500 text-sky-600 dark:text-sky-300",
    red: "border-red-500 text-red-600 dark:text-red-300",
    purple: "border-violet-500 text-violet-600 dark:text-violet-300",
  }[tone];

  return (
    <div className={cn("rounded-2xl border bg-card p-4 text-card-foreground shadow-sm", toneClass)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title ?? label}</p>
        {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-80" /> : null}
      </div>
      <p className="mt-2 text-2xl font-extrabold leading-tight">{value}</p>
      <p className="mt-2 text-xs font-semibold text-muted-foreground">{desc ?? hint}</p>
    </div>
  );
};

const ActionCard = ({ title, value, desc, to, cta, urgent = false }: { title: string; value: ReactNode; desc: string; to: string; cta: string; urgent?: boolean }) => (
  <div className={cn("rounded-2xl border bg-card p-4 shadow-sm", urgent ? "border-yellow-500" : "border-border")}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
      </div>
      <span className={cn("rounded-xl px-3 py-1 text-lg font-extrabold", urgent ? "bg-yellow-500 text-black" : "bg-muted text-foreground")}>{value}</span>
    </div>
    <Link to={to} className="mt-4 inline-flex h-9 items-center rounded-xl border border-border bg-muted px-3 text-xs font-bold hover:bg-secondary">
      {cta}<ArrowRight className="ml-1 h-3.5 w-3.5" />
    </Link>
  </div>
);

const HealthRow = ({ label, value, tone }: { label: string; value: ReactNode; tone: "green" | "yellow" | "red" | "blue" }) => {
  const toneClass = {
    green: "bg-primary/15 text-primary",
    yellow: "bg-yellow-500/15 text-yellow-300",
    red: "bg-red-500/15 text-red-300",
    blue: "bg-sky-500/15 text-sky-300",
  }[tone];
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
      <p className="min-w-0 text-sm font-semibold text-muted-foreground">{label}</p>
      <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-extrabold", toneClass)}>{value}</span>
    </div>
  );
};

const QuickLinkCard = ({ title, desc, to }: { title: string; desc: string; to: string }) => (
  <Link to={to} className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-muted">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-bold group-hover:text-primary">{title}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
    </div>
  </Link>
);

const DialogActions = ({ onCancel, loading = false }: { onCancel: () => void; loading?: boolean }) => (
  <div className="md:col-span-2 flex justify-end gap-2">
    <Button type="button" variant="outline" disabled={loading} onClick={onCancel} className={adminButton("cancel")}>Batal</Button>
    <Button disabled={loading} className={adminButton("save")}>
      {loading ? "Menyimpan..." : "Simpan"}
    </Button>
  </div>
);
export const Page = ({ title, desc, action, children }: { title: string; desc: string; action?: ReactNode; children: ReactNode }) => <div className="space-y-4"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h1 className="text-2xl font-extrabold">{title}</h1><p className="text-sm text-muted-foreground">{desc}</p></div>{action}</div>{children}</div>;
const LandingFormSection = ({ title, desc, children, defaultOpen = false }: { title: string; desc: string; children: ReactNode; defaultOpen?: boolean }) => (
  <Collapsible defaultOpen={defaultOpen} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
    <CollapsibleTrigger asChild>
      <button type="button" className="flex min-h-[62px] w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-muted">
        <div className="min-w-0">
          <p className="truncate font-bold">{title}</p>
          <p className="truncate text-xs text-muted-foreground">{desc}</p>
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div className="space-y-3 border-t border-border p-3">{children}</div>
    </CollapsibleContent>
  </Collapsible>
);
export const Panel = ({ children, className = "" }: { children: ReactNode; className?: string }) => <div className={`h-full rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm ${className}`}>{children}</div>;
const Toolbar = ({ children }: { children: ReactNode }) => <Panel><div className="flex flex-col gap-3 lg:flex-row">{children}</div></Panel>;
const DataGrid = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(8);
  const rows = Children.toArray(children);

  useEffect(() => {
    setVisible(8);
  }, [rows.length]);

  return (
    <Panel>
      <div className="space-y-2">
        {rows.slice(0, visible)}
        {visible < rows.length && (
          <Button type="button" variant="outline" onClick={() => setVisible((current) => current + 8)} className={adminButton("neutral", "h-11 w-full rounded-2xl font-semibold")}>
            Lihat lebih banyak
          </Button>
        )}
      </div>
    </Panel>
  );
};
const Row = ({ title, details, children }: { title: string; details: Array<[string, string]>; children: ReactNode }) => (
  <Collapsible className="rounded-xl border border-border bg-card">
    <div className="min-h-[64px] p-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="font-bold truncate">{title}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <CollapsibleTrigger asChild>
          <Button size="sm" variant="outline" title="Lihat detail" className={adminIconButton("view")}>
            <Eye className="w-4 h-4" />
          </Button>
        </CollapsibleTrigger>
        {children}
      </div>
    </div>
    <CollapsibleContent>
      <div className="border-t border-border p-3">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {details.map(([label, value]) => (
            <div key={label} className="min-h-[58px] rounded-lg bg-muted p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="mt-1 text-sm font-semibold break-words">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </CollapsibleContent>
  </Collapsible>
);
export const DetailGrid = ({ items }: { items: Array<[string, string]> }) => (
  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
    {items.map(([label, value]) => (
      <div key={label} className="min-h-[58px] rounded-lg border border-border bg-muted p-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-semibold break-words">{value}</p>
      </div>
    ))}
  </div>
);

const ShowMoreAdminList = <TItem,>({ items, renderItem, empty, initial = 3, step = 3 }: { items: TItem[]; renderItem: (item: TItem) => ReactNode; empty: string; initial?: number; step?: number }) => {
  const [visible, setVisible] = useState(initial);
  const shown = items.slice(0, visible);
  if (!items.length) return <div className="rounded-xl border border-border bg-muted p-3 text-sm text-muted-foreground">{empty}</div>;
  return (
    <div className="space-y-2">
      {shown.map(renderItem)}
      {visible < items.length && (
        <Button type="button" variant="outline" className={adminButton("neutral", "h-10 w-full rounded-xl")} onClick={() => setVisible((value) => value + step)}>
          Lihat lebih banyak
        </Button>
      )}
    </div>
  );
};

const exportRowsToExcel = async (filename: string, rows: Array<Record<string, unknown>>) => {
  if (!rows.length) {
    toast.info("Tidak ada data untuk diexport");
    return;
  }
  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  XLSX.writeFile(workbook, `${filename}-${format(new Date(), "yyyyMMdd-HHmm")}.xlsx`, { compression: true });
};

const flattenForExport = (row: Record<string, unknown>) => Object.fromEntries(
  Object.entries(row).map(([key, value]) => [key, typeof value === "object" && value !== null ? JSON.stringify(value) : value]),
);

export const AdminDataTable = <TData extends object,>({
  data,
  columns,
  renderDetail,
  rowActions,
  exportRows,
  exportFileName = "admin-data",
}: {
  data: TData[];
  columns: ColumnDef<TData>[];
  renderDetail: (row: TData) => ReactNode;
  rowActions?: (row: TData) => ReactNode;
  exportRows?: (row: TData) => Record<string, unknown>;
  exportFileName?: string;
}) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<TData | null>(null);
  const tableColumns = useMemo<ColumnDef<TData>[]>(() => [
    ...columns,
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" type="button" onClick={() => setSelected(row.original)} title="Lihat detail" className={adminIconButton("view")}>
            <Eye className="w-4 h-4" />
          </Button>
          {rowActions?.(row.original)}
        </div>
      ),
      enableGlobalFilter: false,
      enableSorting: false,
    } satisfies ColumnDef<TData>,
  ], [columns, rowActions]);
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });
  const rows = table.getRowModel().rows;
  const exportData = async () => {
    const rowsToExport = table.getPrePaginationRowModel().rows.map((row) => (
      exportRows ? exportRows(row.original) : flattenForExport(row.original as Record<string, unknown>)
    ));
    await exportRowsToExcel(exportFileName, rowsToExport);
  };
  const exportableRows = table.getPrePaginationRowModel().rows.length;

  return (
    <Panel className="p-0 overflow-hidden">
      <div className="grid gap-3 border-b border-border p-3 lg:grid-cols-[minmax(260px,1fr)_auto] lg:items-center">
        <div className="relative min-w-0">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" value={globalFilter} onChange={(event) => setGlobalFilter(event.target.value)} placeholder="Cari data..." />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <span className="whitespace-nowrap text-xs text-muted-foreground">{table.getFilteredRowModel().rows.length} data</span>
          <div className="min-w-[152px]">
            <SearchSelect
              value={String(table.getState().pagination.pageSize)}
              onChange={(value) => table.setPageSize(Number(value))}
              options={[5, 8, 10, 20].map((value) => ({ label: `${value} / halaman`, value: String(value) }))}
              placeholder="Limit baris"
            />
          </div>
          <Button type="button" size="sm" onClick={exportData} disabled={!exportableRows} className={adminButton("download", "h-10 whitespace-nowrap rounded-xl px-4 font-bold")}>
            <Download className="w-4 h-4" />Export Excel
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-border hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={cn("h-12 whitespace-nowrap px-3 text-xs uppercase tracking-wider text-muted-foreground", header.id === "actions" && "text-right")}>
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1 rounded-md py-1 hover:text-foreground"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <ChevronsUpDown className={cn("h-3 w-3", header.column.getIsSorted() ? "text-primary opacity-100" : "opacity-40")} />
                        <span className="text-[10px] text-primary">
                          {header.column.getIsSorted() === "asc" ? "Naik" : header.column.getIsSorted() === "desc" ? "Turun" : ""}
                        </span>
                      </button>
                    ) : (
                      <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? rows.map((row) => (
              <TableRow key={row.id} className="border-border hover:bg-muted">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="h-14 px-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="h-24 text-center text-sm text-muted-foreground">
                  Belum ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-3 border-t border-border p-3 md:flex-row md:items-center md:justify-between">
        <p className="text-xs text-muted-foreground">
          Halaman {table.getState().pagination.pageIndex + 1} dari {Math.max(1, table.getPageCount())}
        </p>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className={adminButton("neutral")}>Sebelumnya</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className={adminButton("neutral")}>Berikutnya</Button>
        </div>
      </div>
      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Detail Data</DialogTitle>
            <DialogDescription>Informasi lengkap dari baris yang dipilih.</DialogDescription>
          </DialogHeader>
          {selected ? renderDetail(selected) : null}
        </DialogContent>
      </Dialog>
    </Panel>
  );
};
const Field = ({ label, children, hint, className }: { label: string; children: ReactNode; compact?: boolean; hint?: string; className?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
    {children}
    {hint ? <p className="text-xs font-medium leading-relaxed text-muted-foreground">{hint}</p> : null}
  </div>
);
const RepeaterAdd = ({ children, onClick }: { children: ReactNode; onClick: () => void }) => <Button type="button" variant="outline" onClick={onClick} className={adminButton("add", "h-10 w-full rounded-xl border-dashed font-semibold")}><Plus className="w-4 h-4 mr-1" />{children}</Button>;

export default AdminOverview;
