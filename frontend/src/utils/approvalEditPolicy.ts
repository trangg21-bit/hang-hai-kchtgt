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
 * | APPROVED (Đã duyệt)                 | ✅      | `<resource>:update` hoặc `<resource>:approvec2` |
 * | ARCHIVED (Đã xóa)                   | ❌      | —                       |
 *
 * Vì sao cấm sửa khi đang chờ duyệt: nếu cho sửa, người nhập có thể đổi nội dung sau khi
 * cán bộ đã đọc, khiến cán bộ ký duyệt vào nội dung mình chưa từng xem — mất tính toàn vẹn
 * của vòng duyệt và mất trách nhiệm giải trình.
 *
 * Sửa hồ sơ "Đã duyệt": theo Backend @PreAuthorize("@auth.checkAny(authentication, '<res>:update', '<res>:approvec2')"),
 * cán bộ có quyền update hoặc quyền approvec2 đều được phép cập nhật. Thao tác này lưu lại lịch sử thay đổi
 * và giữ nguyên trạng thái APPROVED (quy tắc 12/T12).
 *
 * CẤM tự viết lại điều kiện này ở từng màn hình.
 */

import { usePermissionStore } from '../store/permissionStore';

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

export interface ApprovalEditPolicyOptions {
  /** Hàm kiểm tra quyền của màn hình, thường là `usePermissionStore.hasPermission`. */
  hasPerm?: (key: string) => boolean;
  /** Tiền tố resource của quyền, ví dụ `'vts'`, `'port'`, `'inmarsat'`. */
  resource?: string;
  /**
   * Các quyền được chấp nhận thay cho `<resource>:update` (quyền chung của hệ thống cũ),
   * ví dụ `['data:update', 'admin:manage']`.
   */
  extraUpdatePerms?: string[];
  /** Các quyền được chấp nhận thay cho `<resource>:approvec2`, ví dụ quyền C2 của domain dùng chung. */
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

  if (typeof optionsOrResource === 'string') {
    resource = optionsOrResource;
    hasPerm = legacyHasPerm;
  } else if (optionsOrResource && typeof optionsOrResource === 'object') {
    hasPerm = optionsOrResource.hasPerm;
    resource = optionsOrResource.resource || '';
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

  const extraUpdatePerms = (optionsOrResource && typeof optionsOrResource === 'object' && optionsOrResource.extraUpdatePerms) || [];

  // Điều kiện tiên quyết: BẮT BUỘC phải có quyền cập nhật (<resource>:update)
  // Khi người quản trị bỏ tích quyền cập nhật thì nút Chỉnh sửa phải ẩn 100% trên toàn bộ các dòng.
  const hasUpdatePerm = Boolean(resource) && (
    checkPerm(`${resource}:update`) || extraUpdatePerms.some((p) => checkPerm(p))
  );

  if (!hasUpdatePerm) {
    return false;
  }

  // Đã duyệt (APPROVED): cần đủ cả 2 quyền update và phê duyệt C2 (quy tắc 12/T12)
  // hoặc người dùng cấp Cục được phép chỉnh sửa hồ sơ đã duyệt qua allowEditApproved
  if (st === 'APPROVED') {
    const allowApproved = Boolean(
      optionsOrResource &&
      typeof optionsOrResource === 'object' &&
      optionsOrResource.allowEditApproved
    );
    if (allowApproved) {
      return true;
    }
    const hasApproveC2 =
      checkPerm(`${resource}:approvec2`) ||
      checkPerm(`${resource}:approve:c2`) ||
      checkPerm(`${resource}:approvel2`) ||
      checkPerm(`${resource}:approve_level2`);
    return Boolean(hasApproveC2);
  }

  // Lưu tạm / Bị trả về: đã có quyền update -> cho phép sửa
  if (isEditableByOwner(st)) {
    return true;
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

  if (typeof optionsOrResource === 'string') {
    resource = optionsOrResource;
    hasPerm = legacyHasPerm;
  } else if (optionsOrResource && typeof optionsOrResource === 'object') {
    hasPerm = optionsOrResource.hasPerm;
    resource = optionsOrResource.resource || '';
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
    // `admin:manage` chỉ là quyền quản trị chức năng, không phải bypass dữ
    // liệu nghiệp vụ. Chỉ `admin:all` mới tương ứng với wildcard của backend.
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

/**
 * Quyết định xem một bản ghi tài sản KCHT có được phép chỉnh sửa hay không.
 *
 * Quy chuẩn:
 * - KHÔNG ĐƯỢC CHỈNH SỬA: Record có trạng thái:
 *   + Đã xóa (ARCHIVED, DELETED, 7, 6...)
 *   + Chờ phê duyệt cấp Cục (APPROVED_LEVEL1, APPROVED_L1, 3...)
 *   + Chờ phê duyệt cấp Cảng vụ/Chi cục (PENDING_APPROVAL, PROPOSED, PENDING, 1, 2...)
 * - ĐƯỢC PHÉP CHỈNH SỬA: Tất cả các trạng thái còn lại:
 *   + Lưu tạm (DRAFT, 0)
 *   + Đã phê duyệt (APPROVED, APPROVED_LEVEL2, 4, 5)
 *   + Từ chối cấp Cảng vụ/Chi cục (REJECTED_LEVEL1, 8)
 *   + Từ chối cấp Cục (REJECTED_LEVEL2, 9)
 *   + Từ chối (REJECTED)
 */
export function isAssetRecordEditable(status: string | number | null | undefined): boolean {
  if (status === null || status === undefined) return true;
  const raw = String(status).trim();
  if (!raw) return true;
  const s = raw.toUpperCase();

  // 1. Đã xóa -> CẤM SỬA
  if (
    s === 'ARCHIVED' ||
    s === 'DELETED' ||
    s === '7' ||
    s === '6' ||
    s === 'ĐÃ XÓA' ||
    s === 'DA_XOA' ||
    s === 'DA XOA' ||
    s.includes('ĐÃ XÓA')
  ) {
    return false;
  }

  // 2. Chờ phê duyệt cấp Cục -> CẤM SỬA
  if (
    s === 'APPROVED_LEVEL1' ||
    s === 'APPROVED_L1' ||
    s === 'PENDING_APPROVAL_LEVEL2' ||
    s === 'PROPOSED_LEVEL2' ||
    s === 'CHO_PD_CAP_CUC' ||
    s === 'CHO_PHE_DUYET_CAP_CUC' ||
    s === 'SUBMITTED_DEPARTMENT' ||
    s === 'CHO_DUYET_CAP_2' ||
    s === '3' ||
    s.includes('CHỜ PHÊ DUYỆT CẤP CỤC') ||
    s.includes('CHO PHE DUYET CAP CUC') ||
    s.includes('CHỜ CỤC DUYỆT') ||
    s.includes('CHO CUC DUYET')
  ) {
    return false;
  }

  // 3. Chờ phê duyệt cấp Cảng vụ/Chi cục -> CẤM SỬA
  if (
    s === 'PENDING_APPROVAL' ||
    s === 'PENDING_APPROVAL_LEVEL1' ||
    s === 'PENDING' ||
    s === 'PROPOSED' ||
    s === 'CHO_PHE_DUYET' ||
    s === 'CHO_PHE_DUYET_CAP_CANG_VU' ||
    s === 'SUBMITTED_PORT_AUTHORITY' ||
    s === 'CHO_DUYET_CAP_1' ||
    s === '1' ||
    s === '2' ||
    s.includes('CHỜ PHÊ DUYỆT CẤP CẢNG VỤ') ||
    s.includes('CHO PHE DUYET CAP CANG VU') ||
    s.includes('CHỜ CẢNG VỤ') ||
    s.includes('CHO CANG VU') ||
    s.includes('CHỜ PHÊ DUYỆT CẤP CHI CỤC') ||
    s.includes('CHO PHE DUYET CAP CHI CUC') ||
    s.includes('CHỜ CHI CỤC')
  ) {
    return false;
  }

  return true;
}
