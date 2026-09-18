import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import VtsSystemAssetList from './VtsSystemAssetList';
import VtsSystemAssetDetailContent from './VtsSystemAssetDetailContent';

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

vi.mock('../../services/vtsSystemService', () => ({
  vtsSystemService: {
    getAll: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../services/vtsasset/api', () => ({
  fetchVtsSystemAssets: vi.fn().mockResolvedValue({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
  }),
  fetchVtsSystemOptions: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../services/assetmovement/api', () => ({
  fetchKhaiThacList: vi.fn().mockResolvedValue({ content: [], totalElements: 0 }),
  fetchAssetIncreaseList: vi.fn().mockResolvedValue({ content: [], totalElements: 0 }),
  fetchAssetDecreaseList: vi.fn().mockResolvedValue({ content: [], totalElements: 0 }),
  fetchInfraAssetAttachments: vi.fn().mockResolvedValue([]),
  fetchInfraAssetHistory: vi.fn().mockResolvedValue([]),
}));

describe('VtsSystemAsset UI Components', () => {
  it('renders VtsSystemAssetList without crashing', () => {
    const html = renderToStaticMarkup(<VtsSystemAssetList />);
    expect(html).toContain('Tài sản hệ thống VTS');
  });

  it('renders VtsSystemAssetDetailContent with fmtNum working properly', () => {
    const html = renderToStaticMarkup(
      <VtsSystemAssetDetailContent
        open={true}
        selectedRecord={{
          id: 'vts-1',
          assetCode: 'VTS-001',
          assetName: 'Hệ thống VTS Hải Phòng',
          assetType: 'VTS_SYSTEM',
          quantity: 2,
          quantityUnit: 'Hệ thống',
        } as any}
        onClose={vi.fn()}
        orgName={new Map()}
        vtsSystemMap={new Map()}
        exploitationRows={[]}
        increaseRows={[]}
        decreaseRows={[]}
      />
    );
    expect(html).toContain('Hệ thống VTS Hải Phòng');
  });
});
