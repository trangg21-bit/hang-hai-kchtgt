import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore, type User } from '../../store/authStore';
import { organizationService, type Organization } from '../../services/organizationService';
import type { OrgUnitTreeOption } from './OrgUnitTreeSelect';
import { buildOrgUnitTreeData, resolveOrgLevel2Name } from './OrgUnitTreeSelect';

export const MINISTRY_ROOT_ID = '00000000-0000-0000-0000-000000000017';
export const MINISTRY_ROOT_CODE = 'G17';

/**
 * Lấy giá trị ID của đơn vị đầu tiên trong dropdown (node đầu tiên của cây đơn vị).
 * Mặc định chọn giá trị đầu tiên trong dropdown chứ không hardcode mã/tên đơn vị.
 */
export function getFirstOrgUnitId(
  organizations?: readonly OrgUnitTreeOption[]
): string | undefined {
  if (!organizations || organizations.length === 0) return undefined;
  const tree = buildOrgUnitTreeData(organizations);
  if (tree.length > 0 && tree[0]?.value) {
    return String(tree[0].value);
  }
  const first = organizations.find((o) => o && o.id !== undefined && o.id !== null);
  return first ? String(first.id) : undefined;
}

/**
 * Kiểm tra xem người dùng hiện tại có thuộc cấp cao nhất Bộ Giao thông Vận tải hay không.
 * Các trường hợp là cấp Bộ:
 * 1. user.role === 'SUPER_ADMIN' hoặc 'ADMIN'
 * 2. user.orgUnitCode === 'G17' hoặc user.orgUnitId === '00000000-0000-0000-0000-000000000017'
 * 3. Đơn vị trong danh mục có code 'G17' hoặc tên chứa 'bộ giao thông'
 */
export function isMinistryLevelUser(
  user: User | null | undefined,
  organizations?: readonly OrgUnitTreeOption[]
): boolean {
  if (!user) return true; // Chưa đăng nhập hoặc fallback an toàn -> không giới hạn

  // Nếu user đã được gán đơn vị trực thuộc cụ thể:
  if (user.orgUnitId) {
    const orgIdStr = String(user.orgUnitId);
    if (orgIdStr === MINISTRY_ROOT_ID || user.orgUnitCode === MINISTRY_ROOT_CODE) {
      return true;
    }
    if (organizations && organizations.length > 0) {
      const org = organizations.find((o) => String(o.id) === orgIdStr);
      if (org) {
        const code = (org.code || '').toUpperCase();
        const name = (org.name || '').toLowerCase();
        if (code === MINISTRY_ROOT_CODE || name.includes('bộ giao thông')) {
          return true;
        }
      }
    }
    return false;
  }

  const role = (user.role || (user as any).roleName || '').toUpperCase();
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') return true;

  return false;
}

/**
 * Xác định giá trị orgUnitId mặc định cho dropdown / bộ lọc:
 * - Khi bắt đầu vào màn danh sách, filter mặc định chọn đơn vị mà user đấy trực thuộc.
 * - Nếu user thuộc cấp cao nhất Bộ GTVT (G17) hoặc vai trò quản trị toàn quyền: mặc định chọn giá trị đầu tiên trong dropdown chứ không hardcode.
 * - Nếu user có orgUnitId hợp lệ thuộc đơn vị cấp dưới (Cảng vụ, Chi cục...): trả về chính orgUnitId của user.
 * - Nếu không xác định được: trả về undefined.
 */
export function resolveDefaultOrgUnitId(
  user: User | null | undefined,
  organizations?: readonly OrgUnitTreeOption[]
): string | undefined {
  if (!user) {
    return undefined;
  }

  // Nếu user thuộc cấp Bộ GTVT hoặc vai trò Quản trị toàn hệ thống -> mặc định chọn giá trị đầu tiên trong dropdown
  if (isMinistryLevelUser(user, organizations)) {
    return getFirstOrgUnitId(organizations);
  }

  if (!user.orgUnitId) {
    return undefined;
  }

  const orgIdStr = String(user.orgUnitId);
  if (organizations && organizations.length > 0) {
    const org = organizations.find((o) => String(o.id) === orgIdStr);
    return org ? orgIdStr : undefined;
  }
  return orgIdStr;
}

/**
 * Hook tiện ích cung cấp defaultOrgUnitId và thông tin phân cấp của user hiện tại.
 */
export function useUserDefaultOrgUnit(organizations?: readonly OrgUnitTreeOption[]) {
  const currentUser = useAuthStore((s) => s.user);

  const defaultOrgUnitId = useMemo(
    () => resolveDefaultOrgUnitId(currentUser, organizations),
    [currentUser, organizations]
  );

  const isMinistry = useMemo(
    () => isMinistryLevelUser(currentUser, organizations),
    [currentUser, organizations]
  );

  return {
    currentUser,
    defaultOrgUnitId,
    isMinistry,
  };
}

export interface UseOrgUnitFilterOptions {
  /** Giá trị ban đầu của bộ lọc (nếu muốn chỉ định rõ) */
  initialValue?: string;
  /** Tự động gán defaultOrgUnitId của tài khoản khi khởi tạo (mặc định: true) */
  autoDefault?: boolean;
  /** Callback khi defaultOrgUnitId được xác định sau khi nạp danh mục và user */
  onDefaultResolved?: (defaultId: string | undefined) => void;
  /** Callback khi giá trị orgUnitId thay đổi */
  onChange?: (val: string | undefined) => void;
}

/**
 * Hook COMMON dùng chung cho mọi màn hình có bộ lọc Đơn vị quản lý:
 * - Tự động nạp danh mục đơn vị qua cache tập trung (organizationService.getAll())
 * - Tự động xác định defaultOrgUnitId theo tài khoản đăng nhập (Bộ GTVT -> undefined / Tất cả; cấp con -> user.orgUnitId)
 * - Quản lý orgUnitId state và cung cấp hàm resetOrgUnit() cho nút Làm mới
 * - Cung cấp sẵn orgMap (id -> name) và orgLevel2Map (id -> tên đơn vị cấp 2 chuẩn hiển thị bảng)
 */
export function useOrgUnitFilter(options?: UseOrgUnitFilterOptions) {
  const currentUser = useAuthStore((s) => s.user);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [orgUnitId, setOrgUnitIdState] = useState<string | undefined>(options?.initialValue);
  const defaultOrgUnitRef = useRef<string | undefined>(undefined);
  const initializedRef = useRef(false);

  const setOrgUnitId = useCallback((val: string | undefined) => {
    setOrgUnitIdState(val);
    options?.onChange?.(val);
  }, [options]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    organizationService.getAll()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setOrganizations(list);
        const defId = resolveDefaultOrgUnitId(currentUser, list);
        if (!initializedRef.current || (defaultOrgUnitRef.current === undefined && defId !== undefined)) {
          initializedRef.current = true;
          defaultOrgUnitRef.current = defId;
          const autoDefault = options?.autoDefault !== false;
          if (options?.initialValue === undefined && autoDefault && defId !== undefined) {
            setOrgUnitIdState(defId);
            options?.onChange?.(defId);
          }
          options?.onDefaultResolved?.(defId);
          setIsReady(true);
        }
      })
      .catch(() => {
        if (!cancelled && !initializedRef.current) {
          initializedRef.current = true;
          const defId = resolveDefaultOrgUnitId(currentUser, []);
          defaultOrgUnitRef.current = defId;
          options?.onDefaultResolved?.(defId);
          setIsReady(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [currentUser, options]);

  const resetOrgUnit = useCallback(() => {
    const defId = defaultOrgUnitRef.current;
    setOrgUnitId(defId);
    return defId;
  }, [setOrgUnitId]);

  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    organizations.forEach((o) => {
      if (o.id) map.set(String(o.id), o.name);
    });
    return map;
  }, [organizations]);

  const orgLevel2Map = useMemo(() => {
    const map = new Map<string, string>();
    organizations.forEach((o) => {
      if (o.id) {
        const name = resolveOrgLevel2Name(organizations, o.id);
        if (name) map.set(String(o.id), name);
      }
    });
    return map;
  }, [organizations]);

  return {
    orgUnitId,
    setOrgUnitId,
    defaultOrgUnitId: defaultOrgUnitRef.current,
    defaultOrgUnitRef,
    organizations,
    loading,
    isReady,
    resetOrgUnit,
    orgMap,
    orgLevel2Map,
    currentUser,
  };
}

