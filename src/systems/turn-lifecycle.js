import { advanceEnvironment } from './section-manager.js';
import { syncTechnicalDecksState } from './technical-deck-generator.js';

function sectionSignature(section) {
  return section.tiles
    .map((point) => point.x + ',' + point.y)
    .sort()
    .join('|');
}

const BOUNDARY_DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

function inspectBoundaryWalls(state, section, vacuumSet, tileToSection) {
  const walls = new Map();
  for (const point of section.tiles) {
    for (const [dx, dy] of BOUNDARY_DIRS) {
      const x = point.x + dx,
        y = point.y + dy,
        tile = state.map.tiles[x + ',' + y];
      if (!tile?.wall && !tile?.aluminiumWall) continue;
      const integrity = tile.aluminiumWall
        ? (tile.aluminiumWallIntegrity ?? 100)
        : (tile.wallIntegrity ?? 100);
      const vacuumCells = BOUNDARY_DIRS
        .map(([ax, ay]) => x + ax + ',' + (y + ay))
        .filter((cell) => vacuumSet.has(cell));
      const adjacentSections = [
        ...new Set(
          BOUNDARY_DIRS
            .map(([ax, ay]) => tileToSection[x + ax + ',' + (y + ay)])
            .filter((id) => id && id !== section.id)
        ),
      ];
      walls.set(x + ',' + y, {
        x,
        y,
        kind: tile.aluminiumWall ? 'ALUMINIUM WALL' : 'TITANIUM WALL',
        integrity,
        vacuumCells,
        adjacentSections,
      });
    }
  }
  return [...walls.values()];
}

function environmentDiagnostics(state, environment, previousState, nextState) {
  return environment.sections.map((section) => {
    const signature = sectionSignature(section),
      previous = previousState[signature] ?? {},
      saved = nextState[signature] ?? {};
    const formatState = (state) =>
      [
        state.environment ?? 'UNSET',
        state.pressure ?? 'UNSET',
        state.temperature == null ? 'N/A' : state.temperature + ' C',
      ].join(' / ');
    const boundaryWalls = inspectBoundaryWalls(state, section, environment.vacuumSet, environment.tileToSection),
      damagedBoundaryWalls = boundaryWalls.filter((wall) => wall.integrity < 100);
    const cautious = section.cautiousWalls.map(
      (wall) => wall.kind + ' ' + wall.x + ',' + wall.y + ' ' + wall.integrity + '%'
    );
    const critical = section.criticalWalls.map(
      (wall) => wall.kind + ' ' + wall.x + ',' + wall.y + ' ' + wall.integrity + '%'
    );
    return {
      section: section.id,
      tiles: section.tileCount,
      panelActive: Boolean(section.hasActivePanel),
      openBoundaries: section.openBoundaries.length,
      boundaryWallCount: boundaryWalls.length,
      damagedBoundaryWalls: damagedBoundaryWalls.length,
      damagedBoundaryWallDetails: damagedBoundaryWalls
        .map(
          (wall) =>
            wall.kind +
            ' ' + wall.x + ',' + wall.y +
            ' ' + wall.integrity + '%' +
            (wall.vacuumCells.length ? ' VACUUM@' + wall.vacuumCells.join('/') : ' NO VACUUM CONTACT') +
            (wall.adjacentSections.length ? ' ADJACENT=' + wall.adjacentSections.join('/') : '')
        )
        .join('; ') || '-',
      cautiousWalls: cautious.length,
      cautiousWallDetails: cautious.join('; ') || '-',
      criticalWalls: critical.length,
      criticalWallDetails: critical.join('; ') || '-',
      detected: formatState(section),
      previousSaved: formatState(previous),
      newlySaved: formatState(saved),
    };
  });
}


function syncZ1EnvironmentFromZ0(state, environment) {
  const pressureSeverity = {
    OPTIMAL: 0,
    LOW: 1,
    VACUUM: 2,
    HIGH: 3,
    EXTREME: 4,
  };
  const worstSection = [...environment.sections].sort((a, b) => {
    const severityA = a.environment === 'CRITICAL'
      ? 5
      : (pressureSeverity[a.pressure] ?? 0);
    const severityB = b.environment === 'CRITICAL'
      ? 5
      : (pressureSeverity[b.pressure] ?? 0);
    if (severityA !== severityB) return severityB - severityA;
    const temperatureA = Number.isFinite(a.temperature) ? a.temperature : Infinity;
    const temperatureB = Number.isFinite(b.temperature) ? b.temperature : Infinity;
    return temperatureA - temperatureB;
  })[0];

  const deck = state.technicalDecks?.['Z-1'];
  if (!deck) return;

  deck.environmentState = {
    source: 'Z0',
    sourceSection: worstSection?.id ?? null,
    environment: worstSection?.environment ?? 'UNMANAGED',
    atmosphere: worstSection?.atmosphere ?? 'NONE',
    pressure: worstSection?.pressure ?? 'VACUUM',
    temperature: worstSection?.temperature ?? null,
    airtightness: 'SEALED',
  };
}

export function endTurn(s) {
  s.turn++;
  if ((s.turn - 1) % 2 === 0) s.day++;
  syncTechnicalDecksState(s);
  const previousEnvironmentState = { ...(s.environmentState ?? {}) };
  const environment = advanceEnvironment(s);
  syncZ1EnvironmentFromZ0(s, environment);
  const diagnostics = environmentDiagnostics(
    s,
    environment,
    previousEnvironmentState,
    s.environmentState ?? {}
  );
  if (typeof console !== 'undefined' && typeof console.table === 'function') {
    console.groupCollapsed?.('[CASSANDRA] ENVIRONMENT TICK · TURN ' + s.turn);
    console.table(diagnostics);
    console.groupEnd?.();
  }
  s.pawn.op = s.pawn.maxOP;
  const report = diagnostics
    .filter((item) => item.damagedBoundaryWalls > 0 || item.cautiousWalls > 0 || item.criticalWalls > 0 || item.openBoundaries > 0)
    .map(
      (item) =>
        item.section +
        ': ' +
        item.detected +
        ' · PANEL ' +
        (item.panelActive ? 'ACTIVE' : 'INACTIVE') +
        ' · BOUNDARY WALLS [' +
        item.damagedBoundaryWallDetails +
        '] · CAUTIOUS [' +
        item.cautiousWallDetails +
        '] · CRITICAL [' +
        item.criticalWallDetails +
        '] · OPEN ' +
        item.openBoundaries
    )
    .join(' || ');
  return {
    message:
      'TURN ADVANCED · ENVIRONMENT UPDATED · OPERATIONAL POINTS RESTORED' +
      (report ? ' · ENV DIAG: ' + report : ' · ENV DIAG: NO DAMAGED BOUNDARIES DETECTED'),
  };
}
