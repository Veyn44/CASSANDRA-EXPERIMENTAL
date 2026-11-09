import { getModuleRuntime } from '../../../../modules/module-registry.js';
import { trySpendActionAP, getRestState } from '../../../../systems/pawn-action-system.js';

export function createModulesTab(root, state, onChange) {
  let activeModule = null;

  function refresh() {
    const pawn = state.pawn;
    const runtime = activeModule ? getModuleRuntime(activeModule.type) : null;
    const actions = runtime?.getActions?.({ state, pawn, object: activeModule }) ?? [];
    const sleepAction = actions.find((action) => action.id === 'START_SLEEP');
    const restState = getRestState(pawn);
    const maxHours = sleepAction?.maxHours ?? 0;

    root.innerHTML = '<div class="control-menu-placeholder"><h3>' +
      (activeModule ? 'SLEEPING MODULE' : 'MODULE CONTROL') +
      '</h3><p>' +
      (activeModule ? 'PHYSICAL INTERACTION · MOD0006' : 'SELECT A MODULE TO INTERACT') +
      '</p>' +
      (activeModule
        ? '<p>PAWN · ' + pawn.name + '</p><p>REST · ' + pawn.rest + ' · ' + restState.label + '</p>' +
          (sleepAction
            ? '<label class="module-action-field">SLEEP HOURS <input data-sleep-hours type="number" min="1" max="' + maxHours + '" value="' + maxHours + '" step="1"></label>' +
              '<p>ACTIVATION · 1 AP · AVAILABLE SLEEP · ' + maxHours + ' H</p>' +
              '<button type="button" data-start-sleep>START SLEEP</button>'
            : '<p>NO SLEEP ACTION AVAILABLE · CHECK AP OR PENDING SLEEP</p>')
        : '') +
      '</div>';

    root.querySelector('[data-start-sleep]')?.addEventListener('click', () => {
      const input = root.querySelector('[data-sleep-hours]');
      const result = runtime?.executeAction?.({ state, pawn, object: activeModule }, 'START_SLEEP', { hours: Number(input?.value) });
      if (!result?.ok) { onChange(result?.message ?? 'SLEEP ACTION UNAVAILABLE'); refresh(); return; }
      const payment = trySpendActionAP(state, 1);
      if (!payment.ok) { onChange(payment.message); refresh(); return; }
      if (pawn.op < result.hours) {
        onChange('NOT ENOUGH AP FOR SELECTED SLEEP DURATION');
        refresh();
        return;
      }
      pawn.op -= result.hours;
      pawn.pendingSleepHours = result.hours;
      onChange('SLEEP SCHEDULED · ' + result.hours + ' HOURS · ' + (result.hours + 1) + ' AP SPENT');
      refresh();
    });
  }

  return {
    open(module) { activeModule = module ?? null; refresh(); },
    refresh,
    close() { activeModule = null; refresh(); },
  };
}
