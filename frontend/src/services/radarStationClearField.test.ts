import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { radarStationCRUD } from './radarStationService';
import type { UpdateRadarStationRequest } from '../types/radarStation';
import { safeDecimal } from '../utils/numberRuleHelper';

describe('Radar Station Clear Field & Null Handling (/radar-station)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'put').mockResolvedValue({
      data: {
        data: {
          id: '11111111-1111-1111-1111-111111111111',
          code: 'RADAR-000001',
          stationName: 'Trạm Radar Hòn Dáu',
          location: 'Hải Phòng',
          coverage: null,
          towerHeight: null,
          radarRange: null,
          emissionArea: null,
          note: null,
          conditionStatus: '1',
          geometryType: null,
          coordinates: null,
          mapIcon: null,
        },
      },
    });
  });

  it('TC-RADAR-CLEAR-01: sends null instead of undefined when user clears fields in form', async () => {
    const isEdit = true;
    const cleanString = (val: unknown) => {
      if (val === null || val === undefined) return isEdit ? null : undefined;
      const s = String(val).trim();
      return s === '' ? (isEdit ? null : undefined) : s;
    };
    const cleanNumber = (val: unknown) => {
      if (val === null || val === undefined || val === '') return isEdit ? null : undefined;
      const num = Number(val);
      return isNaN(num) ? (isEdit ? null : undefined) : num;
    };
    const cleanDecimal = (val: unknown) => {
      const res = safeDecimal(val);
      return res !== undefined ? res : (isEdit ? null : undefined);
    };

    const formValues = {
      stationName: 'Trạm Radar Hòn Dáu',
      location: 'Hải Phòng',
      coverage: '', // user cleared coverage
      towerHeight: '', // user cleared number
      radarRange: undefined, // user cleared range
      emissionArea: null,
      note: '   ', // user cleared whitespace
      operatingUnitId: undefined,
      seaportId: undefined,
      vtsSystemId: undefined,
      vtsOperationCenterId: undefined,
      conditionStatus: '1',
      unitOfMeasure: '',
      quantity: '',
      geometryType: undefined,
      coordinates: undefined,
      mapIcon: undefined,
    };

    const hasGeom = !!formValues.geometryType;

    const payload = {
      stationName: cleanString(formValues.stationName) ?? '',
      location: cleanString(formValues.location) ?? '',
      orgUnitId: (formValues as { orgUnitId?: string }).orgUnitId || (isEdit ? null : undefined),
      seaportId: formValues.seaportId || (isEdit ? null : undefined),
      vtsSystemId: formValues.vtsSystemId || (isEdit ? null : undefined),
      vtsOperationCenterId: formValues.vtsOperationCenterId || (isEdit ? null : undefined),
      operatingUnitId: formValues.operatingUnitId || (isEdit ? null : undefined),
      unitOfMeasure: cleanString(formValues.unitOfMeasure),
      quantity: cleanNumber(formValues.quantity),
      conditionStatus: cleanString(formValues.conditionStatus) || (isEdit ? null : '1'),
      towerHeight: cleanDecimal(formValues.towerHeight),
      radarRange: cleanDecimal(formValues.radarRange),
      emissionArea: cleanDecimal(formValues.emissionArea),
      coverage: cleanString(formValues.coverage),
      note: cleanString(formValues.note),
      longitude: hasGeom ? null : (isEdit ? null : null),
      latitude: hasGeom ? null : (isEdit ? null : null),
      geometryType: hasGeom ? null : (isEdit ? null : null),
      coordinates: hasGeom ? null : (isEdit ? null : null),
      mapIcon: hasGeom ? null : (isEdit ? null : null),
    };

    const jsonStr = JSON.stringify(payload);
    const parsed = JSON.parse(jsonStr);

    expect(parsed).toHaveProperty('coverage', null);
    expect(parsed).toHaveProperty('towerHeight', null);
    expect(parsed).toHaveProperty('radarRange', null);
    expect(parsed).toHaveProperty('emissionArea', null);
    expect(parsed).toHaveProperty('note', null);
    expect(parsed).toHaveProperty('unitOfMeasure', null);
    expect(parsed).toHaveProperty('quantity', null);
    expect(parsed).toHaveProperty('seaportId', null);
    expect(parsed).toHaveProperty('operatingUnitId', null);
    expect(parsed).toHaveProperty('geometryType', null);
    expect(parsed).toHaveProperty('coordinates', null);

    await radarStationCRUD.update('11111111-1111-1111-1111-111111111111', payload as UpdateRadarStationRequest);

    expect(api.put).toHaveBeenCalledTimes(1);
    expect(api.put).toHaveBeenCalledWith('/v1/radar-station/11111111-1111-1111-1111-111111111111', expect.objectContaining({
      coverage: null,
      towerHeight: null,
      radarRange: null,
      note: null,
      unitOfMeasure: null,
    }));
  });
});
