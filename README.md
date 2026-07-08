# IITK Campus Graph Navigator 🗺️ (Algoascent)

An interactive application that models the IIT Kanpur campus as a mathematical graph. 
This project visualizes classic graph algorithms in real-time on a beautifully rendered campus layout, allowing users to find shortest paths, calculate minimum spanning trees, identify critical roads, and more.

**This project includes two implementations:**
1. A **Web Application** (Interactive UI with Canvas Animations)
2. A **C++ Terminal Application** (Fast, console-based standalone program)

---

## 🌍 Web Version (Interactive UI)

The web version is a pure frontend application (HTML/CSS/JS) with no backend required.

### 🔗 Live Demo
> **[Play with the live web app here!](https://technocat00.github.io/Algoascent/)**
*(Note: If you are the repository owner and the link gives a 404 error, you need to go to your repo **Settings > Pages > Branch: main > Save** to turn the website on!)*

### Features
- **Interactive Campus Map:** Visualizes ~30 major IITK locations (Hostels, Academic Buildings, Gates, Food Stalls) and ~50 connecting walkways/roads.
- **Dynamic Weighting:** Switch routing costs between actual *Distance*, estimated *Time*, or raw *Congestion* levels.
- **Road Blocks Simulation:** `Shift+Click` any road to simulate a blockage (e.g., event, construction).
- **Algorithm Animations:** Step-by-step visualizations of how algorithms explore the graph.

---

## 💻 C++ Version (Console App)

The `cpp-version` folder contains the exact same data structures and algorithms implemented natively in standard C++. It's perfect for learning and assignments.

### Features
- Menu-driven terminal interface.
- Standard libraries only (`<iostream>`, `<vector>`, `<queue>`, `<unordered_map>`, `<set>`).
- Calculates routes and prints exact step-by-step path sequences to the console.

### How to Run
If you have a standard C++ compiler (like `g++`), navigate to the `cpp-version` folder and run:

```bash
# Compile the code
g++ main.cpp -o campus_nav

# Run the program (Linux / Mac)
./campus_nav

# Run the program (Windows)
.\campus_nav.exe
```

---

## 🧠 Supported Graph Algorithms

Both the Web and C++ versions implement these core algorithms from scratch:

1. **Dijkstra's Algorithm (w/ Min-Heap)**: Finds the shortest or fastest path between any two locations.
2. **Kruskal's Algorithm (w/ Union-Find)**: Computes the Minimum Spanning Tree (MST).
3. **Tarjan's Algorithm**: Identifies critical "Bridges" (roads) and "Articulation Points" (locations).
4. **Breadth-First Search (BFS)**: Explores reachability and identifies disconnected components.
5. **Depth-First Search (DFS)**: Deep exploration and connected component detection.
