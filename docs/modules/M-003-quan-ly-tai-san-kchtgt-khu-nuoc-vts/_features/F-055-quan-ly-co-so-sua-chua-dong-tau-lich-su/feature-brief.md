---
id: F-055
name: Lich su Co so sua chua dong tau
slug: quan-ly-co-so-sua-chua-dong-tau-lich-su
module-id: M-003
status: proposed
classification: local
priority: P1
created: 2026-06-29T00:00:00Z
last-updated: 2026-08-04T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Lịch sử Cơ sở sửa chữa, đóng tàu

**Tài liệu:** BA Feature Brief
**Feature:** F-055
**Module:** M-003 — Quản lý tài sản KCHTGT khu nước VTS
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-04

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Hiển thị toàn bộ lịch sử thay đổi của một Cơ sở sửa chữa, đóng tàu, bao gồm mọi thao tác: tạo mới (F-050), cập nhật (F-051), phê duyệt cấp 1/cấp 2 (F-053), từ chối cấp 1/cấp 2 (F-053), xóa mềm (F-052). Mỗi lần thay đổi được hiển thị dưới dạng **card box** riêng biệt, dễ đọc và truy vết.

### 1.2. Tại sao cần tính năng này?

Cung cấp khả năng kiểm toán (audit trail) cho mọi thay đổi đối với cơ sở sửa chữa, đóng tàu, cho phép quản lý viên và lãnh đạo xem lại ai đã thay đổi thông tin gì, khi nào, và từ giá trị nào sang giá trị nào — đảm bảo tính minh bạch, trách nhiệm giải trình và khả năng truy vết lỗi dữ liệu.

### 1.3. Luồng hoạt động chính

1. Người dùng truy cập trang chi tiết CSSCDT (F-054) → click nút "Lịch sử", hoặc từ danh sách → nhấn nút "Lịch sử" trên dòng.
2. Hệ thống gọi GET `/api/v1/co-so-sua-chua/:id/history`.
3. Hệ thống hiển thị danh sách các lần thay đổi theo thứ tự thời gian giảm dần.
4. Mỗi lần thay đổi hiển thị thành card box gồm 2 phần: metadata (thời gian, người thực hiện) + nội dung thay đổi (giá trị cũ → giá trị mới, phân biệt màu).
5. Người dùng có thể lọc theo khoảng thời gian, người thực hiện, hoặc loại hành động.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Logic phân quyền chung

Tất cả người dùng đã đăng nhập đều có quyền xem lịch sử.

### 2.2. Logic phân quyền đặc biệt cho tài khoản Admin Cục

- **Xem full dữ liệu:** Admin Cục thấy toàn bộ, không giới hạn đơn vị.
- **Xem thông tin người thực hiện:** họ tên người thực hiện mỗi thao tác.
- **Xem thời gian:** timestamp đầy đủ cho mỗi thay đổi.

---

## 3. User Stories

### Mức Must

- **US-055-01:** Là Quản lý, tôi muốn xem toàn bộ lịch sử thay đổi của một cơ sở để biết ai đã thay đổi gì và khi nào.
- **US-055-02:** Là Lãnh đạo, tôi muốn xem lịch sử phê duyệt/từ chối để kiểm tra quy trình 2 cấp.
- **US-055-03:** Là Kiểm toán viên, tôi muốn truy vết mọi thay đổi để phục vụ công tác kiểm toán.

### Mức Should

- **US-055-04:** Là Quản lý, tôi muốn lọc lịch sử theo khoảng thời gian hoặc người thực hiện.

### Mức Could

- **US-055-05:** Là Admin, tôi muốn xuất báo cáo lịch sử ra Excel/PDF.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

**AC-055-01 — Hiển thị danh sách:** Danh sách theo thứ tự thời gian giảm dần. Mỗi lần thay đổi là một card box. Không có lịch sử → "Không có lịch sử thay đổi".

**AC-055-02 — Metadata mỗi lần thay đổi:** Thời gian (`HH:mm:ss dd/MM/yyyy`) + người thực hiện (họ tên).

**AC-055-03 — Nội dung thay đổi:** Mỗi card box liệt kê các trường bị thay đổi: tên trường → giá trị cũ → giá trị mới, màu sắc phân biệt. Tạo mới: chỉ hiển thị giá trị ban đầu. Xóa: "Cơ sở đã bị xóa". Phê duyệt/từ chối: cấp + kết quả + lý do.

**AC-055-04 — Lọc:** Theo khoảng thời gian, người thực hiện, loại hành động (Tạo mới / Cập nhật / Phê duyệt C1 / Phê duyệt C2 / Từ chối C1 / Từ chối C2 / Xóa).

**AC-055-05 — Read-only:** Lịch sử không thể chỉnh sửa hoặc xóa.

**AC-055-06 — Badge loại hành động:** Tạo mới: xanh lá, Cập nhật: xanh dương, Phê duyệt: xanh dương đậm, Từ chối: đỏ, Xóa: xám.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

**BR-055-01 — Ghi nhận tự động:** Mọi thao tác đều tự động tạo bản ghi trong `phe_duyet_lich_su`.

**BR-055-02 — Lịch sử bất biến:** Read-only, không thể sửa hoặc xóa.

**BR-055-03 — Lưu trữ vĩnh viễn:** Kể cả khi cơ sở bị xóa mềm, lịch sử vẫn được giữ nguyên.

**BR-055-04 — Người thực hiện:** Tự động lấy từ tài khoản đăng nhập, không thể giả mạo.

**BR-055-05 — Thay đổi quan trọng nổi bật:** Phê duyệt, từ chối, thay đổi trạng thái được đánh dấu badge màu riêng.

**BR-055-06 — Xem được mọi trạng thái:** Kể cả S_0.

---

## 6. Mô hình dữ liệu

### 6.1. Bảng `phe_duyet_lich_su`

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID/BIGINT | Định danh |
| `fkCoSuaChua` | FK | Cơ sở bị thay đổi |
| `loaiThaoTac` | Enum | TAO_MOI / CAP_NHAT / PHE_DUYET_C1 / PHE_DUYET_C2 / TU_CHOI_C1 / TU_CHOI_C2 / XOA |
| `truongThayDoi` | String | Tên trường (tiếng Việt) |
| `giaTriCu` | Text | Giá trị cũ (NULL nếu tạo mới) |
| `giaTriMoi` | Text | Giá trị mới |
| `nguoiThucHien` | String | Họ tên người thực hiện |
| `thoiGian` | Timestamp | Thời gian (tự động) |
| `lyDo` | Text | Lý do từ chối (chỉ TU_CHOI) |

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/co-so-sua-chua/:id/history` | Lấy danh sách lịch sử | Tất cả người dùng |

**Tham số query:** `tuNgay`, `denNgay`, `nguoiThucHien`, `loaiThaoTac`, `page`, `size`.

---

## 8. Chi tiết nghiệp vụ từng phần

### 8.1. Thiết kế card box

Mỗi lần thay đổi hiển thị thành card box ngang 2 phần:

```
┌─────────────────────────────────────────────────────────┐
│  🔵 Cập nhật                                            │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │ 14:34:08         │  │ Tên cơ sở:                   │ │
│  │ 17/07/2026       │  │   ABC  →  ABC (mở rộng)      │ │
│  │ Người thực hiện: │  │ Diện tích: 15000 → 25000    │ │
│  │ Nguyễn Văn A    │  │ Số triền đà: 3 → 5           │ │
│  └──────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Màu sắc giá trị:**
- **Giá trị cũ:** nền `#FFF0F0`, chữ `#C62828`
- **Giá trị mới:** nền `#E8F5E9`, chữ `#2E7D32`

### 8.2. Badge màu loại hành động

| Loại | Màu |
|---|---|
| Tạo mới | Xanh lá `#4CAF50` |
| Cập nhật | Xanh dương `#2196F3` |
| Phê duyệt C1/C2 | Xanh dương đậm `#1565C0` |
| Từ chối C1/C2 | Đỏ `#F44336` |
| Xóa | Xám `#9E9E9E` |

### 8.3. Bộ lọc

| Bộ lọc | Loại |
|---|---|
| Từ ngày → Đến ngày | Date Range Picker |
| Người thực hiện | Dropdown |
| Loại hành động | Multi-select |

### 8.4. Phân trang

Mặc định 20 card/trang, tùy chọn 20/50/100.

---

## 9. Yêu cầu phi chức năng

- Tải ≤ 1 giây cho 100 bản ghi. Phân trang khi > 100.
- Atomic: thao tác thất bại → không tạo bản ghi lịch sử.
- Responsive: card box chuyển dọc trên mobile.
- Skeleton loading + empty state.

---

## 10. Yêu cầu giao diện người dùng

### 10.1. Màu sắc

| Vai trò | Token | Màu |
|---|---|---|
| Nền card | `surfaceCard` | `#FFFFFF` |
| Nền trang | `surfacePage` | `#eaf0f6` |
| Chữ chính | `textPrimary` | `#0c2438` |
| Chữ phụ | `textSecondary` | `#566a7c` |

### 10.2. Thang số

**Spacing:** 4, 8, 12, 16, 24, 32. **Radius:** 4, 8, 12, 999. **Font:** 10, 13, 15, 18. Font: `'Inter', sans-serif`.

### 10.3. Màn hình Lịch sử

1. **ScreenHeader:** breadcrumb "... > [tên cơ sở] > Lịch sử".
2. **FilterBar:** Date Range + Người thực hiện + Loại hành động.
3. **Danh sách card box:** xếp dọc, mới nhất lên đầu.
4. **Pagination:** 20/50/100.

### 10.4. Trạng thái giao diện
- Đang tải: skeleton. Rỗng: "Không có lịch sử thay đổi". Lỗi: đỏ + "Thử lại".

### 10.5. Mobile
- Card box: metadata trên, nội dung dưới. FilterBar: panel gập/mở.
