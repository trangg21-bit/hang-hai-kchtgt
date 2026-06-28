---
id: F-074
name: Quan ly Phao tieu - Tao moi
slug: quan-ly-phao-tieu-tao-moi
module: M-013
status: proposed
---

# Quan ly Phao tieu - Tao moi

## Description

Chuyên viên nghiệp vụ tạo mới một phao tiêu (Buoy) trong hệ thống quản lý báo hiệu hàng hải. Form bao gồm các trường thông tin kỹ thuật: mã, tên, loại, tọa độ, màu sắc, hình dạng, đặc tính ánh sáng, phạm vi quan sát, mô tả, đơn vị quản lý, lịch kiểm tra, trạng thái hoạt động. Phao tiêu mới tạo có trạng thái DRAFT → gửi phê duyệt L1 (phòng) → phê duyệt L2 (cục) → PUBLISHED. Code phải duy nhất trên toàn hệ thống (cross-type uniqueness giữa đèn biển và phao tiêu).

## Business Intent

Hệ thống cần một cơ chế chuẩn hóa để đăng ký, quản lý và phê duyệt thông tin phao tiêu — các thiết bị báo hiệu hàng hải nổi, trôi hoặc cố định trên mặt nước, dùng để đánh dấu luồng lạch, bãi cạn, chướng ngại vật và các khu vực đặc biệt. every phao tiêu phải trải qua quy trình phê duyệt 2 cấp trước khi chính thức công bố.

## Flow Summary

1. Chuyên viên mở trang "Tạo mới phao tiêu"
2. Nhập/kiểm tra các trường bắt buộc: Mã (code), Tên (name), Loại (type), Vĩ độ (latitude), Kinh độ (longitude), Phạm vi quan sát (range)
3. Nhập các trường tùy chọn: Màu sắc (color), Hình dạng (shape), Đặc tính ánh sáng (lightCharacteristic), Mô tả (description), Đơn vị quản lý (unitId), Ngày kiểm tra gần nhất (lastInspectionDate), Ngày kiểm tra kế tiếp (nextInspectionDate)
4. Hệ thống tự động kiểm tra unique constraint trên `code` (cross-type với đèn biển)
5. Hệ thống tự động set status = `DRAFT`
6. Chuyên viên chọn "Lưu nháp" hoặc "Gửi phê duyệt"
7. Nếu chọn "Gửi phê duyệt": status chuyển thành `PENDING_APPROVAL`, approvalStatus = `PENDING`, approvalLevel = 1
8. Hiển thị thông báo thành công, chuyển hướng đến danh sách phao tiêu

## In Scope

- Form tạo mới phao tiêu với validation realtime
- Kiểm tra unique constraint trên `code` (cross-type: phao tiêu + đèn biển)
- Tự động sinh trạng thái DRAFT khi tạo mới
- Nút "Lưu nháp" (draft) và "Gửi phê duyệt" (pending approval)
- Validation bắt buộc: code (max 50), name (max 200), type, latitude, longitude, range
- Validation tọa độ WGS84: kinh độ -180°~180°, vĩ độ -90°~90°
- Log lịch sử tạo mới vào bảng BuoyHistory
- Phân quyền: chỉ chuyên viên và admin mới được tạo mới

## Out of Scope

- Chỉnh sửa phao tiêu — thuộc F-075
- Xóa phao tiêu — thuộc F-076
- Phê duyệt — thuộc F-077
- Xem lịch sử — thuộc F-079
- Import hàng loạt từ file Excel
- Tích hợp trực tiếp vào bản đồ GIS (thuộc M-007)
- Tự động sinh mã code

## Data Model — Buoy

| Trường (VN) | Trường (EN) | Kiểu | Bắt buộc | Validation | Ghi chú |
|---|---|---|---|---|---|
| Mã phao tiêu | code | String (VARCHAR 50) | Có | NOT NULL, UNIQUE (cross-type), max 50 ký tự | Định dạng gợi ý: `PT-{Mã đơn vị}-{STT}` |
| Tên phao tiêu | name | String (VARCHAR 200) | Có | NOT NULL, max 200 ký tự | |
| Loại phao | type | Enum (VARCHAR 30) | Có | CARDINAL (Cardinal), SECTOR (Sector), SPECIAL (Special), SAFE_WATER (Safe Water), ISOLATED_DANGER (Isolated Danger) | |
| Vĩ độ | latitude | Double | Có | -90.0 ≤ lat ≤ 90.0 | WGS84 |
| Kinh độ | longitude | Double | Có | -180.0 ≤ lng ≤ 180.0 | WGS84 |
| Màu sắc | color | String (VARCHAR 50) | Không | RED / GREEN / BLACK+RED / BLACK+YELLOW / WHITE / YELLOW / ORANGE | Giá trị mặc định: null |
| Hình dạng | shape | String (VARCHAR 50) | Không | CAN (Hình trụ), CONE (Hình nón), SPAR (Trụ), BELL (Chuông), BUCKET (Gáo), TUBULAR (Ống) | Giá trị mặc định: null |
| Đặc tính ánh sáng | lightCharacteristic | String (VARCHAR 100) | Không | FL, Iso, Q, VQ, Oc, F, Fl(2), v.v. | Chỉ áp dụng khi phao có đèn |
| Phạm vi quan sát | range | Double | Có | 0.0 < range ≤ 100.0 | Đơn vị: hải lý |
| Mô tả | description | String (VARCHAR 1000) | Không | max 1000 ký tự | |
| Đơn vị quản lý | unitId | Long | Không | Tham chiếu bảng `units` | |
| Ngày kiểm tra gần nhất | lastInspectionDate | LocalDate | Không | Không được lớn hơn ngày hiện tại | |
| Ngày kiểm tra kế tiếp | nextInspectionDate | LocalDate | Không | Không được nhỏ hơn lastInspectionDate | |
| Trạng thái hoạt động | isActive | Boolean | Không | Mặc định: true | |
| Trạng thái xử lý | status | Enum | Tự động | DRAFT (mặc định) | |
| Trạng thái phê duyệt | approvalStatus | Enum | Tự động | PENDING (mặc định) | |
| Cấp phê duyệt | approvalLevel | Integer | Tự động | 1 hoặc 2 | |
| ID (UUID) | id | UUID | Tự động | UUID v7 | Primary key |
| Thời gian tạo | createdAt | LocalDateTime | Tự động | Auto-fill | |
| Thời gian cập nhật | updatedAt | LocalDateTime | Tự động | Auto-fill | |
| Thời gian xóa mềm | deletedAt | LocalDateTime | Tự động | null khi chưa xóa | |

## Business Rules

| ID | Rule | Áp dụng cho | Nguồn |
|---|---|---|---|
| BR-074-01 | Mã phao tiêu (code) phải là duy nhất trong toàn hệ thống, bao gồm cả đèn biển | Tạo mới | Dữ liệu master |
| BR-074-02 | Tọa độ phải thuộc hệ WGS84: kinh độ -180°~180°, vĩ độ -90°~90° | Tạo/Sửa | Tech spec |
| BR-074-03 | Phạm vi quan sát (range) phải lớn hơn 0 và không vượt quá 100 hải lý | Tạo/Sửa | Quy chuẩn hàng hải |
| BR-074-04 | Phao tiêu mới tạo có trạng thái mặc định là DRAFT, chưa thể hiển thị trên bản đồ | Tạo mới | Workflow |
| BR-074-05 | Khi chọn "Gửi phê duyệt": status → PENDING_APPROVAL, approvalStatus = PENDING, approvalLevel = 1 | Tạo/Sửa | Workflow |
| BR-074-06 | Trường `type` không được phép sửa khi phao tiêu đã có status APPROVED_L2 hoặc PUBLISHED | Sửa | Dữ liệu master |
| BR-074-07 | nextInspectionDate không được nhỏ hơn lastInspectionDate | Tạo/Sửa | Logic nghiệp vụ |
| BR-074-08 | lastInspectionDate không được lớn hơn ngày hiện tại | Tạo/Sửa | Logic nghiệp vụ |
| BR-074-09 | Chỉ các role admin và system-admin mới được tạo phao tiêu | Quyền | URD §4 |
| BR-074-10 | Nếu unitId không được chọn, hệ thống tự động gán đơn vị của người tạo | Tạo mới | Logic nghiệp vụ |

## Permission/Role Requirements

| Role | Level | Quyền |
|---|---|---|
| system-admin | Full | Tạo/Sửa/Xóa tất cả phao tiêu |
| admin (Cục chuyên viên) | CRUD | Tạo/Sửa/Xóa phao tiêu thuộc Cục |
| admin (Chi cục/Cảng vụ chuyên viên) | CRUD | Tạo/Sửa/Xóa phao tiêu thuộc đơn vị mình |
| user (Doanh nghiệp cảng) | Read-only | Chỉ xem phao tiêu PUBLISHED |
| leader (Lãnh đạo phòng) | Phê duyệt L1 | Chỉ phê duyệt |
| leader (Lãnh đạo cục) | Phê duyệt L2 | Chỉ phê duyệt |

## Error Handling

| Error | HTTP Status | Message (VN) | Recovery |
|---|---|---|---|
| Code trùng lặp | 409 | `Mã phao tiêu '{code}' đã tồn tại. Vui lòng chọn mã khác.` | Nhập lại code |
| Tọa độ không hợp lệ | 400 | `Tọa độ không hợp lệ. Vui lòng kiểm tra lại kinh độ và vĩ độ.` | Sửa tọa độ |
| range vượt ngưỡng | 400 | `Phạm vi quan sát phải trong khoảng (0, 100] hải lý.` | Điều chỉnh giá trị |
| nextInspectionDate < lastInspectionDate | 400 | `Ngày kiểm tra kế tiếp không được nhỏ hơn ngày kiểm tra gần nhất.` | Sửa lại ngày |
| lastInspectionDate > today | 400 | `Ngày kiểm tra gần nhất không được lớn hơn ngày hiện tại.` | Sửa lại ngày |
| Tên rỗng | 400 | `Tên phao tiêu không được để trống.` | Nhập tên |
| Mã rỗng hoặc quá dài | 400 | `Mã phao tiêu không được để trống và tối đa 50 ký tự.` | Nhập lại mã |
| Đơn vị không tồn tại | 404 | `Đơn vị quản lý không tồn tại.` | Chọn đơn vị hợp lệ |
| Không có quyền tạo | 403 | `Bạn không có quyền tạo phao tiêu.` | Liên hệ quản trị |
| Lỗi server | 500 | `Hệ thống đang xảy ra sự cố. Vui lòng thử lại sau.` | Báo admin |

## Integration Points

| Integration | Direction | Description |
|---|---|---|
| M-007 PointObject | Outbound | Khi phao tiêu được PUBLISHED, điểm tọa độ đồng bộ vào `point_objects` |
| M-001 Units | Inbound | Đọc danh sách đơn vị (unitId) |
| Notification Service | Outbound | Khi gửi phê duyệt, thông báo cho lãnh đạo phòng |
| M-005 Cron/Scheduler | Outbound | Khi nextInspectionDate đến, tự động tạo cảnh báo kiểm tra |

## Acceptance Criteria

### AC-1: Tạo phao tiêu thành công
- **Given** người dùng có quyền admin đã đăng nhập
- **And** điền đầy đủ các trường bắt buộc
- **When** chọn "Gửi phê duyệt"
- **Then** status = `PENDING_APPROVAL`, approvalStatus = `PENDING`, approvalLevel = 1
- **And** hiển thị thông báo thành công

### AC-2: Tạo phao tiêu chỉ lưu nháp
- **Given** người dùng đang tạo mới phao tiêu
- **When** chọn "Lưu nháp"
- **Then** status = `DRAFT`, approvalStatus = `PENDING`, approvalLevel = null
- **And** có thể quay lại chỉnh sửa và gửi duyệt sau

### AC-3: Code trùng bị chặn (cross-type)
- **Given** đã tồn tại đèn biển hoặc phao tiêu có code = "PT-HAUI-001"
- **When** tạo mới với code = "PT-HAUI-001"
- **Then** hiển thị lỗi "Mã phao tiêu 'PT-HAUI-001' đã tồn tại"
- **And** không tạo mới bản ghi

### AC-4: Tọa độ vượt WGS84 bị chặn
- **Given** người dùng đang tạo mới phao tiêu
- **When** nhập latitude = 95.0
- **Then** hiển thị lỗi "Tọa độ không hợp lệ"
- **And** nút submit bị disable

### AC-5: range vượt quá 100 hải lý bị chặn
- **Given** người dùng đang tạo mới phao tiêu
- **When** nhập range = 110.0
- **Then** hiển thị lỗi "Phạm vi quan sát phải trong khoảng (0, 100] hải lý"
- **And** không cho phép submit

### AC-6: Validation realtime
- **Given** người dùng đang điền form
- **When** xóa trường "Tên" rồi rời trường
- **Then** hiển thị lỗi màu đỏ "Tên phao tiêu không được để trống"

### AC-7: nextInspectionDate < lastInspectionDate bị chặn
- **Given** lastInspectionDate = "2026-06-15"
- **When** nhập nextInspectionDate = "2026-06-10"
- **Then** hiển thị lỗi "Ngày kiểm tra kế tiếp không được nhỏ hơn ngày kiểm tra gần nhất"

### AC-8: Chỉ admin mới được tạo
- **Given** user/doanh nghiệp cảng đã đăng nhập
- **When** truy cập "/buoys/create"
- **Then** hiển thị "Bạn không có quyền tạo phao tiêu"
- **And** redirect về trang chính

### AC-9: Tự động gán unitId
- **Given** người dùng là chuyên viên Chi cục số 1 (unitId = 5)
- **When** tạo mới và không chọn unitId
- **Then** tự động gán unitId = 5

### AC-10: Log lịch sử tạo mới
- **Given** phao tiêu mới được tạo thành công
- **When** quá trình tạo hoàn tất
- **Then** entry trong `buoy_histories` với actionType = "CREATE"
- **And** changedBy = ID người tạo

## Testing Strategy

- **Unit Testing**: unique constraint cross-type, WGS84 validation, range validation, state machine DRAFT→PENDING_APPROVAL
- **Integration Testing**: full flow tạo→nháp→gửi duyệt, cross-type unique, DB constraints, auto-assignment unitId
- **E2E Testing**: form creation, "Lưu nháp", "Gửi phê duyệt", validation errors, permission denied
- **Security Testing**: RBAC, XSS, SQL injection
