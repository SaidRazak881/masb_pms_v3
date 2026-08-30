import { createClient } from '@/lib/supabase/server'

export type R3CommitResult = {
  batch_id: string
  committed_at: string
  affected_records: number
  inserted_companies: number
  inserted_programs: number
  inserted_stages: number
  mismatches: number
}

type RpcClient = {
  rpc(name: string, args: Record<string, string>): PromiseLike<{ data: R3CommitResult[] | null; error: { message: string } | null }>
}

const asRpcClient = (client: unknown): RpcClient => client as RpcClient

export async function commitR3Batch(batchId: string, accessToken?: string): Promise<R3CommitResult> {
  const client = asRpcClient(await createClient(accessToken))
  const response = await client.rpc('commit_r3_batch', { p_batch_id: batchId })
  if (response.error) throw new Error(response.error.message)
  const result = response.data?.[0]
  if (!result || !('affected_records' in result)) throw new Error('R3_COMMIT_RESULT_NOT_RETURNED')
  return result as R3CommitResult
}
