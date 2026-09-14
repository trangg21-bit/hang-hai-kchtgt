import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReportPreviewModal from './ReportPreviewModal';
import type { ReportResponse } from '../../types/report';

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    Modal: ({ open, title, children, footer }: {
      open?: boolean;
      title?: React.ReactNode;
      children?: React.ReactNode;
      footer?: React.ReactNode;
    }) => {
      if (!open) return null;
      return (
        <div className="ant-modal">
          {title && <div className="ant-modal-title">{title}</div>}
          <div className="ant-modal-body">{children}</div>
          {footer && <div className="ant-modal-footer">{footer}</div>}
        </div>
      );
    },
  };
});

describe('ReportPreviewModal', () => {
  const mockReportData: ReportResponse = {
    reportCode: 'F-152',
    reportName: 'Biểu 06-N: Thống kê vùng đón trả hoa tiêu',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    headers: ['STT', 'Tên khu vực', 'Vị trí', 'Độ sâu'],
    rows: [
      { STT: '1', 'Tên khu vực': 'Khu vực 1', 'Vị trí': 'Hải Phòng', 'Độ sâu': 12 },
      { STT: '2', 'Tên khu vực': 'Khu vực 2', 'Vị trí': 'Vũng Tàu', 'Độ sâu': 14 },
    ],
    metadata: {},
    summary: { total: 2 },
  };

  it('renders modal markup when open is true', () => {
    const onClose = vi.fn();
    const onExport = vi.fn();

    const html = renderToStaticMarkup(
      <ReportPreviewModal
        open={true}
        onClose={onClose}
        reportCode="BCKCHT_167"
        reportName="Biểu 06-N: Thống kê vùng đón trả hoa tiêu"
        orgUnitName="Cục Hàng hải và Đường thủy Việt Nam"
        reportPeriodText="2026"
        reportData={mockReportData}
        loading={false}
        onExport={onExport}
        loadingExport={null}
      />
    );

    expect(html).toContain('Xem trước báo cáo: BCKCHT_167');
    expect(html).toContain('Cục Hàng hải và Đường thủy Việt Nam');
    expect(html).toContain('Khu vực 1');
    expect(html).toContain('Khu vực 2');
    expect(html).toContain('Xuất Excel');
    expect(html).toContain('Xuất PDF');
  });

  it('renders empty markup when rows are empty', () => {
    const onClose = vi.fn();
    const onExport = vi.fn();

    const html = renderToStaticMarkup(
      <ReportPreviewModal
        open={true}
        onClose={onClose}
        reportCode="BCKCHT_167"
        reportName="Biểu 06-N: Thống kê vùng đón trả hoa tiêu"
        orgUnitName="Cục Hàng hải và Đường thủy Việt Nam"
        reportPeriodText="2026"
        reportData={{
          ...mockReportData,
          rows: [],
        }}
        loading={false}
        onExport={onExport}
        loadingExport={null}
      />
    );

    expect(html).toContain('Không có số liệu chi tiết cho kỳ báo cáo đã chọn');
  });
});
