/**
 * Privacy controls (spec §9.9). Private by default.
 */

export type PrivacySettings = {
  notificationsEnabled: boolean;
  aiFeaturesEnabled: boolean;
  journalRetentionDays: number | null;
  anonymousAnalytics: boolean;
  futureTeamShare: boolean;
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  notificationsEnabled: false,
  aiFeaturesEnabled: false,
  journalRetentionDays: 90,
  anonymousAnalytics: false,
  futureTeamShare: false,
};

export const SUPPORT_RESOURCES = [
  {
    region: "Canada / Alberta",
    name: "Talk Suicide Canada",
    detail: "24/7 phone and text support — 1-833-456-4566",
    url: "https://www.talksuicide.ca/",
  },
  {
    region: "Canada / Alberta",
    name: "911",
    detail: "Emergency services if you or someone else is in immediate danger.",
    url: null,
  },
  {
    region: "Canada / Alberta",
    name: "811 Health Link",
    detail: "Alberta 24/7 health advice.",
    url: "https://www.albertahealthservices.ca/assets/healthinfo/link/index.html",
  },
  {
    region: "Canada",
    name: "Wellness Together Canada",
    detail: "Mental health and substance use support.",
    url: "https://www.wellnesstogether.ca/",
  },
] as const;

export const NO_SCREENING_RATIONALE =
  "ThriveLife assessments contain no items about self-harm, suicidality, substance dependence, or abuse. Screening for risk creates a duty to respond that an unstaffed wellness app cannot discharge. The product posture is a wellness tool with an always-available support pathway — never a screener with an unstaffed alarm.";
