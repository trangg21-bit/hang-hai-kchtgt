import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as React from 'react';
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

  it('renders ReportViewer for F-152 with master summary table and "Chọn chỉ tiêu"', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/reports/F-152']}>
        <Routes>
          <Route path="/reports/:code" element={<ReportViewer />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify report name in header
    expect(html).toContain('Biểu 06-N: Thống kê vùng đón trả hoa tiêu');
    // Verify "Chọn chỉ tiêu" button
    expect(html).toContain('Chọn chỉ tiêu');
    // Verify filter apply button label "Tổng hợp"
    expect(html).toContain('Tổng hợp');
  });
});
