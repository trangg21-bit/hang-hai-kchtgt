---
id: AM-11b8f81f1db05a92
kind: decision
topic: pier-parent-berth-approved-rule
tags: []
importance: 0.8
agent: 
created: 2026-08-22T05:31:15.823Z
updated: 2026-08-22T05:31:15.823Z
---

Quyết định nghiệp vụ F-020 (2026-08-22, user chốt): Bến cảng cha khi tạo mới Cầu cảng PHẢI ở trạng thái approvalStatus=APPROVED (đã phê duyệt) — BỎ điều kiện operationalStatus 'hiện hành' (HIEN_HANH) đã tồn tại trước đó. PierService.create() đổi từ check operationalStatus sang check parent.getApprovalStatus() != APPROVED (message 'Bến cảng cha phải ở trạng thái đã phê duyệt (APPROVED)'); PierForm.tsx dropdown bến cảng thêm approvalStatus:'APPROVED'. Chuẩn giống BerthService.create check cha APPROVED.
