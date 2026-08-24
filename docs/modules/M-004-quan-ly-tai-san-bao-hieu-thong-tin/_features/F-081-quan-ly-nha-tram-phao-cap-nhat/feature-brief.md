---
id: F-081
name: Quản lý Nhà trạm phao - Cập nhật
slug: quan-ly-nha-tram-phao-cap-nhat
module-id: M-004
status: proposed
classification: local
priority: medium
created: 2026-07-07T03:32:42Z
last-updated: 2026-08-23
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Nhà trạm phao - Cập nhật

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-081
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng thường (không có bước phê duyệt) — cập nhật thông tin nhà trạm phao
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (Excel `HH_Tính năng & danh sách các trường thông tin.xlsx`, sheet `QL Nhà trạm phao tiêu`)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **"Điểm khác biệt so với mẫu chung"** (mục 5, dòng 3 — *"Lọc cha-con / theo đơn vị"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Cho phép cán bộ nghiệp vụ (operator) cập nhật thông tin của nhà trạm phao đã tồn tại. Người dùng chọn nhà trạm phao từ danh sách, mở popup chỉnh sửa, sửa các trường thông tin cơ bản, thông tin khác, vị trí GIS và file đính kèm. Hệ thống ghi nhận lịch sử thay đổi (audit log) cho mọi trường được sửa đổi. Không thể cập nhật nhà trạm phao đã bị xóa mềm (DELETED).

## 2. Trường dữ liệu

Bảng mô tả các trường trên form cập nhật (nguồn: Excel sheet `QL Nhà trạm phao tiêu`, cột "Sửa"):

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Đơn vị quản lý | Có | SelectOrgCode — chọn đơn vị trong phạm vi người dùng | Không cho đổi đơn vị nếu đã phê duyệt |
| 2 | Đơn vị khai thác | Có | SelectCateOther — danh mục đơn vị khác | |
| 3 | Thuộc cảng biển | Có | SelectKcht (CB) — chọn từ danh sách cảng biển | |
| 4 | Thuộc luồng hàng hải | Có | SelectKcht (LHH) — chọn từ danh sách luồng hàng hải | |
| 5 | Tuyến luồng hàng hải | Không | SelectKcht (LHH_TL) — chọn tuyến thuộc luồng đã chọn | Phụ thuộc luồng hàng hải |
| 6 | Mã nhà trạm | Có | Input (disabled, tự sinh NT-{seq}) | Không cho sửa mã |
| 7 | Tên nhà trạm | Có | InputTextArea | Bắt buộc, không rỗng |
| 8 | Địa điểm (Tỉnh/TP) | Có | SelectCateOther — danh mục địa lý | |
| 9 | Địa điểm chi tiết | Không | InputTextArea | |
| 10 | Thời điểm xây dựng | Không | DatePicker | |
| 11 | Tình trạng | Có | SelectAppParams — danh mục tham số ứng dụng | |
| 12 | Tổng diện tích (m²) | Không | InputDecimal | |
| 13 | Diện tích sử dụng (m²) | Không | InputDecimal | |
| 14 | Số lượng nhân sự bố trí | Không | Input — số nguyên | |
| 15 | Năm bảo trì gần nhất | Không | DatePicker (năm) | |
| 16 | Ghi chú | Không | InputTextArea | |
| 17 | Loại đối tượng | Không | Select (Điểm/Đường/Vùng) | GIS |
| 18 | Biểu tượng | Không | Select — chọn biểu tượng GIS | |
| 19 | Hệ quy chiếu | Không | Text | Mặc định WGS84 |
| 20 | Quy tắc hiển thị | Không | Text | |
| 21 | Tọa độ GIS | Không | LocationInformationForm — chọn trên bản đồ | |
| 22 | File đính kèm | Không | UploadFileTable — bảng upload nhiều file | |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.7 (trạng thái lưu dạng số, không lưu chữ).
- Cập nhật **không làm thay đổi trạng thái phê duyệt** — nhà trạm phao vẫn giữ nguyên status (DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, REJECTED).
- Không có bước phê duyệt tự động khi cập nhật — chỉ ghi nhận lịch sử thay đổi.
- Nếu nhà trạm phao đang ở trạng thái DRAFT, người dùng có thể cập nhật và tiếp tục gửi phê duyệt (F-080).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-081-01 | Không thể cập nhật nhà trạm phao đã xóa mềm (status=DELETED) | Update |
| BR-081-02 | Mã nhà trạm không cho sửa — đã sinh tự sinh thì giữ nguyên | Update |
| BR-081-03 | Khi cập nhật, hệ thống ghi audit log: changedField, previousValue, newValue, changedBy, changedAt | Update |
| BR-081-04 | Tuyến luồng hàng hải chỉ hiển thị khi đã chọn luồng hàng hải (phụ thuộc) | Update |
| BR-081-05 | Validate: tên nhà trạm không được rỗng, đơn vị khai thác phải khác null, tình trạng phải được chọn | Update |
| BR-081-06 | Chỉ người có quyền `nhatramphao:update` mới được cập nhật | Update |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-081-01** — Cập nhật thành công: hệ thống lưu thay đổi, trả về HTTP 200 + đối tượng đã cập nhật.
- **AC-081-02** — Không có thay đổi: hệ thống trả về HTTP 200, không ghi audit log.
- **AC-081-03** — Bỏ trống trường bắt buộc: hệ thống hiển thị lỗi validation tiếng Việt, không lưu.
- **AC-081-04** — Nhà trạm phao đã xóa mềm: hệ thống trả về HTTP 404 + thông báo "Nhà trạm phao đã bị xóa".
- **AC-081-05** — Audit log: hệ thống ghi nhận từng trường thay đổi (trước/sau, ai sửa, khi nào).

### 4.3. User Stories kế thừa (nếu có)

- **US-081-01:** Là cán bộ nghiệp vụ, tôi muốn cập nhật thông tin nhà trạm phao đã tạo để giữ dữ liệu luôn chính xác và cập nhật.
- **US-081-02:** Là cán bộ nghiệp vụ, tôi muốn hệ thống tự động ghi nhận lịch sử thay đổi khi cập nhật để đảm bảo tính kiểm toán.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Cập nhật nhà trạm phao | `nhatramphao:update` |

**Admin Cục:** Full quyền cập nhật + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — giữ nguyên trạng thái hiện tại khi cập nhật |
| 2 | Có bước phê duyệt không | Không — cập nhật không yêu cầu phê duyệt lại |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — chỉ cập nhật được nhà trạm phao thuộc đơn vị mình quản lý hoặc đơn vị con |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — Tuyến luồng hàng hải chỉ hiện khi đã chọn luồng hàng hải |
| 5 | Quyền riêng | `nhatramphao:update` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — file đính kèm (UploadFileTable) |
| 8 | Giao diện khác mẫu chung | Không — dùng chung popup modal form pattern từ UsersPage.tsx |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/nhatram-phao/{id}` | Lấy thông tin chi tiết nhà trạm phao để hiển thị form | `nhatramphao:read` |
| PUT | `/api/v1/nhatram-phao/{id}` | Cập nhật nhà trạm phao | `nhatramphao:update` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `nha_tram_phao` (Nhà trạm phao):**
- `id` UUID PK
- `code` VARCHAR UNIQUE (NT-{seq}) — không cho sửa
- `name` VARCHAR NOT NULL
- `orgUnitId` UUID NOT NULL FK (đơn vị quản lý)
- `operatingUnitId` UUID FK (đơn vị khai thác)
- `portId` UUID FK (thuộc cảng biển)
- `navigationChannelId` UUID FK (thuộc luồng hàng hải)
- `channelRouteId` UUID FK (tuyến luồng hàng hải)
- `locationProvince` VARCHAR
- `locationDetail` TEXT
- `constructionDate` DATE
- `status` SMALLINT NOT NULL DEFAULT 0 (DRAFT)
- `condition` VARCHAR NOT NULL (tình trạng)
- `totalArea` DECIMAL(10,2)
- `usableArea` DECIMAL(10,2)
- `staffCount` INT
- `lastMaintenanceYear` INT
- `notes` TEXT
- `objectType` VARCHAR (Điểm/Đường/Vùng)
- `symbol` VARCHAR
- `coordinateSystem` VARCHAR DEFAULT 'WGS84'
- `displayRule` TEXT
- `gisCoordinates` GEOMETRY (Point/Polygon/LineString)
- `updatedBy` UUID FK — ghi khi cập nhật
- `updatedAt` TIMESTAMP — ghi khi cập nhật
- `deletedAt` TIMESTAMP (soft-delete)
