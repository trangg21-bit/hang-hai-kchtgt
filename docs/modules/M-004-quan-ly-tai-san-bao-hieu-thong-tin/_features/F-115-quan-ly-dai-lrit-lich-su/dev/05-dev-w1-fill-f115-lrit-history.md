---
id: F-115
name: "Quản lý Đài LRIT - Lịch sử"
slug: quan-ly-dai-lrit-lich-su
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:22Z"
last-updated: "2026-07-08T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài LRIT - Lịch sử

## Description

Tính năng cho phép người dùng xem lịch sử thay đổi (audit trail) của một đài thông tin LRIT (Long Range Identification and Tracking) theo mã định danh UUID. Hệ thống ghi nhận tất cả các hành động: CREATE, UPDATE, DELETE, APPROVE_L1, APPROVE_L2, REJECT qua HistoryService với thông tin chi tiết bao gồm: stationCode (mã đài), actionType (loại hành động), previousValue (giá trị trước), newValue (giá trị sau), changedBy (người thực hiện), changedAt (thời gian thực hiện). Dữ liệu lịch sử được truy vấn theo stationCode, chuyển đổi thành danh sách CoastalStationLRITHistoryResponse và trả về qua GET /api/v1/stations/lrit/{id}/history.

## Business Intent

Lưu trữ và truy xuất lịch sử thay đổi của đài thông tin LRIT phục vụ kiểm toán, truy nguyên sự cố và phân tích xu hướng thay đổi thông tin kỹ thuật của đài theo thời gian.

## Flow Summary

1. Người dùng chọn đài LRIT cần xem lịch sử và truy cập GET /api/v1/stations/lrit/{id}/history. 2. Hệ thống tìm kiếm entity theo UUID để lấy stationCode. 3. Nếu không tìm thấy, trả về lỗi "LRIT station not found". 4. Nếu tìm thấy, hệ thống gọi historyService.getHistory(stationCode) để lấy danh sách bản ghi lịch sử, sau đó map từng bản ghi HistoryEntity sang CoastalStationLRITHistoryResponse DTO với các trường: id, stationCode, actionType, previousValue, newValue, changedBy, changedAt. 5. Trả về ResponseEntity<List<CoastalStationLRITHistoryResponse>> với HTTP 200.

## Acceptance Criteria

- Hệ thống chấp nhận GET /api/v1/stations/lrit/{id}/history với UUID hợp lệ
- Khi UUID tồn tại, hệ thống trả về List<CoastalStationLRITHistoryResponse> chứa toàn bộ lịch sử thay đổi của đài
- Mỗi bản ghi lịch sử chứa: id, stationCode, actionType, previousValue, newValue, changedBy, changedAt
- Hệ thống ghi nhận các hành động CREATE, UPDATE, DELETE, APPROVE_L1, APPROVE_L2, REJECT vào lịch sử tự động
- Khi UUID không tồn tại, hệ thống trả về lỗi "LRIT station not found"

## In Scope

(Xem lịch sử thay đổi của đài LRIT theo UUID, trả về danh sách history response)

## Out of Scope

(Tạo mới (F-110), cập nhật (F-111), phê duyệt (F-113), xóa (F-112), chi tiết (F-114))

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Quản trị viên (Admin) | Full | Xem tất cả lịch sử |
| Chuyên viên nghiệp vụ (Operator) | Read | Xem lịch sử đài của mình |
| Lãnh đạo phê duyệt L1 | Read | Xem lịch sử để ra quyết định |
| Lãnh đạo phê duyệt L2 | Read | Xem lịch sử để ra quyết định |
| Người xem (Viewer) | Read | Chỉ xem lịch sử |

## Entities

- BaseStation (cơ sở, abstract) — id, code, createdAt, updatedAt, deletedAt
- CoastalStationLRIT (coastal_station_lrit) — terminalId, imoNumber, reportingInterval, antennaHeight, powerOutput, antennaType, locationAddress, contactPerson, contactPhone, dataFormat, communicationChannel, coverageArea
- HistoryEntity (lịch sử) — id, stationCode, actionType, previousValue, newValue, changedBy, changedAt
- StationHistoryActionType (enum) — CREATE, UPDATE, DELETE, APPROVE_L1, APPROVE_L2, REJECT
- CoastalStationLRITHistoryResponse (DTO) — id, stationCode, actionType, previousValue, newValue, changedBy, changedAt
- HistoryService — recordHistory(stationCode, action, previousValue, newValue, changedBy, changedAt), getHistory(stationCode)

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-009 | Mỗi hành động thay đổi đều được ghi nhận vào lịch sử | History | historyService.recordHistory() trong service: create, update, delete, approve, reject |
| BR-001 | Mã (code) dùng để query lịch sử, phải duy nhất | History | stationCode từ BaseStation.code |

## Testing Strategy

(populated by qa stage)
