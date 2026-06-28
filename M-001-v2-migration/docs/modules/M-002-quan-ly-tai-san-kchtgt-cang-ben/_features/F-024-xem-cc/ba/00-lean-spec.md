---
feature-id: F-024
document: lean-spec
output-mode: lean
last-updated: 2026-06-27
---
# Xem chi tiết Cầu cảng

## Summary

Cán bộ quản lý và người vận hành cần tra cứu nhanh thông tin Cầu cảng để phục vụ điều phối vận tải, kiểm tra năng lực tiếp nhận tàu và báo cáo nhà nước. Tính năng cung cấp màn hình tìm kiếm/lọc danh sách theo mã cầu, tên cầu, Bến cảng mẹ và trang chi tiết Cầu cảng với kiểm soát ẩn trường theo vai trò. Thành công khi tra cứu trả kết quả dưới 3 giây và 100% trường kỹ thuật được hiển thị đúng theo phân quyền vai trò.

## Scope

| | Items |
|---|---|
| In scope | Thanh tìm kiếm (mã cầu, tên cầu, Bến cảng mẹ, trạng thái); Bảng danh sách kết quả phân trang (50/trang) với sắp xếp; Trang chi tiết Cầu cảng (đầy đủ các trường); Hiển thị liên kết đến Bến cảng mẹ; Hiển thị createdBy/updatedBy; Kiểm soát ẩn trường theo vai trò (field-level RBAC) |
| Out of scope | Tạo mới Cầu cảng (F-020); Cập nhật Cầu cảng (F-021); Xóa Cầu cảng (F-022); Phê duyệt Cầu cảng (F-023); Lịch sử thay đổi chi tiết (F-025); Xuất dữ liệu Excel/PDF; Tích hợp bản đồ GIS (Cầu cảng không có trường tọa độ GPS) |
| Assumptions | Cơ chế RBAC đã được triển khai tại tầng API và frontend; Bến cảng mẹ (BenCang) đã tồn tại trong hệ thống; Phân trang offset-based chấp nhận được |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Chuyên viên (A-003) / Người dùng tại Cảng (A-004) | Tìm kiếm Cầu cảng theo mã cầu, tên cầu hoặc Bến cảng mẹ | Tra cứu nhanh không cần duyệt toàn bộ danh sách | Must Have |
| US-002 | Chuyên viên (A-003) / Quản trị (A-001) | Xem trang chi tiết đầy đủ thông tin kỹ thuật của một Cầu cảng | Có đủ dữ liệu kỹ thuật (tải trọng, kích thước, loại kết cấu) để phân tích và lập báo cáo | Must Have |
| US-003 | Người dùng tại Cảng (A-004) | Xem thông tin cơ bản Cầu cảng trong phạm vi quyền hạn | Khai thác dữ liệu an toàn mà không lộ thông tin kỹ thuật nhạy cảm | Must Have |
| US-004 | Tất cả actor nội bộ | Hệ thống không hiển thị trường kỹ thuật mở rộng cho vai trò không đủ quyền | Bảo vệ dữ liệu nhạy cảm và tuân thủ kiểm soát truy cập field-level | Must Have |
| US-005 | Chuyên viên (A-003) | Xem liên kết điều hướng đến Bến cảng mẹ từ trang chi tiết Cầu cảng | Tra cứu thông tin Bến cảng mẹ liên quan mà không cần tìm kiếm lại | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001 | Tra cứu theo mã cầu trả kết quả đúng trong 3 giây | Given người dùng có quyền VIEW_CAU_CANG đăng nhập thành công; When nhập mã cầu vào thanh tìm kiếm và gửi; Then kết quả danh sách hiển thị trong vòng 3 giây với Cầu cảng có mã tương ứng | SLA: p95 ≤ 3s trên tập 614 bản ghi |
| AC-002 | US-001 | Tra cứu theo tên cầu (partial match, case-insensitive) | Given người dùng nhập một phần tên cầu; When gửi tìm kiếm; Then kết quả chứa tất cả Cầu cảng có tên chứa chuỗi tìm kiếm (case-insensitive, partial match) | |
| AC-003 | US-001 | Lọc theo Bến cảng mẹ | Given người dùng chọn Bến cảng mẹ từ dropdown; When áp dụng bộ lọc; Then chỉ hiển thị Cầu cảng thuộc Bến cảng mẹ đã chọn | Dropdown lấy danh sách BenCang trạng thái hien_hanh |
| AC-004 | US-001 | Phân trang 50 kết quả/trang với sắp xếp | Given tìm kiếm trả về >50 kết quả; When xem trang kết quả; Then hiển thị tối đa 50 mục/trang, có điều hướng phân trang, có tùy chọn sắp xếp theo tên hoặc thời gian tạo | |
| AC-005 | US-002 | Trang chi tiết hiển thị đầy đủ tất cả các trường | Given người dùng vai trò Chuyên viên (A-003) hoặc Quản trị viên (A-001); When click vào một Cầu cảng trong danh sách; Then trang chi tiết hiển thị: maCau, tenCau, liên kết BenCang mẹ, loaiKetCau, vatLieuChinh, taiTrongThietKe, chieuDaiCau, chieuRongCau, mucNuocCaoNhat, trangThai, ghiChu, createdAt, updatedAt, createdBy, updatedBy | Tất cả trường CauCang entity phải có mặt |
| AC-006 | US-003 | Người dùng tại Cảng (A-004) chỉ thấy trường cơ bản | Given người dùng vai trò Người dùng tại Cảng (A-004); When xem trang chi tiết Cầu cảng; Then chỉ hiển thị: maCau, tenCau, trangThai, BenCang mẹ (tên); các trường kỹ thuật bị ẩn | Áp dụng cả API response — không trả dữ liệu thừa trong JSON |
| AC-007 | US-004 | API không trả trường bị ẩn cho vai trò không đủ quyền | Given API GET /cau-cang/{id} gọi bởi token vai trò A-004; When server xử lý; Then response JSON không chứa: taiTrongThietKe, chieuDaiCau, chieuRongCau, mucNuocCaoNhat, vatLieuChinh, loaiKetCau, ghiChu, createdBy, updatedBy | Kiểm soát tại service layer, không chỉ frontend |
| AC-008 | US-001 | Kết quả tìm kiếm mặc định loại trừ trạng thái cho_phe_duyet và da_xoa | Given người dùng tìm kiếm không có bộ lọc trạng thái; When kết quả trả về; Then chỉ hiển thị Cầu cảng trạng thái "Hiện hành" và "Tạm ngừng"; Cầu cảng "Chờ phê duyệt" và "Đã xóa" bị loại trừ | Bật "Xem tất cả" để thấy đầy đủ |
| AC-009 | US-001 | Người dùng không có quyền VIEW_CAU_CANG bị chặn | Given người dùng không có permission VIEW_CAU_CANG; When truy cập danh sách hoặc chi tiết Cầu cảng; Then nhận HTTP 403 Forbidden; không hiển thị dữ liệu | Áp dụng cả API endpoint và UI navigation |
| AC-010 | US-005 | Liên kết Bến cảng mẹ dẫn đến trang chi tiết Bến cảng | Given người dùng đang xem trang chi tiết Cầu cảng; When click vào tên Bến cảng mẹ; Then hệ thống điều hướng đến trang chi tiết Bến cảng mẹ tương ứng (F-016) | Chỉ điều hướng nếu người dùng có quyền VIEW_BEN_CANG |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Kết quả tìm kiếm mặc định chỉ trả Cầu cảng trạng thái hien_hanh và tam_ngung | AC-008, US-001 | Khi người dùng bật "Xem tất cả" thì hiển thị cả cho_phe_duyet và da_xoa |
| BR-002 | Người dùng tại Cảng (A-004) chỉ xem được 4 trường cơ bản: maCau, tenCau, trangThai, tenBenCangMe; các trường kỹ thuật bị ẩn | AC-006, AC-007 | Không có ngoại lệ |
| BR-003 | Trường kỹ thuật mở rộng (taiTrongThietKe, chieuDaiCau, chieuRongCau, mucNuocCaoNhat, vatLieuChinh, loaiKetCau, ghiChu, createdBy, updatedBy) chỉ hiển thị cho vai trò Chuyên viên (A-003) trở lên | AC-005, AC-007 | Quản trị hệ thống (A-001) luôn thấy đầy đủ |
| BR-004 | Danh sách kết quả hiển thị tối đa 50 bản ghi/trang; phải có phân trang | AC-004 | Không có ngoại lệ |
| BR-005 | Liên kết điều hướng đến Bến cảng mẹ chỉ hiển thị khi người dùng có quyền VIEW_BEN_CANG | AC-010 | Không có ngoại lệ |
| BR-006 | Live search debounce ≤ 500ms sau khi ngừng gõ; bộ lọc dropdown kích hoạt ngay khi chọn | AC-001 | Chỉ áp dụng cho tìm kiếm text |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | API tra cứu danh sách p95 ≤ 3s trên tập 614 bản ghi; live search debounce ≤ 500ms | p95 ≤ 3s |
| Security | Kiểm soát quyền VIEW_CAU_CANG tại API layer (Spring @PreAuthorize); API không leak trường ẩn trong response cho role không đủ quyền | 0 field leak cho role không đủ quyền |
| Reliability | Trang chi tiết không crash khi trường optional thiếu hoặc null | 100% graceful fallback |
| Audit/Logging | Mọi lần truy cập GET chi tiết Cầu cảng (user_id, cau_cang_id, timestamp) được ghi log | 100% access events logged |
| Operability | Danh sách và chi tiết hoạt động bình thường khi dữ liệu trường optional (ghiChu, mucNuocCaoNhat) null | Graceful empty-state display |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | Tìm kiếm theo mã cầu hợp lệ → kết quả trong 3s | Performance + Integration |
| TS-002 | AC-002 | Tìm kiếm partial tên cầu (case-insensitive) → đúng kết quả | Integration |
| TS-003 | AC-003 | Lọc theo Bến cảng mẹ → chỉ hiển thị Cầu cảng của Bến đó | Integration |
| TS-004 | AC-004 | Tập 51 bản ghi → phân trang đúng 50/trang | Integration |
| TS-005 | AC-005 | Vai trò Chuyên viên → thấy đủ 15 trường CauCang | Integration + UI |
| TS-006 | AC-006 | Vai trò Người dùng tại Cảng → chỉ thấy 4 trường cơ bản | Security/RBAC |
| TS-007 | AC-007 | API GET /cau-cang/{id} với token A-004 → response không có trường kỹ thuật | Security/API |
| TS-008 | AC-008 | Tìm kiếm mặc định → không trả Cầu cảng trạng thái cho_phe_duyet và da_xoa | Integration |
| TS-009 | AC-009 | Token không có quyền VIEW_CAU_CANG → HTTP 403 | Security |
| TS-010 | AC-010 | Click tên Bến cảng mẹ → điều hướng đến trang chi tiết Bến cảng đúng | UI/Integration |
| TS-011 | AC-001 | Performance: 614 bản ghi, p95 tra cứu ≤ 3s | Performance |
| TS-012 | AC-005 | Trường optional null (ghiChu, mucNuocCaoNhat) → hiển thị empty-state thay vì crash | Negative/UI |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | CauCang entity đã được định nghĩa bởi F-020; F-024 chỉ đọc (read-only), không thêm aggregate/event mới |
| Architecture affected? | Yes | Cần thiết kế API GET endpoint với field-level access control theo role, liên kết cross-entity sang BenCang, live search với debounce |
| Implementation clear? | No | Field-level RBAC projection (ẩn trường theo role tại API layer) và cross-entity navigation link cần quyết định kiến trúc |
| **Verdict** | `Ready for solution architecture` | Read-only feature nhưng có non-trivial API design: field-level role projection + cross-entity BenCang link + performance SLA |
