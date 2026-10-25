import { apiClient } from './client';

// GET /search?q= (BE guide: fe-integration-guide-search.md). Results arrive
// already role-filtered and grouped in display order; every result has an href.

export const SEARCH_MIN_CHARS = 2;
export const SEARCH_MAX_CHARS = 200;

export interface SearchResult {
  type: string;
  group: string;
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
}

export interface SearchGroup {
  group: string;
  results: SearchResult[];
}

/** Groups results by `group`, keeping the order in which groups first arrive. */
export function groupResults(results: SearchResult[]): SearchGroup[] {
  const groups: SearchGroup[] = [];
  for (const r of results) {
    const g = groups.find((x) => x.group === r.group);
    if (g) g.results.push(r);
    else groups.push({ group: r.group, results: [r] });
  }
  return groups;
}

export async function searchAll(q: string, signal?: AbortSignal): Promise<SearchResult[]> {
  const res = await apiClient<{ data?: { results?: SearchResult[] } }>(
    `/search?q=${encodeURIComponent(q.slice(0, SEARCH_MAX_CHARS))}`,
    { signal },
  );
  return res?.data?.results ?? [];
}
