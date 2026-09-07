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
  dataSea3,
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
  transform: translateY(-4px);
  border-color: ${actionPrimary};
  box-shadow: ${shadowLg};
}
.landing-block-card:focus-visible {
  outline: 2px solid ${actionPrimary};
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .landing-block-card { transition: none; }
}`;

const HERO_STYLE: CSSProperties = {
  background: `radial-gradient(90% 90% at 100% 0%, ${dataSea3} 0%, transparent 55%), linear-gradient(135deg, ${actionPrimary} 0%, ${sidebarBg} 100%)`,
  borderRadius: radiusXl,
  boxShadow: shadowLg,
  boxSizing: 'border-box',
  color: surfaceCard,
  marginBottom: spaceMd,
  padding: `${spaceLg}px ${spaceXl}px`,
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
    <div style={{ boxSizing: 'border-box' }}>
      <style>{LANDING_CARD_CSS}</style>

      {/* Hero — gradient navy (actionPrimary → sidebarBg) */}
      <section aria-label="Chào mừng" style={HERO_STYLE}>
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
            const locked = !card.home;
            const isMatch = matchingIds?.has(card.group.id) ?? false;
            const searchMiss = isSearching && !isMatch;
            const dimmed = locked || searchMiss;
            return (
              <Col key={card.group.id} lg={8} sm={12} xs={24}>
                <Tooltip
                  title={
                    locked && !searchMiss
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
                          color: actionPrimary,
                          fontSize: fontSizeLandingIcon,
                          lineHeight: 1,
                          marginBottom: spaceMd,
                        }}
                      >
                        {card.icon}
                      </div>
                      <h3 style={CARD_TITLE_STYLE}>{card.group.label}</h3>
                      <p style={CARD_DESC_STYLE}>{card.group.desc}</p>
                      <div style={CARD_FOOTER_STYLE}>
                        <span>{card.accessibleCount} chức năng</span>
                        <RightOutlined aria-hidden="true" style={{ color: textTertiary, fontSize: fontSizeSm }} />
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
