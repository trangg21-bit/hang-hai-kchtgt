import {
  actionPrimary,
  radiusPill,
  statusAttention,
  statusCritical,
  statusDraft,
  statusOperational,
} from '../../../themetokenchk';
import { APPROVAL_MAP } from './status-map.constants';

/**
 * Hàm giải mã thông tin trạng thái phê duyệt có cơ chế Defensive Translation:
 * Đảm bảo 100% không bao giờ hiển thị từ tiếng Anh như PENDING, APPROVED, REJECTED,...
 */
export const getApprovalStatusInfo = (
  status?: string | null
): { label: string; color: string } => {
  if (!status) {
    return { label: '—', color: statusDraft };
  }
  const clean = String(status).trim();
  const upper = clean.toUpperCase();

  // 1. Khớp từ điển chuẩn
  if (APPROVAL_MAP[upper]) {
    return APPROVAL_MAP[upper];
  }
  if (APPROVAL_MAP[clean]) {
    return APPROVAL_MAP[clean];
  }

  // 2. Cơ chế ánh xạ mở rộng an toàn (Defensive Fallback)
  if (
    upper === 'PENDING' ||
    upper === 'WAITING' ||
    upper === 'SUBMITTED' ||
    upper === 'PROPOSED' ||
    upper === 'CHO_DUYET' ||
    upper === 'CHODUYET' ||
    upper === '1'
  ) {
    return { label: 'Chờ phê duyệt', color: actionPrimary };
  }
  if (
    upper === 'PENDING_APPROVAL' ||
    upper === 'PENDING_LEVEL1' ||
    upper === 'CHO_PHE_DUYET' ||
    upper === 'CHO_DUYET_CAP_1'
  ) {
    return { label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: actionPrimary };
  }
  if (
    upper === 'APPROVED_LEVEL1' ||
    upper === 'PENDING_LEVEL2' ||
    upper === 'CHO_DUYET_CAP_2' ||
    upper === 'CHO_PHE_DUYET_CAP_CUC'
  ) {
    return { label: 'Chờ phê duyệt cấp Cục', color: statusAttention };
  }
  if (
    upper === 'APPROVED' ||
    upper === 'APPROVED_LEVEL2' ||
    upper === 'DA_DUYET' ||
    upper === 'DA_PHE_DUYET' ||
    upper === '2' ||
    upper === 'COMPLETED'
  ) {
    return { label: 'Đã phê duyệt', color: statusOperational };
  }
  if (
    upper === 'REJECTED' ||
    upper === 'TU_CHOI' ||
    upper === 'TUCHOI' ||
    upper === 'CANCELLED' ||
    upper === '3'
  ) {
    return { label: 'Từ chối', color: statusCritical };
  }
  if (upper === 'REJECTED_LEVEL1' || upper === 'TU_CHOI_CAP_1') {
    return { label: 'Từ chối cấp Cảng vụ/Chi cục', color: statusCritical };
  }
  if (upper === 'REJECTED_LEVEL2' || upper === 'TU_CHOI_CAP_2') {
    return { label: 'Từ chối cấp Cục', color: statusCritical };
  }
  if (upper === 'DRAFT' || upper === 'NHAP' || upper === 'LUU_TAM' || upper === '0') {
    return { label: 'Lưu tạm', color: statusDraft };
  }
  if (upper === 'ARCHIVED' || upper === 'DELETED' || upper === 'DA_XOA') {
    return { label: 'Đã xóa', color: statusCritical };
  }

  // Khớp theo từ khóa
  if (upper.includes('PENDING') || upper.includes('CHO') || upper.includes('CHỜ')) {
    if (
      upper.includes('CHI CỤC') ||
      upper.includes('CHI CUC') ||
      upper.includes('CẢNG VỤ') ||
      upper.includes('CANG VU') ||
      upper.includes('CAP 1') ||
      upper.includes('CẤP 1') ||
      upper.includes('LEVEL1') ||
      upper.includes('LEVEL 1')
    ) {
      return { label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: actionPrimary };
    }
    return {
      label: upper.includes('CỤC') || upper.includes('CUC') ? 'Chờ phê duyệt cấp Cục' : 'Chờ phê duyệt',
      color: upper.includes('CỤC') || upper.includes('CUC') ? statusAttention : actionPrimary,
    };
  }
  if (upper.includes('APPROV') || upper.includes('DUYỆT') || upper.includes('DUYET')) {
    return { label: 'Đã phê duyệt', color: statusOperational };
  }
  if (upper.includes('REJECT') || upper.includes('TỪ CHỐI') || upper.includes('TU CHOI')) {
    return { label: 'Từ chối', color: statusCritical };
  }
  if (upper.includes('DRAFT') || upper.includes('NHÁP') || upper.includes('NHAP') || upper.includes('LƯU TẠM') || upper.includes('LUU TAM')) {
    return { label: 'Lưu tạm', color: statusDraft };
  }

  return {
    color: statusDraft,
    label: clean,
  };
};

/**
 * Helper render badge trạng thái phê duyệt chuẩn hệ thống Hàng hải KCHTGT
 */
export const renderApprovalStatusBadge = (status?: string | null) => {
  if (!status) {
    return <span>—</span>;
  }
  const statusInfo = getApprovalStatusInfo(status);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 10px',
        borderRadius: radiusPill,
        fontSize: 13,
        fontWeight: 500,
        background: `${statusInfo.color}18`,
        border: `1px solid ${statusInfo.color}50`,
        color: statusInfo.color,
        whiteSpace: 'nowrap',
        lineHeight: '18px',
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          backgroundColor: statusInfo.color,
          flexShrink: 0,
        }}
      />
      {statusInfo.label}
    </span>
  );
};
