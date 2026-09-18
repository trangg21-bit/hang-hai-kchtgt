import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AisSystemAssetList from './AisSystemAssetList';

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

vi.mock('../../services/aisasset/api', () => ({
  fetchAisSystemAssets: vi.fn().mockResolvedValue({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
  }),
  fetchAisSystemOptions: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../services/assetmovement/api', () => ({
  fetchKhaiThacList: vi.fn().mockResolvedValue({ content: [], totalElements: 0 }),
  fetchAssetIncreaseList: vi.fn().mockResolvedValue({ content: [], totalElements: 0 }),
  fetchAssetDecreaseList: vi.fn().mockResolvedValue({ content: [], totalElements: 0 }),
  fetchInfraAssetAttachments: vi.fn().mockResolvedValue([]),
  fetchInfraAssetHistory: vi.fn().mockResolvedValue([]),
}));

describe('AisSystemAsset UI Components', () => {
  it('renders AisSystemAssetList without crashing and without duplicate imports', () => {
    const html = renderToStaticMarkup(<AisSystemAssetList />);
    expect(html).toContain('Tài sản hệ thống AIS');
  });
});
