import { cn } from "@/lib/utils";
export function Card({className,...props}:React.HTMLAttributes<HTMLDivElement>){return <div className={cn("rounded-xl border bg-white shadow-sm",className)} {...props}/>}
export function CardHeader({className,...props}:React.HTMLAttributes<HTMLDivElement>){return <div className={cn("p-5",className)} {...props}/>}
export function CardTitle({className,...props}:React.HTMLAttributes<HTMLHeadingElement>){return <h3 className={cn("font-bold",className)} {...props}/>}
export function CardContent({className,...props}:React.HTMLAttributes<HTMLDivElement>){return <div className={cn("p-5 pt-0",className)} {...props}/>}
