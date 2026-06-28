---
id: F-068
name: Quan ly Den bien - Tao moi
slug: quan-ly-den-bien-tao-moi
module: M-013
status: proposed
---

# Quan ly Den bien - Tao moi

## Description

Chuyên viên nghiệp vụ tạo mới một đèn biển (BeaconLight) trong hệ thống quản lý báo hiệu hàng hải. Form bao gồm đầy đủ các trường thông tin kỹ thuật: mã, tên, loại, tọa độ, phạm vi chiếu sáng, màu sắc, đặc tính ánh sáng, mô tả, đơn vị quản lý, lịch bảo trì. Đèn biển mới tạo có trạng thái DRAFT → gửi phê duyệt L1 (phòng) → phê duyệt L2 (cục) → PUBLISHED. Code phải duy nhất trên toàn hệ thống (cross-type uniqueness giữa đèn biển và phao tiêu).

## Business Intent

Hệ thống cần một cơ chế chuẩn hóa để đăng ký, quản lý và phê duyệt thông tin đèn biển — các thiết bị báo hiệu hàng hải cố định hoặc di động phát tín hiệu ánh sáng phục vụ an toàn hàng hải. every đèn biển phải trải qua quy trình phê duyệt 2 cấp trước khi chính thức công bố.

## Flow Summary

1. Chuyên viên mở trang "Tạo mới đèn biển"
2. Nhập/kiểm tra các trường bắt buộc: Mã (code), Tên (name), Loại (type), Vĩ độ (latitude), Kinh độ (longitude), Phạm vi chiếu sáng (lightRange)
3. Nhập các trường tùy chọn: Màu ánh sáng (lightColor), Đặc tính ánh sáng (lightCharacteristic), Phạm vi (range), Mô tả (description), Đơn vị quản lý (unitId), Ngày bảo trì gần nhất (lastMaintenanceDate), Ngày bảo trì kế tiếp (nextMaintenanceDate)
4. Hệ thống tự động kiểm tra unique constraint trên `code` (cross-type với phao tiêu)
5. Hệ thống tự động set status = `DRAFT`
6. Chuyên viên chọn "Lưu nháp" hoặc "Gửi phê duyệt"
7. Nếu chọn "Gửi phê duyệt": status chuyển thành `PENDING_APPROVAL`, approvalStatus = `PENDING`, approvalLevel = 1
8. Hiển thị thông báo thành công, chuyển hướng đến danh sách đèn biển

## In Scope

- Form tạo mới đèn biển với validation realtime
- Kiểm tra unique constraint trên `code` (cross-type: đèn biển + phao tiêu)
- Tự động sinh trạng thái DRAFT khi tạo mới
- Nút "Lưu nháp" (draft) và "Gửi phê duyệt" (pending approval)
- Validation bắt buộc: code (max 50 ký tự), name (max 200 ký tự), type, latitude, longitude, lightRange
- Validation tọa độ WGS84: kinh độ -180°~180°, vĩ độ -90°~90°
- Log lịch sử tạo mới vào bảng BeaconHistory
- Phân quyền: chỉ chuyên viên và admin mới được tạo mới

## Out of Scope

- Chỉnh sửa hình ảnh/biểu tượng đèn biển trên bản đồ
- Tự động phát hiện tọa độ từ GPS realtime
- Import hàng loạt đèn biển từ file Excel
- Tích hợp trực tiếp vào bản đồ GIS (thuộc module M-007)
- Tự động sinh mã code — chuyên viên tự nhập hoặc hệ thống gợi ý
- Phê duyệt — thuộc F-071
- Xem lịch sử thay đổi — thuộc F-073

## Data Model — BeaconLight

| Trường (VN) | Trường (EN) | Kiểu | Bắt buộc | Validation | Ghi chú |
|---|---|---|---|---|---|
| Mã đèn biển | code | String (VARCHAR 50) | Có | NOT NULL, UNIQUE (cross-type), max 50 ký tự, không chứa ký tự đặc biệt: `< > & "` | Định dạng gợi ý: `DB-{Mã đơn vị}-{STT}` |
| Tên đèn biển | name | String (VARCHAR 200) | Có | NOT NULL, max 200 ký tự | Hiển thị trong danh sách và tra cứu |
| Loại đèn | type | Enum (VARCHAR 30) | Có | LIGHTHOUSE (Hải đăng), BEACON_LIGHT (Đèn báo), BEACON_MARK (Cọc tiêu) | Không được sửa sau khi đã PUBLISHED |
| Vĩ độ | latitude | Double | Có | -90.0 ≤ lat ≤ 90.0 | Hệ tọa độ WGS84 |
| Kinh độ | longitude | Double | Có | -180.0 ≤ lng ≤ 180.0 | Hệ tọa độ WGS84 |
| Phạm vi chiếu sáng (hải lý) | lightRange | Double | Có | 0.0 < lightRange ≤ 60.0 | Đơn vị: hải lý (nautical miles) |
| Màu ánh sáng | lightColor | String (VARCHAR 50) | Không | RED / WHITE / GREEN / YELLOW | Giá trị mặc định: null |
| Đặc tính ánh sáng | lightCharacteristic | String (VARCHAR 100) | Không | FL, Iso, Q, VQ, Oc, F, Fl(2), v.v. | Mô tả đặc tính chu kỳ |
| Phạm vi quan sát | range | Double | Không | 0.0 < range ≤ 100.0 | Đơn vị: hải lý, có thể khác lightRange |
| Mô tả | description | String (VARCHAR 1000) | Không | max 1000 ký tự | Thông tin bổ sung |
| Đơn vị quản lý | unitId | Long | Không | Tham chiếu bảng `units` | Phòng/Chi cục/Cảng vụ quản lý |
| Ngày bảo trì gần nhất | lastMaintenanceDate | LocalDate | Không | Không được lớn hơn ngày hiện tại | Tự động gợi ý từ lịch sử bảo trì |
| Ngày bảo trì kế tiếp | nextMaintenanceDate | LocalDate | Không | Không được nhỏ hơn lastMaintenanceDate | Hệ thống nhắc nhở tự động |
| Trạng thái hoạt động | isActive | Boolean | Không | Mặc định: true | Tạm ngừng hoạt động |
| Trạng thái xử lý | status | Enum | Tự động | DRAFT (mặc định) | Chuyển thành PENDING_APPROVAL khi gửi duyệt |
| Trạng thái phê duyệt | approvalStatus | Enum | Tự động | PENDING (mặc định) | Chuyển khi lãnh đạo phê duyệt |
| Cấp phê duyệt | approvalLevel | Integer | Tự động | 1 hoặc 2 | Chỉ số khi gửi duyệt |
| ID (UUID) | id | UUID | Tự động | UUID v7 | Primary key |
| Thời gian tạo | createdAt | LocalDateTime | Tự động | Auto-fill | |
| Thời gian cập nhật | updatedAt | LocalDateTime | Tự động | Auto-fill | |
| Thời gian xóa mềm | deletedAt | LocalDateTime | Tự động | null khi chưa xóa | Soft delete |

## Business Rules

| ID | Rule | Áp dụng cho | Nguồn |
|---|---|---|---|
| BR-068-01 | Mã đèn biển (code) phải là duy nhất trong toàn hệ thống, bao gồm cả phao tiêu. Không cho phép tạo mới nếu code đã tồn tại | Tạo mới | Dữ liệu master |
| BR-068-02 | Tọa độ phải thuộc hệ WGS84: kinh độ -180°~180°, vĩ độ -90°~90°. Reject nếu ra ngoài khoảng | Tạo/Sửa | Tech spec |
| BR-068-03 | Phạm vi chiếu sáng (lightRange) phải lớn hơn 0 và không vượt quá 60 hải lý | Tạo/Sửa | Quy chuẩn hàng hải |
| BR-068-04 | Đèn biển mới tạo có trạng thái mặc định là DRAFT, chưa thể hiển thị trên bản đồ | Tạo mới | Workflow |
| BR-068-05 | Khi chọn "Gửi phê duyệt": status chuyển từ DRAFT → PENDING_APPROVAL, approvalStatus = PENDING, approvalLevel = 1. Không thể quay lại DRAFT sau khi đã gửi | Tạo/Sửa | Workflow |
| BR-068-06 | Trường `type` không được phép sửa khi đèn biển đã có status APPROVED_L2 hoặc PUBLISHED | Sửa | Dữ liệu master |
| BR-068-07 | Ngày bảo trì kế tiếp (nextMaintenanceDate) không được nhỏ hơn ngày bảo trì gần nhất (lastMaintenanceDate) | Tạo/Sửa | Logic nghiệp vụ |
| BR-068-08 | lastMaintenanceDate không được lớn hơn ngày hiện tại (today) | Tạo/Sửa | Logic nghiệp vụ |
| BR-068-09 | Chỉ các role admin và system-admin mới được tạo đèn biển | Quyền | URD §4 |
| BR-068-10 | Nếu unitId không được chọn, hệ thống tự động gán đơn vị của người tạo | Tạo mới | Logic nghiệp vụ |

## Permission/Role Requirements

| Role | Level | Quyền |
|---|---|---|
| system-admin | Full | Tạo/Sửa/Xóa tất cả đèn biển, bất kỳ đơn vị nào |
| admin (Cục chuyên viên) | CRUD | Tạo/Sửa/Xóa đèn biển thuộc Cục quản lý |
| admin (Chi cục/Cảng vụ chuyên viên) | CRUD | Tạo/Sửa/Xóa đèn biển thuộc đơn vị mình quản lý |
| user (Doanh nghiệp cảng) | Read-only | Chỉ xem đèn biển đã PUBLISHED |
| leader (Lãnh đạo phòng) | Phê duyệt L1 | Chỉ phê duyệt, không tạo/sửa |
| leader (Lãnh đạo cục) | Phê duyệt L2 | Chỉ phê duyệt, không tạo/sửa |

## Error Handling

| Error | HTTP Status | Message (VN) | Recovery |
|---|---|---|---|
| Code trùng lặp | 409 Conflict | `Mã đèn biển '{code}' đã tồn tại. Vui lòng chọn mã khác.` | Chuyên viên nhập lại code |
| Tọa độ không hợp lệ | 400 Bad Request | `Tọa độ không hợp lệ. Vui lòng kiểm tra lại kinh độ và vĩ độ.` | Sửa tọa độ trong khoảng cho phép |
| lightRange vượt ngưỡng | 400 Bad Request | `Phạm vi chiếu sáng phải trong khoảng (0, 60] hải lý.` | Điều chỉnh giá trị |
| nextMaintenanceDate < lastMaintenanceDate | 400 Bad Request | `Ngày bảo trì kế tiếp không được nhỏ hơn ngày bảo trì gần nhất.` | Sửa lại ngày |
| lastMaintenanceDate > today | 400 Bad Request | `Ngày bảo trì gần nhất không được lớn hơn ngày hiện tại.` | Sửa lại ngày |
| Tên rỗng | 400 Bad Request | `Tên đèn biển không được để trống.` | Nhập tên |
| Mã rỗng hoặc quá dài | 400 Bad Request | `Mã đèn biển không được để trống và tối đa 50 ký tự.` | Nhập lại mã |
| Đơn vị không tồn tại | 404 Not Found | `Đơn vị quản lý không tồn tại.` | Chọn đơn vị hợp lệ |
| Không có quyền tạo | 403 Forbidden | `Bạn không có quyền tạo đèn biển.` | Liên hệ quản trị hệ thống |
| Lỗi DB unique constraint | 409 Conflict | `Hệ thống xảy ra lỗi trùng lặp. Vui lòng thử lại với mã khác.` | Nhập mã khác |
| Lỗi server internal | 500 Internal Server Error | `Hệ thống đang xảy ra sự cố. Vui lòng thử lại sau.` | Báo admin |

## Integration Points

| Integration | Direction | Description |
|---|---|---|
| M-007 GIS PointObject | Outbound | Khi đèn biển được PUBLISHED, điểm tọa độ được đồng bộ vào bảng `point_objects` (M-007) để hiển thị trên bản đồ |
| M-001 Units/Danh mục đơn vị | Inbound | Đọc danh sách đơn vị (unitId) từ module danh mục đơn vị |
| Notification Service | Outbound | Khi gửi phê duyệt, gửi thông báo cho lãnh đạo phòng (L1) |
| M-005 Cron/Scheduler | Outbound | Khi nextMaintenanceDate đến, tự động tạo cảnh báo bảo trì |

## Acceptance Criteria

### AC-1: Tạo đèn biển thành công với đầy đủ thông tin
- **Given** người dùng có quyền admin đã đăng nhập
- **And** người dùng truy cập trang "Tạo mới đèn biển"
- **When** người điền đầy đủ các trường bắt buộc (code, name, type, latitude, longitude, lightRange)
- **And** các trường tùy chọn (lightColor, lightCharacteristic, description, unitId)
- **And** chọn "Gửi phê duyệt"
- **Then** hệ thống tạo mới đèn biển với status = `DRAFT`
- **And** sau khi submit "Gửi phê duyệt", status chuyển thành `PENDING_APPROVAL`
- **And** approvalStatus = `PENDING`, approvalLevel = 1
- **And** hiển thị thông báo "Đèn biển đã được tạo và gửi phê duyệt thành công"
- **And** redirect đến trang danh sách đèn biển

### AC-2: Tạo đèn biển chỉ lưu nháp
- **Given** người dùng có quyền admin đã đăng nhập
- **And** người dùng điền đầy đủ thông tin đèn biển
- **When** người dùng chọn nút "Lưu nháp"
- **Then** đèn biển được lưu với status = `DRAFT`
- **And** approvalStatus = `PENDING`, approvalLevel = null
- **And** đèn biển KHÔNG hiển thị trong danh sách công khai
- **And** người dùng có thể quay lại chỉnh sửa và gửi duyệt sau

### AC-3: Code trùng lặp bị chặn
- **Given** đã tồn tại đèn biển hoặc phao tiêu có code = "DB-HAUI-001"
- **When** người dùng tạo mới với code = "DB-HAUI-001"
- **Then** hệ thống hiển thị lỗi "Mã đèn biển 'DB-HAUI-001' đã tồn tại. Vui lòng chọn mã khác."
- **And** không tạo mới bản ghi trong database

### AC-4: Tọa độ vượt ngưỡng WGS84 bị chặn
- **Given** người dùng đang tạo mới đèn biển
- **When** người dùng nhập latitude = 95.0 (vượt quá 90°)
- **Then** hệ thống hiển thị lỗi "Tọa độ không hợp lệ. Vui lòng kiểm tra lại vĩ độ."
- **And** nút "Gửi phê duyệt" bị disable cho đến khi sửa tọa độ

### AC-5: lightRange vượt quá 60 hải lý bị chặn
- **Given** người dùng đang tạo mới đèn biển
- **When** người dùng nhập lightRange = 65.0
- **Then** hệ thống hiển thị lỗi "Phạm vi chiếu sáng phải trong khoảng (0, 60] hải lý."
- **And** không cho phép submit form

### AC-6: Validation realtime trên form
- **Given** người dùng đang điền form tạo mới đèn biển
- **When** người dùng nhập vào trường "Tên" trống rồi rời trường
- **Then** hệ thống hiển thị ngay thông báo lỗi màu đỏ "Tên đèn biển không được để trống."
- **And** trường code hiển thị validation khi mất focus nếu vượt quá 50 ký tự

### AC-7: nextMaintenanceDate < lastMaintenanceDate bị chặn
- **Given** người dùng đã nhập lastMaintenanceDate = "2026-06-15"
- **When** người dùng nhập nextMaintenanceDate = "2026-06-10" (nhỏ hơn)
- **Then** hệ thống hiển thị lỗi "Ngày bảo trì kế tiếp không được nhỏ hơn ngày bảo trì gần nhất."
- **And** form không cho phép submit

### AC-8: Chỉ admin mới được tạo
- **Given** người dùng là "user" (doanh nghiệp cảng) đã đăng nhập
- **When** người dùng cố gắng truy cập URL "/beacon-lights/create"
- **Then** hệ thống hiển thị thông báo "Bạn không có quyền tạo đèn biển."
- **And** redirect về trang chính

### AC-9: Tự động gán unitId nếu không chọn
- **Given** người dùng là chuyên viên Chi cục số 1 (unitId = 5)
- **When** người dùng tạo mới đèn biển và không chọn unitId
- **Then** hệ thống tự động gán unitId = 5 (đơn vị của người tạo)
- **And** không hiển thị lỗi

### AC-10: Log lịch sử tạo mới được ghi nhận
- **Given** đèn biển mới được tạo thành công
- **When** quá trình tạo hoàn tất
- **Then** bản ghi trong bảng `beacon_histories` được tạo với actionType = "CREATE"
- **And** changedBy = ID người tạo
- **And** changedAt = timestamp hiện tại

## Testing Strategy

- **Unit Testing**:
  - Validate unique constraint trên code (cross-type)
  - Validate tọa độ WGS84 bounds
  - Validate lightRange trong khoảng (0, 60]
  - Validate nextMaintenanceDate ≥ lastMaintenanceDate
  - Validate lastMaintenanceDate ≤ today
  - Validate name/code không null và độ dài
  - Test state machine: DRAFT → PENDING_APPROVAL

- **Integration Testing**:
  - Test full flow: tạo → lưu nháp → gửi duyệt → phê duyệt L1 → phê duyệt L2 → publish
  - Test cross-type unique: code phao tiêu + code đèn biển
  - Test DB constraint: duplicate code
  - Test unitId auto-assignment
  - Test history logging after creation

- **E2E Testing**:
  - Test form creation với đầy đủ fields
  - Test "Lưu nháp" action
  - Test "Gửi phê duyệt" action
  - Test validation errors hiển thị realtime
  - Test unique code conflict
  - Test permission denied for non-admin

- **Security Testing**:
  - RBAC enforcement: chỉ admin tạo được
  - XSS prevention qua name/description
  - SQL injection prevention qua code input
