import { Copy, Hash, Lightbulb, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShowMoreList } from "@/components/ShowMoreList";
import { api, type HookIdeaDto } from "@/lib/api";

const withAll = (items: string[]) => ["ALL", ...items.filter(Boolean)];

const HookIdeas = () => {
  const [category, setCategory] = useState("ALL");
  const [niche, setNiche] = useState("ALL");
  const [theme, setTheme] = useState("ALL");
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["hook-ideas", category, niche, theme, q],
    queryFn: () => api.hookIdeas({ category, niche, theme, q }),
  });

  const categories = useMemo(() => withAll(data?.filters.categories ?? []), [data?.filters.categories]);
  const niches = useMemo(() => withAll(data?.filters.niches ?? []), [data?.filters.niches]);
  const themes = useMemo(() => withAll(data?.filters.themes ?? []), [data?.filters.themes]);

  const copyIdea = async (idea: HookIdeaDto) => {
    await navigator.clipboard.writeText([
      `Hook: ${idea.openingHook}`,
      `Judul: ${idea.title}`,
      `Caption: ${idea.caption}`,
      `Hashtag: ${idea.hashtags}`,
    ].join("\n\n"));
    toast.success("Ide hook disalin");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Ide <span className="text-gradient-primary">Hook</span></h1>
        <p className="text-sm text-muted-foreground">Ambil ide pembuka, judul, caption, dan hashtag untuk konten berikutnya.</p>
      </div>

      <div className="glass-card rounded-3xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Cari hook, caption, hashtag..." className="h-11 rounded-2xl bg-secondary pl-9" />
        </div>
        <FilterRow label="Kategori" value={category} values={categories} onChange={setCategory} />
        <FilterRow label="Niche" value={niche} values={niches} onChange={setNiche} />
        <FilterRow label="Tema" value={theme} values={themes} onChange={setTheme} />
      </div>

      {isLoading && <div className="glass-card rounded-3xl p-5 text-sm text-muted-foreground">Memuat ide hook...</div>}

      <ShowMoreList
        items={data?.ideas ?? []}
        initial={5}
        step={5}
        className="space-y-3"
        empty={!isLoading ? <div className="glass-card rounded-3xl p-5 text-sm text-muted-foreground">Belum ada ide yang cocok dengan filter ini.</div> : null}
        renderItem={(idea) => (
          <div key={idea.id} className="glass-card rounded-3xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary/15 px-2 py-1 text-[10px] font-bold text-primary">{idea.category}</span>
                  <span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-bold text-muted-foreground">{idea.niche}</span>
                  <span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-bold text-muted-foreground">{idea.theme}</span>
                </div>
                <h2 className="mt-3 text-lg font-extrabold leading-tight">{idea.title}</h2>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => copyIdea(idea)} className="h-9 w-9 shrink-0 p-0">
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/10 p-3">
              <div className="mb-2 flex items-center gap-2 text-primary">
                <Lightbulb className="h-4 w-4" />
                <p className="text-xs font-bold uppercase tracking-wider">Hook Pembuka</p>
              </div>
              <p className="text-sm font-semibold leading-relaxed">{idea.openingHook}</p>
            </div>

            <div className="mt-3 space-y-3 text-sm">
              <Block icon={Sparkles} label="Caption" text={idea.caption} />
              <Block icon={Hash} label="Hashtag" text={idea.hashtags} mono />
            </div>
          </div>
        )}
      />
    </div>
  );
};

const FilterRow = ({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) => (
  <div>
    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
    <div className="flex gap-2 overflow-x-auto pb-1">
      {values.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
            value === item ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          {item === "ALL" ? "Semua" : item}
        </button>
      ))}
    </div>
  </div>
);

const Block = ({ icon: Icon, label, text, mono = false }: { icon: typeof Sparkles; label: string; text: string; mono?: boolean }) => (
  <div className="rounded-2xl bg-secondary/60 p-3">
    <div className="mb-1 flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4" />
      <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
    </div>
    <p className={`leading-relaxed ${mono ? "font-mono text-xs" : ""}`}>{text}</p>
  </div>
);

export default HookIdeas;
