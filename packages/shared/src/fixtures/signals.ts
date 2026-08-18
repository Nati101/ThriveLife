import type { Signal } from "../schema";
import { BATTERY_IDS } from "../batteries";

export const FIXTURE_SIGNALS: Signal[] = BATTERY_IDS.flatMap((batteryId) => [
  {
    id: `fixture_signal_${batteryId}_body`,
    batteryId,
    channel: "body",
    description: `[FIXTURE] Body-channel signal for ${batteryId.replaceAll("_", " ")}.`,
    severity: "moderate",
    relatedRechargeIds: [],
  },
  {
    id: `fixture_signal_${batteryId}_behavior`,
    batteryId,
    channel: "behavior",
    description: `[FIXTURE] Behavior-channel signal for ${batteryId.replaceAll("_", " ")}.`,
    severity: "moderate",
    relatedRechargeIds: [],
  },
]);
