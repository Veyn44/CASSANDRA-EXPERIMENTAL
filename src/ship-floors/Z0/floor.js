import { createFloorStructure } from './structure.js';
import { createFloorObjects } from './objects.js';
import { evaluateEnvironment } from './rules.js';

/** Public module boundary for Z0. */
export const floor = Object.freeze({
  id: 'Z0',
  createStructure: createFloorStructure,
  createObjects: createFloorObjects,
  evaluateEnvironment,
});
