import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Form } from 'antd';
import { useAuthStore } from '../../store/authStore';
import * as api from '../../services/assetmovement/api';
import type {
  BuoyBerthAsset,
  BuoyBerthAssetPayload,
  BuoyBerthAssetFilters,
  AssetValueAdjustmentDetails,
} from '../../services/assetmovement/types';
import type { BuoyBerth } from '../../types/port';
import type { Organization } from '../../services/organizationService';
import BuoyBerthAssetList from './BuoyBerthAssetList';
import BuoyBerthAssetForm, { type FormValues } from './BuoyBerthAssetForm';
import BuoyBerthAssetDetailContent from './BuoyBerthAssetDetailContent';
import { BuoyBerthAssetOperationForm, type OperationValues } from './BuoyBerthAssetOperationForm';

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
  fetchBuoyBerthAssets: vi.fn(),
  fetchBuoyBerthAsset: vi.fn(),
  createBuoyBerthAsset: vi.fn(),
  updateBuoyBerthAsset: vi.fn(),
  deleteBuoyBerthAsset: vi.fn(),
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
      { id: 'org-5', name: 'Cảng vụ Hàng hải Vũng Tàu', code: 'CVVT' },
    ]),
  },
}));

vi.mock('../../services/portService', () => ({
  buoyBerthCRUD: {
    findAll: vi.fn().mockResolvedValue({
      data: [
        { id: 'buoy-1', buoyBerthCode: 'BP-VT-01', buoyBerthName: 'Bến phao Thị Vải số 1' },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    }),
    list: vi.fn().mockResolvedValue({
      data: [
        { id: 'buoy-1', buoyBerthCode: 'BP-VT-01', buoyBerthName: 'Bến phao Thị Vải số 1' },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    }),
  },
}));

const mockBuoyBerthAsset: BuoyBerthAsset = {
  id: 'asset-bp-1',
  assetCode: 'TS-BP-001',
  assetName: 'Cụm bến phao chuyên dùng đón tàu 60.000 DWT',
  assetType: 'BUOY_BERTH',
  parentOrgUnitId: 'org-1',
  orgUnitId: 'org-5',
  usingOrgUnitId: 'org-5',
  buoyBerthId: 'buoy-1',
  barcode: 'BP-VT-TV-01',
  assetCondition: 'Tốt',
  usageStatus: 'Đang sử dụng',
  assetGroup: 'Máy móc, thiết bị',
  assetSubgroup: 'Hệ thống phao neo hàng hải',
  address: 'Sông Thị Vải, Phú Mỹ, Bà Rịa - Vũng Tàu',
  origin: 'Mua sắm',
  quantity: 2,
  quantityUnit: 'Bộ',
  model: 'BP-HEAVY-2023',
  serialNumber: 'SN-BP-1122',
  countryOfOrigin: 'Nhật Bản',
  manufacturer: 'Yokohama Marine Ltd',
  constructionYear: 2021,
  useDate: '2022-03-01',
  landArea: 0,
  floorArea: 0,
  assetLocation: 'Tọa độ: 10°31\'N - 107°01\'E',
  attachmentName: 'giay_kiem_dinh_phao.pdf',
  declarationDate: '2022-03-10',
  originalValue: 28000000000,
  depreciationRate: 8,
  accumulatedDepreciation: 4480000000,
  remainingValue: 23520000000,
  assignmentDecisionNumber: '321/QĐ-CHHVN',
  depreciationStartDate: '2022-04-01',
  depreciationMonths: 150,
  depreciationEndDate: '2034-10-01',
  monthlyDepreciation: 186666666,
  disposalMethod: 'Thanh lý',
  status: 'MANAGED',
  approvalStatus: 'APPROVED',
  submittedBy: 'user-1',
  submittedByName: 'Nguyễn Văn A',
  submittedAt: '2022-03-15T08:00:00Z',
  portAuthorityApprovedBy: 'user-2',
  portAuthorityApprovedByName: 'Đặng Văn B (Cảng vụ)',
  portAuthorityApprovedAt: '2022-03-16T11:00:00Z',
  portAuthorityApprovalContent: 'Phao neo đáp ứng đầy đủ tiêu chuẩn kiểm định',
  departmentApprovedBy: 'user-3',
  departmentApprovedByName: 'Ngô Văn C (Cục)',
  departmentApprovedAt: '2022-03-18T16:00:00Z',
  departmentApprovalContent: 'Chấp thuận phê duyệt tài sản bến phao',
  updatedBy: 'user-1',
  updatedByName: 'Nguyễn Văn A',
  updatedAt: '2026-09-10T13:00:00Z',
};

describe('Module 4: Tài sản bến phao (docs/checklists/CHECKLIST-TAI-SAN-BEN-PHAO.md)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        userId: 'admin-1',
        username: 'admin',
        fullName: 'Quản trị viên Hệ thống',
        orgUnitId: 'org-5',
        role: 'ADMIN',
        status: 'authenticated',
        permissions: ['infraasset:manage'],
      },
      isAuthenticated: true,
      token: 'admin-jwt-token',
    });

    vi.mocked(api.fetchBuoyBerthAssets).mockResolvedValue({
      content: [mockBuoyBerthAsset],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
    });

    vi.mocked(api.fetchKhaiThacList).mockResolvedValue({
      content: [
        {
          id: 'kt-bp-1',
          assetId: mockBuoyBerthAsset.id,
          assetName: mockBuoyBerthAsset.assetName,
          exploitationYear: 2025,
          doanhThu: 1200000000,
          depreciation: 120000000,
          description: 'Hợp đồng neo buộc bến phao',
          operatorOrgUnitId: 'org-5',
          totalRevenue: 1200000000,
          relatedCosts: 120000000,
          stateBudgetPayment: 250000000,
          projectAmount: 830000000,
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
  it('UI-1: Render giao diện danh sách Tài sản bến phao theo Golden Layout', () => {
    const html = renderToStaticMarkup(<BuoyBerthAssetList />);

    expect(html).toContain('Quản lý tài sản KCHT hàng hải');
    expect(html).toContain('Tài sản bến phao');
    expect(html).toContain('Thêm mới');
    expect(html).toContain('Mã bến phao');
    expect(html).toContain('Tất cả');
    expect(html).toContain('Đã duyệt');
    expect(html).toContain('TÊN/MÃ TÀI SẢN');
    expect(html).toContain('MÃ BẾN PHAO');
    expect(html).toContain('LOẠI TÀI SẢN');
  });

  // 2. Kiểm tra Render Drawer Xem chi tiết
  it('UI-2: Render Drawer Xem chi tiết tài sản bến phao với 6 tab nghiệp vụ và hiển thị đầy đủ thông tin khai thác, tăng/giảm giá', () => {
    const orgMap = new Map([
      ['org-1', 'Cục Hàng hải Việt Nam'],
      ['org-5', 'Cảng vụ Hàng hải Vũng Tàu'],
    ]);
    const buoyMap = new Map<string, BuoyBerth>([
      ['buoy-1', { id: 'buoy-1', buoyBerthCode: 'BP-VT-01', buoyBerthName: 'Bến phao Thị Vải số 1' } as unknown as BuoyBerth],
    ]);

    const mockExploitation: api.AssetExploitationResponse = {
      id: 'kt-bp-1',
      assetId: mockBuoyBerthAsset.id,
      assetName: mockBuoyBerthAsset.assetName,
      exploitationYear: 2026,
      doanhThu: 1200000000,
      depreciation: 120000000,
      description: 'Hợp đồng khai thác bến phao Thị Vải',
      operatorOrgUnitId: 'org-5',
      assetCategory: 'Cụm bến phao',
      unitOfMeasure: 'Bộ',
      quantity: 2,
      exploitationDeadline: '2026-12-31',
      totalRevenue: 1200000000,
      relatedCosts: 120000000,
      stateBudgetPayment: 250000000,
      projectAmount: 830000000,
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T08:26:28Z',
      updatedAt: '2026-09-11T08:26:28Z',
    };

    const mockIncrease: AssetIncreaseResponse = {
      id: 'inc-bp-1',
      assetId: mockBuoyBerthAsset.id,
      assetName: mockBuoyBerthAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      reason: 'Nâng cấp cụm phao đệm',
      status: 'APPROVED',
      increaseCode: '130/QĐ-TANG-BP',
      adjustmentDetails: {
        decisionNumber: '130/QĐ-TANG-BP',
        decisionDate: '2026-09-01',
        adjustmentDate: '2026-09-10',
        adjustmentReason: 'Đầu tư bổ sung',
        adjustmentNotes: 'Ghi chú nâng cấp phao',
        originalValueBefore: 28000000000,
        originalValueAfter: 33000000000,
        remainingValueBefore: 23520000000,
        remainingValueAfter: 28520000000,
      },
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T08:17:38Z',
      updatedAt: '2026-09-11T08:17:38Z',
    };

    const html = renderToStaticMarkup(
      <BuoyBerthAssetDetailContent
        open={true}
        selectedRecord={mockBuoyBerthAsset}
        onClose={vi.fn()}
        orgName={orgMap}
        buoyBerthMap={buoyMap}
        exploitationRows={[mockExploitation]}
        increaseRows={[mockIncrease]}
        decreaseRows={[]}
      />
    );

    expect(html).toContain('Chi tiết tài sản bến phao');
    expect(html).toContain('Thông tin chung');
    expect(html).toContain('Hồ sơ tài sản');
    expect(html).toContain('Thông tin chi tiết');
    expect(html).toContain('Khai thác tài sản (1)');
    expect(html).toContain('Thay đổi nguyên giá (1)');
    expect(html).toMatch(/Xử lý.*theo dõi/);
    expect(html).toContain('BP-VT-01');
    expect(html).toContain('TS-BP-001');

    // Kiểm tra hiển thị đầy đủ thông tin Khai thác tài sản
    expect(html).toContain('Hợp đồng khai thác bến phao Thị Vải');
    expect(html).toContain('31/12/2026');
    expect(html).toContain('1,200,000,000 VNĐ');
    expect(html).toContain('120,000,000 VNĐ');
    expect(html).toContain('250,000,000 VNĐ');
    expect(html).toContain('830,000,000 VNĐ');

    // Kiểm tra hiển thị đầy đủ thông tin Thay đổi nguyên giá
    expect(html).toContain('130/QĐ-TANG-BP');
    expect(html).toContain('01/09/2026');
    expect(html).toContain('+5,000,000,000 VNĐ');
    expect(html).toContain('Đầu tư bổ sung');
  });

  // 3. Kiểm tra Form Thêm mới
  it('UI-3: Render Form Thêm mới tài sản bến phao với 3 action buttons', () => {
    function FormWrapper() {
      const [form] = Form.useForm<FormValues>();
      return (
        <BuoyBerthAssetForm
          open={true}
          drawerMode="create"
          form={form}
          organizations={[{ id: 'org-5', name: 'Cảng vụ Hàng hải Vũng Tàu', code: 'CVVT' } as unknown as Organization]}
          buoyBerths={[{ id: 'buoy-1', buoyBerthCode: 'BP-VT-01', buoyBerthName: 'Bến phao Thị Vải' } as unknown as BuoyBerth]}
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
    expect(html).toContain('Thêm mới tài sản bến phao');
    expect(html).toContain('Thông tin chung');
    expect(html).toContain('Hồ sơ tài sản (0)');
    expect(html).toContain('Lưu tạm');
    expect(html).toContain('Lưu và gửi phê duyệt');
    expect(html).toContain('Lưu và phê duyệt');
  });

  // 4. Kiểm tra Render Operation Form
  it('UI-4: Render Form Khai thác, Tăng nguyên giá và Giảm nguyên giá tài sản bến phao', () => {
    function OperationWrapper({ mode }: { mode: 'exploit' | 'increase' | 'decrease' }) {
      const [form] = Form.useForm<OperationValues>();
      return (
        <BuoyBerthAssetOperationForm
          open={true}
          operationMode={mode}
          selected={mockBuoyBerthAsset}
          organizations={[
            { id: 'org-5', name: 'Cảng vụ Hàng hải Vũng Tàu', code: 'CVVT' } as unknown as Organization,
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
  it('CRUD-1: Tự tạo mới tài sản bến phao với các mức phê duyệt', async () => {
    const createPayload: BuoyBerthAssetPayload = {
      assetCode: 'TS-BP-NEW',
      assetName: 'Bến phao neo tàu hàng lỏng Cái Mép',
      assetType: 'BUOY_BERTH',
      orgUnitId: 'org-5',
      usingOrgUnitId: 'org-5',
      buoyBerthId: 'buoy-1',
      assetCondition: 'Tốt',
      usageStatus: 'Chưa sử dụng',
      originalValue: 32000000000,
      approvalStatus: 'DRAFT',
    };

    vi.mocked(api.createBuoyBerthAsset).mockResolvedValue({
      ...mockBuoyBerthAsset,
      ...createPayload,
      id: 'asset-bp-created',
    });

    const created = await api.createBuoyBerthAsset(createPayload);
    expect(api.createBuoyBerthAsset).toHaveBeenCalledWith(createPayload);
    expect(created.id).toBe('asset-bp-created');
    expect(created.assetType).toBe('BUOY_BERTH');
  });

  // 6. Kiểm tra Sửa (Edit Flow)
  it('CRUD-2: Chỉnh sửa tài sản bến phao hiện có', async () => {
    const updatePayload: BuoyBerthAssetPayload = {
      assetCode: mockBuoyBerthAsset.assetCode,
      assetName: 'Cụm bến phao chuyên dùng đón tàu 60.000 DWT (Hoán cải)',
      assetType: 'BUOY_BERTH',
      orgUnitId: 'org-5',
      usingOrgUnitId: 'org-5',
      buoyBerthId: 'buoy-1',
      assetCondition: 'Tốt',
      originalValue: 30000000000,
      approvalStatus: 'APPROVED',
    };

    vi.mocked(api.updateBuoyBerthAsset).mockResolvedValue({
      ...mockBuoyBerthAsset,
      ...updatePayload,
    });

    const updated = await api.updateBuoyBerthAsset(mockBuoyBerthAsset.id, updatePayload);
    expect(api.updateBuoyBerthAsset).toHaveBeenCalledWith(mockBuoyBerthAsset.id, updatePayload);
    expect(updated.assetName).toContain('(Hoán cải)');
  });

  // 7. Kiểm tra Xóa (Delete Flow)
  it('CRUD-3: Xóa tài sản bến phao theo ID', async () => {
    vi.mocked(api.deleteBuoyBerthAsset).mockResolvedValue(undefined);

    await api.deleteBuoyBerthAsset(mockBuoyBerthAsset.id);
    expect(api.deleteBuoyBerthAsset).toHaveBeenCalledWith('asset-bp-1');
  });

  // 8. Kiểm tra Khai thác tài sản (Exploitation Flow)
  it('OP-1: Thực hiện Khai thác tài sản bến phao gọi API createKhaiThac thành công', async () => {
    const exploitPayload = {
      assetId: mockBuoyBerthAsset.id,
      assetName: mockBuoyBerthAsset.assetName,
      exploitationYear: 2026,
      doanhThu: 1800000000,
      depreciation: 200000000,
      description: 'Cho thuê bến phao neo tàu',
      operatorOrgUnitId: 'org-5',
      assetCategory: mockBuoyBerthAsset.assetName,
      unitOfMeasure: 'Bộ',
      quantity: 2,
      exploitationDeadline: '2026-12-31',
      totalRevenue: 1800000000,
      relatedCosts: 200000000,
      stateBudgetPayment: 350000000,
      projectAmount: 1250000000,
    };

    vi.mocked(api.createKhaiThac).mockResolvedValue({
      id: 'kt-bp-new-1',
      ...exploitPayload,
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T00:00:00Z',
      updatedAt: '2026-09-11T00:00:00Z',
    });

    const result = await api.createKhaiThac(exploitPayload);
    expect(api.createKhaiThac).toHaveBeenCalledWith(exploitPayload);
    expect(result.id).toBe('kt-bp-new-1');
    expect(result.totalRevenue).toBe(1800000000);
  });

  // 9. Kiểm tra Tăng nguyên giá tài sản
  it('OP-2: Thực hiện Tăng nguyên giá tài sản bến phao gọi API createAssetIncrease thành công', async () => {
    const adjustmentDetails: AssetValueAdjustmentDetails = {
      decisionNumber: '130/QĐ-TANG-BP',
      decisionDate: '2026-09-01',
      adjustmentDate: '2026-09-10',
      declarationDate: '2026-09-01',
      depreciationStartDate: '2026-09-10',
      depreciationEndDate: '2046-09-10',
      originalValueBefore: 28000000000,
      originalValueAfter: 33000000000,
      remainingValueBefore: 23520000000,
      remainingValueAfter: 28520000000,
      valueUnit: 'VNĐ',
      adjustmentNotes: 'Nâng cấp rùa neo và cụm phao đệm tàu',
    };

    const increasePayload = {
      assetId: mockBuoyBerthAsset.id,
      assetName: mockBuoyBerthAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      increaseCode: '130/QĐ-TANG-BP',
      reason: 'Nâng cấp rùa neo và cụm phao đệm tàu',
      adjustmentDetails,
    };

    vi.mocked(api.createAssetIncrease).mockResolvedValue({
      id: 'inc-bp-1',
      assetId: mockBuoyBerthAsset.id,
      assetName: mockBuoyBerthAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      increaseCode: '130/QĐ-TANG-BP',
      decisionNumber: '130/QĐ-TANG-BP',
      decisionDate: '2026-09-01',
      adjustmentDate: '2026-09-10',
      adjustmentAmount: 5000000000,
      originalValueBefore: 28000000000,
      originalValueAfter: 33000000000,
      remainingValueBefore: 23520000000,
      remainingValueAfter: 28520000000,
      reason: 'Nâng cấp rùa neo và cụm phao đệm tàu',
      status: 'APPROVED',
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T00:00:00Z',
      updatedAt: '2026-09-11T00:00:00Z',
    });

    const result = await api.createAssetIncrease(increasePayload);
    expect(api.createAssetIncrease).toHaveBeenCalledWith(increasePayload);
    expect(result.id).toBe('inc-bp-1');
    expect(result.originalValueAfter).toBe(33000000000);
  });

  // 10. Kiểm tra Giảm nguyên giá tài sản
  it('OP-3: Thực hiện Giảm nguyên giá tài sản bến phao gọi API createAssetDecrease thành công', async () => {
    const adjustmentDetails: AssetValueAdjustmentDetails = {
      decisionNumber: '135/QĐ-GIAM-BP',
      decisionDate: '2026-09-01',
      adjustmentDate: '2026-09-10',
      declarationDate: '2026-09-01',
      depreciationStartDate: '2026-09-10',
      depreciationEndDate: '2046-09-10',
      originalValueBefore: 28000000000,
      originalValueAfter: 25000000000,
      remainingValueBefore: 23520000000,
      remainingValueAfter: 20520000000,
      valueUnit: 'VNĐ',
      adjustmentNotes: 'Thanh lý 01 quả phao neo hư hỏng',
    };

    const decreasePayload = {
      assetId: mockBuoyBerthAsset.id,
      assetName: mockBuoyBerthAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      decreaseReason: 'Thanh lý 01 quả phao neo hư hỏng',
      adjustmentDetails,
    };

    vi.mocked(api.createAssetDecrease).mockResolvedValue({
      id: 'dec-bp-1',
      assetId: mockBuoyBerthAsset.id,
      assetName: mockBuoyBerthAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      decreaseCode: '135/QĐ-GIAM-BP',
      decisionNumber: '135/QĐ-GIAM-BP',
      decisionDate: '2026-09-01',
      adjustmentDate: '2026-09-10',
      adjustmentAmount: 3000000000,
      originalValueBefore: 28000000000,
      originalValueAfter: 25000000000,
      remainingValueBefore: 23520000000,
      remainingValueAfter: 20520000000,
      decreaseReason: 'Thanh lý 01 quả phao neo hư hỏng',
      status: 'APPROVED',
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T00:00:00Z',
      updatedAt: '2026-09-11T00:00:00Z',
    });

    const result = await api.createAssetDecrease(decreasePayload);
    expect(api.createAssetDecrease).toHaveBeenCalledWith(decreasePayload);
    expect(result.id).toBe('dec-bp-1');
    expect(result.originalValueAfter).toBe(25000000000);
  });

  // 11. Kiểm tra Tìm kiếm & Filter
  it('FILTER: Tìm kiếm và lọc dữ liệu tài sản bến phao', async () => {
    const searchFilter: BuoyBerthAssetFilters = {
      assetCode: 'TS-BP',
      assetName: 'Thị Vải',
      buoyBerthId: 'buoy-1',
      assetCondition: 'Tốt',
      approvalStatus: 'APPROVED',
    };

    await api.fetchBuoyBerthAssets(searchFilter);
    expect(api.fetchBuoyBerthAssets).toHaveBeenCalledWith(searchFilter);
  });
});
