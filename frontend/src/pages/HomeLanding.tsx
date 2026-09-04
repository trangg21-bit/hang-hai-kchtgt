/**
 * HomeLanding — trang chủ "/" theo mô hình M-024 v2 (chốt 2026-09-04):
 * landing 6 KHỐI chức năng làm cổng vào duy nhất (dashboard-first).
 * Card nào user không có quyền vào bất kỳ route nào trong khối → disabled.
 * Dữ liệu khối lấy từ config navigation.tsx (nguồn duy nhất).
 */
import { useNavigate } from 'react-router-dom';
import {
  surfaceCard,
  textPrimary,
  textSecondary,
  borderDefault as line,
  radiusXl,
  shadowMd,
  fontSizeLg,
  fontSizeMd,
} from '../tokens';
import { NAV_GROUPS, firstAccessibleRoute } from '../config/navigation';
import { MENU_PERMISSION_MAP } from '../components/AppLayout';
import { usePermissionStore } from '../store/permissionStore';

function canAccessRoute(path: string): boolean {
  const required = MENU_PERMISSION_MAP[path];
  if (!required) return true;
  if (Array.isArray(required)) {
    return usePermissionStore.getState().hasAnyPermission(required);
  }
  return usePermissionStore.getState().hasPermission(required);
}

export default function HomeLanding() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        padding: '32px 12px',
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: textPrimary, marginBottom: 6 }}>
          Hệ thống thông tin quản lý kết cấu hạ tầng hàng hải
        </div>
        <div style={{ fontSize: fontSizeMd, color: textSecondary }}>
          Chọn một khối chức năng để bắt đầu
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {NAV_GROUPS.map((group) => {
          const home = firstAccessibleRoute(group, canAccessRoute);
          const disabled = !home;
          return (
            <button
              key={group.id}
              type="button"
              disabled={disabled}
              onClick={() => home && navigate(home)}
              aria-label={disabled ? `${group.label} — chưa có chức năng được phân quyền` : group.label}
              style={{
                background: surfaceCard,
                border: `1px solid ${line}`,
                borderRadius: radiusXl,
                boxShadow: shadowMd,
                padding: '20px 18px',
                textAlign: 'left',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.55 : 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                minHeight: 132,
              }}
            >
              <span style={{ fontSize: 26, lineHeight: 1, color: textPrimary }}>{group.icon}</span>
              <span style={{ fontSize: fontSizeLg, fontWeight: 600, color: textPrimary }}>
                {group.label}
              </span>
              <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{group.desc}</span>
              <span style={{ fontSize: fontSizeMd, color: textSecondary, marginTop: 'auto' }}>
                {disabled ? 'Chưa được phân quyền' : 'Mở →'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
