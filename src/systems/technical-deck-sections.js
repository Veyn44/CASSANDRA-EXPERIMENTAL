const key = (x, y) => x + ',' + y;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** Detect independent walkable sections on a derived technical deck. */
export function detectTechnicalDeckSections(state, deckId = state.activeDeck) {
  const deck = state.technicalDecks?.[deckId];
  if (!deck) return { sections: [], byId: {}, tileToSection: {}, panels: [] };
  const tiles = deck.tiles ?? {};
  const walkable = (position) => tiles[position]?.walkable === true;
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
      for (const [dx, dy] of DIRS) {
        const nx = point.x + dx, ny = point.y + dy, next = key(nx, ny);
        if (walkable(next) && !seen.has(next)) { seen.add(next); queue.push({ x: nx, y: ny }); }
      }
    }
    const id = deckId + '-SECTION-' + String(sections.length + 1).padStart(2, '0');
    const section = { id, name: 'SECTION ' + String(sections.length + 1).padStart(2, '0'), tiles: cells, tileCount: cells.length, panels: [] };
    sections.push(section); byId[id] = section;
    for (const point of cells) tileToSection[key(point.x, point.y)] = id;
  }
  const objects = state.technicalDeckObjects?.[deckId] ?? {};
  const panels = [];
  for (const object of Object.values(objects)) {
    if (object.type !== 'MOD0014') continue;
    const sectionId = tileToSection[key(object.x, object.y)] ?? null;
    const section = sectionId ? byId[sectionId] : null;
    if (section && object.built !== false) section.panels.push(object);
    panels.push({
      id: object.id, name: object.sectionName ?? section?.name ?? 'UNASSIGNED',
      x: object.x, y: object.y, sectionId,
      active: Boolean(object.built !== false && section && section.tileCount <= 64 && section.panels[0] === object),
      status: object.built === false ? 'BLUEPRINT' : !section ? 'INACTIVE' : section.tileCount > 64 ? 'INACTIVE' : section.panels[0] !== object ? 'INACTIVE' : 'ACTIVE',
      reason: object.built === false ? 'NOT BUILT' : !section ? 'NO POWER ROUTE' : section.tileCount > 64 ? 'CAPACITY EXCEEDED' : section.panels[0] !== object ? 'DUPLICATE PANEL' : '',
    });
  }
  return { sections, byId, tileToSection, panels };
}
