// src/sections/CertificatesSection.jsx
import Section from "../components/Section";
import Card from "../components/Card";
import StackBadge from "../components/StackBadge";
import ExternalLink from "../components/ExternalLink";
import { safeGet, formatYM, resolveAsset } from "../lib/utils";

export default function CertificatesSection({ items, stackIndex }) {
  return (
    <Section id="certificates" title="Certificates" subtitle="Courses & credentials">
      {(!items || items.length === 0) && <p className="text-white/60">No certificates yet.</p>}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {items?.map((ce, idx) => {
          const name = safeGet(ce, "name.en", "Certificate");
          const issuer = ce.issuer;
          const start = formatYM(ce.start);
          const end = ce.present ? "Present" : formatYM(ce.end);
          const range = [start, end].filter(Boolean).join(" — ");
          const credUrl = ce.credential_url;
          const credId = ce.credential_id;
          const details = safeGet(ce, "details.en", "");
          const stack = Array.isArray(ce.stack) ? ce.stack : [];
          const icon = resolveAsset(ce.icon);

          return (
            <Card key={idx}>
              <div className="flex items-start gap-3">
                {icon ? <img src={icon} alt="issuer" className="h-8 w-8 rounded object-contain" /> : null}
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-lg leading-tight">{name}</h3>
                    {range && <div className="text-xs text-white/60">{range}</div>}
                  </div>
                  <div className="text-sm text-white/80">{issuer && <span className="font-medium">{issuer}</span>}</div>
                  {details && <p className="text-sm text-white/80 whitespace-pre-line mt-1">{details}</p>}
                  {(credUrl || credId) && (
                    <div className="text-xs text-white/70 mt-2">
                      {credId && <div>Credential ID: {credId}</div>}
                      {credUrl && (
                        <div>
                          Verify: <ExternalLink href={credUrl}>{credUrl}</ExternalLink>
                        </div>
                      )}
                    </div>
                  )}
                  {stack.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {stack.map((t, i) => (
                        <StackBadge key={i} name={t} index={stackIndex} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
