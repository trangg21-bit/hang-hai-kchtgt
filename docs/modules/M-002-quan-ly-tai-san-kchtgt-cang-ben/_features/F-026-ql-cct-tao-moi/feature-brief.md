---
id: F-026
name: Quản lý Cảng cạn - Tạo mới
slug: ql-cct-tao-moi
module-id: M-002
status: backend_done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-03
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Cảng cạn - Tạo mới

**Tài liệu:** BA Feature Brief
**Feature:** F-026 — Quản lý Cảng cạn - Tạo mới
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-03

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Tạo mới Cảng cạn (ICD — Inland Container Depot) cho phép người dùng có thẩm quyền khai báo Cảng cạn mới vào hệ thống. Khi mở form, hệ thống tự động sinh **Mã cảng cạn** dạng CC-XXXXXX (read-only, không sửa được). Form gồm **4 nhóm, 25 trường**:

| Nhóm | Số trường | Bắt buộc |
|------|----------|----------|
| Thông tin chung | 15 | ĐVQL, Tên, Tỉnh/TP, Địa chỉ chi tiết, Công suất, Tình trạng |
| Thông tin công bố | 4 | Không |
| Vị trí (GIS) | 5 + bảng tọa độ | Không |
| File đính kèm | Upload | Không |

Người dùng có 2 lựa chọn lưu trên form tạo mới:
- **Lưu tạm** → `approvalStatus = NHAP` (cho phép mở lại chỉnh sửa, chưa vào luồng phê duyệt)
- **Lưu và phê duyệt** → `approvalStatus = APPROVED` (dành cho người có cả `dryport:create` + `dryport:approve`, bỏ qua queue, duyệt ngay)

> **Gửi phê duyệt** không phải là nút trên form tạo mới. Đây là hành động trên **F-083 — Danh sách**: người dùng chọn bản ghi NHAP và bấm "Gửi phê duyệt" để chuyển vào queue PENDING.

Mặc định: `tinhTrang = CHUA_KHAI_THAC`. Mã cảng cạn CC-XXXXXX được sinh 1 lần khi mở form, **bất biến sau khi lưu** — kể cả lưu tạm hay lưu và phê duyệt.

### 1.2. Tại sao cần?

- Chuẩn hóa dữ liệu Cảng cạn: quản lý, năng lực, diện tích, GIS, công bố
- Gắn ĐVQL + ĐV khai thác rõ trách nhiệm
- Tích hợp GIS (điểm/đường/vùng) phục vụ bản đồ
- Hồ sơ công bố đầy đủ
- Qua phê duyệt trước khi vận hành

### 1.3. Luồng chính

**Lưu tạm (form):** Mở F-083 → "Tạo mới" → hệ thống tự sinh mã CC-XXXXXX → modal 4 tab → nhập tối thiểu Tên cảng cạn → "Lưu tạm" → `POST /api/v1/dry-ports?action=draft` → `approvalStatus=NHAP` → toast "Đã lưu nháp" → ở lại form.

**Lưu và phê duyệt (form):** Người có `dryport:approve` → điền đầy đủ 6 trường bắt buộc → "Lưu và phê duyệt" → `POST /api/v1/dry-ports?action=approve` → `approvalStatus=APPROVED` ngay, tạo `approval_logs` → toast "Đã tạo và phê duyệt thành công" → redirect F-083.

**Gửi phê duyệt (danh sách F-083):** Bản ghi NHAP → chọn "Gửi phê duyệt" từ dropdown → hệ thống kiểm tra đủ 6 trường bắt buộc → `PUT /api/v1/dry-ports/{id}?action=submit` → `approvalStatus=PENDING` → vào queue chờ Lãnh đạo duyệt tại F-029.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Phân quyền theo chức năng

Tính năng Tạo mới Cảng cạn được bảo vệ bởi permission `dryport:create`. Chỉ người dùng được gán quyền này mới thấy nút "Tạo mới" và gọi được API. Các vai trò được cấp quyền mặc định:

| Permission | Mô tả |
|---|---|
| `dryport:create` | Tạo mới Cảng cạn |
| `dryport:read` | Xem danh sách, chi tiết Cảng cạn |
| `dryport:update` | Cập nhật Cảng cạn |
| `dryport:delete` | Xóa Cảng cạn |
| `dryport:approve` | Phê duyệt / Từ chối Cảng cạn |
| `dryport:history` | Xem lịch sử thay đổi Cảng cạn |

> **Phân quyền do M-001 — Quản trị hệ thống quản lý.** Các permission trên được gán động cho vai trò thông qua module M-001. Tài liệu này chỉ khai báo permission cần có; việc gán vai trò nào có quyền nào thuộc về cấu hình RBAC trong M-001.

> **Admin Cục (system-admin):** Khi được gán `dryport:create`, xem toàn bộ dữ liệu không giới hạn đơn vị. Dropdown ĐVQL hiển thị tất cả đơn vị. Các vai trò khác bị giới hạn trong đơn vị của mình, ĐVQL auto-fill read-only.

### 2.2. Logic Admin Cục

- Xem full dữ liệu, không giới hạn đơn vị
- Xem `createdBy`, `createdAt`, `updatedBy`, `updatedAt`
- Các vai trò khác: ẩn các trường audit này

---

## 3. User Stories

### Must
- **US-026-01:** Mở form "Tạo mới Cảng cạn" từ F-083 (`dryport:create`), hệ thống tự sinh mã CC-XXXXXX.
- **US-026-02:** Admin Cục chọn ĐVQL từ dropdown; admin thường auto-fill.
- **US-026-03:** Là người dùng, tôi muốn "Lưu tạm" chỉ với mã (tự sinh) + Tên cảng cạn, các trường khác để trống cũng được.
- **US-026-04:** Là người dùng có `dryport:approve`, tôi muốn "Lưu và phê duyệt" để tạo và duyệt luôn, bỏ qua queue.
- **US-026-05:** Là người dùng, tôi muốn mã CC-XXXXXX không thay đổi dù tôi lưu tạm hay lưu và phê duyệt.

### Should
- **US-026-06:** Là người dùng, tôi muốn sau khi "Lưu tạm", form ở lại để tôi tiếp tục chỉnh sửa.
- **US-026-07:** Là người dùng, tôi muốn thêm tọa độ GIS + chọn loại đối tượng/hệ quy chiếu/biểu tượng.
- **US-026-08:** Là người dùng, tôi muốn upload file ≤ 20MB, ≤ 10 files.
- **US-026-09:** Là người dùng, tôi muốn Hủy/Esc đóng form, không lưu.

### Could
- **US-026-10:** Là người dùng, tôi muốn nhập thông tin công bố ngay khi tạo.
- **US-026-11:** Tab/Enter điều hướng form.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Truy cập

**AC-026-01:** Có `dryport:create` → thấy nút "Tạo mới". Không có → ẩn nút, HTTP 403.
**AC-026-02:** Form mở 4 tab, trường trống, focus `dryPortCode`, bắt buộc (*).
**AC-026-03:** Admin Cục → dropdown ĐVQL full. Admin → lọc theo đơn vị.

### Nhóm 2: Validate

**AC-026-04 — Validate Lưu và phê duyệt:** Khi bấm "Lưu và phê duyệt" trên form, bỏ trống bất kỳ trong 6 trường: ĐVQL, Tên, Tỉnh/TP, Địa chỉ chi tiết, Công suất, Tình trạng → lỗi "Đây là trường bắt buộc", không gửi API. (Khác với Lưu tạm — chỉ cần Tên.)
**AC-026-05 — Mã tự sinh:** Khi mở form, hệ thống gọi `GET /api/v1/dry-ports/generate-code` → hiển thị mã dạng CC-XXXXXX (read-only). Nếu lỗi → "Không thể tạo mã cảng cạn. Vui lòng thử lại."
**AC-026-06:** Diện tích/Công suất < 0 → lỗi "Giá trị không được âm".

### Nhóm 3: GIS

**AC-026-07:** Tab Vị trí → "Thêm mới" → Kinh độ (E) + Vĩ độ (N). Nhiều dòng. [-180,180], [-90,90].
**AC-026-08:** Loại đối tượng: Điểm/Đường/Vùng.

### Nhóm 4: Lưu tạm

**AC-026-09 — Lưu tạm:** Điền tối thiểu Tên cảng cạn (mã đã tự sinh) → bấm "Lưu tạm" → `POST /api/v1/dry-ports?action=draft` → backend lưu `approvalStatus=NHAP` → toast "Đã lưu nháp" → form ở lại, không redirect. Thiếu Tên → lỗi "Tên cảng cạn là trường bắt buộc".

**AC-026-10 — Mở lại nháp:** Từ F-083, bản ghi có `approvalStatus=NHAP` → nút "Tiếp tục chỉnh sửa" → mở F-027 với dữ liệu pre-filled. Cho phép sửa tất cả trường trừ mã.

### Nhóm 5: Lưu và phê duyệt

**AC-026-11 — Lưu và phê duyệt:** Người dùng có `dryport:approve` → đầy đủ 6 trường bắt buộc → bấm "Lưu và phê duyệt" → `POST /api/v1/dry-ports?action=approve` → `approvalStatus=APPROVED`, tạo `approval_logs` → toast "Đã tạo và phê duyệt thành công" → redirect F-083. Không có `dryport:approve` → không thấy nút này.

**AC-026-12 — Thiếu trường:** Thiếu bất kỳ trường bắt buộc nào → lỗi từng trường, không gửi API. (Lưu tạm không bắt 6 trường.)

### Nhóm 6: Hủy & File

**AC-026-13:** Hủy/Esc → đóng form, không tạo bản ghi.
**AC-026-14:** File: PDF/DOC/DOCX/XLS/XLSX/JPG/PNG/TIFF; ≤ 20MB; ≤ 10 files.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

### 5.1. Mã cảng cạn

| ID | Quy tắc | Áp dụng cho | Nguồn | Ngoại lệ |
|---|---|---|---|---|
| BR-026-01 | **Mã cảng cạn tự động sinh, bất biến** — định dạng CC-XXXXXX, duy nhất toàn hệ thống. Hệ thống tự sinh khi mở form tạo mới, hiển thị read-only. Sau khi lưu, mã không thể thay đổi. | Tạo mới, Cập nhật | Thiết kế | Không |

### 5.2. Luồng tạo mới: Lưu tạm & Lưu và phê duyệt

| ID | Quy tắc | Áp dụng cho | Nguồn | Ngoại lệ |
|---|---|---|---|---|
| BR-026-02 | **Lưu tạm: tối thiểu mã + Tên cảng cạn** — Khi lưu tạm, chỉ yêu cầu mã (đã tự sinh) và Tên cảng cạn. Các trường khác có thể để trống. `approvalStatus = NHAP`. Có thể mở lại chỉnh sửa bất kỳ lúc nào trước khi gửi phê duyệt. | Lưu tạm | Nghiệp vụ | Không |
| BR-026-03 | **Lưu và phê duyệt: đầy đủ 6 trường + quyền approve** — Người dùng có `dryport:approve` được thấy nút "Lưu và phê duyệt". Yêu cầu đầy đủ 6 trường bắt buộc. `approvalStatus = APPROVED` ngay, bỏ qua queue, tạo `approval_logs`. Người không có quyền approve không thấy nút này. | Lưu và phê duyệt | Nghiệp vụ | Không |
| BR-026-04 | **Tình trạng mặc định** — Khi tạo mới, `tinhTrang` mặc định là `CHUA_KHAI_THAC` (Chưa khai thác). Người dùng có thể chọn `VAN_HANH` (Vận hành) nếu cảng cạn đã đi vào hoạt động thực tế. | Tạo mới | Nghiệp vụ | Không |
| BR-026-05 | **Mã bất biến** — Sau khi lưu lần đầu (dù lưu tạm hay lưu và phê duyệt), mã CC-XXXXXX không thể thay đổi. Mở lại nháp để sửa cũng không sửa được mã. | Tạo mới, Cập nhật | Thiết kế | Không |
| BR-026-06 | **Chuyển nháp → phê duyệt qua F-027** — Bản ghi đang ở trạng thái NHAP có thể được mở lại từ F-027 (Cập nhật) để bổ sung thông tin và gửi phê duyệt. Khi gửi phê duyệt, kiểm tra lại BR-026-03. | F-027 | Liên kết | Không |

### 5.3. Dữ liệu địa lý & GIS

| ID | Quy tắc | Áp dụng cho | Nguồn | Ngoại lệ |
|---|---|---|---|---|
| BR-026-07 | **Tọa độ GPS hợp lệ** — Kinh độ trong khoảng [-180, 180], Vĩ độ trong khoảng [-90, 90]. Tọa độ không bắt buộc khi tạo mới, có thể bổ sung sau. | Tạo mới, Cập nhật | WGS84 | Không |
| BR-026-08 | **Loại đối tượng GIS** — Người dùng chọn một trong ba loại: Điểm (DIEM), Đường (DUONG), Vùng (VUNG). Lựa chọn này ảnh hưởng đến cách hiển thị cảng cạn trên bản đồ. | Tạo mới, Cập nhật | Thiết kế | Không |

### 5.4. Dữ liệu số

| ID | Quy tắc | Áp dụng cho | Nguồn | Ngoại lệ |
|---|---|---|---|---|
| BR-026-09 | **Diện tích & Công suất không âm** — Tổng diện tích cảng, Diện tích kho, Diện tích bãi, Công suất khai thác (TEU) phải là số ≥ 0. Cho phép bằng 0 nếu chưa có số liệu thực tế. | Tạo mới, Cập nhật | Nghiệp vụ | Không |

### 5.5. File đính kèm

| ID | Quy tắc | Áp dụng cho | Nguồn | Ngoại lệ |
|---|---|---|---|---|
| BR-026-10 | **Định dạng file** — Chỉ chấp nhận: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. | Upload | Hạ tầng | Không |
| BR-026-11 | **Giới hạn file** — Mỗi file ≤ 20MB. Tổng số file đính kèm ≤ 10. | Upload | Hạ tầng | Không |

### 5.6. Phân quyền & Bảo mật

| ID | Quy tắc | Áp dụng cho | Nguồn | Ngoại lệ |
|---|---|---|---|---|
| BR-026-12 | **Phân quyền tạo mới** — Chỉ người dùng được gán permission `dryport:create` mới có thể tạo mới Cảng cạn. Vai trò không có quyền này sẽ không thấy nút "Tạo mới" và bị từ chối nếu gọi API trực tiếp. | Tạo mới | RBAC | Không |
| BR-026-13 | **Phạm vi đơn vị quản lý** — Người dùng chỉ được tạo Cảng cạn trong đơn vị quản lý của mình. Admin Cục (system-admin) được chọn mọi đơn vị. Cảng cạn sau khi tạo thuộc quyền quản lý của đơn vị được chọn. | Tạo mới | RBAC | Admin Cục xem toàn bộ |
| BR-026-14 | **Audit log** — Mọi thao tác tạo mới đều được ghi nhận: ai thực hiện, thời gian, địa chỉ IP. Lịch sử thay đổi được lưu vào bảng `change_history`, không thể xóa hoặc sửa. | Audit | Bảo mật | Không |

---

## 6. Mô hình dữ liệu

> ✅ = đã có trong code. 🔴 = mới, cần thêm vào DB.

### 6.1. `dry_ports` — Thông tin chung

| # | Tên trường | Kiểu | Bắt buộc | Mô tả | Status |
|---|---|---|---|---|---|
| 1 | id | UUID | Có | PK | ✅ |
| 2 | org_unit_id | UUID | Có | FK Đơn vị quản lý | ✅ |
| 3 | don_vi_khai_thac | NVARCHAR(255) | Không | Đơn vị khai thác | 🔴 |
| 4 | khu_vuc | NVARCHAR(255) | Không | Khu vực | 🔴 |
| 5 | dry_port_code | NVARCHAR(50) | Có | Mã, unique — hệ thống tự sinh CC-XXXXXX, read-only | ✅ |
| 6 | dry_port_name | NVARCHAR(255) | Có | Tên | ✅ |
| 7 | province | NVARCHAR(100) | Có | Tỉnh/TP | ✅ |
| 8 | dia_chi_chi_tiet | NVARCHAR(500) | Có | Địa chỉ chi tiết | 🔴 |
| 9 | hanh_lang_van_tai | NVARCHAR(255) | Không | Hành lang vận tải | 🔴 |
| 10 | teu_capacity | DECIMAL(15,2) | Có | Công suất (TEU) | ✅ |
| 11 | area | DECIMAL(15,2) | Không | Tổng DT (m²) | ✅ |
| 12 | dien_tich_kho | DECIMAL(15,2) | Không | DT kho (m²) | 🔴 |
| 13 | dien_tich_bai | DECIMAL(15,2) | Không | DT bãi (m²) | 🔴 |
| 14 | phuong_thuc_ket_noi | NVARCHAR(500) | Không | Kết nối giao thông | 🔴 |
| 15 | tinh_trang | NVARCHAR(50) | Có | CHUA_KHAI_THAC/VAN_HANH | 🔴 |
| 16 | ghi_chu | NVARCHAR(1000) | Không | Ghi chú | 🔴 |

> ⚠️ `tinh_trang` thay thế `operational_status` hiện tại.

### 6.2. `dry_ports` — Công bố (tất cả 🔴)

| # | Tên trường | Kiểu | Mô tả |
|---|---|---|---|
| 17 | thoi_diem_cong_bo | TIMESTAMP | Thời điểm công bố |
| 18 | quyet_dinh_cong_bo_so | NVARCHAR(100) | Số QĐ |
| 19 | ngay_ra_quyet_dinh | DATE | Ngày QĐ |
| 20 | don_vi_ra_quyet_dinh | NVARCHAR(255) | Đơn vị ra QĐ |

### 6.3. `dry_ports` — GIS

| # | Tên trường | Kiểu | Mô tả | Status |
|---|---|---|---|---|
| 21 | loai_doi_tuong | NVARCHAR(50) | DIEM/DUONG/VUNG | 🔴 |
| 22 | map_symbol_id | UUID | FK Biểu tượng | ✅ |
| 23 | he_quy_chieu | NVARCHAR(100) | Hệ quy chiếu | 🔴 |
| 24 | quy_tac_hien_thi | NVARCHAR(500) | Quy tắc hiển thị | 🔴 |

### 6.4. `dry_ports` — Audit

| # | Tên trường | Kiểu | Status |
|---|---|---|---|
| 25 | approval_status | NVARCHAR(50) | NHAP (Nháp) / PENDING (Chờ duyệt) / APPROVED (Đã duyệt) / REJECTED (Từ chối) | ✅ |
| 26-30 | created_by, created_at, updated_by, updated_at, deleted_at | UUID/TIMESTAMP | ✅ |

### 6.5. `dry_port_coordinates` (🔴 mới)

| Tên trường | Kiểu | Mô tả |
|---|---|---|
| id | UUID | PK |
| dry_port_id | UUID | FK |
| kinh_do | DECIMAL(10,7) | Kinh độ (E) |
| vi_do | DECIMAL(10,7) | Vĩ độ (N) |
| thu_tu | INT | Thứ tự |

### 6.6. `dry_port_attachments` (🔴 mới)

| Tên trường | Kiểu | Mô tả |
|---|---|---|
| id | UUID | PK |
| dry_port_id | UUID | FK |
| ten_file | NVARCHAR(255) | Tên file |
| loai_file | NVARCHAR(50) | MIME |
| kich_thuoc | BIGINT | Bytes |
| duong_dan | NVARCHAR(500) | Path |
| created_at | TIMESTAMP | |

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/dry-ports` | Tạo mới (25 trường + coordinates + attachments) | `dryport:create` |
| GET | `/api/v1/dry-ports/generate-code` | Sinh mã cảng cạn mới (CC-XXXXXX). Response: `{ code: "CC-000015" }` | `dryport:create` |
| GET | `/api/v1/org-units` | DS đơn vị | `dryport:create` |
| GET | `/api/v1/provinces` | DS Tỉnh/TP | `dryport:create` |
| POST | `/api/v1/dry-ports/{id}/attachments` | Upload file | `dryport:create` |
| DELETE | `/api/v1/dry-ports/{id}/attachments/{attId}` | Xóa file | `dryport:create` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Mở form & Sinh mã
`dryport:create` → "Tạo mới" → hệ thống gọi `GET /api/v1/dry-ports/generate-code` → hiển thị mã CC-XXXXXX (read-only) → modal 4 tab. Admin Cục: ĐVQL dropdown full. Admin thường: theo đơn vị.

### 8.2. Tab Thông tin chung
15 trường: ĐVQL* → ĐVKT → Khu vực → Mã (RO, tự sinh) → Tên* → Tỉnh/TP* → Địa chỉ* → Hành lang → Công suất* → DT tổng → DT kho → DT bãi → Kết nối → Tình trạng* (default CHUA_KHAI_THAC) → Ghi chú.

### 8.3. Tab Công bố
4 trường tùy chọn: Thời điểm (date) → Số QĐ → Ngày QĐ → ĐV ra QĐ.

### 8.4. Tab Vị trí
Loại ĐT → Biểu tượng → Hệ quy chiếu → Quy tắc. Bảng tọa độ: "Thêm mới" → Kinh độ/Vĩ độ. Nhiều dòng.

### 8.5. Tab File
Upload → danh sách (tên, size, nút Xóa). PDF/DOC/DOCX/XLS/XLSX/JPG/PNG/TIFF, ≤20MB, ≤10.

### 8.6. Lưu tạm
Người dùng điền tối thiểu Tên cảng cạn (mã đã tự sinh) → bấm "Lưu tạm" (nút outlined, bên trái) → `POST /api/v1/dry-ports?action=draft` → backend lưu `approvalStatus=NHAP`, `tinhTrang=CHUA_KHAI_THAC` → toast "Đã lưu nháp" → form ở lại, người dùng tiếp tục chỉnh sửa. Từ F-083, bản ghi NHAP hiển thị badge "Nháp" (màu xám) và nút "Tiếp tục chỉnh sửa" thay vì "Xem chi tiết".

### 8.7. Lưu và phê duyệt
Người dùng có `dryport:approve` → điền đầy đủ 6 trường bắt buộc → bấm "Lưu và phê duyệt" (nút primary, bên phải) → validate → nếu thiếu, highlight trường lỗi → nếu đủ, `POST /api/v1/dry-ports?action=approve` → `approvalStatus=APPROVED`, tạo `approval_logs` (action=APPROVE, approvedBy=currentUser) → toast "Đã tạo và phê duyệt thành công" → redirect F-083. Người không có `dryport:approve` không thấy nút này.

### 8.8. Mã bất biến
Mã CC-XXXXXX được sinh 1 lần duy nhất khi mở form. Dù lưu tạm hay lưu và phê duyệt, dù mở lại nháp bao nhiêu lần, mã không bao giờ thay đổi. Đây là định danh vĩnh viễn của cảng cạn trong hệ thống.

---

## 9. Yêu cầu phi chức năng

- **Hiệu năng:** POST ≤ 3s; check-code ≤ 200ms; ≥ 20 concurrent
- **Bảo mật:** RBAC `dryport:create`; HTTPS; CSRF; scan upload
- **Độ tin cậy:** Transaction atomic (ports + coords + attach + history)
- **UX:** Responsive; loading upload; jump tab lỗi; focus tự động; Tab/Enter
- **Pháp lý:** Chuẩn mã quốc gia; audit log ≥ 2 năm

---

## 10. Yêu cầu giao diện

> Token: `theme.ts` + `tokens.ts`. KHÔNG hardcode.

### 10.1. Layout
- Header: "Tạo mới Cảng cạn" + X
- Body: 4 tab
- **Footer:** [Hủy] outlined + [Lưu tạm] outlined (trái) + [Lưu và phê duyệt] primary (phải, chỉ hiển thị nếu có `dryport:approve`). Tất cả `borderRadius: radiusPill`, `height: 40`.

### 10.2. Tab Thông tin chung

| # | Trường | Loại | Bắt buộc | Default |
|---|---|---|---|---|
| 1 | Đơn vị quản lý | Select | Có | — |
| 2 | Đơn vị khai thác | Text | Không | — |
| 3 | Khu vực | Text | Không | — |
| 4 | Mã cảng cạn | Text (RO) | Không | Có | CC-XXXXXX | Tự sinh, không sửa |
| 5 | Tên cảng cạn | Text | Có | — |
| 6 | Tỉnh/TP | Select | Có | — |
| 7 | Địa chỉ chi tiết | Text | Có | — |
| 8 | Hành lang vận tải | Text | Không | — |
| 9 | Công suất khai thác | Number | Có | TEU |
| 10 | Tổng diện tích (m²) | Number | Không | ≥0 |
| 11 | Diện tích kho (m²) | Number | Không | ≥0 |
| 12 | Diện tích bãi (m²) | Number | Không | ≥0 |
| 13 | Phương thức kết nối | Text | Không | — |
| 14 | Tình trạng | Select | Có | CHUA_KHAI_THAC |
| 15 | Ghi chú | Textarea | Không | — |

### 10.3. Tab Công bố

| # | Trường | Loại |
|---|---|---|
| 16 | Thời điểm công bố | DatePicker |
| 17 | Quyết định công bố số | Text |
| 18 | Ngày ra quyết định | DatePicker |
| 19 | Đơn vị ra quyết định | Text |

### 10.4. Tab Vị trí

| # | Trường | Loại |
|---|---|---|
| 20 | Loại đối tượng | Select (Điểm/Đường/Vùng) |
| 21 | Biểu tượng | Select |
| 22 | Hệ quy chiếu | Text |
| 23 | Quy tắc hiển thị | Text |
| 24 | Tọa độ | Bảng con: Kinh độ + Vĩ độ |

### 10.5. UX
- `marginBottom: spaceFormField`, `borderRadius: radiusPill`, `height:40`
- Lỗi đỏ dưới input, `fontSizeSm`
- Toast `statusOperational`, 3s
- Focus `dryPortCode`

---

## Implementation Status

| Layer | Status | Notes |
|-------|--------|-------|
| Backend (API) | Partial | 13/30 trường hiện có; cần migrate 16🔴 + 2 bảng mới |
| Frontend (UI) | Pending | Spec sẵn sàng, chờ implement |
