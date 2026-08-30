import { createClient } from '@/lib/supabase/server'
import type { ImportMatchingStatus, Json } from '@/types/database'

// The import_staging.matching_status column (migrations 0003/0006) uses the
// canonical Supabase enum. The persistence layer maps a resolved match onto
// that enum and stores the confidence + match detail inside `metadata`
// (the 0006 columns matching_confidence/matching_rule are used by the
// matching-resolution-service, not this engine).
export type MatchingStatus = ImportMatchingStatus
export type MatchingRule = 'EXACT_QUOTATION_NUMBER' | 'EXACT_INVOICE_NUMBER' | 'COMPANY_ALIAS' | 'PROGRAM_CODE' | 'NONE'
export type MatchingResult = { stagingId:string; status:MatchingStatus; confidence:number; rule:MatchingRule; matchedStagingId:string|null; reason:string; duplicate:boolean }

type Stage = { id:string; source_type:string; normalized_data:Json; row_hash:string }
const objectData=(value:Json):Record<string,Json> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string,Json> : {}
const text=(value:Json):string|null => typeof value === 'string' || typeof value === 'number' ? String(value).trim().toLowerCase() || null : null
const field=(row:Stage,names:string[])=>{const d=objectData(row.normalized_data); for(const n of names){const v=text(d[n]); if(v)return v} return null}

const score={EXACT_QUOTATION_NUMBER:1,EXACT_INVOICE_NUMBER:.95,COMPANY_ALIAS:.8,PROGRAM_CODE:.7} as const

// Map the resolved matching rule back onto the SQL enum used by import_staging.matching_status.
function statusForRule(rule:MatchingRule):MatchingStatus {
  switch(rule){
    case 'EXACT_QUOTATION_NUMBER':
    case 'EXACT_INVOICE_NUMBER': return 'EXACT'
    case 'COMPANY_ALIAS': return 'ALIAS'
    case 'PROGRAM_CODE': return 'COMPOSITE'
    case 'NONE':
    default: return 'NONE'
  }
}

export async function matchImportStaging(batchId:string, accessToken?:string):Promise<MatchingResult[]> {
  const supabase=await createClient(accessToken)
  const {data,error}=await supabase.from('import_staging').select('id,source_type,normalized_data,row_hash').eq('batch_id',batchId)
  if(error) throw error
  const rows=(data??[]) as Stage[]
  const seen=new Map<string,string>()
  const results:MatchingResult[]=[]
  for(const row of rows){
    const duplicate=seen.get(row.row_hash)
    if(duplicate){results.push({stagingId:row.id,status:'AMBIGUOUS',confidence:1,rule:'NONE',matchedStagingId:duplicate,reason:'Duplicate row_hash in batch',duplicate:true});continue}
    seen.set(row.row_hash,row.id)
    let best:{rule:MatchingRule;confidence:number;matchedStagingId:string}|null=null
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
      if(rule && rule!=='NONE' && (!best || score[rule]>best.confidence)) best={rule,confidence:score[rule],matchedStagingId:candidate.id}
    }
    results.push(best?{stagingId:row.id,status:statusForRule(best.rule),confidence:best.confidence,rule:best.rule,matchedStagingId:best.matchedStagingId,reason:`Matched by ${best.rule}`,duplicate:false}:{stagingId:row.id,status:'NONE',confidence:0,rule:'NONE',matchedStagingId:null,reason:'No V1 matching rule matched',duplicate:false})
  }
  return results
}

export async function persistMatchingResults(batchId:string, results:MatchingResult[], accessToken?:string){
  const supabase=await createClient(accessToken)
  for(const result of results){
    // import_staging stores match detail in the existing `metadata` jsonb.
    const {data:current,error:fetchError}=await supabase.from('import_staging').select('metadata').eq('id',result.stagingId).eq('batch_id',batchId).maybeSingle()
    if(fetchError) throw fetchError
    const base=(current?.metadata && typeof current.metadata==='object' && !Array.isArray(current.metadata)) ? current.metadata as Record<string,Json> : {}
    const matchedMetadata:Record<string,Json>={...base,rule:result.rule,confidence:result.confidence,matched_staging_id:result.matchedStagingId,reason:result.reason,duplicate:result.duplicate}
    const {error}=await supabase.from('import_staging').update({matching_status:result.status,metadata:matchedMetadata as Json}).eq('id',result.stagingId).eq('batch_id',batchId)
    if(error) throw error
  }
  return results
}
