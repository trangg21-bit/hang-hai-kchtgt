---
id: F-014
name: Quản lý Bến cảng - Tạo mới
slug: ql-bc-tao-moi
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:42Z
last-updated: 2026-07-31
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Bến cảng - Tạo mới

**Tài liệu:** BA Feature Brief
**Feature:** F-014 — Quản lý Bến cảng - Tạo mới
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-07-31

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Tạo mới Bến cảng là tính năng cho phép người dùng có thẩm quyền đăng ký một Bến cảng mới vào hệ thống quản lý tài sản KCHTGT Hàng Hải. Người dùng chọn **Đơn vị quản lý** → chọn **Cảng biển** (được lọc theo đơn vị) → hệ thống **tự động sinh mã bến** theo quy tắc `{mã-cảng-mẹ}-B{XX}`. Form gồm 4 nhóm: Thông tin chung (17 trường), Thông tin công bố (3 trường), Thông tin vị trí (GIS + bảng tọa độ), File đính kèm.

Người dùng có 3 lựa chọn lưu:
- **Lưu tạm** → `trangThaiPheDuyet = NHAP`
- **Lưu và gửi phê duyệt** → `CHO_PHE_DUYET` (chờ Cảng vụ/Chi cục duyệt). Sau đó: Cảng vụ duyệt → `CHO_PD_CAP_CUC` (chờ Cục) → Cục duyệt → `DA_PHE_DUYET`
- **Lưu và phê duyệt** (admin-op/system-admin) → `DA_PHE_DUYET` ngay, bỏ qua 2 cấp

### 1.2. Tại sao cần tính năng này?

Bến cảng là đơn vị hạ tầng chi tiết bên trong mỗi Cảng biển, nơi trực tiếp tiếp nhận và phục vụ tàu bè. Việc số hóa quy trình đăng ký Bến cảng đảm bảo:

- Dữ liệu Bến cảng được chuẩn hóa theo cấu trúc thống nhất, gắn với Cảng mẹ và Đơn vị quản lý
- Mã bến được hệ thống tự động sinh — loại bỏ sai sót do nhập tay
- Quy trình phê duyệt 2 cấp (Cảng vụ/Chi cục → Cục) đảm bảo kiểm soát chất lượng
- Tích hợp dữ liệu GIS phục vụ hiển thị bản đồ
- Đầy đủ thông tin công bố, năng lực khai thác, file đính kèm

### 1.3. Luồng hoạt động chính

Người dùng đăng nhập, chọn "Quản lý Bến cảng" → "Tạo mới". Form 4 nhóm hiển thị. Chọn Đơn vị quản lý → Cảng biển (lọc) → mã bến tự sinh. Nhập các trường. Chọn action: Lưu tạm / Gửi phê duyệt / Lưu và phê duyệt. Khi Gửi phê duyệt, hệ thống lưu `ngay_gui_phe_duyet` và `can_bo_gui_phe_duyet`.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Logic phân quyền chung

| Vai trò | Quyền xem | Quyền thao tác | Phạm vi dữ liệu | Ghi chú |
|---|---|---|---|---|
| system-admin (Admin Cục) | Xem toàn bộ | Tạo mới, Lưu tạm, Gửi PD, Lưu & PD | Toàn bộ hệ thống | **Không giới hạn ĐVQL** |
| admin-operation | Xem toàn bộ | Tạo mới, Lưu tạm, Gửi PD, Lưu & PD | Toàn bộ hệ thống | Vai trò vận hành chính |
| admin | Xem trong đơn vị | Tạo mới, Lưu tạm | Trong đơn vị | Không Gửi PD |
| Chuyên viên / Lãnh đạo đơn vị | Xem trong đơn vị | Tạo mới, Lưu tạm | Trong đơn vị | **ĐVQL auto-fill, read-only** |
| Lãnh đạo (cấp Cục) | Xem toàn bộ | Không | — | Chỉ duyệt từ F-017 |
| Cá nhân | Không | Không | — | |

### 2.2. Logic phân quyền đặc biệt cho Admin Cục

- Xem full dữ liệu; xem người tạo/thời gian tạo; xem người sửa/thời gian sửa

---

## 3. User Stories

### Mức Must
- **US-014-01:** Là Chuyên viên/admin, tôi muốn mở form "Tạo mới Bến cảng" từ danh sách.
- **US-014-02:** Là Admin Cục, tôi muốn chọn ĐVQL từ dropdown; là Chuyên viên, tôi muốn ĐVQL auto-fill (read-only).
- **US-014-03:** Là Chuyên viên, tôi muốn hệ thống tự sinh mã bến khi chọn Cảng biển.
- **US-014-04:** Là Chuyên viên, tôi muốn "Lưu tạm" để lưu bản nháp.
- **US-014-05:** Là admin-operation/system-admin, tôi muốn "Gửi phê duyệt" để chuyển bến sang chờ Cảng vụ duyệt.
- **US-014-06:** Là admin-operation/system-admin, tôi muốn "Lưu và phê duyệt" để duyệt luôn.
- **US-014-07:** Là Chuyên viên, tôi muốn thêm nhiều tọa độ GPS và upload file đính kèm.

### Mức Should
- **US-014-08:** Là Chuyên viên, tôi muốn nút "Hủy" có xác nhận nếu form có thay đổi.
- **US-014-09:** Là Chuyên viên, tôi muốn form hỗ trợ Tab/Enter.

### Mức Could
- **US-014-10:** Là Chuyên viên, tôi muốn xem trước vị trí bến trên bản đồ từ tọa độ đã nhập.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Truy cập và hiển thị

**AC-014-01 — Truy cập:** Chuyên viên, admin, admin-op, system-admin → menu → form hiển thị. Khác → ẩn nút, HTTP 403.
**AC-014-02 — Cascade ĐVQL → Cảng biển:** Chọn ĐVQL → Cảng biển lọc theo đơn vị + HIEN_HANH. Chưa chọn → dropdown Cảng biển disable.
**AC-014-03 — Mã bến tự sinh:** Chọn Cảng biển → `GET /generate-code?cangBienId=` → hiển thị RO. Đổi Cảng biển → sinh lại.

### Nhóm 2: Lưu tạm

**AC-014-04 — Lưu tạm:** ĐVQL + Cảng biển + Tên bến → `POST` action=draft → `status=NHAP`. Thiếu Tên bến → lỗi.

### Nhóm 3: Gửi phê duyệt

**AC-014-05 — Gửi PD:** Đầy đủ trường bắt buộc + ≥1 GPS → `POST` action=submit → `status=CHO_PHE_DUYET`, lưu `ngay_gui_phe_duyet`, `can_bo_gui_phe_duyet` → toast "Đã gửi phê duyệt, chờ Cảng vụ/Chi cục duyệt".
**AC-014-06 — Thiếu trường:** Thiếu Tỉnh/TP, Tình trạng, hoặc 0 GPS → lỗi từng trường.

### Nhóm 4: Lưu và phê duyệt

**AC-014-07 — Lưu & PD:** admin-op/system-admin → đầy đủ + ≥1 GPS → `status=DA_PHE_DUYET` ngay, tạo PheDuyetLog (cap=CUC).

### Nhóm 5: Xác thực

**AC-014-08 — GPS:** [-90,90], [-180,180]. Client + server.
**AC-014-09 — Số ≥0:** Diện tích, Năng lực, Cỡ tàu, Sản lượng.
**AC-014-10 — File:** PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF; ≤20MB; ≤10 files.

### Nhóm 6: Phân quyền

**AC-014-11 — Admin Cục:** ĐVQL dropdown chọn mọi đơn vị.
**AC-014-12 — Chuyên viên/LĐ đơn vị:** ĐVQL auto-fill, RO.
**AC-014-13 — Ẩn nút:** "Gửi PD" cho admin-op/system-admin; "Lưu & PD" cho admin-op/system-admin; "Lưu tạm" cho tất cả có quyền.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng cho | Nguồn | Ngoại lệ |
|---|---|---|---|---|
| BR-014-01 | **Mã bến tự sinh, bất biến** — `{mã-cảng-mẹ}-B{XX}`, duy nhất toàn hệ thống | Tạo mới, Cập nhật | Thiết kế | Đổi Cảng biển → sinh lại |
| BR-014-02 | **Cascade ĐVQL → Cảng biển** — lọc theo đơn vị + HIEN_HANH | Tạo mới | Nghiệp vụ | Admin Cục xem toàn bộ |
| BR-014-03 | **Lưu tạm tối thiểu** — ĐVQL + Cảng biển + Tên bến; status=NHAP | Lưu tạm | Nghiệp vụ | Không |
| BR-014-04 | **Gửi PD đầy đủ** — ĐVQL, Cảng biển, Tên bến, Tỉnh/TP, Tình trạng, ≥1 GPS; status=CHO_PHE_DUYET | Gửi PD | Nghiệp vụ | Không |
| BR-014-05 | **Lưu & PD bỏ qua 2 cấp** — admin-op/system-admin; status=DA_PHE_DUYET ngay | Lưu & PD | Nghiệp vụ | Không |
| BR-014-06 | **GPS hợp lệ:** [-90,90], [-180,180] | Tất cả | WGS84 | Không |
| BR-014-07 | **Loại kết cấu enum 4 giá trị** | Tạo mới, Cập nhật | Thiết kế | Không |
| BR-014-08 | **Phân quyền ĐVQL** — Admin Cục chọn mọi đơn vị; còn lại auto-fill | Tạo mới | RBAC | Admin Cục |
| BR-014-09 | **Ghi nhận ngày/người gửi PD** — `ngay_gui_phe_duyet`, `can_bo_gui_phe_duyet` khi Gửi PD | Gửi PD | F-018 | Không |
| BR-014-10 | **File đính kèm:** PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF; ≤20MB; ≤10 | Upload | Hạ tầng | Không |
| BR-014-11 | **Audit log** — actor, thời gian, hành động, IP | Audit | Bảo mật | Không |

---

## 6. Mô hình dữ liệu

> 🔴 = trường mới.

### 6.1. Bảng `ben_cang`

**Thông tin chung:**
- id, ma_ben, ten_ben, org_unit_id, cang_bien_id, luong_hang_hai_id, don_vi_khai_thac
- tinh_thanh_pho, dia_chi_chi_tiet, loai_ket_cau (enum 4), cong_nang_khai_thac
- tong_dien_tich_ha, nang_luc_thiet_ke, nang_luc_hien_trang
- co_tau_tiep_nhan_max_dwt, quy_hoach_nang_luc, san_luong_thuc_te_nam_gan_nhat
- 🔴 **tinh_trang:** NVARCHAR(50) — `DANG_KHAI_THAC` / `CHUA_KHAI_THAC` / `DUNG_KHAI_THAC`

**Thông tin công bố:** thoi_diem_cong_bo, quyet_dinh_cong_bo, van_ban_thoa_thuan

**Thông tin GIS:** object_type, symbol_id, coordinate_system, display_rule

**Trạng thái & Audit:**
- 🔴 **trang_thai_phe_duyet:** NVARCHAR(50) — `NHAP` / `CHO_PHE_DUYET` / `CHO_PD_CAP_CUC` / `DA_PHE_DUYET` / `TU_CHOI`, DEFAULT 'NHAP'
- 🔴 **ngay_gui_phe_duyet:** TIMESTAMP — lưu khi Gửi PD
- 🔴 **can_bo_gui_phe_duyet:** NVARCHAR(100) — lưu khi Gửi PD
- 🔴 **ngay_pd_cang_vu:** TIMESTAMP — lưu khi Cảng vụ duyệt (F-017)
- 🔴 **can_bo_pd_cang_vu:** NVARCHAR(100) — lưu khi Cảng vụ duyệt (F-017)
- 🔴 **ngay_pd_cuc:** TIMESTAMP — lưu khi Cục duyệt (F-017)
- 🔴 **can_bo_pd_cuc:** NVARCHAR(100) — lưu khi Cục duyệt (F-017)
- ly_do_tu_choi, ghi_chu, created_by, created_at, updated_by, updated_at, deleted_at

### 6.2. `ben_cang_coordinate` & `ben_cang_attachment`

Như bản cũ.

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| POST | `/api/v1/ben-cang` | Tạo mới. Body: action (`draft`/`submit`/`approve`) + thông tin + coordinates[] | `bencang:create` |
| GET | `/api/v1/ben-cang/generate-code?cangBienId=` | Sinh mã bến | `bencang:create` |
| GET | `/api/v1/cang-bien?orgUnitId=&status=HIEN_HANH` | Danh sách Cảng biển | `bencang:create` |
| GET | `/api/v1/org-units` | Danh sách đơn vị | `bencang:create` |
| GET | `/api/v1/luong-hang-hai` | Danh sách luồng HH | `bencang:create` |
| POST | `/api/v1/ben-cang/{id}/attachments` | Upload file | `bencang:create` |
| DELETE | `/api/v1/ben-cang/{id}/attachments/{attId}` | Xóa file (khi NHAP) | `bencang:create` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Cascade ĐVQL → Cảng biển → Mã bến

Mở form → Chọn ĐVQL → Cảng biển lọc theo đơn vị + HIEN_HANH → Chọn Cảng biển → GET /generate-code → mã bến RO → Đổi Cảng biển → sinh lại mã.

### 8.2. Lưu tạm

ĐVQL + Cảng biển + Tên bến → "Lưu tạm" → POST action=draft → status=NHAP → Audit log → Response 201.

### 8.3. Gửi phê duyệt

Đầy đủ + ≥1 GPS → "Gửi phê duyệt" → POST action=submit → status=CHO_PHE_DUYET → Lưu ngay_gui_phe_duyet = NOW(), can_bo_gui_phe_duyet = currentUser → Audit log → Response 201.

### 8.4. Lưu và phê duyệt

admin-op/system-admin → "Lưu và phê duyệt" → POST action=approve → status=DA_PHE_DUYET → Tạo PheDuyetLog (cap=CUC, action=APPROVE) → Audit log → Response 201.

---

## 9. Yêu cầu phi chức năng

- **Hiệu năng:** POST ≤2s, GET generate-code ≤200ms, ≥50 concurrent
- **Mở rộng:** Bảng chuẩn hóa; quy tắc sinh mã configurable
- **Bảo mật:** RBAC; server-side validation; tampering detection mã bến; HTTPS
- **Độ tin cậy:** Transaction atomicity; lock khi sinh mã; audit log
- **UX:** Responsive; loading indicator; modal xác nhận rời form; WCAG 2.1 AA
- **Pháp lý:** Chuẩn mã VN-301; audit log ≥2 năm

---

## 10. Yêu cầu giao diện

> Token từ theme.ts và tokens.ts.

### 10.1. Cấu trúc form

1. Thông tin chung — ĐVQL*, Cảng biển*, Mã bến (RO), Tên bến*, Tỉnh/TP*, Địa chỉ, Loại kết cấu, Công năng, Tổng DT, Năng lực TK, Năng lực HT, Cỡ tàu max, QH năng lực, Sản lượng, Tình trạng*
2. Thông tin công bố — Thời điểm, Quyết định, Văn bản thỏa thuận
3. Thông tin vị trí — Loại ĐT, Biểu tượng, Hệ quy chiếu, Quy tắc + Bảng tọa độ
4. File đính kèm — Upload + danh sách
5. Action — "Lưu tạm" / "Gửi phê duyệt" (primary) / "Lưu và phê duyệt" (admin-op/system-admin)

### 10.2. Bảng trường form

| STT | Tên trường | Loại ĐK | Bắt buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Đơn vị quản lý | Select | Có | Admin Cục: dropdown; còn lại: auto-fill RO |
| 2 | Thuộc cảng biển | Select | Có | Lọc theo ĐVQL; trigger sinh mã |
| 3 | Mã bến cảng | Text (RO) | Có | Tự sinh `{mã-cảng-mẹ}-B{XX}` |
| 4 | Tên bến cảng | Text | Có | |
| 5 | Thuộc luồng hàng hải | Select | Không | |
| 6 | Đơn vị khai thác | Text | Không | |
| 7 | Địa điểm (Tỉnh/TP) | Select | Có* | *Submit |
| 8 | Địa điểm chi tiết | Text | Không | |
| 9 | Loại kết cấu bến cảng | Select | Không | 4 enum |
| 10 | Công năng khai thác | Text | Không | |
| 11 | Tổng diện tích (ha) | Number | Không | ≥0 |
| 12 | Năng lực thông qua thiết kế | Number | Không | ≥0 |
| 13 | Năng lực thông qua hiện trạng | Number | Không | ≥0 |
| 14 | Cỡ tàu tiếp nhận lớn nhất (DWT) | Number | Không | ≥0 |
| 15 | Quy hoạch năng lực thông qua | Number | Không | ≥0 |
| 16 | Sản lượng thực tế năm gần nhất | Number | Không | ≥0 |
| 17 | Tình trạng | Select | Có* | Đang/Chưa/Dừng khai thác |
| 18 | Thời điểm công bố | Date | Không | |
| 19 | Quyết định công bố | Text | Không | |
| 20 | Văn bản thỏa thuận | Text | Không | |
| 21 | Loại đối tượng | Select | Không | |
| 22 | Biểu tượng | Select | Không | |
| 23 | Hệ quy chiếu | Select | Không | |
| 24 | Quy tắc hiển thị | Text | Không | |
| 25 | Tọa độ GPS | Bảng con | Có* | *≥1 Submit |
| 26 | File đính kèm | Upload | Không | ≤10, 20MB |

---

## Consolidation Note

Merged with UI feature F-075 (ui-ql-bc-tao-moi) — 2026-07-31
