import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useAuthStore } from '../store/authStore';
import { usePermissionStore } from '../store/permissionStore';
import { useKchtRowActions, type UseKchtRowActionsOptions } from './useKchtRowActions';
import type { KchtRecordLike } from './useKchtPermissions';

function renderRowActionsHook<T extends KchtRecordLike>(options: UseKchtRowActionsOptions<T>) {
  let hookResult: ReturnType<typeof useKchtRowActions<T>> | undefined;
  function TestComponent() {
    hookResult = useKchtRowActions<T>(options);
    return null;
  }
  renderToStaticMarkup(React.createElement(TestComponent));
  if (!hookResult) {
    throw new Error('Hook failed to execute');
  }
  return hookResult;
}

describe('useKchtRowActions Unit Tests', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        userId: 'u1',
        username: 'normal_user',
        unitType: 'CVHH',
        permissions: [],
      } as any,
    });
    usePermissionStore.setState({ permissions: [] });
  });

  it('generates 2-level approval row actions when user has full permissions', () => {
    usePermissionStore.setState({
      permissions: [
        'vts:read',
        'vts:update',
        'vts:history',
        'vts:delete',
        'vts:approvec1',
        'vts:approvec2',
      ],
    });

    const handlers = {
      onDetail: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
      onSubmit: vi.fn(),
      onHistory: vi.fn(),
      onApproveL1: vi.fn(),
      onApproveL2: vi.fn(),
      onReject: vi.fn(),
    };

    const { rowActions } = renderRowActionsHook({
      resource: 'vts',
      approvalLevels: 2,
      handlers,
    });

    // 1. DRAFT record created by someone else:
    // Should have: view, edit, history, submit, delete
    const draftRec = { id: 'd1', createdBy: 'other', approvalStatus: 'DRAFT' };
    const draftActions = rowActions(draftRec);
    const draftKeys = draftActions.map((a) => a.key);
    expect(draftKeys).toEqual(['view', 'edit', 'history', 'submit', 'delete']);

    // 2. PENDING_APPROVAL record created by someone else:
    // Should have: view, history, approveC1, rejectC1
    // (no delete because not draft; no edit because pending approval)
    const pendingRec = { id: 'p1', createdBy: 'other', approvalStatus: 'PENDING_APPROVAL' };
    const pendingActions = rowActions(pendingRec);
    const pendingKeys = pendingActions.map((a) => a.key);
    expect(pendingKeys).toEqual(['view', 'history', 'approveC1', 'rejectC1']);

    // 3. APPROVED_LEVEL1 record approved by someone else:
    // Should have: view, history, approveC2, rejectC2
    const l1Rec = { id: 'l1', createdBy: 'other', approverLevel1: 'other_approver', approvalStatus: 'APPROVED_LEVEL1' };
    const l1Actions = rowActions(l1Rec);
    const l1Keys = l1Actions.map((a) => a.key);
    expect(l1Keys).toEqual(['view', 'history', 'approveC2', 'rejectC2']);
  });

  it('generates single "Phê duyệt" / "Từ chối" action in 1-level approval mode', () => {
    usePermissionStore.setState({
      permissions: ['beacon:read', 'beacon:approve'],
    });

    const handlers = {
      onDetail: vi.fn(),
      onApprove: vi.fn(),
      onReject: vi.fn(),
    };

    const { rowActions } = renderRowActionsHook({
      resource: 'beacon',
      approvalLevels: 1,
      handlers,
    });

    const pendingRec = { id: 'b1', createdBy: 'other', approvalStatus: 'PENDING_APPROVAL' };
    const actions = rowActions(pendingRec);
    const actionKeys = actions.map((a) => a.key);

    expect(actionKeys).toEqual(['view', 'approve', 'reject']);
    const approveBtn = actions.find((a) => a.key === 'approve');
    const rejectBtn = actions.find((a) => a.key === 'reject');
    expect(approveBtn?.label).toBe('Phê duyệt');
    expect(rejectBtn?.label).toBe('Từ chối');
    expect(rejectBtn?.danger).toBe(true);
  });

  it('appends extraActions when provided', () => {
    usePermissionStore.setState({ permissions: ['vts:read'] });

    const handlers = {
      onDetail: vi.fn(),
      extraActions: (rec: KchtRecordLike) => [
        {
          key: 'custom-export',
          label: `Xuất file ${rec.id}`,
          onClick: vi.fn(),
        },
      ],
    };

    const { rowActions } = renderRowActionsHook({
      resource: 'vts',
      handlers,
    });

    const actions = rowActions({ id: 'vts-99', approvalStatus: 'APPROVED' });
    expect(actions.some((a) => a.key === 'custom-export')).toBe(true);
    expect(actions.find((a) => a.key === 'custom-export')?.label).toBe('Xuất file vts-99');
  });
});
