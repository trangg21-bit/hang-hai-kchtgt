---
id: AM-ab556a309598ca7d
kind: decision
topic: applayout-menu-openkeys
tags: []
importance: 0.7
agent: 
created: 2026-08-20T05:11:37.294Z
updated: 2026-08-20T05:11:37.294Z
---

AppLayout.tsx: các submenu có onTitleClick điều hướng (port-parent, berth-parent, buoy-station-parent) phải map selectedKey về key submenu VÀ giữ mở chuỗi openKeys tương ứng trong useEffect openKeys — nhánh submenu cụ thể phải đặt TRƯỚC nhánh deepKey generic (documents/station/asset); nếu không submenu vừa mở liền đóng do effect ép setOpenKeys. Lần sửa 2026-08-20: /buoy-station + /buoys giữ ['beacon','buoy-station-parent'].
