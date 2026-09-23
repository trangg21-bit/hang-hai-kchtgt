import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { updateVtsAssist } from './vtsassist/api';
import type { UpdateVtsAssistRequest } from './vtsassist/types';

describe('VTS Assist Clear Field & Null Handling (/vts-assist)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'put').mockResolvedValue({
      data: {
        data: {
          id: '11111111-1111-1111-1111-111111111111',
          deviceCode: 'PTVTS-000001',
          deviceName: 'Hệ thống phụ trợ VTS Hải Phòng',
          detailedLocation: null,
          provinceName: null,
          model: null,
          manufacturer: null,
          note: null,
          specifications: null,
          maintenanceInformation: null,
          unitOfMeasure: null,
          yearOfUse: null,
        },
      },
    });
  });

  it('TC-VTSASSIST-CLEAR-01: sends null instead of undefined when user clears fields', async () => {
    const trimOrNull = (v: unknown): string | null => {
      if (v == null) return null;
      const s = String(v).trim();
      return s === '' ? null : s;
    };
    const numOrNull = (v: unknown): number | null => {
      if (v == null || v === '') return null;
      const n = Number(v);
      return Number.isNaN(n) ? null : n;
    };

    const formValues = {
      deviceName: 'Hệ thống phụ trợ VTS Hải Phòng',
      operatingUnitId: '44444444-4444-4444-4444-444444444444',
      detailedLocation: '', // user cleared text
      provinceName: undefined, // user cleared dropdown
      model: '   ', // whitespace only
      manufacturer: '',
      note: '',
      specifications: '',
      maintenanceInformation: '',
      unitOfMeasure: undefined,
      yearOfUse: null,
      orgUnitId: undefined,
      attachedInfrastructureId: undefined,
      attachedInfrastructureType: undefined,
    };

    const payload: UpdateVtsAssistRequest = {
      id: '11111111-1111-1111-1111-111111111111',
      deviceName: String(formValues.deviceName || '').trim(),
      operatingUnitId: formValues.operatingUnitId,
      detailedLocation: trimOrNull(formValues.detailedLocation),
      provinceName: trimOrNull(formValues.provinceName),
      model: trimOrNull(formValues.model),
      manufacturer: trimOrNull(formValues.manufacturer),
      note: trimOrNull(formValues.note),
      specifications: trimOrNull(formValues.specifications),
      maintenanceInformation: trimOrNull(formValues.maintenanceInformation),
      unitOfMeasure: numOrNull(formValues.unitOfMeasure),
      yearOfUse: numOrNull(formValues.yearOfUse),
      orgUnitId: formValues.orgUnitId || null,
      attachedInfrastructureId: formValues.attachedInfrastructureId || null,
      attachedInfrastructureType: numOrNull(formValues.attachedInfrastructureType),
      quantity: 1,
    };

    // When serialized to JSON, keys with null are preserved (unlike undefined)
    const jsonStr = JSON.stringify(payload);
    const parsed = JSON.parse(jsonStr);

    expect(parsed).toHaveProperty('detailedLocation', null);
    expect(parsed).toHaveProperty('provinceName', null);
    expect(parsed).toHaveProperty('model', null);
    expect(parsed).toHaveProperty('manufacturer', null);
    expect(parsed).toHaveProperty('note', null);
    expect(parsed).toHaveProperty('specifications', null);
    expect(parsed).toHaveProperty('maintenanceInformation', null);
    expect(parsed).toHaveProperty('unitOfMeasure', null);
    expect(parsed).toHaveProperty('yearOfUse', null);
    expect(parsed).toHaveProperty('orgUnitId', null);

    await updateVtsAssist(payload);

    expect(api.put).toHaveBeenCalledTimes(1);
    expect(api.put).toHaveBeenCalledWith('/v1/vtsassist', expect.objectContaining({
      id: '11111111-1111-1111-1111-111111111111',
      detailedLocation: null,
      model: null,
      manufacturer: null,
    }));
  });
});
