import { readFileSync } from 'node:fs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ReportViewer from './ReportViewer';

vi.mock('../../store/authStore', () => {
  const mockAuthState = {
    user: {
      id: 'user-admin',
      username: 'admin',
      fullName: 'Quản trị viên',
      permissions: ['*'],
    },
    hasPermission: () => true,
  };
  const fn = vi.fn((selector) => selector(mockAuthState)) as unknown as {
    (selector: (s: typeof mockAuthState) => unknown): unknown;
    getState: () => typeof mockAuthState;
  };
  fn.getState = () => mockAuthState;
  return { useAuthStore: fn };
});

vi.mock('../../store/permissionStore', () => ({
  usePermissionStore: vi.fn((selector) =>
    selector({
      permissions: ['*'],
      hasPermission: () => true,
    })
  ),
}));

vi.mock('../../services/reportService', () => ({
  reportService: {
    getPreview: vi.fn().mockResolvedValue({
      reportCode: 'F-152',
      reportName: 'Biểu 06-N: Thống kê vùng đón trả hoa tiêu, vùng quay trở tàu, ga tránh tàu, khu neo tránh trú bão',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      headers: ['STT', 'Tên khu neo'],
      rows: [{ STT: '1', 'Tên khu neo': 'Khu neo A' }],
      metadata: {},
      summary: { total: 1 },
    }),
    exportReport: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../services/organizationService', () => ({
  organizationService: {
    list: vi.fn().mockResolvedValue({
      data: [
        { id: 'org-1', name: 'Cục Hàng hải và Đường thủy Việt Nam', code: 'G17.43' },
      ],
    }),
  },
}));

describe('ReportViewer UI Standard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ReportViewer for F-152 with the shared table and no top-level controls', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/reports/F-152']}>
        <Routes>
          <Route path="/reports/:code" element={<ReportViewer />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify report name in header
    expect(html).toContain('Biểu 06-N: Thống kê vùng đón trả hoa tiêu');
    expect(html).not.toContain('Chọn chỉ tiêu');
    expect(html).not.toContain('Xuất Excel');
    expect(html).not.toContain('Xuất PDF');

    // The export and preview actions are configured as standard CommonTable dropdown items
    const source = readFileSync(new URL('./ReportViewer.tsx', import.meta.url), 'utf8');
    expect(source).not.toContain('Chọn chỉ tiêu');
    expect(source).not.toContain("'1-1 trong 1'");
    expect(source).toContain('<CommonTable');
    expect(source).toContain("enablePaging: true");
    expect(source).toContain("width: 500");
    expect(source).toContain("minWidth: 420");
    expect(source).toContain("width: 360");
    expect(source).toContain("minWidth: 320");
    expect(source).not.toContain("label: 'Xem trước chi tiết báo cáo'");
    expect(source).toContain("label: 'Xem trước PDF'");
    expect(source).toContain('icon: <EyeOutlined />');
    expect(source).toContain("label: 'Xuất Excel'");
    expect(source).toContain('icon: <FileExcelOutlined />');
    expect(source).toContain("label: 'Xuất PDF'");
    expect(source).toContain('icon: <FileTextOutlined />');
    expect(source).toContain('reportPdfPreviewService.getPdfBlob');
    expect(source).toContain('new AbortController()');
    expect(source).toContain('window.URL.revokeObjectURL');
    expect(source).toContain('<iframe');
    expect(source).toContain('#zoom=page-width&view=FitH');
    expect(source).toContain('width="96vw"');
    expect(source).toContain('centered');
    const pdfPreviewServiceSource = readFileSync(
      new URL('../../services/reportPdfPreviewService.ts', import.meta.url),
      'utf8',
    );
    expect(pdfPreviewServiceSource).toContain("type: 'application/pdf'");

    // Verify filter apply button label "Tổng hợp"
    expect(html).toContain('Tổng hợp');
  });
});
