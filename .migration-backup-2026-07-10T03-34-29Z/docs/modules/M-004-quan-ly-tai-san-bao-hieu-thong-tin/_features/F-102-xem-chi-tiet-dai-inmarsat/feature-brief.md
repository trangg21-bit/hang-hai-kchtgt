---
id: F-102
name: "Xem chi tiết Đài Inmarsat"
slug: xem-chi-tiet-dai-inmarsat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:06Z"
last-updated: "2026-07-07T03:33:06Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Xem chi tiết Đài Inmarsat

## Description

Tính năng cho phép người dùng xem chi tiết thông tin của một Đài Inmarsat theo định danh (ID). Hệ thống hiển thị đầy đủ thông tin: mã thiết bị (deviceCode), loại modem (modemType), tần số hoạt động (frequency), vùng phủ sóng (coverageZone), mã SAR (sarCode), địa chỉ trạm, người liên hệ, số điện thoại, tọa độ, trạng thái, trạng thái phê duyệt và đơn vị quản lý. API GET /api/v1/stations/inmarsat/{id} trả về CoastalStationInmarsatResponse. Nếu không tìm thấy hoặc đã soft-delete, trả về HTTP 404.

## Business Intent

Cung cấp giao diện tra cứu thông tin chi tiết của từng Đài Inmarsat phục vụ quản lý, kiểm tra và báo cáo. Đặc biệt quan trọng cho công tác phối hợp SAR (tìm kiếm cứu nạn) khi cần tra cứu thông tin vùng phủ sóng và mã SAR.

## Flow Summary

Người dùng chọn Đài Inmarsat từ danh sách → GET /api/v1/stations/inmarsat/{id} → Service tìm kiếm, build response → Trả về HTTP 200 kèm dữ liệu hoặc HTTP 404.

## Acceptance Criteria

- **AC-01**: Tra cứu ID hợp lệ trả về HTTP 200 kèm đầy đủ thông tin.
- **AC-02**: Tra cứu ID không tồn tại/đã xóa trả về HTTP 404.
- **AC-03**: Tất cả vai trò đều có thể xem chi tiết.

## In Scope

- Xem chi tiết Đài Inmarsat theo ID
- Build response DTO

## Out of Scope

- Xem lịch sử (thuộc F-103)
- Danh sách tất cả đài

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | Read | Xem chi tiết |
| operator | Read | Xem chi tiết |
| approver_L1 | Read | Xem để phê duyệt |
| approver_L2 | Read | Xem để phê duyệt |
| viewer | Read | Xem chi tiết |

## Entities

- **CoastalStationInmarsat**: Đối tượng dữ liệu.
- **CoastalStationInmarsatResponse**: DTO phản hồi.

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-009 | Bản ghi soft-delete không hiển thị | CoastalStationInmarsat | @SQLRestriction |

## Testing Strategy

(populated by qa stage)
