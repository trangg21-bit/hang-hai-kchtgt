import React, { useCallback } from 'react';
import {
  useKchtPermissions,
  type KchtRecordLike,
  type UseKchtPermissionsOptions,
} from './useKchtPermissions';
import { icons } from '../themetokenchk';

export interface RowActionItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export interface UseKchtRowActionsHandlers<T extends KchtRecordLike = KchtRecordLike> {
  onDetail?: (record: T) => void;
  onEdit?: (record: T) => void;
  onDelete?: (record: T) => void;
  onSubmit?: (record: T) => void;
  onHistory?: (record: T) => void;
  /** Handler for Level 1 approval (or general approval in 1-level mode) */
  onApproveL1?: (record: T) => void;
  /** Handler for Level 2 approval */
  onApproveL2?: (record: T) => void;
  /** Optional shorthand for approval in 1-level mode (falls back to onApproveL1) */
  onApprove?: (record: T) => void;
  /** General rejection handler */
  onReject?: (record: T, level?: 'c1' | 'c2') => void;
  /** Specific Level 1 rejection handler */
  onRejectL1?: (record: T) => void;
  /** Specific Level 2 rejection handler */
  onRejectL2?: (record: T) => void;
  /** Optional custom extra actions */
  extraActions?: (record: T) => RowActionItem[];
}

export interface UseKchtRowActionsOptions<T extends KchtRecordLike = KchtRecordLike> {
  resource: string;
  approvalLevels?: 1 | 2;
  permissionOptions?: UseKchtPermissionsOptions;
  handlers: UseKchtRowActionsHandlers<T>;
  customLabels?: {
    detail?: string;
    edit?: string;
    history?: string;
    submit?: string;
    approveL1?: string;
    approveL2?: string;
    approve?: string;
    rejectL1?: string;
    rejectL2?: string;
    reject?: string;
    delete?: string;
  };
}

export function useKchtRowActions<T extends KchtRecordLike = KchtRecordLike>({
  resource,
  approvalLevels = 2,
  permissionOptions = {},
  handlers,
  customLabels = {},
}: UseKchtRowActionsOptions<T>) {
  const perms = useKchtPermissions(resource, {
    ...permissionOptions,
    approvalLevels,
  });

  const getRowActions = useCallback(
    (record: T): RowActionItem[] => {
      const actions: RowActionItem[] = [];

      // 1. Chi tiết (Detail)
      if (handlers.onDetail && perms.canRead) {
        actions.push({
          key: 'view',
          label: customLabels.detail || 'Xem chi tiết',
          icon: icons.view,
          onClick: () => handlers.onDetail!(record),
        });
      }

      // 2. Chỉnh sửa (Edit) - tuân thủ canEditApprovalRecord (Rule 11/12)
      if (handlers.onEdit && perms.canEdit(record)) {
        actions.push({
          key: 'edit',
          label: customLabels.edit || 'Chỉnh sửa',
          icon: icons.edit,
          onClick: () => handlers.onEdit!(record),
        });
      }

      // 3. Lịch sử (History)
      if (handlers.onHistory && perms.canViewHistory) {
        actions.push({
          key: 'history',
          label: customLabels.history || 'Lịch sử',
          icon: icons.history,
          onClick: () => handlers.onHistory!(record),
        });
      }

      // 4. Gửi phê duyệt (Submit) - chỉ DRAFT hoặc REJECTED
      if (handlers.onSubmit && perms.canSubmit(record)) {
        actions.push({
          key: 'submit',
          label: customLabels.submit || 'Gửi phê duyệt',
          icon: icons.submit,
          onClick: () => handlers.onSubmit!(record),
        });
      }

      // 5. Phê duyệt & Từ chối
      if (approvalLevels === 1) {
        // Quy trình 1 cấp:
        if (perms.canApproveL1(record)) {
          if (handlers.onApprove || handlers.onApproveL1) {
            actions.push({
              key: 'approve',
              label: customLabels.approve || 'Phê duyệt',
              icon: icons.approve,
              onClick: () => (handlers.onApprove || handlers.onApproveL1)!(record),
            });
          }
          if (handlers.onReject || handlers.onRejectL1) {
            actions.push({
              key: 'reject',
              label: customLabels.reject || 'Từ chối',
              icon: icons.reject,
              danger: true,
              onClick: () => {
                if (handlers.onRejectL1) handlers.onRejectL1(record);
                else if (handlers.onReject) handlers.onReject(record, 'c1');
              },
            });
          }
        }
      } else {
        // Quy trình 2 cấp (Mặc định):
        // Cấp 1 (Cảng vụ / Chi cục)
        if (perms.canApproveL1(record)) {
          if (handlers.onApproveL1) {
            actions.push({
              key: 'approveC1',
              label: customLabels.approveL1 || 'Phê duyệt cấp Cảng vụ/Chi cục',
              icon: icons.approve,
              onClick: () => handlers.onApproveL1!(record),
            });
          }
          if (handlers.onRejectL1 || handlers.onReject) {
            actions.push({
              key: 'rejectC1',
              label: customLabels.rejectL1 || 'Từ chối cấp Cảng vụ/Chi cục',
              icon: icons.reject,
              danger: true,
              onClick: () => {
                if (handlers.onRejectL1) handlers.onRejectL1(record);
                else if (handlers.onReject) handlers.onReject(record, 'c1');
              },
            });
          }
        }

        // Cấp 2 (Cục)
        if (perms.canApproveL2(record)) {
          if (handlers.onApproveL2) {
            actions.push({
              key: 'approveC2',
              label: customLabels.approveL2 || 'Phê duyệt cấp Cục',
              icon: icons.approve,
              onClick: () => handlers.onApproveL2!(record),
            });
          }
          if (handlers.onRejectL2 || handlers.onReject) {
            actions.push({
              key: 'rejectC2',
              label: customLabels.rejectL2 || 'Từ chối cấp Cục',
              icon: icons.reject,
              danger: true,
              onClick: () => {
                if (handlers.onRejectL2) handlers.onRejectL2(record);
                else if (handlers.onReject) handlers.onReject(record, 'c2');
              },
            });
          }
        }
      }

      // 6. Xóa (Delete) - chỉ DRAFT (Rule 11)
      if (handlers.onDelete && perms.canDelete(record)) {
        actions.push({
          key: 'delete',
          label: customLabels.delete || 'Xóa',
          icon: icons.delete,
          danger: true,
          onClick: () => handlers.onDelete!(record),
        });
      }

      // 7. Thao tác bổ sung riêng (nếu có)
      if (handlers.extraActions) {
        const extras = handlers.extraActions(record);
        if (extras && extras.length > 0) {
          actions.push(...extras);
        }
      }

      return actions;
    },
    [perms, approvalLevels, handlers, customLabels]
  );

  return {
    perms,
    rowActions: getRowActions,
  };
}

export default useKchtRowActions;
