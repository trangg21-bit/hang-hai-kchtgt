---
id: AM-0609f648ad30c617
kind: fact
topic: anchorage-berth-parity
tags: []
importance: 0.9
agent: 
created: 2026-08-25T10:22:05.379Z
updated: 2026-08-26T03:04:52.261Z
---

Anchorage (khu neo đậu) 2026-08-26 — kiểm tra parity với Berth: (1) THÊM MỚI giống hệt Berth: default saveAction=DRAFT, applySaveAction DRAFT/SUBMIT→APPROVED_LEVEL1/APPROVED, 3 nút form giống, guard cảng cha APPROVED. (2) UPDATE KHÁC Berth: sửa bản ghi APPROVED không kèm saveAction → Anchorage hạ APPROVED_LEVEL1 (AnchorageService.java:210-212), còn Berth giữ APPROVED (BerthService.java:393-397 wasApproved). (3) Anchorage THIẾU flow duyệt 2 cấp chuẩn: chỉ có /approve + /reject legacy cap CANG_VU/CUC, không có /submit + /approve/c1 + /approve/c2 như BerthController, không dùng InfrastructureApprovalService (không chống tự duyệt BR-015, không validate lý do từ chối ≥10 ký tự BR-016, không phân cấp theo đơn vị Rule 14). (4) SECURITY: fix tạm 2026-08-26 VẪN CHƯA khôi phục — 14 @PreAuthorize trong AnchorageController còn comment + '/api/v1/anchorage' còn trong PermissionMiddleware.PUBLIC_PATH_PREFIXES (dòng 70-71) → API anchorage đang public.
