import React from 'react';
import { Button } from 'antd';
import {
  primaryButtonStyle,
  outlineButtonStyle,
  statusOperational,
} from '../../tokens';

export type FormSaveAction = 'draft' | 'submit' | 'approve';

export interface FormSaveFooterProps {
  /** Người dùng bấm nút nào — màn hình tự quyết định lưu rồi gửi duyệt / duyệt. */
  onAction: (action: FormSaveAction) => void;
  /** Nút đang chạy (hiện spinner); null = không nút nào đang chạy. */
  loadingAction?: FormSaveAction | null;
  /** Hiện nút "Lưu và gửi phê duyệt" — thường gắn quyền `<resource>:update`. */
  canSubmitForApproval?: boolean;
  /** Hiện nút "Lưu và phê duyệt" — chỉ bật khi tài khoản thực sự duyệt được (cấp Cục). */
  canApprove?: boolean;
  draftLabel?: string;
  submitLabel?: string;
  approveLabel?: string;
  /** Nút phụ đặt bên trái, ví dụ "Hủy" hoặc "Đóng". */
  extraLeft?: React.ReactNode;
  disabled?: boolean;
}

/**
 * Thanh nút lưu chuẩn ở chân form thêm/sửa hồ sơ KCHT.
 *
 * Bộ ba "Lưu tạm" / "Lưu và gửi phê duyệt" / "Lưu và phê duyệt" đang được chép tay
 * ở hơn 10 màn (cảng biển, bến cảng, cầu cảng, cảng cạn, đê kè, VTS, AIS, phao...),
 * mỗi nơi tự ghép `drawerFooterStyle` + `outlineButtonStyle` + `primaryButtonStyle`
 * + màu xanh lá `statusOperational`. Gom về đây để nhãn, thứ tự, màu và trạng thái
 * loading giống nhau ở mọi màn.
 */
export default function FormSaveFooter({
  onAction,
  loadingAction = null,
  canSubmitForApproval = false,
  canApprove = false,
  draftLabel = 'Lưu tạm',
  submitLabel = 'Lưu và gửi phê duyệt',
  approveLabel = 'Lưu và phê duyệt',
  extraLeft,
  disabled = false,
}: FormSaveFooterProps) {
  const busy = loadingAction !== null;

  // Không tự bọc `drawerFooterStyle`: AppDrawer đã bọc sẵn cho phần footer.
  // Màn nào còn dùng <Drawer> antd thô thì tự bọc bên ngoài.
  return (
    <>
      {extraLeft}
      <Button
        onClick={() => onAction('draft')}
        loading={loadingAction === 'draft'}
        disabled={disabled || (busy && loadingAction !== 'draft')}
        style={outlineButtonStyle}
      >
        {draftLabel}
      </Button>
      {canSubmitForApproval && (
        <Button
          type="primary"
          onClick={() => onAction('submit')}
          loading={loadingAction === 'submit'}
          disabled={disabled || (busy && loadingAction !== 'submit')}
          style={primaryButtonStyle}
        >
          {submitLabel}
        </Button>
      )}
      {canApprove && (
        <Button
          type="primary"
          onClick={() => onAction('approve')}
          loading={loadingAction === 'approve'}
          disabled={disabled || (busy && loadingAction !== 'approve')}
          style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}
        >
          {approveLabel}
        </Button>
      )}
    </>
  );
}
