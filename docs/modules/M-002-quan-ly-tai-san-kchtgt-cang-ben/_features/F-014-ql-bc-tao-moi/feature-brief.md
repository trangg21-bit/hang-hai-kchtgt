---
id: F-014
name: Quản lý Bến cảng - Tạo mới
slug: ql-bc-tao-moi
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:42Z
last-updated: 2026-07-30
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Bến cảng - Tạo mới

**Tài liệu:** BA Feature Brief
**Feature:** F-014 — Quản lý Bến cảng - Tạo mới
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-07-30

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Tạo mới Bến cảng là tính năng cho phép người dùng có thẩm quyền đăng ký một Bến cảng mới — đơn vị hạ tầng chi tiết trực thuộc một Cảng biển — vào hệ thống quản lý tài sản KCHTGT Hàng Hải. Người dùng chọn **Đơn vị quản lý** → chọn **Cảng biển** (được lọc theo đơn vị) → hệ thống **tự động sinh mã bến** theo quy tắc `{mã-cảng-mẹ}-B{XX}`. Form gồm 4 nhóm: Thông tin chung (17 trường), Thông tin công bố (3 trường), Thông tin vị trí (GIS + bảng tọa độ), File đính kèm. Người dùng có 3 lựa chọn lưu: **Lưu tạm** (nháp), **Lưu và gửi phê duyệt** (chờ duyệt), **Lưu và phê duyệt** (duyệt ngay — Leader only).

### 1.2. Tại sao cần tính năng này?

Bến cảng là đơn vị hạ tầng chi tiết bên trong mỗi Cảng biển, nơi trực tiếp tiếp nhận và phục vụ tàu bè. Việc số hóa quy trình đăng ký Bến cảng đảm bảo:

- Dữ liệu Bến cảng được chuẩn hóa theo cấu trúc thống nhất, gắn với Cảng mẹ và Đơn vị quản lý
- Mã bến được hệ thống tự động sinh — loại bỏ sai sót do nhập tay, đảm bảo tính duy nhất
- Phân cấp quản lý rõ ràng: Đơn vị QL → Cảng biển → Bến cảng
- Tích hợp dữ liệu GIS (tọa độ, loại đối tượng, biểu tượng, hệ quy chiếu) phục vụ hiển thị bản đồ
- Hỗ trợ 3 luồng lưu: nháp / chờ duyệt / duyệt ngay, phù hợp thực tế nghiệp vụ
- Đầy đủ thông tin công bố, năng lực khai thác, file đính kèm

### 1.3. Luồng hoạt động chính

Người dùng đăng nhập, từ menu quản lý tài sản chọn "Quản lý Bến cảng" → nhấn "Tạo mới Bến cảng". Form hiển thị 4 nhóm:

1. **Thông tin chung:** Chọn Đơn vị quản lý → dropdown Cảng biển được lọc theo đơn vị → chọn Cảng biển → hệ thống tự sinh mã bến (read-only). Nhập các trường còn lại.
2. **Thông tin công bố:** Thời điểm, quyết định, văn bản thỏa thuận.
3. **Thông tin vị trí:** Loại đối tượng, biểu tượng, hệ quy chiếu, quy tắc hiển thị + bảng tọa độ GPS (Thêm/Xóa).
4. **File đính kèm:** Upload file, hiển thị danh sách.

Sau khi điền xong, người dùng chọn 1 trong 3 action: **Lưu tạm** (status='nhap'), **Lưu và gửi phê duyệt** (status='cho_phe_duyet'), hoặc **Lưu và phê duyệt** (status='da_phe_duyet' — chỉ Leader).

---

## 2. Ai dùng? Dùng như thế nào?

Quyền thao tác và xem tính năng được áp dụng theo hệ thống phân quyền tập trung. Mỗi vai trò có phạm vi truy cập và thao tác khác nhau, kiểm soát bởi RBAC.

### 2.1. Logic phân quyền chung

| Vai trò | Quyền xem | Quyền thao tác | Phạm vi dữ liệu | Ghi chú |
|---|---|---|---|---|
| system-admin (Admin Cục) | Xem toàn bộ | Tạo mới, Lưu tạm, Gửi phê duyệt, Lưu và phê duyệt | Toàn bộ hệ thống | **Không giới hạn ĐVQL** — được chọn mọi đơn vị |
| admin-operation | Xem toàn bộ | Tạo mới, Lưu tạm, Gửi phê duyệt, Lưu và phê duyệt | Toàn bộ hệ thống | Vai trò vận hành chính |
| admin | Xem trong đơn vị | Tạo mới, Lưu tạm | Trong đơn vị quản lý | Không Gửi phê duyệt |
| Lãnh đạo | Xem toàn bộ | Lưu và phê duyệt | Toàn bộ hệ thống | Duyệt ngay, không tạo mới thông thường |
| Chuyên viên / Lãnh đạo đơn vị | Xem trong đơn vị | Tạo mới, Lưu tạm | Trong đơn vị quản lý | **ĐVQL tự động fill theo đơn vị của user, read-only** |
| Cá nhân | Không có quyền | Không | — | Không áp dụng |

### 2.2. Logic phân quyền đặc biệt cho Admin Cục

- **Xem full dữ liệu** toàn hệ thống
- **Xem người tạo mới** (họ tên, username)
- **Xem thời gian tạo mới** (timestamp)
- **Xem người chỉnh sửa** (họ tên, username)
- **Xem thời gian cập nhật** (timestamp)

Các trường này chỉ hiển thị với Admin Cục; các vai trò khác bị ẩn.

---

## 3. User Stories

### Mức Must (bắt buộc có)

- **US-014-01:** Là Chuyên viên/admin, tôi muốn mở form "Tạo mới Bến cảng" từ màn hình danh sách.
- **US-014-02:** Là Admin Cục, tôi muốn chọn Đơn vị quản lý từ dropdown; là Chuyên viên/Lãnh đạo đơn vị, tôi muốn ĐVQL tự động điền theo đơn vị của tôi (read-only).
- **US-014-03:** Là Chuyên viên, tôi muốn hệ thống tự động sinh mã bến khi chọn Cảng biển, mã hiển thị read-only.
- **US-014-04:** Là Chuyên viên, tôi muốn điền đầy đủ các nhóm thông tin và nhấn "Lưu tạm" để lưu bản nháp.
- **US-014-05:** Là admin-operation/system-admin, tôi muốn nhấn "Lưu và gửi phê duyệt" để chuyển bến sang trạng thái chờ duyệt.
- **US-014-06:** Là Lãnh đạo, tôi muốn nhấn "Lưu và phê duyệt" để tạo và duyệt luôn trong một bước.
- **US-014-07:** Là Chuyên viên, tôi muốn thêm nhiều tọa độ GPS (Vĩ độ, Kinh độ), có thể sửa/xóa từng tọa độ trên form.
- **US-014-08:** Là Chuyên viên, tôi muốn upload file đính kèm và xem danh sách file đã upload.
- **US-014-09:** Là Chuyên viên, tôi muốn nhận thông báo lỗi rõ ràng theo từng trường khi nhập sai.

### Mức Should (nên có)

- **US-014-10:** Là Chuyên viên, tôi muốn nút "Hủy" quay về danh sách, có xác nhận nếu form có thay đổi chưa lưu.
- **US-014-11:** Là Chuyên viên, tôi muốn khi ĐVQL đã xác định, các trường liên quan (Tỉnh/TP) được tự động gợi ý.

### Mức Could (có thể có sau)

- **US-014-12:** Là Chuyên viên, tôi muốn hệ thống tự động tính tổng diện tích từ tọa độ GPS.
- **US-014-13:** Là Chuyên viên, tôi muốn xem trước vị trí bến trên bản đồ từ tọa độ đã nhập.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Truy cập và hiển thị form

**AC-014-01 — Truy cập form:** Người dùng có quyền (Chuyên viên, admin, admin-operation, system-admin) → menu → "Tạo mới Bến cảng" → hiển thị form. Không có quyền → ẩn nút; truy cập URL trực tiếp → HTTP 403. **Xử lý khi lỗi:** Hiển thị trang 403 "Bạn không có quyền truy cập".

**AC-014-02 — Chọn Đơn vị QL → lọc Cảng biển:** Dropdown "Đơn vị quản lý" hiển thị tất cả đơn vị. Khi chọn đơn vị, dropdown "Thuộc cảng biển" gọi `GET /api/v1/cang-bien?orgUnitId=<id>&status=HIEN_HANH` chỉ hiển thị Cảng biển thuộc đơn vị đó và đang HIEN_HANH. Nếu chưa chọn đơn vị → dropdown Cảng biển trống + tooltip "Vui lòng chọn Đơn vị quản lý trước".

**AC-014-03 — Mã bến tự sinh:** Khi chọn Cảng biển, gọi `GET /api/v1/ben-cang/generate-code?cangBienId=<id>` → trả về mã format `{mã-cảng-mẹ}-B{XX}` → hiển thị read-only. **Xử lý khi lỗi:** "Không thể tạo mã bến. Vui lòng thử lại."

### Nhóm 2: Lưu tạm (Draft)

**AC-014-04 — Lưu tạm thành công:** Đã chọn Đơn vị QL, Cảng biển (mã bến tự sinh), nhập Tên bến cảng → nhấn "Lưu tạm" → status='nhap', badge "Nháp" trong danh sách, có thể mở chỉnh sửa (F-015).

**AC-014-05 — Từ chối Lưu tạm:** Chưa chọn Đơn vị QL hoặc Cảng biển hoặc chưa nhập Tên bến → lỗi tại trường tương ứng. Tối thiểu: Đơn vị QL + Cảng biển + Tên bến.

### Nhóm 3: Lưu và gửi phê duyệt (Submit)

**AC-014-06 — Gửi phê duyệt thành công:** Đầy đủ: Đơn vị QL, Cảng biển, Tên bến, Tỉnh/TP, Tình trạng, ≥1 tọa độ GPS → status='cho_phe_duyet', gửi queue Lãnh đạo (F-017).

**AC-014-07 — Từ chối thiếu trường bắt buộc:** Thiếu trường bắt buộc khi Gửi phê duyệt → lỗi tại từng trường cụ thể.

**AC-014-08 — Từ chối thiếu tọa độ GPS:** Đủ trường khác nhưng 0 tọa độ → "Vui lòng thêm ít nhất một tọa độ (Vĩ độ, Kinh độ)".

### Nhóm 4: Lưu và phê duyệt (Approve directly — Leader only)

**AC-014-09 — Lưu và phê duyệt:** Lãnh đạo/system-admin/admin-operation → đầy đủ trường bắt buộc + ≥1 GPS → status='da_phe_duyet' ngay, không qua queue. Người không có quyền → ẩn nút.

### Nhóm 5: Xác thực dữ liệu

**AC-014-10 — GPS hợp lệ:** Vĩ độ [-90,90], Kinh độ [-180,180]. Validate client + server.

**AC-014-11 — Giá trị số:** Tổng diện tích, Năng lực, Cỡ tàu, Sản lượng ≥ 0. Số âm → lỗi.

**AC-014-12 — File đính kèm:** Định dạng: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. ≤20MB/file, ≤10 files.

**AC-014-13 — Hủy form:** Nhấn "Hủy" → nếu có thay đổi → hộp thoại xác nhận → quay về danh sách.

### Nhóm 6: Phân quyền

**AC-014-14 — Từ chối không có quyền:** Lãnh đạo (cấp Cục)/Cá nhân không có quyền tạo mới thông thường → ẩn nút "Tạo mới Bến cảng". HTTP 403 khi truy cập form.

**AC-014-15 — Phân quyền ĐVQL:**
- **Admin Cục (system-admin):** ĐVQL là dropdown, được chọn mọi đơn vị trong hệ thống.
- **Chuyên viên / Lãnh đạo đơn vị:** ĐVQL tự động điền theo đơn vị của user, read-only. Chỉ tạo bến trong đơn vị mình.
- **Xử lý khi lỗi:** Nếu user không thuộc đơn vị nào → form báo lỗi "Bạn chưa được gán vào đơn vị quản lý nào".

**AC-014-16 — Ẩn nút theo vai trò:** "Lưu và gửi phê duyệt" hiển thị cho admin-operation, system-admin. "Lưu và phê duyệt" hiển thị cho Lãnh đạo, admin-operation, system-admin. "Lưu tạm" hiển thị cho tất cả vai trò có quyền tạo mới.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng cho | Nguồn | Ngoại lệ |
|---|---|---|---|---|
| BR-014-01 | **Mã bến tự động sinh, bất biến** — format `{mã-cảng-mẹ}-B{XX}`, duy nhất toàn hệ thống, không thể sửa sau khi tạo | Tạo mới, Cập nhật | Thiết kế | Không |
| BR-014-02 | **Cascade chọn ĐVQL → Cảng biển** — Cảng biển chỉ hiển thị sau khi chọn Đơn vị QL, lọc theo đơn vị + HIEN_HANH | Tạo mới | Nghiệp vụ | system-admin xem toàn bộ Cảng biển |
| BR-014-03 | **Lưu tạm: tối thiểu ĐVQL + Cảng biển + Tên bến** — các trường khác tùy chọn, status='nhap' | Lưu tạm | Nghiệp vụ | Không |
| BR-014-04 | **Gửi phê duyệt: đầy đủ ĐVQL, Cảng biển, Tên bến, Tỉnh/TP, Tình trạng, ≥1 GPS** | Gửi phê duyệt | Nghiệp vụ | Không |
| BR-014-05 | **Lưu và phê duyệt: bỏ qua queue** — chỉ Leader/admin-operation/system-admin; status='da_phe_duyet' ngay | Lưu và phê duyệt | Nghiệp vụ | Không |
| BR-014-06 | **≥1 tọa độ GPS khi gửi phê duyệt / phê duyệt ngay** — phục vụ hiển thị bản đồ | Gửi PD, PD ngay | GIS | Lưu tạm không cần |
| BR-014-07 | **GPS hợp lệ:** Vĩ độ [-90,90], Kinh độ [-180,180] | Tất cả lưu | WGS84 | Không |
| BR-014-08 | **Loại kết cấu bến cảng:** enum — Kết cấu bệ cọc cao; Kết cấu tường cừ; Kết cấu trọng lực; Kết cấu khác | Tạo mới, Cập nhật | Thiết kế | Không |
| BR-014-09 | **Phân quyền ĐVQL:** Admin Cục chọn được mọi đơn vị; Chuyên viên/Lãnh đạo đơn vị → ĐVQL tự động fill theo user, read-only | Tạo mới | RBAC | Admin Cục không giới hạn |
| BR-014-10 | **File đính kèm:** PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF; ≤20MB; ≤10 files | Upload | Hạ tầng | Không |
| BR-014-11 | **Chuyển nháp → phê duyệt qua F-015** — kiểm tra lại BR-014-04 | F-015 | Liên kết | Không |
| BR-014-12 | **Audit log mọi thao tác** — actor, thời gian, hành động, IP | Audit | Bảo mật | Không |

---

## 6. Mô hình dữ liệu

> 🔴 = trường mới. ~~gạch ngang~~ = loại bỏ.

### 6.1. Bảng `ben_cang` — Bến cảng

**Thông tin chung:**
- id: UUID, PK
- 🔴 ma_ben: VARCHAR(50), UNIQUE, NOT NULL — Mã tự sinh `{mã-cảng-mẹ}-B{XX}`, bất biến
- 🔴 ten_ben: NVARCHAR(255), NOT NULL
- 🔴 org_unit_id: UUID, NOT NULL, FK → org_unit — Đơn vị quản lý
- 🔴 cang_bien_id: UUID, NOT NULL, FK → cang_bien.id — Thuộc cảng biển
- 🔴 luong_hang_hai_id: UUID, FK → luong_hang_hai.id — Thuộc luồng hàng hải
- 🔴 don_vi_khai_thac: NVARCHAR(255) — Đơn vị khai thác
- 🔴 tinh_thanh_pho: NVARCHAR(100), NOT NULL (khi status != 'nhap') — Tỉnh/Thành phố
- 🔴 dia_chi_chi_tiet: NVARCHAR(500)
- 🔴 loai_ket_cau: NVARCHAR(50) — enum: Kết cấu bệ cọc cao / Kết cấu tường cừ / Kết cấu trọng lực / Kết cấu khác
- 🔴 cong_nang_khai_thac: NVARCHAR(255)
- 🔴 tong_dien_tich_ha: DECIMAL(15,2) — Tổng diện tích (ha)
- 🔴 nang_luc_thiet_ke: DECIMAL(15,2) — Năng lực thông qua thiết kế (tấn/năm)
- 🔴 nang_luc_hien_trang: DECIMAL(15,2) — Năng lực thông qua hiện trạng (tấn/năm)
- 🔴 co_tau_tiep_nhan_max_dwt: DECIMAL(15,2) — Cỡ tàu tiếp nhận lớn nhất theo quy hoạch (DWT)
- 🔴 quy_hoach_nang_luc: DECIMAL(15,2) — Quy hoạch năng lực thông qua (tấn/năm)
- 🔴 san_luong_thuc_te_nam_gan_nhat: DECIMAL(15,2) — Sản lượng hàng hóa thực tế (tấn)
- 🔴 tinh_trang: NVARCHAR(50), NOT NULL (khi status != 'nhap')

**Thông tin công bố:**
- 🔴 thoi_diem_cong_bo: DATE — Thời điểm công bố, đưa vào sử dụng
- 🔴 quyet_dinh_cong_bo: NVARCHAR(500) — Quyết định công bố / Văn bản cho phép khai thác
- 🔴 van_ban_thoa_thuan: NVARCHAR(500) — Văn bản thỏa thuận đầu tư xây dựng

**Thông tin GIS:**
- 🔴 object_type: NVARCHAR(50) — Loại đối tượng
- 🔴 symbol_id: BIGINT FK — Biểu tượng
- 🔴 coordinate_system: NVARCHAR(50) — Hệ quy chiếu
- 🔴 display_rule: NVARCHAR(255) — Quy tắc hiển thị

**Trạng thái & Audit:**
- status: ENUM('nhap','cho_phe_duyet','da_phe_duyet','tu_choi','tam_ngung','da_xoa'), DEFAULT 'nhap'
- ghi_chu: NVARCHAR(1000)
- created_by, created_at, updated_by, updated_at
- deleted_at (soft-delete)

### 6.2. 🔴 Bảng mới `ben_cang_coordinate` — tọa độ GPS

Gửi kèm trong payload POST, lưu cùng transaction.

- 🔴 **id:** BIGINT, PK, AUTO_INCREMENT
- 🔴 **ben_cang_id:** BIGINT, NOT NULL, FK → ben_cang.id
- 🔴 **latitude:** DECIMAL(9,6), NOT NULL — Vĩ độ [-90, 90]
- 🔴 **longitude:** DECIMAL(9,6), NOT NULL — Kinh độ [-180, 180]
- 🔴 **sort_order:** INT, DEFAULT 0
- 🔴 **created_at:** TIMESTAMP, DEFAULT NOW()

> Constraint: ≥1 record khi status IN ('cho_phe_duyet', 'da_phe_duyet')

### 6.3. 🔴 Bảng mới `ben_cang_attachment` — file đính kèm

Upload sau khi bến đã được tạo (có id), qua API riêng.

- 🔴 **id:** BIGINT, PK, AUTO_INCREMENT
- 🔴 **ben_cang_id:** BIGINT, NOT NULL, FK → ben_cang.id
- 🔴 **file_name:** NVARCHAR(255), NOT NULL
- 🔴 **file_path:** NVARCHAR(500), NOT NULL
- 🔴 **file_size:** BIGINT, NOT NULL (≤ 20MB)
- 🔴 **content_type:** NVARCHAR(100)
- 🔴 **uploaded_by:** BIGINT, FK → user_account
- 🔴 **uploaded_at:** TIMESTAMP, DEFAULT NOW()

---

## 7. API Endpoints

### 7.1. F-014 — Tạo mới

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| POST | `/api/v1/ben-cang` | Tạo mới Bến cảng. Body gồm: thông tin ben_cang + danh sách coordinates[] + action (`draft`, `submit`, `approve`). Trả về ben_cang đã tạo. | `bencang:create` |
| GET | `/api/v1/ben-cang/generate-code?cangBienId=<id>` | Sinh mã bến theo quy tắc `{mã-cảng-mẹ}-B{XX}` | `bencang:create` |

### 7.2. F-014 — Dependencies

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/cang-bien?orgUnitId=<id>&status=HIEN_HANH` | Lấy danh sách Cảng biển HIEN_HANH thuộc đơn vị để populate dropdown | `bencang:create` |
| GET | `/api/v1/org-units` | Lấy danh sách đơn vị quản lý | `bencang:create` |
| GET | `/api/v1/luong-hang-hai` | Lấy danh sách luồng hàng hải | `bencang:create` |

### 7.3. F-014 — Upload file đính kèm (sau khi tạo)

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| POST | `/api/v1/ben-cang/{id}/attachments` | Upload file đính kèm cho bến vừa tạo | `bencang:create` |
| DELETE | `/api/v1/ben-cang/{id}/attachments/{attId}` | Xóa file đính kèm (chỉ khi status='nhap') | `bencang:create` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Chuỗi phụ thuộc: ĐVQL → Cảng biển → Mã bến

```
Mở form
→ Chọn Đơn vị quản lý (GET /org-units)
→ Dropdown "Thuộc cảng biển" được populate: GET /cang-bien?orgUnitId=<id>&status=HIEN_HANH
→ Chọn Cảng biển
→ Gọi GET /ben-cang/generate-code?cangBienId=<id>
→ Mã bến hiển thị read-only: {mã-cảng-mẹ}-B{XX}
→ Nếu đổi Cảng biển → sinh lại mã mới
```

### 8.2. Luồng Lưu tạm

```
Chọn ĐVQL → Chọn Cảng biển → Mã tự sinh → Nhập Tên bến + tùy chọn → "Lưu tạm"
→ POST /ben-cang { action:"draft", orgUnitId, cangBienId, maBen, tenBen, ... }
→ Validate: orgUnitId, cangBienId, tenBen không rỗng
→ INSERT ben_cang(status='nhap') + INSERT coordinates[] [1 TX]
→ Audit log → Response 201 + redirect
```

### 8.3. Luồng Lưu và gửi phê duyệt

```
Đầy đủ: ĐVQL, Cảng biển, Tên bến, Tỉnh/TP, Tình trạng, ≥1 GPS → "Lưu và gửi phê duyệt"
→ POST /ben-cang { action:"submit", đầy đủ trường bắt buộc, coordinates[] (≥1) }
→ Validate client: đầy đủ, ≥1 GPS
→ Validate server: đầy đủ, GPS hợp lệ
→ INSERT ben_cang(status='cho_phe_duyet') + coordinates[] [1 TX]
→ Audit log → Notification Lãnh đạo → Response 201 + redirect
```

### 8.4. Luồng Lưu và phê duyệt (Leader only)

```
Leader chọn "Lưu và phê duyệt"
→ POST /ben-cang { action:"approve", đầy đủ trường, coordinates[] (≥1) }
→ Validate: quyền APPROVE + đầy đủ + GPS
→ INSERT ben_cang(status='da_phe_duyet') + coordinates[] + PheDuyetLog [1 TX]
→ Audit log → Response 201 + redirect
```

---

## 9. Yêu cầu phi chức năng

- **Hiệu năng:** POST /ben-cang ≤2s, GET generate-code ≤200ms, ≥50 concurrent users
- **Mở rộng:** Bảng ben_cang thiết kế chuẩn hóa; quy tắc sinh mã configurable; loai_ket_cau có thể mở rộng enum
- **Bảo mật:** RBAC `bencang:create`; server-side validation; tampering detection mã bến; sanitize input; HTTPS
- **Độ tin cậy:** Transaction atomicity (ben_cang + coordinates + attachment); rollback toàn bộ; lock khi sinh mã; audit log cả thất bại
- **UX:** Responsive; loading indicator từng bước (đang tải Cảng biển, đang sinh mã); modal xác nhận rời form; WCAG 2.1 AA
- **Pháp lý:** Tuân thủ chuẩn mã VN-301; audit log ≥2 năm

---

## 10. Yêu cầu giao diện

> Token từ theme.ts và tokens.ts. Không hardcode.

### 10.1. Cấu trúc form (4 nhóm)

1. **Thông tin chung** — ĐVQL*, Cảng biển*, Luồng HH, ĐV khai thác, Mã bến (RO), Tên bến*, Tỉnh/TP*, Địa chỉ chi tiết, Loại kết cấu, Công năng, Tổng DT, Năng lực TK, Năng lực HT, Cỡ tàu max, QH năng lực, Sản lượng, Tình trạng*
2. **Thông tin công bố** — Thời điểm, Quyết định, Văn bản thỏa thuận
3. **Thông tin vị trí** — Loại ĐT, Biểu tượng, Hệ quy chiếu, Quy tắc + Bảng tọa độ [Thêm] Vĩ độ + Kinh độ + [Xóa]
4. **File đính kèm** — Upload + danh sách file + [Xóa]
5. **Action** — "Lưu tạm" (outlined) + "Lưu và gửi phê duyệt" (primary) + "Lưu và phê duyệt" (primary, Leader only)

### 10.2. Bảng trường form

| STT | Tên trường | Loại ĐK | Edit | Bắt buộc | Default | Ghi chú |
|---|---|---|---|---|---|---|
| 1 | Đơn vị quản lý | Select | Có | Có | — | Trigger lọc Cảng biển |
| 2 | Thuộc cảng biển | Select | Có | Có | — | Lọc theo ĐVQL; trigger sinh mã |
| 3 | Mã bến cảng | Text (RO) | Không | Có | Tự sinh | `{mã-cảng-mẹ}-B{XX}` |
| 4 | Tên bến cảng | Text | Có | Có | — | Cả draft |
| 5 | Thuộc luồng hàng hải | Select | Có | Không | — | |
| 6 | Đơn vị khai thác | Text | Có | Không | — | |
| 7 | Địa điểm (Tỉnh/TP) | Select | Có | Có* | — | *Submit |
| 8 | Địa điểm chi tiết | Text | Có | Không | — | |
| 9 | Loại kết cấu bến cảng | Select | Có | Không | — | 4 giá trị enum |
| 10 | Công năng khai thác | Text | Có | Không | — | |
| 11 | Tổng diện tích (ha) | Number | Có | Không | — | ≥0 |
| 12 | Năng lực thông qua thiết kế | Number | Có | Không | — | ≥0 |
| 13 | Năng lực thông qua hiện trạng (tấn/năm) | Number | Có | Không | — | ≥0 |
| 14 | Cỡ tàu tiếp nhận lớn nhất (DWT) | Number | Có | Không | — | ≥0 |
| 15 | Quy hoạch năng lực thông qua (tấn/năm) | Number | Có | Không | — | ≥0 |
| 16 | Sản lượng thực tế năm gần nhất | Number | Có | Không | — | ≥0 |
| 17 | Tình trạng | Select | Có | Có* | — | *Submit |
| 18 | Thời điểm công bố, đưa vào SD | Date | Có | Không | — | |
| 19 | Quyết định công bố | Text | Có | Không | — | |
| 20 | Văn bản thỏa thuận đầu tư XD | Text | Có | Không | — | |
| 21 | Loại đối tượng | Select | Có | Không | Point | |
| 22 | Biểu tượng | Select | Có | Không | — | |
| 23 | Hệ quy chiếu | Select | Có | Không | WGS-84 | |
| 24 | Quy tắc hiển thị | Text | Có | Không | — | |
| 25 | Tọa độ GPS | Bảng con | Có | Có* | — | *≥1 Submit/Approve |
| 26 | File đính kèm | Upload | Có | Không | — | ≤10, 20MB |

### 10.3. Accent budget ≤3

1. Nút "Lưu và gửi phê duyệt" (primary)
2. Nút "Lưu và phê duyệt" (primary, Leader only)
3. Nút "Thêm" bảng con tọa độ (link)

### 10.4. Trạng thái UI

- Chưa chọn ĐVQL: dropdown Cảng biển disable + tooltip
- Chưa chọn Cảng biển: trường mã bến trống + nút Lưu disable
- Đang sinh mã: spinner cạnh mã bến
- Loading: spinner + disable all nút
- Validate: đỏ dưới trường + message
- Server lỗi: toast đỏ
- Thành công: toast xanh + redirect 2s
- Rời form: modal xác nhận

### 10.5. Mobile (<768px)

- Sidebar hamburger 80px
- Form single-column
- Bảng con tọa độ → card
- Nút full-width, xếp dọc

---

## Consolidation Note

Merged with UI feature F-075 (ui-ql-bc-tao-moi) — 2026-07-30
