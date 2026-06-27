---
feature-id: F-021
document: lean-spec
output-mode: lean
last-updated: 2026-06-27
---
# Quản lý Cầu cảng - Cập nhật

## Summary

Hệ thống cần cho phép người dùng có thẩm quyền cập nhật thông tin kỹ thuật của Cầu cảng đã tồn tại nhằm đảm bảo cơ sở dữ liệu phản ánh đúng tình trạng thực tế sau bảo trì, cải tạo hoặc nâng cấp tải trọng. Giải pháp cung cấp biểu mẫu cập nhật có validation chặt chẽ, khóa mã cầu bất biến, cảnh báo khi Cầu cảng đang trong trạng thái đặc biệt (chờ phê duyệt/đã xóa), ràng buộc thay đổi Bến cảng mẹ khi có dữ liệu liên quan, và ghi nhật ký thay đổi tự động sau mỗi lần lưu thành công. Thành công được đo bằng độ chính xác của dữ liệu kỹ thuật Cầu cảng trong CSDL và tính đầy đủ của nhật ký kiểm toán.

## Scope

| | Items |
|---|---|
| In scope | Giao diện tra cứu và chọn Cầu cảng cần cập nhật; Biểu mẫu cập nhật với dữ liệu hiện tại được điền sẵn; Validation các trường kỹ thuật (tải trọng, kích thước, loại kết cấu, vật liệu); Kiểm tra ràng buộc Bến cảng mẹ trước khi lưu; Ghi nhật ký thay đổi tự động (LichSuThayDoi); Thông báo kết quả cập nhật cho người dùng; Cảnh báo khi Cầu cảng đang trong trạng thái cho_phe_duyet hoặc da_xoa |
| Out of scope | Thay đổi mã cầu sau khi tạo (không cho phép); Quy trình phê duyệt thay đổi lớn (F-023); Xóa Cầu cảng (F-022); Xem lịch sử tất cả phiên bản (F-025); Xuất báo cáo lịch sử cập nhật; Tính toán lại an toàn kết cấu sau cập nhật |
| Assumptions | Người dùng đã đăng nhập và có vai trò Admin hoặc Quản lý cảng; Cầu cảng đã tồn tại trong hệ thống (được tạo qua F-020); Mã cầu là khóa bất biến sau khi tạo; Bến cảng mẹ đã tồn tại trong hệ thống |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Quản trị viên / Quản lý cảng | Truy cập biểu mẫu cập nhật Cầu cảng từ danh sách hoặc trang chi tiết | Không cần điều hướng phức tạp, tiết kiệm thời gian tác nghiệp | Must Have |
| US-002 | Quản trị viên / Quản lý cảng | Chỉnh sửa thông tin kỹ thuật Cầu cảng (tên, kích thước, tải trọng, loại kết cấu, vật liệu, mực nước, ghi chú) với dữ liệu cũ được điền sẵn | Giảm lỗi nhập liệu, đảm bảo thay đổi có chủ ý và đúng ràng buộc kỹ thuật | Must Have |
| US-003 | Quản trị viên / Quản lý cảng | Thay đổi Bến cảng mẹ của Cầu cảng với kiểm tra ràng buộc dữ liệu liên quan | Đảm bảo tính toàn vẹn dữ liệu khi tái cấu trúc phân cấp cảng-bến-cầu | Must Have |
| US-004 | Quản trị viên / Quản lý cảng | Nhận cảnh báo khi Cầu cảng đang trong trạng thái cho_phe_duyet hoặc da_xoa trước khi thực hiện cập nhật | Tránh tạo xung đột với quy trình phê duyệt đang chạy | Must Have |
| US-005 | Hệ thống (tự động) | Ghi nhật ký thay đổi đầy đủ sau mỗi lần cập nhật thành công | Đảm bảo truy vết kiểm toán, không cho phép giả mạo lịch sử | Must Have |
| US-006 | Quản trị viên / Quản lý cảng | Nhận thông báo lỗi rõ ràng khi nhập liệu vi phạm validation rules | Người dùng tự sửa lỗi mà không cần hỗ trợ kỹ thuật | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001 | Truy cập cập nhật từ danh sách | Given người dùng có role Admin hoặc Quan_ly_cang đang ở trang danh sách Cầu cảng; When nhấn nút "Cập nhật" trên một hàng; Then hệ thống điều hướng đến biểu mẫu cập nhật với đầy đủ thông tin hiện tại được điền sẵn | Chỉ Admin và Quan_ly_cang thấy nút cập nhật |
| AC-002 | US-001 | Truy cập cập nhật từ trang chi tiết | Given người dùng có quyền đang ở trang chi tiết Cầu cảng; When nhấn nút "Chỉnh sửa"; Then biểu mẫu cập nhật hiển thị với dữ liệu hiện tại | Người dùng không có quyền không thấy nút chỉnh sửa |
| AC-003 | US-001 | Từ chối truy cập với role không đủ quyền | Given người dùng có role Nhan_vien_van_hanh hoặc khách; When cố truy cập URL cập nhật trực tiếp; Then hệ thống trả về HTTP 403 và không hiển thị biểu mẫu | Kiểm tra phân quyền server-side, không chỉ UI |
| AC-004 | US-002 | Mã cầu không thể thay đổi | Given biểu mẫu cập nhật đang hiển thị; When người dùng cố gắng sửa trường mã cầu; Then trường mã cầu ở trạng thái read-only, không nhận input | Áp dụng cả ở frontend lẫn backend validation |
| AC-005 | US-002 | Cập nhật thông tin kỹ thuật hợp lệ lưu thành công | Given người dùng nhập tenCau mới hợp lệ và taiTrongThietKe hợp lệ; When nhấn "Lưu"; Then hệ thống lưu dữ liệu, cập nhật updatedAt, hiển thị thông báo thành công | updatedAt được hệ thống tự gán, không phải người dùng |
| AC-006 | US-002 | Validation tải trọng thiết kế | Given người dùng nhập taiTrongThietKe ≤ 0 hoặc > 20 T/m²; When nhấn "Lưu"; Then hệ thống hiển thị lỗi "Tải trọng thiết kế phải là số dương không vượt quá 20 T/m²", không lưu dữ liệu | Đơn vị T/m² |
| AC-007 | US-002 | Validation kích thước cầu | Given người dùng nhập chieuDaiCau hoặc chieuRongCau ≤ 0 hoặc > 500m; When nhấn "Lưu"; Then hệ thống hiển thị lỗi tương ứng cho từng trường, không lưu dữ liệu | Áp dụng cho cả chiều dài và chiều rộng |
| AC-008 | US-003 | Cảnh báo khi thay đổi Bến cảng mẹ có dữ liệu liên quan | Given Cầu cảng đang có lượt tàu neo đậu hoặc lịch sử kiểm tra kết cấu liên kết; When người dùng thay đổi trường benCangMeId; Then hệ thống hiển thị cảnh báo "Cầu cảng đang có dữ liệu liên quan, thay đổi Bến cảng mẹ yêu cầu phê duyệt" và không cho phép lưu trực tiếp | Yêu cầu quy trình phê duyệt đặc biệt (F-023) |
| AC-009 | US-003 | Thay đổi Bến cảng mẹ khi chưa có dữ liệu liên quan | Given Cầu cảng chưa có dữ liệu liên quan (lượt tàu, kiểm tra kết cấu); When người dùng thay đổi benCangMeId sang Bến cảng tồn tại khác và nhấn "Lưu"; Then hệ thống lưu thành công, ghi nhật ký thay đổi benCangMeId | Bến cảng đích phải tồn tại trong hệ thống |
| AC-010 | US-004 | Cảnh báo khi Cầu cảng đang chờ phê duyệt | Given Cầu cảng có trangThai = cho_phe_duyet; When người dùng mở biểu mẫu cập nhật; Then hệ thống hiển thị cảnh báo "Cầu cảng đang trong quá trình phê duyệt" nhưng vẫn cho phép tiếp tục nếu người dùng xác nhận | Cảnh báo, không chặn hoàn toàn |
| AC-011 | US-004 | Chặn cập nhật Cầu cảng đã xóa mềm | Given Cầu cảng có trangThai = da_xoa; When người dùng cố truy cập biểu mẫu cập nhật; Then hệ thống hiển thị thông báo lỗi "Cầu cảng đã bị xóa, không thể cập nhật" và không hiển thị biểu mẫu | |
| AC-012 | US-005 | Ghi nhật ký sau cập nhật thành công | Given người dùng vừa lưu thành công một thay đổi; When kiểm tra bảng LichSuThayDoi; Then tồn tại bản ghi chứa: cauCangId, truongDuocCapNhat, giaTriCu, giaTriMoi, nguoiCapNhat (user ID), thoiGianCapNhat | Mỗi trường thay đổi tạo một bản ghi riêng |
| AC-013 | US-005 | Nhật ký không thể xóa hoặc sửa | Given bản ghi nhật ký đã được ghi; When bất kỳ actor nào cố gắng DELETE hoặc UPDATE bản ghi trong LichSuThayDoi qua API; Then hệ thống từ chối với HTTP 405 hoặc 403 | Áp dụng cả với role Admin |
| AC-014 | US-006 | Thông báo lỗi rõ ràng khi validation thất bại | Given người dùng nhập dữ liệu không hợp lệ; When nhấn "Lưu"; Then hệ thống highlight trường lỗi và hiển thị thông điệp lỗi tiếng Việt cụ thể theo từng loại vi phạm | |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Mã cầu (maCau) là bất biến sau khi Cầu cảng được tạo; không có API nào được phép cập nhật trường này; thay đổi mã cầu yêu cầu hủy bỏ và tạo mới | AC-004, AC-005 | Không có ngoại lệ |
| BR-002 | Tải trọng thiết kế phải là giá trị dương (> 0), đơn vị T/m², không vượt quá 20 T/m² | AC-006 | Không áp dụng nếu trường không được cung cấp (optional field) |
| BR-003 | Chiều dài và chiều rộng cầu phải là giá trị dương (> 0), đơn vị m, không vượt quá 500m | AC-007 | Không áp dụng nếu trường không được cung cấp (optional field) |
| BR-004 | Việc thay đổi Bến cảng mẹ chỉ được phép nếu Cầu cảng chưa có dữ liệu liên quan (lượt tàu neo đậu, lịch sử kiểm tra kết cấu); nếu có dữ liệu liên quan, yêu cầu quy trình phê duyệt đặc biệt (F-023) | AC-008, AC-009 | Không có ngoại lệ |
| BR-005 | Nhật ký thay đổi (LichSuThayDoi) được ghi tự động sau mỗi lần cập nhật thành công; một bản ghi per trường bị thay đổi; không cho phép xóa hoặc sửa nhật ký bởi bất kỳ actor nào | AC-012, AC-013 | Không có ngoại lệ |
| BR-006 | Cầu cảng có trangThai = da_xoa không được phép cập nhật; Cầu cảng có trangThai = cho_phe_duyet hiển thị cảnh báo nhưng không chặn cập nhật | AC-010, AC-011 | Không có ngoại lệ với da_xoa |
| BR-007 | Chỉ người dùng có role Admin hoặc Quan_ly_cang mới được phép thực hiện cập nhật; kiểm tra phải được thực thi ở tầng API, không chỉ UI | AC-001, AC-002, AC-003 | Không có ngoại lệ |
| BR-008 | Trường updatedAt được hệ thống tự động cập nhật timestamp hiện tại sau mỗi lần lưu thành công; người dùng không thể tự đặt giá trị này | AC-005 | Không có ngoại lệ |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | API cập nhật (bao gồm validation + kiểm tra ràng buộc Bến cảng mẹ + ghi nhật ký) phải hoàn thành trong thời gian chấp nhận được | ≤ 2 giây (p95) |
| Security | Phân quyền server-side bắt buộc; trường maCau được bảo vệ ở tầng API; nhật ký thay đổi không thể bị giả mạo hoặc xóa | HTTP 403 khi không có quyền; audit log immutable |
| Reliability | Ghi nhật ký thay đổi và cập nhật bản ghi CauCang phải nằm trong một transaction; nếu một phần thất bại, toàn bộ rollback | 100% consistency giữa CauCang và LichSuThayDoi |
| Audit/Logging | Mỗi lần cập nhật thành công ghi đầy đủ: cauCangId, truongDuocCapNhat, giaTriCu, giaTriMoi, nguoiCapNhat, thoiGianCapNhat | 100% coverage cho mọi trường bị thay đổi |
| Operability | Thông báo lỗi validation rõ ràng bằng tiếng Việt, tương ứng từng trường; không để lộ stack trace cho người dùng | N/A |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | Happy path: Admin truy cập cập nhật từ danh sách, biểu mẫu load đúng dữ liệu hiện tại của Cầu cảng | Integration |
| TS-002 | AC-003 | Negative: Role Nhan_vien_van_hanh gọi PUT /api/cau-cang/{id} → HTTP 403 | Security / Integration |
| TS-003 | AC-004 | Negative: Gửi payload có trường maCau khác → backend bỏ qua / từ chối thay đổi | Unit / Integration |
| TS-004 | AC-005 | Happy path: Cập nhật tenCau và loaiKetCau hợp lệ → 200 OK, updatedAt được cập nhật | Integration |
| TS-005 | AC-006 | Negative: taiTrongThietKe = -5 và taiTrongThietKe = 25 → lỗi validation tương ứng, HTTP 400 | Unit |
| TS-006 | AC-007 | Negative: chieuDaiCau = -10 và chieuDaiCau = 600 → lỗi validation tương ứng, HTTP 400 | Unit |
| TS-007 | AC-008 | Negative: Thay đổi benCangMeId khi Cầu cảng có lượt tàu neo đậu → HTTP 422 với cảnh báo ràng buộc | Integration |
| TS-008 | AC-009 | Happy path: Thay đổi benCangMeId khi Cầu cảng chưa có dữ liệu liên quan → lưu thành công, nhật ký ghi benCangMeId | Integration |
| TS-009 | AC-010 | Edge: Cập nhật Cầu cảng trangThai = cho_phe_duyet → cảnh báo hiển thị, người dùng xác nhận → lưu thành công | Integration / UI |
| TS-010 | AC-011 | Negative: Cầu cảng trangThai = da_xoa → HTTP 422 với thông báo lỗi phù hợp | Integration |
| TS-011 | AC-012 | Audit: Sau cập nhật thành công, LichSuThayDoi có đúng số bản ghi bằng số trường thay đổi | Integration |
| TS-012 | AC-013 | Security: Gọi DELETE /api/lich-su/{id} với role Admin → HTTP 403 hoặc 405 | Security |
| TS-013 | AC-012 | Transaction: Nếu ghi nhật ký thất bại → cập nhật CauCang rollback, không có dữ liệu không nhất quán | Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No - existing | Sử dụng entity CauCang và LichSuThayDoi đã được định nghĩa tại F-020; không tạo aggregate root, bounded context, hoặc domain event mới |
| Architecture affected? | No | CRUD cập nhật trên entity hiện có; cùng pattern với F-020 (tạo mới) và F-009 (cập nhật Cảng biển); ghi nhật ký trong transaction là pattern đã có |
| Implementation clear? | Yes | Pattern PUT API + transactional audit log + ràng buộc Bến cảng mẹ là kiến trúc đã được thiết lập; không cần quyết định kiến trúc mới |
| **Verdict** | `Ready for Technical Lead planning` | Thay đổi chỉ mở rộng entity hiện có (F-020 đã định nghĩa CauCang + LichSuThayDoi), không có quyết định kiến trúc mới, implementation approach rõ ràng từ pattern F-009/F-020 |
