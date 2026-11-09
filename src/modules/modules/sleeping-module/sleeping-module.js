import { defineModuleRuntime } from '../../module-contract.js';

export const sleepingModuleRuntime = defineModuleRuntime({
  id: 'MOD0006',
  createState: () => ({ occupiedBy: null }),
  getActions: ({ pawn, object }) => {
    if (!pawn || (pawn.deck ?? 'Z0') !== 'Z0' || pawn.sleepState === 'SLEEPING') return [];
    if (object?.occupiedBy) return [];
    return pawn.op > 0
      ? [{ id: 'SLEEP', label: 'SLEEP', access: ['physical'] }]
      : [];
  },
  executeAction: ({ pawn, object }, actionId) => {
    if (actionId !== 'SLEEP' || !pawn || !object) return { ok: false, message: 'SLEEP ACTION UNAVAILABLE' };
    if (object.occupiedBy) return { ok: false, message: 'SLEEPING MODULE IS OCCUPIED' };
    if (pawn.sleepState === 'SLEEPING' || pawn.op <= 0) return { ok: false, message: 'PAWN CANNOT START SLEEP' };
    return { ok: true };
  },
});
