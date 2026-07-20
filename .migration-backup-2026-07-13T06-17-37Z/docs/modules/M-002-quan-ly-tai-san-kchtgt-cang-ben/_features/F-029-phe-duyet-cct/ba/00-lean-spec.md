---
feature-id: F-029
document: lean-spec
output-mode: lean
last-updated: 2026-06-27
---
# Phê duyệt Cảng cạn

## Summary
Cảng cạn mới tạo hoặc cập nhật phải trải qua quy trình phê duyệt bởi Lãnh đạo (A-002) hoặc Quản trị hệ thống (A-001) trước khi được kích hoạt chính thức. Tính năng cung cấp danh sách chờ phê duyệt, màn hình xem chi tiết kèm lịch sử thay đổi, và hành động phê duyệt/từ chối với lý do bắt buộc khi từ chối. Thành công khi toàn bộ Cảng cạn đưa vào khai thác đều có hồ sơ phê duyệt hợp lệ, không có trường hợp bypass kiểm duyệt.

## Scope

| | Items |
|---|---|
| In scope | Danh sách Cảng cạn chờ phê duyệt; Xem chi tiết + lịch sử thay đổi; Hành động Phê duyệt; Hành động Từ chối (bắt buộc lý do); Cập nhật trạng thái sau quyết định; Gửi thông báo cho người tạo; Chỉnh sửa và gửi lại khi bị từ chối |
| Out of scope | Phê duyệt hai cấp (Cục); Tự động phê duyệt theo quy tắc; Tích hợp hệ thống bên ngoài; Uỷ quyền phê duyệt động |
| Assumptions | Cảng cạn được tạo bởi F-026 với trạng thái mặc định "cho_phe_duyet"; Hệ thống thông báo nội bộ đã tồn tại; Lịch sử thay đổi được ghi bởi F-026/F-027/F-031 |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Lãnh đạo (A-002) / Quản trị hệ thống (A-001) | Xem danh sách Cảng cạn đang chờ phê duyệt | Không bỏ sót hồ sơ cần xử lý | Must Have |
| US-002 | Lãnh đạo (A-002) / Quản trị hệ thống (A-001) | Xem chi tiết Cảng cạn kèm lịch sử thay đổi trước khi quyết định | Có đủ thông tin để ra quyết định đúng đắn | Must Have |
| US-003 | Lãnh đạo (A-002) / Quản trị hệ thống (A-001) | Phê duyệt Cảng cạn | Kích hoạt Cảng cạn vào vận hành chính thức | Must Have |
| US-004 | Lãnh đạo (A-002) / Quản trị hệ thống (A-001) | Từ chối Cảng cạn kèm lý do | Trả hồ sơ về để chỉnh sửa với thông tin rõ ràng | Must Have |
| US-005 | Chuyên viên (A-003) / Người dùng tại Cảng (A-004) | Nhận thông báo kết quả phê duyệt | Biết trạng thái hồ sơ và hành động tiếp theo | Must Have |
| US-006 | Chuyên viên (A-003) / Người dùng tại Cảng (A-004) | Chỉnh sửa và gửi lại Cảng cạn bị từ chối | Hoàn thiện hồ sơ theo phản hồi của người phê duyệt | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001 | Hiển thị danh sách chờ phê duyệt đúng vai trò | Given: người dùng có vai trò ROLE_ADMIN hoặc ROLE_LEADER đăng nhập; When: truy cập trang danh sách phê duyệt Cảng cạn; Then: chỉ thấy danh sách Cảng cạn trạng thái "cho_phe_duyet", sắp xếp theo ngày tạo giảm dần, phân trang 20/trang | Vai trò khác nhận HTTP 403 |
| AC-002 | US-001 | Ẩn danh sách với vai trò không có quyền | Given: người dùng có vai trò ROLE_SPECIALIST hoặc ROLE_PORT_OPERATOR; When: gọi API GET /api/cang-can/phe-duyet; Then: nhận HTTP 403, không thấy danh sách | Security: không lộ dữ liệu |
| AC-003 | US-002 | Xem đầy đủ thông tin chi tiết kèm lịch sử | Given: người phê duyệt xem một bản ghi chờ phê duyệt; When: mở trang chi tiết; Then: hệ thống hiển thị đầy đủ 8 trường kỹ thuật (mã, tên, địa chỉ, loại hình, diện tích, năng lực, dịch vụ, toạ độ) và timeline lịch sử thay đổi theo thứ tự thời gian giảm dần | Lịch sử không được rỗng với bản ghi đã qua chỉnh sửa |
| AC-004 | US-003 | Phê duyệt thành công chuyển trạng thái | Given: Cảng cạn ở trạng thái "cho_phe_duyet"; When: người phê duyệt nhấn Phê duyệt và xác nhận; Then: trạng thái Cảng cạn chuyển sang "da_kich_hoat", audit log ghi nhận actor + thời gian UTC, thông báo được gửi đến người tạo | Không thể phê duyệt bản ghi đã ở trạng thái khác |
| AC-005 | US-004 | Từ chối bắt buộc có lý do | Given: Cảng cạn ở trạng thái "cho_phe_duyet"; When: người phê duyệt chọn Từ chối mà không điền lý do; Then: hệ thống chặn hành động và hiển thị lỗi validation "Lý do từ chối không được để trống" | Lý do tối thiểu 10 ký tự |
| AC-006 | US-004 | Từ chối thành công cập nhật trạng thái và gửi thông báo | Given: Cảng cạn ở trạng thái "cho_phe_duyet"; When: người phê duyệt điền lý do hợp lệ và xác nhận từ chối; Then: trạng thái Cảng cạn chuyển sang "bi_tu_choi", lý do được lưu vào YeuCauPheDuyet, thông báo gửi đến người tạo kèm lý do | Audit log ghi nhận đầy đủ |
| AC-007 | US-005 | Thông báo đến đúng người tạo | Given: quyết định phê duyệt hoặc từ chối được xác nhận; When: hệ thống xử lý xong; Then: thông báo nội bộ được gửi đến tài khoản người tạo Cảng cạn với nội dung kết quả và (nếu từ chối) lý do | Tối đa 30 giây từ lúc quyết định |
| AC-008 | US-006 | Gửi lại sau khi bị từ chối | Given: Cảng cạn ở trạng thái "bi_tu_choi"; When: Chuyên viên (A-003) hoặc Người dùng tại Cảng (A-004) chỉnh sửa và nhấn Gửi lại; Then: trạng thái chuyển về "cho_phe_duyet", yêu cầu phê duyệt mới được tạo, lịch sử ghi nhận lần gửi lại | Chỉ người tạo ban đầu mới được gửi lại |
| AC-009 | US-003/004 | Idempotency — không phê duyệt/từ chối hai lần | Given: Cảng cạn đã ở trạng thái "da_kich_hoat" hoặc "bi_tu_choi"; When: gọi lại API phê duyệt hoặc từ chối; Then: nhận HTTP 409 với thông báo "Trạng thái không hợp lệ để thực hiện hành động này" | Không thay đổi dữ liệu |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Chỉ Lãnh đạo (A-002) và Quản trị hệ thống (A-001) có quyền phê duyệt hoặc từ chối Cảng cạn | US-003, US-004 | Không có ngoại lệ |
| BR-002 | Chỉ Cảng cạn có trạng thái "cho_phe_duyet" mới được thực hiện hành động phê duyệt hoặc từ chối | US-003, US-004 | Nếu trạng thái khác → HTTP 409 |
| BR-003 | Hành động Từ chối bắt buộc cung cấp lý do tối thiểu 10 ký tự, không được để trống | US-004 | Không có ngoại lệ |
| BR-004 | Mọi thay đổi trạng thái Cảng cạn do phê duyệt phải ghi audit log: actor, thời gian UTC, trạng thái cũ/mới, lý do (nếu từ chối) | US-003, US-004 | Không có ngoại lệ |
| BR-005 | Thông báo kết quả phải được gửi đến người tạo Cảng cạn trong vòng 30 giây sau khi quyết định | US-005 | Nếu hệ thống thông báo lỗi, ghi log nhưng không rollback quyết định |
| BR-006 | Chỉ người tạo ban đầu mới có thể chỉnh sửa và gửi lại Cảng cạn bị từ chối | US-006 | Quản trị hệ thống (A-001) có thể thay mặt người tạo |
| BR-007 | Danh sách chờ phê duyệt chỉ hiển thị Cảng cạn trạng thái "cho_phe_duyet", không lẫn trạng thái khác | US-001 | Không có ngoại lệ |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | API GET danh sách chờ phê duyệt phải trả về trong thời gian chấp nhận được | ≤ 500ms p95 với tối đa 200 bản ghi |
| Security | Kiểm tra quyền tại server-side cho mọi hành động phê duyệt/từ chối; không tin tưởng client-side role | HTTP 403 khi vi phạm; không lộ dữ liệu nội dung cho người không có quyền |
| Reliability | Quyết định phê duyệt/từ chối phải được ghi nhận atomically (trạng thái + audit log + trigger thông báo trong 1 transaction) | Không mất dữ liệu khi lỗi partial; rollback toàn bộ nếu DB error |
| Audit/Logging | Mọi hành động phê duyệt và từ chối phải ghi audit log đầy đủ | Actor, timestamp UTC, trạng thái cũ/mới, lý do (nếu từ chối), IP nguồn |
| Operability | API endpoint phê duyệt/từ chối phải có rate limiting để tránh spam | Tối đa 10 requests/phút/user cho endpoint PUT /api/cang-can/{id}/phe-duyet |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | ROLE_ADMIN thấy danh sách chờ phê duyệt | Integration |
| TS-002 | AC-001 | ROLE_LEADER thấy danh sách chờ phê duyệt | Integration |
| TS-003 | AC-002 | ROLE_SPECIALIST nhận 403 khi truy cập danh sách | Security |
| TS-004 | AC-003 | Chi tiết hiển thị đủ 8 trường + lịch sử thay đổi | Integration |
| TS-005 | AC-004 | Phê duyệt thành công → trạng thái da_kich_hoat | Integration |
| TS-006 | AC-005 | Từ chối không có lý do → validation error | Unit |
| TS-007 | AC-006 | Từ chối có lý do → trạng thái bi_tu_choi + thông báo | Integration |
| TS-008 | AC-007 | Thông báo gửi đến đúng người tạo trong 30s | Integration |
| TS-009 | AC-008 | Gửi lại sau từ chối → trạng thái cho_phe_duyet | Integration |
| TS-010 | AC-009 | Phê duyệt lần 2 → HTTP 409 | Integration |
| TS-011 | AC-009 | Từ chối lần 2 → HTTP 409 | Integration |
| TS-012 | BR-006 | Người khác không tạo không được gửi lại | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Entities CangCan và YeuCauPheDuyet đã được định nghĩa trong feature-brief F-029; F-026 đã tạo aggregate root; F-029 chỉ thêm transition logic trên model có sẵn |
| Architecture affected? | Yes | Cần định nghĩa state machine cho CangCan (cho_phe_duyet → da_kich_hoat / bi_tu_choi), notification trigger mechanism, và permission endpoint mới |
| Implementation clear? | No | Chưa có SA artifact xác nhận cách implement state machine và notification trong codebase hiện tại |
| **Verdict** | `Ready for solution architecture` | Không tạo bounded context mới nhưng cần SA xác định state machine pattern, notification integration, và RBAC endpoint |
