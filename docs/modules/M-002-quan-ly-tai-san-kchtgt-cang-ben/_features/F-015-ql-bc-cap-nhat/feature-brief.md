---
id: F-015
name: Quản lý Bến cảng - Cập nhật
slug: ql-bc-cap-nhat
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:42Z
last-updated: 2026-07-30
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Bến cảng - Cập nhật

**Tài liệu:** BA Feature Brief
**Feature:** F-015 — Quản lý Bến cảng - Cập nhật
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-07-30

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Cập nhật Bến cảng là tính năng cho phép người dùng có thẩm quyền chỉnh sửa thông tin của một Bến cảng đã tồn tại trong hệ thống. Form được **pre-fill** từ dữ liệu hiện tại qua `GET /api/v1/ben-cang/:id`. Các trường bất biến: **Mã bến** (read-only), **Đơn vị quản lý** (read-only). Nếu người dùng đổi **Cảng biển**, hệ thống tự động sinh lại mã bến mới. Sau khi lưu, trạng thái phê duyệt tự động **reset về CHO_PHE_DUYET** (yêu cầu phê duyệt lại). **Backend tự động tạo bản ghi LichSuThayDoi** (field, oldValue, newValue, người sửa, thời gian) để ghi nhận mọi thay đổi. Người dùng có 3 lựa chọn: **Lưu tạm**, **Lưu và gửi phê duyệt**, **Lưu và phê duyệt** (Leader only).

### 1.2. Tại sao cần tính năng này?

Bến cảng thường xuyên trải qua cải tạo, nạo vét luồng, thay đổi công năng hoặc cập nhật thông tin quản lý. Việc cho phép cập nhật đảm bảo:

- Dữ liệu Bến cảng luôn phản ánh đúng tình trạng hạ tầng thực tế
- Mọi thay đổi đều được ghi nhận qua LichSuThayDoi — phục vụ kiểm toán
- Cơ chế reset phê duyệt đảm bảo mọi thay đổi đều được xem xét lại
- Khi đổi Cảng biển, mã bến được sinh lại tự động, duy trì tính nhất quán

### 1.3. Luồng hoạt động chính

Người dùng từ danh sách (F-018) hoặc chi tiết (F-018 detail) nhấn "Chỉnh sửa" → `GET /api/v1/ben-cang/:id` → form pre-fill toàn bộ 26 trường. Mã bến và ĐVQL hiển thị read-only. Người dùng chỉnh sửa các trường cần thay đổi. Nếu đổi Cảng biển → dropdown lọc theo ĐVQL → sinh lại mã bến mới. Nhấn 1 trong 3 nút lưu → `PUT /api/v1/ben-cang/:id` → server cập nhật, reset `trangThaiPheDuyet = CHO_PHE_DUYET` (trừ "Lưu và phê duyệt"), tạo `LichSuThayDoi` → toast → redirect.

---

## 2. Ai dùng? Dùng như thế nào?

Quyền thao tác và xem tính năng được áp dụng theo hệ thống phân quyền tập trung. Mỗi vai trò có phạm vi truy cập và thao tác khác nhau, kiểm soát bởi RBAC.

### 2.1. Logic phân quyền chung

| Vai trò | Quyền xem | Quyền thao tác | Phạm vi dữ liệu | Ghi chú |
|---|---|---|---|---|
| system-admin (Admin Cục) | Xem toàn bộ | Cập nhật, Lưu tạm, Gửi phê duyệt, Lưu và phê duyệt | Toàn bộ hệ thống | **Không giới hạn ĐVQL** |
| admin-operation | Xem toàn bộ | Cập nhật, Lưu tạm, Gửi phê duyệt, Lưu và phê duyệt | Toàn bộ hệ thống | Vai trò vận hành chính |
| admin | Xem trong đơn vị | Cập nhật, Lưu tạm | Trong đơn vị quản lý | Không Gửi phê duyệt |
| Lãnh đạo (cấp Cục) | Xem toàn bộ | Không | — | Chỉ phê duyệt từ F-017, không vào F-015 |
| Chuyên viên / Lãnh đạo đơn vị | Xem trong đơn vị | Cập nhật, Lưu tạm | Trong đơn vị quản lý | **ĐVQL auto-fill, read-only** |
| Cá nhân | Không có quyền | Không | — | Không áp dụng |

### 2.2. Logic phân quyền đặc biệt cho Admin Cục

- **Xem full dữ liệu** toàn hệ thống
- **Xem người chỉnh sửa** (họ tên, username)
- **Xem thời gian cập nhật** (timestamp)
- **Xem người tạo mới** (họ tên, username)
- **Xem thời gian tạo mới** (timestamp)

Các trường này chỉ hiển thị với Admin Cục; các vai trò khác bị ẩn.

---

## 3. User Stories

### Mức Must (bắt buộc có)

- **US-015-01:** Là Chuyên viên/admin, tôi muốn mở form "Chỉnh sửa Bến cảng" từ danh sách hoặc trang chi tiết, form được pre-fill dữ liệu hiện tại.
- **US-015-02:** Là Chuyên viên, tôi muốn xem Mã bến và ĐVQL ở chế độ read-only, không thể chỉnh sửa.
- **US-015-03:** Là Chuyên viên, tôi muốn chỉnh sửa các trường thông tin và nhấn "Lưu tạm" để lưu bản nháp.
- **US-015-04:** Là admin-operation/system-admin, tôi muốn nhấn "Lưu và gửi phê duyệt" để gửi bến đã chỉnh sửa vào queue chờ duyệt.
- **US-015-05:** Là admin-operation/system-admin, tôi muốn nhấn "Lưu và phê duyệt" để cập nhật và duyệt luôn trong một bước.
- **US-015-06:** Là Chuyên viên, tôi muốn khi đổi Cảng biển, hệ thống tự động sinh lại mã bến mới.
- **US-015-07:** Là Chuyên viên, tôi muốn hệ thống tự động ghi nhận LichSuThayDoi cho mọi thay đổi.
- **US-015-08:** Là Chuyên viên, tôi muốn nhận thông báo lỗi rõ ràng theo từng trường khi nhập sai.

### Mức Should (nên có)

- **US-015-09:** Là Chuyên viên, tôi muốn nút "Hủy" quay về, có xác nhận nếu có thay đổi chưa lưu.
- **US-015-10:** Là Chuyên viên, tôi muốn xem lịch sử thay đổi gần đây của bến ngay trên form.

### Mức Could (có thể có sau)

- **US-015-11:** Là Chuyên viên, tôi muốn so sánh trực quan giá trị cũ và mới trước khi lưu.
- **US-015-12:** Là Chuyên viên, tôi muốn xem trước vị trí bến trên bản đồ khi sửa tọa độ.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Truy cập và pre-fill form

**AC-015-01 — Truy cập form:** Người dùng có quyền (Chuyên viên, admin, admin-operation, system-admin) → danh sách/chi tiết → "Chỉnh sửa" → form pre-fill từ `GET /api/v1/ben-cang/:id`. Không có quyền → ẩn nút; truy cập URL trực tiếp → HTTP 403. **Xử lý khi lỗi:** Bến không tồn tại → 404 "Bến cảng không tồn tại".

**AC-015-02 — Pre-fill đầy đủ + trường bất biến:** Form hiển thị toàn bộ 26 trường với dữ liệu hiện tại. **Mã bến** (RO, bất biến tuyệt đối — không thể sửa dù đang 'nhap'), **ĐVQL** (RO, bất biến tuyệt đối — không thể sửa dù đang 'nhap', kể cả Admin Cục). Các trường khác có thể chỉnh sửa. **Xử lý khi lỗi:** API lỗi → toast "Không thể tải dữ liệu Bến cảng". Server từ chối nếu phát hiện maBen hoặc orgUnitId bị sửa → HTTP 400 "Mã bến và Đơn vị quản lý không được phép thay đổi".

**AC-015-03 — Đổi Cảng biển → sinh lại mã:** Khi người dùng đổi Cảng biển, gọi `GET /api/v1/ben-cang/generate-code?cangBienId=<id>` → sinh mã mới → hiển thị read-only. Cảnh báo "Mã bến sẽ được thay đổi thành [mã mới]". **Xử lý khi lỗi:** Không thể sinh mã → giữ nguyên Cảng biển cũ.

### Nhóm 2: Lưu tạm

**AC-015-04 — Lưu tạm thành công:** Chỉnh sửa → "Lưu tạm" → `PUT /api/v1/ben-cang/:id` → status giữ nguyên nếu đang là 'nhap', giữ nguyên nếu đang là 'cho_phe_duyet' (không reset). Toast "Đã lưu bản nháp".

**AC-015-05 — Từ chối Lưu tạm:** Thiếu Tên bến → lỗi "Tên bến cảng là bắt buộc ngay cả khi lưu tạm".

### Nhóm 3: Lưu và gửi phê duyệt

**AC-015-06 — Gửi phê duyệt thành công:** Đầy đủ trường bắt buộc + ≥1 GPS → `PUT /api/v1/ben-cang/:id` → reset `trangThaiPheDuyet = CHO_PHE_DUYET` → tạo `LichSuThayDoi` → toast "Đã cập nhật Bến cảng, chờ phê duyệt lại" → redirect.

**AC-015-07 — Từ chối thiếu trường:** Thiếu Tỉnh/TP, Tình trạng, hoặc 0 GPS → lỗi tại trường tương ứng.

### Nhóm 4: Lưu và phê duyệt

**AC-015-08 — Lưu và phê duyệt:** admin-operation/system-admin → đầy đủ + ≥1 GPS → `status='da_phe_duyet'` ngay, tạo `PheDuyetLog` + `LichSuThayDoi`. **Lãnh đạo (cấp Cục) không vào F-015**, chỉ phê duyệt qua F-017.

### Nhóm 5: Xác thực & audit

**AC-015-09 — GPS hợp lệ:** Vĩ độ [-90,90], Kinh độ [-180,180]. Validate client + server.

**AC-015-10 — Giá trị số ≥ 0:** Tổng diện tích, Năng lực, Cỡ tàu, Sản lượng. Số âm → lỗi.

**AC-015-11 — File đính kèm:** Định dạng: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. ≤20MB/file, ≤10 files.

**AC-015-12 — LichSuThayDoi:** Mỗi lần cập nhật tạo bản ghi LichSuThayDoi: fieldChanged, oldValue, newValue, changedBy, changedAt.

**AC-015-13 — Hủy form:** Có thay đổi chưa lưu → hộp thoại xác nhận → quay về.

### Nhóm 6: Phân quyền

**AC-015-14 — Từ chối không có quyền:** Lãnh đạo (cấp Cục)/Cá nhân → ẩn nút "Chỉnh sửa". HTTP 403 khi truy cập URL form cập nhật. Lãnh đạo chỉ phê duyệt qua F-017.

**AC-015-15 — Phân quyền ĐVQL:**
- **Admin Cục:** ĐVQL read-only (hiển thị giá trị hiện tại).
- **Chuyên viên / Lãnh đạo đơn vị:** ĐVQL read-only, chỉ sửa được bến trong đơn vị mình.

**AC-015-16 — Ẩn nút theo vai trò:** "Lưu tạm" hiển thị cho tất cả vai trò có quyền cập nhật. "Lưu và gửi phê duyệt" hiển thị cho admin-operation, system-admin. "Lưu và phê duyệt" hiển thị cho admin-operation, system-admin (vai trò vừa có quyền sửa vừa có quyền duyệt). Lãnh đạo (cấp Cục) không thấy nút nào — chỉ phê duyệt từ F-017.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng cho | Nguồn | Ngoại lệ |
|---|---|---|---|---|
| BR-015-01 | **Mã bến bất biến tuyệt đối** — không thể sửa trực tiếp ở mọi trạng thái (kể cả 'nhap'), với mọi vai trò; ngoại lệ duy nhất: khi đổi Cảng biển → hệ thống tự động sinh lại mã mới | Cập nhật | Thiết kế | Đổi Cảng biển → sinh lại mã |
| BR-015-02 | **ĐVQL bất biến tuyệt đối** — không thể thay đổi đơn vị quản lý sau khi tạo, kể cả khi đang ở trạng thái 'nhap', với mọi vai trò (bao gồm Admin Cục) | Cập nhật | Nghiệp vụ | Không |
| BR-015-03 | **Reset phê duyệt khi Gửi phê duyệt** — `trangThaiPheDuyet` tự động reset về `CHO_PHE_DUYET`; nếu đang 'nhap' → chuyển thành 'cho_phe_duyet' | Gửi phê duyệt | Nghiệp vụ | "Lưu và phê duyệt" → 'da_phe_duyet' |
| BR-015-04 | **LichSuThayDoi bắt buộc** — mọi lần cập nhật phải tạo bản ghi: fieldChanged, oldValue, newValue, changedBy, changedAt | Cập nhật | Audit | Không |
| BR-015-05 | **Lưu tạm không reset trạng thái** — nếu đang 'nhap' → giữ 'nhap'; nếu đang 'cho_phe_duyet' → giữ 'cho_phe_duyet' | Lưu tạm | Nghiệp vụ | Không |
| BR-015-06 | **Cảng biển lọc theo ĐVQL** — khi đổi Cảng biển, dropdown chỉ hiển thị Cảng biển thuộc ĐVQL hiện tại + HIEN_HANH | Cập nhật | Nghiệp vụ | Admin Cục xem toàn bộ |
| BR-015-07 | **GPS hợp lệ:** Vĩ độ [-90,90], Kinh độ [-180,180] | Tất cả lưu | WGS84 | Không |
| BR-015-08 | **≥1 GPS khi Gửi phê duyệt / Phê duyệt ngay** | Gửi PD, PD ngay | GIS | Lưu tạm không cần |
| BR-015-09 | **Loại kết cấu bến cảng:** enum 4 giá trị | Cập nhật | Thiết kế | Không |
| BR-015-10 | **File đính kèm:** PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF; ≤20MB; ≤10 files | Upload | Hạ tầng | Không |
| BR-015-11 | **Audit log mọi thao tác** — actor, thời gian, hành động, IP | Audit | Bảo mật | Không |

---

## 6. Mô hình dữ liệu

> 🔴 = trường mới. ~~gạch ngang~~ = loại bỏ.

### 6.1. Bảng `ben_cang` — Bến cảng (cập nhật)

Các trường có thể cập nhật (trừ id, ma_ben, org_unit_id):

**Thông tin chung (cập nhật được):**
- ten_ben, cang_bien_id, luong_hang_hai_id, don_vi_khai_thac
- tinh_thanh_pho, dia_chi_chi_tiet, loai_ket_cau, cong_nang_khai_thac
- tong_dien_tich_ha, nang_luc_thiet_ke, nang_luc_hien_trang
- co_tau_tiep_nhan_max_dwt, quy_hoach_nang_luc, san_luong_thuc_te_nam_gan_nhat
- tinh_trang

**Thông tin công bố (cập nhật được):**
- thoi_diem_cong_bo, quyet_dinh_cong_bo, van_ban_thoa_thuan

**Thông tin GIS (cập nhật được):**
- object_type, symbol_id, coordinate_system, display_rule

**Bất biến:**
- id: PK
- 🔴 ma_ben: **read-only** — chỉ thay đổi khi đổi Cảng biển (tự động sinh lại)
- 🔴 org_unit_id: **read-only** — không thể đổi đơn vị
- created_by, created_at: không đổi

**Tự động cập nhật:**
- 🔴 trang_thai_phe_duyet: reset về CHO_PHE_DUYET khi "Gửi phê duyệt"; giữ nguyên khi "Lưu tạm"; thành DA_PHE_DUYET khi "Lưu và phê duyệt"
- updated_by, updated_at: tự động

### 6.2. 🔴 Bảng `lich_su_thay_doi` — nhật ký thay đổi

Tạo mới mỗi lần cập nhật:

- 🔴 **id:** BIGINT, PK, AUTO_INCREMENT
- 🔴 **ben_cang_id:** BIGINT, NOT NULL, FK → ben_cang.id
- 🔴 **field_changed:** NVARCHAR(100), NOT NULL — tên trường bị thay đổi
- 🔴 **old_value:** TEXT — giá trị cũ
- 🔴 **new_value:** TEXT — giá trị mới
- 🔴 **changed_by:** NVARCHAR(100), NOT NULL — người thực hiện
- 🔴 **changed_at:** TIMESTAMP, DEFAULT NOW()

---

## 7. API Endpoints

### 7.1. F-015 — Cập nhật

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/ben-cang/{id}` | Lấy thông tin Bến cảng để pre-fill form cập nhật | `bencang:update` |
| PUT | `/api/v1/ben-cang/{id}` | Cập nhật Bến cảng. Body: action (`draft`, `submit`, `approve`) + các trường cập nhật + coordinates[]. Server kiểm tra mã bến không bị sửa (trừ khi đổi Cảng biển). | `bencang:update` |
| GET | `/api/v1/ben-cang/generate-code?cangBienId=<id>` | Sinh lại mã bến khi đổi Cảng biển | `bencang:update` |

### 7.2. F-015 — Dependencies

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/cang-bien?orgUnitId=<id>&status=HIEN_HANH` | Danh sách Cảng biển HIEN_HANH theo ĐVQL | `bencang:update` |

### 7.3. F-015 — File đính kèm

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| POST | `/api/v1/ben-cang/{id}/attachments` | Upload file đính kèm | `bencang:update` |
| DELETE | `/api/v1/ben-cang/{id}/attachments/{attId}` | Xóa file đính kèm | `bencang:update` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Pre-fill form

```
Danh sách/Chi tiết → "Chỉnh sửa"
→ GET /api/v1/ben-cang/{id}
→ Form pre-fill 26 trường
→ Mã bến (RO), ĐVQL (RO)
→ Cảng biển: hiển thị giá trị hiện tại, dropdown lọc theo ĐVQL
→ Tọa độ GPS: bảng con pre-fill từ ben_cang_coordinate
→ File đính kèm: danh sách từ ben_cang_attachment
```

### 8.2. Luồng đổi Cảng biển → sinh lại mã

```
Người dùng đổi Cảng biển trong dropdown
→ GET /api/v1/ben-cang/generate-code?cangBienId=<id-mới>
→ Hiển thị mã mới (RO) + cảnh báo "Mã bến sẽ thay đổi: [mã-cũ] → [mã-mới]"
→ Khi lưu, server kiểm tra: nếu cangBienId thay đổi → cho phép maBen mới; nếu không → maBen phải giữ nguyên
```

### 8.3. Luồng Lưu tạm

```
Chỉnh sửa → "Lưu tạm"
→ PUT /api/v1/ben-cang/{id} { action:"draft", ... }
→ Validate: tenBen không rỗng
→ UPDATE ben_cang (giữ nguyên status), UPDATE coordinates[]
→ Tạo LichSuThayDoi
→ Audit log → Response 200
```

### 8.4. Luồng Lưu và gửi phê duyệt

```
Chỉnh sửa đầy đủ + ≥1 GPS → "Lưu và gửi phê duyệt"
→ PUT /api/v1/ben-cang/{id} { action:"submit", ... }
→ Validate: đầy đủ trường bắt buộc, ≥1 GPS
→ UPDATE ben_cang (status='cho_phe_duyet'), UPDATE coordinates[]
→ Tạo LichSuThayDoi (từng trường thay đổi)
→ Audit log → Notification Lãnh đạo → Response 200
```

### 8.5. Luồng Lưu và phê duyệt (admin-operation / system-admin)

```
admin-operation/system-admin → "Lưu và phê duyệt"
→ PUT /api/v1/ben-cang/{id} { action:"approve", ... }
→ Validate: quyền APPROVE + đầy đủ + GPS
→ UPDATE ben_cang (status='da_phe_duyet'), UPDATE coordinates[]
→ Tạo PheDuyetLog + LichSuThayDoi
→ Audit log → Response 200
```

---

## 9. Yêu cầu phi chức năng

- **Hiệu năng:** GET /ben-cang/{id} ≤500ms, PUT ≤2s, ≥50 concurrent users
- **Mở rộng:** LichSuThayDoi thiết kế dạng key-value, dễ dàng thêm trường mới
- **Bảo mật:** RBAC `bencang:update`; server-side validation; tampering detection mã bến + ĐVQL; HTTPS
- **Độ tin cậy:** Transaction atomicity (ben_cang + coordinates + LichSuThayDoi); rollback toàn bộ; audit log
- **UX:** Pre-fill mượt; loading indicator; toast thông báo; modal xác nhận rời form; WCAG 2.1 AA
- **Pháp lý:** LichSuThayDoi ≥2 năm; tuân thủ chuẩn mã VN-301

---

## 10. Yêu cầu giao diện

> Token từ theme.ts và tokens.ts. Không hardcode.

### 10.1. Cấu trúc form (giống F-014, pre-fill)

1. **Thông tin chung** — ĐVQL* (RO), Cảng biển*, Luồng HH, ĐV khai thác, Mã bến (RO), Tên bến*, Tỉnh/TP*, Địa chỉ chi tiết, Loại kết cấu, Công năng, Tổng DT, Năng lực TK, Năng lực HT, Cỡ tàu max, QH năng lực, Sản lượng, Tình trạng*
2. **Thông tin công bố** — Thời điểm, Quyết định, Văn bản thỏa thuận
3. **Thông tin vị trí** — Loại ĐT, Biểu tượng, Hệ quy chiếu, Quy tắc + Bảng tọa độ [Thêm] [Xóa]
4. **File đính kèm** — Upload + danh sách + [Xóa]
5. **Action** — "Lưu tạm" (outlined) + "Lưu và gửi phê duyệt" (primary) + "Lưu và phê duyệt" (primary, admin-op/system-admin only)

### 10.2. Bảng trường form

| STT | Tên trường | Loại ĐK | Edit | Bắt buộc | Default | Ghi chú |
|---|---|---|---|---|---|---|
| 1 | Đơn vị quản lý | Select (RO) | Không | Có | Pre-fill | Bất biến |
| 2 | Thuộc cảng biển | Select | Có | Có | Pre-fill | Đổi → sinh lại mã |
| 3 | Mã bến cảng | Text (RO) | Không | Có | Pre-fill | Bất biến (trừ khi đổi CB) |
| 4 | Tên bến cảng | Text | Có | Có | Pre-fill | |
| 5 | Thuộc luồng hàng hải | Select | Có | Không | Pre-fill | |
| 6 | Đơn vị khai thác | Text | Có | Không | Pre-fill | |
| 7 | Địa điểm (Tỉnh/TP) | Select | Có | Có* | Pre-fill | *Submit |
| 8 | Địa điểm chi tiết | Text | Có | Không | Pre-fill | |
| 9 | Loại kết cấu bến cảng | Select | Có | Không | Pre-fill | 4 enum |
| 10 | Công năng khai thác | Text | Có | Không | Pre-fill | |
| 11 | Tổng diện tích (ha) | Number | Có | Không | Pre-fill | ≥0 |
| 12 | Năng lực thông qua thiết kế | Number | Có | Không | Pre-fill | ≥0 |
| 13 | Năng lực thông qua hiện trạng | Number | Có | Không | Pre-fill | ≥0 |
| 14 | Cỡ tàu tiếp nhận lớn nhất (DWT) | Number | Có | Không | Pre-fill | ≥0 |
| 15 | Quy hoạch năng lực thông qua | Number | Có | Không | Pre-fill | ≥0 |
| 16 | Sản lượng thực tế năm gần nhất | Number | Có | Không | Pre-fill | ≥0 |
| 17 | Tình trạng | Select | Có | Có* | Pre-fill | *Submit |
| 18 | Thời điểm công bố, đưa vào SD | Date | Có | Không | Pre-fill | |
| 19 | Quyết định công bố | Text | Có | Không | Pre-fill | |
| 20 | Văn bản thỏa thuận đầu tư XD | Text | Có | Không | Pre-fill | |
| 21 | Loại đối tượng | Select | Có | Không | Pre-fill | |
| 22 | Biểu tượng | Select | Có | Không | Pre-fill | |
| 23 | Hệ quy chiếu | Select | Có | Không | Pre-fill | |
| 24 | Quy tắc hiển thị | Text | Có | Không | Pre-fill | |
| 25 | Tọa độ GPS | Bảng con | Có | Có* | Pre-fill | *≥1 Submit |
| 26 | File đính kèm | Upload | Có | Không | Pre-fill | ≤10, 20MB |

### 10.3. Accent budget ≤3

1. Nút "Lưu và gửi phê duyệt" (primary)
2. Nút "Lưu và phê duyệt" (primary, Leader only)
3. Cảnh báo đổi mã bến (warning icon vàng)

### 10.4. Trạng thái UI

- Đang tải pre-fill: spinner toàn form
- Đổi Cảng biển: cảnh báo "Mã bến sẽ thay đổi" + spinner sinh mã
- Validate: đỏ dưới trường
- Thành công: toast xanh + redirect
- Rời form: modal xác nhận nếu có thay đổi

### 10.5. Mobile (<768px)

- Form single-column
- Bảng con → card
- Nút full-width, dọc

---

## Consolidation Note

Merged with UI feature F-076 (ui-ql-bc-cap-nhat) — 2026-07-30
