---
id: F-092
name: Quản lý Đài TTDH - Tạo mới
slug: quan-ly-dai-ttdh-tao-moi
module-id: M-004
status: proposed
classification: local
priority: medium
created: 2026-07-07T03:32:57Z
last-updated: 2026-07-21T02:49:08Z
locked-fields: []
consumed_by_modules: []
source-paths:
  - src/main/java/com/hanghai/kchtg/station/
  - src/test/java/com/hanghai/kchtg/station/
---
# Feature: Quản lý Đài TTDH - Tạo mới

## Description

Tính năng cho phép cán bộ nghiệp vụ (operator) tạo mới một Đài Thông tin Duyên hải (VTS) trong hệ thống quản lý tài sản báo hiệu và thông tin hàng hải. Người dùng nhập đầy đủ thông tin nghiệp vụ của đài bao gồm: mã đài (code), tên đài (name), dải tần số hoạt động (frequencyBand), công suất phát (transmitPower), loại thiết bị (equipmentType), địa chỉ trạm (locationAddress), người liên hệ (contactPerson), số điện thoại liên hệ (contactPhone), tọa độ (latitude/longitude) và các thông tin chung khác (description, unitId). Dữ liệu được kiểm tra tính hợp lệ toàn diện trước khi lưu — mã code phải là duy nhất trong hệ thống, tọa độ trong phạm vi cho phép (latitude -90..90, longitude -180..180). Kết quả trả về đối tượng Đài TTDH đã được tạo với trạng thái mặc định là DRAFT, sẵn sàng cho quy trình phê duyệt tiếp theo.

## Business Intent

Số hóa quy trình đăng ký và quản lý các Đài Thông tin Duyên hải (VTS) phục vụ công tác quản lý nhà nước về hàng hải. Đảm bảo mỗi đài ven biển được khởi tạo với đầy đủ thông tin kỹ thuật (dải tần, công suất, loại thiết bị) và hành chính (địa chỉ, người liên hệ), tạo cơ sở dữ liệu tập trung cho việc theo dõi, vận hành và bảo trì toàn bộ hệ thống đài TTDH ven biển Việt Nam.

## Flow Summary

Người dùng có quyền operator truy cập màn hình quản lý Đài TTDH → Chọn chức năng "Thêm mới" → Hệ thống hiển thị form nhập liệu với các trường thông tin (code, name, frequencyBand, transmitPower, equipmentType, locationAddress, contactPerson, contactPhone, latitude, longitude, description, unitId) → Người dùng điền dữ liệu và nhấn "Lưu" → Hệ thống kiểm tra tính hợp lệ phía server (bắt buộc nhập code, name; code không trùng; tọa độ trong khoảng cho phép) → Nếu hợp lệ, hệ thống tạo bản ghi CoastalStationVTS mới với trạng thái DRAFT và trả về HTTP 200 kèm dữ liệu đối tượng vừa tạo → Nếu không hợp lệ, hệ thống trả về HTTP 400 kèm thông báo lỗi chi tiết.

## Acceptance Criteria

- **AC-01**: Khi nhập đầy đủ thông tin hợp lệ và nhấn lưu, hệ thống tạo thành công Đài TTDH mới với trạng thái mặc định DRAFT và trả về HTTP 200 kèm dữ liệu đối tượng CoastalStationVTS vừa tạo.
- **AC-02**: Khi nhập mã code đã tồn tại trong hệ thống, hệ thống từ chối tạo mới và trả về HTTP 400 kèm thông báo lỗi mã đã được sử dụng (vi phạm BR-001).
- **AC-03**: Khi bỏ trống trường bắt buộc (code, name), hệ thống hiển thị lỗi validation tương ứng và không tạo bản ghi.
- **AC-04**: Khi nhập tọa độ ngoài phạm vi (latitude không trong [-90,90] hoặc longitude không trong [-180,180]), hệ thống trả về lỗi validation và không tạo bản ghi.

## In Scope

- Tạo mới Đài TTDH với đầy đủ các trường thông tin kỹ thuật và hành chính
- Kiểm tra tính duy nhất của mã đài (code) trước khi tạo
- Kiểm tra validation các trường bắt buộc và định dạng dữ liệu
- Ghi nhận lịch sử tạo mới (CREATE action) vào bảng lịch sử
- Trả về đối tượng đã tạo với trạng thái DRAFT

## Out of Scope

- Quy trình phê duyệt (thuộc F-095)
- Gửi thông báo sau khi tạo
- Đồng bộ lên GIS M-007 (không áp dụng cho CoastalStation*)
- Tạo hàng loạt (batch import)

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | CRUD | Full quyền, có thể tạo mới |
| operator | CRUD | Có thể tạo mới đài TTDH |
| approver_L1 | Read | Không có quyền tạo mới |
| approver_L2 | Read | Không có quyền tạo mới |
| viewer | Read | Không có quyền tạo mới |

## Entities

- **CoastalStationVTS**: Đại diện cho Đài Thông tin Duyên hải VTS. Các trường chính gồm code (mã đài, unique), name (tên đài), frequencyBand (dải tần số), transmitPower (công suất phát), equipmentType (loại thiết bị), locationAddress (địa chỉ), contactPerson, contactPhone, kế thừa từ BaseStation (latitude, longitude, description, unitId, isActive, status, approvalStatus).
- **BaseStation** (abstract): Lớp cơ sở chứa các trường dùng chung: id (UUID), code, name, latitude, longitude, description, unitId, isActive, status (StationStatus), approvalStatus (StationApprovalStatus), approvalLevel, rejectedReason, timestamp (createdAt, updatedAt, deletedAt) và phương thức softDelete().

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-001 | Mã (code) phải là duy nhất, không được để trống, tối đa 50 ký tự | CoastalStationVTS.code | @Column(unique=true), @NotBlank, @Size(max=50) |
| BR-003 | Vĩ độ (latitude) phải trong khoảng -90.0 đến 90.0 | CoastalStationVTS.latitude | @DecimalMin("-90.0"), @DecimalMax("90.0") |
| BR-004 | Kinh độ (longitude) phải trong khoảng -180.0 đến 180.0 | CoastalStationVTS.longitude | @DecimalMin("-180.0"), @DecimalMax("180.0") |
| BR-007 | Mô tả (description) tối đa 1000 ký tự | CoastalStationVTS.description | @Size(max=1000) |
| BR-008 | Mã code không thể thay đổi sau khi tạo (immutable) | CoastalStationVTS.code | Code comment |
| BR-009 | Không thể xóa vĩnh viễn — chỉ soft-delete (đặt deleted_at) | CoastalStationVTS | softDelete(), @SQLRestriction |
| BR-015 | Trạng thái khởi tạo mặc định là DRAFT | CoastalStationVTS.status | @Builder.Default |

## Testing Strategy

(populated by qa stage)
