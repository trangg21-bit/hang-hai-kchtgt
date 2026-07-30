---
id: F-008
name: Quản lý Cảng biển - Tạo mới
slug: quan-ly-cang-bien-tao-moi
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-16T04:40:32Z
last-updated: 2026-07-28
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Cảng biển - Tạo mới

**Tài liệu:** BA Feature Brief
**Feature:** F-008 — Quản lý Cảng biển - Tạo mới
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-07-28

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Tạo mới Cảng biển là tính năng cho phép người dùng có thẩm quyền đăng ký một Cảng biển mới vào hệ thống quản lý tài sản KCHTGT Hàng Hải. Người dùng nhập các thông tin theo form. Hệ thống tự động sinh mã cảng và kiểm tra tính hợp lệ của dữ liệu. Người dùng có thể chọn "Lưu tạm" (trạng thái nháp, cho phép chỉnh sửa tiếp) hoặc "Gửi phê duyệt" (chuyển vào queue chờ Lãnh đạo duyệt). Mã cảng sau khi tạo không thể thay đổi (bất biến).

### 1.2. Tại sao cần tính năng này?

Hệ thống quản lý tài sản KCHTGT Hàng Hải cần số hóa toàn bộ quy trình đăng ký Cảng biển — thay thế cho phương thức thủ công (hồ sơ giấy, bảng tính rời rạc). Tính năng này đảm bảo:

- Dữ liệu Cảng biển được chuẩn hóa theo một cấu trúc thống nhất trên toàn quốc
- Quy trình tạo mới có kiểm soát: phân nhánh Lưu tạm / Gửi phê duyệt, phù hợp với thực tế nghiệp vụ (cán bộ có thể nhập dần, chưa cần đầy đủ ngay)
- Mã cảng được hệ thống tự động sinh — loại bỏ sai sót do nhập tay và đảm bảo tính duy nhất
- Tích hợp dữ liệu GIS (nhiều tọa độ, loại đối tượng, biểu tượng, hệ quy chiếu) phục vụ hiển thị bản đồ
- Ghi nhận đầy đủ công trình KCHT trực thuộc và file đính kèm ngay từ bước tạo mới

### 1.3. Luồng hoạt động chính

Người dùng đăng nhập vào hệ thống, từ menu "Quản lý KCHT Hàng hải" chọn "Quản lý Cảng biển". Hệ thống hiển thị danh sách Cảng biển hiện có. Người dùng nhấn nút "Thêm mới", hệ thống mở form tạo mới cho phép nhập các trường thông tin. Người dùng điền các trường, hệ thống kiểm tra định dạng và hiển thị thông báo lỗi nếu có.

Sau khi điền xong, người dùng có hai lựa chọn:

- **Lưu tạm:** Hệ thống lưu Cảng biển với trạng thái "nháp", cho phép mở lại chỉnh sửa bất kỳ lúc nào. Yêu cầu tối thiểu: mã cảng (tự sinh) và tên cảng.
- **Gửi phê duyệt:** Hệ thống lưu Cảng biển với trạng thái "Chờ phê duyệt", gửi vào queue phê duyệt của Lãnh đạo. Yêu cầu đầy đủ tất cả các trường bắt buộc.

Sau khi lưu thành công, hệ thống hiển thị thông báo và điều hướng về danh sách.

---

## 2. Ai dùng? Dùng như thế nào?

Quyền thao tác và xem tính năng được áp dụng theo hệ thống phân quyền tập trung. Mỗi vai trò có phạm vi truy cập và thao tác khác nhau, kiểm soát bởi RBAC.

### 2.1. Logic phân quyền chung

Các thao tác trong tính năng được bảo vệ bởi các quyền (permissions) tương ứng. Người dùng chỉ có thể thực hiện những thao tác mà vai trò của họ được cấp quyền từ chức năng "Phân quyền":

| Vai trò | Quyền xem | Quyền thao tác | Phạm vi dữ liệu | Ghi chú |
|---|---|---|---|---|
| system-admin | Xem toàn bộ | Tạo mới, Lưu tạm, Gửi phê duyệt | Toàn bộ hệ thống | Toàn quyền |
| admin-operation | Xem toàn bộ | Tạo mới, Lưu tạm, Gửi phê duyệt | Toàn bộ hệ thống | Vai trò vận hành chính |
| admin | Xem trong đơn vị | Tạo mới, Lưu tạm | Trong đơn vị quản lý | Không có quyền Gửi phê duyệt |
| Lãnh đạo | Xem toàn bộ | Gửi phê duyệt (từ nháp), Phê duyệt (F-011) | Toàn bộ hệ thống | Chỉ duyệt, không tạo mới |
| Cán bộ | Xem trong đơn vị | Tạo mới, Lưu tạm | Trong đơn vị quản lý | Nhập liệu ban đầu; không Gửi phê duyệt |
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

- **US-008-01:** Là Cán bộ/admin/system-admin, tôi muốn mở form "Thêm mới Cảng biển" từ màn hình danh sách.
- **US-008-02:** Là Cán bộ/admin, tôi muốn điền các trường và nhấn "Lưu tạm" để lưu bản nháp, có thể chỉnh sửa sau.
- **US-008-03:** Là admin-operation/system-admin, tôi muốn điền đầy đủ trường bắt buộc và nhấn "Gửi phê duyệt" để chuyển sang "Chờ phê duyệt".
- **US-008-04:** Là Cán bộ, tôi muốn hệ thống tự động sinh mã cảng khi mở form, mã không thể sửa sau khi lưu.
- **US-008-05:** Là Cán bộ, tôi muốn thêm nhiều tọa độ GPS (Vĩ độ, Kinh độ), có thể sửa/xóa từng tọa độ trên form trước khi lưu.
- **US-008-06:** Là Cán bộ, tôi muốn thêm công trình KCHT khác (STT, Tên, Số lượng) và có thể xóa từng công trình trên form trước khi lưu.
- **US-008-07:** Là Cán bộ, tôi muốn nhận thông báo lỗi rõ ràng theo từng trường khi nhập sai.
- **US-008-08:** Là Lãnh đạo, tôi muốn xem danh sách Cảng biển "Chờ phê duyệt" (liên quan F-011).

### Mức Should (nên có)

- **US-008-09:** Là Cán bộ, tôi muốn upload file đính kèm (PDF, ảnh, văn bản) ngay trong form.
- **US-008-10:** Là Cán bộ, tôi muốn chọn loại đối tượng GIS, biểu tượng, hệ quy chiếu.
- **US-008-11:** Là Cán bộ, tôi muốn hệ thống tự động kiểm tra tọa độ GPS hợp lệ.

### Mức Could (có thể có sau)

- **US-008-12:** Là Cán bộ, tôi muốn hệ thống tự động tính chỉ số tổng hợp từ module con.
- **US-008-13:** Là Cán bộ, tôi muốn form tự động gợi ý tên cảng dựa trên vị trí và đơn vị.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Truy cập và hiển thị form

**AC-008-01 — Truy cập form:** Người dùng có quyền (Cán bộ, admin, admin-operation, system-admin) → menu → "Thêm mới" → hiển thị form với mã cảng tự sinh (read-only). Không có quyền → ẩn nút; truy cập URL trực tiếp → HTTP 403.

**AC-008-02 — Mã cảng tự sinh:** Khi mở form, hệ thống tự sinh mã CB-XXXXXX (read-only). Nếu lỗi → "Không thể tạo mã cảng. Vui lòng thử lại."

### Nhóm 2: Lưu tạm (Draft)

**AC-008-03 — Lưu tạm thành công:** Đã nhập Tên cảng biển → nhấn "Lưu tạm" → status='nhap', badge "Nháp" trong danh sách, có thể mở chỉnh sửa (F-009).

**AC-008-04 — Từ chối Lưu tạm:** Chưa nhập Tên cảng → lỗi "Tên cảng biển là bắt buộc ngay cả khi lưu tạm".

### Nhóm 3: Gửi phê duyệt (Submit)

**AC-008-05 — Gửi phê duyệt thành công:** Đầy đủ: Đơn vị QL, Tên CB, Tỉnh/TP, Phân cấp, ≥1 tọa độ GPS → status='cho_phe_duyet', gửi queue Lãnh đạo.

**AC-008-06 — Từ chối thiếu trường bắt buộc:** Thiếu trường bắt buộc khi Gửi phê duyệt → lỗi tại từng trường cụ thể.

**AC-008-07 — Từ chối thiếu tọa độ GPS:** Đủ trường khác nhưng 0 tọa độ → "Vui lòng thêm ít nhất một tọa độ (Vĩ độ, Kinh độ)".

### Nhóm 4: Xác thực dữ liệu

**AC-008-08 — GPS hợp lệ:** Vĩ độ [-90,90], Kinh độ [-180,180]. Validate client + server.

**AC-008-09 — Trùng tên cảng:** Tên đã tồn tại trong cùng tỉnh → warning (không chặn cứng): "Tên cảng đã tồn tại. Bạn có chắc muốn tiếp tục?"

**AC-008-10 — Giá trị số:** Chỉ chấp nhận ≥ 0. Số âm → lỗi.

**AC-008-11 — Công trình KCHT:** Số lượng > 0, Tên không rỗng.

**AC-008-12 — File đính kèm:** Định dạng: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. ≤20MB/file, ≤10 files.

### Nhóm 5: Phân quyền

**AC-008-13 — Từ chối không có quyền tạo mới:** Lãnh đạo/Cá nhân/không PORT_CREATE → HTTP 403 khi truy cập form tạo mới; ẩn nút "Thêm mới".

**AC-008-14 — Admin giới hạn đơn vị:** Admin tạo mới → Đơn vị QL tự động điền, read-only.

**AC-008-15 — Admin và Cán bộ không Gửi phê duyệt:** Admin và Cán bộ chỉ thấy "Lưu tạm". Cố submit → HTTP 403.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng cho | Nguồn | Ngoại lệ |
|---|---|---|---|---|
| BR-008-01 | **Mã cảng tự động sinh, bất biến** — định dạng CB-XXXXXX, duy nhất toàn hệ thống | Tạo mới, Cập nhật | Thiết kế | Không |
| BR-008-02 | **Lưu tạm: tối thiểu mã + tên cảng** — các trường khác tùy chọn, status='nhap' | Lưu tạm | Nghiệp vụ | Không |
| BR-008-03 | **Gửi phê duyệt: đầy đủ Đơn vị QL, Tên CB, Tỉnh/TP, Phân cấp, ≥1 GPS** | Gửi phê duyệt | Nghiệp vụ | Không |
| BR-008-04 | **≥1 tọa độ GPS khi gửi phê duyệt** — phục vụ hiển thị bản đồ | Gửi phê duyệt | GIS | Lưu tạm không cần |
| BR-008-05 | **GPS hợp lệ:** Vĩ độ [-90,90], Kinh độ [-180,180] | Tất cả lưu | WGS84 | Không |
| BR-008-06 | **Phân cấp bắt buộc khi gửi phê duyệt** — danh mục (I, II, III) | Gửi phê duyệt | Quy định NN | Lưu tạm không cần |
| BR-008-07 | **Đơn vị QL xác định phạm vi truy cập** — user chỉ xem và thao tác Cảng biển trong đơn vị mình | Xem, Tạo mới, Lưu tạm | RBAC | system-admin, admin-operation xem toàn bộ |
| BR-008-08 | **Công trình KCHT: 0-N bản ghi** — STT, Tên (bắt buộc), Số lượng (>0) | Form tạo mới | Nghiệp vụ | Không |
| BR-008-09 | **File đính kèm:** PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF; ≤20MB; ≤10 files | Upload | Hạ tầng | Không |
| BR-008-10 | **Chỉ số tổng hợp nhập tay giai đoạn 1** — tương lai tự động hóa (US-008-12) | Form | Hạn chế KT | =0 khi lưu tạm |
| BR-008-11 | **Chuyển nháp → phê duyệt qua F-009** — kiểm tra lại BR-008-03 | F-009 | Liên kết | Không |
| BR-008-12 | **Audit log mọi thao tác** — actor, thời gian, hành động, IP | Audit | Bảo mật | Không |

---

## 6. Mô hình dữ liệu

> 🔴 = trường mới. ~~gạch ngang~~ = loại bỏ.

### 6.1. Bảng `port` — Cảng biển

**Thông tin chung:**
- id: UUID, PK
- port_code: VARCHAR(20), UNIQUE, NOT NULL — Mã tự sinh CB-XXXXXX
- port_name: NVARCHAR(255), NOT NULL
- managing_unit: NVARCHAR(255) — FK org_unit, NOT NULL khi status != 'nhap'
- 🔴 port_group: NVARCHAR(100)
- province_city: NVARCHAR(100) — NOT NULL khi status != 'nhap'
- 🔴 detailed_address: NVARCHAR(500)
- 🔴 port_classification: NVARCHAR(100) — NOT NULL khi status != 'nhap'
- 🔴 water_area_scope: NVARCHAR(500)

**Chỉ số tổng hợp (14 trường, DEFAULT 0, ≥ 0):**
- 🔴 **total_berths:** INT — Tổng số bến cảng
- 🔴 **total_anchorage_transshipment_zones:** INT — Tổng số khu neo đậu, khu chuyển tải
- 🔴 **total_public_channels:** INT — Tổng số tuyến luồng hàng hải công cộng
- 🔴 **total_dedicated_channels:** INT — Tổng số tuyến luồng hàng hải chuyên dùng
- 🔴 **total_public_channel_length_km:** DECIMAL(10,2) — Tổng chiều dài luồng HH công cộng (km)
- 🔴 **total_dedicated_channel_length_km:** DECIMAL(10,2) — Tổng chiều dài luồng HH chuyên dùng (km)
- 🔴 **total_buoys_beacons:** INT — Tổng số phao tiêu, báo hiệu hàng hải trên luồng
- 🔴 **total_dikes_revetments:** INT — Tổng số đê, kè
- 🔴 **total_dike_revetment_length_km:** DECIMAL(10,2) — Tổng chiều dài hệ thống đê, kè (km)
- 🔴 **total_lighthouses:** INT — Tổng số đèn biển, đăng, tiêu độc lập
- 🔴 **total_buoy_berths:** INT — Số lượng bến phao
- 🔴 **total_anchorages:** INT — Số lượng khu neo đậu
- 🔴 **total_transshipment_zones:** INT — Số lượng khu chuyển tải
- 🔴 **other_water_zones:** NVARCHAR(500) — Các khu nước, vùng nước khác

**Thông tin GIS:**
- 🔴 object_type: NVARCHAR(50)
- 🔴 symbol_id: BIGINT FK
- 🔴 coordinate_system: NVARCHAR(50)
- 🔴 display_rule: NVARCHAR(255)

**Trạng thái & Audit:**
- status: ENUM('nhap','cho_phe_duyet','da_phe_duyet','tu_choi','tam_ngung','da_xoa'), DEFAULT 'nhap'
- notes: NVARCHAR(1000)
- created_by, created_at, updated_by, updated_at

### 6.2. 🔴 Bảng mới `port_coordinate` — tọa độ GPS

Gửi kèm trong payload `POST /ports`, lưu cùng transaction với port.

- 🔴 **id:** BIGINT, PK, AUTO_INCREMENT
- 🔴 **port_id:** BIGINT, NOT NULL, FK → port.id
- 🔴 **latitude:** DECIMAL(9,6), NOT NULL — Vĩ độ [-90, 90]
- 🔴 **longitude:** DECIMAL(9,6), NOT NULL — Kinh độ [-180, 180]
- 🔴 **sort_order:** INT, DEFAULT 0
- 🔴 **created_at:** TIMESTAMP, DEFAULT NOW()

> Constraint: ≥1 record khi status='cho_phe_duyet'

### 6.3. 🔴 Bảng mới `port_infrastructure` — công trình KCHT

Gửi kèm trong payload `POST /ports`, lưu cùng transaction với port.

- 🔴 **id:** BIGINT, PK, AUTO_INCREMENT
- 🔴 **port_id:** BIGINT, NOT NULL, FK → port.id
- 🔴 **stt:** INT, NOT NULL
- 🔴 **infra_name:** NVARCHAR(255), NOT NULL
- 🔴 **quantity:** INT, NOT NULL, > 0
- 🔴 **created_at:** TIMESTAMP, DEFAULT NOW()

### 6.4. 🔴 Bảng mới `port_attachment` — file đính kèm

Upload sau khi port đã được tạo (có id), qua API riêng.

- 🔴 **id:** BIGINT, PK, AUTO_INCREMENT
- 🔴 **port_id:** BIGINT, NOT NULL, FK → port.id
- 🔴 **file_name:** NVARCHAR(255), NOT NULL
- 🔴 **file_path:** NVARCHAR(500), NOT NULL
- 🔴 **file_size:** BIGINT, NOT NULL (≤ 20MB)
- 🔴 **content_type:** NVARCHAR(100)
- 🔴 **uploaded_by:** BIGINT, FK → user_account
- 🔴 **uploaded_at:** TIMESTAMP, DEFAULT NOW()

---

## 7. API Endpoints

### 7.1. F-008 — Tạo mới

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| POST | `/api/v1/ports` | Tạo mới Cảng biển. Body gồm: thông tin port + danh sách coordinates[] + danh sách infrastructure[] + action (`draft` hoặc `submit`). Trả về port đã tạo kèm id. | `PORT_CREATE` |
| GET | `/api/v1/ports/generate-code` | Sinh trước mã cảng để hiển thị trên form | `PORT_CREATE` |

> **Ghi chú:** Tọa độ GPS và công trình KCHT được gửi kèm trong payload `POST /ports`, lưu trong 1 transaction với port. File đính kèm được upload qua API riêng sau khi port đã có id. Các thao tác thêm/sửa/xóa sub-entity trên port đã tồn tại thuộc về F-009 (Cập nhật).

### 7.2. F-008 — Upload file đính kèm (sau khi tạo)

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| POST | `/api/v1/ports/{id}/attachments` | Upload file đính kèm cho port vừa tạo | `PORT_CREATE` |
| DELETE | `/api/v1/ports/{id}/attachments/{attId}` | Xóa file đính kèm (chỉ khi port đang ở trạng thái nháp) | `PORT_CREATE` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Sinh mã cảng tự động
1. Frontend gọi `GET /ports/generate-code` khi mở form
2. Backend sinh `CB-` + sequential number với lock
3. Hiển thị read-only trên form
4. Khi lưu, backend kiểm tra mã không bị sửa (tampering detection)
5. Sai → HTTP 400 "Mã cảng không hợp lệ"

### 8.2. Luồng Lưu tạm
```
Mở form → GET /generate-code → Nhập Tên cảng + tùy chọn → "Lưu tạm"
→ POST /ports { action:"draft", port_name, ...các trường tùy chọn, coordinates[], infrastructure[] }
→ Validate: port_name không rỗng
→ INSERT port(status='nhap') + INSERT coordinates[] + INSERT infrastructure[] [1 TX]
→ Audit log → Response 201 + redirect
```

### 8.3. Luồng Gửi phê duyệt
```
Mở form → GET /generate-code → Nhập đầy đủ bắt buộc + ≥1 GPS → "Gửi phê duyệt"
→ POST /ports { action:"submit", đầy đủ trường bắt buộc, coordinates[] (≥1), infrastructure[] }
→ Validate client: đầy đủ, ≥1 GPS
→ Validate server: đầy đủ, GPS hợp lệ
→ Check trùng tên cùng tỉnh → warning nếu có
→ INSERT port(status='cho_phe_duyet') + coordinates[] + infrastructure[] [1 TX]
→ Audit log → Notification Lãnh đạo → Response 201 + redirect
```

### 8.4. Form phức hợp (composite form)
1 entity chính (port) + 2 sub-entity inline (coordinates, infrastructure). Người dùng thêm/sửa/xóa sub-entity trên form trước khi lưu. Toàn bộ dữ liệu (port + coordinates + infrastructure) được gửi trong 1 payload `POST /ports`, xử lý trong 1 transaction — rollback nếu bất kỳ phần nào thất bại. File đính kèm được upload sau khi port có id qua `POST /ports/{id}/attachments`.

---

## 9. Yêu cầu phi chức năng

- **Hiệu năng:** POST /ports ≤2s, GET /generate-code ≤200ms, ≥50 concurrent users
- **Mở rộng:** Chỉ số tổng hợp → computed fields (tương lai); port_coordinate mở rộng coordinate_type; format mã configurable
- **Bảo mật:** RBAC PORT_CREATE; server-side validation; sanitize input; file upload giới hạn; HTTPS
- **Độ tin cậy:** Transaction atomicity; rollback toàn bộ; audit log cả thất bại
- **UX:** Responsive; loading indicator; modal xác nhận rời form; WCAG 2.1 AA
- **Pháp lý:** Chuẩn quốc gia về cảng biển; audit log ≥2 năm

---

## 10. Yêu cầu giao diện

> Token từ theme.ts và tokens.ts. Không hardcode.

### 10.1. Cấu trúc form (8 section)
1. Thông tin chung — Mã cảng (RO), Đơn vị QL*, Nhóm CB, Tên CB*, Tỉnh/TP*, Địa chỉ, Phân cấp*, Vùng nước
2. Chỉ số tổng hợp — 14 number fields
3. Thông tin GIS — Loại ĐT, Biểu tượng, Hệ quy chiếu, Quy tắc
4. Tọa độ GPS — Bảng con [Thêm] Vĩ độ + Kinh độ + [Xóa]
5. Công trình KCHT — Bảng con [Thêm] STT + Tên + SL + [Xóa]
6. File đính kèm — Upload + danh sách + [Xóa]
7. Ghi chú — Textarea
8. Action — "Lưu tạm" (outlined) + "Gửi phê duyệt" (primary)

### 10.2. Bảng trường form

| STT | Tên trường | Loại ĐK | Edit | Bắt buộc | Default | Ghi chú |
|---|---|---|---|---|---|---|
| 1 | Mã cảng biển | Text (RO) | Không | Có | CB-XXXXXX | Tự sinh |
| 2 | Đơn vị quản lý | Select | Có | Có* | Đơn vị user | *Submit |
| 3 | Nhóm cảng biển | Select | Có | Không | — | |
| 4 | Tên cảng biển | Text | Có | Có | — | Cả draft |
| 5 | Tỉnh/Thành phố | Select | Có | Có* | — | *Submit |
| 6 | Địa điểm chi tiết | Text | Có | Không | — | |
| 7 | Phân cấp cảng biển | Select | Có | Có* | — | *Submit |
| 8 | Phạm vi vùng nước | TextArea | Có | Không | — | |
| 9 | Tổng số bến cảng | Number | Có | Không | 0 | ≥0 |
| 10 | Tổng số khu neo đậu, khu chuyển tải | Number | Có | Không | 0 | ≥0 |
| 11 | Tổng số tuyến luồng HH công cộng | Number | Có | Không | 0 | ≥0 |
| 12 | Tổng số tuyến luồng HH chuyên dùng | Number | Có | Không | 0 | ≥0 |
| 13 | Tổng chiều dài luồng HH công cộng (km) | Number | Có | Không | 0 | ≥0, decimal |
| 14 | Tổng chiều dài luồng HH chuyên dùng (km) | Number | Có | Không | 0 | ≥0, decimal |
| 15 | Tổng số phao tiêu, báo hiệu HH trên luồng | Number | Có | Không | 0 | ≥0 |
| 16 | Tổng số đê, kè | Number | Có | Không | 0 | ≥0 |
| 17 | Tổng chiều dài hệ thống đê, kè (km) | Number | Có | Không | 0 | ≥0, decimal |
| 18 | Tổng số đèn biển, đăng, tiêu độc lập | Number | Có | Không | 0 | ≥0 |
| 19 | Số lượng bến phao | Number | Có | Không | 0 | ≥0 |
| 20 | Số lượng khu neo đậu | Number | Có | Không | 0 | ≥0 |
| 21 | Số lượng khu chuyển tải | Number | Có | Không | 0 | ≥0 |
| 22 | Các khu nước, vùng nước khác | TextArea | Có | Không | — | |
| 23 | Loại đối tượng GIS | Select | Có | Không | Point | |
| 24 | Biểu tượng | Select | Có | Không | — | |
| 25 | Hệ quy chiếu | Select | Có | Không | WGS-84 | |
| 26 | Quy tắc hiển thị | Text | Có | Không | — | |
| 27 | Tọa độ GPS | Bảng con | Có | Có* | — | *≥1 Submit |
| 28 | Công trình KCHT | Bảng con | Có | Không | — | STT, Tên, SL |
| 29 | File đính kèm | Upload | Có | Không | — | ≤10, 20MB |
| 30 | Ghi chú | TextArea | Có | Không | — | |

### 10.3. Accent budget ≤3
1. Nút "Gửi phê duyệt" (primary)
2. Nút "Thêm mới" bảng con (link)
3. Icon upload

### 10.4. Trạng thái UI
- Loading: spinner + disable nút
- Validate: đỏ dưới trường
- Server lỗi: toast đỏ
- Thành công: toast xanh + redirect 2s
- Rời form: modal xác nhận

### 10.5. Mobile (<768px)
- Sidebar hamburger 80px
- Form single-column
- Bảng con → card
- Nút full-width, dọc
