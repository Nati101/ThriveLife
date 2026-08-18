/**
 * Draft → review → publish (spec §11.2).
 * Engine and member surfaces read published rows only (fixtures ship published).
 */

export const WORKFLOW_STATUSES = [
  "draft",
  "in_review",
  "published",
  "archived",
] as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

export type WorkflowAction = "submit_review" | "approve" | "publish" | "unpublish" | "archive";

export function canTransitionWorkflow(
  from: WorkflowStatus,
  action: WorkflowAction,
  perms: {
    canDraftContent: boolean;
    canReviewContent: boolean;
    canPublishContent: boolean;
  },
): boolean {
  switch (action) {
    case "submit_review":
      return perms.canDraftContent && (from === "draft" || from === "archived");
    case "approve":
      return perms.canReviewContent && from === "in_review";
    case "publish":
      return perms.canPublishContent && (from === "in_review" || from === "draft");
    case "unpublish":
      return perms.canPublishContent && from === "published";
    case "archive":
      return (
        (perms.canDraftContent || perms.canPublishContent) &&
        from !== "archived"
      );
    default:
      return false;
  }
}

export function applyWorkflowAction(
  from: WorkflowStatus,
  action: WorkflowAction,
): WorkflowStatus {
  switch (action) {
    case "submit_review":
      return "in_review";
    case "approve":
      return "in_review";
    case "publish":
      return "published";
    case "unpublish":
      return "draft";
    case "archive":
      return "archived";
    default:
      return from;
  }
}

export function isPublishedForEngine(status: WorkflowStatus | undefined): boolean {
  return status == null || status === "published";
}
