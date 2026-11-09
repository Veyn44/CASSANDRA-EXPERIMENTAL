import { evaluateDefaultFloorEnvironment } from '../../systems/environment/environment-rules.js';

/** Z-1 environment policy. It does not inherit Z0 state. */
export function evaluateEnvironment(context) {
  return evaluateDefaultFloorEnvironment(context);
}
