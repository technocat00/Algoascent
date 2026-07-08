# IITK Campus Graph Navigator 🗺️

**Algoascent** — An interactive web application that models the IIT Kanpur campus as a mathematical graph. 
This project visualizes classic graph algorithms in real-time on a beautifully rendered campus layout, allowing users to find shortest paths, calculate minimum spanning trees, identify critical roads, and more.

## 🚀 Features

- **Interactive Campus Map:** Visualizes ~30 major IITK locations (Hostels, Academic Buildings, Gates, Food Stalls) and ~50 connecting walkways/roads.
- **Dynamic Weighting:** Switch routing costs between actual *Distance (meters)*, estimated *Time (affected by traffic)*, or raw *Congestion* levels.
- **Road Blocks Simulation:** `Shift+Click` any road to simulate a blockage (e.g., event, construction) and watch algorithms dynamically adjust their behavior.
- **Algorithm Animations:** Step-by-step visual animations of how algorithms explore the graph, complete with an adjustable speed slider.

## 🧠 Supported Graph Algorithms

All algorithms are implemented from scratch in vanilla JavaScript:

1. **Dijkstra's Algorithm (w/ Min-Heap)**: Finds the shortest or fastest path between any two locations on campus.
2. **Kruskal's Algorithm (w/ Union-Find)**: Computes the Minimum Spanning Tree (MST) to find the minimum cost required to connect the entire campus network.
3. **Tarjan's Algorithm**: Identifies critical "Bridges" (roads) and "Articulation Points" (locations) whose failure or closure would completely disconnect parts of the campus.
4. **Breadth-First Search (BFS)**: Explores the campus reachability layer-by-layer and identifies disconnected components.
5. **Depth-First Search (DFS)**: Performs deep exploration and connected component detection.

## 🛠️ Technology Stack

- **HTML5 Canvas:** For high-performance node and edge rendering.
- **Vanilla JavaScript (ES6):** No external frameworks or libraries.
- **CSS3:** Premium dark theme with glassmorphism UI.

## 💻 Local Execution

Since this is a pure frontend application, no build tools are required!

1. Clone the repository:
   ```bash
   git clone https://github.com/technocat00/Algoascent.git
   cd Algoascent
   ```
2. Start a local server. For example, using Python:
   ```bash
   python -m http.server 8000
   ```
3. Open your browser and navigate to `http://localhost:8000`.

---
*Built for algorithmic exploration and campus navigation.*
