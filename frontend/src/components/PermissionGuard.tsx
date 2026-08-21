import type { ReactNode } from 'react';
import { Result, Button, Spin } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { usePermissionStore } from '../store/permissionStore';
import { useAuthStore } from '../store/authStore';

interface Props {
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
  disableOnly?: boolean; // if true, render children but disable actions instead of hiding
}

export default function PermissionGuard({ permission, children, fallback, disableOnly }: Props) {
  const hasPermission = usePermissionStore((s) => s.hasPermission);
  const hasAnyPermission = usePermissionStore((s) => s.hasAnyPermission);
  const userPermissions = useAuthStore((s) => s.user?.permissions);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  
  const checkPermission = () => {
    if (Array.isArray(permission)) {
      return hasAnyPermission(permission);
    }
    return hasPermission(permission);
  };

  const isAllowed = userPermissions !== undefined && checkPermission();

  // Session đang được khôi phục (quyền chưa hydrate xong) — hiển thị loading
  // thay vì vội vàng kết luận 403.
  if (userPermissions === undefined && isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
        <Spin tip="Đang tải quyền truy cập..." />
      </div>
    );
  }

  if (!isAllowed) {
    if (disableOnly) {
      // The parent should handle disabling; we just render children
      return <>{children}</>;
    }

    if (fallback) return <>{fallback}</>;

    return (
      <Result
        icon={<LockOutlined />}
        title="Không có quyền truy cập"
        subTitle="Bạn không có quyền thực hiện hành động này. Vui lòng liên hệ quản trị viên."
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            Quay lại
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
