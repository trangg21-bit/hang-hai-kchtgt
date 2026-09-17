import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import FilterTableLayout, { FilterTableLayoutContext } from '../../components/list-view/FilterTableLayout';
import TableFilter from '../../components/shared/table-filter/TableFilter';
import type { FilterOption } from '../../components/list-view';

describe('FilterTableLayout & TableFilter Advanced Toggle', () => {
  const mockFilters: FilterOption[] = [
    { key: 'basicField1', label: 'Đơn vị quản lý', type: 'text' },
    { key: 'basicField2', label: 'Tên tài sản', type: 'text' },
    { key: 'basicField3', label: 'Tình trạng tài sản', type: 'select', options: [{ value: 'HOAT_DONG', label: 'Hoạt động' }] },
    { key: 'advField1', label: 'Đơn vị sử dụng', type: 'text', isAdvanced: true },
    { key: 'advField2', label: 'Mã tài sản', type: 'text', isAdvanced: true },
  ];

  it('renders filter toggle button with tooltip title when hideFilterToggle is false', () => {
    const html = renderToStaticMarkup(
      <FilterTableLayout
        onFilterApply={() => {}}
        onFilterReset={() => {}}
        filterContent={<TableFilter filters={mockFilters} values={{}} onChange={() => {}} />}
      >
        <div>Content</div>
      </FilterTableLayout>
    );

    expect(html).toContain('Mở rộng bộ lọc nâng cao');
    expect(html).toContain('Tìm kiếm');
  });

  it('hides advanced filter fields when collapsed by default in FilterTableLayout', () => {
    const html = renderToStaticMarkup(
      <FilterTableLayout
        onFilterApply={() => {}}
        onFilterReset={() => {}}
        filterContent={<TableFilter filters={mockFilters} values={{}} onChange={() => {}} />}
      >
        <div>Content</div>
      </FilterTableLayout>
    );

    // Basic fields are visible
    expect(html).toContain('Đơn vị quản lý');
    expect(html).toContain('Tên tài sản');
    expect(html).toContain('Tình trạng tài sản');

    // Advanced fields are hidden
    expect(html).not.toContain('Đơn vị sử dụng');
    expect(html).not.toContain('Mã tài sản');
  });

  it('shows advanced filter fields when isAdvancedOpen is true via FilterTableLayoutContext', () => {
    const html = renderToStaticMarkup(
      <FilterTableLayoutContext.Provider value={{ isAdvancedOpen: true, toggleAdvanced: () => {} }}>
        <TableFilter filters={mockFilters} values={{}} onChange={() => {}} />
      </FilterTableLayoutContext.Provider>
    );

    // Both basic and advanced fields are visible
    expect(html).toContain('Đơn vị quản lý');
    expect(html).toContain('Tên tài sản');
    expect(html).toContain('Tình trạng tài sản');
    expect(html).toContain('Đơn vị sử dụng');
    expect(html).toContain('Mã tài sản');
  });

  it('shows advanced filter fields when showAdvanced prop is passed directly to TableFilter', () => {
    const html = renderToStaticMarkup(
      <TableFilter filters={mockFilters} values={{}} onChange={() => {}} showAdvanced={true} />
    );

    expect(html).toContain('Đơn vị sử dụng');
    expect(html).toContain('Mã tài sản');
  });
});
