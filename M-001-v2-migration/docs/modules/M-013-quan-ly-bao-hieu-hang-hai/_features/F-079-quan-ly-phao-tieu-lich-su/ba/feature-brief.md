---
id: F-079
name: Quan ly Phao tieu - Lich su
slug: quan-ly-phao-tieu-lich-su
module: M-013
status: proposed
---

# Quan ly Phao tieu - Lich su

## Description

Chuyên viên nghiệp vụ xem lịch sử thay đổi (audit trail) của phao tiêu (Buoy). Lịch sử ghi nhận mọi thay đổi về dữ liệu, trạng thái, và phê duyệt của phao tiêu từ khi được tạo đến khi bị xóa. Bao gồm: tạo mới, cập nhật trường, thay đổi trạng thái, phê duyệt L1/L2, từ chối, và xóa mềm.

## Business Intent

Mọi thay đổi đối với dữ liệu phao tiêu phải được ghi nhận đầy đủ để: (1) tuân thủ quy định kiểm toán, (2) hỗ trợ追责 khi có sai sót, (3) hỗ trợ khôi phục dữ liệu, (4) minh bạch quy trình quản lý.

## Flow Summary

1. Chuyên viên mở trang "Lịch sử phao tiêu" và chọn một phao tiêu
2. Hệ thống load danh sách tất cả bản ghi lịch sử
3. Hiển thị timeline theo thứ tự thời gian ngược
4. Filter theo: actionType, changedBy, date range
5. Click vào entry để xem chi tiết before/after

## In Scope

- Hiển thị timeline lịch sử thay đổi của phao tiêu
- actionType: CREATE, UPDATE, APPROVAL_L1, APPROVAL_L2, REJECTION, SOFT_DELETE
- Hiển thị: action, field changed, previous value, new value, changedBy, changedAt
- Filter theo actionType, changedBy, date range
- Sắp xếp thời gian ngược (mới nhất đầu)
- Phân trang
- Chi tiết từng thay đổi (before/after)
- Chỉ admin/chuyên viên/leader xem được

## Out of Scope

- Xóa/sửa history entry
- Xuất history ra file
- So sánh 2 phiên bản trực tiếp
- Khôi phục từ lịch sử

## Data Model — BuoyHistory

| Trường (VN) | Trường (EN) | Kiểu | Ghi chú |
|---|---|---|---|
| ID | id | UUID | Primary key |
| Mã phao tham chiếu | buoyId | UUID | FK → buoy.id |
| Loại hành động | actionType | Enum | CREATE | UPDATE | APPROVAL_L1 | APPROVAL_L2 | REJECTION | SOFT_DELETE |
| Trường thay đổi | changedField | String | Tên field |
| Giá trị trước | previousValue | Text | |
| Giá trị sau | newValue | Text | |
| Người thay đổi | changedBy | Long | ID người thực hiện |
| Thời gian thay đổi | changedAt | LocalDateTime | Auto-fill |
| Lý do thay đổi | reason | String (500) | Tùy chọn |
| JSON diff | diffData | JSONB | Optional |

## Business Rules

| ID | Rule | Áp dụng cho | Nguồn |
|---|---|---|---|
| BR-079-01 | Mọi tạo mới tạo entry CREATE | Tạo | URD §5 |
| BR-079-02 | Mọi cập nhật tạo entry UPDATE | Cập nhật | URD §5 |
| BR-079-03 | Mọi thay đổi trạng thái qua phê duyệt tạo entry APPROVAL | Phê duyệt | URD §5 |
| BR-079-04 | Mọi từ chối tạo entry REJECTION | Từ chối | URD §5 |
| BR-079-05 | Mọi xóa mềm tạo entry SOFT_DELETE | Xóa | URD §5 |
| BR-079-06 | UPDATE entry ghi nhận từng field riêng biệt | Cập nhật | Chi tiết |
| BR-079-07 | Không cho phép xóa/sửa history entry | Xem | Bảo mật |
| BR-079-08 | Chỉ admin/chuyên viên/leader xem được history | Quyền | URD §4 |
| BR-079-09 | Lịch sử giữ vô hạn — không auto-cleanup | Lưu trữ | Quy định |
| BR-079-10 | PreviousValue/NewValue = NULL nếu không có giá trị | Hiển thị | Logic |

## Permission/Role Requirements

| Role | Level | Quyền Xem |
|---|---|---|
| system-admin | Full | Xem tất cả history |
| admin (Cục) | CRUD | Xem history phao tiêu Cục |
| admin (Chi cục/Cảng vụ) | CRUD | Xem history phao tiêu đơn vị mình |
| user (Doanh nghiệp cảng) | None | Không được phép xem |
| leader (Phòng) | L1 | Xem history đơn vị mình |
| leader (Cục) | L2 | Xem history tất cả |

## Error Handling

| Error | HTTP Status | Message (VN) | Recovery |
|---|---|---|---|
| Không tồn tại | 404 | `Phao tiêu không tìm thấy.` | Chọn khác |
| Không có quyền xem history | 403 | `Bạn không có quyền xem lịch sử phao tiêu này.` | Liên hệ admin |
| Đơn vị khác | 403 | `Bạn không có quyền xem lịch sử phao tiêu thuộc đơn vị này.` | Không xem |
| Lỗi server | 500 | `Hệ thống đang xảy ra sự cố.` | Báo admin |

## Integration Points

| Integration | Direction | Description |
|---|---|---|
| M-001 Users | Inbound | Resolve changedBy ID → user name/role |
| M-001 Units | Inbound | Resolve buoy unitId → unit name |

## Acceptance Criteria

### AC-1: Hiển thị timeline đầy đủ
- **Given** admin đăng nhập, chọn phao tiêu có nhiều thay đổi
- **When** mở trang lịch sử
- **Then** timeline theo thời gian ngược
- **And** mỗi entry: actionType badge màu, field changed, before/after, changedBy, changedAt
- **And** pagination 20 entries/page

### AC-2: Filter theo actionType
- **Given** trang lịch sử đã load
- **When** chọn filter "UPDATE"
- **Then** chỉ hiển thị UPDATE entries

### AC-3: Filter theo người thay đổi
- **Given** trang lịch sử đã load
- **When** chọn filter theo "Nguyễn Văn A"
- **Then** chỉ hiển thị entries do "Nguyễn Văn A" thay đổi

### AC-4: Filter theo khoảng thời gian
- **Given** trang lịch sử đã load
- **When** chọn date range "01/01/2026" → "31/01/2026"
- **Then** chỉ hiển thị entries trong khoảng này

### AC-5: Chi tiết thay đổi UPDATE
- **Given** entry UPDATE đã thay đổi range từ 25.0 → 30.0
- **When** click vào entry
- **Then** hiển thị "range: 25.0 → 30.0"

### AC-6: Không cho phép user xem history
- **Given** user/doanh nghiệp cảng đăng nhập
- **When** cố mở trang history
- **Then** "Bạn không có quyền xem lịch sử phao tiêu"

### AC-7: History entry read-only
- **Given** admin/chuyên viên đang xem history
- **When** tìm nút "Xóa" hoặc "Sửa"
- **Then** không có nút nào như vậy
- **And** history entry là read-only

### AC-8: History giữ vô hạn
- **Given** phao tiêu tạo 2 năm, 50+ entries
- **When** mở trang lịch sử
- **Then** tất cả entries hiển thị (không auto-cleanup)
- **And** pagination vẫn hoạt động

### AC-9: Entry CREATE đầy đủ
- **Given** entry CREATE trong history
- **When** click vào entry
- **Then** "Tạo mới phao tiêu — tất cả trường được set lần đầu"
- **And** newValue hiển thị toàn bộ giá trị ban đầu
- **And** previousValue = null/none

### AC-10: Entry APPROVAL hiển thị người phê duyệt
- **Given** entry APPROVAL_L1
- **And** được phê duyệt bởi "Trần Thị B"
- **When** xem entry
- **Then** "Phê duyệt L1 bởi Trần Thị B"
- **And** changedAt = thời điểm phê duyệt

## Testing Strategy

- **Unit Testing**: history entry creation on CREATE/UPDATE/APPROVAL/REJECTION/SOFT_DELETE, before/after comparison, NULL value handling
- **Integration Testing**: full history query with filtering and pagination, date range/actionType/changedBy filters
- **E2E Testing**: timeline rendering, filter interactions, pagination, detail modal per entry type
- **Security Testing**: RBAC, IdOR, immutability
