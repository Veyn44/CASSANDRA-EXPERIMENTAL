import { evaluateEnvironment as evaluateZPlus2 } from './Z+2/rules.js';
import { evaluateEnvironment as evaluateZPlus1 } from './Z+1/rules.js';
import { evaluateEnvironment as evaluateZ0 } from './Z0/rules.js';
import { evaluateEnvironment as evaluateZMinus1 } from './Z-1/rules.js';
import { evaluateEnvironment as evaluateZMinus2 } from './Z-2/rules.js';

/** Canonical vertical order, used by navigation and deck-aware systems. */
export const FLOOR_LEVELS = Object.freeze(['Z+2', 'Z+1', 'Z0', 'Z-1', 'Z-2']);

/** Floors currently generated as technical decks from the Z0 footprint. */
export const TECHNICAL_DECK_LEVELS = Object.freeze(['Z+2', 'Z+1', 'Z-1', 'Z-2']);

export const DECK_ENVIRONMENT_TAGS = Object.freeze({
  'Z+2': 'DESTRUCTIBLE',
  'Z+1': 'INDESTRUCTIBLE',
  Z0: 'DESTRUCTIBLE',
  'Z-1': 'INDESTRUCTIBLE',
  'Z-2': 'DESTRUCTIBLE',
});

/**
 * Floor metadata and rule entry points.
 *
 * Structural data is deliberately not defined here yet. It will be stored
 * separately per floor in the next structural-data stage.
 */
export const FLOOR_REGISTRY = Object.freeze({
  'Z+2': Object.freeze({
    id: 'Z+2',
    environmentTag: DECK_ENVIRONMENT_TAGS['Z+2'],
    evaluateEnvironment: evaluateZPlus2,
  }),
  'Z+1': Object.freeze({
    id: 'Z+1',
    environmentTag: DECK_ENVIRONMENT_TAGS['Z+1'],
    evaluateEnvironment: evaluateZPlus1,
  }),
  Z0: Object.freeze({
    id: 'Z0',
    environmentTag: DECK_ENVIRONMENT_TAGS.Z0,
    evaluateEnvironment: evaluateZ0,
  }),
  'Z-1': Object.freeze({
    id: 'Z-1',
    environmentTag: DECK_ENVIRONMENT_TAGS['Z-1'],
    evaluateEnvironment: evaluateZMinus1,
  }),
  'Z-2': Object.freeze({
    id: 'Z-2',
    environmentTag: DECK_ENVIRONMENT_TAGS['Z-2'],
    evaluateEnvironment: evaluateZMinus2,
  }),
});

export function getFloorDefinition(floorId) {
  return FLOOR_REGISTRY[floorId] ?? null;
}
