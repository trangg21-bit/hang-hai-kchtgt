import type { ReactNode } from 'react';
import { Result, Button } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { usePermissionStore } from '../store/permissionStore';

interface Props {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
  disableOnly?: boolean; // if true, render children but disable actions instead of hiding
}

export default function PermissionGuard({ permission, children, fallback, disableOnly }: Props) {
  const hasPermission = usePermissionStore((s) => s.hasPermission);

  if (!hasPermission(permission)) {
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
