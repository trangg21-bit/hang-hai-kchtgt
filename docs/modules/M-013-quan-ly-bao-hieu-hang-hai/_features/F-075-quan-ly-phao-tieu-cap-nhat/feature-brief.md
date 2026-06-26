---
id: F-075
name: Quan ly Phao tieu - Cap nhat
slug: quan-ly-phao-tieu-cap-nhat
module: M-013
status: implemented
---

# Quan ly Phao tieu - Cap nhat

## Description

Chuyên viên nghiệp vụ cập nhật thông tin phao tiêu (Buoy) đã tồn tại trong hệ thống. Form cho phép chỉnh sửa: tên, loại (chỉ khi chưa được phê duyệt), tọa độ, màu sắc, hình dạng, đặc tính ánh sáng, phạm vi quan sát, mô tả, đơn vị quản lý, lịch kiểm tra, trạng thái hoạt động. Sau khi chỉnh sửa, phao tiêu quay lại trạng thái DRAFT hoặc PENDING_APPROVAL (tùy trạng thái hiện tại) và phải trải qua lại quy trình phê duyệt.

## Business Intent

Phao tiêu có thể thay đổi thông tin theo thời gian (chuyển vị, sơn lại, thay thế đèn). Mọi thay đổi phải được ghi nhận, phê duyệt lại, và duy trì lịch sử biến động.

## Flow Summary

1. Chuyên viên chọn phao tiêu từ danh sách → "Chỉnh sửa"
2. Hệ thống load thông tin hiện tại vào form
3. Chuyên viên chỉnh sửa các trường cần thay đổi
4. Hệ thống validation realtime
5. Chọn "Lưu thay đổi" hoặc "Lưu nháp"
6. Nếu đang PUBLISHED/APPROVED_L2: sau lưu → DRAFT, phải phê duyệt lại
7. Nếu đang DRAFT: sau lưu → DRAFT, chỉ ghi log
8. Nếu đang PENDING_APPROVAL/APPROVED_L1: sau lưu → giữ nguyên status, ghi log
9. Hiển thị thông báo thành công

## In Scope

- Form chỉnh sửa phao tiêu với pre-filled dữ liệu
- Validation realtime tương tự tạo mới
- Tự động chuyển trạng thái về DRAFT nếu đã được phê duyệt (BR-075-04)
- Tự động ghi log lịch sử thay đổi vào BuoyHistory
- Phân quyền: chỉ chuyên viên và admin của đúng unit

## Out of Scope

- Thay đổi `code` — không được phép sửa
- Phê duyệt lại — thuộc F-077
- Xóa — thuộc F-076
- Xem lịch sử — thuộc F-079
- Batch update

## Data Model — Buoy (Update fields)

| Trường (VN) | Có cho phép sửa? | Ghi chú |
|---|---|---|
| code | ❌ Không | Không cho phép sửa sau khi tạo |
| name | ✅ Có | Cần phê duyệt nếu đã PUBLISHED |
| type | ⚠️ Có điều kiện | Không sửa nếu APPROVED_L2/PUBLISHED |
| latitude | ✅ Có | Cần phê duyệt nếu đã PUBLISHED |
| longitude | ✅ Có | Cần phê duyệt nếu đã PUBLISHED |
| color | ✅ Có | |
| shape | ✅ Có | |
| lightCharacteristic | ✅ Có | |
| range | ✅ Có | Cần phê duyệt nếu đã PUBLISHED |
| description | ✅ Có | |
| unitId | ✅ Có | Chỉ đổi sang đơn vị cùng phân cấp |
| lastInspectionDate | ✅ Có | |
| nextInspectionDate | ✅ Có | |
| isActive | ✅ Có | |

## Business Rules

| ID | Rule | Áp dụng cho | Nguồn |
|---|---|---|---|
| BR-075-01 | Không được phép sửa `code` | Cập nhật | Dữ liệu master |
| BR-075-02 | Không được phép sửa `type` khi APPROVED_L2/PUBLISHED | Cập nhật | Dữ liệu master |
| BR-075-03 | Khi cập nhật PUBLISHED → DRAFT, approvalStatus = PENDING, approvalLevel = 1 | Cập nhật | Workflow |
| BR-075-04 | Khi cập nhật APPROVED_L2 → DRAFT, phải phê duyệt lại từ L1 | Cập nhật | Workflow |
| BR-075-05 | Khi cập nhật PENDING_APPROVAL → giữ nguyên PENDING_APPROVAL | Cập nhật | Workflow |
| BR-075-06 | Khi cập nhật APPROVED_L1 → DRAFT | Cập nhật | Workflow |
| BR-075-07 | Chỉ phao tiêu thuộc đơn vị của người chỉnh sửa mới được phép sửa | Cập nhật | Phân quyền |
| BR-075-08 | Validation tương tự tạo mới (BR-074-01 đến BR-074-08) | Cập nhật | Validation |
| BR-075-09 | Khi phao tiêu đang DELETED: không cho phép cập nhật | Cập nhật | Logic nghiệp vụ |
| BR-075-10 | Nếu không có thay đổi: bỏ qua không ghi log | Cập nhật | Logic nghiệp vụ |

## Permission/Role Requirements

| Role | Level | Quyền |
|---|---|---|
| system-admin | Full | Cập nhật tất cả |
| admin (Cục) | CRUD | Cập nhật phao tiêu Cục |
| admin (Chi cục/Cảng vụ) | CRUD | Cập nhật phao tiêu đơn vị mình |
| user | None | Không được phép cập nhật |
| leader | None | Không được phép cập nhật |

## Error Handling

| Error | HTTP Status | Message (VN) | Recovery |
|---|---|---|---|
| Không tồn tại | 404 | `Phao tiêu không tìm thấy hoặc đã bị xóa.` | Chọn khác |
| Đã bị xóa | 404 | `Phao tiêu đã bị xóa và không thể cập nhật.` | Tạo mới |
| Đơn vị khác | 403 | `Bạn không có quyền cập nhật phao tiêu thuộc đơn vị này.` | Không sửa |
| Code trùng | 409 | `Mã phao tiêu '{code}' đã tồn tại.` | Không sửa code |
| type không được phép | 400 | `Loại phao tiêu không thể thay đổi khi đã được phê duyệt.` | Không sửa type |
| Tọa độ không hợp lệ | 400 | `Tọa độ không hợp lệ. Vui lòng kiểm tra lại.` | Sửa tọa độ |
| range vượt ngưỡng | 400 | `Phạm vi quan sát phải trong khoảng (0, 100] hải lý.` | Điều chỉnh |
| Không có quyền | 403 | `Bạn không có quyền cập nhật phao tiêu.` | Liên hệ admin |
| Lỗi server | 500 | `Hệ thống đang xảy ra sự cố.` | Báo admin |

## Integration Points

| Integration | Direction | Description |
|---|---|---|
| M-007 PointObject | Outbound | Đồng bộ tọa độ khi PUBLISHED lại |
| M-001 Units | Inbound | Đọc danh sách đơn vị |
| Notification Service | Outbound | Khi quay về DRAFT, thông báo cho chuyên viên |

## Acceptance Criteria

### AC-1: Cập nhật phao tiêu DRAFT thành công
- **Given** admin đăng nhập, chọn phao tiêu DRAFT
- **When** chỉnh sửa name, description, range và lưu
- **Then** status vẫn `DRAFT`
- **And** history log được ghi nhận

### AC-2: Cập nhật PUBLISHED → DRAFT
- **Given** phao tiêu PUBLISHED
- **When** chỉnh sửa và lưu
- **Then** status → `DRAFT`, approvalStatus → `PENDING`, approvalLevel = 1
- **And** cảnh báo "cần gửi phê duyệt lại"
- **And** history log ghi nhận revert PUBLISHED→DRAFT

### AC-3: Không cho phép sửa code
- **Given** đang chỉnh sửa phao tiêu
- **When** cố gắng thay đổi code
- **Then** hiển thị "Mã phao tiêu không thể thay đổi"
- **And** trường code bị disabled

### AC-4: Không cho phép sửa type khi đã phê duyệt
- **Given** phao tiêu APPROVED_L2/PUBLISHED
- **When** cố gắng thay đổi type
- **Then** hiển thị "Loại phao tiêu không thể thay đổi khi đã được phê duyệt"
- **And** trường type bị disabled

### AC-5: Chỉ sửa đơn vị mình
- **Given** chuyên viên Chi cục 1
- **When** cố gắng sửa phao tiêu Chi cục 2
- **Then** hiển thị "Bạn không có quyền cập nhật phao tiêu thuộc đơn vị này"

### AC-6: Không sửa phao tiêu DELETED
- **Given** phao tiêu DELETED
- **When** cố gắng chỉnh sửa
- **Then** hiển thị "Phao tiêu đã bị xóa và không thể cập nhật"

### AC-7: Validation realtime
- **Given** đang chỉnh sửa
- **When** xóa trường "Tên" rồi rời
- **Then** hiển thị lỗi "Tên phao tiêu không được để trống"

### AC-8: Không thay đổi thì không ghi log
- **Given** mở form chỉnh sửa
- **When** không thay đổi任何 field
- **Then** không có entry mới trong BuoyHistory

### AC-9: PENDING_APPROVAL giữ nguyên status
- **Given** phao tiêu PENDING_APPROVAL
- **When** chỉnh sửa và lưu
- **Then** status giữ `PENDING_APPROVAL`
- **And** history log ghi nhận thay đổi

### AC-10: APPROVED_L1 → DRAFT
- **Given** phao tiêu APPROVED_L1
- **When** chỉnh sửa và lưu
- **Then** status → `DRAFT`, approvalStatus → `PENDING`, approvalLevel = 1

## Testing Strategy

- **Unit Testing**: reject code change, reject type change, state transitions, no-change detection
- **Integration Testing**: update flow with history, soft-delete rejection, cross-unit permission, DB integrity
- **E2E Testing**: form pre-fill, edit, save, status revert, permission denied, validation errors
- **Security Testing**: RBAC, XSS, SQL injection
