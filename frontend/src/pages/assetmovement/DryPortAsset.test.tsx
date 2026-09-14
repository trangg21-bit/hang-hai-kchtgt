import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Form } from 'antd';
import DryPortAssetList from './DryPortAssetList';
import DryPortAssetForm, { type DryPortFormValues } from './DryPortAssetForm';
import DryPortAssetDetailContent from './DryPortAssetDetailContent';
import type { DryPortAsset } from '../../services/assetmovement/types';

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
  fetchDryPortAssets: vi.fn().mockResolvedValue({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
  }),
  createDryPortAsset: vi.fn().mockResolvedValue({ id: 'dry-port-1' }),
  updateDryPortAsset: vi.fn().mockResolvedValue({ id: 'dry-port-1' }),
  deleteDryPortAsset: vi.fn().mockResolvedValue({ success: true }),
  fetchDryPortOptions: vi.fn().mockResolvedValue([
    { id: 'dp-1', dryPortName: 'Cảng cạn Đình Vũ', dryPortCode: 'CC-DV' },
  ]),
  fetchKhaiThacList: vi.fn().mockResolvedValue({ content: [], totalElements: 0 }),
  fetchAssetIncreaseList: vi.fn().mockResolvedValue({ content: [], totalElements: 0 }),
  fetchAssetDecreaseList: vi.fn().mockResolvedValue({ content: [], totalElements: 0 }),
  createKhaiThac: vi.fn().mockResolvedValue({ id: 'exp-1' }),
  createAssetIncrease: vi.fn().mockResolvedValue({ id: 'inc-1' }),
  createAssetDecrease: vi.fn().mockResolvedValue({ id: 'dec-1' }),
  fetchInfraAssetAttachments: vi.fn().mockResolvedValue([]),
}));

const mockDryPortAsset: DryPortAsset = {
  id: 'asset-dp-1',
  assetCode: 'TS-DP-001',
  assetName: 'Kho bãi ICD Đình Vũ',
  assetType: 'DRY_PORT',
  types: 'DRY_PORT',
  parentOrgUnitId: 'org-1',
  orgUnitId: 'org-2',
  usingOrgUnitId: 'org-2',
  dryPortId: 'dp-1',
  barcode: 'DP-DINHVU-01',
  assetCondition: 'Tốt',
  usageStatus: 'Đang sử dụng',
  assetGroup: 'Nhà, công trình xây dựng',
  assetSubgroup: 'Kho bãi hàng hóa',
  address: 'Khu công nghiệp Đình Vũ, Hải Phòng',
  origin: 'Đầu tư xây dựng',
  quantity: 1,
  quantityUnit: 'Bộ',
  model: 'ICD-2024',
  serialNumber: 'SN-ICD-01',
  countryOfOrigin: 'Việt Nam',
  manufacturer: 'Tổng công ty Cảng',
  constructionYear: 2021,
  useDate: '2021-06-01',
  landArea: 5000,
  floorArea: 3500,
  assetLocation: 'Khu A cảng cạn Đình Vũ',
  declarationDate: '2021-06-15',
  originalValue: 15000000000,
  depreciationRate: 5,
  remainingValue: 12000000000,
  assignmentDecisionNumber: 'QD-55/2021/QD-CHHVN',
  depreciationStartDate: '2021-07-01',
  depreciationMonths: 240,
  depreciationEndDate: '2041-07-01',
  accumulatedDepreciation: 3000000000,
  monthlyDepreciation: 62500000,
  disposalMethod: 'Bán',
  approvalStatus: 'APPROVED',
  updatedAt: '2026-03-01T10:00:00Z',
  updatedByName: 'Nguyễn Văn Quản Lý',
  submittedAt: '2026-02-28T09:00:00Z',
  submittedByName: 'Trần Văn Chuyên Viên',
  portAuthorityApprovedAt: '2026-03-01T08:00:00Z',
  portAuthorityApprovedByName: 'Lê Văn Trưởng Phòng',
  portAuthorityApprovalContent: 'Đồng ý duyệt hồ sơ tài sản cảng cạn.',
  departmentApprovedAt: '2026-03-01T10:00:00Z',
  departmentApprovedByName: 'Phạm Văn Cục Trưởng',
  departmentApprovalContent: 'Phê duyệt chính thức tài sản cảng cạn.',
};

describe('DryPortAsset UI Components (Tài sản cảng cạn)', () => {
  it('renders DryPortAssetList without crashing and supports column sorting', () => {
    const html = renderToStaticMarkup(<DryPortAssetList />);
    expect(html).toContain('Tài sản cảng cạn');
    expect(html).toContain('ant-table-column-has-sorters');
  });

  it('renders DryPortAssetDetailContent with all 6 tabs', () => {
    const orgMap = new Map([
      ['org-1', 'Cục Hàng hải Việt Nam'],
      ['org-2', 'Cảng vụ Hàng hải Hải Phòng'],
    ]);
    const dryPortMap = new Map([
      ['dp-1', { id: 'dp-1', name: 'Cảng cạn Đình Vũ', code: 'CC-DV' }],
    ]);

    const html = renderToStaticMarkup(
      <DryPortAssetDetailContent
        open={true}
        selectedRecord={mockDryPortAsset}
        onClose={vi.fn()}
        orgName={orgMap}
        dryPortMap={dryPortMap}
        exploitationRows={[]}
        increaseRows={[]}
        decreaseRows={[]}
      />,
    );

    expect(html).toContain('Thông tin chung');
    expect(html).toContain('Hồ sơ tài sản');
    expect(html).toContain('Thông tin chi tiết');
    expect(html).toContain('Khai thác tài sản');
    expect(html).toContain('Lịch sử thay đổi nguyên giá');
    expect(html).toMatch(/Xử lý.*theo dõi/);
    expect(html).toContain('Kho bãi ICD Đình Vũ');
    expect(html).toContain('TS-DP-001');
  });

  it('renders DryPortAssetForm in create and edit modes', () => {
    function FormWrapper({ mode }: { mode: 'create' | 'edit' }) {
      const [form] = Form.useForm<DryPortFormValues>();
      return (
        <DryPortAssetForm
          open={true}
          drawerMode={mode}
          selected={mode === 'edit' ? mockDryPortAsset : undefined}
          form={form}
          organizations={[]}
          dryPorts={[{ id: 'dp-1', name: 'Cảng cạn Đình Vũ', code: 'CC-DV' }]}
          attachments={[]}
          saving={false}
          saveAction="DRAFT"
          onClose={vi.fn()}
          onSave={vi.fn()}
          onUploadAttachment={vi.fn()}
          onDeleteAttachment={vi.fn()}
          onDownloadAttachment={vi.fn()}
        />
      );
    }

    const createHtml = renderToStaticMarkup(<FormWrapper mode="create" />);
    expect(createHtml).toContain('Thêm mới');
    expect(createHtml).toContain('Lưu tạm');
    expect(createHtml).toContain('Lưu và gửi phê duyệt');
    expect(createHtml).toContain('Lưu và phê duyệt');

    const editHtml = renderToStaticMarkup(<FormWrapper mode="edit" />);
    expect(editHtml).toContain('Chỉnh sửa');
  });
});
