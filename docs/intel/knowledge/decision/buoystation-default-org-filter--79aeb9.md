---
id: AM-79aeb9f7aeb05dc0
kind: decision
topic: buoystation-default-org-filter
tags: []
importance: 0.75
agent: 
created: 2026-08-20T08:34:51.320Z
updated: 2026-08-20T08:34:51.320Z
---

Filter Đơn vị quản lý màn Nhà trạm Phao, tiêu (frontend/src/services/buoy-station/BuoyStationList.tsx) ĐÃ có mặc định theo user đăng nhập (2026-08-20, giống BuoyListPage): khi load danh sách tổ chức → fetch GET /users/me → profile.orgUnitId → khớp org trong danh sách thì set làm managingUnitId mặc định (không khớp/user không có đơn vị → lấy org đầu tiên), đồng bộ cả filterValues.managingUnitId; lần fetch đầu gate bằng orgUnitReady (useEffect [fetchData, orgUnitReady]); handleFilterReset trả về đơn vị mặc định (defaultOrgUnitId ref) thay vì undefined. Pattern chuẩn: defaultOrgUnitId/defaultOrgApplied refs + orgUnitReady state.
