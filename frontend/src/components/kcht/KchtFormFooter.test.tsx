import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useAuthStore, type User } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { KchtFormFooter } from './KchtFormFooter';

describe('KchtFormFooter Component Tests', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        userId: 'u1',
        username: 'test_user',
        unitType: 'CVHH',
        permissions: [],
      } as User,
    });
    usePermissionStore.setState({ permissions: [] });
  });

  it('renders nothing in detail mode', () => {
    const html = renderToStaticMarkup(
      <KchtFormFooter
        mode="detail"
        resource="vts"
        onSubmit={vi.fn()}
      />
    );
    expect(html).toBe('');
  });

  describe('Create Mode', () => {
    it('renders "Lưu tạm" and "Lưu và gửi phê duyệt" when user has create permission', () => {
      usePermissionStore.setState({ permissions: ['vts:create'] });

      const html = renderToStaticMarkup(
        <KchtFormFooter
          mode="create"
          resource="vts"
          onSubmit={vi.fn()}
        />
      );

      expect(html).toContain('Lưu tạm');
      expect(html).toContain('Lưu và gửi phê duyệt');
      // User doesn't have approve permission -> should not render "Lưu và phê duyệt"
      expect(html).not.toContain('Lưu và phê duyệt');
    });

    it('renders all 3 buttons for a Cục user with create AND approvec2 permissions', () => {
      useAuthStore.setState({
        user: {
          id: 'u-cuc',
          userId: 'u-cuc',
          username: 'cuc_approver',
          unitType: 'CUC',
          permissions: ['vts:create', 'vts:approvec2'],
        } as User,
      });
      usePermissionStore.setState({ permissions: ['vts:create', 'vts:approvec2'] });

      const html = renderToStaticMarkup(
        <KchtFormFooter
          mode="create"
          resource="vts"
          onSubmit={vi.fn()}
        />
      );

      expect(html).toContain('Lưu tạm');
      expect(html).toContain('Lưu và gửi phê duyệt');
      expect(html).toContain('Lưu và phê duyệt');
    });

    it('does not render direct approval with only approvec1 permission', () => {
      usePermissionStore.setState({ permissions: ['vts:create', 'vts:approvec1'] });

      const html = renderToStaticMarkup(
        <KchtFormFooter
          mode="create"
          resource="vts"
          onSubmit={vi.fn()}
        />
      );

      expect(html).not.toContain('Lưu và phê duyệt');
    });

    it('does not render VTS direct approval from an Operation Center VTS C2 permission', () => {
      useAuthStore.setState({
        user: {
          id: 'operation-center-c2',
          userId: 'operation-center-c2',
          username: 'operation_center_c2',
          unitType: 'MINISTRY',
          orgUnitId: '00000000-0000-0000-0000-000000000017',
          orgUnitCode: 'G17',
          permissions: ['vts:create', 'vtsoperationcenter:approvec2'],
        } as User,
      });
      usePermissionStore.setState({ permissions: ['vts:create', 'vtsoperationcenter:approvec2'] });

      const html = renderToStaticMarkup(
        <KchtFormFooter mode="create" resource="vts" onSubmit={vi.fn()} />,
      );

      expect(html).not.toContain('Lưu và phê duyệt');
    });

    it('does not render direct approval for central Admin without explicit C2', () => {
      useAuthStore.setState({
        user: {
          id: 'admin-cuc',
          userId: 'admin-cuc',
          username: 'admin_trung_uong',
          unitType: 'MINISTRY',
          orgUnitId: '00000000-0000-0000-0000-000000000017',
          orgUnitCode: 'G17',
          permissions: ['vts:create', 'admin:all'],
        } as User,
      });
      usePermissionStore.setState({ permissions: ['vts:create', 'admin:all'] });

      const html = renderToStaticMarkup(
        <KchtFormFooter
          mode="create"
          resource="vts"
          onSubmit={vi.fn()}
        />
      );

      expect(html).not.toContain('Lưu và phê duyệt');
    });

    it('renders direct approval for central Admin with explicit C2', () => {
      useAuthStore.setState({
        user: {
          id: 'admin-root',
          userId: 'admin-root',
          username: 'admin_trung_uong',
          unitType: 'MINISTRY',
          orgUnitId: '00000000-0000-0000-0000-000000000017',
          orgUnitCode: 'G17',
          permissions: ['vts:create', 'vts:approvec2', 'admin:all'],
        } as User,
      });
      usePermissionStore.setState({ permissions: ['vts:create', 'vts:approvec2', 'admin:all'] });

      const html = renderToStaticMarkup(
        <KchtFormFooter
          mode="create"
          resource="vts"
          onSubmit={vi.fn()}
        />
      );

      expect(html).toContain('Lưu và phê duyệt');
    });

    it('renders Cancel button when showCancelButton is true', () => {
      usePermissionStore.setState({ permissions: ['vts:create'] });

      const html = renderToStaticMarkup(
        <KchtFormFooter
          mode="create"
          resource="vts"
          showCancelButton={true}
          onCancel={vi.fn()}
          onSubmit={vi.fn()}
        />
      );

      expect(html).toContain('Hủy');
      expect(html).toContain('Lưu tạm');
    });
  });

  describe('Edit Mode', () => {
    it('renders "Lưu tạm" and "Lưu và gửi phê duyệt" for DRAFT record with update permission', () => {
      usePermissionStore.setState({ permissions: ['vts:update'] });

      const draftRecord = { id: 'vts-1', approvalStatus: 'DRAFT' };
      const html = renderToStaticMarkup(
        <KchtFormFooter
          mode="edit"
          resource="vts"
          record={draftRecord}
          onSubmit={vi.fn()}
        />
      );

      expect(html).toContain('Lưu tạm');
      expect(html).toContain('Lưu và gửi phê duyệt');
      expect(html).toContain('Cập nhật');
      expect(html).not.toContain('Lưu và phê duyệt');
    });

    it('renders "Lưu và phê duyệt" for APPROVED record when user has update and approvec2 permissions', () => {
      useAuthStore.setState({
        user: {
          id: 'u-cuc',
          userId: 'u-cuc',
          username: 'cuc_approver',
          unitType: 'CUC',
          orgUnitId: 'cuc-root',
          permissions: ['vts:update', 'vts:approvec2'],
        } as User,
      });
      usePermissionStore.setState({ permissions: ['vts:update', 'vts:approvec2'] });

      const approvedRecord = { id: 'vts-2', approvalStatus: 'APPROVED' };
      const html = renderToStaticMarkup(
        <KchtFormFooter
          mode="edit"
          resource="vts"
          record={approvedRecord}
          onSubmit={vi.fn()}
        />
      );

      expect(html).not.toContain('Lưu tạm');
      expect(html).not.toContain('Lưu và gửi phê duyệt');
      expect(html).toContain('Lưu và phê duyệt');
    });

    it('hides edit buttons on APPROVED record for user without approve permission', () => {
      usePermissionStore.setState({ permissions: ['vts:update'] });

      const approvedRecord = { id: 'vts-3', approvalStatus: 'APPROVED' };
      const html = renderToStaticMarkup(
        <KchtFormFooter
          mode="edit"
          resource="vts"
          record={approvedRecord}
          onSubmit={vi.fn()}
        />
      );

      // Cannot edit approved record without approve permission
      expect(html).not.toContain('Lưu và phê duyệt');
      expect(html).not.toContain('Cập nhật');
    });
  });
});
