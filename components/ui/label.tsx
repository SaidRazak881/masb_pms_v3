import * as React from 'react'
import {cn} from '@/lib/utils'
export function Label(props:React.LabelHTMLAttributes<HTMLLabelElement>){return <label {...props} className={cn('text-sm font-medium leading-none',props.className)}/>} 
