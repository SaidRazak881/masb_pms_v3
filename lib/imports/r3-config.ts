import type { PipelineStage } from '@/types/database'

// Canonical status vocabulary for R3 / sales_report source systems.
export const R3_STAGE_MAP: Record<string, PipelineStage> = {
  'early engagement': 'LEAD_REGISTERED',
  'qualified lead/tender in progress': 'PROPOSAL_SUBMITTED',
  'proposal/tender submitted': 'PROPOSAL_SUBMITTED',
  'negotiation stage': 'QUOTATION_APPROVED',
  'verbal commitment': 'QUOTATION_APPROVED',
  'contract signed/po issued': 'PO_RECEIVED',
  'invoiced': 'INVOICED',
  'paid': 'PAID',
  'training completed': 'TRAINING_COMPLETED',
  'lost/no-go': 'LOST',
}

// Office Funnel statuses (Pending / In Progress / Done / KIV).
export const OFFICE_STAGE_MAP: Record<string, PipelineStage> = {
  'pending': 'LEAD_REGISTERED',
  'in progress': 'PROPOSAL_SUBMITTED',
  'done': 'PO_RECEIVED',
  'kiv': 'LEAD_REGISTERED',
}

export function mapR3Stage(raw: string | null | undefined, fallback: PipelineStage = 'LEAD_REGISTERED'): PipelineStage {
  if (!raw) return fallback
  return R3_STAGE_MAP[raw.trim().toLowerCase()] ?? fallback
}

export function mapOfficeStage(raw: string | null | undefined, fallback: PipelineStage = 'LEAD_REGISTERED'): PipelineStage {
  if (!raw) return fallback
  return OFFICE_STAGE_MAP[raw.trim().toLowerCase()] ?? fallback
}
