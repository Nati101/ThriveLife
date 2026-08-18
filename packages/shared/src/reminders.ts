/**
 * Day 3 / Day 7 Full Assessment re-prompts after onboarding decline (spec §7.1).
 * Copy is fixture/draft until Joel supplies notification wording.
 */

import type { OnboardingProgress } from "./schema";

export const DAY_MS = 24 * 60 * 60 * 1000;

export type AssessmentPromptKind = "day3" | "day7";

export type ReminderMessage = {
  kind: AssessmentPromptKind;
  subject: string;
  text: string;
};

const COPY: Record<AssessmentPromptKind, Omit<ReminderMessage, "kind">> = {
  day3: {
    subject: "[DRAFT] ThriveLife — a Full Assessment when you have about 9 minutes",
    text: "[FIXTURE / DRAFT] Three days ago you chose not to take the Full Assessment. It is still optional. When you have about nine minutes, it fills in the seven-battery dashboard so recharge matching is grounded in the past two weeks — not a guess. Nothing is lost if today is not the day.",
  },
  day7: {
    subject: "[DRAFT] ThriveLife — optional Full Assessment (Day 7)",
    text: "[FIXTURE / DRAFT] A week ago you skipped the Full Assessment. You can still take it whenever you are ready. Low is a signal to take a pit stop, not a verdict. Support stays available either way.",
  },
};

export function dueFullAssessmentPrompts(
  progress: Pick<
    OnboardingProgress,
    "declinedFullAssessmentAt" | "day3PromptedAt" | "day7PromptedAt"
  >,
  nowIso = new Date().toISOString(),
): AssessmentPromptKind[] {
  if (!progress.declinedFullAssessmentAt) return [];
  const elapsed = Date.parse(nowIso) - Date.parse(progress.declinedFullAssessmentAt);
  if (!Number.isFinite(elapsed) || elapsed < 0) return [];
  const due: AssessmentPromptKind[] = [];
  if (!progress.day3PromptedAt && elapsed >= 3 * DAY_MS) due.push("day3");
  if (!progress.day7PromptedAt && elapsed >= 7 * DAY_MS) due.push("day7");
  return due;
}

export function reminderMessage(kind: AssessmentPromptKind): ReminderMessage {
  return { kind, ...COPY[kind] };
}
