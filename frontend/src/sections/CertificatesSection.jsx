// src/sections/CertificatesSection.jsx
import React, { useState } from "react";
import Section from "../components/Section";
import Card from "../components/Card";
import StackBadge from "../components/StackBadge";
import ExternalLink from "../components/ExternalLink";
import { safeGet, resolveAsset, formatDate } from "../lib/utils";

function ChevronDown({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronUp({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ImageLightbox({ src, alt, onClose, name, issuer, credUrl, credId }) {
  if (!src) return null;
  const linkLabel = issuer ? `Certificate Link at ${issuer} Website` : "Certificate Link";
  return (
    <div className="fixed inset-0 z-[60] bg-black/80 p-4 flex items-center justify-center" onClick={onClose} role="dialog" aria-modal="true">
      <div className="relative w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-3 -right-3 rounded-full bg-white/15 hover:bg-white/25 text-white p-2" aria-label="Close preview">
          ×
        </button>
        <img src={src} alt={alt || name || "certificate"} className="w-full h-auto object-contain rounded-xl border border-white/10 shadow-2xl" />
        {/* Always show small info under the preview */}
        <div className="mt-3 text-xs text-white/80 space-y-1">
          {name && <div className="font-medium text-white/90">{name}</div>}
          {issuer && <div>Issuer: {issuer}</div>}
          {credUrl && (
            <div>
              <ExternalLink href={credUrl}>{linkLabel}</ExternalLink>
            </div>
          )}
          {credId && <div>Credential ID: {credId}</div>}
        </div>
      </div>
    </div>
  );
}

function CertificateItem({ ce, stackIndex }) {
  const name = safeGet(ce, "name.en", "Certificate");
  const issuer = ce.issuer;
  // New: single issued date. Try ce.issued_at, then ce.date, then fallback to old fields
  const issued = formatDate(ce.issued_at || ce.date || ce.end || ce.start || "");
  const credUrl = ce.credential_url;
  const credId = ce.credential_id;
  const details = safeGet(ce, "details.en", "");
  const stack = Array.isArray(ce.stack) ? ce.stack : [];
  const icon = resolveAsset(ce.icon);

  const [expanded, setExpanded] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const linkLabel = issuer ? `Certificate Link at ${issuer} Website` : "Certificate Link";
  const showToggle = Boolean(credUrl || credId);

  return (
    <>
      <Card>
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg leading-tight">{name}</h3>
            {issued && <div className="text-xs text-white/60 whitespace-nowrap">Issued on: {issued}</div>}
          </div>

          <div className="text-sm text-white/80">{issuer && <span className="font-medium">{issuer}</span>}</div>

          {icon ? (
            <div className="mt-2">
              <img
                src={icon}
                alt="issuer"
                className="h-14 w-14 object-contain rounded-md border border-white/10 bg-white/5 p-1 cursor-zoom-in hover:bg-white/10 transition-colors"
                onClick={() => setPreviewOpen(true)}
                height={56}
                width={56}
              />
              <div className="text-[10px] text-white/50 mt-1">Click to preview</div>
            </div>
          ) : null}

          {details && <p className="text-sm text-white/80 whitespace-pre-line mt-1">{details}</p>}

          {stack.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {stack.map((t, i) => (
                <StackBadge key={i} name={t} index={stackIndex} />
              ))}
            </div>
          )}

          {showToggle && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-white/90"
                aria-expanded={expanded}
                aria-controls={`cert-extra-${name.replace(/\s+/g, "-").toLowerCase()}`}
              >
                {expanded ? <ChevronUp /> : <ChevronDown />}
                {expanded ? "Hide details" : "Show details"}
              </button>

              {expanded && (
                <div
                  id={`cert-extra-${name.replace(/\s+/g, "-").toLowerCase()}`}
                  className="mt-2 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/80 space-y-1"
                >
                  {credUrl && (
                    <div>
                      <ExternalLink href={credUrl}>{linkLabel}</ExternalLink>
                    </div>
                  )}
                  {credId && <div>Credential ID: {credId}</div>}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {previewOpen && (
        <ImageLightbox
          src={icon}
          alt={`${issuer || ""} certificate`}
          onClose={() => setPreviewOpen(false)}
          name={name}
          issuer={issuer}
          credUrl={credUrl}
          credId={credId}
        />
      )}
    </>
  );
}

export default function CertificatesSection({ items, stackIndex }) {
  return (
    <Section id="certificates" title="Certificates" subtitle="Courses & credentials">
      {(!items || items.length === 0) && <p className="text-white/60">No certificates yet.</p>}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {items?.map((ce, idx) => (
          <CertificateItem key={idx} ce={ce} stackIndex={stackIndex} />
        ))}
      </div>
    </Section>
  );
}
