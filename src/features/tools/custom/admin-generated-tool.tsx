import { Copy, FileText, Lock, Save, Wand2 } from "lucide-react";
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
type Selection = Record<FilterKey, string>;

const AdminGeneratedTool = ({ slug }: { slug: string }) => {
  const queryClient = useQueryClient();
  const [selection, setSelection] = useState<Selection>({ category: "ALL", niche: "ALL", theme: "ALL" });
  const [items, setItems] = useState<MemberToolItemDto[]>([]);
  const [generating, setGenerating] = useState(false);
  const { data } = useQuery({
    queryKey: ["tool", slug, "admin-generated"],
    queryFn: () => api.tools.detail(slug, { category: "ALL" }),
  });

  const tool = data?.tool;
  const theme = contentColorTheme(tool?.colorGradient);
  const labels = useMemo(() => resolveLabels(tool), [tool]);
  const locked = Boolean(tool?.isLocked);
  const isFreeMember = Boolean(tool?.freeDailyLimit);
  const limit = tool?.freeDailyLimit ?? null;
  const remaining = tool?.freeDailyRemaining ?? limit;
  const used = tool?.freeDailyUsed ?? (limit && typeof remaining === "number" ? Math.max(0, limit - remaining) : 0);
  const percent = limit ? Math.min(100, Math.max(0, Math.round(((remaining ?? 0) / limit) * 100))) : 100;
  const matchingItems = useMemo(() => filterItems(data?.items ?? [], selection), [data?.items, selection]);

  useEffect(() => {
    if (!items.length && matchingItems.length) setItems(matchingItems.slice(0, 3));
  }, [items.length, matchingItems]);

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
      toast.error(labels.emptyLabel);
      return;
    }
    try {
      setGenerating(true);
      await api.tools.use(slug);
      setItems(shuffleItems(matchingItems).slice(0, Math.min(5, matchingItems.length)));
      toast.success("Konten dibuat dari data admin");
      void queryClient.invalidateQueries({ queryKey: ["tool", slug, "admin-generated"] });
      void queryClient.invalidateQueries({ queryKey: ["tools"] });
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal generate konten"));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="sticky -top-4 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-xl">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <BackButton to="/app/tools" label="Alat Bantu" />
          <h1 className="text-lg font-extrabold">{tool?.name ?? "Generator"}</h1>
          <div className="flex justify-end">
            <span className="rounded-full border px-3 py-1.5 text-xs font-extrabold" style={{ borderColor: theme.border, background: theme.iconBg, color: theme.text }}>
              {limit ? `${remaining ?? 0}/${limit} sisa` : "Tanpa batas"}
            </span>
          </div>
        </div>
      </div>

      <ManagedUsageVideoCard
        targetPath={`/app/tools/${slug}`}
        fallback={{
          title: `Cara Pakai ${tool?.name ?? "Tools"}`,
          subtitle: "Tonton panduan singkat sebelum memakai tools",
          durationLabel: "2 menit",
          thumbnailGradient: "from-slate-950 via-zinc-950 to-black",
        }}
      />

      <section className="rounded-2xl border bg-card p-4" style={{ borderColor: theme.border }}>
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

      <section className="space-y-3 rounded-2xl border bg-card p-4" style={{ borderColor: theme.border }}>
        <div className="flex items-center gap-2" style={{ color: theme.text }}>
          <Wand2 className="h-4 w-4" />
          <h2 className="font-extrabold text-foreground">{labels.title}</h2>
        </div>
        <GeneratorSelect label={labels.categoryLabel} allLabel="Semua Kategori" value={selection.category} options={data?.filters.categories ?? []} onChange={(value) => setSelection((current) => ({ ...current, category: value }))} />
        <GeneratorSelect label={labels.nicheLabel} allLabel="Semua Niche" value={selection.niche} options={data?.filters.niches ?? []} onChange={(value) => setSelection((current) => ({ ...current, niche: value }))} />
        <GeneratorSelect label={labels.themeLabel} allLabel="Semua Tema" value={selection.theme} options={data?.filters.themes ?? []} onChange={(value) => setSelection((current) => ({ ...current, theme: value }))} />
        <Button type="button" onClick={generate} disabled={generating || locked} variant="outline" className="h-12 w-full rounded-xl font-extrabold disabled:opacity-50">
          <Wand2 className="mr-2 h-4 w-4" />
          {generating ? "Mengambil Konten..." : labels.buttonLabel}
        </Button>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-extrabold">Hasil Generate</h2>
          <button type="button" onClick={generate} disabled={generating || locked} className="text-xs font-extrabold disabled:text-muted-foreground" style={{ color: theme.text }}>Generate lagi</button>
        </div>
        {items.length ? (
          <ShowMoreList
            items={items}
            initial={3}
            step={3}
            className="space-y-3"
            renderItem={(item, index) => (
              <AdminGeneratedResultCard key={item.id} slug={slug} item={item} index={index} locked={isToolItemLocked(item, isFreeMember)} theme={theme} />
            )}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-sm font-semibold text-muted-foreground">{labels.emptyLabel}</div>
        )}
      </section>
    </div>
  );
};

function GeneratorSelect({ label, allLabel, value, options, onChange }: { label: string; allLabel: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-muted-foreground">{label}</span>
      <PremiumSearchSelect
        value={value}
        onChange={onChange}
        placeholder={allLabel}
        options={[
          { label: allLabel, value: "ALL" },
          ...options.map((item) => ({ label: item, value: item })),
        ]}
      />
    </label>
  );
}

function AdminGeneratedResultCard({ slug, item, index, locked, theme }: { slug: string; item: MemberToolItemDto; index: number; locked: boolean; theme: ReturnType<typeof contentColorTheme> }) {
  if (locked) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 opacity-75">
        <div className="blur-[1px]">
          <p className="text-xs font-bold text-muted-foreground">Item #{index + 1}</p>
          <p className="mt-3 text-lg font-extrabold leading-relaxed text-muted-foreground">{item.title}</p>
        </div>
        <div className="absolute inset-0 grid place-items-center bg-background/55">
          <div className="text-center">
            <Lock className="mx-auto mb-2 h-6 w-6 text-accent" />
            <p className="text-sm font-extrabold text-muted-foreground">Item khusus PRO</p>
            <Link to="/app/payment" className="mt-3 inline-flex h-10 items-center rounded-xl border border-accent/45 px-5 text-sm font-extrabold text-accent">
              Buka Akses PRO
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const saveToCreatorNotes = async () => {
    try {
      await api.creatorNotes.create({
        title: item.title,
        content: textContentFromItem(item),
        sourceToolSlug: slug,
        sourceItemId: item.id,
        sourceLabel: "Hasil Generate",
        icon: "FileText",
        accent: "emerald",
      });
      toast.success("Disimpan ke Catatan Kreator");
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal menyimpan ke Catatan Kreator"));
    }
  };

  return (
    <article className="relative rounded-2xl border bg-card p-4" style={index === 0 ? { borderColor: theme.border, background: theme.cardBg, boxShadow: theme.shadow } : undefined}>
      {index === 0 && <span className="absolute -top-3 left-4 rounded-md px-3 py-1 text-[11px] font-extrabold text-white" style={{ background: theme.gradient }}>Paling Cocok</span>}
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: theme.iconBg, color: theme.text }}>
          <FileText className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-muted-foreground">Item #{index + 1} · {item.category ?? "Tanpa kategori"}</p>
          <div className="mt-3 space-y-3">
            <CopyPreviewField label="Judul" value={item.title} strong theme={theme} />
            <CopyPreviewField label="Hook" value={item.openingHook ?? ""} strong accent theme={theme} />
            <CopyPreviewField label="Isi" value={item.content} theme={theme} />
            <CopyPreviewField label="Caption" value={item.caption ?? ""} theme={theme} />
            <CopyPreviewField label="Hashtag" value={item.hashtags ?? ""} mono theme={theme} />
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {item.niche ? <span className="rounded-md px-3 py-1 text-xs font-bold" style={{ background: theme.iconBg, color: theme.text }}>{item.niche}</span> : null}
          {item.theme ? <span className="rounded-md px-3 py-1 text-xs font-extrabold" style={{ background: theme.iconBg, color: theme.text }}>{item.theme}</span> : null}
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

function resolveLabels(tool: MemberToolDto | undefined) {
  const generator = typeof tool?.config?.generator === "object" && tool.config?.generator ? tool.config.generator as Record<string, unknown> : {};
  const filters = Array.isArray(generator.filters) ? generator.filters as Array<Record<string, unknown>> : [];
  const labelFor = (key: FilterKey, fallback: string) => {
    const filter = filters.find((item) => item.key === key);
    return typeof filter?.label === "string" ? filter.label : fallback;
  };

  return {
    title: typeof generator.title === "string" ? generator.title : `Generate ${tool?.name ?? "Konten"}`,
    buttonLabel: typeof generator.buttonLabel === "string" ? generator.buttonLabel : "Generate dari Data Admin",
    emptyLabel: typeof generator.emptyLabel === "string" ? generator.emptyLabel : "Belum ada item admin untuk pilihan ini",
    categoryLabel: labelFor("category", "Kategori"),
    nicheLabel: labelFor("niche", "Niche"),
    themeLabel: labelFor("theme", "Tema"),
  };
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

export { AdminGeneratedTool };
