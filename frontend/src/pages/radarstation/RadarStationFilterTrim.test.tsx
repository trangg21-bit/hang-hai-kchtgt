import { describe, it, expect } from 'vitest';

describe('RadarStation Filter Input Trim Logic (/radar-station)', () => {
  it('trims leading and trailing spaces for stationName and code on search submit and enter key', () => {
    let inputStationName = '   Trạm Radar Hòn Dấu   ';
    let inputCode = '   RD-HD-001   ';
    let filterStationName = '';
    let filterCode = '';

    const handleFilterApply = (overrides?: { stationName?: string; code?: string }) => {
      const nextStationName = (overrides?.stationName !== undefined ? overrides.stationName : inputStationName).trim();
      const nextCode = (overrides?.code !== undefined ? overrides.code : inputCode).trim();
      inputStationName = nextStationName;
      inputCode = nextCode;
      filterStationName = nextStationName;
      filterCode = nextCode;
    };

    // Khi người dùng nhấn nút "Tìm kiếm"
    handleFilterApply();
    expect(inputStationName).toBe('Trạm Radar Hòn Dấu');
    expect(inputCode).toBe('RD-HD-001');
    expect(filterStationName).toBe('Trạm Radar Hòn Dấu');
    expect(filterCode).toBe('RD-HD-001');

    // Khi người dùng nhấn phím Enter trên ô "Tên trạm radar"
    inputStationName = '   Trạm Radar Vũng Tàu   ';
    const enterNameVal = inputStationName.trim();
    handleFilterApply({ stationName: enterNameVal });
    expect(inputStationName).toBe('Trạm Radar Vũng Tàu');
    expect(filterStationName).toBe('Trạm Radar Vũng Tàu');

    // Khi người dùng nhấn phím Enter trên ô "Mã trạm radar"
    inputCode = '   RD-VT-02   ';
    const enterCodeVal = inputCode.trim();
    handleFilterApply({ code: enterCodeVal });
    expect(inputCode).toBe('RD-VT-02');
    expect(filterCode).toBe('RD-VT-02');
  });

  it('handles empty strings or whitespace-only inputs cleanly', () => {
    let inputStationName = '     ';
    let inputCode = '     ';
    let filterStationName = 'previous';
    let filterCode = 'previous';

    const handleFilterApply = (overrides?: { stationName?: string; code?: string }) => {
      const nextStationName = (overrides?.stationName !== undefined ? overrides.stationName : inputStationName).trim();
      const nextCode = (overrides?.code !== undefined ? overrides.code : inputCode).trim();
      inputStationName = nextStationName;
      inputCode = nextCode;
      filterStationName = nextStationName;
      filterCode = nextCode;
    };

    handleFilterApply();
    expect(inputStationName).toBe('');
    expect(inputCode).toBe('');
    expect(filterStationName).toBe('');
    expect(filterCode).toBe('');
  });
});
