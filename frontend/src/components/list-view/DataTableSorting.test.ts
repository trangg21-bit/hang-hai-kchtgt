import { describe, it, expect } from 'vitest';
import { getNextSortOrder } from './DataTable';

describe('DataTable sorting 3-state cycle', () => {
  it('cycles from undefined to asc (Lần 1: Sắp xếp tăng dần)', () => {
    expect(getNextSortOrder(undefined)).toBe('asc');
  });

  it('cycles from null to asc (Lần 1: Sắp xếp tăng dần khi sortOrder null)', () => {
    expect(getNextSortOrder(null)).toBe('asc');
  });

  it('cycles from ascend to desc (Lần 2: Sắp xếp giảm dần)', () => {
    expect(getNextSortOrder('ascend')).toBe('desc');
  });

  it('cycles from descend to null (Lần 3: Bỏ không sắp xếp theo cột chỉ định)', () => {
    expect(getNextSortOrder('descend')).toBe(null);
  });

  it('consumer onSort handler correctly clears sortField and sortOrder on null', () => {
    let sortField: string | null = 'updatedAt';
    let sortOrder: 'ascend' | 'descend' | null = 'descend';

    const handleSort = (key: string, order: 'asc' | 'desc' | null) => {
      if (!order) {
        sortField = null;
        sortOrder = null;
      } else {
        sortField = key;
        sortOrder = order === 'asc' ? 'ascend' : 'descend';
      }
    };

    // 1st click: asc
    handleSort('code', getNextSortOrder(null));
    expect(sortField).toBe('code');
    expect(sortOrder).toBe('ascend');

    // 2nd click: desc
    handleSort('code', getNextSortOrder(sortOrder));
    expect(sortField).toBe('code');
    expect(sortOrder).toBe('descend');

    // 3rd click: null -> must clear sortField & sortOrder
    handleSort('code', getNextSortOrder(sortOrder));
    expect(sortField).toBe(null);
    expect(sortOrder).toBe(null);

    // 4th click after reset: cycles back to asc without getting stuck at desc
    handleSort('code', getNextSortOrder(sortOrder));
    expect(sortField).toBe('code');
    expect(sortOrder).toBe('ascend');
  });
});
