import { describe, it, expect } from 'vitest';
import { getNextSortOrder, resolveSortField } from './sortUtils';

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

    handleSort('code', getNextSortOrder(null));
    expect(sortField).toBe('code');
    expect(sortOrder).toBe('ascend');

    handleSort('code', getNextSortOrder(sortOrder));
    expect(sortField).toBe('code');
    expect(sortOrder).toBe('descend');

    handleSort('code', getNextSortOrder(sortOrder));
    expect(sortField).toBe(null);
    expect(sortOrder).toBe(null);

    handleSort('code', getNextSortOrder(sortOrder));
    expect(sortField).toBe('code');
    expect(sortOrder).toBe('ascend');
  });

  it('uses the explicit column key instead of a stale AntD derived field', () => {
    const columns = [
      { key: 'name', dataIndex: 'name' },
      // Cột "Cán bộ cập nhật" là cột gộp render thủ công, không có dataIndex.
      { key: 'updatedInfo' },
    ];

    expect(resolveSortField({ columnKey: 'updatedInfo', field: 'name' }, columns))
      .toBe('updatedInfo');
  });
});
