import { completePlanAction, completeModuleAction } from '../systems/construction-system.js';
import { findDeckPath, findWorkPath, isBlocked, isDeckLocked } from '../systems/navigation.js';
import { syncAccessShaftPressureLocks } from '../systems/access-shaft-system.js';
import { getBuildable } from '../systems/prefab-manager.js';
import { repairAt } from '../systems/repair-system.js';

const key = (x, y) => x + ',' + y;

export function createCommandExecutor(s, refresh, note, objectAt, signal, onDeviceInteract) {
  const inside = (p) => p.x >= 0 && p.y >= 0 && p.x < 256 && p.y < 128;
  function walk(path, done) {
    if (!path || !path.length) { note('NO ACCESSIBLE PATH'); return; }
    if (path.length === 1) { done?.(); return; }
    s.pawn.moving = true;
    let i = 1;
    const step = () => {
      if (signal.aborted) return;
      if (i >= path.length) { s.pawn.moving = false; refresh(); done?.(); return; }
      const point = path[i++];
      const dx = point.x - s.pawn.x;
      const dy = point.y - s.pawn.y;
      if (dx || dy) s.pawn.facing = Math.atan2(dy, dx);
      if (point.deck && point.deck !== (s.pawn.deck ?? 'Z0')) {
        s.pawn.deck = point.deck; s.activeDeck = point.deck;
      }
      s.pawn.x = point.x; s.pawn.y = point.y;
      refresh();
      setTimeout(step, 115);
    };
    setTimeout(step, 115);
  }
  function deviceInteractionPath(object, targetDeck) {
    if (targetDeck === 'Z0' && (s.pawn.deck ?? 'Z0') === 'Z0') {
      const path = findWorkPath(s, object.x, object.y, object.w, object.h);
      return path?.map((point) => ({ ...point, deck: targetDeck })) ?? null;
    }
    let best = null;
    for (let x = object.x - 1; x <= object.x + object.w; x++) {
      for (let y = object.y - 1; y <= object.y + object.h; y++) {
        const onPerimeter = x === object.x - 1 || x === object.x + object.w
          || y === object.y - 1 || y === object.y + object.h;
        if (!onPerimeter) continue;
        const path = findDeckPath(s, { x, y }, targetDeck);
        if (path && (!best || path.length < best.length)) best = path;
      }
    }
    return best;
  }
  function command(p, targetDeck = s.activeDeck) {
    if (!inside(p) || s.pawn.moving) return;
    syncAccessShaftPressureLocks(s);
    if (!s.pawn.selected) { note('SELECT THE RESEARCHER FIRST'); return; }
    const targetObject = objectAt(p);
    if (targetObject && targetObject.built !== false
      && (targetObject.type === 'MOD0014' || targetObject.type === 'MOD0005')) {
      const path = deviceInteractionPath(targetObject, targetDeck);
      if (!path) { note('NO ACCESSIBLE ROUTE TO CONTROL DEVICE'); return; }
      note('RESEARCHER MOVING TO ' + (targetObject.type === 'MOD0005' ? 'BRIDGE CONSOLE' : 'CONTROL PANEL'));
      walk(path, () => {
        note('CONTROL DEVICE REACHED');
        onDeviceInteract?.(targetObject, targetDeck);
        refresh();
      });
      return;
    }
    if (targetDeck !== (s.pawn.deck ?? 'Z0')) {
      if (isDeckLocked(s, s.pawn.deck ?? 'Z0') || isDeckLocked(s, targetDeck)) { note('ACCESS SHAFT LOCKED'); return; }
      const path = findDeckPath(s, p, targetDeck);
      if (!path) { note('NO ACCESSIBLE ROUTE · CHECK SHAFT AND DESTINATION'); return; }
      note('RESEARCHER MOVING THROUGH ACCESS SHAFT');
      walk(path, () => { note('RESEARCHER ARRIVED · ' + targetDeck); refresh(); });
      return;
    }
    const obj = targetDeck === 'Z0' ? objectAt(p) : null;
    if (obj && !obj.built) {
      if (s.pawn.op < 1) { note('NOT ENOUGH AP · 1 AP REQUIRED'); return; }
      const item = getBuildable(obj.type),
        cost = item?.constructionCost ?? { titanium: 1 },
        missing = !s.devMode && !s.gameConfig.freeConstruction
          ? Object.entries(cost).find(([resource, amount]) => (s.resources[resource] ?? 0) < amount)
          : null;
      if (missing) { note('INSUFFICIENT ' + missing[0].toUpperCase()); return; }
      const path = findWorkPath(s, obj.x, obj.y, obj.w, obj.h);
      if (!path) { note('NO ACCESSIBLE WORKING POSITION'); return; }
      note('MOVING TO MODULE BLUEPRINT');
      walk(path.map(point => ({ ...point, deck: targetDeck })), () => {
        const result = completeModuleAction(s, obj.id); note(result.message); refresh();
      });
      return;
    }
    const plan = targetDeck === 'Z0' && ((obj && s.map.plans[key(obj.x, obj.y)]) || s.map.plans[key(p.x, p.y)]);
    if (plan) {
      if (s.pawn.op < 1) { note('NOT ENOUGH AP · 1 AP REQUIRED'); return; }
      const tx = plan.type === 'demolishModule' && obj ? obj.x : p.x, ty = plan.type === 'demolishModule' && obj ? obj.y : p.y;
      const path = findWorkPath(s, tx, ty);
      if (!path) { note('NO ACCESSIBLE WORKING POSITION'); return; }
      note('MOVING TO CONSTRUCTION BLUEPRINT');
      walk(path.map(point => ({ ...point, deck: targetDeck })), () => {
        const result = completePlanAction(s, tx, ty); note(result.message); refresh();
      });
      return;
    }
    if (targetDeck === 'Z0' && isBlocked(s, p.x, p.y)) { note('UNREACHABLE · TARGET IS NOT WALKABLE'); return; }
    const path = findDeckPath(s, p, targetDeck);
    if (!path) { note('NO PATH TO DESTINATION'); return; }
    note('RESEARCHER MOVING · NO AP COST');
    walk(path, () => { note('RESEARCHER ARRIVED · NO AP COST'); refresh(); });
  }
  command.repair = (p) => {
    if (!inside(p) || s.pawn.moving || (s.pawn.deck ?? 'Z0') !== 'Z0') return;
    const scan = s.sectionsUi?.scan;
    if (!scan || scan.turn !== s.turn) return;
    const entry = scan.entries.find((item) => item.x === p.x && item.y === p.y && item.integrity < 100);
    if (!entry) return;
    let target = null, w = 1, h = 1;
    if (entry.targetKind === 'DOOR') {
      target = s.map.objects[entry.targetId];
      w = target?.w ?? 1; h = target?.h ?? 1;
    } else {
      target = s.map.tiles[key(p.x, p.y)];
    }
    if (!target) { note('REPAIR TARGET NO LONGER EXISTS'); return; }
    const path = findWorkPath(s, p.x, p.y, w, h);
    if (!path) { note('NO ACCESSIBLE WORKING POSITION · REPAIR NOT POSSIBLE'); return; }
    note('RESEARCHER MOVING TO REPAIR ' + entry.type);
    walk(path.map((point) => ({ ...point, deck: 'Z0' })), () => {
      const result = repairAt(s, p.x, p.y);
      if (result.handled) note(result.message);
      refresh();
    });
  };
  return command;
}
