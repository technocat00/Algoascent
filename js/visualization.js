// ============================================================
// Canvas Visualization Layer
// Handles drawing nodes, edges, animations, zooming, and panning.
// ============================================================

class Visualizer {
  constructor(canvasId, campusData) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.data = campusData;

    // Viewport state
    this.transform = { x: 0, y: 0, scale: 1 };
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    
    // Bounding box of campus to auto-center
    this.bounds = this._calcBounds();
    
    // Animation state
    this.activeNodes = new Map(); // id -> color/state
    this.activeEdges = new Map(); // "from|to" -> color/state
    this.highlightNodes = new Set(); // special nodes (e.g. articulations)
    this.highlightEdges = new Set(); // special edges (e.g. bridges/MST)
    
    this.initEvents();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Auto center
    setTimeout(() => this.centerView(), 50);
  }

  _calcBounds() {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    this.data.nodes.forEach(n => {
      if (n.x < minX) minX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.x > maxX) maxX = n.x;
      if (n.y > maxY) maxY = n.y;
    });
    return { minX, minY, maxX, maxY };
  }

  resize() {
    this.canvas.width = this.canvas.parentElement.clientWidth;
    this.canvas.height = this.canvas.parentElement.clientHeight;
    this.draw();
  }

  centerView() {
    const margin = 100;
    const w = this.bounds.maxX - this.bounds.minX + margin * 2;
    const h = this.bounds.maxY - this.bounds.minY + margin * 2;
    
    const scaleX = this.canvas.width / w;
    const scaleY = this.canvas.height / h;
    this.transform.scale = Math.min(scaleX, scaleY, 1.5);
    
    const cx = (this.bounds.minX + this.bounds.maxX) / 2;
    const cy = (this.bounds.minY + this.bounds.maxY) / 2;
    
    this.transform.x = this.canvas.width / 2 - cx * this.transform.scale;
    this.transform.y = this.canvas.height / 2 - cy * this.transform.scale;
    
    this.draw();
  }

  // ── Event Handling ─────────────────────────────────

  initEvents() {
    this.canvas.addEventListener('mousedown', e => {
      this.isDragging = true;
      this.dragStart = { x: e.clientX - this.transform.x, y: e.clientY - this.transform.y };
    });

    this.canvas.addEventListener('mousemove', e => {
      if (this.isDragging) {
        this.transform.x = e.clientX - this.dragStart.x;
        this.transform.y = e.clientY - this.dragStart.y;
        this.draw();
      }
      
      // Hit testing for tooltip & interactions
      this._handleMouseMove(e);
    });

    this.canvas.addEventListener('mouseup', () => this.isDragging = false);
    this.canvas.addEventListener('mouseleave', () => {
      this.isDragging = false;
      if (this.hoveredItem) {
        this.hoveredItem = null;
        this.draw();
        if (this.onHoverChange) this.onHoverChange(null);
      }
    });

    this.canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      const newScale = Math.max(0.2, Math.min(this.transform.scale * (1 + delta), 4));
      
      // Zoom toward cursor
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      this.transform.x = mouseX - (mouseX - this.transform.x) * (newScale / this.transform.scale);
      this.transform.y = mouseY - (mouseY - this.transform.y) * (newScale / this.transform.scale);
      this.transform.scale = newScale;
      
      this.draw();
    });
    
    this.canvas.addEventListener('click', e => {
      if (this.hoveredItem && this.onClick) {
        this.onClick(this.hoveredItem, e.shiftKey);
      }
    });
  }

  _screenToWorld(x, y) {
    return {
      x: (x - this.transform.x) / this.transform.scale,
      y: (y - this.transform.y) / this.transform.scale
    };
  }

  _handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldPos = this._screenToWorld(mouseX, mouseY);
    
    if (this.onMouseMove) this.onMouseMove(Math.round(worldPos.x), Math.round(worldPos.y));

    let found = null;
    
    // Node hit test (radius = 15)
    for (const node of this.data.nodes) {
      const dx = worldPos.x - node.x;
      const dy = worldPos.y - node.y;
      if (dx*dx + dy*dy <= 15*15) {
        found = { type: 'node', data: node, screenX: mouseX, screenY: mouseY };
        break;
      }
    }

    // Edge hit test (distance to line segment)
    if (!found) {
      for (const edge of this.data.edges) {
        const n1 = this.data.nodes.find(n => n.id === edge.from);
        const n2 = this.data.nodes.find(n => n.id === edge.to);
        
        if (this._pointToSegmentDist(worldPos.x, worldPos.y, n1.x, n1.y, n2.x, n2.y) < 6) {
          found = { type: 'edge', data: edge, screenX: mouseX, screenY: mouseY };
          break;
        }
      }
    }

    if (found?.data !== this.hoveredItem?.data) {
      this.hoveredItem = found;
      this.canvas.style.cursor = found ? 'pointer' : (this.isDragging ? 'grabbing' : 'grab');
      this.draw();
      if (this.onHoverChange) this.onHoverChange(found);
    } else if (found) {
      // update tooltip pos even if same item
      if (this.onHoverChange) this.onHoverChange(found);
    }
  }

  _pointToSegmentDist(px, py, x1, y1, x2, y2) {
    const l2 = (x1 - x2) ** 2 + (y1 - y2) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  // ── Drawing ─────────────────────────────────────────

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    
    this.ctx.translate(this.transform.x, this.transform.y);
    this.ctx.scale(this.transform.scale, this.transform.scale);

    // Draw Edges
    this.data.edges.forEach(edge => this._drawEdge(edge));

    // Draw Nodes
    this.data.nodes.forEach(node => this._drawNode(node));

    this.ctx.restore();
  }

  _drawEdge(edge) {
    const n1 = this.data.nodes.find(n => n.id === edge.from);
    const n2 = this.data.nodes.find(n => n.id === edge.to);
    const key1 = `${edge.from}|${edge.to}`;
    const key2 = `${edge.to}|${edge.from}`;
    
    let color = 'rgba(255, 255, 255, 0.1)';
    let width = edge.roadType === 'main_road' ? 3 : (edge.roadType === 'walkway' ? 2 : 1.5);
    let dash = edge.roadType === 'corridor' ? [5, 5] : [];
    
    // Blocked state
    const isBlocked = window.app && window.app.graph.isBlocked(edge.from, edge.to);
    
    if (isBlocked) {
      color = 'rgba(239, 68, 68, 0.3)'; // faded red
      dash = [2, 4];
    } else if (this.highlightEdges.has(key1) || this.highlightEdges.has(key2)) {
      color = '#10b981'; // success/highlight
      width = 4;
    } else if (this.activeEdges.has(key1)) {
      color = this.activeEdges.get(key1);
      width = 3;
    } else if (this.activeEdges.has(key2)) {
      color = this.activeEdges.get(key2);
      width = 3;
    }
    
    // Hover highlight
    if (this.hoveredItem?.type === 'edge' && this.hoveredItem.data === edge) {
      color = isBlocked ? 'rgba(239, 68, 68, 0.8)' : '#6366f1';
      width += 2;
    }

    this.ctx.beginPath();
    this.ctx.moveTo(n1.x, n1.y);
    this.ctx.lineTo(n2.x, n2.y);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width / this.transform.scale; // keep line width somewhat constant
    if (dash.length) this.ctx.setLineDash(dash.map(d => d / this.transform.scale));
    else this.ctx.setLineDash([]);
    
    this.ctx.stroke();

    // Draw congestion indicator if high
    if (edge.congestion >= 3 && !isBlocked && this.transform.scale > 0.6) {
      const mx = (n1.x + n2.x) / 2;
      const my = (n1.y + n2.y) / 2;
      this.ctx.fillStyle = edge.congestion === 5 ? '#ef4444' : (edge.congestion === 4 ? '#f59e0b' : '#fbbf24');
      this.ctx.beginPath();
      this.ctx.arc(mx, my, 3 / this.transform.scale, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  _drawNode(node) {
    const meta = this.data.nodeTypes[node.type];
    const baseColor = meta.color;
    
    let color = baseColor;
    let radius = 8;
    let strokeColor = 'rgba(255,255,255,0.1)';
    let strokeWidth = 2;
    
    if (this.highlightNodes.has(node.id)) {
      strokeColor = '#ef4444'; // Red outline for critical nodes (Tarjan)
      strokeWidth = 4;
      radius = 10;
    } else if (this.activeNodes.has(node.id)) {
      color = this.activeNodes.get(node.id);
      strokeColor = '#ffffff';
      radius = 10;
    }

    // Source/Target highlights
    if (window.app) {
      if (node.id === window.app.sourceId) {
        strokeColor = '#10b981'; strokeWidth = 4; radius = 10;
      }
      if (node.id === window.app.targetId) {
        strokeColor = '#f59e0b'; strokeWidth = 4; radius = 10;
      }
    }

    if (this.hoveredItem?.type === 'node' && this.hoveredItem.data === node) {
      radius += 2;
      strokeColor = '#fff';
    }

    // Shadow
    this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
    this.ctx.shadowBlur = 4;
    
    // Draw circle
    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, radius / this.transform.scale, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    
    this.ctx.shadowBlur = 0; // reset
    this.ctx.lineWidth = strokeWidth / this.transform.scale;
    this.ctx.strokeStyle = strokeColor;
    this.ctx.stroke();

    // Draw Label if zoomed in enough
    if (this.transform.scale > 0.7) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.font = `${10 / this.transform.scale}px Inter`;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(node.name, node.x, node.y - (radius + 4) / this.transform.scale);
    }
  }

  // ── Animation API ────────────────────────────────────

  resetState() {
    this.activeNodes.clear();
    this.activeEdges.clear();
    this.highlightNodes.clear();
    this.highlightEdges.clear();
    this.draw();
  }

  setNodeActive(id, color = '#3b82f6') {
    this.activeNodes.set(id, color);
    this.draw();
  }

  setEdgeActive(from, to, color = '#6366f1') {
    this.activeEdges.set(`${from}|${to}`, color);
    this.draw();
  }

  highlightEdge(from, to) {
    this.highlightEdges.add(`${from}|${to}`);
    this.draw();
  }

  highlightNode(id) {
    this.highlightNodes.add(id);
    this.draw();
  }
}

window.Visualizer = Visualizer;
