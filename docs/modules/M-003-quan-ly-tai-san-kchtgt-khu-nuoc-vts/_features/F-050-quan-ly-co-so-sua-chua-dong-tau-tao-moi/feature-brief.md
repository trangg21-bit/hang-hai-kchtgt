---
id: F-050
name: Quản lý Cơ sở sửa chữa đóng tàu - Tạo mới
slug: quan-ly-co-so-sua-chua-dong-tau-tao-moi
module-id: M-003
status: proposed
classification: local
priority: high
created: 2026-08-23T00:00:00Z
last-updated: 2026-08-23T00:00:00Z
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Cơ sở sửa chữa đóng tàu - Tạo mới

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-050
**Module:** M-003 — Quản lý tài sản KCHTGT - Khu nước & VTS
**Loại:** chức năng có bước phê duyệt (2 cấp: Cảng vụ/Chi cục → Cục)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + file Excel `HH_Tính năng & danh sách các trường thông tin.xlsx` — sheet `QL cơ sở sửa chữa đóng tàu` (nguồn sự thật về trường thông tin) + brief F-051/F-052/F-053/F-054/F-055 (vòng đời CSSCDT)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Đã khai báo tại mục 5 (dòng 3) và mục 4.1: CSSCDT là dữ liệu nghiệp vụ theo đơn vị — bắt buộc có `orgUnitId`, nguồn gán = request/mặc định đơn vị user, chiều ghi validate phạm vi bằng `OrgUnitScopeService`, controller khai `@DataScope` + entity khai `@Filter(orgUnitFilter)`.

---

## 1. Mô tả ngắn

Cho phép **Chuyên viên** tạo mới hồ sơ cơ sở sửa chữa, đóng tàu (CSSCDT) vào hệ thống quản lý tài sản KCHTGT khu nước: nhập thông tin cơ bản (mã tự sinh, tên, đơn vị quản lý, thuộc cảng biển/cầu cảng, địa điểm, tình trạng), thông tin đặc thù CSSCDT (công năng sử dụng, diện tích nhà xưởng, loại tàu, cỡ tàu DWT, loại hình doanh nghiệp, hoạt động, số lượng triền đà, ghi chú), tọa độ GIS và file đính kèm. Bản ghi tạo ra ở trạng thái **DRAFT** (Lưu tạm), gửi phê duyệt 2 cấp — **C1: Cảng vụ/Chi cục → C2: Cục** — trước khi được phép sử dụng. Người dùng có quyền `cosuachua:create` thao tác; tài khoản **Admin Cục** xem full dữ liệu + metadata người tạo/sửa.

## 2. Trường dữ liệu

Bảng mô tả các trường trên form tạo mới/chỉnh sửa — **khớp 100% sheet `QL cơ sở sửa chữa đóng tàu`** (45 trường) của file Excel (nguồn sự thật). Cột Danh sách/Bộ lọc/Xem chi tiết/Tạo mới/Sửa lấy nguyên giá trị từ Excel (Có/Không).

| STT | Tên trường (theo Excel) | Loại điều khiển (theo Excel) | Bắt buộc | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
|  | **Thông tin cơ bản** |  |  |  |  |  |  |  |  |
| 1 | Mã cơ sở sửa chữa, đóng tàu | Input (disabled) | Không (tự sinh) | Có | Có | Có | Có | Có | Tự động sinh `G17.43.{seq}-CSSCDT-{seq}`, không nhập/sửa. BR-050-01 |
| 2 | Tên cơ sở sửa chữa, đóng tàu | TextArea | Có | Có | Có | Có | Có | Có | Tối đa 255 ký tự, không để trống. BR-050-02 |
| 3 | Đơn vị quản lý | Select (OrgCode) | Có | Có | Có | Có | Có | Có | Mặc định = đơn vị user đăng nhập. Disabled khi sửa (F-051) |
| 4 | Thuộc cảng biển | Select (KCHT_CB) | Không | Có | Có | Có | Có | Có | Chỉ hiển thị cảng biển đã duyệt, lọc theo `orgUnitId`. Disabled khi sửa (F-051) |
| 5 | Thuộc cầu cảng | Select (KCHT_CC) | Không | Có | Có | Có | Có | Có | Lọc theo cảng biển đã chọn |
| 6 | Địa điểm (Tỉnh/Thành phố) | Select (DM_DON_VI_HANH_CHINH) | Có | Có | Có | Có | Có | Có | Danh mục 63 tỉnh/thành phố. BR-050-05 |
| 7 | Địa điểm chi tiết | TextArea | Không | Không | Không | Có | Có | Có | Tối đa 500 ký tự. **KHÔNG bắt buộc** (theo Excel — đồng bộ F-044/F-051) |
| 8 | Tình trạng | Select (AppParams) | Có | Có | Có | Có | Có | Có | Chưa khai thác/vận hành; Đang khai thác/vận hành; Dừng khai thác/vận hành. BR-050-06 |
|  | **Thông tin đặc thù CSSCDT** |  |  |  |  |  |  |  |  |
| 9 | Công năng sử dụng | Select (AppParams) | Không | Không | Không | Có | Có | Có |  |
| 10 | Diện tích nhà xưởng, kho bãi (m²) | Number (Decimal) | Không | Không | Không | Có | Có | Có | Decimal(20,4) ≥ 0 |
| 11 | Loại tàu đóng mới, sửa chữa | Select (AppParams) | Không | Không | Không | Có | Có | Có |  |
| 12 | Cỡ tàu (DWT) | Input | Không | Không | Không | Có | Có | Có | Tối đa 20 ký tự (VD: "100000 DWT") |
| 13 | Loại hình doanh nghiệp | Select (AppParams) | Không | Không | Không | Có | Có | Có |  |
| 14 | Hoạt động | Select (AppParams) | Không | Không | Không | Có | Có | Có |  |
| 15 | Số lượng triền đà | Input (Number) | Không | Không | Không | Có | Có | Có | Số nguyên, tối đa 5 chữ số |
| 16 | Ghi chú | TextArea | Không | Không | Không | Có | Có | Có | Tối đa 2000 ký tự |
|  | **Tọa độ GIS** |  |  |  |  |  |  |  |  |
| 17 | Loại đối tượng (GIS) | Select (AppParams) | Không | Không | Không | Có | Có | Có | Điểm/Đường/Vùng. Khi đã chọn → Biểu tượng bắt buộc |
| 18 | Biểu tượng (GIS) | Select (Icon) | Không | Không | Không | Có | Có | Có | Bắt buộc khi đã chọn Loại đối tượng (điều kiện hiển thị — mục 5 dòng 4) |
| 19 | Hệ quy chiếu (GIS) | Select (disabled) | Không | Không | Không | Có | Có | Có | Tự động = WGS_84, không cho sửa |
| 20 | Quy tắc hiển thị (GIS) | Select (disabled) | Không | Không | Không | Có | Có | Có | Tự động = Độ/Phút/Giây, không cho sửa |
| 21 | Tọa độ (GIS) | Bảng kinh độ/vĩ độ | Không | Không | Không | Có | Có | Có |  |
|  | **File đính kèm** |  |  |  |  |  |  |  |  |
| 22 | Danh sách file | UploadFileTable | Không | Không | Không | Có | Có | Có | Upload nhiều file (PDF, ảnh, bản vẽ). ≤ 10MB/file |
|  | **Thông tin log cập nhật** (hệ thống tự ghi — chỉ hiển thị) |  |  |  |  |  |  |  |  |
| 23 | Ngày cập nhật | Textarea | Không (hệ thống) | Có | Có | Có | Không | Không |  |
| 24 | Cán bộ cập nhật | Textarea | Không (hệ thống) | Có | Không | Có | Không | Không |  |
| 25 | Ngày gửi phê duyệt | Textarea | Không (hệ thống) | Có | Không | Có | Không | Không |  |
| 26 | Cán bộ gửi phê duyệt | Textarea | Không (hệ thống) | Có | Không | Có | Không | Không |  |
| 27 | Ngày phê duyệt cấp Cảng vụ/Chi cục | Textarea | Không (hệ thống) | Có | Không | Có | Không | Không |  |
| 28 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | Textarea | Không (hệ thống) | Có | Không | Có | Không | Không |  |
| 29 | Nội dung phê duyệt | Textarea | Không (hệ thống) | Không | Không | Có | Không | Không |  |
| 30 | Ngày phê duyệt cấp Cục | Textarea | Không (hệ thống) | Có | Không | Có | Không | Không |  |
| 31 | Cán bộ phê duyệt cấp Cục | Textarea | Không (hệ thống) | Có | Không | Có | Không | Không |  |
| 32 | Nội dung phê duyệt | Textarea | Không (hệ thống) | Không | Không | Có | Không | Không |  |
| 33 | Trạng thái (Trạng thái phê duyệt) | Select (Dropdown) | Không (hệ thống) | Có | Có | Có | Không | Không | DRAFT / PENDING_APPROVAL / APPROVED_LEVEL1 / REJECTED_LEVEL1 / REJECTED_LEVEL2 / APPROVED / ARCHIVED |
|  | **Thông tin vận hành khai thác** (chỉ ở trang Chi tiết — read-only) |  |  |  |  |  |  |  |  |
| 34 | Mã kế hoạch | Text (read-only) | Không | Không | Không | Có | Không | Không |  |
| 35 | Tên kế hoạch | Text (read-only) | Không | Không | Không | Có | Không | Không |  |
| 36 | Ngày bắt đầu | Text (read-only) | Không | Không | Không | Có | Không | Không |  |
| 37 | Ngày kết thúc | Text (read-only) | Không | Không | Không | Có | Không | Không |  |
|  | **Thông tin bảo trì** (chỉ ở trang Chi tiết — read-only) |  |  |  |  |  |  |  |  |
| 38 | Mã kế hoạch | Text (read-only) | Không | Không | Không | Có | Không | Không |  |
| 39 | Tên kế hoạch | Text (read-only) | Không | Không | Không | Có | Không | Không |  |
| 40 | Thời gian bắt đầu | Text (read-only) | Không | Không | Không | Có | Không | Không |  |
| 41 | Thời gian kết thúc | Text (read-only) | Không | Không | Không | Có | Không | Không |  |
|  | **Thông tin sự cố** (chỉ ở trang Chi tiết — read-only) |  |  |  |  |  |  |  |  |
| 42 | Mã sự cố | Text (read-only) | Không | Không | Không | Có | Không | Không |  |
| 43 | Loại sự cố | Text (read-only) | Không | Không | Không | Có | Không | Không |  |
| 44 | Địa điểm | Text (read-only) | Không | Không | Không | Có | Không | Không |  |
| 45 | Thời gian | Text (read-only) | Không | Không | Không | Có | Không | Không |  |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.7 (trạng thái lưu dạng số, không lưu chữ).
- Chức năng **có bước phê duyệt 2 cấp** (đồng nhất với F-051..F-055):
  - **DRAFT** (Lưu tạm) — trạng thái mặc định khi tạo mới (kể cả khi người dùng nhấn "Lưu và gửi phê duyệt", server chuyển `PENDING_APPROVAL`).
  - **PENDING_APPROVAL** (Chờ Cảng vụ/Chi cục duyệt) — sau khi gửi duyệt (C1).
  - **APPROVED_LEVEL1** (Chờ Cục duyệt) — C1 đã duyệt, chờ C2.
  - **REJECTED_LEVEL1 / REJECTED_LEVEL2** (Bị trả về) — bị từ chối ở C1/C2, cần sửa lại (F-051) và gửi duyệt lại.
  - **APPROVED** (Đã phê duyệt) — duyệt xong cả 2 cấp, mới được các module khác tham chiếu.
  - **ARCHIVED** (Đã xóa) — xóa mềm qua F-052.
- Luồng: `DRAFT → PENDING_APPROVAL → (C1) APPROVED_LEVEL1 → (C2) APPROVED`; từ chối tại C1/C2 → `REJECTED_LEVEL1/2 → DRAFT` (sửa lại qua F-051). Tài khoản Cấp Cục có thể "Lưu và phê duyệt" để đạt `APPROVED` ngay (C1+C2 trong một bước).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/01-base-pattern.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-050-01 | Mã CSSCDT tự động sinh `G17.43.{seq}-CSSCDT-{seq}`, duy nhất toàn hệ thống, không nhập/sửa từ client | Create |
| BR-050-02 | Tên cơ sở sửa chữa, đóng tàu bắt buộc, tối đa 255 ký tự | Create / Update |
| BR-050-03 | `orgUnitId` (Đơn vị quản lý) bắt buộc — mặc định = đơn vị user; chiều GHI validate `OrgUnitScopeService.Scope.allows(...)` — không gán vào đơn vị ngoài phạm vi | Create / Update |
| BR-050-04 | Thuộc cảng biển (nếu có) chỉ chọn cảng đã phê duyệt (`APPROVED`) và đang hoạt động, lọc theo `orgUnitId`; Thuộc cầu cảng lọc theo cảng biển đã chọn | Create |
| BR-050-05 | Địa điểm (Tỉnh/Thành phố) bắt buộc | Create / Update |
| BR-050-06 | Tình trạng bắt buộc, mặc định "Đang khai thác/vận hành" | Create / Update |
| BR-050-07 | Địa điểm chi tiết **không bắt buộc** (theo Excel), tối đa 500 ký tự | Create / Update |
| BR-050-08 | Biểu tượng (GIS) bắt buộc khi đã chọn Loại đối tượng GIS; Hệ quy chiếu = WGS_84 và Quy tắc hiển thị = Độ/Phút/Giây tự động, disabled | Create / Update |
| BR-050-09 | Bản ghi chưa APPROVED **chưa thể được tham chiếu** bởi module khác (dropdown chọn CSSCDT chỉ hiển thị bản ghi APPROVED) | Create |
| BR-050-10 | Mọi thao tác tạo mới được ghi tự động vào `phe_duyet_lich_su` (loaiThaoTac = TAO_MOI) để phục vụ F-055 | Create |
| BR-050-11 | `approvalStatus`, `createdBy`, `createdAt`, `updatedBy`, `updatedAt` do server set — không nhận từ client (chống mass-assignment) | Create |
| BR-050-12 | Data Scope: entity có `orgUnitId` + `@Filter(orgUnitFilter)`; controller khai `@DataScope` | Create / Read |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-050-01** — Form tạo mới hiển thị đầy đủ 45 trường theo bảng mục 2; trường bắt buộc có dấu * đỏ (Tên, Đơn vị quản lý, Địa điểm Tỉnh/TP, Tình trạng). Khi thiếu trường bắt buộc: hiển thị lỗi "Trường này là bắt buộc" và chặn submit.
- **AC-050-02** — Mã CSSCDT tự sinh, hiển thị disabled trên form; khi lưu, mã không nhận từ client.
- **AC-050-03** — "Lưu tạm": lưu `approvalStatus = DRAFT`, ghi lịch sử TAO_MOI, toast "Tạo mới cơ sở thành công", quay về danh sách.
- **AC-050-04** — "Lưu và gửi phê duyệt": lưu `approvalStatus = PENDING_APPROVAL`, xuất hiện trong danh sách chờ duyệt của F-053.
- **AC-050-05** — "Lưu và phê duyệt" (chỉ Cấp Cục/Admin Cục): lưu và đạt `APPROVED` ngay (C1+C2).
- **AC-050-06** — Kiểm tra quyền: thiếu `cosuachua:create` → ẩn nút "Tạo mới", API trả 403.

### 4.3. User Stories kế thừa (nếu có)

- **US-050-01:** Là **Chuyên viên**, tôi muốn tạo mới cơ sở sửa chữa, đóng tàu với đầy đủ thông tin để đăng ký tài sản vào hệ thống.
- **US-050-02:** Là **Chuyên viên**, tôi muốn đơn vị quản lý được điền sẵn theo đơn vị của tôi để tiết kiệm thời gian nhập liệu.
- **US-050-03:** Là **Chuyên viên**, tôi muốn lưu tạm trước khi gửi phê duyệt để kiểm tra lại thông tin.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Tạo mới (Lưu tạm / Gửi duyệt / Lưu & duyệt) | `cosuachua:create` |
| Xem danh sách / chi tiết | `cosuachua:read` |
| Cập nhật | `cosuachua:update` (F-051) |
| Xóa mềm | `cosuachua:delete` (F-052) |
| Phê duyệt C1 (Cảng vụ/Chi cục) | `cosuachua:approve:c1` (F-053) |
| Phê duyệt C2 (Cục) | `cosuachua:approve:c2` (F-053) |

**Admin Cục:** mặc định theo tài liệu nền mục 3.8 — full quyền + xem thêm metadata người tạo/người sửa/thời gian; được phép chọn mọi đơn vị khi tạo.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 7 trạng thái: DRAFT, PENDING_APPROVAL, APPROVED_LEVEL1, REJECTED_LEVEL1, REJECTED_LEVEL2, APPROVED, ARCHIVED (xem mục 3) |
| 2 | Có bước phê duyệt không | Có — phê duyệt 2 cấp: C1 Cảng vụ/Chi cục → C2 Cục (F-053); tài khoản Cấp Cục có nút "Lưu và phê duyệt" |
| 3 | Lọc cha-con / theo đơn vị | Có — trường đơn vị bắt buộc: `orgUnitId` (bắt buộc), nguồn gán khi tạo = request hoặc mặc định đơn vị user, chiều ghi validate phạm vi `OrgUnitScopeService`; entity `@Filter(orgUnitFilter)` + controller `@DataScope`; ngoại lệ: không |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — Biểu tượng (GIS) chỉ hiển thị/bắt buộc khi đã chọn Loại đối tượng (GIS); Thuộc cầu cảng phụ thuộc Thuộc cảng biển; log cập nhật + vận hành/bảo trì/sự cố chỉ hiển thị ở trang Chi tiết |
| 5 | Quyền riêng | Có — `cosuachua:create` / `:read` / `:update` / `:delete` / `:approve:c1` / `:approve:c2` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — `UploadFileTable`, ≤ 10MB/file, lưu MinIO, bảng `co_sua_chua_dong_tau_attachment` |
| 8 | Giao diện khác mẫu chung | Không — dùng form chuẩn KCHT (FormCrud, 3 card: Thông tin chung / Thông tin đặc thù / Tọa độ GIS & File đính kèm) theo convention `theme.ts` + `tokens.ts` |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/co-so-sua-chua?enumActionKcht=LUU_TAM` | Tạo mới + lưu tạm (DRAFT) | `cosuachua:create` |
| POST | `/api/v1/co-so-sua-chua?enumActionKcht=LUU_VA_GUI_PHE_DUYET` | Tạo mới + gửi phê duyệt (PENDING_APPROVAL) | `cosuachua:create` |
| POST | `/api/v1/co-so-sua-chua?enumActionKcht=LUU_VA_PHE_DUYET` | Tạo mới + phê duyệt ngay (APPROVED) — chỉ Cấp Cục/Admin Cục | `cosuachua:create` (+ `cosuachua:approve:c1` + `cosuachua:approve:c2`) |
| GET | `/api/v1/co-so-sua-chua/search?keyword=&orgUnitId=&cangBienId=&cauCangId=&provinceId=&status=&tinhTrang=` | Tìm kiếm/lọc danh sách (F-048 danh sách CSSCDT) | `cosuachua:read` |
| GET | `/api/v1/cang-bien?approvalStatus=APPROVED&orgUnitId={id}` | Dropdown Thuộc cảng biển (đã duyệt) | `cosuachua:create` |
| GET | `/api/v1/cau-cang?cangBienId={id}` | Dropdown Thuộc cầu cảng (lọc theo cảng biển) | `cosuachua:create` |

> Đồng bộ endpoint với F-051 (`PUT /api/v1/co-so-sua-chua/{id}?enumActionKcht=...`), F-054 (`GET /api/v1/co-so-sua-chua/:id`).

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `co_sua_chua_dong_tau` (Thông tin cơ sở sửa chữa đóng tàu):** kế thừa F-051 mục 6.1, bổ sung phần Tạo mới:
- `ma` — VARCHAR, tự sinh `G17.43.{seq}-CSSCDT-{seq}`, unique, không sửa
- `ten` — VARCHAR(255), bắt buộc
- `fkDonViQl` (`org_unit_id`) — UUID, bắt buộc, mặc định = đơn vị user
- `fkCangBien` — UUID (FK → Cảng biển), tùy chọn, chỉ cảng đã duyệt
- `fkCauCang` — UUID (FK → Cầu cảng), tùy chọn
- `diaDiem` — mã tỉnh/TP, bắt buộc
- `diaDiemChiTiet` — VARCHAR(500), 🔴 không bắt buộc (theo Excel)
- `tinhTrang` — enum/int, bắt buộc (CHUA_KHAI_THAC / DANG_KHAI_THAC / DUNG_KHAI_THAC)
- `congNangSuDung`, `dienTichNhaXuongKhoBai` (DECIMAL(20,4) ≥ 0), `loaiTauDongMoiSuaChua`, `coTau` (VARCHAR(20)), `loaiHinhDoanhNghiep`, `hoatDong`, `soLuongTrienDa` (INT ≤ 5 chữ số), `ghiChu` (VARCHAR(2000)) — 🔴 trường đặc thù CSSCDT, tùy chọn
- `loaiDoiTuong`, `bieuTuong`, `heQuyChieu` (mặc định WGS_84), `quyTacHienThi` (mặc định Độ/Phút/Giây), `spatialId` — GIS
- `approvalStatus` (enum int, mặc định DRAFT), `isApprovedLevel1/2`, `approverLevel1/2`, `approvedDateLevel1/2`, `rejectionReason`
- `createdBy`, `createdAt`, `updatedBy`, `updatedAt`, `isDeleted` (soft delete)

**Bảng con (không tạo mới trong F-050, kế thừa):** `co_sua_chua_dong_tau_attachment` (file đính kèm), `phe_duyet_lich_su` (lịch sử thay đổi — ghi TAO_MOI khi tạo).
