import { defineModuleRuntime } from '../../module-contract.js';

export const sleepingModuleRuntime = defineModuleRuntime({
  id: 'MOD0006',
  createState: () => ({}),
  getActions: ({ pawn }) => {
    if (!pawn || pawn.deck !== 'Z0') return [];
    const availableHours = Math.max(0, Math.min(11, pawn.op - 1));
    return availableHours > 0
      ? [{ id: 'START_SLEEP', label: 'SLEEP', apCost: 1, maxHours: availableHours, access: ['physical'] }]
      : [];
  },
  executeAction: ({ pawn }, actionId, payload = {}) => {
    if (actionId !== 'START_SLEEP' || !pawn) return { ok: false, message: 'UNKNOWN SLEEP ACTION' };
    const hours = Math.floor(Number(payload.hours) || 0);
    const maxHours = Math.max(0, Math.min(11, pawn.op - 1));
    if (hours < 1 || hours > maxHours)
      return { ok: false, message: 'INVALID SLEEP DURATION' };
    return { ok: true, hours };
  },
});
