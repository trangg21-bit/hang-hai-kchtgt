---
id: F-073
name: Quan ly Den bien - Lich su
slug: quan-ly-den-bien-lich-su
module: M-013
status: proposed
---

# Quan ly Den bien - Lich su

## Description

Chuyên viên nghiệp vụ xem lịch sử thay đổi (audit trail) của đèn biển (BeaconLight). Lịch sử ghi nhận mọi thay đổi về dữ liệu, trạng thái, và phê duyệt của đèn biển từ khi được tạo đến khi bị xóa. Bao gồm: tạo mới, cập nhật trường, thay đổi trạng thái, phê duyệt L1/L2, từ chối, và xóa mềm. Lịch sử giúp tuân thủ quy định kiểm toán và hỗ trợ追责 khi có vấn đề.

## Business Intent

Mọi thay đổi đối với dữ liệu đèn biển phải được ghi nhận đầy đủ để: (1) tuân thủ quy định kiểm toán, (2) hỗ trợ追责 khi có sai sót, (3) hỗ trợ khôi phục dữ liệu nếu cần, (4) minh bạch quy trình quản lý.

## Flow Summary

1. Chuyên viên mở trang "Lịch sử đèn biển" và chọn một đèn biển
2. Hệ thống load danh sách tất cả các bản ghi lịch sử của đèn biển đó
3. Hệ thống hiển thị timeline các thay đổi theo thứ tự thời gian ngược
4. Người dùng có thể filter theo: actionType, changedBy, date range
5. Người dùng có thể click vào từng entry để xem chi tiết trường thay đổi (before/after)

## In Scope

- Hiển thị timeline lịch sử thay đổi của một đèn biển
- Hiển thị các actionType: CREATE, UPDATE, APPROVAL_L1, APPROVAL_L2, REJECTION, SOFT_DELETE
- Hiển thị thông tin: action, field changed, previous value, new value, changedBy, changedAt
- Filter theo actionType, changedBy (người thực hiện), date range
- Sắp xếp theo thời gian ngược (mới nhất đầu tiên)
- Phân trang danh sách lịch sử
- Hiển thị chi tiết từng thay đổi (before/after values)
- Chỉ admin/chuyên viên/leader mới xem được lịch sử

## Out of Scope

- Xóa bản ghi lịch sử — không được phép
- Chỉnh sửa bản ghi lịch sử — không được phép
- Xuất lịch sử ra file Excel/PDF
- So sánh 2 phiên bản đèn biển trực tiếp (diff view)
- Khôi phục đèn biển từ lịch sử

## Data Model — BeaconHistory

| Trường (VN) | Trường (EN) | Kiểu | Ghi chú |
|---|---|---|---|
| ID | id | UUID | Primary key |
| Mã đèn biển tham chiếu | beaconId | UUID | FK → beacon_light.id |
| Loại hành động | actionType | Enum | CREATE | UPDATE | APPROVAL_L1 | APPROVAL_L2 | REJECTION | SOFT_DELETE |
| Trường thay đổi | changedField | String | Tên field bị thay đổi |
| Giá trị trước | previousValue | Text | Giá trị trước khi thay đổi |
| Giá trị sau | newValue | Text | Giá trị sau khi thay đổi |
| Người thay đổi | changedBy | Long | ID người thực hiện |
| Thời gian thay đổi | changedAt | LocalDateTime | Auto-fill |
| Lý do thay đổi | reason | String (VARCHAR 500) | Tùy chọn, nhập khi UPDATE/REJECTION |
| JSON diff | diffData | JSONB | Optional: full diff object |

## Business Rules

| ID | Rule | Áp dụng cho | Nguồn |
|---|---|---|---|
| BR-073-01 | Mọi tạo mới đèn biển đều tạo entry CREATE trong history | Tạo | URD §5 |
| BR-073-02 | Mọi cập nhật đèn biển đều tạo entry UPDATE trong history | Cập nhật | URD §5 |
| BR-073-03 | Mọi thay đổi trạng thái qua phê duyệt tạo entry APPROVAL trong history | Phê duyệt | URD §5 |
| BR-073-04 | Mọi từ chối phê duyệt tạo entry REJECTION trong history | Từ chối | URD §5 |
| BR-073-05 | Mọi xóa mềm tạo entry SOFT_DELETE trong history | Xóa | URD §5 |
| BR-073-06 | UPDATE entry ghi nhận từng field bị thay đổi riêng biệt | Cập nhật | Chi tiết |
| BR-073-07 | Không cho phép người dùng xóa hoặc chỉnh sửa history entry | Xem | Bảo mật |
| BR-073-08 | Chỉ admin/chuyên viên/leader mới xem được lịch sử | Quyền | URD §4 |
| BR-073-09 | Lịch sử được giữ vô hạn — không có auto-cleanup | Lưu trữ | Quy định |
| BR-073-10 | PreviousValue và newValue là NULL nếu không có giá trị trước/sau | Hiển thị | Logic |

## Permission/Role Requirements

| Role | Level | Quyền Xem |
|---|---|---|
| system-admin | Full | Xem tất cả history, tất cả đèn biển |
| admin (Cục chuyên viên) | CRUD | Xem history đèn biển Cục quản lý |
| admin (Chi cục/Cảng vụ chuyên viên) | CRUD | Xem history đèn biển đơn vị mình |
| user (Doanh nghiệp cảng) | None | Không được phép xem history |
| leader (Lãnh đạo phòng) | L1 | Xem history đèn biển đơn vị mình |
| leader (Lãnh đạo cục) | L2 | Xem history tất cả đèn biển |

## Error Handling

| Error | HTTP Status | Message (VN) | Recovery |
|---|---|---|---|
| Đèn biển không tồn tại | 404 Not Found | `Đèn biển không tìm thấy.` | Chọn đèn biển khác |
| Không có quyền xem history | 403 Forbidden | `Bạn không có quyền xem lịch sử đèn biển này.` | Liên hệ quản trị |
| Đèn biển thuộc đơn vị khác | 403 Forbidden | `Bạn không có quyền xem lịch sử đèn biển thuộc đơn vị này.` | Không xem history đơn vị khác |
| Lỗi server | 500 | `Hệ thống đang xảy ra sự cố.` | Báo admin |

## Integration Points

| Integration | Direction | Description |
|---|---|---|
| M-001 Users | Inbound | Resolve changedBy ID → user name/role |
| M-001 Units | Inbound | Resolve beacon unitId → unit name |

## Acceptance Criteria

### AC-1: Hiển thị timeline đầy đủ history
- **Given** admin đã đăng nhập
- **And** chọn một đèn biển đã có nhiều thay đổi
- **When** người dùng mở trang lịch sử
- **Then** hiển thị timeline theo thứ tự thời gian ngược
- **And** mỗi entry hiển thị: actionType badge màu, field changed, before/after values, changedBy, changedAt
- **And** pagination hoạt động đúng (20 entries/page)

### AC-2: Filter theo actionType
- **Given** trang lịch sử đèn biển đã load
- **And** có entries với CREATE, UPDATE, APPROVAL_L1, REJECTION, SOFT_DELETE
- **When** người dùng chọn filter "UPDATE"
- **Then** chỉ hiển thị các entry UPDATE
- **And** các entry khác bị ẩn

### AC-3: Filter theo người thay đổi
- **Given** trang lịch sử đèn biển đã load
- **When** người dùng chọn filter theo "Nguyễn Văn A"
- **Then** chỉ hiển thị entries do "Nguyễn Văn A" thay đổi
- **And** các entries khác bị ẩn

### AC-4: Filter theo khoảng thời gian
- **Given** trang lịch sử đèn biển đã load
- **When** người dùng chọn date range "01/01/2026" → "31/01/2026"
- **Then** chỉ hiển thị entries trong khoảng thời gian này
- **And** các entries ngoài khoảng bị ẩn

### AC-5: Chi tiết thay đổi trường UPDATE
- **Given** entry UPDATE trong history
- **And** đã thay đổi trường lightRange từ 25.0 → 30.0
- **When** người dùng click vào entry đó
- **Then** hiển thị: "lightRange: 25.0 → 30.0"
- **And** hiển thị previousValue = "25.0", newValue = "30.0"

### AC-6: Không cho phép user doanh nghiệp xem history
- **Given** user/doanh nghiệp cảng đã đăng nhập
- **When** người dùng cố gắng mở trang history của đèn biển
- **Then** hệ thống hiển thị "Bạn không có quyền xem lịch sử đèn biển"
- **And** HTTP status 403

### AC-7: History entry không thể xóa/sửa
- **Given** admin/chuyên viên đang xem history
- **When** người dùng tìm nút "Xóa" hoặc "Sửa" trên history entry
- **Then** không có nút nào như vậy hiển thị
- **And** history entry là read-only

### AC-8: History giữ vô hạn
- **Given** đèn biển đã được tạo cách đây 2 năm
- **And** đã có 50+ history entries
- **When** người dùng mở trang lịch sử
- **Then** tất cả entries được hiển thị (không có auto-cleanup)
- **And** pagination vẫn hoạt động

### AC-9: Entry CREATE hiển thị đầy đủ
- **Given** entry CREATE trong history
- **When** người dùng click vào entry
- **Then** hiển thị: "Tạo mới đèn biển — tất cả trường được set lần đầu"
- **And** newValue hiển thị toàn bộ giá trị ban đầu
- **And** previousValue = null/none

### AC-10: Entry APPROVAL_L1/L2 hiển thị người phê duyệt
- **Given** entry APPROVAL_L1 trong history
- **And** được phê duyệt bởi "Trần Thị B"
- **When** người dùng xem entry
- **Then** hiển thị: "Phê duyệt L1 bởi Trần Thị B"
- **And** changedAt = thời điểm phê duyệt

## Testing Strategy

- **Unit Testing**:
  - Test history entry creation on CREATE, UPDATE, APPROVAL, REJECTION, SOFT_DELETE
  - Test before/after value comparison
  - Test NULL value handling

- **Integration Testing**:
  - Test full history query with filtering and pagination
  - Test date range filter accuracy
  - Test actionType filter accuracy
  - Test changedBy filter accuracy

- **E2E Testing**:
  - Test timeline rendering
  - Test filter interactions
  - Test pagination
  - Test detail modal for each entry type

- **Security Testing**:
  - RBAC: chỉ admin/chuyên viên/leader xem được
  - IdOR: không thể xem history đèn biển đơn vị khác
  - Immutability: history entries cannot be modified or deleted
