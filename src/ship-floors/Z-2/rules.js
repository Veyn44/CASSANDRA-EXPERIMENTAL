import { evaluateDefaultFloorEnvironment } from '../../systems/environment/environment-rules.js';

/** Z-2 environment policy. Extend here when this floor gains unique rules. */
export function evaluateEnvironment(context) {
  return evaluateDefaultFloorEnvironment(context);
}
