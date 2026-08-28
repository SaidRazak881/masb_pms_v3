import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const buttonVariants=cva("inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",{variants:{variant:{default:"bg-slate-900 text-white hover:bg-slate-800",outline:"border bg-white hover:bg-slate-50",ghost:"hover:bg-slate-100"},size:{default:"h-10 px-4",sm:"h-9 px-3",lg:"h-11 px-6"}},defaultVariants:{variant:"default",size:"default"}});
export function Button({className,variant,size,...props}:React.ButtonHTMLAttributes<HTMLButtonElement>&VariantProps<typeof buttonVariants>){return <button className={cn(buttonVariants({variant,size}),className)} {...props}/>}
