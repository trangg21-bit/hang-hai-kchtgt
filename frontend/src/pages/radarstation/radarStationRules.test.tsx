import { describe, expect, it } from 'vitest';
import { isApprovedRadarStatus } from './radarStationRules';

describe('radarStationRules', () => {
  it('nhận diện cả trạng thái đã duyệt hiện hành và legacy để giới hạn footer chỉnh sửa', () => {
    expect(isApprovedRadarStatus('APPROVED')).toBe(true);
    expect(isApprovedRadarStatus('approved_level2')).toBe(true);
    expect(isApprovedRadarStatus('PENDING_APPROVAL')).toBe(false);
    expect(isApprovedRadarStatus(undefined)).toBe(false);
  });
});
