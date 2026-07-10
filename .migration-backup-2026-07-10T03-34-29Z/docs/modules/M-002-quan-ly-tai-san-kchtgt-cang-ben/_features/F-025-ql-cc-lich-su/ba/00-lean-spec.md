---
feature-id: F-025
document: lean-spec
output-mode: lean
last-updated: 2026-06-27
---
# Quản lý Cầu cảng - Lịch sử

## Summary

Hệ thống cần ghi nhận và cho phép truy xuất toàn bộ lịch sử thay đổi của một Cầu cảng (tạo mới, cập nhật, phê duyệt, xóa) nhằm đảm bảo tính minh bạch và phục vụ kiểm toán hạ tầng cảng biển. Tính năng tổng hợp các sự kiện từ F-020, F-021, F-022, F-023 vào một dòng thời gian thống nhất, với thông tin chi tiết giá trị cũ/mới cho từng trường thay đổi. Thành công đo bằng: mọi thay đổi Cầu cảng đều được ghi nhận đầy đủ, không có bản ghi bị thiếu hay bị sửa/xóa.

## Scope

| | Items |
|---|---|
| In scope | Trang hiển thị lịch sử chronologically (mới nhất lên đầu); chi tiết sự kiện (loại, trường thay đổi, giá trị cũ/mới, người thực hiện, thời gian); lọc theo loại sự kiện / người thực hiện / khoảng thời gian; tích hợp sự kiện từ F-020 F-021 F-022 F-023 |
| Out of scope | Sửa/xóa bản ghi lịch sử; so sánh hai phiên bản bất kỳ; xuất Excel/PDF; thông báo realtime; khôi phục về phiên bản lịch sử |
| Assumptions | Bảng `lich_su_thay_doi` đã được thiết kế với cấu trúc phù hợp; các tính năng nguồn (F-020–F-023) ghi sự kiện vào bảng này tại thời điểm thực hiện; người dùng đã xác thực |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Quản trị viên / Quản lý cảng | Xem danh sách lịch sử thay đổi của một Cầu cảng sắp xếp mới nhất lên đầu | Truy xuất nguồn gốc dữ liệu nhanh, phục vụ kiểm toán | Must Have |
| US-002 | Quản trị viên / Quản lý cảng | Xem chi tiết một sự kiện thay đổi (trường, giá trị cũ, giá trị mới, người thực hiện, thời gian) | Hiểu chính xác nội dung thay đổi | Must Have |
| US-003 | Quản trị viên / Quản lý cảng | Lọc lịch sử theo loại sự kiện, người thực hiện, khoảng thời gian | Tìm nhanh sự kiện cần kiểm tra | Must Have |
| US-004 | Nhân viên vận hành | Xem lịch sử thay đổi với các trường kỹ thuật bị ẩn | Theo dõi thay đổi cơ bản phù hợp phạm vi vai trò | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001 | Truy cập trang lịch sử thành công | Given người dùng có role Quản trị viên hoặc Quản lý cảng đã đăng nhập; When truy cập trang lịch sử của Cầu cảng bất kỳ; Then danh sách sự kiện hiển thị đầy đủ sắp xếp thời gian giảm dần | Tất cả 4 loại sự kiện (tao_moi, cap_nhat, phe_duyet, xoa) phải xuất hiện nếu đã xảy ra |
| AC-002 | US-001 | Từ chối truy cập cho role không có quyền | Given người dùng không có role Quản trị viên hoặc Quản lý cảng; When truy cập trang lịch sử; Then hệ thống trả về lỗi 403 Forbidden | Áp dụng cả trường hợp người dùng đã xác thực nhưng sai role |
| AC-003 | US-002 | Xem chi tiết sự kiện cập nhật trường | Given một sự kiện loại cap_nhat trong danh sách; When xem chi tiết sự kiện; Then hiển thị: tên trường thay đổi, giá trị cũ, giá trị mới, tên người thực hiện, vai trò người thực hiện, timestamp đến giây | Giá trị JSON (tọa độ GPS, thông số kỹ thuật) phải được chuyển sang text dễ đọc |
| AC-004 | US-002 | Sự kiện tao_moi không có giá trị cũ | Given sự kiện loại tao_moi; When xem chi tiết; Then trường gia_tri_cu hiển thị trống hoặc "N/A"; trường gia_tri_moi chứa giá trị khởi tạo | Không lỗi khi giá trị null |
| AC-005 | US-003 | Lọc theo loại sự kiện | Given danh sách lịch sử có nhiều loại sự kiện; When chọn lọc theo loại "cap_nhat"; Then chỉ hiển thị các sự kiện loại cap_nhat | Bộ lọc hoạt động độc lập và kết hợp với nhau |
| AC-006 | US-003 | Lọc theo người thực hiện | Given danh sách lịch sử; When chọn người thực hiện cụ thể; Then chỉ hiển thị sự kiện do người đó thực hiện | |
| AC-007 | US-003 | Lọc theo khoảng thời gian | Given danh sách lịch sử; When nhập ngày bắt đầu và ngày kết thúc; Then chỉ hiển thị sự kiện trong khoảng đó (inclusive cả 2 đầu) | Khoảng thời gian ngược (start > end) phải báo lỗi validation |
| AC-008 | US-004 | Nhân viên vận hành xem lịch sử với trường kỹ thuật bị ẩn | Given người dùng role Nhân viên vận hành; When xem danh sách lịch sử; Then các trường kỹ thuật (tọa độ GPS, thông số kết cấu, tải trọng) bị ẩn; các trường hành chính vẫn hiển thị | Danh sách trường kỹ thuật bị ẩn cần xác nhận với domain expert |
| AC-009 | US-001 | Lịch sử Cầu cảng chưa có thay đổi ngoài tao_moi | Given Cầu cảng mới tạo chưa có sự kiện nào ngoài tao_moi; When xem trang lịch sử; Then ít nhất 1 sự kiện tao_moi hiển thị | Không hiển thị trang trắng khi chỉ có 1 sự kiện |
| AC-010 | US-001 | Lịch sử không bị thiếu sự kiện từ các tính năng nguồn | Given đã thực hiện tao_moi (F-020), cap_nhat (F-021), xoa (F-022), phe_duyet (F-023) trên cùng một Cầu cảng; When xem lịch sử; Then tất cả 4 loại sự kiện đều xuất hiện theo thứ tự thời gian | Kiểm thử tích hợp chéo F-020/F-021/F-022/F-023/F-025 |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Mọi thay đổi về Cầu cảng đều phải được ghi nhận vào bảng lịch sử — không cho phép bỏ qua hoặc vô hiệu hóa | Tất cả sự kiện trên Cầu cảng | Không có ngoại lệ |
| BR-002 | Bản ghi lịch sử chỉ được phép thêm mới (append-only); không cho phép UPDATE hoặc DELETE sau khi đã ghi | US-001/US-002 | Không có ngoại lệ; vi phạm là sự cố bảo mật |
| BR-003 | Sự kiện từ F-020, F-021, F-022, F-023 được tích hợp vào cùng một dòng thời gian thống nhất theo cauCangId | US-001 | |
| BR-004 | Giá trị cũ/mới được lưu dạng văn bản hóa; giá trị JSON (tọa độ GPS, thông số kỹ thuật) phải chuyển sang định dạng text dễ đọc trước khi lưu | US-002 | |
| BR-005 | Nhân viên vận hành chỉ được xem lịch sử các trường hành chính; các trường kỹ thuật bị ẩn phía backend (không chỉ frontend) | US-004 | |
| BR-006 | Kết quả lọc mặc định: sắp xếp thời gian giảm dần; không có bộ lọc nào được active khi vào trang lần đầu | US-003 | |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Truy vấn danh sách lịch sử (có phân trang 20 bản ghi/trang) phải trả về trong ngưỡng hợp lý | ≤ 2 giây cho Cầu cảng có ≤ 10,000 sự kiện |
| Security | Kiểm tra phân quyền phía backend trước khi trả dữ liệu; trường kỹ thuật được lọc server-side | Không để lộ dữ liệu nhạy cảm qua API |
| Reliability | Bảng lịch sử append-only; không mất dữ liệu khi có lỗi partial write | Transactional write cùng với thao tác nguồn |
| Audit/Logging | Mọi truy cập trang lịch sử được ghi vào nhật ký hệ thống (ai xem, khi nào, Cầu cảng nào) | Lưu tối thiểu: userId, cauCangId, timestamp, action=VIEW_HISTORY |
| Operability | Phân trang, bộ lọc hoạt động ổn định; không timeout khi Cầu cảng có lịch sử lớn | Phân trang bắt buộc |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | Quản trị viên xem lịch sử Cầu cảng có đầy đủ 4 loại sự kiện | Integration |
| TS-002 | AC-002 | Người dùng không có quyền nhận 403 | Unit / Security |
| TS-003 | AC-003 | Chi tiết sự kiện cap_nhat hiển thị đúng giá trị cũ/mới | Integration |
| TS-004 | AC-004 | Sự kiện tao_moi không có gia_tri_cu, không lỗi null | Unit |
| TS-005 | AC-005 | Lọc theo loại sự kiện trả đúng kết quả | Integration |
| TS-006 | AC-006 | Lọc theo người thực hiện trả đúng kết quả | Integration |
| TS-007 | AC-007 | Lọc khoảng thời gian hợp lệ và ngược (start > end) | Integration + Negative |
| TS-008 | AC-008 | Nhân viên vận hành không thấy trường kỹ thuật qua API | Security |
| TS-009 | AC-009 | Cầu cảng mới tạo có ít nhất 1 sự kiện tao_moi | Integration |
| TS-010 | AC-010 | Tích hợp chéo F-020/F-021/F-022/F-023 → F-025 ghi đầy đủ | Cross-feature Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Thực thể LichSuThayDoi đã định nghĩa trong F-021; feature này là read + filter trên dữ liệu đã tồn tại từ các tính năng nguồn |
| Architecture affected? | Yes | Cần thiết kế cơ chế append-only, transaction write, phân quyền server-side cho trường kỹ thuật, và API lọc/phân trang |
| Implementation clear? | No | Cần SA xác nhận: cơ chế ghi lịch sử (interceptor/AOP/trigger DB), cấu trúc bảng lưu diff, phân quyền field-level |
| **Verdict** | `Ready for solution architecture` | Domain không mới nhưng có các quyết định kiến trúc cần SA: append-only enforcement, field-level permission, cross-feature event integration |
