// Backward-compatible entry point. The active legacy Z0 environment implementation
// now lives with the Z0 floor; other floors have isolated copies ready for later divergence.
export {
  advanceEnvironment,
  completeSectionScan,
  detectSections,
  getSectionInfo,
  getVacuumInfo,
  pressureStates,
} from '../ship-floors/Z0/environment/section-manager.js';
