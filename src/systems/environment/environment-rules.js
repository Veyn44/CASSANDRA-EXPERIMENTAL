/**
 * Shared, pure environment-rule fallback.
 *
 * Floor-specific rules receive one immutable turn snapshot and return the
 * next environment state for their own floor. Cross-floor reads belong in
 * the supplied context; this function intentionally performs no simulation.
 */
export function evaluateDefaultFloorEnvironment(context) {
  return context.ownEnvironment;
}
