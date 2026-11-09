# Module Runtime Contract 2.0

**Status:** design specification; not yet integrated into gameplay  
**Scope:** shared runtime behavior for MOD modules and interactive structures such as doors  
**Compatibility rule:** this contract must extend the current simulation, not replace it.

## 1. Architectural boundaries

The runtime layer describes behavior of placed objects. It does not own the existing simulation systems.

- `src/data/` remains the source of prefab definitions and authored configuration.
- `src/modules/` owns module/structure runtime behavior.
- Existing systems remain authoritative for pawn attributes and consciousness, AP, integrity/damage, sections, environment, navigation, deck synchronization and turn lifecycle.
- CP (MOD0014) and CB (MOD0005) remain the existing control authorities. Their current scope and permissions must be preserved.
- UI presents available commands; it must not duplicate gameplay rules or directly mutate simulation state.

The runtime registry is keyed by prefab ID. Runtime state is keyed by the unique placed-object ID.

## 2. Prefab definition versus placed instance

A prefab defines shared capabilities and configuration, for example:

- identity, footprint and placement;
- optional interaction support;
- optional capacity and named/positioned slots;
- available action definitions and their costs;
- automatic behavior;
- physical and remote access policy;
- optional service-node association/configuration.

A placed instance owns its own runtime state. Two instances of MOD0007 must never share patient, treatment, fault or process state.

The placed object already owns physical facts such as location, dimensions, material family, construction state and integrity. Module runtime state must not duplicate these facts unless a future integration explicitly requires a derived snapshot.

**Recommended state namespace:** `gameState.objectRuntimeStates[object.id]`. This is intentionally broader than `moduleStates`, because the same runtime contract covers both MOD modules and STR structures such as doors. The exact state initialization/migration point must be selected during integration with the existing game-state/save architecture.

## 3. Optional capabilities

Not every runtime implements every capability. Absence means unsupported; it must not create fake defaults.

| Capability | Purpose |
|---|---|
| Interaction | Whether a pawn can physically interact with the object |
| Capacity / slots | Optional occupancy, e.g. two treatment pods |
| Actions | Commands the instance can offer |
| Automatic behavior | Behavior that runs without a direct player command |
| Remote control | Which commands CP/CB may expose |
| Turn lifecycle | Optional turn-start / turn-end processing |
| Fault reporting | Runtime faults and diagnostic details |
| Service link | Optional link to a technical-deck service point |

Examples:
- Medical Chamber: interactable, capacity two, treatment actions; no remote treatment that requires a pawn physically present.
- Door: no pawn capacity; automatic behavior and optionally remote open/close commands.
- Bridge Console: a control authority, not a capacity-based service module.
- Control Panel: local control authority, not a capacity-based service module.

## 4. Interaction and action model

Opening an interaction menu is free. AP is charged only by a selected action according to the existing AP system.

A runtime action should declare, at minimum:

- stable action ID;
- display label / localization key;
- AP cost (or a rule that resolves the cost);
- access modes: physical, CP, CB (one or more);
- eligibility requirements;
- whether it starts an ongoing process or completes immediately.

The runtime decides which actions it offers in a given context. The shared command layer validates and charges AP, checks pawn eligibility and invokes the action. The runtime must not create a parallel AP system.

Physical-only actions must not appear as remotely executable. For example, inserting or treating a patient in a Medical Chamber requires physical presence when the action itself requires a pawn at the chamber. A remote-capable action such as opening or closing a door may be offered through CP/CB, subject to the panel's existing scope and permissions.

The module describes the effect it can provide; pawn attributes and conditions remain owned by pawn/gameplay systems. A treatment module may request an effect such as restoring a portion of HP or attempting to restore consciousness, but should not own a separate copy of pawn HP or consciousness rules.

## 5. Capacity, occupants and ongoing processes

Capacity is optional. When present, it is represented as explicit slots/positions, not merely a descriptive number.

For a two-slot Medical Chamber, each slot can independently contain an occupant and its own process state. The instance state may include:

- slot identity and occupant entity ID;
- selected procedure/process ID;
- process progress or remaining work;
- whether continuation awaits player confirmation;
- interruption/completion state.

A process spanning multiple turns must not silently consume all AP on later turns. If more AP/work is required than the pawn currently has, the process pauses at the turn boundary and waits for an explicit continuation decision, unless the specific module design defines another approved rule.

Consciousness and AP eligibility are read from the existing pawn systems. An unconscious pawn receives no AP under the existing rules. A module may perform a module-specific periodic check or attempt an effect, but the exact probability, cost and treatment design belong to that module's own design—not this shared contract.

Where the design allows a conscious occupant to leave, interruption must be an explicit supported action and must preserve consistent slot occupancy and process state.

## 6. Automatic behavior and turn lifecycle

Modules may optionally implement deterministic automatic behavior. It is invoked by the shared lifecycle at a documented point; modules do not create their own timers or independent turn loops.

Integration must preserve the existing NEXT TURN ordering and the established rule that technical decks synchronize at NEXT TURN rather than after each construction edit.

Before enabling hooks, document their exact order relative to:
- turn/day advancement;
- scan-state cleanup;
- technical-deck synchronization;
- environment updates;
- pawn AP refresh;
- other existing turn processing.

Do not connect hooks until that ordering has been checked against the current `endTurn` implementation.

## 7. Shared systems and power-route reliability

Runtime modules query shared systems; they do not reproduce them.

Power-route reliability is a shared-system concern. The current design intent is:
- relevant aluminium walls/doors and module connectors participate in the existing `powerRoute` connectivity model;
- a continuous route from the shaft to the module is required;
- a route component below 90% integrity can cause an unstable supply condition;
- the described initial malfunction behavior is a 50% chance for an attempted module action to consume its AP but do nothing, with possible visual indicators such as blinking lights.

These values and effects are design inputs to the future power/reliability system, not logic to hardcode into every module. The current game does not yet have a complete power system; this document does not claim that route validation or malfunction simulation is implemented.

Integrity, environment, section boundaries and existing hull/connectivity rules remain in their current systems.

## 8. Technical-deck service points and faults

A module may have a linked service point in the generated technical tunnel on Z-1. The service point is a separate technical object/system record, not another copy of the module's own state.

The link should identify the associated placed module instance and its service location (for example, a technical-deck cabinet identifier). A service point may later expose replaceable fuses, breakers, connectors, fault logs or other repairable components.

A module may therefore be unavailable because:
1. its power route is unreliable;
2. the module itself reports a fault;
3. its linked technical service point reports a fault or has disabled the module.

The service-point system and module runtime must communicate through a defined interface; neither should directly modify the other's private state.

## 9. Diagnostics, Status tab and tracking

The shared Control Menu is planned to expose three tabs:

- **Sections:** current section overview and existing section controls.
- **Modules:** modules within the current control authority's scope and their remotely permitted actions.
- **Status:** operational state and known faults.

A player may see that a module is malfunctioning and visit an in-scope CP/CB to run a diagnostic. The diagnostic is a player action and may have an AP cost; **2 AP is an example proposed by the design discussion, not a finalized balance value**.

A diagnostic may report a specific source/location, for example: `Error — Z-1 / Cabinet 07`. The player may then choose **Track**. Tracking should highlight or blink the corresponding deck indicator in the existing left-side deck list, helping the player navigate to the approximate fault location.

Diagnostic discovery, fault identification and tracking are separate concepts:
- visible malfunction does not necessarily reveal its cause;
- running diagnostics reveals a known fault/location according to diagnostic capability;
- Track is a navigation/UI aid and does not repair the fault or change simulation state.

The Status tab should be designed to accommodate this later, but diagnostics and tracking are not implemented by this contract.

## 10. Unified Control Menu

Clicking CP or CB opens one shared Control Menu shell. The shell contains the Sections, Modules and Status tabs.

The difference between CP and CB is data scope and authority, not a separate UI implementation:
- CP exposes the local section within its existing authority.
- CB exposes the global scope within its existing authority.
- Each module action is filtered by its access mode and the active controller's permissions.
- The menu is a presentation/command surface; existing control systems remain authoritative.

Physical interaction menus for individual modules should use the same action definitions and command execution path, filtered to physical actions. This avoids duplicate implementations for physical and remote controls.

The existing Sections functionality must remain available after being moved under the shared Control Menu.

## 11. Runtime interface responsibilities

The existing foundation currently provides:
- `defineModuleRuntime({ id, createState, ...hooks })`;
- `registerModuleRuntime(runtime)`;
- optional hooks `onTurnStart`, `onTurnEnd`, `getActions`, `executeAction`.

This is only the initial interface. The next implementation stage should refine it to support the capabilities above without prematurely adding module-specific rules. In particular:
- action access modes and AP handling belong in a shared action contract/dispatcher;
- capacity/slots and service links are optional data/state capabilities;
- diagnostics expose structured fault records, not UI markup;
- UI components must not be imported by runtime definitions.

Do not invent a second action dispatcher if the existing command flow can be extended safely. Audit current CP/CB actions and pawn command execution before choosing the integration point.

## 12. Existing behavior that must be preserved

Any integration must preserve:
- current integrity and material degradation behavior;
- vacuum / pressure propagation and section boundary behavior;
- CP local-section and CB global authority;
- Complete Scan lifetime and NEXT TURN cleanup;
- pawn repair rules and access requirements;
- layer scanning;
- double-defense behavior of titanium perimeter wall plus inner aluminium wall;
- titanium wall connector electrical conduction without creating walkable space;
- door integrity being processed once, not twice;
- Z0 as the canonical footprint and technical-deck synchronization only at NEXT TURN.

No module refactor may silently alter these systems.

## 13. Known UI issue to fix separately

A deck transition initiated from Z-1 by right-clicking the shaft and choosing **Go to Z0** currently opens the Sections menu automatically. The reverse transition from Z0 to Z-1 does not.

Expected behavior: changing decks through the shaft navigation menu must not automatically open the Sections menu. Investigate the asymmetric transition paths and fix the unintended UI side effect without changing shaft navigation or normal manual CP/CB interaction.

This is a separate bug fix, not a side effect of the runtime contract or Control Menu migration.

## 14. Implementation sequence

1. Review current state shape, save/load strategy, pawn command/AP flow, CP/CB actions and turn lifecycle.
2. Refine the shared runtime/action contracts and choose the state namespace based on actual save/state conventions.
3. Implement the shared Control Menu shell while preserving the existing Sections behavior.
4. Fix and verify the Z-1 → Z0 automatic Sections-menu issue as a separate change.
5. Integrate one small representative runtime (preferably a simple door behavior) to validate physical/remote action filtering.
6. Implement capacity and ongoing-process support with Medical Chamber only after its gameplay design is approved.
7. Add power reliability, service-point faults, diagnostics and tracking when the underlying shared systems exist.

Each stage should be a small reviewable change. Run available checks and record any manual tests; never claim a test passed unless it was actually run.
