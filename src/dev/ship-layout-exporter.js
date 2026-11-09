import { getBuildable } from '../systems/prefab-manager.js';
import { TECHNICAL_DECK_LEVELS } from '../ship-floors/floor-registry.js';

const sortTiles = (tiles) => [...tiles].sort((a, b) => a.y - b.y || a.x - b.x || a.type.localeCompare(b.type));
function serializeObjects(registry = {}) {
  return Object.values(registry)
    .map((object) => ({
      id: object.id,
      typeId: object.type,
      name: getBuildable(object.type)?.name ?? object.name ?? object.type,
      x: object.x,
      y: object.y,
      width: object.w,
      height: object.h,
      rotation: object.rotation ?? 0,
      built: object.built !== false,
      ...(object.sectionName ? { sectionName: object.sectionName } : {}),
    }))
    .sort((a, b) =>
      a.y - b.y || a.x - b.x ||
      String(a.typeId).localeCompare(String(b.typeId)) ||
      String(a.id).localeCompare(String(b.id))
    );
}
function serializeZeroTiles(registry = {}) {
  return sortTiles(Object.entries(registry).map(([position, tile]) => {
    const [x, y] = position.split(',').map(Number);
    const type = tile?.aluminiumWall ? 'ALUMINIUM_WALL'
      : tile?.wall ? 'TITANIUM_HULL_WALL'
      : tile?.hull ? 'HULL_FLOOR' : null;
    return type ? { x, y, type } : null;
  }).filter(Boolean));
}
function serializeTechnicalTiles(deck) {
  return sortTiles(Object.entries(deck?.tiles ?? {}).map(([position, tile]) => {
    const [x, y] = position.split(',').map(Number);
    return {
      x, y, type: tile.type ?? 'SHIP_HULL',
      material: tile.material ?? 'SHIP_HULL',
      walkable: tile.walkable === true,
      buildable: tile.buildable === true,
      demolishable: tile.demolishable === true,
      repairable: tile.repairable === true,
      undamageable: tile.undamageable === true,
      airtight: tile.airtight ?? null,
    };
  }));
}

export function exportShipLayout(state, noteText) {
  const zeroTiles = serializeZeroTiles(state.map.tiles);
  const zeroObjects = serializeObjects(state.map.objects);
  const shaft = state.accessShaft ? {
    x: state.accessShaft.x, y: state.accessShaft.y,
    width: state.accessShaft.w ?? 1, height: state.accessShaft.h ?? 1,
  } : null;

  const decks = {
    Z0: {
      level: 'Z0',
      map: { width: state.map.width, height: state.map.height },
      tiles: zeroTiles,
      objects: zeroObjects,
      shaft,
    },
  };
  for (const level of TECHNICAL_DECK_LEVELS) {
    const deck = state.technicalDecks?.[level];
    decks[level] = {
      level,
      source: deck?.source ?? 'Z0',
      environmentTag: deck?.environmentTag ?? state.deckEnvironmentTags?.[level] ?? null,
      footprint: [...(deck?.footprint ?? [])].sort((a, b) => {
        const [ax, ay] = a.split(',').map(Number), [bx, by] = b.split(',').map(Number);
        return ay - by || ax - bx;
      }),
      shaft: (deck?.shaft ?? []).map((point) => ({ x: point.x, y: point.y })),
      tiles: serializeTechnicalTiles(deck),
      objects: serializeObjects(state.technicalDeckObjects?.[level]),
    };
  }

  const layout = {
    format: 'cassandra-ship-layout',
    version: 4,
    map: { width: state.map.width, height: state.map.height },
    shaft,
    decks,
    // Compatibility mirrors for tools that still read the original Z0 top-level fields.
    tiles: zeroTiles,
    objects: zeroObjects,
  };

  const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'cassandra_ship_layout.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  const technicalObjects = TECHNICAL_DECK_LEVELS.reduce(
    (count, level) => count + Object.keys(state.technicalDeckObjects?.[level] ?? {}).length, 0
  );
  noteText(
    'SHIP LAYOUT EXPORTED · 5 DECKS · ' + zeroTiles.length +
    ' Z0 TILES · ' + (zeroObjects.length + technicalObjects) + ' TOTAL OBJECTS'
  );
}
