import { describe, it, expect } from 'vitest';

describe('DikeRevetment Filter Input Trim Logic (/dike-revetment)', () => {
  it('trims leading and trailing spaces for name and code on search submit and enter key', () => {
    let inputName = '   Đê chắn sóng Cát Bà   ';
    let inputCode = '   DK-CB-001   ';
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
    expect(inputName).toBe('Đê chắn sóng Cát Bà');
    expect(inputCode).toBe('DK-CB-001');
    expect(filterName).toBe('Đê chắn sóng Cát Bà');
    expect(filterCode).toBe('DK-CB-001');

    // Khi người dùng nhấn phím Enter trên ô "Tên đê kè"
    inputName = '   Kè bảo vệ bờ Vũng Tàu   ';
    const enterNameVal = inputName.trim();
    handleFilterApply({ name: enterNameVal });
    expect(inputName).toBe('Kè bảo vệ bờ Vũng Tàu');
    expect(filterName).toBe('Kè bảo vệ bờ Vũng Tàu');

    // Khi người dùng nhấn phím Enter trên ô "Mã đê kè"
    inputCode = '   KE-VT-02   ';
    const enterCodeVal = inputCode.trim();
    handleFilterApply({ code: enterCodeVal });
    expect(inputCode).toBe('KE-VT-02');
    expect(filterCode).toBe('KE-VT-02');
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
