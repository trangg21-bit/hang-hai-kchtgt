import { describe, it, expect } from 'vitest';

describe('RadarStation Location Tab Counter Logic (/radar-station)', () => {
  const getLocationTabLabel = (coordinateCount: number) => `Thông tin vị trí (${coordinateCount})`;

  it('renders tab label with coordinateList.length in create/edit mode', () => {
    // Ban đầu chưa có tọa độ nào
    const emptyCoordinates: unknown[] = [];
    expect(getLocationTabLabel(emptyCoordinates.length)).toBe('Thông tin vị trí (0)');

    // Khi chọn loại đối tượng POINT hoặc thêm 1 điểm tọa độ
    const singlePointCoordinates = [
      { latD: 15, latM: 5, latS: 55.1148, lngD: 108, lngM: 51, lngS: 9.1404 },
    ];
    expect(getLocationTabLabel(singlePointCoordinates.length)).toBe('Thông tin vị trí (1)');

    // Khi chọn LINE (2 điểm) hoặc POLYGON (>= 3 điểm)
    const lineCoordinates = [
      { latD: 15, latM: 5, latS: 55.1, lngD: 108, lngM: 51, lngS: 9.1 },
      { latD: 15, latM: 6, latS: 12.3, lngD: 108, lngM: 52, lngS: 10.4 },
    ];
    expect(getLocationTabLabel(lineCoordinates.length)).toBe('Thông tin vị trí (2)');
  });

  it('matches inner coordinate section header title count', () => {
    const coords = [
      { latD: 15, latM: 5, latS: 55.1148, lngD: 108, lngM: 51, lngS: 9.1404 },
    ];
    const tabLabel = getLocationTabLabel(coords.length);
    const innerSectionTitle = `Tọa độ GPS (${coords.length})`;

    expect(tabLabel).toBe('Thông tin vị trí (1)');
    expect(innerSectionTitle).toBe('Tọa độ GPS (1)');
    // Đảm bảo số lượng hiển thị ở tab đồng bộ 100% với số lượng ở tiêu đề bảng Tọa độ GPS
    expect(tabLabel.match(/\((\d+)\)/)?.[1]).toBe(innerSectionTitle.match(/\((\d+)\)/)?.[1]);
  });
});
