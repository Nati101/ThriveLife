import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { RequireAdmin, RequireContentTools } from "@/components/RequireRole";
import { HomePage } from "@/pages/HomePage";
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
import { AdminThresholdsPage } from "@/pages/admin/AdminThresholdsPage";
import { DevRolePage } from "@/pages/DevRolePage";

/**
 * Route map mirrors the product loop and Base44-style pages/ layout.
 * When the Base44 export lands, merge real UI into these page modules.
 */
export const appRoutes = [
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "onboarding", element: <OnboardingPage /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "check-in", element: <CheckInPage /> },
      { path: "assessments", element: <AssessmentsPage /> },
      { path: "assessments/drain-check", element: <DrainCheckPage /> },
      { path: "assessments/battery-scan", element: <BatteryScanPage /> },
      { path: "assessments/full-assessment", element: <FullAssessmentPage /> },
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
        ],
      },
      {
        path: "*",
        element: (
          <div>
            <p className="text-muted-foreground">Page not found.</p>
            <Link
              to="/"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Home
            </Link>
          </div>
        ),
      },
    ],
  },
];
