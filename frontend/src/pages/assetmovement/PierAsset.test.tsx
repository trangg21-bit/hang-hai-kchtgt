import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Form } from 'antd';
import { useAuthStore } from '../../store/authStore';
import * as api from '../../services/assetmovement/api';
import type {
  PierAsset,
  PierAssetPayload,
  PierAssetFilters,
  AssetValueAdjustmentDetails,
} from '../../services/assetmovement/types';
import type { Pier } from '../../types/port';
import type { Organization } from '../../services/organizationService';
import PierAssetList from './PierAssetList';
import PierAssetForm, { type FormValues } from './PierAssetForm';
import PierAssetDetailContent from './PierAssetDetailContent';
import { PierAssetOperationForm, type OperationValues } from './PierAssetOperationForm';

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
  fetchPierAssets: vi.fn(),
  fetchPierAsset: vi.fn(),
  createPierAsset: vi.fn(),
  updatePierAsset: vi.fn(),
  deletePierAsset: vi.fn(),
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
      { id: 'org-6', name: 'Cảng vụ Hàng hải TP. Hồ Chí Minh', code: 'CVHCM' },
    ]),
  },
}));

vi.mock('../../services/portService', () => ({
  pierCRUD: {
    findAll: vi.fn().mockResolvedValue({
      data: [
        { id: 'pier-1', pierCode: 'CC-SG-01', pierName: 'Cầu cảng Cát Lái 1' },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    }),
    list: vi.fn().mockResolvedValue({
      data: [
        { id: 'pier-1', pierCode: 'CC-SG-01', pierName: 'Cầu cảng Cát Lái 1' },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    }),
  },
}));

const mockPierAsset: PierAsset = {
  id: 'asset-cc-1',
  assetCode: 'TS-CC-001',
  assetName: 'Cầu cảng Container chuyên dụng số 1',
  assetType: 'PIER',
  parentOrgUnitId: 'org-1',
  orgUnitId: 'org-6',
  usingOrgUnitId: 'org-6',
  pierId: 'pier-1',
  barcode: 'CC-SG-CL-01',
  assetCondition: 'Tốt',
  usageStatus: 'Đang sử dụng',
  assetGroup: 'Nhà, công trình xây dựng',
  assetSubgroup: 'Cầu tàu hàng tổng hợp',
  address: 'Cảng Cát Lái, Phường Cát Lái, TP. Thủ Đức, TP. Hồ Chí Minh',
  origin: 'Đầu tư xây dựng',
  quantity: 1,
  quantityUnit: 'Cầu',
  model: 'CC-HEAVY-2023',
  serialNumber: 'SN-CC-5544',
  countryOfOrigin: 'Việt Nam',
  manufacturer: 'Tổng công ty Tân Cảng Sài Gòn',
  constructionYear: 2019,
  useDate: '2020-09-01',
  landArea: 25000,
  floorArea: 18000,
  assetLocation: 'Tọa độ: 10°45\'N - 106°47\'E',
  attachmentName: 'ho_so_hoan_cong_cau_cang.pdf',
  declarationDate: '2020-09-15',
  originalValue: 65000000000,
  depreciationRate: 4.5,
  accumulatedDepreciation: 8775000000,
  remainingValue: 56225000000,
  assignmentDecisionNumber: '888/QĐ-CHHVN',
  depreciationStartDate: '2020-10-01',
  depreciationMonths: 260,
  depreciationEndDate: '2042-06-01',
  monthlyDepreciation: 250000000,
  disposalMethod: 'Thanh lý',
  status: 'MANAGED',
  approvalStatus: 'APPROVED',
  submittedBy: 'user-1',
  submittedByName: 'Nguyễn Văn A',
  submittedAt: '2020-09-20T08:00:00Z',
  portAuthorityApprovedBy: 'user-2',
  portAuthorityApprovedByName: 'Trần Văn B (Cảng vụ)',
  portAuthorityApprovedAt: '2020-09-22T10:00:00Z',
  portAuthorityApprovalContent: 'Cầu cảng đáp ứng đầy đủ năng lực tiếp nhận tàu tải trọng lớn',
  departmentApprovedBy: 'user-3',
  departmentApprovedByName: 'Lê Văn C (Cục)',
  departmentApprovedAt: '2020-09-25T14:30:00Z',
  departmentApprovalContent: 'Chấp thuận phê duyệt tài sản cầu cảng',
  updatedBy: 'user-1',
  updatedByName: 'Nguyễn Văn A',
  updatedAt: '2026-09-10T14:00:00Z',
};

describe('Module 5: Tài sản cầu cảng (docs/checklists/CHECKLIST-TAI-SAN-CAU-CANG.md)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        userId: 'admin-1',
        username: 'admin',
        fullName: 'Quản trị viên Hệ thống',
        orgUnitId: 'org-6',
        role: 'ADMIN',
        status: 'authenticated',
        permissions: ['infraasset:manage'],
      },
      isAuthenticated: true,
      token: 'admin-jwt-token',
    });

    vi.mocked(api.fetchPierAssets).mockResolvedValue({
      content: [mockPierAsset],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
    });

    vi.mocked(api.fetchKhaiThacList).mockResolvedValue({
      content: [
        {
          id: 'kt-cc-1',
          assetId: mockPierAsset.id,
          assetName: mockPierAsset.assetName,
          exploitationYear: 2025,
          doanhThu: 3000000000,
          depreciation: 350000000,
          description: 'Hợp đồng khai thác xếp dỡ container',
          operatorOrgUnitId: 'org-6',
          totalRevenue: 3000000000,
          relatedCosts: 350000000,
          stateBudgetPayment: 700000000,
          projectAmount: 1950000000,
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
  it('UI-1: Render giao diện danh sách Tài sản cầu cảng theo Golden Layout', () => {
    const html = renderToStaticMarkup(<PierAssetList />);

    expect(html).toContain('Quản lý tài sản KCHT hàng hải');
    expect(html).toContain('Tài sản cầu cảng');
    expect(html).toContain('Thêm mới');
    expect(html).toContain('Mã cầu cảng');
    expect(html).toContain('Tất cả');
    expect(html).toContain('Đã duyệt');
    expect(html).toContain('TÊN/MÃ TÀI SẢN');
    expect(html).toContain('MÃ CẦU CẢNG');
    expect(html).toContain('LOẠI TÀI SẢN');
  });

  // 2. Kiểm tra Render Drawer Xem chi tiết
  it('UI-2: Render Drawer Xem chi tiết tài sản cầu cảng với 6 tab nghiệp vụ và hiển thị đầy đủ thông tin khai thác, tăng/giảm giá', () => {
    const orgMap = new Map([
      ['org-1', 'Cục Hàng hải Việt Nam'],
      ['org-6', 'Cảng vụ Hàng hải TP. Hồ Chí Minh'],
    ]);
    const pierMap = new Map<string, Pier>([
      ['pier-1', { id: 'pier-1', pierCode: 'CC-SG-01', pierName: 'Cầu cảng Cát Lái 1' } as unknown as Pier],
    ]);

    const mockExploitation: api.AssetExploitationResponse = {
      id: 'kt-cc-1',
      assetId: mockPierAsset.id,
      assetName: mockPierAsset.assetName,
      exploitationYear: 2026,
      doanhThu: 1500000000,
      depreciation: 150000000,
      description: 'Hợp đồng cho thuê cầu cảng làm hàng',
      operatorOrgUnitId: 'org-6',
      assetCategory: 'Cầu cảng hàng hải',
      unitOfMeasure: 'm',
      quantity: 350,
      exploitationDeadline: '2026-12-31',
      totalRevenue: 1500000000,
      relatedCosts: 150000000,
      stateBudgetPayment: 300000000,
      projectAmount: 1050000000,
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T08:26:28Z',
      updatedAt: '2026-09-11T08:26:28Z',
    };

    const mockIncrease: AssetIncreaseResponse = {
      id: 'inc-cc-1',
      assetId: mockPierAsset.id,
      assetName: mockPierAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      reason: 'Kéo dài cầu cảng thêm 50m',
      status: 'APPROVED',
      increaseCode: '170/QĐ-TANG-CC',
      adjustmentDetails: {
        decisionNumber: '170/QĐ-TANG-CC',
        decisionDate: '2026-09-01',
        adjustmentDate: '2026-09-10',
        adjustmentReason: 'Đầu tư bổ sung',
        adjustmentNotes: 'Nâng cấp kết cấu bệ cọc',
        originalValueBefore: 60000000000,
        originalValueAfter: 72000000000,
        remainingValueBefore: 51000000000,
        remainingValueAfter: 63000000000,
      },
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T08:17:38Z',
      updatedAt: '2026-09-11T08:17:38Z',
    };

    const html = renderToStaticMarkup(
      <PierAssetDetailContent
        open={true}
        selectedRecord={mockPierAsset}
        onClose={vi.fn()}
        orgName={orgMap}
        pierMap={pierMap}
        exploitationRows={[mockExploitation]}
        increaseRows={[mockIncrease]}
        decreaseRows={[]}
      />
    );

    expect(html).toContain('Chi tiết tài sản cầu cảng');
    expect(html).toContain('Thông tin chung');
    expect(html).toContain('Hồ sơ tài sản');
    expect(html).toContain('Thông tin chi tiết');
    expect(html).toContain('Khai thác tài sản (1)');
    expect(html).toContain('Thay đổi nguyên giá (1)');
    expect(html).toMatch(/Xử lý.*theo dõi/);
    expect(html).toContain('CC-SG-01');
    expect(html).toContain('TS-CC-001');

    // Kiểm tra hiển thị thông tin Khai thác
    expect(html).toContain('Hợp đồng cho thuê cầu cảng làm hàng');
    expect(html).toContain('31/12/2026');
    expect(html).toContain('1,500,000,000 VNĐ');
    expect(html).toContain('150,000,000 VNĐ');
    expect(html).toContain('300,000,000 VNĐ');

    // Kiểm tra hiển thị thông tin Thay đổi nguyên giá
    expect(html).toContain('170/QĐ-TANG-CC');
    expect(html).toContain('01/09/2026');
    expect(html).toContain('+12,000,000,000 VNĐ');
    expect(html).toContain('Đầu tư bổ sung');
  });

  // 3. Kiểm tra Form Thêm mới
  it('UI-3: Render Form Thêm mới tài sản cầu cảng với 3 action buttons', () => {
    function FormWrapper() {
      const [form] = Form.useForm<FormValues>();
      return (
        <PierAssetForm
          open={true}
          drawerMode="create"
          form={form}
          organizations={[{ id: 'org-6', name: 'Cảng vụ Hàng hải TP. Hồ Chí Minh', code: 'CVHCM' } as unknown as Organization]}
          piers={[{ id: 'pier-1', pierCode: 'CC-SG-01', pierName: 'Cầu cảng Cát Lái 1' } as unknown as Pier]}
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
    expect(html).toContain('Thêm mới tài sản cầu cảng');
    expect(html).toContain('Thông tin chung');
    expect(html).toContain('Hồ sơ tài sản (0)');
    expect(html).toContain('Lưu tạm');
    expect(html).toContain('Lưu và gửi phê duyệt');
    expect(html).toContain('Lưu và phê duyệt');
  });

  // 4. Kiểm tra Render Operation Form
  it('UI-4: Render Form Khai thác, Tăng nguyên giá và Giảm nguyên giá tài sản cầu cảng', () => {
    function OperationWrapper({ mode }: { mode: 'exploit' | 'increase' | 'decrease' }) {
      const [form] = Form.useForm<OperationValues>();
      return (
        <PierAssetOperationForm
          open={true}
          operationMode={mode}
          selected={mockPierAsset}
          organizations={[
            { id: 'org-6', name: 'Cảng vụ Hàng hải TP. Hồ Chí Minh', code: 'CVHCM' } as unknown as Organization,
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
  it('CRUD-1: Tự tạo mới tài sản cầu cảng với các mức phê duyệt', async () => {
    const createPayload: PierAssetPayload = {
      assetCode: 'TS-CC-NEW',
      assetName: 'Cầu cảng Container Hiệp Phước số 2',
      assetType: 'PIER',
      orgUnitId: 'org-6',
      usingOrgUnitId: 'org-6',
      pierId: 'pier-1',
      assetCondition: 'Tốt',
      usageStatus: 'Chưa sử dụng',
      originalValue: 70000000000,
      approvalStatus: 'DRAFT',
    };

    vi.mocked(api.createPierAsset).mockResolvedValue({
      ...mockPierAsset,
      ...createPayload,
      id: 'asset-cc-created',
    });

    const created = await api.createPierAsset(createPayload);
    expect(api.createPierAsset).toHaveBeenCalledWith(createPayload);
    expect(created.id).toBe('asset-cc-created');
    expect(created.assetType).toBe('PIER');
  });

  // 6. Kiểm tra Sửa (Edit Flow)
  it('CRUD-2: Chỉnh sửa tài sản cầu cảng hiện có', async () => {
    const updatePayload: PierAssetPayload = {
      assetCode: mockPierAsset.assetCode,
      assetName: 'Cầu cảng Container chuyên dụng số 1 (Nâng cấp sức chịu tải)',
      assetType: 'PIER',
      orgUnitId: 'org-6',
      usingOrgUnitId: 'org-6',
      pierId: 'pier-1',
      assetCondition: 'Tốt',
      originalValue: 72000000000,
      approvalStatus: 'APPROVED',
    };

    vi.mocked(api.updatePierAsset).mockResolvedValue({
      ...mockPierAsset,
      ...updatePayload,
    });

    const updated = await api.updatePierAsset(mockPierAsset.id, updatePayload);
    expect(api.updatePierAsset).toHaveBeenCalledWith(mockPierAsset.id, updatePayload);
    expect(updated.assetName).toContain('(Nâng cấp sức chịu tải)');
  });

  // 7. Kiểm tra Xóa (Delete Flow)
  it('CRUD-3: Xóa tài sản cầu cảng theo ID', async () => {
    vi.mocked(api.deletePierAsset).mockResolvedValue(undefined);

    await api.deletePierAsset(mockPierAsset.id);
    expect(api.deletePierAsset).toHaveBeenCalledWith('asset-cc-1');
  });

  // 8. Kiểm tra Khai thác tài sản (Exploitation Flow)
  it('OP-1: Thực hiện Khai thác tài sản cầu cảng gọi API createKhaiThac thành công', async () => {
    const exploitPayload = {
      assetId: mockPierAsset.id,
      assetName: mockPierAsset.assetName,
      exploitationYear: 2026,
      doanhThu: 4000000000,
      depreciation: 450000000,
      description: 'Hợp đồng khai thác cầu bến năm 2026',
      operatorOrgUnitId: 'org-6',
      assetCategory: mockPierAsset.assetName,
      unitOfMeasure: 'Cầu',
      quantity: 1,
      exploitationDeadline: '2026-12-31',
      totalRevenue: 4000000000,
      relatedCosts: 450000000,
      stateBudgetPayment: 900000000,
      projectAmount: 2650000000,
    };

    vi.mocked(api.createKhaiThac).mockResolvedValue({
      id: 'kt-cc-new-1',
      ...exploitPayload,
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T00:00:00Z',
      updatedAt: '2026-09-11T00:00:00Z',
    });

    const result = await api.createKhaiThac(exploitPayload);
    expect(api.createKhaiThac).toHaveBeenCalledWith(exploitPayload);
    expect(result.id).toBe('kt-cc-new-1');
    expect(result.totalRevenue).toBe(4000000000);
  });

  // 9. Kiểm tra Tăng nguyên giá tài sản
  it('OP-2: Thực hiện Tăng nguyên giá tài sản cầu cảng gọi API createAssetIncrease thành công', async () => {
    const adjustmentDetails: AssetValueAdjustmentDetails = {
      decisionNumber: '140/QĐ-TANG-CC',
      decisionDate: '2026-09-01',
      adjustmentDate: '2026-09-10',
      declarationDate: '2026-09-01',
      depreciationStartDate: '2026-09-10',
      depreciationEndDate: '2046-09-10',
      originalValueBefore: 65000000000,
      originalValueAfter: 75000000000,
      remainingValueBefore: 56225000000,
      remainingValueAfter: 66225000000,
      valueUnit: 'VNĐ',
      adjustmentNotes: 'Nâng cấp kết cấu mặt cầu tiếp nhận cẩu bờ STS',
    };

    const increasePayload = {
      assetId: mockPierAsset.id,
      assetName: mockPierAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      increaseCode: '140/QĐ-TANG-CC',
      reason: 'Nâng cấp kết cấu mặt cầu tiếp nhận cẩu bờ STS',
      adjustmentDetails,
    };

    vi.mocked(api.createAssetIncrease).mockResolvedValue({
      id: 'inc-cc-1',
      assetId: mockPierAsset.id,
      assetName: mockPierAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      increaseCode: '140/QĐ-TANG-CC',
      decisionNumber: '140/QĐ-TANG-CC',
      decisionDate: '2026-09-01',
      adjustmentDate: '2026-09-10',
      adjustmentAmount: 10000000000,
      originalValueBefore: 65000000000,
      originalValueAfter: 75000000000,
      remainingValueBefore: 56225000000,
      remainingValueAfter: 66225000000,
      reason: 'Nâng cấp kết cấu mặt cầu tiếp nhận cẩu bờ STS',
      status: 'APPROVED',
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T00:00:00Z',
      updatedAt: '2026-09-11T00:00:00Z',
    });

    const result = await api.createAssetIncrease(increasePayload);
    expect(api.createAssetIncrease).toHaveBeenCalledWith(increasePayload);
    expect(result.id).toBe('inc-cc-1');
    expect(result.originalValueAfter).toBe(75000000000);
  });

  // 10. Kiểm tra Giảm nguyên giá tài sản
  it('OP-3: Thực hiện Giảm nguyên giá tài sản cầu cảng gọi API createAssetDecrease thành công', async () => {
    const adjustmentDetails: AssetValueAdjustmentDetails = {
      decisionNumber: '145/QĐ-GIAM-CC',
      decisionDate: '2026-09-01',
      adjustmentDate: '2026-09-10',
      declarationDate: '2026-09-01',
      depreciationStartDate: '2026-09-10',
      depreciationEndDate: '2046-09-10',
      originalValueBefore: 65000000000,
      originalValueAfter: 60000000000,
      remainingValueBefore: 56225000000,
      remainingValueAfter: 51225000000,
      valueUnit: 'VNĐ',
      adjustmentNotes: 'Tháo dỡ hạng mục bến cập cano cũ',
    };

    const decreasePayload = {
      assetId: mockPierAsset.id,
      assetName: mockPierAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      decreaseReason: 'Tháo dỡ hạng mục bến cập cano cũ',
      adjustmentDetails,
    };

    vi.mocked(api.createAssetDecrease).mockResolvedValue({
      id: 'dec-cc-1',
      assetId: mockPierAsset.id,
      assetName: mockPierAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      decreaseCode: '145/QĐ-GIAM-CC',
      decisionNumber: '145/QĐ-GIAM-CC',
      decisionDate: '2026-09-01',
      adjustmentDate: '2026-09-10',
      adjustmentAmount: 5000000000,
      originalValueBefore: 65000000000,
      originalValueAfter: 60000000000,
      remainingValueBefore: 56225000000,
      remainingValueAfter: 51225000000,
      decreaseReason: 'Tháo dỡ hạng mục bến cập cano cũ',
      status: 'APPROVED',
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T00:00:00Z',
      updatedAt: '2026-09-11T00:00:00Z',
    });

    const result = await api.createAssetDecrease(decreasePayload);
    expect(api.createAssetDecrease).toHaveBeenCalledWith(decreasePayload);
    expect(result.id).toBe('dec-cc-1');
    expect(result.originalValueAfter).toBe(60000000000);
  });

  // 11. Kiểm tra Tìm kiếm & Filter
  it('FILTER: Tìm kiếm và lọc dữ liệu tài sản cầu cảng', async () => {
    const searchFilter: PierAssetFilters = {
      assetCode: 'TS-CC',
      assetName: 'Cát Lái',
      pierId: 'pier-1',
      assetCondition: 'Tốt',
      approvalStatus: 'APPROVED',
    };

    await api.fetchPierAssets(searchFilter);
    expect(api.fetchPierAssets).toHaveBeenCalledWith(searchFilter);
  });
});
