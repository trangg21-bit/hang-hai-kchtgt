---
feature-id: F-022
document: lean-spec
output-mode: lean
last-updated: 2026-07-29
---

# Xóa Cầu cảng (Soft-delete Pier)

## Summary

Hệ thống cần cho phép người dùng có thẩm quyền (Admin, Lãnh đạo) xóa mềm (soft delete) một Pier (Cầu cảng) không còn hoạt động hoặc được tạo nhầm nhằm đảm bảo tính chính xác và gọn nhẹ của danh sách tài sản KCHTGT. Giải pháp thực hiện soft delete — chỉ set trường `deletedAt` và `deletedBy`, không xóa vật lý bản ghi khỏi database — để phục vụ kiểm toán và truy vết sau này. Chỉ Pier ở trạng thái `approvalStatus = PENDING` và chưa được gửi duyệt mới được phép xóa. Hệ thống kiểm tra ràng buộc dữ liệu liên quan (tài sản, vận hành, bảo trì, sự cố) trước khi cho phép xóa; nếu có dữ liệu liên quan, thao tác bị chặn và hiển thị cảnh báo chi tiết. Mọi thao tác xóa thành công đều được ghi vào bảng ChangeLog với `actionType = SOFT_DELETE` trong cùng một transaction. Thành công được đo bằng tính toàn vẹn dữ liệu sau xóa (bản ghi còn tồn tại với `deletedAt` được set) và đầy đủ nhật ký kiểm toán.

## Scope

| | Items |
|---|---|
| In scope | Giao diện nút "Xóa" trên danh sách Pier (F-078) dành cho Admin/Lãnh đạo; Hộp thoại xác nhận xóa kèm nhập tên Pier để xác nhận; Kiểm tra ràng buộc dữ liệu liên quan trước khi xóa; Soft delete qua `DELETE /api/v1/cau-cang/:id` (set `deletedAt`, `deletedBy`); Ghi nhật ký thay đổi tự động trong ChangeLog với `actionType = SOFT_DELETE`; Xóa dữ liệu GIS spatial của Pier; Thông báo kết quả cho người dùng; Pier biến mất khỏi danh sách và dropdown sau khi xóa |
| Out of scope | Xóa vật lý (physical delete) bản ghi Pier khỏi database; Cascade delete dữ liệu liên quan (tài sản, vận hành, bảo trì); Khôi phục (restore) Pier đã xóa; Xóa Pier ở trạng thái APPROVED, REJECTED hoặc PENDING đã gửi duyệt; Quy trình phê duyệt xóa; Import/Export danh sách Pier đã xóa |
| Assumptions | Người dùng đã đăng nhập và có vai trò Admin hoặc Lãnh đạo; Pier đã tồn tại trong hệ thống (được tạo qua F-020); Pier có trường `approvalStatus` để xác định trạng thái phê duyệt; Các dữ liệu liên quan (tài sản, vận hành, bảo trì, sự cố) đã được thiết lập quan hệ với Pier qua khóa ngoại |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-022-01 | Quản trị viên / Lãnh đạo | Xóa một Pier khỏi danh sách hoạt động khi Pier không còn sử dụng hoặc được tạo nhầm | Giúp duy trì danh sách tài sản KCHTGT chính xác, gọn nhẹ, loại bỏ dữ liệu không còn giá trị sử dụng | Must Have |
| US-022-02 | Hệ thống (tự động) | Chặn xóa Pier khi Pier đang có dữ liệu liên quan (tài sản, vận hành, bảo trì, sự cố) | Đảm bảo tính toàn vẹn dữ liệu, tránh mất mát thông tin tham chiếu | Must Have |
| US-022-03 | Hệ thống (tự động) | Chặn xóa Pier đã bị xóa trước đó (`deletedAt != null`) | Tránh thao tác trùng lặp, không gây nhầm lẫn cho người dùng | Must Have |
| US-022-04 | Hệ thống (tự động) | Ghi nhật ký kiểm toán đầy đủ sau mỗi lần xóa thành công | Đảm bảo truy vết kiểm toán, phục vụ điều tra khi có tranh chấp hoặc kiểm tra sau này | Must Have |
| US-022-05 | Quản trị viên / Lãnh đạo | Pier đã xóa biến mất khỏi tất cả danh sách và dropdown trong hệ thống sau khi soft delete | Đảm bảo người dùng không thao tác trên dữ liệu đã bị xóa | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-022-01 | US-022-01 | Nút "Xóa" chỉ hiển thị cho Admin/Lãnh đạo trên Pier PENDING chưa gửi duyệt | Given người dùng có role Admin hoặc Lãnh đạo đang ở trang danh sách Pier (F-078); When Pier có `approvalStatus = PENDING` và chưa được gửi duyệt; Then nút "Xóa" hiển thị trên hàng tương ứng | Nút Xóa không hiển thị với role khác Admin/Lãnh đạo; Nút Xóa không hiển thị nếu Pier đã được gửi duyệt hoặc ở trạng thái khác PENDING |
| AC-022-02 | US-022-01 | Hộp thoại xác nhận xóa xuất hiện khi click "Xóa" | Given người dùng đang ở danh sách Pier; When người dùng click nút "Xóa" trên một Pier; Then hệ thống hiển thị hộp thoại Modal xác nhận bao gồm: (1) thông tin Pier (pierCode, pierName), (2) cảnh báo "Dữ liệu vẫn được lưu trữ để phục vụ kiểm toán", (3) ô nhập tên Pier để xác nhận, (4) nút "Xóa" màu đỏ (pill, disabled đến khi nhập đúng tên), (5) nút "Hủy" (pill outline) | Nút Xóa chỉ enabled khi người dùng nhập chính xác `pierName` |
| AC-022-03 | US-022-02 | Chặn xóa Pier có dữ liệu liên quan | Given Pier đang có dữ liệu liên quan (tài sản, vận hành, bảo trì, sự cố); When người dùng thực hiện xóa; Then hệ thống chặn xóa, hiển thị danh sách chi tiết các module đang tham chiếu với thông báo "Vui lòng xử lý dữ liệu liên quan trước khi xóa" | Kiểm tra server-side, không dựa hoàn toàn vào UI; Hiển thị rõ module và số lượng bản ghi liên quan |
| AC-022-04 | US-022-03 | Chặn xóa Pier đã bị xóa trước đó | Given Pier đã có `deletedAt != null` (đã bị soft delete trước đó); When người dùng thực hiện xóa; Then hệ thống chặn xóa với thông báo "Cầu cảng đã bị xóa trước đó" | Kiểm tra `deletedAt` ở server-side; HTTP 422 hoặc 400 |
| AC-022-05 | US-022-01, US-022-04 | Xóa thành công — soft delete + audit log | Given Pier hợp lệ (PENDING, chưa gửi duyệt, không có dữ liệu liên quan, `deletedAt IS NULL`); When người dùng xác nhận xóa; Then (1) `deletedAt = current_timestamp`, (2) `deletedBy = current_user_id`, (3) dữ liệu GIS spatial của Pier bị xóa, (4) bản ghi ChangeLog được tạo với `actionType = SOFT_DELETE` và operatorId là người thực hiện, (5) hiển thị Toast "Xóa cầu cảng thành công" | Toàn bộ thao tác trong một transaction — nếu bất kỳ bước nào thất bại, rollback toàn bộ |
| AC-022-06 | US-022-05 | Pier không còn hiển thị trong danh sách sau khi xóa | Given Pier vừa bị xóa thành công; When người dùng ở trang danh sách Pier (F-078); Then Pier không xuất hiện trong danh sách (bộ lọc mặc định `deletedAt IS NULL`); Nếu đang ở trang chi tiết Pier (F-024), hệ thống redirect về danh sách | Bộ lọc `deletedAt IS NULL` được áp dụng mặc định cho mọi truy vấn danh sách |
| AC-022-07 | US-022-01 | Chặn xóa Pier ở trạng thái APPROVED, REJECTED hoặc PENDING đã gửi duyệt | Given Pier có `approvalStatus = APPROVED`, `REJECTED`, hoặc PENDING đã gửi duyệt; When người dùng thực hiện xóa; Then hệ thống chặn xóa với thông báo tương ứng theo từng trạng thái | Xem bảng trạng thái tại feature-brief section 2.2 |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-022-01 | Chỉ người dùng có role Admin hoặc Lãnh đạo mới được phép xóa Pier; kiểm tra phải được thực thi ở tầng API, không chỉ UI | AC-022-01 | Không có ngoại lệ |
| BR-022-02 | Chỉ Pier có `approvalStatus = PENDING` và chưa được gửi duyệt mới được phép xóa; Pier đã gửi duyệt (`PENDING` submitted), đã duyệt (`APPROVED`), hoặc bị từ chối (`REJECTED`) không được phép xóa | AC-022-01, AC-022-07 | Không có ngoại lệ |
| BR-022-03 | Xóa Pier là soft delete — chỉ set `deletedAt` và `deletedBy`, không xóa vật lý bản ghi khỏi database; dữ liệu vẫn tồn tại để phục vụ kiểm toán nhưng không hiển thị ở bất kỳ đâu trong hệ thống | AC-022-05, AC-022-06 | Không có ngoại lệ |
| BR-022-04 | Kiểm tra dữ liệu liên quan (tài sản, vận hành, bảo trì, sự cố) trước khi xóa; nếu còn bất kỳ dữ liệu liên quan nào, chặn xóa và hiển thị cảnh báo chi tiết kèm danh sách module tham chiếu | AC-022-03 | Không có ngoại lệ |
| BR-022-05 | Xóa Pier không tự động xóa dữ liệu liên quan (no cascade delete); người dùng phải xử lý hoặc di chuyển dữ liệu liên quan trước khi xóa Pier | AC-022-03 | Không có ngoại lệ |
| BR-022-06 | Mọi thao tác xóa thành công đều tạo bản ghi ChangeLog với `actionType = SOFT_DELETE`, ghi nhận `operatorId` (người thực hiện), thời gian, và ID của Pier bị xóa; việc ghi ChangeLog phải nằm trong cùng transaction với thao tác xóa | AC-022-05 | Không có ngoại lệ |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | API xóa (bao gồm kiểm tra ràng buộc + soft delete + ghi ChangeLog) phải hoàn thành trong thời gian chấp nhận được | ≤ 2 giây (p95) |
| Security | Phân quyền server-side bắt buộc (Admin/Lãnh đạo); kiểm tra `approvalStatus` và `deletedAt` ở tầng API, không chỉ UI | HTTP 403 khi không có quyền; HTTP 422 khi vi phạm ràng buộc |
| Reliability | Soft delete Pier, xóa GIS spatial, và ghi ChangeLog phải nằm trong một transaction; nếu một phần thất bại, toàn bộ rollback | 100% consistency giữa Pier, GIS spatial và ChangeLog |
| Audit/Logging | Mỗi lần xóa thành công ghi đầy đủ ChangeLog: `actionType = SOFT_DELETE`, `operatorId`, `pierId`, `thoiGian` (timestamp) | 100% coverage cho mọi thao tác xóa |
| Operability | Thông báo lỗi rõ ràng bằng tiếng Việt cho từng trường hợp (thiếu quyền, sai trạng thái, đã xóa, có dữ liệu liên quan); không để lộ stack trace cho người dùng | N/A |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-022-01 | AC-022-01, AC-022-05 | Happy path: Admin xóa Pier PENDING chưa gửi duyệt không có dữ liệu liên quan → 200 OK, `deletedAt` được set, ChangeLog ghi nhận SOFT_DELETE | Integration |
| TS-022-02 | AC-022-01 | Negative: Role không phải Admin/Lãnh đạo (vd Nhan_vien_van_hanh) gọi DELETE /api/v1/cau-cang/{id} → HTTP 403 | Security / Integration |
| TS-022-03 | AC-022-07 | Negative: Xóa Pier có `approvalStatus = APPROVED` → HTTP 422 với thông báo "Cầu cảng đã được duyệt, không thể xóa" | Integration |
| TS-022-04 | AC-022-03 | Negative: Xóa Pier có dữ liệu liên quan (ví dụ đang có tài sản gắn với Pier) → HTTP 422 với danh sách module tham chiếu | Integration |
| TS-022-05 | AC-022-04 | Negative: Xóa Pier đã có `deletedAt != null` → HTTP 422 với thông báo "Cầu cảng đã bị xóa trước đó" | Integration |
| TS-022-06 | AC-022-05 | Audit: Sau xóa thành công, ChangeLog có bản ghi với `actionType = SOFT_DELETE` và đúng `operatorId` | Integration |
| TS-022-07 | AC-022-05 | Transaction: Nếu ghi ChangeLog thất bại → soft delete Pier rollback, Pier vẫn ở trạng thái ban đầu, `deletedAt` không được set | Integration |
| TS-022-08 | AC-022-06 | UI: Sau xóa thành công, Pier không xuất hiện trong danh sách F-078; nếu đang ở trang chi tiết F-024 → tự động redirect về danh sách | Integration / UI |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No - existing | Sử dụng entity Pier (CauCang) và ChangeLog (LichSuThayDoi) đã được định nghĩa tại F-020; soft delete pattern không yêu cầu aggregate root, bounded context, hoặc domain event mới |
| Architecture affected? | No | Xóa mềm (soft delete) là pattern đã có trong hệ thống; ghi ChangeLog với `actionType` trong transaction là pattern đã được thiết lập từ F-021; cùng pattern với các feature delete khác |
| Implementation clear? | Yes | Pattern DELETE API + kiểm tra ràng buộc dữ liệu + soft delete + transactional audit log là kiến trúc đã được thiết lập; không cần quyết định kiến trúc mới |
| **Verdict** | `Ready for Technical Lead planning` | Thay đổi chỉ mở rộng entity hiện có (F-020 đã định nghĩa CauCang + LichSuThayDoi), pattern soft delete đã có sẵn, implementation approach rõ ràng từ pattern F-021/F-020 |
