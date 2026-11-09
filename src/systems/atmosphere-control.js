import { detectSections, pressureStates } from './section-manager.js';
import { detectTechnicalDeckSections } from './technical-deck-sections.js';
import { trySpendActionAP } from './pawn-action-system.js';

const signature = (section) => section.tiles.map((point) => point.x + ',' + point.y).sort().join('|');

export function ventSection(state, deckId, section) {
  if (!section) return { ok: false, message: 'NO SECTION SELECTED' };
  const payment = trySpendActionAP(state, 2);
  if (!payment.ok) return payment;
  if (deckId === 'Z0') {
    const current = detectSections(state).byId[section.id];
    if (!current) return { ok: false, message: 'SECTION NO LONGER EXISTS' };
    state.environmentState ??= {};
    const key = signature(current);
    state.environmentState[key] = {
      ...(state.environmentState[key] ?? {}),
      atmosphere: 'NONE', pressure: 'VACUUM', temperature: -270,
      environment: 'VACUUM', locked: false,
    };
  } else {
    const current = detectTechnicalDeckSections(state, deckId).byId[section.id];
    if (!current) return { ok: false, message: 'SECTION NO LONGER EXISTS' };
    state.technicalDeckEnvironmentOverrides ??= {};
    state.technicalDeckEnvironmentOverrides[deckId] ??= {};
    state.technicalDeckEnvironmentOverrides[deckId][section.id] = { turn: state.turn };
  }
  return { ok: true, apSpent: 2, sectionId: section.id, message: 'ATMOSPHERE VENTED · VACUUM ESTABLISHED · 2 AP SPENT' };
}

export function getPressureStateList() {
  return pressureStates();
}
