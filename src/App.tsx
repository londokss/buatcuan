import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import ScrollToTop from "@/components/ScrollToTop";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Register = lazy(() => import("./pages/Register"));
const RegisterSuccess = lazy(() => import("./pages/RegisterSuccess"));
const LegalDocument = lazy(() => import("./pages/LegalDocument"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Contact = lazy(() => import("./pages/Contact"));
const VideoShareRedirect = lazy(() => import("./pages/VideoShareRedirect"));
const GuestOnlyRoute = lazy(() => import("@/components/GuestOnlyRoute"));
const AppLayout = lazy(() => import("@/components/AppLayout"));
const AdminLayout = lazy(() => import("@/components/AdminLayout"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Materi = lazy(() => import("./pages/Materi"));
const MateriDetail = lazy(() => import("./pages/MateriDetail"));
const HookIdeas = lazy(() => import("./pages/HookIdeas"));
const Tools = lazy(() => import("./pages/Tools"));
const NicheTool = lazy(() => import("./pages/NicheTool"));
const BuatCuan = lazy(() => import("./pages/BuatCuan"));
const ProComparison = lazy(() => import("./pages/ProComparison"));
const Achievements = lazy(() => import("./pages/Achievements"));
const DailyPlan = lazy(() => import("./pages/DailyPlan"));
const MonthlyReport = lazy(() => import("./pages/MonthlyReport"));
const Affiliate = lazy(() => import("./pages/Affiliate"));
const Mentor = lazy(() => import("./pages/Mentor"));
const Payment = lazy(() => import("./pages/Payment"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Withdraw = lazy(() => import("./pages/Withdraw"));
const Bimbingan = lazy(() => import("./pages/Bimbingan"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Profile = lazy(() => import("./pages/Profile"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const ProfileEditPage = lazy(() => import("./pages/ProfileSubPages").then((module) => ({ default: module.ProfileEditPage })));
const PersonalBrandingPage = lazy(() => import("./pages/ProfileSubPages").then((module) => ({ default: module.PersonalBrandingPage })));
const MentorWhatsappPage = lazy(() => import("./pages/ProfileSubPages").then((module) => ({ default: module.MentorWhatsappPage })));
const SecuritySettingsPage = lazy(() => import("./pages/ProfileSubPages").then((module) => ({ default: module.SecuritySettingsPage })));
const HelpCenterPage = lazy(() => import("./pages/ProfileSubPages").then((module) => ({ default: module.HelpCenterPage })));
const MentorTermsPage = lazy(() => import("./pages/ProfileSubPages").then((module) => ({ default: module.MentorTermsPage })));
const DeleteAccountPage = lazy(() => import("./pages/ProfileSubPages").then((module) => ({ default: module.DeleteAccountPage })));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminLanding = lazy(() => import("@/features/admin/AdminDashboard").then((module) => ({ default: module.AdminLanding })));
const AdminUsageVideos = lazy(() => import("@/features/admin/AdminDashboard").then((module) => ({ default: module.AdminUsageVideos })));
const AdminUpdates = lazy(() => import("@/features/admin/AdminDashboard").then((module) => ({ default: module.AdminUpdates })));
const AdminVideos = lazy(() => import("@/features/admin/AdminDashboard").then((module) => ({ default: module.AdminVideos })));
const AdminGuidance = lazy(() => import("@/features/admin/AdminDashboard").then((module) => ({ default: module.AdminGuidance })));
const AdminHookIdeas = lazy(() => import("@/features/admin/AdminDashboard").then((module) => ({ default: module.AdminHookIdeas })));
const AdminTools = lazy(() => import("@/features/admin/AdminDashboard").then((module) => ({ default: module.AdminTools })));
const AdminNicheTool = lazy(() => import("@/features/admin/AdminNicheTool").then((module) => ({ default: module.AdminNicheTool })));
const AdminPlans = lazy(() => import("@/features/admin/AdminDashboard").then((module) => ({ default: module.AdminPlans })));
const AdminUsers = lazy(() => import("@/features/admin/AdminDashboard").then((module) => ({ default: module.AdminUsers })));
const AdminWithdrawals = lazy(() => import("@/features/admin/AdminDashboard").then((module) => ({ default: module.AdminWithdrawals })));
const AdminActionLogs = lazy(() => import("@/features/admin/AdminDashboard").then((module) => ({ default: module.AdminActionLogs })));
const AdminPasswordResets = lazy(() => import("@/features/admin/AdminDashboard").then((module) => ({ default: module.AdminPasswordResets })));
const AdminSettings = lazy(() => import("@/features/admin/AdminDashboard").then((module) => ({ default: module.AdminSettings })));
const AdminMasterData = lazy(() => import("@/features/admin/AdminDashboard").then((module) => ({ default: module.AdminMasterData })));
const AdminUserRoles = lazy(() => import("@/features/admin/AdminDashboard").then((module) => ({ default: module.AdminUserRoles })));
const AdminUserLevels = lazy(() => import("@/features/admin/AdminDashboard").then((module) => ({ default: module.AdminUserLevels })));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const routeFallback = (
  <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
    Memuat...
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" />
        <AppProvider>
          <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
            <ScrollToTop />
            <Suspense fallback={routeFallback}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/l/:slug" element={<Landing />} />
                <Route path="/login" element={<GuestOnlyRoute><Login /></GuestOnlyRoute>} />
                <Route path="/forgot-password" element={<GuestOnlyRoute><ForgotPassword /></GuestOnlyRoute>} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/register" element={<GuestOnlyRoute><Register /></GuestOnlyRoute>} />
                <Route path="/register/success" element={<RegisterSuccess />} />
                <Route path="/r/:ref" element={<GuestOnlyRoute><Register /></GuestOnlyRoute>} />
                <Route path="/terms" element={<LegalDocument />} />
                <Route path="/privacy" element={<LegalDocument />} />
                <Route path="/cookies" element={<LegalDocument />} />
                <Route path="/disclaimer" element={<LegalDocument />} />
                <Route path="/refund-policy" element={<LegalDocument />} />
                <Route path="/acceptable-use" element={<LegalDocument />} />
                <Route path="/affiliate-rules" element={<LegalDocument />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/v/:id" element={<VideoShareRedirect />} />
                <Route path="/app" element={<AppLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="materi" element={<Materi />} />
                  <Route path="materi/:id" element={<MateriDetail />} />
                  <Route path="tools" element={<Tools />} />
                  <Route path="tools/:slug" element={<Tools />} />
                  <Route path="niche-tool" element={<NicheTool />} />
                  <Route path="ide-hook" element={<HookIdeas />} />
                  <Route path="buatcuan" element={<BuatCuan />} />
                  <Route path="pro-comparison" element={<ProComparison />} />
                  <Route path="achievements" element={<Achievements />} />
                  <Route path="daily-plan" element={<DailyPlan />} />
                  <Route path="monthly-report" element={<MonthlyReport />} />
                  <Route path="affiliate" element={<Affiliate />} />
                  <Route path="mentor" element={<Mentor />} />
                  <Route path="payment" element={<Payment />} />
                  <Route path="wallet" element={<Wallet />} />
                  <Route path="withdraw" element={<Withdraw />} />
                  <Route path="bimbingan" element={<Bimbingan />} />
                  <Route path="updates" element={<Navigate to="/app/notifications" replace />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="profile/edit" element={<ProfileEditPage />} />
                  <Route path="profile/personal-branding" element={<PersonalBrandingPage />} />
                  <Route path="profile/mentor-whatsapp" element={<MentorWhatsappPage />} />
                  <Route path="profile/notifications" element={<Notifications />} />
                  <Route path="profile/security" element={<SecuritySettingsPage />} />
                  <Route path="profile/help" element={<HelpCenterPage />} />
                  <Route path="profile/terms" element={<MentorTermsPage />} />
                  <Route path="profile/delete-account" element={<DeleteAccountPage />} />
                  <Route path="account" element={<AccountSettings />} />
                </Route>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="landing" element={<AdminLanding />} />
                  <Route path="usage-videos" element={<AdminUsageVideos />} />
                  <Route path="videos" element={<AdminVideos />} />
                  <Route path="updates" element={<AdminUpdates />} />
                  <Route path="guidance" element={<AdminGuidance />} />
                  <Route path="tools" element={<AdminTools />} />
                  <Route path="tools/:slug" element={<AdminTools />} />
                  <Route path="hook-ideas" element={<AdminHookIdeas />} />
                  <Route path="niche-tool" element={<AdminNicheTool />} />
                  <Route path="plans" element={<AdminPlans />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="withdrawals" element={<AdminWithdrawals />} />
                  <Route path="password-resets" element={<AdminPasswordResets />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="action-logs" element={<AdminActionLogs />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="master-data" element={<AdminMasterData />} />
                  <Route path="master-data/landing" element={<AdminLanding />} />
                  <Route path="master-data/usage-videos" element={<AdminUsageVideos />} />
                  <Route path="master-data/videos" element={<AdminVideos />} />
                  <Route path="master-data/updates" element={<AdminUpdates />} />
                  <Route path="master-data/guidance" element={<AdminGuidance />} />
                  <Route path="master-data/plans" element={<AdminPlans />} />
                  <Route path="master-data/users" element={<AdminUsers />} />
                  <Route path="master-data/user-roles" element={<AdminUserRoles />} />
                  <Route path="master-data/user-levels" element={<AdminUserLevels />} />
                  <Route path="master-data/settings" element={<AdminSettings />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AppProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
