import {
  detectSections,
  getSectionInfo,
  getVacuumInfo,
} from '../systems/section-manager.js';
import { executeShipControlAction } from '../actions/ship-control/action-executor.js';
import { getShipControlAction } from '../actions/ship-control/action-registry.js';
import { detectTechnicalDeckSections } from '../systems/technical-deck-sections.js';
import { getActiveDeckObjects } from '../systems/prefab-manager.js';
import { FLOOR_LEVELS } from '../ship-floors/floor-registry.js';
import { getControlDeviceContext, canAccessSection } from '../actions/ship-control/control-access.js';
const esc = (v) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]
  );
const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
export function createSectionsPanel(root, s, onChange) {
  let open = false,
    report = null,
    control = null;
  s.sectionsUi ??= { selectedPanelId: null, selectedSectionId: null };
  function selectSection(id) {
    if (control?.scope === 'ONE_SECTION' && id !== control.sectionId) return;
    s.sectionsUi.selectedSectionId = id;
    s.sectionsUi.selectedPanelId =
      (s.activeDeck === 'Z0' ? detectSections(s) : detectTechnicalDeckSections(s, s.activeDeck)).panels.find((p) => p.sectionId === id)?.id ?? null;
    report = null;
    render();
  }
  function selectPanel(id) {
    const activeLevel = control?.scope === 'ONE_SECTION' ? control.deckId : s.activeDeck;
    const data = activeLevel === 'Z0' ? detectSections(s) : detectTechnicalDeckSections(s, activeLevel),
      panel = data.panels.find((v) => v.id === id);
    if (control?.scope === 'ONE_SECTION' && panel?.sectionId !== control.sectionId) return;
    s.sectionsUi.selectedPanelId = id;
    s.sectionsUi.selectedSectionId = panel?.sectionId ?? null;
    report = null;
    render();
  }
  function render() {
    if (!open) {
      root.hidden = true;
      return;
    }
    root.hidden = false;
    const deckLevel = control?.scope === 'ONE_SECTION' ? control.deckId : s.activeDeck ?? 'Z0',
      data = detectSections(s),
      technicalDeck = deckLevel === 'Z0' ? null : s.technicalDecks?.[deckLevel],
      deckData = deckLevel === 'Z0' ? data : detectTechnicalDeckSections(s, deckLevel),
      selectedId = control?.scope === 'ONE_SECTION' ? control.sectionId : s.sectionsUi.selectedSectionId,
      selected = deckData.byId[selectedId] ?? null;
    if (control?.scope === 'ONE_SECTION') s.sectionsUi.selectedSectionId = control.sectionId;
    const panels = control?.scope === 'ONE_SECTION'
      ? deckData.panels.filter((panel) => panel.sectionId === control.sectionId)
      : deckData.panels;
    const info = deckLevel === 'Z0'
      ? selected ? getSectionInfo(selected) : getVacuumInfo()
      : {
          type: 'TECHNICAL SECTION',
          id: selected?.id ?? deckLevel,
          name: selected?.name ?? 'TECHNICAL DECK ' + deckLevel,
          airtightness: 'STRUCTURAL',
          weight: null,
          atmosphere: 'NOT SIMULATED',
          pressure: 'NOT SIMULATED',
          temperature: null,
          environment: 'POWER ROUTE · ' + (selected ? 'CONNECTED' : 'NO SECTION SELECTED'),
          activeTiles: selected?.tileCount ?? Object.values(technicalDeck?.tiles ?? {}).filter((tile) => tile.walkable).length,
        };
    const technicalFootprint = new Set(technicalDeck?.footprint ?? []);
    const allTiles = deckLevel === 'Z0'
      ? Object.entries(s.map.tiles).filter(([, tile]) => tile?.hull).map(([tileKey]) => tileKey.split(',').map(Number))
      : [...technicalFootprint].map((tileKey) => tileKey.split(',').map(Number));
    const minX = allTiles.length ? Math.max(0, Math.min(...allTiles.map((p) => p[0])) - 2) : 0;
    const maxX = allTiles.length
      ? Math.min(s.map.width - 1, Math.max(...allTiles.map((p) => p[0])) + 2)
      : 0;
    const minY = allTiles.length ? Math.max(0, Math.min(...allTiles.map((p) => p[1])) - 2) : 0;
    const maxY = allTiles.length
      ? Math.min(s.map.height - 1, Math.max(...allTiles.map((p) => p[1])) + 2)
      : 0;
    const width = Math.max(1, maxX - minX + 1),
      height = Math.max(1, maxY - minY + 1),
      grid = [];
    const vacuumSelected = control?.scope !== 'ONE_SECTION' && s.sectionsUi.selectedSectionId == null;
    for (let y = minY; y <= maxY; y++)
      for (let x = minX; x <= maxX; x++) {
        const tileKey = x + ',' + y;
        if (deckLevel !== 'Z0') {
          if (!technicalFootprint.has(tileKey)) {
            grid.push('<div class="section-map-cell unclassified-cell" title="OUTSIDE DECK FOOTPRINT"></div>');
            continue;
          }
          const shaft = technicalDeck?.shaft.some((point) => point.x === x && point.y === y);
          const sectionId = deckData.tileToSection[tileKey];
          const serviceFloor = technicalDeck?.tiles?.[tileKey]?.walkable === true;
          if (serviceFloor) {
            const allowed = !control || canAccessSection(control, deckLevel, sectionId);
            const cell = '<span class="section-map-cell ' + (sectionId === selectedId ? 'selected' : sectionId ? 'section-cell' : 'unassigned') + '" title="' + esc(sectionId ?? 'POWER ROUTE') + '">' + (panels.some((panel) => panel.x === x && panel.y === y) ? '⌖' : '') + '</span>';
            grid.push(allowed ? '<button class="section-map-cell ' + (sectionId === selectedId ? 'selected' : sectionId ? 'section-cell' : 'unassigned') + '" data-section="' + esc(sectionId ?? '') + '" title="' + esc(sectionId ?? 'POWER ROUTE') + '">' + (panels.some((panel) => panel.x === x && panel.y === y) ? '⌖' : '') + '</button>' : '<div class="section-map-cell unassigned" title="RESTRICTED SECTION"></div>');
          }
          else grid.push('<div class="section-map-cell ' + (shaft ? 'technical-shaft-cell' : 'technical-hull-cell') + '" title="' + (shaft ? 'CENTRAL SHAFT' : 'STRUCTURAL HULL') + '"></div>');
          continue;
        }
        const id = data.tileToSection[tileKey],
          tile = s.map.tiles[tileKey];
        const panel = panels.find((p) => p.x === x && p.y === y);
        if (!tile?.hull) {
          const selectedVacuum = vacuumSelected && data.vacuumSet.has(tileKey);
          if (data.vacuumSet.has(tileKey))
            grid.push(
              '<button class="section-map-cell vacuum-cell ' +
                (selectedVacuum ? 'vacuum-selected' : '') +
                '" data-vacuum="1" title="VACUUM"></button>'
            );
          else
            grid.push(
              '<div class="section-map-cell unclassified-cell" title="UNCLASSIFIED SPACE"></div>'
            );
          continue;
        }
        const externalEdge = DIRS.some(([dx, dy]) => !s.map.tiles[x + dx + ',' + (y + dy)]?.hull);
        const edgeClass = vacuumSelected && externalEdge ? ' external-boundary-selected' : '';
        if (tile.wall || tile.aluminiumWall) {
          const scanned = scanByPosition.get(tileKey);
          const integrityClass = scanned ? (scanned.integrity < 50 ? ' integrity-critical' : scanned.integrity < 75 ? ' integrity-caution' : ' integrity-good') : '';
          grid.push('<div class="section-map-cell boundary-cell ' + (tile.aluminiumWall ? 'aluminium-boundary' : 'hull-boundary') + integrityClass + edgeClass + '" title="' + (tile.aluminiumWall ? 'ALUMINIUM WALL' : 'HULL WALL') + (scanned ? ' · ' + scanned.integrity + '% INTEGRITY' : '') + '">' + (scanned ? scanned.integrity + '%' : '') + '</div>');
          continue;
        }
        const allowed = !control || canAccessSection(control, deckLevel, id);
        const cls = id === selectedId ? 'selected' : id ? 'section-cell' : 'unassigned';
        const scanned = scanByPosition.get(tileKey);
        const integrityClass = scanned ? (scanned.integrity < 50 ? ' integrity-critical' : scanned.integrity < 75 ? ' integrity-caution' : ' integrity-good') : '';
        grid.push(allowed ? '<button class="section-map-cell ' + cls + integrityClass + edgeClass + '" data-section="' + esc(id ?? '') + '" title="' + esc(id ?? 'UNASSIGNED') + (scanned ? ' · ' + scanned.integrity + '% INTEGRITY' : '') + '">' + (scanned ? scanned.integrity + '%' : panel ? '⌖' : '') + '</button>' : '<div class="section-map-cell unassigned" title="RESTRICTED SECTION"></div>');
      }
    const existingOrder = s.sectionsUi.panelOrder ?? [];
    const order = [
      ...existingOrder.filter((id) => panels.some((p) => p.id === id)),
      ...panels.map((p) => p.id).filter((id) => !existingOrder.includes(id)),
    ];
    s.sectionsUi.panelOrder = order;
    const orderedPanels = [...panels].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    const panelRows = orderedPanels
      .map(
        (p, i) =>
          '<div class="section-panel-row ' +
          (p.id === s.sectionsUi.selectedPanelId ? 'active' : '') +
          '"><button class="section-panel-select" data-panel="' +
          esc(p.id) +
          '"><span>' +
          String(i + 1).padStart(2, '0') +
          '</span><b>' +
          esc(p.name) +
          '</b><small>' +
          esc(p.sectionId ?? 'NO SECTION') +
          ' · ' +
          esc(p.status) +
          (p.reason ? ' · ' + esc(p.reason) : '') +
          '</small></button><div class="section-panel-actions"><button data-rename="' +
          esc(p.id) +
          '" title="Rename">✎</button><button data-up="' +
          esc(p.id) +
          '" title="Move up">↑</button><button data-down="' +
          esc(p.id) +
          '" title="Move down">↓</button></div></div>'
      )
      .join('');
    const scan = s.sectionsUi.scan?.turn === s.turn && s.sectionsUi.scan.sectionId === selectedId ? s.sectionsUi.scan : null;
    const scanByPosition = new Map((scan?.entries ?? []).map((entry) => [entry.x + ',' + entry.y, entry]));
    const weight = info.weight == null ? 'NOT DEFINED' : info.weight.toLocaleString('en-US');
    const temperature = info.temperature == null ? 'UNMAINTAINED' : info.temperature + ' °C';
    root.innerHTML =
      '<div class="sections-window"><header class="sections-header"><div><small>CASSANDRA · COMMAND SYSTEM</small><h2>SECTION CONTROL</h2></div><button data-close aria-label="Close">×</button></header><nav class="sections-deck-tabs" aria-label="Select ship deck">' +
      FLOOR_LEVELS.map((level) => '<button data-deck="' + level + '" ' + (control?.scope === 'ONE_SECTION' && level !== control.deckId ? 'disabled title="LOCAL CONTROL · SECTION ONLY" ' : '') + 'class="' + (deckLevel === level ? 'active' : '') + '">' + level + '</button>').join('') +
      '</nav><div class="sections-layout"><aside class="sections-panel-list"><h3>CONTROL PANELS</h3>' +
      (panelRows || '<p class="sections-empty">NO CONTROL PANELS INSTALLED</p>') +
      '</aside><section class="sections-blueprint"><h3>' + (deckLevel === 'Z0' ? 'SHIP BLUEPRINT' : 'DECK BLUEPRINT') + '</h3><div class="section-map" style="grid-template-columns:repeat(' +
      width +
      ',minmax(5px,1fr));grid-template-rows:repeat(' +
      height +
      ',minmax(5px,1fr))">' +
      grid.join('') +
      '</div><p class="blueprint-legend"><i></i> ' + (deckLevel === 'Z0' ? 'SELECTED SECTION · CLICK SPACE FOR VACUUM' : 'SELECT A POWER ROUTE SECTION') + '</p></section><aside class="sections-info"><h3>' + (deckLevel === 'Z0' ? 'SECTION INFO' : 'DECK INFO') + '</h3><div class="section-info-card"><small>' +
      esc(info.type === 'VACUUM' ? 'EXTERNAL ENVIRONMENT' : info.id) +
      '</small><h2>' +
      esc(info.name) +
      '</h2><span class="section-status ' +
      (info.airtightness === 'STABLE' || info.airtightness === 'SEALED' || info.type === 'VACUUM'
        ? 'sealed'
        : info.airtightness === 'CAUTIOUS'
          ? 'unsealed'
          : 'unsealed') +
      '">' +
      esc(info.airtightness ?? 'VACUUM') +
      '</span><dl><dt>WEIGHT</dt><dd>' +
      weight +
      '</dd><dt>ATMOSPHERE</dt><dd>' +
      esc(info.atmosphere) +
      '</dd><dt>PRESSURE</dt><dd>' +
      esc(info.pressure) +
      '</dd><dt>TEMPERATURE</dt><dd>' +
      temperature +
      '</dd><dt>ENVIRONMENT</dt><dd>' +
      esc(info.environment) +
      '</dd>' +
      (info.activeTiles != null ? '<dt>ACTIVE TILES</dt><dd>' + info.activeTiles + '</dd>' : '') +
      (info.airtightness ? '<dt>AIRTIGHTNESS</dt><dd>' + esc(info.airtightness) + '</dd>' : '') +
      (info.cautiousWalls
        ? '<dt>CAUTIOUS BOUNDARIES</dt><dd>' + info.cautiousWalls + '</dd>'
        : '') +
      (info.criticalWalls
        ? '<dt>CRITICAL BOUNDARIES</dt><dd>' + info.criticalWalls + '</dd>'
        : '') +
      '</dl></div>' +
      (selected && (control?.scope === 'ALL_SECTIONS' || canAccessSection(control, deckLevel, selected.id)) && deckLevel === 'Z0'
        ? (() => {
            const action = getShipControlAction('COMPLETE_SCAN');
            return '<div class="section-actions"><h3>AVAILABLE ACTIONS</h3><button data-action="' + action.id + '">' + action.label + ' <b>' + action.apCost + ' AP</b></button></div>';
          })()
        : '') +
      '</aside></div><footer class="sections-footer"><span>' +
      (control?.scope === 'ALL_SECTIONS' ? 'BRIDGE CONSOLE · GLOBAL ACCESS' : control?.scope === 'ONE_SECTION' ? 'LOCAL CONTROL · ' + control.sectionId : 'SECTION DIRECTORY · ' + panels.length + ' PANEL(S)') +
      '</span><span>OPERATIONAL POINTS · ' +
      s.pawn.op +
      ' / ' +
      s.pawn.maxOP +
      '</span></footer></div>';
    root.querySelector('[data-close]').onclick = () => {
      open = false;
      render();
    };
    root.querySelectorAll('[data-deck]').forEach((button) => {
      button.onclick = () => {
        const level = button.dataset.deck;
        if (!FLOOR_LEVELS.includes(level)) return;
        s.activeDeck = level;
        s.sectionsUi.selectedSectionId = null;
        s.sectionsUi.selectedPanelId = null;
        report = null;
        onChange('DECK VIEW · ' + level);
        render();
      };
    });
    root
      .querySelectorAll('[data-section]')
      .forEach((b) => (b.onclick = () => selectSection(b.dataset.section || null)));
    root.querySelectorAll('[data-vacuum]').forEach(
      (b) =>
        (b.onclick = () => {
          s.sectionsUi.selectedSectionId = null;
          s.sectionsUi.selectedPanelId = null;
          report = null;
          render();
        })
    );
    root
      .querySelectorAll('[data-panel]')
      .forEach((b) => (b.onclick = () => selectPanel(b.dataset.panel)));
    root.querySelectorAll('[data-rename]').forEach(
      (b) =>
        (b.onclick = () => {
          const panel = (s.activeDeck === 'Z0' ? detectSections(s) : detectTechnicalDeckSections(s, s.activeDeck)).panels.find((v) => v.id === b.dataset.rename);
          if (!panel) return;
          const value = prompt('SECTION NAME', panel.name);
          if (value?.trim()) {
            const obj = getActiveDeckObjects(s)[panel.id];
            obj.sectionName = value.trim().slice(0, 32);
            render();
          }
        })
    );
    root.querySelectorAll('[data-up],[data-down]').forEach(
      (b) =>
        (b.onclick = () => {
          const id = b.dataset.up ?? b.dataset.down,
            arr = s.sectionsUi.panelOrder;
          const i = arr.indexOf(id),
            j = i + (b.dataset.up ? -1 : 1);
          if (i < 0 || j < 0 || j >= arr.length) return;
          [arr[i], arr[j]] = [arr[j], arr[i]];
          render();
        })
    );
    const actionButtons = root.querySelectorAll('[data-action]');
    actionButtons.forEach((button) => {
      button.onclick = () => {
        const result = executeShipControlAction(s, button.dataset.action, {
          section: selected,
          panelId: s.sectionsUi.selectedPanelId,
          deckId: deckLevel,
          control,
        });
        if (result.ok && result.actionId === 'COMPLETE_SCAN') report = result;
        onChange(result.message);
        render();
      };
    });
  }
  return {
    open() {
      control = null;
      open = true;
      render();
    },
    openFromDevice(device, deckId) {
      control = getControlDeviceContext(s, device, deckId);
      if (!control) return false;
      if (control.scope === 'ONE_SECTION') {
        s.activeDeck = control.deckId;
        s.sectionsUi.selectedSectionId = control.sectionId;
        s.sectionsUi.selectedPanelId = control.deviceId;
      } else {
        s.activeDeck = 'Z0';
        const data = detectSections(s);
        s.sectionsUi.selectedSectionId = data.sections[0]?.id ?? null;
        s.sectionsUi.selectedPanelId = data.sections[0]?.panels?.[0]?.id ?? null;
      }
      report = null;
      open = true;
      render();
      return true;
    },
    close() {
      open = false;
      render();
    },
    toggle() {
      open = !open;
      render();
    },
    selectPanel(id) {
      control = null;
      selectPanel(id);
      open = true;
      render();
    },
    refresh: render,
    get isOpen() {
      return open;
    },
  };
}
