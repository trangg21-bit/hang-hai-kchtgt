---
id: F-XXX
name: Xem danh sach co so sua chua dong tau
slug: xem-danh-sach-co-so-sua-chua-dong-tau
module-id: M-003
status: proposed
classification: local
priority: P0
created: 2026-08-03T00:00:00Z
last-updated: 2026-08-03T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Cơ sở sửa chữa, đóng tàu — Xem danh sách

**Tài liệu:** BA Feature Brief
**Feature:** F-XXX
**Module:** M-003 — Quản lý tài sản KCHTGT khu nước VTS
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-03

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Là màn hình chính — **điểm vào** của toàn bộ module quản lý CSSCDT. Gộp 3 chức năng vào một giao diện duy nhất: **xem danh sách**, **tìm kiếm**, và **tra cứu**. Từ đây người dùng điều hướng đến tất cả các thao tác khác: tạo mới (F-050), sửa (F-051), xóa (F-052), xem chi tiết (F-054), lịch sử (F-055) và phê duyệt (F-053).

### 1.2. Tại sao cần tính năng này?

Đây là màn hình trung tâm để quản lý toàn bộ danh sách cơ sở sửa chữa, đóng tàu. Người dùng cần một nơi duy nhất để xem tổng quan, lọc, tìm kiếm, và từ đó thực hiện mọi thao tác.

### 1.3. Luồng hoạt động chính

Người dùng truy cập menu "Cơ sở sửa chữa & đóng tàu" → hệ thống hiển thị bảng danh sách với dữ liệu phân trang → người dùng có thể tìm kiếm, lọc, hoặc nhấn vào một dòng để xem chi tiết / sửa / xóa.

---

## 2. Ai dùng? Dùng như thế nào?

Quyền thao tác và xem tính năng được áp dụng theo hệ thống phân quyền tập trung. Mỗi vai trò người dùng sẽ có phạm vi truy cập và thao tác khác nhau, được kiểm soát bởi cơ chế RBAC.

### 2.1. Logic phân quyền chung

Các thao tác trong tính năng được bảo vệ bởi các quyền (permissions) tương ứng. Người dùng chỉ có thể thực hiện những thao tác mà vai trò của họ được cấp quyền (tại tính năng phân quyền).

### 2.2. Logic phân quyền đặc biệt cho tài khoản Admin Cục

- **Xem full dữ liệu:** Admin Cục có quyền xem toàn bộ dữ liệu trên hệ thống, không giới hạn phạm vi đơn vị hay khu vực.
- **Xem thông tin người chỉnh sửa:** thấy được họ tên, tên đăng nhập người chỉnh sửa cuối cùng.
- **Xem thời gian cập nhật:** thấy được timestamp cập nhật cuối cùng.
- **Xem người tạo mới:** thấy được họ tên, tên đăng nhập người tạo.
- **Xem thời gian tạo mới:** thấy được timestamp tạo.

---

## 3. User Stories

### Mức Must (bắt buộc có)

- **US-LIST-01:** Là **Chuyên viên**, tôi muốn xem danh sách tất cả cơ sở sửa chữa, đóng tàu dưới dạng bảng phân trang.
- **US-LIST-02:** Là **Chuyên viên**, tôi muốn tìm kiếm cơ sở theo tên hoặc địa chỉ.
- **US-LIST-03:** Là **Chuyên viên**, tôi muốn lọc danh sách theo loại hình dịch vụ, trạng thái phê duyệt, tình trạng.
- **US-LIST-04:** Là **Chuyên viên**, tôi muốn thấy các nút thao tác (Xem, Sửa, Xóa, Gửi duyệt) trên mỗi dòng.

### Mức Should (nên có)

- **US-LIST-05:** Là **Chuyên viên**, tôi muốn thấy số lượng bản ghi theo từng trạng thái dưới dạng tab.
- **US-LIST-06:** Là **Chuyên viên**, tôi muốn bảng tự động refresh sau khi tạo mới/sửa/xóa.

### Mức Could (có thể có sau)

- **US-LIST-07:** Là **Chuyên viên**, tôi muốn xuất danh sách ra Excel.
- **US-LIST-08:** Là **Lãnh đạo**, tôi muốn xem danh sách chờ phê duyệt của đơn vị mình.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

**AC-LIST-01 — Hiển thị bảng danh sách:** Khi truy cập menu, hệ thống hiển thị bảng danh sách phân trang 20 dòng/trang. Load thất bại → hiển thị lỗi + nút "Thử lại".

**AC-LIST-02 — Tìm kiếm:** Nhập từ khóa → tìm trong `ten` và `diaDiemChiTiet`. Không có kết quả → "Không tìm thấy cơ sở nào phù hợp."

**AC-LIST-03 — Lọc loại hình:** Dropdown: Tất cả, Sửa chữa, Đóng mới. Chọn → bảng tự động lọc.

**AC-LIST-04 — Lọc trạng thái phê duyệt:** Dropdown: Tất cả, Lưu tạm, Chờ duyệt, Đang xem xét, Đã duyệt, Từ chối.

**AC-LIST-05 — Lọc tình trạng:** Dropdown: Tất cả, Chưa khai thác/vận hành, Đang khai thác/vận hành, Dừng khai thác/vận hành.

**AC-LIST-06 — Lọc theo đơn vị:** Mặc định hiển thị dữ liệu của đơn vị user. Admin Cục thấy toàn bộ.

**AC-LIST-07 — Nút thao tác trên dòng:**
- **Xem:** luôn hiển thị → F-054
- **Sửa:** status ≠ S_0 và có quyền → F-051
- **Xóa:** chỉ hiển thị khi status = S_1 (Lưu tạm) và có quyền → F-052
- **Gửi duyệt:** chỉ hiển thị khi status = S_1 (chưa gửi duyệt) và có quyền → chuyển S_2
- **Lịch sử:** luôn hiển thị → F-055

**AC-LIST-08 — Phân trang:** Mặc định 20 dòng/trang, cho phép đổi 10/20/50.

**AC-LIST-09 — Sắp xếp:** Click tiêu đề cột → sắp xếp tăng/giảm. Mặc định `updatedAt` giảm dần.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

**BR-LIST-01 — Dữ liệu theo đơn vị:** Danh sách mặc định chỉ hiển thị CSSCDT thuộc `fkDonViQl` của user. Admin Cục và system-admin thấy toàn bộ.

**BR-LIST-02 — Ẩn bản ghi S_0:** Bản ghi đã xóa không hiển thị trong danh sách chính.

**BR-LIST-03 — Nút Xóa chỉ khi Lưu tạm:** Chỉ bản ghi ở trạng thái Lưu tạm (chưa gửi duyệt) mới hiện nút Xóa.

**BR-LIST-05 — Nút Gửi duyệt chỉ khi chưa gửi:** Chỉ bản ghi ở trạng thái Lưu tạm (chưa từng gửi duyệt) mới hiện nút Gửi duyệt.

**BR-LIST-06 — Nút Lịch sử luôn hiển thị:** Tất cả bản ghi (trừ S_0) đều hiển thị nút Lịch sử, cho phép xem toàn bộ lịch sử thay đổi.

**BR-LIST-04 — Nút Sửa hiện với mọi trạng thái trừ S_0:** Kể cả S_6, nhưng sửa xong quay về S_1 (xem F-051).

---

## 6. API Endpoints

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/co-so-sua-chua?page=0&size=20` | Danh sách phân trang | `cosuachua:read` |
| GET | `/api/v1/co-so-sua-chua/search?keyword=...&status=...&tinhTrang=...` | Tìm kiếm + lọc | `cosuachua:read` |

### Query Parameters

| Param | Loại | Mô tả |
|---|---|---|
| `page` | int | Số trang (0-based), mặc định 0 |
| `size` | int | Số dòng/trang, mặc định 20 |
| `keyword` | string | Tìm trong `ten`, `diaDiemChiTiet` |
| `loaiHinhDichVu` | string | SUA_CHUA / DONG_MOI |
| `status` | string | S_1, S_2, S_3, S_4, S_5, S_6 |
| `tinhTrang` | string | CHUA_KHAI_THAC / DANG_KHAI_THAC / DUNG_KHAI_THAC |
| `sortBy` | string | Mặc định `updatedAt` |
| `sortDir` | string | asc / desc |

---

## 7. Yêu cầu giao diện người dùng

> **Nguyên tắc cốt lõi:** Mọi giá trị màu sắc, khoảng cách, kích thước chữ được định nghĩa tại `frontend/src/theme.ts` và `frontend/src/tokens.ts`. Tuyệt đối không hardcode.

### 7.1. Hệ thống màu sắc

| Khi cần... | Token | Màu |
|---|---|---|
| Tiêu đề trang | `textPrimary` | `#0c2438` |
| Nhãn field | `textSecondary` | `#566a7c` |
| Caption | `textTertiary` | `#93a3b3` |
| Nền card | `surfaceCard` | `#FFFFFF` |
| Nền trang | `surfacePage` | `#eaf0f6` |
| Viền | `borderDefault` | `rgba(11,46,79,0.09)` |
| Nút chính | `actionPrimary` | `#0E6FD6` |

### 7.2. Thang số

**Spacing:** 4, 8, 12, 16, 24, 32. **Radius:** 4, 8, 12, 999. **Font size:** 10, 13, 15, 18. **Weight:** 400, 500, 600.

> **Cấm:** spacing 6,10,14,18; radius 6,7,10; font-size 12,14,16,24.

### 7.3. Màn hình Danh sách CSSCDT

1. **ScreenHeader:** breadcrumb "Quản lý tài sản KCHTGT > Cơ sở sửa chữa & đóng tàu" + nút **Thêm mới** (solid, `actionPrimary`).

2. **FilterBar — thanh lọc ngang:**

| # | Field | Component | Ghi chú |
|---|---|---|---|
| 1 | Ô Tìm kiếm | Input + icon | "Tìm theo tên, mã cơ sở sửa chữa đóng tàu" |
| 2 | Đơn vị quản lý | Select (OrgCode) | Mặc định = đơn vị của user đăng nhập |
| 3 | Chọn cảng biển sở hữu | Select (KCHT_CB) | Chỉ cảng biển đã duyệt, filter theo đơn vị |
| 4 | Chọn cầu cảng sở hữu | Select (KCHT_CC) | Chỉ cầu cảng đã duyệt, filter theo đơn vị |
| 5 | Địa điểm (Tỉnh/Thành phố) | Dropdown (DM_DON_VI_HANH_CHINH) | Danh mục đơn vị hành chính |
| 6 | Loại hình dịch vụ | Select | Tất cả / Sửa chữa / Đóng mới |
| 7 | Trạng thái phê duyệt | Select | Tất cả / Lưu tạm / Chờ duyệt / Đã duyệt / Từ chối |
| 8 | Tình trạng khai thác/vận hành | Select | Tất cả / Chưa khai thác/vận hành / Đang khai thác/vận hành / Dừng khai thác/vận hành |
| 9 | Ngày cập nhật từ | DatePicker | |
| 10 | Ngày cập nhật đến | DatePicker | |
| 11 | Nút Tìm kiếm | Button outline | |
| 12 | Nút Làm mới | Button text | Reset bộ lọc |

3. **StatusTabs:** Tab kèm số lượng: Tất cả, Lưu tạm, Chờ duyệt, Đã duyệt, Từ chối. Tab active có gạch chân `actionPrimary`. Số lượng trong tab được cập nhật theo bộ lọc hiện tại.

4. **DataTable — bảng dữ liệu:**

| Cột | Nội dung | Ghi chú |
|---|---|---|
| STT | Số thứ tự | Tự động đánh số theo trang |
| Mã cơ sở sửa chữa, đóng tàu | `ma` | Click → mở F-054 Xem chi tiết |
| Tên cơ sở sửa chữa, đóng tàu | `ten` | |
| Đơn vị quản lý | `tenDonViQl` | |
| Thuộc cảng biển | `tenCangBien` | |
| Thuộc cầu cảng | `tenCauCang` | Ẩn nếu trống |
| Địa điểm (Tỉnh/Thành phố) | Tên tỉnh/TP | |
| Loại hình dịch vụ | Badge | Sửa chữa: xanh, Đóng mới: tím |
| Tình trạng khai thác/vận hành | Badge | Chưa khai thác/vận hành: xám, Đang khai thác/vận hành: xanh lá, Dừng khai thác/vận hành: đỏ |
| Trạng thái phê duyệt | Badge | Lưu tạm: vàng, Chờ duyệt/Đang xem xét: xanh dương, Đã duyệt: xanh lá, Từ chối: đỏ |
| Cán bộ cập nhật | `nguoiChinhSua` | Họ tên người chỉnh sửa cuối cùng |
| Ngày cập nhật | `updatedAt` | DD/MM/YYYY HH:mm |
| Cán bộ gửi phê duyệt | `nguoiGuiDuyet` | Họ tên người gửi duyệt gần nhất |
| Ngày gửi phê duyệt | `ngayGuiDuyet` | DD/MM/YYYY HH:mm |
| Cán bộ phê duyệt | `nguoiPheDuyet` | Họ tên người phê duyệt mới nhất (cấp 1 hoặc cấp 2) |
| Ngày phê duyệt | `ngayPheDuyet` | DD/MM/YYYY HH:mm. Ngày phê duyệt mới nhất: nếu mới đến cấp 1 thì hiển thị ngày cấp 1, nếu đã đến cấp 2 thì hiển thị ngày cấp 2 |
| Thao tác | Dropdown | Xem, Sửa, Lịch sử (mặc định, luôn hiển thị); Xóa (chỉ hiển thị với trạng thái Lưu tạm); Gửi duyệt (chỉ hiển thị với trạng thái chưa gửi duyệt) |

5. **Pagination:** cuối bảng, hiển thị tổng số dòng + số trang.

### 7.4. Các trạng thái giao diện

- **Đang tải:** skeleton table (5 dòng xám).
- **Không có dữ liệu:** icon empty + "Chưa có cơ sở sửa chữa, đóng tàu nào." + nút "Tạo mới".
- **Lỗi tải:** cảnh báo đỏ + nút "Thử lại".
- **Sau thao tác:** tự động refresh, giữ bộ lọc.

### 7.5. Phân quyền hiển thị

| Vai trò | Dữ liệu | Thêm mới | Sửa | Xóa |
|---|---|---|---|---|
| system-admin | Toàn bộ | ✅ | ✅ | ✅ |
| Admin Cục | Toàn bộ + user/time fields | ✅ | ✅ | ✅ |
| admin-operation | Đơn vị mình | ✅ | ✅ | Chỉ S_1 |
| Cán bộ | Đơn vị mình | ✅ | ✅ | Chỉ S_1 |
| Lãnh đạo | Đơn vị mình | ✅ | ✅ | Chỉ S_1 |
| Khách | Chỉ S_6 | ❌ | ❌ | ❌ |

### 7.6. Giao diện trên điện thoại

- Sidebar 80px, FilterBar gập/mở, bảng → card, thao tác → nút cuối card.
