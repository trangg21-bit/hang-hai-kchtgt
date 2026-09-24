import { describe, it, expect } from 'vitest';
import { isClearedValue, resolveGisFieldValue } from './buoy/resolveGisFields';

/**
 * Test THẬT cho logic đang chạy ở màn Phao, tiêu (`/buoys`).
 *
 * Màn này KHÔNG có file `*ClearField.test.ts` nào trước đó; logic bị lỗi nằm ở 4 dòng
 * `resolved*` trong `BuoyListPage.handleEditFinish` nên được tách ra `resolveGisFields.ts`
 * để kiểm chứng được thật.
 */
describe('Phao, tiêu — 4 trường tab GIS: phân biệt "chưa mở tab" với "đã xóa trắng"', () => {
  it('TC-BUOY-GIS-01: ĐÃ mở tab GIS + xóa trắng ⇒ tôn trọng ý định xóa (gửi rỗng)', () => {
    expect(resolveGisFieldValue(undefined, 'Độ, phút, giây (DMS)', true)).toBeUndefined();
    expect(resolveGisFieldValue('', 'Độ, phút, giây (DMS)', true)).toBeUndefined();
    expect(resolveGisFieldValue('   ', 'Độ, phút, giây (DMS)', true)).toBeUndefined();
    expect(resolveGisFieldValue(undefined, 1, true)).toBeUndefined();
    expect(resolveGisFieldValue(undefined, 'POINT', true)).toBeUndefined();
    expect(resolveGisFieldValue(undefined, 'symbol-uuid', true)).toBeUndefined();
  });

  it('TC-BUOY-GIS-02: CHƯA mở tab GIS ⇒ giữ nguyên giá trị đang có của bản ghi', () => {
    expect(resolveGisFieldValue(undefined, 'Độ, phút, giây (DMS)', false)).toBe('Độ, phút, giây (DMS)');
    expect(resolveGisFieldValue(undefined, 1, false)).toBe(1);
    expect(resolveGisFieldValue(undefined, 'POINT', false)).toBe('POINT');
    expect(resolveGisFieldValue(null, 'symbol-uuid', false)).toBe('symbol-uuid');
  });

  it('TC-BUOY-GIS-03: có giá trị nhập mới thì luôn thắng, bất kể tab đã mở hay chưa', () => {
    expect(resolveGisFieldValue('WGS-84', 'VN-2000', true)).toBe('WGS-84');
    expect(resolveGisFieldValue(2, 1, false)).toBe(2);
    expect(resolveGisFieldValue('POLYGON', 'POINT', true)).toBe('POLYGON');
  });

  it('TC-BUOY-GIS-04: chưa mở tab và bản ghi cũng chưa có giá trị ⇒ vẫn là rỗng', () => {
    expect(resolveGisFieldValue(undefined, null, false)).toBeUndefined();
    expect(resolveGisFieldValue(undefined, undefined, false)).toBeUndefined();
  });

  it('TC-BUOY-GIS-05: isClearedValue nhận đúng giá trị "coi như đã xóa"', () => {
    expect(isClearedValue(undefined)).toBe(true);
    expect(isClearedValue(null)).toBe(true);
    expect(isClearedValue('')).toBe(true);
    expect(isClearedValue('  ')).toBe(true);
    expect(isClearedValue('POINT')).toBe(false);
    expect(isClearedValue(0)).toBe(false);
    expect(isClearedValue(false)).toBe(false);
  });
});
