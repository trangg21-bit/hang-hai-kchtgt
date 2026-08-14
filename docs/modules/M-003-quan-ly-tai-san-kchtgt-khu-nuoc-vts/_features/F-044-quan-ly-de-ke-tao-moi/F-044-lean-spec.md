---
feature-id: F-044
document: lean-spec
output-mode: lean
last-updated: 2026-08-13
---
# Quản lý Đê/kè - Tạo mới

## Summary

Hệ thống cần cho phép người dùng có thẩm quyền (Chuyên viên, Trưởng phòng, Cục trưởng) tạo mới công trình đê/kè (đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ) vào hệ thống quản lý tài sản KCHTGT khu nước. Giải pháp cung cấp form 17 trường chia 4 nhóm (cơ bản, kỹ thuật, thời gian, GIS+file), hỗ trợ 3 chế độ lưu (Lưu tạm, Lưu và gửi phê duyệt, Lưu và phê duyệt — chỉ Cấp Cục), mã tự sinh `DK-{seq}`, validation chiều dài > 0, và ghi lịch sử tự động. Thành công được đo bằng khả năng tạo mới với trạng thái PROPOSED (hoặc APPROVED với Cấp Cục), sẵn sàng cho quy trình phê duyệt F-047.

## Scope

| | Items |
|---|---|
| In scope | Form 17 trường 4 nhóm; Mã tự sinh DK-{seq} (disabled); 3 chế độ lưu (Lưu tạm / Lưu và gửi duyệt / Lưu và phê duyệt — Cục); Validation bắt buộc + chiều dài > 0; Đơn vị quản lý mặc định theo user; 4 loại kết cấu (LOAI_KCCT_DE_KE); GIS (loại đối tượng, biểu tượng, hệ quy chiếu, quy tắc hiển thị, tọa độ) + file đính kèm; Ghi lịch sử approvalHistory (TAO_MOI); Phân quyền dikerevetment:create |
| Out of scope | Cập nhật (F-045); Xóa (F-046); Phê duyệt (F-047); Xem chi tiết (F-048-detail); Lịch sử (F-049); Gắn tài sản, vận hành |
| Assumptions | Người dùng đã đăng nhập; Bảng `dike_revetment` tồn tại; 6 trường mới cần thêm: cangBienId, donViVanHanhId, ma, locationDetail, constructionDate, lastMaintenanceYear (đánh dấu 🔴) |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-044-01 | Chuyên viên | Tạo mới đê/kè với đầy đủ thông tin cơ bản + kỹ thuật | Đăng ký tài sản vào hệ thống | Must Have |
| US-044-02 | Chuyên viên | Hệ thống tự sinh mã DK-{seq} | Đảm bảo tính duy nhất | Must Have |
| US-044-03 | Chuyên viên | Đơn vị quản lý điền sẵn theo đơn vị của tôi | Tiết kiệm thời gian nhập | Must Have |
| US-044-04 | Chuyên viên | "Lưu tạm" để chỉnh sửa thêm trước khi gửi duyệt | Linh hoạt nhập liệu | Must Have |
| US-044-05 | Chuyên viên | "Lưu và gửi phê duyệt" | Gửi cấp có thẩm quyền xem xét | Must Have |
| US-044-06 | Cục trưởng | "Lưu và phê duyệt" ngay | Đưa công trình vào sử dụng không cần chờ | Must Have |
| US-044-07 | Chuyên viên | Nhận thông báo rõ ràng khi thành công/thất bại | Biết trạng thái thao tác | Should Have |
| US-044-08 | Chuyên viên | Chuyển hướng về danh sách sau khi tạo | Tiếp tục công việc | Should Have |
| US-044-09 | Chuyên viên | Upload file đính kèm ngay khi tạo | Hoàn thiện hồ sơ một lần | Could Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-044-01 | US-044-01 | Hiển thị form tạo mới | Given Chuyên viên/Trưởng phòng/Cục trưởng; When nhấn "Tạo mới"; Then hiển thị form 4 nhóm trường | Không có quyền → nút ẩn, API 403 |
| AC-044-02 | US-044-02 | Mã tự sinh | Given mở form; Then mã hiển thị DK-{seq} dạng disabled, duy nhất toàn hệ thống | Không cho sửa |
| AC-044-03 | US-044-01 | Validation bắt buộc | Given bỏ trống Tên/Địa điểm/Địa điểm chi tiết/Loại kết cấu/Chiều dài/Tình trạng; When nhấn Lưu; Then lỗi "Trường này là bắt buộc", chặn submit | |
| AC-044-04 | US-044-01 | Validation chiều dài | Given nhập length ≤ 0 hoặc > 99999; When nhấn Lưu; Then lỗi validation tại trường | |
| AC-044-05 | US-044-03 | Đơn vị quản lý mặc định | Given mở form; Then orgUnitId điền sẵn = đơn vị user | |
| AC-044-06 | US-044-04 | Lưu tạm thành công | Given form hợp lệ; When "Lưu tạm"; Then lưu PROPOSED, ghi history TAO_MOI, thông báo "Tạo đê kè thành công", redirect danh sách | Có thể sửa tiếp F-045 |
| AC-044-07 | US-044-05 | Lưu và gửi phê duyệt | Given form hợp lệ; When "Lưu và gửi phê duyệt"; Then lưu PROPOSED + gửi notify, thông báo "Đã gửi phê duyệt đê kè" | Xuất hiện trong chờ duyệt F-047 |
| AC-044-08 | US-044-06 | Lưu và phê duyệt | Given Cục trưởng; When "Lưu và phê duyệt"; Then APPROVED + isApprovedLevel1=isApprovedLevel2=true, thông báo "Tạo mới và phê duyệt đê kè thành công" | Dùng được ngay |
| AC-044-09 | US-044-01 | Lọc dữ liệu theo đơn vị | Given dropdown Cảng biển; When đổi đơn vị QL; Then load lại danh sách cảng biển | |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-044-01 | Mã DK-{seq} tự sinh, duy nhất, bất biến sau tạo | AC-044-02 | Không có ngoại lệ |
| BR-044-02 | Đơn vị quản lý mặc định theo user, disabled khi sửa (F-045) | AC-044-05 | |
| BR-044-03 | Cảng biển phải đã duyệt + đang hoạt động | AC-044-09 | |
| BR-044-04 | PROPOSED chưa được tham chiếu bởi module khác; phải duyệt (F-047) đạt APPROVED | AC-044-06, AC-044-07 | Cấp Cục duyệt trực tiếp |
| BR-044-05 | Mọi thao tác tạo mới ghi tự động dike_revetment_approval_history (TAO_MOI) | AC-044-06 | |
| BR-044-06 | Validation cả client và server | AC-044-03, AC-044-04 | |
| BR-044-07 | Đê/kè không phụ thuộc VTS (KCHT_ATHH) | - | |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Load form + danh mục (loại kết cấu, tình trạng, đơn vị, cảng biển, tỉnh/TP) | ≤ 2 giây |
| Performance | Lưu bản ghi phản hồi | ≤ 1 giây |
| Performance | Upload file | ≤ 10MB/file, tổng ≤ 50MB |
| Security | RBAC trên API; chống mass-assignment (approvalStatus, createdBy... do server set) | HTTP 403 khi không có quyền |
| Security | Nút "Lưu và phê duyệt" chỉ Cấp Cục | UI + API enforcement |
| Reliability | Transaction rollback nếu lưu file thất bại | |
| UX | Responsive, loading skeleton, empty state | WCAG 2.1 AA |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-044-01 | AC-044-01 | Happy path: Chuyên viên mở form tạo mới | Integration |
| TS-044-02 | AC-044-01 | Negative: không quyền → HTTP 403 | Security |
| TS-044-03 | AC-044-02 | Mã tự sinh đúng định dạng DK-{seq}, disabled | UI |
| TS-044-04 | AC-044-03 | Bỏ trống trường bắt buộc → lỗi | Integration |
| TS-044-05 | AC-044-04 | Chiều dài = 0 hoặc âm → lỗi validation | Unit |
| TS-044-06 | AC-044-06 | Lưu tạm → PROPOSED + ghi history | Integration |
| TS-044-07 | AC-044-08 | Cục trưởng Lưu và phê duyệt → APPROVED | Integration |
| TS-044-08 | AC-044-08 | Chuyên viên không thấy nút "Lưu và phê duyệt" | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - 6 trường mới | Thêm cangBienId, donViVanHanhId, ma, locationDetail, constructionDate, lastMaintenanceYear vào bảng dike_revetment |
| Architecture affected? | No | CRUD tạo mới theo pattern có sẵn (POST + 3 action modes); ghi history trong transaction là pattern đã thiết lập |
| Implementation clear? | Yes | Pattern tạo mới đã có tiền lệ (F-020 Cầu cảng); validation chain rõ; 6 trường mới cần migration |
| **Verdict** | `Ready for Technical Lead planning` | Tạo mới aggregate + 6 trường mới cần migration; không quyết định kiến trúc mới |
