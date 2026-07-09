---
id: F-095
name: "Phê duyệt Đài TTDH"
slug: phe-duyet-dai-ttdh
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:57Z"
last-updated: "2026-07-08T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Phê duyệt Đài TTDH

## Description

Tính năng cho phép lãnh đạo phê duyệt (cấp 1 và cấp 2) xem xét, phê duyệt hoặc từ chối một đài thông tin duyên hải loại VTS đã được tạo mới hoặc cập nhật. Hệ thống hỗ trợ hai hành động: **Phê duyệt** (`POST /api/v1/stations/coastal/{id}/approve`) và **Từ chối** (`POST /api/v1/stations/coastal/{id}/reject`). Phê duyệt hỗ trợ cả hai cấp độ L1 và L2 — khi phê duyệt L1, trạng thái `status` chuyển từ `PENDING_APPROVAL` sang `APPROVED_L1` và `approvalStatus` từ `PENDING` sang `APPROVED_L1`; khi phê duyệt L2, trạng thái chuyển sang `APPROVED_L2` và sau đó lên `PUBLISHED`, đồng thời ghi nhận người phê duyệt (`approvedBy`), thời gian phê duyệt (`approvedDate`) và mức phê duyệt (`approvalLevel`). Khi từ chối, lãnh đạo phải cung cấp lý do từ chối (`rejectionReason`, max 1000 ký tự), trạng thái `status` giữ nguyên nhưng `approvalStatus` chuyển thành `REJECTED`. Hệ thống tuân thủ BR-010 (phê duyệt L1 yêu cầu entity ở trạng thái PENDING_APPROVAL) và BR-011 (phê duyệt L2 yêu cầu đã được phê duyệt L1). Tất cả hành động phê duyệt/từ chối được ghi nhận vào audit history.

## Business Intent

Đảm bảo quy trình kiểm soát chất lượng và tính chính xác của dữ liệu đài thông tin duyên hải trước khi đưa vào sử dụng chính thức, tuân thủ nguyên tắc phê duyệt hai cấp theo quy định quản lý tài sản báo hiệu và thông tin hàng hải.

## Flow Summary

1. Lãnh đạo phê duyệt (L1 hoặc L2) đăng nhập vào hệ thống với vai trò approver và truy cập danh sách đài VTS đang chờ phê duyệt (status = PENDING_APPROVAL hoặc APPROVED_L1). 2. Lãnh đạo chọn một đài cần xem xét và đọc chi tiết thông tin bao gồm tần số, công suất, loại thiết bị, tọa độ, địa chỉ, liên hệ. 3. Nếu hợp lệ, lãnh đạo chọn "Phê duyệt" — hệ thống kiểm tra trạng thái hiện tại: nếu đang PENDING_APPROVAL, phê duyệt L1 chuyển sang APPROVED_L1; nếu đã APPROVED_L1, phê duyệt L2 chuyển sang APPROVED_L2 rồi PUBLISHED. 4. Nếu không hợp lệ, lãnh đạo chọn "Từ chối", nhập lý do từ chối (tối đa 1000 ký tự) và hệ thống cập nhật `rejectionReason`, `approvalStatus = REJECTED`. 5. Hệ thống ghi nhận người phê duyệt (`approvedBy`), thời gian phê duyệt (`approvedDate`) và cấp độ phê duyệt (`approvalLevel`). 6. Cả hai hành động được ghi nhận vào audit history với action type tương ứng (APPROVE_L1, APPROVE_L2, hoặc REJECT).

## Acceptance Criteria

- Khi phê duyệt L1 thành công, `status` chuyển từ `PENDING_APPROVAL` sang `APPROVED_L1`, `approvalStatus` chuyển từ `PENDING` sang `APPROVED_L1`, `approvalLevel` = 1, `approvedBy` và `approvedDate` được ghi nhận
- Khi phê duyệt L2 thành công (từ trạng thái APPROVED_L1), `status` chuyển từ `APPROVED_L1` sang `APPROVED_L2` rồi `PUBLISHED`, `approvalStatus` chuyển sang `APPROVED_L2`, `approvalLevel` = 2
- Khi từ chối thành công, `approvalStatus` chuyển thành `REJECTED`, `rejectionReason` chứa lý do từ chối (bắt buộc, max 1000 ký tự)
- Không thể phê duyệt L1 nếu trạng thái không phải `PENDING_APPROVAL` — hệ thống trả về lỗi (BR-010)
- Không thể phê duyệt L2 nếu trạng thái không phải `APPROVED_L1` — hệ thống trả về lỗi (BR-011)
- Không thể từ chối mà không cung cấp lý do từ chối (BR-012)
- API endpoints: `POST /api/v1/stations/coastal/{id}/approve` và `POST /api/v1/stations/coastal/{id}/reject`

## In Scope

(populated by ba stage)

## Out of Scope

(populated by ba stage)

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| Quản trị viên (Admin) | Full | Có thể phê duyệt ở cả 2 cấp |
| Chuyên viên nghiệp vụ (Operator) | Read | Không có quyền phê duyệt |
| Lãnh đạo phê duyệt L1 | Approve_L1 | Phê duyệt cấp 1, chuyển từ PENDING_APPROVAL sang APPROVED_L1 |
| Lãnh đạo phê duyệt L2 | Approve_L2 | Phê duyệt cấp 2, chuyển từ APPROVED_L1 sang PUBLISHED |
| Người xem (Viewer) | Read | Chỉ xem chi tiết, không phê duyệt |

## Entities

- **CoastalStationVTS** (`coastal_station_vts`) — Kế thừa từ BaseStation: id (UUID), code, name, latitude, longitude, description (max 1000), unitId, isActive, status (StationStatus: DRAFT → PENDING_APPROVAL → APPROVED_L1 → APPROVED_L2 → PUBLISHED), approvalStatus (StationApprovalStatus: PENDING → APPROVED_L1 → APPROVED_L2 → REJECTED), approvalLevel (Integer), approvedBy (Long), approvedDate (LocalDateTime), rejectionReason (String, max 1000), createdAt, updatedAt, deletedAt — Trường đặc thù VTS: frequencyBand, transmitPower, equipmentType, locationAddress, contactPerson, contactPhone

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-001 | Mã đài (code) phải duy nhất | Update | `@Column(unique=true)` trong BaseStation |
| BR-010 | Phê duyệt L1 yêu cầu entity ở trạng thái PENDING_APPROVAL | Approve L1 | Service implementation trong CoastalStationVTSService |
| BR-011 | Phê duyệt L2 yêu cầu entity đã được phê duyệt L1 (trạng thái APPROVED_L1) | Approve L2 | Service implementation trong CoastalStationVTSService |
| BR-012 | Từ chối (reject) yêu cầu lý do từ chối (rejectionReason) không rỗng | Reject | `@RequestParam String rejectReason` trong controller |

## Testing Strategy

(populated by qa stage)
