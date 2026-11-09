import { detectSections } from './section-manager.js';
import { detectTechnicalDeckSections } from './technical-deck-sections.js';

/**
 * Read Z0 pressure state and derive the access-shaft safety interlock.
 * This module never advances or mutates the atmosphere simulation.
 */
export function syncAccessShaftPressureLocks(state) {
  const shaft = state.accessShaft;
  if (!shaft?.decks) return;

  const data = detectSections(state);
  const adjacentSections = new Map();
  for (const cell of shaft.cells ?? []) {
    const sectionId = data.tileToSection[cell.x + ',' + cell.y];
    const section = sectionId ? data.byId[sectionId] : null;
    if (section) adjacentSections.set(section.id, section);
  }

  const z0 = shaft.decks.Z0;
  const technical = detectTechnicalDeckSections(state, 'Z-1');
  const shaftPoint = state.technicalDecks?.['Z-1']?.shaft?.[0];
  const technicalAdjacent = new Set(
    shaftPoint ? [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .map(([dx, dy]) => technical.tileToSection[(shaftPoint.x + dx) + ',' + (shaftPoint.y + dy)])
      .filter(Boolean) : []
  );
  const z0Sections = [...adjacentSections.values()];
  const technicalSections = [...technicalAdjacent].map((id) => technical.byId[id]).filter(Boolean);
  const pressurePairs = z0Sections.flatMap((lower) => technicalSections.map((upper) => ({ lower, upper })));
  const mismatch = pressurePairs.filter(({ lower, upper }) => lower.pressure !== upper.pressure);
  if (z0) {
    z0.autoLock = pressurePairs.length === 0 || mismatch.length > 0;
    z0.lockReason = z0.autoLock
      ? pressurePairs.length === 0
        ? 'PRESSURE DATA UNAVAILABLE'
        : 'PRESSURE MISMATCH · ' + mismatch.map(({ lower, upper }) => lower.pressure + ' / ' + upper.pressure).join(' · ')
      : null;
  }

  // Compatibility fields are retained for older UI and save-state consumers.
  shaft.autoLocked = Boolean(z0?.autoLock);
  shaft.locked = Boolean(z0?.autoLock);
  shaft.lockReason = z0?.lockReason ?? null;
}
