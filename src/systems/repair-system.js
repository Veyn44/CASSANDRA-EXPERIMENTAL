import { trySpendActionAP } from './pawn-action-system.js';
const key = (x, y) => x + ',' + y;
export function repairAt(s, x, y) {
  const scan = s.sectionsUi?.scan;
  if (!scan || scan.turn !== s.turn) return { handled: false };
  const entry = scan.entries.find((item) => item.x === x && item.y === y && item.integrity < 100);
  if (!entry) return { handled: false };
  if (s.pawn.op < 1) return { handled: true, ok: false, message: 'NOT ENOUGH AP · 1 AP REQUIRED' };
  let target, field;
  if (entry.targetKind === 'DOOR') { target = s.map.objects[entry.targetId]; field = 'integrity'; }
  else {
    target = s.map.tiles[key(x, y)];
    field = entry.targetKind === 'FLOOR' ? 'integrity' : entry.targetKind === 'ALUMINIUM_WALL' ? 'aluminiumWallIntegrity' : 'wallIntegrity';
  }
  if (!target || (entry.targetKind === 'FLOOR' && !target.hull) || (entry.targetKind === 'HULL_WALL' && !target.wall) || (entry.targetKind === 'ALUMINIUM_WALL' && !target.aluminiumWall))
    return { handled: true, ok: false, message: 'REPAIR TARGET NO LONGER EXISTS' };
  const before = target[field] ?? 100;
  if (before >= 100) return { handled: true, ok: false, message: 'STRUCTURE ALREADY AT 100% INTEGRITY' };
  const payment = trySpendActionAP(s, 1);
  if (!payment.ok) return { handled: true, ...payment };
  const after = Math.min(100, before + 10);
  target[field] = after; entry.integrity = after; entry.repaired = true;
  return { handled: true, ok: true, apSpent: 1, before, after, message: entry.type + ' REPAIRED · ' + before + '% → ' + after + '% · 1 AP SPENT' };
}
