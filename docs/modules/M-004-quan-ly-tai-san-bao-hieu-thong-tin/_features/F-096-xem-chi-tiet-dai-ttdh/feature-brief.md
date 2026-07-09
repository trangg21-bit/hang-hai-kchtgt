---
id: F-096
name: "Xem chi tiết Đài TTDH"
slug: xem-chi-tiet-dai-ttdh
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:57Z"
last-updated: "2026-07-07T03:32:57Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Xem chi tiết Đài TTDH

## Description

Tính năng cho phép người dùng xem chi tiết thông tin của một Đài Thông tin Duyên hải (VTS) theo định danh (ID). Hệ thống hiển thị đầy đủ các thông tin của đài bao gồm: mã đài, tên đài, dải tần số hoạt động, công suất phát, loại thiết bị, địa chỉ trạm, người liên hệ, số điện thoại, tọa độ (latitude/longitude), trạng thái, trạng thái phê duyệt, đơn vị quản lý và các thông tin khác. API GET /api/v1/stations/coastal/{id} trả về đối tượng CoastalStationVTSResponse đã được build thông qua service.buildResponse(). Nếu không tìm thấy bản ghi hoặc bản ghi đã bị soft-delete, hệ thống trả về HTTP 404.

## Business Intent

Cung cấp giao diện tra cứu thông tin chi tiết của từng Đài TTDH phục vụ công tác quản lý, kiểm tra và báo cáo. Người dùng ở tất cả các vai trò (admin, operator, approver, viewer) đều cần truy cập thông tin đầy đủ của đài để thực hiện các nghiệp vụ liên quan như đánh giá phê duyệt, kiểm tra thông số kỹ thuật hoặc báo cáo thống kê.

## Flow Summary

Người dùng truy cập màn hình danh sách Đài TTDH → Chọn một đài để xem chi tiết → Hệ thống gọi API GET /api/v1/stations/coastal/{id} → Service tìm kiếm bản ghi theo id, kiểm tra bản ghi tồn tại và chưa bị soft-delete → Nếu tìm thấy, service build response DTO (CoastalStationVTSResponse) và trả về HTTP 200 kèm dữ liệu chi tiết → Nếu không tìm thấy hoặc đã bị xóa, trả về HTTP 404.

## Acceptance Criteria

- **AC-01**: Khi tra cứu theo ID hợp lệ của Đài TTDH đang hoạt động, hệ thống trả về HTTP 200 kèm đầy đủ thông tin chi tiết của đài.
- **AC-02**: Khi tra cứu theo ID không tồn tại hoặc đã bị soft-delete, hệ thống trả về HTTP 404.
- **AC-03**: Tất cả các vai trò (admin, operator, approver_L1, approver_L2, viewer) đều có thể xem chi tiết đài.

## In Scope

- Xem chi tiết Đài TTDH theo ID
- Build response DTO với đầy đủ thông tin
- Kiểm tra bản ghi tồn tại trước khi trả về

## Out of Scope

- Xem lịch sử thay đổi của đài (thuộc F-097)
- Xem danh sách tất cả đài (thuộc GET /api/v1/stations/coastal và /search)

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | Read | Có thể xem chi tiết |
| operator | Read | Có thể xem chi tiết |
| approver_L1 | Read | Có thể xem chi tiết để phê duyệt |
| approver_L2 | Read | Có thể xem chi tiết để phê duyệt |
| viewer | Read | Có thể xem chi tiết |

## Entities

- **CoastalStationVTS**: Đối tượng dữ liệu của Đài TTDH.
- **CoastalStationVTSResponse**: DTO phản hồi chứa các trường thông tin chi tiết của đài, được build bởi service.buildResponse().

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-009 | Bản ghi đã soft-delete không hiển thị trong kết quả truy vấn | CoastalStationVTS | @SQLRestriction("deleted_at IS NULL") |

## Testing Strategy

(populated by qa stage)
