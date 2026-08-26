---
id: AM-4feb8ba754d1b384
kind: gotcha
topic: port-history-parity-gaps
tags: []
importance: 0.8
agent: 
created: 2026-08-17T10:02:17.763Z
updated: 2026-08-17T10:02:17.763Z
---

Lịch sử thay đổi (ChangeLog) của Port (cảng biển) là chuẩn; 3 đối tượng cùng họ đang LỆCH: (1) Berth/Pier thiếu getAllHistory() + GET /history/all (DryPort đã có đủ); (2) Berth create và softDelete KHÔNG ghi history, Pier create ghi bản ghi thô 'CREATE' (L172 PierService) và softDelete không ghi 'Đã xóa'; (3) dryport THIẾU trong ALWAYS_ALLOWED_RESOURCES cả backend PermissionAuthorizationManager L29 lẫn frontend permissionStore.ts L55 (chỉ có port/berth/pier) -> lịch sử cảng cạn 403 với user thường; (4) tab 'Tất cả bản ghi' của BerthList/PierList chỉ đổi state không load dữ liệu; (5) ApprovalLog entity không có fieldName nên merge approvalLog vào history tạo hàng rác '—' (Port dùng changeHistory thuần). TRI-1786960855163-8e56 là record triage C3 cho đợt sửa này.
