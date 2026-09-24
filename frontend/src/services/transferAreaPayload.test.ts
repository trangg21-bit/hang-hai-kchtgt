import { describe, it, expect } from 'vitest';
import {
  CLEARABLE_TRANSFER_AREA_FIELDS,
  normalizeClearedFields,
} from '../pages/transfer-area/transferAreaPayload';

/**
 * Test THẬT cho code THẬT: import trực tiếp `normalizeClearedFields` đang chạy production
 * (TransferAreaForm.handleSave gọi hàm này trước khi PUT /v1/transfer-area).
 *
 * Lưu ý: file `frontend/src/services/transferAreaClearField.test.ts` phiên bản cũ KHÔNG test
 * được gì cả — nó chép lại nguyên logic payload builder vào thân test rồi assert lên bản sao
 * của chính nó, không hề import TransferAreaForm. Vì vậy lỗi "xóa trắng trường" đã lọt qua.
 */
describe('normalizeClearedFields — trường bị xóa trắng phải được gửi tường minh (Khu chuyển tải)', () => {
  const CLEARED_EDIT_PAYLOAD = {
    id: 'ta-1',
    orgUnitId: undefined,
    portId: undefined,
    transferAreaCode: undefined,
    transferAreaName: undefined,
    provinceId: undefined,
    detailedLocation: undefined,
    shapeDescription: undefined,
    remarks: undefined,
    publicDecision: undefined,
    investmentAgreement: undefined,
    area: undefined,
    designWaterDepth: undefined,
    currentWaterDepth: undefined,
    bottomElevationDesign: undefined,
    maxVesselDWT: undefined,
    activeTransferCount: undefined,
    publishedTransferCount: undefined,
    underInvestmentTransferCount: undefined,
    openingAnnouncementDate: undefined,
    activityStartDate: undefined,
    activityEndDate: undefined,
    saveAction: 'DRAFT',
  };

  it('TC-CLEAR-01: chế độ SỬA — mọi trường nghiệp vụ rỗng thành null TƯỜNG MINH (không bị bỏ khỏi body)', () => {
    const out = normalizeClearedFields(CLEARED_EDIT_PAYLOAD, { isEdit: true });

    [
      'detailedLocation',
      'shapeDescription',
      'remarks',
      'publicDecision',
      'investmentAgreement',
      'area',
      'designWaterDepth',
      'currentWaterDepth',
      'bottomElevationDesign',
      'maxVesselDWT',
      'activeTransferCount',
      'publishedTransferCount',
      'underInvestmentTransferCount',
      'openingAnnouncementDate',
      'activityStartDate',
      'activityEndDate',
    ].forEach((field) => {
      expect(out, `${field} phải có mặt trong body`).toHaveProperty(field);
      expect(out[field], `${field} phải là null`).toBeNull();
    });
  });

  it('TC-CLEAR-02: chế độ SỬA — KHÔNG bao giờ null hoá trường định danh/bắt buộc (chống mất dữ liệu)', () => {
    const out = normalizeClearedFields(CLEARED_EDIT_PAYLOAD, { isEdit: true });

    ['orgUnitId', 'portId', 'transferAreaName', 'provinceId', 'transferAreaCode'].forEach((field) => {
      expect(Object.keys(out).includes(field), `${field} phải bị bỏ khỏi body`).toBe(false);
    });
  });

  it('TC-CLEAR-03: sau JSON.stringify, key null VẪN có mặt — điều kiện để backend isFieldPresent() = true', () => {
    const out = normalizeClearedFields(CLEARED_EDIT_PAYLOAD, { isEdit: true });
    const body = JSON.parse(JSON.stringify(out)) as Record<string, unknown>;

    expect(body).toHaveProperty('remarks', null);
    expect(body).toHaveProperty('shapeDescription', null);
    expect(Object.keys(body).includes('remarks')).toBe(true);
  });

  it('TC-CLEAR-04: chế độ TẠO MỚI — giữ nguyên hành vi cũ, không ghi null thừa', () => {
    const out = normalizeClearedFields(CLEARED_EDIT_PAYLOAD, { isEdit: false });
    expect(Object.keys(out).sort()).toEqual(['id', 'saveAction']);
  });

  it('TC-CLEAR-05: giá trị đang có (kể cả chuỗi rỗng và số 0) được giữ nguyên, không bị biến thành null', () => {
    const out = normalizeClearedFields(
      { remarks: 'ghi chú', area: '0', activeTransferCount: 0, shapeDescription: '' },
      { isEdit: true },
    );
    expect(out.remarks).toBe('ghi chú');
    expect(out.area).toBe('0');
    expect(out.activeTransferCount).toBe(0);
    expect(out.shapeDescription).toBe('');
  });

  it('TC-CLEAR-06: danh sách trường cho phép xóa trắng không chứa trường bắt buộc/định danh', () => {
    ['orgUnitId', 'portId', 'transferAreaName', 'provinceId', 'transferAreaCode'].forEach((f) => {
      expect(CLEARABLE_TRANSFER_AREA_FIELDS.has(f), `${f} không được nằm trong danh sách xóa trắng`).toBe(false);
    });
  });
});
