import { Check } from "lucide-react";
import type { NicheJalurCuan } from "@/lib/api";
import { JALUR_OPTIONS } from "../niche-tool-constants";

interface StepJalurProps {
  jalur: NicheJalurCuan;
  onChange: (jalur: NicheJalurCuan) => void;
  onNext: () => void;
}

export function StepJalur({ jalur, onChange, onNext }: StepJalurProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold">Pilih Jalur Cuan</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ⭐ Affiliate BuatCuan sudah ke-pilih duluan — ini jalur utama kamu. Mau eksplor niche tambahan? Pilih salah satu jalur lain.
        </p>
      </div>

      <div className="space-y-2.5">
        {JALUR_OPTIONS.map((option) => {
          const active = option.value === jalur;
          return (
            <button
              key={option.value}
              type="button"
              data-testid={`niche-jalur-option-${option.value}`}
              onClick={() => onChange(option.value)}
              className={`flex w-full items-center gap-3 rounded-3xl border p-4 text-left transition-colors ${
                active ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-secondary/60"
              }`}
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-2xl">{option.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold">{option.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{option.description}</span>
              </span>
              {active && (
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-4 w-4" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        data-testid="niche-jalur-next"
        onClick={onNext}
        className="h-14 w-full rounded-3xl bg-primary text-base font-extrabold text-primary-foreground shadow-glow transition-transform active:scale-[0.98]"
      >
        Lanjut
      </button>
    </div>
  );
}
