import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore, type User } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import type { VtsOperationCenterResponse } from '../../types/vtsOperationCenter';
import { VtsOperationCenterForm } from './VtsOperationCenterForm';

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
  };
});

vi.mock('../../components/gis/GisLocationSelector', () => ({
  default: () => <div className="mock-gis-location-selector">GIS Selector</div>,
}));

vi.mock('../../components/shared/InfrastructureAttachmentTab', () => ({
  default: () => <div className="mock-attachment-tab">Attachment Tab</div>,
}));

vi.mock('../../services/vtsOperationCenterService', () => ({
  vtsOperationCenterService: {
    generateCode: vi.fn().mockResolvedValue('TTDH-001'),
    getById: vi.fn().mockResolvedValue({
      id: 'vts-op-1',
      code: 'TTDH-001',
      name: 'Trung tâm VTS Hải Phòng',
      coordinates: 'POINT (106.685678 20.841234)',
      geometryType: 'POINT',
    }),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../../services/portService', () => ({
  portCRUD: {
    list: vi.fn().mockResolvedValue({ items: [] }),
  },
}));

vi.mock('../../services/vtsSystemService', () => ({
  vtsSystemCRUD: {
    list: vi.fn().mockResolvedValue({ items: [] }),
  },
}));

vi.mock('../../services/symbolService', () => ({
  symbolService: {
    list: vi.fn().mockResolvedValue([]),
  },
}));

beforeEach(() => {
  const testUser: User = {
    id: 'u-admin',
    username: 'admin',
    fullName: 'Quản trị viên',
    role: 'ADMIN',
    status: 'ACTIVE',
    permissions: [
      'vtsoperationcenter:read',
      'vtsoperationcenter:create',
      'vtsoperationcenter:update',
      'vtsoperationcenter:delete',
      'vtsoperationcenter:save_and_approve',
    ],
  };
  useAuthStore.setState({
    user: testUser,
    isAuthenticated: true,
  });
  usePermissionStore.getState().setPermissions(testUser.permissions || []);
});

describe('VtsOperationCenterForm Component Render Test', () => {
  it('renders form in create mode without ReferenceError', () => {
    expect(() => {
      const html = renderToStaticMarkup(
        <VtsOperationCenterForm
          open={true}
          mode="create"
          orgUnits={[]}
          portOptions={[]}
          vtsSystemOptions={[]}
          symbols={[]}
        />,
      );
      expect(html).toContain('Trung tâm điều hành VTS');
      expect(html).toContain('Thông tin vị trí');
    }).not.toThrow();
  });

  it('renders form in edit mode without ReferenceError', () => {
    expect(() => {
      const html = renderToStaticMarkup(
        <VtsOperationCenterForm
          open={true}
          mode="edit"
          editId="vts-op-1"
          initialData={{
            id: 'vts-op-1',
            code: 'TTDH-001',
            name: 'Trung tâm VTS Hải Phòng',
            coordinates: 'POINT (106.685678 20.841234)',
            geometryType: 'POINT',
          } as unknown as VtsOperationCenterResponse}
          orgUnits={[]}
          portOptions={[]}
          vtsSystemOptions={[]}
          symbols={[]}
        />,
      );
      expect(html).toContain('Chỉnh sửa thông tin');
      expect(html).toContain('Thông tin vị trí');
    }).not.toThrow();
  });
});
