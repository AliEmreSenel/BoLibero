const normalizeSearch = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ");

/** Match partial names, in any order, including names with initials. */
export function filterProfessors(professors: string[], query: string): string[] {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return professors;

  return professors.filter((name) => {
    const searchable = normalizeSearch(name).replace(/\s+/g, "");
    return terms.every((term) => searchable.includes(term));
  });
}

export function professorInitials(name: string): string {
  return name
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function querySuffix(query: string): string {
  return query ? `?${new URLSearchParams({ q: query })}` : "";
}

export function professorsHref(query: string): string {
  return `/professors${querySuffix(query)}`;
}

export function professorHref(name: string, query: string): string {
  return `/professor/${encodeURIComponent(name)}${querySuffix(query)}`;
}
