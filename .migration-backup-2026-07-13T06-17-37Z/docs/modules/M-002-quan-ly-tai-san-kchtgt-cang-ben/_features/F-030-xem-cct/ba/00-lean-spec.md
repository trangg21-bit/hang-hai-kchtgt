---
feature-id: F-030
document: lean-spec
output-mode: lean
last-updated: 2026-06-27
---
# Xem chi tiết Cảng cạn

## Summary
Tính năng cho phép người dùng nội bộ tra cứu và xem thông tin chi tiết của Cảng cạn bao gồm các trường dữ liệu cơ bản, kỹ thuật, trạng thái và tài liệu đính kèm pháp lý. Giải pháp cung cấp API tra cứu có phân trang, trang chi tiết đầy đủ trường theo vai trò, và kiểm soát hiển thị theo RBAC. Thành công khi người dùng có quyền VIEW_CANG_CAN tra cứu và xem đầy đủ thông tin Cảng cạn trong vòng 3 giây (p95).

## Scope

| | Items |
|---|---|
| In scope | Hiển thị đầy đủ thông tin chi tiết Cảng cạn (mã, tên, địa chỉ, tọa độ, loại hình, diện tích, công suất TEU, trạng thái, ghiChu, createdAt, updatedAt, createdBy, updatedBy); Tra cứu theo mã, tên (partial match), tỉnh/thành phố; Phân trang 50 kết quả/trang, sắp xếp; Ẩn trường kỹ thuật mở rộng theo vai trò (A-004); Lọc trạng thái mặc định (hiện hành + tạm ngừng); API trả 403 khi thiếu quyền |
| Out of scope | Chỉnh sửa thông tin Cảng cạn (F-027); Tạo mới / Xóa Cảng cạn (F-026, F-028); Xuất báo cáo định kỳ; Xem lịch sử thay đổi (F-031); Phê duyệt Cảng cạn (F-029) |
| Assumptions | Cảng cạn hiện có 14 bản ghi (theo doc-brief). Entity CangCan đã tồn tại trong codebase từ F-026/F-027. Permission VIEW_CANG_CAN sẽ được SA định nghĩa trong permission-matrix. |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Chuyên viên (A-003) | Tra cứu Cảng cạn theo mã, tên hoặc tỉnh/thành phố | Tìm nhanh thông tin Cảng cạn cần xem mà không cần duyệt toàn bộ danh sách | Must Have |
| US-002 | Chuyên viên (A-003), Lãnh đạo (A-002) | Xem toàn bộ thông tin chi tiết kỹ thuật và pháp lý của một Cảng cạn cụ thể | Ra quyết định vận hành, kiểm toán tuân thủ chính xác | Must Have |
| US-003 | Người dùng tại Cảng (A-004) | Xem thông tin cơ bản (mã, tên, trạng thái) của Cảng cạn | Tra cứu trạng thái Cảng cạn phục vụ khai thác mà không cần truy cập trường nhạy cảm | Must Have |
| US-004 | Chuyên viên (A-003), Quản trị viên (A-001) | Xem tài liệu đính kèm pháp lý liên quan đến Cảng cạn | Kiểm tra giấy phép thành lập, quyết định mà không cần truy cập kho tài liệu riêng | Should Have |
| US-005 | Chuyên viên (A-003) | Xem danh sách Cảng cạn chờ phê duyệt hoặc đã xóa khi cần | Kiểm tra trạng thái toàn diện trong quá trình quản lý | Could Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001 | Tra cứu theo mã Cảng cạn | Given người dùng có permission VIEW_CANG_CAN đã đăng nhập; When gọi GET /cang-can?q={maCangCan}; Then trả về danh sách Cảng cạn khớp partial match, case-insensitive trong vòng 3 giây (p95) trên tập 14 bản ghi | Chỉ Cảng cạn trạng thái hien_hanh và tam_ngung được trả về mặc định |
| AC-002 | US-001 | Tra cứu theo tên Cảng cạn | Given người dùng có permission VIEW_CANG_CAN; When gọi GET /cang-can?q={tenCangCan}; Then trả về kết quả khớp partial match, case-insensitive, không phân biệt dấu tiếng Việt | — |
| AC-003 | US-001 | Tra cứu theo tỉnh/thành phố | Given người dùng có permission VIEW_CANG_CAN; When gọi GET /cang-can?tinhThanh={province}; Then trả về Cảng cạn thuộc tỉnh/thành phố đó theo đúng filter | — |
| AC-004 | US-001 | Phân trang và sắp xếp danh sách | Given danh sách kết quả tra cứu; When truy cập trang kết quả; Then hiển thị tối đa 50 kết quả mỗi trang, có điều hướng phân trang và tùy chọn sắp xếp theo tên hoặc thời gian tạo | page size mặc định = 50 |
| AC-005 | US-002 | Xem chi tiết đầy đủ cho Chuyên viên / Lãnh đạo | Given người dùng vai trò A-003 hoặc A-002 có permission VIEW_CANG_CAN; When gọi GET /cang-can/{id}; Then response JSON chứa đầy đủ các trường: maCangCan, tenCangCan, diaChi, tinhThanh, toDo, loaiHinh, dienTich, congSuatTEU, trangThai, ghiChu, createdAt, updatedAt, createdBy, updatedBy | Nếu toDo null thì trả chuỗi "Chưa có tọa độ" |
| AC-006 | US-002 | Lọc trạng thái mặc định | Given người dùng truy cập danh sách Cảng cạn; When không bật tùy chọn "Xem tất cả"; Then chỉ hiển thị Cảng cạn trạng thái hien_hanh và tam_ngung; cho_phe_duyet và da_xoa bị ẩn | — |
| AC-007 | US-002 | Xem trạng thái mở rộng | Given người dùng bật tùy chọn "Xem tất cả"; When danh sách tải lại; Then hiển thị đầy đủ mọi trạng thái bao gồm cho_phe_duyet và da_xoa | — |
| AC-008 | US-003 | Ẩn trường kỹ thuật cho Người dùng tại Cảng | Given người dùng vai trò A-004 (ROLE_PORT_OPERATOR); When gọi GET /cang-can/{id}; Then API response chỉ trả về 4 trường cơ bản: maCangCan, tenCangCan, tinhThanh, trangThai; các trường kỹ thuật mở rộng không xuất hiện trong JSON | Áp dụng cả UI lẫn API layer |
| AC-009 | US-001 US-002 | Từ chối truy cập khi thiếu quyền | Given người dùng không có permission VIEW_CANG_CAN; When gọi GET /cang-can hoặc GET /cang-can/{id}; Then API trả HTTP 403 Forbidden với error message chuẩn | Không rò rỉ thông tin về sự tồn tại của bản ghi |
| AC-010 | US-002 | Phân quyền dữ liệu theo org unit | Given Chuyên viên (A-003) thuộc đơn vị X; When tra cứu Cảng cạn; Then chỉ thấy Cảng cạn thuộc phạm vi quản lý của đơn vị X (theo authorization-rules.md §2); Lãnh đạo thấy dữ liệu đơn vị con; Cục thấy toàn bộ | Theo Org Unit Hierarchy |
| AC-011 | US-004 | Xem tài liệu đính kèm pháp lý | Given người dùng có permission VIEW_CANG_CAN và quyền quản lý (A-001, A-002, A-003); When xem trang chi tiết Cảng cạn; Then hiển thị danh sách tài liệu đính kèm (GiayTo) với tên, loại, ngày cập nhật; cho phép tải xuống | A-004 không có quyền tải tài liệu |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Mọi người dùng nội bộ có vai trò trong hệ thống đều có thể xem chi tiết Cảng cạn nếu có permission VIEW_CANG_CAN; Public User (A-005) không có quyền này | US-001, US-002, US-003, US-004 | Quản trị viên có thể override per-user permission theo authorization-rules.md §1 |
| BR-002 | Người dùng tại Cảng (A-004) chỉ nhận 4 trường cơ bản; các trường kỹ thuật mở rộng (toDo, loaiHinh, dienTich, congSuatTEU, ghiChu, createdBy, updatedBy) bị ẩn ở cả UI và API layer | US-003, AC-008 | — |
| BR-003 | Danh sách tra cứu mặc định chỉ trả về Cảng cạn trạng thái hien_hanh và tam_ngung; trạng thái cho_phe_duyet và da_xoa chỉ hiển thị khi bật "Xem tất cả" | US-001, AC-006, AC-007 | — |
| BR-004 | Phân trang bắt buộc; page size mặc định = 50; API phải hỗ trợ tham số page và size | US-001, AC-004 | — |
| BR-005 | Chuyên viên (A-003) chỉ thấy dữ liệu trong phạm vi đơn vị quản lý của mình; Lãnh đạo thấy đơn vị con; Cục thấy toàn bộ | US-002, AC-010 | Bản đồ/hải đồ không áp dụng filter org unit (không liên quan F-030) |
| BR-006 | Chỉ người dùng có quyền quản lý (A-001, A-002, A-003) mới được tải tài liệu đính kèm; A-004 chỉ xem tên tài liệu không được tải | US-004, AC-011 | — |
| BR-007 | Các trường bắt buộc (maCangCan, tenCangCan, trangThai) không được hiển thị trống; nếu dữ liệu null phải hiển thị placeholder rõ ràng | US-002, AC-005 | toDo có thể null → hiển thị "Chưa có tọa độ" |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | API GET /cang-can (danh sách + tìm kiếm) trả về kết quả p95 | ≤ 3 giây trên tập 14 bản ghi hiện tại, co giãn đến 1000 bản ghi |
| Security | Kiểm tra permission VIEW_CANG_CAN tại API layer (Spring Security @PreAuthorize); org unit filter bắt buộc cho A-003/A-004; không rò rỉ dữ liệu qua 403 response | HTTP 403 không kèm payload bản ghi |
| Reliability | API GET /cang-can và GET /cang-can/{id} phải available 99.5% uptime; không có single point of failure ở tầng đọc | 99.5% uptime theo SLA hệ thống |
| Audit/Logging | Mọi lần gọi GET /cang-can/{id} phải được log: user_id, timestamp, cang_can_id, vai_trò, kết_quả (200/403) | Log lưu trong HTTT-SIEM; retention theo chính sách hệ thống |
| Operability | API tuân thủ REST standard; response JSON nhất quán; phân trang theo chuẩn Spring Pageable; error message tiếng Việt thân thiện với người dùng cuối | N/A |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001, AC-002 | Tra cứu partial match theo mã và tên Cảng cạn — trả đúng kết quả | Functional |
| TS-002 | AC-003 | Tra cứu theo tỉnh/thành phố — filter đúng | Functional |
| TS-003 | AC-004 | Phân trang: trang 1 trả ≤ 50, trang 2 trả phần còn lại; sắp xếp đúng chiều | Functional |
| TS-004 | AC-005 | GET /cang-can/{id} với A-003 token — response chứa đầy đủ 14 trường | Functional |
| TS-005 | AC-008 | GET /cang-can/{id} với A-004 token — response chỉ có 4 trường cơ bản | Security |
| TS-006 | AC-009 | GET /cang-can/{id} không có permission VIEW_CANG_CAN — nhận 403 không có payload | Security |
| TS-007 | AC-006, AC-007 | Danh sách mặc định ẩn cho_phe_duyet; bật "Xem tất cả" hiển thị đủ | Functional |
| TS-008 | AC-010 | Chuyên viên đơn vị X không thấy Cảng cạn đơn vị Y | Security / Permission |
| TS-009 | AC-011 | Người dùng A-003 tải được tài liệu; A-004 không tải được (403) | Security |
| TS-010 | AC-005 | toDo = null → hiển thị "Chưa có tọa độ" thay vì trường trống | Edge case |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Entity CangCan đã tồn tại (tạo bởi F-026). F-030 chỉ thêm read path + RBAC field-level masking. Không có aggregate root mới. |
| Architecture affected? | Yes | Field-level RBAC masking (A-004 nhận subset trường) cần quyết định kiến trúc: serialization filter tại API layer hay projection query. Org unit data filter cần SA xác nhận cơ chế áp dụng cho CangCan read. Permission VIEW_CANG_CAN cần được định nghĩa chính thức. |
| Implementation clear? | No | Cơ chế field-level masking chưa được SA quy định (JSON view annotation, DTO projection hay Spring Security filter). |
| **Verdict** | `Ready for solution architecture` | Không có domain model mới (Phase 2 không cần chạy), nhưng có architectural decisions về RBAC field masking và org unit filter cần SA xử lý. |
