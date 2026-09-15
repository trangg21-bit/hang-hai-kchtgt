import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import OrgUnitTreeSelect from '../../components/org-unit/OrgUnitTreeSelect';
import { resolveDefaultOrgUnitId } from '../../components/org-unit/useUserDefaultOrgUnit';
import CospasSarsatStationList from './cospas-sarsat/CospasSarsatStationList';
import CospasSarsatStationForm from './cospas-sarsat/CospasSarsatStationForm';
import CospasSarsatStationDetailContent from './cospas-sarsat/CospasSarsatStationDetailContent';
import type { CoastalStationCospasSarsatResponse } from '../../services/station/types';

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

vi.mock('../../components/gis/GisLocationSelector', () => ({
  default: () => <div className="mock-gis-location-selector">GIS Selector</div>,
}));

vi.mock('../../components/shared/InfrastructureAttachmentTab', () => ({
  default: () => <div className="mock-attachment-tab">Attachment Tab</div>,
}));

vi.mock('../../services/cospasSarsatStationService', () => ({
  cospasSarsatStationService: {
    search: vi.fn().mockResolvedValue({
      content: [
        {
          id: 'sarsat-01',
          code: 'SARSAT-001',
          name: 'Đài Cospas-Sarsat Hải Phòng',
          orgUnitId: 'org-hp',
          orgUnitName: 'Cảng vụ Hàng hải Hải Phòng',
          provinceName: 'Hải Phòng',
          conditionStatus: 'OPERATIONAL',
          approvalStatus: 'APPROVED',
          updatedAt: '2026-09-15T08:00:00Z',
          updatedByName: 'Nguyễn Văn A',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
    }),
    getById: vi.fn().mockResolvedValue({
      id: 'sarsat-01',
      code: 'SARSAT-001',
      name: 'Đài Cospas-Sarsat Hải Phòng',
      orgUnitId: 'org-hp',
      orgUnitName: 'Cảng vụ Hàng hải Hải Phòng',
      provinceName: 'Hải Phòng',
      conditionStatus: 'OPERATIONAL',
      approvalStatus: 'APPROVED',
    }),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    submit: vi.fn(),
    approveLevel1: vi.fn(),
    approveLevel2: vi.fn(),
    reject: vi.fn(),
    getHistory: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../services/organizationService', () => ({
  organizationService: {
    getAll: vi.fn().mockResolvedValue([
      { id: 'org-root', name: 'Cục Hàng hải Việt Nam', code: 'CHHVN' },
      { id: 'org-hp', name: 'Cảng vụ Hàng hải Hải Phòng', code: 'CVHP', parentId: 'org-root' },
      { id: 'org-sg', name: 'Cảng vụ Hàng hải TP.HCM', code: 'CVSG', parentId: 'org-root' },
    ]),
  },
}));

vi.mock('../../services/categoryService', () => ({
  categoryService: {
    getCachedProvinces: vi.fn().mockReturnValue([
      { id: 'p-1', code: 'HP', name: 'Hải Phòng' },
      { id: 'p-2', code: 'SG', name: 'TP. Hồ Chí Minh' },
    ]),
    getProvinces: vi.fn().mockResolvedValue([
      { id: 'p-1', code: 'HP', name: 'Hải Phòng' },
      { id: 'p-2', code: 'SG', name: 'TP. Hồ Chí Minh' },
    ]),
    getOperatingOrganizations: vi.fn().mockResolvedValue([
      { id: 'op-1', code: 'VISHIPEL', name: 'Công ty TNHH MTV Thông tin điện tử Hàng hải Việt Nam' },
    ]),
  },
}));

describe('OrgUnitTreeSelect & useUserDefaultOrgUnit', () => {
  it('resolveDefaultOrgUnitId should return user orgUnitId when valid', () => {
    const defaultId = resolveDefaultOrgUnitId({
      id: 'u-1',
      username: 'user_hp',
      orgUnitId: 'org-hp',
      roles: ['CAN_BO_CV'],
    } as any);
    expect(defaultId).toBe('org-hp');
  });

  it('resolveDefaultOrgUnitId should return undefined for null/undefined user or empty orgUnitId', () => {
    expect(resolveDefaultOrgUnitId(null)).toBeUndefined();
    expect(resolveDefaultOrgUnitId({ id: 'u-none' } as any)).toBeUndefined();
    expect(resolveDefaultOrgUnitId({ id: 'u-empty', orgUnitId: '' } as any)).toBeUndefined();
  });

  it('renders OrgUnitTreeSelect in filter variant with "Tất cả" option', () => {
    const html = renderToStaticMarkup(
      <OrgUnitTreeSelect
        variant="filter"
        placeholder="Tất cả"
      />
    );
    expect(html).toContain('ant-tree-select');
  });
});

describe('CospasSarsatStationList', () => {
  beforeEach(() => {
    const testUser = {
      id: 'u-admin',
      username: 'admin',
      fullName: 'Quản trị viên',
      orgUnitId: 'org-hp',
      orgUnitName: 'Cảng vụ Hàng hải Hải Phòng',
      roles: ['ADMIN'],
      permissions: [
        'coastalstationcospassarsat:read',
        'coastalstationcospassarsat:create',
        'coastalstationcospassarsat:update',
        'coastalstationcospassarsat:delete',
        'coastalstationcospassarsat:approvec1',
        'coastalstationcospassarsat:approvec2',
      ],
    };
    useAuthStore.setState({
      user: testUser as any,
      currentUser: testUser as any,
      isAuthenticated: true,
    });
    usePermissionStore.getState().setPermissions(testUser.permissions);
  });

  it('renders CospasSarsatStationList with standard and advanced filter controls', () => {
    const html = renderToStaticMarkup(<CospasSarsatStationList />);
    expect(html).toContain('Tài sản KCHTGT');
    expect(html).toContain('Đài Cospas-Sarsat');
    expect(html).toContain('Thêm mới');
    expect(html).toContain('Tìm kiếm');
    expect(html).toContain('Làm mới bộ lọc');
    // Filter thường (mặc định hiển thị)
    expect(html).toContain('Đơn vị quản lý');
    expect(html).toContain('Tên đài');
    expect(html).toContain('Tình trạng');
    // Nút toggle bộ lọc nâng cao
    expect(html).toContain('Mở rộng bộ lọc nâng cao');
  });
});

describe('CospasSarsatStationForm & DetailContent', () => {
  const mockRecord: CoastalStationCospasSarsatResponse = {
    id: 'sarsat-01',
    code: 'SARSAT-001',
    name: 'Đài Cospas-Sarsat Hải Phòng',
    orgUnitId: 'org-hp',
    orgUnitName: 'Cảng vụ Hàng hải Hải Phòng',
    operatingUnit: 'Công ty TNHH MTV Thông tin điện tử Hàng hải Việt Nam',
    provinceName: 'Hải Phòng',
    address: 'Số 2 Nguyễn Tri Phương, Hải Phòng',
    conditionStatus: 'OPERATIONAL',
    coverageArea: 'Toàn bộ vùng biển Việt Nam và lân cận',
    frequency: '406.0 - 406.1 MHz',
    note: 'Đài hoạt động 24/7 phục vụ tìm kiếm cứu nạn',
    approvalStatus: 'APPROVED',
    updatedAt: '2026-09-15T08:00:00Z',
    updatedByName: 'Nguyễn Văn A',
    gisData: {
      objectType: 'POINT',
      symbol: 'station_cospas',
      coordinateSystem: 'WGS84',
      coordinates: [{ order: 1, lat: 20.86, lng: 106.68 }],
    },
  };

  it('renders CospasSarsatStationDetailContent with 5 tabs', () => {
    const html = renderToStaticMarkup(
      <CospasSarsatStationDetailContent id="sarsat-01" initialData={mockRecord} />
    );
    expect(html).toContain('Thông tin chung');
    expect(html).toContain('Vị trí (GIS)');
    expect(html).toContain('File đính kèm');
    expect(html).toContain('Vận hành &amp; bảo trì');
    expect(html).toContain('Xử lý &amp; theo dõi');
    expect(html).toContain('SARSAT-001');
    expect(html).toContain('Đài Cospas-Sarsat Hải Phòng');
  });

  it('renders CospasSarsatStationForm in create mode with 3 action buttons', () => {
    const html = renderToStaticMarkup(
      <CospasSarsatStationForm
        open={true}
        mode="create"
        initialData={null}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    expect(html).toContain('Thêm mới đài Cospas-Sarsat');
    expect(html).toContain('Lưu tạm');
    expect(html).toContain('Lưu và gửi phê duyệt');
    expect(html).toContain('Lưu và phê duyệt');
  });

  it('renders CospasSarsatStationForm in edit mode with standard action buttons', () => {
    const html = renderToStaticMarkup(
      <CospasSarsatStationForm
        open={true}
        mode="edit"
        editId="sarsat-01"
        initialData={mockRecord}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    expect(html).toContain('Chỉnh sửa đài Cospas-Sarsat');
    expect(html).toContain('Hủy');
    expect(html).toContain('Lưu tạm');
    expect(html).toContain('Lưu và gửi phê duyệt');
    expect(html).toContain('Lưu và phê duyệt');
  });
});
