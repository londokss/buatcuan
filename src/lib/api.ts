const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:4001/api").replace(/\/+$/, "");
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export interface ApiUser {
  id: string;
  name: string;
  avatarUrl?: string | null;
  wa: string;
  referral: string;
  myRefCode: string;
  role: string;
  membershipActive: boolean;
  membershipTier?: "FREE" | "PRO";
  accountStatus: "active" | "inactive";
  membershipExpiry: string;
  autoRenewMembership: boolean;
  personalBrandHandle?: string | null;
  personalBrandTagline?: string | null;
  personalBrandStatus?: string | null;
  nameLastChangedAt?: string | null;
  nameCanChangeAt?: string | null;
  joinedAt: string;
  balance: number;
  level: string;
  completedLessons: string[];
}

export interface UserMasterDto {
  code: string;
  label: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface LessonSectionDto {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  badgeLabel?: string | null;
  colorGradient: string;
  sortOrder: number;
}

export interface LessonDto {
  id: string;
  displayCode?: string | null;
  sectionSlug?: string | null;
  section?: LessonSectionDto | null;
  category: "TikTok" | "Instagram" | "YouTube" | "Facebook";
  title: string;
  desc: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  thumb: string;
  sortOrder?: number;
  isUpdated?: boolean;
  updateLabel?: string | null;
  updateNote?: string | null;
  video?: {
    id: string;
    title?: string;
    description?: string;
    duration?: string;
    sortOrder?: number;
    url: string;
    originalName: string;
    mimeType: string;
    size: number;
    createdAt?: string;
  } | null;
  videos?: Array<{
    id: string;
    title: string;
    description?: string | null;
    duration: string;
    sortOrder: number;
    url: string;
    originalName: string;
    mimeType: string;
    size: number;
    createdAt?: string;
  }>;
  pdf?: {
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
    requiredPlanId?: string | null;
    downloadUrl: string;
  } | null;
  isPointLocked: boolean;
  pointCost: number;
  pointReward: number;
  isPointUnlocked: boolean;
  requiredMembership?: "FREE" | "PRO";
  isMembershipLocked?: boolean;
  isLocked: boolean;
  shareUrl?: string;
  steps: string[];
  completed?: boolean;
}

export interface PointSummaryDto {
  balance: number;
  pointsIn: unknown[];
  pointsOut: unknown[];
  transactions: Array<{
    id: string;
    type: string;
    points: number;
    balanceAfter: number;
    note?: string | null;
    lessonId?: string | null;
    lessonTitle?: string;
    createdAt: string;
  }>;
  unlockedVideos: Array<{ lessonId: string; title: string; pointsSpent: number; unlockedAt: string }>;
  clickedLinks: Array<{ id: string; lessonId: string; title: string; referralCode: string; pointsAwarded: number; clickedAt: string }>;
}

export interface PlanDto {
  id: string;
  months: number;
  price: number;
  label: string;
  desc: string;
  best: boolean;
  isFree?: boolean;
  affiliateCommissionRate?: number;
  features?: string[];
  save?: string;
}

export interface WithdrawalDto {
  id: string;
  amount: number;
  bank: string;
  bankName: string;
  accountNumber: string;
  status: string;
  date: string;
}

export interface PaymentDto {
  id: string;
  planId: string;
  plan: string;
  amount: number;
  status: "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "CANCELLED";
  provider: string;
  paymentMethod?: string;
  paymentProvider?: string;
  paymentInstructions?: PaymentInstructionDto;
  checkoutUrl?: string;
  expiresAt?: string;
  paidAt?: string;
  createdAt: string;
  accountStatus: "active" | "inactive";
}

export interface PaymentInstructionDto {
  type: "copy_code" | "qr" | "redirect";
  title: string;
  description?: string;
  codeLabel?: string;
  code?: string;
  qrPayload?: string;
  actionLabel?: string;
  actionUrl?: string;
  steps: string[];
}

export interface WalletTransactionDto {
  id: string;
  sourceId?: string;
  type: "COMMISSION" | "WITHDRAWAL" | "MEMBERSHIP_RENEWAL" | "ADJUSTMENT";
  direction: "IN" | "OUT";
  amount: number;
  status: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface WalletSummaryDto {
  totalCommission: number;
  totalWithdrawnOrReserved: number;
  totalWalletCredit: number;
  totalWalletDebitOrReserved: number;
  balance: number;
  heldBalance?: number;
}

// Affiliate v1 read path — backed by WalletLedgerEntry / AffiliateCommission, separate from the
// legacy WalletSummaryDto above (ReferralCommission/Withdrawal/WalletTransaction). `balance` here
// is NOT clamped at 0 and does not know about legacy withdrawals or auto-renew-from-balance debits
// (those only exist in the legacy models), so it is intentionally not used as the Wallet page's
// headline "Saldo tersedia" — see WalletSummaryDto.balance for that.
export interface AffiliateWalletSummaryV1Dto {
  balance: number;
  totalEarned: number;
  totalReversed: number;
  totalPaidOut: number;
  currency: string;
}

export type AffiliateWalletLedgerTypeV1 = "COMMISSION_CREDIT" | "REVERSAL_DEBIT" | "WITHDRAWAL_DEBIT" | "ADJUSTMENT";

export interface AffiliateWalletLedgerEntryV1Dto {
  id: string;
  type: AffiliateWalletLedgerTypeV1;
  amount: number;
  balanceAfter: number;
  commissionId: string | null;
  withdrawRequestId: string | null;
  sourceType: string | null;
  sourceId: string | null;
  note: string | null;
  createdAt: string;
}

export type AffiliateCommissionStatusV1 = "PENDING" | "PAID" | "CANCELLED";

export interface AffiliateCommissionV1Dto {
  id: string;
  paymentId: string;
  memberId: string;
  orderType: string;
  ratePercent: number;
  grossAmount: number;
  commissionAmount: number;
  status: AffiliateCommissionStatusV1;
  availableAt: string | null;
  reversedAt: string | null;
  reversedReason: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface PaginatedV1Dto<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// --- Niche Tool v1 (additive) -----------------------------------------------
export type NicheJalurCuan = "TIKTOK_AFFILIATE" | "GABUNGAN" | "KONTEN_UMUM" | "AFFILIATE_BUATCUAN";
export type NicheTren2026 = "MUSIMAN" | "STABIL" | "NAIK";
export type NicheLevel = "RINGAN" | "SEDANG" | "BERAT";
export type NicheTampilMuka = "TIDAK" | "OPSIONAL" | "WAJIB";
export type NicheLamp = "UTAMA" | "LAYAK" | "CADANGAN" | "CARI_LAIN";

export type NichePersonalCinta = "KURANG" | "LUMAYAN" | "BANGET";
export type NichePersonalOkeDikuasai = "BELUM" | "LUMAYAN" | "UDAH";
export type NichePersonalModalWaktu = "BERAT" | "SEDANG" | "RINGAN";

export interface NichePersonalAnswers {
  cinta?: NichePersonalCinta;
  okeDikuasai?: NichePersonalOkeDikuasai;
  modalWaktu?: NichePersonalModalWaktu;
}

export interface NicheCandidateV1Dto {
  id: string;
  slug: string;
  name: string;
  jalurCuan: NicheJalurCuan;
  isDefault: boolean;
  pilarNiche?: string | null;
  tren2026: NicheTren2026;
  modal: NicheLevel;
  bebanWaktu: NicheLevel;
  tampilMuka: NicheTampilMuka;
  isFlaggedSensitive: boolean;
}

export interface NicheScoreEntryV1Dto {
  rank: number;
  isPrimary: boolean;
  candidateId: string;
  candidateName: string;
  jalurCuan: NicheJalurCuan;
  isDefault: boolean;
  baseScore: number;
  personalScore: number;
  finalScore: number;
  lamp: NicheLamp;
  isFlaggedSensitive: boolean;
}

export interface NicheScoreResponseV1Dto {
  ranked: NicheScoreEntryV1Dto[];
  primary: NicheScoreEntryV1Dto;
  fallbackApplied: boolean;
}

export interface NicheResultResponseV1Dto extends NicheScoreResponseV1Dto {
  id: string;
  primaryNicheId: string;
  primaryNicheName: string;
  primaryScore: number;
  primaryLamp: NicheLamp;
  createdAt: string;
}

export interface NicheScoreRequestEntryV1 {
  candidateId: string;
  answers?: NichePersonalAnswers;
}

export interface NicheScoreRequestV1 {
  jalur: NicheJalurCuan;
  profil?: { tampilMuka?: NicheTampilMuka; modal?: NicheLevel; waktu?: NicheLevel; aksesBarang?: boolean; minat?: string };
  entries: NicheScoreRequestEntryV1[];
}

// --- Niche Tool v1 admin panel (additive) -----------------------------------
export interface NicheCandidateAdminDto {
  id: string;
  slug: string;
  name: string;
  jalurCuan: NicheJalurCuan;
  isDefault: boolean;
  pilarNiche?: string | null;
  peminat: number;
  ongkosBalik: number;
  saingan: number;
  kepercayaan: number;
  tren2026: NicheTren2026;
  modal: NicheLevel;
  bebanWaktu: NicheLevel;
  tampilMuka: NicheTampilMuka;
  isSensitive: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NicheCandidateAdminInput = Omit<NicheCandidateAdminDto, "id" | "isDefault" | "createdAt" | "updatedAt">;

export interface NicheLevelTier {
  min: number;
  max: number;
  points: number;
}

export interface NicheScoringConfigDto {
  base: {
    peminat: { max: number; tiers: NicheLevelTier[] };
    ongkosBalik: { max: number; tiers: NicheLevelTier[] };
    kepercayaan: { max: number; tiers: NicheLevelTier[] };
    saingan: { max: number; tiers: NicheLevelTier[] };
    tren2026: { max: number; points: Record<NicheTren2026, number> };
  };
  personal: {
    cinta: { max: number; points: Record<NichePersonalCinta, number> };
    okeDikuasai: { max: number; points: Record<NichePersonalOkeDikuasai, number> };
    modalWaktu: { max: number; points: Record<NichePersonalModalWaktu, number> };
  };
  thresholds: { utama: number; layak: number; cadangan: number };
  fallbackBelow: number;
  filters: {
    waktuMismatch: { userLevel: NicheLevel; candidateBebanWaktu: NicheLevel };
    aksesBarangRequiredJalur: NicheJalurCuan[];
    minatBoostEnabled: boolean;
  };
}

export interface NicheScoringConfigAdminDto {
  config: NicheScoringConfigDto;
  isOverridden: boolean;
  updatedAt: string | null;
}

export interface NotificationDto {
  id: string;
  audience?: "ALL" | "FREE" | "PRO" | "ADMIN" | string;
  title: string;
  body: string;
  type: "SYSTEM" | "UPDATE" | "PAYMENT" | "COMMISSION" | string;
  href?: string | null;
  icon?: string | null;
  color?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  priority: number;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  unreadCount: number;
  items: NotificationDto[];
}

export type AdminNotificationAudience = "FREE" | "PRO";
export type AdminUpdateTarget = "USER_ALL" | "FREE" | "PRO";

export interface AdminUpdateNotificationDto {
  id: string;
  audience: "FREE" | "PRO" | string;
  title: string;
  body: string;
  type: "UPDATE" | "SYSTEM" | "PAYMENT" | "COMMISSION" | string;
  href?: string | null;
  icon?: string | null;
  color?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  priority: number;
  createdAt: string;
}

export interface AdminUpdateNotificationInput {
  target: AdminUpdateTarget;
  title: string;
  body: string;
  type: "UPDATE" | "SYSTEM" | "PAYMENT" | "COMMISSION";
  href?: string;
  icon?: string;
  sourceType?: string;
  sourceId?: string;
  priority: number;
  source?: string;
  color?: string;
}

export type MentorStatus = "ACTIVE" | "TEMPORARILY_INACTIVE" | "WARNING" | "COMMISSION_HELD" | "BLOCKED";
export type MentorLevel = "NEW" | "ACTIVE" | "STAR" | "ELITE";
export type MentorReportStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED";

export interface MentorReportDto {
  id: string;
  reason: string;
  evidenceUrl?: string | null;
  evidenceOriginalName?: string | null;
  evidenceMimeType?: string | null;
  evidenceSize?: number | null;
  evidenceDownloadUrl?: string | null;
  status: MentorReportStatus;
  adminNote?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  mentor?: { id: string; name: string; wa: string; mentorStatus: MentorStatus; mentorLevel: MentorLevel };
  member?: { id: string; name: string; wa: string };
}

export interface MyMentorDto {
  mentor: {
    id: string;
    name: string;
    wa: string;
    mentorStatus: MentorStatus;
    mentorLevel: MentorLevel;
    mentorInactiveUntil?: string | null;
    mentorInactiveReason?: string | null;
    mentorRatingAvg?: number | null;
    supportFallback: boolean;
  } | null;
  teamMentor: { id: string; name: string; wa: string } | null;
  reports: MentorReportDto[];
}

export interface WalletDto {
  summary: WalletSummaryDto;
  autoRenew: {
    enabled: boolean;
    nextRenewalAt?: string;
    plan: PlanDto | null;
    canRenewWithBalance: boolean;
  };
  transactions: WalletTransactionDto[];
}

export interface AdminActionLogDto {
  id: string;
  adminId: string;
  adminName: string;
  adminWa: string;
  action: string;
  method: string;
  path: string;
  targetType?: string | null;
  targetId?: string | null;
  status: string;
  statusCode: number;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: unknown;
  createdAt: string;
}

export type PasswordResetStatus = "PENDING" | "APPROVED" | "USED" | "EXPIRED" | "REJECTED";

export interface PasswordResetRequestDto {
  id: string;
  requestedWa: string;
  requestCode: string;
  status: PasswordResetStatus;
  requestExpiresAt: string;
  tokenExpiresAt?: string | null;
  approvedAt?: string | null;
  usedAt?: string | null;
  rejectedAt?: string | null;
  adminNote?: string | null;
  createdAt: string;
  updatedAt?: string;
  user?: { id: string; name: string; wa: string } | null;
  approvedBy?: { id: string; name: string; wa: string } | null;
}

export interface HookIdeaDto {
  id: string;
  title: string;
  caption: string;
  hashtags: string;
  openingHook: string;
  category: string;
  niche: string;
  theme: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MemberToolDto {
  id: string;
  categoryId?: string | null;
  categorySlug?: string | null;
  category?: MemberToolCategoryDto | null;
  slug: string;
  name: string;
  description: string;
  cadenceLabel: string;
  contentType: "TEXT" | "VIDEO" | "IMAGE";
  icon: string;
  colorGradient: string;
  config: Record<string, unknown>;
  sortOrder: number;
  isActive?: boolean;
  requiredMembership?: "FREE" | "PRO";
  isLocked?: boolean;
  freeDailyLimit?: number;
  freeDailyRemaining?: number;
  freeDailyUsed?: number;
  accessLabel?: string;
  itemCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MemberToolCategoryDto {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  colorGradient: string;
  sortOrder: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MemberToolItemDto {
  id: string;
  toolId: string;
  title: string;
  openingHook?: string | null;
  content: string;
  caption?: string | null;
  hashtags?: string | null;
  category?: string | null;
  niche?: string | null;
  theme?: string | null;
  mediaUrl?: string | null;
  mediaStoragePath?: string | null;
  mediaOriginalName?: string | null;
  mediaMimeType?: string | null;
  mediaSize?: number | null;
  sourceUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MemberToolDetailDto {
  tool: MemberToolDto;
  items: MemberToolItemDto[];
  filters: {
    categories: string[];
    niches: string[];
    themes: string[];
  };
}

export interface MemberToolUserNoteDto {
  id?: string;
  userId?: string;
  toolId?: string;
  itemId: string;
  value: string;
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MemberToolNotesDto {
  tool: MemberToolDto;
  items: MemberToolItemDto[];
  notes: MemberToolUserNoteDto[];
  progress: {
    filled: number;
    total: number;
  };
}

export interface CreatorNoteDto {
  id: string;
  userId: string;
  sourceToolId?: string | null;
  sourceItemId?: string | null;
  title: string;
  content: string;
  sourceLabel?: string | null;
  icon: string;
  accent: string;
  sortOrder: number;
  isPinned: boolean;
  sourceTool?: Pick<MemberToolDto, "id" | "slug" | "name" | "icon" | "colorGradient"> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorNotesDto {
  branding: {
    handle: string;
    tagline: string;
    status: string;
  };
  notes: CreatorNoteDto[];
  sources: Array<Pick<MemberToolDto, "id" | "slug" | "name" | "icon" | "colorGradient"> & { category?: { slug: string; name: string } | null }>;
  progress: {
    filled: number;
    total: number;
  };
}

export interface MentorDashboardDto {
  mentor: {
    id: string;
    name: string;
    referralCode: string;
    referralLink: string;
    status?: MentorStatus;
    level?: MentorLevel;
    inactiveUntil?: string | null;
    termsAcceptedAt?: string | null;
  };
  stats: {
    totalRegistered: number;
    unpaid: number;
    active: number;
    totalPaidAmount: number;
    totalEstimatedCommission: number;
    clicks: number;
    registered: number;
    paid: number;
    registeredUnpaid: number;
  };
  members: Array<{
    id: string;
    name: string;
    wa: string;
    whatsapp: string;
    joinedAt: string;
    membershipExpiresAt?: string;
    status: "ACTIVE" | "PAID_INACTIVE" | "REGISTERED_UNPAID";
    membershipActive: boolean;
    paymentSummary: {
      totalPaid: number;
      paidCount: number;
      latestPayment: {
        id: string;
        plan: string;
        amount: number;
        status: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
        paidAt?: string;
        createdAt: string;
      } | null;
    };
  }>;
  commissions: Array<{
    id: string;
    memberId: string;
    memberName: string;
    memberWa: string;
    paymentId: string;
    plan: string;
    paymentAmount: number;
    commissionAmount: number;
    status: "PENDING" | "PAID" | "CANCELLED";
    paidAt: string;
  }>;
}

export type LandingStat = { value: string; label: string };
export type LandingFeature = { text: string; ok: boolean };
export type LandingInfoCard = { icon: string; title: string; desc: string };
export type LandingTestimonial = { name: string; role: string; result?: string; text: string };

export type LandingContent = {
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBrandTagline?: string;
  heroValueStrip?: string;
  heroMicrocopy?: string;
  heroTertiaryCta?: string;
  primaryCta: string;
  secondaryCta: string;
  heroStats?: LandingStat[];
  // Optional hero background video — lazy/poster-driven, see HeroBackgroundMedia in Landing.tsx.
  // Left unset by default: no compressed brand video exists yet, so the hero falls back to a
  // CSS-only animated gradient glow until one is uploaded via the CMS.
  heroVideoUrl?: string;
  heroVideoPoster?: string;
  previewLabel: string;
  previewTitle: string;
  demoEyebrow?: string;
  demoTitle?: string;
  demoSubtitle?: string;
  demoVideoTitle?: string;
  demoVideoDuration?: string;
  demoVideoNote?: string;
  demoVideoUrl?: string;
  benefitsTitle: string;
  benefits: Array<{ icon: string; title: string; desc: string }>;
  infoCards?: LandingInfoCard[];
  freePlanTitle?: string;
  freePlanPrice?: string;
  freePlanDesc?: string;
  freePlanCta?: string;
  freeFeatures?: LandingFeature[];
  proPlanTitle?: string;
  proPlanPrice?: string;
  proPlanDesc?: string;
  proPlanCta?: string;
  proFeatures?: LandingFeature[];
  promoLabel: string;
  promoTitle: string;
  promoCta: string;
  testimonialsTitle: string;
  testimonials: LandingTestimonial[];
  calculatorEyebrow?: string;
  calculatorTitle?: string;
  calculatorSubtitle?: string;
  commissionPerMember?: number;
  memberOptions?: number[];
  finalEyebrow?: string;
  finalTitle: string;
  finalSubtitle: string;
  finalCta: string;
  shareCta?: string;
  footer: string;

  section2Title?: string;
  section2Intro?: string;
  section2StarterTitle?: string;
  section2StarterItems?: string[];
  section2AdvancedTitle?: string;
  section2AdvancedItems?: string[];
  section2Outro?: string;

  section3Title?: string;
  section3Intro?: string;
  section3Items?: Array<{ title: string; desc: string }>;
  section3Cta?: string;

  section4Title?: string;
  section4Items?: Array<{ title: string; desc: string }>;

  section5Title?: string;
  section5Intro?: string;
  section5Items?: Array<{ title: string; desc: string }>;
  section5Note?: string;
  section5Cta?: string;

  section6Title?: string;
  section6FreeTitle?: string;
  section6FreeItems?: string[];
  section6UpgradeTitle?: string;
  section6UpgradeItems?: string[];

  section7Title?: string;
  section7Intro?: string;
  section7Items?: string[];

  section8Title?: string;
  section8Items?: string[];

  section9Title?: string;
  section9Paragraph1?: string;
  section9Paragraph2?: string;

  section10Title?: string;
  section10Subtitle?: string;
  section10Items?: string[];
  section10Cta?: string;

  section11Title?: string;
  section11FaqItems?: Array<{ question: string; answer: string }>;
  section12Title?: string;
  section12Subtitle?: string;
  section12Microcopy?: string;

  footerDisclaimer?: string;
  footerCopyright?: string;
};

export type UsageVideoDto = {
  id: string;
  targetPath: string;
  label: string;
  title: string;
  subtitle: string;
  durationLabel: string;
  videoUrl?: string | null;
  thumbnailGradient: string;
  icon: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  autoplay: boolean;
  isPublished: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type LandingPageDto = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  audienceRole?: string | null;
  campaign?: string | null;
  referralCode?: string | null;
  content: LandingContent;
  isPublished: boolean;
  isDefault: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ShareableLandingPageDto = Pick<LandingPageDto, "id" | "slug" | "name" | "description" | "campaign" | "audienceRole" | "isDefault"> & {
  shareUrl: string;
};

export type GamificationTone = "primary" | "yellow" | "sky" | "rose" | "violet" | "orange";

export interface GamificationAchievementDto {
  code: string;
  title: string;
  description: string;
  category: "Belajar" | "Konten" | "Tools" | "Mentor" | "Cuan" | "Streak";
  icon: string;
  tone: GamificationTone;
  target: number;
  value: number;
  xp: number;
  progress: { value: number; target: number; percent: number };
  earned: boolean;
  unlockedAt: string | null;
}

export interface GamificationMissionDto {
  code: string;
  title: string;
  description: string;
  progress: { value: number; target: number };
  xp: number;
  done: boolean;
  href: string;
}

export interface GamificationDashboardDto {
  summary: {
    totalXp: number;
    level: number;
    levelTitle: string;
    currentStreak: number;
    longestStreak: number;
    unlockedAchievements: number;
    totalAchievements: number;
    nextLevel: { level: number; title: string; requiredXp: number; remainingXp: number } | null;
  };
  today: {
    action: { contentCount: number; promoCount: number; reflection?: string | null };
    missions: GamificationMissionDto[];
  };
  achievements: GamificationAchievementDto[];
  stats: {
    completedLessons: number;
    foundationLessons: number;
    toolUses: number;
    distinctTools: number;
    creatorNotesFilled: number;
    totalReferrals: number;
    activeReferrals: number;
    totalCommission: number;
    completed4Plus1Days: number;
  };
  leaderboard: {
    myRank: number;
    items: Array<{
      rank: number;
      userId: string;
      name: string;
      avatarUrl?: string | null;
      totalXp: number;
      currentStreak: number;
      levelTitle: string;
      isCurrentUser: boolean;
    }>;
  };
}

export type DailyPlanPersona = "LEARNER" | "CONTENT" | "MENTOR";

export interface DailyPlanTaskDto {
  code: string;
  persona: DailyPlanPersona;
  title: string;
  description: string;
  ctaLabel?: string | null;
  href?: string | null;
  xp: number;
  sortOrder: number;
  completed: boolean;
  completedAt: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface DailyPlanDto {
  date: string;
  summary: {
    totalTasks: number;
    completedTasks: number;
    completionPercent: number;
    learnerCompleted: number;
    contentCompleted: number;
    mentorCompleted: number;
    earnedXp: number;
    totalXpAvailable: number;
    focusText: string;
  };
  nextBestTask: DailyPlanTaskDto | null;
  tasks: DailyPlanTaskDto[];
  week: Array<{ date: string; completed: number; total: number; percent: number }>;
}

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: ApiErrorPayload;
};

export type ApiErrorPayload = {
  code: string;
  message: string;
  statusCode?: number;
  details?: unknown;
  path?: string;
  method?: string;
  timestamp?: string;
};

export class ApiError extends Error {
  code: string;
  statusCode?: number;
  details?: unknown;
  path?: string;
  method?: string;
  timestamp?: string;
  raw?: unknown;

  constructor(payload: ApiErrorPayload, raw?: unknown) {
    super(payload.message);
    this.name = "ApiError";
    this.code = payload.code;
    this.statusCode = payload.statusCode;
    this.details = payload.details;
    this.path = payload.path;
    this.method = payload.method;
    this.timestamp = payload.timestamp;
    this.raw = raw;
  }
}

const AUTH_SESSION_ERROR_CODES = new Set([
  "AUTH_TOKEN_EXPIRED",
  "AUTH_TOKEN_INVALID",
  "AUTH_INVALID_PAYLOAD",
  "AUTH_TOKEN_EMPTY",
  "AUTH_USER_NOT_FOUND",
  "AUTH_ROLE_INACTIVE",
  "AUTH_CONTEXT_MISSING",
  "AUTH_SESSION_REVOKED",
]);

export function isAuthSessionError(error: unknown) {
  return error instanceof ApiError && AUTH_SESSION_ERROR_CODES.has(error.code);
}

export function getErrorMessage(error: unknown, fallback = "Request gagal") {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

let authErrorDispatched = false;

export const authStorage = {
  tokenKey: "buatcuan:token",
  userKey: "buatcuan:user",
  getToken: () => localStorage.getItem("buatcuan:token") ?? sessionStorage.getItem("buatcuan:token"),
  setSession: (token: string, user: ApiUser, remember = true) => {
    authErrorDispatched = false;
    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;
    otherStorage.removeItem("buatcuan:token");
    otherStorage.removeItem("buatcuan:user");
    storage.setItem("buatcuan:token", token);
    storage.setItem("buatcuan:user", JSON.stringify(user));
  },
  setUser: (user: ApiUser) => {
    const storage = sessionStorage.getItem("buatcuan:token") ? sessionStorage : localStorage;
    storage.setItem("buatcuan:user", JSON.stringify(user));
  },
  getUser: () => {
    const raw = localStorage.getItem("buatcuan:user") ?? sessionStorage.getItem("buatcuan:user");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ApiUser;
    } catch {
      localStorage.removeItem("buatcuan:user");
      sessionStorage.removeItem("buatcuan:user");
      return null;
    }
  },
  clear: () => {
    localStorage.removeItem("buatcuan:token");
    localStorage.removeItem("buatcuan:user");
    sessionStorage.removeItem("buatcuan:token");
    sessionStorage.removeItem("buatcuan:user");
  },
};

async function parseJson<T>(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    return null;
  }
}

function makeApiError<T>(response: Response, json: ApiResponse<T> | null, fallback: string) {
  const error = json?.error;
  return new ApiError(
    {
      code: error?.code ?? `HTTP_${response.status || 0}`,
      message: error?.message ?? fallback,
      statusCode: error?.statusCode ?? response.status,
      details: error?.details,
      path: error?.path,
      method: error?.method,
      timestamp: error?.timestamp,
    },
    json,
  );
}

function dispatchAuthError(error: ApiError) {
  if (!isAuthSessionError(error)) return;
  if (authErrorDispatched) return;
  authErrorDispatched = true;
  authStorage.clear();
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("buatcuan:auth-error", {
      detail: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      },
    }),
  );
}

async function request<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  const token = authStorage.getToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!headers.has("Content-Type") && options.body && !isFormData) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (error) {
    throw new ApiError(
      {
        code: "NETWORK_ERROR",
        message: "Tidak bisa terhubung ke server. Cek koneksi atau pastikan backend aktif.",
        statusCode: 0,
      },
      error,
    );
  }

  const json = await parseJson<T>(response);

  if (!response.ok || !json?.success) {
    const error = makeApiError(response, json, "Request gagal");
    dispatchAuthError(error);
    throw error;
  }

  return json.data as T;
}

async function downloadRequest(path: string) {
  const headers = new Headers();
  const token = authStorage.getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { headers });
  } catch (error) {
    throw new ApiError(
      {
        code: "NETWORK_ERROR",
        message: "Tidak bisa terhubung ke server. Cek koneksi atau pastikan backend aktif.",
        statusCode: 0,
      },
      error,
    );
  }

  if (!response.ok) {
    const json = await parseJson<unknown>(response);
    const error = makeApiError(response, json, "Download gagal");
    dispatchAuthError(error);
    throw error;
  }

  return response.blob();
}

export function assetUrl(url?: string | null) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

export function createNotificationEventSource() {
  const token = authStorage.getToken();
  if (!token || typeof EventSource === "undefined") return null;
  return new EventSource(`${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`);
}

export const api = {
  auth: {
    login: (payload: { wa: string; password: string }) =>
      request<{ token: string; user: ApiUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    register: (payload: { name: string; wa: string; password: string; referralCode?: string; termsAccepted: boolean }) =>
      request<{ token: string; user: ApiUser }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    me: () => request<{ user: ApiUser }>("/auth/me"),
    updateAccount: (payload: { name?: string; avatarUrl?: string; wa?: string; currentPassword?: string; newPassword?: string }) =>
      request<{ user: ApiUser }>("/auth/account", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    updatePersonalBranding: (payload: { handle?: string; tagline?: string; status?: string }) =>
      request<{ user: ApiUser }>("/auth/personal-branding", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    deleteAccount: (payload: { currentPassword: string; confirmation: string }) =>
      request<{ deleted: boolean }>("/auth/account", {
        method: "DELETE",
        body: JSON.stringify(payload),
      }),
    requestPasswordReset: (payload: { wa: string }) =>
      request<{ message: string; requestCode: string; requestExpiresAt: string; adminWa?: string | null; adminWhatsappUrl?: string | null }>("/auth/password-reset/request", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    completePasswordReset: (payload: { token: string; password: string }) =>
      request<{ message: string; withdrawalLockedUntil?: string }>("/auth/password-reset/complete", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
  landing: (params?: { slug?: string; campaign?: string; role?: string; ref?: string }) => {
    const search = new URLSearchParams();
    if (params?.slug) search.set("slug", params.slug);
    if (params?.campaign) search.set("campaign", params.campaign);
    if (params?.role) search.set("role", params.role);
    if (params?.ref) search.set("ref", params.ref);
    const query = search.toString();
    return request<LandingContent>(`/landing${query ? `?${query}` : ""}`);
  },
  usageVideos: (targetPath?: string) => {
    const search = new URLSearchParams();
    if (targetPath) search.set("targetPath", targetPath);
    const query = search.toString();
    return request<{ items: UsageVideoDto[]; hasConfigured: boolean }>(`/usage-videos${query ? `?${query}` : ""}`);
  },
  lessons: {
    list: (category?: string) =>
      request<LessonDto[]>(`/lessons${category ? `?category=${encodeURIComponent(category)}` : ""}`),
    detail: (id: string) => request<LessonDto>(`/lessons/${id}`),
    downloadPdf: (id: string) => downloadRequest(`/lessons/${id}/pdf`),
    unlock: (id: string) =>
      request<{ unlocked: boolean; alreadyUnlocked: boolean; pointsSpent: number; balance?: number }>(`/lessons/${id}/unlock`, {
        method: "POST",
      }),
    progress: (id: string, completed: boolean) =>
      request<LessonDto>(`/lessons/${id}/progress`, {
        method: "PATCH",
        body: JSON.stringify({ completed }),
      }),
  },
  points: {
    summary: () => request<PointSummaryDto>("/points"),
  },
  gamification: {
    dashboard: () => request<GamificationDashboardDto>("/gamification"),
    updateDailyAction: (payload: { contentCount: number; promoCount: number; reflection?: string }) =>
      request<GamificationDashboardDto>("/gamification/daily-action", {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
  },
  dailyPlan: {
    get: () => request<DailyPlanDto>("/daily-plan"),
    updateTask: (code: string, completed: boolean) =>
      request<DailyPlanDto>(`/daily-plan/tasks/${encodeURIComponent(code)}`, {
        method: "PATCH",
        body: JSON.stringify({ completed }),
      }),
  },
  videoLinks: {
    trackClick: (lessonId: string, referralCode: string) =>
      request<{ tracked: boolean; validReferral: boolean; pointsAwarded: number; videoUrl: string }>(
        `/video-links/${encodeURIComponent(lessonId)}/click/${encodeURIComponent(referralCode)}`,
        { method: "POST" },
      ),
  },
  plans: () => request<PlanDto[]>("/plans"),
  payments: {
    checkout: (planId: string, paymentMethod: string, paymentProvider?: string) =>
      request<{ payment: PaymentDto; checkoutUrl: string; provider: string; user: ApiUser }>("/payments/checkout", {
        method: "POST",
        body: JSON.stringify({ planId, paymentMethod, paymentProvider }),
      }),
    cancel: (paymentId: string) =>
      request<{ payment: PaymentDto; user: ApiUser }>(`/payments/${paymentId}/cancel`, {
        method: "POST",
      }),
    expire: (paymentId: string) =>
      request<{ payment: PaymentDto; user: ApiUser }>(`/payments/${paymentId}/expire`, {
        method: "POST",
      }),
    simulatePaid: (paymentId: string) =>
      request<{ paymentId: string; status: string; alreadyProcessed: boolean; user: ApiUser }>(`/payments/mock-paid/${paymentId}`, {
        method: "POST",
      }),
    history: () => request<PaymentDto[]>("/payments/history"),
  },
  affiliate: {
    summary: () =>
      request<{
        link: string;
        code: string;
        stats: {
          totalJoins: number;
          active: number;
          validReferrals: number;
          clicks: number;
          registered: number;
          paid: number;
          registeredUnpaid: number;
          commission: number;
        };
        commissionRate: number;
        mentorStatus?: MentorStatus;
        mentorLevel?: MentorLevel;
        mentorInactiveUntil?: string | null;
        mentorTermsAcceptedAt?: string | null;
        nextCommissionRate?: number | null;
        chartData: Array<{ day: string; joins: number }>;
        commissions: Array<{
          id: string;
          mentorId: string;
          memberId: string;
          paymentId: string;
          memberName: string;
          memberWa: string;
          plan: string;
          paymentAmount: number;
          commissionAmount: number;
          status: "PENDING" | "PAID" | "CANCELLED";
          paidAt: string;
        }>;
        referrals: Array<{ id: string; name: string; wa: string; date: string; status: string; valid: boolean }>;
      }>("/affiliate/summary"),
    mentor: () => request<MentorDashboardDto>("/affiliate/mentor"),
    myMentor: () => request<MyMentorDto>("/affiliate/my-mentor"),
    reportMentor: (payload: { reason: string; evidence: File }) => {
      const body = new FormData();
      body.append("reason", payload.reason);
      body.append("evidence", payload.evidence);
      return request<MentorReportDto>("/affiliate/mentor-reports", { method: "POST", body });
    },
    acceptMentorTerms: () => request<{ id: string; mentorTermsAcceptedAt: string; mentorStatus: MentorStatus; mentorLevel: MentorLevel }>("/affiliate/mentor-terms", { method: "POST" }),
    updateMentorAvailability: (payload: { inactiveUntil: string; reason: string }) =>
      request<{ id: string; mentorStatus: MentorStatus; mentorInactiveUntil: string; mentorInactiveReason: string }>("/affiliate/mentor-availability", { method: "PATCH", body: JSON.stringify(payload) }),
    landingPages: () => request<ShareableLandingPageDto[]>("/affiliate/landing-pages"),
    resolveReferral: (referralCode: string) =>
      request<{
        validReferral: boolean;
        fallbackUsed: boolean;
        requestedReferral: string;
        referral: { id: string; name: string; wa: string; referralCode: string; publicIdentifier: string } | null;
      }>(`/affiliate/referral/${encodeURIComponent(referralCode)}`),
    trackClick: (referralCode: string) =>
      request<{ tracked: boolean; validReferral?: boolean }>(`/affiliate/referral-click/${encodeURIComponent(referralCode)}`, {
        method: "POST",
      }),
  },
  withdrawals: {
    list: () => request<WithdrawalDto[]>("/withdrawals"),
    create: (payload: { bankName: string; accountNumber: string; amount: number }) =>
      request<{ withdrawal: WithdrawalDto; user: ApiUser }>("/withdrawals", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
  // Affiliate v1 read path — source of truth for ledger/commission history on the Wallet page.
  // The legacy `wallet` group below is still used for the headline balance only (see
  // AffiliateWalletSummaryV1Dto above for why).
  affiliateV1: {
    walletSummary: () => request<AffiliateWalletSummaryV1Dto>("/v1/affiliate/wallet/summary"),
    walletLedger: (params: { page?: number; limit?: number } = {}) => {
      const search = new URLSearchParams();
      if (params.page) search.set("page", String(params.page));
      if (params.limit) search.set("limit", String(params.limit));
      const qs = search.toString();
      return request<PaginatedV1Dto<AffiliateWalletLedgerEntryV1Dto>>(`/v1/affiliate/wallet/ledger${qs ? `?${qs}` : ""}`);
    },
    commissions: (params: { page?: number; limit?: number; status?: AffiliateCommissionStatusV1 } = {}) => {
      const search = new URLSearchParams();
      if (params.page) search.set("page", String(params.page));
      if (params.limit) search.set("limit", String(params.limit));
      if (params.status) search.set("status", params.status);
      const qs = search.toString();
      return request<PaginatedV1Dto<AffiliateCommissionV1Dto>>(`/v1/affiliate/commissions${qs ? `?${qs}` : ""}`);
    },
  },
  // Niche Tool v1 — additive, separate from every other feature group.
  nicheV1: {
    candidates: (params: {
      jalur: NicheJalurCuan;
      tampilMuka?: NicheTampilMuka;
      modal?: NicheLevel;
      waktu?: NicheLevel;
      aksesBarang?: boolean;
      minat?: string;
    }) => {
      const search = new URLSearchParams();
      search.set("jalur", params.jalur);
      if (params.tampilMuka) search.set("tampilMuka", params.tampilMuka);
      if (params.modal) search.set("modal", params.modal);
      if (params.waktu) search.set("waktu", params.waktu);
      if (params.aksesBarang !== undefined) search.set("aksesBarang", String(params.aksesBarang));
      if (params.minat?.trim()) search.set("minat", params.minat.trim());
      return request<NicheCandidateV1Dto[]>(`/v1/niche/candidates?${search.toString()}`);
    },
    score: (payload: NicheScoreRequestV1) =>
      request<NicheScoreResponseV1Dto>("/v1/niche/score", { method: "POST", body: JSON.stringify(payload) }),
    saveResult: (payload: NicheScoreRequestV1) =>
      request<NicheResultResponseV1Dto>("/v1/niche/result", { method: "POST", body: JSON.stringify(payload) }),
  },
  wallet: {
    get: (params?: { q?: string; sort?: "date" | "amount" | "type" | "status"; order?: "asc" | "desc" }) => {
      const search = new URLSearchParams();
      if (params?.q) search.set("q", params.q);
      if (params?.sort) search.set("sort", params.sort);
      if (params?.order) search.set("order", params.order);
      const query = search.toString();
      return request<WalletDto>(`/wallet${query ? `?${query}` : ""}`);
    },
    renewMembership: (planId: string) =>
      request<{ paymentId: string; plan: string; amount: number; membershipExpiresAt: string; user: ApiUser }>("/wallet/renew-membership", {
        method: "POST",
        body: JSON.stringify({ planId }),
      }),
    setAutoRenew: (enabled: boolean) =>
      request<{ user: ApiUser; autoRenew: WalletDto["autoRenew"] }>("/wallet/auto-renew", {
        method: "POST",
        body: JSON.stringify({ enabled }),
      }),
    recapPdf: (params?: { q?: string; sort?: "date" | "amount" | "type" | "status"; order?: "asc" | "desc" }) => {
      const search = new URLSearchParams();
      if (params?.q) search.set("q", params.q);
      if (params?.sort) search.set("sort", params.sort);
      if (params?.order) search.set("order", params.order);
      const query = search.toString();
      return downloadRequest(`/wallet/transactions.pdf${query ? `?${query}` : ""}`);
    },
  },
  notifications: {
    list: () => request<NotificationsResponse>("/notifications"),
    unreadCount: () => request<{ unreadCount: number }>("/notifications/unread-count"),
    markRead: (id: string) => request<{ id: string; read: boolean }>(`/notifications/${encodeURIComponent(id)}/read`, { method: "POST" }),
    markAllRead: () => request<{ count: number }>("/notifications/read-all", { method: "POST" }),
  },
  guidance: () => request<Array<{ id: string; type?: string; title: string; desc: string; cta: string; color: string; targetUrl?: string | null; isLocked?: boolean }>>("/guidance"),
  hookIdeas: (params?: { category?: string; niche?: string; theme?: string; q?: string }) => {
    const search = new URLSearchParams();
    if (params?.category && params.category !== "ALL") search.set("category", params.category);
    if (params?.niche && params.niche !== "ALL") search.set("niche", params.niche);
    if (params?.theme && params.theme !== "ALL") search.set("theme", params.theme);
    if (params?.q) search.set("q", params.q);
    const query = search.toString();
    return request<{ ideas: HookIdeaDto[]; filters: { categories: string[]; niches: string[]; themes: string[] } }>(`/hook-ideas${query ? `?${query}` : ""}`);
  },
  tools: {
    list: () => request<MemberToolDto[]>("/tools"),
    detail: (slug: string, params?: { category?: string; niche?: string; theme?: string; q?: string }) => {
      const search = new URLSearchParams();
      if (params?.category && params.category !== "ALL") search.set("category", params.category);
      if (params?.niche && params.niche !== "ALL") search.set("niche", params.niche);
      if (params?.theme && params.theme !== "ALL") search.set("theme", params.theme);
      if (params?.q) search.set("q", params.q);
      const query = search.toString();
      return request<MemberToolDetailDto>(`/tools/${encodeURIComponent(slug)}${query ? `?${query}` : ""}`);
    },
    downloadItem: (slug: string, itemId: string) =>
      downloadRequest(`/tools/${encodeURIComponent(slug)}/items/${encodeURIComponent(itemId)}/download`),
    use: (slug: string) =>
      request<{ used: number; remaining: number | null; dailyLimit: number | null }>(`/tools/${encodeURIComponent(slug)}/use`, { method: "POST" }),
    notes: (slug: string) =>
      request<MemberToolNotesDto>(`/tools/${encodeURIComponent(slug)}/notes`),
    saveNote: (slug: string, payload: { itemId: string; value: string }) =>
      request<MemberToolUserNoteDto>(`/tools/${encodeURIComponent(slug)}/notes`, { method: "PUT", body: JSON.stringify(payload) }),
  },
  creatorNotes: {
    list: () => request<CreatorNotesDto>("/creator-notes"),
    create: (payload: { title: string; content: string; sourceToolSlug?: string; sourceItemId?: string; sourceLabel?: string; icon?: string; accent?: string; isPinned?: boolean }) =>
      request<CreatorNoteDto>("/creator-notes", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: string, payload: { title?: string; content?: string; isPinned?: boolean }) =>
      request<CreatorNoteDto>(`/creator-notes/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) }),
    delete: (id: string) =>
      request<{ deleted: boolean }>(`/creator-notes/${encodeURIComponent(id)}`, { method: "DELETE" }),
  },
  admin: {
    dashboard: () => request<{
      users: number;
      activeMembers: number;
      publishedLessons: number;
      draftLessons?: number;
      lessonSections?: number;
      tools?: number;
      activeTools?: number;
      toolCategories?: number;
      toolItems?: number;
      publishedToolItems?: number;
      activePlans?: number;
      landingPages?: number;
      publishedLandingPages?: number;
      usageVideos?: number;
      publishedUsageVideos?: number;
      paidRevenue: number;
      pendingPayments?: number;
      successfulWithdrawals: number;
      pendingWithdrawals: number;
      paidCommissions?: number;
      pendingCommissions?: number;
      referralClicksToday?: number;
      openMentorReports?: number;
      reviewMentorReports?: number;
      warningMentors?: number;
      blockedMentors?: number;
    }>("/admin/dashboard"),
    actionLogs: {
      list: (params?: { q?: string; limit?: number }) => {
        const search = new URLSearchParams();
        if (params?.q) search.set("q", params.q);
        if (params?.limit) search.set("limit", String(params.limit));
        const query = search.toString();
        return request<AdminActionLogDto[]>(`/admin/action-logs${query ? `?${query}` : ""}`);
      },
    },
    passwordResets: {
      list: () => request<PasswordResetRequestDto[]>("/admin/password-resets"),
      approve: (id: string) => request<PasswordResetRequestDto & { resetToken: string; tokenExpiresAt: string }>(`/admin/password-resets/${id}/approve`, { method: "PATCH" }),
      reject: (id: string, payload?: { adminNote?: string }) =>
        request<PasswordResetRequestDto>(`/admin/password-resets/${id}/reject`, {
          method: "PATCH",
          body: JSON.stringify(payload ?? {}),
        }),
    },
    landing: {
      get: () => request<LandingContent>("/admin/landing"),
      update: (payload: LandingContent) =>
        request<LandingContent>("/admin/landing", { method: "PUT", body: JSON.stringify(payload) }),
    },
    landingPages: {
      list: () => request<LandingPageDto[]>("/admin/landing-pages"),
      save: (payload: Omit<LandingPageDto, "createdAt" | "updatedAt">) =>
        request<LandingPageDto>("/admin/landing-pages", { method: "PUT", body: JSON.stringify(payload) }),
      saveWithVideo: (payload: Omit<LandingPageDto, "createdAt" | "updatedAt">, video?: File | null) => {
        const body = new FormData();
        body.append("id", payload.id ?? "");
        body.append("slug", payload.slug ?? "");
        body.append("name", payload.name ?? "");
        body.append("description", payload.description ?? "");
        body.append("audienceRole", payload.audienceRole ?? "");
        body.append("campaign", payload.campaign ?? "");
        body.append("referralCode", payload.referralCode ?? "");
        body.append("content", JSON.stringify(payload.content ?? {}));
        body.append("isPublished", String(Boolean(payload.isPublished)));
        body.append("isDefault", String(Boolean(payload.isDefault)));
        body.append("sortOrder", String(payload.sortOrder ?? 0));
        if ("notificationAudience" in payload && payload.notificationAudience) {
          body.append("notificationAudience", String(payload.notificationAudience));
        }
        if (video) body.append("video", video);
        return request<LandingPageDto>("/admin/landing-pages/form", { method: "PUT", body });
      },
      remove: (id: string) => request<{ id: string; deleted: boolean; deactivated: boolean }>(`/admin/landing-pages/${id}`, { method: "DELETE" }),
      removeVideo: (id: string) => request<LandingPageDto>(`/admin/landing-pages/${id}/video`, { method: "DELETE" }),
    },
    usageVideos: {
      list: () => request<UsageVideoDto[]>("/admin/usage-videos"),
      save: (payload: Omit<UsageVideoDto, "createdAt" | "updatedAt">) =>
        request<UsageVideoDto>("/admin/usage-videos", { method: "PUT", body: JSON.stringify(payload) }),
      saveWithVideo: (payload: Omit<UsageVideoDto, "createdAt" | "updatedAt">, video?: File | null) => {
        const body = new FormData();
        body.append("id", payload.id ?? "");
        body.append("targetPath", payload.targetPath ?? "");
        body.append("label", payload.label ?? "");
        body.append("title", payload.title ?? "");
        body.append("subtitle", payload.subtitle ?? "");
        body.append("durationLabel", payload.durationLabel ?? "");
        body.append("videoUrl", payload.videoUrl ?? "");
        body.append("thumbnailGradient", payload.thumbnailGradient ?? "");
        body.append("icon", payload.icon ?? "Play");
        body.append("ctaLabel", payload.ctaLabel ?? "");
        body.append("ctaUrl", payload.ctaUrl ?? "");
        body.append("autoplay", String(Boolean(payload.autoplay)));
        body.append("isPublished", String(Boolean(payload.isPublished)));
        body.append("sortOrder", String(payload.sortOrder ?? 0));
        if ("notificationAudience" in payload && payload.notificationAudience) {
          body.append("notificationAudience", String(payload.notificationAudience));
        }
        if (video) body.append("video", video);
        return request<UsageVideoDto>("/admin/usage-videos/form", { method: "PUT", body });
      },
      uploadVideo: (id: string, video: File) => {
        const body = new FormData();
        body.append("video", video);
        return request<UsageVideoDto>(`/admin/usage-videos/${id}/video`, { method: "POST", body });
      },
      removeVideo: (id: string) => request<UsageVideoDto>(`/admin/usage-videos/${id}/video`, { method: "DELETE" }),
      remove: (id: string) => request<{ id: string; deleted: boolean }>(`/admin/usage-videos/${id}`, { method: "DELETE" }),
    },
    updates: {
      list: () => request<AdminUpdateNotificationDto[]>("/admin/updates"),
      publish: (payload: AdminUpdateNotificationInput) =>
        request<{ target: AdminUpdateTarget; createdCount: number; items: NotificationDto[] }>("/admin/updates", {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            source: payload.source ?? payload.sourceType ?? "ADMIN_UPDATE",
            color: payload.color ?? "from-emerald-500 to-teal-400",
          }),
        }),
    },
    lessons: {
      list: () => request<Array<LessonDto & { sortOrder: number; isPublished: boolean }>>("/admin/lessons"),
      save: (payload: LessonDto & { sortOrder: number; isPublished: boolean }) =>
        request<LessonDto>("/admin/lessons", { method: "PUT", body: JSON.stringify(payload) }),
      uploadVideo: (id: string, video: File, metadata?: { title?: string; description?: string; durationLabel?: string; sortOrder?: number }) => {
        const body = new FormData();
        body.append("video", video);
        if (metadata?.title) body.append("title", metadata.title);
        if (metadata?.description) body.append("description", metadata.description);
        if (metadata?.durationLabel) body.append("durationLabel", metadata.durationLabel);
        if (metadata?.sortOrder !== undefined) body.append("sortOrder", String(metadata.sortOrder));
        return request<LessonDto["video"]>(`/admin/lessons/${id}/video`, { method: "POST", body });
      },
      removeVideo: (id: string) => request<{ lessonId: string }>(`/admin/lessons/${id}/video`, { method: "DELETE" }),
      removeSubVideo: (lessonId: string, videoId: string) => request<{ lessonId: string; videoId: string }>(`/admin/lessons/${lessonId}/videos/${videoId}`, { method: "DELETE" }),
      uploadPdf: (id: string, payload: { pdf?: File | null; requiredPlanId?: string }) => {
        const body = new FormData();
        if (payload.pdf) body.append("pdf", payload.pdf);
        body.append("requiredPlanId", payload.requiredPlanId ?? "");
        return request<LessonDto["pdf"]>(`/admin/lessons/${id}/pdf`, { method: "POST", body });
      },
      removePdf: (id: string) => request<{ lessonId: string }>(`/admin/lessons/${id}/pdf`, { method: "DELETE" }),
      remove: (id: string) => request<{ id: string }>(`/admin/lessons/${id}`, { method: "DELETE" }),
    },
    guidance: {
      list: () => request<Array<{ id: string; type: string; title: string; description: string; cta: string; colorGradient: string; sortOrder: number; isActive: boolean }>>("/admin/guidance"),
      create: (payload: { type: string; title: string; desc: string; cta: string; color: string; sortOrder: number; isActive: boolean }) =>
        request<unknown>("/admin/guidance", { method: "POST", body: JSON.stringify(payload) }),
      update: (id: string, payload: { type: string; title: string; desc: string; cta: string; color: string; sortOrder: number; isActive: boolean }) =>
        request<unknown>(`/admin/guidance/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
      remove: (id: string) => request<unknown>(`/admin/guidance/${id}`, { method: "DELETE" }),
    },
    hookIdeas: {
      list: () => request<HookIdeaDto[]>("/admin/hook-ideas"),
      create: (payload: Omit<HookIdeaDto, "id" | "createdAt" | "updatedAt">) =>
        request<HookIdeaDto>("/admin/hook-ideas", { method: "POST", body: JSON.stringify(payload) }),
      update: (id: string, payload: Omit<HookIdeaDto, "id" | "createdAt" | "updatedAt">) =>
        request<HookIdeaDto>(`/admin/hook-ideas/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
      remove: (id: string) => request<{ id: string }>(`/admin/hook-ideas/${id}`, { method: "DELETE" }),
    },
    tools: {
      list: () => request<MemberToolDto[]>("/admin/tools"),
      save: (payload: Omit<MemberToolDto, "itemCount" | "createdAt" | "updatedAt">) =>
        request<MemberToolDto>("/admin/tools", { method: "PUT", body: JSON.stringify(payload) }),
      remove: (id: string) => request<{ id: string; deleted: boolean; deactivated: boolean }>(`/admin/tools/${id}`, { method: "DELETE" }),
      items: (slug: string) => request<{ tool: MemberToolDto; items: MemberToolItemDto[] }>(`/admin/tools/${encodeURIComponent(slug)}/items`),
      saveItem: (slug: string, payload: Omit<MemberToolItemDto, "toolId" | "createdAt" | "updatedAt">) =>
        request<MemberToolItemDto>(`/admin/tools/${encodeURIComponent(slug)}/items`, { method: "PUT", body: JSON.stringify(payload) }),
      uploadItemMedia: (id: string, media: File) => {
        const body = new FormData();
        body.append("media", media);
        return request<MemberToolItemDto>(`/admin/tool-items/${id}/media`, { method: "POST", body });
      },
      removeItemMedia: (id: string) => request<MemberToolItemDto>(`/admin/tool-items/${id}/media`, { method: "DELETE" }),
      removeItem: (id: string) => request<{ id: string }>(`/admin/tool-items/${id}`, { method: "DELETE" }),
    },
    toolCategories: {
      list: () => request<MemberToolCategoryDto[]>("/admin/tool-categories"),
      save: (payload: MemberToolCategoryDto) =>
        request<MemberToolCategoryDto>("/admin/tool-categories", { method: "PUT", body: JSON.stringify(payload) }),
      remove: (id: string) => request<{ id: string; deleted: boolean; deactivated: boolean }>(`/admin/tool-categories/${id}`, { method: "DELETE" }),
    },
    plans: {
      list: () => request<Array<{ id: string; months: number; price: number | string; label: string; desc: string; isBest: boolean; saveLabel?: string; isFree: boolean; affiliateCommissionRate: number; features: string[]; lessonIds: string[]; toolAccess: Array<{ slug: string; dailyLimit?: number | null }>; guidanceAccess: string[]; sortOrder: number; isActive: boolean }>>("/admin/plans"),
      save: (payload: { id: string; months: number; price: number; label: string; desc: string; best: boolean; save?: string; isFree: boolean; affiliateCommissionRate: number; features: string[]; lessonIds: string[]; toolAccess: Array<{ slug: string; dailyLimit?: number | null }>; guidanceAccess: string[]; sortOrder: number; isActive: boolean }) =>
        request<unknown>("/admin/plans", { method: "PUT", body: JSON.stringify(payload) }),
      remove: (id: string) => request<{ id: string; deleted: boolean; deactivated: boolean }>(`/admin/plans/${id}`, { method: "DELETE" }),
    },
    users: {
      list: () => request<Array<{ id: string; name: string; wa: string; referralCode: string; role: string; level: string; balance: number; membershipExpiresAt?: string | null; vipStatus?: "FREE" | "PRO"; activePlan?: { id: string; label: string; isFree: boolean; months: number } | null; joinedAt: string; mentorStatus: MentorStatus; mentorLevel: MentorLevel; mentorInactiveUntil?: string | null; mentorInactiveReason?: string | null; mentorTermsAcceptedAt?: string | null; mentorRatingAvg?: number | null; referralCount?: number; mentorReportCount?: number }>>("/admin/users"),
      update: (id: string, payload: { role?: string; level?: string }) =>
        request<unknown>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
      updateMentorStatus: (id: string, payload: { mentorStatus?: MentorStatus; mentorLevel?: MentorLevel; mentorInactiveUntil?: string | null; mentorInactiveReason?: string; mentorTermsAcceptedAt?: string | null }) =>
        request<unknown>(`/admin/users/${id}/mentor-status`, { method: "PATCH", body: JSON.stringify(payload) }),
    },
    mentorReports: {
      list: () => request<MentorReportDto[]>("/admin/mentor-reports"),
      update: (id: string, payload: { status: MentorReportStatus; adminNote?: string; mentorStatus?: MentorStatus }) =>
        request<MentorReportDto>(`/admin/mentor-reports/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
      evidence: (id: string) => downloadRequest(`/admin/mentor-reports/${id}/evidence`),
    },
    userRoles: {
      list: () => request<UserMasterDto[]>("/admin/user-roles"),
      save: (payload: UserMasterDto) => request<UserMasterDto>("/admin/user-roles", { method: "PUT", body: JSON.stringify(payload) }),
      remove: (code: string) => request<{ code: string; deleted: boolean; deactivated: boolean }>(`/admin/user-roles/${encodeURIComponent(code)}`, { method: "DELETE" }),
    },
    userLevels: {
      list: () => request<UserMasterDto[]>("/admin/user-levels"),
      save: (payload: UserMasterDto) => request<UserMasterDto>("/admin/user-levels", { method: "PUT", body: JSON.stringify(payload) }),
      remove: (code: string) => request<{ code: string; deleted: boolean; deactivated: boolean }>(`/admin/user-levels/${encodeURIComponent(code)}`, { method: "DELETE" }),
    },
    withdrawals: {
      list: () => request<Array<{ id: string; amount: number; bankName: string; accountNumber: string; accountName?: string | null; status: string; processedAt?: string | null; createdAt: string; updatedAt?: string; user: { name: string; wa: string } }>>("/admin/withdrawals"),
      update: (id: string, status: string) =>
        request<unknown>(`/admin/withdrawals/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    },
    // Niche Tool v1 admin panel — lives at /v1/admin/niche/* (versioned alongside the public
    // /v1/niche/* read endpoints), grouped here under `admin` for discoverability.
    niche: {
      candidates: {
        list: () => request<NicheCandidateAdminDto[]>("/v1/admin/niche/candidates"),
        create: (payload: NicheCandidateAdminInput) =>
          request<NicheCandidateAdminDto>("/v1/admin/niche/candidates", { method: "POST", body: JSON.stringify(payload) }),
        update: (id: string, payload: Partial<NicheCandidateAdminInput>) =>
          request<NicheCandidateAdminDto>(`/v1/admin/niche/candidates/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) }),
        remove: (id: string) =>
          request<{ id: string; deleted: boolean }>(`/v1/admin/niche/candidates/${encodeURIComponent(id)}`, { method: "DELETE" }),
      },
      scoringConfig: {
        get: () => request<NicheScoringConfigAdminDto>("/v1/admin/niche/scoring-config"),
        update: (payload: NicheScoringConfigDto) =>
          request<NicheScoringConfigDto>("/v1/admin/niche/scoring-config", { method: "PUT", body: JSON.stringify(payload) }),
      },
    },
  },
};
