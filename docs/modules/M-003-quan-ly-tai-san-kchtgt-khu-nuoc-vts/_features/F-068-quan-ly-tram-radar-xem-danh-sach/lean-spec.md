---
feature-id: F-068
document: lean-spec
output-mode: lean
last-updated: 2026-08-10
---
# Danh sách Trạm radar

## Summary

Hệ thống cần cung cấp giao diện danh sách Trạm radar — màn hình trung tâm của module Trạm radar, hiển thị toàn bộ trạm radar thuộc phạm vi quản lý của người dùng với 16 cột dữ liệu. Giải pháp hỗ trợ tìm kiếm theo tên/mã radar, 10 bộ lọc (tình trạng, đơn vị quản lý, cảng biển, hệ thống VTS, trung tâm điều hành VTS, đơn vị khai thác, địa điểm, ngày cập nhật), 5 tab trạng thái phê duyệt có đếm số lượng, phân trang 20/100, và nhóm nút hành động trên mỗi dòng hiển thị động theo vai trò và trạng thái. Từ đây người dùng điều hướng đến tất cả thao tác khác: xem chi tiết (F-060), tạo mới (F-056), chỉnh sửa (F-057), xóa (F-058), phê duyệt (F-059), lịch sử (F-061).

## Scope

| | Items |
|---|---|
| In scope | Danh sách 16 cột với sticky header, hover row; Tìm kiếm theo stationName + code (debounce 400ms, khớp substring, không phân biệt hoa/thường); 10 bộ lọc: tình trạng, đơn vị quản lý, cảng biển, hệ thống VTS, trung tâm điều hành VTS, đơn vị khai thác, địa điểm, ngày cập nhật (date range picker, max 1 năm); 5 tab trạng thái (Tất cả/Đề xuất/Đang xem xét/Đã phê duyệt/Từ chối) có đếm số lượng; Phân trang 20/100, sắp xếp updatedDate DESC; Nút hành động động: Xem, Chỉnh sửa, Xóa, Phê duyệt, Lịch sử; Phân quyền RBAC + lọc theo orgUnitId; Cascade clear filter: đổi VTS → clear trung tâm điều hành VTS; Responsive (mobile: card view); Loading skeleton, empty state |
| Out of scope | Tạo mới (F-056); Cập nhật (F-057); Xóa (F-058); Phê duyệt (F-059); Xem chi tiết (F-060); Lịch sử (F-061); Export Excel/PDF |
| Assumptions | Người dùng đã đăng nhập; Dữ liệu được lọc theo orgUnitId (trừ Admin Cục); Hệ thống VTS, cảng biển, trung tâm điều hành VTS đã có dữ liệu APPROVED để hiển thị trong dropdown lọc |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-068-01 | Chuyên viên | Xem toàn bộ danh sách Trạm radar thuộc đơn vị mình | Nắm hiện trạng tài sản | Must Have |
| US-068-02 | Chuyên viên | Tìm kiếm nhanh theo tên hoặc mã radar | Tra cứu bản ghi cụ thể không cần cuộn | Must Have |
| US-068-03 | Chuyên viên | Lọc theo Hệ thống VTS, Địa điểm, Tình trạng và các tiêu chí khác | Thu hẹp danh sách theo nhu cầu | Must Have |
| US-068-04 | Lãnh đạo | Thấy ngay trạm radar đang chờ phê duyệt qua tab trạng thái | Xử lý phê duyệt kịp thời | Must Have |
| US-068-05 | Người dùng | Click vào dòng để xem chi tiết trạm radar | Điều hướng nhanh | Must Have |
| US-068-06 | Chuyên viên | Chỉnh sửa hoặc xóa trực tiếp từ danh sách | Không cần qua trang chi tiết | Should Have |
| US-068-07 | Chuyên viên | Xem lịch sử thay đổi ngay từ danh sách | Truy vết nhanh | Should Have |
| US-068-08 | Người dùng | Đổi số bản ghi/trang và hướng sắp xếp | Tùy chỉnh hiển thị | Should Have |
| US-068-09 | Người dùng | Điều hướng toàn bộ danh sách bằng bàn phím | Không cần chuột | Could Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-068-01 | US-068-01 | Hiển thị danh sách mặc định | Given mở màn hình; When GET /radar-station?page=1&pageSize=20&sortBy=updatedDate&sortOrder=DESC; Then hiển thị 20 bản ghi, giới hạn theo orgUnitId | Nếu lỗi → cảnh báo đỏ + nút Thử lại |
| AC-068-02 | US-068-08 | Phân trang tùy chọn | Given chọn 100 bản ghi/trang; When đổi; Then bảng tải đúng số lượng, giữ nguyên bộ lọc | |
| AC-068-03 | US-068-02 | Tìm kiếm nhanh | Given nhập từ khóa; When khớp stationName hoặc code (substring, case-insensitive); Then kết quả trong ≤ 500ms | Debounce 400ms; không có kết quả → empty state |
| AC-068-04 | US-068-03 | Lọc theo Hệ thống VTS | Given chọn VTS; When dropdown chỉ hiện VTS đã APPROVED, filter theo orgUnitId; Then bảng lọc theo vtsSystemId | |
| AC-068-05 | US-068-03 | Lọc theo Địa điểm | Given chọn Tỉnh/Thành phố; When dropdown liệt kê DM_DON_VI_HANH_CHINH có dữ liệu; Then bảng lọc theo provinceId | |
| AC-068-06 | US-068-03 | Lọc theo Tình trạng | Given chọn giá trị; When dropdown: Tất cả / Chưa KT/VH / Đang KT/VH / Dừng KT/VH; Then bảng lọc theo conditionStatus | |
| AC-068-07 | US-068-04 | Tab trạng thái | Given 5 tab: Tất cả/Đề xuất/Đang xem xét/Đã phê duyệt/Từ chối; When chuyển tab; Then lọc theo approvalStatus, hiển thị số lượng, không mất bộ lọc khác | |
| AC-068-08 | US-068-01 | 16 cột hiển thị | Given bảng; When render; Then hiển thị: STT, Mã radar, Tên, Đơn vị QL, Cảng biển, VTS, TTDH VTS, ĐV khai thác, Địa điểm, Đơn vị tính, Số lượng, Tình trạng (badge), Trạng thái PD (badge), Ngày cập nhật, Cán bộ cập nhật, Thao tác | Mã radar + Cán bộ cập nhật: ẩn mặc định |
| AC-068-09 | US-068-05 | Xem chi tiết | Given click mã/tên trạm radar; When click; Then điều hướng F-060 với đúng id | |
| AC-068-10 | US-068-06 | Chỉnh sửa | Given Admin/Chuyên viên cùng orgUnitId; When click Chỉnh sửa; Then điều hướng F-057, form điền sẵn | |
| AC-068-11 | US-068-06 | Xóa | Given PROPOSED + chưa gửi duyệt; When click Xóa; Then dialog xác nhận → DELETE; nếu có dữ liệu liên quan → chặn | Chỉ Admin/Lãnh đạo/Chuyên viên cùng đơn vị |
| AC-068-12 | US-068-04 | Phê duyệt | Given Lãnh đạo/Admin + PROPOSED/UNDER_REVIEW; When click Phê duyệt; Then điều hướng F-059 | |
| AC-068-13 | US-068-07 | Lịch sử | Given mọi vai trò; When click Lịch sử; Then điều hướng F-061 | Luôn hiển thị |
| AC-068-14 | US-068-01 | Trạm radar đã xóa không hiển thị | Given isDeleted=true; When query; Then không xuất hiện trong mọi bộ lọc | |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-068-01 | Mặc định 20 bản ghi/trang, tùy chọn 100; không hỗ trợ "tất cả" | AC-068-01, AC-068-02 | Không có ngoại lệ |
| BR-068-02 | Sắp xếp mặc định updatedDate DESC; chỉ đổi hướng, không đổi cột | AC-068-01 | Không có ngoại lệ |
| BR-068-03 | Dữ liệu luôn lọc theo orgUnitId của user; Admin Cục xem toàn bộ | AC-068-01 | Admin Cục |
| BR-068-04 | Tìm kiếm khớp stationName + code (OR, substring, case-insensitive) | AC-068-03 | Không có ngoại lệ |
| BR-068-05 | Dropdown VTS chỉ hiện APPROVED, filter theo orgUnitId | AC-068-04 | Không có ngoại lệ |
| BR-068-06 | isDeleted=true bị loại khỏi mọi truy vấn | AC-068-14 | Không có ngoại lệ |
| BR-068-07 | Nút Xóa: PROPOSED + chưa gửi duyệt + cùng đơn vị/Admin/Lãnh đạo | AC-068-11 | Không có ngoại lệ |
| BR-068-08 | Nút Phê duyệt: Lãnh đạo/Admin + PROPOSED hoặc UNDER_REVIEW | AC-068-12 | Không có ngoại lệ |
| BR-068-09 | Nút Chỉnh sửa: Admin/Chuyên viên cùng orgUnitId, mọi trạng thái | AC-068-10 | Không có ngoại lệ |
| BR-068-10 | Cascade filter: đổi VTS → clear trung tâm điều hành VTS | AC-068-04 | Không có ngoại lệ |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Tải danh sách lần đầu (20 bản ghi) | ≤ 1 giây |
| Performance | Phản hồi bộ lọc/tìm kiếm | ≤ 500ms |
| Performance | Dropdown phụ thuộc (VTS, trung tâm điều hành) | ≤ 300ms |
| Security | RBAC + JWT; lọc orgUnitId ở backend | HTTP 403 khi không có quyền |
| Reliability | Làm mới danh sách sau Xóa/Phê duyệt/Chỉnh sửa; isDeleted=true luôn bị loại | 100% consistency |
| UX | Responsive (≤ 768px: card view); loading skeleton; empty state; WCAG 2.1 AA | |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-068-01 | AC-068-01 | Happy path: Mở danh sách → hiển thị 20 bản ghi | Integration |
| TS-068-02 | AC-068-03 | Happy path: Tìm theo tên → kết quả khớp | Integration |
| TS-068-03 | AC-068-03 | Edge: Tìm theo mã radar → kết quả khớp | Integration |
| TS-068-04 | AC-068-03 | Edge: Không có kết quả → empty state | Integration |
| TS-068-05 | AC-068-04 | Edge: Đổi VTS → clear bộ lọc trung tâm điều hành | Integration |
| TS-068-06 | AC-068-07 | Edge: Chuyển tab Đã phê duyệt → đúng số lượng + đúng dữ liệu | Integration |
| TS-068-07 | AC-068-11 | Negative: Xóa APPROVED → nút ẩn/API 400 | Integration |
| TS-068-08 | AC-068-12 | Negative: Chuyên viên click Phê duyệt → nút ẩn | Security |
| TS-068-09 | AC-068-14 | Edge: isDeleted=true → không xuất hiện | Integration |
| TS-068-10 | AC-068-02 | Edge: Đổi 100/trang → giữ nguyên bộ lọc | Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Chỉ đọc, không thay đổi schema |
| Architecture affected? | No | GET API + JOIN + filter pattern hiện có |
| Implementation clear? | Yes | DataTable + FilterBar + StatusTabs; component dùng chung list-view |
| **Verdict** | `Ready for Technical Lead planning` | Màn hình danh sách read-only, không có quyết định kiến trúc mới |
