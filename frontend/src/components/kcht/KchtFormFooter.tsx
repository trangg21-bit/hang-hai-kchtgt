import React from 'react';
import { Button } from 'antd';
import {
  useKchtPermissions,
  type KchtRecordLike,
  type UseKchtPermissionsOptions,
} from '../../hooks/useKchtPermissions';
import { normalizeApprovalStatus } from '../../utils/approvalEditPolicy';
import {
  primaryButtonStyle,
  outlineButtonStyle,
  radiusPill,
  statusOperational,
} from '../../themetokenchk';

export type KchtFormActionType = 'draft' | 'submit' | 'approve' | 'update';

export interface KchtFormFooterProps {
  mode: 'create' | 'edit' | 'detail';
  resource: string;
  record?: KchtRecordLike | null;
  loading?: boolean;
  activeAction?: KchtFormActionType | null;
  onSubmit: (actionType: KchtFormActionType) => void;
  onCancel?: () => void;
  options?: UseKchtPermissionsOptions;
  cancelText?: string;
  showCancelButton?: boolean;
}

export const KchtFormFooter: React.FC<KchtFormFooterProps> = ({
  mode,
  resource,
  record,
  loading = false,
  activeAction = null,
  onSubmit,
  onCancel,
  options = {},
  cancelText = 'Hủy',
  showCancelButton = false,
}) => {
  const perms = useKchtPermissions(resource, options);

  if (mode === 'detail') {
    return null;
  }

  const isCreateMode = mode === 'create';
  const st = normalizeApprovalStatus(record?.approvalStatus);
  const isDraftOrRejected =
    !st ||
    st === 'DRAFT' ||
    st === 'REJECTED_LEVEL1' ||
    st === 'REJECTED_LEVEL2' ||
    st === 'REJECTED';

  const canEditRecord = perms.canEdit(record);
  // Direct approval is not a substitute for the two-level approval actions.
  // Pending records must be handled from their approval action, not this form.
  const canDirectApproveCurrentRecord =
    perms.canSaveAndApprove &&
    (isDraftOrRejected || st === 'APPROVED' || st === 'APPROVED_LEVEL2');

  return (
    <>
      {showCancelButton && onCancel && (
        <Button
          onClick={onCancel}
          disabled={loading}
          style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }}
        >
          {cancelText}
        </Button>
      )}

      {isCreateMode ? (
        <>
          {perms.canCreate && (
            <>
              <Button
                onClick={() => onSubmit('draft')}
                loading={loading && activeAction === 'draft'}
                disabled={loading && activeAction !== 'draft'}
                style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }}
              >
                Lưu tạm
              </Button>
              <Button
                type="primary"
                onClick={() => onSubmit('submit')}
                loading={loading && activeAction === 'submit'}
                disabled={loading && activeAction !== 'submit'}
                style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}
              >
                Lưu và gửi phê duyệt
              </Button>
            </>
          )}
          {perms.canCreate && perms.canSaveAndApprove && (
            <Button
              type="primary"
              onClick={() => onSubmit('approve')}
              loading={loading && activeAction === 'approve'}
              disabled={loading && activeAction !== 'approve'}
              style={{
                ...primaryButtonStyle,
                background: statusOperational,
                borderColor: statusOperational,
                borderRadius: radiusPill,
                height: 40,
              }}
            >
              Lưu và phê duyệt
            </Button>
          )}
        </>
      ) : (
        <>
          {canEditRecord && isDraftOrRejected && (
            <>
              <Button
                onClick={() => onSubmit('draft')}
                loading={loading && activeAction === 'draft'}
                disabled={loading && activeAction !== 'draft'}
                style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }}
              >
                Lưu tạm
              </Button>
              <Button
                type="primary"
                onClick={() => onSubmit('submit')}
                loading={loading && activeAction === 'submit'}
                disabled={loading && activeAction !== 'submit'}
                style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}
              >
                Lưu và gửi phê duyệt
              </Button>
            </>
          )}
          {canDirectApproveCurrentRecord ? (
            <Button
              type="primary"
              onClick={() => onSubmit('approve')}
              loading={loading && activeAction === 'approve'}
              disabled={loading && activeAction !== 'approve'}
              style={{
                ...primaryButtonStyle,
                background: statusOperational,
                borderColor: statusOperational,
                borderRadius: radiusPill,
                height: 40,
              }}
            >
              Lưu và phê duyệt
            </Button>
          ) : canEditRecord ? (
            <Button
              type="primary"
              onClick={() => onSubmit('update')}
              loading={loading && activeAction === 'update'}
              disabled={loading && activeAction !== 'update'}
              style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}
            >
              Cập nhật
            </Button>
          ) : null}
        </>
      )}
    </>
  );
};

export default KchtFormFooter;
