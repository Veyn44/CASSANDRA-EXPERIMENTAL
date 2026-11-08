import { getBuildable } from '../systems/prefab-manager.js';

export function exportShipLayout(state, noteText) {
  const tiles = Object.entries(state.map.tiles ?? {})
    .map(([position, tile]) => {
      const [x, y] = position.split(',').map(Number);
      const type = tile?.aluminiumWall
        ? 'ALUMINIUM_WALL'
        : tile?.wall
          ? 'TITANIUM_HULL_WALL'
          : tile?.hull
            ? 'HULL_FLOOR'
            : null;
      return type ? { x, y, type } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.y - b.y || a.x - b.x || a.type.localeCompare(b.type));

  const objects = Object.values(state.map.objects ?? {})
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
    }))
    .sort(
      (a, b) =>
        a.y - b.y ||
        a.x - b.x ||
        String(a.typeId).localeCompare(String(b.typeId)) ||
        String(a.id).localeCompare(String(b.id))
    );

  const shaft = state.accessShaft
    ? {
        x: state.accessShaft.x,
        y: state.accessShaft.y,
        width: state.accessShaft.w ?? 1,
        height: state.accessShaft.h ?? 1,
      }
    : null;

  const layout = {
    format: 'cassandra-ship-layout',
    version: 3,
    map: { width: state.map.width, height: state.map.height },
    tiles,
    objects,
    shaft,
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

  const tileCounts = tiles.reduce((counts, tile) => {
    counts[tile.type] = (counts[tile.type] ?? 0) + 1;
    return counts;
  }, {});
  noteText(
    'SHIP LAYOUT EXPORTED · ' +
      (tileCounts.HULL_FLOOR ?? 0) +
      ' FLOOR · ' +
      (tileCounts.TITANIUM_HULL_WALL ?? 0) +
      ' TITANIUM WALL · ' +
      (tileCounts.ALUMINIUM_WALL ?? 0) +
      ' ALUMINIUM WALL · ' +
      objects.length +
      ' OBJECTS'
  );
}
