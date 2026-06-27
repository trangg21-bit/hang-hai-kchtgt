---
feature-id: F-017
document: lean-spec
output-mode: lean
last-updated: 2026-06-27
---
# Phê duyệt Bến cảng

## Summary
Bến cảng sau khi tạo mới hoặc cập nhật phải trải qua bước phê duyệt bắt buộc trước khi được đưa vào trạng thái hiện hành, nhằm đảm bảo chất lượng và tính hợp lệ kỹ thuật của dữ liệu. Tính năng cung cấp giao diện cho người có thẩm quyền (Quản trị viên hoặc Người phê duyệt) xem xét toàn bộ thông tin kỹ thuật, bản đồ vị trí, lịch sử thay đổi, rồi chấp thuận hoặc từ chối với lý do cụ thể. Thành công khi mọi Bến cảng chờ phê duyệt đều được xử lý đúng quyền, đúng trạng thái, và người tạo nhận được thông báo kết quả.

## Scope

| | Items |
|---|---|
| In scope | Danh sách Bến cảng chờ phê duyệt (tạo mới và cập nhật); Trang chi tiết với thông tin kỹ thuật đầy đủ + bản đồ GPS + lịch sử thay đổi; Hành động chấp thuận/từ chối; Trường lý do từ chối (bắt buộc); Cập nhật trạng thái Bến cảng sau phê duyệt; Ghi nhật ký PheDuyetLog; Thông báo kết quả đến người tạo |
| Out of scope | Phê duyệt xóa Bến cảng; Phê duyệt hàng loạt; Tự động phê duyệt theo quy tắc; Phê duyệt đa cấp; Xuất báo cáo phê duyệt ra Excel/PDF |
| Assumptions | Bến cảng được tạo bởi F-016 (Tạo mới Bến cảng) đã tồn tại trong hệ thống với trạng thái cho_phe_duyet; Hệ thống thông báo (notification) đã có cơ chế nền; Bản đồ GPS đã được tích hợp sẵn ở các màn hình khác |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Người phê duyệt (A-001/A-002) | Xem danh sách Bến cảng đang chờ phê duyệt | Biết khối lượng công việc và ưu tiên xử lý | Must Have |
| US-002 | Người phê duyệt (A-001/A-002) | Xem chi tiết đầy đủ thông tin kỹ thuật + lịch sử của Bến cảng | Đánh giá đúng tính hợp lệ trước khi quyết định | Must Have |
| US-003 | Người phê duyệt (A-001/A-002) | Chấp thuận một Bến cảng chờ phê duyệt | Đưa Bến cảng hợp lệ vào trạng thái hiện hành | Must Have |
| US-004 | Người phê duyệt (A-001/A-002) | Từ chối một Bến cảng với lý do rõ ràng | Trả về cho người tạo để chỉnh sửa, tránh dữ liệu sai | Must Have |
| US-005 | Người tạo (A-003/A-004) | Nhận thông báo kết quả phê duyệt | Biết cần làm gì tiếp theo (chỉnh sửa hoặc tiếp tục) | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001 | Hiển thị danh sách đúng quyền | Given user có ROLE_ADMIN hoặc ROLE_APPROVER; When truy cập trang danh sách chờ phê duyệt; Then thấy đúng danh sách Bến cảng có trangThai=cho_phe_duyet | User thiếu quyền nhận 403 và không thấy menu mục này |
| AC-002 | US-001 | Từ chối hiển thị với user không có quyền | Given user có role khác (A-003 Specialist, A-004 Port Operator); When cố truy cập URL danh sách phê duyệt; Then hệ thống trả về HTTP 403 và ẩn mục menu | Kiểm tra cả direct URL access |
| AC-003 | US-002 | Chi tiết đầy đủ thông tin kỹ thuật | Given user mở trang chi tiết một Bến cảng chờ phê duyệt; When trang tải xong; Then hiển thị: mã bến, tên bến, Cảng mẹ, chiều dài, chiều rộng, loại bến, độ sâu luồng, tọa độ GPS trên bản đồ, lịch sử thay đổi | Tất cả các trường kỹ thuật bắt buộc phải hiển thị |
| AC-004 | US-003 | Chấp thuận thành công | Given Bến cảng đang ở trangThai=cho_phe_duyet; When người phê duyệt nhấn Chấp thuận (lý do tùy chọn); Then trangThai chuyển sang hien_hanh, PheDuyetLog ghi nhận quyetDinh=chap_thuan, thông báo gửi đến người tạo | Transition atomic: update + log trong cùng transaction |
| AC-005 | US-004 | Từ chối yêu cầu lý do bắt buộc | Given người phê duyệt chọn Từ chối và để trống trường lý do; When submit; Then hệ thống block hành động và hiển thị validation error "Lý do từ chối là bắt buộc" | Không ghi log, không đổi trạng thái khi thiếu lý do |
| AC-006 | US-004 | Từ chối thành công với lý do | Given người phê duyệt chọn Từ chối và nhập lý do hợp lệ; When submit; Then trangThai chuyển sang cho_phe_duyet (retained, pending re-submit) hoặc bi_tu_choi (nếu có state), PheDuyetLog ghi nhận quyetDinh=tu_choi và lyDo, thông báo gửi đến người tạo kèm lý do | lyDo lưu trong PheDuyetLog và gửi kèm thông báo |
| AC-007 | US-005 | Thông báo kết quả tới người tạo | Given phê duyệt (chấp thuận hoặc từ chối) hoàn tất; When trạng thái được cập nhật; Then người tạo nhận thông báo in-app chứa tên Bến cảng, kết quả quyết định, và lý do (nếu từ chối) | Thông báo in-app tối thiểu; email là tùy chọn |
| AC-008 | US-003/US-004 | Nhật ký phê duyệt bất biến | Given bất kỳ hành động phê duyệt nào; When hoàn tất; Then PheDuyetLog ghi đủ: benCangId, nguoiPheDuyet, quyetDinh, lyDo, thoiGianPheDuyet; log không được phép sửa/xóa sau khi tạo | Enforce bằng thiếu UPDATE/DELETE permission trên bảng |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Bến cảng mới tạo mặc định trangThai=cho_phe_duyet; chỉ chuyển sang hien_hanh sau khi được chấp thuận bởi người có thẩm quyền | AC-004, AC-006 | Không có ngoại lệ |
| BR-002 | Lý do từ chối là trường bắt buộc (not null, not blank); hệ thống phải block hành động từ chối nếu thiếu lý do | AC-005 | Không có ngoại lệ |
| BR-003 | Mỗi Bến cảng áp dụng phê duyệt đơn cấp duy nhất; không hỗ trợ multi-level approval | AC-004 | Không có ngoại lệ theo scope hiện tại |
| BR-004 | Nhật ký PheDuyetLog phải được lưu trữ vĩnh viễn; không cho phép UPDATE hoặc DELETE sau khi ghi nhận | AC-008 | Không có ngoại lệ |
| BR-005 | Chỉ user có ROLE_ADMIN hoặc ROLE_APPROVER mới có quyền thực hiện hành động phê duyệt; kiểm tra tại cả API layer và UI layer | AC-001, AC-002 | Không có ngoại lệ |
| BR-006 | Thao tác cập nhật trạng thái Bến cảng và ghi PheDuyetLog phải atomic trong cùng một database transaction | AC-004, AC-006 | Rollback toàn bộ nếu bất kỳ bước nào thất bại |
| BR-007 | Thông báo kết quả phải được gửi đến người tạo sau mỗi quyết định phê duyệt (chấp thuận hoặc từ chối); thông báo bao gồm lý do từ chối nếu có | AC-007 | Lỗi gửi thông báo không được rollback transaction phê duyệt chính |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Trang danh sách chờ phê duyệt load trong thời gian chấp nhận được với dữ liệu thực tế | Phản hồi API < 2 giây với ≤ 500 Bến cảng chờ phê duyệt |
| Security | Kiểm tra quyền RBAC tại API layer (Spring Security @PreAuthorize); ẩn menu và nút hành động với user không đủ quyền tại UI | HTTP 403 cho mọi unauthorized access; không lộ thông tin nhạy cảm trong response body |
| Reliability | Giao dịch phê duyệt atomic; không mất trạng thái giữa chừng | Rollback hoàn toàn nếu update trạng thái hoặc ghi log thất bại; uptime 99.5% |
| Audit/Logging | Mọi hành động phê duyệt (thành công, bị chặn, lỗi quyền) được ghi log đầy đủ với userId, timestamp, benCangId, quyetDinh, lyDo | PheDuyetLog bất biến; application log cho security events |
| Operability | Thông báo kết quả phê duyệt gửi in-app không blocking transaction chính; lỗi notification không ảnh hưởng core flow | Notification failure rate < 1%; có retry mechanism cho notification |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | ROLE_ADMIN truy cập danh sách chờ phê duyệt thành công | Integration |
| TS-002 | AC-001 | ROLE_APPROVER truy cập danh sách chờ phê duyệt thành công | Integration |
| TS-003 | AC-002 | ROLE_SPECIALIST truy cập URL danh sách nhận 403 | Integration |
| TS-004 | AC-002 | ROLE_PORT_OPERATOR truy cập URL chi tiết nhận 403 | Integration |
| TS-005 | AC-003 | Chi tiết hiển thị đủ 8 trường kỹ thuật + bản đồ + lịch sử | UI/E2E |
| TS-006 | AC-004 | Chấp thuận thành công: trangThai=hien_hanh, log ghi đúng | Integration |
| TS-007 | AC-004 | Chấp thuận có lý do tùy chọn: log ghi đúng lyDo | Integration |
| TS-008 | AC-005 | Từ chối không có lý do: hệ thống block, không đổi trạng thái | Unit + Integration |
| TS-009 | AC-006 | Từ chối với lý do hợp lệ: trạng thái và log cập nhật đúng | Integration |
| TS-010 | AC-007 | Thông báo in-app gửi đến người tạo sau chấp thuận | Integration |
| TS-011 | AC-007 | Thông báo in-app gửi đến người tạo sau từ chối, kèm lý do | Integration |
| TS-012 | AC-008 | PheDuyetLog không thể UPDATE sau khi tạo | Unit |
| TS-013 | AC-004/AC-006 | Rollback khi ghi log thất bại: trangThai không đổi | Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes | Cần aggregate BenCang với lifecycle state machine (cho_phe_duyet → hien_hanh / bi_tu_choi) và entity mới PheDuyetLog chưa có trong domain hiện tại |
| Architecture affected? | Yes | Cần notification service integration, atomic transaction spanning 2 entities (BenCang + PheDuyetLog), RBAC permission mới ROLE_APPROVER |
| Implementation clear? | No | Cần SA xác định: transaction boundary, notification mechanism (async/sync), state machine transitions, RBAC mapping cho ROLE_APPROVER vào permission-matrix |
| **Verdict** | `Ready for solution architecture` | Domain model tạo mới PheDuyetLog entity và approval workflow; SA cần xác định kiến trúc trước khi implement |
