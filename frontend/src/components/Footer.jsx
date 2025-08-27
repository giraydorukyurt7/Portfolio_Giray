// src/components/Footer.jsx
export default function Footer() {
return (
<footer className="py-10 border-t border-white/10">
<div className="mx-auto max-w-6xl px-4 text-sm text-white/60">
<p>© {new Date().getFullYear()} — Built with React & Tailwind.</p>
</div>
</footer>
);
}