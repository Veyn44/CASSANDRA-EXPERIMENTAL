import { getPawnCondition, getRestState } from '../systems/pawn-action-system.js';

export function createPawnInfoPanel(root, state) {
  function render() {
    if (!root) return;
    const pawn = state.pawn;
    const restState = getRestState(pawn);
    const condition = getPawnCondition(pawn);
    const sleeping = pawn.sleepState === 'SLEEPING';
    root.innerHTML =
      '<div class="pawn-info-window" role="dialog" aria-modal="true" aria-labelledby="pawn-info-title">' +
        '<header><div><small>CREW PERSONNEL FILE</small><h2 id="pawn-info-title">' + escapeHtml(pawn.name) + '</h2></div><button type="button" data-pawn-info-close aria-label="Close">×</button></header>' +
        '<div class="pawn-info-status ' + condition.toLowerCase() + '"><span>CONDITION</span><strong>' + condition + '</strong></div>' +
        '<div class="pawn-info-grid">' +
          metric('LEVEL', String(pawn.level ?? 1).padStart(2, '0')) +
          metric('HEALTH', (pawn.health ?? 20) + ' / ' + (pawn.maxHealth ?? 20)) +
          metric('ACTION POINTS', (pawn.op ?? 0) + ' / ' + (pawn.maxOP ?? 12)) +
          metric('REST', pawn.rest + ' / 15') +
          metric('REST STATE', restState.label) +
          metric('SLEEP STATUS', sleeping ? 'SLEEPING' : 'AWAKE') +
          metric('LOCATION', (pawn.deck ?? 'Z0') + ' · ' + pawn.x + ', ' + pawn.y) +
          metric('SLEEP DURATION', sleeping ? (pawn.sleepHoursThisTurn ?? 0) + ' H' : '—') +
        '</div>' +
        (sleeping ? '<p class="pawn-info-warning">MOVEMENT LOCKED · ANOTHER ENTITY MUST MOVE THIS PAWN</p>' : '') +
      '</div>';
    root.querySelector('[data-pawn-info-close]')?.addEventListener('click', close);
    root.onclick = (event) => { if (event.target === root) close(); };
  }
  function metric(label, value) {
    return '<div class="pawn-info-metric"><small>' + label + '</small><strong>' + escapeHtml(value) + '</strong></div>';
  }
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[char]);
  }
  function close() { root.hidden = true; state.pawnInfoOpen = false; }
  return {
    open() { state.pawnInfoOpen = true; root.hidden = false; render(); },
    refresh() { if (state.pawnInfoOpen) render(); },
    close,
  };
}
