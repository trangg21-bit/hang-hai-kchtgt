---
id: F-070
name: Quan ly Den bien - Xoa
slug: quan-ly-den-bien-xoa
module: M-013
status: implemented
---

# Quan ly Den bien - Xoa

## Description

Chuyên viên nghiệp vụ xóa mềm (soft delete) đèn biển (BeaconLight) đã tồn tại trong hệ thống. Xóa mềm không xóa dữ liệu vật lý mà chỉ đánh dấu bản ghi là đã bị xóa bằng cách set `deletedAt` và status = `DELETED`. Đèn biển bị xóa không còn hiển thị trên bản đồ và trong danh sách công khai nhưng vẫn được giữ lại trong database để bảo toàn lịch sử và phục vụ khôi phục nếu cần.

## Business Intent

Hệ thống cần cơ chế xóa an toàn cho đèn biển — không xóa vĩnh viễn dữ liệu mà chỉ đánh dấu trạng thái DELETED. Điều này đảm bảo: (1) bảo toàn lịch sử dữ liệu, (2) không mất thông tin phục vụ kiểm toán, (3) có thể khôi phục nếu xóa nhầm. Quy trình yêu cầu xác nhận trước khi xóa.

## Flow Summary

1. Chuyên viên chọn đèn biển từ danh sách và nhấn "Xóa"
2. Hệ thống hiển thị modal xác nhận với thông tin đèn biển và cảnh báo
3. Chuyên viên xác nhận bằng cách nhập tên đèn biển hoặc nhấn "Xác nhận xóa"
4. Hệ thống kiểm tra quyền và trạng thái hiện tại
5. Hệ thống set status = `DELETED`, deletedAt = current timestamp
6. Đèn biển được lọc ra khỏi danh sách bình thường (SQLRestriction deleted_at IS NULL)
7. History log được ghi nhận với actionType = "DELETE"
8. Hiển thị thông báo "Đã xóa đèn biển thành công"

## In Scope

- Xóa mềm đèn biển: set status = DELETED, deletedAt = current timestamp
- Modal xác nhận xóa với thông tin chi tiết đèn biển
- Kiểm tra quyền trước khi xóa (chỉ admin/chuyên viên của đúng unit)
- Kiểm tra trạng thái: không cho phép xóa đèn biển đang ở trạng thái hợp lệ có thể ảnh hưởng đến luồng nghiệp vụ khác
- Tự động ghi log history vào BeaconHistory
- Đèn biển bị xóa vẫn hiển thị trong trang "Lịch sử" với filter deletedOnly

## Out of Scope

- Xóa cứng (hard delete) dữ liệu — không được phép
- Khôi phục đèn biển đã xóa — thuộc tính năng riêng (nếu có)
- Xóa hàng loạt nhiều đèn biển — không hỗ trợ batch delete
- Tích hợp xóa dữ liệu tham chiếu (point_objects, attachments, etc.) — chỉ xóa beacon_light
- Tự động xóa sau thời gian nhất định — không có auto-cleanup

## Data Model — BeaconLight (Delete operation)

| Trường (VN) | Trường (EN) | Thay đổi khi xóa | Ghi chú |
|---|---|---|---|
| status | status | → `DELETED` | Trạng thái mới |
| deletedAt | deletedAt | → current timestamp | Thời điểm xóa |
| approvalStatus | approvalStatus | Giữ nguyên | Không thay đổi |
| name | name | Giữ nguyên | Không xóa dữ liệu |
| code | code | Giữ nguyên | Không xóa dữ liệu |
| latitude | latitude | Giữ nguyên | |
| longitude | longitude | Giữ nguyên | |
| các trường khác | — | Giữ nguyên | Không thay đổi |

## Business Rules

| ID | Rule | Áp dụng cho | Nguồn |
|---|---|---|---|
| BR-070-01 | Xóa là soft delete: không xóa vật lý, chỉ set status = DELETED và deletedAt | Xóa | RAW §3.1 |
| BR-070-02 | Không cho phép xóa đèn biển đã có status = DELETED (xóa trùng) | Xóa | Logic nghiệp vụ |
| BR-070-03 | Không cho phép xóa đèn biển có status = PENDING_APPROVAL, APPROVED_L1, APPROVED_L2 (chỉ xóa DRAFT hoặc PUBLISHED) | Xóa | Quy trình nghiệp vụ |
| BR-070-04 | Chỉ admin và system-admin mới được quyền xóa đèn biển | Quyền | URD §4 |
| BR-070-05 | Khi xóa đèn biển, điểm GIS tương ứng trong M-007 không bị xóa tự động — phải xử lý thủ công hoặc disable | Integration | M-007 |
| BR-070-06 | Đèn biển bị xóa vẫn được query từ bảng beacon_histories (không ảnh hưởng history) | History | Logic nghiệp vụ |
| BR-070-07 | Chỉ đèn biển thuộc đơn vị của người xóa mới được phép xóa (trừ system-admin) | Quyền | Phân quyền |
| BR-070-08 | Modal xác nhận xóa yêu cầu người dùng nhập tên đèn biển để xác nhận | UI | UX |
| BR-070-09 | History log bắt buộc phải được ghi khi xóa | History | URD §5 |
| BR-070-10 | Khi xóa đèn biển đang PUBLISHED: điểm trên bản đồ được ẩn ngay lập tức | GIS | M-007 |

## Permission/Role Requirements

| Role | Level | Quyền |
|---|---|---|
| system-admin | Full | Xóa tất cả đèn biển, bất kỳ đơn vị nào |
| admin (Cục chuyên viên) | Delete | Xóa đèn biển thuộc Cục quản lý |
| admin (Chi cục/Cảng vụ chuyên viên) | Delete | Xóa đèn biển thuộc đơn vị mình quản lý |
| user (Doanh nghiệp cảng) | None | Không được phép xóa |
| leader (Lãnh đạo) | None | Không được phép xóa (chỉ phê duyệt) |

## Error Handling

| Error | HTTP Status | Message (VN) | Recovery |
|---|---|---|---|
| Đèn biển không tồn tại | 404 Not Found | `Đèn biển không tìm thấy.` | Chọn đèn biển khác |
| Đèn biển đã bị xóa | 409 Conflict | `Đèn biển này đã bị xóa trước đó.` | Không cần xóa lại |
| Không có quyền xóa | 403 Forbidden | `Bạn không có quyền xóa đèn biển này.` | Liên hệ quản trị |
| Đèn biển thuộc đơn vị khác | 403 Forbidden | `Bạn không có quyền xóa đèn biển thuộc đơn vị này.` | Không xóa đèn biển đơn vị khác |
| Xác nhận xóa sai tên | 400 Bad Request | `Tên đèn biển xác nhận không đúng.` | Nhập lại đúng tên |
| Lỗi server | 500 | `Hệ thống đang xảy ra sự cố.` | Báo admin |

## Integration Points

| Integration | Direction | Description |
|---|---|---|
| M-007 PointObject | Outbound | Khi đèn biển bị xóa, điểm GIS tương ứng cần được ẩn/disable (không xóa) |
| Notification Service | Outbound | Khi xóa đèn biển PUBLISHED, thông báo cho người dùng đang xem bản đồ |

## Acceptance Criteria

### AC-1: Xóa mềm đèn biển DRAFT thành công
- **Given** người dùng có quyền admin đã đăng nhập
- **And** chọn một đèn biển có status = `DRAFT`
- **When** người dùng nhấn "Xóa" và xác nhận trong modal
- **Then** status chuyển thành `DELETED`, deletedAt được set
- **And** đèn biển biến mất khỏi danh sách
- **And** history log được ghi nhận với actionType = "DELETE"

### AC-2: Xóa đèn biển PUBLISHED và ẩn trên bản đồ
- **Given** đèn biển có status = `PUBLISHED` và đã hiển thị trên bản đồ
- **When** người dùng xóa đèn biển
- **Then** status chuyển thành `DELETED`
- **And** điểm GIS trên bản đồ được ẩn (không hiển thị nữa)
- **And** history log được ghi nhận

### AC-3: Không cho phép xóa đèn biển PENDING_APPROVAL
- **Given** đèn biển có status = `PENDING_APPROVAL`
- **When** người dùng cố gắng xóa
- **Then** hệ thống hiển thị lỗi "Không thể xóa đèn biển đang chờ phê duyệt"
- **And** HTTP status 400

### AC-4: Không cho phép xóa đèn biển đã bị xóa
- **Given** đèn biển có status = `DELETED`
- **When** người dùng cố gắng xóa
- **Then** hệ thống hiển thị "Đèn biển này đã bị xóa trước đó"
- **And** HTTP status 409

### AC-5: Không cho phép xóa đèn biển thuộc đơn vị khác
- **Given** người dùng là chuyên viên Chi cục 1
- **When** người dùng cố gắng xóa đèn biển thuộc Chi cục 2
- **Then** hệ thống hiển thị "Bạn không có quyền xóa đèn biển thuộc đơn vị này"
- **And** HTTP status 403

### AC-6: Modal xác nhận xóa yêu cầu nhập tên
- **Given** người dùng nhấn nút "Xóa" trên đèn biển
- **When** modal hiện ra với tên đèn biển "HẢI ĐĂNG HA NỘI 01"
- **And** người dùng nhập tên sai "hải đăng ha nội 02"
- **Then** nút "Xác nhận xóa" bị disable
- **And** hệ thống hiển thị "Tên đèn biển xác nhận không đúng"

### AC-7: Không cho phép user doanh nghiệp xóa
- **Given** người dùng là "user" (doanh nghiệp cảng)
- **When** người dùng cố gắng truy cập DELETE /beacon-lights/{id}
- **Then** hệ thống trả về 403 Forbidden
- **And** hiển thị "Bạn không có quyền xóa đèn biển"

### AC-8: History log ghi nhận đầy đủ thông tin xóa
- **Given** đèn biển được xóa thành công
- **When** quá trình xóa hoàn tất
- **Then** bản ghi trong `beacon_histories` có actionType = "DELETE"
- **And** changedBy = ID người xóa
- **And** changedAt = timestamp hiện tại
- **And** previousValue chứa thông tin đèn biển trước khi xóa

### AC-9: Đèn biển bị xóa không còn hiển thị trong list (SQL Restriction)
- **Given** đèn biển có status = `DELETED`
- **When** người dùng mở danh sách đèn biển (không có filter đặc biệt)
- **Then** đèn biển bị xóa KHÔNG xuất hiện trong danh sách
- **And** chỉ hiển thị khi có filter "Hiển thị đã xóa"

### AC-10: Xóa đèn biển APPROVED_L1/APPROVED_L2 cho phép nhưng cần xác nhận
- **Given** đèn biển có status = `APPROVED_L1` hoặc `APPROVED_L2`
- **When** người dùng có quyền admin cố gắng xóa
- **Then** hệ thống hiển thị modal xác nhận với cảnh báo "Đèn biển đã được phê duyệt — việc xóa sẽ làm mất trạng thái công bố"
- **And** sau khi xác nhận, status = DELETED

## Testing Strategy

- **Unit Testing**:
  - Test soft delete: status → DELETED, deletedAt được set
  - Test reject delete on DELETED record
  - Test reject delete on PENDING_APPROVAL
  - Test no-change on history when soft-delete

- **Integration Testing**:
  - Test full delete flow with history logging
  - Test DB integrity (soft delete via SQLRestriction)
  - Test M-007 point_object sync (hide point)
  - Test permission enforcement across units

- **E2E Testing**:
  - Test modal confirm with name verification
  - Test delete success and list refresh
  - Test permission denied UI (button không hiển thị cho user)
  - Test deleted record hidden from list

- **Security Testing**:
  - RBAC: chỉ admin/chuyên viên đúng unit mới xóa được
  - CSRF protection cho DELETE endpoint
  - IdOR prevention: không thể xóa record của đơn vị khác qua API
