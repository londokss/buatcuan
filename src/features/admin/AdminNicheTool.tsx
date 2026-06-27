import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Compass, Edit, Lock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  api,
  getErrorMessage,
  type NicheCandidateAdminDto,
  type NicheCandidateAdminInput,
  type NicheJalurCuan,
  type NicheLevel,
  type NicheLevelTier,
  type NichePersonalCinta,
  type NichePersonalModalWaktu,
  type NichePersonalOkeDikuasai,
  type NicheScoringConfigDto,
  type NicheTampilMuka,
  type NicheTren2026,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  AdminDataTable,
  AdminMetricCard,
  ConfirmDialog,
  DetailGrid,
  Page,
  Panel,
  SearchSelect,
  SectionHeading,
  adminButton,
  adminIconButton,
  type Option,
} from "./AdminDashboard";

const JALUR_OPTIONS: Option[] = [
  { label: "⭐ Affiliate BuatCuan", value: "AFFILIATE_BUATCUAN" },
  { label: "🛍️ TikTok Affiliate", value: "TIKTOK_AFFILIATE" },
  { label: "🔗 Gabungan", value: "GABUNGAN" },
  { label: "🎙️ Konten Umum", value: "KONTEN_UMUM" },
];
const TREN_OPTIONS: Option[] = [
  { label: "Musiman", value: "MUSIMAN" },
  { label: "Stabil", value: "STABIL" },
  { label: "Naik", value: "NAIK" },
];
const LEVEL_OPTIONS: Option[] = [
  { label: "Ringan", value: "RINGAN" },
  { label: "Sedang", value: "SEDANG" },
  { label: "Berat", value: "BERAT" },
];
const TAMPIL_MUKA_OPTIONS: Option[] = [
  { label: "Tidak", value: "TIDAK" },
  { label: "Opsional", value: "OPSIONAL" },
  { label: "Wajib", value: "WAJIB" },
];
const LEVEL_NUMBER_OPTIONS: Option[] = [1, 2, 3, 4, 5].map((n) => ({ label: String(n), value: String(n) }));

const TREN_LABELS: Record<NicheTren2026, string> = { MUSIMAN: "Musiman", STABIL: "Stabil", NAIK: "Naik" };
const CINTA_LABELS: Record<NichePersonalCinta, string> = { KURANG: "Kurang", LUMAYAN: "Lumayan", BANGET: "Banget" };
const OKE_LABELS: Record<NichePersonalOkeDikuasai, string> = { BELUM: "Belum", LUMAYAN: "Lumayan", UDAH: "Udah" };
const MODAL_WAKTU_LABELS: Record<NichePersonalModalWaktu, string> = { BERAT: "Berat", SEDANG: "Sedang", RINGAN: "Ringan" };

type NicheCandidateForm = {
  id?: string;
  isDefault?: boolean;
  slug: string;
  name: string;
  jalurCuan: NicheJalurCuan;
  pilarNiche: string;
  peminat: number;
  ongkosBalik: number;
  saingan: number;
  kepercayaan: number;
  tren2026: NicheTren2026;
  modal: NicheLevel;
  bebanWaktu: NicheLevel;
  tampilMuka: NicheTampilMuka;
  isSensitive: boolean;
  isActive: boolean;
  sortOrder: number;
};

const emptyCandidateForm: NicheCandidateForm = {
  slug: "",
  name: "",
  jalurCuan: "KONTEN_UMUM",
  pilarNiche: "",
  peminat: 3,
  ongkosBalik: 3,
  saingan: 3,
  kepercayaan: 3,
  tren2026: "STABIL",
  modal: "SEDANG",
  bebanWaktu: "SEDANG",
  tampilMuka: "OPSIONAL",
  isSensitive: false,
  isActive: true,
  sortOrder: 0,
};

function toForm(candidate: NicheCandidateAdminDto): NicheCandidateForm {
  return {
    id: candidate.id,
    isDefault: candidate.isDefault,
    slug: candidate.slug,
    name: candidate.name,
    jalurCuan: candidate.jalurCuan,
    pilarNiche: candidate.pilarNiche ?? "",
    peminat: candidate.peminat,
    ongkosBalik: candidate.ongkosBalik,
    saingan: candidate.saingan,
    kepercayaan: candidate.kepercayaan,
    tren2026: candidate.tren2026,
    modal: candidate.modal,
    bebanWaktu: candidate.bebanWaktu,
    tampilMuka: candidate.tampilMuka,
    isSensitive: candidate.isSensitive,
    isActive: candidate.isActive,
    sortOrder: candidate.sortOrder,
  };
}

function toInput(form: NicheCandidateForm): NicheCandidateAdminInput {
  return {
    slug: form.slug.trim(),
    name: form.name.trim(),
    jalurCuan: form.jalurCuan,
    pilarNiche: form.pilarNiche.trim() || null,
    peminat: form.peminat,
    ongkosBalik: form.ongkosBalik,
    saingan: form.saingan,
    kepercayaan: form.kepercayaan,
    tren2026: form.tren2026,
    modal: form.modal,
    bebanWaktu: form.bebanWaktu,
    tampilMuka: form.tampilMuka,
    isSensitive: form.isSensitive,
    isActive: form.isActive,
    sortOrder: form.sortOrder,
  };
}

function validateCandidateForm(form: NicheCandidateForm) {
  if (!form.slug.trim() || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug.trim())) {
    toast.error("Slug wajib diisi: huruf kecil, angka, dan tanda hubung saja.");
    return false;
  }
  if (!form.name.trim()) {
    toast.error("Nama niche wajib diisi.");
    return false;
  }
  return true;
}

export const AdminNicheTool = () => {
  const qc = useQueryClient();
  const { data: candidates = [], isLoading } = useQuery({ queryKey: ["admin-niche-candidates"], queryFn: api.admin.niche.candidates.list });
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState<NicheCandidateForm>(emptyCandidateForm);

  const save = useMutation({
    mutationFn: () => (form.id ? api.admin.niche.candidates.update(form.id, toInput(form)) : api.admin.niche.candidates.create(toInput(form))),
    onSuccess: () => {
      toast.success("Niche disimpan");
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["admin-niche-candidates"] });
      void qc.invalidateQueries({ queryKey: ["niche-candidates-v1"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal menyimpan niche")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.admin.niche.candidates.remove(id),
    onSuccess: () => {
      toast.success("Niche dihapus");
      setConfirmId(null);
      void qc.invalidateQueries({ queryKey: ["admin-niche-candidates"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Gagal menghapus niche"));
      setConfirmId(null);
    },
  });

  const activeCount = candidates.filter((candidate) => candidate.isActive).length;
  const sensitiveCount = candidates.filter((candidate) => candidate.isSensitive).length;

  const columns = useMemo<ColumnDef<NicheCandidateAdminDto>[]>(
    () => [
      { accessorKey: "sortOrder", header: "#" },
      {
        accessorKey: "name",
        header: "Nama",
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5 font-semibold">
            {row.original.isDefault && <Lock className="h-3.5 w-3.5 text-primary" />}
            {row.original.name}
          </span>
        ),
      },
      { accessorKey: "jalurCuan", header: "Jalur" },
      { accessorKey: "peminat", header: "Peminat" },
      { accessorKey: "ongkosBalik", header: "Ongkos Balik" },
      { accessorKey: "saingan", header: "Saingan" },
      { accessorKey: "kepercayaan", header: "Kepercayaan" },
      { accessorKey: "tren2026", header: "Tren" },
      { accessorKey: "isSensitive", header: "Sensitif", cell: ({ row }) => (row.original.isSensitive ? "Ya" : "-") },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <span className={cn("rounded-full px-2 py-1 text-[10px] font-bold", row.original.isActive ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground")}>
            {row.original.isActive ? "Aktif" : "Nonaktif"}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <Page
      title="Penentuan Niche"
      desc="Kelola daftar niche dan bobot/ambang Alat Penentuan Niche member. Tidak butuh migration."
      action={
        <Button
          onClick={() => {
            setForm({ ...emptyCandidateForm, sortOrder: candidates.length });
            setOpen(true);
          }}
          className={adminButton("add")}
        >
          <Plus className="mr-1 h-4 w-4" />
          Tambah Niche
        </Button>
      }
    >
      <div className="grid gap-3 md:grid-cols-3">
        <AdminMetricCard label="Total Niche" value={String(candidates.length)} hint={`${activeCount} aktif`} icon={Compass} tone="green" />
        <AdminMetricCard label="Ditandai Sensitif" value={String(sensitiveCount)} hint="kena Saringan Aman" icon={Lock} tone={sensitiveCount ? "yellow" : "green"} />
        <AdminMetricCard label="Jalur Tersedia" value="4" hint="termasuk Affiliate BuatCuan" icon={Compass} tone="blue" />
      </div>

      <NicheScoringConfigPanel />

      <AdminDataTable
        data={candidates}
        columns={columns}
        exportFileName="admin-niche-candidates"
        exportRows={(candidate) => ({
          Urutan: candidate.sortOrder,
          Nama: candidate.name,
          Slug: candidate.slug,
          Jalur: candidate.jalurCuan,
          Default: candidate.isDefault ? "Ya" : "Tidak",
          Peminat: candidate.peminat,
          "Ongkos Balik": candidate.ongkosBalik,
          Saingan: candidate.saingan,
          Kepercayaan: candidate.kepercayaan,
          Tren: candidate.tren2026,
          Modal: candidate.modal,
          "Beban Waktu": candidate.bebanWaktu,
          "Tampil Muka": candidate.tampilMuka,
          Sensitif: candidate.isSensitive ? "Ya" : "Tidak",
          Status: candidate.isActive ? "Aktif" : "Nonaktif",
        })}
        rowActions={(candidate) => (
          <>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => {
                setForm(toForm(candidate));
                setOpen(true);
              }}
              title="Edit niche"
              className={adminIconButton("edit")}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              type="button"
              disabled={candidate.isDefault}
              onClick={() => !candidate.isDefault && setConfirmId(candidate.id)}
              title={candidate.isDefault ? "Affiliate BuatCuan tidak bisa dihapus" : "Hapus niche"}
              className={adminIconButton("delete")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
        renderDetail={(candidate) => (
          <DetailGrid
            items={[
              ["ID", candidate.id],
              ["Nama", candidate.name],
              ["Slug", candidate.slug],
              ["Jalur Cuan", candidate.jalurCuan],
              ["Default", candidate.isDefault ? "Ya — terkunci" : "Tidak"],
              ["Pilar Niche", candidate.pilarNiche ?? "-"],
              ["Peminat", String(candidate.peminat)],
              ["Ongkos Balik", String(candidate.ongkosBalik)],
              ["Saingan", String(candidate.saingan)],
              ["Kepercayaan", String(candidate.kepercayaan)],
              ["Tren 2026", candidate.tren2026],
              ["Modal", candidate.modal],
              ["Beban Waktu", candidate.bebanWaktu],
              ["Tampil Muka", candidate.tampilMuka],
              ["Sensitif", candidate.isSensitive ? "Ya" : "Tidak"],
              ["Status", candidate.isActive ? "Aktif" : "Nonaktif"],
            ]}
          />
        )}
      />
      {isLoading && <p className="text-sm text-muted-foreground">Memuat daftar niche...</p>}

      <ConfirmDialog
        open={Boolean(confirmId)}
        setOpen={(value) => !value && setConfirmId(null)}
        title="Hapus niche?"
        desc="Niche akan hilang dari Alat Penentuan Niche member. Hasil yang sudah tersimpan sebelumnya tidak terpengaruh."
        onConfirm={() => confirmId && !remove.isPending && remove.mutate(confirmId)}
        loading={remove.isPending}
      />

      <NicheCandidateDialog
        open={open}
        setOpen={setOpen}
        form={form}
        setForm={setForm}
        onSubmit={() => {
          if (save.isPending || !validateCandidateForm(form)) return;
          save.mutate();
        }}
        isSaving={save.isPending}
      />
    </Page>
  );
};

function NicheCandidateDialog({
  open,
  setOpen,
  form,
  setForm,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  form: NicheCandidateForm;
  setForm: (form: NicheCandidateForm) => void;
  onSubmit: () => void;
  isSaving: boolean;
}) {
  const isDefault = Boolean(form.isDefault);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit Niche" : "Tambah Niche"}</DialogTitle>
          <DialogDescription>
            {isDefault
              ? "Affiliate BuatCuan terkunci sistem: jalur, slug, status aktif, dan sensitif tidak bisa diubah."
              : "Isi data intrinsic niche yang dipakai Skor Dasar Niche (maks 55)."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="niche-candidate-name">Nama</Label>
              <Input id="niche-candidate-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="niche-candidate-slug">Slug</Label>
              <Input id="niche-candidate-slug" value={form.slug} disabled={isDefault} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Pilar Niche</Label>
            <Input value={form.pilarNiche} onChange={(event) => setForm({ ...form, pilarNiche: event.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Jalur Cuan</Label>
            <SearchSelect value={form.jalurCuan} onChange={(value) => setForm({ ...form, jalurCuan: value as NicheJalurCuan })} options={JALUR_OPTIONS} placeholder="Pilih jalur" disabled={isDefault} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Peminat (1-5)</Label>
              <SearchSelect value={String(form.peminat)} onChange={(value) => setForm({ ...form, peminat: Number(value) })} options={LEVEL_NUMBER_OPTIONS} placeholder="1-5" />
            </div>
            <div className="space-y-1">
              <Label>Ongkos Balik (1-5)</Label>
              <SearchSelect value={String(form.ongkosBalik)} onChange={(value) => setForm({ ...form, ongkosBalik: Number(value) })} options={LEVEL_NUMBER_OPTIONS} placeholder="1-5" />
            </div>
            <div className="space-y-1">
              <Label>Saingan (1-5, kebalik)</Label>
              <SearchSelect value={String(form.saingan)} onChange={(value) => setForm({ ...form, saingan: Number(value) })} options={LEVEL_NUMBER_OPTIONS} placeholder="1-5" />
            </div>
            <div className="space-y-1">
              <Label>Kepercayaan (1-5)</Label>
              <SearchSelect value={String(form.kepercayaan)} onChange={(value) => setForm({ ...form, kepercayaan: Number(value) })} options={LEVEL_NUMBER_OPTIONS} placeholder="1-5" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label>Tren 2026</Label>
              <SearchSelect value={form.tren2026} onChange={(value) => setForm({ ...form, tren2026: value as NicheTren2026 })} options={TREN_OPTIONS} placeholder="Tren" />
            </div>
            <div className="space-y-1">
              <Label>Modal</Label>
              <SearchSelect value={form.modal} onChange={(value) => setForm({ ...form, modal: value as NicheLevel })} options={LEVEL_OPTIONS} placeholder="Modal" />
            </div>
            <div className="space-y-1">
              <Label>Beban Waktu</Label>
              <SearchSelect value={form.bebanWaktu} onChange={(value) => setForm({ ...form, bebanWaktu: value as NicheLevel })} options={LEVEL_OPTIONS} placeholder="Waktu" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Tampil Muka</Label>
            <SearchSelect value={form.tampilMuka} onChange={(value) => setForm({ ...form, tampilMuka: value as NicheTampilMuka })} options={TAMPIL_MUKA_OPTIONS} placeholder="Tampil muka" />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <p className="text-sm font-bold">Aktif</p>
              <p className="text-xs text-muted-foreground">Niche nonaktif tidak muncul di Alat Penentuan Niche member.</p>
            </div>
            <Switch checked={form.isActive} disabled={isDefault} onCheckedChange={(checked) => setForm({ ...form, isActive: checked })} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <p className="text-sm font-bold">Sensitif (Saringan Aman)</p>
              <p className="text-xs text-muted-foreground">Niche sensitif ditandai "simpan dulu", tidak dihapus dari daftar.</p>
            </div>
            <Switch checked={form.isSensitive} disabled={isDefault} onCheckedChange={(checked) => setForm({ ...form, isSensitive: checked })} />
          </div>
          {isDefault && (
            <p className="flex items-center gap-2 rounded-xl bg-primary/10 p-3 text-xs font-semibold text-primary">
              <Lock className="h-3.5 w-3.5" />
              Affiliate BuatCuan = membership single-level (NO MLM), beda dari TikTok Shop Affiliate.
            </p>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button type="button" onClick={onSubmit} disabled={isSaving} className={adminButton("add")}>
            {isSaving ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LeveledFactorEditor({
  label,
  factor,
  onChange,
}: {
  label: string;
  factor: { max: number; tiers: NicheLevelTier[] };
  onChange: (next: { max: number; tiers: NicheLevelTier[] }) => void;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-extrabold">{label}</p>
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground">Bobot maks</Label>
          <Input type="number" className="h-8 w-20" value={factor.max} onChange={(event) => onChange({ ...factor, max: Number(event.target.value) || 0 })} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {factor.tiers.map((tier, index) => (
          <div key={`${tier.min}-${tier.max}`} className="space-y-1 rounded-xl bg-secondary/40 p-2">
            <p className="text-[11px] text-muted-foreground">Level {tier.min === tier.max ? tier.min : `${tier.min}-${tier.max}`}</p>
            <Input
              type="number"
              className="h-8"
              value={tier.points}
              onChange={(event) => {
                const points = Number(event.target.value) || 0;
                const tiers = factor.tiers.map((current, currentIndex) => (currentIndex === index ? { ...current, points } : current));
                onChange({ ...factor, tiers });
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ChoiceFactorEditor<K extends string>({
  label,
  factor,
  optionLabels,
  onChange,
}: {
  label: string;
  factor: { max: number; points: Record<K, number> };
  optionLabels: Record<K, string>;
  onChange: (next: { max: number; points: Record<K, number> }) => void;
}) {
  const keys = Object.keys(optionLabels) as K[];
  return (
    <div className="space-y-2 rounded-2xl border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-extrabold">{label}</p>
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground">Bobot maks</Label>
          <Input type="number" className="h-8 w-20" value={factor.max} onChange={(event) => onChange({ ...factor, max: Number(event.target.value) || 0 })} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {keys.map((key) => (
          <div key={key} className="space-y-1 rounded-xl bg-secondary/40 p-2">
            <p className="text-[11px] text-muted-foreground">{optionLabels[key]}</p>
            <Input
              type="number"
              className="h-8"
              value={factor.points[key]}
              onChange={(event) => onChange({ ...factor, points: { ...factor.points, [key]: Number(event.target.value) || 0 } })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function NicheScoringConfigPanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-niche-scoring-config"], queryFn: api.admin.niche.scoringConfig.get });
  const [draft, setDraft] = useState<NicheScoringConfigDto | null>(null);

  useEffect(() => {
    if (data && !draft) setDraft(data.config);
  }, [data, draft]);

  const save = useMutation({
    mutationFn: (config: NicheScoringConfigDto) => api.admin.niche.scoringConfig.update(config),
    onSuccess: (config) => {
      toast.success("Bobot & ambang skor disimpan");
      setDraft(config);
      void qc.invalidateQueries({ queryKey: ["admin-niche-scoring-config"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal menyimpan konfigurasi skor")),
  });

  if (isLoading || !draft) {
    return (
      <Panel>
        <p className="text-sm text-muted-foreground">Memuat konfigurasi skor...</p>
      </Panel>
    );
  }

  const baseSum = draft.base.peminat.max + draft.base.ongkosBalik.max + draft.base.kepercayaan.max + draft.base.saingan.max + draft.base.tren2026.max;
  const personalSum = draft.personal.cinta.max + draft.personal.okeDikuasai.max + draft.personal.modalWaktu.max;
  const baseSumOk = baseSum === 55;
  const personalSumOk = personalSum === 45;
  const thresholdsOk = draft.thresholds.cadangan < draft.thresholds.layak && draft.thresholds.layak < draft.thresholds.utama;

  return (
    <Panel className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeading title="Bobot & Ambang Skor" desc="Mengubah ini langsung memengaruhi hasil Alat Penentuan Niche untuk semua member. Tanpa migration." />
        {data && (
          <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", data.isOverridden ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground")}>
            {data.isOverridden ? `Override aktif${data.updatedAt ? ` sejak ${new Date(data.updatedAt).toLocaleString("id-ID")}` : ""}` : "Pakai default sistem"}
          </span>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className={cn("rounded-2xl border p-3", baseSumOk ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/40 bg-destructive/5")}>
          <p className="text-xs font-bold text-muted-foreground">Total Skor Dasar Niche (A) — harus 55</p>
          <p className={cn("text-2xl font-black", baseSumOk ? "text-emerald-600" : "text-destructive")}>{baseSum}</p>
        </div>
        <div className={cn("rounded-2xl border p-3", personalSumOk ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/40 bg-destructive/5")}>
          <p className="text-xs font-bold text-muted-foreground">Total Skor Personal (B) — harus 45</p>
          <p className={cn("text-2xl font-black", personalSumOk ? "text-emerald-600" : "text-destructive")}>{personalSum}</p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-extrabold">A. Skor Dasar Niche (dari data niche)</p>
        <div className="grid gap-2 md:grid-cols-2">
          <LeveledFactorEditor label="Peminat" factor={draft.base.peminat} onChange={(value) => setDraft({ ...draft, base: { ...draft.base, peminat: value } })} />
          <LeveledFactorEditor label="Ongkos Balik" factor={draft.base.ongkosBalik} onChange={(value) => setDraft({ ...draft, base: { ...draft.base, ongkosBalik: value } })} />
          <LeveledFactorEditor label="Kepercayaan" factor={draft.base.kepercayaan} onChange={(value) => setDraft({ ...draft, base: { ...draft.base, kepercayaan: value } })} />
          <LeveledFactorEditor label="Saingan (kebalik: makin kecil makin bagus)" factor={draft.base.saingan} onChange={(value) => setDraft({ ...draft, base: { ...draft.base, saingan: value } })} />
        </div>
        <div className="mt-2">
          <ChoiceFactorEditor label="Tren 2026" factor={draft.base.tren2026} optionLabels={TREN_LABELS} onChange={(value) => setDraft({ ...draft, base: { ...draft.base, tren2026: value } })} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-extrabold">B. Skor Personal (tap user)</p>
        <div className="grid gap-2 md:grid-cols-3">
          <ChoiceFactorEditor label="Cinta" factor={draft.personal.cinta} optionLabels={CINTA_LABELS} onChange={(value) => setDraft({ ...draft, personal: { ...draft.personal, cinta: value } })} />
          <ChoiceFactorEditor label="Oke Dikuasai" factor={draft.personal.okeDikuasai} optionLabels={OKE_LABELS} onChange={(value) => setDraft({ ...draft, personal: { ...draft.personal, okeDikuasai: value } })} />
          <ChoiceFactorEditor label="Modal & Waktu" factor={draft.personal.modalWaktu} optionLabels={MODAL_WAKTU_LABELS} onChange={(value) => setDraft({ ...draft, personal: { ...draft.personal, modalWaktu: value } })} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-extrabold">Ambang Lampu</p>
        <div className={cn("grid grid-cols-2 gap-2 rounded-2xl border p-3 md:grid-cols-4", thresholdsOk ? "border-border" : "border-destructive/40 bg-destructive/5")}>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Utama ≥</Label>
            <Input type="number" value={draft.thresholds.utama} onChange={(event) => setDraft({ ...draft, thresholds: { ...draft.thresholds, utama: Number(event.target.value) || 0 } })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Layak ≥</Label>
            <Input type="number" value={draft.thresholds.layak} onChange={(event) => setDraft({ ...draft, thresholds: { ...draft.thresholds, layak: Number(event.target.value) || 0 } })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Cadangan ≥</Label>
            <Input type="number" value={draft.thresholds.cadangan} onChange={(event) => setDraft({ ...draft, thresholds: { ...draft.thresholds, cadangan: Number(event.target.value) || 0 } })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Fallback &lt;</Label>
            <Input type="number" value={draft.fallbackBelow} onChange={(event) => setDraft({ ...draft, fallbackBelow: Number(event.target.value) || 0 })} />
          </div>
        </div>
        {!thresholdsOk && <p className="mt-1 text-xs font-semibold text-destructive">Ambang harus berurutan naik: cadangan &lt; layak &lt; utama.</p>}
      </div>

      <div className="space-y-2 rounded-2xl border border-border p-3">
        <div>
          <p className="text-sm font-extrabold">Filter Profil (Saringan Aman)</p>
          <p className="text-xs text-muted-foreground">
            Aturan ini hanya menandai "simpan dulu" — tidak pernah menghapus niche, dan Affiliate BuatCuan selalu kebal terlepas dari pengaturan di sini.
          </p>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tandai jika Waktu Luang user =</Label>
            <SearchSelect
              value={draft.filters.waktuMismatch.userLevel}
              onChange={(value) => setDraft({ ...draft, filters: { ...draft.filters, waktuMismatch: { ...draft.filters.waktuMismatch, userLevel: value as NicheLevel } } })}
              options={LEVEL_OPTIONS}
              placeholder="Waktu luang"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">dan Beban Waktu niche =</Label>
            <SearchSelect
              value={draft.filters.waktuMismatch.candidateBebanWaktu}
              onChange={(value) =>
                setDraft({ ...draft, filters: { ...draft.filters, waktuMismatch: { ...draft.filters.waktuMismatch, candidateBebanWaktu: value as NicheLevel } } })
              }
              options={LEVEL_OPTIONS}
              placeholder="Beban waktu"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Jalur yang wajib punya akses kirim/beli produk</Label>
          <div className="flex flex-wrap gap-2">
            {JALUR_OPTIONS.map((option) => {
              const active = draft.filters.aksesBarangRequiredJalur.includes(option.value as NicheJalurCuan);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      filters: {
                        ...draft.filters,
                        aksesBarangRequiredJalur: active
                          ? draft.filters.aksesBarangRequiredJalur.filter((value) => value !== option.value)
                          : [...draft.filters.aksesBarangRequiredJalur, option.value as NicheJalurCuan],
                      },
                    })
                  }
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
                    active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border p-3">
          <div>
            <p className="text-sm font-bold">Urutkan Saran Niche berdasar minat</p>
            <p className="text-xs text-muted-foreground">Soft-boost saja, tidak memengaruhi skor — niche yang cocok minat user ditaruh lebih dulu.</p>
          </div>
          <Switch
            checked={draft.filters.minatBoostEnabled}
            onCheckedChange={(checked) => setDraft({ ...draft, filters: { ...draft.filters, minatBoostEnabled: checked } })}
          />
        </div>
      </div>

      <Button
        type="button"
        disabled={save.isPending || !baseSumOk || !personalSumOk || !thresholdsOk}
        onClick={() => save.mutate(draft)}
        className={adminButton("add", "w-full md:w-auto")}
      >
        {save.isPending ? "Menyimpan..." : "Simpan Konfigurasi Skor"}
      </Button>
    </Panel>
  );
}
