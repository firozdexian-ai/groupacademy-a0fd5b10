import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { BootGate } from "@/components/BootGate";
import { TalentProvider } from "@/contexts/TalentContext";
import { useTalent } from "@/hooks/useTalent";
import { PageLoadingSkeleton } from "@/components/ui/page-loading-skeleton";

// Shell + guards (eager — small, used everywhere)
import { ProtectedRoute } from "./components/ProtectedRoute";
import { TalentAppShell } from "./layouts/TalentAppShell";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { PWAUpdatePrompt } from "./components/PWAUpdatePrompt";

// First-paint pages stay eager so initial render has no Suspense flash.
import Index from "./pages/Index";
import AuthClassic from "./pages/AuthClassic";
import AuthCallback from "./pages/AuthCallback";
import Start from "./pages/Start";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// ── Public pages (lazy) ──────────────────────────────────────────────────────
const PublicCourses    = lazy(() => import("./pages/PublicCourses"));
const CourseDetail     = lazy(() => import("./pages/CourseDetail"));
const PublicBlog       = lazy(() => import("./pages/PublicBlog"));
const PublicBlogPost   = lazy(() => import("./pages/PublicBlogPost"));
const VerifyCertificate = lazy(() => import("./pages/VerifyCertificate"));

// ── Admin pages (lazy) ───────────────────────────────────────────────────────
const Dashboard            = lazy(() => import("./pages/Dashboard"));
const Students             = lazy(() => import("./pages/Students"));
const Enrollments          = lazy(() => import("./pages/Enrollments"));
const ContentNew           = lazy(() => import("./pages/ContentNew"));
const ContentEdit          = lazy(() => import("./pages/ContentEdit"));
const QuizManagement       = lazy(() => import("./pages/QuizManagement"));
const ModuleManagement     = lazy(() => import("./pages/ModuleManagement"));
const ModuleResourcesManager = lazy(() => import("./pages/ModuleResourcesManager"));

// ── Talent app pages (lazy) ──────────────────────────────────────────────────
const Profile        = lazy(() => import("./pages/app/Profile"));
const ProfileEdit    = lazy(() => import("./pages/app/ProfileEdit"));
const LearningHub    = lazy(() => import("./pages/app/LearningHub"));
const AppCourses     = lazy(() => import("./pages/app/AppCourses"));
const AppCourseDetail = lazy(() => import("./pages/app/AppCourseDetail"));
const AppMyLearning  = lazy(() => import("./pages/app/AppMyLearning"));
const CareerCoach    = lazy(() => import("./pages/app/CareerCoach"));
const AgentChat      = lazy(() => import("./pages/app/AgentChat"));
const Blog           = lazy(() => import("./pages/app/Blog"));
const BlogPost       = lazy(() => import("./pages/app/BlogPost"));
const Unsubscribe    = lazy(() => import("./pages/app/Unsubscribe"));

// ── Content players (lazy) ───────────────────────────────────────────────────
const ImmersiveCoursePlayer = lazy(() => import("./pages/ImmersiveCoursePlayer"));
const Quiz                  = lazy(() => import("./pages/Quiz"));
const ReportCard            = lazy(() => import("./pages/ReportCard"));

// ── Query client ─────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes("timed out")) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

// ── Onboarding guard — v1.0.0 simplified ────────────────────────────────────
// Only redirects users who haven't finished the basic wizard (/start).
// Phone-capture modal and account-upgrade modal removed for v1.0.0.
const OnboardingGuard = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { talent, isTalentLoading } = useTalent();

  if (isTalentLoading && !talent) return <>{children}</>;

  // User hasn't started or finished wizard steps 1-3 → send to /start
  const needsWizard = !!talent && !talent.onboardingCompletedAt && talent.onboardingStep !== 4;
  const onStart = location.pathname.startsWith("/start");

  if (needsWizard && !onStart) {
    return <Navigate to="/start" replace />;
  }

  // v1.0.0: step 4 (AI profile builder) is skipped — wizard done = app access granted.
  return <>{children}</>;
};

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <BootGate>
            <TalentProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <PWAInstallPrompt />
                <PWAUpdatePrompt />

                <Suspense fallback={<PageLoadingSkeleton />}>
                  <Routes>
                    {/* ── PUBLIC ROUTES ──────────────────────────────────── */}
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Navigate to="/auth/classic" replace />} />
                    <Route path="/auth/classic" element={<AuthClassic />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/start" element={<Start />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* Public content */}
                    <Route path="/courses" element={<PublicCourses />} />
                    <Route path="/courses/:slug" element={<CourseDetail />} />
                    <Route path="/blog" element={<PublicBlog />} />
                    <Route path="/blog/:slug" element={<PublicBlogPost />} />
                    <Route path="/verify/:code" element={<VerifyCertificate />} />

                    {/* Unsubscribe (no auth required) */}
                    <Route path="/unsubscribe" element={<Unsubscribe />} />

                    {/* ── ADMIN ROUTES ────────────────────────────────────── */}
                    <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
                    <Route
                      path="/dashboard"
                      element={<ProtectedRoute requireAnyAdminRole><Dashboard /></ProtectedRoute>}
                    />
                    <Route path="/students"    element={<ProtectedRoute requireAdmin><Students /></ProtectedRoute>} />
                    <Route path="/enrollments" element={<ProtectedRoute requireAdmin><Enrollments /></ProtectedRoute>} />
                    <Route path="/content/new" element={<ProtectedRoute requireAdmin><ContentNew /></ProtectedRoute>} />
                    <Route path="/content/:id/edit" element={<ProtectedRoute requireAdmin><ContentEdit /></ProtectedRoute>} />
                    <Route path="/quiz-manage/:contentId" element={<ProtectedRoute requireAdmin><QuizManagement /></ProtectedRoute>} />
                    <Route path="/content/:contentId/modules" element={<ProtectedRoute requireAdmin><ModuleManagement /></ProtectedRoute>} />
                    <Route path="/content/:contentId/modules/:moduleId/resources" element={<ProtectedRoute requireAdmin><ModuleResourcesManager /></ProtectedRoute>} />

                    {/* ── MAIN APP ROUTES (Protected) ─────────────────────── */}
                    <Route path="/app" element={<Navigate to="/app/learning" replace />} />

                    <Route
                      path="/app/*"
                      element={
                        <ProtectedRoute>
                          <RouteErrorBoundary fallbackPath="/app/learning" fallbackLabel="Back to home">
                            <OnboardingGuard>
                              <TalentAppShell />
                            </OnboardingGuard>
                          </RouteErrorBoundary>
                        </ProtectedRoute>
                      }
                    >
                      {/* Learning */}
                      <Route path="learning" element={<LearningHub />} />
                      <Route path="learning/courses" element={<AppCourses />} />
                      <Route path="learning/courses/:slug" element={<AppCourseDetail />} />
                      <Route path="learning/my-courses" element={<AppMyLearning />} />

                      {/* Profile */}
                      <Route path="profile" element={<Profile />} />
                      <Route path="profile/edit" element={<ProfileEdit />} />

                      {/* AI Career Coach */}
                      <Route path="career-coach" element={<CareerCoach />} />
                      <Route path="agents/:agentKey" element={<AgentChat />} />

                      {/* Blog (in-app) */}
                      <Route path="blog" element={<Blog />} />
                      <Route path="blog/:slug" element={<BlogPost />} />

                      {/* Content players */}
                      <Route path="learn/:slug" element={<ImmersiveCoursePlayer />} />
                      <Route path="quiz/:slug" element={<Quiz />} />
                      <Route path="report-card/:enrollmentId" element={<ReportCard />} />

                      {/* Legacy redirects — keep so old links don't 404 */}
                      <Route path="feed" element={<Navigate to="/app/learning" replace />} />
                      <Route path="jobs" element={<Navigate to="/app/learning" replace />} />
                      <Route path="services/*" element={<Navigate to="/app/learning" replace />} />
                      <Route path="gigs/*" element={<Navigate to="/app/learning" replace />} />
                      <Route path="abroad/*" element={<Navigate to="/app/learning" replace />} />
                      <Route path="agents" element={<Navigate to="/app/career-coach" replace />} />
                      <Route path="messages/*" element={<Navigate to="/app/learning" replace />} />
                    </Route>

                    {/* Legacy top-level redirects */}
                    <Route path="/my-profile" element={<Navigate to="/app/profile" replace />} />
                    <Route path="/my-learning" element={<Navigate to="/app/learning/my-courses" replace />} />
                    <Route path="/for-companies" element={<Navigate to="/" replace />} />
                    <Route path="/gro10x/*" element={<Navigate to="/" replace />} />
                    <Route path="/company/*" element={<Navigate to="/" replace />} />

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </TooltipProvider>
            </TalentProvider>
          </BootGate>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
