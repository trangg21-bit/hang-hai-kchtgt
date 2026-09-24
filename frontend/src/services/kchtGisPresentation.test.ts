import { describe, expect, it } from 'vitest';
import {
  getKchtOperationalStatusText,
  getKchtStructureTypeText,
  getKchtSymbolCode,
  getKchtUnitOfMeasureText,
} from '../utils/kchtGisPresentation';

describe('trình bày dữ liệu KCHT trên bản đồ', () => {
  it('dịch trạng thái hoạt động và loại kết cấu thay vì hiện mã thô', () => {
    expect(getKchtOperationalStatusText('NOT_YET_OPERATIONAL')).toBe('Chưa khai thác/vận hành');
    expect(getKchtOperationalStatusText('SUSPENDED')).toBe('Dừng khai thác/vận hành');
    expect(getKchtStructureTypeText(1)).toBe('Kết cấu bệ cọc cao');
  });

  it('dịch mã số tình trạng theo đúng hợp đồng dữ liệu của từng loại KCHT', () => {
    expect(getKchtOperationalStatusText('0', 'RADAR_STATION_LEGACY')).toBe('Chưa khai thác/vận hành');
    expect(getKchtOperationalStatusText('1', 'RADAR_STATION_LEGACY')).toBe('Đang khai thác/vận hành');
    expect(getKchtOperationalStatusText('2', 'RADAR_STATION_LEGACY')).toBe('Dừng khai thác/vận hành');
    expect(getKchtOperationalStatusText('1', 'DIKE_REVETMENT')).toBe('Chưa khai thác/vận hành');
    expect(getKchtOperationalStatusText('2', 'DIKE_REVETMENT')).toBe('Đang khai thác/vận hành');
  });

  it('dịch mã đơn vị tính dùng chung của các nhóm thiết bị GIS', () => {
    expect(getKchtUnitOfMeasureText(1)).toBe('Bộ');
    expect(getKchtUnitOfMeasureText('4')).toBe('Chiếc');
    expect(getKchtUnitOfMeasureText('Bến')).toBe('Bến');
    expect(getKchtUnitOfMeasureText(null)).toBe('—');
  });

  it('ánh xạ biểu tượng theo loại KCHT', () => {
    expect(getKchtSymbolCode('PORT_TERMINAL')).toBe('TERMINAL');
    expect(getKchtSymbolCode('PIER')).toBe('QUAY');
    expect(getKchtSymbolCode('NAVIGATION_CHANNEL')).toBe('CHANNEL');
  });
});

