// Layered layout for the dependency graph: prerequisites sit left of what they
// block. Pure so it can be tested; the page only draws what this returns.

export interface GraphTask {
  id: string;
  title: string;
  status: string;
  dependsOn?: string[];
}

export interface GraphNode {
  id: string;
  title: string;
  status: string;
  layer: number;
  row: number;
}

export interface GraphEdge {
  /** The prerequisite (arrow starts here). */
  from: string;
  /** The task it blocks (arrow ends here). */
  to: string;
}

export interface GraphLayout {
  nodes: GraphNode[];
  edges: GraphEdge[];
  layers: number;
  rows: number;
}

/** Only tasks that take part in at least one edge are drawn. */
export function layoutGraph(tasks: GraphTask[]): GraphLayout {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const edges: GraphEdge[] = [];
  const used = new Set<string>();
  for (const t of tasks) {
    for (const dep of t.dependsOn ?? []) {
      if (!byId.has(dep)) continue;
      edges.push({ from: dep, to: t.id });
      used.add(dep);
      used.add(t.id);
    }
  }

  const depth = new Map<string, number>();
  const visiting = new Set<string>();
  const layerOf = (id: string): number => {
    const known = depth.get(id);
    if (known !== undefined) return known;
    if (visiting.has(id)) return 0; // a cycle (the server rejects them); don't recurse forever
    visiting.add(id);
    const prereqs = (byId.get(id)?.dependsOn ?? []).filter((d) => byId.has(d));
    const d = prereqs.length === 0 ? 0 : 1 + Math.max(...prereqs.map(layerOf));
    visiting.delete(id);
    depth.set(id, d);
    return d;
  };

  const nodes: GraphNode[] = [];
  const perLayer = new Map<number, number>();
  for (const t of tasks) {
    if (!used.has(t.id)) continue;
    const layer = layerOf(t.id);
    const row = perLayer.get(layer) ?? 0;
    perLayer.set(layer, row + 1);
    nodes.push({ id: t.id, title: t.title, status: t.status, layer, row });
  }
  return {
    nodes,
    edges,
    layers: nodes.length === 0 ? 0 : Math.max(...nodes.map((n) => n.layer)) + 1,
    rows: nodes.length === 0 ? 0 : Math.max(...perLayer.values()),
  };
}
