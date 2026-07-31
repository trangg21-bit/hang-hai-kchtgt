---
id: F-018
name: Xem danh sách & Chi tiết Bến cảng
slug: xem-bc
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:42Z
last-updated: 2026-07-31
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Xem danh sách & Chi tiết Bến cảng

**Tài liệu:** BA Feature Brief
**Feature:** F-018 — Xem danh sách & Chi tiết Bến cảng
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-07-31

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Xem danh sách & Chi tiết Bến cảng là tính năng trung tâm của module Bến cảng, cung cấp giao diện tra cứu, lọc, và xem thông tin toàn bộ Bến cảng trong hệ thống. Màn hình danh sách hiển thị **19 cột** thông tin quan trọng, hỗ trợ **bộ lọc 2 cấp** (cơ bản + nâng cao), phân trang, và các thao tác nhanh: **Xem chi tiết**, **Sửa**, **Xem vị trí** (bản đồ). Màn hình chi tiết hiển thị đầy đủ 26 trường thông tin của Bến cảng, bao gồm cả lịch sử phê duyệt 2 cấp (Cảng vụ/Chi cục → Cục).

### 1.2. Tại sao cần tính năng này?

Đây là màn hình làm việc chính của cán bộ quản lý Bến cảng:

- Tra cứu nhanh toàn bộ bến trong hệ thống với bộ lọc linh hoạt
- Nắm bắt trạng thái phê duyệt 2 cấp và tình trạng khai thác của từng bến
- Truy xuất thông tin chi tiết đầy đủ 26 trường khi cần
- Điều hướng nhanh đến các chức năng Sửa (F-015), Xem vị trí trên bản đồ
- Hỗ trợ phân quyền: mỗi vai trò thấy danh sách trong phạm vi đơn vị của mình

### 1.3. Luồng hoạt động chính

**Danh sách:** Người dùng truy cập "Quản lý Bến cảng" → `GET /api/v1/ben-cang` → bảng 19 cột, phân trang 20/50/100. Bộ lọc cơ bản (Đơn vị quản lý, Tên cảng biển, Tình trạng) hiển thị trên đầu bảng. Bộ lọc nâng cao (Thuộc cảng biển, Luồng HH, Mã bến, Loại kết cấu, Công năng, Trạng thái, Ngày cập nhật từ-đến, Tỉnh/TP) hiển thị khi nhấn "Tìm kiếm nâng cao". Mỗi dòng có 3 thao tác: Xem chi tiết, Sửa (nếu có quyền), Xem vị trí (bản đồ).

**Chi tiết:** Click "Xem chi tiết" hoặc tên bến → mở popup/modal hiển thị đầy đủ 26 trường, chia thành 4 nhóm: Thông tin chung, Thông tin công bố, Thông tin vị trí, File đính kèm. Nếu có quyền, hiển thị nút "Chỉnh sửa" để chuyển sang F-015.

---

## 2. Ai dùng? Dùng như thế nào?

Quyền thao tác và xem tính năng được áp dụng theo hệ thống phân quyền tập trung. Mỗi vai trò có phạm vi truy cập và thao tác khác nhau, kiểm soát bởi RBAC.

### 2.1. Logic phân quyền chung

| Vai trò | Quyền xem | Quyền thao tác | Phạm vi dữ liệu | Ghi chú |
|---|---|---|---|---|
| system-admin (Admin Cục) | Xem toàn bộ | Xem chi tiết, Sửa, Xem vị trí | Toàn bộ hệ thống | Thấy tất cả cột, kể cả audit |
| admin-operation | Xem toàn bộ | Xem chi tiết, Sửa, Xem vị trí | Toàn bộ hệ thống | Vai trò vận hành chính |
| admin | Xem trong đơn vị | Xem chi tiết, Sửa, Xem vị trí | Trong đơn vị quản lý | |
| Chuyên viên / Lãnh đạo đơn vị | Xem trong đơn vị | Xem chi tiết, Sửa, Xem vị trí | Trong đơn vị quản lý | **ĐVQL auto-fill** |
| Lãnh đạo (cấp Cục) | Xem toàn bộ | Xem chi tiết, Xem vị trí | Toàn bộ hệ thống | Có thể duyệt từ F-017 |
| Cá nhân | Không có quyền | Không | — | Không áp dụng |

### 2.2. Logic phân quyền đặc biệt cho Admin Cục

- **Xem full dữ liệu** toàn hệ thống, mọi trạng thái
- **Xem cột audit:** Ngày cập nhật, Cán bộ cập nhật, Ngày gửi PD, Cán bộ gửi PD, Ngày PD cấp Cảng vụ, Cán bộ PD cấp Cảng vụ, Ngày PD cấp Cục, Cán bộ PD cấp Cục
- Các vai trò khác: chỉ thấy cột cơ bản, không thấy cột audit

---

## 3. User Stories

### Mức Must (bắt buộc có)

- **US-018-01:** Là Chuyên viên, tôi muốn xem danh sách Bến cảng với đầy đủ 19 cột thông tin.
- **US-018-02:** Là Chuyên viên, tôi muốn lọc danh sách theo Đơn vị quản lý, Tên cảng biển, Tình trạng.
- **US-018-03:** Là Chuyên viên, tôi muốn mở "Tìm kiếm nâng cao" để lọc theo Mã bến, Loại kết cấu, Trạng thái, Ngày cập nhật, Tỉnh/TP.
- **US-018-04:** Là Chuyên viên, tôi muốn xem chi tiết đầy đủ 26 trường khi click vào tên bến hoặc "Xem chi tiết".
- **US-018-05:** Là Chuyên viên, tôi muốn thấy nút "Sửa" trên mỗi dòng để chuyển sang form cập nhật (F-015).
- **US-018-06:** Là Chuyên viên, tôi muốn thấy nút "Xem vị trí" để xem bến trên bản đồ.
- **US-018-07:** Là Admin Cục, tôi muốn thấy đầy đủ cột audit (ngày/người cập nhật, gửi PD, phê duyệt).

### Mức Should (nên có)

- **US-018-08:** Là Chuyên viên, tôi muốn sắp xếp danh sách theo Ngày cập nhật, Tên bến, Tỉnh/TP.
- **US-018-09:** Là Chuyên viên, tôi muốn xuất danh sách ra Excel.

### Mức Could (có thể có sau)

- **US-018-10:** Là Chuyên viên, tôi muốn xem tổng số lượng bến theo từng trạng thái (badge count).
- **US-018-11:** Là Admin Cục, tôi muốn xem lịch sử thay đổi của bến ngay trong popup chi tiết.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Danh sách

**AC-018-01 — Hiển thị danh sách:** Màn hình danh sách gọi `GET /api/v1/ben-cang?page=&pageSize=&sortBy=updatedAt&sortOrder=DESC` hiển thị bảng 19 cột (xem section 10.2). Mặc định 20 dòng/trang, sắp xếp theo Ngày cập nhật giảm dần. **Xử lý khi lỗi:** API lỗi → toast "Không thể tải danh sách Bến cảng".

**AC-018-02 — Phân trang:** Hỗ trợ 20/50/100 dòng mỗi trang. Chuyển trang giữ nguyên bộ lọc.

**AC-018-03 — Sắp xếp:** Click vào tiêu đề cột để sắp xếp tăng/giảm. Mặc định: Ngày cập nhật giảm dần.

### Nhóm 2: Bộ lọc

**AC-018-04 — Bộ lọc cơ bản:** Luôn hiển thị trên đầu bảng: Đơn vị quản lý (dropdown), Tên cảng biển (text search), Tình trạng (dropdown: Tất cả / Đang khai thác/Vận hành / Chưa khai thác/Vận hành / Dừng khai thác/Vận hành). Khi thay đổi → tự động refresh danh sách.

**AC-018-05 — Tìm kiếm nâng cao:** Nhấn "Tìm kiếm nâng cao" → mở rộng panel với các trường: Thuộc cảng biển (dropdown), Thuộc luồng hàng hải (dropdown), Mã bến cảng (text), Loại kết cấu (dropdown: 4 giá trị), Công năng khai thác (text), Trạng thái (dropdown: Tất cả / Đã phê duyệt / Chờ phê duyệt cấp Cục / Lưu tạm), Ngày cập nhật từ-đến (date range), Địa điểm Tỉnh/TP (dropdown). Nhấn "Áp dụng" → refresh danh sách. Nhấn "Đặt lại" → xóa hết bộ lọc nâng cao.

**AC-018-06 — Kết hợp bộ lọc:** Bộ lọc cơ bản và nâng cao kết hợp AND. Kết quả trả về trong ≤1s.

### Nhóm 3: Chi tiết

**AC-018-07 — Mở chi tiết:** Click vào tên bến hoặc nút "Xem chi tiết" → mở popup/modal hiển thị đầy đủ 26 trường, chia 4 nhóm (xem section 10.3). **Xử lý khi lỗi:** Bến không tồn tại → 404 "Bến cảng không tồn tại".

**AC-018-08 — Đóng chi tiết:** Nhấn "Đóng", click outside, hoặc phím Esc → đóng popup.

### Nhóm 4: Thao tác

**AC-018-09 — Sửa:** Nút "Sửa" hiển thị cho vai trò có quyền `bencang:update`. Click → chuyển sang form cập nhật (F-015) với dữ liệu pre-fill. Không có quyền → ẩn nút.

**AC-018-10 — Xem vị trí:** Nút "Xem vị trí" hiển thị cho mọi vai trò có quyền xem. Click → mở bản đồ với marker tại tọa độ GPS của bến (dùng tọa độ đầu tiên trong danh sách).

### Nhóm 5: Audit columns (Admin Cục only)

**AC-018-11 — Hiển thị cột audit:** Admin Cục và admin-operation thấy đầy đủ 19 cột, bao gồm: Ngày cập nhật, Cán bộ cập nhật, Ngày gửi PD, Cán bộ gửi PD, Ngày PD cấp Cảng vụ, Cán bộ PD cấp Cảng vụ, Ngày PD cấp Cục, Cán bộ PD cấp Cục. Các vai trò khác: ẩn 8 cột audit, chỉ thấy 11 cột cơ bản + Thao tác.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng cho | Nguồn | Ngoại lệ |
|---|---|---|---|---|
| BR-018-01 | **Danh sách mặc định** — sắp xếp theo Ngày cập nhật giảm dần, 20 dòng/trang, chỉ hiển thị bến chưa bị xóa (deletedAt IS NULL) | Danh sách | UX | Không |
| BR-018-02 | **Lọc theo phân quyền** — user chỉ thấy bến trong đơn vị mình; Admin Cục/admin-op thấy toàn bộ | Danh sách | RBAC | Admin Cục |
| BR-018-03 | **Trạng thái hiển thị** — mapping enum → text: DA_PHE_DUYET → "Đã phê duyệt", CHO_PHE_DUYET → "Chờ phê duyệt cấp Cục", NHAP → "Lưu tạm", TU_CHOI → "Từ chối" | Danh sách | UI | Không |
| BR-018-04 | **Tình trạng hiển thị** — DANG_KHAI_THAC → "Đang khai thác/Vận hành", CHUA_KHAI_THAC → "Chưa khai thác/Vận hành", DUNG_KHAI_THAC → "Dừng khai thác/Vận hành" | Danh sách | UI | Không |
| BR-018-05 | **Audit columns** — 8 cột audit chỉ hiển thị cho Admin Cục và admin-operation | Danh sách | RBAC | Không |
| BR-018-06 | **Popup chi tiết** — hiển thị đầy đủ 26 trường, read-only; nếu có quyền sửa → thêm nút "Chỉnh sửa" | Chi tiết | UX | Không |
| BR-018-07 | **Xem vị trí** — dùng tọa độ GPS đầu tiên trong danh sách ben_cang_coordinate; nếu không có tọa độ → ẩn nút | Bản đồ | UX | Không |

---

## 6. Mô hình dữ liệu

> Tham chiếu F-014 section 6 cho danh sách đầy đủ các trường.

### 6.1. Nguồn dữ liệu các cột danh sách

F-018 là màn hình view, không tạo bảng mới. Dữ liệu được JOIN từ các bảng đã có:

| Cột danh sách | Nguồn dữ liệu |
|---|---|
| Đơn vị quản lý | `ben_cang.org_unit_id` → JOIN `org_unit.ten` |
| Thuộc cảng biển | `ben_cang.cang_bien_id` → JOIN `cang_bien.ten` |
| Thuộc luồng hàng hải | `ben_cang.luong_hang_hai_id` → JOIN `luong_hang_hai.ten` |
| Tên bến cảng | `ben_cang.ten_ben` |
| Địa điểm (Tỉnh/TP) | `ben_cang.tinh_thanh_pho` |
| Loại kết cấu | `ben_cang.loai_ket_cau` |
| Công năng khai thác | `ben_cang.cong_nang_khai_thac` |
| Tình trạng | `ben_cang.tinh_trang` |
| Trạng thái | `ben_cang.trang_thai_phe_duyet` |
| Ngày cập nhật | `ben_cang.updated_at` |
| Cán bộ cập nhật | `ben_cang.updated_by` |
| Ngày gửi phê duyệt | `ben_cang.updated_at` (thời điểm status chuyển thành CHO_PHE_DUYET) |
| Cán bộ gửi phê duyệt | `ben_cang.updated_by` (người thực hiện gửi PD) |
| Ngày PD cấp Cảng vụ/Chi cục | `phe_duyet_log.thoi_gian` WHERE `cap = 'CANG_VU'` |
| Cán bộ PD cấp Cảng vụ/Chi cục | `phe_duyet_log.phe_duyet_boi` WHERE `cap = 'CANG_VU'` |
| Ngày PD cấp Cục | `phe_duyet_log.thoi_gian` WHERE `cap = 'CUC'` |
| Cán bộ PD cấp Cục | `phe_duyet_log.phe_duyet_boi` WHERE `cap = 'CUC'` |

> **Ghi chú:** Các trường audit được lưu tự động bởi F-014 (Tạo mới), F-015 (Cập nhật), F-017 (Phê duyệt). F-018 chỉ SELECT và JOIN, không tạo thêm trường nào.

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/ben-cang` | Danh sách Bến cảng. Query params: `page`, `pageSize`, `sortBy`, `sortOrder`, `orgUnitId`, `tenCangBien` (search), `tinhTrang`, `cangBienId`, `luongHangHaiId`, `maBen`, `loaiKetCau`, `congNang`, `trangThai`, `ngayCapNhatTu`, `ngayCapNhatDen`, `tinhThanhPho` | `bencang:read` |
| GET | `/api/v1/ben-cang/{id}` | Chi tiết Bến cảng — trả về đầy đủ 26 trường + danh sách tọa độ + file đính kèm | `bencang:read` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Luồng danh sách

```
Truy cập "Quản lý Bến cảng"
→ GET /api/v1/ben-cang?page=1&pageSize=20&sortBy=updatedAt&sortOrder=DESC
→ Hiển thị bảng 19 cột (11 cơ bản + 8 audit nếu Admin Cục)
→ Bộ lọc cơ bản: ĐVQL, Tên cảng biển, Tình trạng
→ Bộ lọc nâng cao (ẩn/hiện): 8 trường + date range
→ Mỗi dòng: [Xem chi tiết] [Sửa] [Xem vị trí]
→ Phân trang: 20/50/100
```

### 8.2. Luồng chi tiết (popup)

```
Click tên bến hoặc "Xem chi tiết"
→ GET /api/v1/ben-cang/{id}
→ Mở popup/modal 4 nhóm:
  1. Thông tin chung (17 trường)
  2. Thông tin công bố (3 trường)
  3. Thông tin vị trí (4 trường + bảng tọa độ)
  4. File đính kèm (danh sách)
→ Nếu có quyền bencang:update → nút "Chỉnh sửa"
→ Nút "Đóng" / Esc / click outside
```

---

## 9. Yêu cầu phi chức năng

- **Hiệu năng:** GET danh sách ≤1s với ≤10,000 bản ghi; GET chi tiết ≤300ms; ≥50 concurrent users
- **Mở rộng:** Có thể thêm cột mới vào danh sách qua config; bộ lọc nâng cao dễ mở rộng thêm trường
- **Bảo mật:** RBAC `bencang:read`; ẩn cột audit với vai trò không phải Admin Cục/admin-op; HTTPS
- **Độ tin cậy:** Phân trang server-side, tránh load quá nhiều dữ liệu
- **UX:** Responsive; loading skeleton; bộ lọc nâng cao toggle mượt; popup chi tiết có scroll nếu nội dung dài
- **Pháp lý:** Dữ liệu audit hiển thị đúng người/ngày, không chỉnh sửa được

---

## 10. Yêu cầu giao diện

> Token từ theme.ts và tokens.ts. Không hardcode.

### 10.1. Cấu trúc màn hình danh sách

- **ScreenHeader:** "Quản lý Bến cảng" + nút "Tạo mới" (F-014) + nút "Xuất Excel"
- **FilterBar (cơ bản):** Đơn vị quản lý | Tên cảng biển | Tình trạng | [Tìm kiếm nâng cao]
- **FilterBar (nâng cao - toggle):** Thuộc cảng biển | Thuộc luồng HH | Mã bến | Loại kết cấu | Công năng | Trạng thái | Ngày cập nhật (từ-đến) | Tỉnh/TP | [Áp dụng] [Đặt lại]
- **DataTable:** 19 cột
- **Pagination:** 20/50/100

### 10.2. Bảng cột danh sách

| STT | Tên cột | Hiển thị cho | Sắp xếp? | Ghi chú |
|---|---|---|---|---|
| 1 | STT | Tất cả | Không | Số thứ tự |
| 2 | Đơn vị quản lý | Tất cả | Có | Join org_unit.ten |
| 3 | Thuộc cảng biển | Tất cả | Có | Join cang_bien.ten |
| 4 | Thuộc luồng hàng hải | Tất cả | Không | Join luong_hang_hai.ten |
| 5 | Tên bến cảng | Tất cả | Có | Clickable → chi tiết |
| 6 | Địa điểm (Tỉnh/TP) | Tất cả | Có | |
| 7 | Loại kết cấu bến cảng | Tất cả | Không | |
| 8 | Công năng khai thác | Tất cả | Không | |
| 9 | Ngày cập nhật | **Audit** | Có | dd/MM/yyyy HH:mm |
| 10 | Cán bộ cập nhật | **Audit** | Không | |
| 11 | Ngày gửi phê duyệt | **Audit** | Có | dd/MM/yyyy HH:mm |
| 12 | Cán bộ gửi phê duyệt | **Audit** | Không | |
| 13 | Ngày PD cấp Cảng vụ/Chi cục | **Audit** | Có | dd/MM/yyyy HH:mm |
| 14 | Cán bộ PD cấp Cảng vụ/Chi cục | **Audit** | Không | |
| 15 | Ngày phê duyệt cấp Cục | **Audit** | Có | dd/MM/yyyy HH:mm |
| 16 | Cán bộ phê duyệt cấp Cục | **Audit** | Không | |
| 17 | Tình trạng | Tất cả | Có | Badge: xanh lá/vàng/đỏ |
| 18 | Trạng thái | Tất cả | Có | Badge: xanh lá/vàng/xám |
| 19 | Thao tác | Tất cả | Không | [Chi tiết] [Sửa] [Vị trí] |

**Ghi chú:** Cột Audit (9-16) chỉ hiển thị cho Admin Cục và admin-operation.

### 10.3. Popup chi tiết

4 tab/nhóm:

1. **Thông tin chung:** ĐVQL, Cảng biển, Luồng HH, ĐV khai thác, Mã bến, Tên bến, Tỉnh/TP, Địa chỉ, Loại kết cấu, Công năng, Tổng DT, Năng lực TK, Năng lực HT, Cỡ tàu max, QH năng lực, Sản lượng, Tình trạng, Trạng thái
2. **Thông tin công bố:** Thời điểm, Quyết định, Văn bản thỏa thuận
3. **Thông tin vị trí:** Loại ĐT, Biểu tượng, Hệ quy chiếu, Quy tắc + Bảng tọa độ
4. **File đính kèm:** Danh sách file (tên, dung lượng, ngày upload)

### 10.4. Badge màu

**Tình trạng:**
- Đang khai thác/Vận hành → xanh lá
- Chưa khai thác/Vận hành → vàng
- Dừng khai thác/Vận hành → đỏ

**Trạng thái:**
- Đã phê duyệt → xanh lá
- Chờ phê duyệt cấp Cục → vàng
- Lưu tạm → xám

### 10.5. Trạng thái UI

- Loading: skeleton table rows
- Danh sách trống: "Không tìm thấy Bến cảng nào phù hợp"
- Lỗi API: toast đỏ
- Popup chi tiết: loading spinner → nội dung

---

## Consolidation Note

Merged with UI features F-073 (ui-ql-bc-danh-sach) and F-074 (ui-xem-bc-chi-tiet) — 2026-07-31
