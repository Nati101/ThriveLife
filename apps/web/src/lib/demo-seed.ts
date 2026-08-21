import {
  completeAssessmentSession,
  fetchInstrumentBootstrap,
  saveAssessmentResponses,
  startAssessmentSession,
} from "@/lib/assessment-api";
import {
  acceptConsent,
  deleteMyData,
  saveCheckIn,
  saveOnboarding,
} from "@/lib/member-api";

const SCAN_LEVELS = ["low", "steady", "full", "steady", "low", "steady", "full"] as const;

/**
 * Seeds a coherent demo journey via existing APIs so Pages and local `/api`
 * both work. Fixture item wording stays labeled; this does not invent clinical banks.
 */
export async function seedDemoProfile(): Promise<void> {
  const now = new Date().toISOString();

  await deleteMyData().catch(() => undefined);
  await acceptConsent().catch(() => undefined);
  await saveOnboarding({
    step: 8,
    completedAt: now,
    firstRechargeCompletedAt: now,
    contextAnswers: {
      season: "Busy season at work and home",
      transitions: "New role + school year start",
      caregiving: "Part-time caregiving one evening a week",
      health: "Prefer low-impact movement options",
      schedule: "Early start, evening wind-down is hard",
      energyFocus: "Physical and Daily Rhythms",
    },
  });

  // Battery Scan — mixed markers so “today’s recharge” resolves
  const scanBoot = await fetchInstrumentBootstrap("battery_scan");
  const scanStart = await startAssessmentSession("battery_scan", { forceNew: true });
  await saveAssessmentResponses(
    scanStart.session.id,
    scanBoot.items.map((item, index) => ({
      itemId: item.id,
      answer: SCAN_LEVELS[index % SCAN_LEVELS.length],
      skipped: false,
    })),
  );
  await completeAssessmentSession(scanStart.session.id);

  // Full Assessment — mid-frequency answers fill seven rings
  const faBoot = await fetchInstrumentBootstrap("full_assessment");
  if (!faBoot.eligibility?.locked) {
    const faStart = await startAssessmentSession("full_assessment", { forceNew: true });
    await saveAssessmentResponses(
      faStart.session.id,
      faBoot.items.map((item, index) => ({
        itemId: item.id,
        answer: index % 5 === 0 ? 1 : index % 3 === 0 ? 3 : 2,
        skipped: false,
      })),
    );
    await completeAssessmentSession(faStart.session.id);
  }

  // Weekly mode — user-declared Yellow
  const modeBoot = await fetchInstrumentBootstrap("weekly_mode_check");
  const modeStart = await startAssessmentSession("weekly_mode_check", {
    forceNew: true,
  });
  const modeItem = modeBoot.items[0];
  if (modeItem) {
    await saveAssessmentResponses(modeStart.session.id, [
      { itemId: modeItem.id, answer: "yellow", skipped: false },
    ]);
    await completeAssessmentSession(modeStart.session.id, {
      declaredMode: "yellow",
    });
  }

  await saveCheckIn({
    mode: "yellow",
    batteryId: "physical",
    rechargeSelected: "2min",
    completion: "completed",
    note: "Demo check-in — two-minute pit stop after lunch.",
  });
}
