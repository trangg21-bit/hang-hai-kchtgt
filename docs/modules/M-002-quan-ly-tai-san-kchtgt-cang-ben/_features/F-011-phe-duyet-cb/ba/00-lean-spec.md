---
feature-id: F-011
document: lean-spec
output-mode: lean
last-updated: 2026-07-30
---

# Phê duyệt Cảng biển

> **Consolidation Note:** F-011 đã được merged với UI feature F-072 (ui-phe-duyet-cb) theo TRI-1785205768654-0f93 ngày 2026-07-28. Nội dung lean-spec này đã tích hợp toàn bộ đặc tả UI từ F-072.
>
> **Chuẩn trạng thái (đã chốt — M-1006 DP-9/AC-25):** mọi chuyển trạng thái trong tài liệu này tuân theo **7 trạng thái, tối đa 2 cấp** tại tài liệu nền `ba/01-base-pattern.md` mục 3.5 (= `docs/conventions/approval-2-level-spec.md` §3.1 = `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` Phụ lục kỹ thuật): `PENDING_APPROVAL` → `APPROVED_LEVEL1` → `APPROVED`; trả về → `REJECTED_LEVEL1` / `REJECTED_LEVEL2`. `REJECTED` (6) là giá trị legacy, **không dùng trong luồng thống nhất**.

## Summary

Cảng biển sau khi tạo mới hoặc cập nhật cần qua bước kiểm soát chất lượng bắt buộc trước khi được kích hoạt trong hệ thống. Tính năng cung cấp giao diện `PortApprovalPage` cho Lãnh đạo và Admin xem xét toàn bộ thông tin, ra quyết định Chấp thuận hoặc Từ chối kèm lý do, ghi nhật ký bất biến (approval_log) và thông báo kết quả đến người tạo. Confirmation dialog hiển thị trước mọi hành động để tránh thao tác nhầm. Thành công khi 100% Cảng biển trạng thái "Hiện hành" đều đã trải qua phê duyệt có thẩm quyền và nhật ký đầy đủ.

## Scope

| | Items |
|---|---|
| In scope | Danh sách Cảng biển chờ phê duyệt (`PENDING_APPROVAL` — vòng 1; `APPROVED_LEVEL1` — vòng 2; tạo mới + cập nhật); Trang chi tiết với lịch sử thay đổi; Giao diện Chấp thuận / Từ chối kèm confirmation dialog; Trường lý do từ chối (bắt buộc, tối thiểu 10 ký tự); Cập nhật `approval_status` của port; Ghi approval_log bất biến; Toast thông báo thành công/lỗi; Thông báo kết quả đến người tạo; Làm mới danh sách sau mỗi hành động |
| Out of scope | Phê duyệt xóa Cảng biển; Phê duyệt hàng loạt; Tự động phê duyệt; Xuất báo cáo phê duyệt; Chỉnh sửa thông tin cảng (thuộc F-071); Xóa mềm cảng (thuộc F-093); Thông báo email khi phê duyệt/từ chối |
| Assumptions | Cảng biển ở trạng thái "Chờ phê duyệt" được tạo bởi F-008 (tạo mới) hoặc F-009 (cập nhật); Thông báo dùng cơ chế notification nội bộ đã có sẵn trong platform |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-011-01 | Lãnh đạo (A-002) / Admin | Xem danh sách Cảng biển chờ phê duyệt | Biết các mục cần xử lý mà không phải tìm thủ công | Must Have |
| US-011-02 | Lãnh đạo (A-002) / Admin | Xem chi tiết Cảng biển kèm lịch sử thay đổi | Có đủ ngữ cảnh để ra quyết định chính xác | Must Have |
| US-011-03 | Lãnh đạo (A-002) / Admin | Chấp thuận Cảng biển chờ phê duyệt | Kích hoạt Cảng biển vào trạng thái hoạt động "Hiện hành" | Must Have |
| US-011-04 | Lãnh đạo (A-002) / Admin | Từ chối Cảng biển kèm lý do bắt buộc (tối thiểu 10 ký tự) | Trả hồ sơ với hướng dẫn rõ ràng cho người tạo | Must Have |
| US-011-05 | Người tạo (A-003/A-004) | Nhận thông báo kết quả phê duyệt | Biết ngay trạng thái hồ sơ và hành động cần làm tiếp theo | Must Have |
| US-011-06 | Lãnh đạo (A-002) / Admin | Hệ thống hiển thị confirmation dialog trước khi thực hiện phê duyệt/từ chối | Tránh thao tác nhầm dẫn đến hậu quả không mong muốn | Must Have |
| US-011-07 | Lãnh đạo (A-002) / Admin | Hệ thống không cho phép lưu Từ chối khi lý do ít hơn 10 ký tự | Bảo đảm chất lượng phản hồi và trách nhiệm giải trình | Must Have |
| US-011-08 | Nhân viên vận hành (A-005) | Xem trạng thái phê duyệt của Cảng biển | Biết được tiến độ xử lý hồ sơ | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-011-01 | US-011-01 | Chỉ người có thẩm quyền (Lãnh đạo/Admin) thấy danh sách chờ duyệt | Given người dùng đăng nhập với vai trò Lãnh đạo hoặc Admin; When truy cập PortApprovalPage; Then thấy danh sách Cảng biển trạng thái `PENDING_APPROVAL` | Chuyên viên / Người dùng tại Cảng / Nhân viên vận hành không thấy menu này |
| AC-011-02 | US-011-01 | Người không có quyền bị chặn | Given người dùng vai trò Chuyên viên (A-003); When cố truy cập URL hoặc gọi API danh sách phê duyệt; Then nhận HTTP 403 Forbidden | Áp dụng cả API endpoint và UI route |
| AC-011-03 | US-011-02 | Xem chi tiết + lịch sử khi là cập nhật | Given Cảng biển chờ phê duyệt do cập nhật; When người phê duyệt mở chi tiết; Then hiển thị toàn bộ thông tin hiện tại VÀ tab lịch sử thay đổi (delta field-by-field) | |
| AC-011-04 | US-011-02 | Xem chi tiết khi là tạo mới | Given Cảng biển chờ phê duyệt do tạo mới; When người phê duyệt mở chi tiết; Then hiển thị toàn bộ thông tin; tab lịch sử rỗng hoặc ẩn | |
| AC-011-05 | US-011-03 | Chấp thuận thành công | Given Cảng biển trạng thái chờ duyệt đúng cấp (`PENDING_APPROVAL` — vòng 1 hoặc `APPROVED_LEVEL1` — vòng 2); When người phê duyệt chọn Chấp thuận → confirmation dialog → xác nhận; Then `approval_status` chuyển sang cấp kế tiếp: vòng 1 → `APPROVED_LEVEL1` (chờ Cục duyệt), vòng 2 hoặc đơn vị gửi cấp Cục bỏ vòng 1 → `APPROVED`; approval_log ghi nhận, toast "Đã phê duyệt thành công", thông báo gửi người tạo, danh sách được làm mới | |
| AC-011-06 | US-011-03 | Lý do chấp thuận tùy chọn nhưng được lưu | Given người phê duyệt nhập lý do chấp thuận (tùy chọn); When xác nhận; Then lý do được lưu vào approval_log.reason | |
| AC-011-07 | US-011-04 | Từ chối thành công khi có lý do hợp lệ | Given người phê duyệt nhập lý do từ chối (>= 10 ký tự); When chọn Từ chối → confirmation dialog → xác nhận; Then `approval_status` chuyển `REJECTED_LEVEL1` (vòng 1 trả về) hoặc `REJECTED_LEVEL2` (vòng 2 trả về), approval_log ghi nhận kèm lý do, toast "Đã từ chối", thông báo kèm lý do gửi người tạo, danh sách được làm mới | |
| AC-011-08 | US-011-07 | Từ chối bị chặn khi lý do không hợp lệ | Given người phê duyệt nhập lý do ít hơn 10 ký tự hoặc để trống; When cố xác nhận Từ chối; Then hệ thống hiển thị lỗi "Lý do từ chối phải có ít nhất 10 ký tự", không lưu, không thay đổi trạng thái | Validation phía client VÀ server |
| AC-011-09 | US-011-05 | Thông báo kết quả đến người tạo | Given phê duyệt hoàn tất (chấp thuận hoặc từ chối); When hệ thống xử lý xong; Then người tạo nhận thông báo trong hệ thống kèm kết quả và lý do (nếu từ chối) | |
| AC-011-10 | US-011-03/04 | Confirmation dialog trước mọi hành động | Given người phê duyệt click nút Phê duyệt hoặc Từ chối; When hệ thống chưa gửi request; Then hiển thị confirmation dialog yêu cầu xác nhận lại; chỉ khi người dùng xác nhận mới gửi request | |
| AC-011-11 | US-011-03/04 | Nhật ký phê duyệt bất biến | Given approval_log đã được ghi; When bất kỳ người dùng nào (kể cả Admin) cố xóa/sửa; Then hệ thống từ chối thao tác; log không thay đổi | |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-011-01 | Cảng biển tạo mới hoặc cập nhật phải đi qua quy trình 2 cấp: `PENDING_APPROVAL` → (vòng 1 duyệt) `APPROVED_LEVEL1` → (vòng 2 duyệt) `APPROVED` (Hiện hành); đơn vị gửi cấp Cục có thể bỏ vòng 1 | Tất cả port | Không có ngoại lệ |
| BR-011-02 | Lý do từ chối là bắt buộc, tối thiểu 10 ký tự; hệ thống chặn lưu nếu không đáp ứng | US-011-04, US-011-07, AC-011-07, AC-011-08 | Không có ngoại lệ |
| BR-011-03 | Phê duyệt tối đa 2 cấp: vòng 1 = Cảng vụ/Chi cục, vòng 2 = Cục; số vòng phụ thuộc đơn vị gửi (theo tài liệu nền mục 3.5) | Tất cả luồng phê duyệt | Không có ngoại lệ |
| BR-011-04 | approval_log là bất biến sau khi ghi nhận; không được xóa hoặc sửa | approval_log | Không có ngoại lệ kể cả Admin |
| BR-011-05 | Lý do chấp thuận là tùy chọn nhưng được khuyến khích để đảm bảo minh bạch | US-011-03 | Không áp dụng validation bắt buộc |
| BR-011-06 | Chỉ Lãnh đạo (A-002) và Admin mới thực hiện được hành động Phê duyệt/Từ chối | RBAC | Admin có toàn quyền phê duyệt nghiệp vụ; Người tạo/Nhân viên vận hành không |

## API Endpoints

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/ports?approval_status=PENDING_APPROVAL` (vòng 1) / `APPROVED_LEVEL1` (vòng 2) | Danh sách Cảng biển chờ phê duyệt của cấp hiện tại | Lãnh đạo, Admin |
| POST | `/api/v1/ports/:id/approve` | Phê duyệt Cảng biển theo cấp hiện tại (vòng 1 → `APPROVED_LEVEL1`; vòng 2 hoặc bỏ vòng 1 → `APPROVED`), tạo approval_log | Lãnh đạo, Admin |
| POST | `/api/v1/ports/:id/reject` | Từ chối Cảng biển → `REJECTED_LEVEL1` (vòng 1) hoặc `REJECTED_LEVEL2` (vòng 2), bắt buộc lý do >= 10 ký tự, tạo approval_log | Lãnh đạo, Admin |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Tải trang danh sách chờ duyệt và chi tiết Cảng biển kèm lịch sử thay đổi | ≤ 2 giây (p95, mạng nội bộ) |
| Security | Kiểm tra phân quyền tại cả API layer và UI; không lộ dữ liệu "Chờ phê duyệt" cho vai trò không có quyền | HTTP 403 trả về đúng; không trả 200 với body rỗng |
| Reliability | Ghi approval_log phải atomic với cập nhật trạng thái port (trong cùng transaction) | 0% log mất khi transaction thành công |
| Audit/Logging | Mọi hành động phê duyệt (chấp thuận / từ chối) ghi vào approval_log với thông tin người phê duyệt, timestamp, quyết định, lý do | Lưu vĩnh viễn; không xóa được |
| Operability | Thông báo kết quả đến người tạo trong vòng thời gian thực hoặc cơ chế polling ≤ 30 giây | Người tạo không cần refresh thủ công |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-011-01 | AC-011-01, AC-011-02 | Kiểm tra phân quyền: Lãnh đạo/Admin thấy danh sách; Chuyên viên nhận 403 | Security / Integration |
| TS-011-02 | AC-011-03 | Xem chi tiết Cảng biển cập nhật: hiển thị đúng delta lịch sử | Integration |
| TS-011-03 | AC-011-04 | Xem chi tiết Cảng biển tạo mới: không có lịch sử thay đổi | Integration |
| TS-011-04 | AC-011-05, AC-011-09 | Luồng chấp thuận: trạng thái chuyển cấp theo quy trình 2 cấp (vòng 1 → `APPROVED_LEVEL1`, vòng 2 → `APPROVED`), log ghi đúng, toast, thông báo gửi | Integration / E2E |
| TS-011-05 | AC-011-07, AC-011-09 | Luồng từ chối có lý do (>= 10 ký tự): trạng thái → `REJECTED_LEVEL1` / `REJECTED_LEVEL2` theo cấp trả về, toast, thông báo kèm lý do | Integration / E2E |
| TS-011-06 | AC-011-08 | Từ chối thiếu lý do / < 10 ký tự: validation chặn cả client và server | Unit / Integration |
| TS-011-07 | AC-011-10 | Confirmation dialog hiển thị trước khi gửi request Phê duyệt/Từ chối | UI / Integration |
| TS-011-08 | AC-011-11 | Nhật ký bất biến: Admin cố xóa approval_log bị từ chối | Security / Unit |
| TS-011-09 | AC-011-06 | Lý do chấp thuận tùy chọn được lưu khi nhập | Unit |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes | approval_log là entity mới; trạng thái port có transition theo quy trình 2 cấp (`PENDING_APPROVAL → APPROVED_LEVEL1 → APPROVED`; trả về `REJECTED_LEVEL1` / `REJECTED_LEVEL2`); workflow approval là bounded context mới |
| Architecture affected? | Yes | Thêm notification service dependency; approval_log cần immutability constraint tại DB layer; RBAC phải phân biệt quyền phê duyệt nghiệp vụ vs quyền xem |
| Implementation clear? | Yes | Approval workflow pattern đã được xác lập; UI scope từ F-072 đã merged; SA xác nhận RBAC mapping |
| **Verdict** | `Ready for solution architecture` | Domain model mới (approval_log) + architectural decisions cần SA |
