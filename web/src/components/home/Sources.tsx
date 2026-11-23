import { FACTS, type FactKey } from "@/lib/policy";

// Renders the deduplicated source list for a section from its fact keys.
export function Sources({ keys }: { keys: FactKey[] }) {
  const seen = new Map<string, string>();
  for (const k of keys) {
    const f = FACTS[k];
    if (!seen.has(f.url)) seen.set(f.url, f.source);
  }
  return (
    <p className="mt-8 text-xs leading-relaxed text-gray-500">
      Sources:{" "}
      {[...seen].map(([url, source], i) => (
        <span key={url}>
          {i > 0 && "; "}
          <a href={url} className="underline" rel="noopener noreferrer">
            {source}
          </a>
        </span>
      ))}
      .
    </p>
  );
}

export function Cite({ k, children }: { k: FactKey; children: React.ReactNode }) {
  return (
    <a
      href={FACTS[k].url}
      rel="noopener noreferrer"
      className="underline decoration-gray-400 underline-offset-2 hover:decoration-patriot-red"
    >
      {children}
    </a>
  );
}
