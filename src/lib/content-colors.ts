import type { CSSProperties } from "react";

const tailwindColorMap: Record<string, string> = {
  "slate-400": "#94a3b8",
  "zinc-300": "#d4d4d8",
  "zinc-400": "#a1a1aa",
  "zinc-500": "#71717a",
  "neutral-400": "#a3a3a3",
  "red-400": "#f87171",
  "red-500": "#ef4444",
  "rose-400": "#fb7185",
  "rose-500": "#f43f5e",
  "pink-400": "#f472b6",
  "pink-500": "#ec4899",
  "fuchsia-400": "#e879f9",
  "fuchsia-500": "#d946ef",
  "purple-400": "#c084fc",
  "purple-500": "#a855f7",
  "violet-400": "#a78bfa",
  "violet-500": "#8b5cf6",
  "indigo-500": "#6366f1",
  "blue-500": "#3b82f6",
  "blue-600": "#2563eb",
  "sky-400": "#38bdf8",
  "sky-500": "#0ea5e9",
  "cyan-400": "#22d3ee",
  "teal-400": "#2dd4bf",
  "teal-500": "#14b8a6",
  "emerald-400": "#34d399",
  "emerald-500": "#10b981",
  "green-400": "#4ade80",
  "green-500": "#22c55e",
  "lime-400": "#a3e635",
  "lime-500": "#84cc16",
  "yellow-400": "#facc15",
  "yellow-500": "#eab308",
  "amber-400": "#fbbf24",
  "amber-500": "#f59e0b",
  "orange-400": "#fb923c",
  "orange-500": "#f97316",
};

const fallbackStops = ["#00d26a", "#16a34a"];

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function gradientStops(value?: string | null) {
  if (!value) return fallbackStops;

  const cssColors = value.match(/#[0-9a-f]{3,8}\b/gi);
  if (cssColors?.length) return cssColors.slice(0, 3);

  const stops = [...value.matchAll(/\b(?:from|via|to)-([a-z]+-\d{3})\b/g)]
    .map((match) => tailwindColorMap[match[1]])
    .filter(Boolean);

  return stops.length ? stops : fallbackStops;
}

export function gradientBackground(value?: string | null): CSSProperties {
  const stops = gradientStops(value);
  return { background: `linear-gradient(135deg, ${stops.join(", ")})` };
}

export function contentColorTheme(value?: string | null) {
  const stops = gradientStops(value);
  const accent = stops[0] ?? fallbackStops[0];
  const end = stops[stops.length - 1] ?? fallbackStops[1];

  return {
    accent,
    end,
    text: accent,
    border: hexToRgba(accent, 0.42),
    iconBg: hexToRgba(accent, 0.16),
    cardBg: `linear-gradient(145deg, ${hexToRgba(accent, 0.14)}, hsl(var(--card) / 0.96) 48%, ${hexToRgba(end, 0.08)})`,
    progressTrack: hexToRgba(accent, 0.12),
    shadow: `0 16px 42px ${hexToRgba(accent, 0.12)}`,
    gradient: `linear-gradient(135deg, ${stops.join(", ")})`,
  };
}
