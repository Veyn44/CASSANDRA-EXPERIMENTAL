import { createFloorStructure } from './structure.js';
import { createFloorObjects } from './objects.js';
import { evaluateEnvironment } from './rules.js';

/** Public module boundary for Z+1. */
export const floor = Object.freeze({
  id: 'Z+1',
  createStructure: createFloorStructure,
  createObjects: createFloorObjects,
  evaluateEnvironment,
});
