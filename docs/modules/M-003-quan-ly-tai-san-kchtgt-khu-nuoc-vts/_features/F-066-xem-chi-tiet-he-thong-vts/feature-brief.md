---
id: F-066
name: "Xem chi tiet He thong VTS"
slug: xem-chi-tiet-he-thong-vts
module-id: M-003
status: proposed
classification: local
priority: P0
created: "2026-06-30T00:00:00Z"
last-updated: "2026-07-31T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Xem chi tiet He thong VTS

## Mô tả chung

| Nội dung | Mô tả |
|---|---|
| Mục đích | Cho phép người dùng xem toàn bộ thông tin chi tiết của một Hệ thống VTS, bao gồm 8 nhóm: thông tin chung, thông tin hệ thống, danh sách vùng VTS, KCHT khác thuộc VTS, vận hành khai thác, bảo trì, sự cố và file đính kèm. Toàn bộ hiển thị dạng read-only. |
| Tác nhân | Tất cả roles có quyền `vts:read` (A-002, A-003, A-004) |
| Luồng chính | Người dùng chọn Hệ thống VTS từ danh sách → nhấn "Xem chi tiết" → Hệ thống mở popup hiển thị toàn bộ 8 nhóm thông tin dạng read-only → Người dùng xem và đóng. |
| Điều kiện trước | Người dùng có quyền `vts:read`. Bản ghi tồn tại và chưa bị xóa mềm. |
| Điều kiện sau | Không thay đổi dữ liệu. |
| Quy tắc nghiệp vụ | Toàn bộ dữ liệu hiển thị read-only. Các nhóm không có dữ liệu hiển thị "Không có dữ liệu". File đính kèm có thể tải xuống. |

## Mô tả màn hình

### Nhóm 1 — Thông tin chung

| STT | Tên trường | Loại điều khiển | Cho phép sửa | Giá trị hiển thị | Mô tả |
|---|---|---|---|---|---|
| 1 | Đơn vị quản lý | Label | Không | **Có:** "G17.43 - Cục Hàng hải và Đường thủy Việt Nam". **Không:** "—" | |
| 2 | Ghi chú | Label | Không | **Có:** nội dung ghi chú. **Không:** "—" | |
| 3 | Trạng thái | Label (Badge) | Không | **Có:** badge "Đã phê duyệt" (xanh) / "Chờ phê duyệt" (vàng) / "Từ chối" (đỏ). **Không:** "—" | Trạng thái phê duyệt |
| 4 | Ngày cập nhật | Label | Không | **Có:** "20/07/2026 09:26:30". **Không:** "—" | Định dạng DD/MM/YYYY HH:mm:ss |
| 5 | Cán bộ cập nhật | Label | Không | **Có:** "cuc@vimawa.gov.vn - Cục HH & ĐT VN". **Không:** "—" | Email + tên đơn vị |

### Nhóm 2 — Thông tin hệ thống VTS

| STT | Tên trường | Loại điều khiển | Cho phép sửa | Giá trị hiển thị | Mô tả |
|---|---|---|---|---|---|
| 1 | Đơn vị chủ quản | Label | Không | **Có:** tên đơn vị. **Không:** "—" | |
| 2 | Đơn vị vận hành khai thác | Label | Không | **Có:** tên đơn vị. **Không:** "—" | |
| 3 | Thuộc cảng biển | Label | Không | **Có:** tên cảng. **Không:** "—" | |
| 4 | Mã hệ thống VTS | Label | Không | **Có:** "VTS-000002". **Không:** "—" | |
| 5 | Tên hệ thống VTS | Label | Không | **Có:** "vts demo 034". **Không:** "—" | |
| 6 | Địa điểm (Tỉnh/Thành phố) | Label | Không | **Có:** tên tỉnh. **Không:** "—" | |
| 7 | Địa điểm chi tiết | Label | Không | **Có:** nội dung. **Không:** "—" | |
| 8 | Thời gian bắt đầu hoạt động | Label | Không | **Có:** "17/04/2026". **Không:** "—" | Định dạng DD/MM/YYYY |
| 9 | Phạm vi áp dụng | Label | Không | **Có:** "Việt Nam". **Không:** "—" | |
| 10 | Thông báo hàng hải | Label | Không | **Có:** nội dung. **Không:** "—" | |
| 11 | Tình trạng | Label (Badge) | Không | **Có:** "Đang khai thác/vận hành" (xanh) / "Dừng hoạt động" (đỏ) / "Đang bảo trì" (vàng) / "Đang xây dựng" (xám). **Không:** "—" | |

### Nhóm 3 — Thông tin vùng VTS

| STT | Cột | Mô tả |
|---|---|---|
| 1 | STT | Số thứ tự |
| 2 | Mã vùng VTS | **Có:** "VTS-000002-000001". **Không:** "—" |
| 3 | Tên vùng VTS | **Có:** "vts vn". **Không:** "—" |
| 4 | Tình trạng | **Có:** "Đang khai thác/vận hành". **Không:** "—" |

**Không có dữ liệu:** hiển thị "Không có dữ liệu".

### Nhóm 4 — File đính kèm

| STT | Cột | Mô tả |
|---|---|---|
| 1 | STT | Số thứ tự |
| 2 | Tên file | Click để tải xuống |

**Không có dữ liệu:** hiển thị "Không có dữ liệu".

### Nhóm 5 — Danh sách kết cấu hạ tầng khác thuộc hệ thống VTS

| STT | Cột | Mô tả |
|---|---|---|
| 1 | STT | Số thứ tự |
| 2 | Tên kết cấu hạ tầng | **Có:** "radar demo 04". **Không:** "—" |

**Không có dữ liệu:** hiển thị "Không có dữ liệu".

### Nhóm 6 — Thông tin vận hành khai thác

| STT | Cột | Mô tả |
|---|---|---|
| 1 | STT | Số thứ tự |
| 2 | Mã kế hoạch vận hành khai thác | |
| 3 | Tên kế hoạch vận hành khai thác | |
| 4 | Ngày bắt đầu vận hành khai thác dự kiến | Định dạng DD/MM/YYYY |
| 5 | Ngày kết thúc vận hành khai thác dự kiến | Định dạng DD/MM/YYYY |

**Không có dữ liệu:** hiển thị "Không có dữ liệu".

### Nhóm 7 — Thông tin bảo trì

| STT | Cột | Mô tả |
|---|---|---|
| 1 | STT | Số thứ tự |
| 2 | Mã kế hoạch bảo trì | |
| 3 | Tên kế hoạch bảo trì | |
| 4 | Thời gian bắt đầu bảo trì dự kiến | Định dạng DD/MM/YYYY |
| 5 | Thời gian kết thúc bảo trì dự kiến | Định dạng DD/MM/YYYY |

**Không có dữ liệu:** hiển thị "Không có dữ liệu".

### Nhóm 8 — Thông tin sự cố

| STT | Cột | Mô tả |
|---|---|---|
| 1 | STT | Số thứ tự |
| 2 | Mã sự cố | |
| 3 | Loại sự cố | |
| 4 | Địa điểm xảy ra sự cố | |
| 5 | Thời gian xảy ra sự cố | Định dạng DD/MM/YYYY HH:mm:ss |

**Không có dữ liệu:** hiển thị "Không có dữ liệu".

## Luồng thao tác

1. Người dùng chọn Hệ thống VTS từ danh sách → nhấn icon "Xem chi tiết"
2. Hệ thống mở popup "Chi tiết thông tin hệ thống VTS" hiển thị 8 nhóm thông tin
3. Tất cả trường hiển thị dạng Label (read-only)
4. Các bảng (vùng VTS, KCHT, vận hành, bảo trì, sự cố, file) hiển thị phân trang nếu có nhiều dòng
5. File đính kèm có thể click để tải xuống
6. Người dùng nhấn "Đóng" để quay lại danh sách

## Acceptance Criteria

- [x] Popup hiển thị đầy đủ 8 nhóm thông tin
- [x] Tất cả trường hiển thị read-only, không cho phép chỉnh sửa
- [x] Trường không có dữ liệu hiển thị "—" (text) hoặc "Không có dữ liệu" (bảng)
- [x] Trạng thái hiển thị dạng badge màu: Đã phê duyệt (xanh), Chờ phê duyệt (vàng), Từ chối (đỏ)
- [x] Tình trạng hiển thị dạng badge: Đang khai thác (xanh), Dừng hoạt động (đỏ)
- [x] File đính kèm có thể tải xuống khi click vào tên file
- [x] Các bảng con hiển thị đúng số dòng (VD: "1-1 trong 1")

## Entities

| Entity | Table | Mô tả |
|---|---|---|
| HeThongVTS | he_thong_vts | Entity chính (20 trường — xem F-062) |
| VungVTS | vung_vts | Danh sách vùng VTS |
| HeThongVTSAttachment | he_thong_vts_attachment | File đính kèm |
| KchtThuocVTS | kcht_thuoc_vts | KCHT khác thuộc hệ thống VTS |
| KeHoachVanHanh | ke_hoach_van_hanh | Kế hoạch vận hành khai thác |
| KeHoachBaoTri | ke_hoach_bao_tri | Kế hoạch bảo trì |
| SuCo | su_co | Thông tin sự cố |

## Business Rules

| ID | Rule |
|---|---|
| BR-066-01 | Tất cả roles có `vts:read` đều xem được chi tiết |
| BR-066-02 | Toàn bộ dữ liệu hiển thị read-only |
| BR-066-03 | Trường không có giá trị hiển thị "—" |
| BR-066-04 | Bảng không có dữ liệu hiển thị "Không có dữ liệu" |
| BR-066-05 | File đính kèm hỗ trợ tải xuống qua MinIO presigned URL |

## Roles + Permissions

| Role | Permission |
|---|---|
| A-002 (Lãnh đạo) | `vts:read` |
| A-003 (Chuyên viên) | `vts:read` |
| A-004 (Cảng vụ) | `vts:read` |

## Dependencies

- F-062 (Tạo mới): dùng chung entity HeThongVTS
- F-063 (Cập nhật): dùng chung entity HeThongVTS
- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
