---
id: AM-45b9aa810fcdeb0f
kind: decision
topic: buoy-approval-flow-parity
tags: []
importance: 0.8
agent: 
created: 2026-08-19T06:26:16.568Z
updated: 2026-08-19T06:26:16.568Z
---

Luồng phê duyệt phao tiêu (BuoyListPage) ĐÃ đồng bộ UI giống bến cảng: (1) nút 'Gửi Cảng vụ phê duyệt' mở modal xác nhận (state submitModalOpen/submittingRecord + handleConfirmSubmit, thay handleSubmitApproval gửi thẳng), (2) nút duyệt đổi nhãn 'Cảng vụ phê duyệt' (approveL1, status PENDING_APPROVAL) / 'Cục phê duyệt' (approveL2, status APPROVED_L1), (3) modal approve tiêu đề+nội dung động theo cấp ('Xác nhận Cảng vụ/Cục phê duyệt', 'Cảng vụ/Cục phê duyệt {code} — {name}?'), nút Xác nhận màu statusAttention (L1)/statusOperational (L2). FINDING tồn đọng (user chốt làm riêng): BuoyController gần như KHÔNG có @PreAuthorize (chỉ generate-code có buoy:create) — create/update/delete/submit/approve/reject đều mở; frontend check permission chung data:read/admin:manage thay vì buoy:update/approve/delete; reject backend không check trạng thái hiện tại.
