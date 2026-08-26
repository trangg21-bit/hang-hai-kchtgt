---
id: AM-5359689811983643
kind: decision
topic: approval-log-tam-tat-2026-08-26
tags: []
importance: 0.85
agent: 
created: 2026-08-26T04:26:38.678Z
updated: 2026-08-26T04:26:38.678Z
---

TẠM TẮT GHI approval_log (2026-08-26, user yêu cầu comment out toàn bộ logic ghi bảng approval_logs): bảng approval_logs ĐÃ BỊ DROP bởi migration V20260825162500 (DROP TABLE IF EXISTS approval_logs CASCADE — unify history sang infrastructure_history) nhưng 6 lệnh approvalLogRepository.save vẫn còn hoạt động ở BerthApprovalService (2), PierApprovalService (2), ApprovalWorkflowService chung (2) → duyệt/từ chối các màn đó đang lỗi 'relation approval_logs does not exist'. Đã comment out cả 6 lệnh save kèm comment '[TẠM TẮT GHI LỊCH SỬ] Bảng approval_logs đã bị V20260825162500 drop' (giống AnchorageApprovalService đã làm trước). Vẫn giữ entity/repository ApprovalLog (không xóa). Gate: mvn clean compile (IntelliJ bundled mvn.cmd) exit 0. Lưu ý: Port/WaterZone/DryPort/CctvApprovalService vẫn inject approvalLogRepository nhưng không gọi save — chưa đụng. Muốn khôi phục phải tạo lại migration tạo bảng approval_logs.
