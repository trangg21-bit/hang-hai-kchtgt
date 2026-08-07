---
id: F-093
name: Xem chi tiết Đèn biển và nhà trạm gắn với Đèn biển
slug: xem-chi-tiet-den-bien-va-nha-tram
module-id: M-023
status: proposed
classification: local
priority: medium
created: 2026-08-05T00:00:00Z
last-updated: 2026-08-05T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Xem chi tiết Đèn biển và nhà trạm gắn với Đèn biển

**Tài liệu:** BA Feature Brief
**Feature:** F-093
**Module:** M-023 — Quản lý Đèn biển và nhà trạm gắn với Đèn biển
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-05
**Tham khảo:** `references/qlkc-052-quan-ly-den-bien-va-nha-tram.md` (mục 6)

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Trang chi tiết hiển thị toàn bộ thông tin của một **Đèn biển và nhà trạm gắn với Đèn biển** được chọn từ danh sách. Trang ở chế độ read-only, gồm các nhóm thông tin: cơ bản, kỹ thuật đèn biển, nhà trạm, tọa độ GIS, file đính kèm. Ngoài ra còn có form phê duyệt (nếu có quyền) và danh sách vận hành/bảo trì/sự cố liên quan.

### 1.2. Tại sao cần tính năng này?

Cung cấp giao diện xem đầy đủ thông tin để tất cả các bên liên quan có thể tiếp cận dữ liệu chính xác về từng đèn biển, hỗ trợ ra quyết định trong vận hành, kiểm toán và báo cáo.

### 1.3. Luồng hoạt động chính

Danh sách → bấm "Xem chi tiết" → `GET .../detail?id=...&ma=...` → hiển thị trang Detail với các nhóm thông tin + các tab phụ.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Logic phân quyền chung

Tất cả người dùng được phân quyền đều có thể xem chi tiết. Nút "Xem chi tiết" luôn hiển thị trên mọi dòng.

### 2.2. Logic phân quyền đặc biệt cho Admin Cục

- Xem full dữ liệu toàn hệ thống
- Thấy thông tin người tạo, thời gian tạo, người sửa, thời gian cập nhật
- Thấy form phê duyệt (nếu bản ghi đang trong luồng duyệt)

---

## 3. User Stories

### Mức Must

- **US-093-01:** Là người dùng, tôi muốn xem toàn bộ thông tin chi tiết của một Đèn biển và nhà trạm để nắm được đầy đủ dữ liệu.
- **US-093-02:** Là người dùng, tôi muốn xem vị trí đèn biển trên bản đồ từ màn hình chi tiết.

### Mức Should

- **US-093-03:** Là Lãnh đạo/Cấp Cục, tôi muốn thấy form phê duyệt ngay trong màn chi tiết để duyệt nhanh.
- **US-093-04:** Là người dùng, tôi muốn xem danh sách vận hành/bảo trì/sự cố liên quan đến đèn biển này.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

**AC-093-01 — Load dữ liệu:** `GET .../detail?id=...&ma=...` → hiển thị form Detail với toàn bộ field readonly. Lỗi → thông báo + "Thử lại".

**AC-093-02 — Các nhóm thông tin:** Nhóm A, B, C, D mở rộng mặc định. Nhóm E, F, G thu gọn mặc định, mở khi click tiêu đề.

**AC-093-03 — Nút "Xem vị trí":** Bấm → modal `MyMap` hiển thị tọa độ trên bản đồ.

**AC-093-04 — Form phê duyệt:** Hiển thị khi bản ghi ở S_2 hoặc S_3 và user có quyền duyệt cấp tương ứng. Gồm nút Duyệt/Từ chối + ô nhập lý do.

**AC-093-05 — Các tab phụ:** Tab "Vận hành", "Bảo trì", "Sự cố" hiển thị bảng danh sách liên quan (gọi API riêng, lọc theo `endPoint="qlkc_052"`).

**AC-093-06 — Breadcrumb:** "Quản lý Đèn biển và nhà trạm gắn với Đèn biển > Chi tiết [tên]". Click module cha → quay lại danh sách.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

**BR-093-01 — Read-only:** Trang chi tiết là chế độ xem. Mọi chỉnh sửa phải qua F-094 (Sửa).

**BR-093-02 — Cảnh báo trạng thái:** Nếu S_1-S_5: "Đèn biển chưa được phê duyệt, không khả dụng trong các module khác". Nếu S_6: "Đèn biển đã được phê duyệt, đang khả dụng".

**BR-093-03 — Dữ liệu làm mới:** Mỗi lần truy cập đều gọi API mới, không cache.

---

## 6. Mô hình dữ liệu

Tính năng này chỉ đọc, không tạo/sửa bảng. Các bảng được truy vấn:

### 6.1. Bảng KCHT_ATHH — Root fields

| Field | Nhóm | Mô tả |
|---|---|---|
| ma | A | Mã DBNT, format `DBNT-{seq}` |
| ten | A | Tên đèn biển |
| fkDonViQl | A | Đơn vị quản lý (hiển thị tên) |
| fkCangBien | A | Thuộc cảng biển (hiển thị tên + link) |
| fkDonViVh | A | Đơn vị vận hành (hiển thị tên) |
| diaDiem | A | Tỉnh/Thành phố |
| diaDiemChiTiet | A | Địa điểm chi tiết |
| tinhTrang | A | Tình trạng (Chưa KT/VH; Đang KT/VH; Dừng KT/VH) |
| status | D | Trạng thái phê duyệt (badge màu) |
| chungLoaiDenChinh | B | Chủng loại đèn chính |
| chungLoaiDenDuPhong | B | Chủng loại đèn dự phòng |
| ngayBd | B | Thời điểm đưa vào sử dụng |
| ngaySc | B | Thời điểm sửa chữa gần nhất |
| capTramDen | B | Cấp trạm đèn |
| createdAt | G | Thời gian tạo (chỉ Admin Cục) |
| createdBy | G | Người tạo (chỉ Admin Cục) |
| updatedAt | G | Thời gian cập nhật |
| updatedBy | G | Người cập nhật (chỉ Admin Cục) |

### 6.2. zobjDataSub (JSON) — Đặc thù đèn biển & nhà trạm

| Field | Nhóm | Mô tả |
|---|---|---|
| diaBan | B | Địa bàn |
| diaDiemDatTramDen | C | Địa điểm đặt trạm đèn |
| dacDiemNhanDang | B | Đặc điểm nhận dạng |
| hinhDang | B | Hình dạng |
| ketCau | C | Kết cấu |
| dienTich | C | Diện tích (m²) |
| chieuCaoThapDen | B | Chiều cao tháp đèn (m) |
| chieuCaoTamSang | B | Chiều cao tâm sáng (m) |
| tamHieuLucDiaLy | B | Tầm hiệu lực địa lý |
| tamHieuLucAnhSang | B | Tầm hiệu lực ánh sáng |
| mauSacBenNgoaiCuaThapDen | B | Màu sắc tháp đèn |
| nguonCungCapNangLuongChoDen | B | Nguồn năng lượng |
| soLuongNhanSuBoTri | C | Số lượng nhân sự |
| dienTichSuDungTram | C | Diện tích sử dụng trạm đèn (m²) |
| ghiChu | C | Ghi chú |

### 6.3. Tọa độ GIS & File

| Field | Nhóm | Mô tả |
|---|---|---|
| loaiDoiTuong | E | Loại đối tượng (Điểm/Đường/Vùng) |
| bieuTuong | E | Biểu tượng bản đồ |
| heQuyChieu | E | Hệ quy chiếu (WGS_84) |
| quyTacHienThi | E | Quy tắc hiển thị |
| zlstDataGeo | E | Danh sách tọa độ (kinh độ, vĩ độ) |
| zlstFileDk | F | File đính kèm (tên, kích thước, loại, ngày upload) |

---

## 7. API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/v1/tskt/qlkc_052/detail?id=...&ma=...` | Load chi tiết DBNT |
| GET | `/api/v1/tskt/qlkc_052/search-history?entityId=...` | Lịch sử thay đổi |
| GET | `/api/v1/tskt/ttvh_090/search?endPoint=qlkc_052&entityId=...` | DS vận hành |
| GET | `/api/v1/tskt/ttvh_091/search?endPoint=qlkc_052&entityId=...` | DS bảo trì |
| GET | `/api/v1/tskt/ttvh_092/search?endPoint=qlkc_052&entityId=...` | DS sự cố |

---

## 8. Chi tiết nghiệp vụ từng phần

Trang chi tiết hiển thị toàn bộ thông tin, tổ chức thành các nhóm. Nhóm chính (A-D) mở rộng mặc định, nhóm phụ (E-G) thu gọn mặc định.

### Nhóm A — Thông tin cơ bản (mở rộng mặc định)

| STT | Tên trường | Loại hiển thị | Mô tả |
|---|---|---|---|
| 1 | Mã đèn biển | Text (read-only) | `DBNT-{seq}`, không thay đổi |
| 2 | Tên đèn biển | Text (read-only) | Tên đầy đủ |
| 3 | Đơn vị quản lý | Text (read-only) | Mã + Tên đơn vị |
| 4 | Thuộc cảng biển | Link (read-only) | Tên cảng biển, hyperlink đến CB. Nếu CB đã xóa → tag "(không khả dụng)" |
| 5 | Đơn vị vận hành | Text (read-only) | Tên đơn vị vận hành |
| 6 | Địa điểm (Tỉnh/TP) | Text (read-only) | Tên Tỉnh/Thành phố |
| 7 | Địa điểm chi tiết | Text (read-only) | Địa chỉ cụ thể |
| 8 | Tình trạng | Text (read-only) | Chưa KT/VH; Đang KT/VH; Dừng KT/VH |

### Nhóm B — Thông tin kỹ thuật đèn biển (mở rộng mặc định)

| STT | Tên trường | Loại hiển thị | Mô tả |
|---|---|---|---|
| 9 | Chủng loại đèn chính | Text (read-only) | Loại đèn chính đang sử dụng (LED-200W, VMS-100...) |
| 10 | Chủng loại đèn dự phòng | Text (read-only) | Loại đèn dự phòng khi đèn chính gặp sự cố |
| 11 | Cấp trạm đèn | Text (read-only) | Phân cấp trạm đèn theo danh mục CAP_TRAM_DEN |
| 12 | Địa bàn | Text (read-only) | Khu vực địa bàn quản lý |
| 13 | Đặc điểm nhận dạng | Text (read-only) | Mô tả đặc điểm nhận dạng ban ngày của đèn biển |
| 14 | Hình dạng | Text (read-only) | Hình dạng tháp đèn (trụ tròn, vuông, khung thép...) |
| 15 | Chiều cao tháp đèn | Number + đơn vị (read-only) | mét |
| 16 | Chiều cao tâm sáng | Number + đơn vị (read-only) | mét (hải đồ) |
| 17 | Tầm hiệu lực địa lý | Text (read-only) | Khoảng cách tối đa có thể nhìn thấy đèn trong điều kiện lý tưởng |
| 18 | Tầm hiệu lực ánh sáng | Text (read-only) | Khoảng cách tối đa ánh sáng đèn có hiệu lực |
| 19 | Màu sắc tháp đèn | Text (read-only) | Màu sắc bên ngoài của tháp đèn (Trắng-Đỏ, Xám...) |
| 20 | Nguồn năng lượng | Text (read-only) | Nguồn cung cấp năng lượng cho đèn (điện lưới, ắc quy, pin mặt trời...) |
| 21 | Thời điểm đưa vào SD | Text (read-only) | DD/MM/YYYY |
| 22 | Thời điểm sửa chữa gần nhất | Text (read-only) | DD/MM/YYYY |

### Nhóm C — Thông tin nhà trạm (mở rộng mặc định)

| STT | Tên trường | Loại hiển thị | Mô tả |
|---|---|---|---|
| 23 | Địa điểm đặt trạm đèn | Text (read-only) | Vị trí cụ thể nơi đặt trạm đèn (đỉnh đồi, mỏm đá, đảo...) |
| 24 | Kết cấu | Text (read-only) | Kết cấu xây dựng nhà trạm (bê tông, thép, gạch...) |
| 25 | Diện tích | Number + đơn vị (read-only) | m² |
| 26 | Diện tích sử dụng trạm đèn | Number + đơn vị (read-only) | m² |
| 27 | Số lượng nhân sự bố trí | Number (read-only) | Số cán bộ, nhân viên được bố trí tại trạm |
| 28 | Ghi chú | Text (read-only) | Thông tin bổ sung khác về đèn biển và nhà trạm |

### Nhóm D — Trạng thái (mở rộng mặc định)

| STT | Tên trường | Loại hiển thị | Mô tả |
|---|---|---|---|
| 29 | Trạng thái phê duyệt | Badge (read-only) | Vàng: S_1/S_2/S_3; Xanh dương: S_6; Đỏ: S_4/S_5; Xám: S_0 |
| 30 | Ngày cập nhật | Text (read-only) | dd/MM/yyyy HH:mm |

### Nhóm E — Thông tin vị trí (tọa độ GIS) (thu gọn mặc định)

| STT | Tên trường | Loại hiển thị | Mô tả |
|---|---|---|---|
| 32 | Loại đối tượng | Text (read-only) | Điểm / Đường / Vùng |
| 33 | Biểu tượng | Icon (read-only) | Icon bản đồ |
| 34 | Hệ quy chiếu | Text (read-only) | WGS_84 |
| 35 | Quy tắc hiển thị | Text (read-only) | |
| 36 | Tọa độ | Table (read-only) | Bảng danh sách điểm (kinh độ, vĩ độ) |
| 37 | Nút "Xem vị trí" | Button | Mở modal MyMap |

### Nhóm F — File đính kèm (mở rộng mặc định)

| STT | Tên trường | Loại hiển thị | Mô tả |
|---|---|---|---|
| 38 | Danh sách file | Table (read-only) | Tên file, kích thước, loại, ngày upload |
| F1 | Nút "Tải xuống" | Button | Tải file về máy |
| F2 | Nút "In" | Button | Mở chức năng in |

### Nhóm G — Metadata (thu gọn mặc định, chỉ Admin Cục)

| STT | Tên trường | Loại hiển thị | Mô tả |
|---|---|---|---|
| 39 | Người tạo | Text (read-only) | Họ tên |
| 40 | Thời gian tạo | Text (read-only) | dd/MM/yyyy HH:mm |
| 41 | Người cập nhật | Text (read-only) | Họ tên |
| 42 | Thời gian cập nhật | Text (read-only) | dd/MM/yyyy HH:mm |

### Nhóm H — Hành động (luôn hiển thị, cố định cuối trang)

| STT | Tên trường | Loại hiển thị | Mô tả |
|---|---|---|---|
| H1 | Nút "Chỉnh sửa" | Button | Chuyển đến F-094. Chỉ Cục/Chi cục đúng đơn vị + (S_1/S_4/S_5/S_6) |
| H2 | Nút "Phê duyệt" | Button | Duyệt bản ghi. Chỉ Leader/Admin + S_2/S_3 |
| H3 | Nút "Từ chối" | Button | Từ chối bản ghi. Chỉ Leader/Admin + S_2/S_3 |
| H4 | Nút "Lịch sử" | Button | Xem lịch sử thay đổi (F-096). Tất cả người dùng |

### Tab: Thông tin phê duyệt (thu gọn mặc định)

Hiển thị dạng bảng, danh sách các lần phê duyệt:

| Cột | Mô tả |
|---|---|
| Nội dung phê duyệt | Mô tả nội dung (phê duyệt mới, phê duyệt sau sửa...) |
| Ngày phê duyệt | Ngày giờ (dd/MM/yyyy HH:mm) |
| Cán bộ phê duyệt | Họ tên cán bộ thực hiện |

### Tab: Thông tin vận hành khai thác (TTVH_090) — thu gọn mặc định

Hiển thị dạng bảng, danh sách kế hoạch vận hành khai thác liên quan đến đèn biển này:

| Cột | Mô tả |
|---|---|
| Mã kế hoạch | Mã định danh kế hoạch vận hành |
| Tên kế hoạch | Tên kế hoạch vận hành khai thác |
| Ngày bắt đầu | Ngày bắt đầu thực hiện |
| Ngày kết thúc | Ngày kết thúc thực hiện |
| Thao tác | Nút xem chi tiết kế hoạch |

### Tab: Thông tin bảo trì (TTVH_091) — thu gọn mặc định

Hiển thị dạng bảng, danh sách kế hoạch bảo trì, sửa chữa liên quan đến đèn biển này:

| Cột | Mô tả |
|---|---|
| Mã kế hoạch | Mã định danh kế hoạch bảo trì |
| Tên kế hoạch | Tên kế hoạch bảo trì |
| Thời gian bắt đầu | Thời điểm bắt đầu bảo trì |
| Thời gian kết thúc | Thời điểm kết thúc bảo trì |
| Thao tác | Nút xem chi tiết kế hoạch |

### Tab: Thông tin sự cố (TTVH_092) — thu gọn mặc định

Hiển thị dạng bảng, danh sách sự cố liên quan đến đèn biển này:

| Cột | Mô tả |
|---|---|
| Mã sự cố | Mã định danh sự cố |
| Loại sự cố | Phân loại sự cố |
| Địa điểm | Địa điểm xảy ra sự cố |
| Thời gian | Thời điểm xảy ra sự cố |
| Thao tác | Nút xem chi tiết sự cố |

---

## 9. Yêu cầu phi chức năng

### 9.1. Hiệu năng
- Tải trang ≤ 1 giây
- Tải file đính kèm ≤ 3 giây (tối đa 10MB)

### 9.2. Bảo mật
- RBAC trên tất cả API
- Nút hành động chỉ hiển thị cho vai trò có quyền
- Metadata chỉ hiển thị cho Admin Cục

### 9.3. Trải nghiệm người dùng
- Loading skeleton khi tải
- Nhóm phụ thu gọn mặc định, nhóm chính mở rộng

- Tuân thủ WCAG 2.1 AA

---

## 10. Yêu cầu giao diện

Dùng chung token màu sắc, thang số, style với F-092.

### 10.1. Màn hình Chi tiết

1. **ScreenHeader:** breadcrumb "... > Chi tiết [tên]"
2. **Card Nhóm A-D:** mở rộng mặc định, label-value pairs
3. **Collapsible sections:** Nhóm E, F, G + các tab phụ
4. **Hành động:** Nhóm H cố định cuối trang

### 10.2. Trạng thái giao diện
- Đang tải: skeleton
- Không tìm thấy: "Đèn biển không tồn tại" + nút quay lại
- Không có file: "Không có file đính kèm"
- Lỗi: cảnh báo đỏ + "Thử lại"

### 10.3. Cấu trúc file nguồn tham khảo

```
qlkc-052/modules/Detail.tsx → FormCrud mode=Detail + tabs
cang-bien-component/components/FormPheDuyet.tsx
cang-bien-component/components/DsKchtQuyHoachVanHanhBaoTriSuCo/
```
