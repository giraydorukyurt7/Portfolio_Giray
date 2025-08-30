// src/components/Section.jsx
export default function Section({ id, title, children, subtitle }) {
  return (
    <section id={id} className="scroll-mt-24 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h2>
          {subtitle ? <p className="text-sm text-white/60 mt-2">{subtitle}</p> : null}
          <div className="mt-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        {children}
      </div>
    </section>
  );
}
