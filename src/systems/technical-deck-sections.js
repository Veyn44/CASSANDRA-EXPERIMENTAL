const key = (x, y) => x + ',' + y;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAGONALS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

/** Detect independent walkable sections on a derived technical deck. */
export function detectTechnicalDeckSections(state, deckId = state.activeDeck) {
  const deck = state.technicalDecks?.[deckId];
  if (!deck) return { sections: [], byId: {}, tileToSection: {}, panels: [] };
  const tiles = deck.tiles ?? {};
  const walkable = (position) => tiles[position]?.walkable === true;
  const shaft = deck.shaft?.[0] ?? null;
  const insideShaftRadius = (x, y) =>
    Boolean(shaft && Math.abs(x - shaft.x) <= 1 && Math.abs(y - shaft.y) <= 1);
  const neighbors = (point) => {
    const adjacent = [...DIRS];
    // Diagonal connectivity is a local exception around the ladder only.
    // This joins the four shaft approaches without merging rooms diagonally elsewhere.
    if (insideShaftRadius(point.x, point.y)) {
      for (const [dx, dy] of DIAGONALS) {
        const nx = point.x + dx, ny = point.y + dy;
        if (insideShaftRadius(nx, ny)) adjacent.push([dx, dy]);
      }
    }
    return adjacent;
  };
  const seen = new Set(), sections = [], byId = {}, tileToSection = {};
  for (const position of Object.keys(tiles).sort((a, b) => {
    const [ax, ay] = a.split(',').map(Number), [bx, by] = b.split(',').map(Number);
    return ay - by || ax - bx;
  })) {
    if (!walkable(position) || seen.has(position)) continue;
    const [x, y] = position.split(',').map(Number), queue = [{ x, y }], cells = [];
    seen.add(position);
    for (let i = 0; i < queue.length; i++) {
      const point = queue[i]; cells.push(point);
      for (const [dx, dy] of neighbors(point)) {
        const nx = point.x + dx, ny = point.y + dy, next = key(nx, ny);
        if (walkable(next) && !seen.has(next)) { seen.add(next); queue.push({ x: nx, y: ny }); }
      }
    }
    const id = deckId + '-SECTION-' + String(sections.length + 1).padStart(2, '0');
    const section = { id, name: 'SECTION ' + String(sections.length + 1).padStart(2, '0'), tiles: cells, tileCount: cells.length, panels: [], hasActivePanel: false, stability: 'UNSTABILIZED', environment: 'UNMANAGED', atmosphere: 'NOT SIMULATED', pressure: 'NOT SIMULATED', temperature: null };
    sections.push(section); byId[id] = section;
    for (const point of cells) tileToSection[key(point.x, point.y)] = id;
  }
  const objects = state.technicalDeckObjects?.[deckId] ?? {};
  const panels = [];
  for (const object of Object.values(objects)) {
    if (object.type !== 'MOD0014') continue;
    const sectionId = tileToSection[key(object.x, object.y)] ?? null;
    const section = sectionId ? byId[sectionId] : null;
    if (section && object.built !== false) {
      section.panels.push(object);
      if (object.sectionName) section.name = object.sectionName;
    }
    panels.push({
      id: object.id, name: object.sectionName ?? section?.name ?? 'UNASSIGNED',
      x: object.x, y: object.y, sectionId,
      active: Boolean(object.built !== false && section && section.tileCount <= 64 && section.panels[0] === object),
      status: object.built === false ? 'BLUEPRINT' : !section ? 'INACTIVE' : section.tileCount > 64 ? 'INACTIVE' : section.panels[0] !== object ? 'INACTIVE' : 'ACTIVE',
      reason: object.built === false ? 'NOT BUILT' : !section ? 'NO POWER ROUTE' : section.tileCount > 64 ? 'CAPACITY EXCEEDED' : section.panels[0] !== object ? 'DUPLICATE PANEL' : '',
    });
  }
  for (const section of sections) {
    const activePanel = panels.find((panel) => panel.sectionId === section.id && panel.active);
    section.hasActivePanel = Boolean(activePanel);
    section.activePanelId = activePanel?.id ?? null;
    section.stability = activePanel ? 'STABLE' : 'UNSTABILIZED';
    section.environment = activePanel ? 'CONTROLLED' : 'UNMANAGED';
    // Atmosphere, pressure and temperature are deliberately not simulated on technical decks yet.
  }
  return { sections, byId, tileToSection, panels };
}
