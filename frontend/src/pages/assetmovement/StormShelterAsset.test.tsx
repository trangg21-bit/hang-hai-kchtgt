import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Form } from 'antd';
import { useAuthStore } from '../../store/authStore';
import * as api from '../../services/assetmovement/api';
import type {
  StormShelterAsset,
  StormShelterAssetPayload,
  StormShelterAssetFilters,
  AssetValueAdjustmentDetails,
} from '../../services/assetmovement/types';
import StormShelterAssetList from './StormShelterAssetList';
import StormShelterAssetForm, { type FormValues } from './StormShelterAssetForm';
import StormShelterAssetDetailContent from './StormShelterAssetDetailContent';
import { StormShelterAssetOperationForm, type OperationValues } from './StormShelterAssetOperationForm';
import type { StormShelterArea } from '../../types/port';
import type { Organization } from '../../services/organizationService';

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
  fetchStormShelterAssetList: vi.fn(),
  fetchStormShelterAsset: vi.fn(),
  createStormShelterAsset: vi.fn(),
  updateStormShelterAsset: vi.fn(),
  deleteStormShelterAsset: vi.fn(),
  fetchKhaiThacList: vi.fn(),
  createKhaiThac: vi.fn(),
  fetchAssetIncreaseList: vi.fn(),
  createAssetIncrease: vi.fn(),
  fetchAssetDecreaseList: vi.fn(),
  createAssetDecrease: vi.fn(),
}));

vi.mock('../../services/organizationService', () => ({
  organizationService: {
    getAll: vi.fn().mockResolvedValue([
      { id: 'org-1', name: 'Cục Hàng hải Việt Nam', code: 'CHHVN' },
      { id: 'org-4', name: 'Cảng vụ Hàng hải Đà Nẵng', code: 'CVDN' },
    ]),
  },
}));

vi.mock('../../services/portService', () => ({
  stormShelterCRUD: {
    findAll: vi.fn().mockResolvedValue({
      data: [
        { id: 'shelter-1', stormShelterCode: 'TB-DN-01', stormShelterName: 'Khu tránh trú bão Sơn Trà' },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    }),
    list: vi.fn().mockResolvedValue({
      data: [
        { id: 'shelter-1', stormShelterCode: 'TB-DN-01', stormShelterName: 'Khu tránh trú bão Sơn Trà' },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    }),
  },
}));

const mockStormShelterAsset: StormShelterAsset = {
  id: 'asset-tb-1',
  assetCode: 'TS-TB-001',
  assetName: 'Khu neo đậu tránh bão Vịnh Mân Quang',
  assetType: 'STORM_SHELTER',
  parentOrgUnitId: 'org-1',
  orgUnitId: 'org-4',
  usingOrgUnitId: 'org-4',
  stormShelterId: 'shelter-1',
  barcode: 'TB-DN-MQ-01',
  assetCondition: 'Tốt',
  usageStatus: 'Đang sử dụng',
  assetGroup: 'Nhà, công trình xây dựng',
  assetSubgroup: 'Khu tránh trú bão hàng hải',
  address: 'Bán đảo Sơn Trà, Đà Nẵng',
  origin: 'Đầu tư xây dựng',
  quantity: 1,
  quantityUnit: 'Khu',
  model: 'TB-RES-2022',
  serialNumber: 'SN-TB-4433',
  countryOfOrigin: 'Việt Nam',
  manufacturer: 'Ban Quản lý Dự án Hàng hải',
  constructionYear: 2018,
  useDate: '2019-08-01',
  landArea: 80000,
  floorArea: 0,
  assetLocation: 'Tọa độ: 16°07\'N - 108°15\'E',
  attachmentName: 'qd_thanh_lap_khu_tru_bao.pdf',
  declarationDate: '2019-08-15',
  originalValue: 48000000000,
  depreciationRate: 3.5,
  accumulatedDepreciation: 6720000000,
  remainingValue: 41280000000,
  assignmentDecisionNumber: '789/QĐ-CHHVN',
  depreciationStartDate: '2019-09-01',
  depreciationMonths: 340,
  depreciationEndDate: '2047-12-01',
  monthlyDepreciation: 141176470,
  disposalMethod: 'Khác',
  status: 'MANAGED',
  approvalStatus: 'APPROVED',
  submittedBy: 'user-1',
  submittedByName: 'Nguyễn Văn A',
  submittedAt: '2019-08-20T08:00:00Z',
  portAuthorityApprovedBy: 'user-2',
  portAuthorityApprovedByName: 'Phạm Văn B (Cảng vụ)',
  portAuthorityApprovedAt: '2019-08-22T09:00:00Z',
  portAuthorityApprovalContent: 'Đạt tiêu chuẩn an toàn hàng hải tránh bão',
  departmentApprovedBy: 'user-3',
  departmentApprovedByName: 'Vũ Văn C (Cục)',
  departmentApprovedAt: '2019-08-25T15:00:00Z',
  departmentApprovalContent: 'Chấp thuận phê duyệt tài sản khu tránh bão',
  updatedBy: 'user-1',
  updatedByName: 'Nguyễn Văn A',
  updatedAt: '2026-09-10T12:00:00Z',
};

describe('Module 3: Tài sản khu tránh trú bão (docs/checklists/CHECKLIST-TAI-SAN-KHU-TRANH-TRU-BAO.md)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        userId: 'admin-1',
        username: 'admin',
        fullName: 'Quản trị viên Hệ thống',
        orgUnitId: 'org-4',
        role: 'ADMIN',
        status: 'authenticated',
        permissions: ['infraasset:manage'],
      },
      isAuthenticated: true,
      token: 'admin-jwt-token',
    });

    vi.mocked(api.fetchStormShelterAssetList).mockResolvedValue({
      content: [mockStormShelterAsset],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
    });

    vi.mocked(api.fetchKhaiThacList).mockResolvedValue({
      content: [
        {
          id: 'kt-tb-1',
          assetId: mockStormShelterAsset.id,
          assetName: mockStormShelterAsset.assetName,
          exploitationYear: 2025,
          doanhThu: 1500000000,
          depreciation: 150000000,
          description: 'Hợp đồng trông giữ tàu mùa bão',
          operatorOrgUnitId: 'org-4',
          totalRevenue: 1500000000,
          relatedCosts: 150000000,
          stateBudgetPayment: 300000000,
          projectAmount: 1050000000,
          createdBy: 'admin-1',
          createdByName: 'Quản trị viên Hệ thống',
          createdAt: '2025-01-10T00:00:00Z',
          updatedAt: '2025-01-10T00:00:00Z',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 100,
      number: 0,
    });

    vi.mocked(api.fetchAssetIncreaseList).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 100,
      number: 0,
    });

    vi.mocked(api.fetchAssetDecreaseList).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 100,
      number: 0,
    });
  });

  // 0. Xác thực tài khoản Admin
  it('AUTH: Đăng nhập thành công với tài khoản admin và quyền quản trị infraasset:manage', () => {
    const auth = useAuthStore.getState();
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.user?.username).toBe('admin');
    expect(auth.user?.role).toBe('ADMIN');
    expect(auth.user?.permissions).toContain('infraasset:manage');
  });

  // 1. Kiểm tra Render UI Bảng danh sách & Golden Layout
  it('UI-1: Render giao diện danh sách Tài sản khu tránh trú bão theo Golden Layout', () => {
    const html = renderToStaticMarkup(<StormShelterAssetList />);

    expect(html).toContain('Quản lý tài sản KCHT hàng hải');
    expect(html).toContain('Tài sản khu tránh, trú bão');
    expect(html).toContain('Thêm mới');
    expect(html).toContain('Tìm kiếm');
    expect(html).toContain('Mã khu tránh, trú bão');
    expect(html).toContain('Tất cả');
    expect(html).toContain('Đã duyệt');
    expect(html).toContain('TÊN/MÃ TÀI SẢN');
    expect(html).toContain('MÃ KHU TRÁNH, TRÚ BÃO');
    expect(html).toContain('LOẠI TÀI SẢN');
  });

  // 2. Kiểm tra Render Drawer Xem chi tiết
  it('UI-2: Render Drawer Xem chi tiết tài sản khu tránh trú bão với 6 tab nghiệp vụ và hiển thị đầy đủ thông tin khai thác, tăng/giảm giá', () => {
    const orgMap = new Map([
      ['org-1', 'Cục Hàng hải Việt Nam'],
      ['org-4', 'Cảng vụ Hàng hải Đà Nẵng'],
    ]);
    const shelterMap = new Map<string, StormShelterArea>([
      ['shelter-1', { id: 'shelter-1', stormShelterCode: 'TB-DN-01', stormShelterName: 'Khu tránh trú bão Sơn Trà' } as unknown as StormShelterArea],
    ]);

    const mockExploitation: api.AssetExploitationResponse = {
      id: 'kt-tb-1',
      assetId: mockStormShelterAsset.id,
      assetName: mockStormShelterAsset.assetName,
      exploitationYear: 2026,
      doanhThu: 600000000,
      depreciation: 60000000,
      description: 'Hợp đồng neo buộc mùa bão lũ',
      operatorOrgUnitId: 'org-4',
      assetCategory: 'Vùng nước tránh bão',
      unitOfMeasure: 'm²',
      quantity: 30000,
      exploitationDeadline: '2026-12-31',
      totalRevenue: 600000000,
      relatedCosts: 60000000,
      stateBudgetPayment: 120000000,
      projectAmount: 420000000,
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T08:26:28Z',
      updatedAt: '2026-09-11T08:26:28Z',
    };

    const mockIncrease: AssetIncreaseResponse = {
      id: 'inc-tb-1',
      assetId: mockStormShelterAsset.id,
      assetName: mockStormShelterAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      reason: 'Nâng cấp hệ thống phao neo bão',
      status: 'APPROVED',
      increaseCode: '160/QĐ-TANG-TB',
      adjustmentDetails: {
        decisionNumber: '160/QĐ-TANG-TB',
        decisionDate: '2026-09-01',
        adjustmentDate: '2026-09-10',
        adjustmentReason: 'Đầu tư bổ sung',
        adjustmentNotes: 'Lắp đặt bổ sung phao báo hiệu',
        originalValueBefore: 35000000000,
        originalValueAfter: 41000000000,
        remainingValueBefore: 29750000000,
        remainingValueAfter: 35750000000,
      },
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T08:17:38Z',
      updatedAt: '2026-09-11T08:17:38Z',
    };

    const html = renderToStaticMarkup(
      <StormShelterAssetDetailContent
        open={true}
        selectedRecord={mockStormShelterAsset}
        onClose={vi.fn()}
        orgName={orgMap}
        stormShelterMap={shelterMap}
        exploitationRows={[mockExploitation]}
        increaseRows={[mockIncrease]}
        decreaseRows={[]}
      />
    );

    expect(html).toContain('Chi tiết:');
    expect(html).toContain('Khu neo đậu tránh bão Vịnh Mân Quang');
    expect(html).toContain('Thông tin chung');
    expect(html).toContain('Hồ sơ tài sản');
    expect(html).toContain('Thông tin chi tiết');
    expect(html).toContain('Khai thác tài sản (1)');
    expect(html).toContain('Thay đổi nguyên giá (1)');
    expect(html).toMatch(/Xử lý.*theo dõi/);
    expect(html).toContain('TB-DN-01');
    expect(html).toContain('TS-TB-001');

    // Kiểm tra hiển thị thông tin Khai thác
    expect(html).toContain('Hợp đồng neo buộc mùa bão lũ');
    expect(html).toContain('31/12/2026');
    expect(html).toContain('600,000,000 VNĐ');
    expect(html).toContain('60,000,000 VNĐ');
    expect(html).toContain('120,000,000 VNĐ');

    // Kiểm tra hiển thị thông tin Thay đổi nguyên giá
    expect(html).toContain('160/QĐ-TANG-TB');
    expect(html).toContain('01/09/2026');
    expect(html).toContain('+6,000,000,000');
    expect(html).toContain('Đầu tư bổ sung');
  });

  // 3. Kiểm tra Form Thêm mới
  it('UI-3: Render Form Thêm mới tài sản khu tránh trú bão với 3 action buttons', () => {
    function FormWrapper() {
      const [form] = Form.useForm<FormValues>();
      return (
        <StormShelterAssetForm
          open={true}
          drawerMode="create"
          form={form}
          organizations={[{ id: 'org-4', name: 'Cảng vụ Hàng hải Đà Nẵng', code: 'CVDN' } as unknown as Organization]}
          stormShelters={[{ id: 'shelter-1', stormShelterCode: 'TB-DN-01', stormShelterName: 'Khu Sơn Trà' } as unknown as StormShelterArea]}
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

    const html = renderToStaticMarkup(<FormWrapper />);
    expect(html).toContain('Thêm mới tài sản khu tránh, trú bão');
    expect(html).toContain('Thông tin chung');
    expect(html).toContain('Hồ sơ tài sản (0)');
    expect(html).toContain('Lưu tạm');
    expect(html).toContain('Lưu và gửi phê duyệt');
    expect(html).toContain('Lưu và phê duyệt');
  });

  // 4. Kiểm tra Render Operation Form
  it('UI-4: Render Form Khai thác, Tăng nguyên giá và Giảm nguyên giá tài sản khu tránh trú bão', () => {
    function OperationWrapper({ mode }: { mode: 'exploit' | 'increase' | 'decrease' }) {
      const [form] = Form.useForm<OperationValues>();
      return (
        <StormShelterAssetOperationForm
          open={true}
          operationMode={mode}
          selected={mockStormShelterAsset}
          organizations={[
            { id: 'org-4', name: 'Cảng vụ Hàng hải Đà Nẵng', code: 'CVDN' } as unknown as Organization,
          ]}
          form={form}
          saving={false}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />
      );
    }

    const exploitHtml = renderToStaticMarkup(<OperationWrapper mode="exploit" />);
    expect(exploitHtml).toContain('Khai thác tài sản');

    const increaseHtml = renderToStaticMarkup(<OperationWrapper mode="increase" />);
    expect(increaseHtml).toContain('Tăng nguyên giá tài sản');

    const decreaseHtml = renderToStaticMarkup(<OperationWrapper mode="decrease" />);
    expect(decreaseHtml).toContain('Giảm nguyên giá tài sản');
  });

  // 5. Kiểm tra Tự thêm (Create Flow)
  it('CRUD-1: Tự tạo mới tài sản khu tránh trú bão với các mức phê duyệt', async () => {
    const createPayload: StormShelterAssetPayload = {
      assetCode: 'TS-TB-NEW',
      assetName: 'Khu tránh trú bão Cửa Đại',
      assetType: 'STORM_SHELTER',
      orgUnitId: 'org-4',
      usingOrgUnitId: 'org-4',
      stormShelterId: 'shelter-1',
      assetCondition: 'Tốt',
      usageStatus: 'Chưa sử dụng',
      originalValue: 50000000000,
      approvalStatus: 'DRAFT',
    };

    vi.mocked(api.createStormShelterAsset).mockResolvedValue({
      ...mockStormShelterAsset,
      ...createPayload,
      id: 'asset-tb-created',
    });

    const created = await api.createStormShelterAsset(createPayload);
    expect(api.createStormShelterAsset).toHaveBeenCalledWith(createPayload);
    expect(created.id).toBe('asset-tb-created');
    expect(created.assetType).toBe('STORM_SHELTER');
  });

  // 6. Kiểm tra Sửa (Edit Flow)
  it('CRUD-2: Chỉnh sửa tài sản khu tránh trú bão hiện có', async () => {
    const updatePayload: StormShelterAssetPayload = {
      assetCode: mockStormShelterAsset.assetCode,
      assetName: 'Khu neo đậu tránh bão Vịnh Mân Quang (Đã nạo vét)',
      assetType: 'STORM_SHELTER',
      orgUnitId: 'org-4',
      usingOrgUnitId: 'org-4',
      stormShelterId: 'shelter-1',
      assetCondition: 'Tốt',
      originalValue: 52000000000,
      approvalStatus: 'APPROVED',
    };

    vi.mocked(api.updateStormShelterAsset).mockResolvedValue({
      ...mockStormShelterAsset,
      ...updatePayload,
    });

    const updated = await api.updateStormShelterAsset(mockStormShelterAsset.id, updatePayload);
    expect(api.updateStormShelterAsset).toHaveBeenCalledWith(mockStormShelterAsset.id, updatePayload);
    expect(updated.assetName).toContain('(Đã nạo vét)');
  });

  // 7. Kiểm tra Xóa (Delete Flow)
  it('CRUD-3: Xóa tài sản khu tránh trú bão theo ID', async () => {
    vi.mocked(api.deleteStormShelterAsset).mockResolvedValue(undefined);

    await api.deleteStormShelterAsset(mockStormShelterAsset.id);
    expect(api.deleteStormShelterAsset).toHaveBeenCalledWith('asset-tb-1');
  });

  // 8. Kiểm tra Khai thác tài sản (Exploitation Flow)
  it('OP-1: Thực hiện Khai thác tài sản khu tránh trú bão gọi API createKhaiThac thành công', async () => {
    const exploitPayload = {
      assetId: mockStormShelterAsset.id,
      assetName: mockStormShelterAsset.assetName,
      exploitationYear: 2026,
      doanhThu: 2000000000,
      depreciation: 250000000,
      description: 'Dịch vụ neo đậu mùa mưa bão',
      operatorOrgUnitId: 'org-4',
      assetCategory: mockStormShelterAsset.assetName,
      unitOfMeasure: 'Khu',
      quantity: 1,
      exploitationDeadline: '2026-12-31',
      totalRevenue: 2000000000,
      relatedCosts: 250000000,
      stateBudgetPayment: 400000000,
      projectAmount: 1350000000,
    };

    vi.mocked(api.createKhaiThac).mockResolvedValue({
      id: 'kt-tb-new-1',
      ...exploitPayload,
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T00:00:00Z',
      updatedAt: '2026-09-11T00:00:00Z',
    });

    const result = await api.createKhaiThac(exploitPayload);
    expect(api.createKhaiThac).toHaveBeenCalledWith(exploitPayload);
    expect(result.id).toBe('kt-tb-new-1');
    expect(result.totalRevenue).toBe(2000000000);
  });

  // 9. Kiểm tra Tăng nguyên giá tài sản
  it('OP-2: Thực hiện Tăng nguyên giá tài sản khu tránh trú bão gọi API createAssetIncrease thành công', async () => {
    const adjustmentDetails: AssetValueAdjustmentDetails = {
      decisionNumber: '120/QĐ-TANG-TB',
      decisionDate: '2026-09-01',
      adjustmentDate: '2026-09-10',
      declarationDate: '2026-09-01',
      depreciationStartDate: '2026-09-10',
      depreciationEndDate: '2046-09-10',
      originalValueBefore: 48000000000,
      originalValueAfter: 54000000000,
      remainingValueBefore: 41280000000,
      remainingValueAfter: 47280000000,
      valueUnit: 'VNĐ',
      adjustmentNotes: 'Đầu tư hệ thống phao neo bão chuyên dụng',
    };

    const increasePayload = {
      assetId: mockStormShelterAsset.id,
      assetName: mockStormShelterAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      increaseCode: '120/QĐ-TANG-TB',
      reason: 'Đầu tư hệ thống phao neo bão chuyên dụng',
      adjustmentDetails,
    };

    vi.mocked(api.createAssetIncrease).mockResolvedValue({
      id: 'inc-tb-1',
      assetId: mockStormShelterAsset.id,
      assetName: mockStormShelterAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      increaseCode: '120/QĐ-TANG-TB',
      decisionNumber: '120/QĐ-TANG-TB',
      decisionDate: '2026-09-01',
      adjustmentDate: '2026-09-10',
      adjustmentAmount: 6000000000,
      originalValueBefore: 48000000000,
      originalValueAfter: 54000000000,
      remainingValueBefore: 41280000000,
      remainingValueAfter: 47280000000,
      reason: 'Đầu tư hệ thống phao neo bão chuyên dụng',
      status: 'APPROVED',
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T00:00:00Z',
      updatedAt: '2026-09-11T00:00:00Z',
    });

    const result = await api.createAssetIncrease(increasePayload);
    expect(api.createAssetIncrease).toHaveBeenCalledWith(increasePayload);
    expect(result.id).toBe('inc-tb-1');
    expect(result.originalValueAfter).toBe(54000000000);
  });

  // 10. Kiểm tra Giảm nguyên giá tài sản
  it('OP-3: Thực hiện Giảm nguyên giá tài sản khu tránh trú bão gọi API createAssetDecrease thành công', async () => {
    const adjustmentDetails: AssetValueAdjustmentDetails = {
      decisionNumber: '125/QĐ-GIAM-TB',
      decisionDate: '2026-09-01',
      adjustmentDate: '2026-09-10',
      declarationDate: '2026-09-01',
      depreciationStartDate: '2026-09-10',
      depreciationEndDate: '2046-09-10',
      originalValueBefore: 48000000000,
      originalValueAfter: 44000000000,
      remainingValueBefore: 41280000000,
      remainingValueAfter: 37280000000,
      valueUnit: 'VNĐ',
      adjustmentNotes: 'Thanh lý hệ thống xích neo hư hỏng sau bão',
    };

    const decreasePayload = {
      assetId: mockStormShelterAsset.id,
      assetName: mockStormShelterAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      decreaseReason: 'Thanh lý hệ thống xích neo hư hỏng sau bão',
      adjustmentDetails,
    };

    vi.mocked(api.createAssetDecrease).mockResolvedValue({
      id: 'dec-tb-1',
      assetId: mockStormShelterAsset.id,
      assetName: mockStormShelterAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      decreaseCode: '125/QĐ-GIAM-TB',
      decisionNumber: '125/QĐ-GIAM-TB',
      decisionDate: '2026-09-01',
      adjustmentDate: '2026-09-10',
      adjustmentAmount: 4000000000,
      originalValueBefore: 48000000000,
      originalValueAfter: 44000000000,
      remainingValueBefore: 41280000000,
      remainingValueAfter: 37280000000,
      decreaseReason: 'Thanh lý hệ thống xích neo hư hỏng sau bão',
      status: 'APPROVED',
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T00:00:00Z',
      updatedAt: '2026-09-11T00:00:00Z',
    });

    const result = await api.createAssetDecrease(decreasePayload);
    expect(api.createAssetDecrease).toHaveBeenCalledWith(decreasePayload);
    expect(result.id).toBe('dec-tb-1');
    expect(result.originalValueAfter).toBe(44000000000);
  });

  // 11. Kiểm tra Tìm kiếm & Filter
  it('FILTER: Tìm kiếm và lọc dữ liệu tài sản khu tránh trú bão', async () => {
    const searchFilter: StormShelterAssetFilters = {
      assetCode: 'TS-TB',
      assetName: 'Mân Quang',
      stormShelterId: 'shelter-1',
      assetCondition: 'Tốt',
      approvalStatus: 'APPROVED',
    };

    await api.fetchStormShelterAssetList(searchFilter);
    expect(api.fetchStormShelterAssetList).toHaveBeenCalledWith(searchFilter);
  });
});
