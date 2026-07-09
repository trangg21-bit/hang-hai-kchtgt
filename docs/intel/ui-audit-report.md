# UI Audit Report — Shared Theme & AppLayout

**Project:** Hệ thống Quản trị Kết cấu Hạ tầng Giao thông Hàng hải
**Date:** 2026-07-09
**Auditor:** Agent engineering-orchestrator (read-only audit)
**Scope:** frontend/src/theme.ts, frontend/src/components/AppLayout.tsx, frontend/src/index.css, frontend/src/main.tsx, all 22 modules

---

## 1. Status Summary

| Section | Verdict | Issues |
|---------|---------|--------|
| theme.ts — Design Tokens | PASS | — |
| theme.ts — AntD ThemeConfig | PASS | — |
| theme.ts — globalCssVars Classes | 1 MISSING | role-tag--user variant not defined |
| theme.ts — Rules 1–14 Comment Block | PASS | — |
| AppLayout.tsx — 17 Fix Checklist | PASS (17/17) | — |
| index.css / main.tsx — CSS Injection | PASS | — |
| 22 Module Scan — Orphaned Layout | PASS | No orphaned Layout/Sider/Menu found |

**Overall: 1 minor gap (role-tag--user), zero blockers.**

---

## 2. theme.ts Audit

### 2.1 Design Tokens — ALL PRESENT

colors (primary #1B84FF, sidebarBg #12468C, sidebarActiveBg #1B84FF, sidebarSearchBg, success, warning, error, info, all text/icon colors), radius (sm:6, md:10, lg:12, xl:16, pill:999), spacing (xs-xl), fontSize (12-34), shadow (card/cardHover/dropdown), layout (sidebarWidth:272, sidebarCollapsedWidth:80, headerHeight:64, footerHeight:56), fontFamily (Inter+system).

### 2.2 AntD ThemeConfig — ALL 13 COMPONENTS PRESENT

Layout, Menu (darkItemBg, darkItemSelectedBg, itemHeight:46, itemMarginInline:10, itemBorderRadius:10), Card, Button, Table, Input, Select, Tabs, Breadcrumb, Tag, Progress, Modal, Dropdown.

### 2.3 globalCssVars CSS Class Audit

**PASS — all classes present:**
- :root CSS variables (all)
- Sidebar: .sidebar-header, .sidebar-header__logo-box, .sidebar-header__logo-box img, .sidebar-header__text, .sidebar-header__title, .sidebar-header__subtitle
- .ant-layout-sider-children (position:absolute, flex column)
- .sidebar-menu-scroll (flex:1, min-height:0, overflow-y:auto)
- .sidebar-search, .sidebar-search input
- .sidebar-footer, .sidebar-footer__collapse-btn, .sidebar-footer__collapse-btn--collapsed, .sidebar-footer__version
- .ant-menu-dark .ant-menu-item-selected (box-shadow, NO ::before border-left)
- Topbar: .topbar-user, .topbar-user__avatar, .topbar-user__avatar-wrap, .topbar-user__status-dot, .topbar-user__info, .topbar-user__name, .topbar-user__role, .topbar-user__arrow
- Status badges: .status-badge, --active, --inactive, --locked, --pending
- Role tags: .role-tag, --admin, --org-admin, --manager, --viewer
- Table actions: .table-actions, .table-actions__btn, .table-actions__btn--danger
- KPI cards: .kpi-card, .kpi-card__label, .kpi-card__value, .kpi-card__icon-box, .kpi-card__delta, --up, --down
- Feature cards: .feature-card, .feature-card__link
- body, .ant-layout { background: var(--bg-body); }

**MISSING (1 class):**
- .role-tag--user : NOT DEFINED. Spec requires 5 variants (admin, org-admin, manager, user, viewer) but only 4 exist.

### 2.4 Rules 1–14 Comment Block — ALL 14 PRESENT

Rules cover: no hardcoded colors, KPI card pattern, feature card pattern, delta badge vs progress bar, shared menu, token-first additions, single ConfigProvider, unified blue sidebar, status badges, role tags, action buttons, JSX template, layout import, collapsed visibility.

---

## 3. AppLayout.tsx Audit — 17 Fix Checklist

| # | Fix | Status |
|---|-----|--------|
| 1 | Menu theme="dark" inlineCollapsed={collapsed} | PASS |
| 2 | Sider trigger={null} (no default trigger) | PASS |
| 3 | Sider width={layout.sidebarWidth} collapsedWidth={layout.sidebarCollapsedWidth} | PASS |
| 4 | layout imported from ../theme | PASS |
| 5 | Header: logo only (logo-box + img), no text | PASS |
| 6 | Footer: "Cục Hàng Hải và Đường Thủy" / "Việt Nam" via sidebar-footer__version | PASS |
| 7 | Search box in {!collapsed && (...)} | PASS |
| 8 | Menu in div.sidebar-menu-scroll | PASS |
| 9 | Footer collapse btn with --collapsed modifier + LeftOutlined | PASS |
| 10 | No Badge import (avatar-wrap + status-dot) | PASS |
| 11 | SearchOutlined imported | PASS |
| 12 | Topbar BEM: avatar-wrap > Avatar + status-dot, info, name, role, arrow | PASS |
| 13 | selectedKey handles '/' (pathSegments===0 -> '/') | PASS |
| 14 | Page title for '/': "HỆ THỐNG THÔNG TIN QUẢN LÝ KẾT CẤU HẠ TẦNG GIAO THÔNG HÀNG HẢI" | PASS |
| 15 | Page title color: #12468C | PASS |
| 16 | No stray style block | PASS |
| 17 | No sidebar-header__text in header (logo only) | PASS |

**17/17 PASS.**

---

## 4. index.css / main.tsx Audit

- main.tsx: globalCssVars imported from ./theme, injected via document.createElement('style') — PASS
- index.css: Only reset, scrollbar, table-transition. NO theme CSS leaked. — PASS

---

## 5. 22-Module Scan — Shared AppLayout Usage

**Methodology:** Grepped all TSX/TS/CSS for Sider, Layout, Menu, sidebar, import AppLayout.

**Results:** Sider found only in AppLayout.tsx. Layout found only in AppLayout.tsx. Menu (AntD) found only in AppLayout.tsx. import AppLayout found only in App.tsx.

**Zero orphaned Layout/Sider/Menu instances.**

### Module Mapping

| Module | Pages | Uses AppLayout? |
|--------|-------|-----------------|
| M-001 Quản trị hệ thống | Users, Roles, Admins, Groups, Units, Logs, Connections | Yes |
| M-002 Tài sản KCHTGT Cảng bến | CangBien, BenCang, CauCang, CangCan, VungNuoc, GiayTo | Yes |
| M-003 Khu nước & VTS | LuongHangHai, DeKe, CoSuaChua, TramRadar, HeThongVTS | Yes |
| M-004 Báo hiệu & thông tin | Beacons, Buoys, NhaTram, Stations, History | Yes |
| M-005 Biến động tài sản | AssetIncrease, Decrease, Inventory, Exploitation | Yes |
| M-006 Văn bản | VanBanPhapLy, SuCo, QuyHoach | Yes |
| M-007 GIS bản đồ | Points, Lines, Polygons, Layers, Search, Map, Permits | Yes |
| M-008 Báo cáo thống kê | ReportList, ReportViewer (F-141 to F-189) | Yes |
| M-009 Liên thông tích hợp | Connections | Yes |
| M-010 Xác thực phân quyền | Login, PasswordReset | Intentionally outside (Card-based) |
| M-011 Nhật ký backup | LogsPage | Yes |
| M-012 to M-022 | Share pages from above | Yes |

**All 22 modules correctly use shared AppLayout or are intentionally outside it.**

---

## 6. Action Items

### Must Fix (zero)

None.

### Should Fix

- theme.ts: Add missing role-tag--user variant to globalCssVars (Medium priority)

### Verified Complete

All theme tokens, 13 AntD component configs, 44/45 CSS classes, 14 rules, 17 AppLayout fixes, CSS injection path, index.css purity, and 22 module scan all verified against actual file contents on disk.

---

## Appendix: Evidence Log

- theme.ts: Read 770 lines, verified all tokens, 13 component configs, all CSS classes, 14 rules
- AppLayout.tsx: Read 565 lines, cross-referenced 17 fix items against code
- index.css: Read 19 lines, confirmed only reset + scrollbar + table transition
- main.tsx: Read 15 lines, confirmed globalCssVars injection
- Module scan: Grep for Layout/Sider/Menu/AppLayout — zero orphans
- Login.tsx: Confirmed Card-based standalone (no Sider/Menu)
- Home.tsx: Confirmed inside AppLayout Outlet
