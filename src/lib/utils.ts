export function cn(...c: (string|boolean|undefined|null)[]): string { return c.filter(Boolean).join(" ") }
export function fmtDate(d: Date): string { return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric"}).format(d) }
export function timeAgo(d: Date): string { const m=Math.floor((Date.now()-d.getTime())/60000); if(m<1)return "just now"; if(m<60)return `${m}m ago`; const h=Math.floor(m/60); if(h<24)return `${h}h ago`; return `${Math.floor(h/24)}d ago` }
export function matchLabel(s: number) { if(s>=90)return {text:"Certain Match",color:"#22c55e"}; if(s>=83)return {text:"Confident Match",color:"#4ade80"}; if(s>=70)return {text:"Uncertain Match",color:"#facc15"}; if(s>=50)return {text:"Weak Match",color:"#fb923c"}; return {text:"No Match",color:"#ef4444"} }
export function matchColor(s: number) { if(s>=90)return "bg-green-500"; if(s>=83)return "bg-emerald-400"; if(s>=70)return "bg-yellow-500"; if(s>=50)return "bg-orange-500"; return "bg-red-500" }
