/**
 * Result / safety / notification copy — admin-editable (spec §11.2).
 * Fixture wording only; Joel replaces before beta.
 */

import type { WorkflowStatus } from "./workflow";

export const COPY_KINDS = [
  "result",
  "safety",
  "notification",
  "disclaimer",
] as const;

export type CopyKind = (typeof COPY_KINDS)[number];

export type ContentCopy = {
  id: string;
  kind: CopyKind;
  key: string;
  title: string;
  body: string;
  workflowStatus: WorkflowStatus;
  isFixture: boolean;
};

export function copyByKey(
  rows: ContentCopy[],
  key: string,
): ContentCopy | null {
  return rows.find((row) => row.key === key && row.workflowStatus === "published") ?? null;
}
