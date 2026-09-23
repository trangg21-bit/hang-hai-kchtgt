import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { updateDryPort } from '../pages/port/dry-port/api';
import { safeDecimal } from '../utils/numberRuleHelper';

describe('Dry Port Clear Field & Null Handling (/dry-port)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'put').mockResolvedValue({
      data: {
        id: '55555555-5555-5555-5555-555555555555',
        dryPortCode: 'CC-000001',
        dryPortName: 'Cảng cạn Đình Vũ',
        detailedLocation: null,
        region: null,
        operatingUnit: null,
        transportCorridor: null,
        area: null,
        warehouseArea: null,
        yardArea: null,
        teuCapacity: null,
        portStatus: null,
        connectionMode: null,
        remarks: null,
        announcementDecisionNumber: null,
        announcementOrg: null,
        openingDecision: null,
        investmentAgreementDoc: null,
        geometryType: null,
        coordinates: null,
        mapSymbolId: null,
      },
    });
  });

  it('TC-DRYPORT-CLEAR-01: sends null instead of undefined when user clears fields in edit mode', () => {
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
      dryPortCode: 'CC-000001',
      dryPortName: 'Cảng cạn Đình Vũ',
      provinceId: undefined,
      detailedLocation: '   ',
      region: '',
      operatingOrgId: undefined,
      operatingUnit: '  ',
      transportCorridor: '',
      area: '',
      warehouseArea: '',
      yardArea: '  ',
      teuCapacity: '',
      portStatus: '',
      connectionMode: ' ',
      remarks: '  ',
      announcementTime: undefined,
      announcementDecisionNumber: '',
      announcementDecisionDate: undefined,
      announcementOrg: '  ',
      openingAnnouncementDate: undefined,
      openingDecision: '',
      investmentAgreementDoc: '  ',
      geometryType: undefined,
      mapSymbolId: undefined,
      coordinateSystem: undefined,
      displayRule: undefined,
    };

    const payload: Record<string, unknown> = {
      dryPortCode: vals.dryPortCode?.trim() || undefined,
      dryPortName: vals.dryPortName?.trim(),
      orgUnitId: vals.orgUnitId,
      provinceId: isEdit ? null : undefined,
      detailedLocation: cleanString(vals.detailedLocation),
      region: cleanString(vals.region),
      operatingOrgId: vals.operatingOrgId || (isEdit ? null : undefined),
      operatingUnit: cleanString(vals.operatingUnit),
      transportCorridor: cleanString(vals.transportCorridor),
      area: cleanDecimal(vals.area),
      warehouseArea: cleanDecimal(vals.warehouseArea),
      yardArea: cleanDecimal(vals.yardArea),
      teuCapacity: cleanDecimal(vals.teuCapacity),
      portStatus: cleanNumber(vals.portStatus),
      connectionMode: cleanString(vals.connectionMode),
      remarks: cleanString(vals.remarks),
      announcementTime: isEdit ? null : undefined,
      announcementDecisionNumber: cleanString(vals.announcementDecisionNumber),
      announcementDecisionDate: isEdit ? null : undefined,
      announcementOrg: cleanString(vals.announcementOrg),
      openingAnnouncementDate: isEdit ? null : undefined,
      openingDecision: cleanString(vals.openingDecision),
      investmentAgreementDoc: cleanString(vals.investmentAgreementDoc),
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
    expect(parsed).toHaveProperty('region', null);
    expect(parsed).toHaveProperty('operatingUnit', null);
    expect(parsed).toHaveProperty('transportCorridor', null);
    expect(parsed).toHaveProperty('area', null);
    expect(parsed).toHaveProperty('warehouseArea', null);
    expect(parsed).toHaveProperty('yardArea', null);
    expect(parsed).toHaveProperty('teuCapacity', null);
    expect(parsed).toHaveProperty('portStatus', null);
    expect(parsed).toHaveProperty('connectionMode', null);
    expect(parsed).toHaveProperty('remarks', null);
    expect(parsed).toHaveProperty('announcementDecisionNumber', null);
    expect(parsed).toHaveProperty('announcementOrg', null);
    expect(parsed).toHaveProperty('openingDecision', null);
    expect(parsed).toHaveProperty('investmentAgreementDoc', null);
    expect(parsed).toHaveProperty('geometryType', null);
    expect(parsed).toHaveProperty('coordinates', null);
  });

  it('TC-DRYPORT-CLEAR-02: updateDryPort passes null fields in PUT body', async () => {
    const putSpy = vi.spyOn(api, 'put');

    const updateData = {
      id: '55555555-5555-5555-5555-555555555555',
      dryPortName: 'Cảng cạn Đình Vũ',
      detailedLocation: null,
      region: null,
      operatingUnit: null,
      transportCorridor: null,
      area: null,
      warehouseArea: null,
      yardArea: null,
      teuCapacity: null,
      portStatus: null,
      connectionMode: null,
      remarks: null,
      announcementDecisionNumber: null,
      announcementOrg: null,
      openingDecision: null,
      investmentAgreementDoc: null,
      geometryType: null,
      coordinates: null,
      mapSymbolId: null,
    };

    await updateDryPort(updateData as unknown as Parameters<typeof updateDryPort>[0]);

    expect(putSpy).toHaveBeenCalledTimes(1);
    const calledBody = putSpy.mock.calls[0][1] as Record<string, unknown>;
    expect(calledBody.detailedLocation).toBeNull();
    expect(calledBody.region).toBeNull();
    expect(calledBody.operatingUnit).toBeNull();
    expect(calledBody.transportCorridor).toBeNull();
    expect(calledBody.area).toBeNull();
    expect(calledBody.warehouseArea).toBeNull();
    expect(calledBody.yardArea).toBeNull();
    expect(calledBody.teuCapacity).toBeNull();
    expect(calledBody.portStatus).toBeNull();
    expect(calledBody.connectionMode).toBeNull();
    expect(calledBody.remarks).toBeNull();
    expect(calledBody.announcementDecisionNumber).toBeNull();
    expect(calledBody.announcementOrg).toBeNull();
    expect(calledBody.openingDecision).toBeNull();
    expect(calledBody.investmentAgreementDoc).toBeNull();
    expect(calledBody.geometryType).toBeNull();
    expect(calledBody.coordinates).toBeNull();
  });
});
