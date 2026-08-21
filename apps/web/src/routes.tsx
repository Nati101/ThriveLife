import { Link } from "react-router-dom";
import { RequireAdmin, RequireContentTools } from "@/components/RequireRole";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { PublicLayout } from "@/components/PublicLayout";
import { LandingPage } from "@/pages/LandingPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { CheckInPage } from "@/pages/CheckInPage";
import { AssessmentsPage } from "@/pages/AssessmentsPage";
import { DrainCheckPage } from "@/pages/assessments/DrainCheckPage";
import { BatteryScanPage } from "@/pages/assessments/BatteryScanPage";
import { FullAssessmentPage } from "@/pages/assessments/FullAssessmentPage";
import { WeeklyModeCheckPage } from "@/pages/assessments/WeeklyModeCheckPage";
import { AdminPage } from "@/pages/admin/AdminPage";
import { AdminContentPage } from "@/pages/admin/AdminContentPage";
import { AdminCopyPage } from "@/pages/admin/AdminCopyPage";
import { AdminThresholdsPage } from "@/pages/admin/AdminThresholdsPage";
import { DevRolePage } from "@/pages/DevRolePage";
import { SupportPage } from "@/pages/SupportPage";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { TuneUpPage } from "@/pages/TuneUpPage";
import { ProgressPage } from "@/pages/ProgressPage";
import { AuthPage } from "@/pages/AuthPage";
import { PrivacyPolicyPage } from "@/pages/PrivacyPolicyPage";
import { TermsPage } from "@/pages/TermsPage";

/**
 * Public landing + auth, then gated app shell.
 * Flow: Landing → Sign in → Onboarding (if needed) → Dashboard.
 */
export const appRoutes = [
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "auth", element: <AuthPage /> },
      { path: "privacy-policy", element: <PrivacyPolicyPage /> },
      { path: "terms", element: <TermsPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "onboarding", element: <OnboardingPage /> },
          { path: "dashboard", element: <DashboardPage /> },
          { path: "check-in", element: <CheckInPage /> },
          { path: "tune-up", element: <TuneUpPage /> },
          { path: "progress", element: <ProgressPage /> },
          { path: "support", element: <SupportPage /> },
          { path: "privacy", element: <PrivacyPage /> },
          { path: "assessments", element: <AssessmentsPage /> },
          { path: "assessments/drain-check", element: <DrainCheckPage /> },
          { path: "assessments/battery-scan", element: <BatteryScanPage /> },
          {
            path: "assessments/full-assessment",
            element: <FullAssessmentPage />,
          },
          {
            path: "assessments/weekly-mode-check",
            element: <WeeklyModeCheckPage />,
          },
          { path: "dev/role", element: <DevRolePage /> },
          {
            path: "admin",
            element: <RequireContentTools />,
            children: [
              { index: true, element: <AdminPage /> },
              { path: "content", element: <AdminContentPage /> },
              {
                path: "thresholds",
                element: <RequireAdmin />,
                children: [{ index: true, element: <AdminThresholdsPage /> }],
              },
              { path: "copy", element: <AdminCopyPage /> },
            ],
          },
          {
            path: "*",
            element: (
              <div className="max-w-md space-y-3">
                <h1 className="text-3xl font-bold text-gray-800">
                  Page not found
                </h1>
                <p className="text-muted-foreground">
                  That route is not part of ThriveLife.
                </p>
                <Link
                  to="/dashboard"
                  className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-2 hover:underline"
                >
                  Dashboard
                </Link>
              </div>
            ),
          },
        ],
      },
    ],
  },
];
