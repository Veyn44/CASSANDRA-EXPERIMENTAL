import { detectSections } from './section-manager.js';
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
  // The access shaft is a vertical neighbor between Z0 and this technical deck.
  // When either deck's shaft interlock is engaged, the opening is airtight; otherwise
  // both sides share the live Z0 environment because they are one connected volume.
  const shaftPoint = deck.shaft?.[0] ?? null;
  if (shaftPoint) {
    const shaftAccess = state.accessShaft?.decks ?? {};
    const shaftClosed = Boolean(
      shaftAccess.Z0?.autoLock || shaftAccess[deckId]?.autoLock
    );
    const z0Data = detectSections(state);
    const z0SectionId = z0Data.tileToSection[key(shaftPoint.x, shaftPoint.y)];
    const z0Section = z0SectionId ? z0Data.byId[z0SectionId] : null;
    const adjacentTechnicalSections = new Set(
      DIRS.map(([dx, dy]) => tileToSection[key(shaftPoint.x + dx, shaftPoint.y + dy)])
        .filter(Boolean)
    );
    for (const sectionId of adjacentTechnicalSections) {
      const section = byId[sectionId];
      section.verticalNeighbor = {
        deckId: 'Z0',
        sectionId: z0Section?.id ?? null,
        shaftOpen: !shaftClosed,
      };
      if (shaftClosed) {
        // A closed shaft seals the boundary; it does not erase the pressure state
        // maintained independently on either side.
        section.airtightness = 'SEALED';
      } else if (z0Section) {
        // An open shaft makes this section part of the same physical atmosphere as Z0.
        section.airtightness = z0Section.airtightness;
        section.environment = z0Section.environment;
        section.atmosphere = z0Section.atmosphere;
        section.pressure = z0Section.pressure;
        section.temperature = z0Section.temperature;
        section.sharedEnvironment = true;
      }
    }
  }
  for (const section of sections) {
    const activePanel = panels.find((panel) => panel.sectionId === section.id && panel.active);
    const ventOverride = state.technicalDeckEnvironmentOverrides?.[deckId]?.[section.id];
    if (ventOverride && ventOverride.turn === state.turn) {
      section.airtightness = section.airtightness ?? 'STABLE';
      section.environment = 'VACUUM';
      section.atmosphere = 'NONE';
      section.pressure = 'VACUUM';
      section.temperature = -270;
      section.vented = true;
    }
    section.hasActivePanel = Boolean(activePanel);
    section.activePanelId = activePanel?.id ?? null;
    section.stability = activePanel ? 'STABLE' : 'UNSTABILIZED';
    if (!section.sharedEnvironment && !section.vented) {
      section.atmosphere = activePanel ? 'OPTIMAL' : 'NONE';
      section.pressure = activePanel ? 'OPTIMAL' : 'VACUUM';
      section.temperature = activePanel ? 24 : -270;
      section.environment = activePanel ? 'HABITABLE' : 'VACUUM';
      section.airtightness ??= 'STABLE';
      section.cautiousWallCount ??= 0;
      section.criticalWallCount ??= 0;
    }
    // Technical-deck pressure is locally derived until its full integrity simulation is added.
  }
  return { sections, byId, tileToSection, panels };
}
