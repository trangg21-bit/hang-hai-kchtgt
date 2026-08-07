---
id: F-092
name: Xem danh sách Đèn biển và nhà trạm gắn với Đèn biển
slug: xem-danh-sach-den-bien-va-nha-tram
module-id: M-023
status: proposed
classification: local
priority: high
created: 2026-08-05T00:00:00Z
last-updated: 2026-08-05T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Xem danh sách Đèn biển và nhà trạm gắn với Đèn biển

**Tài liệu:** BA Feature Brief
**Feature:** F-092
**Module:** M-023 — Quản lý Đèn biển và nhà trạm gắn với Đèn biển
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-05
**Tham khảo:** `references/qlkc-052-quan-ly-den-bien-va-nha-tram.md` (mục 3)

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Màn hình gộp tra cứu, xem danh sách và tìm kiếm **Đèn biển và nhà trạm gắn với Đèn biển** vào một giao diện duy nhất. Hiển thị bảng danh sách với đầy đủ cột thông tin, bộ lọc tìm kiếm, phân trang, và các nút hành động trên từng dòng (xem chi tiết, sửa, xóa, gửi duyệt, phê duyệt, xem vị trí).

### 1.2. Tại sao cần tính năng này?

Là màn hình chính để quản lý toàn bộ DBNT. Người dùng vào đây để tra cứu, tìm kiếm, và thực hiện mọi thao tác trên đèn biển.

### 1.3. Luồng hoạt động chính

Truy cập menu QLKC_052 → hiển thị bảng danh sách với bộ lọc → người dùng có thể tìm kiếm, lọc, phân trang → bấm vào hành động trên từng dòng để chuyển sang màn hình tương ứng.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Logic phân quyền chung

Tất cả người dùng được phân quyền đều có thể xem danh sách. Phạm vi dữ liệu hiển thị phụ thuộc vào vai trò: Cấp Cục/Admin thấy toàn bộ; Chi cục chỉ thấy dữ liệu thuộc đơn vị mình.

### 2.2. Logic phân quyền đặc biệt cho tài khoản Admin Cục

- Xem full dữ liệu toàn hệ thống
- Thấy thông tin người tạo, người sửa, thời gian

---

## 3. User Stories

### Mức Must

- **US-092-01:** Là người dùng, tôi muốn xem danh sách Đèn biển và nhà trạm với đầy đủ cột thông tin để nắm được tổng quan.
- **US-092-02:** Là người dùng, tôi muốn tìm kiếm và lọc danh sách theo nhiều tiêu chí (đơn vị, tên, trạng thái, cảng biển...) để nhanh chóng tìm thấy bản ghi cần.
- **US-092-03:** Là người dùng, tôi muốn bấm vào các nút hành động trên từng dòng để chuyển sang màn hình tương ứng (chi tiết, sửa, xóa...).

### Mức Should

- **US-092-04:** Là người dùng, tôi muốn danh sách tự động phân trang và hiển thị tổng số bản ghi.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

**AC-092-01 — Bảng danh sách:** Hiển thị bảng với component `BasicTable`, các cột hiển thị theo đúng thứ tự. Cột `ma` và các cột phê duyệt (ngày gửi, ngày duyệt CC, ngày duyệt Cục) ẩn mặc định, có thể bật/tắt.

**AC-092-02 — Bộ lọc tìm kiếm:** Hiển thị 10 field lọc: `fkDonViQl` (required), `ten`, `status`, `fkCangBien`, `fkDonViVh`, `ma`, `capTramDen`, `tinhTrang`, `ngayCapNhat` (RangePicker, max 1 năm), `diaDiem`. Bấm "Tìm kiếm" → gọi API search với các tham số đã chọn.

**AC-092-03 — Phân trang:** Hiển thị tổng số bản ghi và điều hướng trang. Mặc định page=0, size=20.

**AC-092-04 — Sắp xếp:** Cột `updatedDate` hỗ trợ sắp xếp tăng/giảm.

**AC-092-05 — Hành động trên dòng:** Dropdown action column (fixed right) hiển thị các nút tùy theo điều kiện: Xem chi tiết (luôn hiện), Sửa, Xóa, Gửi phê duyệt, Phê duyệt (Cục + S_1), Xem vị trí.

---

## 5. Mô hình dữ liệu (danh sách cột)

### 5.1. Cột hiển thị mặc định

| Cột | DataIndex | Ghi chú |
|---|---|---|
| STT | (auto) | `showIndexColumn: true` |
| Đơn vị quản lý | `fkDonViQl` | Mã + Tên |
| Thuộc cảng biển | `fkCangBien` | Mã + Tên |
| Đơn vị vận hành | `fkDonViVh` | Mã + Tên |
| Tên đèn biển | `ten` | Tooltip khi dài |
| Địa điểm (Tỉnh/TP) | `diaDiemText` | |
| Chủng loại đèn chính | `chungLoaiDenChinh` | |
| Cấp trạm đèn | `capTramDenText` | |
| Thời điểm đưa vào SD | `ngayBd` | DD/MM/YYYY |
| Tình trạng | `tinhTrangText` | Tag |
| Trạng thái | `statusText` | Badge |
| Ngày cập nhật | `updatedDate` | Sorter |
| Cán bộ cập nhật | `updatedUser` | |
| Thao tác | (actionColumn) | Fixed right |

### 5.2. Bộ lọc tìm kiếm

Các field lọc hiển thị phía trên bảng. Bấm "Tìm kiếm" để gọi API, "Đặt lại" để xóa tất cả filter.

| Field | Loại | Mô tả | Ghi chú |
|---|---|---|---|
| `fkDonViQl` | SelectOrgCode | Đơn vị quản lý | **Required** — bắt buộc chọn để load dữ liệu |
| `tenMa` | Input | Tên/mã đèn biển | Tìm gần đúng theo tên hoặc mã, max 255 |
| `status` | SelectAppParams | Trạng thái | Group: `TRANG_THAI_KCHT` |
| `fkCangBien` | SelectKcht (CB) | Thuộc cảng biển | Chỉ CB đã duyệt |
| `fkDonViVh` | SelectCateOther | Đơn vị vận hành | DM `DON_VI_KHAI_THAC` |
| `capTramDen` | SelectAppParams | Cấp trạm đèn | Group: `CAP_TRAM_DEN` |
| `tinhTrang` | SelectAppParams | Tình trạng | Group: `TINH_TRANG` |
| `ngayCapNhat` | RangePicker | Ngày cập nhật | Từ - đến, **tối đa 1 năm** |
| `diaDiem` | SelectCateOther | Địa điểm Tỉnh/TP | DM `DON_VI_HANH_CHINH` |

### 5.3. Hành động trên mỗi dòng

| Nút | Điều kiện hiển thị | Hành động |
|---|---|---|
| **Xem chi tiết** | Luôn hiển thị | `toAction(Action.Detail)` |
| **Sửa** | Cục/Chi cục + (S_1/S_4/S_5/S_6) + đúng đơn vị | `toAction(Action.Edit)` |
| **Xóa** | Cục/Chi cục + S_1 + đúng đơn vị | `Qlkc052Api.remove()` |
| **Gửi phê duyệt** | Cục/Chi cục + (S_1/S_4/S_5) + đúng đơn vị | `Qlkc052Api.sendApprove()` |
| **Phê duyệt** | Chỉ Cấp Cục + S_1 | `Qlkc052Api.approve()` |
| **Xem vị trí** | Luôn hiển thị | Modal `MyMap` |

---

## 6. API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/v1/tskt/qlkc_052/search?page=0&size=20&fkDonViQl=...&ten=...` | Tìm kiếm danh sách |

---

## 7. Yêu cầu giao diện

Dùng chung token màu sắc, thang số, style với F-092.

### 7.1. Màn hình Danh sách

1. **ScreenHeader:** breadcrumb "Quản lý Đèn biển và nhà trạm gắn với Đèn biển"
2. **FilterBar:** 10 field lọc, nút "Tìm kiếm" + "Đặt lại"
3. **BasicTable:** bảng dữ liệu, sticky header, hover row, action column
4. **Pagination:** tổng số dòng + điều hướng trang

### 7.2. Trạng thái giao diện

- **Đang tải:** skeleton table
- **Không có dữ liệu:** empty state "Không có dữ liệu"
- **Lỗi:** cảnh báo đỏ + nút "Thử lại"

### 7.3. Cấu trúc file nguồn tham khảo

```
qlkc-052/index.tsx → BasicTable + form search
Qlkc052RestController.java → GET search
```
