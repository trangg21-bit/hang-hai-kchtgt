import { describe, expect, it } from 'vitest';
import { formatPortHistoryCoordinates } from '../utils/portHistoryCoordinates';

describe('trình bày lịch sử tọa độ Cảng biển', () => {
  it('đổi WKT polygon thành từng dòng tọa độ DMS dễ đọc và bỏ điểm đóng vùng lặp lại', () => {
    expect(formatPortHistoryCoordinates('POLYGON((107.09472777777778 15.76053611111112, 106.52926944444444 14.168533333333333, 107.09472777777778 15.76053611111112))'))
      .toBe('1. Vĩ độ: 15° 45′ 37.93″; Kinh độ: 107° 5′ 41.02″\n2. Vĩ độ: 14° 10′ 6.72″; Kinh độ: 106° 31′ 45.37″');
  });

  it('giữ nguyên dữ liệu không phải WKT để không làm mất lịch sử cũ', () => {
    expect(formatPortHistoryCoordinates('Tọa độ cũ')).toBe('Tọa độ cũ');
    expect(formatPortHistoryCoordinates(null)).toBe('');
  });
});
