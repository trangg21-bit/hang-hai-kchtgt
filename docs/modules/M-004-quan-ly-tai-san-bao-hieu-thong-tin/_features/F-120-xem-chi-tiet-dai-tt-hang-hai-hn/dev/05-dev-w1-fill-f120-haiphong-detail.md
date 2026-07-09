---
id: F-120
name: "Xem chi tiết Đài TT Hàng hải HN"
slug: xem-chi-tiet-dai-tt-hang-hai-hn
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:30Z"
last-updated: "2026-07-08T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Xem chi tiết Đài TT Hàng hải HN

## Description

Tính năng cho phép người dùng xem thông tin chi tiết của một đài thông tin Hàng hải tại Hải Phòng (CoastalStationHaiphong) theo mã định danh UUID. Hệ thống trả về bản ghi đầy đủ bao gồm tất cả các trường đặc thù của CoastalStationHaiphong (portName, district, ward, operationalLicense, licenseExpiry, inspectorName, inspectorPhone, lastInspectionDate, nextInspectionDate, coverageArea, equipmentType, communicationFrequency, locationAddress, contactPerson, contactPhone) cùng với các trường thừa kế từ BaseStation (code, name, latitude, longitude, description, unitId, isActive, status, approvalStatus, approvalLevel, approvedBy, approvedDate, rejectionReason, createdAt, updatedAt, deletedAt). Dữ liệu được đóng gói trong CoastalStationHaiphongResponse với Builder pattern và trả về qua GET /api/v1/stations/haiphong/{id}.

## Business Intent

Cung cấp giao diện xem thông tin chi tiết của từng đài thông tin Hàng hải Hải Phòng cho cán bộ nghiệp vụ và lãnh đạo phê duyệt, hỗ trợ ra quyết định quản lý và kiểm tra thông tin kỹ thuật trước khi phê duyệt.

## Flow Summary

1. Người dùng chọn một đài TT Hàng hải HN từ danh sách và truy cập trang chi tiết qua GET /api/v1/stations/haiphong/{id}. 2. Hệ thống tìm kiếm bản ghi theo UUID trong repository CoastalStationHaiphongRepository. 3. Nếu tồn tại, hệ thống gọi buildResponse() để chuyển đổi entity thành CoastalStationHaiphongResponse DTO, sau đó trả về ResponseEntity với HTTP 200 và toàn bộ thông tin đài. 4. Nếu UUID không tồn tại, hệ thống trả về lỗi với thông báo "Haiphong station not found" và mã HTTP 404.

## Acceptance Criteria

- Hệ thống chấp nhận GET /api/v1/stations/haiphong/{id} với UUID hợp lệ
- Khi UUID tồn tại, hệ thống trả về CoastalStationHaiphongResponse chứa đầy đủ 20 trường (15 trường đặc thù Haiphong + 5 trường BaseStation: id, code, name, status, approvalStatus, approvalLevel, approvedBy, approvedDate)
- CoastalStationHaiphongResponse được xây dựng qua Builder pattern với tất cả trường được map chính xác từ entity
- Khi UUID không tồn tại, hệ thống trả về lỗi 404 với thông báo "Haiphong station not found"

## In Scope

(Xem chi tiết đài TT Hàng hải HN theo UUID qua GET endpoint, build response DTO)

## Out of Scope

(Tạo mới (F-116), cập nhật (F-117), phê duyệt (F-119), xóa (F-118), lịch sử (F-121))

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
- CoastalStationHaiphong (coastal_station_haiphong) — portName, district, ward, operationalLicense, licenseExpiry, inspectorName, inspectorPhone, lastInspectionDate, nextInspectionDate, coverageArea, equipmentType, communicationFrequency, locationAddress, contactPerson, contactPhone
- CoastalStationHaiphongResponse (DTO, Builder) — id, stationCode, stationName, portName, district, ward, operationalLicense, licenseExpiry, inspectorName, inspectorPhone, lastInspectionDate, nextInspectionDate, coverageArea, equipmentType, communicationFrequency, locationAddress, contactPerson, contactPhone, status, approvalStatus, approvalLevel, approvedBy, approvedDate, createdAt, updatedAt, deletedAt

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | Mã (code) phải là duy nhất, không được để trống | Read | @Column(unique=true) — chỉ ảnh hưởng khi liệt kê |
| BR-009 | Bản ghi đã deletedAt không xuất hiện trong kết quả | Read | @SQLRestriction("deleted_at IS NULL") |

## Testing Strategy

(populated by qa stage)
