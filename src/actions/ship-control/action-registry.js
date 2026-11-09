export const DEFAULT_SHIP_CONTROL_ACTION_AP_COST = 1;

export const SHIP_CONTROL_ACTIONS = Object.freeze({
  VENT_SECTION: Object.freeze({
    id: 'VENT_SECTION',
    label: 'VENT SECTION',
    apCost: 2,
    scope: 'AUTHORIZED_SECTION',
    soundEvent: 'section.atmosphere.vented',
  }),
  COMPLETE_SCAN: Object.freeze({
    id: 'COMPLETE_SCAN',
    label: 'COMPLETE SCAN',
    apCost: 2,
    scope: 'LOCAL_SECTION',
    soundEvent: 'section.scan.completed',
  }),
});

export function getShipControlAction(actionId) {
  return SHIP_CONTROL_ACTIONS[actionId] ?? null;
}
