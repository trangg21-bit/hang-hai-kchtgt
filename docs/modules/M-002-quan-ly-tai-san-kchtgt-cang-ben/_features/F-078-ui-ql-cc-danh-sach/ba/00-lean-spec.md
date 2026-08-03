---
feature-id: F-078
document: lean-spec
output-mode: lean
last-updated: 2026-07-30
---
# Danh sách Cầu cảng (Pier List)

## Summary

Hệ thống cần cung cấp màn hình danh sách Cầu cảng trung tâm, hiển thị toàn bộ các cầu cảng (Pier) thuộc phạm vi quản lý của người dùng với khả năng tìm kiếm nhanh, lọc cascading (Cảng biển → Bến cảng → Cầu cảng), phân trang và sắp xếp. Giải pháp sử dụng 5 component dùng chung (ScreenHeader, FilterBar, StatusTabs, DataTable, Pagination) từ thư viện list-view, hỗ trợ tìm kiếm debounce 400ms trên mã/tên cầu cảng, lọc theo 6 tiêu chí (Port, Berth, Province, operationalStatus, approvalStatus, orgUnit), và 4 tab trạng thái phê duyệt kèm số lượng. Từ danh sách, người dùng có quyền phù hợp có thể điều hướng đến các thao tác xem chi tiết (F-024), tạo mới (F-020), chỉnh sửa (F-021), phê duyệt (F-023), xóa (F-022) và xem lịch sử (F-025). Thành công được đo bằng khả năng người dùng tra cứu, lọc và thao tác trên danh sách cầu cảng trong thời gian đáp ứng ≤ 1 giây cho 20 bản ghi.

## Scope

| | Items |
|---|---|
| In scope | Hiển thị danh sách Cầu cảng có phân trang (20/100 bản ghi/trang); Quick search với debounce 400ms trên pierCode/pierName (substring, case-insensitive); Filter cascading Port → Berth (chỉ APPROVED Berth); Filter theo Province, operationalStatus, approvalStatus (4 tab có đếm); Sort mặc định updatedAt DESC, có thể đảo chiều; Hiển thị đủ 11 cột (STT, pierCode, pierName, Port, Berth, Province, Dimensions, operationalStatus badge, approvalStatus badge, updatedAt, Actions); Row actions: Xem chi tiết, Chỉnh sửa, Xóa, Phê duyệt, Lịch sử (hiển thị theo RBAC + BR-078-07/08/09); Soft-deleted piers (deletedAt != null) bị loại khỏi mọi truy vấn; Keyboard navigation (Tab/Enter) toàn màn hình; Responsive mobile (≤ 768px: card view); Loading skeleton, empty state, error state; Admin Cục thấy full dữ liệu + filter orgUnit + audit fields |
| Out of scope | Tạo mới Cầu cảng (F-020); Cập nhật Cầu cảng (F-021); Xóa Cầu cảng (F-022); Phê duyệt Cầu cảng (F-023); Xem chi tiết Cầu cảng (F-024); Lịch sử Cầu cảng (F-025); Export Excel/PDF (sẽ bổ sung sau); Import dữ liệu hàng loạt; Chỉnh sửa trực tiếp trên bảng (inline edit) |
| Assumptions | Người dùng đã đăng nhập và có JWT token hợp lệ; Cảng biển và Bến cảng cha đã tồn tại và được duyệt trong hệ thống; Các component list-view (ScreenHeader, FilterBar, StatusTabs, DataTable, Pagination) đã có sẵn và tái sử dụng được; API GET `/api/v1/cau-cang` hỗ trợ đầy đủ query params (page, pageSize, sortBy, sortOrder, search, cangBienId, benCangId, diaDiem, trangThaiHoatDong, trangThaiPheDuyet) |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-078-01 | Quản lý tài sản | Xem toàn bộ danh sách Cầu cảng thuộc đơn vị mình | Nắm được hiện trạng tài sản | Must Have |
| US-078-02 | Quản lý tài sản | Tìm kiếm nhanh theo mã hoặc tên cầu cảng | Tra cứu bản ghi cụ thể không cần cuộn toàn bộ danh sách | Must Have |
| US-078-03 | Quản lý tài sản | Lọc theo Cảng biển, Bến cảng và tình trạng hoạt động | Thu hẹp danh sách theo nhu cầu công việc | Must Have |
| US-078-04 | Lãnh đạo | Thấy ngay các cầu cảng đang "Chờ phê duyệt" qua tab trạng thái kèm số lượng | Xử lý phê duyệt kịp thời | Must Have |
| US-078-05 | Người dùng bất kỳ | Click vào một dòng để xem chi tiết cầu cảng | Tra cứu thông tin đầy đủ của cầu cảng | Must Have |
| US-078-06 | Quản lý tài sản | Chuyển đến màn hình chỉnh sửa hoặc xóa trực tiếp từ danh sách | Không phải qua trang chi tiết trước | Should Have |
| US-078-07 | Quản lý tài sản | Xem lịch sử thay đổi của một cầu cảng ngay từ danh sách | Theo dõi được quá trình thay đổi dữ liệu | Should Have |
| US-078-08 | Người dùng | Đổi số bản ghi hiển thị mỗi trang (20/100) và đổi hướng sắp xếp | Linh hoạt khi xem danh sách | Should Have |
| US-078-09 | Người dùng | Điều hướng toàn bộ danh sách chỉ bằng bàn phím (Tab/Enter) | Không cần dùng chuột, đáp ứng WCAG 2.1 AA | Could Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-078-01 | US-078-01 | Hiển thị danh sách mặc định | Given người dùng đã đăng nhập và có quyền xem; When mở màn hình danh sách Cầu cảng; Then hệ thống gọi `GET /api/v1/cau-cang?page=1&pageSize=20&sortBy=updatedAt&sortOrder=DESC` giới hạn theo donViQuanLy của user, hiển thị tối đa 20 bản ghi/trang. Nếu API lỗi, hiển thị cảnh báo đỏ kèm nút "Thử lại" | Page mặc định 1, size 20, sort updatedAt DESC |
| AC-078-02 | US-078-08 | Phân trang tùy chọn | Given danh sách đang hiển thị; When người dùng chọn 100 bản ghi/trang từ dropdown; Then bảng tải lại đúng 100 bản ghi và giữ nguyên các bộ lọc đang áp dụng | Chỉ hỗ trợ 20 hoặc 100; không có "all" |
| AC-078-03 | US-078-02 | Tìm kiếm nhanh | Given người dùng nhập từ khóa vào ô tìm kiếm; When nhấn Enter hoặc chờ debounce 400ms; Then hệ thống tìm kiếm khớp substring trên pierCode OR pierName (case-insensitive) và hiển thị kết quả trong ≤ 500ms. Nếu không có kết quả, hiển thị trạng thái rỗng với hướng dẫn | OR logic trên maCau và tenCau |
| AC-078-04 | US-078-03 | Lọc cascading Port → Berth | Given người dùng chọn một Cảng biển; When dropdown "Thuộc bến cảng" tự động lọc chỉ còn các Bến cảng con của Cảng biển đó và đã APPROVED; When đổi Cảng biển khác; Then lựa chọn Bến cảng bị reset. Khi không chọn Cảng biển, dropdown Bến cảng hiển thị toàn bộ Bến cảng APPROVED trong phạm vi đơn vị | Chỉ hiển thị BenCang có trangThaiPheDuyet = DUOC_PHE_DUYET |
| AC-078-05 | US-078-03 | Lọc theo Địa điểm | Given danh sách đang hiển thị; When người dùng chọn một Tỉnh/Thành phố từ dropdown Địa điểm (danh mục DM_DON_VI_HANH_CHINH); Then bảng lọc chỉ còn các cầu cảng có diaDiem khớp với lựa chọn | Chỉ liệt kê Tỉnh/Thành phố đang có cầu cảng |
| AC-078-06 | US-078-03 | Lọc theo tình trạng hoạt động | Given danh sách đang hiển thị; When người dùng chọn "Hiện hành" (HIEN_HANH) hoặc "Tạm ngừng" (TAM_NGUNG) từ dropdown Tình trạng; Then bảng lọc tương ứng. Chọn "Tất cả" hiển thị toàn bộ | |
| AC-078-07 | US-078-04 | Tab trạng thái phê duyệt | Given danh sách đang hiển thị; When người dùng chuyển qua lại giữa 4 tab "Tất cả / Chờ phê duyệt / Đã phê duyệt / Từ chối"; Then mỗi tab hiển thị số lượng bản ghi tương ứng và danh sách lọc theo trangThaiPheDuyet mà không mất các bộ lọc khác | Tab "Chờ phê duyệt" = CHO_PHE_DUYET |
| AC-078-08 | US-078-01 | Cột hiển thị trên bảng | Given danh sách đã tải; Then mỗi dòng hiển thị đủ 11 cột: STT (số thứ tự), Mã cầu cảng (pierCode, link), Tên cầu cảng (pierName, link), Thuộc cảng biển (Port name), Thuộc bến cảng (Berth name), Địa điểm (province), Kích thước (length×width m), Tình trạng (badge xanh lá/cam), Trạng thái phê duyệt (badge vàng/xanh dương/đỏ), Ngày cập nhật (dd/MM/yyyy HH:mm), Thao tác (nhóm nút) | Định dạng dimensions: "150.5 × 20.0 m" |
| AC-078-09 | US-078-05 | Xem chi tiết | Given danh sách đang hiển thị; When người dùng click vào pierCode hoặc pierName (hoặc nút "Xem"); Then điều hướng đến màn hình xem chi tiết Cầu cảng (F-024) với đúng id/maCau của dòng được chọn | |
| AC-078-10 | US-078-06 | Chỉnh sửa | Given danh sách đang hiển thị; When người dùng là Admin hoặc Quản lý tài sản thuộc cùng donViQuanLy với cầu cảng; Then nút "Chỉnh sửa" hiển thị; click điều hướng đến màn hình chỉnh sửa (F-021) với form điền sẵn dữ liệu. Người dùng khác không thấy nút này | BR-078-09 |
| AC-078-11 | US-078-06 | Xóa | Given danh sách đang hiển thị; When cầu cảng có trangThaiPheDuyet = CHO_PHE_DUYET, chưa gửi phê duyệt, và người dùng có quyền phù hợp; Then nút "Xóa" hiển thị; click mở hộp thoại xác nhận → gọi `DELETE /api/v1/cau-cang/:id`. When cầu cảng có dữ liệu liên quan (tài sản, vận hành); Then hệ thống chặn xóa, hiển thị cảnh báo | BR-078-07; soft-delete |
| AC-078-12 | US-078-06 | Phê duyệt | Given danh sách đang hiển thị; When người dùng là Lãnh đạo hoặc Admin và trangThaiPheDuyet = CHO_PHE_DUYET; Then nút "Phê duyệt" hiển thị; click điều hướng đến màn hình phê duyệt (F-023) | BR-078-08 |
| AC-078-13 | US-078-07 | Lịch sử | Given danh sách đang hiển thị; When người dùng có quyền xem; Then nút "Lịch sử" luôn hiển thị; click điều hướng đến màn hình lịch sử thay đổi (F-025) của cầu cảng được chọn | Mọi vai trò có quyền xem |
| AC-078-14 | US-078-01 | Ẩn cầu cảng đã xóa | Given danh sách đang hiển thị ở bất kỳ bộ lọc nào; Then cầu cảng có deletedAt != null không xuất hiện trong kết quả (BR-078-06) | Chỉ tra cứu lại qua màn hình Lịch sử |
| AC-078-15 | US-078-09 | Điều hướng bàn phím | Given người dùng ở màn hình danh sách; When nhấn Tab; Then focus di chuyển tuần tự: ô tìm kiếm → các dropdown lọc → tab trạng thái → các hàng dữ liệu → nhóm nút hành động → phân trang. When nhấn Enter; Then kích hoạt phần tử đang focus | WCAG 2.1 AA |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-078-01 | Danh sách hiển thị mặc định 20 bản ghi/trang, có thể đổi sang 100 bản ghi/trang. Không hỗ trợ hiển thị "tất cả" trong một trang | AC-078-01, AC-078-02 | Không có ngoại lệ |
| BR-078-02 | Danh sách sắp xếp mặc định theo updatedAt DESC (bản ghi thay đổi gần nhất lên đầu). Người dùng có thể đổi hướng sắp xếp nhưng không đổi được cột sắp xếp | AC-078-01, AC-078-08 | Không có ngoại lệ |
| BR-078-03 | Dữ liệu được giới hạn theo donViQuanLy của người dùng đăng nhập. Admin Cục xem được toàn bộ hệ thống và có thể chọn lọc theo đơn vị bất kỳ | AC-078-01 | Admin Cục xem full dữ liệu + có thêm filter orgUnit |
| BR-078-04 | Từ khóa tìm kiếm được áp dụng đồng thời trên pierCode (maCau) và pierName (tenCau) theo kiểu OR — trả về bản ghi khớp ở bất kỳ trường nào (substring, case-insensitive) | AC-078-03 | Không có ngoại lệ |
| BR-078-05 | Dropdown "Thuộc bến cảng" luôn được lọc theo Cảng biển đã chọn (nếu có) và chỉ hiển thị Bến cảng ở trạng thái DUOC_PHE_DUYET. Khi đổi Cảng biển, lựa chọn Bến cảng bị reset | AC-078-04 | Không có ngoại lệ |
| BR-078-06 | Cầu cảng có deletedAt != null bị loại khỏi mọi truy vấn danh sách, không phân biệt bộ lọc đang áp dụng. Chỉ có thể tra cứu lại qua màn hình Lịch sử (F-025) | AC-078-14 | Không có ngoại lệ |
| BR-078-07 | Nút "Xóa" chỉ hiển thị khi đồng thời: (1) trangThaiPheDuyet = CHO_PHE_DUYET và cầu cảng chưa được gửi phê duyệt, (2) người dùng thuộc đúng donViQuanLy hoặc có vai trò Admin/Lãnh đạo. Cầu cảng đã gửi duyệt, đã duyệt hoặc bị từ chối không hiển thị nút Xóa | AC-078-11 | Không có ngoại lệ |
| BR-078-08 | Nút "Phê duyệt" chỉ hiển thị cho vai trò Lãnh đạo hoặc Admin, và chỉ khi trangThaiPheDuyet = CHO_PHE_DUYET | AC-078-12 | Không có ngoại lệ |
| BR-078-09 | Nút "Chỉnh sửa" hiển thị cho Admin hoặc Quản lý tài sản thuộc đúng đơn vị quản lý với cầu cảng, ở mọi trạng thái phê duyệt. Sửa một cầu cảng đã DUOC_PHE_DUYET sẽ đưa nó quay về CHO_PHE_DUYET | AC-078-10 | Admin thấy nút ở mọi trạng thái; QLTS chỉ thấy nút khi cùng đơn vị |
| BR-078-10 | Toàn bộ thao tác trên màn hình (lọc, chọn dòng, kích hoạt hành động) phải thực hiện được bằng Tab/Enter, không phụ thuộc chuột, để đáp ứng WCAG 2.1 AA | AC-078-15 | Không có ngoại lệ |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Thời gian tải danh sách lần đầu (20 bản ghi) | ≤ 1 giây |
| Performance | Thời gian phản hồi khi áp dụng bộ lọc hoặc tìm kiếm | ≤ 500ms |
| Performance | Dropdown cascading (Cảng biển → Bến cảng) phản hồi khi đổi lựa chọn | ≤ 300ms |
| Performance | Tìm kiếm quick search với debounce 400ms, không gửi request cho mỗi ký tự | 400ms debounce |
| Security | Phân quyền RBAC trên tất cả API; JWT token bắt buộc; lọc dữ liệu theo donViQuanLy ở tầng backend | HTTP 403 khi không có quyền |
| Security | Nút Chỉnh sửa/Xóa/Phê duyệt chỉ hiển thị khi đúng vai trò + phạm vi đơn vị; Backend cũng từ chối request trái phép | UI + API enforcement |
| Reliability | Dữ liệu danh sách được làm mới sau mỗi thao tác Xóa/Phê duyệt/Chỉnh sửa thành công | Tránh hiển thị trạng thái cũ |
| Reliability | Cầu cảng đã xóa mềm (deletedAt != null) không bao giờ xuất hiện lại trong danh sách chính | BR-078-06 enforced |
| UX | Giao diện responsive: ≤ 768px chuyển sang card view, FilterBar thành panel gập, StatusTabs thành dropdown | WCAG 2.1 AA |
| UX | Có loading skeleton khi đang tải dữ liệu; empty state với hướng dẫn khi không có kết quả; error state với nút "Thử lại" | 3 states bắt buộc |
| Compliance | Mã cầu cảng hiển thị tuân thủ chuẩn mã hóa VN-614; dữ liệu tuân thủ Thông tư 48/2017/TT-BGTVT | 100% |
| Maintainability | Cấu trúc bộ lọc cho phép bổ sung thêm tiêu chí lọc mà không thay đổi API hiện có | Extensible design |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-078-01 | AC-078-01 | Happy path: Mở màn hình danh sách mặc định → tải 20 bản ghi, sort updatedAt DESC, filter theo donViQuanLy của user | Integration |
| TS-078-02 | AC-078-02 | Happy path: Đổi page size từ 20 sang 100 → tải lại 100 bản ghi, giữ nguyên bộ lọc | Integration |
| TS-078-03 | AC-078-03 | Happy path: Nhập từ khóa tìm kiếm "Cầu 01" → debounce 400ms → hiển thị kết quả khớp maCau hoặc tenCau trong ≤ 500ms | Integration |
| TS-078-04 | AC-078-04 | Edge: Chọn Cảng biển A → dropdown Bến cảng chỉ hiển thị Bến cảng con của A, đã APPROVED; đổi sang Cảng biển B → reset lựa chọn Bến cảng | Integration |
| TS-078-05 | AC-078-07 | Happy path: Chuyển tab "Chờ phê duyệt" → danh sách lọc theo trangThaiPheDuyet = CHO_PHE_DUYET, giữ nguyên bộ lọc khác, tab hiển thị đúng số lượng | Integration |
| TS-078-06 | AC-078-08 | Happy path: Verify 11 cột hiển thị đúng: STT, pierCode, pierName, Port, Berth, Province, Dimensions (m), operationalStatus badge, approvalStatus badge, updatedAt, Actions | UI |
| TS-078-07 | AC-078-10, AC-078-11, AC-078-12 | Boundary: Kiểm tra hiển thị nút hành động theo vai trò — QLTS thấy Xem/Sửa/Xóa/Lịch sử; Lãnh đạo thấy Xem/Phê duyệt/Lịch sử; Admin thấy tất cả; Admin Cục thấy tất cả + audit fields | Security |
| TS-078-08 | AC-078-11, AC-078-14 | Negative: Xóa cầu cảng có trangThaiPheDuyet = DUOC_PHE_DUYET → nút Xóa không hiển thị; Xóa cầu cảng PENDING có dữ liệu liên quan → chặn xóa + cảnh báo | Integration |
| TS-078-09 | AC-078-14 | Negative: Verify soft-deleted piers (deletedAt != null) không xuất hiện trong bất kỳ bộ lọc/tab nào | Integration |
| TS-078-10 | AC-078-01 | Negative: API trả về lỗi (network error / 500) → hiển thị cảnh báo đỏ + nút "Thử lại" → click Thử lại → gọi lại API | UI |
| TS-078-11 | AC-078-01 | Edge: Danh sách trống (không có cầu cảng nào phù hợp) → hiển thị empty state với hướng dẫn thân thiện | UI |
| TS-078-12 | AC-078-15 | Happy path: Tab di chuyển tuần tự qua ô tìm kiếm → dropdown lọc → tab trạng thái → hàng dữ liệu → nút hành động → phân trang; Enter kích hoạt phần tử focus | UI (E2E) |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No — read-only | Tính năng chỉ đọc dữ liệu (query list), không tạo hay sửa bảng. Các bảng CauCang, CangBien, BenCang đã tồn tại; các trường donViQuanLy, cangBienId, diaDiem, createdBy, createdAt, updatedBy đã được bổ sung từ F-020/F-021. Không có aggregate mới |
| Architecture affected? | No | Sử dụng component list-view có sẵn (ScreenHeader, FilterBar, StatusTabs, DataTable, Pagination) theo pattern đã thiết lập ở UsersPage.tsx. API GET list với query params là pattern chuẩn. Cascading filter là logic client-side đã có tiền lệ |
| Implementation clear? | Yes | Pattern danh sách + lọc + phân trang đã rõ từ nhiều màn hình trước; keyboard navigation cần implement riêng nhưng approach rõ ràng (tabIndex, keydown handler); 12 test scenarios đã cover đủ edge cases |
| **Verdict** | `Ready for Technical Lead planning` | Màn hình danh sách read-only với 6 bộ lọc, 4 tab trạng thái, 5 component list-view; không có quyết định kiến trúc mới; implementation approach rõ ràng từ pattern UsersPage.tsx và các màn hình danh sách khác |
