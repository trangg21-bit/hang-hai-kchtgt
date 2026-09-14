import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReportColumnSelector, { type ColumnItem } from './ReportColumnSelector';

describe('ReportColumnSelector', () => {
  const columns: ColumnItem[] = [
    { key: 'reportCode', label: 'Mã báo cáo' },
    { key: 'reportName', label: 'Tên báo cáo' },
    { key: 'orgUnitName', label: 'Đơn vị báo cáo' },
    { key: 'periodText', label: 'Năm báo cáo' },
  ];

  it('renders "Chọn chỉ tiêu" button markup properly', () => {
    const onChange = vi.fn();
    const onReset = vi.fn();
    const onShowSttChange = vi.fn();

    const html = renderToStaticMarkup(
      <ReportColumnSelector
        columns={columns}
        visibleKeys={['reportCode', 'reportName']}
        columnOrder={['reportCode', 'reportName', 'orgUnitName', 'periodText']}
        showStt={true}
        onShowSttChange={onShowSttChange}
        onChange={onChange}
        onReset={onReset}
      />
    );

    expect(html).toContain('Chọn chỉ tiêu');
  });
});
