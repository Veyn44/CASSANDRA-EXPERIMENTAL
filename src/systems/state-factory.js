import { createPawnConditionState } from './pawn-action-system.js';
import { createGameConfig } from '../core/game-config.js';
import { advanceEnvironment } from './section-manager.js';
import { createTechnicalDecks } from './technical-deck-generator.js';
import {
  DECK_ENVIRONMENT_TAGS,
  FLOOR_LEVELS as DECK_LEVELS,
} from '../ship-floors/floor-registry.js';
import { syncAccessShaftPressureLocks } from './access-shaft-system.js';
import { createBridgeDevScenario } from '../dev/bridge-dev-scenario.js';
const key = (x, y) => x + ',' + y;
export function createInitialState({ mode = 'normal' } = {}) {
  const devScenario = mode === 'dev' ? createBridgeDevScenario() : null;
  const tiles = devScenario?.tiles ?? {
    [key(64, 64)]: {
      hull: true,
      integrity: 100,
      wall: false,
      wallIntegrity: null,
      aluminiumWall: false,
      aluminiumWallIntegrity: null,
    },
  };
  const gameConfig = createGameConfig(mode);
  const objects = devScenario?.objects ?? {};
  const technicalDecks = createTechnicalDecks(tiles, objects);
  const shaftCells = technicalDecks['Z+2']?.shaft ?? [];
  const state = {
    turn: 1,
    day: 1,
    gameConfig,
    controlNetwork: {
      central: {
        role: 'BRIDGE_CONSOLE',
        scope: 'ALL_SECTIONS',
        remoteAccessRequiresIntactIntegrityPath: true,
        integrityPathSimulation: 'NOT_IMPLEMENTED',
      },
      local: { scope: 'ONE_SECTION', worksIndependently: true },
    },
    devMode: gameConfig.unlimitedResources,
    resources: { titanium: 100, aluminium: 0, water: 20, ice: 0, oxygen: 100, hydrogen: 20 },
    activeTool: null,
    selectedPrefab: null,
    selectedObject: null,
    selectedMaterial: 'titanium',
    devCreator: false,
    damageSimulator: { active: false },
    rotation: 0,
    nextObjectId: devScenario?.nextObjectId ?? 1,
    hoverTile: null,
    activeDeck: 'Z0',
    technicalDecks,
    technicalDeckObjects: {
      ...Object.fromEntries(DECK_LEVELS.map((level) => [level, {}])),
      ...(devScenario?.technicalDeckObjects ?? {}),
    },
    deckEnvironmentTags: { ...DECK_ENVIRONMENT_TAGS },
    accessShaft: {
      decks: Object.fromEntries(
        DECK_LEVELS.map((level) => [
          level,
          { manualLock: false, autoLock: false, lockReason: null },
        ])
      ),
      x: devScenario?.shaft.x ?? (shaftCells.length ? Math.min(...shaftCells.map((p) => p.x)) : 0),
      y: devScenario?.shaft.y ?? (shaftCells.length ? Math.min(...shaftCells.map((p) => p.y)) : 0),
      w: 1,
      h: 1,
      cells: shaftCells.map((p) => ({ ...p })),
      locked: false,
      autoLocked: false,
      lockReason: null,
    },
    map: {
      width: 256,
      height: 128,
      tileSize: 28,
      gridVisible: true,
      tiles,
      plans: {},
      objects,
      core: { x: 64, y: 64 },
      anchor: { x: 192, y: 64 },
      asteroid: null,
      asteroidVisibility: null,
    },
    pawn: {
      id: 'researcher-01',
      name: 'Researcher',
      color: '#d76b73',
      deck: 'Z0',
      facing: 0,
      x: 70,
      y: 64,
      level: 1,
      maxOP: 12,
      op: 12,
      selected: true,
      health: 100,
      ...createPawnConditionState(),
      moving: false,
    },
    camera: { x: 73, y: 64, zoom: 1 },
    selection: 'researcher-01',
  };
  advanceEnvironment(state, { initial: true });
  syncAccessShaftPressureLocks(state);
  return state;
}
