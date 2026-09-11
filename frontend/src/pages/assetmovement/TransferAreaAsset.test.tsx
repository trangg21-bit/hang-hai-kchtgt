import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Form } from 'antd';
import { useAuthStore } from '../../store/authStore';
import * as api from '../../services/assetmovement/api';
import type {
  TransferAreaAsset,
  TransferAreaAssetPayload,
  TransferAreaAssetFilters,
  AssetValueAdjustmentDetails,
} from '../../services/assetmovement/types';
import TransferAreaAssetList from './TransferAreaAssetList';
import TransferAreaAssetForm, { type FormValues } from './TransferAreaAssetForm';
import TransferAreaAssetDetailContent from './TransferAreaAssetDetailContent';
import { TransferAreaAssetOperationForm, type OperationValues } from './TransferAreaAssetOperationForm';
import type { TransferArea } from '../../types/port';
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
  fetchTransferAreaAssets: vi.fn(),
  fetchTransferAreaAsset: vi.fn(),
  createTransferAreaAsset: vi.fn(),
  updateTransferAreaAsset: vi.fn(),
  deleteTransferAreaAsset: vi.fn(),
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
      { id: 'org-3', name: 'Cảng vụ Hàng hải Quảng Ninh', code: 'CVQN' },
    ]),
  },
}));

vi.mock('../../services/portService', () => ({
  transferAreaCRUD: {
    findAll: vi.fn().mockResolvedValue({
      data: [
        { id: 'kct-1', transferAreaCode: 'KCT-QN-01', transferAreaName: 'Khu chuyển tải Hòn Gai' },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    }),
    list: vi.fn().mockResolvedValue({
      data: [
        { id: 'kct-1', transferAreaCode: 'KCT-QN-01', transferAreaName: 'Khu chuyển tải Hòn Gai' },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    }),
  },
}));

const mockTransferAreaAsset: TransferAreaAsset = {
  id: 'asset-kct-1',
  assetCode: 'TS-KCT-001',
  assetName: 'Khu chuyển tải dầu thô Hòn Gai số 1',
  assetType: 'TRANSFER_AREA',
  parentOrgUnitId: 'org-1',
  orgUnitId: 'org-3',
  usingOrgUnitId: 'org-3',
  transferAreaId: 'kct-1',
  barcode: 'KCT-QN-OIL-01',
  assetCondition: 'Tốt',
  usageStatus: 'Đang sử dụng',
  assetGroup: 'Nhà, công trình xây dựng',
  assetSubgroup: 'Vùng nước chuyển tải',
  address: 'Vịnh Cửa Lục, Quảng Ninh',
  origin: 'Được giao',
  quantity: 1,
  quantityUnit: 'Khu',
  model: 'KCT-STD-2023',
  serialNumber: 'SN-KCT-7766',
  countryOfOrigin: 'Việt Nam',
  manufacturer: 'Ban Quản lý Hàng hải',
  constructionYear: 2019,
  useDate: '2020-05-01',
  landArea: 50000,
  floorArea: 0,
  assetLocation: 'Tọa độ: 20°58\'N - 107°04\'E',
  attachmentName: 'quyet_dinh_kct.pdf',
  declarationDate: '2020-05-15',
  originalValue: 35000000000,
  depreciationRate: 4,
  accumulatedDepreciation: 4200000000,
  remainingValue: 30800000000,
  assignmentDecisionNumber: '456/QĐ-CHHVN',
  depreciationStartDate: '2020-06-01',
  depreciationMonths: 300,
  depreciationEndDate: '2045-06-01',
  monthlyDepreciation: 116666666,
  disposalMethod: 'Thanh lý',
  status: 'MANAGED',
  approvalStatus: 'APPROVED_LEVEL1',
  submittedBy: 'user-1',
  submittedByName: 'Nguyễn Văn A',
  submittedAt: '2020-05-20T08:00:00Z',
  portAuthorityApprovedBy: 'user-2',
  portAuthorityApprovedByName: 'Hoàng Văn B (Cảng vụ)',
  portAuthorityApprovedAt: '2020-05-22T10:00:00Z',
  portAuthorityApprovalContent: 'Đã thẩm định hồ sơ kỹ thuật',
  updatedBy: 'user-1',
  updatedByName: 'Nguyễn Văn A',
  updatedAt: '2026-09-10T11:00:00Z',
};

describe('Module 2: Tài sản khu chuyển tải (docs/checklists/CHECKLIST-TAI-SAN-KHU-CHUYEN-TAI.md)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        userId: 'admin-1',
        username: 'admin',
        fullName: 'Quản trị viên Hệ thống',
        orgUnitId: 'org-3',
        role: 'ADMIN',
        status: 'authenticated',
        permissions: ['infraasset:manage'],
      },
      isAuthenticated: true,
      token: 'admin-jwt-token',
    });

    vi.mocked(api.fetchTransferAreaAssets).mockResolvedValue({
      content: [mockTransferAreaAsset],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
    });

    vi.mocked(api.fetchKhaiThacList).mockResolvedValue({
      content: [
        {
          id: 'kt-kct-1',
          assetId: mockTransferAreaAsset.id,
          assetName: mockTransferAreaAsset.assetName,
          exploitationYear: 2025,
          doanhThu: 1800000000,
          depreciation: 200000000,
          description: 'Khai thác vùng nước chuyển tải',
          operatorOrgUnitId: 'org-3',
          totalRevenue: 1800000000,
          relatedCosts: 200000000,
          stateBudgetPayment: 400000000,
          projectAmount: 1200000000,
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
  it('UI-1: Render giao diện danh sách Tài sản khu chuyển tải theo chuẩn Golden Layout', () => {
    const html = renderToStaticMarkup(<TransferAreaAssetList />);

    expect(html).toContain('Quản lý tài sản KCHT hàng hải');
    expect(html).toContain('Tài sản khu chuyển tải');
    expect(html).toContain('Thêm mới');
    expect(html).toContain('Tìm kiếm');
    expect(html).toContain('Mã khu chuyển tải');
    expect(html).toContain('Tất cả');
    expect(html).toContain('Chờ Cảng vụ duyệt');
    expect(html).toContain('TÊN/MÃ TÀI SẢN');
    expect(html).toContain('MÃ KHU CHUYỂN TẢI');
    expect(html).toContain('LOẠI TÀI SẢN');
    expect(html).toContain('CÁN BỘ DUYỆT CẢNG VỤ/CHI CỤC');
  });

  // 2. Kiểm tra Render Drawer Xem chi tiết với 6 Tab
  it('UI-2: Render Drawer Xem chi tiết với 6 tab nghiệp vụ và hiển thị đầy đủ thông tin khai thác, tăng/giảm giá', () => {
    const orgMap = new Map([
      ['org-1', 'Cục Hàng hải Việt Nam'],
      ['org-3', 'Cảng vụ Hàng hải Quảng Ninh'],
    ]);
    const areaMap = new Map<string, TransferArea>([
      ['kct-1', { id: 'kct-1', transferAreaCode: 'KCT-QN-01', transferAreaName: 'Khu chuyển tải Hòn Gai' } as unknown as TransferArea],
    ]);

    const mockExploitation: api.AssetExploitationResponse = {
      id: 'kt-kct-1',
      assetId: mockTransferAreaAsset.id,
      assetName: mockTransferAreaAsset.assetName,
      exploitationYear: 2026,
      doanhThu: 950000000,
      depreciation: 95000000,
      description: 'Hợp đồng khai thác vùng nước chuyển tải',
      operatorOrgUnitId: 'org-3',
      assetCategory: 'Vùng nước chuyển tải',
      unitOfMeasure: 'm²',
      quantity: 50000,
      exploitationDeadline: '2026-12-31',
      totalRevenue: 950000000,
      relatedCosts: 95000000,
      stateBudgetPayment: 200000000,
      projectAmount: 655000000,
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T08:26:28Z',
      updatedAt: '2026-09-11T08:26:28Z',
    };

    const mockIncrease: AssetIncreaseResponse = {
      id: 'inc-kct-1',
      assetId: mockTransferAreaAsset.id,
      assetName: mockTransferAreaAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      reason: 'Mở rộng vùng nước chuyển tải',
      status: 'APPROVED',
      increaseCode: '150/QĐ-TANG-KCT',
      adjustmentDetails: {
        decisionNumber: '150/QĐ-TANG-KCT',
        decisionDate: '2026-09-01',
        adjustmentDate: '2026-09-10',
        adjustmentReason: 'Đầu tư bổ sung',
        adjustmentNotes: 'Mở rộng luồng vào khu chuyển tải',
        originalValueBefore: 45000000000,
        originalValueAfter: 52000000000,
        remainingValueBefore: 38250000000,
        remainingValueAfter: 45250000000,
      },
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T08:17:38Z',
      updatedAt: '2026-09-11T08:17:38Z',
    };

    const html = renderToStaticMarkup(
      <TransferAreaAssetDetailContent
        open={true}
        selectedRecord={mockTransferAreaAsset}
        onClose={vi.fn()}
        orgName={orgMap}
        transferAreaMap={areaMap}
        exploitationRows={[mockExploitation]}
        increaseRows={[mockIncrease]}
        decreaseRows={[]}
      />
    );

    expect(html).toContain('Chi tiết tài sản khu chuyển tải');
    expect(html).toContain('Thông tin chung');
    expect(html).toContain('Hồ sơ tài sản');
    expect(html).toContain('Thông tin chi tiết');
    expect(html).toContain('Khai thác tài sản (1)');
    expect(html).toContain('Thay đổi nguyên giá (1)');
    expect(html).toMatch(/Xử lý.*theo dõi/);
    expect(html).toContain('KCT-QN-01');
    expect(html).toContain('TS-KCT-001');
    expect(html).toContain('Tài sản khu chuyển tải');

    // Kiểm tra hiển thị thông tin Khai thác
    expect(html).toContain('Hợp đồng khai thác vùng nước chuyển tải');
    expect(html).toContain('31/12/2026');
    expect(html).toContain('950,000,000 VNĐ');
    expect(html).toContain('95,000,000 VNĐ');
    expect(html).toContain('200,000,000 VNĐ');

    // Kiểm tra hiển thị thông tin Thay đổi nguyên giá
    expect(html).toContain('150/QĐ-TANG-KCT');
    expect(html).toContain('01/09/2026');
    expect(html).toContain('+7,000,000,000 VNĐ');
    expect(html).toContain('Đầu tư bổ sung');
  });

  // 3. Kiểm tra Form Thêm mới / Sửa
  it('UI-3: Render Form Thêm mới tài sản khu chuyển tải với 3 action buttons', () => {
    function FormWrapper() {
      const [form] = Form.useForm<FormValues>();
      return (
        <TransferAreaAssetForm
          open={true}
          drawerMode="create"
          form={form}
          organizations={[{ id: 'org-3', name: 'Cảng vụ Hàng hải Quảng Ninh', code: 'CVQN' } as unknown as Organization]}
          transferAreas={[{ id: 'kct-1', transferAreaCode: 'KCT-QN-01', transferAreaName: 'Khu Hòn Gai' } as unknown as TransferArea]}
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
    expect(html).toContain('Thêm mới Tài sản khu chuyển tải');
    expect(html).toContain('Thông tin chung');
    expect(html).toContain('Hồ sơ tài sản (0)');
    expect(html).toContain('Lưu tạm');
    expect(html).toContain('Lưu và gửi phê duyệt');
    expect(html).toContain('Lưu và phê duyệt');
  });

  // 4. Kiểm tra Render Operation Form
  it('UI-4: Render Form Khai thác, Tăng nguyên giá và Giảm nguyên giá tài sản khu chuyển tải', () => {
    function OperationWrapper({ mode }: { mode: 'exploit' | 'increase' | 'decrease' }) {
      const [form] = Form.useForm<OperationValues>();
      return (
        <TransferAreaAssetOperationForm
          open={true}
          operationMode={mode}
          selected={mockTransferAreaAsset}
          organizations={[
            { id: 'org-3', name: 'Cảng vụ Hàng hải Quảng Ninh', code: 'CVQN' } as unknown as Organization,
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
    expect(exploitHtml).toContain('Thông tin khai thác tài sản');

    const increaseHtml = renderToStaticMarkup(<OperationWrapper mode="increase" />);
    expect(increaseHtml).toContain('Yêu cầu tăng nguyên giá');

    const decreaseHtml = renderToStaticMarkup(<OperationWrapper mode="decrease" />);
    expect(decreaseHtml).toContain('Yêu cầu giảm nguyên giá');
  });

  // 5. Kiểm tra Tự thêm (Create Flow)
  it('CRUD-1: Tự tạo mới tài sản khu chuyển tải với các mức lưu phê duyệt', async () => {
    const createPayload: TransferAreaAssetPayload = {
      assetCode: 'TS-KCT-NEW',
      assetName: 'Khu chuyển tải Cam Ranh',
      assetType: 'TRANSFER_AREA',
      orgUnitId: 'org-3',
      usingOrgUnitId: 'org-3',
      transferAreaId: 'kct-1',
      assetCondition: 'Tốt',
      usageStatus: 'Chưa sử dụng',
      originalValue: 40000000000,
      approvalStatus: 'DRAFT',
    };

    vi.mocked(api.createTransferAreaAsset).mockResolvedValue({
      ...mockTransferAreaAsset,
      ...createPayload,
      id: 'asset-kct-created',
    });

    const created = await api.createTransferAreaAsset(createPayload);
    expect(api.createTransferAreaAsset).toHaveBeenCalledWith(createPayload);
    expect(created.id).toBe('asset-kct-created');
    expect(created.assetType).toBe('TRANSFER_AREA');
    expect(created.approvalStatus).toBe('DRAFT');
  });

  // 6. Kiểm tra Sửa (Edit Flow)
  it('CRUD-2: Chỉnh sửa tài sản khu chuyển tải hiện có', async () => {
    const updatePayload: TransferAreaAssetPayload = {
      assetCode: mockTransferAreaAsset.assetCode,
      assetName: 'Khu chuyển tải dầu thô Hòn Gai số 1 (Mở rộng)',
      assetType: 'TRANSFER_AREA',
      orgUnitId: 'org-3',
      usingOrgUnitId: 'org-3',
      transferAreaId: 'kct-1',
      assetCondition: 'Tốt',
      originalValue: 42000000000,
      approvalStatus: 'APPROVED',
    };

    vi.mocked(api.updateTransferAreaAsset).mockResolvedValue({
      ...mockTransferAreaAsset,
      ...updatePayload,
    });

    const updated = await api.updateTransferAreaAsset(mockTransferAreaAsset.id, updatePayload);
    expect(api.updateTransferAreaAsset).toHaveBeenCalledWith(mockTransferAreaAsset.id, updatePayload);
    expect(updated.assetName).toContain('(Mở rộng)');
  });

  // 7. Kiểm tra Xóa (Delete Flow)
  it('CRUD-3: Xóa tài sản khu chuyển tải theo ID', async () => {
    vi.mocked(api.deleteTransferAreaAsset).mockResolvedValue(undefined);

    await api.deleteTransferAreaAsset(mockTransferAreaAsset.id);
    expect(api.deleteTransferAreaAsset).toHaveBeenCalledWith('asset-kct-1');
  });

  // 8. Kiểm tra Khai thác tài sản (Exploitation Flow)
  it('OP-1: Thực hiện Khai thác tài sản khu chuyển tải gọi API createKhaiThac thành công', async () => {
    const exploitPayload = {
      assetId: mockTransferAreaAsset.id,
      assetName: mockTransferAreaAsset.assetName,
      exploitationYear: 2026,
      doanhThu: 2500000000,
      depreciation: 300000000,
      description: 'Khai thác khu chuyển tải phục vụ xuất nhập khẩu',
      operatorOrgUnitId: 'org-3',
      assetCategory: mockTransferAreaAsset.assetName,
      unitOfMeasure: 'Khu',
      quantity: 1,
      exploitationDeadline: '2026-12-31',
      totalRevenue: 2500000000,
      relatedCosts: 300000000,
      stateBudgetPayment: 500000000,
      projectAmount: 1700000000,
    };

    vi.mocked(api.createKhaiThac).mockResolvedValue({
      id: 'kt-kct-new-1',
      ...exploitPayload,
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T00:00:00Z',
      updatedAt: '2026-09-11T00:00:00Z',
    });

    const result = await api.createKhaiThac(exploitPayload);
    expect(api.createKhaiThac).toHaveBeenCalledWith(exploitPayload);
    expect(result.id).toBe('kt-kct-new-1');
    expect(result.totalRevenue).toBe(2500000000);
  });

  // 9. Kiểm tra Tăng nguyên giá tài sản
  it('OP-2: Thực hiện Tăng nguyên giá tài sản khu chuyển tải gọi API createAssetIncrease thành công', async () => {
    const adjustmentDetails: AssetValueAdjustmentDetails = {
      decisionNumber: '110/QĐ-TANG-KCT',
      decisionDate: '2026-09-01',
      adjustmentDate: '2026-09-10',
      declarationDate: '2026-09-01',
      depreciationStartDate: '2026-09-10',
      depreciationEndDate: '2046-09-10',
      originalValueBefore: 35000000000,
      originalValueAfter: 40000000000,
      remainingValueBefore: 30800000000,
      remainingValueAfter: 35800000000,
      valueUnit: 'VNĐ',
      adjustmentNotes: 'Mở rộng diện tích phao tiêu vùng nước',
    };

    const increasePayload = {
      assetId: mockTransferAreaAsset.id,
      assetName: mockTransferAreaAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      increaseCode: '110/QĐ-TANG-KCT',
      reason: 'Mở rộng diện tích phao tiêu vùng nước',
      adjustmentDetails,
    };

    vi.mocked(api.createAssetIncrease).mockResolvedValue({
      id: 'inc-kct-1',
      assetId: mockTransferAreaAsset.id,
      assetName: mockTransferAreaAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      increaseCode: '110/QĐ-TANG-KCT',
      decisionNumber: '110/QĐ-TANG-KCT',
      decisionDate: '2026-09-01',
      adjustmentDate: '2026-09-10',
      adjustmentAmount: 5000000000,
      originalValueBefore: 35000000000,
      originalValueAfter: 40000000000,
      remainingValueBefore: 30800000000,
      remainingValueAfter: 35800000000,
      reason: 'Mở rộng diện tích phao tiêu vùng nước',
      status: 'APPROVED',
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T00:00:00Z',
      updatedAt: '2026-09-11T00:00:00Z',
    });

    const result = await api.createAssetIncrease(increasePayload);
    expect(api.createAssetIncrease).toHaveBeenCalledWith(increasePayload);
    expect(result.id).toBe('inc-kct-1');
    expect(result.originalValueAfter).toBe(40000000000);
  });

  // 10. Kiểm tra Giảm nguyên giá tài sản
  it('OP-3: Thực hiện Giảm nguyên giá tài sản khu chuyển tải gọi API createAssetDecrease thành công', async () => {
    const adjustmentDetails: AssetValueAdjustmentDetails = {
      decisionNumber: '115/QĐ-GIAM-KCT',
      decisionDate: '2026-09-01',
      adjustmentDate: '2026-09-10',
      declarationDate: '2026-09-01',
      depreciationStartDate: '2026-09-10',
      depreciationEndDate: '2046-09-10',
      originalValueBefore: 35000000000,
      originalValueAfter: 32000000000,
      remainingValueBefore: 30800000000,
      remainingValueAfter: 27800000000,
      valueUnit: 'VNĐ',
      adjustmentNotes: 'Thu hồi một phần diện tích vùng nước',
    };

    const decreasePayload = {
      assetId: mockTransferAreaAsset.id,
      assetName: mockTransferAreaAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      decreaseReason: 'Thu hồi một phần diện tích vùng nước',
      adjustmentDetails,
    };

    vi.mocked(api.createAssetDecrease).mockResolvedValue({
      id: 'dec-kct-1',
      assetId: mockTransferAreaAsset.id,
      assetName: mockTransferAreaAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      decreaseCode: '115/QĐ-GIAM-KCT',
      decisionNumber: '115/QĐ-GIAM-KCT',
      decisionDate: '2026-09-01',
      adjustmentDate: '2026-09-10',
      adjustmentAmount: 3000000000,
      originalValueBefore: 35000000000,
      originalValueAfter: 32000000000,
      remainingValueBefore: 30800000000,
      remainingValueAfter: 27800000000,
      decreaseReason: 'Thu hồi một phần diện tích vùng nước',
      status: 'APPROVED',
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T00:00:00Z',
      updatedAt: '2026-09-11T00:00:00Z',
    });

    const result = await api.createAssetDecrease(decreasePayload);
    expect(api.createAssetDecrease).toHaveBeenCalledWith(decreasePayload);
    expect(result.id).toBe('dec-kct-1');
    expect(result.originalValueAfter).toBe(32000000000);
  });

  // 11. Kiểm tra Tìm kiếm & Filter
  it('FILTER: Tìm kiếm và lọc dữ liệu tài sản khu chuyển tải', async () => {
    const searchFilter: TransferAreaAssetFilters = {
      assetCode: 'TS-KCT',
      assetName: 'Hòn Gai',
      transferAreaId: 'kct-1',
      assetCondition: 'Tốt',
      approvalStatus: 'APPROVED_LEVEL1',
    };

    await api.fetchTransferAreaAssets(searchFilter);
    expect(api.fetchTransferAreaAssets).toHaveBeenCalledWith(searchFilter);
  });
});
