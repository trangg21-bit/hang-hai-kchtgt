---
id: AM-90c6165ebcbb6ee3
kind: decision
topic: anchorage-list-sync-berth
tags: []
importance: 0.8
agent: 
created: 2026-08-25T09:33:49.319Z
updated: 2026-08-25T09:33:49.319Z
---

AnchorageListPage (frontend/src/pages/anchorage/) đã sync chuẩn BerthListPage 2026-08-25 (inline C1, TRI-1787650293221-f07b): thêm useAuthStore + isAuditViewer (admin:manage||admin:operation) → 6 cột audit (Cán bộ cập nhật, gửi Phê duyệt, phê duyệt Cảng vụ/Cục + nội dung) tách tailColumns approvalStatus + auditColumns; thêm filter Ngày cập nhật updatedFrom/To (backend AnchorageController đã hỗ trợ); fetchData approvalStatus dùng filterApprovalStatus || TAB_QUERY_MAP[activeTab]; scroll x theo isAuditViewer (2600/2050); rowActions ['DRAFT','NHAP']; History drawer thêm Radio.Group Bản ghi hiện tại/Tất cả (gọi /v1/anchorage/history/all).
