import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Compass, Crown, ExternalLink, Lightbulb, Lock, RefreshCw, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api, type MemberToolDto } from "@/lib/api";
import { ShowMoreList } from "@/components/ShowMoreList";
import { contentColorTheme, gradientBackground } from "@/lib/content-colors";
import { toolIcons } from "./tool-icons";

// Default on, can be disabled without a code change by setting VITE_NICHE_TOOL_V1=false.
const ENABLE_NICHE_TOOL_V1 = import.meta.env.VITE_NICHE_TOOL_V1 !== "false";

export const ToolList = () => {
  const { data: tools = [], isLoading } = useQuery({ queryKey: ["tools"], queryFn: api.tools.list });
  const [activeCategory, setActiveCategory] = useState("ALL");
  const totalTools = tools.length;
  const freeTools = tools.filter((tool) => tool.requiredMembership === "FREE" || Boolean(tool.freeDailyLimit));
  const categories = useMemo(() => {
    const bySlug = new Map<string, NonNullable<MemberToolDto["category"]>>();
    tools.forEach((tool) => {
      if (tool.category) bySlug.set(tool.category.slug, tool.category);
    });
    return [...bySlug.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, [tools]);
  const visibleCategories = activeCategory === "ALL" ? categories : categories.filter((category) => category.slug === activeCategory);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="mt-6 text-2xl font-extrabold">Alat <span className="text-gradient-primary">Bantu</span></h1>
          <p className="text-sm text-muted-foreground">Semua alat untuk bikin konten lebih mudah</p>
        </div>
        <span className="mt-8 shrink-0 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-extrabold text-primary">
          {totalTools || 24} Alat
        </span>
      </div>

      {isLoading && <div className="glass-card rounded-3xl p-5 text-sm text-muted-foreground">Memuat tools...</div>}

      {!isLoading && (
        <>
          <div className="-mx-4 overflow-x-auto px-4 hide-scrollbar md:mx-0 md:overflow-visible md:px-0">
            <div className="flex w-max gap-2 md:flex-wrap md:w-full">
              {[{ slug: "ALL", name: "Semua" }, ...categories].map((category) => {
                const active = activeCategory === category.slug;
                return (
                  <button
                    key={category.slug}
                    type="button"
                    onClick={() => setActiveCategory(category.slug)}
                    className={`h-9 shrink-0 rounded-full px-4 text-xs font-extrabold transition-colors ${
                      active ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>

          {ENABLE_NICHE_TOOL_V1 && (
            <Link to="/app/niche-tool" className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600">
                <Compass className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-emerald-600">Alat Penentuan Niche</span>
                <span className="mt-1 block text-xs font-semibold leading-relaxed text-muted-foreground">
                  Jawab beberapa pertanyaan singkat, dapatkan niche utama + cadangan yang berpotensi cocok buat kamu.
                </span>
              </span>
            </Link>
          )}

          <div className="rounded-2xl border border-primary/25 bg-primary/10 p-4">
            <div className="flex gap-3">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Untuk akses gratis, kamu punya <span className="font-extrabold text-primary">{freeTools.length} alat gratis</span> dengan batas harian.
                <Link to="/app/payment" className="font-extrabold text-primary"> Naik ke PRO</Link> untuk akses semua {totalTools || 24} alat tanpa batas.
              </p>
            </div>
          </div>

          <Link to="/app/notifications" className="flex items-center gap-3 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-300">
              <Bell className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold text-sky-300">Info konten baru masuk notifikasi</span>
              <span className="mt-1 block text-xs font-semibold leading-relaxed text-muted-foreground">
                Pantau inbox agar bahan baru, template, dan info komisi tidak kelewat.
              </span>
            </span>
            <ExternalLink className="h-4 w-4 shrink-0 text-sky-300" />
          </Link>

          <div className="space-y-5">
            {visibleCategories.map((category) => {
              const categoryTools = tools.filter((tool) => tool.category?.slug === category.slug);
              if (!categoryTools.length) return null;
              return (
                <ToolCategorySection key={category.slug} category={category} tools={categoryTools} />
              );
            })}
          </div>

          <Link
            to="/app/payment"
            className="flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4 text-accent shadow-[0_18px_48px_hsl(51_100%_50%_/_0.10)]"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/15">
              <Crown className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-extrabold">Buka Akses PRO Sekarang</span>
              <span className="mt-0.5 block text-xs font-semibold text-muted-foreground">Akses semua {totalTools || 24} alat bantu + 31 modul penuh</span>
            </span>
            <ExternalLink className="h-4 w-4 shrink-0" />
          </Link>
        </>
      )}
    </div>
  );
};

const ToolCategorySection = ({ category, tools }: { category: NonNullable<MemberToolDto["category"]>; tools: MemberToolDto[] }) => {
  const CategoryIcon = toolIcons[tools[0]?.icon as keyof typeof toolIcons] ?? Lightbulb;
  const isContentMaterials = category.name.toLowerCase() === "bahan konten" || category.slug === "bahan-konten";
  const isCreatorSpace = category.slug === "ruang-kreator";
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white" style={gradientBackground(category.colorGradient)}>
            <CategoryIcon className="h-4 w-4" />
          </span>
          <h2 className="truncate text-sm font-extrabold">{category.name}</h2>
        </div>
        <p className="shrink-0 text-right text-[11px] font-semibold text-muted-foreground">
          {tools.length} alat
          <span className="block uppercase">{tools.some((tool) => tool.isLocked) ? "PRO" : ""}</span>
        </p>
      </div>
      {isContentMaterials || isCreatorSpace ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {tools.map((tool) => <ToolCard key={tool.slug} tool={tool} />)}
        </div>
      ) : (
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 hide-scrollbar md:mx-0 md:grid md:snap-none md:grid-cols-3 md:overflow-visible md:px-0 xl:grid-cols-4">
          {tools.map((tool) => <ToolCard key={tool.slug} tool={tool} className="w-[150px] shrink-0 snap-start md:w-auto md:shrink" />)}
        </div>
      )}
    </section>
  );
};

const ToolCard = ({ tool, className = "" }: { tool: MemberToolDto; className?: string }) => {
  const Icon = toolIcons[tool.icon as keyof typeof toolIcons] ?? Lightbulb;
  const colors = contentColorTheme(tool.colorGradient);
  const locked = Boolean(tool.isLocked);
  const dailyLimit = tool.freeDailyLimit ?? null;
  const remaining = tool.freeDailyRemaining ?? dailyLimit;
  const progress = dailyLimit && typeof remaining === "number" ? Math.max(6, Math.min(100, Math.round((remaining / dailyLimit) * 100))) : 100;
  const href = locked ? "/app/payment" : `/app/tools/${tool.slug}`;
  const recentlyUpdated = ["video-footage", "foto-footage", "ide-sound-musik-trending", "ide-caption-hashtag"].includes(tool.slug);

  return (
    <Link
      to={href}
      className={`relative min-h-[154px] rounded-2xl border bg-card p-3 shadow-[0_14px_36px_hsl(0_0%_0%_/_0.10)] transition-transform hover:scale-[1.01] ${className}`}
      style={{ borderColor: locked ? "hsl(var(--border))" : colors.border }}
    >
      {locked && (
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[9px] font-black text-accent ring-1 ring-accent/35">
          <Lock className="h-2.5 w-2.5" /> PRO
        </span>
      )}
      {!locked && (
        <span className="absolute right-2 top-2 rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-black text-primary ring-1 ring-primary/25">
          Gratis
        </span>
      )}
      <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ backgroundColor: colors.iconBg, color: colors.text }}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="mt-3 min-w-0">
        <p className="line-clamp-2 text-sm font-extrabold leading-tight">{tool.name}</p>
        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{tool.description}</p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-[10px] font-semibold text-muted-foreground">
        <span>{tool.cadenceLabel}</span>
        {locked ? <span>Terkunci</span> : <span className="text-primary">{dailyLimit ? `${remaining}/${dailyLimit} sisa` : "Tanpa batas"}</span>}
      </div>
      {recentlyUpdated && (
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-1 text-[9px] font-black text-sky-300">
          <RefreshCw className="h-2.5 w-2.5" />
          Diperbarui
        </div>
      )}
      {!locked && dailyLimit && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full" style={{ width: `${progress}%`, background: colors.gradient }} />
        </div>
      )}
    </Link>
  );
};
