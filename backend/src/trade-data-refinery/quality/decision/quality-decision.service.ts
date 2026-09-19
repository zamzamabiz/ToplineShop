import { IssueSeverity, RowDisposition } from '@prisma/client';
import { ValidationIssueInput } from '../validation/validator.service';

export interface QualityDecision {
  rowDisposition: RowDisposition;
  exportEligible: boolean;
  quarantineReviewRequired: boolean;
}

/**
 * Centralized row-disposition decision.
 *
 * BLOCKING issue  → REJECTED
 * ERROR issue     → QUARANTINED
 * WARNING only    → ACCEPTED
 * No issues       → ACCEPTED
 *
 * ACCEPTED  → exportEligible=true
 * QUARANTINED → quarantineReviewRequired=true
 * REJECTED  → quarantineReviewRequired=false (no human review required)
 */
export function determineDisposition(issues: ValidationIssueInput[]): QualityDecision {
  const maxSeverity = resolveMaxSeverity(issues);

  if (maxSeverity === 'BLOCKING') {
    return { rowDisposition: 'REJECTED', exportEligible: false, quarantineReviewRequired: false };
  }
  if (maxSeverity === 'ERROR') {
    return { rowDisposition: 'QUARANTINED', exportEligible: false, quarantineReviewRequired: true };
  }
  // WARNING or no issues → ACCEPTED
  return { rowDisposition: 'ACCEPTED', exportEligible: true, quarantineReviewRequired: false };
}

function resolveMaxSeverity(issues: ValidationIssueInput[]): IssueSeverity | null {
  if (issues.some((i) => i.severity === 'BLOCKING')) return 'BLOCKING';
  if (issues.some((i) => i.severity === 'ERROR')) return 'ERROR';
  if (issues.some((i) => i.severity === 'WARNING')) return 'WARNING';
  return null;
}
