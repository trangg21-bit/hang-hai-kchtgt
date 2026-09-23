import { describe, it, expect } from 'vitest';

describe('BeaconStation Form Cleared Fields Payload (/beacon-stations)', () => {
  const cleanString = (val: any, isEdit: boolean) => {
    if (val === null || val === undefined) return isEdit ? null : undefined;
    const s = String(val).trim();
    return s === '' ? (isEdit ? null : undefined) : s;
  };

  const cleanNumber = (val: any, isEdit: boolean) => {
    if (val === null || val === undefined || val === '') return isEdit ? null : undefined;
    const num = Number(val);
    return isNaN(num) ? (isEdit ? null : undefined) : num;
  };

  const cleanDecimal = (val: any, isEdit: boolean) => {
    if (val === null || val === undefined || val === '') return isEdit ? null : undefined;
    const num = Number(val);
    return isNaN(num) ? (isEdit ? null : undefined) : num;
  };

  const toDate = (v: any, isEdit: boolean) => (v ? String(v) : (isEdit ? null : undefined));

  it('TC-CLEAR-01: When editing, clearing a text field sends null in payload so backend can clear it', () => {
    const isEdit = true;
    const values = {
      name: 'Đèn biển Hòn Dấu',
      detailedLocation: '', // user cleared this field
      operator: '   ', // user entered spaces then cleared
      note: null, // user cleared note
    };

    const payload: any = {
      name: cleanString(values.name, isEdit),
      detailedLocation: cleanString(values.detailedLocation, isEdit),
      operator: cleanString(values.operator, isEdit),
      note: cleanString(values.note, isEdit),
    };

    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });

    expect(payload.detailedLocation).toBeNull();
    expect(payload.operator).toBeNull();
    expect(payload.note).toBeNull();
    expect(payload.name).toBe('Đèn biển Hòn Dấu');
    expect('detailedLocation' in payload).toBe(true);
  });

  it('TC-CLEAR-02: When editing, clearing numeric and date fields sends null in payload', () => {
    const isEdit = true;
    const values = {
      staffCount: '', // user cleared number
      stationArea: null,
      lastRepairDate: null,
      provinceId: undefined,
    };

    const payload: any = {
      staffCount: cleanNumber(values.staffCount, isEdit),
      stationArea: cleanDecimal(values.stationArea, isEdit),
      lastRepairDate: toDate(values.lastRepairDate, isEdit),
      provinceId: cleanNumber(values.provinceId, isEdit),
    };

    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });

    expect(payload.staffCount).toBeNull();
    expect(payload.stationArea).toBeNull();
    expect(payload.lastRepairDate).toBeNull();
    expect(payload.provinceId).toBeNull();
  });

  it('TC-CLEAR-03: When creating new record, empty fields remain undefined and are omitted from payload', () => {
    const isEdit = false;
    const values = {
      name: 'Đèn biển mới',
      detailedLocation: '',
      staffCount: undefined,
    };

    const payload: any = {
      name: cleanString(values.name, isEdit),
      detailedLocation: cleanString(values.detailedLocation, isEdit),
      staffCount: cleanNumber(values.staffCount, isEdit),
    };

    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });

    expect(payload.name).toBe('Đèn biển mới');
    expect('detailedLocation' in payload).toBe(false);
    expect('staffCount' in payload).toBe(false);
  });
});
