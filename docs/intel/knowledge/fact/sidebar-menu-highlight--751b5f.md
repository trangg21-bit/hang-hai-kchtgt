---
id: AM-751b5fb19e6cdbd5
kind: fact
topic: sidebar-menu-highlight
tags: []
importance: 0.7
agent: 
created: 2026-08-26T03:39:22.823Z
updated: 2026-08-26T03:39:22.823Z
---

Menu sidebar (2026-08-26): (1) Khu neo đậu không highlight khi chọn — AppLayout.tsx set selectedKey='port-parent' cho path /anchorage (key item là '/anchorage') → đã sửa thành '/anchorage' + nhánh openKeys. (2) Submenu title có class 'submenu-active' (Quản lý cảng biển port-parent, Quản lý bến cảng berth-parent, Nhà trạm Phao tiêu buoy-station-parent) đang nền TRẮNG mờ rgba(255,255,255,0.1) — user muốn XANH như leaf → đã đổi CSS inline trong AppLayout.tsx thành color-mix(in srgb, var(--ant-color-primary,#1B84FF) 30%, transparent). Primary project = #1B84FF (theme.ts:38, Metronic). Verify: npm run build exit 0.
