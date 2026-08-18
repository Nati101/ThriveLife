import type { BatteryDefinition } from "../batteries";

/**
 * FIXTURE — seven Life Batteries from spec §2.2.
 * Replace definitions with Joel's terminology dictionary when delivered.
 */
export const FIXTURE_BATTERIES: BatteryDefinition[] = [
  {
    id: "daily_rhythms",
    name: "Daily Rhythms",
    covers: "Defaults, anchors, transitions, start/stop structure",
    thinkOfItAs: "The operating system of the day",
    icon: "sunrise",
    displayOrder: 1,
    bookChapterRef: null,
  },
  {
    id: "physical",
    name: "Physical",
    covers: "Sleep, fuel, movement, body regulation, recovery",
    thinkOfItAs: "Recovery capacity between demands",
    icon: "heart-pulse",
    displayOrder: 2,
    bookChapterRef: null,
  },
  {
    id: "mental",
    name: "Mental",
    covers: "Attention, decisions, information filtering, reflection",
    thinkOfItAs: "Visibility and steering",
    icon: "compass",
    displayOrder: 3,
    bookChapterRef: null,
  },
  {
    id: "emotional",
    name: "Emotional",
    covers: "Noticing emotion, regulating intensity, recovering, values alignment",
    thinkOfItAs: "The ability to respond rather than react",
    icon: "wave",
    displayOrder: 4,
    bookChapterRef: null,
  },
  {
    id: "relational",
    name: "Relational",
    covers: "Connection, trust, support, boundaries, communication, repair",
    thinkOfItAs: "The relationship capacity system",
    icon: "users",
    displayOrder: 5,
    bookChapterRef: null,
  },
  {
    id: "spiritual",
    name: "Spiritual",
    covers: "Inner compass, presence, hope, wonder, meaning, direction",
    thinkOfItAs: "True north and grounding",
    icon: "landmark",
    displayOrder: 6,
    bookChapterRef: null,
  },
  {
    id: "work_daily_purpose",
    name: "Work & Daily Purpose",
    covers: "Priorities, limits, direction, off-duty time, purpose",
    thinkOfItAs: "Where values meet the calendar",
    icon: "briefcase",
    displayOrder: 7,
    bookChapterRef: null,
  },
];
