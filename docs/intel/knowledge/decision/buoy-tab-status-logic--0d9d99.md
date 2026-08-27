---
id: AM-0d9d999a214b38e9
kind: decision
topic: buoy-tab-status-logic
tags: []
importance: 0.8
agent: 
created: 2026-08-19T06:18:53.483Z
updated: 2026-08-19T06:22:19.547Z
---

Tab Quản lý phao tiêu ĐÃ đổi nhãn giống hệt bến cảng: Tất cả / Nháp / Chờ Cảng vụ duyệt / Chờ Cục duyệt / Đã phê duyệt / Từ chối. Key vẫn là giá trị field `status` thật (PENDING_APPROVAL=Chờ Cảng vụ duyệt, APPROVED_L1=Chờ Cục duyệt, PUBLISHED=Đã phê duyệt — vòng đời backend: DRAFT→PENDING_APPROVAL→APPROVED_L1→PUBLISHED, BuoyService approveL1/L2 chỉ set approvalStatus=APPROVED nên KHÔNG lọc theo enum ApprovalStatus). TAB_STATUS_LIST + buoyStatusBadge định nghĩa LOCAL trong BuoyListPage.tsx (không dùng schema.ts vì bị intake tripwire chặn one-way-door); badge cột Trạng thái, history, detail drawer (qua prop buoyStatusBadge) và options filter nâng cao đều dùng nhãn mới.
