---
id: AM-975321ebcefc2c37
kind: decision
topic: buoy-ui-align-port
tags: []
importance: 0.8
agent: 
created: 2026-08-18T01:46:44.728Z
updated: 2026-08-18T01:46:44.728Z
---

Màn Phao tiêu (frontend/src/pages/buoys/BuoyList.tsx + BuoyForm.tsx) đã căn chỉnh theo pattern Cảng biển PortListPage (2026-08-18): FilterTableLayout + DataTable sortable (sortProps cho code/name/type/latitude/longitude/status) + status tabs kèm count; form create/edit chuyển từ route /buoys/create + /buoys/:id sang Drawer nội bộ (formDrawer state, BuoyForm thành component controlled với props {onClose, id}); detail + history chuyển Modal → Drawer (drawerProps/drawerTitleStyle/outlineButtonStyle/primaryButtonStyle). App.tsx: 3 route /buoys* chỉ render BuoyList, deep-link GISChartView /buoys/:id?mode=edit vẫn hoạt động qua useParams+useLocation. Gate verify = npm run build (vite) trong frontend/. Lưu ý: C1 LOC budget 200 dòng khó giữ cho loại restructure này — đã chạm tripwire và re-triage (TRI-1787017522220-36f6).
