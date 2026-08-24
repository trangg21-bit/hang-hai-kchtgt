---
id: F-075
name: "Quản lý Phao tiêu - Cập nhật"
slug: quan-ly-phao-tieu-cap-nhat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:32Z"
last-updated: "2026-08-23"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Phao tiêu - Cập nhật

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-075
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng có bước phê duyệt
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (TKCT)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **"Điểm khác biệt so với mẫu chung"** (mục 5, dòng 3 — *"Lọc cha-con / theo đơn vị"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Cho phép người dùng cập nhật thông tin của một phao tiêu đã tồn tại. Các trường có thể thay đổi bao gồm: tên, địa điểm, tình trạng, phân loại, thông tin kỹ thuật (hình dáng, kết cấu, kích thước, đèn biển, đặc tính ánh sáng), tọa độ GIS, file đính kèm, thời điểm đưa vào sử dụng. Mã phao tiêu không thể thay đổi sau khi tạo. Nếu phao tiêu đã ở trạng thái đã phê duyệt (APPROVED_L1 / APPROVED_L2 / PUBLISHED), hệ thống tự động đưa về trạng thái DRAFT và yêu cầu phê duyệt lại. Hệ thống ghi lại lịch sử các thay đổi để truy vết.

## 2. Trường dữ liệu

Bảng mô tả các trường trên form tạo mới/chỉnh sửa:

| # | Tên trường (theo Excel) | Loại điều khiển | Bắt buộc | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Đơn vị quản lý (bắt buộc khi tạo) | SelectOrgCode | Có (khi tạo) | ✓ | ✓ | ✓ | ✓ | ✓ | Theo Data Scope Convention |
| 2 | Thuộc nhà trạm QLVH phao, tiêu (bắt buộc) | SelectKcht (ATHH, NT) | Có | ✓ | ✓ | ✓ | ✓ | ✓ | Liên kết nhà trạm |
| 3 | Phân loại | SelectAppParams | Không | | | ✓ | ✓ | ✓ | Tham chiếu AppParams |
| 4 | Phân loại phao | SelectAppParams | Không | | | ✓ | ✓ | ✓ | Tham chiếu AppParams |
| 5 | Phân loại tiêu | SelectAppParams | Không | | | ✓ | ✓ | ✓ | Tham chiếu AppParams |
| 6 | Mã phao, tiêu | Input (disabled, tự sinh {mã nhà trạm}-PT-{seq}) | Có | ✓ | ✓ | ✓ | ✓ | | Tự sinh, không cho sửa |
| 7 | Tên phao, tiêu (bắt buộc) | InputTextArea | Có | ✓ | ✓ | ✓ | ✓ | ✓ | Tối đa 200 ký tự |
| 8 | Địa điểm (Tỉnh/TP) | SelectCateOther | Có | ✓ | ✓ | ✓ | ✓ | ✓ | Tỉnh/thành phố |
| 9 | Địa điểm chi tiết | InputTextArea | Không | | | ✓ | ✓ | ✓ | |
| 10 | Tình trạng (bắt buộc) | SelectAppParams | Có | ✓ | ✓ | ✓ | ✓ | ✓ | Tham chiếu AppParams |
| 11 | Hình dáng | InputTextArea | Không | | | ✓ | ✓ | ✓ | |
| 12 | Kết cấu | InputTextArea | Không | | | ✓ | ✓ | ✓ | |
| 13 | Diện tích (m²) | InputDecimal | Không | | | ✓ | ✓ | ✓ | |
| 14 | Chiều cao thân phao (m) | InputDecimal | Không | | | ✓ | ✓ | ✓ | |
| 15 | Đường kính phao (m) | InputDecimal | Không | | | ✓ | ✓ | ✓ | |
| 16 | Đèn biển | SelectAppParams | Không | | | ✓ | ✓ | ✓ | |
| 17 | Chiều cao tháp đèn | InputDecimal | Không | | | ✓ | ✓ | ✓ | |
| 18 | Chiều cao tâm sáng (hải đồ) (bắt buộc) | InputDecimal | Có | | | ✓ | ✓ | ✓ | |
| 19 | Chủng loại đèn (Thiết bị báo hiệu) | Input | Không | | | ✓ | ✓ | ✓ | |
| 20 | Màu sắc bên ngoài của tháp đèn | InputTextArea | Không | | | ✓ | ✓ | ✓ | |
| 21 | Nguồn cung cấp năng lượng cho đèn | InputTextArea | Không | | | ✓ | ✓ | ✓ | |
| 22 | Phạm vi chiếu sáng | Input | Không | | | ✓ | ✓ | ✓ | |
| 23 | Thời điểm đưa vào sử dụng | DatePicker | Không | | | ✓ | ✓ | ✓ | |
| 24 | Thời điểm sửa chữa gần nhất | DatePicker | Không | | | ✓ | | | Chỉ hiển thị chi tiết |
| 25 | Màu sắc | Input | Không | | | ✓ | ✓ | ✓ | |
| 26 | Kiểu chớp | Input | Không | | | ✓ | ✓ | ✓ | |
| 27 | Chu kỳ | Input | Không | | | ✓ | ✓ | ✓ | |
| 28 | Tọa độ GIS | LocationInformationForm | Không | | | ✓ | ✓ | ✓ | GIS 5 trường (xem mục 7) |
| 29 | Loại đối tượng | Select (Điểm/Đường/Vùng) | Không | | | ✓ | ✓ | ✓ | GIS |
| 30 | Biểu tượng | Select | Không | | | ✓ | ✓ | ✓ | GIS |
| 31 | Hệ quy chiếu | Text | Không | | | ✓ | ✓ | ✓ | GIS |
| 32 | Quy tắc hiển thị | Text | Không | | | ✓ | ✓ | ✓ | GIS |
| 33 | File đính kèm | UploadFileTable | Không | | | ✓ | ✓ | ✓ | |
| 34 | Trạng thái | Badge (read-only) | Có | ✓ | ✓ | ✓ | | | Chỉ hiển thị, không chỉnh sửa |
| 35 | Ngày cập nhật | Text (read-only) | Có | ✓ | ✓ | ✓ | | | Chỉ hiển thị |
| 36 | Cán bộ cập nhật | Text (read-only) | Có | | ✓ | ✓ | | | Chỉ hiển thị |
| 37 | Ngày gửi phê duyệt | Text (read-only) | Có | | | ✓ | | | Chỉ hiển thị |
| 38 | Cán bộ gửi phê duyệt | Text (read-only) | Có | | | ✓ | | | Chỉ hiển thị |
| 39 | Ngày phê duyệt cấp Cảng vụ/Chi cục | Text (read-only) | Có | | | ✓ | | | Chỉ hiển thị |
| 40 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | Text (read-only) | Có | | | ✓ | | | Chỉ hiển thị |
| 41 | Nội dung phê duyệt | Text (read-only) | Không | | | ✓ | | | Chỉ hiển thị |
| 42 | Ngày phê duyệt cấp Cục | Text (read-only) | Có | | | ✓ | | | Chỉ hiển thị |
| 43 | Cán bộ phê duyệt cấp Cục | Text (read-only) | Có | | | ✓ | | | Chỉ hiển thị |
| 44 | Nội dung phê duyệt | Text (read-only) | Không | | | ✓ | | | Chỉ hiển thị |
| 45 | Thông tin vận hành khai thác | — | — | | | ✓ | | | Khối read-only (mã/tên/khởi kết thúc kế hoạch) |
| 46 | Thông tin bảo trì | — | — | | | ✓ | | | Khối read-only (mã/tên/khởi kết thúc kế hoạch) |
| 47 | Thông tin sự cố | — | — | | | ✓ | | | Khối read-only (mã sự cố, loại, địa điểm, thời gian) |

## 3. Trạng thái và phê duyệt

- Quy trình phê duyệt 2 cấp theo `ba/00-lean-spec.md` mục 3.7.
- 7 trạng thái (lưu dạng số trong DB): DRAFT (0), PENDING_APPROVAL (1), APPROVED_L1 (2), APPROVED_L2 (3), PUBLISHED (4), REJECTED (5), DELETED (6).
- Nếu phao tiêu đang ở trạng thái đã phê duyệt (APPROVED_L1 / APPROVED_L2 / PUBLISHED), sau khi cập nhật tự động hạ về **DRAFT** và yêu cầu phê duyệt lại.
- Người phê duyệt không thể phê duyệt bản ghi do chính mình tạo (4-eyes principle).
- Từ chối yêu cầu lý do ≥ 10 ký tự → quay về DRAFT.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-075-01 | Mã phao tiêu không được phép thay đổi sau khi tạo (immutable) | Update |
| BR-075-02 | Tên phao tiêu bắt buộc, tối đa 200 ký tự | Update |
| BR-075-03 | Địa điểm (Tỉnh/TP) bắt buộc khi cập nhật | Update |
| BR-075-04 | Tình trạng bắt buộc khi cập nhật | Update |
| BR-075-05 | Chiều cao tâm sáng (hải đồ) bắt buộc, giá trị số > 0 | Update |
| BR-075-06 | Nếu phao tiêu đã được phê duyệt (APPROVED_L1/APPROVED_L2/PUBLISHED), sau khi cập nhật tự động hạ về DRAFT và yêu cầu phê duyệt lại | Update |
| BR-075-07 | Không thể cập nhật phao tiêu đã bị xóa (status = DELETED) | Update |
| BR-075-08 | Đơn vị quản lý phải nằm trong phạm vi quyền của người cập nhật (Data Scope) | Update |
| BR-075-09 | Tọa độ GIS hợp lệ (WGS84) khi nhập | Update |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-075-01** — Cập nhật thành công: Người dùng cập nhật các trường thông tin của phao tiêu — hệ thống trả về HTTP 200 và thông tin đã cập nhật.
- **AC-075-02** — Mã code immutable: Hệ thống từ chối cập nhật nếu mã code được gửi trong request — code là trường không thể thay đổi.
- **AC-075-03** — Tự động hạ trạng thái: Nếu phao tiêu đã được phê duyệt, sau khi cập nhật status tự động chuyển về DRAFT và approvalStatus về PENDING.
- **AC-075-04** — Không cập nhật bản đã xóa: Hệ thống từ chối cập nhật nếu phao tiêu đã bị xóa (status = DELETED).
- **AC-075-05** — Ghi lịch sử: Sau khi cập nhật, lịch sử được ghi với actionType = UPDATE và danh sách các trường thay đổi.

### 4.3. User Stories kế thừa (nếu có)

- **US-075-01:** Là operator, tôi muốn cập nhật thông tin kỹ thuật của phao tiêu khi có thay đổi về thông số (màu sắc, hình dáng, đặc tính ánh sáng).
- **US-075-02:** Là operator, tôi muốn hệ thống tự động đưa phao tiêu về DRAFT khi sửa phao tiêu đã được phê duyệt để đảm bảo mọi thay đổi đều trải qua kiểm duyệt.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Tạo mới phao tiêu | `buoy:create` |
| Xem danh sách phao tiêu | `buoy:read` |
| Xem chi tiết phao tiêu | `buoy:read` |
| Cập nhật phao tiêu | `buoy:update` |
| Xóa phao tiêu | `buoy:delete` |
| Gửi phê duyệt phao tiêu | `buoy:submit` |
| Phê duyệt phao tiêu | `buoy:approve` |

**Admin Cục:** Full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 7 trạng thái: DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, REJECTED, DELETED |
| 2 | Có bước phê duyệt không | Có — 2 cấp (C1: Cảng vụ/Chi cục, C2: Cục); tự động hạ về DRAFT khi sửa phao đã phê duyệt |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` bắt buộc khi tạo, validate phạm vi theo `OrgUnitScopeService` |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — khối vận hành/bảo trì/sự cố chỉ hiển thị read-only ở trang chi tiết |
| 5 | Quyền riêng | `buoy:create`, `buoy:read`, `buoy:update`, `buoy:delete`, `buoy:submit`, `buoy:approve` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — File đính kèm (UploadFileTable) |
| 8 | Giao diện khác mẫu chung | Có — Mã tự sinh `{mã nhà trạm}-PT-{seq}`, GIS 5 trường, khối read-only vận hành/bảo trì/sự cố |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/buoys` | Tạo mới phao tiêu | `buoy:create` |
| POST | `/api/v1/buoys/{id}/submit-approval` | Gửi phê duyệt phao tiêu | `buoy:submit` |
| GET | `/api/v1/buoys` | Danh sách phao tiêu (phân trang, lọc) | `buoy:read` |
| GET | `/api/v1/buoys/{id}` | Xem chi tiết phao tiêu | `buoy:read` |
| PUT | `/api/v1/buoys/{id}` | Cập nhật phao tiêu | `buoy:update` |
| DELETE | `/api/v1/buoys/{id}` | Xóa mềm phao tiêu | `buoy:delete` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `buoy` (Phao tiêu):**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| id | UUID | Có | Primary key |
| code | VARCHAR(50) | Có | Mã tự sinh `{mã nhà trạm}-PT-{seq}`, unique, immutable |
| name | VARCHAR(200) | Có | Tên phao, tiêu |
| orgUnitId | UUID | Có | Đơn vị quản lý (Data Scope) |
| nhaTramId | UUID | Có | Thuộc nhà trạm QLVH |
| classification | VARCHAR(50) | Không | Phân loại |
| buoyClassification | VARCHAR(50) | Không | Phân loại phao |
| beaconClassification | VARCHAR(50) | Không | Phân loại tiêu |
| locationProvince | VARCHAR(100) | Có | Địa điểm (Tỉnh/TP) |
| locationDetail | TEXT | Không | Địa điểm chi tiết |
| status | TINYINT | Có | Tình trạng (AppParams) |
| shape | TEXT | Không | Hình dáng |
| structure | TEXT | Không | Kết cấu |
| area | DECIMAL(10,2) | Không | Diện tích (m²) |
| bodyHeight | DECIMAL(8,2) | Không | Chiều cao thân phao (m) |
| diameter | DECIMAL(8,2) | Không | Đường kính phao (m) |
| lightId | VARCHAR(50) | Không | Đèn biển (AppParams) |
| towerHeight | DECIMAL(8,2) | Không | Chiều cao tháp đèn |
| lightCenterHeight | DECIMAL(8,2) | Có | Chiều cao tâm sáng (hải đồ) |
| lightType | VARCHAR(100) | Không | Chủng loại đèn |
| towerColor | TEXT | Không | Màu sắc bên ngoài tháp đèn |
| powerSource | TEXT | Không | Nguồn cung cấp năng lượng |
| lightingRange | VARCHAR(50) | Không | Phạm vi chiếu sáng |
| commissioningDate | DATE | Không | Thời điểm đưa vào sử dụng |
| lastRepairDate | DATE | Không | Thời điểm sửa chữa gần nhất |
| color | VARCHAR(50) | Không | Màu sắc |
| flashPattern | VARCHAR(50) | Không | Kiểu chớp |
| cycle | VARCHAR(50) | Không | Chu kỳ |
| isActive | BOOLEAN | Không | Trạng thái hoạt động |
| statusEnum | TINYINT | Có | DRAFT/PENDING_APPROVAL/APPROVED_L1/APPROVED_L2/PUBLISHED/REJECTED/DELETED |
| approvalStatus | TINYINT | Có | ApprovalStatus enum |
| approvalLevel | TINYINT | Không | Cấp phê duyệt hiện tại |
| approvedBy | UUID | Không | Người phê duyệt |
| approvedDate | TIMESTAMP | Không | Ngày phê duyệt |
| rejectionReason | TEXT | Không | Lý do từ chối |
| createdAt | TIMESTAMP | Có | Thời gian tạo |
| createdBy | UUID | Có | Người tạo |
| updatedAt | TIMESTAMP | Có | Thời gian cập nhật |
| updatedBy | UUID | Không | Người cập nhật |
| deletedAt | TIMESTAMP | Không | Xóa mềm (soft-delete) |
| deletedBy | UUID | Không | Người xóa |

**GIS 5 trường (đồng bộ với M-007 `point_objects`):**

| Trường | Kiểu | Ghi chú |
|---|---|---|
| latitude | DECIMAL(10,7) | Vĩ độ WGS84 |
| longitude | DECIMAL(10,7) | Kinh độ WGS84 |
| objectType | VARCHAR(20) | Điểm/Đường/Vùng |
| symbol | VARCHAR(50) | Biểu tượng |
| coordinateSystem | VARCHAR(50) | Hệ quy chiếu |
| displayRule | TEXT | Quy tắc hiển thị |

**Khối read-only vận hành/bảo trì/sự cố:** Hiển thị từ các bảng kế hoạch, bảo trì, sự cố liên kết qua FK — không chỉnh sửa trực tiếp trên form tạo/sửa phao tiêu.
