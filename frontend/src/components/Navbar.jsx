// src/components/Navbar.jsx
export default function Navbar({ fullName }) {
return (
<header className="sticky top-0 z-50 w-full backdrop-blur supports-[backdrop-filter]:bg-white/5 border-b border-white/10">
<nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
<a href="#home" className="font-semibold tracking-tight">
{fullName || "My Portfolio"}
</a>
<div className="flex items-center gap-2">
<a href="#projects" className="text-sm hover:opacity-80 px-3 py-1">Projects</a>
<a href="#experience" className="text-sm hover:opacity-80 px-3 py-1">Experience</a>
<a href="#competitions" className="text-sm hover:opacity-80 px-3 py-1">Competitions</a>
<a href="#certificates" className="text-sm hover:opacity-80 px-3 py-1">Certificates</a>
<a href="#contact" className="text-sm hover:opacity-80 px-3 py-1">Contact</a>
</div>
</nav>
</header>
);
}