import { detectSections } from '../../systems/section-manager.js';
import { detectTechnicalDeckSections } from '../../systems/technical-deck-sections.js';

export function getControlDeviceContext(state, device, deckId = state.activeDeck ?? 'Z0') {
  if (!device || device.built === false) return null;
  if (device.type === 'MOD0005') {
    return {
      deviceId: device.id,
      deviceType: 'BRIDGE_CONSOLE',
      role: 'BRIDGE_CONSOLE',
      scope: 'ALL_SECTIONS',
      deckId: null,
      sectionId: null,
    };
  }
  if (device.type !== 'MOD0014') return null;

  const data = deckId === 'Z0'
    ? detectSections(state)
    : detectTechnicalDeckSections(state, deckId);
  const sectionId = data.tileToSection[device.x + ',' + device.y] ?? null;
  if (!sectionId) return null;
  const adjacentSectionIds = new Set();
  for (const point of data.byId[sectionId].tiles) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = point.x + dx, ny = point.y + dy;
      const neighborId = data.tileToSection[nx + ',' + ny];
      if (neighborId && neighborId !== sectionId) {
        adjacentSectionIds.add(neighborId);
        continue;
      }
      const boundaryKey = nx + ',' + ny;
      const boundaryTile = deckId === 'Z0' ? state.map.tiles[boundaryKey] : state.technicalDecks?.[deckId]?.tiles?.[boundaryKey];
      const boundaryDoor = deckId === 'Z0' && Object.values(state.map.objects).some((object) =>
        ['STR0002', 'STR0003', 'STR0004', 'STR0005'].includes(object.type) && object.built !== false
        && nx >= object.x && ny >= object.y && nx < object.x + object.w && ny < object.y + object.h
      );
      const isBoundary = deckId === 'Z0'
        ? Boolean(boundaryTile?.wall || boundaryTile?.aluminiumWall || boundaryDoor)
        : Boolean(boundaryTile && boundaryTile.walkable !== true);
      if (isBoundary) {
        const acrossId = data.tileToSection[(nx + dx) + ',' + (ny + dy)];
        if (acrossId && acrossId !== sectionId) adjacentSectionIds.add(acrossId);
      }
    }
  }

  return {
    deviceId: device.id,
    deviceType: 'CONTROL_PANEL',
    role: 'LOCAL_CONTROL_PANEL',
    scope: 'LOCAL_ADJACENT_SECTIONS',
    deckId,
    sectionId,
    accessibleSectionIds: [...adjacentSectionIds],
  };
}

export function canAccessSection(control, deckId, sectionId) {
  if (!control || !sectionId) return false;
  if (control.scope === 'ALL_SECTIONS') return true;
  if (control.scope === 'ONE_SECTION')
    return control.deckId === deckId && control.sectionId === sectionId;
  return control.scope === 'LOCAL_ADJACENT_SECTIONS'
    && control.deckId === deckId
    && control.accessibleSectionIds?.includes(sectionId) === true;
}
