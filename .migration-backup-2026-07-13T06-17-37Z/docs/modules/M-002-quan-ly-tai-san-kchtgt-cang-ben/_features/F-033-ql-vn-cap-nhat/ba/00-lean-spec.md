---
feature-id: F-033
document: lean-spec
output-mode: lean
last-updated: 2026-06-27
---
# Quản lý Vùng nước - Cập nhật

## Summary

Hệ thống cần cho phép người dùng có thẩm quyền (Admin hoặc Quản lý cảng) cập nhật thông tin của Vùng nước đã tồn tại, bao gồm tên, Cảng biển quản lý, diện tích, độ sâu, mục đích sử dụng và các trường kỹ thuật liên quan, với mã vùng nước là trường bất biến sau khi tạo. Giải pháp cung cấp biểu mẫu cập nhật với validation đầy đủ, cảnh báo khi Vùng nước đang ở trạng thái đặc biệt (chờ phê duyệt/đã xóa mềm), kích hoạt phê duyệt lại khi thay đổi trường quan trọng, và ghi nhật ký thay đổi tự động (LichSuVungNuoc) sau mỗi lần lưu thành công. Thành công được đo bằng độ chính xác dữ liệu Vùng nước trong CSDL và tính đầy đủ, bất biến của nhật ký kiểm toán.

## Scope

| | Items |
|---|---|
| In scope | Giao diện tra cứu và chọn Vùng nước cần cập nhật; Biểu mẫu cập nhật với dữ liệu hiện tại được điền sẵn; Validation các trường kỹ thuật (diện tích, độ sâu, tọa độ, loại vùng nước); Trường mã vùng nước ở trạng thái read-only (bất biến); Cảnh báo khi Vùng nước đang ở trạng thái cho_phe_duyet; Chặn cập nhật khi trangThai = da_xoa; Kích hoạt phê duyệt lại khi thay đổi trường quan trọng (độ sâu, khả năng thông hành); Ghi nhật ký thay đổi tự động (LichSuVungNuoc); Thông báo kết quả cập nhật |
| Out of scope | Thay đổi mã vùng nước sau khi tạo (không cho phép); Tạo mới Vùng nước (F-032); Xóa Vùng nước (F-034); Quy trình phê duyệt hai cấp (F-035); Xem chi tiết Vùng nước (F-036); Xem lịch sử thay đổi (F-037); Xuất báo cáo lịch sử cập nhật; Tính toán lại an toàn hải văn sau cập nhật |
| Assumptions | Người dùng đã đăng nhập và có vai trò Admin hoặc Quan_ly_cang; Vùng nước đã tồn tại trong hệ thống (được tạo qua F-032); Mã vùng nước là khóa bất biến sau khi tạo; Cảng biển mẹ đã tồn tại trong hệ thống |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Quản trị viên / Quản lý cảng | Truy cập biểu mẫu cập nhật Vùng nước từ danh sách hoặc trang chi tiết | Không cần điều hướng phức tạp, tiết kiệm thời gian tác nghiệp | Must Have |
| US-002 | Quản trị viên / Quản lý cảng | Chỉnh sửa thông tin Vùng nước (tên, Cảng biển quản lý, diện tích, độ sâu, tọa độ, điều kiện hải văn, khả năng thông hành, loại vùng nước, mục đích sử dụng, ghi chú) với dữ liệu cũ được điền sẵn | Giảm lỗi nhập liệu, đảm bảo thay đổi có chủ ý và đúng ràng buộc kỹ thuật | Must Have |
| US-003 | Quản trị viên / Quản lý cảng | Nhận cảnh báo khi Vùng nước đang trong trạng thái cho_phe_duyet hoặc da_xoa trước khi thực hiện cập nhật | Tránh tạo xung đột với quy trình phê duyệt đang chạy | Must Have |
| US-004 | Quản trị viên / Quản lý cảng | Khi thay đổi trường quan trọng (độ sâu, khả năng thông hành), hệ thống tự động kích hoạt yêu cầu phê duyệt lại | Đảm bảo thay đổi ảnh hưởng an toàn hàng hải được kiểm soát đúng quy trình | Must Have |
| US-005 | Hệ thống (tự động) | Ghi nhật ký thay đổi đầy đủ (LichSuVungNuoc) sau mỗi lần cập nhật thành công | Đảm bảo truy vết kiểm toán, không cho phép giả mạo lịch sử | Must Have |
| US-006 | Quản trị viên / Quản lý cảng | Nhận thông báo lỗi rõ ràng khi nhập liệu vi phạm validation rules | Người dùng tự sửa lỗi mà không cần hỗ trợ kỹ thuật | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001 | Truy cập cập nhật từ danh sách | Given người dùng có role Admin hoặc Quan_ly_cang đang ở trang danh sách Vùng nước; When nhấn nút "Cập nhật" trên một hàng; Then hệ thống điều hướng đến biểu mẫu cập nhật với đầy đủ thông tin hiện tại được điền sẵn | Chỉ Admin và Quan_ly_cang thấy nút cập nhật |
| AC-002 | US-001 | Truy cập cập nhật từ trang chi tiết | Given người dùng có quyền đang ở trang chi tiết Vùng nước; When nhấn nút "Chỉnh sửa"; Then biểu mẫu cập nhật hiển thị với dữ liệu hiện tại | Người dùng không có quyền không thấy nút chỉnh sửa |
| AC-003 | US-001 | Từ chối truy cập với role không đủ quyền | Given người dùng có role Chuyen_vien hoặc khách; When cố truy cập URL cập nhật trực tiếp; Then hệ thống trả về HTTP 403 và không hiển thị biểu mẫu | Kiểm tra phân quyền server-side, không chỉ UI |
| AC-004 | US-002 | Mã vùng nước không thể thay đổi | Given biểu mẫu cập nhật đang hiển thị; When người dùng cố gắng sửa trường mã vùng nước; Then trường mã vùng nước ở trạng thái read-only, không nhận input | Áp dụng cả ở frontend lẫn backend validation |
| AC-005 | US-002 | Cập nhật thông tin hợp lệ lưu thành công | Given người dùng nhập ten hợp lệ và Cảng biển quản lý hợp lệ; When nhấn "Lưu"; Then hệ thống lưu dữ liệu, cập nhật updatedAt, hiển thị thông báo thành công | updatedAt được hệ thống tự gán, không phải người dùng |
| AC-006 | US-002 | Validation diện tích | Given người dùng nhập dienTich ≤ 0; When nhấn "Lưu"; Then hệ thống hiển thị lỗi "Diện tích phải là số dương", không lưu dữ liệu | Đơn vị m² hoặc km² theo cấu hình |
| AC-007 | US-002 | Validation độ sâu | Given người dùng nhập doSau ≤ 0 hoặc > 200m; When nhấn "Lưu"; Then hệ thống hiển thị lỗi tương ứng, không lưu dữ liệu | Đơn vị m |
| AC-008 | US-003 | Cảnh báo khi Vùng nước đang chờ phê duyệt | Given Vùng nước có trangThai = cho_phe_duyet; When người dùng mở biểu mẫu cập nhật; Then hệ thống hiển thị cảnh báo "Vùng nước đang trong quá trình phê duyệt" nhưng vẫn cho phép tiếp tục nếu người dùng xác nhận | Cảnh báo, không chặn hoàn toàn |
| AC-009 | US-003 | Chặn cập nhật Vùng nước đã xóa mềm | Given Vùng nước có trangThai = da_xoa; When người dùng cố truy cập biểu mẫu cập nhật; Then hệ thống hiển thị thông báo lỗi "Vùng nước đã bị xóa, không thể cập nhật" và không hiển thị biểu mẫu | |
| AC-010 | US-004 | Kích hoạt phê duyệt lại khi thay đổi trường quan trọng | Given người dùng thay đổi doSau hoặc khaNangThongHanh; When nhấn "Lưu"; Then hệ thống lưu thay đổi và tự động tạo yêu cầu phê duyệt lại theo quy trình F-035, cập nhật trangThai thành cho_phe_duyet_lai | Thay đổi được lưu nhưng cần phê duyệt lại |
| AC-011 | US-004 | Không kích hoạt phê duyệt lại khi thay đổi trường không quan trọng | Given người dùng chỉ thay đổi ghiChu hoặc ten; When nhấn "Lưu"; Then hệ thống lưu thành công mà không kích hoạt yêu cầu phê duyệt lại | |
| AC-012 | US-005 | Ghi nhật ký sau cập nhật thành công | Given người dùng vừa lưu thành công một thay đổi; When kiểm tra bảng LichSuVungNuoc; Then tồn tại bản ghi chứa: vungNuocId, truongDuocCapNhat, giaTriCu, giaTriMoi, nguoiCapNhat (user ID), thoiGianCapNhat | Mỗi trường thay đổi tạo một bản ghi riêng |
| AC-013 | US-005 | Nhật ký không thể xóa hoặc sửa | Given bản ghi nhật ký đã được ghi; When bất kỳ actor nào cố gắng DELETE hoặc UPDATE bản ghi trong LichSuVungNuoc qua API; Then hệ thống từ chối với HTTP 405 hoặc 403 | Áp dụng cả với role Admin |
| AC-014 | US-006 | Thông báo lỗi rõ ràng khi validation thất bại | Given người dùng nhập dữ liệu không hợp lệ; When nhấn "Lưu"; Then hệ thống highlight trường lỗi và hiển thị thông điệp lỗi tiếng Việt cụ thể theo từng loại vi phạm | |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Mã vùng nước (ma) là bất biến sau khi Vùng nước được tạo; không có API nào được phép cập nhật trường này; thay đổi mã yêu cầu hủy bỏ và tạo mới | AC-004, AC-005 | Không có ngoại lệ |
| BR-002 | Diện tích (dienTich) phải là giá trị dương (> 0); đơn vị m² hoặc km² | AC-006 | Không áp dụng nếu trường không được cung cấp (optional) |
| BR-003 | Độ sâu (doSau) phải là giá trị dương (> 0) và không vượt quá 200m | AC-007 | Không áp dụng nếu trường không được cung cấp (optional) |
| BR-004 | Thay đổi trường doSau hoặc khaNangThongHanh kích hoạt yêu cầu phê duyệt lại theo quy trình F-035; trạng thái Vùng nước cập nhật thành cho_phe_duyet_lai | AC-010, AC-011 | Không có ngoại lệ |
| BR-005 | Nhật ký thay đổi (LichSuVungNuoc) được ghi tự động sau mỗi lần cập nhật thành công; một bản ghi per trường bị thay đổi; không cho phép xóa hoặc sửa nhật ký bởi bất kỳ actor nào | AC-012, AC-013 | Không có ngoại lệ |
| BR-006 | Vùng nước có trangThai = da_xoa không được phép cập nhật; Vùng nước có trangThai = cho_phe_duyet hiển thị cảnh báo nhưng không chặn cập nhật (sau xác nhận của người dùng) | AC-008, AC-009 | Không có ngoại lệ với da_xoa |
| BR-007 | Chỉ người dùng có role Admin hoặc Quan_ly_cang mới được phép thực hiện cập nhật; kiểm tra phải được thực thi ở tầng API, không chỉ UI | AC-001, AC-002, AC-003 | Không có ngoại lệ |
| BR-008 | Trường updatedAt được hệ thống tự động cập nhật timestamp hiện tại sau mỗi lần lưu thành công; người dùng không thể tự đặt giá trị này | AC-005 | Không có ngoại lệ |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | API cập nhật (bao gồm validation + kiểm tra trạng thái + ghi nhật ký + kích hoạt phê duyệt nếu có) phải hoàn thành trong thời gian chấp nhận được | ≤ 2 giây (p95) |
| Security | Phân quyền server-side bắt buộc; trường ma được bảo vệ ở tầng API; nhật ký thay đổi không thể bị giả mạo hoặc xóa | HTTP 403 khi không có quyền; audit log immutable |
| Reliability | Ghi nhật ký thay đổi và cập nhật bản ghi VungNuoc phải nằm trong một transaction; nếu một phần thất bại, toàn bộ rollback | 100% consistency giữa VungNuoc và LichSuVungNuoc |
| Audit/Logging | Mỗi lần cập nhật thành công ghi đầy đủ: vungNuocId, truongDuocCapNhat, giaTriCu, giaTriMoi, nguoiCapNhat, thoiGianCapNhat | 100% coverage cho mọi trường bị thay đổi |
| Operability | Thông báo lỗi validation rõ ràng bằng tiếng Việt, tương ứng từng trường; không để lộ stack trace cho người dùng | N/A |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | Happy path: Admin truy cập cập nhật từ danh sách, biểu mẫu load đúng dữ liệu hiện tại của Vùng nước | Integration |
| TS-002 | AC-003 | Negative: Role Chuyen_vien gọi PUT /api/vung-nuoc/{id} → HTTP 403 | Security / Integration |
| TS-003 | AC-004 | Negative: Gửi payload có trường ma khác → backend bỏ qua / từ chối thay đổi | Unit / Integration |
| TS-004 | AC-005 | Happy path: Cập nhật ten và loaiVungNuoc hợp lệ → 200 OK, updatedAt được cập nhật, không kích hoạt phê duyệt lại | Integration |
| TS-005 | AC-006 | Negative: dienTich = -100 → lỗi validation, HTTP 400 | Unit |
| TS-006 | AC-007 | Negative: doSau = -5 và doSau = 250 → lỗi validation tương ứng, HTTP 400 | Unit |
| TS-007 | AC-008 | Edge: Vùng nước trangThai = cho_phe_duyet → cảnh báo hiển thị, người dùng xác nhận → lưu thành công | Integration / UI |
| TS-008 | AC-009 | Negative: Vùng nước trangThai = da_xoa → HTTP 422 với thông báo lỗi phù hợp | Integration |
| TS-009 | AC-010 | Trigger phê duyệt lại: Thay đổi doSau → 200 OK, trangThai = cho_phe_duyet_lai, yêu cầu phê duyệt F-035 được tạo | Integration |
| TS-010 | AC-011 | Happy path: Chỉ thay đổi ghiChu → lưu thành công, trangThai không đổi, không có yêu cầu phê duyệt lại | Integration |
| TS-011 | AC-012 | Audit: Sau cập nhật thành công, LichSuVungNuoc có đúng số bản ghi bằng số trường thay đổi | Integration |
| TS-012 | AC-013 | Security: Gọi DELETE /api/lich-su-vung-nuoc/{id} với role Admin → HTTP 403 hoặc 405 | Security |
| TS-013 | AC-012 | Transaction: Nếu ghi nhật ký thất bại → cập nhật VungNuoc rollback, không có dữ liệu không nhất quán | Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No - existing | Sử dụng entity VungNuoc và LichSuVungNuoc đã được định nghĩa tại F-032; không tạo aggregate root, bounded context, hoặc domain event mới |
| Architecture affected? | No | CRUD cập nhật trên entity hiện có; cùng pattern với F-032 (tạo mới) và F-021 (cập nhật Cầu cảng); ghi nhật ký trong transaction và kích hoạt phê duyệt lại là pattern đã có |
| Implementation clear? | Yes | Pattern PUT API + transactional audit log + cảnh báo trạng thái + kích hoạt phê duyệt lại là kiến trúc đã được thiết lập tại các feature tương tự trong M-002; không cần quyết định kiến trúc mới |
| **Verdict** | `Ready for Technical Lead planning` | Thay đổi chỉ mở rộng entity hiện có (F-032 đã định nghĩa VungNuoc + LichSuVungNuoc), không có quyết định kiến trúc mới, implementation approach rõ ràng từ pattern F-021/F-032 |
