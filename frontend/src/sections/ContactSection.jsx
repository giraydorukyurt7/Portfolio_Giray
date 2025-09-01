import Section from "../components/Section";
import Card from "../components/Card";
import { resolveAsset } from "../lib/utils";

function toTitle(s) {
  return String(s || "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function guessPlatformFromUrl(url = "") {
  const u = String(url).toLowerCase();
  if (u.includes("github.com")) return "GitHub";
  if (u.includes("linkedin.com")) return "LinkedIn";
  if (u.includes("x.com") || u.includes("twitter.com")) return "Twitter";
  if (u.includes("instagram.com")) return "Instagram";
  if (u.includes("kaggle.com")) return "Kaggle";
  if (u.includes("medium.com")) return "Medium";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "YouTube";
  if (u.includes("gitlab.com")) return "GitLab";
  if (u.includes("behance.net")) return "Behance";
  if (u.includes("dribbble.com")) return "Dribbble";
  if (u.includes("read.cv")) return "Read.cv";
  if (u.includes("cv") && !u.includes("github")) return "CV";
  if (u.includes("portfolio") || u.includes("website")) return "Website";
  return "";
}

function normalizeSocials({ socialsProp, info }) {
  if (Array.isArray(socialsProp) && socialsProp.length) {
    // socials.json örneğiyle uyumlu: { platform, username, url, icon, order_index }
    return socialsProp
      .map((s) => {
        const url = s?.url || "";
        const label = s?.label || s?.platform || s?.name || guessPlatformFromUrl(url) || "Link";
        const icon = resolveAsset(s?.icon || "");
        return url ? { url, label, icon } : null;
      })
      .filter(Boolean)
      .sort((a, b) => (a.order_index ?? 1e9) - (b.order_index ?? 1e9));
  }

  // info.socials / info.social_links / info.accounts
  const arrays = [info?.socials, info?.social_links, info?.accounts].filter(Array.isArray);
  for (const arr of arrays) {
    if (arr && arr.length) {
      return arr
        .map((s) => {
          if (!s) return null;
          if (typeof s === "string") {
            return { url: s, label: guessPlatformFromUrl(s) || "Link", icon: "" };
          }
          const url = s.url || s.href || "";
          const label = s.label || s.platform || s.name || guessPlatformFromUrl(url) || "Link";
          const icon = resolveAsset(s.icon || s.logo || "");
          return url ? { url, label, icon } : null;
        })
        .filter(Boolean);
    }
  }

  // info.links (object)
  if (info?.links && typeof info.links === "object") {
    return Object.entries(info.links)
      .map(([key, val]) => {
        const url = typeof val === "string" ? val : val?.url || "";
        if (!url) return null;
        return { url, label: toTitle(key), icon: resolveAsset(val?.icon || "") };
      })
      .filter(Boolean);
  }

  return [];
}

function extractEmail(info) {
  const raw =
    info?.email ||
    info?.contact?.email ||
    info?.links?.email ||
    info?.mail ||
    "";
  const s = String(raw || "");
  const m = s.match(/^mailto:(.+)$/i);
  return m ? m[1] : s;
}

export default function ContactSection({ info, socials }) {
  const email = extractEmail(info);
  const allSocials = normalizeSocials({ socialsProp: socials, info });
  const hasSocials = allSocials.length > 0;

  return (
    <Section id="contact" title="Contact">
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-white/80 text-sm">Prefer email? I usually respond within a day.</p>
            {email ? (
              <a
                href={`mailto:${email}`}
                className="mt-2 inline-flex items-center rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
              >
                {email}
              </a>
            ) : (
              <p className="text-white/60 text-sm mt-2">No email provided yet.</p>
            )}
          </div>

          <div className="md:text-right">
            <p className="text-white/80 text-sm">Socials</p>
            {hasSocials ? (
              <div className="mt-2 flex flex-wrap gap-2 md:justify-end">
                {allSocials.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-white/10 px-3 py-1 text-sm hover:bg-white/10 inline-flex items-center gap-2"
                  >
                    {s.icon ? (
                      <img
                        src={s.icon}
                        alt="icon"
                        className="h-4 w-4 object-contain"
                        height="16"
                        width="16"
                      />
                    ) : null}
                    {s.label || s.url}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-white/60 text-sm mt-2">No social links yet.</p>
            )}
          </div>
        </div>
      </Card>
    </Section>
  );
}
