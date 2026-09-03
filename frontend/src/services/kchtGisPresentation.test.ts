import { describe, expect, it } from 'vitest';
import {
  getKchtOperationalStatusText,
  getKchtStructureTypeText,
  getKchtSymbolCode,
} from '../utils/kchtGisPresentation';

describe('trình bày dữ liệu KCHT trên bản đồ', () => {
  it('dịch trạng thái hoạt động và loại kết cấu thay vì hiện mã thô', () => {
    expect(getKchtOperationalStatusText('NOT_YET_OPERATIONAL')).toBe('Chưa khai thác/vận hành');
    expect(getKchtOperationalStatusText('SUSPENDED')).toBe('Dừng khai thác/vận hành');
    expect(getKchtStructureTypeText(1)).toBe('Kết cấu bệ cọc cao');
  });

  it('ánh xạ biểu tượng theo loại KCHT', () => {
    expect(getKchtSymbolCode('PORT_TERMINAL')).toBe('TERMINAL');
    expect(getKchtSymbolCode('PIER')).toBe('QUAY');
    expect(getKchtSymbolCode('NAVIGATION_CHANNEL')).toBe('CHANNEL');
  });
});

