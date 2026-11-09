/** Z+2 floor structure adapter; kept separate for floor-specific evolution. */
import { createTechnicalDecks } from '../../../systems/technical-deck-generator.js';

export function createFloorStructure(zeroLevelTiles, zeroLevelObjects = {}) {
  return createTechnicalDecks(zeroLevelTiles, zeroLevelObjects)['Z+2'] ?? null;
}
