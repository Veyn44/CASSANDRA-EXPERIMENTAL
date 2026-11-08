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
    description: 'Interior electrical connector mounted beside a Titanium Hull Wall.',
    function: 'External-to-internal electrical connection',
    placement: 'titanium-wall-connector',
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
