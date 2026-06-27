import { Check } from "lucide-react";
import type { NicheLevel, NicheTampilMuka } from "@/lib/api";
import { LEVEL_OPTIONS, TAMPIL_MUKA_OPTIONS } from "../niche-tool-constants";
import { isProfilWajibComplete, type NicheToolProfil } from "../types";

interface StepProfilProps {
  profil: NicheToolProfil;
  onChange: (profil: NicheToolProfil) => void;
  onNext: () => void;
}

function OptionRow<T extends string>({
  options,
  value,
  onSelect,
  testIdPrefix,
}: {
  options: Array<{ value: T; label: string }>;
  value: T | null;
  onSelect: (value: T) => void;
  testIdPrefix: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            data-testid={`${testIdPrefix}-${option.value}`}
            onClick={() => onSelect(option.value)}
            className={`relative h-16 rounded-2xl border px-2 text-xs font-bold transition-colors ${
              active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:bg-secondary/60"
            }`}
          >
            {active && <Check className="absolute right-1.5 top-1.5 h-3.5 w-3.5" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function StepProfil({ profil, onChange, onNext }: StepProfilProps) {
  const canContinue = isProfilWajibComplete(profil);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold">Profil Kamu</h2>
        <p className="mt-1 text-sm text-muted-foreground">3 pertanyaan wajib, 2 opsional (boleh dilewati).</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold">Modal yang kamu punya? <span className="text-destructive">*</span></p>
        <OptionRow
          options={LEVEL_OPTIONS}
          value={profil.modal}
          onSelect={(modal: NicheLevel) => onChange({ ...profil, modal })}
          testIdPrefix="niche-profil-modal"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold">Waktu luang kamu? <span className="text-destructive">*</span></p>
        <OptionRow
          options={LEVEL_OPTIONS}
          value={profil.waktu}
          onSelect={(waktu: NicheLevel) => onChange({ ...profil, waktu })}
          testIdPrefix="niche-profil-waktu"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold">Mau tampil muka? <span className="text-destructive">*</span></p>
        <div className="space-y-2">
          {TAMPIL_MUKA_OPTIONS.map((option) => {
            const active = option.value === profil.tampilMuka;
            return (
              <button
                key={option.value}
                type="button"
                data-testid={`niche-profil-tampil-muka-${option.value}`}
                onClick={() => onChange({ ...profil, tampilMuka: option.value as NicheTampilMuka })}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition-colors ${
                  active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:bg-secondary/60"
                }`}
              >
                {option.label}
                {active && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold text-muted-foreground">Minat kamu (opsional)</p>
        <input
          data-testid="niche-profil-minat"
          value={profil.minat}
          onChange={(event) => onChange({ ...profil, minat: event.target.value })}
          placeholder="Contoh: skincare, parenting, masak"
          className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm"
        />
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
        <span className="text-sm font-bold text-muted-foreground">Punya akses kirim/beli produk? (opsional)</span>
        <button
          type="button"
          data-testid="niche-profil-akses-barang"
          onClick={() => onChange({ ...profil, aksesBarang: !profil.aksesBarang })}
          className={`h-8 w-14 shrink-0 rounded-full transition-colors ${profil.aksesBarang ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`block h-6 w-6 translate-x-1 rounded-full bg-white shadow transition-transform ${profil.aksesBarang ? "translate-x-7" : ""}`} />
        </button>
      </div>

      <button
        type="button"
        data-testid="niche-profil-next"
        onClick={onNext}
        disabled={!canContinue}
        className="h-14 w-full rounded-3xl bg-primary text-base font-extrabold text-primary-foreground shadow-glow transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Lanjut
      </button>
    </div>
  );
}
