export function createPawnConditionState() {
  return { rest: 15, pendingSleepHours: 0 };
}

export const REST_STATE = Object.freeze({
  WELL_RESTED: { min: 0, max: 15, failureChance: 0, label: 'WELL RESTED' },
  DEPRIVED: { min: -15, max: -1, failureChance: 20, label: 'DEPRIVED' },
  EXHAUSTED: { min: -30, max: -16, failureChance: 50, label: 'EXHAUSTED' },
});

export function getRestState(pawn) {
  const rest = Math.max(-30, Math.min(15, Number(pawn?.rest ?? 15)));
  if (rest <= -16) return REST_STATE.EXHAUSTED;
  if (rest < 0) return REST_STATE.DEPRIVED;
  return REST_STATE.WELL_RESTED;
}

export function getActionFailureChance(pawn, malfunctionChance = 0) {
  const restChance = getRestState(pawn).failureChance;
  const faultChance = Math.max(0, Math.min(100, Number(malfunctionChance) || 0));
  return Math.min(100, restChance + faultChance);
}

export function trySpendActionAP(state, apCost = 1, { pawn = state?.pawn, malfunctionChance = 0, random = Math.random } = {}) {
  const cost = Math.max(0, Math.floor(Number(apCost) || 0));
  if (!pawn || pawn.op < cost) {
    return { ok: false, failed: false, reason: 'NOT_ENOUGH_AP', message: 'NOT ENOUGH AP · ' + cost + ' AP REQUIRED' };
  }
  const failureChance = getActionFailureChance(pawn, malfunctionChance);
  pawn.op -= cost;
  if (failureChance > 0 && random() * 100 < failureChance) {
    return {
      ok: false,
      failed: true,
      failureChance,
      apSpent: cost,
      reason: 'ACTION_FAILED',
      message: 'ACTION FAILED · ' + failureChance + '% FAILURE CHANCE · ' + cost + ' AP SPENT',
    };
  }
  return { ok: true, failed: false, failureChance, apSpent: cost };
}

export function resolvePawnRestForTurn(pawn) {
  if (!pawn) return;
  const sleepHours = Math.max(0, Math.floor(Number(pawn.pendingSleepHours) || 0));
  pawn.rest = Math.max(-30, Math.min(15, (Number(pawn.rest ?? 15) - 3) + sleepHours));
  pawn.pendingSleepHours = 0;
  return { sleepHours, rest: pawn.rest };
}
