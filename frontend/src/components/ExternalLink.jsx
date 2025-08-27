// src/components/ExternalLink.jsx
export default function ExternalLink({ href, children }) {
return (
<a className="underline decoration-dotted underline-offset-4 hover:opacity-90" href={href} target="_blank" rel="noreferrer">
{children}
</a>
);
}