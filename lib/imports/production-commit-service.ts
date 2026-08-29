import { createClient } from '@/lib/supabase/server'

export type ProductionCommitResult = {
  batch_id: string
  committed_at: string
  affected_records: number
  inserted_quotations: number
  inserted_invoices: number
  inserted_cost_of_sales: number
}

export type RollbackResult = {
  batch_id: string
  rolled_back_at: string
  rolled_back_records: number
}

type RpcResponse<T> = { data: T[] | null; error: { message: string } | null }

type RpcClient = {
  rpc(name: string, args: Record<string, string>): PromiseLike<RpcResponse<ProductionCommitResult | RollbackResult>>
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

export async function rollbackProductionBatch(batchId: string, accessToken?: string): Promise<RollbackResult> {
  const client = asRpcClient(await createClient(accessToken))
  const response = await client.rpc('rollback_import_batch', { p_batch_id: batchId })
  if (response.error) throw new Error(response.error.message)
  const result = response.data?.[0]
  if (!result || !('rolled_back_records' in result)) throw new Error('ROLLBACK_RESULT_NOT_RETURNED')
  return result as RollbackResult
}
