---
feature-id: F-020
document: lean-spec
output-mode: lean
last-updated: 2026-07-28
---
# Tạo mới Cầu cảng

## Summary

Hệ thống cần cho phép người dùng có thẩm quyền (Admin, Quản lý tài sản) tạo mới Cầu cảng vào hệ thống quản lý tài sản KCHTGT cảng-bến với đầy đủ thông tin kỹ thuật. Giải pháp cung cấp biểu mẫu tạo mới gồm 11 nhóm thông tin (collapsible sections), hỗ trợ 3 chế độ lưu (Lưu tạm, Lưu và gửi phê duyệt, Lưu và phê duyệt), validation chặt chẽ với mã cầu chuẩn VN-614, lọc dữ liệu cha-con theo phân cấp Cảng biển → Bến cảng → Cầu cảng, và ghi nhật ký tự động. Thành công được đo bằng khả năng tạo mới cầu cảng với trạng thái PENDING và sẵn sàng cho quy trình phê duyệt tại F-023.

## Scope

| | Items |
|---|---|
| In scope | Hiển thị form tạo mới với 11 nhóm thông tin dạng collapsible; Validation mã cầu cảng chuẩn VN-614 (6-10 ký tự, duy nhất toàn hệ thống); Validation kích thước (length, width), số lượng, tọa độ; Conditional validation ATHH (documentNumber + documentDate khi chọn "Có"); 3 chế độ lưu: Lưu tạm, Lưu và gửi phê duyệt, Lưu và phê duyệt; Lọc Cảng biển/Bến cảng/Luồng HH theo đơn vị quản lý và trạng thái đã duyệt; Ghi nhật ký tự động (ChangeLog); Phân quyền RBAC (nút "Lưu và phê duyệt" chỉ cho Admin/Lãnh đạo); Quản lý file đính kèm và tọa độ GIS |
| Out of scope | Cập nhật Cầu cảng sau khi tạo (F-021); Xóa Cầu cảng (F-022); Phê duyệt Cầu cảng (F-023); Xem chi tiết/lịch sử Cầu cảng (F-024, F-025); Gắn tài sản cho Cầu cảng (F-026+); Xuất báo cáo |
| Assumptions | Người dùng đã đăng nhập và có vai trò Admin hoặc Quản lý tài sản; Cảng biển và Bến cảng cha đã tồn tại và được duyệt trong hệ thống; Mã cầu cảng tuân thủ chuẩn VN-614; Dữ liệu được lọc theo đơn vị quản lý của người dùng |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-020-01 | Quản lý tài sản | Tạo mới Cầu cảng với đầy đủ thông tin kỹ thuật | Đăng ký tài sản vào hệ thống quản lý | Must Have |
| US-020-02 | Quản lý tài sản | Hệ thống kiểm tra mã cầu cảng (pierCode) không trùng lặp | Đảm bảo tính duy nhất của dữ liệu | Must Have |
| US-020-03 | Quản lý tài sản | Chỉ chọn Bến cảng (berth) và Cảng biển (port) đang hoạt động | Đảm bảo cầu cảng được gán đúng đơn vị hợp lệ | Must Have |
| US-020-04 | Quản lý tài sản | "Lưu tạm" cầu cảng để chỉnh sửa thêm | Linh hoạt trong quy trình nhập liệu | Must Have |
| US-020-05 | Quản lý tài sản | "Lưu và gửi phê duyệt" cầu cảng | Gửi đến cấp có thẩm quyền xem xét | Must Have |
| US-020-06 | Admin/Lãnh đạo | "Lưu và phê duyệt" ngay | Đưa cầu cảng vào sử dụng không cần chờ duyệt | Must Have |
| US-020-07 | Quản lý tài sản | Nhận thông báo rõ ràng khi tạo mới thành công/thất bại | Biết trạng thái thao tác | Should Have |
| US-020-08 | Quản lý tài sản | Chuyển hướng về danh sách sau khi tạo mới thành công | Tiếp tục công việc | Should Have |
| US-020-09 | Quản lý tài sản | Upload giấy tờ đính kèm (documents) ngay khi tạo mới | Hoàn thiện hồ sơ trong một lần thao tác | Could Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-020-01 | US-020-01 | Hiển thị form tạo mới | Given người dùng có role Admin hoặc Quản lý tài sản; When nhấn "Tạo mới" từ danh sách Cầu cảng; Then hệ thống hiển thị form với 11 nhóm trường dạng collapsible | Nếu không có quyền, nút "Tạo mới" bị ẩn, API trả về 403 |
| AC-020-02 | US-020-02 | Validation mã cầu cảng | Given người dùng nhập mã cầu (pierCode); When mã không đúng chuẩn VN-614 hoặc đã tồn tại; Then hiển thị lỗi "Mã cầu cảng đã tồn tại" hoặc lỗi định dạng, chặn submit | Độ dài 6-10 ký tự, unique constraint |
| AC-020-03 | US-020-03 | Validation cảng biển và bến cảng | Given form tạo mới; When chọn portId/berthId không đã duyệt hoặc ngoài đơn vị quản lý; Then dropdown không hiển thị hoặc backend trả 400 | Chỉ hiển thị cảng/bến đã duyệt, filter theo đơn vị QL |
| AC-020-04 | US-020-01 | Validation kích thước | Given người dùng nhập length/width ≤ 0 hoặc > 500m; When nhấn Lưu; Then hiển thị lỗi tại trường tương ứng | Số thập phân dương, ≤ 500m |
| AC-020-05 | US-020-01 | Validation số lượng | Given người dùng nhập số lượng không phải số hoặc > 5 chữ số; When nhấn Lưu; Then hiển thị lỗi validation | Chỉ nhập số, tối đa 5 chữ số |
| AC-020-06 | US-020-01 | Conditional validation ATHH | Given người dùng chọn "Có" tại receivesLargeVessel; When để trống documentNumber hoặc documentDate; Then hiển thị lỗi bắt buộc; When chọn "Không"; Then clear validation 2 trường này | |
| AC-020-07 | US-020-04 | Lưu tạm thành công | Given form hợp lệ; When nhấn "Lưu tạm"; Then Cầu cảng lưu trạng thái PENDING, ghi ChangeLog, thông báo "Lưu tạm cầu cảng thành công", redirect về danh sách | Có thể sửa tiếp (F-021) |
| AC-020-08 | US-020-05 | Lưu và gửi phê duyệt thành công | Given form hợp lệ; When nhấn "Lưu và gửi phê duyệt"; Then Cầu cảng lưu trạng thái PENDING + cờ gửi duyệt, thông báo "Đã gửi phê duyệt cầu cảng", redirect về danh sách | Xuất hiện trong danh sách chờ duyệt F-023 |
| AC-020-09 | US-020-06 | Lưu và phê duyệt thành công | Given Admin/Lãnh đạo, form hợp lệ; When nhấn "Lưu và phê duyệt"; Then Cầu cảng lưu trạng thái APPROVED, thông báo "Tạo mới và phê duyệt cầu cảng thành công" | Cầu cảng sẵn sàng sử dụng ngay |
| AC-020-10 | US-020-01 | Các trường bắt buộc | Given người dùng bỏ trống trường bắt buộc; When nhấn Lưu; Then hiển thị lỗi "Trường này là bắt buộc", chặn submit | Validation cả client và server |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-020-01 | Mã cầu cảng (pierCode) là duy nhất toàn hệ thống và bất biến sau khi tạo; thay đổi mã yêu cầu hủy bỏ và tạo lại | AC-020-02 | Không có ngoại lệ |
| BR-020-02 | Cảng biển (port) và Bến cảng (berth) được chọn phải ở trạng thái đã duyệt và đang hoạt động; không chọn cảng/bến "Chờ phê duyệt" (PENDING), "Tạm ngừng" (SUSPENDED), hoặc "Đã xóa" (soft-deleted) | AC-020-03 | Không có ngoại lệ |
| BR-020-03 | Thứ tự tạo bắt buộc: Cảng biển → Bến cảng → Cầu cảng; không thể tạo Cầu cảng nếu chưa có Bến cảng cha đã duyệt | AC-020-03 | Không có ngoại lệ |
| BR-020-04 | Cầu cảng trạng thái PENDING chưa được tham chiếu bởi bất kỳ module nào khác; phải qua phê duyệt (F-023) đạt APPROVED mới sử dụng được | AC-020-07, AC-020-08, AC-020-09 | Không có ngoại lệ |
| BR-020-05 | Mọi thao tác tạo mới được ghi tự động vào ChangeLog (actionType=CREATE) | AC-020-07, AC-020-08, AC-020-09 | Không có ngoại lệ |
| BR-020-06 | Validation được thực hiện ở cả client-side và server-side | AC-020-01 đến AC-020-10 | Không có ngoại lệ |
| BR-020-07 | Đơn vị quản lý (orgUnitId) mặc định theo đơn vị của user đăng nhập; chỉ thấy dữ liệu trong phạm vi đơn vị của mình | AC-020-03 | Không có ngoại lệ |
| BR-020-08 | Dropdown Cảng biển/Bến cảng/Luồng HH được lọc theo Đơn vị quản lý; khi thay đổi orgUnitId, load lại dropdown phụ thuộc | AC-020-03 | Không có ngoại lệ |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Thời gian kiểm tra trùng lặp mã cầu (real-time) | ≤ 500ms |
| Performance | Thời gian tạo mới (từ nhấn Lưu đến redirect) | ≤ 2 giây (p95) |
| Performance | Dropdown phụ thuộc phản hồi khi thay đổi lựa chọn | ≤ 300ms |
| Security | Phân quyền RBAC trên tất cả API; JWT token bắt buộc; createdBy lấy từ token | HTTP 403 khi không có quyền |
| Security | Nút "Lưu và phê duyệt" chỉ hiển thị cho Admin/Lãnh đạo | UI + API enforcement |
| Reliability | Unique constraint pierCode ở tầng database; validation cả client và server | 100% consistency |
| Operability | Thông báo lỗi rõ ràng bằng tiếng Việt, tương ứng từng trường | Không để lộ stack trace |
| UX | Giao diện responsive (≤ 768px: menu thu gọn); loading skeleton khi tải; empty state khi dropdown trống | WCAG 2.1 AA |
| Compliance | Mã cầu cảng tuân thủ chuẩn VN-614; dữ liệu tuân thủ Thông tư 48/2017/TT-BGTVT | 100% |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-020-01 | AC-020-01 | Happy path: Admin/Quản lý tài sản mở form tạo mới từ danh sách | Integration |
| TS-020-02 | AC-020-01 | Negative: Người dùng không có quyền truy cập URL tạo mới trực tiếp → HTTP 403 | Security |
| TS-020-03 | AC-020-02 | Negative: Nhập pierCode đã tồn tại → lỗi "Mã cầu cảng đã tồn tại" | Integration |
| TS-020-04 | AC-020-02 | Negative: Nhập pierCode không đúng định dạng VN-614 → lỗi định dạng | Unit |
| TS-020-05 | AC-020-03 | Negative: Chọn portId/berthId chưa duyệt → dropdown không hiển thị | Integration |
| TS-020-06 | AC-020-04 | Negative: Nhập length = -5, width = 600 → lỗi validation tương ứng | Unit |
| TS-020-07 | AC-020-06 | Edge: Chọn "Có" receivesLargeVessel, bỏ trống documentNumber → lỗi bắt buộc; Chọn "Không" → clear validation | Integration |
| TS-020-08 | AC-020-07 | Happy path: Lưu tạm với form hợp lệ → PENDING, ghi ChangeLog | Integration |
| TS-020-09 | AC-020-08 | Happy path: Lưu và gửi phê duyệt → PENDING + cờ gửi duyệt | Integration |
| TS-020-10 | AC-020-09 | Happy path: Admin Lưu và phê duyệt → APPROVED, sẵn sàng dùng | Integration |
| TS-020-11 | AC-020-09 | Negative: Quản lý tài sản nhấn Lưu và phê duyệt → nút bị ẩn hoặc API 403 | Security |
| TS-020-12 | AC-020-10 | Negative: Bỏ trống trường bắt buộc → lỗi "Trường này là bắt buộc" ở client và server | Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - new aggregate | Tạo mới entity Pier với quan hệ cha-con (Port → Berth → Pier) và entity phụ trợ ChangeLog; aggregate root mới với 11 nhóm dữ liệu (root fields + zobjDataSub) |
| Architecture affected? | No | CRUD tạo mới theo pattern hiện có (POST với action parameter); ghi nhật ký trong transaction là pattern đã thiết lập; dùng chung component FormCrud |
| Implementation clear? | Yes | Pattern POST API với 3 action modes đã có tiền lệ (F-008 CB tạo mới); validation chain đã rõ; conditional validation ATHH cần implement riêng nhưng approach rõ ràng |
| **Verdict** | `Ready for Technical Lead planning` | Tạo mới aggregate root Pier với 11 nhóm dữ liệu; không có quyết định kiến trúc mới; implementation approach rõ ràng từ pattern F-008/F-009 |
