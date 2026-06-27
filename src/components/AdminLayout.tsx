import { Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, Bell, BookOpen, ChevronDown, ChevronUp, Database, FileText, History, Home, KeyRound, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Settings, UserCircle, Users, Video, Wallet, Wrench } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeModeToggle } from "@/components/ThemeModeToggle";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useNotificationStream } from "@/hooks/use-notification-stream";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/admin", label: "Overview", icon: Home, end: true },
  { to: "/admin/withdrawals", label: "Withdraw", icon: Wallet },
  { to: "/admin/password-resets", label: "Reset Password", icon: KeyRound },
];

const bottomNav = [
  { to: "/admin/action-logs", label: "Log Admin", icon: History },
];

const masterNav = [
  { to: "/admin/master-data/landing", label: "Landing", icon: FileText },
  { to: "/admin/master-data/usage-videos", label: "Video Cara Pakai", icon: Video },
  { to: "/admin/master-data/videos", label: "Video Materi", icon: BookOpen },
  { to: "/admin/master-data/updates", label: "Update", icon: Bell },
  { to: "/admin/master-data/guidance", label: "Bimbingan", icon: Settings },
  { to: "/admin/master-data/plans", label: "Paket", icon: BarChart3 },
  { to: "/admin/master-data/users", label: "User", icon: Users },
  { to: "/admin/master-data/user-roles", label: "Role User", icon: UserCircle },
  { to: "/admin/master-data/user-levels", label: "Level User", icon: BarChart3 },
  { to: "/admin/master-data/settings", label: "Pengaturan", icon: Settings },
];

const AdminLayout = () => {
  const { user, loading, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = Boolean(user && user.role === "admin");
  useNotificationStream(isAdmin);
  const { data: notificationMeta } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: api.notifications.unreadCount,
    enabled: isAdmin,
    refetchInterval: 60_000,
  });
  const { data: tools = [] } = useQuery({ queryKey: ["admin-tools-nav"], queryFn: api.admin.tools.list, enabled: isAdmin });
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("buatcuan:admin-sidebar") === "collapsed");
  const [masterOpen, setMasterOpen] = useState(() => localStorage.getItem("buatcuan:admin-master-open") !== "closed");
  const [toolsOpen, setToolsOpen] = useState(() => localStorage.getItem("buatcuan:admin-tools-open") !== "closed");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm font-semibold text-muted-foreground">
        Memuat dashboard admin...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/app" replace />;

  const out = () => {
    logout();
    navigate("/");
  };

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("buatcuan:admin-sidebar", next ? "collapsed" : "expanded");
  };
  const toggleTools = () => {
    const next = !toolsOpen;
    setToolsOpen(next);
    localStorage.setItem("buatcuan:admin-tools-open", next ? "open" : "closed");
  };
  const toggleMaster = () => {
    const next = !masterOpen;
    setMasterOpen(next);
    localStorage.setItem("buatcuan:admin-master-open", next ? "open" : "closed");
  };
  const legacyMasterActive = ["/admin/landing", "/admin/videos", "/admin/updates", "/admin/guidance", "/admin/plans", "/admin/users", "/admin/settings"].some((path) => location.pathname.startsWith(path));
  const masterActive = location.pathname.startsWith("/admin/master-data") || legacyMasterActive;
  const toolsActive = location.pathname.startsWith("/admin/tools") || location.pathname.startsWith("/admin/hook-ideas");
  const closeMobile = () => setMobileOpen(false);
  const unreadCount = notificationMeta?.unreadCount ?? 0;

  const renderNav = (isCollapsed: boolean, onNavigate?: () => void) => (
    <>
      <div className="space-y-1">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={label}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                isActive ? "border border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
            title={isCollapsed ? label : undefined}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
        <div>
          <button
            type="button"
            onClick={() => isCollapsed ? navigate("/admin/master-data") : toggleMaster()}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
              masterActive ? "border border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            title={isCollapsed ? "Master Data" : undefined}
          >
            <Database className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate">Master Data</span>}
            {!isCollapsed && (masterOpen ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />)}
          </button>
          {!isCollapsed && masterOpen && (
            <div className="mt-1 space-y-1 border-l border-border pl-3">
              <NavLink
                to="/admin/master-data"
                end
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                Semua Master
              </NavLink>
              {masterNav.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`
                  }
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => isCollapsed ? navigate("/admin/tools") : toggleTools()}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
              toolsActive ? "border border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            title={isCollapsed ? "Tools" : undefined}
          >
            <Wrench className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate">Tools</span>}
            {!isCollapsed && (toolsOpen ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />)}
          </button>
          {!isCollapsed && toolsOpen && (
            <div className="mt-1 space-y-1 border-l border-border pl-3">
              <NavLink
                to="/admin/tools"
                end
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                Semua Tools
              </NavLink>
              {tools.map((tool) => (
                <NavLink
                  key={tool.slug}
                  to={`/admin/tools/${tool.slug}`}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`
                  }
                >
                  <span className="truncate">{tool.name}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-auto space-y-1 border-t border-border pt-3">
        {bottomNav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={label}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                isActive ? "border border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
            title={isCollapsed ? label : undefined}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </div>
    </>
  );

  return (
    <div className="admin-solid-surfaces min-h-screen bg-background relative overflow-x-hidden">
      <aside className={`fixed inset-y-0 left-0 z-50 hidden lg:flex flex-col border-r border-border bg-card transition-[width] duration-200 ${collapsed ? "w-[76px]" : "w-[264px]"}`}>
        <div className={`h-16 flex items-center border-b border-border ${collapsed ? "justify-center px-2" : "justify-between px-4"}`}>
          <NavLink to="/admin" className="flex min-w-0 items-center gap-2">
            <img src="/images/logo/buatcuan-icon.png" alt="BuatCuan" className="w-9 h-9 rounded-xl shrink-0 object-contain" />
            {!collapsed && <span className="font-extrabold truncate">Admin BuatCuan</span>}
          </NavLink>
          <Button
            onClick={toggleSidebar}
            size="sm"
            variant="ghost"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`h-9 w-9 p-0 shrink-0 ${collapsed ? "absolute left-[58px] top-3 border border-border bg-card shadow-lg hover:bg-muted" : ""}`}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
          {renderNav(collapsed)}
        </nav>

        <div className="p-3 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`w-full rounded-xl border border-border bg-muted hover:bg-secondary transition-colors ${
                  collapsed ? "h-11 grid place-items-center" : "p-2 flex items-center gap-2 text-left"
                }`}
                title="Pengaturan akun"
              >
                <div className="w-8 h-8 rounded-lg border border-primary bg-primary grid place-items-center text-primary-foreground font-bold shrink-0">
                  {user.name?.[0]?.toUpperCase() ?? "A"}
                </div>
                {!collapsed && (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground">Administrator</p>
                    </div>
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" sideOffset={12} className="w-72">
              <DropdownMenuLabel>
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.wa}</p>
                  <p className="text-xs text-primary uppercase mt-1">{user.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/admin/master-data/settings")}>
                <Settings className="w-4 h-4 mr-2" />
                Setting
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLogoutOpen(true)} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="flex w-[86vw] max-w-[340px] flex-col gap-0 border-border bg-card p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu Admin</SheetTitle>
            <SheetDescription>Navigasi dashboard admin BuatCuan</SheetDescription>
          </SheetHeader>
          <div className="flex h-16 items-center gap-2 border-b border-border px-4">
            <img src="/images/logo/buatcuan-icon.png" alt="BuatCuan" className="h-9 w-9 rounded-xl object-contain" />
            <span className="font-extrabold">Admin BuatCuan</span>
          </div>
          <nav className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
            {renderNav(false, closeMobile)}
          </nav>
          <div className="border-t border-border p-3">
            <Button onClick={() => { closeMobile(); navigate("/admin/master-data/settings"); }} variant="outline" className="mb-2 h-11 w-full justify-start rounded-xl border-border bg-muted">
              <Settings className="mr-2 h-4 w-4" /> Setting
            </Button>
            <Button onClick={() => { closeMobile(); setLogoutOpen(true); }} variant="destructive" className="h-11 w-full justify-start rounded-xl">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <div className={`relative min-h-screen transition-[padding] duration-200 ${collapsed ? "lg:pl-[76px]" : "lg:pl-[264px]"}`}>
        <header className="sticky top-0 z-40 h-16 border-b border-border bg-card">
          <div className="h-full px-4 md:px-6 flex items-center justify-between">
            <div className="flex items-center gap-2 lg:hidden">
              <Button onClick={() => setMobileOpen(true)} size="sm" variant="outline" className="h-9 w-9 border-border bg-muted p-0" aria-label="Buka menu admin">
                <Menu className="h-4 w-4" />
              </Button>
              <img src="/images/logo/buatcuan-icon.png" alt="BuatCuan" className="h-9 w-9 rounded-xl object-contain" />
              <span className="font-extrabold">Admin BuatCuan</span>
            </div>
            <div className="hidden lg:block text-sm text-muted-foreground">Dashboard Admin</div>
            <div className="flex items-center gap-2">
              <NavLink
                to="/admin/notifications"
                aria-label="Buka notifikasi admin"
                className={({ isActive }) => cn(
                  "relative grid h-9 w-9 place-items-center rounded-xl border transition",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted text-muted-foreground hover:border-primary/35 hover:text-foreground",
                )}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-black leading-none text-primary-foreground shadow-glow-sm">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </NavLink>
              <ThemeModeToggle />
              <Button onClick={() => setLogoutOpen(true)} size="sm" variant="outline" className="lg:hidden h-9 border-border bg-muted">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>
        <main className="relative w-full px-4 py-4 md:px-6 md:py-6">
          <Outlet />
        </main>
      </div>
      <ConfirmActionDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Logout dari admin?"
        description="Sesi admin akan ditutup dan kamu perlu login kembali untuk masuk dashboard."
        confirmLabel="Ya, logout"
        destructive
        onConfirm={out}
      />
    </div>
  );
};

export default AdminLayout;
