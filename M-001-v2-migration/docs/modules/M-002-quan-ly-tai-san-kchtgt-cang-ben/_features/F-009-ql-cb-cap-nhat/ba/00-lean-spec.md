---
feature-id: F-009
document: lean-spec
output-mode: lean
last-updated: 2026-06-27
---
# Quản lý Cảng biển - Cập nhật

## Summary

Hệ thống cần cho phép người dùng có thẩm quyền cập nhật thông tin của Cảng biển đã tồn tại nhằm đảm bảo cơ sở dữ liệu luôn phản ánh đúng tình trạng thực tế của hạ tầng cảng. Giải pháp cung cấp biểu mẫu cập nhật có validation chặt chẽ, khóa mã cảng, cảnh báo khi cảng đang trong trạng thái đặc biệt, và ghi nhật ký thay đổi tự động sau mỗi lần lưu thành công. Thành công được đo bằng độ chính xác của dữ liệu cảng trong CSDL và tính đầy đủ của nhật ký thay đổi phục vụ kiểm toán.

## Scope

| | Items |
|---|---|
| In scope | Giao diện tra cứu và chọn Cảng biển cần cập nhật; Biểu mẫu cập nhật với dữ liệu hiện tại được điền sẵn; Validation các trường có thể thay đổi; Kiểm tra xung đột dữ liệu trước khi lưu; Ghi nhật ký thay đổi tự động (LichSuThayDoi); Thông báo kết quả cập nhật cho người dùng; Cảnh báo khi cảng đang trong trạng thái cho_phe_duyet hoặc da_xoa |
| Out of scope | Thay đổi mã cảng sau khi tạo (không cho phép); Quy trình phê duyệt thay đổi lớn (F-011); Xóa Cảng biển (F-010); Xem lịch sử tất cả phiên bản (F-013); Xuất báo cáo lịch sử cập nhật |
| Assumptions | Người dùng đã đăng nhập và có vai trò Admin hoặc Quản lý cảng; Cảng biển đã tồn tại trong hệ thống (được tạo qua F-008); Mã cảng là khóa bất biến sau khi tạo |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Quản trị viên / Quản lý cảng | Truy cập biểu mẫu cập nhật Cảng biển từ danh sách hoặc trang chi tiết | Không cần điều hướng phức tạp, tiết kiệm thời gian tác nghiệp | Must Have |
| US-002 | Quản trị viên / Quản lý cảng | Chỉnh sửa thông tin cảng (tên, tọa độ, diện tích, khả năng tiếp nhận tàu, ghi chú) với dữ liệu cũ được điền sẵn | Giảm lỗi nhập liệu, đảm bảo thay đổi có chủ ý | Must Have |
| US-003 | Quản trị viên / Quản lý cảng | Nhận cảnh báo khi cảng đang trong trạng thái cho_phe_duyet hoặc da_xoa trước khi thực hiện cập nhật | Tránh tạo xung đột với quy trình phê duyệt đang chạy | Must Have |
| US-004 | Hệ thống (tự động) | Ghi nhật ký thay đổi đầy đủ sau mỗi lần cập nhật thành công | Đảm bảo truy vết kiểm toán, không cho phép giả mạo lịch sử | Must Have |
| US-005 | Quản trị viên / Quản lý cảng | Nhận thông báo lỗi rõ ràng khi nhập liệu vi phạm validation rules | Người dùng tự sửa lỗi mà không cần hỗ trợ kỹ thuật | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001 | Truy cập cập nhật từ danh sách | Given người dùng có role Admin hoặc Quan_ly_cang đang ở trang danh sách Cảng biển; When nhấn nút "Cập nhật" trên một hàng; Then hệ thống điều hướng đến biểu mẫu cập nhật với đầy đủ thông tin hiện tại được điền sẵn | Chỉ Admin và Quan_ly_cang thấy nút cập nhật |
| AC-002 | US-001 | Truy cập cập nhật từ trang chi tiết | Given người dùng có quyền đang ở trang chi tiết Cảng biển; When nhấn nút "Chỉnh sửa"; Then biểu mẫu cập nhật hiển thị với dữ liệu hiện tại | Người dùng không có quyền không thấy nút chỉnh sửa |
| AC-003 | US-001 | Từ chối truy cập với role không đủ quyền | Given người dùng có role Nhan_vien_van_hanh hoặc khách; When cố truy cập URL cập nhật trực tiếp; Then hệ thống trả về HTTP 403 và không hiển thị biểu mẫu | Kiểm tra phân quyền server-side, không chỉ UI |
| AC-004 | US-002 | Mã cảng không thể thay đổi | Given biểu mẫu cập nhật đang hiển thị; When người dùng cố gắng sửa trường mã cảng; Then trường mã cảng ở trạng thái read-only, không nhận input | Áp dụng cả ở frontend lẫn backend validation |
| AC-005 | US-002 | Cập nhật hợp lệ lưu thành công | Given người dùng nhập tenCang mới hợp lệ và tọa độ GPS hợp lệ; When nhấn "Lưu"; Then hệ thống lưu dữ liệu, cập nhật updatedAt, hiển thị thông báo thành công | updatedAt được hệ thống tự gán, không phải người dùng |
| AC-006 | US-002 | Validation tọa độ GPS | Given người dùng nhập vĩ độ ngoài khoảng [-90, 90] hoặc kinh độ ngoài [-180, 180]; When nhấn "Lưu"; Then hệ thống hiển thị lỗi validation tương ứng, không lưu dữ liệu | |
| AC-007 | US-002 | Validation diện tích | Given người dùng nhập diện tích ≤ 0 hoặc > 5000 km²; When nhấn "Lưu"; Then hệ thống hiển thị lỗi "Diện tích phải là số dương không vượt quá 5000 km²", không lưu | |
| AC-008 | US-003 | Cảnh báo khi cảng đang chờ phê duyệt | Given Cảng biển có trangThai = cho_phe_duyet; When người dùng mở biểu mẫu cập nhật; Then hệ thống hiển thị cảnh báo "Cảng biển đang trong quá trình phê duyệt" nhưng vẫn cho phép tiếp tục nếu người dùng xác nhận | Cảnh báo, không chặn hoàn toàn |
| AC-009 | US-003 | Chặn cập nhật Cảng biển đã xóa mềm | Given Cảng biển có trangThai = da_xoa; When người dùng cố truy cập biểu mẫu cập nhật; Then hệ thống hiển thị thông báo lỗi "Cảng biển đã bị xóa, không thể cập nhật" và không hiển thị biểu mẫu | |
| AC-010 | US-004 | Ghi nhật ký sau cập nhật thành công | Given người dùng vừa lưu thành công một thay đổi; When kiểm tra bảng LichSuThayDoi; Then tồn tại bản ghi chứa: cangBienId, truongDuocCapNhat, giaTriCu, giaTriMoi, nguoiCapNhat (user ID), thoiGianCapNhat | Mỗi trường thay đổi tạo một bản ghi riêng |
| AC-011 | US-004 | Nhật ký không thể xóa hoặc sửa | Given bản ghi nhật ký đã được ghi; When bất kỳ actor nào cố gắng DELETE hoặc UPDATE bản ghi trong LichSuThayDoi qua API; Then hệ thống từ chối với HTTP 405 hoặc 403 | Áp dụng cả với role Admin |
| AC-012 | US-005 | Thông báo lỗi rõ ràng khi validation thất bại | Given người dùng nhập dữ liệu không hợp lệ; When nhấn "Lưu"; Then hệ thống highlight trường lỗi và hiển thị thông điệp lỗi tiếng Việt cụ thể theo từng loại vi phạm | |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Mã cảng (maCang) là bất biến sau khi Cảng biển được tạo; không có API nào được phép cập nhật trường này; thay đổi mã cảng yêu cầu hủy bỏ và tạo mới | AC-004, AC-005 | Không có ngoại lệ |
| BR-002 | Tọa độ GPS: vĩ độ phải trong [-90, 90], kinh độ phải trong [-180, 180]; giá trị phải là số thực hợp lệ | AC-006 | Không áp dụng nếu tọa độ không được cung cấp (optional field) |
| BR-003 | Diện tích cảng phải là số dương (> 0), đơn vị km², không vượt quá 5000 km² | AC-007 | Không áp dụng nếu diện tích không được cung cấp (optional field) |
| BR-004 | Nhật ký thay đổi (LichSuThayDoi) được ghi tự động sau mỗi lần cập nhật thành công; một bản ghi per trường bị thay đổi; không cho phép xóa hoặc sửa nhật ký bởi bất kỳ actor nào | AC-010, AC-011 | Không có ngoại lệ |
| BR-005 | Cảng biển có trangThai = da_xoa không được phép cập nhật; Cảng biển có trangThai = cho_phe_duyet hiển thị cảnh báo nhưng không chặn | AC-008, AC-009 | Không có ngoại lệ với da_xoa |
| BR-006 | Chỉ người dùng có role Admin hoặc Quan_ly_cang mới được phép thực hiện cập nhật; kiểm tra phải được thực thi ở tầng API, không chỉ UI | AC-001, AC-002, AC-003 | Không có ngoại lệ |
| BR-007 | Trường updatedAt được hệ thống tự động cập nhật timestamp hiện tại sau mỗi lần lưu thành công; người dùng không thể tự đặt giá trị này | AC-005 | Không có ngoại lệ |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | API cập nhật (bao gồm validation + ghi nhật ký) phải hoàn thành trong thời gian chấp nhận được | ≤ 2 giây (p95) |
| Security | Phân quyền server-side bắt buộc; trường maCang được bảo vệ ở tầng API; nhật ký thay đổi không thể bị giả mạo | HTTP 403 khi không có quyền; audit log immutable |
| Reliability | Ghi nhật ký thay đổi và cập nhật bản ghi CangBien phải nằm trong một transaction; nếu một phần thất bại, toàn bộ rollback | 100% consistency giữa CangBien và LichSuThayDoi |
| Audit/Logging | Mỗi lần cập nhật thành công ghi đầy đủ: cangBienId, truong, giaTriCu, giaTriMoi, nguoiCapNhat, thoiGianCapNhat | 100% coverage cho mọi trường bị thay đổi |
| Operability | Thông báo lỗi validation rõ ràng bằng tiếng Việt, tương ứng từng trường; không để lộ stack trace cho người dùng | N/A |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | Happy path: Admin truy cập cập nhật từ danh sách, biểu mẫu load đúng dữ liệu hiện tại | Integration |
| TS-002 | AC-003 | Negative: Role Nhan_vien_van_hanh gọi PUT /api/cang-bien/{id} → HTTP 403 | Security / Integration |
| TS-003 | AC-004 | Negative: Gửi payload có trường maCang khác → backend bỏ qua / từ chối thay đổi | Unit / Integration |
| TS-004 | AC-005 | Happy path: Cập nhật tenCang và ghiChu hợp lệ → 200 OK, updatedAt được cập nhật | Integration |
| TS-005 | AC-006 | Negative: Tọa độ vĩ độ = 95 → lỗi validation rõ ràng, HTTP 400 | Unit |
| TS-006 | AC-007 | Negative: Diện tích = -10 và diện tích = 6000 → lỗi validation tương ứng | Unit |
| TS-007 | AC-008 | Edge: Cập nhật cảng trangThai = cho_phe_duyet → cảnh báo hiển thị, người dùng xác nhận → lưu thành công | Integration / UI |
| TS-008 | AC-009 | Negative: Cảng trangThai = da_xoa → HTTP 422 với thông báo lỗi phù hợp | Integration |
| TS-009 | AC-010 | Audit: Sau cập nhật thành công, LichSuThayDoi có đúng số bản ghi bằng số trường thay đổi | Integration |
| TS-010 | AC-011 | Security: Gọi DELETE /api/lich-su/{id} với role Admin → HTTP 403 hoặc 405 | Security |
| TS-011 | AC-010 | Transaction: Nếu ghi nhật ký thất bại → cập nhật CangBien rollback, không có dữ liệu không nhất quán | Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No - existing | Sử dụng entity CangBien và LichSuThayDoi đã được định nghĩa tại F-008; không tạo aggregate root, bounded context, hoặc domain event mới |
| Architecture affected? | No | CRUD cập nhật trên entity hiện có; cùng pattern với F-008 (tạo mới); ghi nhật ký trong transaction là pattern đã có |
| Implementation clear? | Yes | Pattern PUT API + transactional audit log là kiến trúc đã được thiết lập; không cần quyết định kiến trúc mới |
| **Verdict** | `Ready for Technical Lead planning` | Thay đổi chỉ mở rộng entity hiện có (F-008 đã định nghĩa CangBien + LichSuThayDoi), không có quyết định kiến trúc mới, implementation approach rõ ràng từ pattern F-008 |
