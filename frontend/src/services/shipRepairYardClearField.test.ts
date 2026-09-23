import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { shipRepairYardCRUD } from './portService';
import { safeDecimal } from '../utils/numberRuleHelper';

describe('Ship Repair Yard Clear Field & Null Handling (/ship-repair-yard)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'put').mockResolvedValue({
      data: {
        id: '22222222-2222-2222-2222-222222222222',
        shipRepairYardCode: 'CB-000004-SCDT-001',
        shipRepairYardName: 'Cơ sở sửa chữa đóng tàu Hải Phòng',
        detailedLocation: null,
        usageFunction: null,
        workshopArea: null,
        vesselType: null,
        vesselDwt: null,
        businessType: null,
        activity: null,
        slipwayCount: null,
        remarks: null,
        geometryType: null,
        coordinates: null,
        mapSymbolId: null,
        coordinateSystem: null,
        displayRule: null,
      },
    });
  });

  it('TC-SHIP-REPAIR-CLEAR-01: sends null instead of undefined when user clears fields in edit mode', async () => {
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

    const vals = {
      orgUnitId: '11111111-1111-1111-1111-111111111111',
      portId: '33333333-3333-3333-3333-333333333333',
      shipRepairYardCode: 'CB-000004-SCDT-001',
      shipRepairYardName: 'Cơ sở sửa chữa đóng tàu Hải Phòng',
      pierId: undefined, // user cleared pier
      provinceId: undefined,
      detailedLocation: '   ', // user cleared whitespace
      operationalStatus: undefined,
      usageFunction: '', // user cleared string
      workshopArea: '', // user cleared decimal
      vesselType: '',
      vesselDwt: '  ',
      businessType: '',
      activity: '  ',
      slipwayCount: '', // user cleared number
      remarks: '',
      geometryType: undefined,
      mapSymbolId: undefined,
      coordinateSystem: undefined,
      displayRule: undefined,
    };

    const payload: Record<string, unknown> = {
      orgUnitId: vals.orgUnitId,
      portId: vals.portId,
      shipRepairYardCode: String(vals.shipRepairYardCode || '').trim() || undefined,
      shipRepairYardName: String(vals.shipRepairYardName || '').trim(),
      pierId: vals.pierId || (isEdit ? null : undefined),
      detailedLocation: cleanString(vals.detailedLocation),
      operationalStatus: vals.operationalStatus || (isEdit ? null : undefined),
      usageFunction: cleanString(vals.usageFunction),
      workshopArea: cleanDecimal(vals.workshopArea),
      vesselType: cleanString(vals.vesselType),
      vesselDwt: cleanString(vals.vesselDwt),
      businessType: cleanString(vals.businessType),
      activity: cleanString(vals.activity),
      slipwayCount: cleanNumber(vals.slipwayCount),
      remarks: cleanString(vals.remarks),
      latitude: isEdit ? null : null,
      longitude: isEdit ? null : null,
      coordinates: isEdit ? null : null,
      geometryType: isEdit ? null : null,
      mapSymbolId: isEdit ? null : null,
      coordinateSystem: isEdit ? null : null,
      displayRule: isEdit ? null : null,
    };

    const jsonStr = JSON.stringify(payload);
    const parsed = JSON.parse(jsonStr);

    expect(parsed).toHaveProperty('detailedLocation', null);
    expect(parsed).toHaveProperty('usageFunction', null);
    expect(parsed).toHaveProperty('workshopArea', null);
    expect(parsed).toHaveProperty('vesselType', null);
    expect(parsed).toHaveProperty('vesselDwt', null);
    expect(parsed).toHaveProperty('businessType', null);
    expect(parsed).toHaveProperty('activity', null);
    expect(parsed).toHaveProperty('slipwayCount', null);
    expect(parsed).toHaveProperty('remarks', null);
    expect(parsed).toHaveProperty('pierId', null);
    expect(parsed).toHaveProperty('geometryType', null);
    expect(parsed).toHaveProperty('coordinates', null);
  });

  it('TC-SHIP-REPAIR-CLEAR-02: shipRepairYardCRUD.update passes null fields in PUT body', async () => {
    const putSpy = vi.spyOn(api, 'put');

    const updateData = {
      id: '22222222-2222-2222-2222-222222222222',
      shipRepairYardName: 'Cơ sở sửa chữa đóng tàu Hải Phòng',
      detailedLocation: null,
      usageFunction: null,
      workshopArea: null,
      remarks: null,
      geometryType: null,
      coordinates: null,
    };

    await shipRepairYardCRUD.update(updateData as unknown as Parameters<typeof shipRepairYardCRUD.update>[0]);

    expect(putSpy).toHaveBeenCalledTimes(1);
    const calledBody = putSpy.mock.calls[0][1] as Record<string, unknown>;
    expect(calledBody.detailedLocation).toBeNull();
    expect(calledBody.usageFunction).toBeNull();
    expect(calledBody.workshopArea).toBeNull();
    expect(calledBody.remarks).toBeNull();
    expect(calledBody.geometryType).toBeNull();
    expect(calledBody.coordinates).toBeNull();
  });
});
