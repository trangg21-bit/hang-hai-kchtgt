---
feature-id: F-012
document: lean-spec
output-mode: lean
last-updated: 2026-06-27
---
# Xem chi tiết Cảng biển

## Summary

Cán bộ quản lý và người vận hành cần tra cứu nhanh thông tin Cảng biển để phục vụ điều phối vận tải, lập kế hoạch logistics và báo cáo nhà nước. Tính năng cung cấp màn hình tìm kiếm/lọc danh sách và trang chi tiết Cảng biển có tích hợp bản đồ GPS, kiểm soát hiển thị trường dữ liệu theo vai trò. Thành công khi tra cứu trả kết quả dưới 3 giây và 100% thông tin kỹ thuật được hiển thị đúng theo phân quyền vai trò.

## Scope

| | Items |
|---|---|
| In scope | Thanh tìm kiếm (mã cảng, tên cảng, tỉnh/thành, trạng thái); Bảng danh sách kết quả phân trang (50/trang) có sắp xếp; Trang chi tiết Cảng biển (đầy đủ các trường); Tích hợp bản đồ hiển thị tọa độ GPS; Hiển thị createdBy/updatedBy; Điều hướng đến cập nhật/xóa (nếu có quyền); Kiểm soát ẩn trường theo vai trò |
| Out of scope | Tạo mới Cảng biển (F-008); Cập nhật Cảng biển (F-009); Xóa Cảng biển (F-010); Phê duyệt Cảng biển (F-011); Lịch sử thay đổi chi tiết (F-013); Xuất dữ liệu Excel/PDF |
| Assumptions | Bản đồ tích hợp dùng thư viện GIS đã có sẵn trong platform (GeoServer); Cơ chế RBAC đã được triển khai ở tầng API và frontend; Phân trang cursor-based hoặc offset-based đều chấp nhận được |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Chuyên viên (A-003) / Người dùng tại Cảng (A-004) | Tìm kiếm Cảng biển theo mã, tên, tỉnh/thành hoặc trạng thái | Tra cứu nhanh không cần duyệt toàn bộ danh sách | Must Have |
| US-002 | Chuyên viên (A-003) / Quản trị (A-001) | Xem trang chi tiết đầy đủ thông tin kỹ thuật của một Cảng biển | Có đủ dữ liệu để phân tích, lập báo cáo hoặc kiểm tra | Must Have |
| US-003 | Chuyên viên (A-003) / Người dùng tại Cảng (A-004) | Xem vị trí Cảng biển trên bản đồ tích hợp | Xác định địa lý chính xác không cần công cụ GIS riêng | Must Have |
| US-004 | Người dùng tại Cảng (A-004) / Nhân viên vận hành | Xem thông tin cơ bản Cảng biển (mã, tên, tỉnh, trạng thái) | Khai thác dữ liệu trong phạm vi quyền hạn được cấp | Must Have |
| US-005 | Tất cả actor nội bộ | Hệ thống không hiển thị trường kỹ thuật mở rộng cho vai trò không đủ quyền | Bảo vệ dữ liệu nhạy cảm và tuân thủ kiểm soát truy cập | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001 | Tra cứu theo mã cảng trả kết quả đúng trong 3 giây | Given người dùng có quyền Xem đăng nhập thành công; When nhập mã cảng vào thanh tìm kiếm và gửi; Then kết quả danh sách hiển thị trong vòng 3 giây với Cảng biển có mã tương ứng | SLA: p95 ≤ 3s trên tập 1000 bản ghi |
| AC-002 | US-001 | Tra cứu theo tên cảng (partial match) | Given người dùng nhập một phần tên cảng; When gửi tìm kiếm; Then kết quả chứa tất cả Cảng biển có tên chứa chuỗi tìm kiếm (case-insensitive) | Không phân biệt dấu nếu bật unaccent |
| AC-003 | US-001 | Tra cứu theo tỉnh/thành phố | Given người dùng chọn tỉnh/thành từ dropdown; When gửi tìm kiếm; Then chỉ hiển thị Cảng biển thuộc tỉnh đã chọn | |
| AC-004 | US-001 | Phân trang 50 kết quả/trang với sắp xếp | Given tìm kiếm trả về >50 kết quả; When xem trang kết quả; Then hiển thị tối đa 50 mục/trang, có điều hướng phân trang, có tùy chọn sắp xếp theo tên hoặc thời gian tạo | |
| AC-005 | US-002 | Trang chi tiết hiển thị đầy đủ tất cả các trường | Given người dùng vai trò Quản lý cảng hoặc Quản trị viên; When click vào một Cảng biển trong danh sách; Then trang chi tiết hiển thị: maCang, tenCang, tinhThanh, toDo, dienTich, khaNangTiepNhanTau, trangThai, ghiChu, createdAt, updatedAt, createdBy, updatedBy | Tất cả trường CangBien entity phải có mặt |
| AC-006 | US-003 | Bản đồ hiển thị đúng vị trí GPS | Given Cảng biển có tọa độ toDo.lat và toDo.lng hợp lệ; When mở trang chi tiết; Then bản đồ tích hợp hiển thị marker đúng vị trí với mức zoom đủ để nhận ra khu vực địa lý | Nếu toDo null: hiển thị thông báo "Chưa có tọa độ" |
| AC-007 | US-004 | Nhân viên vận hành chỉ thấy trường cơ bản | Given người dùng vai trò Nhân viên vận hành (A-004); When xem trang chi tiết Cảng biển; Then chỉ hiển thị: maCang, tenCang, tinhThanh, trangThai; các trường kỹ thuật mở rộng bị ẩn | Áp dụng cả API response (không trả dữ liệu thừa) |
| AC-008 | US-005 | API không trả trường bị ẩn cho vai trò không đủ quyền | Given API GET /cang-bien/{id} gọi bởi token vai trò Nhân viên vận hành; When server xử lý; Then response JSON không chứa các trường kỹ thuật mở rộng (dienTich, khaNangTiepNhanTau, toDo chi tiết) | Kiểm soát tại tầng service, không chỉ frontend |
| AC-009 | US-001 | Kết quả tìm kiếm mặc định loại trừ trạng thái cho_phe_duyet và da_xoa | Given người dùng thực hiện tìm kiếm không có bộ lọc trạng thái; When kết quả trả về; Then chỉ hiển thị Cảng biển trạng thái "Hiện hành" và "Tạm ngừng"; Cảng "Chờ phê duyệt" và "Đã xóa" bị loại trừ | Bật tùy chọn "Xem tất cả" để thấy đầy đủ |
| AC-010 | US-001 | Người dùng không có quyền Xem bị chặn | Given người dùng không có permission VIEW_CANG_BIEN; When truy cập danh sách hoặc chi tiết Cảng biển; Then nhận HTTP 403 Forbidden; không hiển thị dữ liệu | Áp dụng cả API endpoint và UI navigation |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Kết quả tìm kiếm mặc định chỉ trả Cảng biển trạng thái "Hiện hành" (hien_hanh) và "Tạm ngừng" (tam_ngung) | AC-009, US-001 | Khi người dùng bật tùy chọn "Xem tất cả" thì hiển thị cả cho_phe_duyet và da_xoa |
| BR-002 | Tọa độ GPS (toDo) được render trên bản đồ tích hợp; nếu null hiển thị thông báo thay thế | AC-006 | Không có ngoại lệ |
| BR-003 | Nhân viên vận hành (A-004) chỉ xem được trường cơ bản: maCang, tenCang, tinhThanh, trangThai; các trường kỹ thuật mở rộng ẩn | AC-007, AC-008 | Không có ngoại lệ |
| BR-004 | Trường kỹ thuật mở rộng (dienTich, khaNangTiepNhanTau, toDo, ghiChu, createdBy, updatedBy) chỉ hiển thị cho vai trò Quản lý cảng trở lên | AC-005, AC-008 | Quản trị hệ thống (A-001) luôn thấy đầy đủ |
| BR-005 | Danh sách kết quả hiển thị tối đa 50 bản ghi/trang; phải có phân trang | AC-004 | Không có ngoại lệ |
| BR-006 | Live search: kết quả cập nhật với độ trễ ≤ 500ms sau khi người dùng ngừng gõ (debounce) | AC-001 | Chỉ áp dụng cho tìm kiếm text; bộ lọc dropdown kích hoạt ngay khi chọn |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | API tra cứu danh sách p95 ≤ 3s trên tập 1000 bản ghi; live search debounce ≤ 500ms | p95 ≤ 3s |
| Security | Kiểm soát quyền VIEW_CANG_BIEN tại API layer (Spring @PreAuthorize); API không leak trường ẩn trong response | 0 field leak cho role không đủ quyền |
| Reliability | Trang chi tiết không crash khi toDo null hoặc trường optional thiếu | 100% graceful fallback |
| Audit/Logging | Mọi lần truy cập GET chi tiết Cảng biển (user_id, cang_bien_id, timestamp) được ghi log | 100% access events logged |
| Operability | Bản đồ tích hợp hiển thị đúng khi GeoServer available; có fallback khi GeoServer down (hiển thị tọa độ dạng text) | Graceful degradation khi GeoServer timeout > 5s |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | Tìm kiếm theo mã cảng hợp lệ → kết quả trong 3s | Performance + Integration |
| TS-002 | AC-002 | Tìm kiếm partial tên cảng (case-insensitive) → đúng kết quả | Integration |
| TS-003 | AC-004 | Tập 51 bản ghi → phân trang đúng 50/trang | Integration |
| TS-004 | AC-005 | Vai trò Quản lý cảng → thấy đủ 13 trường CangBien | Integration + UI |
| TS-005 | AC-006 | Cảng có toDo hợp lệ → bản đồ hiển thị đúng marker | UI/Integration |
| TS-006 | AC-006 | Cảng có toDo null → hiển thị thông báo "Chưa có tọa độ" | Negative/UI |
| TS-007 | AC-007 | Vai trò Nhân viên vận hành → chỉ thấy 4 trường cơ bản | Security/RBAC |
| TS-008 | AC-008 | API GET /cang-bien/{id} với token vai trò vận hành → response không có trường kỹ thuật | Security/API |
| TS-009 | AC-009 | Tìm kiếm mặc định → không trả Cảng trạng thái cho_phe_duyet và da_xoa | Integration |
| TS-010 | AC-010 | Token không có quyền VIEW_CANG_BIEN → HTTP 403 | Security |
| TS-011 | AC-001 | Performance: 1000 bản ghi, p95 tra cứu ≤ 3s | Performance |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | CangBien entity đã được định nghĩa bởi F-008; F-012 chỉ đọc (read-only) không thêm aggregate/event mới |
| Architecture affected? | Yes | Cần thiết kế API GET endpoint với field-level access control theo role, tích hợp GeoServer cho bản đồ, live search với debounce |
| Implementation clear? | No | Field-level RBAC projection (ẩn trường theo role tại API layer), GeoServer fallback strategy cần quyết định kiến trúc |
| **Verdict** | `Ready for solution architecture` | Read-only feature nhưng có non-trivial API design: field-level role projection + GeoServer integration + performance SLA |
