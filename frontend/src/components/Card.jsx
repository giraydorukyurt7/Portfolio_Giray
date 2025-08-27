// src/components/Card.jsx
import { cn } from "../lib/utils";


export default function Card({ children, className }) {
return (
<div
className={cn(
"rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur shadow-sm",
"hover:shadow-lg transition-shadow",
className
)}
>
{children}
</div>
);
}