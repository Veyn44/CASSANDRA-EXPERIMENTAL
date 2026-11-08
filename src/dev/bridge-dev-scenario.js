import { getBuildable } from '../systems/prefab-manager.js';

// Bridge-deck starting layout imported from cassandra_ship_layout.json (format v3).
// This scenario intentionally defines Z0 only. Technical decks are derived separately.
const TILE_LAYOUT = [
  [65,60,'TITANIUM_HULL_WALL'],[66,60,'TITANIUM_HULL_WALL'],[67,60,'TITANIUM_HULL_WALL'],[68,60,'TITANIUM_HULL_WALL'],[69,60,'TITANIUM_HULL_WALL'],[70,60,'TITANIUM_HULL_WALL'],[71,60,'TITANIUM_HULL_WALL'],[72,60,'TITANIUM_HULL_WALL'],[73,60,'TITANIUM_HULL_WALL'],[74,60,'TITANIUM_HULL_WALL'],
  [63,61,'TITANIUM_HULL_WALL'],[64,61,'TITANIUM_HULL_WALL'],[65,61,'TITANIUM_HULL_WALL'],[66,61,'HULL_FLOOR'],[67,61,'HULL_FLOOR'],[68,61,'HULL_FLOOR'],[69,61,'HULL_FLOOR'],[70,61,'HULL_FLOOR'],[71,61,'ALUMINIUM_WALL'],[72,61,'HULL_FLOOR'],[73,61,'HULL_FLOOR'],[74,61,'TITANIUM_HULL_WALL'],[75,61,'TITANIUM_HULL_WALL'],
  [63,62,'TITANIUM_HULL_WALL'],[64,62,'HULL_FLOOR'],[65,62,'HULL_FLOOR'],[66,62,'HULL_FLOOR'],[67,62,'HULL_FLOOR'],[68,62,'HULL_FLOOR'],[69,62,'HULL_FLOOR'],[70,62,'HULL_FLOOR'],[71,62,'ALUMINIUM_WALL'],[72,62,'HULL_FLOOR'],[73,62,'HULL_FLOOR'],[74,62,'HULL_FLOOR'],[75,62,'TITANIUM_HULL_WALL'],[76,62,'TITANIUM_HULL_WALL'],
  [63,63,'TITANIUM_HULL_WALL'],[64,63,'HULL_FLOOR'],[65,63,'HULL_FLOOR'],[66,63,'HULL_FLOOR'],[67,63,'HULL_FLOOR'],[68,63,'HULL_FLOOR'],[69,63,'HULL_FLOOR'],[70,63,'HULL_FLOOR'],[71,63,'HULL_FLOOR'],[72,63,'HULL_FLOOR'],[73,63,'HULL_FLOOR'],[74,63,'HULL_FLOOR'],[75,63,'HULL_FLOOR'],[76,63,'TITANIUM_HULL_WALL'],
  [63,64,'TITANIUM_HULL_WALL'],[64,64,'HULL_FLOOR'],[65,64,'HULL_FLOOR'],[66,64,'HULL_FLOOR'],[67,64,'HULL_FLOOR'],[68,64,'HULL_FLOOR'],[69,64,'HULL_FLOOR'],[70,64,'HULL_FLOOR'],[71,64,'HULL_FLOOR'],[72,64,'HULL_FLOOR'],[73,64,'HULL_FLOOR'],[74,64,'HULL_FLOOR'],[75,64,'HULL_FLOOR'],[76,64,'TITANIUM_HULL_WALL'],
  [63,65,'TITANIUM_HULL_WALL'],[64,65,'ALUMINIUM_WALL'],[65,65,'ALUMINIUM_WALL'],[66,65,'ALUMINIUM_WALL'],[67,65,'HULL_FLOOR'],[68,65,'HULL_FLOOR'],[69,65,'HULL_FLOOR'],[70,65,'HULL_FLOOR'],[71,65,'ALUMINIUM_WALL'],[72,65,'HULL_FLOOR'],[73,65,'ALUMINIUM_WALL'],[74,65,'ALUMINIUM_WALL'],[75,65,'TITANIUM_HULL_WALL'],[76,65,'TITANIUM_HULL_WALL'],
  [63,66,'TITANIUM_HULL_WALL'],[64,66,'TITANIUM_HULL_WALL'],[65,66,'TITANIUM_HULL_WALL'],[66,66,'ALUMINIUM_WALL'],[67,66,'ALUMINIUM_WALL'],[68,66,'ALUMINIUM_WALL'],[69,66,'ALUMINIUM_WALL'],[70,66,'ALUMINIUM_WALL'],[71,66,'ALUMINIUM_WALL'],[72,66,'ALUMINIUM_WALL'],[73,66,'ALUMINIUM_WALL'],[74,66,'TITANIUM_HULL_WALL'],[75,66,'TITANIUM_HULL_WALL'],
  [65,67,'TITANIUM_HULL_WALL'],[66,67,'TITANIUM_HULL_WALL'],[67,67,'TITANIUM_HULL_WALL'],[68,67,'TITANIUM_HULL_WALL'],[69,67,'TITANIUM_HULL_WALL'],[70,67,'TITANIUM_HULL_WALL'],[71,67,'TITANIUM_HULL_WALL'],[72,67,'TITANIUM_HULL_WALL'],[73,67,'TITANIUM_HULL_WALL'],[74,67,'TITANIUM_HULL_WALL'],
];

const OBJECT_LAYOUT = [
  ['build-17','MOD0003',63,55,2,3,3],
  ['build-14','STR0001',64,55,1,1,0],
  ['build-13','STR0001',64,56,1,1,0],
  ['build-12','STR0001',64,57,1,1,0],
  ['build-16','MOD0003',63,58,2,3,3],
  ['build-11','STR0001',64,58,1,1,0],
  ['build-10','STR0001',64,59,1,1,0],
  ['build-9','STR0001',64,60,1,1,0],
  ['build-2','ENR0002',64,61,1,1,0],
  ['build-23','MOD0007',68,61,3,2,0],
  ['build-24','MOD0011',72,61,2,1,0],
  ['build-15','STR0005',71,63,1,2,3],
  ['build-20','MOD0005',74,63,2,2,0],
  ['build-22','MOD0014',67,65,1,1,2],
  ['build-25','MOD0006',69,65,2,1,0],
  ['build-21','MOD0014',72,65,1,1,2],
  ['build-1','ENR0002',64,66,1,1,0],
  ['build-18','MOD0003',63,67,2,3,3],
  ['build-3','STR0001',64,67,1,1,0],
  ['build-4','STR0001',64,68,1,1,0],
  ['build-5','STR0001',64,69,1,1,0],
  ['build-19','MOD0003',63,70,2,3,3],
  ['build-6','STR0001',64,70,1,1,0],
  ['build-7','STR0001',64,71,1,1,0],
  ['build-8','STR0001',64,72,1,1,0],
];

const key = (x, y) => x + ',' + y;

export function createBridgeDevScenario() {
  const tiles = {};
  for (const [x, y, type] of TILE_LAYOUT) {
    tiles[key(x, y)] = {
      hull: true,
      integrity: 100,
      wall: type === 'TITANIUM_HULL_WALL',
      wallIntegrity: type === 'TITANIUM_HULL_WALL' ? 100 : null,
      aluminiumWall: type === 'ALUMINIUM_WALL',
      aluminiumWallIntegrity: type === 'ALUMINIUM_WALL' ? 100 : null,
    };
  }

  const objects = {};
  for (const [id, type, x, y, w, h, rotation] of OBJECT_LAYOUT) {
    const prefab = getBuildable(type);
    objects[id] = {
      id,
      type,
      family: type.slice(0, 3),
      x,
      y,
      w,
      h,
      rotation,
      built: true,
      materialFamily: prefab?.defaultMaterialFamily ?? 'titanium',
      integrity: 100,
      ...(type === 'MOD0014' ? { sectionName: 'SECTION' } : {}),
      ...(type === 'ENR0002' ? { wallAttachment: { x, y } } : {}),
      ...(type === 'STR0005'
        ? {
            wallAttachment: [
              { x: 71, y: 62 },
              { x: 71, y: 65 },
            ],
          }
        : {}),
    };
  }

  return {
    tiles,
    objects,
    nextObjectId: 26,
    shaft: { x: 64, y: 64, w: 1, h: 1 },
    footprintTiles: TILE_LAYOUT.length,
    objectCount: OBJECT_LAYOUT.length,
  };
}
