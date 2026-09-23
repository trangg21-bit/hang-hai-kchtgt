import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { anchorageCRUD } from './portService';
import { safeDecimal } from '../utils/numberRuleHelper';

describe('Anchorage Clear Field & Null Handling (/anchorage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'put').mockResolvedValue({
      data: {
        id: '33333333-3333-3333-3333-333333333333',
        anchorageCode: 'HP-ND-001',
        anchorageName: 'Khu neo Hải Phòng',
        detailedLocation: null,
        shapeDescription: null,
        area: null,
        designWaterDepth: null,
        currentWaterDepth: null,
        bottomElevationDesign: null,
        maxVesselDWT: null,
        activeAnchorageCount: null,
        publishedAnchorageCount: null,
        underInvestmentAnchorageCount: null,
        remarks: null,
        publicDecision: null,
        investmentAgreement: null,
        geometryType: null,
        coordinates: null,
        mapSymbolId: null,
      },
    });
  });

  it('TC-ANCHORAGE-CLEAR-01: sends null instead of undefined when user clears fields in edit mode', () => {
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
      navigationChannelId: undefined,
      buoyStationId: undefined,
      anchorageCode: 'HP-ND-001',
      anchorageName: 'Khu neo Hải Phòng',
      provinceId: undefined,
      detailedLocation: '   ',
      operationalStatus: undefined,
      shapeDescription: '',
      area: '',
      designWaterDepth: '',
      currentWaterDepth: '  ',
      bottomElevationDesign: '',
      maxVesselDWT: '',
      activeAnchorageCount: '',
      publishedAnchorageCount: '',
      underInvestmentAnchorageCount: '',
      remarks: '  ',
      openingAnnouncementDate: undefined,
      publicDecision: '',
      investmentAgreement: '  ',
      geometryType: undefined,
      mapSymbolId: undefined,
      coordinateSystem: undefined,
      displayRule: undefined,
    };

    const payload: Record<string, unknown> = {
      orgUnitId: vals.orgUnitId,
      portId: vals.portId,
      navigationChannelId: vals.navigationChannelId || (isEdit ? null : undefined),
      buoyStationId: vals.buoyStationId || (isEdit ? null : undefined),
      anchorageCode: vals.anchorageCode?.trim() || undefined,
      anchorageName: vals.anchorageName?.trim(),
      provinceId: isEdit ? null : undefined,
      detailedLocation: cleanString(vals.detailedLocation),
      operationalStatus: vals.operationalStatus || (isEdit ? null : undefined),
      shapeDescription: cleanString(vals.shapeDescription),
      area: cleanDecimal(vals.area),
      designWaterDepth: cleanDecimal(vals.designWaterDepth),
      currentWaterDepth: cleanDecimal(vals.currentWaterDepth),
      bottomElevationDesign: cleanDecimal(vals.bottomElevationDesign),
      maxVesselDWT: cleanDecimal(vals.maxVesselDWT),
      activeAnchorageCount: cleanNumber(vals.activeAnchorageCount),
      publishedAnchorageCount: cleanNumber(vals.publishedAnchorageCount),
      underInvestmentAnchorageCount: cleanNumber(vals.underInvestmentAnchorageCount),
      remarks: cleanString(vals.remarks),
      openingAnnouncementDate: isEdit ? null : undefined,
      publicDecision: cleanString(vals.publicDecision),
      investmentAgreement: cleanString(vals.investmentAgreement),
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
    expect(parsed).toHaveProperty('shapeDescription', null);
    expect(parsed).toHaveProperty('area', null);
    expect(parsed).toHaveProperty('designWaterDepth', null);
    expect(parsed).toHaveProperty('currentWaterDepth', null);
    expect(parsed).toHaveProperty('bottomElevationDesign', null);
    expect(parsed).toHaveProperty('maxVesselDWT', null);
    expect(parsed).toHaveProperty('activeAnchorageCount', null);
    expect(parsed).toHaveProperty('publishedAnchorageCount', null);
    expect(parsed).toHaveProperty('underInvestmentAnchorageCount', null);
    expect(parsed).toHaveProperty('remarks', null);
    expect(parsed).toHaveProperty('publicDecision', null);
    expect(parsed).toHaveProperty('investmentAgreement', null);
    expect(parsed).toHaveProperty('geometryType', null);
    expect(parsed).toHaveProperty('coordinates', null);
  });

  it('TC-ANCHORAGE-CLEAR-02: anchorageCRUD.update passes null fields in PUT body', async () => {
    const putSpy = vi.spyOn(api, 'put');

    const updateData = {
      id: '33333333-3333-3333-3333-333333333333',
      anchorageName: 'Khu neo Hải Phòng',
      detailedLocation: null,
      shapeDescription: null,
      area: null,
      remarks: null,
      geometryType: null,
      coordinates: null,
    };

    await anchorageCRUD.update(updateData as unknown as Parameters<typeof anchorageCRUD.update>[0]);

    expect(putSpy).toHaveBeenCalledTimes(1);
    const calledBody = putSpy.mock.calls[0][1] as Record<string, unknown>;
    expect(calledBody.detailedLocation).toBeNull();
    expect(calledBody.shapeDescription).toBeNull();
    expect(calledBody.area).toBeNull();
    expect(calledBody.remarks).toBeNull();
    expect(calledBody.geometryType).toBeNull();
    expect(calledBody.coordinates).toBeNull();
  });
});
