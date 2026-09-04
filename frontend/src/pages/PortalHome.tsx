/**
 * PortalHome — "Cổng phân hệ Hàng hải" (route "/", fullscreen, không sidebar/topbar).
 * Dựng theo mockup cong-phan-he-hang-hai.html đã đồng bộ themetokenchk:
 *  - accent 6 phân hệ: kcht #273e7c · asset #1BAF7A · plan #EDA100 · gis #63abfd
 *    · report #E34948 · admin #5E6278 (chốt 2026-09-04)
 *  - icon = antd (@ant-design/icons), không tự vẽ SVG
 *  - khối chào không có "X/6 phân hệ", tile không có meta "…đối tượng cập nhật…"
 *  - phân hệ chưa cấp quyền hiển thị danh sách mờ riêng
 * Triage: docs/intel/_intake/TRI-1788510137432-d18a.json
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  ContainerOutlined,
  BankOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  FundOutlined,
  SettingOutlined,
  SearchOutlined,
  UserOutlined,
  ArrowRightOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { NAV_GROUPS, firstAccessibleRoute } from '../config/navigation';
import { MENU_PERMISSION_MAP } from '../components/AppLayout';
import { usePermissionStore } from '../store/permissionStore';
import { useAuthStore } from '../store/authStore';
import {
  actionPrimary,
  statusOperational,
  statusAttention,
  dataSea2,
  statusCritical,
  surfacePage,
  surfaceCard,
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  radiusSm,
  radiusLg,
  radiusPill,
  shadowSm,
  shadowMd,
  fontSizeSm,
  fontSizeMd,
  fontSizeLg,
  fontSizeHeading,
  fontSizeBreadcrumb,
  fontWeightMedium,
  fontWeightBold,
  spaceMd,
  spaceLg,
  spaceXl,
  controlHeight,
} from '../themetokenchk';

function canAccessRoute(path: string): boolean {
  const required = MENU_PERMISSION_MAP[path];
  if (!required) return true;
  if (Array.isArray(required)) {
    return usePermissionStore.getState().hasAnyPermission(required);
  }
  return usePermissionStore.getState().hasPermission(required);
}

/** Màu nhận diện từng phân hệ — palette đóng CHK (chốt 2026-09-04). */
const GROUP_ACCENT: Record<string, string> = {
  kcht: actionPrimary,
  asset: statusOperational,
  plan: statusAttention,
  gis: dataSea2,
  report: statusCritical,
  admin: textSecondary,
};

/** Icon từng phân hệ — antd (@ant-design/icons), không tự vẽ. */
const GROUP_ICON: Record<string, ReactNode> = {
  kcht: <ContainerOutlined />,
  asset: <BankOutlined />,
  plan: <FileTextOutlined />,
  gis: <EnvironmentOutlined />,
  report: <FundOutlined />,
  admin: <SettingOutlined />,
};

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
}

const PORTAL_CSS = `
  .ph-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  @media (max-width: 1024px) { .ph-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 640px) { .ph-grid { grid-template-columns: 1fr; } }
  .ph-tile { transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
  .ph-tile:hover:not(:disabled) { transform: translateY(-4px); box-shadow: ${shadowMd}; }
  .ph-kbd {
    margin-left: auto; padding: 2px 7px; border-radius: ${radiusSm};
    font-size: ${fontSizeSm}px; color: ${textTertiary};
    border: 1px solid ${borderDefault}; background: ${surfacePage};
  }
`;

export default function PortalHome() {
  const navigate = useNavigate();
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [query, setQuery] = useState('');

  if (!isAuth) return <Navigate to="/login" replace />;

  const groups = NAV_GROUPS.map((group) => ({
    group,
    home: firstAccessibleRoute(group, canAccessRoute),
  }));
  const accessible = groups.filter((g) => g.home);
  const locked = groups.filter((g) => !g.home);
  const q = normalize(query.trim());
  const visible = q ? accessible.filter((g) => normalize(g.group.label + ' ' + g.group.desc).includes(q)) : accessible;

  const displayName = user?.fullName || user?.username || 'cán bộ';
  const role = user?.role?.replace('ROLE_', '');

  return (
    <div style={{ minHeight: '100vh', background: surfacePage, display: 'flex', flexDirection: 'column' }}>
      <style>{PORTAL_CSS}</style>

      {/* ===== Topbar ===== */}
      <header
        style={{
          maxWidth: 1200,
          width: '100%',
          margin: '0 auto',
          padding: `${spaceLg}px ${spaceXl}px 0`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spaceLg,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/images/logo-vinamarine.png" alt="Vinamarine" style={{ height: 46, width: 'auto' }} />
          <div style={{ lineHeight: 1.35 }}>
            <div style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, letterSpacing: '.14em', color: actionPrimary }}>
              CỤC HÀNG HẢI VIỆT NAM
            </div>
            <div style={{ fontSize: fontSizeSm, color: textTertiary }}>Hệ thống thông tin quản lý kết cấu hạ tầng hàng hải</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Tìm kiếm */}
          <label
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: 270, height: controlHeight, padding: '0 14px',
              borderRadius: radiusPill, background: surfaceCard, border: `1px solid ${borderDefault}`,
            }}
            aria-label="Tìm kiếm"
          >
            <SearchOutlined style={{ color: textTertiary, fontSize: fontSizeBreadcrumb }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm phân hệ, chức năng, đối tượng…"
              style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: fontSizeMd, color: textPrimary }}
            />
            <span className="ph-kbd">Ctrl K</span>
          </label>

          {/* User chip */}
          <button
            type="button"
            style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              padding: '5px 8px', borderRadius: radiusPill, background: surfaceCard, border: `1px solid ${borderDefault}`,
            }}
          >
            <span style={{ position: 'relative', width: 32, height: 32, borderRadius: '50%', background: actionPrimary, color: surfaceCard, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserOutlined style={{ fontSize: 15 }} />
              <span
                title="Đang hoạt động"
                style={{ position: 'absolute', bottom: 0, right: -1, width: 9, height: 9, borderRadius: '50%', background: statusOperational, border: `2px solid ${surfaceCard}` }}
              />
            </span>
            <span style={{ textAlign: 'left', lineHeight: 1.3 }}>
              <b style={{ display: 'block', fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: textPrimary }}>{displayName}</b>
              {role && <span style={{ display: 'block', fontSize: fontSizeSm, color: textTertiary }}>{role}</span>}
            </span>
          </button>
        </div>
      </header>

      {/* ===== Nội dung ===== */}
      <main style={{ maxWidth: 1200, width: '100%', margin: '0 auto', padding: `${spaceXl}px`, flex: 1 }}>
        {/* Khối chào */}
        <div style={{ marginBottom: spaceXl }}>
          <h1 style={{ margin: 0, fontSize: fontSizeHeading, fontWeight: fontWeightBold, color: textPrimary }}>
            Xin chào, {displayName}
          </h1>
          {role && (
            <div style={{ marginTop: 6, fontSize: fontSizeMd, color: textSecondary }}>
              {role}
            </div>
          )}
        </div>

        {/* Tất cả phân hệ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: spaceLg }}>
          <h2 style={{ margin: 0, fontSize: fontSizeLg, fontWeight: fontWeightMedium, color: textPrimary }}>Tất cả phân hệ</h2>
          <span style={{ flex: 1, height: 1, background: borderDefault }} />
          <span style={{ fontSize: fontSizeMd, color: textTertiary, fontVariantNumeric: 'tabular-nums' }}>
            {visible.length} khả dụng
          </span>
        </div>

        {/* Lưới tile */}
        <div className="ph-grid">
          {visible.map(({ group, home }) => {
            const accent = GROUP_ACCENT[group.id] ?? actionPrimary;
            const icon = GROUP_ICON[group.id] ?? <ContainerOutlined />;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => home && navigate(home)}
                className="ph-tile"
                style={{
                  textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit',
                  background: surfaceCard, border: `1px solid ${borderDefault}`,
                  borderRadius: radiusLg, boxShadow: shadowSm,
                  padding: spaceLg, display: 'flex', flexDirection: 'column', gap: 12,
                }}
              >
                <span
                  style={{
                    width: 46, height: 46, borderRadius: radiusLg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: fontSizeHeading, color: accent, background: `${accent}1A`,
                  }}
                >
                  {icon}
                </span>
                <h3 style={{ margin: 0, fontSize: fontSizeLg, fontWeight: fontWeightBold, color: textPrimary, lineHeight: 1.4 }}>
                  {group.label}
                </h3>
                <p style={{ margin: 0, fontSize: fontSizeMd, color: textTertiary, lineHeight: 1.55 }}>
                  {group.desc}
                </p>
                <span style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', color: accent, paddingTop: spaceMd, borderTop: `1px solid ${borderDefault}` }}>
                  <ArrowRightOutlined style={{ fontSize: fontSizeBreadcrumb }} />
                </span>
              </button>
            );
          })}
        </div>

        {visible.length === 0 && (
          <div style={{ textAlign: 'center', color: textTertiary, padding: 40, fontSize: fontSizeMd }}>
            Không tìm thấy phân hệ khớp với “{query}”
          </div>
        )}

        {/* Phân hệ chưa được cấp quyền */}
        {locked.length > 0 && (
          <div style={{ marginTop: spaceXl }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: spaceMd }}>
              <h2 style={{ margin: 0, fontSize: fontSizeLg, fontWeight: fontWeightMedium, color: textTertiary }}>
                Chưa được cấp quyền
              </h2>
              <span style={{ flex: 1, height: 1, background: borderDefault }} />
              <span style={{ fontSize: fontSizeMd, color: textTertiary }}>Liên hệ quản trị đơn vị để được cấp quyền</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {locked.map(({ group }) => (
                <div
                  key={group.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: radiusLg,
                    background: surfaceCard, border: `1px solid ${borderDefault}`,
                    color: textTertiary, opacity: 0.75,
                  }}
                >
                  <LockOutlined style={{ fontSize: fontSizeBreadcrumb }} />
                  <b style={{ fontWeight: fontWeightMedium, fontSize: fontSizeMd }}>{group.label}</b>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ===== Footer ===== */}
      <footer style={{ textAlign: 'center', padding: `${spaceMd}px ${spaceXl}px ${spaceLg}px`, color: textTertiary, fontSize: fontSizeSm }}>
        Hệ thống thông tin quản lý kết cấu hạ tầng giao thông Hàng hải — Cục Hàng hải Việt Nam
      </footer>
    </div>
  );
}
