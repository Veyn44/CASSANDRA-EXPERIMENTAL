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
  const localTiles = new Set(data.byId[sectionId].tiles.map((point) => point.x + ',' + point.y));
  const adjacentSectionIds = new Set();
  for (const point of data.byId[sectionId].tiles) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const neighborId = data.tileToSection[(point.x + dx) + ',' + (point.y + dy)];
      if (neighborId && neighborId !== sectionId) adjacentSectionIds.add(neighborId);
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
