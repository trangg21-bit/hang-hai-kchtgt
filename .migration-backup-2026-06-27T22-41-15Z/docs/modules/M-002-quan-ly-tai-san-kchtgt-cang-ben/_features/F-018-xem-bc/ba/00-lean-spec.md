---
feature-id: F-018
document: lean-spec
output-mode: lean
last-updated: 2026-06-27
---
# Xem chi tiết Bến cảng

## Summary

Cán bộ quản lý cảng và người vận hành cần tra cứu nhanh thông tin kỹ thuật Bến cảng để phục vụ phân bổ lượt tàu, lập kế hoạch tiếp cận bến và đánh giá năng lực hạ tầng. Tính năng cung cấp màn hình tìm kiếm/lọc danh sách Bến cảng (lọc theo mã bến, tên bến, Cảng mẹ, loại bến) và trang chi tiết tích hợp bản đồ GPS, kiểm soát hiển thị trường dữ liệu theo vai trò, kèm link điều hướng chéo đến Cảng mẹ. Thành công khi tra cứu trả kết quả dưới 3 giây và 100% trường kỹ thuật Bến cảng hiển thị đúng theo phân quyền vai trò.

## Scope

| | Items |
|---|---|
| In scope | Thanh tìm kiếm (mã bến, tên bến, cảng mẹ, loại bến, trạng thái); Bảng danh sách kết quả phân trang (50/trang) có sắp xếp; Trang chi tiết Bến cảng (đầy đủ các trường kỹ thuật); Link điều hướng đến trang chi tiết Cảng mẹ; Tích hợp bản đồ hiển thị tọa độ GPS; Hiển thị createdBy/updatedBy; Điều hướng đến cập nhật/xóa (nếu có quyền); Kiểm soát ẩn trường theo vai trò |
| Out of scope | Tạo mới Bến cảng (F-014); Cập nhật Bến cảng (F-015); Xóa Bến cảng (F-016); Phê duyệt Bến cảng (F-017); Lịch sử thay đổi chi tiết (F-019); Xuất dữ liệu Excel/PDF |
| Assumptions | Bản đồ tích hợp dùng thư viện GIS đã có sẵn trong platform (GeoServer); Cơ chế RBAC đã được triển khai ở tầng API và frontend; Entity BenCang và Cảng mẹ (CangBien) đã tồn tại từ F-014; Phân trang cursor-based hoặc offset-based đều chấp nhận được |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Chuyên viên (A-003) / Người dùng tại Cảng (A-004) | Tìm kiếm Bến cảng theo mã bến, tên bến, Cảng mẹ, loại bến hoặc trạng thái | Tra cứu nhanh không cần duyệt toàn bộ danh sách | Must Have |
| US-002 | Chuyên viên (A-003) / Quản trị (A-001) | Xem trang chi tiết đầy đủ thông tin kỹ thuật của một Bến cảng | Có đủ dữ liệu để phân tích, lập kế hoạch phân bổ tàu, kiểm tra năng lực bến | Must Have |
| US-003 | Chuyên viên (A-003) / Người dùng tại Cảng (A-004) | Xem vị trí Bến cảng trên bản đồ tích hợp và điều hướng đến Cảng mẹ | Xác định địa lý chính xác và tra cứu ngữ cảnh Cảng mẹ không cần công cụ riêng | Must Have |
| US-004 | Người dùng tại Cảng (A-004) | Xem thông tin cơ bản Bến cảng (mã, tên, cảng mẹ, loại bến, trạng thái) | Khai thác dữ liệu cần thiết trong phạm vi quyền hạn được cấp | Must Have |
| US-005 | Tất cả actor nội bộ | Hệ thống không hiển thị trường kỹ thuật mở rộng cho vai trò không đủ quyền | Bảo vệ dữ liệu nhạy cảm và tuân thủ kiểm soát truy cập | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001 | Tra cứu theo mã bến trả kết quả đúng trong 3 giây | Given người dùng có quyền Xem đăng nhập thành công; When nhập mã bến vào thanh tìm kiếm và gửi; Then kết quả danh sách hiển thị trong vòng 3 giây với Bến cảng có mã tương ứng | SLA: p95 ≤ 3s trên tập 1000 bản ghi |
| AC-002 | US-001 | Tra cứu theo tên bến (partial match, case-insensitive) | Given người dùng nhập một phần tên bến; When gửi tìm kiếm; Then kết quả chứa tất cả Bến cảng có tên chứa chuỗi tìm kiếm (case-insensitive, unaccent nếu bật) | Không phân biệt dấu nếu bật unaccent |
| AC-003 | US-001 | Tra cứu theo Cảng mẹ từ dropdown | Given người dùng chọn Cảng mẹ từ dropdown danh sách CangBien; When gửi tìm kiếm; Then chỉ hiển thị Bến cảng thuộc Cảng mẹ đã chọn | |
| AC-004 | US-001 | Phân trang 50 kết quả/trang với sắp xếp | Given tìm kiếm trả về >50 kết quả; When xem trang kết quả; Then hiển thị tối đa 50 mục/trang, có điều hướng phân trang, có tùy chọn sắp xếp theo tên hoặc thời gian tạo | |
| AC-005 | US-002 | Trang chi tiết hiển thị đầy đủ tất cả các trường kỹ thuật | Given người dùng vai trò Quản lý cảng hoặc Quản trị viên; When click vào một Bến cảng trong danh sách; Then trang chi tiết hiển thị: maBen, tenBen, cangMe (link), tuyenDuongThuy, chieuDaiBen, chieuRongBen, loaiBen, doSauLuongTruocBen, toDo (bản đồ), trangThai, ghiChu, createdAt, updatedAt, createdBy, updatedBy | Tất cả trường BenCang entity phải có mặt |
| AC-006 | US-003 | Bản đồ hiển thị đúng vị trí GPS Bến cảng | Given Bến cảng có tọa độ toDo.lat và toDo.lng hợp lệ; When mở trang chi tiết; Then bản đồ tích hợp hiển thị marker đúng vị trí trong phạm vi Cảng mẹ với mức zoom phù hợp | Nếu toDo null: hiển thị thông báo "Chưa có tọa độ" |
| AC-007 | US-003 | Link Cảng mẹ điều hướng đến trang chi tiết Cảng biển | Given trang chi tiết Bến cảng hiển thị tên Cảng mẹ; When người dùng click link Cảng mẹ; Then hệ thống điều hướng đến trang chi tiết Cảng biển (F-012) tương ứng | Chỉ điều hướng khi Cảng mẹ tồn tại và người dùng có quyền xem CangBien |
| AC-008 | US-004 | Nhân viên vận hành chỉ thấy trường cơ bản | Given người dùng vai trò Nhân viên vận hành (A-004); When xem trang chi tiết Bến cảng; Then chỉ hiển thị: maBen, tenBen, cangMe (tên, không link), loaiBen, trangThai; các trường kỹ thuật kích thước và độ sâu bị ẩn | Áp dụng cả API response (không trả dữ liệu thừa) |
| AC-009 | US-005 | API không trả trường bị ẩn cho vai trò không đủ quyền | Given API GET /ben-cang/{id} gọi bởi token vai trò Nhân viên vận hành; When server xử lý; Then response JSON không chứa: chieuDaiBen, chieuRongBen, doSauLuongTruocBen, toDo chi tiết, ghiChu, createdBy, updatedBy | Kiểm soát tại tầng service, không chỉ frontend |
| AC-010 | US-001 | Kết quả tìm kiếm mặc định loại trừ trạng thái cho_phe_duyet và da_xoa | Given người dùng thực hiện tìm kiếm không có bộ lọc trạng thái; When kết quả trả về; Then chỉ hiển thị Bến cảng trạng thái "Hiện hành" và "Tạm ngừng"; bật "Xem tất cả" để thấy đầy đủ | |
| AC-011 | US-001 | Người dùng không có quyền Xem bị chặn | Given người dùng không có permission VIEW_BEN_CANG; When truy cập danh sách hoặc chi tiết Bến cảng; Then nhận HTTP 403 Forbidden; không hiển thị dữ liệu | Áp dụng cả API endpoint và UI navigation |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Kết quả tìm kiếm mặc định chỉ trả Bến cảng trạng thái "Hiện hành" (hien_hanh) và "Tạm ngừng" (tam_ngung) | AC-010, US-001 | Khi người dùng bật tùy chọn "Xem tất cả" thì hiển thị cả cho_phe_duyet và da_xoa |
| BR-002 | Tọa độ GPS (toDo) được render trên bản đồ tích hợp với zoom đủ nhận ra vị trí trong phạm vi Cảng mẹ; nếu null hiển thị thông báo "Chưa có tọa độ" | AC-006 | Không có ngoại lệ |
| BR-003 | Nhân viên vận hành (A-004) chỉ xem được trường cơ bản: maBen, tenBen, cangMe (tên), loaiBen, trangThai | AC-008, AC-009 | Không có ngoại lệ |
| BR-004 | Trường kỹ thuật mở rộng (chieuDaiBen, chieuRongBen, doSauLuongTruocBen, toDo, ghiChu, createdBy, updatedBy) chỉ hiển thị cho vai trò Quản lý cảng trở lên | AC-005, AC-009 | Quản trị hệ thống (A-001) luôn thấy đầy đủ |
| BR-005 | Danh sách kết quả hiển thị tối đa 50 bản ghi/trang; phải có phân trang | AC-004 | Không có ngoại lệ |
| BR-006 | Live search: kết quả cập nhật với độ trễ ≤ 500ms sau khi người dùng ngừng gõ (debounce) | AC-001 | Chỉ áp dụng cho tìm kiếm text; bộ lọc dropdown kích hoạt ngay khi chọn |
| BR-007 | Link Cảng mẹ trên trang chi tiết chỉ hiển thị dạng hyperlink điều hướng khi người dùng có quyền VIEW_CANG_BIEN; nếu không đủ quyền hiển thị tên dạng text thuần | AC-007 | Không có ngoại lệ |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | API tra cứu danh sách p95 ≤ 3s trên tập 1000 bản ghi; live search debounce ≤ 500ms | p95 ≤ 3s; debounce ≤ 500ms |
| Security | Kiểm soát quyền VIEW_BEN_CANG tại API layer (Spring @PreAuthorize); API không leak trường ẩn trong response cho role không đủ quyền | 0 field leak cho role không đủ quyền |
| Reliability | Trang chi tiết không crash khi toDo null, cangMe bị xóa, hoặc trường optional thiếu; fallback graceful khi GeoServer không phản hồi | 100% graceful fallback; GeoServer timeout > 5s → hiển thị tọa độ text |
| Audit/Logging | Mọi lần truy cập GET chi tiết Bến cảng (user_id, ben_cang_id, timestamp) được ghi log | 100% access events logged |
| Operability | Bản đồ tích hợp hiển thị đúng khi GeoServer available; fallback hiển thị tọa độ dạng text khi GeoServer down | Graceful degradation khi GeoServer timeout > 5s |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | Tìm kiếm theo mã bến hợp lệ → kết quả trong 3s | Performance + Integration |
| TS-002 | AC-002 | Tìm kiếm partial tên bến (case-insensitive) → đúng kết quả | Integration |
| TS-003 | AC-003 | Lọc theo Cảng mẹ từ dropdown → chỉ hiện Bến cảng thuộc Cảng đó | Integration |
| TS-004 | AC-004 | Tập 51 bản ghi → phân trang đúng 50/trang | Integration |
| TS-005 | AC-005 | Vai trò Quản lý cảng → thấy đủ 15 trường BenCang | Integration + UI |
| TS-006 | AC-006 | Bến có toDo hợp lệ → bản đồ hiển thị đúng marker trong phạm vi Cảng mẹ | UI/Integration |
| TS-007 | AC-006 | Bến có toDo null → hiển thị thông báo "Chưa có tọa độ" | Negative/UI |
| TS-008 | AC-007 | Click link Cảng mẹ → điều hướng đến trang chi tiết CangBien đúng | UI/Integration |
| TS-009 | AC-007 | Người dùng không có VIEW_CANG_BIEN → Cảng mẹ hiển thị text thuần, không link | Security/RBAC |
| TS-010 | AC-008 | Vai trò Nhân viên vận hành → chỉ thấy 5 trường cơ bản | Security/RBAC |
| TS-011 | AC-009 | API GET /ben-cang/{id} với token vai trò vận hành → response không có trường kỹ thuật | Security/API |
| TS-012 | AC-010 | Tìm kiếm mặc định → không trả Bến trạng thái cho_phe_duyet và da_xoa | Integration |
| TS-013 | AC-011 | Token không có quyền VIEW_BEN_CANG → HTTP 403 | Security |
| TS-014 | AC-001 | Performance: 1000 bản ghi, p95 tra cứu ≤ 3s | Performance |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | BenCang entity đã được định nghĩa bởi F-014; F-018 chỉ đọc (read-only) không thêm aggregate/event mới |
| Architecture affected? | Yes | Cần thiết kế API GET endpoint với field-level access control theo role, tích hợp GeoServer cho bản đồ, live search với debounce, cross-entity navigation link (BenCang → CangBien) |
| Implementation clear? | No | Field-level RBAC projection (ẩn trường theo role tại API layer), GeoServer fallback strategy, cross-entity link permission guard cần quyết định kiến trúc |
| **Verdict** | `Ready for solution architecture` | Read-only feature nhưng có non-trivial API design: field-level role projection + GeoServer integration + cross-entity navigation + performance SLA |
