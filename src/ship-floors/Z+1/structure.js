/**
 * Z+1 currently uses the legacy technical-deck footprint.
 * This adapter is intentionally isolated per floor so its generation rules can
 * diverge without changing other floors. The legacy generator remains the
 * implementation until the structural-data migration is completed.
 */
import { createTechnicalDecks } from '../../../systems/technical-deck-generator.js';

export function createFloorStructure(zeroLevelTiles, zeroLevelObjects = {}) {
  return createTechnicalDecks(zeroLevelTiles, zeroLevelObjects)['Z+1'] ?? null;
}
