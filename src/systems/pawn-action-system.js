export function createPawnConditionState() {
  return {
    rest: 15,
    sleepState: 'AWAKE',
    sleepHoursThisTurn: 0,
    sleepLocation: null,
    sleepingInModuleId: null,
    sleepWakePosition: null,
    sleepForced: false,
    pendingSleepHours: 0,
  };
}

export const REST_STATE = Object.freeze({
  WELL_RESTED: { min: 0, max: 15, failureChance: 0, label: 'WELL RESTED', severity: 0 },
  DEPRIVED: { min: -15, max: -1, failureChance: 20, label: 'DEPRIVED', severity: 1 },
  EXHAUSTED: { min: -30, max: -16, failureChance: 0, forcedSleepChance: 50, label: 'EXHAUSTED', severity: 2 },
});

export function getRestState(pawn) {
  const rest = Math.max(-30, Math.min(15, Number(pawn?.rest ?? 15)));
  if (rest <= -16) return REST_STATE.EXHAUSTED;
  if (rest < 0) return REST_STATE.DEPRIVED;
  return REST_STATE.WELL_RESTED;
}

export function getPawnCondition(pawn) {
  const restState = getRestState(pawn);
  const health = Number(pawn?.health ?? 20);
  const maxHealth = Number(pawn?.maxHealth ?? 20);
  const healthPercent = Number.isFinite(maxHealth) && maxHealth > 0
    ? (health / maxHealth) * 100
    : 0;

  const healthSeverity = healthPercent <= 20 ? 2 : healthPercent < 70 ? 1 : 0;
  const worstSeverity = Math.max(healthSeverity, restState.severity);

  if (worstSeverity >= 2) return 'CRITICAL';
  if (worstSeverity === 1) return 'DEFICIT';
  return 'NORMAL';
}

export function getActionFailureChance(pawn, malfunctionChance = 0) {
  const restChance = getRestState(pawn).failureChance;
  const faultChance = Math.max(0, Math.min(100, Number(malfunctionChance) || 0));
  return Math.min(100, restChance + faultChance);
}

export function startPawnSleep(pawn, { moduleId = null, location = null, forced = false } = {}) {
  if (!pawn || pawn.sleepState === 'SLEEPING') return false;
  const hours = Math.max(0, Math.floor(Number(pawn.op) || 0));
  pawn.sleepState = 'SLEEPING';
  pawn.sleepHoursThisTurn = hours;
  pawn.sleepLocation = location ?? { x: pawn.x, y: pawn.y, deck: pawn.deck ?? 'Z0' };
  if (moduleId && location) {
    pawn.x = location.x;
    pawn.y = location.y;
    pawn.deck = location.deck ?? 'Z0';
  }
  pawn.sleepingInModuleId = moduleId;
  pawn.pendingSleepHours = hours;
  pawn.op = 0;
  pawn.moving = false;
  pawn.sleepForced = Boolean(forced);
  return true;
}

export function trySpendActionAP(state, apCost = 1, { pawn = state?.pawn, malfunctionChance = 0, random = Math.random, allowSleep = false } = {}) {
  const cost = Math.max(0, Math.floor(Number(apCost) || 0));
  if (!pawn || pawn.op < cost) {
    return { ok: false, failed: false, reason: 'NOT_ENOUGH_AP', message: 'NOT ENOUGH AP · ' + cost + ' AP REQUIRED' };
  }
  if (pawn.sleepState === 'SLEEPING') {
    return { ok: false, failed: false, reason: 'PAWN_SLEEPING', message: 'PAWN IS SLEEPING' };
  }
  const restState = getRestState(pawn);
  const faultChance = Math.max(0, Math.min(100, Number(malfunctionChance) || 0));
  const forcedSleepChance = allowSleep ? 0 : (restState.forcedSleepChance ?? 0);
  const actionFailureChance = restState.failureChance;
  const combinedChance = Math.min(100, forcedSleepChance + actionFailureChance + faultChance);
  const roll = combinedChance > 0 ? random() * 100 : 100;
  if (forcedSleepChance > 0 && roll < forcedSleepChance) {
    startPawnSleep(pawn, { forced: true });
    return {
      ok: false, failed: true, forcedSleep: true, failureChance: combinedChance,
      reason: 'PAWN_FELL_ASLEEP',
      message: 'PAWN FELL ASLEEP FROM EXHAUSTION · REMAINING AP CONSUMED',
    };
  }
  pawn.op -= cost;
  if (roll < combinedChance) {
    return {
      ok: false,
      failed: true,
      failureChance: combinedChance,
      apSpent: cost,
      reason: 'ACTION_FAILED',
      message: 'ACTION FAILED · ' + combinedChance + '% FAILURE CHANCE · ' + cost + ' AP SPENT',
    };
  }
  return { ok: true, failed: false, failureChance: combinedChance, apSpent: cost };
}

export function resolvePawnRestForTurn(pawn) {
  if (!pawn) return;
  const sleepHours = Math.max(0, Math.floor(Number(pawn.sleepHoursThisTurn ?? pawn.pendingSleepHours) || 0));
  pawn.rest = Math.max(-30, Math.min(15, (Number(pawn.rest ?? 15) - 3) + sleepHours));
  pawn.pendingSleepHours = 0;
  pawn.sleepHoursThisTurn = 0;
  if (pawn.sleepWakePosition) {
    pawn.x = pawn.sleepWakePosition.x;
    pawn.y = pawn.sleepWakePosition.y;
    pawn.deck = pawn.sleepWakePosition.deck ?? 'Z0';
  }
  pawn.sleepWakePosition = null;
  pawn.sleepState = 'AWAKE';
  pawn.sleepLocation = null;
  pawn.sleepingInModuleId = null;
  pawn.sleepForced = false;
  return { sleepHours, rest: pawn.rest };
}
