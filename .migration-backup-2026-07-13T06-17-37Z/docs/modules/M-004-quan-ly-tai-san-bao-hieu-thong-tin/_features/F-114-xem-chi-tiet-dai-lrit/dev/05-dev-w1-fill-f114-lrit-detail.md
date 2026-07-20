---
id: F-114
name: "Xem chi tiết Đài LRIT"
slug: xem-chi-tiet-dai-lrit
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:22Z"
last-updated: "2026-07-08T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Xem chi tiết Đài LRIT

## Description

Tính năng cho phép người dùng xem thông tin chi tiết của một đài thông tin LRIT (Long Range Identification and Tracking) theo mã định danh UUID. Hệ thống trả về bản ghi đầy đủ bao gồm tất cả các trường đặc thù của CoastalStationLRIT (terminalId, imoNumber, reportingInterval, antennaHeight, powerOutput, antennaType, dataFormat, communicationChannel, coverageArea, locationAddress, contactPerson, contactPhone) cùng với các trường thừa kế từ BaseStation (code, name, latitude, longitude, description, unitId, isActive, status, approvalStatus, approvalLevel, approvedBy, approvedDate, rejectionReason, createdAt, updatedAt, deletedAt). Dữ liệu được đóng gói trong CoastalStationLRITResponse với Builder pattern và trả về qua GET /api/v1/stations/lrit/{id}.

## Business Intent

Cung cấp giao diện xem thông tin chi tiết của từng đài thông tin LRIT cho cán bộ nghiệp vụ và lãnh đạo phê duyệt, hỗ trợ ra quyết định quản lý và kiểm tra thông tin kỹ thuật trước khi phê duyệt.

## Flow Summary

1. Người dùng chọn một đài LRIT từ danh sách và truy cập trang chi tiết qua GET /api/v1/stations/lrit/{id}. 2. Hệ thống tìm kiếm bản ghi theo UUID trong repository CoastalStationLRITRepository. 3. Nếu tồn tại, hệ thống gọi buildResponse() để chuyển đổi entity thành CoastalStationLRITResponse DTO, sau đó trả về ResponseEntity với HTTP 200 và toàn bộ thông tin đài. 4. Nếu UUID không tồn tại, hệ thống trả về lỗi với thông báo "LRIT station not found" và mã HTTP 404.

## Acceptance Criteria

- Hệ thống chấp nhận GET /api/v1/stations/lrit/{id} với UUID hợp lệ
- Khi UUID tồn tại, hệ thống trả về CoastalStationLRITResponse chứa đầy đủ 17 trường (13 trường đặc thù LRIT + 4 trường BaseStation: id, code, name, status, approvalStatus, approvalLevel, approvedBy, approvedDate)
- CoastalStationLRITResponse được xây dựng qua Builder pattern với tất cả trường được map chính xác từ entity
- Khi UUID không tồn tại, hệ thống trả về lỗi 404 với thông báo "LRIT station not found"

## In Scope

(Xem chi tiết đài LRIT theo UUID qua GET endpoint, build response DTO)

## Out of Scope

(Tạo mới (F-110), cập nhật (F-111), phê duyệt (F-113), xóa (F-112), lịch sử (F-115))

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Quản trị viên (Admin) | Full | Xem tất cả đài |
| Chuyên viên nghiệp vụ (Operator) | Read | Xem đài đã tạo và đài được giao |
| Lãnh đạo phê duyệt L1 | Read | Xem chi tiết để phê duyệt |
| Lãnh đạo phê duyệt L2 | Read | Xem chi tiết để phê duyệt |
| Người xem (Viewer) | Read | Chỉ xem chi tiết |

## Entities

- BaseStation (cơ sở, abstract) — id (UUID), code, name, latitude, longitude, description, unitId, isActive, status (StationStatus), approvalStatus (StationApprovalStatus), approvalLevel, approvedBy (Long), approvedDate (LocalDateTime), rejectionReason (String), createdAt (LocalDateTime), updatedAt (LocalDateTime), deletedAt (LocalDateTime)
- CoastalStationLRIT (coastal_station_lrit) — terminalId, imoNumber, reportingInterval, antennaHeight, powerOutput, antennaType, locationAddress, contactPerson, contactPhone, dataFormat, communicationChannel, coverageArea
- CoastalStationLRITResponse (DTO, Builder) — id, stationCode, stationName, terminalId, imoNumber, reportingInterval, antennaHeight, powerOutput, antennaType, locationAddress, contactPerson, contactPhone, dataFormat, communicationChannel, coverageArea, status, approvalStatus, approvalLevel, approvedBy, approvedDate, createdAt, updatedAt, deletedAt

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | Mã (code) phải là duy nhất, không được để trống | Read | @Column(unique=true) — chỉ ảnh hưởng khi liệt kê |
| BR-009 | Bản ghi đã deletedAt không xuất hiện trong kết quả | Read | @SQLRestriction("deleted_at IS NULL") |

## Testing Strategy

(populated by qa stage)
