import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api, authStorage, getErrorMessage, type ApiUser, type PaymentDto } from "@/lib/api";
import { toast } from "sonner";

export type Role = string;
export type User = ApiUser;
type ActionResult = { success: boolean; message?: string };

interface AppState {
  user: User | null;
  loading: boolean;
  login: (wa: string, password: string, remember?: boolean) => Promise<ActionResult & { user?: ApiUser }>;
  register: (data: { name: string; wa: string; password: string; referral?: string; termsAccepted: boolean }) => Promise<ActionResult & { user?: ApiUser }>;
  logout: () => void;
  activateMembership: (planId: string, paymentMethod: string, paymentProvider?: string) => Promise<ActionResult & { checkoutUrl?: string; provider?: string; payment?: PaymentDto }>;
  toggleLesson: (id: string) => Promise<void>;
  setRole: (role: Role) => void;
  refreshUser: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

function sanitizeUser(input: ApiUser | null): ApiUser | null {
  if (!input) return null;

  const completedLessons = Array.isArray(input.completedLessons)
    ? input.completedLessons.filter((id): id is string => typeof id === "string")
    : [];

  return {
    ...input,
    id: typeof input.id === "string" ? input.id : "",
    name: typeof input.name === "string" && input.name.trim() ? input.name : "Member",
    wa: typeof input.wa === "string" ? input.wa : "",
    referral: typeof input.referral === "string" ? input.referral : "",
    myRefCode: typeof input.myRefCode === "string" ? input.myRefCode : "",
    role: typeof input.role === "string" && input.role.trim() ? input.role : "member",
    membershipActive: Boolean(input.membershipActive),
    membershipExpiry: typeof input.membershipExpiry === "string" ? input.membershipExpiry : "",
    autoRenewMembership: Boolean(input.autoRenewMembership),
    joinedAt: typeof input.joinedAt === "string" ? input.joinedAt : "",
    balance: Number.isFinite(Number(input.balance)) ? Number(input.balance) : 0,
    level: typeof input.level === "string" && input.level.trim() ? input.level : "Beginner",
    completedLessons,
  };
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => sanitizeUser(authStorage.getUser()));
  const [loading, setLoading] = useState(true);

  const syncUser = useCallback((nextUser: User | null) => {
    const safeUser = sanitizeUser(nextUser);
    setUser(safeUser);
    if (safeUser) authStorage.setUser(safeUser);
  }, []);

  useEffect(() => {
    const onAuthError = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      authStorage.clear();
      setUser(null);
      toast.error(detail?.message ?? "Sesi login berakhir. Silakan masuk ulang.");
    };

    window.addEventListener("buatcuan:auth-error", onAuthError);
    return () => window.removeEventListener("buatcuan:auth-error", onAuthError);
  }, []);

  const refreshUser = useCallback(async () => {
    const tokenAtStart = authStorage.getToken();
    if (!tokenAtStart) {
      syncUser(null);
      setLoading(false);
      return;
    }

    try {
      const { user: freshUser } = await api.auth.me();
      // Avoid overriding a newer session if token changed while request was in flight.
      if (authStorage.getToken() === tokenAtStart) {
        syncUser(freshUser);
      }
    } catch {
      // Only clear if the failing request still corresponds to current token.
      if (authStorage.getToken() === tokenAtStart) {
        authStorage.clear();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, [syncUser]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login: AppState["login"] = async (wa, password, remember = true) => {
    try {
      const session = await api.auth.login({ wa, password });
      const safeUser = sanitizeUser(session.user);
      if (!safeUser) {
        return { success: false, message: "Sesi login tidak valid. Coba login ulang." };
      }
      authStorage.setSession(session.token, safeUser, remember);
      setUser(safeUser);
      return { success: true, user: safeUser };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, "Cek lagi nomor telepon dan password kamu."),
      };
    }
  };

  const register: AppState["register"] = async ({ name, wa, password, referral, termsAccepted }) => {
    try {
      const session = await api.auth.register({ name, wa, password, referralCode: referral?.trim() || undefined, termsAccepted });
      return { success: true, user: session.user };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, "Pendaftaran gagal. Cek data dan referral kamu."),
      };
    }
  };

  const logout = () => {
    authStorage.clear();
    setUser(null);
  };

  const activateMembership = async (planId: string, paymentMethod: string, paymentProvider?: string) => {
    try {
      const result = await api.payments.checkout(planId, paymentMethod, paymentProvider);
      syncUser(result.user);
      return { success: true, checkoutUrl: result.checkoutUrl, provider: result.provider, payment: result.payment };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, "Invoice pembayaran gagal dibuat."),
      };
    }
  };

  const toggleLesson = async (id: string) => {
    if (!user) return;
    const completed = !user.completedLessons.includes(id);
    await api.lessons.progress(id, completed);
    syncUser({
      ...user,
      completedLessons: completed
        ? [...user.completedLessons, id]
        : user.completedLessons.filter((lessonId) => lessonId !== id),
    });
  };

  const setRole = (role: Role) => {
    if (!user) return;
    syncUser({ ...user, role });
  };

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, activateMembership, toggleLesson, setRole, refreshUser }}>
      {children}
    </Ctx.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
};

export const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
