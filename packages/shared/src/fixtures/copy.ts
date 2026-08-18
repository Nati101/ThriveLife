/**
 * FIXTURE copy — clearly labeled placeholders until Joel delivers §11.1 package.
 */

import type { ContentCopy } from "../copy";

export const FIXTURE_CONTENT_COPY: ContentCopy[] = [
  {
    id: "fixture_copy_disclaimer_onboarding",
    kind: "disclaimer",
    key: "onboarding.wellness_disclaimer",
    title: "Wellness tool disclaimer",
    body: "[FIXTURE] ThriveLife is a wellness and self-reflection tool. It does not provide diagnosis, treatment, or emergency support. Batteries rise and fall. Low is not failure — it is a signal to take a pit stop.",
    workflowStatus: "published",
    isFixture: true,
  },
  {
    id: "fixture_copy_result_partial",
    kind: "result",
    key: "results.partial_dashboard",
    title: "Partial dashboard",
    body: "[FIXTURE] Some batteries do not have enough answers for a state yet. Incomplete batteries are named; nothing is guessed.",
    workflowStatus: "published",
    isFixture: true,
  },
  {
    id: "fixture_copy_safety_always",
    kind: "safety",
    key: "safety.always_available",
    title: "Always-available support",
    body: "[FIXTURE] Support resources are always here, for anyone, regardless of scores. They are not triggered by answers.",
    workflowStatus: "published",
    isFixture: true,
  },
  {
    id: "fixture_copy_notify_checkin",
    kind: "notification",
    key: "notify.daily_checkin",
    title: "Optional check-in reminder",
    body: "[FIXTURE] When you want a nudge: a short check-in can help you notice and match a recharge. You can turn reminders off anytime.",
    workflowStatus: "published",
    isFixture: true,
  },
  {
    id: "fixture_copy_notify_disabled",
    kind: "notification",
    key: "notify.disabled_ack",
    title: "Reminders off",
    body: "[FIXTURE] Reminders are off. Nothing is lost — practice the return when you are ready.",
    workflowStatus: "published",
    isFixture: true,
  },
];
