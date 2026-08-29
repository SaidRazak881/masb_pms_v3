import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database'

export type MatchingStatus = 'MATCHED' | 'AMBIGUOUS' | 'UNMATCHED' | 'DUPLICATE'
export type MatchingRule = 'EXACT_QUOTATION_NUMBER' | 'EXACT_INVOICE_NUMBER' | 'COMPANY_ALIAS' | 'PROGRAM_CODE' | 'NONE'
export type MatchingResult = { stagingId:string; status:MatchingStatus; confidence:number; rule:MatchingRule; matchedStagingId:string|null; reason:string }

type Stage = { id:string; source_type:string; normalized_data:Json; row_hash:string }
const objectData=(value:Json):Record<string,Json> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string,Json> : {}
const text=(value:Json):string|null => typeof value === 'string' || typeof value === 'number' ? String(value).trim().toLowerCase() || null : null
const field=(row:Stage,names:string[])=>{const d=objectData(row.normalized_data); for(const n of names){const v=text(d[n]); if(v)return v} return null}

const score={EXACT_QUOTATION_NUMBER:1,EXACT_INVOICE_NUMBER:.95,COMPANY_ALIAS:.8,PROGRAM_CODE:.7} as const

export async function matchImportStaging(batchId:string, accessToken?:string):Promise<MatchingResult[]> {
  const supabase=await createClient(accessToken)
  const {data,error}=await supabase.from('import_staging').select('id,source_type,normalized_data,row_hash').eq('batch_id',batchId)
  if(error) throw error
  const rows=(data??[]) as Stage[]
  const seen=new Map<string,string>()
  const results:MatchingResult[]=[]
  for(const row of rows){
    const duplicate=seen.get(row.row_hash)
    if(duplicate){results.push({stagingId:row.id,status:'DUPLICATE',confidence:1,rule:'NONE',matchedStagingId:duplicate,reason:'Duplicate row_hash in batch'});continue}
    seen.set(row.row_hash,row.id)
    let best:MatchingResult|null=null
    for(const candidate of rows){
      if(candidate.id===row.id || candidate.source_type===row.source_type) continue
      const q1=field(row,['quotation_number']); const q2=field(candidate,['quotation_number'])
      const i1=field(row,['invoice_number']); const i2=field(candidate,['invoice_number'])
      const c1=field(row,['company_name','company']); const c2=field(candidate,['company_name','company'])
      const p1=field(row,['program_code','program_id']); const p2=field(candidate,['program_code','program_id'])
      let rule:MatchingRule='NONE'
      if(q1&&q2&&q1===q2) rule='EXACT_QUOTATION_NUMBER'
      else if(i1&&i2&&i1===i2) rule='EXACT_INVOICE_NUMBER'
      else if(c1&&c2&&c1===c2) rule='COMPANY_ALIAS'
      else if(p1&&p2&&p1===p2) rule='PROGRAM_CODE'
      if(rule && rule!=='NONE' && (!best || score[rule]>best.confidence)) best={stagingId:row.id,status:'MATCHED',confidence:score[rule],rule,matchedStagingId:candidate.id,reason:`Matched by ${rule}`}
    }
    results.push(best??{stagingId:row.id,status:'UNMATCHED',confidence:0,rule:'NONE',matchedStagingId:null,reason:'No V1 matching rule matched'})
  }
  return results
}

export async function persistMatchingResults(batchId:string, results:MatchingResult[], accessToken?:string){
  const supabase=await createClient(accessToken)
  for(const result of results){
    const {error}=await supabase.from('import_staging').update({matching_status:result.status,matching_confidence:result.confidence,matching_metadata:{rule:result.rule,matched_staging_id:result.matchedStagingId,reason:result.reason} as unknown as Json}).eq('id',result.stagingId).eq('batch_id',batchId)
    if(error) throw error
  }
  return results
}
