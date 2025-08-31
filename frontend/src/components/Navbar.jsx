// src/components/Navbar.jsx
export default function Navbar({ fullName }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-gradient-to-b from-black/40 to-transparent backdrop-blur supports-[backdrop-filter]:bg-black/30">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a href="#home" className="font-semibold tracking-tight hover:opacity-90">
          {fullName || "My Portfolio"}
        </a>
        <div className="hidden sm:flex items-center gap-1">
          {[
            ["Stack", "#stack"],
            ["Experience", "#experience"],
            ["Competitions", "#competitions"],
            ["Projects", "#projects"],
            ["Certificates", "#certificates"],
            ["Contact", "#contact"],
          ].map(([label, href]) => (
            <a key={href} href={href} className="text-sm px-3 py-1 rounded-lg hover:bg-white/10">
              {label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
