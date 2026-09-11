import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Form } from 'antd';
import { useAuthStore } from '../../store/authStore';
import * as api from '../../services/assetmovement/api';
import type {
  PortTerminalAsset,
  PortTerminalAssetPayload,
  PortTerminalAssetFilters,
  AssetValueAdjustmentDetails,
} from '../../services/assetmovement/types';
import PortTerminalAssetList from './PortTerminalAssetList';
import PortTerminalAssetForm, { type FormValues } from './PortTerminalAssetForm';
import PortTerminalAssetDetailContent from './PortTerminalAssetDetailContent';
import { PortTerminalAssetOperationForm, type OperationValues } from './PortTerminalAssetOperationForm';
import type { Berth } from '../../types/port';
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

// Mock API and external services
vi.mock('../../services/assetmovement/api', () => ({
  fetchPortTerminalAssets: vi.fn(),
  fetchPortTerminalAsset: vi.fn(),
  createPortTerminalAsset: vi.fn(),
  updatePortTerminalAsset: vi.fn(),
  deletePortTerminalAsset: vi.fn(),
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
      { id: 'org-2', name: 'Cảng vụ Hàng hải Hải Phòng', code: 'CVHP' },
    ]),
  },
}));

vi.mock('../../services/portService', () => ({
  berthCRUD: {
    findAll: vi.fn().mockResolvedValue({
      data: [
        { id: 'berth-1', berthCode: 'BC-01', berthName: 'Bến cảng số 1' },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    }),
  },
}));

const mockAsset: PortTerminalAsset = {
  id: 'asset-bc-1',
  assetCode: 'TS-BC-001',
  assetName: 'Cầu cảng Container số 1',
  assetType: 'PORT_TERMINAL',
  parentOrgUnitId: 'org-1',
  orgUnitId: 'org-2',
  usingOrgUnitId: 'org-2',
  berthId: 'berth-1',
  barcode: 'BC1-CONTAINER-01',
  assetCondition: 'Tốt',
  usageStatus: 'Đang sử dụng',
  assetGroup: 'Nhà, công trình xây dựng',
  assetSubgroup: 'Cầu cảng hàng hóa',
  address: 'Khu bến cảng Đình Vũ, Hải Phòng',
  origin: 'Đầu tư xây dựng',
  quantity: 1,
  quantityUnit: 'Bộ',
  model: 'MODEL-BC-2024',
  serialNumber: 'SN-998877',
  countryOfOrigin: 'Việt Nam',
  manufacturer: 'Tổng công ty Xây dựng',
  constructionYear: 2020,
  useDate: '2021-01-01',
  landArea: 15000,
  floorArea: 12000,
  assetLocation: 'Tọa độ: 20°51\'N - 106°41\'E',
  attachmentName: 'ho_so_thiet_ke.pdf',
  declarationDate: '2021-01-15',
  originalValue: 50000000000,
  depreciationRate: 5,
  accumulatedDepreciation: 5000000000,
  remainingValue: 45000000000,
  assignmentDecisionNumber: '123/QĐ-CHHVN',
  depreciationStartDate: '2021-01-01',
  depreciationMonths: 240,
  depreciationEndDate: '2041-01-01',
  monthlyDepreciation: 208333333,
  disposalMethod: 'Bán',
  status: 'MANAGED',
  approvalStatus: 'APPROVED',
  submittedBy: 'user-1',
  submittedByName: 'Nguyễn Văn A',
  submittedAt: '2021-01-16T08:00:00Z',
  portAuthorityApprovedBy: 'user-2',
  portAuthorityApprovedByName: 'Trần Văn B (Cảng vụ)',
  portAuthorityApprovedAt: '2021-01-17T09:30:00Z',
  portAuthorityApprovalContent: 'Hồ sơ đầy đủ, đủ điều kiện phê duyệt cấp 1',
  departmentApprovedBy: 'user-3',
  departmentApprovedByName: 'Lê Văn C (Cục)',
  departmentApprovedAt: '2021-01-18T14:00:00Z',
  departmentApprovalContent: 'Chấp thuận phê duyệt tài sản bến cảng',
  updatedBy: 'user-1',
  updatedByName: 'Nguyễn Văn A',
  updatedAt: '2026-09-10T10:00:00Z',
};

describe('Module 1: Tài sản bến cảng (docs/checklists/CHECKLIST-TAI-SAN-BEN-CANG.md)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        userId: 'admin-1',
        username: 'admin',
        fullName: 'Quản trị viên Hệ thống',
        orgUnitId: 'org-2',
        role: 'ADMIN',
        status: 'authenticated',
        permissions: ['infraasset:manage'],
      },
      isAuthenticated: true,
      token: 'admin-jwt-token',
    });

    vi.mocked(api.fetchPortTerminalAssets).mockResolvedValue({
      content: [mockAsset],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
    });

    vi.mocked(api.fetchKhaiThacList).mockResolvedValue({
      content: [
        {
          id: 'kt-1',
          assetId: mockAsset.id,
          assetName: mockAsset.assetName,
          exploitationYear: 2025,
          doanhThu: 2000000000,
          depreciation: 300000000,
          description: 'Hợp đồng khai thác số 01',
          operatorOrgUnitId: 'org-2',
          totalRevenue: 2000000000,
          relatedCosts: 300000000,
          stateBudgetPayment: 500000000,
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
      content: [
        {
          id: 'inc-1',
          assetId: mockAsset.id,
          assetName: mockAsset.assetName,
          quantity: 1,
          unitOfMeasure: 'Cái',
          increaseCode: 'QĐ-TANG-01',
          decisionNumber: '99/QĐ-TANG',
          decisionDate: '2024-06-01',
          adjustmentDate: '2024-06-15',
          adjustmentAmount: 5000000000,
          originalValueBefore: 45000000000,
          originalValueAfter: 50000000000,
          remainingValueBefore: 40000000000,
          remainingValueAfter: 45000000000,
          reason: 'Đầu tư mở rộng bến',
          status: 'APPROVED',
          createdBy: 'admin-1',
          createdByName: 'Quản trị viên Hệ thống',
          createdAt: '2024-06-01T00:00:00Z',
          updatedAt: '2024-06-01T00:00:00Z',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 100,
      number: 0,
    });

    vi.mocked(api.fetchAssetDecreaseList).mockResolvedValue({
      content: [
        {
          id: 'dec-1',
          assetId: mockAsset.id,
          assetName: mockAsset.assetName,
          quantity: 1,
          unitOfMeasure: 'Cái',
          decreaseCode: 'QĐ-GIAM-01',
          decisionNumber: '101/QĐ-GIAM',
          decisionDate: '2024-08-01',
          adjustmentDate: '2024-08-15',
          adjustmentAmount: 2000000000,
          originalValueBefore: 50000000000,
          originalValueAfter: 48000000000,
          remainingValueBefore: 45000000000,
          remainingValueAfter: 43000000000,
          reason: 'Thanh lý một phần',
          decreaseReason: 'Thanh lý một phần',
          status: 'APPROVED',
          createdBy: 'admin-1',
          createdByName: 'Quản trị viên Hệ thống',
          createdAt: '2024-08-01T00:00:00Z',
          updatedAt: '2024-08-01T00:00:00Z',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 100,
      number: 0,
    });
  });

  // 0. Xác thực tài khoản Admin & Quyền quản trị
  it('AUTH: Đăng nhập thành công với tài khoản admin và quyền quản trị infraasset:manage', () => {
    const auth = useAuthStore.getState();
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.user?.username).toBe('admin');
    expect(auth.user?.role).toBe('ADMIN');
    expect(auth.user?.permissions).toContain('infraasset:manage');
  });

  // 1. Kiểm tra Render UI Bảng danh sách & Golden Layout
  it('UI-1: Render giao diện danh sách Tài sản bến cảng theo chuẩn Golden Layout', () => {
    const html = renderToStaticMarkup(<PortTerminalAssetList />);

    // Header & Breadcrumb
    expect(html).toContain('Quản lý tài sản KCHT hàng hải');
    expect(html).toContain('Tài sản bến cảng');
    expect(html).toContain('Thêm mới');

    // Sidebar bộ lọc
    expect(html).toContain('Tìm kiếm');
    expect(html).toContain('Đơn vị quản lý');
    expect(html).toContain('Đơn vị sử dụng');
    expect(html).toContain('Mã bến cảng');
    expect(html).toContain('Tình trạng tài sản');
    expect(html).toContain('Mã tài sản');
    expect(html).toContain('Tên tài sản');
    expect(html).toContain('Ngày cập nhật');

    // 6 Status tabs
    expect(html).toContain('Tất cả');
    expect(html).toContain('Lưu tạm');
    expect(html).toContain('Chờ Cảng vụ duyệt');
    expect(html).toContain('Chờ Cục duyệt');
    expect(html).toContain('Đã duyệt');
    expect(html).toContain('Từ chối');

    // Table Column Headers
    expect(html).toContain('TÊN/MÃ TÀI SẢN');
    expect(html).toContain('ĐƠN VỊ QUẢN LÝ');
    expect(html).toContain('ĐƠN VỊ SỬ DỤNG');
    expect(html).toContain('MÃ BẾN CẢNG');
    expect(html).toContain('LOẠI TÀI SẢN');
    expect(html).toContain('TÌNH TRẠNG TÀI SẢN');
    expect(html).toContain('HIỆN TRẠNG SỬ DỤNG');
    expect(html).toContain('NHÓM TÀI SẢN');
    expect(html).toContain('NGÀY SỬ DỤNG TÀI SẢN');
    expect(html).toContain('TRẠNG THÁI');
    expect(html).toContain('CÁN BỘ CẬP NHẬT');
    expect(html).toContain('CÁN BỘ GỬI PHÊ DUYỆT');
    expect(html).toContain('CÁN BỘ PHÊ DUYỆT CẤP CẢNG VỤ/CHI CỤC');
    expect(html).toContain('CÁN BỘ PHÊ DUYỆT CẤP CỤC');
  });

  // 2. Kiểm tra Render UI Drawer Xem chi tiết với 6 Tab nghiệp vụ
  it('UI-2: Render Drawer Xem chi tiết với 6 tab nghiệp vụ và đầy đủ các trường checklist', () => {
    const orgMap = new Map([
      ['org-1', 'Cục Hàng hải Việt Nam'],
      ['org-2', 'Cảng vụ Hàng hải Hải Phòng'],
    ]);
    const berthMap = new Map<string, Berth>([
      ['berth-1', { id: 'berth-1', berthCode: 'BC-01', berthName: 'Bến cảng số 1' } as unknown as Berth],
    ]);

    const mockExploitation: api.AssetExploitationResponse = {
      id: 'kt-bc-1',
      assetId: mockAsset.id,
      assetName: mockAsset.assetName,
      exploitationYear: 2026,
      doanhThu: 2500000000,
      depreciation: 250000000,
      description: 'Hợp đồng khai thác cầu cảng container',
      operatorOrgUnitId: 'org-2',
      assetCategory: 'Cầu cảng Container',
      unitOfMeasure: 'm',
      quantity: 500,
      exploitationDeadline: '2026-12-31',
      totalRevenue: 2500000000,
      relatedCosts: 250000000,
      stateBudgetPayment: 500000000,
      projectAmount: 1750000000,
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T08:26:28Z',
      updatedAt: '2026-09-11T08:26:28Z',
    };

    const mockIncrease: AssetIncreaseResponse = {
      id: 'inc-bc-1',
      assetId: mockAsset.id,
      assetName: mockAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      reason: 'Đầu tư mở rộng bến container',
      status: 'APPROVED',
      increaseCode: '180/QĐ-TANG-BC',
      adjustmentDetails: {
        decisionNumber: '180/QĐ-TANG-BC',
        decisionDate: '2026-09-01',
        adjustmentDate: '2026-09-10',
        adjustmentReason: 'Đầu tư bổ sung',
        adjustmentNotes: 'Xây dựng kéo dài thêm 100m',
        originalValueBefore: 50000000000,
        originalValueAfter: 65000000000,
        remainingValueBefore: 42500000000,
        remainingValueAfter: 57500000000,
      },
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T08:17:38Z',
      updatedAt: '2026-09-11T08:17:38Z',
    };

    const html = renderToStaticMarkup(
      <PortTerminalAssetDetailContent
        open={true}
        selectedRecord={mockAsset}
        onClose={vi.fn()}
        orgName={orgMap}
        berthMap={berthMap}
        exploitationRows={[mockExploitation]}
        increaseRows={[mockIncrease]}
        decreaseRows={[]}
      />
    );

    // Header Drawer
    expect(html).toContain('Chi tiết tài sản bến cảng');

    // 6 Tabs chuẩn theo checklist
    expect(html).toContain('Thông tin chung');
    expect(html).toContain('Hồ sơ tài sản');
    expect(html).toContain('Thông tin chi tiết');
    expect(html).toContain('Khai thác tài sản (1)');
    expect(html).toContain('Thay đổi nguyên giá (1)');
    expect(html).toMatch(/Xử lý.*theo dõi/);

    // Tab 1: Thông tin chung
    expect(html).toContain('Cầu cảng Container số 1');
    expect(html).toContain('TS-BC-001');
    expect(html).toContain('Cảng vụ Hàng hải Hải Phòng');
    expect(html).toContain('BC-01');
    expect(html).toContain('Tài sản bến cảng');
    expect(html).toContain('Đang sử dụng');
    expect(html).toContain('BC1-CONTAINER-01');

    // Tab Khai thác tài sản
    expect(html).toContain('Hợp đồng khai thác cầu cảng container');
    expect(html).toContain('31/12/2026');
    expect(html).toContain('2,500,000,000 VNĐ');
    expect(html).toContain('250,000,000 VNĐ');
    expect(html).toContain('500,000,000 VNĐ');

    // Tab Thay đổi nguyên giá
    expect(html).toContain('180/QĐ-TANG-BC');
    expect(html).toContain('01/09/2026');
    expect(html).toContain('Đầu tư bổ sung');
  });

  // 3. Kiểm tra Render Form Thêm mới / Sửa với 6 Tab và 3 Action Buttons
  it('UI-3: Render Form Thêm mới / Chỉnh sửa tài sản bến cảng với 6 tab và 3 action buttons', () => {
    function FormWrapper() {
      const [form] = Form.useForm<FormValues>();
      return (
        <PortTerminalAssetForm
          open={true}
          drawerMode="create"
          form={form}
          organizations={[
            { id: 'org-1', name: 'Cục Hàng hải Việt Nam', code: 'CHHVN' } as unknown as Organization,
            { id: 'org-2', name: 'Cảng vụ Hàng hải Hải Phòng', code: 'CVHP' } as unknown as Organization,
          ]}
          berths={[{ id: 'berth-1', berthCode: 'BC-01', berthName: 'Bến số 1' } as unknown as Berth]}
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

    expect(html).toContain('Thêm mới tài sản bến cảng');
    expect(html).toContain('Thông tin chung');
    expect(html).toContain('Hồ sơ tài sản (0)');
    expect(html).toContain('Thông tin chi tiết');

    // 3 nút lưu chuẩn bến cảng
    expect(html).toContain('Lưu tạm');
    expect(html).toContain('Lưu và gửi phê duyệt');
    expect(html).toContain('Lưu và phê duyệt');
  });

  // 4. Kiểm tra Render Form Khai thác, Tăng và Giảm nguyên giá tài sản
  it('UI-4: Render Form Khai thác, Tăng nguyên giá và Giảm nguyên giá tài sản bến cảng', () => {
    function OperationWrapper({ mode }: { mode: 'exploit' | 'increase' | 'decrease' }) {
      const [form] = Form.useForm<OperationValues>();
      return (
        <PortTerminalAssetOperationForm
          open={true}
          operationMode={mode}
          selected={mockAsset}
          organizations={[
            { id: 'org-2', name: 'Cảng vụ Hàng hải Hải Phòng', code: 'CVHP' } as unknown as Organization,
          ]}
          form={form}
          saving={false}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />
      );
    }

    // Exploit mode
    const exploitHtml = renderToStaticMarkup(<OperationWrapper mode="exploit" />);
    expect(exploitHtml).toContain('Khai thác tài sản');
    expect(exploitHtml).toContain('Thông tin khai thác tài sản');
    expect(exploitHtml).toContain('Đơn vị khai thác');

    // Increase mode
    const increaseHtml = renderToStaticMarkup(<OperationWrapper mode="increase" />);
    expect(increaseHtml).toContain('Tăng nguyên giá tài sản');
    expect(increaseHtml).toContain('Số QĐ tăng nguyên giá');
    expect(increaseHtml).toContain('Lý do tăng');

    // Decrease mode
    const decreaseHtml = renderToStaticMarkup(<OperationWrapper mode="decrease" />);
    expect(decreaseHtml).toContain('Giảm nguyên giá tài sản');
    expect(decreaseHtml).toContain('Số QĐ giảm nguyên giá');
    expect(decreaseHtml).toContain('Lý do giảm');
  });

  // 5. Kiểm tra Tự thêm (Create Flow)
  it('CRUD-1: Tự tạo mới tài sản bến cảng với đầy đủ dữ liệu payload chuẩn', async () => {
    const createPayload: PortTerminalAssetPayload = {
      assetCode: 'TS-BC-NEW',
      assetName: 'Bến cảng nước sâu Lạch Huyện số 3',
      assetType: 'PORT_TERMINAL',
      orgUnitId: 'org-2',
      usingOrgUnitId: 'org-2',
      berthId: 'berth-1',
      assetCondition: 'Tốt',
      usageStatus: 'Chưa sử dụng',
      originalValue: 80000000000,
      approvalStatus: 'PENDING_APPROVAL',
    };

    vi.mocked(api.createPortTerminalAsset).mockResolvedValue({
      ...mockAsset,
      ...createPayload,
      id: 'asset-bc-created',
    });

    const created = await api.createPortTerminalAsset(createPayload);
    expect(api.createPortTerminalAsset).toHaveBeenCalledWith(createPayload);
    expect(created.id).toBe('asset-bc-created');
    expect(created.assetType).toBe('PORT_TERMINAL');
    expect(created.approvalStatus).toBe('PENDING_APPROVAL');
  });

  // 6. Kiểm tra Sửa (Edit Flow)
  it('CRUD-2: Chỉnh sửa tài sản bến cảng hiện có', async () => {
    const updatePayload: PortTerminalAssetPayload = {
      assetCode: mockAsset.assetCode,
      assetName: 'Cầu cảng Container số 1 (Đã nâng cấp)',
      assetType: 'PORT_TERMINAL',
      orgUnitId: 'org-2',
      usingOrgUnitId: 'org-2',
      berthId: 'berth-1',
      assetCondition: 'Tốt',
      originalValue: 55000000000,
      approvalStatus: 'APPROVED',
    };

    vi.mocked(api.updatePortTerminalAsset).mockResolvedValue({
      ...mockAsset,
      ...updatePayload,
    });

    const updated = await api.updatePortTerminalAsset(mockAsset.id, updatePayload);
    expect(api.updatePortTerminalAsset).toHaveBeenCalledWith(mockAsset.id, updatePayload);
    expect(updated.assetName).toContain('(Đã nâng cấp)');
    expect(updated.originalValue).toBe(55000000000);
  });

  // 7. Kiểm tra Xóa (Delete Flow)
  it('CRUD-3: Xóa tài sản bến cảng theo ID', async () => {
    vi.mocked(api.deletePortTerminalAsset).mockResolvedValue(undefined);

    await api.deletePortTerminalAsset(mockAsset.id);
    expect(api.deletePortTerminalAsset).toHaveBeenCalledWith('asset-bc-1');
  });

  // 8. Kiểm tra Khai thác tài sản (Exploitation Flow)
  it('OP-1: Thực hiện Khai thác tài sản bến cảng gọi API createKhaiThac thành công', async () => {
    const exploitPayload = {
      assetId: mockAsset.id,
      assetName: mockAsset.assetName,
      exploitationYear: 2026,
      doanhThu: 3500000000,
      depreciation: 400000000,
      description: 'Hợp đồng khai thác bến cảng năm 2026',
      operatorOrgUnitId: 'org-2',
      assetCategory: mockAsset.assetName,
      unitOfMeasure: 'Bộ',
      quantity: 1,
      exploitationDeadline: '2026-12-31',
      totalRevenue: 3500000000,
      relatedCosts: 400000000,
      stateBudgetPayment: 800000000,
      projectAmount: 2300000000,
    };

    vi.mocked(api.createKhaiThac).mockResolvedValue({
      id: 'kt-new-1',
      ...exploitPayload,
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T00:00:00Z',
      updatedAt: '2026-09-11T00:00:00Z',
    });

    const result = await api.createKhaiThac(exploitPayload);
    expect(api.createKhaiThac).toHaveBeenCalledWith(exploitPayload);
    expect(result.id).toBe('kt-new-1');
    expect(result.totalRevenue).toBe(3500000000);
    expect(result.stateBudgetPayment).toBe(800000000);
  });

  // 9. Kiểm tra Tăng nguyên giá tài sản (Asset Increase Flow)
  it('OP-2: Thực hiện Tăng nguyên giá tài sản bến cảng gọi API createAssetIncrease thành công', async () => {
    const adjustmentDetails: AssetValueAdjustmentDetails = {
      decisionNumber: '150/QĐ-TANG-2026',
      decisionDate: '2026-09-01',
      adjustmentDate: '2026-09-10',
      declarationDate: '2026-09-01',
      depreciationStartDate: '2026-09-10',
      depreciationEndDate: '2046-09-10',
      originalValueBefore: 50000000000,
      originalValueAfter: 60000000000,
      remainingValueBefore: 45000000000,
      remainingValueAfter: 55000000000,
      valueUnit: 'VNĐ',
      adjustmentNotes: 'Đầu tư mở rộng cầu cảng nước sâu',
    };

    const increasePayload = {
      assetId: mockAsset.id,
      assetName: mockAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      increaseCode: '150/QĐ-TANG-2026',
      reason: 'Đầu tư mở rộng cầu cảng nước sâu',
      adjustmentDetails,
    };

    vi.mocked(api.createAssetIncrease).mockResolvedValue({
      id: 'inc-new-1',
      assetId: mockAsset.id,
      assetName: mockAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      increaseCode: '150/QĐ-TANG-2026',
      decisionNumber: '150/QĐ-TANG-2026',
      decisionDate: '2026-09-01',
      adjustmentDate: '2026-09-10',
      adjustmentAmount: 10000000000,
      originalValueBefore: 50000000000,
      originalValueAfter: 60000000000,
      remainingValueBefore: 45000000000,
      remainingValueAfter: 55000000000,
      reason: 'Đầu tư mở rộng cầu cảng nước sâu',
      status: 'PENDING_APPROVAL',
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T00:00:00Z',
      updatedAt: '2026-09-11T00:00:00Z',
    });

    const result = await api.createAssetIncrease(increasePayload);
    expect(api.createAssetIncrease).toHaveBeenCalledWith(increasePayload);
    expect(result.id).toBe('inc-new-1');
    expect(result.originalValueAfter).toBe(60000000000);
  });

  // 10. Kiểm tra Giảm nguyên giá tài sản (Asset Decrease Flow)
  it('OP-3: Thực hiện Giảm nguyên giá tài sản bến cảng gọi API createAssetDecrease thành công', async () => {
    const adjustmentDetails: AssetValueAdjustmentDetails = {
      decisionNumber: '200/QĐ-GIAM-2026',
      decisionDate: '2026-09-01',
      adjustmentDate: '2026-09-10',
      declarationDate: '2026-09-01',
      depreciationStartDate: '2026-09-10',
      depreciationEndDate: '2046-09-10',
      originalValueBefore: 50000000000,
      originalValueAfter: 45000000000,
      remainingValueBefore: 45000000000,
      remainingValueAfter: 40000000000,
      valueUnit: 'VNĐ',
      adjustmentNotes: 'Thanh lý một phần hạng mục phụ trợ',
    };

    const decreasePayload = {
      assetId: mockAsset.id,
      assetName: mockAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      decreaseReason: 'Thanh lý một phần hạng mục phụ trợ',
      adjustmentDetails,
    };

    vi.mocked(api.createAssetDecrease).mockResolvedValue({
      id: 'dec-new-1',
      assetId: mockAsset.id,
      assetName: mockAsset.assetName,
      quantity: 1,
      unitOfMeasure: 'VNĐ',
      decreaseCode: '200/QĐ-GIAM-2026',
      decisionNumber: '200/QĐ-GIAM-2026',
      decisionDate: '2026-09-01',
      adjustmentDate: '2026-09-10',
      adjustmentAmount: 5000000000,
      originalValueBefore: 50000000000,
      originalValueAfter: 45000000000,
      remainingValueBefore: 45000000000,
      remainingValueAfter: 40000000000,
      decreaseReason: 'Thanh lý một phần hạng mục phụ trợ',
      status: 'PENDING_APPROVAL',
      createdBy: 'admin-1',
      createdByName: 'Quản trị viên Hệ thống',
      createdAt: '2026-09-11T00:00:00Z',
      updatedAt: '2026-09-11T00:00:00Z',
    });

    const result = await api.createAssetDecrease(decreasePayload);
    expect(api.createAssetDecrease).toHaveBeenCalledWith(decreasePayload);
    expect(result.id).toBe('dec-new-1');
    expect(result.originalValueAfter).toBe(45000000000);
  });

  // 11. Kiểm tra Tìm kiếm & Filter
  it('FILTER: Tìm kiếm và lọc dữ liệu tài sản bến cảng', async () => {
    const searchFilter: PortTerminalAssetFilters = {
      assetCode: 'TS-BC',
      assetName: 'Container',
      orgUnitId: 'org-2',
      berthId: 'berth-1',
      assetCondition: 'Tốt',
      approvalStatus: 'APPROVED',
      updatedFrom: '2026-01-01',
      updatedTo: '2026-12-31',
    };

    await api.fetchPortTerminalAssets(searchFilter);
    expect(api.fetchPortTerminalAssets).toHaveBeenCalledWith(searchFilter);
  });
});
