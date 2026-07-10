---
feature-id: F-013
document: lean-spec
output-mode: lean
last-updated: 2026-06-27
---
# Quản lý Cảng biển - Lịch sử (F-013)

## Summary

Tính năng cung cấp trang tra cứu toàn bộ lịch sử thay đổi của một Cảng biển — bao gồm tạo mới, cập nhật từng trường, phê duyệt, và xóa — với chi tiết giá trị cũ/mới và người thực hiện. Đây là yêu cầu bắt buộc để đảm bảo tính minh bạch, truy xuất nguồn gốc dữ liệu, và phục vụ kiểm toán nội bộ. Thành công khi toàn bộ sự kiện từ F-008/F-009/F-010/F-011 đều xuất hiện trong timeline thống nhất và người dùng được phép lọc theo loại sự kiện, người thực hiện, và khoảng thời gian.

## Scope

| | Items |
|---|---|
| In scope | Trang lịch sử chronological của Cảng biển; Chi tiết sự kiện (loại, trường thay đổi, giá trị cũ/mới, người thực hiện, thời gian); Lọc theo loại sự kiện / người thực hiện / khoảng thời gian; Tích hợp sự kiện từ F-008 (tạo mới), F-009 (cập nhật), F-010 (xóa), F-011 (phê duyệt); Hiển thị thông tin người thực hiện (tên, vai trò) |
| Out of scope | Sửa hoặc xóa bản ghi lịch sử đã ghi nhận; So sánh trực tiếp hai phiên bản bất kỳ; Xuất lịch sử ra file Excel/PDF; Thông báo real-time khi có thay đổi; Khôi phục Cảng biển về phiên bản lịch sử bất kỳ |
| Assumptions | Dữ liệu lịch sử được ghi nhận tự động bởi các features F-008, F-009, F-010, F-011 — F-013 chỉ đọc/hiển thị; Vai trò "Quản lý cảng" ánh xạ tới ROLE_SPECIALIST hoặc ROLE_PORT_OPERATOR trong actor-registry (cần xác nhận cuối); Giá trị JSON (tọa độ GPS) được chuyển thành chuỗi text dễ đọc trước khi lưu vào bảng lịch sử |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Quản trị viên (ROLE_SYSTEM_ADMIN / ROLE_ADMIN) | Xem toàn bộ lịch sử thay đổi của bất kỳ Cảng biển nào | Kiểm toán nội bộ, truy xuất nguồn gốc dữ liệu | Must Have |
| US-002 | Chuyên viên / Người dùng tại Cảng (ROLE_SPECIALIST / ROLE_PORT_OPERATOR) | Xem lịch sử thay đổi của Cảng biển thuộc phạm vi quản lý | Theo dõi tiến trình cải tạo, mở rộng cảng theo thời gian | Must Have |
| US-003 | Quản trị viên / Chuyên viên | Lọc lịch sử theo loại sự kiện, người thực hiện, khoảng thời gian | Tìm kiếm nhanh sự kiện cụ thể trong timeline dài | Should Have |
| US-004 | Quản trị viên / Chuyên viên | Xem chi tiết từng sự kiện cập nhật (trường nào thay đổi, giá trị cũ → mới) | Giải quyết tranh chấp, xác minh thông tin lịch sử | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001, US-002 | Truy cập trang lịch sử với quyền hợp lệ | Given user có ROLE_SYSTEM_ADMIN, ROLE_ADMIN, ROLE_SPECIALIST, hoặc ROLE_PORT_OPERATOR đã đăng nhập; When user chọn một Cảng biển và nhấn "Xem lịch sử"; Then trang lịch sử hiển thị danh sách sự kiện theo thời gian giảm dần (mới nhất lên đầu) | Danh sách phân trang, mỗi trang tối đa 20 bản ghi |
| AC-002 | US-001, US-002 | Từ chối truy cập khi không có quyền | Given user là Public User hoặc không đăng nhập; When truy cập URL trang lịch sử trực tiếp; Then hệ thống trả về HTTP 403 hoặc redirect về trang đăng nhập | Không lộ bất kỳ dữ liệu lịch sử nào trong response |
| AC-003 | US-001, US-002 | Hiển thị đầy đủ 4 loại sự kiện | Given Cảng biển đã trải qua tạo mới, cập nhật, phê duyệt và xóa; When xem trang lịch sử; Then mỗi loại sự kiện (TAO_MOI, CAP_NHAT, PHE_DUYET, XOA) đều xuất hiện trong danh sách với nhãn loại rõ ràng | Thứ tự sắp xếp theo thoiGian DESC |
| AC-004 | US-004 | Chi tiết sự kiện cập nhật hiển thị diff trường | Given có sự kiện CAP_NHAT trong lịch sử; When user xem hoặc click vào sự kiện đó; Then hiển thị: tên trường thay đổi, giá trị cũ, giá trị mới, tên người thực hiện, thời gian thực hiện | Giá trị GPS/JSON được hiển thị dạng text đọc được |
| AC-005 | US-003 | Lọc theo loại sự kiện | Given trang lịch sử có nhiều loại sự kiện; When user chọn filter "loại sự kiện = CAP_NHAT"; Then chỉ các sự kiện CAP_NHAT được hiển thị trong danh sách | Filter có thể chọn nhiều loại cùng lúc |
| AC-006 | US-003 | Lọc theo người thực hiện | Given trang lịch sử; When user nhập tên/mã người thực hiện vào bộ lọc; Then chỉ các sự kiện do người đó thực hiện được hiển thị | Tìm kiếm không phân biệt hoa thường |
| AC-007 | US-003 | Lọc theo khoảng thời gian | Given trang lịch sử; When user nhập ngày bắt đầu và ngày kết thúc; Then chỉ các sự kiện trong khoảng [from, to] được hiển thị | Ngày kết thúc = cuối ngày (23:59:59); khoảng thời gian tối đa 1 năm |
| AC-008 | US-001, US-002 | Lịch sử tích hợp từ các features khác | Given các thao tác từ F-008, F-009, F-010, F-011 đã được ghi nhận; When xem trang lịch sử F-013; Then tất cả sự kiện từ các features đó xuất hiện trong cùng một timeline theo đúng thứ tự thời gian | Không bị thiếu sự kiện từ bất kỳ feature nào |
| AC-009 | US-001, US-002 | Cảng biển không có lịch sử | Given Cảng biển vừa được tạo và chưa có thay đổi nào (trừ sự kiện tạo mới); When xem trang lịch sử; Then hiển thị đúng 1 sự kiện TAO_MOI và thông báo rõ ràng nếu danh sách rỗng sau lọc | |
| AC-010 | US-002 | Phân quyền theo đơn vị (org unit) | Given ROLE_PORT_OPERATOR thuộc đơn vị X; When xem lịch sử Cảng biển thuộc đơn vị khác; Then hệ thống từ chối với HTTP 403 | Tuân theo quy tắc org-unit hierarchy trong authorization-rules.md |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Mọi thay đổi về Cảng biển (tạo, cập nhật, xóa, phê duyệt) đều phải được ghi nhận tự động vào bảng lịch sử — không cho phép bỏ qua hoặc vô hiệu hóa | F-008, F-009, F-010, F-011 (ghi); F-013 (đọc) | Không có |
| BR-002 | Bản ghi lịch sử là immutable — sau khi ghi nhận không được phép sửa hoặc xóa bất kỳ trường nào | F-013 API | Không có |
| BR-003 | Sự kiện từ F-008, F-009, F-010, F-011 được hợp nhất vào một timeline duy nhất sắp xếp theo thoiGian DESC | F-013 display | Không có |
| BR-004 | Giá trị cũ và giá trị mới được lưu dưới dạng text dễ đọc; giá trị JSON phức tạp (tọa độ GPS, nested object) phải được chuyển đổi sang text trước khi ghi | F-008, F-009 (write audit) | Các trường text thuần không cần chuyển đổi |
| BR-005 | Truy cập trang lịch sử chỉ dành cho ROLE_SYSTEM_ADMIN, ROLE_ADMIN, ROLE_SPECIALIST, ROLE_PORT_OPERATOR; Public User và External System không có quyền | F-013 access control | ROLE_PORT_OPERATOR bị giới hạn bởi org-unit filter |
| BR-006 | Lọc theo khoảng thời gian tối đa 1 năm; nếu không chọn khoảng thời gian thì mặc định hiển thị 90 ngày gần nhất | F-013 filter | Admin có thể không bị giới hạn 90 ngày (cần xác nhận) |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Trang lịch sử load và hiển thị trong thời gian chấp nhận được với dataset lớn | Tải trang ≤ 2 giây cho Cảng biển có ≤ 1000 sự kiện lịch sử; phân trang server-side |
| Security | Kiểm soát truy cập theo RBAC + org-unit; không expose dữ liệu lịch sử qua API công khai | HTTP 403 cho request không có quyền; audit log cho mỗi lần xem trang lịch sử |
| Reliability | Bảng lịch sử không bị mất dữ liệu kể cả khi transaction chính thất bại | Ghi lịch sử trong cùng transaction với thao tác gốc; nếu ghi lịch sử lỗi thì rollback toàn bộ |
| Audit/Logging | Mỗi lần user truy cập trang lịch sử được ghi vào access log | Log: userId, cangBienId, thời gian truy cập, filter parameters đã dùng |
| Operability | API lịch sử hỗ trợ phân trang và filter; không gây full-table-scan | Index trên cangBienId + thoiGian; index trên loaiSuKien; query explain plan được review trước production |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | Admin xem lịch sử Cảng biển có đủ 4 loại sự kiện — danh sách hiển thị đúng thứ tự giảm dần | Integration |
| TS-002 | AC-002 | Public User cố truy cập URL lịch sử trực tiếp — nhận HTTP 403 | Security |
| TS-003 | AC-004 | Cập nhật tên cảng từ "Cảng A" sang "Cảng B" — lịch sử ghi đúng giá trị cũ/mới | Integration |
| TS-004 | AC-005 | Lọc theo loại sự kiện = CAP_NHAT — chỉ sự kiện cập nhật xuất hiện | Integration |
| TS-005 | AC-006 | Lọc theo người thực hiện tên "Nguyễn Văn A" — chỉ sự kiện do người này xuất hiện | Integration |
| TS-006 | AC-007 | Lọc khoảng thời gian hợp lệ 30 ngày — sự kiện ngoài khoảng bị ẩn | Integration |
| TS-007 | AC-007 | Lọc khoảng thời gian > 1 năm — hệ thống từ chối hoặc cảnh báo | Validation |
| TS-008 | AC-008 | Tạo mới, cập nhật, phê duyệt, xóa Cảng biển — F-013 hiển thị đầy đủ 4 sự kiện từ 4 features | Integration |
| TS-009 | AC-009 | Xem lịch sử Cảng biển vừa tạo chưa có thay đổi — hiển thị đúng 1 sự kiện TAO_MOI | Integration |
| TS-010 | AC-010 | ROLE_PORT_OPERATOR xem lịch sử Cảng biển ngoài đơn vị — nhận HTTP 403 | Security |
| TS-011 | BR-002 | Cố gọi API DELETE hoặc PUT trên bảng lịch sử — hệ thống từ chối | Security/Unit |
| TS-012 | BR-004 | Cập nhật tọa độ GPS (giá trị JSON) — lịch sử lưu dạng text đọc được, không phải raw JSON | Unit |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Entity LichSuThayDoi đã được định nghĩa trong feature-brief; không tạo mới aggregate root hay bounded context; F-013 là read-only view trên audit trail do F-008/F-009/F-010/F-011 ghi |
| Architecture affected? | Yes | Cần quyết định kiến trúc lưu audit log (trigger DB vs application-level interceptor vs event sourcing); cần index strategy cho bảng lịch sử; cần xác định transaction boundary (ghi lịch sử trong cùng tx hay async) |
| Implementation clear? | No | Chưa có quyết định về storage strategy cho audit log; chưa rõ cơ chế ghi lịch sử (Spring AOP, DB trigger, hay explicit service call); cần SA quyết định |
| **Verdict** | `Ready for solution architecture` | Architecture decisions cần thiết trước khi tech-lead lên kế hoạch |

---

## BA → Handoff Summary

**Verdict:** Ready for solution architecture

**Phases completed:** BA only

**Triage rationale:** F-013 là read-only audit trail feature; không tạo bounded context mới (Phase 2 không cần). Tuy nhiên cần SA quyết định storage strategy (DB trigger vs AOP interceptor vs explicit service), index design, và transaction boundary cho việc ghi lịch sử.

**Business goal:** Đảm bảo tính minh bạch và truy xuất nguồn gốc dữ liệu Cảng biển phục vụ kiểm toán và giải quyết tranh chấp.

**Scope in:**
- Trang xem lịch sử chronological với 4 loại sự kiện
- Chi tiết diff trường thay đổi (giá trị cũ/mới)
- Bộ lọc theo loại sự kiện, người thực hiện, khoảng thời gian
- Tích hợp sự kiện từ F-008, F-009, F-010, F-011

**Key business rules:** BR-001: ghi lịch sử bắt buộc cho mọi thay đổi; BR-002: bản ghi lịch sử immutable; BR-004: JSON/GPS phải chuyển sang text; BR-006: mặc định hiển thị 90 ngày gần nhất

**Actors:** ROLE_SYSTEM_ADMIN, ROLE_ADMIN (xem toàn bộ); ROLE_SPECIALIST, ROLE_PORT_OPERATOR (xem theo org-unit)

**Domain highlights:** Không áp dụng (Phase 2 không chạy)

**UI/UX impact:** Yes — designer required (trang danh sách lịch sử với timeline, panel chi tiết diff, bộ lọc đa tiêu chí)

**Screen types:** Trang danh sách lịch sử (timeline list view); Modal/panel chi tiết sự kiện (diff view)

**Open items (non-blocking):** BR-006 giới hạn 90 ngày mặc định — cần xác nhận Admin có được xem toàn bộ không có giới hạn hay không; Ánh xạ vai trò "Quản lý cảng" trong feature-brief sang role slug chính xác trong actor-registry (ROLE_SPECIALIST hay ROLE_PORT_OPERATOR)
