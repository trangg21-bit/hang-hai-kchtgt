export interface AnchorageBuoyBerthOptionSource {
  id: string;
  buoyBerthCode?: string;
  buoyBerthName?: string;
}

export const buildAnchorageBuoyBerthQuery = (orgUnitId: string) => ({
  page: 1,
  pageSize: 1000,
  approvalStatus: 'APPROVED',
  orgUnitId,
});

export const toAnchorageBuoyBerthOptions = (
  records: readonly AnchorageBuoyBerthOptionSource[] = [],
): Array<{ value: string; label: string }> => records.map((record) => ({
  value: record.id,
  label: record.buoyBerthCode && record.buoyBerthName
    ? `${record.buoyBerthCode} - ${record.buoyBerthName}`
    : record.buoyBerthName || record.buoyBerthCode || record.id,
}));
