# CASSANDRA architecture

## Goal

Prepare the browser prototype for upcoming systems without changing gameplay. The current HTML/CSS/JavaScript + Canvas implementation remains the runtime. This is the intended destination architecture; it does not imply that every module has already been moved.

## Target source layout

```text
src/
  app/                 Application startup and game-session lifecycle
  core/                Shared state, configuration and small infrastructure
  world/               Maps, decks, sections and world/mission generation
  entities/            Pawns, ship objects, shuttles and entity behavior
  systems/             Turn flow and simulation rules
  rendering/           Canvas rendering and visual effects
  ui/                  Menus, panels, selectors and HUD
  dev/                 Developer tools, generators and ship-layout exporter
  data/
    modules/
    structures/
    furniture/
    ships/
    prefabs/
```

## Responsibilities

- **app**: start New Game / Dev New Game, own the active session, connect UI and systems.
- **core**: shared game state and configuration; avoid putting gameplay rules here.
- **world**: deck definitions and selection, map geometry, section detection and world generation. The asteroid-cluster generator is already separated here; multi-deck and station-generation responsibilities remain future work.
- **entities**: pawn, shuttle, placed objects and their identity/state. Keep entity data separate from presentation.
- **systems**: deterministic gameplay rules. The current implementation separates hull connectivity, navigation, construction, damage handling, turn lifecycle, initial state creation and environmental updates. Power, life support, inventory and resource consumption remain future domains.
- **rendering**: draw the current state; must not decide simulation outcomes.
- **ui**: display state and send player commands; must not duplicate simulation rules.
- **dev**: development-only panels, test controls, generators and the geometry-only ship JSON exporter.
- **data**: definitions/prefabs for ship modules, structures, furniture, ships and other reusable content.

## Planned gameplay domains

1. **Five decks**: Z+2, Z+1, Z0, Z-1, Z-2. Z0 remains the canonical ship footprint; deck data is separate from deck selection in each UI panel.
2. **Deck geometry and access**: shared XY footprint where applicable, central 2x2 ladder shaft, deck-specific tiles and technical service corridors. Exact corridor access and upper/lower service mapping remain design decisions.
3. **Technical decks**: service routes, cable distribution and alien encounter spaces; keep their generation separate from ordinary room/section simulation.
4. **Shuttle**: a mobile mission-support entity with its own stored supplies, ammunition, medical items and regeneration resources. Model it as gameplay data, not inside the renderer or mission UI.
5. **Power and life support**: explicit simulation systems with component consumption values kept in data definitions. Datasheets should expose a separate `ORIENTAČNÍ SPOTŘEBA` value.

## Migration rules

- Refactor in small, reviewable stages. Do not combine formatting, file moves and gameplay changes in one step.
- Preserve New Game and Dev New Game behavior, the Cassandra starting layout and its JSON export.
- The Dev Mode JSON export remains geometry/component placement data only; it must not become a save file or carry gameplay logic.
- Keep existing module paths working until imports are migrated and verified.
- Do not change balance, simulation rules, identifiers, coordinates or prefab data during structural cleanup.
- After each stage, verify imports and run available browser checks. If a check cannot be run automatically, record it as a manual test rather than claiming it passed.

## Safe implementation order

1. Establish this architecture map and dedicated destination folders.
2. Apply consistent formatting without intentional logic changes.
3. Extract app bootstrap/session lifecycle from `main.js`.
4. Separate session-scoped camera controls, pawn command execution and construction placement from pointer input; ensure all timers, listeners and animation loops are disposed with the session.
5. Split turn management into state creation, hull connectivity, navigation, construction, damage handling and turn lifecycle. Keep `turn-manager.js` as a compatibility re-export for existing integrations.
6. Separate world/deck/section responsibilities and add the five-deck data model.
7. Add power, life support, inventory and shuttle systems as independent domains.
8. Add multi-deck UI selection and rendering only after the underlying deck model is stable.

## Module runtime architecture

Build definitions remain in `src/data/` and describe catalogue identity, footprint, placement and authored configuration. Runtime behavior belongs in `src/modules/`; Build Catalog categories are presentation groups and must not determine source folders.

The initial runtime foundation is deliberately independent from the current simulation:

- `module-contract.js` defines the common implementation interface.
- `module-registry.js` maps stable prefab IDs to runtime implementations and rejects duplicate registrations.
- `modules/<module-name>/` contains module-specific implementations.
- `structures/doors/` contains door-specific runtime behavior, separate from MOD modules even though both use the same registry contract.

The foundation currently exposes `createState(context)` and optional `onTurnStart`, `onTurnEnd`, `getActions` and `executeAction` hooks. The full capability model—including optional capacity/slots, physical interaction, remote access, automatic behavior, structured faults and technical service links—is specified in [Module Runtime Contract 2.0](MODULE-RUNTIME-CONTRACT-2.0.md).

Per-instance runtime state is keyed by the placed object's unique ID, not by prefab ID. The proposed common namespace is `gameState.objectRuntimeStates[object.id]`; its final integration point must be checked against the actual state and save/load architecture before implementation. This supports both MOD modules and STR structures without forcing every object to have capacity or occupants.

The shared Control Menu is planned as one UI shell for CP and CB with Sections, Modules and Status tabs. CP and CB retain their existing authority scopes; the menu is a presentation/command surface, not a replacement control system. Physical module menus use the same action definitions but only expose actions permitted at physical range.

The runtime contract is a design target, not a claim that those capabilities are implemented. No prefab runtimes are registered and module hooks are not connected to the turn lifecycle. Existing construction, integrity, environment, power-route, section and CP/CB behavior remains owned by its current systems.
