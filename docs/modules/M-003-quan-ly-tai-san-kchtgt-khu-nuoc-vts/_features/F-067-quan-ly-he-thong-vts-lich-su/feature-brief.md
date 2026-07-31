---
id: F-067
name: "Quan ly He thong VTS - Lich su"
slug: quan-ly-he-thong-vts-lich-su
module-id: M-003
status: proposed
classification: local
priority: P1
created: "2026-06-30T00:00:00Z"
last-updated: "2026-07-31T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quan ly He thong VTS - Lich su

## Mô tả chung

| Nội dung | Mô tả |
|---|---|
| Mục đích | Cho phép người dùng xem chi tiết lịch sử thay đổi của một Hệ thống VTS tại từng thời điểm. Hiển thị snapshot đầy đủ dữ liệu của bản ghi tại thời điểm được chọn trong lịch sử, bao gồm 4 nhóm: thông tin chung, thông tin hệ thống VTS, danh sách vùng VTS, và thông tin phê duyệt 2 cấp (Cảng vụ/Chi cục + Cục). Toàn bộ hiển thị dạng read-only. |
| Tác nhân | Tất cả roles có quyền `vts:history` (A-002, A-003, A-004) |
| Luồng chính | Người dùng chọn Hệ thống VTS từ danh sách → nhấn "Lịch sử" → Hệ thống hiển thị danh sách các mốc thời gian thay đổi (timeline) → Người dùng chọn một mốc → Hệ thống hiển thị snapshot dữ liệu tại thời điểm đó với đầy đủ 4 nhóm thông tin. |
| Điều kiện trước | Người dùng có quyền `vts:history`. Bản ghi tồn tại. |
| Điều kiện sau | Không thay đổi dữ liệu. |
| Quy tắc nghiệp vụ | Mọi thay đổi (tạo mới, cập nhật, phê duyệt, xóa) đều được ghi tự động vào lịch sử. Danh sách mốc lịch sử sắp xếp theo thời gian giảm dần (mới nhất → cũ nhất). Mỗi mốc hiển thị: thời gian, loại hành động, người thực hiện. Khi chọn một mốc, hiển thị toàn bộ dữ liệu tại thời điểm đó. |

## Mô tả màn hình

### Danh sách mốc lịch sử (Timeline)

| STT | Cột | Mô tả |
|---|---|---|
| 1 | Thời gian | Thời điểm thay đổi, định dạng DD/MM/YYYY HH:mm:ss. Sắp xếp giảm dần. |
| 2 | Loại hành động | Badge: "Tạo mới" (xanh), "Cập nhật" (xanh dương), "Phê duyệt C1" (vàng), "Phê duyệt C2" (xanh lá), "Từ chối" (đỏ), "Xóa" (xám) |
| 3 | Người thực hiện | Email + tên đơn vị (VD: "cuc@vimawa.gov.vn - Cục HH & ĐT VN") |
| 4 | Lý do (nếu có) | Hiển thị lý do từ chối hoặc ghi chú thay đổi |

**Không có dữ liệu:** hiển thị "Chưa có lịch sử thay đổi".

### Chi tiết snapshot tại một mốc

Khi người dùng click vào một mốc, hiển thị popup "Chi tiết lịch sử thông tin hệ thống VTS" với 4 nhóm:

#### Nhóm 1 — Thông tin chung

| STT | Tên trường | Loại điều khiển | Cho phép sửa | Giá trị hiển thị | Mô tả |
|---|---|---|---|---|---|
| 1 | Đơn vị quản lý | Label | Không | **Có:** "G17.43 - Cục Hàng hải và Đường thủy Việt Nam". **Không:** "—" | |
| 2 | Ghi chú | Label | Không | **Có:** nội dung ghi chú. **Không:** "—" | |
| 3 | Trạng thái | Label (Badge) | Không | **Có:** "Đã phê duyệt" (xanh) / "Chờ phê duyệt" (vàng) / "Từ chối" (đỏ). **Không:** "—" | Trạng thái phê duyệt tại thời điểm đó |
| 4 | Ngày cập nhật | Label | Không | **Có:** "22/04/2026 15:02:51". **Không:** "—" | Định dạng DD/MM/YYYY HH:mm:ss |
| 5 | Cán bộ cập nhật | Label | Không | **Có:** "cuc@vimawa.gov.vn - Cục HH & ĐT VN". **Không:** "—" | Người thực hiện thay đổi cuối cùng tại thời điểm đó |

#### Nhóm 2 — Thông tin hệ thống VTS

| STT | Tên trường | Loại điều khiển | Cho phép sửa | Giá trị hiển thị | Mô tả |
|---|---|---|---|---|---|
| 1 | Đơn vị chủ quản | Label | Không | **Có:** tên đơn vị. **Không:** "—" | |
| 2 | Đơn vị vận hành khai thác | Label | Không | **Có:** tên đơn vị. **Không:** "—" | |
| 3 | Thuộc cảng biển | Label | Không | **Có:** tên cảng. **Không:** "—" | |
| 4 | Mã hệ thống VTS | Label | Không | **Có:** "VTS-000002". **Không:** "—" | |
| 5 | Tên hệ thống VTS | Label | Không | **Có:** "vts demo 03". **Không:** "—" | Giá trị tại thời điểm được chọn (có thể khác hiện tại) |
| 6 | Thời gian bắt đầu hoạt động | Label | Không | **Có:** "17/04/2026". **Không:** "—" | Định dạng DD/MM/YYYY |
| 7 | Phạm vi áp dụng | Label | Không | **Có:** "Việt Nam". **Không:** "—" | |
| 8 | Thông báo hàng hải | Label | Không | **Có:** nội dung. **Không:** "—" | |
| 9 | Tình trạng | Label (Badge) | Không | **Có:** "Đang khai thác/vận hành" (xanh) / "Dừng hoạt động" (đỏ) / "Đang bảo trì" (vàng) / "Đang xây dựng" (xám). **Không:** "—" | |

#### Nhóm 3 — Thông tin vùng VTS

| STT | Cột | Mô tả |
|---|---|---|
| 1 | STT | Số thứ tự |
| 2 | Mã vùng VTS | **Có:** "VTS-000002-000001". **Không:** "—" |
| 3 | Tên vùng VTS | **Có:** "vts vn". **Không:** "—" |
| 4 | Tình trạng | **Có:** "Đang khai thác/vận hành". **Không:** "—" |

**Không có dữ liệu:** hiển thị "Không có dữ liệu".

#### Nhóm 4 — Thông tin phê duyệt

**Cảng vụ/Chi cục phê duyệt (C1):**

| STT | Tên trường | Loại điều khiển | Giá trị hiển thị |
|---|---|---|---|
| 1 | Nội dung phê duyệt | Label | **Có:** nội dung. **Không:** "—" |
| 2 | Ngày phê duyệt | Label | **Có:** ngày giờ. **Không:** "—" |
| 3 | Cán bộ phê duyệt | Label | **Có:** email + tên. **Không:** "—" |

**Cục phê duyệt (C2):**

| STT | Tên trường | Loại điều khiển | Giá trị hiển thị |
|---|---|---|---|
| 1 | Nội dung phê duyệt | Label | **Có:** nội dung. **Không:** "—" |
| 2 | Ngày phê duyệt | Label | **Có:** "22/04/2026 15:02:51". **Không:** "—" |
| 3 | Cán bộ phê duyệt | Label | **Có:** "cuc@vimawa.gov.vn - Cục HH & ĐT VN". **Không:** "—" |

## Luồng thao tác

1. Người dùng chọn Hệ thống VTS từ danh sách → nhấn "Lịch sử"
2. Hệ thống hiển thị timeline các mốc thay đổi (mới nhất → cũ nhất)
3. Mỗi mốc hiển thị: thời gian, loại hành động (badge màu), người thực hiện, lý do
4. Người dùng click vào một mốc → popup "Chi tiết lịch sử thông tin hệ thống VTS" mở ra
5. Popup hiển thị snapshot đầy đủ 4 nhóm thông tin tại thời điểm đó
6. Tất cả dữ liệu read-only
7. Người dùng nhấn "Đóng" để quay lại danh sách mốc lịch sử

## Acceptance Criteria

- [x] Timeline hiển thị đầy đủ các mốc thay đổi, sắp xếp mới nhất → cũ nhất
- [x] Mỗi mốc hiển thị: thời gian, loại hành động (badge màu), người thực hiện
- [x] Các loại hành động: Tạo mới, Cập nhật, Phê duyệt C1, Phê duyệt C2, Từ chối, Xóa
- [x] Click vào mốc → hiển thị popup snapshot với 4 nhóm thông tin
- [x] Snapshot hiển thị dữ liệu tại thời điểm được chọn (có thể khác dữ liệu hiện tại)
- [x] Tất cả trường read-only
- [x] Trường không có dữ liệu hiển thị "—"
- [x] Bảng vùng VTS không có dữ liệu hiển thị "Không có dữ liệu"
- [x] Ghi nhận tự động: tạo mới, cập nhật, phê duyệt, xóa

## Entities

| Entity | Table | Mô tả |
|---|---|---|
| HeThongVTS | he_thong_vts | Entity chính |
| HeThongVTSChangeLog | he_thong_vts_change_log | Lịch sử thay đổi dữ liệu (old/new value) |
| HeThongVTSApproval | he_thong_vts_approval | Lịch sử phê duyệt C1/C2 (nội dung, ngày, người duyệt) |
| HeThongVTSDeleteLog | he_thong_vts_delete_log | Lịch sử xóa (người xóa, thời gian, lý do) |
| VungVTS | vung_vts | Snapshot vùng VTS tại thời điểm lịch sử |

## Business Rules

| ID | Rule |
|---|---|
| BR-067-01 | Mọi thay đổi (tạo, sửa, phê duyệt, xóa) được ghi tự động vào lịch sử |
| BR-067-02 | Timeline sắp xếp theo thời gian giảm dần (mới nhất → cũ nhất) |
| BR-067-03 | Mỗi mốc lịch sử lưu snapshot đầy đủ dữ liệu tại thời điểm đó |
| BR-067-04 | Dữ liệu lịch sử không thể sửa hoặc xóa (immutable) |
| BR-067-05 | Lịch sử phê duyệt hiển thị riêng 2 cấp: Cảng vụ/Chi cục (C1) + Cục (C2) |

## Roles + Permissions

| Role | Permission |
|---|---|
| A-002 (Lãnh đạo) | `vts:history` |
| A-003 (Chuyên viên) | `vts:history` |
| A-004 (Cảng vụ) | `vts:history` |

## Dependencies

- F-062 (Tạo mới): nguồn dữ liệu ban đầu
- F-063 (Cập nhật): nguồn dữ liệu thay đổi
- F-065 (Phê duyệt): nguồn dữ liệu phê duyệt
- F-064 (Xóa): nguồn dữ liệu xóa
- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
