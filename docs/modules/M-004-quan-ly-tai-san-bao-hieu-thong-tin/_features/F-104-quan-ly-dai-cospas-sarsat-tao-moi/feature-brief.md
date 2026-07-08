---
id: F-104
name: "Quản lý Đài COSPAS-SARSAT - Tạo mới"
slug: quan-ly-dai-cospas-sarsat-tao-moi
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:14Z"
last-updated: "2026-07-07T03:33:14Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài COSPAS-SARSAT - Tạo mới

## Description

Tính năng cho phép cán bộ nghiệp vụ (operator) tạo mới một Đài COSPAS-SARSAT (hệ thống vệ tinh tìm kiếm cứu nạn) trong hệ thống quản lý tài sản báo hiệu và thông tin hàng hải. Người dùng nhập đầy đủ thông tin: mã đài, tên đài, tần số hoạt động (frequency), vùng phủ sóng (coverageArea), giao thức beacon (beaconProtocol), kênh khẩn cấp (emergencyChannel), loại anten (antennaType), tầm hiệu lực tín hiệu (signalRange), chế độ vận hành (operatingMode), địa chỉ trạm (locationAddress), người liên hệ (contactPerson), số điện thoại (contactPhone) và các thông tin chung. Dữ liệu được kiểm tra tính hợp lệ; mã code phải duy nhất. Kết quả trả về đối tượng CoastalStationCospasSarsat với trạng thái DRAFT.

## Business Intent

Số hóa quy trình đăng ký và quản lý các Đài COSPAS-SARSAT phục vụ công tác tìm kiếm cứu nạn hàng hải. Đảm bảo mỗi đài thu vệ tinh cứu nạn được khởi tạo với đầy đủ thông số kỹ thuật (tần số, giao thức beacon, kênh khẩn cấp) và hành chính, tạo cơ sở dữ liệu tập trung cho việc phối hợp SAR và quản lý hạ tầng thông tin khẩn cấp trên biển.

## Flow Summary

Người dùng operator truy cập màn hình quản lý Đài COSPAS-SARSAT → Chọn "Thêm mới" → Hệ thống hiển thị form với các trường: code, name, frequency, coverageArea, beaconProtocol, emergencyChannel, antennaType, signalRange, operatingMode, locationAddress, contactPerson, contactPhone, description → Người dùng nhập dữ liệu và nhấn "Lưu" → Hệ thống kiểm tra validation (code unique, các trường bắt buộc) → Nếu hợp lệ, tạo bản ghi CoastalStationCospasSarsat mới trạng thái DRAFT, trả về HTTP 200 → Nếu lỗi, trả về HTTP 400.

## Acceptance Criteria

- **AC-01**: Nhập đầy đủ thông tin hợp lệ, hệ thống tạo thành công Đài COSPAS-SARSAT mới (DRAFT), trả về HTTP 200 kèm dữ liệu.
- **AC-02**: Nhập mã code đã tồn tại, hệ thống từ chối (HTTP 400) với thông báo mã đã được sử dụng.
- **AC-03**: Bỏ trống trường bắt buộc, hệ thống hiển thị lỗi validation và không tạo bản ghi.
- **AC-04**: Nhập tần số không hợp lệ hoặc tọa độ ngoài phạm vi, hệ thống trả về lỗi validation.

## In Scope

- Tạo mới Đài COSPAS-SARSAT với đầy đủ thông số kỹ thuật
- Kiểm tra tính duy nhất của code
- Validation dữ liệu đầu vào
- Ghi lịch sử tạo mới

## Out of Scope

- Phê duyệt (thuộc F-107)
- Tích hợp với hệ thống vệ tinh COSPAS-SARSAT thực tế
- Tạo hàng loạt

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | CRUD | Full quyền |
| operator | CRUD | Tạo mới |
| approver_L1 | Read | Không |
| approver_L2 | Read | Không |
| viewer | Read | Không |

## Entities

- **CoastalStationCospasSarsat**: Đại diện Đài COSPAS-SARSAT với các trường: frequency, coverageArea, beaconProtocol, emergencyChannel, antennaType, signalRange, operatingMode, kế thừa BaseStation.
- **CoastalStationCospasSarsatRequest**: DTO tạo mới.

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-001 | Mã (code) phải duy nhất, không để trống, ≤ 50 ký tự | CoastalStationCospasSarsat.code | @Column(unique=true), @NotBlank |
| BR-007 | Description ≤ 1000 ký tự | CoastalStationCospasSarsat.description | @Size(max=1000) |
| BR-009 | Chỉ soft-delete | CoastalStationCospasSarsat | @SQLRestriction |
| BR-015 | Trạng thái khởi tạo mặc định DRAFT | CoastalStationCospasSarsat.status | @Builder.Default |

## Testing Strategy

(populated by qa stage)
