// ============================================================
// MinHeap — Binary Min-Heap / Priority Queue
// Used by Dijkstra for efficient shortest-path execution
// Supports insert, extractMin, decreaseKey in O(log n)
// ============================================================

class MinHeap {
  constructor() {
    this.heap = [];           // Array of { priority, value }
    this.indices = new Map(); // value → index in heap (for decrease-key)
  }

  get size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  // ── Core operations ────────────────────────────────

  insert(priority, value) {
    const node = { priority, value };
    this.heap.push(node);
    const idx = this.heap.length - 1;
    this.indices.set(value, idx);
    this._bubbleUp(idx);
  }

  extractMin() {
    if (this.heap.length === 0) return null;

    const min = this.heap[0];
    const last = this.heap.pop();
    this.indices.delete(min.value);

    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.indices.set(last.value, 0);
      this._sinkDown(0);
    }

    return min;
  }

  decreaseKey(value, newPriority) {
    const idx = this.indices.get(value);
    if (idx === undefined) {
      // Not in heap — insert instead
      this.insert(newPriority, value);
      return;
    }

    if (newPriority >= this.heap[idx].priority) return; // No improvement

    this.heap[idx].priority = newPriority;
    this._bubbleUp(idx);
  }

  contains(value) {
    return this.indices.has(value);
  }

  // ── Internal helpers ───────────────────────────────

  _parent(i)  { return Math.floor((i - 1) / 2); }
  _left(i)    { return 2 * i + 1; }
  _right(i)   { return 2 * i + 2; }

  _swap(i, j) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    this.indices.set(this.heap[i].value, i);
    this.indices.set(this.heap[j].value, j);
  }

  _bubbleUp(i) {
    while (i > 0) {
      const p = this._parent(i);
      if (this.heap[p].priority <= this.heap[i].priority) break;
      this._swap(i, p);
      i = p;
    }
  }

  _sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = this._left(i);
      const r = this._right(i);

      if (l < n && this.heap[l].priority < this.heap[smallest].priority) {
        smallest = l;
      }
      if (r < n && this.heap[r].priority < this.heap[smallest].priority) {
        smallest = r;
      }

      if (smallest === i) break;
      this._swap(i, smallest);
      i = smallest;
    }
  }
}

// Export globally
window.MinHeap = MinHeap;
