---
id: F-080
name: Quản lý Nhà trạm phao - Tạo mới
slug: quan-ly-nha-tram-phao-tao-moi
module-id: M-004
status: proposed
classification: local
priority: medium
created: 2026-07-07T03:32:42Z
last-updated: 2026-08-23
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Nhà trạm phao - Tạo mới

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-080
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng thường (không có bước phê duyệt) — người dùng có chọn "Lưu nháp" hoặc "Gửi phê duyệt"
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (Excel `HH_Tính năng & danh sách các trường thông tin.xlsx`, sheet `QL Nhà trạm phao tiêu`)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **"Điểm khác biệt so với mẫu chung"** (mục 5, dòng 3 — *"Lọc cha-con / theo đơn vị"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Cho phép cán bộ nghiệp vụ (operator) tạo mới một nhà trạm phao — công trình phục vụ neo giữ, bảo trì và vận hành các phao tiêu báo hiệu hàng hải. Người dùng nhập thông tin cơ bản (đơn vị quản lý, cảng biển, luồng hàng hải, mã tự sinh, tên, địa điểm, tình trạng), thông tin khác (diện tích, nhân sự, bảo trì), vị trí GIS và file đính kèm. Khi tạo, người dùng có thể lưu nháp (DRAFT) hoặc gửi phê duyệt ngay (PENDING_APPROVAL).

## 2. Trường dữ liệu

Bảng mô tả các trường trên form tạo mới/chỉnh sửa (nguồn: Excel sheet `QL Nhà trạm phao tiêu`):

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Đơn vị quản lý | Có | SelectOrgCode — chọn đơn vị trong phạm vi người dùng | Tự sinh theo orgUnitId của user khi tạo |
| 2 | Đơn vị khai thác | Có | SelectCateOther — danh mục đơn vị khác | |
| 3 | Thuộc cảng biển | Có | SelectKcht (CB) — chọn từ danh sách cảng biển | |
| 4 | Thuộc luồng hàng hải | Có | SelectKcht (LHH) — chọn từ danh sách luồng hàng hải | |
| 5 | Tuyến luồng hàng hải | Không | SelectKcht (LHH_TL) — chọn tuyến thuộc luồng đã chọn | Phụ thuộc luồng hàng hải |
| 6 | Mã nhà trạm | Có | Input (disabled, tự sinh NT-{seq}) | Hệ thống tự sinh, không cho nhập thủ công |
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
- Khi tạo mới, người dùng có 2 lựa chọn:
  - **Lưu nháp** → trạng thái `DRAFT` (mã ApprovalStatus = 0)
  - **Gửi phê duyệt** → trạng thái `PENDING_APPROVAL` (mã ApprovalStatus = 2), chuyển sang quy trình phê duyệt cấp 1 (F-083)
- Không có bước phê duyệt tự động — người dùng chủ động chọn hành động khi lưu.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-080-01 | Mã nhà trạm tự sinh theo định dạng `NT-{seq}` — hệ thống sinh khi tạo mới, không cho người dùng nhập | Create |
| BR-080-02 | Đơn vị quản lý bắt buộc khi tạo — nếu không chọn, hệ thống tự gán đơn vị của người dùng đang đăng nhập | Create |
| BR-080-03 | Tuyến luồng hàng hải chỉ hiển thị khi đã chọn luồng hàng hải (phụ thuộc) | Create |
| BR-080-04 | Khi chọn "Gửi phê duyệt", hệ thống chuyển trạng thái từ DRAFT → PENDING_APPROVAL và ghi nhật ký lịch sử hành động CREATE | Create |
| BR-080-05 | Validate: tên nhà trạm không được rỗng, đơn vị khai thác phải khác null, tình trạng phải được chọn | Create |
| BR-080-06 | Tọa độ GIS phải thuộc hệ quy chiếu WGS84 (nếu nhập) | Create |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-080-01** — Tạo mới thành công với đầy đủ trường bắt buộc: hệ thống lưu bản ghi, sinh mã NT-{seq}, trả về HTTP 201 + đối tượng vừa tạo.
- **AC-080-02** — Tạo mới với "Lưu nháp": hệ thống lưu với status=DRAFT, không gửi phê duyệt.
- **AC-080-03** — Tạo mới với "Gửi phê duyệt": hệ thống lưu với status=PENDING_APPROVAL, ghi audit log CREATE.
- **AC-080-04** — Bỏ trống trường bắt buộc: hệ thống hiển thị lỗi validation tiếng Việt, không lưu.
- **AC-080-05** — Upload file đính kèm: hệ thống lưu file, hiển thị bảng file đính kèm trong chi tiết.

### 4.3. User Stories kế thừa (nếu có)

- **US-080-01:** Là cán bộ nghiệp vụ, tôi muốn tạo mới nhà trạm phao với đầy đủ thông tin cơ bản, thông tin khác, vị trí GIS và file đính kèm để quản lý tài sản báo hiệu hàng hải.
- **US-080-02:** Là cán bộ nghiệp vụ, tôi muốn lưu nháp nhà trạm phao chưa hoàn thiện để tiếp tục chỉnh sửa sau.
- **US-080-03:** Là cán bộ nghiệp vụ, tôi muốn gửi nhà trạm phao vừa tạo lên phê duyệt ngay để đẩy nhanh quy trình.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Tạo mới nhà trạm phao | `nhatramphao:create` |
| Lưu nháp | `nhatramphao:create` |
| Gửi phê duyệt | `nhatramphao:submit` |

**Admin Cục:** Full quyền tạo mới + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — DRAFT, PENDING_APPROVAL (theo NhaTramStatus enum) |
| 2 | Có bước phê duyệt không | Có — người dùng chọn khi tạo (Lưu nháp / Gửi phê duyệt), phê duyệt 2 cấp (F-083) |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` (đơn vị quản lý) bắt buộc; đơn vị cha xem con, Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — Tuyến luồng hàng hải chỉ hiện khi đã chọn luồng hàng hải |
| 5 | Quyền riêng | `nhatramphao:create`, `nhatramphao:submit` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — file đính kèm (UploadFileTable) |
| 8 | Giao diện khác mẫu chung | Không — dùng chung ScreenHeader + FilterBar + StatusTabs + DataTable + Pagination từ list-view/ |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/nhatram-phao` | Tạo mới nhà trạm phao (với action: draft/submit) | `nhatramphao:create` |
| POST | `/api/v1/nhatram-phao/{id}/submit` | Gửi nhà trạm phao đã lưu nháp lên phê duyệt | `nhatramphao:submit` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `nha_tram_phao` (Nhà trạm phao):**
- `id` UUID PK 🔴
- `code` VARCHAR UNIQUE (NT-{seq}) 🔴
- `name` VARCHAR NOT NULL 🔴
- `orgUnitId` UUID NOT NULL FK (đơn vị quản lý) 🔴
- `operatingUnitId` UUID FK (đơn vị khai thác) 🔴
- `portId` UUID FK (thuộc cảng biển) 🔴
- `navigationChannelId` UUID FK (thuộc luồng hàng hải) 🔴
- `channelRouteId` UUID FK (tuyến luồng hàng hải) 🔴
- `locationProvince` VARCHAR 🔴
- `locationDetail` TEXT 🔴
- `constructionDate` DATE 🔴
- `status` SMALLINT NOT NULL DEFAULT 0 (DRAFT) 🔴
- `condition` VARCHAR NOT NULL (tình trạng) 🔴
- `totalArea` DECIMAL(10,2) 🔴
- `usableArea` DECIMAL(10,2) 🔴
- `staffCount` INT 🔴
- `lastMaintenanceYear` INT 🔴
- `notes` TEXT 🔴
- `objectType` VARCHAR (Điểm/Đường/Vùng) 🔴
- `symbol` VARCHAR 🔴
- `coordinateSystem` VARCHAR DEFAULT 'WGS84' 🔴
- `displayRule` TEXT 🔴
- `gisCoordinates` GEOMETRY (Point/Polygon/LineString) 🔴
- `createdBy` UUID FK 🔴
- `createdAt` TIMESTAMP NOT NULL 🔴
- `updatedBy` UUID FK 🔴
- `updatedAt` TIMESTAMP 🔴
- `deletedAt` TIMESTAMP (soft-delete) 🔴
