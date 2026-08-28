export function cn(...classes: Array<string|false|null|undefined>) { return classes.filter(Boolean).join(" "); }
export function formatMYR(value:number|null|undefined) { return new Intl.NumberFormat("en-MY", {style:"currency",currency:"MYR",maximumFractionDigits:2}).format(value ?? 0); }
