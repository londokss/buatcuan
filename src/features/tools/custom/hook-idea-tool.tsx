import { Copy, Lightbulb, Lock, Save, Wand2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import { ManagedUsageVideoCard } from "@/components/ManagedUsageVideoCard";
import { PremiumSearchSelect } from "@/components/PremiumFormControls";
import { ShowMoreList } from "@/components/ShowMoreList";
import { Button } from "@/components/ui/button";
import { api, getErrorMessage, type MemberToolDto, type MemberToolItemDto } from "@/lib/api";
import { contentColorTheme } from "@/lib/content-colors";

type FilterKey = "category" | "niche" | "theme";
type GeneratorFilterConfig = { key: FilterKey; label: string; allLabel?: string };
type GeneratorConfig = {
  title: string;
  buttonLabel: string;
  emptyLabel: string;
  filters: GeneratorFilterConfig[];
};
type Selection = Record<FilterKey, string>;

const defaultConfig: GeneratorConfig = {
  title: "Generate Hook Sekarang",
  buttonLabel: "Buatkan Hook untuk Saya",
  emptyLabel: "Belum ada hook admin untuk pilihan ini",
  filters: [
    { key: "category", label: "Platform", allLabel: "Semua Platform" },
    { key: "niche", label: "Niche", allLabel: "Semua Niche" },
    { key: "theme", label: "Tipe Konten", allLabel: "Semua Tipe Konten" },
  ],
};

const hookTypes = ["Pertanyaan", "Kejutan", "Tantangan", "Fakta Menarik", "Cerita"] as const;

const HookIdeaTool = ({ slug }: { slug: string }) => {
  const queryClient = useQueryClient();
  const [selection, setSelection] = useState<Selection>({ category: "ALL", niche: "ALL", theme: "ALL" });
  const [generating, setGenerating] = useState(false);
  const [hooks, setHooks] = useState<MemberToolItemDto[]>([]);
  const { data } = useQuery({
    queryKey: ["tool", slug, "ide-hook"],
    queryFn: () => api.tools.detail(slug, { category: "ALL" }),
  });

  const tool = data?.tool;
  const theme = contentColorTheme(tool?.colorGradient);
  const config = useMemo(() => resolveGeneratorConfig(tool, defaultConfig), [tool]);
  const limit = tool?.freeDailyLimit ?? null;
  const remaining = tool?.freeDailyRemaining ?? limit;
  const used = tool?.freeDailyUsed ?? (limit && typeof remaining === "number" ? Math.max(0, limit - remaining) : 0);
  const percent = limit ? Math.min(100, Math.max(0, Math.round(((remaining ?? 0) / limit) * 100))) : 100;
  const matchingItems = useMemo(() => filterItems(data?.items ?? [], selection), [data?.items, selection]);
  const isFreeMember = Boolean(tool?.freeDailyLimit);
  const locked = Boolean(tool?.isLocked);

  useEffect(() => {
    if (!hooks.length && matchingItems.length) setHooks(matchingItems.slice(0, 3));
  }, [hooks.length, matchingItems]);

  const generate = async () => {
    if (locked) {
      toast.error("Tools ini khusus member PRO");
      return;
    }
    if (limit && (remaining ?? 0) <= 0) {
      toast.error("Limit generate hari ini sudah habis");
      return;
    }
    if (!matchingItems.length) {
      toast.error(config.emptyLabel);
      return;
    }
    try {
      setGenerating(true);
      await api.tools.use(slug);
      setHooks(shuffleItems(matchingItems).slice(0, Math.min(5, matchingItems.length)));
      toast.success("Hook dibuat dari data admin");
      void queryClient.invalidateQueries({ queryKey: ["tool", slug, "ide-hook"] });
      void queryClient.invalidateQueries({ queryKey: ["tools"] });
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal generate hook"));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="sticky -top-4 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-xl">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <BackButton to="/app/tools" label="Alat Bantu" />
          <h1 className="text-lg font-extrabold">Ide Hook</h1>
          <div className="flex justify-end">
            <span className="rounded-full border px-3 py-1.5 text-xs font-extrabold" style={{ borderColor: theme.border, background: theme.iconBg, color: theme.text }}>
              {limit ? `${remaining ?? 0}/${limit} sisa` : "Tanpa batas"}
            </span>
          </div>
        </div>
      </div>

      <HookUsageCard />
      <HookExplainer theme={theme} />
      <HookLimitBar limit={limit} remaining={remaining} used={used} percent={percent} theme={theme} />

      <section className="space-y-3">
        <div className="flex items-center gap-2" style={{ color: theme.text }}>
          <Wand2 className="h-4 w-4" />
          <h2 className="font-extrabold text-foreground">{config.title}</h2>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="space-y-4">
            {config.filters.map((filter) => (
              <GeneratorSelect
                key={filter.key}
                filter={filter}
                options={getFilterOptions(data?.filters, filter.key)}
                value={selection[filter.key]}
                onChange={(value) => setSelection((current) => ({ ...current, [filter.key]: value }))}
              />
            ))}
            <Button type="button" onClick={generate} disabled={generating || locked} variant="outline" className="h-12 w-full rounded-xl font-extrabold disabled:opacity-50">
              <Wand2 className="mr-2 h-4 w-4" />
              {generating ? "Mengambil Hook..." : config.buttonLabel}
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-extrabold">Hasil Hook Hari Ini</h2>
          <button type="button" onClick={generate} disabled={generating || locked} className="text-xs font-extrabold disabled:text-muted-foreground" style={{ color: theme.text }}>Generate lagi</button>
        </div>
        {hooks.length ? (
          <ShowMoreList
            items={hooks}
            initial={3}
            step={2}
            className="space-y-3"
            renderItem={(hook, index) => (
              <HookResultCard key={hook.id} slug={slug} hook={hook} index={index} locked={isToolItemLocked(hook, isFreeMember)} theme={theme} />
            )}
          />
        ) : (
          <EmptyResult label={config.emptyLabel} />
        )}
      </section>
    </div>
  );
};

function HookUsageCard() {
  return (
    <ManagedUsageVideoCard
      targetPath="/app/tools/ide-hook"
      className="border-pink-500/25"
      accentClassName="border-pink-400/50 bg-pink-500/15 text-pink-300"
      fallback={{
        title: "Cara Pakai Ide Hook BuatCuan",
        subtitle: "Pelajari cara pilih & pakai hook yang tepat",
        durationLabel: "3 menit",
        thumbnailGradient: "from-pink-950 via-fuchsia-950 to-indigo-950",
      }}
    />
  );
}

function HookExplainer({ theme }: { theme: ReturnType<typeof contentColorTheme> }) {
  return (
    <section className="rounded-2xl border p-4" style={{ borderColor: theme.border, background: theme.cardBg }}>
      <div className="mb-3 flex items-center gap-2" style={{ color: theme.text }}>
        <Lightbulb className="h-4 w-4" />
        <h2 className="font-extrabold">Apa itu Hook?</h2>
      </div>
      <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
        Hook adalah kalimat atau visual 3 detik pertama di video yang menentukan apakah orang akan lanjut nonton atau scroll.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {hookTypes.map((item) => (
          <span key={item} className="rounded-lg border px-3 py-1.5 text-xs font-bold" style={{ borderColor: theme.border, background: theme.iconBg, color: theme.text }}>{item}</span>
        ))}
      </div>
    </section>
  );
}

function HookLimitBar({ limit, remaining, used, percent, theme }: { limit: number | null; remaining?: number | null; used: number; percent: number; theme: ReturnType<typeof contentColorTheme> }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted-foreground">Sisa generate hari ini</p>
        <p className="text-sm font-extrabold" style={{ color: theme.text }}>{limit ? `${remaining ?? 0} dari ${limit}` : "Tanpa batas"}</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: theme.progressTrack }}>
        <div className="h-full rounded-full" style={{ width: `${percent}%`, background: theme.gradient }} />
      </div>
      <p className="mt-2 text-xs font-semibold text-muted-foreground">
        Reset setiap hari pukul 00.00 · {limit ? `${used} sudah dipakai` : <span className="text-accent">PRO member: Tanpa batas</span>}
      </p>
    </section>
  );
}

function GeneratorSelect({ filter, options, value, onChange }: { filter: GeneratorFilterConfig; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-muted-foreground">{filter.label}</span>
      <PremiumSearchSelect
        value={value}
        onChange={onChange}
        placeholder={filter.allLabel ?? `Semua ${filter.label}`}
        options={[
          { label: filter.allLabel ?? `Semua ${filter.label}`, value: "ALL" },
          ...options.map((item) => ({ label: item, value: item })),
        ]}
        triggerClassName="focus-visible:ring-pink-500/30"
      />
    </label>
  );
}

function HookResultCard({ slug, hook, index, locked, theme }: { slug: string; hook: MemberToolItemDto; index: number; locked: boolean; theme: ReturnType<typeof contentColorTheme> }) {
  if (locked) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 opacity-75">
        <div className="blur-[1px]">
          <p className="text-xs font-bold text-muted-foreground">Hook #{index + 1}</p>
          <p className="mt-3 text-lg font-extrabold leading-relaxed text-muted-foreground">{hook.openingHook ?? hook.title}</p>
        </div>
        <div className="absolute inset-0 grid place-items-center bg-background/55">
          <div className="text-center">
            <Lock className="mx-auto mb-2 h-6 w-6 text-accent" />
            <p className="text-sm font-extrabold text-muted-foreground">Hook #{index + 1} khusus PRO</p>
            <Link to="/app/payment" className="mt-3 inline-flex h-10 items-center rounded-xl border border-accent/45 px-5 text-sm font-extrabold text-accent">
              Buka Akses PRO
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const top = index === 0;
  const saveToCreatorNotes = async () => {
    try {
      await api.creatorNotes.create({
        title: hook.title,
        content: textContentFromItem(hook),
        sourceToolSlug: slug,
        sourceItemId: hook.id,
        sourceLabel: "Ide Hook",
        icon: "Sparkles",
        accent: "pink",
      });
      toast.success("Disimpan ke Catatan Kreator");
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal menyimpan ke Catatan Kreator"));
    }
  };

  return (
    <article className="relative rounded-2xl border bg-card p-4" style={top ? { borderColor: theme.border, background: theme.cardBg, boxShadow: theme.shadow } : undefined}>
      {top && <span className="absolute -top-3 left-4 rounded-md px-3 py-1 text-[11px] font-extrabold text-white" style={{ background: theme.gradient }}>Paling Cocok</span>}
      <p className="text-xs font-bold text-muted-foreground">Hook #{index + 1} · {hook.category ?? "Tanpa platform"}</p>
      <div className="mt-3 space-y-3">
        <CopyPreviewField label="Judul" value={hook.title} strong theme={theme} />
        <CopyPreviewField label="Hook" value={hook.openingHook ?? ""} strong accent theme={theme} />
        <CopyPreviewField label="Isi" value={hook.content} theme={theme} />
        <CopyPreviewField label="Caption" value={hook.caption ?? ""} theme={theme} />
        <CopyPreviewField label="Hashtag" value={hook.hashtags ?? ""} mono theme={theme} />
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {hook.theme ? <span className="rounded-md px-3 py-1 text-xs font-bold" style={{ background: theme.iconBg, color: theme.text }}>{hook.theme}</span> : null}
          {hook.niche ? <span className="rounded-md px-3 py-1 text-xs font-extrabold" style={{ background: theme.iconBg, color: theme.text }}>{hook.niche}</span> : null}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void saveToCreatorNotes()} className="h-9 shrink-0 rounded-xl px-3 text-xs font-extrabold">
          <Save className="mr-1.5 h-3.5 w-3.5" />
          Simpan
        </Button>
      </div>
    </article>
  );
}

function textContentFromItem(item: MemberToolItemDto) {
  return [
    item.openingHook ? `Hook: ${item.openingHook}` : null,
    `Isi: ${item.content}`,
    item.caption ? `Caption: ${item.caption}` : null,
    item.hashtags ? `Hashtag: ${item.hashtags}` : null,
  ].filter(Boolean).join("\n\n");
}

function CopyPreviewField({ label, value, strong, accent, mono, theme }: { label: string; value: string; strong?: boolean; accent?: boolean; mono?: boolean; theme: ReturnType<typeof contentColorTheme> }) {
  if (!value.trim()) return null;
  const copy = async () => {
    await navigator.clipboard.writeText(value.trim());
    toast.success(`${label} disalin`);
  };

  return (
    <div className="relative rounded-xl border border-border bg-background/45 p-3 pr-12">
      <Button type="button" variant="outline" size="sm" onClick={() => void copy()} className="absolute right-2 top-2 h-8 w-8 rounded-lg p-0" title={`Salin ${label}`} aria-label={`Salin ${label}`}>
        <Copy className="h-3.5 w-3.5" style={{ color: theme.text }} />
      </Button>
      <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`whitespace-pre-line text-sm leading-relaxed ${strong ? "font-extrabold" : "font-semibold"} ${mono ? "font-mono text-xs" : ""}`} style={accent || mono ? { color: theme.text } : undefined}>
        {value}
      </p>
    </div>
  );
}

function EmptyResult({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-sm font-semibold text-muted-foreground">
      {label}
    </div>
  );
}

function resolveGeneratorConfig(tool: MemberToolDto | undefined, fallback: GeneratorConfig): GeneratorConfig {
  const generator = typeof tool?.config?.generator === "object" && tool.config?.generator ? tool.config.generator as Record<string, unknown> : {};
  const filters = Array.isArray(generator.filters)
    ? generator.filters
        .map((item) => normalizeFilter(item))
        .filter((item): item is GeneratorFilterConfig => Boolean(item))
    : fallback.filters;

  return {
    title: typeof generator.title === "string" ? generator.title : fallback.title,
    buttonLabel: typeof generator.buttonLabel === "string" ? generator.buttonLabel : fallback.buttonLabel,
    emptyLabel: typeof generator.emptyLabel === "string" ? generator.emptyLabel : fallback.emptyLabel,
    filters: filters.length ? filters : fallback.filters,
  };
}

function normalizeFilter(value: unknown): GeneratorFilterConfig | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (data.key !== "category" && data.key !== "niche" && data.key !== "theme") return null;
  return {
    key: data.key,
    label: typeof data.label === "string" ? data.label : data.key,
    allLabel: typeof data.allLabel === "string" ? data.allLabel : undefined,
  };
}

function getFilterOptions(filters: { categories: string[]; niches: string[]; themes: string[] } | undefined, key: FilterKey) {
  if (key === "category") return filters?.categories ?? [];
  if (key === "niche") return filters?.niches ?? [];
  return filters?.themes ?? [];
}

function filterItems(items: MemberToolItemDto[], selection: Selection) {
  return items.filter((item) => (
    (selection.category === "ALL" || item.category === selection.category) &&
    (selection.niche === "ALL" || item.niche === selection.niche) &&
    (selection.theme === "ALL" || item.theme === selection.theme)
  ));
}

function shuffleItems(items: MemberToolItemDto[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function isToolItemLocked(item: MemberToolItemDto, isFreeMember: boolean) {
  return isFreeMember && String(item.metadata?.access ?? "").toUpperCase() === "PRO";
}

export { HookIdeaTool };
