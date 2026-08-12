---
feature-id: F-056
document: lean-spec
output-mode: lean
last-updated: 2026-08-07
---
# Tạo mới Trạm radar

## Summary

Hệ thống cần cho phép người dùng có thẩm quyền (Admin, Chuyên viên) tạo mới Trạm radar vào hệ thống quản lý tài sản KCHTGT khu nước & VTS với đầy đủ thông tin kỹ thuật và hành chính. Giải pháp cung cấp biểu mẫu tạo mới gồm 5 nhóm thông tin (collapsible sections), hỗ trợ 3 chế độ lưu (Lưu tạm, Lưu và gửi phê duyệt, Lưu và phê duyệt), validation chặt chẽ, lọc dữ liệu cha-con theo phân cấp Đơn vị quản lý → Hệ thống VTS → Trung tâm điều hành VTS, cascade clear khi thay đổi lựa chọn cha, và ghi nhật ký tự động. Thành công được đo bằng khả năng tạo mới trạm radar với trạng thái PROPOSED và sẵn sàng cho quy trình phê duyệt 2 cấp tại F-059.

## Scope

| | Items |
|---|---|
| In scope | Hiển thị form tạo mới với 5 nhóm thông tin dạng collapsible; Validation tên trạm (bắt buộc, max 255), vị trí (bắt buộc, max 500), tọa độ (longitude [-180,180], latitude [-90,90]), số lượng (max 5 chữ số); 3 chế độ lưu: Lưu tạm, Lưu và gửi phê duyệt, Lưu và phê duyệt; Lọc Cảng biển/Hệ thống VTS/Trung tâm điều hành VTS theo đơn vị quản lý và trạng thái đã duyệt; Cascade clear: đổi orgUnitId → clear cangBienId, vtsSystemId, ttdhVtsId; đổi vtsSystemId → clear ttdhVtsId; Ghi nhật ký tự động (ApprovalHistory); Phân quyền RBAC (nút "Lưu và phê duyệt" chỉ cho Admin/Lãnh đạo); Quản lý file đính kèm và tọa độ GIS; Tự động sinh mã radar (RADAR-{seq}) |
| Out of scope | Cập nhật Trạm radar sau khi tạo (F-057); Xóa Trạm radar (F-058); Phê duyệt Trạm radar (F-059); Xem chi tiết/lịch sử Trạm radar (F-060, F-061); Gắn tài sản cho Trạm radar; Xuất báo cáo |
| Assumptions | Người dùng đã đăng nhập và có vai trò Admin hoặc Chuyên viên; Hệ thống VTS cha đã tồn tại và được duyệt (APPROVED) trong hệ thống; Mã radar tự động sinh; Dữ liệu được lọc theo đơn vị quản lý của người dùng |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-056-01 | Chuyên viên | Tạo mới Trạm radar với đầy đủ thông tin cơ bản và kỹ thuật | Đăng ký tài sản vào hệ thống quản lý | Must Have |
| US-056-02 | Chuyên viên | Hệ thống tự động gán trạng thái PROPOSED cho bản ghi mới | Đưa bản ghi vào luồng phê duyệt | Must Have |
| US-056-03 | Chuyên viên | Chỉ chọn Hệ thống VTS và trung tâm điều hành VTS đã được phê duyệt | Đảm bảo trạm radar được gán đúng hệ thống hợp lệ | Must Have |
| US-056-04 | Chuyên viên | "Lưu tạm" trạm radar để chỉnh sửa thêm | Linh hoạt trong quy trình nhập liệu | Must Have |
| US-056-05 | Chuyên viên | "Lưu và gửi phê duyệt" trạm radar | Gửi đến cấp có thẩm quyền xem xét | Must Have |
| US-056-06 | Admin/Lãnh đạo | "Lưu và phê duyệt" ngay | Đưa trạm radar vào sử dụng không cần chờ duyệt | Must Have |
| US-056-07 | Chuyên viên | Nhập tọa độ GIS cho trạm radar | Hiển thị vị trí trên bản đồ sau khi được phê duyệt | Should Have |
| US-056-08 | Chuyên viên | Đính kèm file tài liệu khi tạo mới | Hoàn thiện hồ sơ trong một lần thao tác | Should Have |
| US-056-09 | Chuyên viên | Nhận thông báo rõ ràng khi tạo mới thành công/thất bại | Biết trạng thái thao tác | Should Have |
| US-056-10 | Chuyên viên | Chọn trạm radar từ danh sách mẫu có sẵn | Tạo nhanh | Could Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-056-01 | US-056-01 | Hiển thị form tạo mới | Given người dùng có role Admin hoặc Chuyên viên; When nhấn "Tạo mới" từ danh sách Trạm radar; Then hệ thống hiển thị form với 5 nhóm trường dạng collapsible | Nếu không có quyền, nút "Tạo mới" bị ẩn, API trả về 403 |
| AC-056-02 | US-056-01 | Tạo mới thành công | Given form hợp lệ; When nhấn lưu; Then bản ghi lưu với approvalStatus=PROPOSED, approvedLevel1=false, approvedLevel2=false | HTTP 200 |
| AC-056-03 | US-056-02 | Tự động gán PROPOSED | Given bất kỳ request nào; When tạo mới; Then server luôn gán approvalStatus=PROPOSED | Không cho phép tạo với trạng thái khác |
| AC-056-04 | US-056-01 | Validation tên trạm | Given người dùng để trống stationName hoặc > 255 ký tự; When nhấn Lưu; Then hiển thị lỗi "Tên trạm không được để trống" | Validation cả client và server |
| AC-056-05 | US-056-01 | Validation vị trí | Given người dùng để trống location hoặc > 500 ký tự; When nhấn Lưu; Then hiển thị lỗi "Vị trí không được để trống" | Validation cả client và server |
| AC-056-06 | US-056-07 | Validation tọa độ | Given người dùng nhập longitude ngoài [-180,180] hoặc latitude ngoài [-90,90]; When nhấn Lưu; Then hiển thị lỗi tại trường tương ứng | |
| AC-056-07 | US-056-01 | Ghi nhận người tạo | Given form hợp lệ; When lưu thành công; Then createdBy lấy từ session, createdDate tự động gán | Không nhận từ client |
| AC-056-08 | US-056-04 | Lưu tạm thành công | Given form hợp lệ; When nhấn "Lưu tạm"; Then trạm radar lưu PROPOSED, thông báo "Lưu tạm trạm radar thành công", redirect danh sách | Có thể sửa tiếp (F-057) |
| AC-056-09 | US-056-05 | Lưu và gửi phê duyệt thành công | Given form hợp lệ; When nhấn "Lưu và gửi phê duyệt"; Then trạm radar lưu PROPOSED + cờ gửi duyệt, thông báo "Đã gửi phê duyệt trạm radar" | Xuất hiện trong danh sách chờ duyệt F-059 |
| AC-056-10 | US-056-06 | Lưu và phê duyệt thành công | Given Admin/Lãnh đạo, form hợp lệ; When nhấn "Lưu và phê duyệt"; Then trạm radar lưu APPROVED, approvedLevel1=true, approvedLevel2=true | Trạm radar sẵn sàng sử dụng ngay |
| AC-056-11 | US-056-01 | Xử lý lỗi server | Given lỗi DB hoặc constraint; When lưu; Then HTTP 400 + thông báo lỗi cụ thể | Không crash frontend |
| AC-056-12 | US-056-01 | Trường bắt buộc | Given người dùng bỏ trống trường bắt buộc; When nhấn Lưu; Then hiển thị lỗi "Trường này là bắt buộc", chặn submit | |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-056-01 | Mọi bản ghi tạo mới có approvalStatus=PROPOSED | AC-056-02, AC-056-03 | Không có ngoại lệ |
| BR-056-02 | stationName bắt buộc, max 255 ký tự | AC-056-04 | Không có ngoại lệ |
| BR-056-03 | location bắt buộc, max 500 ký tự | AC-056-05 | Không có ngoại lệ |
| BR-056-04 | orgUnitId xác định đơn vị quản lý; mặc định = đơn vị của user | AC-056-01 | Admin Cục chọn được mọi đơn vị |
| BR-056-05 | Chỉ chọn Hệ thống VTS đã APPROVED, filter theo orgUnitId | AC-056-01 | Không có ngoại lệ |
| BR-056-06 | Cascade clear: đổi orgUnitId → clear cangBienId, vtsSystemId, ttdhVtsId; đổi vtsSystemId → clear ttdhVtsId | AC-056-01 | Không có ngoại lệ |
| BR-056-07 | Validation cả client-side và server-side | AC-056-04, AC-056-05, AC-056-06 | Không có ngoại lệ |
| BR-056-08 | Trạm radar PROPOSED chưa được tham chiếu bởi module khác; phải qua F-059 đạt APPROVED mới dùng được | AC-056-08, AC-056-09 | Không có ngoại lệ |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | API tạo mới phản hồi | ≤ 2 giây |
| Performance | Dropdown Hệ thống VTS phản hồi khi thay đổi ĐVQL | ≤ 300ms |
| Security | Phân quyền RBAC trên tất cả API; JWT token bắt buộc; createdBy lấy từ token | HTTP 403 khi không có quyền |
| Security | Nút "Lưu và phê duyệt" chỉ hiển thị cho Admin/Lãnh đạo | UI + API enforcement |
| Reliability | Validation client + server; @Transactional đảm bảo toàn vẹn | 100% consistency |
| Operability | Thông báo lỗi rõ ràng bằng tiếng Việt, tương ứng từng trường | Không để lộ stack trace |
| UX | Giao diện responsive (≤ 768px: menu thu gọn); loading skeleton; empty state khi dropdown trống | WCAG 2.1 AA |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-056-01 | AC-056-01 | Happy path: Admin/Chuyên viên mở form tạo mới | Integration |
| TS-056-02 | AC-056-01 | Negative: Người dùng không có quyền → HTTP 403 | Security |
| TS-056-03 | AC-056-04 | Negative: stationName trống → lỗi validation | Integration |
| TS-056-04 | AC-056-05 | Negative: location trống → lỗi validation | Integration |
| TS-056-05 | AC-056-06 | Negative: longitude=200 → lỗi "Kinh độ phải từ -180 đến 180" | Unit |
| TS-056-06 | AC-056-06 | Negative: latitude=100 → lỗi "Vĩ độ phải từ -90 đến 90" | Unit |
| TS-056-07 | AC-056-08 | Happy path: Lưu tạm → PROPOSED, ghi nhật ký | Integration |
| TS-056-08 | AC-056-09 | Happy path: Lưu và gửi phê duyệt → PROPOSED + cờ gửi duyệt | Integration |
| TS-056-09 | AC-056-10 | Happy path: Admin Lưu và phê duyệt → APPROVED | Integration |
| TS-056-10 | AC-056-10 | Negative: Chuyên viên nhấn Lưu và phê duyệt → nút bị ẩn/API 403 | Security |
| TS-056-11 | AC-056-03 | Edge: Client gửi approvalStatus=APPROVED → server gán PROPOSED | Unit |
| TS-056-12 | BR-056-06 | Edge: Đổi orgUnitId → vtsSystemId và ttdhVtsId bị clear | Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - new aggregate | Tạo mới entity RadarStation với FK đến VtsSystem; entity phụ trợ RadarStationAttachment và ApprovalHistory |
| Architecture affected? | No | CRUD tạo mới theo pattern hiện có (POST với action parameter); ghi nhật ký trong transaction là pattern đã thiết lập |
| Implementation clear? | Yes | Pattern POST API với 3 action modes đã có tiền lệ; cascade clear logic rõ ràng; validation chain đã xác định |
| **Verdict** | `Ready for Technical Lead planning` | Tạo mới aggregate root RadarStation với 5 nhóm dữ liệu; không có quyết định kiến trúc mới; implementation approach rõ ràng |
