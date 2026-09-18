import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ChannelAssetList from './ChannelAssetList';
import ChannelAssetDetailContent from './ChannelAssetDetailContent';
import type { ChannelAsset } from '../../services/assetmovement/types';
import { calculateStatusColumnWidth } from '../../components/shared/AssetAdjustmentHistoryTab';
import { getApprovalStatusInfo } from '../../components/shared/common-table/status-badge';

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    Drawer: ({ open, title, children, footer, extra }: {
      open?: boolean;
      title?: React.ReactNode;
      children?: React.ReactNode;
      footer?: React.ReactNode;
      extra?: React.ReactNode;
    }) => {
      if (!open) return null;
      return (
        <div className="ant-drawer">
          {title && <div className="ant-drawer-title">{title}</div>}
          {extra && <div className="ant-drawer-extra">{extra}</div>}
          <div className="ant-drawer-body">{children}</div>
          {footer && <div className="ant-drawer-footer">{footer}</div>}
        </div>
      );
    },
    Tabs: ({ items }: { items?: { key: string; label: React.ReactNode; children?: React.ReactNode }[] }) => {
      return (
        <div className="ant-tabs">
          <div className="ant-tabs-nav">
            {items?.map((item) => (
              <div key={item.key} className="ant-tabs-tab">{item.label}</div>
            ))}
          </div>
          <div className="ant-tabs-content">
            {items?.map((item) => (
              <div key={item.key} className="ant-tabs-tabpane">{item.children}</div>
            ))}
          </div>
        </div>
      );
    },
  };
});

const { mockUseAuthStore } = vi.hoisted(() => {
  const mockAuthState = {
    user: {
      id: 'user-admin',
      username: 'admin',
      fullName: 'Quản trị viên',
      permissions: ['*'],
    },
    hasPermission: () => true,
  };

  const store = Object.assign(
    vi.fn((selector) => (selector ? selector(mockAuthState) : mockAuthState)),
    {
      getState: vi.fn(() => mockAuthState),
    },
  );

  return { mockUseAuthStore: store };
});

vi.mock('../../store/authStore', () => ({
  useAuthStore: mockUseAuthStore,
}));

vi.mock('../../services/organizationService', () => ({
  organizationService: {
    getAll: vi.fn().mockResolvedValue([
      { id: 'org-1', name: 'Cục Hàng hải Việt Nam', parentId: null },
      { id: 'org-2', name: 'Cảng vụ Hàng hải Hải Phòng', parentId: 'org-1' },
    ]),
  },
}));

vi.mock('../../services/assetmovement/api', () => ({
  fetchChannelAssets: vi.fn().mockResolvedValue({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
  }),
  fetchChannelOptions: vi.fn().mockResolvedValue([
    { id: 'ch-1', channelName: 'Luồng Hải Phòng', channelCode: 'L-HP' },
  ]),
  fetchKhaiThacList: vi.fn().mockResolvedValue({ content: [], totalElements: 0 }),
  fetchAssetIncreaseList: vi.fn().mockResolvedValue({ content: [], totalElements: 0 }),
  fetchAssetDecreaseList: vi.fn().mockResolvedValue({ content: [], totalElements: 0 }),
  fetchInfraAssetAttachments: vi.fn().mockResolvedValue([]),
}));

const mockChannelAsset: ChannelAsset = {
  id: 'asset-ch-1',
  assetCode: 'TS-CH-001',
  assetName: 'Luồng hàng hải Hải Phòng',
  assetType: 'CHANNEL',
  orgUnitId: 'org-2',
  usingOrgUnitId: 'org-2',
  channelId: 'ch-1',
  assetCondition: 'Tốt',
  originalValue: 50000000000,
  approvalStatus: 'APPROVED',
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-01T00:00:00Z',
};

describe('ChannelAsset UI Components', () => {
  it('renders ChannelAssetList without crashing', () => {
    const html = renderToStaticMarkup(<ChannelAssetList />);
    expect(html).toContain('Tài sản luồng hàng hải');
  });

  it('renders ChannelAssetDetailContent with tab Lịch sử thay đổi nguyên giá', () => {
    const html = renderToStaticMarkup(
      <ChannelAssetDetailContent
        open={true}
        selectedRecord={mockChannelAsset}
        onClose={vi.fn()}
        orgName={new Map([['org-2', 'Cảng vụ Hàng hải Hải Phòng']])}
        channelMap={new Map([['ch-1', 'Luồng Hải Phòng']])}
      />
    );
    expect(html).toContain('Lịch sử thay đổi nguyên giá');
  });

  it('calculates status column width dynamically based on status label length', () => {
    // Empty records default to 200px
    expect(calculateStatusColumnWidth()).toBe(200);
    expect(calculateStatusColumnWidth([])).toBe(200);

    // Short status like APPROVED (Đã phê duyệt) remains at 200px
    expect(calculateStatusColumnWidth([{ status: 'APPROVED' }])).toBe(200);

    // Long status like PENDING_APPROVAL / Chờ phê duyệt cấp Cảng vụ/Chi cục widens to >= 360px
    const longWidth1 = calculateStatusColumnWidth([{ status: 'PENDING_APPROVAL' }]);
    expect(longWidth1).toBeGreaterThanOrEqual(360);

    const longWidth2 = calculateStatusColumnWidth([{ status: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' }]);
    expect(longWidth2).toBeGreaterThanOrEqual(360);
  });

  it('translates all approval statuses to Vietnamese correctly', () => {
    expect(getApprovalStatusInfo('PENDING_APPROVAL').label).toBe('Chờ phê duyệt cấp Cảng vụ/Chi cục');
    expect(getApprovalStatusInfo('PENDING_LEVEL1').label).toBe('Chờ phê duyệt cấp Cảng vụ/Chi cục');
    expect(getApprovalStatusInfo('APPROVED_LEVEL1').label).toBe('Chờ phê duyệt cấp Cục');
    expect(getApprovalStatusInfo('CHO_PHE_DUYET').label).toBe('Chờ phê duyệt cấp Cảng vụ/Chi cục');
    expect(getApprovalStatusInfo('CHO_PHE_DUYET_CAP_CUC').label).toBe('Chờ phê duyệt cấp Cục');
    expect(getApprovalStatusInfo('APPROVED').label).toBe('Đã phê duyệt');
    expect(getApprovalStatusInfo('DRAFT').label).toBe('Lưu tạm');
    expect(getApprovalStatusInfo('Chờ phê duyệt cấp Cảng vụ/Chi cục').label).toBe('Chờ phê duyệt cấp Cảng vụ/Chi cục');
  });
});
