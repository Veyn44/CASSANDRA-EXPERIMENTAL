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

  return {
    deviceId: device.id,
    deviceType: 'CONTROL_PANEL',
    role: 'LOCAL_CONTROL_PANEL',
    scope: 'ONE_SECTION',
    deckId,
    sectionId,
  };
}

export function canAccessSection(control, deckId, sectionId) {
  if (!control || !sectionId) return false;
  if (control.scope === 'ALL_SECTIONS') return true;
  return control.scope === 'ONE_SECTION'
    && control.deckId === deckId
    && control.sectionId === sectionId;
}
