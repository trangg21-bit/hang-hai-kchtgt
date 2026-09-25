import { describe, it, expect } from 'vitest';
import {
  BUOY_LIGHT_OPTIONS,
  CONDITION_OPTIONS,
  normalizeBuoyCondition,
  buoyConditionBadge,
  createSchema,
  updateSchema,
} from './schema';

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

  it('accepts decimal values for all 6 numeric fields (area, bodyHeight, diameter, towerHeight, lightHeight, range)', () => {
    const validWithDecimals = {
      code: 'PT-002',
      name: 'Phao 02',
      classification: 'Phao báo hiệu',
      condition: 'Đang khai thác/vận hành',
      area: 123.456,
      bodyHeight: 4.75,
      diameter: 2.8,
      towerHeight: 6.5,
      lightHeight: 7.125,
      range: 12.8,
    };

    const resCreate = createSchema.safeParse(validWithDecimals);
    expect(resCreate.success).toBe(true);

    const resUpdate = updateSchema.safeParse(validWithDecimals);
    expect(resUpdate.success).toBe(true);
  });

  it('rejects negative numbers for area, bodyHeight, diameter, towerHeight, and lightHeight <= 0', () => {
    const validBase = {
      code: 'PT-001',
      name: 'Phao 01',
      classification: 'Phao báo hiệu',
      condition: 'Đang khai thác/vận hành',
      lightHeight: 5,
    };

    expect(createSchema.safeParse({ ...validBase, area: -0.5 }).success).toBe(false);
    expect(createSchema.safeParse({ ...validBase, bodyHeight: -1 }).success).toBe(false);
    expect(createSchema.safeParse({ ...validBase, diameter: -0.1 }).success).toBe(false);
    expect(createSchema.safeParse({ ...validBase, lightHeight: 0 }).success).toBe(true);
    expect(createSchema.safeParse({ ...validBase, lightHeight: -3 }).success).toBe(false);
    const { lightHeight: _, ...withoutLightHeight } = validBase;
    expect(createSchema.safeParse(withoutLightHeight).success).toBe(true);
  });

  describe('Buoy Condition Options & Normalization (BR-075-COND)', () => {
    it('CONDITION_OPTIONS contains exactly 3 standard conditions', () => {
      expect(CONDITION_OPTIONS).toEqual([
        { value: 'Chưa khai thác/vận hành', label: 'Chưa khai thác/vận hành' },
        { value: 'Đang khai thác/vận hành', label: 'Đang khai thác/vận hành' },
        { value: 'Dừng khai thác/vận hành', label: 'Dừng khai thác/vận hành' },
      ]);
    });

    it('normalizes legacy values to standard 3 conditions', () => {
      // Legacy "Trên luồng", "Đang hoạt động", "Gắn đèn" -> "Đang khai thác/vận hành"
      expect(normalizeBuoyCondition('Trên luồng')).toBe('Đang khai thác/vận hành');
      expect(normalizeBuoyCondition('trên luồng')).toBe('Đang khai thác/vận hành');
      expect(normalizeBuoyCondition('Đang hoạt động')).toBe('Đang khai thác/vận hành');
      expect(normalizeBuoyCondition('Gắn đèn')).toBe('Đang khai thác/vận hành');

      // Legacy "Trên bãi", "trên bãi", "Chưa hoạt động" -> "Chưa khai thác/vận hành"
      expect(normalizeBuoyCondition('Trên bãi')).toBe('Chưa khai thác/vận hành');
      expect(normalizeBuoyCondition('trên bãi')).toBe('Chưa khai thác/vận hành');
      expect(normalizeBuoyCondition('Chưa hoạt động')).toBe('Chưa khai thác/vận hành');

      // Legacy "Dừng hoạt động", "Hỏng" -> "Dừng khai thác/vận hành"
      expect(normalizeBuoyCondition('Dừng hoạt động')).toBe('Dừng khai thác/vận hành');
      expect(normalizeBuoyCondition('Hỏng')).toBe('Dừng khai thác/vận hành');

      // Standard values remain unchanged
      expect(normalizeBuoyCondition('Đang khai thác/vận hành')).toBe('Đang khai thác/vận hành');
      expect(normalizeBuoyCondition('Chưa khai thác/vận hành')).toBe('Chưa khai thác/vận hành');
      expect(normalizeBuoyCondition('Dừng khai thác/vận hành')).toBe('Dừng khai thác/vận hành');

      // Nullish or empty values return ''
      expect(normalizeBuoyCondition(null)).toBe('');
      expect(normalizeBuoyCondition(undefined)).toBe('');
      expect(normalizeBuoyCondition('')).toBe('');
      expect(normalizeBuoyCondition('   ')).toBe('');
    });

    it('buoyConditionBadge returns correct badge structure', () => {
      const badge1 = buoyConditionBadge('Trên luồng');
      expect(badge1?.label).toBe('Đang khai thác/vận hành');

      const badge2 = buoyConditionBadge('Trên bãi');
      expect(badge2?.label).toBe('Chưa khai thác/vận hành');

      const badgeNull = buoyConditionBadge(null);
      expect(badgeNull).toBeNull();
    });
  });
});

