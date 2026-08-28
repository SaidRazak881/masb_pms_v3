'use client'
import {useEffect} from 'react'
import {Button} from '@/components/ui/button'
export default function DashboardError({error,reset}:{error:Error & {digest?:string};reset:()=>void}){useEffect(()=>{console.error(error)},[error]);return <main className='flex min-h-[60vh] items-center justify-center p-6'><section className='w-full max-w-md rounded-xl border bg-white p-8 text-center shadow-sm'><h1 className='text-xl font-semibold'>Dashboard error</h1><p className='mt-2 text-sm text-slate-600'>Unable to load this page.</p><Button className='mt-6' onClick={reset}>Retry</Button></section></main>}
