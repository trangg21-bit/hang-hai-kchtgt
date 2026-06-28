---
feature-id: F-037
document: lean-spec
output-mode: lean
last-updated: 2026-06-27
---
# Quản lý Vùng nước - Lịch sử (F-037)

## Summary

Tính năng cung cấp trang tra cứu toàn bộ lịch sử thay đổi của một Vùng nước — bao gồm tạo mới, cập nhật từng trường, phê duyệt hai cấp (Cấp 1 / Cấp 2), từ chối, và xóa — với chi tiết giá trị cũ/mới, người thực hiện, và thời gian. Đây là yêu cầu bắt buộc để đảm bảo tính minh bạch, truy xuất nguồn gốc dữ liệu, và phục vụ kiểm toán trong quản lý tài sản vùng nước biển. Thành công khi toàn bộ sự kiện từ F-032/F-033/F-034/F-035 đều xuất hiện trong timeline thống nhất, hiển thị chronologically và người dùng được phép lọc theo loại sự kiện, người thực hiện, và khoảng thời gian.

## Scope

| | Items |
|---|---|
| In scope | Trang lịch sử chronological của Vùng nước; Chi tiết sự kiện (loại, trường thay đổi, giá trị cũ/mới, người thực hiện, thời gian); Lọc theo loại sự kiện / người thực hiện / khoảng thời gian; Tích hợp sự kiện từ F-032 (tạo mới), F-033 (cập nhật), F-034 (xóa), F-035 (phê duyệt hai cấp); Đánh dấu nổi bật các lần phê duyệt Cấp 1 và Cấp 2; Hiển thị thông tin người thực hiện (tên, vai trò) |
| Out of scope | Sửa hoặc xóa bản ghi lịch sử đã ghi nhận; So sánh trực tiếp hai phiên bản bất kỳ; Xuất lịch sử ra file Excel/PDF; Thông báo real-time khi có thay đổi; Khôi phục Vùng nước về phiên bản lịch sử bất kỳ; So sánh đồng thời lịch sử của nhiều Vùng nước |
| Assumptions | Dữ liệu lịch sử được ghi nhận tự động bởi các features F-032, F-033, F-034, F-035 — F-037 chỉ đọc/hiển thị; Vai trò trong feature-brief ("Chuyên viên Cảng", "Trưởng phòng QL Cảng", "Cục") ánh xạ sang ROLE_SPECIALIST / ROLE_PORT_OPERATOR / ROLE_ADMIN trong actor-registry; Giá trị JSON phức tạp được chuyển thành text dễ đọc trước khi lưu vào bảng lịch sử |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Quản trị viên (ROLE_SYSTEM_ADMIN / ROLE_ADMIN) | Xem toàn bộ lịch sử thay đổi của bất kỳ Vùng nước nào | Kiểm toán nội bộ, truy xuất nguồn gốc dữ liệu vùng nước biển | Must Have |
| US-002 | Chuyên viên / Người dùng tại Cảng (ROLE_SPECIALIST / ROLE_PORT_OPERATOR) | Xem lịch sử thay đổi của Vùng nước thuộc phạm vi quản lý | Theo dõi biến động điều kiện tự nhiên và phân vùng khai thác theo thời gian | Must Have |
| US-003 | Quản trị viên / Chuyên viên | Lọc lịch sử theo loại sự kiện, người thực hiện, khoảng thời gian | Tìm kiếm nhanh sự kiện cụ thể trong timeline dài | Should Have |
| US-004 | Quản trị viên / Chuyên viên | Xem chi tiết từng sự kiện cập nhật (trường nào thay đổi, giá trị cũ → mới) | Giải quyết tranh chấp, xác minh thông tin lịch sử vùng nước | Must Have |
| US-005 | Quản trị viên / Chuyên viên | Nhận diện nhanh các lần phê duyệt hai cấp trong timeline | Truy vết quy trình phê duyệt để giải trình với cơ quan quản lý | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001, US-002 | Truy cập trang lịch sử với quyền hợp lệ | Given user có ROLE_SYSTEM_ADMIN, ROLE_ADMIN, ROLE_SPECIALIST, hoặc ROLE_PORT_OPERATOR đã đăng nhập; When user chọn một Vùng nước và nhấn "Xem lịch sử"; Then trang lịch sử hiển thị danh sách sự kiện theo thời gian giảm dần (mới nhất lên đầu) | Danh sách phân trang, mỗi trang tối đa 20 bản ghi |
| AC-002 | US-001, US-002 | Từ chối truy cập khi không có quyền | Given user là Public User (A-005) hoặc External System hoặc không đăng nhập; When truy cập URL trang lịch sử trực tiếp; Then hệ thống trả về HTTP 403 hoặc redirect về trang đăng nhập | Không lộ bất kỳ dữ liệu lịch sử nào trong response |
| AC-003 | US-001, US-002 | Hiển thị đầy đủ 5 loại sự kiện | Given Vùng nước đã trải qua tạo mới, cập nhật, phê duyệt Cấp 1, phê duyệt Cấp 2, và xóa; When xem trang lịch sử; Then mỗi loại sự kiện (TAO_MOI, CAP_NHAT, PHE_DUYET_CAP1, PHE_DUYET_CAP2, XOA) đều xuất hiện trong danh sách với nhãn loại rõ ràng | Thứ tự sắp xếp theo thoiGian DESC |
| AC-004 | US-004 | Chi tiết sự kiện cập nhật hiển thị diff trường | Given có sự kiện CAP_NHAT trong lịch sử; When user xem hoặc click vào sự kiện đó; Then hiển thị: tên trường thay đổi, giá trị cũ, giá trị mới, tên người thực hiện, thời gian thực hiện | Giá trị JSON/tọa độ được hiển thị dạng text đọc được |
| AC-005 | US-003 | Lọc theo loại sự kiện | Given trang lịch sử có nhiều loại sự kiện; When user chọn filter "loại sự kiện = CAP_NHAT"; Then chỉ các sự kiện CAP_NHAT được hiển thị | Filter có thể chọn nhiều loại cùng lúc |
| AC-006 | US-003 | Lọc theo người thực hiện | Given trang lịch sử; When user nhập tên/mã người thực hiện vào bộ lọc; Then chỉ các sự kiện do người đó thực hiện được hiển thị | Tìm kiếm không phân biệt hoa thường |
| AC-007 | US-003 | Lọc theo khoảng thời gian | Given trang lịch sử; When user nhập ngày bắt đầu và ngày kết thúc; Then chỉ các sự kiện trong khoảng [from, to] được hiển thị | Ngày kết thúc tính đến 23:59:59; khoảng thời gian tối đa 1 năm |
| AC-008 | US-001, US-002 | Lịch sử tích hợp từ các features khác | Given các thao tác từ F-032, F-033, F-034, F-035 đã được ghi nhận; When xem trang lịch sử F-037; Then tất cả sự kiện từ các features đó xuất hiện trong cùng một timeline theo đúng thứ tự thời gian | Không bị thiếu sự kiện từ bất kỳ feature nào |
| AC-009 | US-001, US-002 | Vùng nước không có lịch sử sau lọc | Given Vùng nước vừa tạo mới và chưa có thay đổi; When xem trang lịch sử; Then hiển thị đúng 1 sự kiện TAO_MOI và thông báo rõ ràng khi danh sách rỗng sau filter | |
| AC-010 | US-002 | Phân quyền theo đơn vị (org unit) | Given ROLE_PORT_OPERATOR thuộc đơn vị X; When xem lịch sử Vùng nước thuộc đơn vị khác; Then hệ thống từ chối với HTTP 403 | Tuân theo quy tắc org-unit hierarchy trong authorization-rules.md |
| AC-011 | US-005 | Đánh dấu nổi bật phê duyệt hai cấp | Given timeline có sự kiện PHE_DUYET_CAP1 và PHE_DUYET_CAP2; When xem danh sách lịch sử; Then hai loại sự kiện này được hiển thị nổi bật (badge/icon riêng biệt) để phân biệt với các loại sự kiện khác | |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Mọi thay đổi về Vùng nước (tạo, cập nhật, xóa, phê duyệt Cấp 1, phê duyệt Cấp 2, từ chối) đều phải được ghi nhận tự động vào bảng lịch sử — không cho phép bỏ qua | F-032, F-033, F-034, F-035 (ghi); F-037 (đọc) | Không có |
| BR-002 | Bản ghi lịch sử là immutable — sau khi ghi nhận không được phép sửa hoặc xóa bất kỳ trường nào | F-037 API và DB | Không có |
| BR-003 | Sự kiện từ F-032, F-033, F-034, F-035 được hợp nhất vào một timeline duy nhất sắp xếp theo thoiGian DESC | F-037 display | Không có |
| BR-004 | Giá trị cũ và giá trị mới được lưu dạng text dễ đọc; giá trị JSON phức tạp phải được chuyển đổi sang text trước khi ghi | F-032, F-033 (write audit) | Các trường text thuần không cần chuyển đổi |
| BR-005 | Truy cập trang lịch sử chỉ dành cho ROLE_SYSTEM_ADMIN, ROLE_ADMIN, ROLE_SPECIALIST, ROLE_PORT_OPERATOR; Public User và External System không có quyền | F-037 access control | ROLE_PORT_OPERATOR bị giới hạn bởi org-unit filter |
| BR-006 | Lọc theo khoảng thời gian tối đa 1 năm; nếu không chọn khoảng thời gian thì mặc định hiển thị 90 ngày gần nhất | F-037 filter | Admin có thể xem toàn bộ không bị giới hạn (cần xác nhận với PO) |
| BR-007 | Các lần phê duyệt Cấp 1 và Cấp 2 phải được đánh dấu nổi bật trong danh sách lịch sử để dễ nhận diện | F-037 display | Không có |
| BR-008 | Thông tin người thực hiện được tự động lấy từ tài khoản đăng nhập tại thời điểm thực hiện thao tác; không cho phép khai báo tay | F-032, F-033, F-034, F-035 (write audit) | Không có |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Trang lịch sử load với dataset lớn; phân trang server-side bắt buộc | Tải trang ≤ 2 giây cho Vùng nước có ≤ 1000 sự kiện lịch sử |
| Security | Kiểm soát truy cập theo RBAC + org-unit; không expose dữ liệu lịch sử qua API công khai | HTTP 403 cho request không có quyền; audit log cho mỗi lần xem trang lịch sử |
| Reliability | Bảng lịch sử không bị mất dữ liệu kể cả khi transaction chính thất bại | Ghi lịch sử trong cùng transaction với thao tác gốc; nếu ghi lịch sử lỗi thì rollback toàn bộ |
| Audit/Logging | Mỗi lần user truy cập trang lịch sử được ghi vào access log | Log: userId, vungNuocId, thời gian truy cập, filter parameters đã dùng |
| Operability | API lịch sử hỗ trợ phân trang và filter; không gây full-table-scan | Index trên vungNuocId + thoiGian; index trên loaiSuKien; query explain plan review trước production |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | Admin xem lịch sử Vùng nước có đủ 5 loại sự kiện — danh sách hiển thị đúng thứ tự giảm dần | Integration |
| TS-002 | AC-002 | Public User cố truy cập URL lịch sử trực tiếp — nhận HTTP 403 | Security |
| TS-003 | AC-004 | Cập nhật tên Vùng nước từ "VN-A" sang "VN-B" — lịch sử ghi đúng giá trị cũ/mới | Integration |
| TS-004 | AC-005 | Lọc theo loại sự kiện = CAP_NHAT — chỉ sự kiện cập nhật xuất hiện | Integration |
| TS-005 | AC-006 | Lọc theo người thực hiện tên "Nguyễn Văn A" — chỉ sự kiện do người này xuất hiện | Integration |
| TS-006 | AC-007 | Lọc khoảng thời gian hợp lệ 30 ngày — sự kiện ngoài khoảng bị ẩn | Integration |
| TS-007 | AC-007 | Lọc khoảng thời gian > 1 năm — hệ thống từ chối hoặc cảnh báo | Validation |
| TS-008 | AC-008 | Tạo mới, cập nhật, phê duyệt Cấp 1, phê duyệt Cấp 2, xóa Vùng nước — F-037 hiển thị đầy đủ 5 sự kiện | Integration |
| TS-009 | AC-009 | Xem lịch sử Vùng nước vừa tạo chưa có thay đổi — hiển thị đúng 1 sự kiện TAO_MOI | Integration |
| TS-010 | AC-010 | ROLE_PORT_OPERATOR xem lịch sử Vùng nước ngoài đơn vị — nhận HTTP 403 | Security |
| TS-011 | BR-002 | Cố gọi API DELETE hoặc PUT trên bảng lịch sử — hệ thống từ chối | Security/Unit |
| TS-012 | BR-004 | Cập nhật tọa độ GPS hoặc thuộc tính JSON — lịch sử lưu dạng text đọc được, không phải raw JSON | Unit |
| TS-013 | AC-011 | Timeline chứa PHE_DUYET_CAP1 và PHE_DUYET_CAP2 — hai sự kiện này hiển thị nổi bật, khác biệt với CAP_NHAT | UI/Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Entity LichSuVungNuoc đã được định nghĩa trong feature-brief; không tạo mới aggregate root hay bounded context; F-037 là read-only view trên audit trail do F-032/F-033/F-034/F-035 ghi |
| Architecture affected? | Yes | Cần quyết định kiến trúc lưu audit log (DB trigger vs Spring AOP interceptor vs explicit service call); cần index strategy cho bảng lịch sử; cần xác định transaction boundary (ghi lịch sử trong cùng tx hay async) |
| Implementation clear? | No | Chưa có quyết định về storage strategy cho audit log; chưa rõ cơ chế ghi lịch sử; cần SA quyết định trước khi tech-lead lên kế hoạch |
| **Verdict** | `Ready for solution architecture` | Architecture decisions cần thiết trước khi tech-lead lên kế hoạch |

---

## BA → Handoff Summary

**Verdict:** Ready for solution architecture

**Phases completed:** BA only

**Triage rationale:** F-037 là read-only audit trail feature; không tạo bounded context mới (Phase 2 không cần). Tuy nhiên cần SA quyết định storage strategy (DB trigger vs AOP interceptor vs explicit service call), index design, và transaction boundary cho việc ghi lịch sử. Pattern tương đồng với F-013 (Cảng biển - Lịch sử) đã có SA artifacts — SA có thể tái sử dụng quyết định kiến trúc.

**Business goal:** Đảm bảo tính minh bạch và truy xuất nguồn gốc dữ liệu Vùng nước phục vụ kiểm toán, giải trình và phân tích xu hướng biến động điều kiện tự nhiên hoặc phân vùng khai thác biển.

**Scope in:**
- Trang xem lịch sử chronological với 5 loại sự kiện (TAO_MOI, CAP_NHAT, PHE_DUYET_CAP1, PHE_DUYET_CAP2, XOA)
- Chi tiết diff trường thay đổi (giá trị cũ/mới)
- Bộ lọc theo loại sự kiện, người thực hiện, khoảng thời gian
- Tích hợp sự kiện từ F-032, F-033, F-034, F-035
- Đánh dấu nổi bật phê duyệt hai cấp

**Key business rules:** BR-001: ghi lịch sử bắt buộc mọi thay đổi; BR-002: bản ghi lịch sử immutable; BR-004: JSON phải chuyển sang text; BR-006: mặc định 90 ngày gần nhất; BR-007: đánh dấu nổi bật phê duyệt hai cấp

**Actors:** ROLE_SYSTEM_ADMIN, ROLE_ADMIN (xem toàn bộ); ROLE_SPECIALIST, ROLE_PORT_OPERATOR (xem theo org-unit)

**Domain highlights:** Không áp dụng (Phase 2 không chạy)

**UI/UX impact:** Yes — designer required (trang danh sách lịch sử với timeline, panel chi tiết diff, bộ lọc đa tiêu chí, badge nổi bật phê duyệt hai cấp)

**Screen types:** Trang danh sách lịch sử (timeline list view); Modal/panel chi tiết sự kiện (diff view)

**Open items (non-blocking):** BR-006 giới hạn 90 ngày mặc định — cần xác nhận Admin có được xem toàn bộ không có giới hạn; Ánh xạ chính xác "Trưởng phòng QL Cảng" sang role slug trong actor-registry
