---
id: F-071
name: Phe duyet Den bien
slug: phe-duyet-den-bien
module: M-013
status: implemented
---

# Phe duyet Den bien

## Description

Quy trình phê duyệt 2 cấp cho đèn biển (BeaconLight): Cấp L1 (phòng chuyên môn) và Cấp L2 (cục chuyên môn). Khi đèn biển được tạo hoặc chỉnh sửa và chuyển sang trạng thái PENDING_APPROVAL, lãnh đạo phòng sẽ xem xét và phê duyệt/từ chối ở cấp L1. Sau khi L1 duyệt, đèn biển chuyển sang APPROVED_L1 và chờ phê duyệt L2 từ lãnh đạo cục. Sau khi L2 duyệt, đèn biển chuyển sang APPROVED_L2 và cuối cùng là PUBLISHED. Nếu bị từ chối ở bất kỳ cấp nào, đèn biển quay về DRAFT và chuyên viên cần sửa lại.

## Business Intent

Đảm bảo mọi thông tin đèn biển được công bố trong hệ thống đều đã được xem xét, kiểm chứng và chấp thuận bởi các cấp quản lý có thẩm quyền. Quy trình 2 cấp đảm bảo tính chính xác và tuân thủ quy định hàng hải trước khi thông tin chính thức được công bố.

## Flow Summary

### Phê duyệt L1 (Phòng)
1. Lãnh đạo phòng nhận thông báo có đèn biển chờ phê duyệt (approvalStatus = PENDING, approvalLevel = 1)
2. Lãnh đạo phòng mở chi tiết đèn biển, xem đầy đủ thông tin kỹ thuật
3. Lãnh đạo phòng chọn "Phê duyệt" hoặc "Từ chối" (phải nhập lý do nếu từ chối)
4. Nếu duyệt: status = APPROVED_L1, approvalStatus = APPROVED, approvalLevel = 1, approvedBy = ID lãnh đạo, approvedDate = now
5. Nếu từ chối: status = DRAFT, approvalStatus = REJECTED, rejectionReason được ghi nhận, thông báo gửi cho chuyên viên

### Phê duyệt L2 (Cục)
1. Sau L1 duyệt, lãnh đạo cục nhận thông báo có đèn biển chờ phê duyệt L2 (approvalStatus = PENDING, approvalLevel = 2)
2. Lãnh đạo cục mở chi tiết đèn biển, xem thông tin + lịch sử phê duyệt L1
3. Lãnh đạo cục chọn "Phê duyệt" hoặc "Từ chối" (phải nhập lý do nếu từ chối)
4. Nếu duyệt: status = PUBLISHED, approvalStatus = APPROVED, approvalLevel = 2, approvedBy = ID lãnh đạo, approvedDate = now
5. Nếu từ chối: status = DRAFT, approvalStatus = REJECTED, rejectionReason được ghi nhận, thông báo gửi cho chuyên viên

## In Scope

- Giao diện phê duyệt 2 cấp cho đèn biển
- View chi tiết đèn biển trước khi phê duyệt (name, code, type, coordinates, lightRange, lightColor, lightCharacteristic, description, unitId, maintenance info)
- Nút "Phê duyệt" và "Từ chối" với lý do bắt buộc khi từ chối
- Tự động chuyển trạng thái qua workflow: PENDING_APPROVAL → APPROVED_L1 → APPROVED_L2 → PUBLISHED
- Ghi nhận approvedBy, approvedDate khi duyệt
- Ghi rejectionReason khi từ chối
- Tự động gửi thông báo cho chuyên viên khi bị từ chối
- Không cho phép phê duyệt đèn biển đã PUBLISHED hoặc DELETED
- Không cho phép từ chối phê duyệt nếu chưa có PENDING_APPROVAL status

## Out of Scope

- Tự động phê duyệt (auto-approve) — không được phép
- Bỏ qua cấp phê duyệt (skip level) — phải đủ 2 cấp
- Tự động reject nếu không phản hồi trong thời gian quy định
- Tự động escalate nếu cấp L1 không phê duyệt trong thời gian quy định
- Phê duyệt hàng loạt nhiều đèn biển cùng lúc
- Tích hợp chữ ký số trong quy trình phê duyệt

## Data Model — Approval (BeaconLight)

| Trường (VN) | Trường (EN) | Kiểu | Ghi chú |
|---|---|---|---|
| Trạng thái xử lý | status | Enum | DRAFT | PENDING_APPROVAL | APPROVED_L1 | APPROVED_L2 | PUBLISHED | REJECTED | DELETED |
| Trạng thái phê duyệt | approvalStatus | Enum | PENDING | APPROVED | REJECTED |
| Cấp phê duyệt | approvalLevel | Integer | 1 = phòng, 2 = cục |
| Người phê duyệt | approvedBy | Long | ID người phê duyệt cuối cùng |
| Ngày phê duyệt | approvedDate | LocalDateTime | Thời điểm phê duyệt cuối cùng |
| Lý do từ chối | rejectionReason | String (VARCHAR 500) | Bắt buộc khi từ chối |
| Phê duyệt L1 | level1Approver | Long | ID người phê duyệt L1 |
| Phê duyệt L2 | level2Approver | Long | ID người phê duyệt L2 |
| Lý do từ chối L1 | level1RejectionReason | String | Nếu L1 từ chối |
| Lý do từ chối L2 | level2RejectionReason | String | Nếu L2 từ chối |

## Business Rules

| ID | Rule | Áp dụng cho | Nguồn |
|---|---|---|---|
| BR-071-01 | Chỉ đèn biển có status = PENDING_APPROVAL mới được phê duyệt L1 | Phê duyệt L1 | Workflow |
| BR-071-02 | Chỉ đèn biển có status = APPROVED_L1 mới được phê duyệt L2 | Phê duyệt L2 | Workflow |
| BR-071-03 | Khi phê duyệt L1: status → APPROVED_L1, approvalStatus = APPROVED, level1Approver = current user | Phê duyệt L1 | Workflow |
| BR-071-04 | Khi phê duyệt L2: status → PUBLISHED, approvalStatus = APPROVED, level2Approver = current user | Phê duyệt L2 | Workflow |
| BR-071-05 | Khi từ chối ở bất kỳ cấp: status → DRAFT, approvalStatus = REJECTED, rejectionReason bắt buộc | Từ chối | Workflow |
| BR-071-06 | Lý do từ chối là bắt buộc khi chọn "Từ chối" (min 10 ký tự) | Từ chối | Validation |
| BR-071-07 | Chỉ lãnh đạo phòng (role leader level 1) mới được phê duyệt L1 | Quyền | URD §5 |
| BR-071-08 | Chỉ lãnh đạo cục (role leader level 2) mới được phê duyệt L2 | Quyền | URD §5 |
| BR-071-09 | Không cho phép cùng một người vừa gửi duyệt vừa phê duyệt | Phê duyệt | Quy trình |
| BR-071-10 | Khi từ chối, chuyên viên tạo/gửi duyệt nhận được thông báo với lý do từ chối | Thông báo | Notification |

## Permission/Role Requirements

| Role | Level | Quyền Phê duyệt |
|---|---|---|
| system-admin | Full | Có thể phê duyệt ở cả 2 cấp |
| admin (Cục chuyên viên) | None | Không được phép phê duyệt (chỉ gửi duyệt) |
| admin (Chi cục/Cảng vụ chuyên viên) | None | Không được phép phê duyệt (chỉ gửi duyệt) |
| user (Doanh nghiệp cảng) | None | Không được phép phê duyệt |
| leader (Lãnh đạo phòng/chỉ huy) | L1 | Phê duyệt L1 cho đèn biển đơn vị mình quản lý |
| leader (Lãnh đạo cục) | L2 | Phê duyệt L2 cho tất cả đèn biển đã L1 duyệt |

## Error Handling

| Error | HTTP Status | Message (VN) | Recovery |
|---|---|---|---|
| Đèn biển không tồn tại | 404 Not Found | `Đèn biển không tìm thấy.` | Chọn đèn biển khác |
| Đèn biển không chờ phê duyệt L1 | 400 Bad Request | `Đèn biển này không ở trạng thái chờ phê duyệt L1.` | Kiểm tra trạng thái |
| Đèn biển không chờ phê duyệt L2 | 400 Bad Request | `Đèn biển này không ở trạng thái chờ phê duyệt L2.` | Kiểm tra trạng thái |
| Lý do từ chối trống | 400 Bad Request | `Vui lòng nhập lý do từ chối (ít nhất 10 ký tự).` | Nhập lý do |
| Lý do từ chối quá ngắn | 400 Bad Request | `Lý do từ chối phải có ít nhất 10 ký tự.` | Nhập lý do chi tiết hơn |
| Người dùng không có quyền phê duyệt L1 | 403 Forbidden | `Bạn không có quyền phê duyệt cấp L1.` | Chuyển cho lãnh đạo phòng |
| Người dùng không có quyền phê duyệt L2 | 403 Forbidden | `Bạn không có quyền phê duyệt cấp L2.` | Chuyển cho lãnh đạo cục |
| Người dùng tự phê duyệt bản gửi | 400 Bad Request | `Bạn không thể phê duyệt đèn biển do chính mình gửi.` | Gửi cho người khác phê duyệt |
| Lỗi server | 500 | `Hệ thống đang xảy ra sự cố.` | Báo admin |

## Integration Points

| Integration | Direction | Description |
|---|---|---|
| Notification Service | Outbound | Khi đèn biển chuyển trạng thái (PENDING → L1, L1 → L2, REJECTED → DRAFT) |
| M-007 PointObject | Outbound | Khi đèn biển PUBLISHED, điểm được hiển thị trên bản đồ |
| M-001 Units | Inbound | Để xác định đơn vị quản lý của đèn biển (phân quyền phê duyệt) |

## Acceptance Criteria

### AC-1: Phê duyệt L1 thành công
- **Given** đèn biển có status = `PENDING_APPROVAL`, approvalLevel = 1
- **And** lãnh đạo phòng đã đăng nhập
- **When** lãnh đạo phòng chọn "Phê duyệt"
- **Then** status = `APPROVED_L1`
- **And** approvalStatus = `APPROVED`, level1Approver = ID lãnh đạo, approvedDate = now
- **And** hiển thị thông báo "Đã phê duyệt cấp L1 thành công"
- **And** thông báo tự động gửi cho lãnh đạo cục để phê duyệt L2

### AC-2: Phê duyệt L2 thành công → PUBLISHED
- **Given** đèn biển có status = `APPROVED_L1`, approvalLevel = 2
- **And** lãnh đạo cục đã đăng nhập
- **When** lãnh đạo cục chọn "Phê duyệt"
- **Then** status = `PUBLISHED`
- **And** approvalStatus = `APPROVED`, level2Approver = ID lãnh đạo, approvedDate = now
- **And** hiển thị thông báo "Đã phê duyệt cấp L2 — đèn biển đã được công bố"
- **And** điểm GIS được hiển thị trên bản đồ

### AC-3: Từ chối L1 với lý do
- **Given** đèn biển có status = `PENDING_APPROVAL`, approvalLevel = 1
- **And** lãnh đạo phòng đã đăng nhập
- **When** lãnh đạo phòng chọn "Từ chối" và nhập lý do "Cần bổ sung thông tin phạm vi chiếu sáng"
- **Then** status = `DRAFT`, approvalStatus = `REJECTED`
- **And** rejectionReason được ghi nhận
- **And** thông báo gửi cho chuyên viên với lý do từ chối
- **And** chuyên viên có thể chỉnh sửa và gửi lại

### AC-4: Từ chối L2 với lý do
- **Given** đèn biển có status = `APPROVED_L1`, approvalLevel = 2
- **And** lãnh đạo cục đã đăng nhập
- **When** lãnh đạo cục chọn "Từ chối" và nhập lý do "Tọa độ cần kiểm tra lại"
- **Then** status = `DRAFT`, approvalStatus = `REJECTED`
- **And** rejectionReason được ghi nhận
- **And** thông báo gửi cho chuyên viên

### AC-5: Lý do từ chối tối thiểu 10 ký tự
- **Given** lãnh đạo đang ở trang phê duyệt
- **When** lãnh đạo chọn "Từ chối" và nhập lý do "Không OK" (8 ký tự)
- **Then** hệ thống hiển thị lỗi "Lý do từ chối phải có ít nhất 10 ký tự"
- **And** không cho phép submit

### AC-6: Không cho phép tự phê duyệt
- **Given** chuyên viên A tạo đèn biển và gửi duyệt
- **When** chuyên viên A (cũng là leader) cố gắng phê duyệt
- **Then** hệ thống hiển thị "Bạn không thể phê duyệt đèn biển do chính mình gửi"
- **And** HTTP status 400

### AC-7: Chỉ leader mới được phê duyệt
- **Given** người dùng là chuyên viên (không phải leader)
- **When** chuyên viên cố gắng phê duyệt đèn biển
- **Then** hệ thống hiển thị "Bạn không có quyền phê duyệt cấp L1/L2"
- **And** HTTP status 403

### AC-8: Không cho phép phê duyệt đèn biển PUBLISHED
- **Given** đèn biển có status = `PUBLISHED`
- **When** lãnh đạo cố gắng phê duyệt
- **Then** hệ thống hiển thị "Đèn biển này đã được công bố, không cần phê duyệt"
- **And** HTTP status 400

### AC-9: Hiển thị lịch sử phê duyệt trên trang chi tiết
- **Given** đèn biển có status = `APPROVED_L1`
- **And** đã được phê duyệt L1 bởi lãnh đạo phòng X vào ngày Y
- **When** lãnh đạo cục mở trang chi tiết
- **Then** trang hiển thị thông tin "Đã phê duyệt L1 bởi [X] vào [Y]"
- **And** hiển thị đầy đủ thông tin đèn biển để xem xét phê duyệt L2

### AC-10: Chuyển tiếp phê duyệt L1 → L2 tự động
- **Given** đèn biển vừa được phê duyệt L1
- **When** quá trình phê duyệt L1 hoàn tất
- **Then** status = `APPROVED_L1`, approvalLevel = 2 (chờ L2)
- **And** thông báo tự động gửi cho lãnh đạo cục
- **And** đèn biển xuất hiện trong danh sách "Chờ phê duyệt L2" của lãnh đạo cục

## Testing Strategy

- **Unit Testing**:
  - Test state machine: PENDING→L1→L2→PUBLISHED
  - Test reject at L1: status → DRAFT
  - Test reject at L2: status → DRAFT
  - Test rejectionReason validation (min 10 chars)
  - Test self-approval prevention

- **Integration Testing**:
  - Test full approval workflow end-to-end
  - Test notification delivery on state transitions
  - Test M-007 point sync on PUBLISH
  - Test DB integrity: approvedBy, approvedDate, level1Approver, level2Approver

- **E2E Testing**:
  - Test L1 approval UI flow
  - Test L2 approval UI flow
  - Test reject with reason entry
  - Test permission denied for wrong role
  - Test notification inbox updates

- **Security Testing**:
  - RBAC: chỉ leader đúng cấp mới phê duyệt được
  - Self-approval prevention
  - CSRF protection cho approve/reject endpoints
