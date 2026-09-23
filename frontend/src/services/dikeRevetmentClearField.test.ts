import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { dikeRevetmentCRUD } from './dikeRevetmentService';
import type { UpdateDikeRevetmentRequest } from '../types/dikeRevetment';
import { safeDecimal } from '../utils/numberRuleHelper';
import dayjs from 'dayjs';

describe('Dike Revetment Clear Field & Null Handling (/dike-revetment)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'put').mockResolvedValue({
      data: {
        data: {
          id: '11111111-1111-1111-1111-111111111111',
          code: 'DK-000001',
          dikeRevetmentName: 'Đê kè Bạch Đằng',
          locationDetail: null,
          location: 'Hải Phòng',
          height: null,
          crestElevation: null,
          length: '350.5',
          constructionDate: null,
          lastMaintenanceYear: null,
          commissioningDate: null,
          note: null,
          status: '1',
          geometryType: null,
          coordinates: null,
          symbolId: null,
        },
      },
    });
  });

  it('TC-DIKE-CLEAR-01: sends null instead of undefined when user clears fields in form', async () => {
    const trimOrNull = (v: unknown): string | null => {
      if (v == null) return null;
      const s = String(v).trim();
      return s === '' ? null : s;
    };
    const dateOrNull = (v: unknown): string | null => {
      if (!v) return null;
      return dayjs.isDayjs(v) ? v.format('YYYY-MM-DD') : String(v);
    };
    const yearOrNull = (v: unknown): number | null => {
      if (!v) return null;
      if (dayjs.isDayjs(v)) return Number(v.format('YYYY'));
      const n = Number(v);
      return Number.isNaN(n) ? null : n;
    };
    const decimalOrNull = (v: unknown): number | string | null => {
      const dec = safeDecimal(v);
      return dec !== undefined ? dec : null;
    };

    const formValues = {
      dikeRevetmentType: 'RIVER_DIKE',
      dikeRevetmentName: 'Đê kè Bạch Đằng',
      location: 'Hải Phòng',
      locationDetail: '', // user cleared text
      height: '', // user cleared number
      crestElevation: undefined, // user cleared number
      length: '350.5',
      constructionDate: null, // user cleared date
      lastMaintenanceYear: undefined, // user cleared year
      commissioningDate: null,
      note: '   ', // whitespace cleared
      operatingUnitId: undefined,
      seaportId: undefined,
      status: '1',
      geometryType: undefined,
      symbolId: undefined,
      coordinates: undefined,
    };

    const hasGeom = !!formValues.geometryType;

    const payload: Record<string, unknown> = {
      dikeRevetmentType: formValues.dikeRevetmentType || null,
      location: trimOrNull(formValues.location),
      locationDetail: trimOrNull(formValues.locationDetail),
      dikeRevetmentName: trimOrNull(formValues.dikeRevetmentName),
      seaportId: formValues.seaportId || null,
      operatingUnitId: formValues.operatingUnitId || null,
      constructionDate: dateOrNull(formValues.constructionDate),
      lastMaintenanceYear: yearOrNull(formValues.lastMaintenanceYear),
      length: decimalOrNull(formValues.length),
      crestElevation: decimalOrNull(formValues.crestElevation),
      commissioningDate: dateOrNull(formValues.commissioningDate),
      height: decimalOrNull(formValues.height),
      status: trimOrNull(formValues.status),
      note: trimOrNull(formValues.note),
      geometryType: hasGeom ? formValues.geometryType : null,
      coordinates: hasGeom ? formValues.coordinates : null,
      symbolId: hasGeom && formValues.symbolId ? formValues.symbolId : null,
    };

    // When serialized to JSON, keys with null are preserved (unlike undefined)
    const jsonStr = JSON.stringify(payload);
    const parsed = JSON.parse(jsonStr);

    expect(parsed).toHaveProperty('locationDetail', null);
    expect(parsed).toHaveProperty('height', null);
    expect(parsed).toHaveProperty('crestElevation', null);
    expect(parsed).toHaveProperty('constructionDate', null);
    expect(parsed).toHaveProperty('lastMaintenanceYear', null);
    expect(parsed).toHaveProperty('commissioningDate', null);
    expect(parsed).toHaveProperty('note', null);
    expect(parsed).toHaveProperty('operatingUnitId', null);
    expect(parsed).toHaveProperty('seaportId', null);
    expect(parsed).toHaveProperty('geometryType', null);
    expect(parsed).toHaveProperty('coordinates', null);
    expect(parsed).toHaveProperty('symbolId', null);
    expect(parsed.length).toBe('350.5');

    await dikeRevetmentCRUD.update('11111111-1111-1111-1111-111111111111', payload as UpdateDikeRevetmentRequest);

    expect(api.put).toHaveBeenCalledTimes(1);
    expect(api.put).toHaveBeenCalledWith('/v1/dike-revetment/11111111-1111-1111-1111-111111111111', expect.objectContaining({
      locationDetail: null,
      height: null,
      crestElevation: null,
      note: null,
      operatingUnitId: null,
      seaportId: null,
    }));
  });
});
