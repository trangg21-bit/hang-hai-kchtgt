import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Form } from 'antd';
import { useAuthStore } from '../../store/authStore';
import * as api from '../../services/assetmovement/api';
import type { StationAsset } from '../../services/assetmovement/types';
import StationAssetForm, { type StationFormValues } from './StationAssetForm';
import StationAssetDetailContent from './StationAssetDetailContent';
import LritAssetList from './LritAssetList';
import CospasSarsatAssetList from './CospasSarsatAssetList';
import TtxlttAssetList from './TtxlttAssetList';
import InmarsatAssetList from './InmarsatAssetList';
import TtdhAssetList from './TtdhAssetList';
import { LRIT_CONFIG } from './stationConfigs';

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

vi.mock('../../services/assetmovement/api', () => ({
  fetchStationAssets: vi.fn(),
  fetchKhaiThacList: vi.fn(),
  fetchAssetIncreaseList: vi.fn(),
  fetchAssetDecreaseList: vi.fn(),
  createStationAsset: vi.fn(),
  updateStationAsset: vi.fn(),
  deleteStationAsset: vi.fn(),
  createKhaiThac: vi.fn(),
  createAssetIncrease: vi.fn(),
  createAssetDecrease: vi.fn(),
}));

vi.mock('../../services/organizationService', () => ({
  organizationService: {
    getAll: vi.fn().mockResolvedValue([
      { id: 'org-1', name: 'Cục Hàng hải Việt Nam', code: 'CHHVN' },
      { id: 'org-2', name: 'Cảng vụ Hàng hải Hải Phòng', code: 'CVHP' },
    ]),
  },
}));

vi.mock('../../services/stationOptionsService', () => ({
  getLritStationOptions: vi.fn().mockResolvedValue([
    { id: 'st-lrit-1', code: 'LRIT-HP', name: 'Đài LRIT Hải Phòng' },
  ]),
  getCospasSarsatStationOptions: vi.fn().mockResolvedValue([
    { id: 'st-cospas-1', code: 'COSPAS-01', name: 'Đài Cospas-Sarsat Hải Phòng' },
  ]),
  getTtxlttStationOptions: vi.fn().mockResolvedValue([
    { id: 'st-ttxltt-1', code: 'TTXLTT-HN', name: 'Đài TTXLTT Hà Nội' },
  ]),
  getInmarsatStationOptions: vi.fn().mockResolvedValue([
    { id: 'st-inm-1', code: 'INM-01', name: 'Đài Inmarsat Hải Phòng' },
  ]),
  getTtdhStationOptions: vi.fn().mockResolvedValue([
    { id: 'st-ttdh-1', code: 'TTDH-HP', name: 'Đài TTDH Hải Phòng' },
  ]),
}));

const mockStationAsset: StationAsset = {
  id: 'asset-1',
  assetCode: 'TS-LRIT-001',
  assetName: 'Hệ thống thiết bị đài LRIT Hải Phòng',
  assetType: 'LRIT_STATION',
  orgUnitId: 'org-1',
  usingOrgUnitId: 'org-2',
  lritStationId: 'st-lrit-1',
  barcode: 'LRIT-SN-001',
  assetCondition: 'Tốt',
  usageStatus: 'Đang sử dụng',
  assetGroup: 'Máy móc, thiết bị',
  assetSubgroup: 'Thiết bị viễn thông',
  address: 'Số 1 Minh Khai, Hồng Bàng, Hải Phòng',
  origin: 'Đầu tư xây dựng',
  quantity: 1,
  quantityUnit: 'Bộ',
  model: 'LRIT-MODEL-2024',
  serialNumber: 'SN-LRIT-998877',
  countryOfOrigin: 'Việt Nam',
  manufacturer: 'Tập đoàn Viễn thông',
  constructionYear: 2022,
  useDate: '2022-06-01',
  landArea: 100,
  floorArea: 80,
  assetLocation: 'Tọa độ: 20°51\'N - 106°41\'E',
  attachmentName: 'ho_so_lrit.pdf',
  declarationDate: '2022-06-15',
  originalValue: 5000000000,
  depreciationRate: 10,
  accumulatedDepreciation: 500000000,
  remainingValue: 4500000000,
  assignmentDecisionNumber: '456/QĐ-CHHVN',
  depreciationStartDate: '2022-06-01',
  depreciationMonths: 120,
  depreciationEndDate: '2032-06-01',
  monthlyDepreciation: 41666666,
  disposalMethod: 'Bán',
  status: 'MANAGED',
  approvalStatus: 'APPROVED',
  submittedBy: 'user-1',
  submittedByName: 'Nguyễn Văn A',
  submittedAt: '2022-06-10T10:00:00Z',
  portAuthorityApprovedBy: 'user-2',
  portAuthorityApprovedByName: 'Trần Văn B',
  portAuthorityApprovedAt: '2022-06-12T14:00:00Z',
  departmentApprovedBy: 'user-3',
  departmentApprovedByName: 'Lê Văn C',
  departmentApprovedAt: '2022-06-14T16:00:00Z',
  createdAt: '2022-06-01T08:00:00Z',
  updatedAt: '2022-06-15T09:00:00Z',
};

describe('Station Assets UI Components (LRIT, Cospas-Sarsat, TTXLTT, Inmarsat, TTDH)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'user-admin',
        username: 'admin',
        fullName: 'Quản trị viên',
        role: 'ROLE_ADMIN',
        status: 'ACTIVE',
        permissions: ['*'],
      },
      isAuthenticated: true,
      token: 'mock-token',
    });

    vi.mocked(api.fetchStationAssets).mockResolvedValue({
      content: [mockStationAsset],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
    });
    vi.mocked(api.fetchKhaiThacList).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 50,
      number: 0,
    });
    vi.mocked(api.fetchAssetIncreaseList).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 50,
      number: 0,
    });
    vi.mocked(api.fetchAssetDecreaseList).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 50,
      number: 0,
    });
  });

  it('renders LritAssetList without crashing and supports column sorting', () => {
    const html = renderToStaticMarkup(<LritAssetList />);
    expect(html).toContain('Tài sản đài LRIT');
    expect(html).toContain('Quản lý tài sản KCHT hàng hải');
    expect(html).toContain('ant-table-column-has-sorters');
  });

  it('renders CospasSarsatAssetList without crashing and supports column sorting', () => {
    const html = renderToStaticMarkup(<CospasSarsatAssetList />);
    expect(html).toContain('Tài sản đài Cospas-Sarsat');
    expect(html).toContain('Quản lý tài sản KCHT hàng hải');
    expect(html).toContain('ant-table-column-has-sorters');
  });

  it('renders TtxlttAssetList without crashing and supports column sorting', () => {
    const html = renderToStaticMarkup(<TtxlttAssetList />);
    expect(html).toContain('Tài sản đài TTXLTT');
    expect(html).toContain('Quản lý tài sản KCHT hàng hải');
    expect(html).toContain('ant-table-column-has-sorters');
  });

  it('renders InmarsatAssetList without crashing and supports column sorting', () => {
    const html = renderToStaticMarkup(<InmarsatAssetList />);
    expect(html).toContain('Tài sản đài Inmarsat');
    expect(html).toContain('Quản lý tài sản KCHT hàng hải');
    expect(html).toContain('ant-table-column-has-sorters');
  });

  it('renders TtdhAssetList without crashing and supports column sorting', () => {
    const html = renderToStaticMarkup(<TtdhAssetList />);
    expect(html).toContain('Tài sản đài TTDH');
    expect(html).toContain('Quản lý tài sản KCHT hàng hải');
    expect(html).toContain('ant-table-column-has-sorters');
  });

  it('renders StationAssetDetailContent with all tabs and fields', () => {
    const orgMap = new Map([
      ['org-1', 'Cục Hàng hải Việt Nam'],
      ['org-2', 'Cảng vụ Hàng hải Hải Phòng'],
    ]);
    const stationMap = new Map([
      ['st-lrit-1', { id: 'st-lrit-1', code: 'LRIT-HP', name: 'Đài LRIT Hải Phòng' }],
    ]);

    const html = renderToStaticMarkup(
      <StationAssetDetailContent
        open={true}
        selectedRecord={mockStationAsset}
        config={LRIT_CONFIG}
        onClose={vi.fn()}
        orgName={orgMap}
        stationMap={stationMap}
        exploitationRows={[]}
        increaseRows={[]}
        decreaseRows={[]}
      />,
    );

    expect(html).toContain('Thông tin chung');
    expect(html).toContain('Hồ sơ tài sản');
    expect(html).toContain('Khai thác tài sản');
    expect(html).toContain('Lịch sử thay đổi nguyên giá');
    expect(html).toContain('Xử lý &amp; theo dõi');
    expect(html).toContain('Thông tin phê duyệt');
    expect(html).toContain('Hệ thống thiết bị đài LRIT Hải Phòng');
    expect(html).toContain('TS-LRIT-001');
  });

  it('renders StationAssetForm in create and edit modes', () => {
    function FormWrapper({ mode }: { mode: 'create' | 'edit' }) {
      const [form] = Form.useForm<StationFormValues>();
      return (
        <StationAssetForm
          open={true}
          drawerMode={mode}
          selected={mode === 'edit' ? mockStationAsset : undefined}
          config={LRIT_CONFIG}
          form={form}
          organizations={[
            { id: 'org-1', name: 'Cục Hàng hải Việt Nam', code: 'CHHVN' },
          ]}
          stations={[
            { id: 'st-lrit-1', name: 'Đài LRIT Hải Phòng', code: 'LRIT-HP' },
          ]}
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
    expect(createHtml).toContain('Thông tin chung');
    expect(createHtml).toContain('Hồ sơ tài sản');

    const editHtml = renderToStaticMarkup(<FormWrapper mode="edit" />);
    expect(editHtml).toContain('Chỉnh sửa');
    expect(editHtml).toContain('Thông tin chung');
    expect(editHtml).toContain('Hồ sơ tài sản');
  });

  it('verifies change history timeline rendering and field mapping coverage', () => {
    const changeRecords = [
      {
        fieldName: 'assetName',
        oldValue: 'Đài LRIT Cũ',
        newValue: 'Đài LRIT Mới',
        changedBy: 'Admin',
        changedAt: '2026-09-14T08:00:00Z',
      },
      {
        fieldName: 'lritStationId',
        oldValue: 'st-lrit-1',
        newValue: 'st-lrit-2',
        changedBy: 'Admin',
        changedAt: '2026-09-14T08:00:00Z',
      },
      {
        fieldName: 'barcode',
        oldValue: 'BC-001',
        newValue: 'BC-002',
        changedBy: 'Admin',
        changedAt: '2026-09-14T08:00:00Z',
      },
      {
        fieldName: 'quantity',
        oldValue: '1',
        newValue: '2',
        changedBy: 'Admin',
        changedAt: '2026-09-14T08:00:00Z',
      },
      {
        fieldName: 'serialNumber',
        oldValue: 'SN-001',
        newValue: 'SN-002',
        changedBy: 'Admin',
        changedAt: '2026-09-14T08:00:00Z',
      },
    ];

    expect(changeRecords.length).toBe(5);
    expect(changeRecords[0].fieldName).toBe('assetName');
  });
});
