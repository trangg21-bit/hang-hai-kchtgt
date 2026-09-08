import { useNavigate, useOutletContext } from 'react-router-dom';
import { Row, Col, Tooltip } from 'antd';
import { LockOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons';
import type { CSSProperties } from 'react';
import { usePermissionStore } from '../store/permissionStore';
import { useAuthStore } from '../store/authStore';
import { MENU_PERMISSION_MAP } from '../components/AppLayout';
import {
  NAV_GROUPS,
  accessibleTree,
  collectRoutes,
  firstAccessibleRoute,
  searchNavGroups,
  type NavGroup,
} from '../config/navigation';
import {
  actionPrimary,
  colors,
  fontSizeDisplay,
  fontSizeHeading,
  fontSizeLandingIcon,
  fontSizeLg,
  fontSizeMd,
  fontSizeSm,
  fontWeightBold,
  fontWeightMedium,
  fontWeightNormal,
  radiusXl,
  shadowMd,
  shadowLg,
  sidebarBg,
  spaceLg,
  spaceMd,
  spaceSm,
  spaceXl,
  surfaceCard,
  textPrimary,
  textSecondary,
  textTertiary,
} from '../themetokenchk';

// ============================================================
// Danh mục chức năng — landing 6 khối, route '/' BÊN TRONG AppLayout
// (M-024 rework 2026-09-06; enterprise redesign + landing search R-1..R-7).
// Nguồn duy nhất: NAV_GROUPS (config/navigation.tsx). Khối không có route nào
// truy cập được theo quyền → mờ (locked), không điều hướng.
// ============================================================

type DirectoryCard = {
  group: NavGroup;
  icon: React.ReactNode;
  home?: string;
  accessibleCount: number;
};

function canAccessRoute(path: string): boolean {
  const required = MENU_PERMISSION_MAP[path];
  if (!required) return true;
  if (Array.isArray(required)) {
    return usePermissionStore.getState().hasAnyPermission(required);
  }
  return usePermissionStore.getState().hasPermission(required);
}

// Scoped CSS: hover / focus-visible của card landing (inline style không hỗ trợ
// pseudo-class). Màu lấy từ token; tôn trọng prefers-reduced-motion.
const LANDING_CARD_CSS = `
.landing-block-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.landing-block-card:hover:not(:disabled) {
  transform: translateY(-3px);
  border-color: ${actionPrimary} !important;
  box-shadow: 0 10px 25px -4px rgba(32, 78, 156, 0.14) !important;
}
.landing-block-card:focus-visible {
  outline: 2px solid ${actionPrimary};
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .landing-block-card { transition: none; }
}
`;

const CompassMaritimeSvg = () => (
  <svg
    aria-hidden="true"
    fill="none"
    height="220"
    style={{
      color: '#ffffff',
      opacity: 0.08,
      pointerEvents: 'none',
      position: 'absolute',
      right: -20,
      top: '50%',
      transform: 'translateY(-50%)',
    }}
    viewBox="0 0 200 200"
    width="220"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="100" cy="100" r="92" stroke="currentColor" strokeDasharray="2 4" strokeWidth="1.5" />
    <circle cx="100" cy="100" r="84" stroke="currentColor" strokeWidth="1" />
    <circle cx="100" cy="100" r="76" stroke="currentColor" strokeDasharray="4 4" strokeWidth="0.75" />
    <circle cx="100" cy="100" r="50" stroke="currentColor" strokeWidth="1" />
    <circle cx="100" cy="100" r="20" stroke="currentColor" strokeWidth="1" />
    <line stroke="currentColor" strokeWidth="1" x1="100" x2="100" y1="4" y2="196" />
    <line stroke="currentColor" strokeWidth="1" x1="4" x2="196" y1="100" y2="100" />
    <line stroke="currentColor" strokeDasharray="2 2" strokeWidth="0.75" x1="32" x2="168" y1="32" y2="168" />
    <line stroke="currentColor" strokeDasharray="2 2" strokeWidth="0.75" x1="32" x2="168" y1="168" y2="32" />
    <polygon fill="currentColor" points="100,16 105,85 100,78 95,85" />
    <polygon fill="currentColor" points="100,184 105,115 100,122 95,115" />
    <polygon fill="currentColor" points="184,100 115,105 122,100 115,95" />
    <polygon fill="currentColor" points="16,100 85,105 78,100 85,95" />
    <polygon fill="currentColor" points="160,40 112,92 118,88 108,82" />
    <polygon fill="currentColor" points="40,160 88,108 82,112 92,118" />
    <polygon fill="currentColor" points="160,160 112,108 118,112 108,118" />
    <polygon fill="currentColor" points="40,40 88,92 82,88 92,82" />
    <circle cx="100" cy="100" fill="currentColor" r="5" />
  </svg>
);

const HERO_STYLE: CSSProperties = {
  background: `linear-gradient(135deg, ${sidebarBg} 0%, #1e4b94 50%, ${actionPrimary} 100%)`,
  borderRadius: radiusXl,
  boxShadow: shadowLg,
  boxSizing: 'border-box',
  color: surfaceCard,
  marginBottom: spaceMd,
  overflow: 'hidden',
  padding: `${spaceLg}px ${spaceXl}px`,
  position: 'relative',
  width: '100%',
};

const BLOCK_CARD_STYLE: CSSProperties = {
  background: surfaceCard,
  border: `1px solid ${colors.borderLight}`,
  borderRadius: radiusXl,
  boxShadow: shadowMd,
  boxSizing: 'border-box',
  color: 'inherit',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'inherit',
  height: '100%',
  padding: spaceMd,
  textAlign: 'left',
  width: '100%',
};

const LOCKED_CARD_STYLE: CSSProperties = {
  cursor: 'not-allowed',
  filter: 'saturate(0.4)',
  opacity: 0.55,
};

// R-3: khối không khớp query → mờ 0.35 và không click được.
const SEARCH_MISS_STYLE: CSSProperties = {
  cursor: 'not-allowed',
  opacity: 0.35,
};

const CARD_TITLE_STYLE: CSSProperties = {
  color: textPrimary,
  fontSize: fontSizeLg,
  fontWeight: fontWeightBold,
  lineHeight: 1.4,
  margin: 0,
  marginBottom: spaceSm,
};

const CARD_DESC_STYLE: CSSProperties = {
  color: textSecondary,
  fontSize: fontSizeMd,
  lineHeight: 1.6,
  margin: 0,
  marginBottom: spaceMd,
};

const CARD_FOOTER_STYLE: CSSProperties = {
  borderTop: `1px solid ${colors.borderLight}`,
  color: textSecondary,
  display: 'flex',
  fontSize: fontSizeMd,
  fontWeight: fontWeightMedium,
  justifyContent: 'space-between',
  marginTop: 'auto',
  paddingTop: spaceSm,
};

const SECTION_HINT_STYLE: CSSProperties = {
  color: textTertiary,
  fontSize: fontSizeMd,
  margin: `${spaceSm}px 0 0`,
};

const EMPTY_BOX_STYLE: CSSProperties = {
  background: surfaceCard,
  borderRadius: radiusXl,
  boxShadow: shadowMd,
  boxSizing: 'border-box',
  padding: spaceXl,
  textAlign: 'center',
  width: '100%',
};

function formatToday(): string {
  return new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });
}

export default function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  // Landing search (Item 1, M-024): searchQuery do AppLayout sở hữu, truyền qua
  // Outlet context — KHÔNG store/context mới. Rỗng → hiện cả 6 khối.
  const outlet = useOutletContext<{ searchQuery?: string } | null>();
  const searchQuery = outlet?.searchQuery ?? '';
  const trimmedQuery = searchQuery.trim();
  const isSearching = trimmedQuery.length > 0;
  const matchingIds = isSearching
    ? new Set(searchNavGroups(trimmedQuery, NAV_GROUPS).map((group) => group.id))
    : null;

  const cards: DirectoryCard[] = NAV_GROUPS.map((group) => ({
    group,
    icon: group.icon,
    home: firstAccessibleRoute(group, canAccessRoute),
    accessibleCount: collectRoutes(accessibleTree(group.tree, canAccessRoute)).length,
  }));

  const anyAccessibleBlock = cards.some((card) => card.home);
  const noSearchMatch = isSearching && (matchingIds?.size ?? 0) === 0;

  const displayName = user?.fullName?.trim() || 'Quản trị viên';
  const roleLabel = user?.role?.replace('ROLE_', '') || 'Quản trị viên';

  return (
    <div style={{ boxSizing: 'border-box', margin: '0 auto', maxWidth: 1400, padding: '0 8px' }}>
      <style>{LANDING_CARD_CSS}</style>

      {/* Hero — gradient navy (sidebarBg → #1e4b94 → actionPrimary) + la bàn chìm */}
      <section aria-label="Chào mừng" style={HERO_STYLE}>
        <CompassMaritimeSvg />
        <h1
          style={{
            color: surfaceCard,
            fontSize: fontSizeDisplay,
            fontWeight: fontWeightBold,
            lineHeight: 1.25,
            margin: 0,
          }}
        >
          Xin chào, {displayName}!
        </h1>
        <p
          style={{
            color: surfaceCard,
            fontSize: fontSizeMd,
            fontWeight: fontWeightNormal,
            lineHeight: 1.6,
            margin: `${spaceSm}px 0 0`,
            opacity: 0.9,
          }}
        >
          {roleLabel} · {formatToday()}
        </p>
      </section>

      {/* Section header */}
      <div
        style={{
          alignItems: 'baseline',
          display: 'flex',
          flexWrap: 'wrap',
          gap: spaceMd,
          justifyContent: 'space-between',
          marginBottom: spaceMd,
        }}
      >
        <div>
          <h2
            style={{
              color: textPrimary,
              fontSize: fontSizeHeading,
              fontWeight: fontWeightBold,
              margin: 0,
            }}
          >
            Danh mục chức năng
          </h2>
          <p style={SECTION_HINT_STYLE}>Chọn một khối chức năng để tiếp tục.</p>
        </div>
        {isSearching && (
          <span style={{ color: textTertiary, fontSize: fontSizeMd }}>
            {matchingIds?.size ?? 0} khối phù hợp
          </span>
        )}
      </div>

      {/* Trạng thái thiếu quyền: không truy cập được khối nào → empty state,
          KHÔNG render 6 card mờ. */}
      {!anyAccessibleBlock && (
        <div style={EMPTY_BOX_STYLE}>
          <LockOutlined style={{ color: textTertiary, fontSize: fontSizeDisplay }} />
          <h3
            style={{
              color: textPrimary,
              fontSize: fontSizeLg,
              fontWeight: fontWeightBold,
              margin: `${spaceMd}px 0 ${spaceSm}px`,
            }}
          >
            Chưa có khối chức năng khả dụng
          </h3>
          <p style={{ color: textSecondary, fontSize: fontSizeMd, margin: 0 }}>
            Bạn chưa được phân quyền truy cập khối chức năng nào. Vui lòng liên hệ quản trị viên để được cấp
            quyền.
          </p>
        </div>
      )}

      {/* R-7: search không khớp khối nào → empty state text chuẩn */}
      {anyAccessibleBlock && noSearchMatch && (
        <div style={EMPTY_BOX_STYLE}>
          <SearchOutlined style={{ color: textTertiary, fontSize: fontSizeDisplay }} />
          <h3
            style={{
              color: textPrimary,
              fontSize: fontSizeLg,
              fontWeight: fontWeightBold,
              margin: `${spaceMd}px 0 ${spaceSm}px`,
            }}
          >
            Không tìm thấy khối chức năng phù hợp
          </h3>
          <p style={{ color: textSecondary, fontSize: fontSizeMd, margin: 0 }}>
            Thử từ khóa khác hoặc xóa nội dung tìm kiếm để xem toàn bộ chức năng.
          </p>
        </div>
      )}

      {/* 6 khối chức năng — responsive 3 → 2 → 1 cột */}
      {anyAccessibleBlock && !noSearchMatch && (
        <Row gutter={[spaceLg, spaceMd]}>
          {cards.map((card) => {
            const isDev = Boolean(card.group.underDevelopment);
            const locked = isDev || !card.home;
            const isMatch = matchingIds?.has(card.group.id) ?? false;
            const searchMiss = isSearching && !isMatch;
            const dimmed = locked || searchMiss;
            return (
              <Col key={card.group.id} lg={8} sm={12} xs={24}>
                <Tooltip
                  title={
                    isDev
                      ? 'Chức năng đang được phát triển, vui lòng quay lại sau'
                      : locked && !searchMiss
                        ? 'Chưa được phân quyền — liên hệ quản trị để được cấp quyền truy cập'
                        : undefined
                  }
                >
                  <span style={{ display: 'inline-block', height: '100%', width: '100%' }}>
                    <button
                      aria-disabled={dimmed}
                      className="landing-block-card"
                      disabled={dimmed}
                      onClick={() => {
                        if (isDev) return;
                        if (!dimmed && card.home) navigate(card.home);
                      }}
                      style={{
                        ...BLOCK_CARD_STYLE,
                        border: `1px solid ${isMatch ? actionPrimary : colors.borderLight}`,
                        ...(locked && !searchMiss ? LOCKED_CARD_STYLE : {}),
                        ...(searchMiss ? SEARCH_MISS_STYLE : {}),
                      }}
                      type="button"
                    >
                      <div
                        style={{
                          alignItems: 'center',
                          background: '#edf3fc',
                          borderRadius: '12px',
                          color: actionPrimary,
                          display: 'flex',
                          fontSize: fontSizeLandingIcon,
                          height: 48,
                          justifyContent: 'center',
                          lineHeight: 1,
                          marginBottom: spaceMd,
                          width: 48,
                        }}
                      >
                        {card.icon}
                      </div>
                      <h3 style={CARD_TITLE_STYLE}>{card.group.label}</h3>
                      <p style={CARD_DESC_STYLE}>{card.group.desc}</p>
                      <div style={CARD_FOOTER_STYLE}>
                        {isDev ? (
                          <span
                            style={{
                              background: '#fef3c7',
                              borderRadius: '4px',
                              color: '#d97706',
                              fontSize: fontSizeSm,
                              fontWeight: fontWeightMedium,
                              padding: '2px 8px',
                            }}
                          >
                            Đang phát triển
                          </span>
                        ) : (
                          <>
                            <span>{card.accessibleCount} chức năng</span>
                            <RightOutlined aria-hidden="true" style={{ color: textTertiary, fontSize: fontSizeSm }} />
                          </>
                        )}
                      </div>
                    </button>
                  </span>
                </Tooltip>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}
