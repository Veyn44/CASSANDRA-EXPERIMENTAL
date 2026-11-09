import { sleepingModuleRuntime } from './modules/sleeping-module/sleeping-module.js';
const moduleRuntimes = new Map([[sleepingModuleRuntime.id, sleepingModuleRuntime]]);

export function registerModuleRuntime(runtime) {
  if (!runtime || typeof runtime.id !== 'string' || typeof runtime.createState !== 'function')
    throw new TypeError('A valid module runtime definition is required.');
  if (moduleRuntimes.has(runtime.id))
    throw new Error('Module runtime already registered: ' + runtime.id);

  moduleRuntimes.set(runtime.id, runtime);
  return runtime;
}

export function getModuleRuntime(prefabId) {
  return moduleRuntimes.get(prefabId) ?? null;
}

export function getRegisteredModuleRuntimeIds() {
  return [...moduleRuntimes.keys()];
}

export function createModuleRuntimeState(prefabId, context) {
  const runtime = getModuleRuntime(prefabId);
  return runtime ? runtime.createState(context) : null;
}
