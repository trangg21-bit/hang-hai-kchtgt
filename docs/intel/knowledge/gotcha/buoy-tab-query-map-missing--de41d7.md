---
id: AM-de41d7a3ce704987
kind: gotcha
topic: buoy-tab-query-map-missing
tags: []
importance: 0.8
agent: 
created: 2026-08-19T04:29:49.708Z
updated: 2026-08-19T04:29:49.708Z
---

BuoyListPage.tsx có bug runtime TS2304: TAB_QUERY_MAP được dùng ở fetchData (approvalStatus: filterApprovalStatus || TAB_QUERY_MAP[activeTab]) nhưng KHÔNG định nghĩa/import trong file → ReferenceError khi load list. Đã thêm const TAB_QUERY_MAP (identity map cho tab keys: all/DRAFT/PENDING_APPROVAL/APPROVED_L1/PUBLISHED/REJECTED) — giống BerthList. Còn 5 TS6133 unused pre-existing (fmtInputNumber, TreeSelect, BUOY_STATUS_OPTIONS, allData, orgTree) do process ngoài đang refactor filter — để nguyên, không đụng.
