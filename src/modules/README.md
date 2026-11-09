# Module runtime layer

Prefab definitions remain in `src/data/`. This directory contains behavior attached to placed prefab instances.

## Layout

- `module-contract.js`: initial shared runtime implementation interface.
- `module-registry.js`: ID-to-runtime registry shared by modules and structures.
- `modules/`: individual MOD runtime implementations.
- `structures/doors/`: door-specific runtime implementation.

Build Catalog categories are UI groupings; they do not define runtime folders.

## Instance state

Runtime state belongs to a placed object, not to a prefab definition. The planned common namespace is `gameState.objectRuntimeStates[object.id]`, keyed by the placed object's unique instance ID. This name covers both MOD modules and STR structures. The final state integration point must be verified against the actual game-state and save/load architecture before implementation.

Physical object facts already held by the placed object—such as location, dimensions, material family, construction state and integrity—must not be duplicated in module runtime state.

## Capabilities

Not every runtime needs every capability. Capacity/slots, physical interaction, actions, automatic behavior, remote control, turn hooks, fault reporting and a technical-deck service link are optional. A door does not need pawn capacity; a Medical Chamber may have independently occupied treatment slots.

Opening a menu is free. AP is charged only by a selected action through the shared command/AP flow. Actions declare whether they are available physically, through CP, or through CB. Physical-only actions must not be exposed as remote actions. CP and CB retain their existing authority scopes.

## Lifecycle and shared systems

The initial implementation uses `defineModuleRuntime({ id, createState, ...hooks })` and `registerModuleRuntime(runtime)`.

- `createState(context)` is required and creates initial state for one placed instance.
- `onTurnStart(context)` and `onTurnEnd(context)` are optional lifecycle hooks.
- `getActions(context)` optionally returns currently available actions.
- `executeAction(context, actionId, payload)` optionally handles an action.

The integration layer must define context shape and exact turn ordering before hooks are called. Modules query shared systems and must not duplicate AP, pawn attributes, integrity, environment, navigation, sections or power-route rules. Do not add an independent action dispatcher if the existing command flow can be extended safely.

## Design specification

See [Module Runtime Contract 2.0](../../docs/MODULE-RUNTIME-CONTRACT-2.0.md) for the approved target design, including the unified Control Menu, diagnostics/status concept, technical service points, preservation constraints and the separate Z-1 to Z0 navigation-menu bug.

MOD0006 Sleeping Module is the first registered runtime. It is reached through the physical Z0 command path and uses the shared pawn action/reliability system. Its sleep plan is stored on the pawn because rest is a pawn condition, not module occupancy. Other module runtimes and generalized per-instance runtime-state initialization remain future work.
