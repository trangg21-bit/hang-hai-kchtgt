import { describe, it, expect } from 'vitest';
import { finalizePayloadForSubmit } from './BuoyBerthForm';

/**
 * Hồi quy cho lỗi: "xóa triệt để 1 trường khi Chỉnh sửa nhưng không lưu được" (/buoy-berth).
 *
 * Nguyên nhân: ô bị xóa trắng biến thành `undefined` rồi bị XÓA HẲN khỏi body request, nên server
 * không phân biệt được "người dùng đã xóa trắng trường" với "client không gửi trường" — trường bị
 * bỏ qua âm thầm và giữ nguyên giá trị cũ dù API vẫn trả về thành công.
 *
 * Hợp đồng: mọi ô rỗng phải đi kèm request dưới dạng `null` TƯỜNG MINH (key vẫn còn trong JSON).
 * Cùng chuẩn đã áp cho Cảng biển (/port), Bến cảng (/berth), Cầu cảng (/pier) — docs/JOURNAL.md.
 */
describe('BuoyBerth Form Cleared Fields Payload (/buoy-berth)', () => {
  const buildPayload = () =>
    finalizePayloadForSubmit({
      buoyBerthName: 'Bến phao số 1',
      detailedLocation: undefined, // người dùng xóa trắng (Input)
      classification: undefined, // người dùng xóa trắng (Select allowClear)
      maxVesselDWT: undefined, // người dùng xóa trắng (ô số)
      nextInspectionDate: undefined, // người dùng xóa trắng (DatePicker)
      publicDecision: undefined, // người dùng xóa trắng (TextArea 2000 ký tự)
      coordinates: undefined, // người dùng xóa hết dòng tọa độ GPS
    });

  it('ô bị xóa trắng phải gửi null TƯỜNG MINH và key vẫn còn trong body', () => {
    const payload = buildPayload();

    expect(payload.detailedLocation).toBeNull();
    expect(payload.classification).toBeNull();
    expect(payload.maxVesselDWT).toBeNull();
    expect(payload.nextInspectionDate).toBeNull();
    expect(payload.publicDecision).toBeNull();
    expect(payload.coordinates).toBeNull();

    // key PHẢI tồn tại — nếu không server sẽ hiểu là "client không gửi trường"
    expect('detailedLocation' in payload).toBe(true);
    expect('classification' in payload).toBe(true);
    expect('publicDecision' in payload).toBe(true);
    expect('coordinates' in payload).toBe(true);
  });

  it('không được xóa hẳn key nào khỏi body', () => {
    const payload = buildPayload();

    expect(Object.keys(payload).sort()).toEqual(
      [
        'buoyBerthName',
        'classification',
        'coordinates',
        'detailedLocation',
        'maxVesselDWT',
        'nextInspectionDate',
        'publicDecision',
      ].sort(),
    );
  });

  it('trường còn giá trị vẫn giữ nguyên', () => {
    const payload = buildPayload();

    expect(payload.buoyBerthName).toBe('Bến phao số 1');
  });
});
