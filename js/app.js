// ============================================================
// App Orchestrator & UI Logic
// Connects UI events to Graph algorithms and Visualizer
// ============================================================

class App {
  constructor() {
    this.graph = new Graph(window.CAMPUS_DATA);
    this.vis = new Visualizer('graphCanvas', window.CAMPUS_DATA);
    
    this.algo = 'dijkstra';
    this.weightMode = 'distance';
    this.sourceId = 'hall2';
    this.targetId = 'cse';
    this.speed = 70; // ms per step (lower is faster, mapped later)
    
    this.isAnimating = false;
    this.animationTimer = null;

    this.initUI();
    this.vis.onHoverChange = this.handleHover.bind(this);
    this.vis.onClick = this.handleClick.bind(this);
    this.vis.onMouseMove = (x, y) => {
      document.getElementById('coordText').textContent = `x: ${x}, y: ${y}`;
    };
  }

  initUI() {
    // Populate Selects
    const nodeOptions = window.CAMPUS_DATA.nodes
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(n => `<option value="${n.id}">${n.name}</option>`)
      .join('');
      
    const srcSel = document.getElementById('sourceSelect');
    const tgtSel = document.getElementById('targetSelect');
    srcSel.innerHTML = nodeOptions;
    tgtSel.innerHTML = nodeOptions;
    srcSel.value = this.sourceId;
    tgtSel.value = this.targetId;

    // Populate Legend
    const legendHtml = Object.entries(window.CAMPUS_DATA.nodeTypes).map(([key, meta]) => `
      <div class="legend-item">
        <div class="legend-dot" style="background: ${meta.color}"></div>
        <span>${meta.label}</span>
      </div>
    `).join('');
    document.getElementById('legendGrid').innerHTML = legendHtml;

    // Event Listeners
    document.getElementById('algoSelect').addEventListener('change', (e) => {
      this.algo = e.target.value;
      const pathControls = document.getElementById('pathControls');
      const tgtLabel = document.getElementById('targetLabel');
      
      if (['dijkstra'].includes(this.algo)) {
        pathControls.style.display = 'block';
        tgtSel.style.display = 'block';
        tgtLabel.style.display = 'block';
      } else if (['bfs', 'dfs'].includes(this.algo)) {
        pathControls.style.display = 'block';
        tgtSel.style.display = 'none';
        tgtLabel.style.display = 'none';
      } else {
        pathControls.style.display = 'none'; // Kruskal, Tarjan don't need source/target
      }
    });

    srcSel.addEventListener('change', (e) => { this.sourceId = e.target.value; this.vis.draw(); });
    tgtSel.addEventListener('change', (e) => { this.targetId = e.target.value; this.vis.draw(); });

    document.querySelectorAll('.toggle-opt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.toggle-opt').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.weightMode = e.target.dataset.val;
      });
    });

    document.getElementById('speedSlider').addEventListener('input', (e) => {
      this.speed = parseInt(e.target.value, 10);
      let label = 'Medium';
      if (this.speed > 80) label = 'Very Fast';
      else if (this.speed > 60) label = 'Fast';
      else if (this.speed < 30) label = 'Slow';
      document.getElementById('speedVal').textContent = label;
    });

    document.getElementById('btnRun').addEventListener('click', () => this.runAlgorithm());
    document.getElementById('btnReset').addEventListener('click', () => this.reset());
    document.getElementById('btnClearBlocks').addEventListener('click', () => {
      this.graph.clearBlocked();
      this.updateBlockedUI();
      this.vis.draw();
    });

    // Make self global for vis access
    window.app = this;
  }

  // ── Interaction ────────────────────────────────────

  handleHover(item) {
    const tooltip = document.getElementById('tooltip');
    if (!item) {
      tooltip.classList.remove('show');
      return;
    }

    let name = '', info = '';
    
    if (item.type === 'node') {
      const meta = window.CAMPUS_DATA.nodeTypes[item.data.type];
      name = `${meta.icon} ${item.data.name}`;
      info = meta.label;
    } else {
      const n1 = this.graph.nodes.get(item.data.from);
      const n2 = this.graph.nodes.get(item.data.to);
      name = 'Road / Connection';
      const w = this.graph.getWeight(item.data, this.weightMode);
      info = `${n1.name} ↔ ${n2.name}<br>Dist: ${item.data.distance}m | Congestion: ${item.data.congestion}/5`;
      if (this.graph.isBlocked(item.data.from, item.data.to)) info += '<br><span style="color:#ef4444;font-weight:bold;">BLOCKED</span>';
    }

    document.getElementById('ttName').innerHTML = name;
    document.getElementById('ttInfo').innerHTML = info;
    
    // Position tooltip
    tooltip.style.left = `${item.screenX + 15}px`;
    tooltip.style.top = `${item.screenY + 15}px`;
    tooltip.classList.add('show');
  }

  handleClick(item, isShift) {
    if (this.isAnimating) return;

    if (item.type === 'edge' && isShift) {
      const blocked = this.graph.toggleBlockEdge(item.data.from, item.data.to);
      this.updateBlockedUI();
      this.vis.draw();
      this.showToast(blocked ? 'Road Blocked' : 'Road Opened');
    } else if (item.type === 'node') {
      if (['dijkstra', 'bfs', 'dfs'].includes(this.algo)) {
        // Toggle source/target
        if (this.sourceId === item.data.id) {
          if (this.algo === 'dijkstra') this.sourceId = this.targetId;
        } else {
          if (this.algo === 'dijkstra') this.targetId = this.sourceId;
          this.sourceId = item.data.id;
        }
        document.getElementById('sourceSelect').value = this.sourceId;
        if (this.algo === 'dijkstra') document.getElementById('targetSelect').value = this.targetId;
        this.vis.draw();
      }
    }
  }

  updateBlockedUI() {
    const list = document.getElementById('blockedList');
    const btn = document.getElementById('btnClearBlocks');
    
    if (this.graph.blockedEdges.size === 0) {
      list.innerHTML = '<span style="font-size: 0.7rem; color: var(--text-muted); padding: 4px;">No blocked roads</span>';
      btn.style.display = 'none';
      return;
    }

    btn.style.display = 'block';
    
    // De-duplicate (since A|B and B|A both exist conceptually, set has one)
    let html = '';
    this.graph.blockedEdges.forEach(key => {
      const [from, to] = key.split('|');
      const n1 = this.graph.nodes.get(from).name;
      const n2 = this.graph.nodes.get(to).name;
      // Truncate long names
      const short1 = n1.replace('Hall ', 'H').replace(' Department', '');
      const short2 = n2.replace('Hall ', 'H').replace(' Department', '');
      
      html += `
        <div class="blocked-tag">
          ${short1}↔${short2}
          <span class="x" onclick="app.graph.toggleBlockEdge('${from}', '${to}'); app.updateBlockedUI(); app.vis.draw();">×</span>
        </div>
      `;
    });
    list.innerHTML = html;
  }

  showToast(msg) {
    const div = document.createElement('div');
    div.className = 'toast';
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => {
      div.classList.add('out');
      setTimeout(() => div.remove(), 300);
    }, 2000);
  }

  // ── Execution & Animation ────────────────────────────

  reset() {
    if (this.animationTimer) clearTimeout(this.animationTimer);
    this.isAnimating = false;
    this.vis.resetState();
    document.getElementById('resultsPanel').style.display = 'none';
    this.setStatus('Ready', false);
    document.getElementById('btnRun').disabled = false;
  }

  setStatus(text, running = false) {
    document.getElementById('statusText').textContent = text;
    const dot = document.getElementById('statusDot');
    if (running) dot.classList.add('running');
    else dot.classList.remove('running');
  }

  runAlgorithm() {
    if (this.isAnimating) return;
    this.reset();
    this.isAnimating = true;
    document.getElementById('btnRun').disabled = true;
    
    let result = null;
    let title = '';

    try {
      switch (this.algo) {
        case 'dijkstra':
          title = 'Dijkstra Shortest Path';
          result = this.graph.dijkstra(this.sourceId, this.targetId, this.weightMode);
          break;
        case 'kruskal':
          title = 'Kruskal Minimum Spanning Tree';
          result = this.graph.kruskalMST(this.weightMode);
          break;
        case 'tarjan':
          title = 'Tarjan Bridges & Articulations';
          result = this.graph.tarjan();
          break;
        case 'bfs':
          title = 'Breadth-First Search';
          result = this.graph.bfs(this.sourceId);
          break;
        case 'dfs':
          title = 'Depth-First Search';
          result = this.graph.dfs(this.sourceId);
          break;
      }
    } catch (e) {
      console.error(e);
      this.showToast('Algorithm error!');
      this.reset();
      return;
    }

    this.setStatus(`Running ${title}...`, true);
    this.animateSteps(result.steps, () => {
      this.setStatus(`${title} Complete`, false);
      this.showResults(title, result);
      this.isAnimating = false;
      document.getElementById('btnRun').disabled = false;
    });
  }

  animateSteps(steps, onComplete) {
    let i = 0;
    
    const nextStep = () => {
      if (i >= steps.length) {
        onComplete();
        return;
      }

      const step = steps[i++];
      
      switch (step.type) {
        // Dijkstra
        case 'visit':
          this.vis.setNodeActive(step.nodeId, '#f59e0b'); // processing
          break;
        case 'explore':
          this.vis.setEdgeActive(step.from, step.to, '#8b5cf6'); // exploring
          break;
        case 'relax':
          this.vis.setEdgeActive(step.from, step.to, '#10b981'); // found better path
          this.vis.setNodeActive(step.to, '#3b82f6'); // in queue
          break;
        case 'path':
          // Highlight final path
          this.vis.resetState();
          for (let j = 0; j < step.nodes.length - 1; j++) {
            this.vis.highlightEdge(step.nodes[j], step.nodes[j+1]);
            this.vis.highlightNode(step.nodes[j]);
          }
          this.vis.highlightNode(step.nodes[step.nodes.length - 1]);
          break;
          
        // Kruskal
        case 'consider':
          this.vis.setEdgeActive(step.from, step.to, '#f59e0b');
          break;
        case 'add':
          this.vis.highlightEdge(step.from, step.to);
          this.vis.highlightNode(step.from);
          this.vis.highlightNode(step.to);
          break;
        case 'reject':
          this.vis.setEdgeActive(step.from, step.to, 'rgba(255,255,255,0.1)'); // dim
          break;
          
        // Tarjan
        case 'bridge':
          this.vis.highlightEdge(step.from, step.to);
          break;
        case 'articulation':
          this.vis.highlightNode(step.nodeId);
          break;
        case 'back_edge':
          this.vis.setEdgeActive(step.from, step.to, '#ec4899');
          break;
      }

      // Calculate delay based on slider (1-100) -> (500ms - 5ms)
      const delay = Math.max(5, 500 - (this.speed * 4.95));
      
      // If speed is max, skip rendering some frames
      if (this.speed >= 95 && i % 3 !== 0 && i < steps.length - 1) {
        nextStep(); // recursive immediate
      } else {
        this.animationTimer = setTimeout(nextStep, delay);
      }
    };

    nextStep();
  }

  showResults(title, result) {
    const panel = document.getElementById('resultsPanel');
    const content = document.getElementById('resultsContent');
    const unit = this.graph.getWeightLabel(this.weightMode);
    
    let html = `<div style="font-size:0.75rem; color:var(--text-primary); margin-bottom:10px; font-weight:600;">${title}</div>`;

    if (this.algo === 'dijkstra') {
      if (result.path.length === 0) {
        html += `<div class="res-row"><span class="res-label">Status</span><span class="res-value danger">No Path Found</span></div>`;
        html += `<div class="res-detail">The destination is unreachable due to blocked roads.</div>`;
      } else {
        html += `
          <div class="res-row"><span class="res-label">Total Cost</span><span class="res-value hl">${result.totalCost.toFixed(1)} ${unit}</span></div>
          <div class="res-row"><span class="res-label">Nodes Visited</span><span class="res-value">${result.nodesVisited} / ${this.graph.nodes.size}</span></div>
          <div class="res-detail"><strong>Path Sequence:</strong> ${result.path.map(id => this.graph.nodes.get(id).name).join(' ➔ ')}</div>
        `;
      }
    } 
    else if (this.algo === 'kruskal') {
      html += `
        <div class="res-row"><span class="res-label">Total MST Weight</span><span class="res-value hl">${result.totalWeight.toFixed(1)} ${unit}</span></div>
        <div class="res-row"><span class="res-label">Edges Added</span><span class="res-value">${result.mstEdges.length}</span></div>
        <div class="res-detail">Minimum cost required to connect all reachable parts of the campus.</div>
      `;
    }
    else if (this.algo === 'tarjan') {
      html += `
        <div class="res-row"><span class="res-label">Critical Bridges</span><span class="res-value danger">${result.bridges.length}</span></div>
        <div class="res-row"><span class="res-label">Critical Points</span><span class="res-value warn">${result.articulationPoints.length}</span></div>
        <div class="res-detail">
          <strong>Bridges (Roads):</strong> ${result.bridges.length ? result.bridges.map(b => `${this.graph.nodes.get(b.from).name} ↔ ${this.graph.nodes.get(b.to).name}`).join(', ') : 'None'}
          <br><br>
          <strong>Points (Locations):</strong> ${result.articulationPoints.length ? result.articulationPoints.map(id => this.graph.nodes.get(id).name).join(', ') : 'None'}
        </div>
      `;
    }
    else if (['bfs', 'dfs'].includes(this.algo)) {
      html += `
        <div class="res-row"><span class="res-label">Nodes Reached</span><span class="res-value hl">${result.nodesReached} / ${this.graph.nodes.size}</span></div>
        <div class="res-row"><span class="res-label">Connected Components</span><span class="res-value ${result.componentCount > 1 ? 'warn' : ''}">${result.componentCount}</span></div>
        ${result.maxLevel !== undefined ? `<div class="res-row"><span class="res-label">Max Depth</span><span class="res-value">${result.maxLevel}</span></div>` : ''}
        <div class="res-detail">If Components > 1, the campus graph is disconnected (usually due to blocked roads).</div>
      `;
    }

    content.innerHTML = html;
    panel.style.display = 'block';
  }
}

// Init when DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
