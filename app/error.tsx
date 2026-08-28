'use client'
import {useEffect} from 'react'
import {Button} from '@/components/ui/button'
export default function ErrorPage({error,reset}:{error:Error & {digest?:string};reset:()=>void}){useEffect(()=>{console.error(error)},[error]);return <main className='flex min-h-screen items-center justify-center p-6'><section className='w-full max-w-md rounded-xl border bg-white p-8 text-center shadow-sm'><h1 className='text-xl font-semibold'>Something went wrong</h1><p className='mt-2 text-sm text-slate-600'>Please retry the request.</p><Button className='mt-6' onClick={reset}>Try again</Button></section></main>}
