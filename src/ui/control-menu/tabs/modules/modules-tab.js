import { getModuleRuntime } from '../../../../modules/module-registry.js';
import { getRestState, startPawnSleep } from '../../../../systems/pawn-action-system.js';

export function createModulesTab(root, state, onChange) {
  let activeModule = null;

  function refresh() {
    const pawn = state.pawn;
    const runtime = activeModule ? getModuleRuntime(activeModule.type) : null;
    const actions = runtime?.getActions?.({ state, pawn, object: activeModule }) ?? [];
    const sleepAction = actions.find((action) => action.id === 'SLEEP');
    const restState = getRestState(pawn);
    const sleepingPawn = activeModule?.occupiedBy
      ? (state.pawns ?? [state.pawn]).find((entry) => entry.id === activeModule.occupiedBy)
      : null;
    root.innerHTML =
      '<div class="module-control-card">' +
        '<header class="module-control-heading"><div><small>CREW REST FACILITY · MOD0006</small><h3>SLEEPING MODULE</h3></div>' +
        '<span class="module-state-pill ' + (sleepingPawn ? 'occupied' : 'ready') + '">' + (sleepingPawn ? 'OCCUPIED' : 'READY') + '</span></header>' +
        '<div class="module-selected-pawn"><small>SELECTED CREW MEMBER</small><strong>' + escapeHtml(pawn.name) + '</strong>' +
        '<span>' + (pawn.sleepState === 'SLEEPING' ? 'SLEEPING' : restState.label) + ' · REST ' + pawn.rest + ' / 15</span></div>' +
        (sleepingPawn
          ? '<p class="module-notice">' + escapeHtml(sleepingPawn.name) + ' is currently sleeping here.</p>'
          : sleepAction
            ? '<p class="module-description">The selected crew member will use the bed and sleep for the remainder of this turn.</p><p class="module-ap-cost">REMAINING AP · <b>' + pawn.op + '</b> · ALL AP WILL BE USED</p><button type="button" class="module-primary-action" data-start-sleep>SLEEP <span>→</span></button>'
            : '<p class="module-notice">' + (pawn.sleepState === 'SLEEPING' ? 'This crew member is already asleep.' : 'No sleep action available. Select an awake crew member with remaining AP.') + '</p>') +
      '</div>';

    root.querySelector('[data-start-sleep]')?.addEventListener('click', () => {
      const result = runtime?.executeAction?.({ state, pawn, object: activeModule }, 'SLEEP');
      if (!result?.ok) { onChange(result?.message ?? 'SLEEP ACTION UNAVAILABLE'); refresh(); return; }
      const wakePosition = { x: pawn.x, y: pawn.y, deck: pawn.deck ?? 'Z0' };
      const bedPosition = { x: activeModule.x + Math.floor(activeModule.w / 2), y: activeModule.y + Math.floor(activeModule.h / 2), deck: 'Z0' };
      if (!startPawnSleep(pawn, { moduleId: activeModule.id, location: bedPosition })) {
        onChange('PAWN COULD NOT ENTER SLEEP');
        refresh();
        return;
      }
      pawn.sleepWakePosition = wakePosition;
      activeModule.occupiedBy = pawn.id;
      onChange(pawn.name.toUpperCase() + ' IS SLEEPING · ' + pawn.sleepHoursThisTurn + ' HOURS');
      refresh();
    });
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[char]);
  }

  return {
    open(module) { activeModule = module ?? null; refresh(); },
    refresh,
    close() { activeModule = null; refresh(); },
  };
}
