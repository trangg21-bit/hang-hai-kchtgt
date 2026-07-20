---
id: F-110
name: "Quản lý Đài LRIT - Tạo mới"
slug: quan-ly-dai-lrit-tao-moi
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:22Z"
last-updated: "2026-07-07T03:33:22Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài LRIT - Tạo mới

## Description

Tính năng cho phép cán bộ nghiệp vụ (operator) tạo mới một Đài LRIT (Long Range Identification and Tracking — hệ thống nhận dạng và theo dõi tầm xa) trong hệ thống quản lý tài sản báo hiệu và thông tin hàng hải. Người dùng nhập thông tin nghiệp vụ bao gồm: mã terminal (terminalId), số IMO (imoNumber), khoảng thời gian báo cáo (reportingInterval), chiều cao anten (antennaHeight), công suất phát (powerOutput), loại anten (antennaType), định dạng dữ liệu (dataFormat), kênh liên lạc (communicationChannel), vùng phủ sóng (coverageArea), địa chỉ trạm (locationAddress), người liên hệ (contactPerson), số điện thoại (contactPhone) và các thông tin chung. Mã code và terminalId phải duy nhất. Kết quả trả về CoastalStationLRIT với trạng thái DRAFT.

## Business Intent

Số hóa quy trình đăng ký và quản lý các Đài LRIT phục vụ công tác giám sát và nhận dạng tàu thuyền tầm xa theo công ước quốc tế SOLAS. Đảm bảo mỗi đài LRIT được khởi tạo với đầy đủ thông số kỹ thuật (terminalId, IMO, anten, công suất) và hành chính, tạo cơ sở dữ liệu tập trung cho việc theo dõi tàu thuyền trên biển.

## Flow Summary

Người dùng operator truy cập màn hình quản lý Đài LRIT → Chọn "Thêm mới" → Hệ thống hiển thị form với các trường: terminalId, imoNumber, reportingInterval, antennaHeight, powerOutput, antennaType, dataFormat, communicationChannel, coverageArea, locationAddress, contactPerson, contactPhone, code, name, description → Người dùng điền dữ liệu và nhấn "Lưu" → Hệ thống kiểm tra validation (code/terminalId unique) → Nếu hợp lệ, tạo bản ghi mới trạng thái DRAFT, trả về HTTP 200 → Nếu lỗi, trả về HTTP 400.

## Acceptance Criteria

- **AC-01**: Nhập đầy đủ thông tin hợp lệ, tạo thành công Đài LRIT (DRAFT), HTTP 200.
- **AC-02**: Nhập terminalId/code đã tồn tại, hệ thống từ chối (HTTP 400).
- **AC-03**: Bỏ trống trường bắt buộc, hiển thị lỗi validation, không tạo bản ghi.
- **AC-04**: Nhập số IMO không đúng định dạng hoặc tọa độ ngoài phạm vi, trả về lỗi.

## In Scope

- Tạo mới Đài LRIT với thông số kỹ thuật
- Kiểm tra unique terminalId và code
- Validation dữ liệu
- Ghi lịch sử tạo mới

## Out of Scope

- Phê duyệt (thuộc F-113)
- Tích hợp với hệ thống LRIT thực tế

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | CRUD | Full quyền |
| operator | CRUD | Tạo mới |
| approver_L1 | Read | Không |
| approver_L2 | Read | Không |
| viewer | Read | Không |

## Entities

- **CoastalStationLRIT**: terminalId, imoNumber, reportingInterval, antennaHeight, powerOutput, antennaType, dataFormat, communicationChannel, coverageArea, kế thừa BaseStation.
- **CoastalStationLRITRequest**: DTO tạo mới.

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-001 | Mã (code) phải duy nhất, không để trống | CoastalStationLRIT.code | @Column(unique=true), @NotBlank |
| BR-009 | Soft-delete | CoastalStationLRIT | @SQLRestriction |
| BR-015 | Trạng thái khởi tạo DRAFT | CoastalStationLRIT.status | @Builder.Default |

## Testing Strategy

(populated by qa stage)
