import { Copy, FileText, Hash, Image, MousePointerClick, Music, Plus, Save, SlidersHorizontal, Sparkles, Trash2, Type } from "lucide-react";
import { Link } from "react-router-dom";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/context/AppContext";
import { api, getErrorMessage, type CreatorNoteDto } from "@/lib/api";
import { contentColorTheme } from "@/lib/content-colors";

const noteIcons = {
  FileText,
  Hash,
  Image,
  Music,
  MousePointerClick,
  Pointer: MousePointerClick,
  SlidersHorizontal,
  Sparkles,
  Type,
};

const accents = {
  blue: "bg-sky-500/15 text-sky-400",
  emerald: "bg-primary/15 text-primary",
  lime: "bg-lime-500/15 text-lime-400",
  orange: "bg-orange-500/15 text-orange-400",
  pink: "bg-pink-500/15 text-pink-400",
  teal: "bg-teal-500/15 text-teal-400",
  violet: "bg-violet-500/15 text-violet-400",
  yellow: "bg-accent/15 text-accent",
};

export const CreatorNotesTool = (_props: { slug: string }) => {
  const { user } = useApp();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CreatorNoteDto | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sourceToolSlug, setSourceToolSlug] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["creator-notes"],
    queryFn: api.creatorNotes.list,
  });
  const theme = contentColorTheme("from-lime-500 to-emerald-400");
  const notes = data?.notes ?? [];
  const filled = data?.progress.filled ?? notes.filter((note) => note.content.trim()).length;
  const total = data?.progress.total ?? notes.length;
  const progressPercent = total ? Math.round((filled / total) * 100) : 0;
  const branding = data?.branding ?? {
    handle: user?.personalBrandHandle || creatorHandle(user?.name),
    tagline: user?.personalBrandTagline || "No-face · IRT & Keluarga · Video+Teks",
    status: user?.personalBrandStatus || "Creator Lv. 1",
  };

  const createNote = useMutation({
    mutationFn: (payload: { title: string; content: string; sourceToolSlug?: string }) => api.creatorNotes.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["creator-notes"] });
      closeModal();
      toast.success("Catatan baru disimpan");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal menyimpan catatan")),
  });

  const updateNote = useMutation({
    mutationFn: (payload: { id: string; title: string; content: string }) => api.creatorNotes.update(payload.id, { title: payload.title, content: payload.content }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["creator-notes"] });
      closeModal();
      toast.success("Catatan diperbarui");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal memperbarui catatan")),
  });

  const deleteNote = useMutation({
    mutationFn: (id: string) => api.creatorNotes.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["creator-notes"] });
      closeModal();
      toast.success("Catatan dihapus");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal menghapus catatan")),
  });

  const openCreate = () => {
    setEditingNote(null);
    setTitle("");
    setContent("");
    setSourceToolSlug(data?.sources[0]?.slug ?? "");
    setModalOpen(true);
  };

  const openEdit = (note: CreatorNoteDto) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setSourceToolSlug(note.sourceTool?.slug ?? "");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingNote(null);
    setTitle("");
    setContent("");
    setSourceToolSlug("");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return toast.error("Judul catatan wajib diisi");
    if (editingNote) {
      updateNote.mutate({ id: editingNote.id, title: title.trim(), content });
      return;
    }
    createNote.mutate({ title: title.trim(), content, sourceToolSlug: sourceToolSlug || undefined });
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-sm font-semibold text-muted-foreground">
        Memuat Catatan Kreator...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="sticky -top-4 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-xl">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <BackButton to="/app/tools" label="Alat Bantu" />
          <h1 className="text-lg font-extrabold">Catatan Kreator</h1>
          <div className="flex justify-end">
            <Button type="button" onClick={openCreate} className="h-9 rounded-xl px-3 text-xs font-extrabold">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Baru
            </Button>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border p-4" style={{ borderColor: theme.border, background: theme.cardBg }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-black leading-tight" style={{ color: theme.text }}>{branding.handle}</p>
            <p className="mt-1 truncate text-xs font-semibold leading-tight text-muted-foreground">{branding.tagline}</p>
            <Link to="/app/profile/personal-branding" className="mt-2 inline-flex text-[11px] font-black" style={{ color: theme.text }}>
              {branding.status} · edit branding
            </Link>
          </div>
          <span className="mt-0.5 shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black" style={{ borderColor: theme.border, background: theme.iconBg, color: theme.text }}>
            {filled} dari {total} terisi
          </span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: theme.progressTrack }}>
            <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, background: theme.gradient }} />
          </div>
          <p className="w-[58px] text-right text-[11px] font-semibold text-muted-foreground">{filled}/{total} terisi</p>
        </div>
      </section>

      <section className="space-y-3">
        {notes.length ? notes.map((note) => (
          <CreatorNoteCard key={note.id} note={note} onEdit={() => openEdit(note)} theme={theme} />
        )) : (
          <button type="button" onClick={openCreate} className="w-full rounded-2xl border border-dashed border-border bg-card p-5 text-left text-sm font-semibold text-muted-foreground hover:border-primary/40 hover:bg-primary/5">
            Belum ada catatan. Tambah catatan pertama untuk menyimpan gaya konten kamu.
          </button>
        )}
      </section>

      <p className="rounded-2xl border bg-card p-4 text-center text-xs font-semibold leading-relaxed text-muted-foreground" style={{ borderColor: theme.border }}>
        Diisi sambil jalan - tidak perlu lengkap dari awal. Setiap kali kamu temukan gaya yang cocok di TikTok, langsung catat di sini supaya konsisten.
      </p>

      <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-sm rounded-2xl border-border bg-card">
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>{editingNote ? "Ubah Catatan" : "Tambah Catatan Baru"}</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              {!editingNote && (
                <label className="block space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Alat bantu</span>
                  <select value={sourceToolSlug} onChange={(event) => setSourceToolSlug(event.target.value)} className="h-11 w-full rounded-xl border border-border bg-secondary px-3 text-sm font-bold outline-none focus:border-primary">
                    <option value="">Catatan Manual</option>
                    {(data?.sources ?? []).map((source) => (
                      <option key={source.slug} value={source.slug}>{source.name}</option>
                    ))}
                  </select>
                </label>
              )}
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Judul catatan" className="h-11 rounded-xl bg-secondary" />
              <Textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Tulis isi catatanmu di sini" className="min-h-36 resize-none rounded-xl bg-secondary/70" />
            </div>
            <DialogFooter className="mt-5 gap-2 sm:gap-2">
              {editingNote && (
                <Button type="button" variant="outline" onClick={() => deleteNote.mutate(editingNote.id)} disabled={deleteNote.isPending} className="mr-auto rounded-xl border-red-500/35 text-red-300 hover:bg-red-500/10">
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Hapus
                </Button>
              )}
              <Button type="button" variant="outline" onClick={closeModal} className="rounded-xl">Batal</Button>
              <Button type="submit" disabled={createNote.isPending || updateNote.isPending} className="rounded-xl font-extrabold">
                <Save className="mr-1.5 h-4 w-4" />
                {createNote.isPending || updateNote.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function CreatorNoteCard({ note, onEdit, theme }: { note: CreatorNoteDto; onEdit: () => void; theme: ReturnType<typeof contentColorTheme> }) {
  const Icon = noteIcons[note.icon as keyof typeof noteIcons] ?? FileText;
  const accentClass = accents[note.accent as keyof typeof accents] ?? accents.emerald;
  const filled = note.content.trim().length > 0;
  const sourceLabel = note.sourceLabel || note.sourceTool?.name || "Catatan";

  const copy = async () => {
    await navigator.clipboard.writeText(note.content.trim());
    toast.success(`${note.title} disalin`);
  };

  return (
    <article className="rounded-2xl border bg-card p-4 transition-colors hover:border-primary/30" style={{ borderColor: theme.border }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${accentClass}`}>
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-extrabold text-foreground">{note.title}</h2>
            <p className="truncate text-[11px] font-bold text-muted-foreground">{sourceLabel}</p>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={onEdit} className="h-10 shrink-0 rounded-xl px-5 text-sm font-extrabold">
          {filled ? "Ubah" : "Isi"}
        </Button>
      </div>

      {filled ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-secondary/60 p-3">
          <p className="min-w-0 whitespace-pre-line text-sm font-extrabold leading-snug text-foreground">{note.content}</p>
          <Button type="button" variant="outline" onClick={() => void copy()} className="h-10 shrink-0 rounded-xl px-4 text-sm font-extrabold">
            <Copy className="mr-1 h-3.5 w-3.5" />
            Salin
          </Button>
        </div>
      ) : (
        <button type="button" onClick={onEdit} className="mt-3 flex w-full items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-secondary/40 px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5">
          <span className="min-w-0 truncate text-xs font-semibold text-muted-foreground">Belum diisi - tap untuk isi sekarang</span>
          <span className="shrink-0 text-xs font-extrabold" style={{ color: theme.text }}>+ Isi</span>
        </button>
      )}
    </article>
  );
}

function creatorHandle(name?: string | null) {
  const base = (name || "creator").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return `@${base || "creator"}`;
}
