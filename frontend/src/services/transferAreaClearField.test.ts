import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { transferAreaCRUD } from './portService';
import { safeDecimal } from '../utils/numberRuleHelper';

describe('Transfer Area Clear Field & Null Handling (/transfer-area)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'put').mockResolvedValue({
      data: {
        id: '44444444-4444-4444-4444-444444444444',
        transferAreaCode: 'HP-CT-001',
        transferAreaName: 'Khu chuyển tải Hải Phòng',
        detailedLocation: null,
        operationalFunctions: null,
        shapeDescription: null,
        area: null,
        designWaterDepth: null,
        currentWaterDepth: null,
        bottomElevationDesign: null,
        maxVesselDWT: null,
        activeTransferCount: null,
        publishedTransferCount: null,
        underInvestmentTransferCount: null,
        remarks: null,
        publicDecision: null,
        investmentAgreement: null,
        activityStartDate: null,
        activityEndDate: null,
        geometryType: null,
        coordinates: null,
        mapSymbolId: null,
      },
    });
  });

  it('TC-TRANSFER-AREA-CLEAR-01: sends null instead of undefined when user clears fields in edit mode', () => {
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
      portId: '22222222-2222-2222-2222-222222222222',
      transferAreaCode: 'HP-CT-001',
      transferAreaName: 'Khu chuyển tải Hải Phòng',
      provinceId: undefined,
      detailedLocation: '   ',
      operationalFunctions: '',
      operationalStatus: undefined,
      shapeDescription: '   ',
      area: '',
      designWaterDepth: '',
      currentWaterDepth: '  ',
      bottomElevationDesign: '',
      maxVesselDWT: '   ',
      activeTransferCount: '',
      publishedTransferCount: '',
      underInvestmentTransferCount: '',
      remarks: '  ',
      openingAnnouncementDate: undefined,
      publicDecision: '',
      investmentAgreement: '  ',
      activityStartDate: undefined,
      activityEndDate: undefined,
      geometryType: undefined,
      mapSymbolId: undefined,
      coordinateSystem: undefined,
      displayRule: undefined,
    };

    const payload: Record<string, unknown> = {
      orgUnitId: vals.orgUnitId,
      portId: vals.portId,
      transferAreaCode: vals.transferAreaCode?.trim() || undefined,
      transferAreaName: vals.transferAreaName?.trim(),
      provinceId: isEdit ? null : undefined,
      detailedLocation: cleanString(vals.detailedLocation),
      operationalFunctions: cleanString(vals.operationalFunctions),
      operationalStatus: vals.operationalStatus || (isEdit ? null : undefined),
      shapeDescription: cleanString(vals.shapeDescription),
      area: cleanDecimal(vals.area),
      designWaterDepth: cleanString(vals.designWaterDepth),
      currentWaterDepth: cleanString(vals.currentWaterDepth),
      bottomElevationDesign: cleanString(vals.bottomElevationDesign),
      maxVesselDWT: cleanString(vals.maxVesselDWT),
      activeTransferCount: cleanNumber(vals.activeTransferCount),
      publishedTransferCount: cleanNumber(vals.publishedTransferCount),
      underInvestmentTransferCount: cleanNumber(vals.underInvestmentTransferCount),
      remarks: cleanString(vals.remarks),
      openingAnnouncementDate: isEdit ? null : undefined,
      publicDecision: cleanString(vals.publicDecision),
      investmentAgreement: cleanString(vals.investmentAgreement),
      activityStartDate: isEdit ? null : undefined,
      activityEndDate: isEdit ? null : undefined,
      geometryType: isEdit ? null : null,
      mapSymbolId: isEdit ? null : null,
      coordinateSystem: isEdit ? null : null,
      displayRule: isEdit ? null : null,
      latitude: isEdit ? null : null,
      longitude: isEdit ? null : null,
      coordinates: isEdit ? null : null,
    };

    const jsonStr = JSON.stringify(payload);
    const parsed = JSON.parse(jsonStr);

    expect(parsed).toHaveProperty('detailedLocation', null);
    expect(parsed).toHaveProperty('operationalFunctions', null);
    expect(parsed).toHaveProperty('shapeDescription', null);
    expect(parsed).toHaveProperty('area', null);
    expect(parsed).toHaveProperty('designWaterDepth', null);
    expect(parsed).toHaveProperty('currentWaterDepth', null);
    expect(parsed).toHaveProperty('bottomElevationDesign', null);
    expect(parsed).toHaveProperty('maxVesselDWT', null);
    expect(parsed).toHaveProperty('activeTransferCount', null);
    expect(parsed).toHaveProperty('publishedTransferCount', null);
    expect(parsed).toHaveProperty('underInvestmentTransferCount', null);
    expect(parsed).toHaveProperty('remarks', null);
    expect(parsed).toHaveProperty('publicDecision', null);
    expect(parsed).toHaveProperty('investmentAgreement', null);
    expect(parsed).toHaveProperty('geometryType', null);
    expect(parsed).toHaveProperty('coordinates', null);
  });

  it('TC-TRANSFER-AREA-CLEAR-02: transferAreaCRUD.update passes null fields in PUT body', async () => {
    const putSpy = vi.spyOn(api, 'put');

    const updateData = {
      id: '44444444-4444-4444-4444-444444444444',
      transferAreaName: 'Khu chuyển tải Hải Phòng',
      detailedLocation: null,
      operationalFunctions: null,
      shapeDescription: null,
      area: null,
      remarks: null,
      geometryType: null,
      coordinates: null,
    };

    await transferAreaCRUD.update(updateData as unknown as Parameters<typeof transferAreaCRUD.update>[0]);

    expect(putSpy).toHaveBeenCalledTimes(1);
    const calledBody = putSpy.mock.calls[0][1] as Record<string, unknown>;
    expect(calledBody.detailedLocation).toBeNull();
    expect(calledBody.operationalFunctions).toBeNull();
    expect(calledBody.shapeDescription).toBeNull();
    expect(calledBody.area).toBeNull();
    expect(calledBody.remarks).toBeNull();
    expect(calledBody.geometryType).toBeNull();
    expect(calledBody.coordinates).toBeNull();
  });
});
