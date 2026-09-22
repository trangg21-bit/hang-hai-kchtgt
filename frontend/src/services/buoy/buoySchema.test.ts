import { describe, it, expect } from 'vitest';
import { BUOY_LIGHT_OPTIONS, createSchema, updateSchema } from './schema';

describe('Buoy Schema & Light Options Validation', () => {
  it('BUOY_LIGHT_OPTIONS contains exactly Không có đèn and Có đèn', () => {
    expect(BUOY_LIGHT_OPTIONS).toEqual([
      { value: 'Không có đèn', label: 'Không có đèn' },
      { value: 'Có đèn', label: 'Có đèn' },
    ]);
  });

  it('allows range to be optional / undefined / null in createSchema', () => {
    const validBase = {
      code: 'PT-001',
      name: 'Phao 01',
      classification: 'Phao báo hiệu',
      condition: 'Đang khai thác/vận hành',
      lightHeight: 5,
    };

    const parsedWithoutRange = createSchema.safeParse(validBase);
    expect(parsedWithoutRange.success).toBe(true);

    const parsedWithNullRange = createSchema.safeParse({ ...validBase, range: null });
    expect(parsedWithNullRange.success).toBe(true);
  });

  it('allows range to be 0 or greater than 100 (no <= 100 limit)', () => {
    const validBase = {
      code: 'PT-001',
      name: 'Phao 01',
      classification: 'Phao báo hiệu',
      condition: 'Đang khai thác/vận hành',
      lightHeight: 5,
    };

    const parsedZero = createSchema.safeParse({ ...validBase, range: 0 });
    expect(parsedZero.success).toBe(true);

    const parsedLarge = createSchema.safeParse({ ...validBase, range: 10000 });
    expect(parsedLarge.success).toBe(true);
  });

  it('rejects negative range', () => {
    const validBase = {
      code: 'PT-001',
      name: 'Phao 01',
      classification: 'Phao báo hiệu',
      condition: 'Đang khai thác/vận hành',
      lightHeight: 5,
      range: -1,
    };

    const res = createSchema.safeParse(validBase);
    expect(res.success).toBe(false);
  });

  it('allows range in updateSchema to be optional, 0 or > 100', () => {
    const updateValid = {
      name: 'Phao Update',
      classification: 'Phao báo hiệu',
      condition: 'Đang khai thác/vận hành',
      lightHeight: 5,
      range: 250,
    };

    const res = updateSchema.safeParse(updateValid);
    expect(res.success).toBe(true);

    const resNoRange = updateSchema.safeParse({
      name: 'Phao Update',
      classification: 'Phao báo hiệu',
      condition: 'Đang khai thác/vận hành',
      lightHeight: 5,
    });
    expect(resNoRange.success).toBe(true);
  });
});
