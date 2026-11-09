# Module runtime layer

Prefab definitions remain in `src/data/`. This directory contains behavior attached to placed prefab instances.

## Layout

- `module-contract.js`: shared runtime implementation contract.
- `module-registry.js`: ID-to-runtime registry shared by modules and structures.
- `modules/`: individual MOD runtime implementations.
- `structures/doors/`: door runtime implementation.

Build Catalog categories are UI groupings; they do not define runtime folders.

## Instance state

Runtime state belongs to a placed object, not to a prefab definition. The future integration layer should store it under the placed object's stable instance ID, for example `gameState.moduleStates[object.id]`. The same prefab can therefore have multiple independent runtime instances.

## Lifecycle contract

An implementation is created with `defineModuleRuntime({ id, createState, ...hooks })` and registered with `registerModuleRuntime(runtime)`.

- `createState(context)` is required and returns the initial state for one placed instance.
- `onTurnStart(context)` and `onTurnEnd(context)` are optional deterministic turn hooks.
- `getActions(context)` optionally returns the actions currently available from the instance.
- `executeAction(context, actionId, payload)` optionally handles one of those actions.

The context shape and turn ordering must be defined by the integration layer before hooks are called. Implementations must not own UI, alter prefab definitions, or bypass shared systems such as integrity, environment, navigation or power.

No prefab runtimes are registered in this foundation commit. Existing gameplay is not connected to this layer yet.
