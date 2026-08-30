import * as React from 'react'
import { cn } from '@/lib/utils'

type TabsContextValue = { value: string; setValue: (value: string) => void }
const TabsContext = React.createContext<TabsContextValue | null>(null)
export function useTabsValue() { const ctx = React.useContext(TabsContext); if (!ctx) throw new Error('useTabsValue must be used inside Tabs'); return ctx.value }
export function Tabs({ defaultValue, value: controlledValue, onValueChange, className, children }: { defaultValue: string; value?: string; onValueChange?: (value: string) => void; className?: string; children: React.ReactNode }) { const [internal, setInternal] = React.useState(defaultValue); const value = controlledValue ?? internal; const setValue = (next: string) => { setInternal(next); onValueChange?.(next) }; return <TabsContext.Provider value={{ value, setValue }}><div className={className}>{children}</div></TabsContext.Provider> }
export function TabsList({ className, children }: React.HTMLAttributes<HTMLDivElement>) { return <div role="tablist" className={cn('inline-flex h-10 items-center rounded-lg bg-slate-100 p-1', className)}>{children}</div> }
export function TabsTrigger({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) { const ctx = React.useContext(TabsContext); if (!ctx) throw new Error('TabsTrigger must be used inside Tabs'); const active = ctx.value === value; return <button type="button" role="tab" aria-selected={active} onClick={() => ctx.setValue(value)} className={cn('rounded-md px-3 py-1.5 text-sm font-medium transition', active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900', className)}>{children}</button> }
export function TabsContent({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) { const ctx = React.useContext(TabsContext); if (!ctx || ctx.value !== value) return null; return <div role="tabpanel" className={className}>{children}</div> }
