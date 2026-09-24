import { describe, it, expect, vi, beforeEach } from 'vitest';

const putMock = vi.fn(() => Promise.resolve({ data: { data: {} } }));

vi.mock('./api', () => ({
  default: {
    put: (...args: unknown[]) => putMock(...args),
    post: vi.fn(() => Promise.resolve({ data: { data: {} } })),
    get: vi.fn(() => Promise.resolve({ data: { data: {} } })),
    delete: vi.fn(() => Promise.resolve({ data: { data: {} } })),
  },
}));

import { updateDryPort } from '../pages/port/dry-port/api';
import {
  DRY_PORT_REQUIRED_FIELDS,
  mapPortStatusToOperationalStatus,
  normalizeDryPortPayload,
} from '../pages/port/dry-port/payload';

/**
 * Test THẬT cho code THẬT của màn Cảng cạn (`/dry-port`).
 *
 * Bản trước của file này có case 01 là TEST GIẢ: nó chép lại `cleanString`/`cleanNumber`/
 * `cleanDecimal` và cả object payload vào thân test rồi assert lên bản sao của chính nó —
 * không import dòng code production nào. Vì vậy lỗi "xóa trắng trường không lưu được" đã lọt.
 * Bản này import trực tiếp module đang chạy (`dry-port/payload.ts`) và lớp `updateDryPort` thật.
 */
describe('Cảng cạn — xóa trắng trường phải đi kèm null tường minh', () => {
  const CLEARED_EDIT_FORM = {
    saveAction: 'draft',
    dryPortCode: undefined,
    dryPortName: 'Cảng cạn A',
    orgUnitId: 'ou-1',
    provinceId: 1,
    portStatus: 1,
    region: undefined,
    transportCorridor: undefined,
    connectionMode: undefined,
    detailedLocation: undefined,
    remarks: undefined,
    area: undefined,
    teuCapacity: undefined,
    warehouseArea: undefined,
    yardArea: undefined,
    openingAnnouncementDate: undefined,
    openingDecision: undefined,
    investmentAgreementDoc: undefined,
    mapSymbolId: undefined,
    coordinates: undefined,
  };

  beforeEach(() => {
    putMock.mockClear();
  });

  it('TC-DRYPORT-CLEAR-01: chế độ SỬA — trường rỗng thành null TƯỜNG MINH, key vẫn còn trong body', () => {
    const out = normalizeDryPortPayload(CLEARED_EDIT_FORM, { isEdit: true });

    [
      'region',
      'transportCorridor',
      'connectionMode',
      'detailedLocation',
      'remarks',
      'area',
      'teuCapacity',
      'warehouseArea',
      'yardArea',
      'openingAnnouncementDate',
      'openingDecision',
      'investmentAgreementDoc',
      'mapSymbolId',
      'coordinates',
    ].forEach((field) => {
      expect(Object.keys(out), `${field} phải có mặt trong body`).toContain(field);
      expect(out[field], `${field} phải là null`).toBeNull();
    });

    // JSON.stringify giữ nguyên key null ⇒ BE isFieldPresent() = true ⇒ ghi null xuống DB.
    const body = JSON.parse(JSON.stringify(out)) as Record<string, unknown>;
    expect(Object.keys(body)).toContain('remarks');
    expect(body.remarks).toBeNull();
  });

  it('TC-DRYPORT-CLEAR-02: KHÔNG null hoá trường định danh/bắt buộc (chống mất dữ liệu)', () => {
    // Trường bắt buộc/định danh thiếu giá trị ⇒ BỎ key (không gửi null), khác hẳn trường
    // nghiệp vụ bị xóa trắng (⇒ null tường minh).
    const out = normalizeDryPortPayload(
      {
        saveAction: 'draft',
        dryPortCode: undefined,
        dryPortName: undefined,
        orgUnitId: undefined,
        provinceId: undefined,
        portStatus: undefined,
        remarks: undefined,
      },
      { isEdit: true },
    );

    ['dryPortCode', 'dryPortName', 'orgUnitId', 'provinceId', 'portStatus'].forEach((field) => {
      expect(Object.keys(out), `${field} phải bị bỏ khỏi body`).not.toContain(field);
    });
    expect(out.remarks).toBeNull();

    // Và trường bắt buộc ĐANG có giá trị thì được giữ nguyên.
    const kept = normalizeDryPortPayload(
      { orgUnitId: 'ou-1', provinceId: 1, portStatus: 1, dryPortName: 'Cảng cạn A' },
      { isEdit: true },
    );
    expect(kept.orgUnitId).toBe('ou-1');
    expect(kept.provinceId).toBe(1);
    expect(kept.portStatus).toBe(1);
    expect(kept.dryPortName).toBe('Cảng cạn A');
  });

  it('TC-DRYPORT-CLEAR-03: chế độ TẠO MỚI — giữ nguyên hành vi cũ (bỏ key undefined)', () => {
    const out = normalizeDryPortPayload(CLEARED_EDIT_FORM, { isEdit: false });
    expect(Object.keys(out).sort()).toEqual(
      ['dryPortName', 'orgUnitId', 'portStatus', 'provinceId', 'saveAction'].sort(),
    );
  });

  it('TC-DRYPORT-CLEAR-04: giá trị đang có (kể cả 0 và chuỗi rỗng) không bị biến thành null', () => {
    const out = normalizeDryPortPayload(
      { remarks: 'ghi chú', area: '0', teuCapacity: 0, connectionMode: '' },
      { isEdit: true },
    );
    expect(out.remarks).toBe('ghi chú');
    expect(out.area).toBe('0');
    expect(out.teuCapacity).toBe(0);
    expect(out.connectionMode).toBe('');
  });

  it('TC-DRYPORT-STATUS-01: operationalStatus giữ đồng bộ với portStatus (badge ưu tiên operationalStatus)', () => {
    expect(mapPortStatusToOperationalStatus(1)).toBe('OPERATIONAL');
    expect(mapPortStatusToOperationalStatus(2)).toBe('SUSPENDED');
    expect(mapPortStatusToOperationalStatus(0)).toBe('NOT_YET_OPERATIONAL');
    expect(mapPortStatusToOperationalStatus('1')).toBe('OPERATIONAL');
    expect(mapPortStatusToOperationalStatus(null)).toBeNull();
    expect(mapPortStatusToOperationalStatus(undefined)).toBeNull();
  });

  it('TC-DRYPORT-CLEAR-05: PUT /v1/dry-ports nhận đúng body đã chuẩn hoá', async () => {
    const body = normalizeDryPortPayload(CLEARED_EDIT_FORM, { isEdit: true });
    await updateDryPort({ ...body, id: 'dp-1' } as never);

    expect(putMock).toHaveBeenCalledTimes(1);
    const [url, sent] = putMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(url).toBe('/v1/dry-ports');
    expect(sent.id).toBe('dp-1');
    expect(sent).toHaveProperty('remarks', null);
    expect(sent).toHaveProperty('detailedLocation', null);
    expect(sent).toHaveProperty('dryPortName', 'Cảng cạn A');
  });

  it('TC-DRYPORT-CLEAR-06: danh sách trường bắt buộc không lọt vào nhánh null hoá', () => {
    ['dryPortCode', 'orgUnitId', 'provinceId', 'portStatus', 'dryPortName'].forEach((f) => {
      expect(DRY_PORT_REQUIRED_FIELDS.has(f), `${f} phải nằm trong nhóm bắt buộc`).toBe(true);
    });
  });
});
