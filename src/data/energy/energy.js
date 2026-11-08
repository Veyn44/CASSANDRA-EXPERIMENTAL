const base = {
  stats: {},
  attributes: {},
  requirements: {},
  systems: {},
  defaultMaterialFamily: 'titanium',
};

export const ENERGY = [
  {
    ...base,
    id: 'ENR0001',
    legacyId: 'wall-light',
    legacyIds: ['FUR0001'],
    name: 'Wall Light',
    category: 'power',
    subcategory: 'lighting',
    type: 'energy',
    w: 1,
    h: 1,
    description: 'Interior wall-mounted light fixture.',
    function: 'Interior lighting',
    placement: 'wall-mounted',
    systems: { powerRoute: true },
  },
  {
    ...base,
    id: 'ENR0002',
    legacyId: 'titanium-wall-connector',
    legacyIds: ['FUR0002'],
    name: 'Titanium Wall Connector',
    category: 'power',
    subcategory: 'distribution',
    type: 'energy',
    w: 1,
    h: 1,
    description: 'Conductive overlay mounted directly on a Titanium Hull Wall. Requires 1 Titanium + 1 Aluminium.',
    function: 'External-to-internal electrical connection',
    placement: 'wall-overlay',
    constructionCost: { titanium: 1, aluminium: 1 },
    systems: { powerRoute: true },
  },
];

export const ENERGY_BY_ID = Object.freeze(
  Object.fromEntries(
    ENERGY.flatMap((item) => [
      [item.id, item],
      ...item.legacyIds.map((id) => [id, item]),
    ])
  )
);
export const ENERGY_BY_LEGACY_ID = Object.freeze(
  Object.fromEntries(ENERGY.map((item) => [item.legacyId, item]))
);
export function getEnergy(id) {
  return ENERGY_BY_ID[id] ?? ENERGY_BY_LEGACY_ID[id] ?? null;
}
