---
id: AM-91e6d233e244a16a
kind: decision
topic: buoy-approval-content-modal
tags: []
importance: 0.8
agent: 
created: 2026-08-19T08:30:51.495Z
updated: 2026-08-19T08:30:51.495Z
---

Modal phê duyệt Phao tiêu ĐÃ có ô 'Nội dung phê duyệt' (TextArea 3 dòng, không bắt buộc): approve-l1/approve-l2 nhận thêm @RequestParam(required=false) content → BuoyService.approveL1/L2(id, approverId, content) set level1/level2ApprovalContent (trim, chỉ khi không blank); frontend api approveBuoyL1/L2(id, approverId, content?) + BuoyListPage state approvalContent (reset khi mở modal), handleConfirmApprove truyền content.trim()||undefined. Hiển thị ở detail Collapse 'Thông tin hệ thống' + nhãn history đã có. Triage TRI-1787128134846-9a5a (C1, 4 file).
