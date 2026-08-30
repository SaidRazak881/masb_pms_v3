import { createClient } from '@/lib/supabase/server'

export type ProductionCommitResult = {
  batch_id: string
  committed_at: string
  affected_records: number
  inserted_quotations: number
  inserted_invoices: number
  inserted_cost_of_sales: number
}

export type R2CommitResult = {
  batch_id: string
  committed_at: string
  affected_records: number
  inserted_companies: number
  inserted_programs: number
  inserted_sessions: number
  inserted_categories: number
}

export type R2RosterCommitResult = {
  batch_id: string
  committed_at: string
  affected_records: number
  inserted_roster: number
  matched_sessions: number
  created_sessions: number
  created_programs: number
  created_exceptions: number
}

export type RollbackResult = {
  batch_id: string
  rolled_back_at: string
  rolled_back_records: number
}

type RpcResponse<T> = { data: T[] | null; error: { message: string } | null }

type RpcClient = {
  rpc(name: string, args: Record<string, string>): PromiseLike<RpcResponse<ProductionCommitResult | RollbackResult | R2CommitResult | R2RosterCommitResult>>
}

const asRpcClient = (client: unknown): RpcClient => client as RpcClient

export async function commitProductionBatch(batchId: string, accessToken?: string): Promise<ProductionCommitResult> {
  const client = asRpcClient(await createClient(accessToken))
  const response = await client.rpc('commit_import_batch', { p_batch_id: batchId })
  if (response.error) throw new Error(response.error.message)
  const result = response.data?.[0]
  if (!result || !('affected_records' in result)) throw new Error('COMMIT_RESULT_NOT_RETURNED')
  return result as ProductionCommitResult
}

export async function commitR2Batch(batchId: string, accessToken?: string): Promise<R2CommitResult> {
  const client = asRpcClient(await createClient(accessToken))
  const response = await client.rpc('commit_r2_batch', { p_batch_id: batchId })
  if (response.error) throw new Error(response.error.message)
  const result = response.data?.[0]
  if (!result || !('affected_records' in result)) throw new Error('R2_COMMIT_RESULT_NOT_RETURNED')
  return result as R2CommitResult
}

export async function commitR2Roster(batchId: string, accessToken?: string): Promise<R2RosterCommitResult> {
  const client = asRpcClient(await createClient(accessToken))
  const response = await client.rpc('commit_r2_roster', { p_batch_id: batchId })
  if (response.error) throw new Error(response.error.message)
  const result = response.data?.[0]
  if (!result || !('affected_records' in result) || !('inserted_roster' in result)) throw new Error('R2_ROSTER_COMMIT_RESULT_NOT_RETURNED')
  return result as R2RosterCommitResult
}

export async function rollbackProductionBatch(batchId: string, accessToken?: string): Promise<RollbackResult> {
  const client = asRpcClient(await createClient(accessToken))
  const response = await client.rpc('rollback_import_batch', { p_batch_id: batchId })
  if (response.error) throw new Error(response.error.message)
  const result = response.data?.[0]
  if (!result || !('rolled_back_records' in result)) throw new Error('ROLLBACK_RESULT_NOT_RETURNED')
  return result as RollbackResult
}
