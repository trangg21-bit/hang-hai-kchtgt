export interface StormShelterBuoyBerthOptionSource {
  id: string;
  buoyBerthCode?: string;
  buoyBerthName?: string;
}

export const buildStormShelterBuoyBerthQuery = (orgUnitId: string) => ({
  page: 1,
  pageSize: 1000,
  approvalStatus: 'APPROVED',
  orgUnitId,
});

export const toStormShelterBuoyBerthOptions = (
  records: readonly StormShelterBuoyBerthOptionSource[] = [],
): Array<{ value: string; label: string }> => records.map((record) => ({
  value: record.id,
  label: record.buoyBerthCode && record.buoyBerthName
    ? `${record.buoyBerthCode} - ${record.buoyBerthName}`
    : record.buoyBerthName || record.buoyBerthCode || record.id,
}));
