const OPTIONAL_HOOKS = ['onTurnStart', 'onTurnEnd', 'getActions', 'executeAction'];

export function defineModuleRuntime({
  id,
  createState,
  onTurnStart = null,
  onTurnEnd = null,
  getActions = null,
  executeAction = null,
}) {
  if (typeof id !== 'string' || !/^(MOD|STR)\\d{4}$/.test(id))
    throw new TypeError('Module runtime requires a valid MOD or STR prefab ID.');
  if (typeof createState !== 'function')
    throw new TypeError('Module runtime requires a createState(context) function.');

  const runtime = { id, createState };
  for (const hook of OPTIONAL_HOOKS) {
    const implementation = hook === 'createState' ? createState : ({ onTurnStart, onTurnEnd, getActions, executeAction })[hook];
    if (implementation !== null && typeof implementation !== 'function')
      throw new TypeError('Module runtime hook "' + hook + '" must be a function or null.');
    if (implementation) runtime[hook] = implementation;
  }

  return Object.freeze(runtime);
}
