import {NextResponse,type NextRequest} from 'next/server'
import {createServerClient} from '@supabase/ssr'
import type {Database} from '@/types/database'

type UpdateSessionOptions = {
  redirectUnauthenticated?: boolean
}

export async function updateSession(
  request:NextRequest,
  options:UpdateSessionOptions={}
){
  let response=NextResponse.next({request})
  const supabase=createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{cookies:{getAll:()=>request.cookies.getAll(),setAll(cs){cs.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});cs.forEach(({name,value,options})=>response.cookies.set(name,value,options))}}})
  const {data:{user}}=await supabase.auth.getUser()
  const isLogin=request.nextUrl.pathname==='/login'
  const redirectUnauthenticated=options.redirectUnauthenticated??true
  if(!user&&!isLogin&&redirectUnauthenticated)return NextResponse.redirect(new URL('/login',request.url))
  if(user&&isLogin)return NextResponse.redirect(new URL('/dashboard',request.url))
  return response
}
