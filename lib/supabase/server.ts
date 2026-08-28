import {createServerClient} from '@supabase/ssr'
import {cookies} from 'next/headers'
import type {Database} from '@/types/database'
export async function createClient(){const store=await cookies();return createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{cookies:{getAll(){return store.getAll()},setAll(cs){try{cs.forEach(({name,value,options})=>store.set(name,value,options))}catch{}}}})}
