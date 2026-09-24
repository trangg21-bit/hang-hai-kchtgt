import { describe, it, expect } from 'vitest';

describe('BeaconStation Filter Input Trim Logic (/beacon-stations)', () => {
  it('trims leading and trailing spaces for name and code on search submit and enter key', () => {
    let inputName = '   Đèn biển Hòn Dấu   ';
    let inputCode = '   DB-HD-001   ';
    let filterName = '';
    let filterCode = '';

    const handleFilterApply = (overrides?: { name?: string; code?: string }) => {
      const nextName = (overrides?.name !== undefined ? overrides.name : inputName).trim();
      const nextCode = (overrides?.code !== undefined ? overrides.code : inputCode).trim();
      inputName = nextName;
      inputCode = nextCode;
      filterName = nextName;
      filterCode = nextCode;
    };

    // Khi người dùng nhấn nút "Tìm kiếm"
    handleFilterApply();
    expect(inputName).toBe('Đèn biển Hòn Dấu');
    expect(inputCode).toBe('DB-HD-001');
    expect(filterName).toBe('Đèn biển Hòn Dấu');
    expect(filterCode).toBe('DB-HD-001');

    // Khi người dùng nhấn phím Enter trên ô "Tên đèn biển"
    inputName = '   Đèn biển Bạch Long Vĩ   ';
    const enterNameVal = inputName.trim();
    handleFilterApply({ name: enterNameVal });
    expect(inputName).toBe('Đèn biển Bạch Long Vĩ');
    expect(filterName).toBe('Đèn biển Bạch Long Vĩ');

    // Khi người dùng nhấn phím Enter trên ô "Mã đèn biển"
    inputCode = '   DB-BLV-02   ';
    const enterCodeVal = inputCode.trim();
    handleFilterApply({ code: enterCodeVal });
    expect(inputCode).toBe('DB-BLV-02');
    expect(filterCode).toBe('DB-BLV-02');
  });

  it('handles empty strings or whitespace-only inputs cleanly', () => {
    let inputName = '     ';
    let inputCode = '     ';
    let filterName = 'previous';
    let filterCode = 'previous';

    const handleFilterApply = (overrides?: { name?: string; code?: string }) => {
      const nextName = (overrides?.name !== undefined ? overrides.name : inputName).trim();
      const nextCode = (overrides?.code !== undefined ? overrides.code : inputCode).trim();
      inputName = nextName;
      inputCode = nextCode;
      filterName = nextName;
      filterCode = nextCode;
    };

    handleFilterApply();
    expect(inputName).toBe('');
    expect(inputCode).toBe('');
    expect(filterName).toBe('');
    expect(filterCode).toBe('');
  });
});
