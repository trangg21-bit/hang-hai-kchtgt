---
id: F-097
name: "Quản lý Đài TTDH - Lịch sử"
slug: quan-ly-dai-ttdh-lich-su
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:57Z"
last-updated: "2026-07-08T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài TTDH - Lịch sử

## Description

Tính năng cho phép tất cả các vai trò xem danh sách lịch sử thay đổi (audit trail) của một đài thông tin duyên hải loại VTS cụ thể, bao gồm các hành động: tạo mới (CREATE), cập nhật (UPDATE), phê duyệt L1 (APPROVE_L1), phê duyệt L2 (APPROVE_L2), từ chối (REJECT) và xóa mềm (SOFT_DELETE). Hệ thống truy vấn lịch sử qua endpoint `GET /api/v1/stations/coastal/{id}/history` và trả về danh sách `CoastalStationVTSHistoryResponse` chứa thông tin về từng thay đổi: loại hành động, trường nào bị thay đổi (changedField), giá trị trước và sau (previousValue, newValue), người thay đổi (changedBy), thời gian thay đổi (changedAt) và dữ liệu so sánh chi tiết dưới dạng JSON (diffData). Lịch sử thay đổi được ghi nhận tự động mỗi khi có bất kỳ thao tác nào trên đài VTS thông qua service layer, đảm bảo khả năng truy vết đầy đủ cho mục đích kiểm toán và giải trình. Mỗi hành động trong lịch sử là một bản ghi độc lập có thể được truy vấn theo thời gian tăng dần hoặc giảm dần.

## Business Intent

Theo dõi và truy vết toàn bộ lịch sử thay đổi của đài VTS để phục vụ kiểm toán, phân tích nguyên nhân sự cố, giải trình trách nhiệm và đảm bảo minh bạch trong quản lý tài sản thông tin hàng hải.

## Flow Summary

1. Người dùng đăng nhập và truy cập vào mục quản lý đài VTS. 2. Người dùng chọn một đài cụ thể và nhấn nút "Lịch sử" hoặc "Xem lịch sử thay đổi". 3. Hệ thống gửi yêu cầu `GET /api/v1/stations/coastal/{id}/history` lên backend. 4. Backend gọi service method `getHistory(id)` để truy xuất toàn bộ lịch sử thay đổi của đài theo ID. 5. Service trả về danh sách `List<CoastalStationVTSHistoryResponse>` chứa tất cả các hành động đã thực hiện trên đài này, được sắp xếp theo thời gian (mặc định giảm dần — mới nhất trước). 6. Giao diện hiển thị danh sách lịch sử dạng timeline: thời gian, hành động (CREATE/UPDATE/APPROVE_L1/APPROVE_L2/REJECT/SOFT_DELETE), tên trường thay đổi, giá trị cũ → giá trị mới, người thực hiện. 7. Người dùng có thể lọc, sắp xếp và tìm kiếm trong lịch sử để nhanh chóng xác định thay đổi cần tìm.

## Acceptance Criteria

- Khi gửi GET `/api/v1/stations/coastal/{id}/history` với ID hợp lệ, hệ thống trả về HTTP 200 với `List<CoastalStationVTSHistoryResponse>` chứa tất cả các hành động đã thực hiện trên đài
- Mỗi bản ghi lịch sử chứa đầy đủ thông tin: actionType (CREATE/UPDATE/APPROVE_L1/APPROVE_L2/REJECT/SOFT_DELETE), changedBy (người thực hiện), changedAt (thời gian), changedField (trường thay đổi), previousValue (giá trị cũ), newValue (giá trị mới), diffData (JSON so sánh)
- Khi ID đài không tồn tại hoặc đã bị xóa mềm, hệ thống trả về HTTP 404
- Danh sách lịch sử được sắp xếp theo thời gian giảm dần (hành động mới nhất hiển thị đầu tiên)
- Hành động CREATE được ghi nhận ngay khi đài được tạo mới qua endpoint `POST /api/v1/stations/coastal`

## In Scope

(populated by ba stage)

## Out of Scope

(populated by ba stage)

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| Quản trị viên (Admin) | Full | Xem toàn bộ lịch sử của mọi đài |
| Chuyên viên nghiệp vụ (Operator) | Read | Xem lịch sử đài của đơn vị mình |
| Lãnh đạo phê duyệt L1/L2 | Read | Xem lịch sử để phục vụ ra quyết định phê duyệt |
| Người xem (Viewer) | Read | Xem lịch sử tất cả đài đã xuất bản |

## Entities

- **CoastalStationVTS** (`coastal_station_vts`) — Kế thừa từ BaseStation: id (UUID), code, name, latitude, longitude, description, unitId, isActive, status (StationStatus), approvalStatus (StationApprovalStatus), approvalLevel, approvedBy, approvedDate, rejectionReason, createdAt, updatedAt, deletedAt — Trường đặc thù VTS: frequencyBand, transmitPower, equipmentType, locationAddress, contactPerson, contactPhone
- **HistoryRecord** (Per-station history service) — entityId (UUID), actionType (CREATE/UPDATE/APPROVE_L1/APPROVE_L2/REJECT/SOFT_DELETE), changedBy (Long), changedAt (LocalDateTime), details (JSON diffData)

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-009 | Không thể xóa vĩnh viễn — chỉ soft-delete | History | Soft-delete vẫn được ghi nhận trong lịch sử với action type SOFT_DELETE |
| BR-015 | Trạng thái khởi tạo mặc định là PENDING_APPROVAL | History | Hành động CREATE ghi nhận trạng thái ban đầu |

## Testing Strategy

(populated by qa stage)
