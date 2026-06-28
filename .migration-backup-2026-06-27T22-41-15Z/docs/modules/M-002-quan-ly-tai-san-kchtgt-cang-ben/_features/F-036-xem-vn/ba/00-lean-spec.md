---
feature-id: F-036
document: lean-spec
output-mode: lean
last-updated: 2026-06-27
---
# Xem chi tiết Vùng nước

## Summary
Tính năng cho phép người dùng nội bộ tra cứu và xem thông tin chi tiết của Vùng nước bao gồm các trường địa lý, hải văn, pháp lý, trạng thái phê duyệt hai cấp và tài liệu đính kèm. Giải pháp cung cấp API tra cứu có phân trang, trang chi tiết đầy đủ trường theo vai trò, và kiểm soát hiển thị theo RBAC. Thành công khi người dùng có quyền VIEW_VUNG_NUOC tra cứu và xem đầy đủ thông tin Vùng nước trong vòng 3 giây (p95).

## Scope

| | Items |
|---|---|
| In scope | Hiển thị đầy đủ thông tin chi tiết Vùng nước (mã, tên, Cảng biển quản lý, vị trí, tọa độ, diện tích mặt nước, độ sâu trung bình, điều kiện hải văn, khả năng thông hành, loại Vùng nước, trạng thái phê duyệt, createdAt, updatedAt, createdBy, updatedBy); Tra cứu theo mã, tên (partial match), Cảng biển quản lý; Phân trang 50 kết quả/trang, sắp xếp; Ẩn trường kỹ thuật mở rộng theo vai trò (A-004); Liên kết điều hướng đến màn hình chi tiết Cảng biển quản lý; Xem và tải tài liệu đính kèm (VanBan); API trả 403 khi thiếu quyền |
| Out of scope | Chỉnh sửa thông tin Vùng nước (F-033); Tạo mới / Xóa Vùng nước (F-032, F-034); Phê duyệt Vùng nước (F-035); Xem lịch sử thay đổi chi tiết (F-037); Xuất báo cáo định kỳ |
| Assumptions | Vùng nước hiện có 77 bản ghi (theo doc-brief). Entity VungNuoc đã tồn tại trong codebase từ F-032/F-033. Permission VIEW_VUNG_NUOC sẽ được SA định nghĩa trong permission-matrix. Cảng biển quản lý là FK đến entity CangBien (module M-002). |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Chuyên viên (A-003) | Tra cứu Vùng nước theo mã, tên hoặc Cảng biển quản lý | Tìm nhanh thông tin Vùng nước cần xem mà không cần duyệt toàn bộ danh sách 77 bản ghi | Must Have |
| US-002 | Chuyên viên (A-003), Lãnh đạo (A-002) | Xem toàn bộ thông tin chi tiết địa lý, hải văn và pháp lý của một Vùng nước cụ thể | Ra quyết định quy hoạch, thẩm định điều kiện khai thác và kiểm toán tuân thủ chính xác | Must Have |
| US-003 | Người dùng tại Cảng (A-004) | Xem thông tin cơ bản (mã, tên, Cảng biển quản lý, trạng thái) của Vùng nước | Tra cứu trạng thái khai thác Vùng nước mà không cần truy cập trường nhạy cảm | Must Have |
| US-004 | Chuyên viên (A-003), Quản trị viên (A-001) | Xem và tải tài liệu đính kèm pháp lý liên quan đến Vùng nước | Kiểm tra văn bản, quyết định phân vùng mà không cần truy cập kho tài liệu riêng | Should Have |
| US-005 | Chuyên viên (A-003) | Xem trạng thái phê duyệt hai cấp của Vùng nước | Theo dõi tiến trình phê duyệt (chờ cấp 1 / chờ cấp 2 / đã phê duyệt / bị từ chối) | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001 | Tra cứu theo mã Vùng nước | Given người dùng có permission VIEW_VUNG_NUOC đã đăng nhập; When gọi GET /vung-nuoc?q={maVungNuoc}; Then trả về danh sách Vùng nước khớp partial match, case-insensitive trong vòng 3 giây (p95) trên tập 77 bản ghi | Chỉ Vùng nước trạng thái hien_hanh và tam_ngung được trả về mặc định |
| AC-002 | US-001 | Tra cứu theo tên Vùng nước | Given người dùng có permission VIEW_VUNG_NUOC; When gọi GET /vung-nuoc?q={tenVungNuoc}; Then trả về kết quả khớp partial match, case-insensitive, không phân biệt dấu tiếng Việt | — |
| AC-003 | US-001 | Tra cứu theo Cảng biển quản lý | Given người dùng có permission VIEW_VUNG_NUOC; When gọi GET /vung-nuoc?cangBienId={id}; Then trả về các Vùng nước thuộc Cảng biển đó theo đúng filter | — |
| AC-004 | US-001 | Phân trang và sắp xếp danh sách | Given danh sách kết quả tra cứu; When truy cập trang kết quả; Then hiển thị tối đa 50 kết quả mỗi trang, có điều hướng phân trang và tùy chọn sắp xếp theo tên hoặc thời gian tạo | page size mặc định = 50 |
| AC-005 | US-002 | Xem chi tiết đầy đủ cho Chuyên viên / Lãnh đạo | Given người dùng vai trò A-003 hoặc A-002 có permission VIEW_VUNG_NUOC; When gọi GET /vung-nuoc/{id}; Then response JSON chứa đầy đủ các trường: maVungNuoc, tenVungNuoc, cangBienId, cangBienTen, viTri, toDo, dienTich, doSau, dieuKienHaiVan, khaNangThongHanh, loaiVungNuoc, trangThai, createdAt, updatedAt, createdBy, updatedBy | Nếu toDo null thì trả chuỗi "Chưa có tọa độ" |
| AC-006 | US-002 | Hiển thị liên kết đến Cảng biển quản lý | Given người dùng xem chi tiết Vùng nước; When trang chi tiết tải xong; Then hiển thị tên Cảng biển quản lý dưới dạng liên kết điều hướng đến màn hình chi tiết Cảng biển tương ứng | — |
| AC-007 | US-002 | Lọc trạng thái mặc định | Given người dùng truy cập danh sách Vùng nước; When không bật tùy chọn "Xem tất cả"; Then chỉ hiển thị Vùng nước trạng thái hien_hanh và tam_ngung; cho_phe_duyet và da_xoa bị ẩn | — |
| AC-008 | US-003 | Ẩn trường kỹ thuật cho Người dùng tại Cảng | Given người dùng vai trò A-004 (ROLE_PORT_OPERATOR); When gọi GET /vung-nuoc/{id}; Then API response chỉ trả về 4 trường cơ bản: maVungNuoc, tenVungNuoc, cangBienTen, trangThai; các trường kỹ thuật mở rộng không xuất hiện trong JSON | Áp dụng cả UI lẫn API layer |
| AC-009 | US-001 US-002 | Từ chối truy cập khi thiếu quyền | Given người dùng không có permission VIEW_VUNG_NUOC; When gọi GET /vung-nuoc hoặc GET /vung-nuoc/{id}; Then API trả HTTP 403 Forbidden với error message chuẩn | Không rò rỉ thông tin về sự tồn tại của bản ghi |
| AC-010 | US-002 | Phân quyền dữ liệu theo org unit | Given Chuyên viên (A-003) thuộc đơn vị X; When tra cứu Vùng nước; Then chỉ thấy Vùng nước thuộc phạm vi quản lý của đơn vị X (theo authorization-rules.md §2); Lãnh đạo thấy dữ liệu đơn vị con; Cục thấy toàn bộ | Theo Org Unit Hierarchy |
| AC-011 | US-004 | Xem tài liệu đính kèm pháp lý | Given người dùng có permission VIEW_VUNG_NUOC và quyền quản lý (A-001, A-002, A-003); When xem trang chi tiết Vùng nước; Then hiển thị danh sách tài liệu đính kèm (VanBan) với tên, loại, ngày ban hành; cho phép tải xuống | A-004 không có quyền tải tài liệu |
| AC-012 | US-005 | Hiển thị trạng thái phê duyệt hai cấp | Given người dùng xem chi tiết Vùng nước; When trang chi tiết tải xong; Then hiển thị rõ trạng thái phê duyệt hiện tại: cho_phe_duyet_cap1 / cho_phe_duyet_cap2 / da_phe_duyet / bi_tu_choi | Trạng thái phê duyệt là read-only trên màn hình này; hành động phê duyệt thuộc F-035 |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Mọi người dùng nội bộ có vai trò trong hệ thống đều có thể xem chi tiết Vùng nước nếu có permission VIEW_VUNG_NUOC; Public User (A-005) không có quyền này | US-001, US-002, US-003 | Quản trị viên có thể override per-user permission theo authorization-rules.md §1 |
| BR-002 | Người dùng tại Cảng (A-004) chỉ nhận 4 trường cơ bản: maVungNuoc, tenVungNuoc, cangBienTen, trangThai; các trường kỹ thuật mở rộng (toDo, dienTich, doSau, dieuKienHaiVan, khaNangThongHanh, createdBy, updatedBy) bị ẩn ở cả UI và API layer | US-003, AC-008 | — |
| BR-003 | Danh sách tra cứu mặc định chỉ trả về Vùng nước trạng thái hien_hanh và tam_ngung; trạng thái cho_phe_duyet và da_xoa chỉ hiển thị khi bật "Xem tất cả" | US-001, AC-007 | — |
| BR-004 | Phân trang bắt buộc; page size mặc định = 50; API phải hỗ trợ tham số page và size | US-001, AC-004 | — |
| BR-005 | Chuyên viên (A-003) chỉ thấy dữ liệu trong phạm vi đơn vị quản lý của mình; Lãnh đạo thấy đơn vị con; Cục thấy toàn bộ | US-002, AC-010 | Bản đồ/hải đồ không áp dụng filter org unit (không liên quan F-036) |
| BR-006 | Chỉ người dùng có quyền quản lý (A-001, A-002, A-003) mới được tải tài liệu đính kèm (VanBan); A-004 chỉ xem tên tài liệu không được tải | US-004, AC-011 | — |
| BR-007 | Các trường bắt buộc (maVungNuoc, tenVungNuoc, trangThai) không được hiển thị trống; nếu dữ liệu null phải hiển thị placeholder rõ ràng | US-002, AC-005 | toDo có thể null → hiển thị "Chưa có tọa độ" |
| BR-008 | Trạng thái phê duyệt hai cấp hiển thị read-only trên màn hình xem chi tiết; hành động phê duyệt/từ chối thuộc phạm vi F-035 | US-005, AC-012 | — |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | API GET /vung-nuoc (danh sách + tìm kiếm) và GET /vung-nuoc/{id} trả về kết quả p95 | ≤ 3 giây trên tập 77 bản ghi hiện tại, co giãn đến 1000 bản ghi |
| Security | Kiểm tra permission VIEW_VUNG_NUOC tại API layer (Spring Security @PreAuthorize); org unit filter bắt buộc cho A-003/A-004; field-level masking cho A-004; không rò rỉ dữ liệu qua 403 response | HTTP 403 không kèm payload bản ghi |
| Reliability | API GET /vung-nuoc và GET /vung-nuoc/{id} phải available 99.5% uptime; không có single point of failure ở tầng đọc | 99.5% uptime theo SLA hệ thống |
| Audit/Logging | Mọi lần gọi GET /vung-nuoc/{id} phải được log: user_id, timestamp, vung_nuoc_id, vai_trò, kết_quả (200/403) | Log lưu trong HTTT-SIEM; retention theo chính sách hệ thống |
| Operability | API tuân thủ REST standard; response JSON nhất quán; phân trang theo chuẩn Spring Pageable; error message tiếng Việt thân thiện với người dùng cuối | N/A |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001, AC-002 | Tra cứu partial match theo mã và tên Vùng nước — trả đúng kết quả | Functional |
| TS-002 | AC-003 | Tra cứu theo Cảng biển quản lý — filter đúng | Functional |
| TS-003 | AC-004 | Phân trang: trang 1 trả ≤ 50, trang 2 trả phần còn lại; sắp xếp đúng chiều | Functional |
| TS-004 | AC-005 | GET /vung-nuoc/{id} với A-003 token — response chứa đầy đủ 16 trường | Functional |
| TS-005 | AC-008 | GET /vung-nuoc/{id} với A-004 token — response chỉ có 4 trường cơ bản | Security |
| TS-006 | AC-009 | GET /vung-nuoc/{id} không có permission VIEW_VUNG_NUOC — nhận 403 không có payload | Security |
| TS-007 | AC-007 | Danh sách mặc định ẩn cho_phe_duyet; bật "Xem tất cả" hiển thị đủ | Functional |
| TS-008 | AC-010 | Chuyên viên đơn vị X không thấy Vùng nước đơn vị Y | Security / Permission |
| TS-009 | AC-011 | Người dùng A-003 tải được tài liệu; A-004 không tải được (403) | Security |
| TS-010 | AC-005 | toDo = null → hiển thị "Chưa có tọa độ" thay vì trường trống | Edge case |
| TS-011 | AC-006 | Liên kết đến Cảng biển quản lý điều hướng đúng đến màn hình chi tiết Cảng biển | Functional |
| TS-012 | AC-012 | Hiển thị đúng từng trạng thái phê duyệt hai cấp (4 trạng thái) | Functional |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Entity VungNuoc đã tồn tại (tạo bởi F-032). F-036 chỉ thêm read path + RBAC field-level masking. Không có aggregate root mới. |
| Architecture affected? | Yes | Field-level RBAC masking (A-004 nhận subset trường) cần quyết định kiến trúc: serialization filter tại API layer hay projection query. Org unit data filter cần SA xác nhận cơ chế áp dụng cho VungNuoc read. Permission VIEW_VUNG_NUOC cần được định nghĩa chính thức. Liên kết điều hướng sang CangBien cần SA xác nhận cơ chế cross-entity navigation. |
| Implementation clear? | No | Cơ chế field-level masking chưa được SA quy định (JSON view annotation, DTO projection hay Spring Security filter). |
| **Verdict** | `Ready for solution architecture` | Không có domain model mới (Phase 2 không cần chạy), nhưng có architectural decisions về RBAC field masking, org unit filter và cross-entity navigation link cần SA xử lý. |
