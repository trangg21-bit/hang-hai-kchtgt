import { describe, it, expect } from 'vitest';
import { getNextSortOrder } from '../components/list-view/sortUtils';

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

    // 5th click: desc
    handleSort('code', getNextSortOrder(sortOrder));
    expect(sortField).toBe('code');
    expect(sortOrder).toBe('descend');

    // 6th click: null
    handleSort('code', getNextSortOrder(sortOrder));
    expect(sortField).toBe(null);
    expect(sortOrder).toBe(null);
  });

  it('correctly simulates CommonTable 3-state sort cycle across multiple clicks and column switches', () => {
    let currentField: string | undefined = undefined;
    let currentOrder: 'ascend' | 'descend' | null = null;
    const dispatchedEvents: Array<{ field: string; order: 'ascend' | 'descend' | null }> = [];

    const handleSortCycle = (targetField: string) => {
      const order = targetField === currentField ? currentOrder : null;
      const nextCycle = getNextSortOrder(order);
      const nextOrder = nextCycle === 'asc' ? 'ascend' : nextCycle === 'desc' ? 'descend' : null;
      currentField = nextOrder ? targetField : undefined;
      currentOrder = nextOrder;
      dispatchedEvents.push({ field: targetField, order: nextOrder });
    };

    // Click 1: Sắp xếp A -> Z
    handleSortCycle('assetName');
    expect(currentField).toBe('assetName');
    expect(currentOrder).toBe('ascend');

    // Click 2: Sắp xếp Z -> A
    handleSortCycle('assetName');
    expect(currentField).toBe('assetName');
    expect(currentOrder).toBe('descend');

    // Click 3: Bỏ sort hiển thị về ban đầu
    handleSortCycle('assetName');
    expect(currentField).toBe(undefined);
    expect(currentOrder).toBe(null);

    // Click 4: Lặp lại từ A -> Z
    handleSortCycle('assetName');
    expect(currentField).toBe('assetName');
    expect(currentOrder).toBe('ascend');

    // Chuyển sang cột khác: luôn bắt đầu từ A -> Z
    handleSortCycle('orgUnitId');
    expect(currentField).toBe('orgUnitId');
    expect(currentOrder).toBe('ascend');

    // Click lần 2 cột mới: Z -> A
    handleSortCycle('orgUnitId');
    expect(currentField).toBe('orgUnitId');
    expect(currentOrder).toBe('descend');

    // Click lần 3 cột mới: Bỏ sort
    handleSortCycle('orgUnitId');
    expect(currentField).toBe(undefined);
    expect(currentOrder).toBe(null);
  });
});
