import {createClient} from '@/lib/supabase/server'
import {notFound} from 'next/navigation'
import {Card,CardContent} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import type {Row} from '@/types/database'

type Program=Row<'programs'>
type Company=Row<'companies'>
type Counts={quotations:number;purchaseOrders:number;invoices:number;trainingSessions:number}

export default async function Program360({params}:{params:Promise<{code:string}>}){
  const {code}=await params
  const supabase=await createClient()
  const {data:program,error}=await supabase.from('programs').select('*').eq('program_code',code).single()
  if(error||!program) notFound()
  const [companyResult,quotationsResult,purchaseOrdersResult,invoicesResult,trainingResult]=await Promise.all([
    supabase.from('companies').select('*').eq('id',program.company_id).single(),
    supabase.from('quotations').select('id',{count:'exact',head:true}).eq('program_id',program.id),
    supabase.from('purchase_orders').select('id',{count:'exact',head:true}).eq('program_id',program.id),
    supabase.from('invoices').select('id',{count:'exact',head:true}).eq('program_id',program.id),
    supabase.from('training_sessions').select('id',{count:'exact',head:true}).eq('program_id',program.id)
  ])
  const company=companyResult.data as Company|null
  const counts:Counts={quotations:quotationsResult.count??0,purchaseOrders:purchaseOrdersResult.count??0,invoices:invoicesResult.count??0,trainingSessions:trainingResult.count??0}
  const p=program as Program
  const metrics:[string,string][]=[['Stage',p.current_stage],['Forecast',`RM ${Number(p.forecast_value??0).toLocaleString('en-MY')}`],['Weighted',`RM ${Number(p.weighted_value??0).toLocaleString('en-MY')}`],['Category',p.category??'—']]
  const relations:[string,number][]=[['Quotations',counts.quotations],['Purchase Orders',counts.purchaseOrders],['Invoices',counts.invoices],['Training Sessions',counts.trainingSessions]]
  return <main className='p-6'><a href='/dashboard/programs' className='text-sm text-blue-600'>← Program list</a><Card className='mt-3'><CardContent><div className='pt-6 text-xs font-semibold text-blue-600'>{p.program_code}</div><h1 className='mt-1 text-2xl font-bold'>{p.title}</h1><p className='mt-1 text-slate-500'>{company?.canonical_name??'—'}</p><div className='mt-6 grid gap-4 sm:grid-cols-4'>{metrics.map(([label,value])=><div key={label} className='rounded-lg bg-slate-50 p-4'><div className='text-xs text-slate-500'>{label}</div><div className='mt-1 font-semibold'>{label==='Stage'?<Badge>{value}</Badge>:value}</div></div>)}</div></CardContent></Card><div className='mt-6 grid gap-4 md:grid-cols-4'>{relations.map(([label,value])=><Card key={label}><CardContent><div className='pt-6 text-sm text-slate-500'>{label}</div><div className='mt-2 text-2xl font-bold'>{value}</div></CardContent></Card>)}</div></main>
}
