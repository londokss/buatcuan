import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const modes = [
  { value: "light", label: "Tema Terang", icon: Sun },
  { value: "dark", label: "Tema Gelap", icon: Moon },
  { value: "system", label: "Ikuti Tema Sistem", icon: Monitor },
];

const ThemeModeToggle = ({ className = "" }: { className?: string }) => {
  const { theme, setTheme } = useTheme();
  const activeTheme = theme ?? "system";
  const activeMode = modes.find((mode) => mode.value === activeTheme) ?? modes[2];
  const ActiveIcon = activeMode.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Pilih tema"
          title="Pilih tema"
          className={cn(
            "grid h-9 w-9 place-items-center rounded-xl border border-border bg-secondary/70 text-muted-foreground transition-colors hover:bg-background/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <ActiveIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {modes.map(({ value, label, icon: Icon }) => {
          const active = activeTheme === value;
          return (
            <DropdownMenuItem
              key={value}
              onClick={() => setTheme(value)}
              className={cn("gap-2", active && "text-primary")}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{label.replace("Tema ", "").replace("Ikuti tema ", "")}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { ThemeModeToggle };
