// ============================================================
// IITK Campus Graph Data
// 32 real campus locations + 52 road/walkway connections
// Positions approximate the real campus layout on a 1400×900 grid
// ============================================================

const CAMPUS_DATA = {
  nodes: [
    // ── Gates (periphery) ──────────────────────────────
    { id: 'gate1',    name: 'Gate 1 (Main)',       type: 'gate',       x: 700,  y: 870 },
    { id: 'gate2',    name: 'Gate 2',              type: 'gate',       x: 1280, y: 480 },
    { id: 'gate3',    name: 'Gate 3',              type: 'gate',       x: 1100, y: 60  },
    { id: 'gate4',    name: 'Gate 4',              type: 'gate',       x: 80,   y: 380 },

    // ── Hostels (surrounding academic core) ────────────
    { id: 'hall2',    name: 'Hall 2',              type: 'hostel',     x: 480,  y: 680 },
    { id: 'hall3',    name: 'Hall 3',              type: 'hostel',     x: 640,  y: 700 },
    { id: 'hall4',    name: 'Hall 4',              type: 'hostel',     x: 820,  y: 680 },
    { id: 'hall7',    name: 'Hall 7',              type: 'hostel',     x: 1060, y: 380 },
    { id: 'hall8',    name: 'Hall 8',              type: 'hostel',     x: 1060, y: 260 },
    { id: 'hall9',    name: 'Hall 9',              type: 'hostel',     x: 960,  y: 150 },
    { id: 'hall10',   name: 'Hall 10',             type: 'hostel',     x: 200,  y: 260 },
    { id: 'hall11',   name: 'Hall 11',             type: 'hostel',     x: 200,  y: 430 },
    { id: 'hall12',   name: 'Hall 12',             type: 'hostel',     x: 300,  y: 610 },
    { id: 'hall13',   name: 'Hall 13',             type: 'hostel',     x: 280,  y: 160 },

    // ── Academic Buildings (central) ───────────────────
    { id: 'library',      name: 'P.K. Kelkar Library', type: 'academic',   x: 620,  y: 370 },
    { id: 'lhc_old',      name: 'Old LHC',             type: 'academic',   x: 560,  y: 460 },
    { id: 'lhc_new',      name: 'New LHC',             type: 'academic',   x: 720,  y: 300 },
    { id: 'cc',           name: 'Computer Centre',     type: 'academic',   x: 800,  y: 390 },
    { id: 'faculty_bldg', name: 'Faculty Building',    type: 'academic',   x: 490,  y: 330 },
    { id: 'core_lab',     name: 'Core Lab',            type: 'academic',   x: 650,  y: 270 },
    { id: 'new_core_lab', name: 'New Core Lab',        type: 'academic',   x: 840,  y: 300 },

    // ── Departments ────────────────────────────────────
    { id: 'cse',     name: 'CSE Dept',            type: 'department', x: 760,  y: 180 },
    { id: 'aero',    name: 'Aerospace Dept',       type: 'department', x: 440,  y: 230 },
    { id: 'bsbe',    name: 'BSBE Dept',            type: 'department', x: 940,  y: 340 },
    { id: 'ime',     name: 'IME Dept',             type: 'department', x: 360,  y: 380 },

    // ── Food Stalls ────────────────────────────────────
    { id: 'mt_canteen', name: 'MT Canteen',         type: 'food',       x: 560,  y: 570 },
    { id: 'ccafe',      name: 'C-Café',             type: 'food',       x: 700,  y: 480 },
    { id: 'nescafe',    name: 'Nescafé',            type: 'food',       x: 590,  y: 430 },

    // ── Event Venues ───────────────────────────────────
    { id: 'auditorium', name: 'Auditorium',         type: 'venue',      x: 780,  y: 510 },
    { id: 'sac',        name: 'SAC',                type: 'venue',      x: 660,  y: 570 },

    // ── Other Facilities ───────────────────────────────
    { id: 'health_centre',   name: 'Health Centre',     type: 'other', x: 370,  y: 550 },
    { id: 'visitors_hostel', name: "Visitor's Hostel",   type: 'other', x: 580,  y: 770 },
  ],

  // ── Edges: bidirectional roads / walkways / corridors ──
  // distance in metres, congestion 1-5, roadType for visual style
  edges: [
    // Gate → Campus connections
    { from: 'gate1', to: 'visitors_hostel', distance: 200, congestion: 1, roadType: 'main_road' },
    { from: 'gate1', to: 'hall3',           distance: 400, congestion: 3, roadType: 'main_road' },
    { from: 'gate2', to: 'hall7',           distance: 450, congestion: 2, roadType: 'main_road' },
    { from: 'gate2', to: 'bsbe',           distance: 500, congestion: 1, roadType: 'main_road' },
    { from: 'gate3', to: 'hall9',           distance: 400, congestion: 2, roadType: 'main_road' },
    { from: 'gate3', to: 'cse',            distance: 500, congestion: 1, roadType: 'main_road' },
    { from: 'gate4', to: 'hall10',          distance: 400, congestion: 1, roadType: 'main_road' },
    { from: 'gate4', to: 'hall11',          distance: 350, congestion: 1, roadType: 'main_road' },

    // Hostel clusters
    { from: 'hall2',  to: 'hall3',   distance: 250, congestion: 2, roadType: 'walkway' },
    { from: 'hall3',  to: 'hall4',   distance: 250, congestion: 2, roadType: 'walkway' },
    { from: 'hall2',  to: 'hall12',  distance: 300, congestion: 1, roadType: 'walkway' },
    { from: 'hall7',  to: 'hall8',   distance: 200, congestion: 1, roadType: 'walkway' },
    { from: 'hall8',  to: 'hall9',   distance: 250, congestion: 1, roadType: 'walkway' },
    { from: 'hall10', to: 'hall11',  distance: 300, congestion: 1, roadType: 'walkway' },
    { from: 'hall10', to: 'hall13',  distance: 300, congestion: 1, roadType: 'walkway' },

    // Hostel → Academic area
    { from: 'hall2',  to: 'mt_canteen',   distance: 300, congestion: 3, roadType: 'walkway' },
    { from: 'hall3',  to: 'lhc_old',      distance: 350, congestion: 4, roadType: 'walkway' },
    { from: 'hall4',  to: 'auditorium',   distance: 300, congestion: 2, roadType: 'walkway' },
    { from: 'hall4',  to: 'cc',           distance: 400, congestion: 2, roadType: 'main_road' },
    { from: 'hall7',  to: 'new_core_lab', distance: 350, congestion: 2, roadType: 'main_road' },
    { from: 'hall7',  to: 'bsbe',         distance: 350, congestion: 1, roadType: 'main_road' },
    { from: 'hall8',  to: 'cse',          distance: 400, congestion: 2, roadType: 'walkway' },
    { from: 'hall9',  to: 'cse',          distance: 300, congestion: 3, roadType: 'walkway' },
    { from: 'hall10', to: 'aero',         distance: 350, congestion: 1, roadType: 'walkway' },
    { from: 'hall11', to: 'ime',          distance: 300, congestion: 2, roadType: 'walkway' },
    { from: 'hall12', to: 'health_centre', distance: 250, congestion: 1, roadType: 'walkway' },
    { from: 'hall13', to: 'aero',         distance: 300, congestion: 2, roadType: 'walkway' },

    // Academic area internal (corridors & walkways)
    { from: 'library',      to: 'lhc_old',      distance: 150, congestion: 3, roadType: 'corridor' },
    { from: 'library',      to: 'lhc_new',      distance: 160, congestion: 3, roadType: 'corridor' },
    { from: 'library',      to: 'cc',           distance: 180, congestion: 2, roadType: 'corridor' },
    { from: 'library',      to: 'faculty_bldg', distance: 150, congestion: 2, roadType: 'corridor' },
    { from: 'library',      to: 'core_lab',     distance: 130, congestion: 2, roadType: 'corridor' },
    { from: 'library',      to: 'nescafe',      distance: 100, congestion: 4, roadType: 'walkway' },
    { from: 'lhc_old',      to: 'ccafe',        distance: 120, congestion: 3, roadType: 'walkway' },
    { from: 'lhc_old',      to: 'nescafe',      distance: 100, congestion: 3, roadType: 'walkway' },
    { from: 'lhc_old',      to: 'mt_canteen',   distance: 200, congestion: 3, roadType: 'walkway' },
    { from: 'lhc_new',      to: 'core_lab',     distance: 100, congestion: 2, roadType: 'corridor' },
    { from: 'lhc_new',      to: 'cse',          distance: 250, congestion: 2, roadType: 'walkway' },
    { from: 'core_lab',     to: 'new_core_lab', distance: 200, congestion: 1, roadType: 'corridor' },
    { from: 'core_lab',     to: 'cse',          distance: 200, congestion: 2, roadType: 'walkway' },
    { from: 'cc',           to: 'new_core_lab', distance: 150, congestion: 1, roadType: 'corridor' },
    { from: 'cc',           to: 'auditorium',   distance: 250, congestion: 2, roadType: 'walkway' },
    { from: 'faculty_bldg', to: 'ime',          distance: 200, congestion: 1, roadType: 'walkway' },
    { from: 'faculty_bldg', to: 'aero',         distance: 250, congestion: 1, roadType: 'walkway' },
    { from: 'new_core_lab', to: 'bsbe',         distance: 250, congestion: 1, roadType: 'walkway' },
    { from: 'ccafe',        to: 'auditorium',   distance: 150, congestion: 2, roadType: 'walkway' },
    { from: 'auditorium',   to: 'sac',          distance: 120, congestion: 3, roadType: 'walkway' },
    { from: 'sac',          to: 'mt_canteen',   distance: 100, congestion: 4, roadType: 'walkway' },
    { from: 'nescafe',      to: 'ccafe',        distance: 120, congestion: 3, roadType: 'walkway' },
    { from: 'health_centre', to: 'mt_canteen',  distance: 200, congestion: 2, roadType: 'walkway' },
    { from: 'visitors_hostel', to: 'hall2',     distance: 300, congestion: 1, roadType: 'main_road' },
    { from: 'visitors_hostel', to: 'health_centre', distance: 400, congestion: 1, roadType: 'main_road' },
    { from: 'hall12',       to: 'mt_canteen',   distance: 200, congestion: 2, roadType: 'walkway' },
  ],

  // ── Node type metadata (colors, icons) ──────────────
  nodeTypes: {
    gate:       { color: '#ef4444', icon: '🚪', label: 'Gates' },
    hostel:     { color: '#3b82f6', icon: '🏠', label: 'Hostels' },
    academic:   { color: '#8b5cf6', icon: '🏛️', label: 'Academic' },
    department: { color: '#f59e0b', icon: '🔬', label: 'Departments' },
    food:       { color: '#10b981', icon: '🍜', label: 'Food Stalls' },
    venue:      { color: '#ec4899', icon: '🎭', label: 'Venues' },
    other:      { color: '#6b7280', icon: '📍', label: 'Other' },
  },

  // Congestion multiplier → effective travel time = distance × factor
  congestionFactors: { 1: 1.0, 2: 1.3, 3: 1.7, 4: 2.2, 5: 3.0 },
};

// Export globally (no ES modules — loaded via <script>)
window.CAMPUS_DATA = CAMPUS_DATA;
