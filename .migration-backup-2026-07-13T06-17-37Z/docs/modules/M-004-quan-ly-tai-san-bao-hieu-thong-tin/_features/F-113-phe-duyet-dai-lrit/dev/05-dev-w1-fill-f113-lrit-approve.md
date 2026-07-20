---
id: F-113
name: "Phê duyệt Đài LRIT"
slug: phe-duyet-dai-lrit
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:22Z"
last-updated: "2026-07-08T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Phê duyệt Đài LRIT

## Description

Tính năng cho phép lãnh đạo phê duyệt thực hiện duyệt hoặc từ chối một đài thông tin LRIT (Long Range Identification and Tracking) đang trong trạng thái chờ phê duyệt. Hệ thống hỗ trợ phê duyệt hai cấp (L1 và L2): cấp 1 chuyển trạng thái từ PENDING_APPROVAL sang APPROVED_L1, cấp 2 chuyển từ APPROVED_L1 sang APPROVED_L2 và cuối cùng sang PUBLISHED. Hành động phê duyệt được thực hiện qua POST /api/v1/stations/lrit/{id}/approve với body chứa approved=true và userId của người phê duyệt. Hành động từ chối được thực hiện qua POST /api/v1/stations/lrit/{id}/reject với body chứa rejectionReason và userId. Hệ thống tự động ghi nhận lịch sử APPROVE_L1, APPROVE_L2 hoặc REJECT tương ứng với hành động được thực hiện.

## Business Intent

Đảm bảo dữ liệu đài thông tin LRIT được kiểm duyệt hai cấp trước khi công bố hoạt động, tuân thủ quy trình quản lý dữ liệu hàng hải theo tiêu chuẩn của Bộ Giao thông Vận tải, đảm bảo tính chính xác và tin cậy của thông tin phục vụ giám sát, định vị tàu biển.

## Flow Summary

1. Người dùng (lãnh đạo phê duyệt) truy cập giao diện và chọn đài LRIT cần phê duyệt từ danh sách. 2. Hệ thống tìm kiếm bản ghi theo UUID, kiểm tra trạng thái hiện tại và approvalLevel để xác định bước phê duyệt tiếp theo. 3. Nếu approve=true, hệ thống tăng approvalLevel và cập nhật status/approvalStatus (L1: APPROVED_L1, L2: APPROVED_L2/PUBLISHED), đặt approvedBy và approvedDate. 4. Nếu approve=false, hệ thống chuyển lại về PENDING_APPROVAL và lưu rejectionReason. 5. Lịch sử hành động (APPROVE_L1, APPROVE_L2, REJECT) được ghi nhận tự động qua HistoryService.

## Acceptance Criteria

- Hệ thống chấp nhận POST /api/v1/stations/lrit/{id}/approve với body chứa approved (boolean) và userId (Long)
- Khi phê duyệt lần đầu (approvalLevel=0), hệ thống chuyển approvalStatus sang APPROVED_L1, status sang APPROVED_L1, approvalLevel thành 1
- Khi phê duyệt lần hai (approvalLevel=1), hệ thống chuyển approvalStatus sang APPROVED_L2, status sang APPROVED_L2, approvalLevel thành 2; nếu approvalLevel >= 2, chuyển status sang PUBLISHED
- Khi từ chối, hệ thống chuyển status về PENDING_APPROVAL, approvalStatus về PENDING, approvalLevel về 0 và lưu rejectionReason
- Hệ thống ghi nhận lịch sử APPROVE_L1 khi phê duyệt cấp 1, APPROVE_L2 khi phê duyệt cấp 2, với thông tin changedBy là userId của người phê duyệt
- Hệ thống chấp nhận POST /api/v1/stations/lrit/{id}/reject với body chứa rejectionReason (String)

## In Scope

(P phê duyệt L1/L2 hoặc từ chối đài LRIT qua approve/reject endpoints, ghi nhận audit history)

## Out of Scope

(Tạo mới (F-110), cập nhật (F-111), xem chi tiết (F-114), xóa (F-112))

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Quản trị viên (Admin) | Full | Toàn quyền phê duyệt |
| Lãnh đạo phê duyệt L1 | Approve_L1 | Phê duyệt cấp 1 (PENDING → APPROVED_L1) |
| Lãnh đạo phê duyệt L2 | Approve_L2 | Phê duyệt cấp 2 (APPROVED_L1 → PUBLISHED) |
| Chuyên viên nghiệp vụ (Operator) | Read | Chỉ xem, không phê duyệt |
| Người xem (Viewer) | Read | Chỉ xem |

## Entities

- BaseStation (cơ sở, abstract) — id (UUID), code, name, status (StationStatus: DRAFT→PENDING_APPROVAL→APPROVED_L1→APPROVED_L2→PUBLISHED), approvalStatus (StationApprovalStatus: PENDING→APPROVED_L1→APPROVED_L2→REJECTED), approvalLevel, approvedBy (Long), approvedDate (LocalDateTime), rejectionReason (String), createdAt, updatedAt
- CoastalStationLRIT (coastal_station_lrit) — terminalId, imoNumber, reportingInterval, antennaHeight, powerOutput, antennaType, locationAddress, contactPerson, contactPhone, dataFormat, communicationChannel, coverageArea
- StationStatus (enum) — DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, DELETED
- StationApprovalStatus (enum) — PENDING, APPROVED_L1, APPROVED_L2, REJECTED
- StationHistoryActionType (enum) — CREATE, UPDATE, DELETE, APPROVE_L1, APPROVE_L2, REJECT

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-010 | Phê duyệt L1 yêu cầu entity ở trạng thái PENDING_APPROVAL | Approve_L1 | Service: approveStation() kiểm tra currentLevel == 0 |
| BR-011 | Phê duyệt L2 yêu cầu entity đã được phê duyệt L1 (approvalLevel >= 1) | Approve_L2 | Service: approveStation() kiểm tra currentLevel == 1 |
| BR-012 | Từ chối (reject) yêu cầu lý do từ chối (rejectionReason) | Reject | Service: rejectStation(id, rejectionReason, userId) |
| BR-015 | Sau phê duyệt L2, status chuyển thành PUBLISHED | Approve_L2 | Service: approveStation() khi approvalLevel >= 2 |

## Testing Strategy

(populated by qa stage)
