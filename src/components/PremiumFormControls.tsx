import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type PremiumSelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

export function PremiumSearchSelect({
  value,
  onChange,
  options,
  placeholder = "Pilih opsi",
  searchPlaceholder = "Cari opsi...",
  emptyLabel = "Tidak ditemukan.",
  disabled = false,
  className,
  triggerClassName,
}: {
  value: string;
  onChange: (value: string) => void;
  options: PremiumSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => options.find((option) => option.value === value), [options, value]);

  return (
    <Popover open={open && !disabled} onOpenChange={(nextOpen) => !disabled && setOpen(nextOpen)}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-12 w-full justify-between rounded-xl border-border bg-secondary/80 px-4 text-left text-sm font-extrabold shadow-sm transition hover:border-primary/35 hover:bg-secondary focus-visible:ring-primary/30 disabled:opacity-50",
            triggerClassName,
          )}
        >
          <span className={cn("min-w-0 truncate", !selected && "text-muted-foreground")}>{selected?.label ?? placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-2xl border-border bg-popover p-0 shadow-2xl", className)} align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-11 font-semibold" />
          <CommandList className="max-h-72">
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup className="p-1">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value}`}
                  disabled={option.disabled}
                  onSelect={() => {
                    if (option.disabled) return;
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className="rounded-xl px-3 py-2 text-sm font-bold"
                >
                  <Check className={cn("mr-2 h-4 w-4 text-primary", value === option.value ? "opacity-100" : "opacity-0")} />
                  <span className="min-w-0 truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function PremiumDatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  disabled = false,
  triggerClassName,
}: {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  triggerClassName?: string;
}) {
  const selected = value ? new Date(value) : undefined;
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open && !disabled} onOpenChange={(nextOpen) => !disabled && setOpen(nextOpen)}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-12 w-full justify-start rounded-xl border-border bg-secondary/80 px-4 text-sm font-extrabold shadow-sm hover:border-primary/35 hover:bg-secondary focus-visible:ring-primary/30 disabled:opacity-50",
            triggerClassName,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
          {selected ? format(selected, "dd MMM yyyy") : <span className="text-muted-foreground">{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-2xl border-border bg-popover p-0 shadow-2xl" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (!date) return;
            onChange(date.toISOString());
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
