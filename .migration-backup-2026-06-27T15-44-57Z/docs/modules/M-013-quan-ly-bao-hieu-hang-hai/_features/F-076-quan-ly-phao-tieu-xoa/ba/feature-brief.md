---
id: F-076
name: Quan ly Phao tieu - Xoa
slug: quan-ly-phao-tieu-xoa
module: M-013
status: proposed
---

# Quan ly Phao tieu - Xoa

## Description

Chuyên viên nghiệp vụ xóa mềm (soft delete) phao tiêu (Buoy) đã tồn tại trong hệ thống. Xóa mềm không xóa dữ liệu vật lý mà chỉ đánh dấu bản ghi là đã bị xóa bằng cách set `deletedAt` và status = `DELETED`. Phao tiêu bị xóa không còn hiển thị trên bản đồ và trong danh sách công khai nhưng vẫn được giữ lại trong database để bảo toàn lịch sử.

## Business Intent

Hệ thống cần cơ chế xóa an toàn cho phao tiêu — không xóa vĩnh viễn dữ liệu mà chỉ đánh dấu trạng thái DELETED. Đảm bảo: (1) bảo toàn lịch sử, (2) không mất thông tin kiểm toán, (3) có thể khôi phục nếu xóa nhầm.

## Flow Summary

1. Chuyên viên chọn phao tiêu → "Xóa"
2. Hệ thống hiển thị modal xác nhận với thông tin chi tiết
3. Chuyên viên xác nhận bằng cách nhập tên phao tiêu hoặc nhấn "Xác nhận xóa"
4. Hệ thống kiểm tra quyền và trạng thái hiện tại
5. Hệ thống set status = `DELETED`, deletedAt = current timestamp
6. Phao tiêu bị lọc khỏi danh sách (SQLRestriction deleted_at IS NULL)
7. History log được ghi nhận với actionType = "DELETE"
8. Hiển thị thông báo "Đã xóa phao tiêu thành công"

## In Scope

- Xóa mềm: set status = DELETED, deletedAt = current timestamp
- Modal xác nhận xóa với thông tin chi tiết
- Kiểm tra quyền trước khi xóa
- Kiểm tra trạng thái: không cho phép xóa phao tiêu đang chờ phê duyệt
- Tự động ghi log history vào BuoyHistory
- Phao tiêu bị xóa hiển thị trong trang "Lịch sử" với filter deletedOnly

## Out of Scope

- Xóa cứng dữ liệu
- Khôi phục từ bản sao lưu
- Xóa hàng loạt
- Tích hợp xóa dữ liệu tham chiếu
- Auto-cleanup sau thời gian

## Data Model — Buoy (Delete operation)

| Trường (VN) | Thay đổi khi xóa | Ghi chú |
|---|---|---|
| status | → `DELETED` | |
| deletedAt | → current timestamp | |
| approvalStatus | Giữ nguyên | |
| name/code/latitude/longitude/... | Giữ nguyên | Không xóa dữ liệu |

## Business Rules

| ID | Rule | Áp dụng cho | Nguồn |
|---|---|---|---|
| BR-076-01 | Xóa là soft delete: không xóa vật lý, chỉ set status = DELETED và deletedAt | Xóa | RAW §3.1 |
| BR-076-02 | Không cho phép xóa phao tiêu đã có status = DELETED | Xóa | Logic nghiệp vụ |
| BR-076-03 | Không cho phép xóa phao tiêu có status = PENDING_APPROVAL, APPROVED_L1, APPROVED_L2 | Xóa | Quy trình nghiệp vụ |
| BR-076-04 | Chỉ admin và system-admin mới được quyền xóa | Quyền | URD §4 |
| BR-076-05 | Khi xóa phao tiêu, điểm GIS tương ứng không bị xóa tự động | Integration | M-007 |
| BR-076-06 | Phao tiêu bị xóa vẫn được query từ buoy_histories | History | Logic nghiệp vụ |
| BR-076-07 | Chỉ phao tiêu thuộc đơn vị của người xóa mới được phép xóa | Quyền | Phân quyền |
| BR-076-08 | Modal xác nhận xóa yêu cầu nhập tên phao tiêu | UI | UX |
| BR-076-09 | History log bắt buộc phải được ghi khi xóa | History | URD §5 |
| BR-076-10 | Khi xóa phao tiêu PUBLISHED: điểm trên bản đồ được ẩn | GIS | M-007 |

## Permission/Role Requirements

| Role | Level | Quyền |
|---|---|---|
| system-admin | Full | Xóa tất cả |
| admin (Cục) | Delete | Xóa phao tiêu Cục |
| admin (Chi cục/Cảng vụ) | Delete | Xóa phao tiêu đơn vị mình |
| user | None | Không được phép xóa |
| leader | None | Không được phép xóa |

## Error Handling

| Error | HTTP Status | Message (VN) | Recovery |
|---|---|---|---|
| Không tồn tại | 404 | `Phao tiêu không tìm thấy.` | Chọn khác |
| Đã bị xóa | 409 | `Phao tiêu này đã bị xóa trước đó.` | Không xóa lại |
| Không có quyền xóa | 403 | `Bạn không có quyền xóa phao tiêu này.` | Liên hệ admin |
| Đơn vị khác | 403 | `Bạn không có quyền xóa phao tiêu thuộc đơn vị này.` | Không xóa |
| Xác nhận sai tên | 400 | `Tên phao tiêu xác nhận không đúng.` | Nhập lại |
| Lỗi server | 500 | `Hệ thống đang xảy ra sự cố.` | Báo admin |

## Integration Points

| Integration | Direction | Description |
|---|---|---|
| M-007 PointObject | Outbound | Khi xóa, điểm GIS cần được ẩn/disable |
| Notification Service | Outbound | Khi xóa PUBLISHED, thông báo người dùng bản đồ |

## Acceptance Criteria

### AC-1: Xóa mềm DRAFT thành công
- **Given** admin đăng nhập, chọn phao tiêu DRAFT
- **When** nhấn "Xóa" và xác nhận trong modal
- **Then** status → `DELETED`, deletedAt được set
- **And** biến mất khỏi danh sách
- **And** history log actionType = "DELETE"

### AC-2: Xóa PUBLISHED và ẩn trên bản đồ
- **Given** phao tiêu PUBLISHED, đã hiển thị trên bản đồ
- **When** xóa
- **Then** status → `DELETED`
- **And** điểm GIS trên bản đồ được ẩn
- **And** history log được ghi nhận

### AC-3: Không xóa PENDING_APPROVAL
- **Given** phao tiêu PENDING_APPROVAL
- **When** cố gắng xóa
- **Then** lỗi "Không thể xóa phao tiêu đang chờ phê duyệt"

### AC-4: Không xóa đã bị xóa
- **Given** phao tiêu DELETED
- **When** cố gắng xóa
- **Then** "Phao tiêu này đã bị xóa trước đó"

### AC-5: Không xóa đơn vị khác
- **Given** chuyên viên Chi cục 1
- **When** cố gắng xóa phao tiêu Chi cục 2
- **Then** "Bạn không có quyền xóa phao tiêu thuộc đơn vị này"

### AC-6: Modal xác nhận nhập tên
- **Given** nhấn "Xóa"
- **When** modal hiện ra với tên "PHAO TIEU HA NOI 01"
- **And** nhập sai tên
- **Then** nút "Xác nhận xóa" bị disable

### AC-7: User doanh nghiệp không xóa được
- **Given** user/doanh nghiệp cảng đăng nhập
- **When** DELETE /buoys/{id}
- **Then** 403 Forbidden

### AC-8: History log ghi nhận đầy đủ
- **Given** phao tiêu được xóa thành công
- **Then** entry trong `buoy_histories` với actionType = "DELETE"
- **And** changedBy = ID người xóa
- **And** changedAt = timestamp hiện tại

### AC-9: Phao tiêu xóa không hiển thị trong list
- **Given** phao tiêu DELETED
- **When** mở danh sách (không filter)
- **Then** không xuất hiện trong danh sách
- **And** chỉ hiện khi filter "Hiển thị đã xóa"

### AC-10: Xóa APPROVED_L1/APPROVED_L2 với cảnh báo
- **Given** phao tiêu APPROVED_L1 hoặc APPROVED_L2
- **When** admin cố xóa
- **Then** modal cảnh báo "Phao tiêu đã được phê duyệt — xóa sẽ làm mất trạng thái công bố"
- **And** sau xác nhận → DELETED

## Testing Strategy

- **Unit Testing**: soft delete, reject delete on DELETED, reject delete on PENDING_APPROVAL
- **Integration Testing**: delete flow with history, DB integrity via SQLRestriction, M-007 sync, permission enforcement
- **E2E Testing**: modal confirm, delete success, permission denied UI, deleted hidden from list
- **Security Testing**: RBAC, CSRF protection, IdOR prevention
