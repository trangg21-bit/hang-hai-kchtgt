---
id: AM-d0e84a42472afb3a
kind: fact
topic: anchorage-disable-history
tags: []
importance: 0.85
agent: 
created: 2026-08-26T03:15:20.241Z
updated: 2026-08-26T03:15:20.241Z
---

Khu neo đậu 2026-08-26 — USER CHỌN TẮT LỊCH SỬ thay vì tạo lại bảng: comment ghi/đọc change_logs + approval_logs trong AnchorageService (recordChanges create/update + insertChangeRecord softDelete) và AnchorageApprovalService (approvalLogRepository.save approve/reject; getHistory/getAllHistory trả List.of()). Nguyên nhân gốc: migration V20260825162500__unify_all_history_to_infrastructure_history DROP change_logs + approval_logs (gộp vào infrastructure_history) nhưng code vẫn ghi 2 bảng → lỗi 'relation change_logs does not exist' khi tạo mới. LƯU Ý: các module KHÁC (Berth/DryPort/Pier/Port/WaterZone/Cctv/Buoy) cũng ghi change_logs/approval_logs → tạo mới Berth trên DB đã chạy migration unify cũng sẽ lỗi y hệt; nếu user muốn lịch sử trở lại phải tạo migration tái tạo 2 bảng (TRI-1787713867510-eebe đã phân tích, đã cancel pipeline).
