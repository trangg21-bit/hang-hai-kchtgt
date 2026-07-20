---
feature-id: F-028
document: business-context
output-mode: lean
last-updated: 2026-06-27
---
# Quản lý Cảng cạn - Xóa

## Summary

Tính năng cho phép người dùng có thẩm quyền (Admin hoặc Chuyên viên có permission) xóa mềm một Cảng cạn khỏi hệ thống KCHTGT hàng hải sau khi xác nhận bằng tên Cảng cạn và kiểm tra ràng buộc dữ liệu liên quan. Cơ chế soft delete bảo tồn dữ liệu lịch sử, phục vụ kiểm toán và báo cáo thống kê, đồng thời cho phép khôi phục trong vòng 90 ngày. Thành công khi luồng xóa chạy đúng với kiểm tra quyền, kiểm tra ràng buộc, ghi nhật ký và cập nhật trạng thái hiển thị danh sách.

## Scope

| | Items |
|---|---|
| In scope | Giao diện xác nhận xóa (nhập tên Cảng cạn); kiểm tra ràng buộc dữ liệu liên quan (hoạt động logistics đang diễn ra); kiểm tra trạng thái phê duyệt; soft delete (đánh dấu daXoa, ghi ngayXoa/nguoiXoa); ghi nhật ký xóa (NhatKyXoa); ẩn khỏi danh sách mặc định; khôi phục trong 90 ngày |
| Out of scope | Hard delete khỏi DB; xóa hàng loạt; cascade delete dữ liệu liên quan; luồng phê duyệt xóa bởi cấp cao hơn (F-029); xuất báo cáo lịch sử xóa; khôi phục Cảng cạn (tính năng riêng) |
| Assumptions | "Hoạt động logistics đang diễn ra" là các bản ghi hoạt động logistics của Cảng cạn ở trạng thái active/đang xử lý; "Quản lý cảng" trong task_inputs ánh xạ với ROLE_SPECIALIST có permission CangCan:delete; thời hạn khôi phục mặc định 90 ngày theo quy định lưu trữ hồ sơ hạ tầng; xác nhận bằng tên Cảng cạn (ten) thay vì mã (ma) |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Quản trị viên (A-001) / Chuyên viên có quyền (A-003) | Xóa mềm một Cảng cạn đã chấm dứt hoạt động | Duy trì danh sách Cảng cạn chính xác, tránh nhầm lẫn trong vận hành | Must Have |
| US-002 | Quản trị viên / Chuyên viên có quyền | Được cảnh báo khi Cảng cạn còn hoạt động logistics đang diễn ra | Tránh xóa nhầm Cảng cạn còn đang khai thác hoặc có dữ liệu liên quan chưa xử lý | Must Have |
| US-003 | Quản trị viên | Khôi phục Cảng cạn đã xóa trong thời hạn 90 ngày | Sửa sai lầm khi xóa nhầm mà không mất dữ liệu | Must Have |
| US-004 | Hệ thống / Kiểm toán | Ghi nhật ký đầy đủ thao tác xóa vào bảng NhatKyXoa | Phục vụ kiểm toán, truy vết và báo cáo thống kê tài sản | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001 | Xóa thành công với quyền hợp lệ | Given: user có role Admin hoặc Chuyên viên với permission CangCan:delete, Cảng cạn không có hoạt động logistics đang diễn ra, không trong quá trình phê duyệt; When: user nhập đúng tên Cảng cạn vào hộp thoại xác nhận và nhấn xác nhận; Then: hệ thống đặt daXoa=true, ghi ngayXoa=now(), nguoiXoa=userId, Cảng cạn không hiển thị trong danh sách mặc định, hiển thị thông báo xóa thành công | Tên nhập phải khớp chính xác (case-insensitive) với trường ten của CangCan |
| AC-002 | US-001 | Từ chối xóa khi thiếu quyền | Given: user có role ROLE_LEADER hoặc ROLE_PORT_OPERATOR hoặc Public; When: user cố gắng truy cập chức năng xóa; Then: hệ thống trả về HTTP 403 / hiển thị thông báo không có quyền, không thực hiện bất kỳ thay đổi nào | RBAC kiểm tra tại API layer |
| AC-003 | US-002 | Chặn xóa khi còn hoạt động logistics đang diễn ra | Given: Cảng cạn có hoạt động logistics ở trạng thái đang xử lý hoặc active; When: user kích hoạt xóa; Then: hệ thống hiển thị cảnh báo liệt kê loại dữ liệu liên quan và số lượng, không thực hiện xóa | Kiểm tra trước khi hiển thị hộp thoại xác nhận |
| AC-004 | US-002 | Chặn xóa khi đang trong quá trình phê duyệt | Given: Cảng cạn có trangThai=cho_phe_duyet; When: user kích hoạt xóa; Then: hệ thống từ chối với thông báo Cảng cạn đang chờ phê duyệt, không hiển thị hộp thoại xác nhận | |
| AC-005 | US-001 | Từ chối khi nhập sai tên xác nhận | Given: hộp thoại xác nhận đang hiển thị; When: user nhập tên không khớp với trường ten của CangCan và nhấn xác nhận; Then: hệ thống hiển thị lỗi "Tên Cảng cạn không khớp", không thực hiện xóa, hộp thoại vẫn mở | Không đếm số lần thử sai |
| AC-006 | US-003 | Khôi phục trong 90 ngày | Given: Cảng cạn có daXoa=true và ngayXoa trong vòng 90 ngày; When: Admin thực hiện khôi phục; Then: daXoa đặt lại false, ngayXoa và nguoiXoa được xóa, Cảng cạn hiển thị lại trong danh sách mặc định | Chỉ Admin có quyền khôi phục |
| AC-007 | US-003 | Từ chối khôi phục sau 90 ngày | Given: Cảng cạn đã xóa quá 90 ngày; When: Admin cố khôi phục; Then: hệ thống thông báo hết thời hạn khôi phục, hướng dẫn liên hệ lưu trữ theo quy định | |
| AC-008 | US-004 | Ghi nhật ký đầy đủ vào NhatKyXoa | Given: bất kỳ thao tác xóa nào (thành công hoặc bị chặn); When: sự kiện xảy ra; Then: hệ thống ghi vào bảng NhatKyXoa với: userId (nguoiXoa), timestamp (ngayXoa, UTC+7), action (DELETE_ATTEMPT / DELETE_SUCCESS / DELETE_BLOCKED), cangCanId, cangCanMa, cangCanTen, lyDo (nếu bị chặn) | Log không được xóa theo vòng đời tài sản |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Soft delete bắt buộc — chỉ đặt daXoa=true, ghi ngayXoa và nguoiXoa; không được xóa bản ghi CangCan khỏi DB | US-001, AC-001 | Không có ngoại lệ |
| BR-002 | Kiểm tra ràng buộc trước xóa — Cảng cạn không được có hoạt động logistics ở trạng thái đang xử lý hoặc active | US-002, AC-003 | Nếu tất cả hoạt động liên quan đã kết thúc/đóng thì không chặn |
| BR-003 | Kiểm tra trạng thái phê duyệt — Cảng cạn có trangThai=cho_phe_duyet không được phép xóa | US-002, AC-004 | |
| BR-004 | Xác nhận bằng tên Cảng cạn — người dùng phải nhập chính xác trường ten (khớp không phân biệt hoa/thường) để xác nhận xóa | US-001, AC-001, AC-005 | |
| BR-005 | Thời hạn khôi phục 90 ngày — Cảng cạn đã xóa có thể khôi phục trong 90 ngày kể từ ngayXoa; sau đó chỉ xử lý theo quy định lưu trữ hồ sơ | US-003, AC-006, AC-007 | |
| BR-006 | Nhật ký xóa bắt buộc — ghi đầy đủ vào NhatKyXoa: nguoiXoa, ngayXoa, loại hành động, cangCanId, cangCanMa, cangCanTen, và lyDo nếu bị từ chối | US-004, AC-008 | |
| BR-007 | Phân quyền xóa — chỉ ROLE_ADMIN (A-001) và ROLE_SPECIALIST (A-003) với permission CangCan:delete mới thực hiện được xóa; ROLE_LEADER, ROLE_PORT_OPERATOR, Public bị từ chối | US-001, AC-002 | Admin có thể override per-user permission theo mô hình RBAC + per-user override |
| BR-008 | Ẩn khỏi danh sách mặc định — sau khi xóa, CangCan với daXoa=true không được trả về trong query mặc định danh sách; chỉ hiển thị khi có filter tường minh | AC-001, AC-006 | |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | API xóa phải hoàn thành trong giới hạn thời gian chấp nhận được | <= 2 giây cho kiểm tra ràng buộc + soft delete trên tập dữ liệu thông thường |
| Security | Kiểm tra quyền tại API layer (Spring Security @PreAuthorize); không thực hiện xóa dựa vào kiểm tra phía client | RBAC: CangCan:delete permission bắt buộc; ghi log mọi attempt kể cả unauthorized |
| Reliability | Giao dịch xóa phải atomic — soft delete CangCan + ghi NhatKyXoa trong cùng transaction; nếu ghi log thất bại thì rollback xóa | Tỷ lệ thành công >= 99.9% trên môi trường production |
| Audit/Logging | Mọi thao tác xóa (thành công, bị chặn, từ chối quyền) phải được ghi vào bảng NhatKyXoa với đầy đủ trường theo BR-006 | Log không được phép bị xóa theo lifecycle tài sản; lưu trữ theo quy định hồ sơ KCHTGT |
| Operability | Danh sách Cảng cạn đã xóa phải có thể tra cứu bởi Admin (filter daXoa=true); API khôi phục phải tồn tại cho Admin | Giao diện quản trị hiển thị danh sách đã xóa với cột ngayXoa, nguoiXoa |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | Xóa thành công Cảng cạn không có ràng buộc, nhập đúng tên, user Admin | Happy path - Integration |
| TS-002 | AC-002 | User ROLE_LEADER gọi API xóa — nhận HTTP 403 | Security - Unit |
| TS-003 | AC-002 | User ROLE_PORT_OPERATOR gọi API xóa — nhận HTTP 403 | Security - Unit |
| TS-004 | AC-003 | Xóa Cảng cạn có hoạt động logistics đang xử lý — bị chặn, hiển thị cảnh báo | Negative - Integration |
| TS-005 | AC-003 | Xóa Cảng cạn có tất cả hoạt động logistics đã kết thúc — được phép | Edge case - Integration |
| TS-006 | AC-004 | Xóa Cảng cạn trangThai=cho_phe_duyet — bị chặn | Negative - Unit |
| TS-007 | AC-005 | Nhập tên xác nhận sai — hộp thoại báo lỗi, không xóa | Negative - UI |
| TS-008 | AC-005 | Nhập tên xác nhận đúng (khác hoa/thường) — được chấp nhận | Edge case - UI |
| TS-009 | AC-006 | Admin khôi phục Cảng cạn đã xóa trong 90 ngày — thành công | Happy path - Integration |
| TS-010 | AC-007 | Admin khôi phục Cảng cạn đã xóa > 90 ngày — bị từ chối | Negative - Integration |
| TS-011 | AC-008 | Verify NhatKyXoa ghi đúng nguoiXoa, ngayXoa, cangCanId sau xóa thành công | Audit - Integration |
| TS-012 | AC-008 | Verify NhatKyXoa ghi DELETE_BLOCKED khi xóa bị chặn do ràng buộc logistics | Audit - Integration |
| TS-013 | AC-001 | Kiểm tra transaction rollback khi ghi NhatKyXoa thất bại — daXoa không đổi | Reliability - Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? (new aggregates/events/contexts?) | No | Không tạo aggregate root mới; CangCan đã tồn tại trong domain. Thêm trường daXoa, ngayXoa, nguoiXoa là mở rộng entity hiện có, không tạo bounded context mới. NhatKyXoa là entity log phụ trợ không tạo context mới |
| Architecture affected? (new service boundaries/integrations/data model?) | Yes | Thêm cột daXoa, ngayXoa, nguoiXoa vào bảng CangCan; tạo bảng NhatKyXoa; thêm soft-delete filter mặc định trên query; thêm permission CangCan:delete vào RBAC; cần thiết kế API endpoint xóa + khôi phục và logic transaction |
| Implementation clear from existing architecture? | No | Cần SA quyết định: cách implement soft-delete filter (Hibernate filter vs query interceptor), cách tích hợp log transaction với NhatKyXoa, API contract cho khôi phục, cách kiểm tra ràng buộc hoạt động logistics |
| **Verdict** | `Ready for solution architecture` | Thay đổi data model và API design cần SA xem xét; pattern tương đồng F-010 (CangBien) nhưng cần xác nhận áp dụng đồng nhất cho CangCan |
