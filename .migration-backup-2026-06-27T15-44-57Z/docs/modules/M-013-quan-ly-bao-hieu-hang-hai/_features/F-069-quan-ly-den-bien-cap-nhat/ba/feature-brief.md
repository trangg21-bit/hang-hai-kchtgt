---
id: F-069
name: Quan ly Den bien - Cap nhat
slug: quan-ly-den-bien-cap-nhat
module: M-013
status: proposed
---

# Quan ly Den bien - Cap nhat

## Description

Chuyên viên nghiệp vụ cập nhật thông tin đèn biển (BeaconLight) đã tồn tại trong hệ thống. Form cho phép chỉnh sửa các trường: tên, loại (chỉ khi chưa được phê duyệt), tọa độ, phạm vi chiếu sáng, màu ánh sáng, đặc tính ánh sáng, mô tả, đơn vị quản lý, lịch bảo trì, trạng thái hoạt động. Sau khi chỉnh sửa, đèn biển quay lại trạng thái DRAFT hoặc PENDING_APPROVAL (tùy trạng thái hiện tại) và phải trải qua lại quy trình phê duyệt.

## Business Intent

Đèn biển có thể thay đổi thông tin kỹ thuật theo thời gian (bảo trì, sửa chữa, di dời). Mọi thay đổi phải được ghi nhận, phê duyệt lại, và duy trì lịch sử biến động. Chế tài nghiệp vụ: sau khi chỉnh sửa, đèn biển không còn trạng thái PUBLISHED cho đến khi được phê duyệt lại.

## Flow Summary

1. Chuyên viên chọn đèn biển từ danh sách và nhấn "Chỉnh sửa"
2. Hệ thống load thông tin hiện tại vào form
3. Chuyên viên chỉnh sửa các trường cần thay đổi
4. Hệ thống validation realtime các trường bắt buộc và ràng buộc
5. Chuyên viên chọn "Lưu thay đổi" hoặc "Lưu nháp"
6. Nếu đèn biển đang ở PUBLISHED/APPROVED_L2: sau khi lưu → status = DRAFT, approvalStatus = PENDING, approvalLevel = 1
7. Nếu đèn biển đang ở DRAFT: sau khi lưu → status = DRAFT, chỉ ghi log thay đổi
8. Nếu đèn biển đang ở PENDING_APPROVAL/APPROVED_L1: sau khi lưu → status = PENDING_APPROVAL, ghi log
9. Hiển thị thông báo thành công

## In Scope

- Form chỉnh sửa đèn biển với pre-filled dữ liệu từ database
- Validation realtime giống như tạo mới (BR-068-01 đến BR-068-10, áp dụng có điều chỉnh)
- Tự động chuyển trạng thái về DRAFT nếu đèn biển đã được phê duyệt (BR-069-04)
- Tự động ghi log lịch sử thay đổi vào BeaconHistory (field changed từ→đến)
- Phân quyền: chỉ chuyên viên và admin mới được cập nhật đèn biển đơn vị mình
- Không cho phép sửa `type` khi đèn biển đã APPROVED_L2 hoặc PUBLISHED

## Out of Scope

- Thay đổi `code` của đèn biển — mã không được phép sửa (thuộc tính định danh)
- Phê duyệt lại — thuộc F-071
- Xóa đèn biển — thuộc F-070
- Xem lịch sử toàn bộ thay đổi — thuộc F-073
- Batch update nhiều đèn biển cùng lúc
- Khôi phục từ bản sao lưu

## Data Model — BeaconLight (Update fields)

| Trường (VN) | Trường (EN) | Kiểu | Có cho phép sửa? | Ghi chú |
|---|---|---|---|---|
| Mã đèn biển | code | String | ❌ Không | Không cho phép sửa sau khi tạo |
| Tên đèn biển | name | String (VARCHAR 200) | ✅ Có | Cần phê duyệt nếu đã PUBLISHED |
| Loại đèn | type | Enum | ⚠️ Có điều kiện | Không sửa được nếu APPROVED_L2/PUBLISHED |
| Vĩ độ | latitude | Double | ✅ Có | Cần phê duyệt nếu đã PUBLISHED |
| Kinh độ | longitude | Double | ✅ Có | Cần phê duyệt nếu đã PUBLISHED |
| Phạm vi chiếu sáng | lightRange | Double | ✅ Có | Cần phê duyệt nếu đã PUBLISHED |
| Màu ánh sáng | lightColor | String | ✅ Có | |
| Đặc tính ánh sáng | lightCharacteristic | String | ✅ Có | |
| Phạm vi quan sát | range | Double | ✅ Có | |
| Mô tả | description | String | ✅ Có | |
| Đơn vị quản lý | unitId | Long | ✅ Có | Chỉ được đổi sang đơn vị khác trong cùng phân cấp |
| Ngày bảo trì gần nhất | lastMaintenanceDate | LocalDate | ✅ Có | |
| Ngày bảo trì kế tiếp | nextMaintenanceDate | LocalDate | ✅ Có | |
| Trạng thái hoạt động | isActive | Boolean | ✅ Có | |
| Trạng thái xử lý | status | Enum | ❌ Tự động | Tự động set bởi hệ thống |
| ID (UUID) | id | UUID | ❌ Không | Primary key, không được phép thay đổi |
| createdBy | createdBy | UUID | ❌ Không | Người tạo ban đầu |
| createdDate | createdDate | LocalDateTime | ❌ Không | Thời gian tạo ban đầu |

## Business Rules

| ID | Rule | Áp dụng cho | Nguồn |
|---|---|---|---|
| BR-069-01 | Không được phép sửa `code` của đèn biển | Cập nhật | Dữ liệu master |
| BR-069-02 | Không được phép sửa `type` khi đèn biển có status APPROVED_L2 hoặc PUBLISHED | Cập nhật | Dữ liệu master |
| BR-069-03 | Khi cập nhật đèn biển đang ở trạng thái PUBLISHED: status tự động quay về DRAFT, approvalStatus = PENDING, approvalLevel = 1 | Cập nhật | Workflow |
| BR-069-04 | Khi cập nhật đèn biển đang ở trạng thái APPROVED_L2: status quay về DRAFT, phải phê duyệt lại từ L1 | Cập nhật | Workflow |
| BR-069-05 | Khi cập nhật đèn biển đang ở PENDING_APPROVAL: status giữ nguyên PENDING_APPROVAL, chỉ ghi log thay đổi | Cập nhật | Workflow |
| BR-069-06 | Khi cập nhật đèn biển đang ở APPROVED_L1: status quay về DRAFT (không phải PENDING_APPROVAL) | Cập nhật | Workflow |
| BR-069-07 | Chỉ đèn biển thuộc đơn vị của người chỉnh sửa mới được phép sửa ( trừ system-admin) | Cập nhật | Phân quyền |
| BR-069-08 | Validation tương tự tạo mới (BR-068-01 đến BR-068-08) vẫn được áp dụng | Cập nhật | Validation |
| BR-069-09 | Khi đèn biển đang ở DELETED: không cho phép cập nhật | Cập nhật | Logic nghiệp vụ |
| BR-069-10 | Nếu không có thay đổi nào sau khi lưu, hệ thống bỏ qua không ghi log history | Cập nhật | Logic nghiệp vụ |

## Permission/Role Requirements

| Role | Level | Quyền |
|---|---|---|
| system-admin | Full | Cập nhật tất cả đèn biển, bất kỳ đơn vị nào |
| admin (Cục chuyên viên) | CRUD | Cập nhật đèn biển thuộc Cục quản lý |
| admin (Chi cục/Cảng vụ chuyên viên) | CRUD | Cập nhật đèn biển thuộc đơn vị mình quản lý |
| user (Doanh nghiệp cảng) | Read-only | Không được phép cập nhật |
| leader (Lãnh đạo) | Read-only | Không được phép cập nhật (chỉ phê duyệt) |

## Error Handling

| Error | HTTP Status | Message (VN) | Recovery |
|---|---|---|---|
| Đèn biển không tồn tại | 404 Not Found | `Đèn biển không tìm thấy hoặc đã bị xóa.` | Chọn đèn biển khác |
| Đèn biển đã bị xóa (soft delete) | 404 Not Found | `Đèn biển đã bị xóa và không thể cập nhật.` | Tạo mới đèn biển |
| Đèn biển thuộc đơn vị khác | 403 Forbidden | `Bạn không có quyền cập nhật đèn biển thuộc đơn vị này.` | Liên hệ quản trị |
| Code trùng lặp | 409 Conflict | `Mã đèn biển '{code}' đã tồn tại.` | Không được phép sửa code |
| type không được phép sửa | 400 Bad Request | `Loại đèn biển không thể thay đổi khi đèn biển đã được phê duyệt.` | Không sửa type |
| Tọa độ không hợp lệ | 400 Bad Request | `Tọa độ không hợp lệ. Vui lòng kiểm tra lại.` | Sửa tọa độ |
| lightRange vượt ngưỡng | 400 Bad Request | `Phạm vi chiếu sáng phải trong khoảng (0, 60] hải lý.` | Điều chỉnh giá trị |
| Không có quyền cập nhật | 403 Forbidden | `Bạn không có quyền cập nhật đèn biển.` | Liên hệ quản trị |
| Lỗi server | 500 | `Hệ thống đang xảy ra sự cố.` | Báo admin |

## Integration Points

| Integration | Direction | Description |
|---|---|---|
| M-007 PointObject | Inbound/Outbound | Đồng bộ tọa độ khi đèn biển được PUBLISHED lại |
| M-001 Units | Inbound | Đọc danh sách đơn vị cho unitId |
| Notification Service | Outbound | Khi đèn biển quay về DRAFT, thông báo cho chuyên viên và lãnh đạo |

## Acceptance Criteria

### AC-1: Cập nhật đèn biển DRAFT thành công
- **Given** người dùng có quyền admin đã đăng nhập
- **And** chọn một đèn biển có status = `DRAFT` để chỉnh sửa
- **When** người dùng chỉnh sửa các trường name, description, lightRange
- **And** chọn "Lưu thay đổi"
- **Then** status vẫn là `DRAFT`
- **And** hiển thị thông báo "Cập nhật đèn biển thành công"
- **And** history log được ghi nhận với các field thay đổi

### AC-2: Cập nhật đèn biển PUBLISHED → DRAFT
- **Given** đèn biển có status = `PUBLISHED`
- **And** người dùng có quyền admin đã chỉnh sửa các trường
- **When** người dùng chọn "Lưu thay đổi"
- **Then** status chuyển thành `DRAFT`
- **And** approvalStatus = `PENDING`, approvalLevel = 1
- **And** hiển thị cảnh báo "Đèn biển đã quay lại trạng thái nháp — cần gửi phê duyệt lại"
- **And** history log ghi nhận việc revert từ PUBLISHED → DRAFT

### AC-3: Không cho phép sửa code
- **Given** người dùng đang chỉnh sửa đèn biển
- **When** người dùng cố gắng thay đổi trường `code`
- **Then** hệ thống hiển thị thông báo "Mã đèn biển không thể thay đổi"
- **And** trường code bị disable (readonly)

### AC-4: Không cho phép sửa type khi đã phê duyệt
- **Given** đèn biển có status = `APPROVED_L2` hoặc `PUBLISHED`
- **When** người dùng cố gắng thay đổi trường `type`
- **Then** hệ thống hiển thị lỗi "Loại đèn biển không thể thay đổi khi đã được phê duyệt"
- **And** trường type bị disable

### AC-5: Chỉ được sửa đèn biển đơn vị mình
- **Given** người dùng là chuyên viên Chi cục 1
- **When** người dùng cố gắng chỉnh sửa đèn biển thuộc Chi cục 2
- **Then** hệ thống hiển thị "Bạn không có quyền cập nhật đèn biển thuộc đơn vị này"
- **And** HTTP status 403

### AC-6: Cập nhật đèn biển DELETED bị chặn
- **Given** đèn biển có status = `DELETED`
- **When** người dùng cố gắng chỉnh sửa
- **Then** hệ thống hiển thị "Đèn biển đã bị xóa và không thể cập nhật"
- **And** HTTP status 404

### AC-7: Validation realtime trên form chỉnh sửa
- **Given** người dùng đang chỉnh sửa đèn biển
- **When** người dùng xóa trường "Tên" rồi rời trường
- **Then** hệ thống hiển thị ngay lỗi "Tên đèn biển không được để trống"
- **And** validation cho tọa độ và lightRange realtime như tạo mới

### AC-8: Không có thay đổi thì không ghi log
- **Given** người dùng mở form chỉnh sửa đèn biển
- **And** người dùng không thay đổi任何 trường nào
- **When** người dùng chọn "Lưu thay đổi"
- **Then** đèn biển vẫn giữ nguyên status và approval
- **And** không có entry mới trong BeaconHistory

### AC-9: Cập nhật đèn biển PENDING_APPROVAL giữ nguyên status
- **Given** đèn biển có status = `PENDING_APPROVAL`
- **When** người dùng chỉnh sửa các trường và lưu
- **Then** status vẫn là `PENDING_APPROVAL`
- **And** history log ghi nhận thay đổi

### AC-10: Cập nhật đèn biển APPROVED_L1 → DRAFT
- **Given** đèn biển có status = `APPROVED_L1`
- **When** người dùng chỉnh sửa và lưu
- **Then** status chuyển thành `DRAFT`
- **And** approvalStatus = `PENDING`, approvalLevel = 1
- **And** cần phê duyệt lại từ L1

## Testing Strategy

- **Unit Testing**:
  - Validate không cho phép sửa code
  - Validate không cho phép sửa type khi APPROVED_L2/PUBLISHED
  - Test state transitions: PUBLISHED→DRAFT, APPROVED_L2→DRAFT, APPROVED_L1→DRAFT, PENDING→PENDING
  - Test no-change detection (skip history log)

- **Integration Testing**:
  - Test full update flow with history logging
  - Test soft-deleted record rejection
  - Test cross-unit permission enforcement
  - Test DB integrity after update

- **E2E Testing**:
  - Test form pre-fill, edit, and save
  - Test status revert after update of published record
  - Test permission denied for wrong unit
  - Test validation errors on edit form

- **Security Testing**:
  - RBAC: chỉ admin/chuyên viên của đúng unit mới update được
  - XSS prevention qua name/description
  - SQL injection prevention
