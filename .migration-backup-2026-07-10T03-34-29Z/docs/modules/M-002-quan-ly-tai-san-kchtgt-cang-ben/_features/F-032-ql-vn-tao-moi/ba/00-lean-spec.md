---
feature-id: F-032
document: lean-spec
output-mode: lean
last-updated: 2026-06-27
---
# Quản lý Vùng nước - Tạo mới

## Summary
Hệ thống chưa có chức năng đăng ký Vùng nước (khu vực mặt nước thuộc quản lý cảng biển phục vụ neo đậu, quay trở và luồng hàng hải) dẫn đến dữ liệu tài sản KCHTGT bị thiếu. Tính năng cho phép Chuyên viên tại Cảng nhập đầy đủ thông tin Vùng nước (mã VN-77, tên, tọa độ, diện tích, độ sâu, điều kiện hải văn, mục đích sử dụng) và lưu ở trạng thái "chờ phê duyệt" để kích hoạt quy trình phê duyệt hai cấp (phòng → Cục). Thành công khi toàn bộ Vùng nước được khai thác đều có bản ghi đầy đủ trong hệ thống với trạng thái rõ ràng sẵn sàng cho quy trình phê duyệt.

## Scope

| | Items |
|---|---|
| In scope | Form tạo mới với các trường bắt buộc; kiểm tra hợp lệ dữ liệu đầu vào; tự động sinh mã vùng nước; lưu trạng thái "chờ phê duyệt"; đính kèm giấy tờ pháp lý; kích hoạt quy trình phê duyệt F-035 |
| Out of scope | Chỉnh sửa sau khi tạo (F-033); xóa (F-034); phê duyệt hai cấp (F-035); xem chi tiết (F-036); quản lý danh mục Cảng biển (module khác) |
| Assumptions | Danh sách Cảng biển quản lý đã tồn tại trong hệ thống và có thể tra cứu qua API; quy tắc sinh mã VN-77 được cung cấp bởi nghiệp vụ |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Chuyên viên (A-003) | Tạo mới một Vùng nước với đầy đủ thông tin bắt buộc | Đưa Vùng nước vào cơ sở dữ liệu tài sản KCHTGT | Must Have |
| US-002 | Chuyên viên (A-003) | Nhận thông báo lỗi rõ ràng khi dữ liệu nhập không hợp lệ | Sửa chữa nhanh mà không phải đoán trường nào sai | Must Have |
| US-003 | Chuyên viên (A-003) | Để hệ thống tự sinh mã Vùng nước theo quy tắc VN-77 | Đảm bảo đúng chuẩn mã mà không cần nhớ quy tắc | Should Have |
| US-004 | Chuyên viên (A-003) | Đính kèm tối thiểu một giấy tờ pháp lý khi tạo mới | Đảm bảo hồ sơ Vùng nước có đầy đủ căn cứ pháp lý | Must Have |
| US-005 | Quản trị viên (A-001) | Tạo mới Vùng nước với đầy đủ quyền hạn | Quản lý toàn bộ dữ liệu tài sản không bị giới hạn | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001 | Tạo mới thành công với đầy đủ dữ liệu | Given Chuyên viên (ROLE_SPECIALIST) đăng nhập hợp lệ và Cảng biển quản lý tồn tại trong hệ thống; When điền đầy đủ mã vùng nước, tên, Cảng biển quản lý, tọa độ biên giới, diện tích (km²), độ sâu trung bình (m), điều kiện hải văn, khả năng thông hành, loại vùng nước và nhấn Lưu; Then hệ thống lưu Vùng nước ở trạng thái "chờ phê duyệt" (cho_phe_duyet), trả về HTTP 201, hiển thị thông báo thành công và ID mới | Phải ghi nhận createdAt, createdBy |
| AC-002 | US-001 | Vùng nước mới không hiển thị trong danh sách khai thác | Given Vùng nước vừa tạo ở trạng thái cho_phe_duyet; When Chuyên viên hoặc người dùng xem danh sách Vùng nước khai thác; Then Vùng nước đó không xuất hiện trong danh sách khai thác | Chỉ Vùng nước trạng thái "hoat_dong" mới xuất hiện trong danh sách khai thác |
| AC-003 | US-001 | Chỉ ROLE_SPECIALIST và ROLE_SYSTEM_ADMIN được tạo mới | Given người dùng có ROLE_PORT_OPERATOR hoặc ROLE_LEADER; When truy cập form tạo mới Vùng nước; Then nhận HTTP 403 Forbidden và không thể submit form | Kiểm tra permission CREATE_VUNG_NUOC |
| AC-004 | US-002 | Từ chối khi mã Vùng nước đã tồn tại | Given mã vùng nước "VN77-001" đã tồn tại trong hệ thống; When Chuyên viên nhập mã trùng và nhấn Lưu; Then hệ thống trả về HTTP 409, hiển thị thông báo lỗi "Mã vùng nước đã tồn tại" ngay tại trường mã | Kiểm tra trước khi insert |
| AC-005 | US-002 | Từ chối khi tên Vùng nước đã tồn tại | Given tên Vùng nước đã tồn tại trong hệ thống; When Chuyên viên nhập tên trùng và nhấn Lưu; Then hệ thống hiển thị thông báo lỗi tại trường tên | Case-insensitive check |
| AC-006 | US-002 | Báo lỗi khi thiếu trường bắt buộc | Given Chuyên viên bỏ trống một trong các trường: mã, tên, Cảng biển quản lý, diện tích, loại vùng nước; When nhấn Lưu; Then hệ thống highlight trường bị thiếu và hiển thị thông báo lỗi rõ ràng, không lưu dữ liệu | Validate phía client và server |
| AC-007 | US-002 | Từ chối diện tích hoặc độ sâu không hợp lệ | Given Chuyên viên nhập diện tích ≤ 0 hoặc độ sâu < 0; When nhấn Lưu; Then hệ thống hiển thị thông báo lỗi định dạng số tại trường tương ứng | Kiểu số thực dương |
| AC-008 | US-003 | Tự động sinh mã Vùng nước khi để trống | Given Chuyên viên không nhập mã vùng nước; When nhấn Lưu với dữ liệu hợp lệ; Then hệ thống tự động sinh mã theo quy tắc VN-77 và lưu thành công | Mã tự sinh phải unique; định dạng theo quy chuẩn VN-77 |
| AC-009 | US-004 | Đính kèm giấy tờ pháp lý thành công | Given Vùng nước mới được tạo; When Chuyên viên tải lên tối thiểu một giấy tờ pháp lý (PDF/DOCX/JPEG, tối đa 10MB); Then giấy tờ được lưu liên kết với Vùng nước và hiển thị trong danh sách đính kèm | Hỗ trợ PDF, DOCX, JPEG; tối đa 10MB mỗi file |
| AC-010 | US-004 | Xác nhận gửi yêu cầu phê duyệt hai cấp | Given Vùng nước ở trạng thái cho_phe_duyet và có ít nhất một giấy tờ đính kèm; When Chuyên viên nhấn "Gửi phê duyệt"; Then hệ thống kích hoạt quy trình phê duyệt F-035 (phòng → Cục) và thông báo thành công | Phụ thuộc F-035 |
| AC-011 | US-005 | ROLE_SYSTEM_ADMIN tạo mới thành công | Given người dùng có ROLE_SYSTEM_ADMIN; When tạo mới Vùng nước với đầy đủ thông tin; Then lưu thành công ở trạng thái cho_phe_duyet | Không bị giới hạn org-unit |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Mã Vùng nước phải là duy nhất trên toàn hệ thống (case-insensitive) | AC-004, AC-008 | Không có ngoại lệ |
| BR-002 | Tên Vùng nước không được trùng với Vùng nước đã tồn tại (case-insensitive) | AC-005 | Không có ngoại lệ |
| BR-003 | Vùng nước mới luôn được tạo ở trạng thái "chờ phê duyệt" (cho_phe_duyet) — không thể bỏ qua | AC-001, AC-002 | Không có ngoại lệ, kể cả ROLE_SYSTEM_ADMIN |
| BR-004 | Các trường bắt buộc khi tạo mới: mã (hoặc tự sinh), tên, Cảng biển quản lý, diện tích, loại vùng nước | AC-006 | Mã có thể tự sinh nếu để trống |
| BR-005 | Chỉ ROLE_SPECIALIST và ROLE_SYSTEM_ADMIN có permission CREATE_VUNG_NUOC; ROLE_PORT_OPERATOR bị giới hạn thêm bởi org-unit filter | AC-003, AC-011 | Không có ngoại lệ |
| BR-006 | Chuyên viên (A-003) chỉ tạo Vùng nước trong phạm vi đơn vị quản lý của mình theo Org Unit Hierarchy | AC-003 | Cục và ROLE_SYSTEM_ADMIN thấy toàn bộ |
| BR-007 | Mã tự sinh phải tuân theo quy tắc VN-77 và phải unique trước khi lưu | AC-008 | Nếu sinh trùng thì thử lại tối đa 3 lần |
| BR-008 | Giấy tờ pháp lý đính kèm: định dạng PDF/DOCX/JPEG, tối đa 10MB mỗi file | AC-009 | Không có ngoại lệ |
| BR-009 | Vùng nước chưa phê duyệt không xuất hiện trong danh sách khai thác công khai | AC-002 | Chỉ ROLE_SPECIALIST và ROLE_SYSTEM_ADMIN có thể xem qua chế độ "Xem tất cả" |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | API tạo mới (POST /vung-nuoc) phản hồi thành công hoặc lỗi | ≤ 2s (p95) kể cả upload file ≤ 2MB; ≤ 5s cho file 10MB |
| Security | Kiểm tra permission CREATE_VUNG_NUOC tại controller và service layer; validate MIME type thực tế của file đính kèm (không chỉ extension) | HTTP 403 cho token thiếu quyền; từ chối file MIME không hợp lệ |
| Reliability | Tạo mới phải là atomic: nếu lưu Vùng nước thành công nhưng upload file thất bại, rollback toàn bộ hoặc cho phép đính kèm lại | Không tạo Vùng nước ở trạng thái inconsistent |
| Audit/Logging | Ghi nhận tự động mọi hành động tạo mới vào bảng lịch sử: người thực hiện, thời gian, payload đầy đủ | Không cho phép bỏ qua; immutable sau khi ghi |
| Operability | Thông báo lỗi phía client rõ ràng từng trường; API trả về error body có field-level validation detail | N/A |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | Tạo mới Vùng nước với đầy đủ dữ liệu hợp lệ | Happy path |
| TS-002 | AC-002 | Xác nhận trạng thái cho_phe_duyet không xuất hiện trong danh sách khai thác | Regression |
| TS-003 | AC-003 | Người dùng ROLE_PORT_OPERATOR nhận HTTP 403 | Security |
| TS-004 | AC-003 | Người dùng ROLE_LEADER nhận HTTP 403 | Security |
| TS-005 | AC-004 | Tạo với mã trùng nhận HTTP 409 + thông báo lỗi tại trường mã | Negative |
| TS-006 | AC-005 | Tạo với tên trùng (case-insensitive) nhận lỗi tại trường tên | Negative |
| TS-007 | AC-006 | Submit form thiếu từng trường bắt buộc lần lượt | Negative |
| TS-008 | AC-007 | Nhập diện tích = 0, diện tích âm, độ sâu âm | Negative |
| TS-009 | AC-008 | Để trống mã, hệ thống tự sinh mã unique theo VN-77 | Happy path |
| TS-010 | AC-009 | Đính kèm file PDF 5MB hợp lệ | Happy path |
| TS-011 | AC-009 | Đính kèm file EXE hoặc file >10MB nhận lỗi | Negative |
| TS-012 | AC-010 | Gửi phê duyệt khi có ít nhất một giấy tờ đính kèm | Integration |
| TS-013 | AC-011 | ROLE_SYSTEM_ADMIN tạo thành công không bị giới hạn org-unit | Happy path |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes | Thực thể VungNuoc và GiayTo mới chưa tồn tại trong hệ thống; cần định nghĩa aggregate root, lifecycle states, domain events TaoMoiVungNuoc |
| Architecture affected? | Yes | Cần endpoint POST /vung-nuoc mới, file storage cho giấy tờ đính kèm, tích hợp với quy trình phê duyệt F-035 |
| Implementation clear? | No | SA cần quyết định storage strategy cho file đính kèm, schema VungNuoc, integration với F-035 |
| **Verdict** | `Ready for solution architecture` | Feature tạo entity hoàn toàn mới với business rules phức tạp, file attachment và workflow phê duyệt hai cấp — SA là bước tiếp theo bắt buộc |
