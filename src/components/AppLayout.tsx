import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, BookOpen, User, Wrench, Crown, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ThemeModeToggle } from "@/components/ThemeModeToggle";
import { api } from "@/lib/api";
import { useNotificationStream } from "@/hooks/use-notification-stream";

const AppLayout = () => {
  const { user, loading } = useApp();
  const location = useLocation();
  const streamEnabled = Boolean(user && user.role !== "admin");
  useNotificationStream(streamEnabled);
  const { data: notificationMeta } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: api.notifications.unreadCount,
    enabled: streamEnabled,
    refetchInterval: 60_000,
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm font-semibold text-muted-foreground">
        Memuat aplikasi...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  const showNavigation = true;
  const firstName = (typeof user.name === "string" ? user.name.trim() : "").split(/\s+/)[0] || "Anggota";
  const unreadCount = notificationMeta?.unreadCount ?? 0;
  const tabs = [
    { to: "/app", icon: Home, label: "Beranda", end: true },
    { to: "/app/materi", icon: BookOpen, label: "Belajar" },
    { to: "/app/buatcuan", label: "+BuatCuan", kind: "money" as const },
    { to: "/app/tools", icon: Wrench, label: "Alat Bantu" },
    { to: "/app/profile", icon: User, label: "Akun" },
  ];

  return (
    <div className="member-type-scale relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Background ambient */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.10),transparent_42%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(0,210,106,0.12),transparent_42%)]" />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 border-r border-border bg-background/95 px-4 py-5 shadow-[12px_0_35px_hsl(0_0%_0%_/_0.06)] backdrop-blur-2xl dark:border-[#124725] dark:bg-[#07110b]/95 lg:flex lg:flex-col">
        <NavLink to="/app" className="group flex min-w-0 items-center gap-3 px-2">
          <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 via-background to-accent/20 p-[1px] shadow-glow-sm">
            <span className="grid h-full w-full place-items-center rounded-2xl border border-white/20 bg-background/80 backdrop-blur-xl">
              <img src="/images/logo/buatcuan-icon.png" alt="BuatCuan" className="h-8 w-8 object-contain" />
            </span>
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-extrabold leading-tight tracking-tight">Buat<span className="text-gradient-primary">Cuan</span></span>
            <span className="mt-0.5 block text-xs font-bold uppercase text-muted-foreground">
              {user.membershipActive ? levelIndonesia(user.level) : "PEMULA"}
            </span>
          </span>
        </NavLink>

        <nav className="mt-8 flex flex-1 flex-col gap-2">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={"end" in tab ? tab.end : undefined}
              className={({ isActive }) => cn(
                "group flex h-12 items-center gap-3 rounded-2xl px-3 text-sm font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                tab.kind === "money"
                  ? isActive
                    ? "bg-accent/15 text-accent shadow-[0_12px_30px_hsl(51_100%_50%_/_0.12)]"
                    : "text-accent hover:bg-accent/10"
                  : isActive
                    ? "bg-primary/15 text-primary shadow-glow-sm"
                    : "text-muted-foreground hover:bg-card hover:text-foreground",
              )}
            >
              {tab.kind === "money" ? (
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/15 text-base font-black">Rp</span>
              ) : (
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-card text-current ring-1 ring-border">
                  {tab.icon && <tab.icon className="h-5 w-5" />}
                </span>
              )}
              <span className="truncate">{tab.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="rounded-2xl border border-accent/35 bg-accent/10 p-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/15 text-accent ring-1 ring-accent/30">
              <Crown className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold text-foreground">Hai, {firstName}</span>
              <span className="mt-1 block truncate text-[10px] font-bold uppercase text-muted-foreground">
                {user.membershipActive ? "PRO aktif" : "Free member"}
              </span>
            </span>
          </div>
        </div>
      </aside>

      {/* Sticky header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 shadow-[0_10px_35px_hsl(0_0%_0%_/_0.08)] backdrop-blur-2xl dark:border-[#124725] dark:bg-[#07110b]/95 dark:shadow-[0_10px_35px_rgba(0,0,0,0.35)] lg:pl-72">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-5 md:px-6 lg:px-8">
          <NavLink to="/app" className="group flex min-w-0 items-center gap-3 lg:hidden">
            <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 via-background to-accent/20 p-[1px] shadow-glow-sm">
              <span className="grid h-full w-full place-items-center rounded-2xl border border-white/20 bg-background/80 backdrop-blur-xl">
                <img src="/images/logo/buatcuan-icon.png" alt="BuatCuan" className="h-7 w-7 object-contain" />
              </span>
            </span>
            <span className="min-w-0">
              <span className="block text-base font-extrabold leading-tight tracking-tight">Buat<span className="text-gradient-primary">Cuan</span></span>
            </span>
          </NavLink>
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:hidden">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={"end" in tab ? tab.end : undefined}
                className={({ isActive }) => cn(
                  "inline-flex h-10 min-w-0 items-center gap-2 rounded-xl px-3 text-xs font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  tab.kind === "money"
                    ? isActive
                      ? "bg-accent/15 text-accent"
                      : "text-accent hover:bg-accent/10"
                    : isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-card hover:text-foreground",
                )}
              >
                {tab.kind === "money" ? (
                  <span className="text-sm font-black">Rp</span>
                ) : (
                  tab.icon && <tab.icon className="h-4 w-4 shrink-0" />
                )}
                <span className="hidden truncate min-[900px]:inline">{tab.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <NavLink
              to="/app/notifications"
              aria-label="Buka notifikasi"
              className={({ isActive }) => cn(
                "relative grid h-9 w-9 place-items-center rounded-xl border transition",
                isActive
                  ? "border-primary/45 bg-primary/15 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/35 hover:text-foreground",
              )}
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-black leading-none text-primary-foreground shadow-glow-sm">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </NavLink>
            <ThemeModeToggle className="h-9 w-9" />
            <div className="hidden max-w-[152px] items-center gap-2 rounded-full border border-accent/35 bg-accent/10 px-2.5 py-1.5 shadow-[0_12px_28px_hsl(0_0%_0%_/_0.08)] dark:border-[#695f00] dark:bg-[#1b1a08] dark:shadow-[0_12px_28px_rgba(0,0,0,0.25)] min-[360px]:flex">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent/15 text-accent ring-1 ring-accent/30">
                <Crown className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 leading-none">
                <span className="block truncate text-xs font-extrabold text-foreground">Hai, {firstName}</span>
                <span className="mt-1 block truncate text-[9px] font-bold uppercase text-muted-foreground">
                  {user.membershipActive ? levelIndonesia(user.level) : "PEMULA"}
                </span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className={`relative lg:pl-72 ${showNavigation ? "pb-28 lg:pb-10" : "pb-8"}`}>
        <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-5 md:px-6 md:pt-5 lg:px-8 lg:pt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom nav */}
      {showNavigation && <nav className="pointer-events-none fixed bottom-0 inset-x-0 z-50 px-2.5 pb-3 pt-8 pb-safe lg:hidden">
        <div className="pointer-events-auto mx-auto max-w-md">
          <div className="relative rounded-[1.65rem] border border-border bg-background/95 px-1.5 py-2 shadow-[0_18px_45px_hsl(0_0%_0%_/_0.18)] backdrop-blur-2xl dark:border-[#1f1f1f] dark:bg-[#080808]/95">
            <div className="flex h-[56px] items-center justify-between gap-0">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={"end" in tab ? tab.end : undefined}
                  className={({ isActive }) => cn(
                    "group relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 overflow-visible rounded-xl px-0.5 text-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    tab.kind === "money"
                      ? "text-accent"
                      : isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {({ isActive }) => (
                    tab.kind === "money" ? (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId="buatcuanActive"
                            className="absolute inset-x-2 inset-y-0 rounded-2xl bg-accent/20"
                            transition={{ type: "spring", stiffness: 420, damping: 34 }}
                          />
                        )}
                        <span className={cn(
                          "relative z-10 block text-[20px] font-black leading-[18px] text-accent transition-transform",
                          isActive && "scale-105",
                        )}>
                          Rp.
                          <span className="absolute -right-2 -top-1 h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.85)]" />
                        </span>
                        <span className={cn(
                          "relative z-10 max-w-full truncate text-[9px] font-black leading-none text-accent",
                          isActive && "drop-shadow-[0_0_8px_hsl(var(--accent)/0.45)]",
                        )}>{tab.label}</span>
                      </>
                    ) : (
                      <>
                        <span className="relative z-10 grid h-6 w-6 place-items-center">
                          {tab.icon && <tab.icon className="h-[19px] w-[19px]" strokeWidth={isActive ? 2.6 : 2.25} />}
                        </span>
                        <span className={cn(
                          "relative z-10 max-w-full truncate text-[10px] font-bold leading-none",
                          isActive ? "text-primary" : "text-muted-foreground",
                        )}>{tab.label}</span>
                      </>
                    )
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </nav>}
    </div>
  );
};

export default AppLayout;

function levelIndonesia(level: string) {
  if (level === "Beginner") return "PEMULA";
  if (level === "Intermediate") return "MENENGAH";
  if (level === "Advanced") return "JAGO";
  return level.toUpperCase();
}
