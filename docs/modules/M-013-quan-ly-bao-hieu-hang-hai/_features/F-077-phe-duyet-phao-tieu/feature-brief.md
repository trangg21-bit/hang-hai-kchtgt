---
id: F-077
name: Phe duyet Phao tieu
slug: phe-duyet-phao-tieu
module: M-013
status: implemented
---

# Phe duyet Phao tieu

## Description

Quy trình phê duyệt 2 cấp cho phao tiêu (Buoy): Cấp L1 (phòng chuyên môn) và Cấp L2 (cục chuyên môn). Khi phao tiêu được tạo hoặc chỉnh sửa và chuyển sang trạng thái PENDING_APPROVAL, lãnh đạo phòng sẽ xem xét và phê duyệt/từ chối ở cấp L1. Sau khi L1 duyệt, phao tiêu chuyển sang APPROVED_L1 và chờ phê duyệt L2 từ lãnh đạo cục. Sau khi L2 duyệt, phao tiêu chuyển sang APPROVED_L2 và cuối cùng là PUBLISHED. Nếu bị từ chối ở bất kỳ cấp nào, phao tiêu quay về DRAFT.

## Business Intent

Đảm bảo mọi thông tin phao tiêu được công bố đều đã được xem xét, kiểm chứng và chấp thuận bởi các cấp quản lý có thẩm quyền.

## Flow Summary

### Phê duyệt L1 (Phòng)
1. Lãnh đạo phòng nhận thông báo có phao tiêu chờ phê duyệt
2. Xem đầy đủ thông tin kỹ thuật (type, coordinates, color, shape, lightCharacteristic, range, etc.)
3. Chọn "Phê duyệt" hoặc "Từ chối" (lý do bắt buộc nếu từ chối)
4. Duyệt: status → APPROVED_L1, approvalStatus = APPROVED, level1Approver = current user
5. Từ chối: status → DRAFT, approvalStatus = REJECTED, thông báo gửi chuyên viên

### Phê duyệt L2 (Cục)
1. Sau L1 duyệt, lãnh đạo cục nhận thông báo chờ phê duyệt L2
2. Xem thông tin + lịch sử phê duyệt L1
3. Chọn "Phê duyệt" hoặc "Từ chối" (lý do bắt buộc nếu từ chối)
4. Duyệt: status → PUBLISHED, approvalStatus = APPROVED, level2Approver = current user
5. Từ chối: status → DRAFT, approvalStatus = REJECTED, thông báo gửi chuyên viên

## In Scope

- Giao diện phê duyệt 2 cấp cho phao tiêu
- View chi tiết phao tiêu trước khi phê duyệt
- Nút "Phê duyệt" và "Từ chối" với lý do bắt buộc
- Tự động chuyển trạng thái qua workflow
- Ghi nhận approvedBy, approvedDate
- Ghi rejectionReason khi từ chối
- Tự động gửi thông báo khi bị từ chối
- Không cho phép phê duyệt phao tiêu đã PUBLISHED hoặc DELETED

## Out of Scope

- Tự động phê duyệt
- Bỏ qua cấp phê duyệt
- Auto reject nếu không phản hồi
- Auto escalate
- Phê duyệt hàng loạt
- Chữ ký số

## Data Model — Approval (Buoy)

| Trường (VN) | Trường (EN) | Kiểu | Ghi chú |
|---|---|---|---|
| status | status | Enum | DRAFT→PENDING→APPROVED_L1→APPROVED_L2→PUBLISHED |
| approvalStatus | approvalStatus | Enum | PENDING, APPROVED, REJECTED |
| approvalLevel | approvalLevel | Integer | 1 = phòng, 2 = cục |
| approvedBy | approvedBy | Long | ID người phê duyệt cuối cùng |
| approvedDate | approvedDate | LocalDateTime | Thời điểm phê duyệt cuối |
| rejectionReason | rejectionReason | String (500) | Bắt buộc khi từ chối |
| level1Approver | level1Approver | Long | ID người phê duyệt L1 |
| level2Approver | level2Approver | Long | ID người phê duyệt L2 |

## Business Rules

| ID | Rule | Áp dụng cho | Nguồn |
|---|---|---|---|
| BR-077-01 | Chỉ phao tiêu status = PENDING_APPROVAL mới được phê duyệt L1 | Phê duyệt L1 | Workflow |
| BR-077-02 | Chỉ phao tiêu status = APPROVED_L1 mới được phê duyệt L2 | Phê duyệt L2 | Workflow |
| BR-077-03 | Khi phê duyệt L1: status → APPROVED_L1, level1Approver = current user | Phê duyệt L1 | Workflow |
| BR-077-04 | Khi phê duyệt L2: status → PUBLISHED, level2Approver = current user | Phê duyệt L2 | Workflow |
| BR-077-05 | Khi từ chối ở bất kỳ cấp: status → DRAFT, rejectionReason bắt buộc | Từ chối | Workflow |
| BR-077-06 | Lý do từ chối bắt buộc (min 10 ký tự) | Từ chối | Validation |
| BR-077-07 | Chỉ leader level 1 mới được phê duyệt L1 | Quyền | URD §5 |
| BR-077-08 | Chỉ leader level 2 mới được phê duyệt L2 | Quyền | URD §5 |
| BR-077-09 | Không cho phép cùng người vừa gửi duyệt vừa phê duyệt | Phê duyệt | Quy trình |
| BR-077-10 | Khi từ chối, chuyên viên tạo/gửi duyệt nhận thông báo | Thông báo | Notification |

## Permission/Role Requirements

| Role | Level | Quyền Phê duyệt |
|---|---|---|
| system-admin | Full | Phê duyệt cả 2 cấp |
| admin (Cục chuyên viên) | None | Không được phép phê duyệt |
| admin (Chi cục/Cảng vụ chuyên viên) | None | Không được phép phê duyệt |
| user (Doanh nghiệp cảng) | None | Không được phép phê duyệt |
| leader (Lãnh đạo phòng) | L1 | Phê duyệt L1 cho đơn vị mình |
| leader (Lãnh đạo cục) | L2 | Phê duyệt L2 cho tất cả |

## Error Handling

| Error | HTTP Status | Message (VN) | Recovery |
|---|---|---|---|
| Không tồn tại | 404 | `Phao tiêu không tìm thấy.` | Chọn khác |
| Không chờ phê duyệt L1 | 400 | `Phao tiêu này không ở trạng thái chờ phê duyệt L1.` | Kiểm tra trạng thái |
| Không chờ phê duyệt L2 | 400 | `Phao tiêu này không ở trạng thái chờ phê duyệt L2.` | Kiểm tra trạng thái |
| Lý do từ chối trống | 400 | `Vui lòng nhập lý do từ chối (ít nhất 10 ký tự).` | Nhập lý do |
| Lý do quá ngắn | 400 | `Lý do từ chối phải có ít nhất 10 ký tự.` | Nhập chi tiết hơn |
| Không có quyền L1 | 403 | `Bạn không có quyền phê duyệt cấp L1.` | Chuyển cho leader phòng |
| Không có quyền L2 | 403 | `Bạn không có quyền phê duyệt cấp L2.` | Chuyển cho leader cục |
| Tự phê duyệt | 400 | `Bạn không thể phê duyệt phao tiêu do chính mình gửi.` | Gửi cho người khác |
| Lỗi server | 500 | `Hệ thống đang xảy ra sự cố.` | Báo admin |

## Integration Points

| Integration | Direction | Description |
|---|---|---|
| Notification Service | Outbound | Thông báo khi chuyển trạng thái |
| M-007 PointObject | Outbound | Khi PUBLISHED, điểm hiển thị trên bản đồ |
| M-001 Units | Inbound | Xác định đơn vị quản lý |

## Acceptance Criteria

### AC-1: Phê duyệt L1 thành công
- **Given** phao tiêu PENDING_APPROVAL, approvalLevel = 1
- **And** leader phòng đăng nhập
- **When** chọn "Phê duyệt"
- **Then** status → `APPROVED_L1`, level1Approver = ID leader
- **And** thông báo gửi cho leader cục phê duyệt L2

### AC-2: Phê duyệt L2 → PUBLISHED
- **Given** phao tiêu APPROVED_L1, approvalLevel = 2
- **And** leader cục đăng nhập
- **When** chọn "Phê duyệt"
- **Then** status → `PUBLISHED`, level2Approver = ID leader
- **And** điểm GIS hiển thị trên bản đồ

### AC-3: Từ chối L1 với lý do
- **Given** phao tiêu PENDING_APPROVAL, approvalLevel = 1
- **When** leader phòng chọn "Từ chối" + nhập lý do
- **Then** status → `DRAFT`, approvalStatus → `REJECTED`
- **And** thông báo gửi cho chuyên viên

### AC-4: Từ chối L2 với lý do
- **Given** phao tiêu APPROVED_L1, approvalLevel = 2
- **When** leader cục chọn "Từ chối" + nhập lý do
- **Then** status → `DRAFT`, approvalStatus → `REJECTED`
- **And** thông báo gửi cho chuyên viên

### AC-5: Lý do từ chối min 10 ký tự
- **Given** leader đang phê duyệt
- **When** chọn "Từ chối" và nhập lý do ngắn (<10 ký tự)
- **Then** hiển thị lỗi "Lý do từ chối phải có ít nhất 10 ký tự"

### AC-6: Không tự phê duyệt
- **Given** chuyên viên A gửi phao tiêu
- **When** chuyên viên A cố phê duyệt
- **Then** "Bạn không thể phê duyệt phao tiêu do chính mình gửi"

### AC-7: Chỉ leader mới phê duyệt
- **Given** người dùng là chuyên viên (không leader)
- **When** cố gắng phê duyệt
- **Then** 403 Forbidden

### AC-8: Không phê duyệt PUBLISHED
- **Given** phao tiêu PUBLISHED
- **When** leader cố phê duyệt
- **Then** "Phao tiêu này đã được công bố, không cần phê duyệt"

### AC-9: Hiển thị lịch sử phê duyệt
- **Given** phao tiêu APPROVED_L1
- **When** leader cục mở trang chi tiết
- **Then** hiển thị "Đã phê duyệt L1 bởi [X] vào [Y]"

### AC-10: Chuyển tiếp L1 → L2 tự động
- **Given** phao tiêu vừa được phê duyệt L1
- **When** hoàn tất L1
- **Then** status → `APPROVED_L1`, approvalLevel = 2
- **And** thông báo gửi cho leader cục

## Testing Strategy

- **Unit Testing**: state machine PENDING→L1→L2→PUBLISHED, reject at L1/L2, rejectionReason min 10 chars, self-approval prevention
- **Integration Testing**: full approval workflow end-to-end, notification delivery, M-007 point sync, DB integrity
- **E2E Testing**: L1/L2 approval UI, reject with reason, permission denied, notification inbox
- **Security Testing**: RBAC, self-approval prevention, CSRF
