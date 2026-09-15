import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useAuthStore } from '../../store/authStore';
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
      } as any,
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

    it('renders all 3 buttons when user has create AND approve permissions', () => {
      usePermissionStore.setState({ permissions: ['vts:create', 'vts:approve'] });

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

    it('renders "Lưu và phê duyệt" for APPROVED record when user has approvec2 permission', () => {
      usePermissionStore.setState({ permissions: ['vts:approvec2'] });

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
