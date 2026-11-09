import { evaluateDefaultFloorEnvironment } from '../../systems/environment/environment-rules.js';

/** Z0 environment policy; current Z0 simulation remains in section-manager. */
export function evaluateEnvironment(context) {
  return evaluateDefaultFloorEnvironment(context);
}
