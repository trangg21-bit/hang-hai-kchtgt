---
feature-id: F-023
document: lean-spec
output-mode: lean
last-updated: 2026-06-27
---
# Phê duyệt Cầu cảng

## Summary

Cầu cảng sau khi tạo mới hoặc cập nhật cần qua bước kiểm soát chất lượng bắt buộc trước khi được kích hoạt trong hệ thống. Tính năng cung cấp giao diện cho Lãnh đạo/Người phê duyệt xem xét toàn bộ thông tin, ra quyết định Chấp thuận hoặc Từ chối kèm lý do, ghi nhật ký bất biến và thông báo kết quả đến người tạo. Thành công khi 100% Cầu cảng trạng thái "Hiện hành" đều đã trải qua phê duyệt có thẩm quyền và nhật ký đầy đủ.

## Scope

| | Items |
|---|---|
| In scope | Danh sách Cầu cảng chờ phê duyệt (tạo mới + cập nhật); Trang chi tiết với lịch sử thay đổi; Giao diện Chấp thuận / Từ chối; Trường lý do từ chối (bắt buộc); Cập nhật trạng thái CauCang; Ghi PheDuyetLog bất biến; Thông báo kết quả đến người tạo |
| Out of scope | Phê duyệt xóa Cầu cảng; Phê duyệt hàng loạt; Tự động phê duyệt; Phê duyệt đa cấp; Xuất báo cáo phê duyệt |
| Assumptions | Cầu cảng ở trạng thái "Chờ phê duyệt" được tạo bởi F-020 (tạo mới) hoặc F-021 (cập nhật); Thông báo dùng cơ chế notification nội bộ đã có sẵn trong platform (pattern đã xác lập tại F-011) |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Lãnh đạo (A-002) | Xem danh sách Cầu cảng chờ phê duyệt | Biết các mục cần xử lý mà không phải tìm thủ công | Must Have |
| US-002 | Lãnh đạo (A-002) | Xem chi tiết Cầu cảng kèm lịch sử thay đổi | Có đủ ngữ cảnh để ra quyết định chính xác | Must Have |
| US-003 | Lãnh đạo (A-002) | Chấp thuận Cầu cảng chờ phê duyệt | Kích hoạt Cầu cảng vào trạng thái hoạt động "Hiện hành" | Must Have |
| US-004 | Lãnh đạo (A-002) | Từ chối Cầu cảng kèm lý do bắt buộc | Trả hồ sơ về Chỉnh sửa với hướng dẫn rõ ràng cho người tạo | Must Have |
| US-005 | Chuyên viên (A-003) / Người dùng tại Cảng (A-004) | Nhận thông báo kết quả phê duyệt | Biết ngay trạng thái hồ sơ và hành động cần làm tiếp theo | Must Have |
| US-006 | Lãnh đạo (A-002) | Hệ thống không cho phép lưu Từ chối khi thiếu lý do | Bảo đảm chất lượng phản hồi và trách nhiệm giải trình | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001 | Chỉ người có thẩm quyền thấy danh sách | Given người dùng đăng nhập với vai trò Lãnh đạo; When truy cập module phê duyệt Cầu cảng; Then thấy danh sách Cầu cảng trạng thái "Chờ phê duyệt" | Chuyên viên / Người dùng tại Cảng / Public User không thấy menu này |
| AC-002 | US-001 | Người không có quyền bị chặn | Given người dùng vai trò Chuyên viên (A-003); When cố truy cập URL danh sách phê duyệt Cầu cảng; Then nhận HTTP 403 Forbidden | Áp dụng cả API endpoint |
| AC-003 | US-002 | Xem chi tiết + lịch sử khi là cập nhật | Given Cầu cảng chờ phê duyệt do cập nhật; When người phê duyệt mở chi tiết; Then hiển thị toàn bộ thông tin hiện tại VÀ tab lịch sử thay đổi (delta field-by-field) | |
| AC-004 | US-002 | Xem chi tiết khi là tạo mới | Given Cầu cảng chờ phê duyệt do tạo mới; When người phê duyệt mở chi tiết; Then hiển thị toàn bộ thông tin; tab lịch sử rỗng hoặc ẩn | |
| AC-005 | US-003 | Chấp thuận thành công | Given Cầu cảng trạng thái "Chờ phê duyệt"; When người phê duyệt chọn Chấp thuận và xác nhận; Then trạng thái chuyển "Hiện hành", PheDuyetLog ghi nhận, thông báo gửi người tạo | |
| AC-006 | US-003 | Lý do chấp thuận tùy chọn nhưng được lưu | Given người phê duyệt nhập lý do chấp thuận (tùy chọn); When xác nhận; Then lý do được lưu vào PheDuyetLog.lyDo | |
| AC-007 | US-004 | Từ chối thành công khi có lý do | Given người phê duyệt nhập lý do từ chối; When chọn Từ chối và xác nhận; Then trạng thái Cầu cảng chuyển "Chỉnh sửa", PheDuyetLog ghi nhận, thông báo kèm lý do gửi người tạo | |
| AC-008 | US-006 | Từ chối bị chặn khi thiếu lý do | Given người phê duyệt chọn Từ chối nhưng để trống trường lý do; When cố xác nhận; Then hệ thống hiển thị lỗi validation, không lưu, không thay đổi trạng thái | Validation phía client VÀ server |
| AC-009 | US-005 | Thông báo kết quả đến người tạo | Given phê duyệt hoàn tất (chấp thuận hoặc từ chối); When hệ thống xử lý xong; Then người tạo nhận thông báo trong hệ thống kèm kết quả và lý do (nếu từ chối) | |
| AC-010 | US-003/004 | Nhật ký phê duyệt bất biến | Given PheDuyetLog đã được ghi; When bất kỳ người dùng nào (kể cả Admin) cố xóa/sửa; Then hệ thống từ chối thao tác; log không thay đổi | |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Cầu cảng tạo mới hoặc cập nhật phải có trạng thái "Chờ phê duyệt" trước khi hiển thị trạng thái hoạt động | Tất cả CauCang | Không có ngoại lệ |
| BR-002 | Lý do từ chối là bắt buộc; hệ thống chặn lưu khi trường trống | US-004, AC-008 | Không có ngoại lệ |
| BR-003 | Chỉ một cấp phê duyệt duy nhất; không áp dụng multi-level approval | Tất cả luồng phê duyệt | Không có ngoại lệ |
| BR-004 | PheDuyetLog là bất biến sau khi ghi nhận; không được xóa hoặc sửa | PheDuyetLog | Không có ngoại lệ kể cả Admin |
| BR-005 | Lý do chấp thuận là tùy chọn nhưng được khuyến khích để đảm bảo minh bạch | US-003 | Không áp dụng validation bắt buộc |
| BR-006 | Chỉ người dùng vai trò Lãnh đạo (A-002) hoặc được ủy quyền tường minh mới thực hiện được phê duyệt | RBAC | Quản trị hệ thống (A-001) không tự động có quyền phê duyệt nghiệp vụ |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Tải trang chi tiết Cầu cảng kèm lịch sử thay đổi | ≤ 2 giây (p95, mạng nội bộ) |
| Security | Kiểm tra phân quyền tại cả API layer và UI; không lộ dữ liệu "Chờ phê duyệt" cho vai trò không có quyền | HTTP 403 trả về đúng; không trả 200 với body rỗng |
| Reliability | Ghi PheDuyetLog phải atomic với cập nhật trạng thái CauCang (trong cùng transaction) | 0% log mất khi transaction thành công |
| Audit/Logging | Mọi hành động phê duyệt (chấp thuận / từ chối) ghi vào PheDuyetLog với thông tin người phê duyệt, timestamp, quyết định, lý do | Lưu vĩnh viễn; không xóa được |
| Operability | Thông báo kết quả đến người tạo trong vòng thực hoặc cơ chế polling ≤ 30 giây | Người tạo không cần refresh thủ công |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001, AC-002 | Kiểm tra phân quyền: Lãnh đạo thấy danh sách; Chuyên viên nhận 403 | Security / Integration |
| TS-002 | AC-003 | Xem chi tiết Cầu cảng cập nhật: hiển thị đúng delta lịch sử | Integration |
| TS-003 | AC-004 | Xem chi tiết Cầu cảng tạo mới: không có lịch sử thay đổi | Integration |
| TS-004 | AC-005, AC-009 | Luồng chấp thuận: trạng thái → "Hiện hành", log ghi đúng, thông báo gửi | Integration / E2E |
| TS-005 | AC-007, AC-009 | Luồng từ chối có lý do: trạng thái → "Chỉnh sửa", thông báo kèm lý do | Integration / E2E |
| TS-006 | AC-008 | Từ chối thiếu lý do: validation chặn cả client và server | Unit / Integration |
| TS-007 | AC-010 | Nhật ký bất biến: Admin cố xóa PheDuyetLog bị từ chối | Security / Unit |
| TS-008 | AC-006 | Lý do chấp thuận tùy chọn được lưu khi nhập | Unit |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes (pattern reuse) | PheDuyetLog pattern đã xác lập tại F-011; CauCang cần state machine tương tự với transition cho_phe_duyet → hien_hanh/chinh_sua |
| Architecture affected? | Yes (pattern reuse) | Notification service, immutability constraint, RBAC — đã giải quyết tại F-011; SA cần xác nhận reuse pattern cho CauCang |
| Implementation clear? | No | SA cần xác nhận reuse PheDuyetLog aggregate từ F-011 hay tạo entity riêng cho CauCang |
| **Verdict** | `Ready for solution architecture` | Reuses approval workflow pattern từ F-011; SA xác nhận aggregate reuse strategy |

## BA → Handoff Summary

**Verdict:** Ready for solution architecture

**Phases completed:** BA only

**Triage rationale:** F-023 áp dụng cùng approval workflow pattern với F-011 (Phê duyệt Cảng biển). Domain model elements (PheDuyetLog, trạng thái CauCang) cần SA xác nhận reuse strategy — không tạo entity hoàn toàn mới.

**Business goal:** Đảm bảo 100% Cầu cảng ở trạng thái "Hiện hành" đều đã được phê duyệt bởi Lãnh đạo có thẩm quyền, với nhật ký bất biến.

**Scope in:**
- Danh sách Cầu cảng chờ phê duyệt (ROLE_LEADER only)
- Chi tiết Cầu cảng + lịch sử thay đổi (delta)
- Hành động Chấp thuận / Từ chối
- Validation lý do từ chối (bắt buộc)
- PheDuyetLog bất biến + notification

**Key business rules:** BR-001: Bắt buộc trải qua phê duyệt; BR-002: Lý do từ chối mandatory; BR-004: PheDuyetLog bất biến; BR-006: Chỉ ROLE_LEADER hoặc ủy quyền tường minh

**Actors:** A-002 (Lãnh đạo — phê duyệt), A-003 (Chuyên viên — nhận thông báo), A-004 (Người dùng tại Cảng — nhận thông báo)

**Domain highlights:** Approval workflow bounded context (pattern reuse từ F-011); CauCang state machine: cho_phe_duyet → hien_hanh | chinh_sua

**UI/UX impact:** yes — designer required (danh sách phê duyệt, trang chi tiết với diff view, modal Chấp thuận/Từ chối)

**Screen types:** List (danh sách chờ phê duyệt), Detail + History tab (chi tiết + delta lịch sử), Modal confirmation (Chấp thuận/Từ chối + lý do)

**Open items (non-blocking):** SA xác nhận reuse PheDuyetLog aggregate hay tạo CauCangPheDuyetLog riêng
