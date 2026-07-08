// ============================================================
// Graph — Campus graph with all algorithms
// Each algorithm returns { ..., steps: [] } for animation
// ============================================================

class Graph {
  constructor(campusData) {
    this.nodes = new Map();      // id → node object
    this.adjacency = new Map();  // id → [{ to, edgeIndex }]
    this.edges = [];             // flat edge array
    this.blockedEdges = new Set();
    this.congestionFactors = campusData.congestionFactors;

    // Build adjacency
    campusData.nodes.forEach(node => {
      this.nodes.set(node.id, node);
      this.adjacency.set(node.id, []);
    });

    campusData.edges.forEach((edge, index) => {
      this.edges.push({ ...edge, index });
      this.adjacency.get(edge.from).push({ to: edge.to, edgeIndex: index });
      this.adjacency.get(edge.to).push({ to: edge.from, edgeIndex: index });
    });
  }

  // ── Weight helpers ─────────────────────────────────

  getWeight(edge, mode) {
    if (mode === 'time')       return edge.distance * (this.congestionFactors[edge.congestion] || 1);
    if (mode === 'congestion') return edge.congestion;
    return edge.distance; // default: distance
  }

  getWeightLabel(mode) {
    if (mode === 'time')       return 'time-units';
    if (mode === 'congestion') return 'congestion';
    return 'm';
  }

  // ── Edge blocking ──────────────────────────────────

  isBlocked(from, to) {
    return this.blockedEdges.has(`${from}|${to}`) || this.blockedEdges.has(`${to}|${from}`);
  }

  toggleBlockEdge(from, to) {
    const k1 = `${from}|${to}`, k2 = `${to}|${from}`;
    if (this.blockedEdges.has(k1) || this.blockedEdges.has(k2)) {
      this.blockedEdges.delete(k1);
      this.blockedEdges.delete(k2);
      return false; // unblocked
    }
    this.blockedEdges.add(k1);
    return true; // blocked
  }

  clearBlocked() {
    this.blockedEdges.clear();
  }

  // ═══════════════════════════════════════════════════
  // 1. DIJKSTRA — Shortest / fastest path (with MinHeap)
  // ═══════════════════════════════════════════════════

  dijkstra(sourceId, targetId, weightMode = 'distance') {
    const steps = [];
    const dist = new Map();
    const prev = new Map();
    const visited = new Set();
    const heap = new MinHeap();

    this.nodes.forEach((_, id) => {
      dist.set(id, Infinity);
      prev.set(id, null);
    });

    dist.set(sourceId, 0);
    heap.insert(0, sourceId);
    steps.push({ type: 'init', sourceId, targetId });

    while (!heap.isEmpty()) {
      const { priority, value: u } = heap.extractMin();

      if (visited.has(u)) continue;
      visited.add(u);
      steps.push({ type: 'visit', nodeId: u, cost: priority });

      if (u === targetId) break;

      for (const { to: v, edgeIndex } of this.adjacency.get(u)) {
        const edge = this.edges[edgeIndex];
        if (this.isBlocked(edge.from, edge.to) || visited.has(v)) continue;

        const w = this.getWeight(edge, weightMode);
        const newDist = dist.get(u) + w;

        steps.push({ type: 'explore', from: u, to: v, weight: w });

        if (newDist < dist.get(v)) {
          dist.set(v, newDist);
          prev.set(v, u);
          heap.insert(newDist, v); // lazy insertion (duplicates filtered by visited check)
          steps.push({ type: 'relax', from: u, to: v, newDist });
        }
      }
    }

    // Reconstruct path
    const path = [];
    let cur = targetId;
    while (cur !== null) { path.unshift(cur); cur = prev.get(cur); }

    if (path[0] !== sourceId) {
      steps.push({ type: 'no_path' });
      return { path: [], totalCost: Infinity, steps, nodesVisited: visited.size };
    }

    steps.push({ type: 'path', nodes: [...path], totalCost: dist.get(targetId) });
    return { path, totalCost: dist.get(targetId), steps, nodesVisited: visited.size };
  }

  // ═══════════════════════════════════════════════════
  // 2. KRUSKAL MST — Minimum spanning tree (Union-Find)
  // ═══════════════════════════════════════════════════

  kruskalMST(weightMode = 'distance') {
    const steps = [];
    const parent = new Map();
    const rank = new Map();

    // Make-set
    this.nodes.forEach((_, id) => { parent.set(id, id); rank.set(id, 0); });

    const find = (x) => {
      if (parent.get(x) !== x) parent.set(x, find(parent.get(x)));
      return parent.get(x);
    };

    const union = (a, b) => {
      const ra = find(a), rb = find(b);
      if (ra === rb) return false;
      if (rank.get(ra) < rank.get(rb))      parent.set(ra, rb);
      else if (rank.get(ra) > rank.get(rb)) parent.set(rb, ra);
      else { parent.set(rb, ra); rank.set(ra, rank.get(ra) + 1); }
      return true;
    };

    // Sort edges
    const sorted = this.edges
      .filter(e => !this.isBlocked(e.from, e.to))
      .map(e => ({ ...e, weight: this.getWeight(e, weightMode) }))
      .sort((a, b) => a.weight - b.weight);

    const mstEdges = [];
    let totalWeight = 0;

    steps.push({ type: 'init' });

    for (const edge of sorted) {
      steps.push({ type: 'consider', from: edge.from, to: edge.to, weight: edge.weight });

      if (union(edge.from, edge.to)) {
        mstEdges.push(edge);
        totalWeight += edge.weight;
        steps.push({ type: 'add', from: edge.from, to: edge.to, weight: edge.weight });
        if (mstEdges.length === this.nodes.size - 1) break;
      } else {
        steps.push({ type: 'reject', from: edge.from, to: edge.to });
      }
    }

    steps.push({ type: 'complete', totalWeight, edgeCount: mstEdges.length });
    return { mstEdges, totalWeight, steps };
  }

  // ═══════════════════════════════════════════════════
  // 3. TARJAN — Bridges & Articulation Points
  // ═══════════════════════════════════════════════════

  tarjan() {
    const steps = [];
    const disc = new Map();
    const low  = new Map();
    const visited = new Set();
    const bridges = [];
    const articulationPoints = new Set();
    let timer = 0;

    const dfs = (u, parentEdgeIdx) => {
      visited.add(u);
      disc.set(u, timer);
      low.set(u, timer);
      timer++;
      let children = 0;

      steps.push({ type: 'visit', nodeId: u, disc: disc.get(u), low: low.get(u) });

      for (const { to: v, edgeIndex } of this.adjacency.get(u)) {
        if (edgeIndex === parentEdgeIdx) continue; // skip edge we arrived on
        const edge = this.edges[edgeIndex];
        if (this.isBlocked(edge.from, edge.to)) continue;

        if (!visited.has(v)) {
          children++;
          steps.push({ type: 'explore', from: u, to: v });
          dfs(v, edgeIndex);

          low.set(u, Math.min(low.get(u), low.get(v)));

          // Bridge
          if (low.get(v) > disc.get(u)) {
            bridges.push({ from: u, to: v });
            steps.push({ type: 'bridge', from: u, to: v });
          }

          // Articulation (non-root)
          if (parentEdgeIdx !== -1 && low.get(v) >= disc.get(u)) {
            articulationPoints.add(u);
            steps.push({ type: 'articulation', nodeId: u });
          }
        } else {
          low.set(u, Math.min(low.get(u), disc.get(v)));
          steps.push({ type: 'back_edge', from: u, to: v });
        }
      }

      // Root articulation point
      if (parentEdgeIdx === -1 && children > 1) {
        articulationPoints.add(u);
        steps.push({ type: 'articulation', nodeId: u });
      }
    };

    this.nodes.forEach((_, id) => {
      if (!visited.has(id)) dfs(id, -1);
    });

    steps.push({ type: 'complete', bridgeCount: bridges.length, apCount: articulationPoints.size });
    return { bridges, articulationPoints: [...articulationPoints], steps };
  }

  // ═══════════════════════════════════════════════════
  // 4. BFS — Breadth-First Search (reachability + levels)
  // ═══════════════════════════════════════════════════

  bfs(sourceId) {
    const steps = [];
    const visited = new Set();
    const levels = new Map();
    const order = [];
    const queue = [sourceId];

    visited.add(sourceId);
    levels.set(sourceId, 0);
    steps.push({ type: 'init', sourceId });

    while (queue.length > 0) {
      const u = queue.shift();
      order.push(u);
      steps.push({ type: 'visit', nodeId: u, level: levels.get(u) });

      for (const { to: v, edgeIndex } of this.adjacency.get(u)) {
        const edge = this.edges[edgeIndex];
        if (this.isBlocked(edge.from, edge.to) || visited.has(v)) continue;

        visited.add(v);
        levels.set(v, levels.get(u) + 1);
        queue.push(v);
        steps.push({ type: 'explore', from: u, to: v, level: levels.get(v) });
      }
    }

    // Detect disconnected components
    const components = [order.slice()];
    this.nodes.forEach((_, id) => {
      if (!visited.has(id)) {
        const comp = [];
        const q = [id];
        visited.add(id);
        levels.set(id, 0);
        steps.push({ type: 'new_component' });

        while (q.length > 0) {
          const u = q.shift();
          comp.push(u);
          order.push(u);
          steps.push({ type: 'visit', nodeId: u, level: levels.get(u) });

          for (const { to: v, edgeIndex } of this.adjacency.get(u)) {
            const edge = this.edges[edgeIndex];
            if (this.isBlocked(edge.from, edge.to) || visited.has(v)) continue;
            visited.add(v);
            levels.set(v, levels.get(u) + 1);
            q.push(v);
            steps.push({ type: 'explore', from: u, to: v, level: levels.get(v) });
          }
        }
        components.push(comp);
      }
    });

    const maxLevel = Math.max(0, ...levels.values());
    steps.push({ type: 'complete', nodesReached: order.length, componentCount: components.length, maxLevel });
    return { order, levels, steps, components, maxLevel };
  }

  // ═══════════════════════════════════════════════════
  // 5. DFS — Depth-First Search (reachability + components)
  // ═══════════════════════════════════════════════════

  dfs(sourceId) {
    const steps = [];
    const visited = new Set();
    const order = [];

    steps.push({ type: 'init', sourceId });

    const visit = (u) => {
      visited.add(u);
      order.push(u);
      steps.push({ type: 'visit', nodeId: u });

      for (const { to: v, edgeIndex } of this.adjacency.get(u)) {
        const edge = this.edges[edgeIndex];
        if (this.isBlocked(edge.from, edge.to) || visited.has(v)) continue;

        steps.push({ type: 'explore', from: u, to: v });
        visit(v);
        steps.push({ type: 'backtrack', from: v, to: u });
      }
    };

    visit(sourceId);

    const components = [order.slice()];
    this.nodes.forEach((_, id) => {
      if (!visited.has(id)) {
        const start = order.length;
        steps.push({ type: 'new_component' });
        visit(id);
        components.push(order.slice(start));
      }
    });

    steps.push({ type: 'complete', nodesReached: order.length, componentCount: components.length });
    return { order, steps, components };
  }
}

// Export globally
window.Graph = Graph;
