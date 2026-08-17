---
feature-id: F-048
document: lean-spec
output-mode: lean
last-updated: 2026-08-13
---
# Danh sách Đê/kè

## Summary

Hệ thống cần cung cấp màn hình danh sách Đê/kè — màn hình trung tâm của nhóm quản lý đê/kè trong module M-003. Danh sách hiển thị 14 cột, hỗ trợ tìm kiếm nhanh theo mã/tên, 8 bộ lọc (tình trạng, đơn vị quản lý, cảng biển, loại kết cấu, địa điểm, thời điểm khai thác, ngày cập nhật) + 5 tab trạng thái phê duyệt, phân trang (20/50/100) và sắp xếp theo `updatedAt` giảm dần. Từ mỗi dòng người dùng điều hướng đến xem chi tiết, sửa, xóa, gửi duyệt, phê duyệt và lịch sử. Dữ liệu luôn được lọc theo `orgUnitId` của người dùng (trừ Admin Cục xem toàn hệ thống).

## Scope

| | Items |
|---|---|
| In scope | Danh sách 14 cột (Mã+Tên gộp, Địa điểm, Chiều dài, Đơn vị QL, Cảng biển, Loại kết cấu, Đơn vị vận hành, Thời điểm khai thác, Tình trạng, Trạng thái, Ngày cập nhật, Người cập nhật, Thao tác); Tìm kiếm nhanh (ma + dikeRevetmentName, substring); 8 bộ lọc + 5 tab trạng thái; Phân trang 20/50/100; Sắp xếp updatedAt DESC; Nút hành động theo điều kiện (Xem/Sửa/Xóa/Gửi duyệt/Phê duyệt/Lịch sử); Lọc theo orgUnitId; Badge trạng thái 4 màu |
| Out of scope | Tạo mới (F-044); Cập nhật (F-045); Xóa (F-046); Phê duyệt (F-047); Lịch sử (F-049); Xem chi tiết (F-048-detail); Export Excel/PDF |
| Assumptions | Người dùng đã đăng nhập; Bảng `dike_revetment` đã tồn tại; Danh sách lọc theo orgUnitId của người dùng (trừ Admin Cục) |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-048-01 | Chuyên viên | Xem toàn bộ danh sách đê/kè thuộc đơn vị | Nắm hiện trạng tài sản | Must Have |
| US-048-02 | Chuyên viên | Tìm kiếm nhanh theo mã/tên | Tra cứu nhanh không cần cuộn | Must Have |
| US-048-03 | Chuyên viên | Lọc theo loại kết cấu, tình trạng, địa điểm | Thu hẹp danh sách | Must Have |
| US-048-04 | Trưởng phòng | Thấy công trình "Chờ phê duyệt" qua tab trạng thái | Xử lý phê duyệt kịp thời | Must Have |
| US-048-05 | Người dùng | Click vào dòng để xem chi tiết | Điều hướng nhanh | Must Have |
| US-048-06 | Chuyên viên | Sửa/xóa trực tiếp từ danh sách | Không cần qua trang chi tiết | Should Have |
| US-048-07 | Chuyên viên | Gửi duyệt/phê duyệt trực tiếp từ danh sách | Tiết kiệm thời gian | Should Have |
| US-048-08 | Người dùng | Đổi số bản ghi/trang (20/50/100) | Tùy nhu cầu | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-048-01 | US-048-01 | Hiển thị danh sách mặc định | Given mở màn hình; When GET /api/v1/dike-revetment; Then hiển thị 20 dòng/trang, sắp xếp updatedAt DESC, lọc theo orgUnitId, ẩn isDeleted=true | API lỗi → cảnh báo + nút Thử lại |
| AC-048-02 | US-048-08 | Phân trang tùy chọn | Given dropdown phân trang; When chọn 20/50/100; Then bảng tải đúng số lượng, giữ nguyên bộ lọc | |
| AC-048-03 | US-048-02 | Tìm kiếm nhanh | Given nhập từ khóa; When khớp ma hoặc dikeRevetmentName (substring, không phân biệt hoa thường); Then hiển thị kết quả ≤ 500ms | Debounce 400ms |
| AC-048-04 | US-048-03 | Lọc theo loại kết cấu | Given dropdown loại kết cấu; When chọn giá trị; Then lọc bảng theo dikeRevetmentType | Danh mục LOAI_KCCT_DE_KE |
| AC-048-05 | US-048-03 | Lọc theo địa điểm | Given dropdown địa điểm; When chọn Tỉnh/TP; Then lọc bảng theo location | |
| AC-048-06 | US-048-03 | Lọc theo tình trạng | Given dropdown tình trạng; When chọn; Then lọc bảng theo status | Chưa/Đang/Dừng khai thác-vận hành |
| AC-048-07 | US-048-04 | Tab trạng thái phê duyệt | Given 5 tab; When chuyển tab; Then lọc theo approvalStatus, giữ bộ lọc khác | Mỗi tab hiện số lượng |
| AC-048-08 | US-048-01 | Cột hiển thị đầy đủ 14 cột | Given bảng; Then hiển thị đúng 14 cột (xem feature-brief 9.1) | |
| AC-048-09 | US-048-05 | Xem chi tiết | Given click mã/tên; When điều hướng; Then mở trang chi tiết với đúng id | |
| AC-048-10 | US-048-06 | Chỉnh sửa | Given nút Sửa; When đủ điều kiện (F-045); Then điều hướng form sửa điền sẵn | dikerevetment:update |
| AC-048-11 | US-048-06 | Xóa | Given nút Xóa; When approvalStatus=PROPOSED + quyền + đơn vị; Then popup xác nhận → DELETE | |
| AC-048-12 | US-048-07 | Gửi phê duyệt | Given nút Gửi duyệt; When PROPOSED/REJECTED + cùng đơn vị; Then gửi yêu cầu (F-047) | |
| AC-048-13 | US-048-07 | Phê duyệt | Given nút Phê duyệt; When Cấp Cục + PROPOSED; Then phê duyệt trực tiếp (F-047) | |
| AC-048-14 | US-048-01 | Lịch sử | Given nút Lịch sử; When click; Then mở lịch sử (F-049) | Luôn hiển thị |
| AC-048-15 | US-048-01 | Ẩn bản ghi đã xóa | Given isDeleted=true; Then không hiển thị ở mọi bộ lọc | |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-048-01 | Phân trang mặc định 20 bản ghi/trang; đổi 50/100 | AC-048-02 | Không hỗ trợ "tất cả" |
| BR-048-02 | Sắp xếp mặc định updatedAt DESC | AC-048-01 | |
| BR-048-03 | Lọc theo orgUnitId của user; Admin Cục xem toàn hệ thống | AC-048-01 | |
| BR-048-04 | Tìm kiếm OR trên ma + dikeRevetmentName | AC-048-03 | |
| BR-048-05 | Ẩn bản ghi isDeleted=true | AC-048-15 | |
| BR-048-06 | Nút hành động hiển thị theo trạng thái + phân quyền (F-045/046/047) | AC-048-10 đến 13 | |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Tải danh sách lần đầu (20 bản ghi) | ≤ 1 giây |
| Performance | Áp dụng bộ lọc/tìm kiếm | ≤ 500ms |
| Security | RBAC trên API; lọc orgUnitId ở backend, không nhận từ client | |
| UX | Responsive (mobile → card); Loading skeleton; Empty state "Không tìm thấy công trình nào phù hợp" | WCAG 2.1 AA |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-048-01 | AC-048-01 | Happy path: mở danh sách → hiển thị đúng 20 dòng + sắp xếp | Integration |
| TS-048-02 | AC-048-02 | Đổi 20 → 100 bản ghi/trang, giữ bộ lọc | UI |
| TS-048-03 | AC-048-03 | Tìm kiếm theo mã/tên → kết quả khớp | Integration |
| TS-048-04 | AC-048-04 | Lọc theo loại kết cấu → đúng kết quả | Integration |
| TS-048-05 | AC-048-07 | Chuyển tab trạng thái → lọc đúng + giữ bộ lọc | Integration |
| TS-048-06 | AC-048-11 | Xóa bản ghi APPROVED → nút Xóa bị ẩn | UI |
| TS-048-07 | AC-048-13 | User thường không thấy nút Phê duyệt | Security |
| TS-048-08 | AC-048-15 | Bản ghi đã xóa → không hiển thị | Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Read-only trên `dike_revetment` hiện có + JOIN cảng biển/đơn vị |
| Architecture affected? | No | GET list/search với filter + pagination theo pattern có sẵn |
| Implementation clear? | Yes | Pattern list-view đã có (F-078 Cầu cảng); 14 cột + 8 filter là cấu hình, không logic mới |
| **Verdict** | `Ready for Technical Lead planning` | Read-only; chỉ cấu hình cột/filter mới, không quyết định kiến trúc mới |
