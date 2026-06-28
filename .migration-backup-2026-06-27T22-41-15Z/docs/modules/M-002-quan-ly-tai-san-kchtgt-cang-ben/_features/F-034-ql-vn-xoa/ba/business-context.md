---
feature-id: F-034
document: business-context
output-mode: lean
last-updated: 2026-06-27
---
# Quản lý Vùng nước - Xóa

## Summary

Tính năng cho phép người dùng có thẩm quyền (ROLE_ADMIN hoặc ROLE_SPECIALIST với permission VungNuoc:delete) xóa mềm một Vùng nước khỏi hệ thống KCHTGT hàng hải sau khi xác nhận bằng tên Vùng nước và kiểm tra ràng buộc dữ liệu liên quan. Cơ chế soft delete bảo tồn dữ liệu lịch sử, phục vụ kiểm toán và báo cáo thống kê, đồng thời cho phép khôi phục trong vòng 90 ngày. Thành công khi luồng xóa chạy đúng với kiểm tra quyền, kiểm tra ràng buộc, ghi nhật ký và cập nhật trạng thái hiển thị danh sách.

## Scope

| | Items |
|---|---|
| In scope | Giao diện xác nhận xóa (nhập tên Vùng nước); kiểm tra ràng buộc dữ liệu liên quan (hoạt động khai thác đang diễn ra); kiểm tra trạng thái phê duyệt; soft delete (đánh dấu daXoa, ghi ngayXoa/nguoiXoa); ghi nhật ký xóa (NhatKyXoa); ẩn khỏi danh sách mặc định; khôi phục trong 90 ngày |
| Out of scope | Hard delete khỏi DB; xóa hàng loạt; cascade delete dữ liệu liên quan; luồng phê duyệt xóa bởi cấp cao hơn; xuất báo cáo lịch sử xóa; khôi phục Vùng nước (tính năng riêng) |
| Assumptions | "Hoạt động khai thác đang diễn ra" là các bản ghi hoạt động khai thác của Vùng nước ở trạng thái active/đang xử lý; "Quản lý cảng" trong task_inputs ánh xạ với ROLE_SPECIALIST có permission VungNuoc:delete; thời hạn khôi phục mặc định 90 ngày theo quy định lưu trữ hồ sơ hạ tầng; xác nhận bằng tên Vùng nước (ten) thay vì mã (ma); chỉ Vùng nước đã phê duyệt (trangThai=da_phe_duyet) mới có thể xóa |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Quản trị viên (A-001) / Chuyên viên có quyền (A-003) | Xóa mềm một Vùng nước đã không còn sử dụng hoặc đã được điều chỉnh phân vùng | Duy trì danh sách Vùng nước chính xác, phản ánh đúng thực tế quản lý phân vùng biển | Must Have |
| US-002 | Quản trị viên / Chuyên viên có quyền | Được cảnh báo khi Vùng nước còn hoạt động khai thác đang diễn ra | Tránh xóa nhầm Vùng nước còn đang khai thác hoặc có dữ liệu liên quan chưa xử lý | Must Have |
| US-003 | Quản trị viên | Khôi phục Vùng nước đã xóa trong thời hạn 90 ngày | Sửa sai lầm khi xóa nhầm mà không mất dữ liệu | Must Have |
| US-004 | Hệ thống / Kiểm toán | Ghi nhật ký đầy đủ thao tác xóa vào bảng NhatKyXoa | Phục vụ kiểm toán, truy vết và báo cáo thống kê tài sản vùng nước | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001 | Xóa thành công với quyền hợp lệ | Given: user có role Admin hoặc Chuyên viên với permission VungNuoc:delete, Vùng nước trangThai=da_phe_duyet, không có hoạt động khai thác đang diễn ra; When: user nhập đúng tên Vùng nước vào hộp thoại xác nhận và nhấn xác nhận; Then: hệ thống đặt daXoa=true, ghi ngayXoa=now(), nguoiXoa=userId, Vùng nước không hiển thị trong danh sách mặc định, hiển thị thông báo xóa thành công | Tên nhập phải khớp chính xác (case-insensitive) với trường ten của VungNuoc |
| AC-002 | US-001 | Từ chối xóa khi thiếu quyền | Given: user có role ROLE_LEADER hoặc ROLE_PORT_OPERATOR hoặc Public; When: user cố gắng truy cập chức năng xóa; Then: hệ thống trả về HTTP 403 / hiển thị thông báo không có quyền, không thực hiện bất kỳ thay đổi nào | RBAC kiểm tra tại API layer |
| AC-003 | US-002 | Chặn xóa khi còn hoạt động khai thác đang diễn ra | Given: Vùng nước có hoạt động khai thác ở trạng thái đang xử lý hoặc active; When: user kích hoạt xóa; Then: hệ thống hiển thị cảnh báo liệt kê loại dữ liệu liên quan và số lượng, không thực hiện xóa | Kiểm tra trước khi hiển thị hộp thoại xác nhận |
| AC-004 | US-002 | Chặn xóa khi chưa được phê duyệt | Given: Vùng nước có trangThai=cho_phe_duyet hoặc nháp; When: user kích hoạt xóa; Then: hệ thống từ chối với thông báo Vùng nước chưa/đang chờ phê duyệt, không hiển thị hộp thoại xác nhận | |
| AC-005 | US-001 | Từ chối khi nhập sai tên xác nhận | Given: hộp thoại xác nhận đang hiển thị; When: user nhập tên không khớp với trường ten của VungNuoc và nhấn xác nhận; Then: hệ thống hiển thị lỗi "Tên Vùng nước không khớp", không thực hiện xóa, hộp thoại vẫn mở | Không đếm số lần thử sai |
| AC-006 | US-003 | Khôi phục trong 90 ngày | Given: Vùng nước có daXoa=true và ngayXoa trong vòng 90 ngày; When: Admin thực hiện khôi phục; Then: daXoa đặt lại false, ngayXoa và nguoiXoa được xóa, Vùng nước hiển thị lại trong danh sách mặc định | Chỉ Admin có quyền khôi phục |
| AC-007 | US-003 | Từ chối khôi phục sau 90 ngày | Given: Vùng nước đã xóa quá 90 ngày; When: Admin cố khôi phục; Then: hệ thống thông báo hết thời hạn khôi phục, hướng dẫn liên hệ lưu trữ theo quy định | |
| AC-008 | US-004 | Ghi nhật ký đầy đủ vào NhatKyXoa | Given: bất kỳ thao tác xóa nào (thành công hoặc bị chặn); When: sự kiện xảy ra; Then: hệ thống ghi vào bảng NhatKyXoa với: userId (nguoiXoa), timestamp (ngayXoa, UTC+7), action (DELETE_ATTEMPT / DELETE_SUCCESS / DELETE_BLOCKED), vungNuocId, vungNuocMa, vungNuocTen, lyDo (nếu bị chặn) | Log không được xóa theo vòng đời tài sản |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Soft delete bắt buộc — chỉ đặt daXoa=true, ghi ngayXoa và nguoiXoa; không được xóa bản ghi VungNuoc khỏi DB | US-001, AC-001 | Không có ngoại lệ |
| BR-002 | Kiểm tra ràng buộc trước xóa — Vùng nước không được có hoạt động khai thác ở trạng thái đang xử lý hoặc active | US-002, AC-003 | Nếu tất cả hoạt động khai thác liên quan đã kết thúc/đóng thì không chặn |
| BR-003 | Kiểm tra trạng thái phê duyệt — chỉ Vùng nước trangThai=da_phe_duyet mới có thể xóa; các trạng thái nháp/cho_phe_duyet bị từ chối | US-002, AC-004 | |
| BR-004 | Xác nhận bằng tên Vùng nước — người dùng phải nhập chính xác trường ten (khớp không phân biệt hoa/thường) để xác nhận xóa | US-001, AC-001, AC-005 | |
| BR-005 | Thời hạn khôi phục 90 ngày — Vùng nước đã xóa có thể khôi phục trong 90 ngày kể từ ngayXoa; sau đó chỉ xử lý theo quy định lưu trữ hồ sơ | US-003, AC-006, AC-007 | |
| BR-006 | Nhật ký xóa bắt buộc — ghi đầy đủ vào NhatKyXoa: nguoiXoa, ngayXoa, loại hành động, vungNuocId, vungNuocMa, vungNuocTen, và lyDo nếu bị từ chối | US-004, AC-008 | |
| BR-007 | Phân quyền xóa — chỉ ROLE_ADMIN (A-001) và ROLE_SPECIALIST (A-003) với permission VungNuoc:delete mới thực hiện được xóa; ROLE_LEADER, ROLE_PORT_OPERATOR, Public bị từ chối | US-001, AC-002 | Admin có thể override per-user permission theo mô hình RBAC + per-user override |
| BR-008 | Ẩn khỏi danh sách mặc định — sau khi xóa, VungNuoc với daXoa=true không được trả về trong query mặc định danh sách; chỉ hiển thị khi có filter tường minh | AC-001, AC-006 | |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | API xóa phải hoàn thành trong giới hạn thời gian chấp nhận được | <= 2 giây cho kiểm tra ràng buộc + soft delete trên tập dữ liệu thông thường |
| Security | Kiểm tra quyền tại API layer (Spring Security @PreAuthorize); không thực hiện xóa dựa vào kiểm tra phía client | RBAC: VungNuoc:delete permission bắt buộc; ghi log mọi attempt kể cả unauthorized |
| Reliability | Giao dịch xóa phải atomic — soft delete VungNuoc + ghi NhatKyXoa trong cùng transaction; nếu ghi log thất bại thì rollback xóa | Tỷ lệ thành công >= 99.9% trên môi trường production |
| Audit/Logging | Mọi thao tác xóa (thành công, bị chặn, từ chối quyền) phải được ghi vào bảng NhatKyXoa với đầy đủ trường theo BR-006 | Log không được phép bị xóa theo lifecycle tài sản; lưu trữ theo quy định hồ sơ KCHTGT |
| Operability | Danh sách Vùng nước đã xóa phải có thể tra cứu bởi Admin (filter daXoa=true); API khôi phục phải tồn tại cho Admin | Giao diện quản trị hiển thị danh sách đã xóa với cột ngayXoa, nguoiXoa |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | Xóa thành công Vùng nước đã phê duyệt, không có ràng buộc, nhập đúng tên, user Admin | Happy path - Integration |
| TS-002 | AC-002 | User ROLE_LEADER gọi API xóa — nhận HTTP 403 | Security - Unit |
| TS-003 | AC-002 | User ROLE_PORT_OPERATOR gọi API xóa — nhận HTTP 403 | Security - Unit |
| TS-004 | AC-003 | Xóa Vùng nước có hoạt động khai thác đang xử lý — bị chặn, hiển thị cảnh báo | Negative - Integration |
| TS-005 | AC-003 | Xóa Vùng nước có tất cả hoạt động khai thác đã kết thúc — được phép | Edge case - Integration |
| TS-006 | AC-004 | Xóa Vùng nước trangThai=cho_phe_duyet — bị chặn | Negative - Unit |
| TS-007 | AC-004 | Xóa Vùng nước trangThai=nháp — bị chặn | Negative - Unit |
| TS-008 | AC-005 | Nhập tên xác nhận sai — hộp thoại báo lỗi, không xóa | Negative - UI |
| TS-009 | AC-005 | Nhập tên xác nhận đúng (khác hoa/thường) — được chấp nhận | Edge case - UI |
| TS-010 | AC-006 | Admin khôi phục Vùng nước đã xóa trong 90 ngày — thành công | Happy path - Integration |
| TS-011 | AC-007 | Admin khôi phục Vùng nước đã xóa > 90 ngày — bị từ chối | Negative - Integration |
| TS-012 | AC-008 | Verify NhatKyXoa ghi đúng nguoiXoa, ngayXoa, vungNuocId sau xóa thành công | Audit - Integration |
| TS-013 | AC-008 | Verify NhatKyXoa ghi DELETE_BLOCKED khi xóa bị chặn do ràng buộc khai thác | Audit - Integration |
| TS-014 | AC-001 | Kiểm tra transaction rollback khi ghi NhatKyXoa thất bại — daXoa không đổi | Reliability - Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? (new aggregates/events/contexts?) | No | Không tạo aggregate root mới; VungNuoc đã tồn tại trong domain. Thêm trường daXoa, ngayXoa, nguoiXoa là mở rộng entity hiện có, không tạo bounded context mới. NhatKyXoa là entity log phụ trợ không tạo context mới |
| Architecture affected? (new service boundaries/integrations/data model?) | Yes | Thêm cột daXoa, ngayXoa, nguoiXoa vào bảng VungNuoc; tạo bảng NhatKyXoa; thêm soft-delete filter mặc định trên query; thêm permission VungNuoc:delete vào RBAC; cần thiết kế API endpoint xóa + khôi phục và logic transaction |
| Implementation clear from existing architecture? | No | Cần SA quyết định: cách implement soft-delete filter (Hibernate filter vs query interceptor), cách tích hợp log transaction với NhatKyXoa, API contract cho khôi phục, cách kiểm tra ràng buộc hoạt động khai thác. Pattern F-028 (CangCan) và F-010 (CangBien) cần xác nhận áp dụng đồng nhất cho VungNuoc |
| **Verdict** | `Ready for solution architecture` | Thay đổi data model và API design cần SA xem xét; pattern đồng nhất với F-028 (CangCan) cần SA xác nhận áp dụng |
