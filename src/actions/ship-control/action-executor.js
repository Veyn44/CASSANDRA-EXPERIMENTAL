import { completeSectionScan } from '../../systems/section-manager.js';
import { getShipControlAction } from './action-registry.js';
import { canAccessSection } from './control-access.js';

export function executeShipControlAction(state, actionId, context = {}) {
  const action = getShipControlAction(actionId);
  if (!action) return { ok: false, message: 'UNKNOWN SHIP CONTROL ACTION' };

  if (action.scope === 'LOCAL_SECTION' && !canAccessSection(context.control, context.deckId, context.section?.id)) {
    return { ok: false, message: 'CONTROL DEVICE NOT AUTHORIZED FOR THIS SECTION' };
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
