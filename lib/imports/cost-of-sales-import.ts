import { costOfSalesParser, type ParsedCostOfSalesRow } from '@/lib/imports/cost-of-sales-parser'
import { createImportBatch, stageImportRows, updateBatchStatistics, updateImportBatchStatus } from '@/lib/imports/service'
import type { Json } from '@/types/database'

const CHUNK_SIZE = 500
export type CostOfSalesImportResult = { batchId:string; totalRows:number; stagedRows:number; validRows:number; warningRows:number; errorRows:number }

const toStageInput = (row:ParsedCostOfSalesRow) => ({
  source_type:'cost_of_sales_2026', source_row_number:row.source_row_number, row_hash:row.row_hash,
  raw_data:row.raw_data as unknown as Json, normalized_data:row.normalized_data as unknown as Json,
  validation_status:row.validation_status, matching_status:'PENDING' as const, target_table:null, target_record_id:null,
  metadata:{parser:'CostOfSalesParser', error_message:row.error_message, warning_message:row.warning_message} as unknown as Json,
})

export async function importCostOfSalesWorkbook(file:File, accessToken?:string):Promise<CostOfSalesImportResult>{
  const buffer=Buffer.from(await file.arrayBuffer())
  const batch=await createImportBatch({source_type:'cost_of_sales_2026',file_name:file.name,file_size_bytes:file.size,content_type:file.type||'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',metadata:{parser:'CostOfSalesParser',workflow:'Excel -> Parser -> Normalize -> import_staging'}},accessToken)
  try{
    await updateImportBatchStatus(batch.id,'PARSING',undefined,accessToken)
    const parsedRows=costOfSalesParser.parse(buffer)
    for(let offset=0;offset<parsedRows.length;offset+=CHUNK_SIZE) await stageImportRows(batch.id,parsedRows.slice(offset,offset+CHUNK_SIZE).map(toStageInput),accessToken)
    const updatedBatch=await updateBatchStatistics(batch.id,accessToken)
    await updateImportBatchStatus(batch.id,'STAGED',undefined,accessToken)
    return {batchId:updatedBatch.id,totalRows:updatedBatch.total_rows,stagedRows:updatedBatch.staged_rows,validRows:updatedBatch.valid_rows,warningRows:updatedBatch.warning_rows,errorRows:updatedBatch.error_rows}
  }catch(error){
    const message=error instanceof Error?error.message:'COST_OF_SALES_IMPORT_FAILED'
    await updateImportBatchStatus(batch.id,'PARSING_FAILED',message,accessToken).catch(()=>undefined)
    throw new Error(message)
  }
}
