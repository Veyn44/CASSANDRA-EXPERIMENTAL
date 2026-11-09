import { completeSectionScan } from '../../systems/section-manager.js';
import { getShipControlAction } from './action-registry.js';

export function executeShipControlAction(state, actionId, context = {}) {
  const action = getShipControlAction(actionId);
  if (!action) return { ok: false, message: 'UNKNOWN SHIP CONTROL ACTION' };

  if (action.scope === 'LOCAL_SECTION' && !context.section) {
    return { ok: false, message: 'NO AUTHORIZED SECTION SELECTED' };
  }

  let result;
  switch (actionId) {
    case 'COMPLETE_SCAN':
      result = completeSectionScan(state, context.section);
      break;
    default:
      return { ok: false, message: 'SHIP CONTROL ACTION NOT IMPLEMENTED' };
  }

  return result.ok
    ? { ...result, actionId, soundEvent: action.soundEvent }
    : result;
}
