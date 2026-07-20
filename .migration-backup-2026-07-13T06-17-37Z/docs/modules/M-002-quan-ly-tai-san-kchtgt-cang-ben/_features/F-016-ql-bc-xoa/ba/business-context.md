---
feature-id: F-016
document: business-context
output-mode: lean
last-updated: 2026-06-27
---
# Quản lý Bến cảng - Xóa

## Summary

Tính năng cho phép người dùng có thẩm quyền (Admin hoặc Quản lý cảng) xóa mềm một Bến cảng khỏi hệ thống KCHTGT hàng hải sau khi xác nhận bằng tên bến và kiểm tra ràng buộc dữ liệu liên quan (Cầu cảng con, lượt tàu, lịch sử phục vụ). Cơ chế soft delete bảo tồn dữ liệu lịch sử phục vụ kiểm toán, đánh giá đầu tư hạ tầng và báo cáo thống kê, đồng thời cho phép khôi phục trong vòng 90 ngày. Thành công khi luồng xóa thực thi đúng với kiểm tra quyền, kiểm tra ràng buộc, ghi nhật ký và ẩn bến khỏi danh sách mặc định.

## Scope

| | Items |
|---|---|
| In scope | Giao diện xác nhận xóa (nhập tên bến); kiểm tra ràng buộc dữ liệu liên quan (Cầu cảng, lượt tàu, lịch sử phục vụ); kiểm tra trạng thái phê duyệt; soft delete (đặt trangThai=da_xoa, ghi deletedAt/deletedBy); ghi nhật ký xóa; ẩn khỏi danh sách mặc định; khôi phục trong 90 ngày |
| Out of scope | Hard delete khỏi DB; xóa hàng loạt nhiều Bến cảng; cascade delete dữ liệu liên quan; luồng phê duyệt xóa bởi cấp cao hơn (F-017); xuất báo cáo lịch sử xóa |
| Assumptions | "Dữ liệu liên quan chưa xử lý" bao gồm: Cầu cảng con ở trạng thái hien_hanh hoặc tam_ngung, lượt tàu active, lịch sử phục vụ đang mở; "Quản lý cảng" ánh xạ với ROLE_ADMIN hoặc ROLE_SPECIALIST có permission BenCang:delete; thời hạn khôi phục mặc định 90 ngày theo quy định lưu trữ hồ sơ hạ tầng |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Quản trị viên (A-001) / Chuyên viên có quyền (A-003) | Xóa mềm một Bến cảng đã chấm dứt hoạt động | Duy trì danh sách bến cảng chính xác, tránh nhầm lẫn trong vận hành | Must Have |
| US-002 | Quản trị viên / Chuyên viên có quyền | Được cảnh báo khi bến còn Cầu cảng hoặc dữ liệu liên quan chưa xử lý | Tránh xóa nhầm bến đang hoạt động hoặc có tài sản con | Must Have |
| US-003 | Quản trị viên | Khôi phục Bến cảng đã xóa trong thời hạn 90 ngày | Sửa sai lầm khi xóa nhầm mà không mất dữ liệu | Must Have |
| US-004 | Hệ thống / Kiểm toán | Ghi nhật ký đầy đủ thao tác xóa | Phục vụ kiểm toán, truy vết và báo cáo thống kê tài sản | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001 | Xóa thành công với quyền hợp lệ | Given: user có role Admin hoặc Chuyên viên với permission BenCang:delete, Bến cảng không có Cầu cảng hoặc dữ liệu liên quan chưa xử lý, không trong quá trình phê duyệt; When: user nhập đúng tên Bến cảng vào hộp thoại xác nhận và nhấn xác nhận; Then: hệ thống đặt trangThai=da_xoa, ghi deletedAt=now(), deletedBy=userId, bến không hiển thị trong danh sách mặc định, hiển thị thông báo xóa thành công | Tên nhập phải khớp chính xác (case-insensitive) với tenBen |
| AC-002 | US-001 | Từ chối xóa khi thiếu quyền | Given: user có role ROLE_LEADER hoặc ROLE_PORT_OPERATOR hoặc Public; When: user cố gắng truy cập chức năng xóa; Then: hệ thống trả về HTTP 403 / hiển thị thông báo không có quyền, không thực hiện bất kỳ thay đổi nào | RBAC kiểm tra tại API layer |
| AC-003 | US-002 | Chặn xóa khi còn Cầu cảng con chưa xử lý | Given: Bến cảng có Cầu cảng con ở trạng thái hien_hanh hoặc tam_ngung; When: user kích hoạt xóa; Then: hệ thống hiển thị cảnh báo liệt kê số lượng Cầu cảng con và loại ràng buộc, không thực hiện xóa | Kiểm tra trước khi hiển thị hộp thoại xác nhận |
| AC-004 | US-002 | Chặn xóa khi còn lượt tàu hoặc lịch sử phục vụ chưa xử lý | Given: Bến cảng có lượt tàu active hoặc lịch sử phục vụ đang mở; When: user kích hoạt xóa; Then: hệ thống hiển thị cảnh báo chi tiết và đề xuất xử lý dữ liệu liên quan trước, không thực hiện xóa | Liệt kê loại dữ liệu liên quan và số lượng |
| AC-005 | US-002 | Chặn xóa khi đang trong quá trình phê duyệt | Given: Bến cảng có trangThai=cho_phe_duyet; When: user kích hoạt xóa; Then: hệ thống từ chối với thông báo bến đang chờ phê duyệt, không hiển thị hộp thoại xác nhận | |
| AC-006 | US-001 | Từ chối khi nhập sai tên xác nhận | Given: hộp thoại xác nhận đang hiển thị; When: user nhập tên không khớp với tenBen và nhấn xác nhận; Then: hệ thống hiển thị lỗi "Tên bến cảng không khớp", không thực hiện xóa, hộp thoại vẫn mở | Không đếm số lần thử sai |
| AC-007 | US-003 | Khôi phục trong 90 ngày | Given: Bến cảng có trangThai=da_xoa và deletedAt trong vòng 90 ngày; When: Admin thực hiện khôi phục; Then: trangThai trở về hien_hanh, deletedAt và deletedBy được xóa, bến hiển thị lại trong danh sách | Chỉ Admin có quyền khôi phục |
| AC-008 | US-003 | Từ chối khôi phục sau 90 ngày | Given: Bến cảng đã xóa quá 90 ngày; When: Admin cố khôi phục; Then: hệ thống thông báo hết thời hạn khôi phục, hướng dẫn liên hệ lưu trữ theo quy định | |
| AC-009 | US-004 | Ghi nhật ký đầy đủ | Given: bất kỳ thao tác xóa nào (thành công hoặc bị chặn); When: sự kiện xảy ra; Then: hệ thống ghi log với: userId, timestamp (UTC+7), action (DELETE_ATTEMPT / DELETE_SUCCESS / DELETE_BLOCKED), entityId, tenBen, lý do chặn (nếu có) | Log không được xóa theo vòng đời tài sản |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Soft delete bắt buộc — chỉ đặt trangThai=da_xoa, ghi deletedAt và deletedBy; không được xóa bản ghi khỏi DB | US-001, AC-001 | Không có ngoại lệ |
| BR-002 | Kiểm tra ràng buộc Cầu cảng con — Bến cảng không được xóa khi có Cầu cảng ở trạng thái hien_hanh hoặc tam_ngung | US-002, AC-003 | Cầu cảng đã da_xoa không chặn xóa Bến cảng |
| BR-003 | Kiểm tra ràng buộc lượt tàu/lịch sử phục vụ — Bến cảng không được xóa khi có dữ liệu liên quan chưa được xử lý (active) | US-002, AC-004 | |
| BR-004 | Kiểm tra trạng thái phê duyệt — Bến cảng có trangThai=cho_phe_duyet không được phép xóa | US-002, AC-005 | |
| BR-005 | Xác nhận bằng tên bến — người dùng phải nhập chính xác tenBen (khớp không phân biệt hoa/thường) để xác nhận xóa | US-001, AC-001, AC-006 | |
| BR-006 | Thời hạn khôi phục 90 ngày — Bến cảng đã xóa có thể khôi phục trong 90 ngày kể từ deletedAt; sau đó chỉ xử lý theo quy định lưu trữ hồ sơ | US-003, AC-007, AC-008 | |
| BR-007 | Nhật ký xóa bắt buộc — ghi đầy đủ: userId, timestamp, loại hành động, entityId, tenBen, và lý do chặn nếu bị từ chối | US-004, AC-009 | |
| BR-008 | Phân quyền xóa — chỉ ROLE_ADMIN và ROLE_SPECIALIST (với permission BenCang:delete) mới thực hiện được xóa; ROLE_LEADER, ROLE_PORT_OPERATOR, Public bị từ chối | US-001, AC-002 | Admin có thể override per-user permission theo mô hình RBAC |
| BR-009 | Ẩn khỏi danh sách mặc định — sau khi xóa, Bến cảng với trangThai=da_xoa không được trả về trong query mặc định; chỉ hiển thị khi có filter tường minh | AC-001, AC-007 | |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | API xóa hoàn thành trong giới hạn chấp nhận được, bao gồm kiểm tra tất cả ràng buộc | <= 2 giây cho kiểm tra ràng buộc + soft delete trên tập dữ liệu thông thường |
| Security | Kiểm tra quyền tại API layer (Spring Security @PreAuthorize); không thực hiện xóa dựa vào kiểm tra phía client; log mọi attempt kể cả unauthorized | RBAC: BenCang:delete permission bắt buộc |
| Reliability | Giao dịch xóa phải atomic — soft delete + ghi log trong cùng transaction; nếu log thất bại, rollback xóa | Tỷ lệ thành công >= 99.9% trên môi trường production |
| Audit/Logging | Mọi thao tác xóa (thành công, bị chặn, từ chối quyền) phải được ghi vào bảng log với đầy đủ trường theo BR-007 | Log không được phép bị xóa theo lifecycle tài sản; lưu trữ theo quy định hồ sơ KCHTGT |
| Operability | Danh sách Bến cảng đã xóa phải có thể tra cứu bởi Admin (filter theo trangThai=da_xoa); API khôi phục phải tồn tại cho Admin | Giao diện quản trị hiển thị danh sách đã xóa với cột deletedAt, deletedBy |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | Xóa thành công Bến cảng không có ràng buộc, nhập đúng tên, user Admin | Happy path - Integration |
| TS-002 | AC-002 | User ROLE_LEADER gọi API xóa — nhận HTTP 403 | Security - Unit |
| TS-003 | AC-002 | User ROLE_PORT_OPERATOR gọi API xóa — nhận HTTP 403 | Security - Unit |
| TS-004 | AC-003 | Xóa bến có Cầu cảng hien_hanh — bị chặn, hiển thị cảnh báo | Negative - Integration |
| TS-005 | AC-003 | Xóa bến có Cầu cảng tam_ngung — bị chặn | Negative - Integration |
| TS-006 | AC-003 | Xóa bến có Cầu cảng đều da_xoa — được phép tiếp tục | Edge case - Integration |
| TS-007 | AC-004 | Xóa bến có lượt tàu active — bị chặn | Negative - Integration |
| TS-008 | AC-005 | Xóa bến trangThai=cho_phe_duyet — bị chặn | Negative - Unit |
| TS-009 | AC-006 | Nhập tên xác nhận sai — hộp thoại báo lỗi, không xóa | Negative - UI |
| TS-010 | AC-006 | Nhập tên xác nhận đúng (khác hoa/thường) — được chấp nhận | Edge case - UI |
| TS-011 | AC-007 | Admin khôi phục bến đã xóa trong 90 ngày — thành công | Happy path - Integration |
| TS-012 | AC-008 | Admin khôi phục bến đã xóa > 90 ngày — bị từ chối | Negative - Integration |
| TS-013 | AC-009 | Verify log ghi đúng userId, timestamp, entityId sau xóa thành công | Audit - Integration |
| TS-014 | AC-009 | Verify log ghi DELETE_BLOCKED khi xóa bị chặn do ràng buộc | Audit - Integration |
| TS-015 | AC-001 | Kiểm tra transaction rollback khi ghi log thất bại — trangThai không đổi | Reliability - Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? (new aggregates/events/contexts?) | No | Không tạo aggregate root mới; BenCang đã tồn tại trong domain. Thêm trạng thái da_xoa và trường deletedAt/deletedBy là mở rộng entity hiện có, không tạo bounded context mới |
| Architecture affected? (new service boundaries/integrations/data model?) | Yes | Thêm cột deletedAt, deletedBy, thay đổi trangThai enum, thêm soft-delete filter mặc định trên query; thêm permission BenCang:delete vào RBAC; cần API endpoint xóa + khôi phục và logic transaction atomic |
| Implementation clear from existing architecture? | No | Cần SA quyết định: cách implement soft-delete filter (Hibernate filter vs query interceptor), cách tích hợp log transaction, API contract cho khôi phục — tương tự F-010 nhưng cần xác nhận pattern tái sử dụng |
| **Verdict** | `Ready for solution architecture` | Thay đổi data model và API design cần SA xem xét; pattern từ F-010 có thể tái sử dụng nhưng cần SA xác nhận |
