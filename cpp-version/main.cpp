#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <queue>
#include <algorithm>
#include <limits>

using namespace std;

// ── Data Structures ──────────────────────────────────────────

struct Edge {
    string from;
    string to;
    int distance;
    int congestion; // 1 to 5
    string type;    // e.g., "walkway", "main_road"

    // Default weight is distance
    int getWeight() const { return distance; }
};

struct Node {
    string id;
    string name;
    string category;
};

// Disjoint Set (Union-Find) for Kruskal's Algorithm
class DisjointSet {
    unordered_map<string, string> parent;
    unordered_map<string, int> rank;
public:
    void makeSet(const string& n) {
        parent[n] = n;
        rank[n] = 0;
    }

    string find(string i) {
        if (parent[i] == i) return i;
        return parent[i] = find(parent[i]); // Path compression
    }

    bool unite(string i, string j) {
        string rootI = find(i);
        string rootJ = find(j);
        if (rootI != rootJ) {
            if (rank[rootI] < rank[rootJ]) {
                parent[rootI] = rootJ;
            } else if (rank[rootI] > rank[rootJ]) {
                parent[rootJ] = rootI;
            } else {
                parent[rootJ] = rootI;
                rank[rootI]++;
            }
            return true;
        }
        return false;
    }
};

// ── Graph Class ──────────────────────────────────────────────

class CampusGraph {
private:
    unordered_map<string, Node> nodes;
    unordered_map<string, vector<Edge>> adjList;
    vector<Edge> allEdges;

public:
    void addNode(string id, string name, string category) {
        nodes[id] = {id, name, category};
        adjList[id] = vector<Edge>();
    }

    void addEdge(string u, string v, int dist, int cong, string type) {
        Edge e1 = {u, v, dist, cong, type};
        Edge e2 = {v, u, dist, cong, type};
        adjList[u].push_back(e1);
        adjList[v].push_back(e2);
        allEdges.push_back(e1); // Store one directed copy for Kruskal
    }
    
    string getNodeName(string id) {
        if(nodes.find(id) != nodes.end()) return nodes[id].name;
        return id;
    }

    bool nodeExists(string id) {
        return nodes.find(id) != nodes.end();
    }
    
    void printAllNodes() {
        cout << "\n--- Available Locations ---\n";
        for (const auto& pair : nodes) {
            cout << "- " << pair.first << " (" << pair.second.name << ")\n";
        }
        cout << "---------------------------\n";
    }

    // 1. Dijkstra's Algorithm (Shortest Path)
    void dijkstra(string start, string end) {
        if (!nodeExists(start) || !nodeExists(end)) {
            cout << "Invalid start or end node ID!\n";
            return;
        }

        unordered_map<string, int> dist;
        unordered_map<string, string> parent;
        for (const auto& pair : nodes) {
            dist[pair.first] = numeric_limits<int>::max();
        }

        // Min-heap: pair<distance, node_id>
        priority_queue<pair<int, string>, vector<pair<int, string>>, greater<pair<int, string>>> pq;

        dist[start] = 0;
        pq.push({0, start});

        while (!pq.empty()) {
            string u = pq.top().second;
            int d = pq.top().first;
            pq.pop();

            if (d > dist[u]) continue;
            if (u == end) break; // Reached target

            for (const Edge& edge : adjList[u]) {
                string v = edge.to;
                int weight = edge.getWeight();

                if (dist[u] + weight < dist[v]) {
                    dist[v] = dist[u] + weight;
                    parent[v] = u;
                    pq.push({dist[v], v});
                }
            }
        }

        if (dist[end] == numeric_limits<int>::max()) {
            cout << "No path found between " << getNodeName(start) << " and " << getNodeName(end) << ".\n";
            return;
        }

        // Reconstruct path
        vector<string> path;
        for (string at = end; at != ""; at = parent[at]) {
            path.push_back(at);
            if (at == start) break;
        }
        reverse(path.begin(), path.end());

        cout << "\n=== Shortest Path Results ===\n";
        cout << "Total Distance: " << dist[end] << " meters\n";
        cout << "Path Sequence: \n";
        for (size_t i = 0; i < path.size(); ++i) {
            cout << "  " << (i+1) << ". " << getNodeName(path[i]);
            if (i < path.size() - 1) cout << "  ->  \n";
        }
        cout << "\n=============================\n";
    }

    // 2. Kruskal's Algorithm (Minimum Spanning Tree)
    void kruskalMST() {
        vector<Edge> sortedEdges = allEdges;
        sort(sortedEdges.begin(), sortedEdges.end(), [](const Edge& a, const Edge& b) {
            return a.getWeight() < b.getWeight();
        });

        DisjointSet ds;
        for (const auto& pair : nodes) ds.makeSet(pair.first);

        int mstCost = 0;
        vector<Edge> mstEdges;

        for (const Edge& edge : sortedEdges) {
            if (ds.unite(edge.from, edge.to)) {
                mstCost += edge.getWeight();
                mstEdges.push_back(edge);
            }
        }

        cout << "\n=== Minimum Spanning Tree (Kruskal) ===\n";
        cout << "Total Minimum Infrastructure Cost: " << mstCost << " meters\n";
        cout << "Edges in MST: " << mstEdges.size() << "\n";
        for (const Edge& e : mstEdges) {
            cout << "  " << getNodeName(e.from) << " <--> " << getNodeName(e.to) << " [" << e.distance << "m]\n";
        }
        cout << "=======================================\n";
    }

    // 3. Tarjan's Algorithm (Find Bridges / Critical Roads)
    void tarjanBridges() {
        unordered_map<string, int> disc;
        unordered_map<string, int> low;
        unordered_set<string> visited;
        vector<pair<string, string>> bridges;
        int time = 0;

        for (const auto& pair : nodes) {
            if (visited.find(pair.first) == visited.end()) {
                tarjanDFS(pair.first, "", visited, disc, low, time, bridges);
            }
        }

        cout << "\n=== Critical Roads (Tarjan Bridges) ===\n";
        if (bridges.empty()) {
            cout << "No critical bridges found. Campus graph is highly connected!\n";
        } else {
            cout << "Found " << bridges.size() << " critical roads. Blocking these will disconnect parts of the campus:\n";
            for (const auto& bridge : bridges) {
                cout << "  [!] " << getNodeName(bridge.first) << " <--> " << getNodeName(bridge.second) << "\n";
            }
        }
        cout << "=======================================\n";
    }

private:
    void tarjanDFS(string u, string parent, unordered_set<string>& visited,
                   unordered_map<string, int>& disc, unordered_map<string, int>& low,
                   int& time, vector<pair<string, string>>& bridges) {
        visited.insert(u);
        disc[u] = low[u] = ++time;

        for (const Edge& edge : adjList[u]) {
            string v = edge.to;
            if (v == parent) continue;

            if (visited.find(v) != visited.end()) {
                low[u] = min(low[u], disc[v]);
            } else {
                tarjanDFS(v, u, visited, disc, low, time, bridges);
                low[u] = min(low[u], low[v]);
                if (low[v] > disc[u]) {
                    bridges.push_back({u, v});
                }
            }
        }
    }
};

// ── Initialization & Main ────────────────────────────────────

void initializeCampus(CampusGraph& graph) {
    // Add Nodes
    graph.addNode("gate1", "Gate 1 (Main)", "gate");
    graph.addNode("gate2", "Gate 2", "gate");
    graph.addNode("gate3", "Gate 3", "gate");
    graph.addNode("gate4", "Gate 4", "gate");

    graph.addNode("hall2", "Hall 2", "hostel");
    graph.addNode("hall3", "Hall 3", "hostel");
    graph.addNode("hall4", "Hall 4", "hostel");
    graph.addNode("hall7", "Hall 7", "hostel");
    graph.addNode("hall8", "Hall 8", "hostel");
    graph.addNode("hall9", "Hall 9", "hostel");
    graph.addNode("hall10", "Hall 10", "hostel");
    graph.addNode("hall11", "Hall 11", "hostel");
    graph.addNode("hall12", "Hall 12", "hostel");
    graph.addNode("hall13", "Hall 13", "hostel");

    graph.addNode("library", "P.K. Kelkar Library", "academic");
    graph.addNode("lhc_old", "Old LHC", "academic");
    graph.addNode("lhc_new", "New LHC", "academic");
    graph.addNode("cc", "Computer Centre", "academic");
    graph.addNode("faculty_bldg", "Faculty Building", "academic");
    graph.addNode("core_lab", "Core Lab", "academic");
    graph.addNode("new_core_lab", "New Core Lab", "academic");

    graph.addNode("cse", "CSE Dept", "department");
    graph.addNode("aero", "Aerospace Dept", "department");
    graph.addNode("bsbe", "BSBE Dept", "department");
    graph.addNode("ime", "IME Dept", "department");

    graph.addNode("mt_canteen", "MT Canteen", "food");
    graph.addNode("ccafe", "C-Café", "food");
    graph.addNode("nescafe", "Nescafé", "food");

    graph.addNode("auditorium", "Auditorium", "venue");
    graph.addNode("sac", "SAC", "venue");
    graph.addNode("health_centre", "Health Centre", "other");
    graph.addNode("visitors_hostel", "Visitor's Hostel", "other");

    // Add Edges (from, to, dist, congestion, type)
    graph.addEdge("gate1", "visitors_hostel", 200, 1, "main_road");
    graph.addEdge("gate1", "hall3", 400, 3, "main_road");
    graph.addEdge("gate2", "hall7", 450, 2, "main_road");
    graph.addEdge("gate2", "bsbe", 500, 1, "main_road");
    graph.addEdge("gate3", "hall9", 400, 2, "main_road");
    graph.addEdge("gate3", "cse", 500, 1, "main_road");
    graph.addEdge("gate4", "hall10", 400, 1, "main_road");
    graph.addEdge("gate4", "hall11", 350, 1, "main_road");

    graph.addEdge("hall2", "hall3", 250, 2, "walkway");
    graph.addEdge("hall3", "hall4", 250, 2, "walkway");
    graph.addEdge("hall2", "hall12", 300, 1, "walkway");
    graph.addEdge("hall7", "hall8", 200, 1, "walkway");
    graph.addEdge("hall8", "hall9", 250, 1, "walkway");
    graph.addEdge("hall10", "hall11", 300, 1, "walkway");
    graph.addEdge("hall10", "hall13", 300, 1, "walkway");

    graph.addEdge("hall2", "mt_canteen", 300, 3, "walkway");
    graph.addEdge("hall3", "lhc_old", 350, 4, "walkway");
    graph.addEdge("hall4", "auditorium", 300, 2, "walkway");
    graph.addEdge("hall4", "cc", 400, 2, "main_road");
    graph.addEdge("hall7", "new_core_lab", 350, 2, "main_road");
    graph.addEdge("hall7", "bsbe", 350, 1, "main_road");
    graph.addEdge("hall8", "cse", 400, 2, "walkway");
    graph.addEdge("hall9", "cse", 300, 3, "walkway");
    graph.addEdge("hall10", "aero", 350, 1, "walkway");
    graph.addEdge("hall11", "ime", 300, 2, "walkway");
    graph.addEdge("hall12", "health_centre", 250, 1, "walkway");
    graph.addEdge("hall13", "aero", 300, 2, "walkway");

    graph.addEdge("library", "lhc_old", 150, 3, "corridor");
    graph.addEdge("library", "lhc_new", 160, 3, "corridor");
    graph.addEdge("library", "cc", 180, 2, "corridor");
    graph.addEdge("library", "faculty_bldg", 150, 2, "corridor");
    graph.addEdge("library", "core_lab", 130, 2, "corridor");
    graph.addEdge("library", "nescafe", 100, 4, "walkway");
    graph.addEdge("lhc_old", "ccafe", 120, 3, "walkway");
    graph.addEdge("lhc_old", "nescafe", 100, 3, "walkway");
    graph.addEdge("lhc_old", "mt_canteen", 200, 3, "walkway");
    graph.addEdge("lhc_new", "core_lab", 100, 2, "corridor");
    graph.addEdge("lhc_new", "cse", 250, 2, "walkway");
    graph.addEdge("core_lab", "new_core_lab", 200, 1, "corridor");
    graph.addEdge("core_lab", "cse", 200, 2, "walkway");
    graph.addEdge("cc", "new_core_lab", 150, 1, "corridor");
    graph.addEdge("cc", "auditorium", 250, 2, "walkway");
    graph.addEdge("faculty_bldg", "ime", 200, 1, "walkway");
    graph.addEdge("faculty_bldg", "aero", 250, 1, "walkway");
    graph.addEdge("new_core_lab", "bsbe", 250, 1, "walkway");
    graph.addEdge("ccafe", "auditorium", 150, 2, "walkway");
    graph.addEdge("auditorium", "sac", 120, 3, "walkway");
    graph.addEdge("sac", "mt_canteen", 100, 4, "walkway");
    graph.addEdge("nescafe", "ccafe", 120, 3, "walkway");
    graph.addEdge("health_centre", "mt_canteen", 200, 2, "walkway");
    graph.addEdge("visitors_hostel", "hall2", 300, 1, "main_road");
    graph.addEdge("visitors_hostel", "health_centre", 400, 1, "main_road");
    graph.addEdge("hall12", "mt_canteen", 200, 2, "walkway");
}

int main() {
    CampusGraph graph;
    initializeCampus(graph);

    int choice = 0;
    while (choice != 5) {
        cout << "\n============================================\n";
        cout << "      IITK Campus Graph Navigator (C++)     \n";
        cout << "============================================\n";
        cout << "1. Find Shortest Path (Dijkstra)\n";
        cout << "2. Find Minimum Cost Network (Kruskal MST)\n";
        cout << "3. Find Critical Campus Roads (Tarjan Bridges)\n";
        cout << "4. List All Node IDs\n";
        cout << "5. Exit\n";
        cout << "Select an option: ";
        
        if (!(cin >> choice)) {
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            continue;
        }

        switch (choice) {
            case 1: {
                string start, end;
                cout << "Enter Source ID (e.g., hall2): ";
                cin >> start;
                cout << "Enter Destination ID (e.g., cse): ";
                cin >> end;
                graph.dijkstra(start, end);
                break;
            }
            case 2:
                graph.kruskalMST();
                break;
            case 3:
                graph.tarjanBridges();
                break;
            case 4:
                graph.printAllNodes();
                break;
            case 5:
                cout << "Exiting...\n";
                break;
            default:
                cout << "Invalid option. Try again.\n";
        }
    }

    return 0;
}
