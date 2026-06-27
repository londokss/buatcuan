import { Check, ChevronDown, Image as ImageIcon, Lock, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { api, getErrorMessage, type MemberToolItemDto } from "@/lib/api";
import { contentColorTheme } from "@/lib/content-colors";

type GuideAction = {
  label: string;
  to: string;
  icon?: "video" | "image";
  cta?: string;
};

type GuideMetadata = {
  summary?: string;
  actions?: GuideAction[];
};

const DONE_VALUE = "DONE";

export const UploadGuideTool = ({ slug }: { slug: string }) => {
  const queryClient = useQueryClient();
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["tool", slug, "upload-guide"],
    queryFn: () => api.tools.notes(slug),
  });
  const theme = contentColorTheme(data?.tool.colorGradient);
  const notesByItemId = useMemo(() => new Map((data?.notes ?? []).map((note) => [note.itemId, note.value])), [data?.notes]);
  const completedIds = useMemo(() => new Set([...notesByItemId.entries()].filter(([, value]) => value === DONE_VALUE).map(([itemId]) => itemId)), [notesByItemId]);
  const items = data?.items ?? [];
  const completed = items.filter((item) => completedIds.has(item.id)).length;
  const activeItemId = openItemId ?? items.find((item) => !completedIds.has(item.id))?.id ?? items[0]?.id ?? null;
  const title = readConfigString(data?.tool.config, "pageTitle") || "Panduan Upload Konten";
  const subtitle = readConfigString(data?.tool.config, "pageSubtitle") || "5 langkah dari bahan sampai konten tayang — buka BuatCuan di sebelah TikTok kamu";

  const saveProgress = useMutation({
    mutationFn: (payload: { itemId: string; done: boolean }) => api.tools.saveNote(slug, { itemId: payload.itemId, value: payload.done ? DONE_VALUE : "" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tool", slug, "upload-guide"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal menyimpan progres")),
  });

  if (isLoading) {
    return <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">Memuat Panduan Upload...</div>;
  }

  if (data?.tool.isLocked) {
    return (
      <div className="space-y-5">
        <BackButton to="/app/tools" label="Alat Bantu" />
        <div className="rounded-2xl border border-primary/25 bg-card p-5 text-center">
          <Lock className="mx-auto mb-3 h-7 w-7 text-primary" />
          <p className="text-lg font-extrabold">Panduan Upload khusus PRO</p>
          <p className="mt-1 text-sm text-muted-foreground">Upgrade untuk akses checklist upload lengkap.</p>
          <Link to="/app/payment">
            <Button className="mt-4 h-11 w-full rounded-xl font-extrabold">Buka Akses PRO</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="sticky -top-4 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-xl">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <BackButton to="/app/tools" label="Alat Bantu" />
          <h1 className="text-lg font-extrabold">Panduan Upload</h1>
          <div className="flex justify-end">
            <span className="rounded-full border px-3 py-1.5 text-xs font-extrabold" style={{ borderColor: theme.border, background: theme.iconBg, color: theme.text }}>
              {completed}/{items.length}
            </span>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border bg-card p-4" style={{ borderColor: theme.border }}>
        <h2 className="text-lg font-extrabold leading-tight">{title}</h2>
        <p className="mt-1 text-sm font-semibold leading-relaxed text-muted-foreground">{subtitle}</p>
      </section>

      <section className="space-y-3">
        {items.map((item, index) => (
          <GuideStepCard
            key={item.id}
            item={item}
            step={index + 1}
            open={activeItemId === item.id}
            done={completedIds.has(item.id)}
            saving={saveProgress.isPending}
            theme={theme}
            onToggleOpen={() => setOpenItemId(activeItemId === item.id ? "" : item.id)}
            onToggleDone={() => saveProgress.mutate({ itemId: item.id, done: !completedIds.has(item.id) })}
          />
        ))}
      </section>
    </div>
  );
};

function GuideStepCard({
  item,
  step,
  open,
  done,
  saving,
  theme,
  onToggleOpen,
  onToggleDone,
}: {
  item: MemberToolItemDto;
  step: number;
  open: boolean;
  done: boolean;
  saving: boolean;
  theme: ReturnType<typeof contentColorTheme>;
  onToggleOpen: () => void;
  onToggleDone: () => void;
}) {
  const metadata = (item.metadata ?? {}) as GuideMetadata;
  const summary = metadata.summary || item.openingHook || item.caption || "";
  const actions = metadata.actions ?? [];

  return (
    <article className="overflow-hidden rounded-2xl border bg-card transition-colors hover:border-primary/30" style={{ borderColor: open ? theme.border : undefined }}>
      <button type="button" onClick={onToggleOpen} className="flex w-full items-center gap-3 p-4 text-left">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-sm font-black text-muted-foreground">
          {done ? <Check className="h-4 w-4 text-primary" /> : step}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold leading-tight">{item.title}</span>
          {summary ? <span className="mt-1 block text-xs font-semibold leading-snug text-muted-foreground">{summary}</span> : null}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-border px-4 pb-4 pt-4">
          <p className="whitespace-pre-line text-sm font-semibold leading-relaxed text-muted-foreground">{item.content}</p>

          {actions.length ? (
            <div className="mt-4 space-y-2">
              {actions.map((action) => (
                <Link
                  key={`${action.label}-${action.to}`}
                  to={action.to}
                  className="flex h-12 items-center justify-between rounded-xl border bg-background px-4 text-sm font-extrabold transition-colors hover:border-primary/35 hover:bg-primary/5"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: theme.iconBg, color: theme.text }}>
                      {action.icon === "image" ? <ImageIcon className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                    </span>
                    <span className="truncate">{action.label}</span>
                  </span>
                  <span className="shrink-0 text-xs font-black" style={{ color: theme.text }}>{action.cta || "Buka"} -&gt;</span>
                </Link>
              ))}
            </div>
          ) : null}

          <Button type="button" variant="outline" disabled={saving} onClick={onToggleDone} className="mt-4 h-11 w-full rounded-xl font-extrabold">
            <Check className="mr-2 h-4 w-4" />
            {done ? "Sudah selesai" : "Tandai selesai"}
          </Button>
        </div>
      )}
    </article>
  );
}

function readConfigString(config: Record<string, unknown> | undefined, key: string) {
  const value = config?.[key];
  return typeof value === "string" ? value : "";
}
