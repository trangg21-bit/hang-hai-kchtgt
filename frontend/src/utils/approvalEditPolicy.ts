/**
 * Quy tắc 12 — Quyền chỉnh sửa hồ sơ KCHT theo trạng thái phê duyệt.
 *
 * Nguồn có thẩm quyền: `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (bảng chuyển trạng thái mục 7
 * + Ca dùng 8), chuẩn hóa tại `docs/conventions/approval-2-level-spec.md` mục 3.9.
 *
 * | Trạng thái                          | Cho sửa | Quyền cần có            |
 * |-------------------------------------|---------|-------------------------|
 * | DRAFT (Lưu tạm)                     | ✅      | `<resource>:update`     |
 * | PENDING_APPROVAL (Chờ Cảng vụ duyệt)| ❌      | —                       |
 * | APPROVED_LEVEL1 (Chờ Cục duyệt)     | ❌      | —                       |
 * | REJECTED_LEVEL1 (Bị Cảng vụ trả về) | ✅      | `<resource>:update`     |
 * | REJECTED_LEVEL2 (Bị Cục trả về)     | ✅      | `<resource>:update`     |
 * | APPROVED (Đã duyệt)                 | ✅      | `<resource>:approvec2`  |
 * | ARCHIVED (Đã xóa)                   | ❌      | —                       |
 *
 * Vì sao cấm sửa khi đang chờ duyệt: nếu cho sửa, người nhập có thể đổi nội dung sau khi
 * cán bộ đã đọc, khiến cán bộ ký duyệt vào nội dung mình chưa từng xem — mất tính toàn vẹn
 * của vòng duyệt và mất trách nhiệm giải trình.
 *
 * Vì sao sửa hồ sơ "Đã duyệt" cần quyền phê duyệt: theo T12, thao tác này là
 * "Lưu và phê duyệt" — hồ sơ giữ nguyên `APPROVED`, bản cũ ghi vào nhật ký thay đổi.
 * Người không có thẩm quyền duyệt không được tự ý đổi nội dung đã có hiệu lực.
 *
 * CẤM tự viết lại điều kiện này ở từng màn hình.
 */

/** Các mã trạng thái legacy còn sót trong dữ liệu cũ, ánh xạ về 7 trạng thái chuẩn. */
const STATUS_ALIASES: Record<string, string> = {
  // Lưu tạm
  NHAP: 'DRAFT',
  PROPOSED: 'DRAFT',
  // Chờ Cảng vụ/Chi cục duyệt
  PENDING: 'PENDING_APPROVAL',
  CHO_PHE_DUYET: 'PENDING_APPROVAL',
  // Chờ Cục duyệt
  APPROVED_L1: 'APPROVED_LEVEL1',
  CHO_PD_CAP_CUC: 'APPROVED_LEVEL1',
  // Đã duyệt
  APPROVED_L2: 'APPROVED',
  APPROVED_LEVEL2: 'APPROVED',
  PUBLISHED: 'APPROVED',
  DA_PHE_DUYET: 'APPROVED',
  DUOC_PHE_DUYET: 'APPROVED',
  // Bị trả về
  REJECTED: 'REJECTED_LEVEL1',
  TU_CHOI: 'REJECTED_LEVEL1',
  // Đã xóa
  DELETED: 'ARCHIVED',
};

/** Chuẩn hóa mã trạng thái về 1 trong 7 trạng thái chuẩn. */
export function normalizeApprovalStatus(status?: string | null): string {
  if (!status) return 'DRAFT';
  const key = String(status).toUpperCase();
  return STATUS_ALIASES[key] || key;
}

/** Hồ sơ đang nằm trong vòng phê duyệt — nội dung bị đóng băng. */
export function isAwaitingApproval(status?: string | null): boolean {
  const st = normalizeApprovalStatus(status);
  return st === 'PENDING_APPROVAL' || st === 'APPROVED_LEVEL1';
}

/** Hồ sơ đã có hiệu lực — sửa phải đi qua "Lưu và phê duyệt" (T12). */
export function isApprovedRecord(status?: string | null): boolean {
  return normalizeApprovalStatus(status) === 'APPROVED';
}

/** Hồ sơ đang ở trạng thái người nhập được tự do sửa. */
export function isEditableByOwner(status?: string | null): boolean {
  const st = normalizeApprovalStatus(status);
  return st === 'DRAFT' || st === 'REJECTED_LEVEL1' || st === 'REJECTED_LEVEL2';
}

import { usePermissionStore } from '../store/permissionStore';

export interface ApprovalEditPolicyOptions {
  /** Hàm kiểm tra quyền của màn hình, thường là `usePermissionStore.hasPermission`. */
  hasPerm?: (key: string) => boolean;
  /** Tiền tố resource của quyền, ví dụ `'vts'`, `'port'`, `'coastalstationinmarsat'`. */
  resource?: string;
  /**
   * Các quyền được chấp nhận thay cho `<resource>:update` (quyền chung của hệ thống cũ),
   * ví dụ `['data:update', 'admin:manage']`.
   */
  extraUpdatePerms?: string[];
  /** Các quyền được chấp nhận thay cho `<resource>:approvec2`, ví dụ `['<resource>:approve']`. */
  extraApprovePerms?: string[];
  /** Tuỳ chọn legacy để tương thích */
  userUnitType?: string;
  allowEditApproved?: boolean;
  allowEditLevel1Approved?: boolean;
}

/**
 * Quyết định có hiện nút "Chỉnh sửa" cho một bản ghi hay không.
 *
 * @param status Trạng thái phê duyệt của bản ghi (chấp nhận cả mã legacy).
 */
export function canEditApprovalRecord(
  status: string | number | null | undefined,
  optionsOrResource?: ApprovalEditPolicyOptions | string,
  legacyHasPerm?: (key: string) => boolean,
): boolean {
  const st = normalizeApprovalStatus(status != null ? String(status) : null);

  // Đang trong vòng duyệt hoặc đã xóa mềm: đóng băng, không ai sửa được.
  if (st === 'PENDING_APPROVAL' || st === 'APPROVED_LEVEL1' || st === 'ARCHIVED') {
    return false;
  }

  let hasPerm: ((key: string) => boolean) | undefined;
  let resource = '';
  let extraUpdatePerms: string[] = [];
  let extraApprovePerms: string[] = [];

  if (typeof optionsOrResource === 'string') {
    resource = optionsOrResource;
    hasPerm = legacyHasPerm;
  } else if (optionsOrResource && typeof optionsOrResource === 'object') {
    hasPerm = optionsOrResource.hasPerm;
    resource = optionsOrResource.resource || '';
    extraUpdatePerms = optionsOrResource.extraUpdatePerms || [];
    extraApprovePerms = optionsOrResource.extraApprovePerms || [];
  }

  if (typeof hasPerm !== 'function') {
    hasPerm = usePermissionStore.getState().hasPermission;
  }

  const checkPerm = (p: string) => {
    try {
      return Boolean(hasPerm!(p));
    } catch {
      return false;
    }
  };

  // Đã duyệt: chỉ người có thẩm quyền phê duyệt, sửa qua "Lưu và phê duyệt" (T12).
  if (st === 'APPROVED') {
    const perms = [
      ...(resource ? [`${resource}:approvec2`, `${resource}:approve`] : []),
      ...extraApprovePerms,
      'admin:all',
    ];
    return perms.some(checkPerm);
  }

  // Lưu tạm / Bị trả về: người nhập sửa được nếu có quyền cập nhật.
  if (isEditableByOwner(st)) {
    const perms = [
      ...(resource ? [`${resource}:update`, `${resource}:write`] : []),
      ...extraUpdatePerms,
      'data:update',
      'admin:all',
    ];
    return perms.some(checkPerm);
  }

  // Trạng thái lạ: mặc định an toàn là không cho sửa.
  return false;
}

export interface ApprovalDeletePolicyOptions {
  /** Hàm kiểm tra quyền của màn hình, thường là `usePermissionStore.hasPermission`. */
  hasPerm?: (key: string) => boolean;
  /** Tiền tố resource của quyền, ví dụ `'navigationchannel'`, `'port'`. */
  resource?: string;
  /** Các quyền được chấp nhận thay cho `<resource>:delete`, ví dụ `['admin:manage']`. */
  extraDeletePerms?: string[];
  /** Tuỳ chọn legacy */
  userUnitType?: string;
  allowDeleteApproved?: boolean;
}

/**
 * Quyết định có hiện nút "Xóa" cho một bản ghi hay không — quy tắc 11.
 *
 * Nguồn: `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` Ca dùng 9 ("Xóa hồ sơ nháp", điều kiện trước:
 * hồ sơ đang "Lưu tạm") + bảng chuyển trạng thái mục 7 (chỉ có dòng `Lưu tạm → Xóa`);
 * chuẩn hóa tại `docs/conventions/approval-2-level-spec.md` mục 3.6.
 *
 * Chỉ hồ sơ **Lưu tạm** mới xóa được. Hồ sơ đã qua 2 cấp ký và đang có hiệu lực thì không
 * xóa — cho xóa chỉ với quyền `delete` sẽ nhẹ hơn cả sửa nó (quy tắc 12 đòi `approvec2`).
 * Hồ sơ hết giá trị sử dụng thì đổi **tình trạng hoạt động**, không xóa.
 *
 * CẤM tự viết lại điều kiện này ở từng màn hình.
 */
export function canDeleteApprovalRecord(
  status: string | number | null | undefined,
  optionsOrResource?: ApprovalDeletePolicyOptions | string,
  legacyHasPerm?: (key: string) => boolean,
): boolean {
  if (normalizeApprovalStatus(status != null ? String(status) : null) !== 'DRAFT') {
    return false;
  }

  let hasPerm: ((key: string) => boolean) | undefined;
  let resource = '';
  let extraDeletePerms: string[] = [];

  if (typeof optionsOrResource === 'string') {
    resource = optionsOrResource;
    hasPerm = legacyHasPerm;
  } else if (optionsOrResource && typeof optionsOrResource === 'object') {
    hasPerm = optionsOrResource.hasPerm;
    resource = optionsOrResource.resource || '';
    extraDeletePerms = optionsOrResource.extraDeletePerms || [];
  }

  if (typeof hasPerm !== 'function') {
    hasPerm = usePermissionStore.getState().hasPermission;
  }

  const checkPerm = (p: string) => {
    try {
      return Boolean(hasPerm!(p));
    } catch {
      return false;
    }
  };

  const perms = [
    ...(resource ? [`${resource}:delete`] : []),
    ...extraDeletePerms,
    'data:delete',
    'admin:all',
  ];
  return perms.some(checkPerm);
}

/**
 * Chế độ chân form khi mở drawer/modal ở chế độ sửa.
 * - `'approve'`: hồ sơ Đã duyệt → chỉ 2 nút `Hủy` · `Lưu và phê duyệt` (giữ nguyên APPROVED).
 * - `'draft'`  : hồ sơ Lưu tạm/Bị trả về → 3 nút `Hủy` · `Lưu tạm` · `Lưu và gửi phê duyệt`.
 */
export function editFooterMode(status?: string | null): 'approve' | 'draft' {
  return isApprovedRecord(status) ? 'approve' : 'draft';
}

