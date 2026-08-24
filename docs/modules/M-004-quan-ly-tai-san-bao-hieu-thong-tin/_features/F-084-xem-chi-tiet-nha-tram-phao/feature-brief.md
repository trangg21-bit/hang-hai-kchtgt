---
id: F-084
name: Xem chi tiết Nhà trạm phao
slug: xem-chi-tiet-nha-tram-phao
module-id: M-004
status: proposed
classification: local
priority: medium
created: 2026-07-07T03:32:42Z
last-updated: 2026-08-23
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Xem chi tiết Nhà trạm phao

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-084
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng thường (không có bước phê duyệt) — xem toàn bộ thông tin nhà trạm phao
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (Excel `HH_Tính năng & danh sách các trường thông tin.xlsx`, sheet `QL Nhà trạm phao tiêu`)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **"Điểm khác biệt so với mẫu chung"** (mục 5, dòng 3 — *"Lọc cha-con / theo đơn vị"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Cho phép mọi người dùng có quyền `nhatramphao:read` xem toàn bộ thông tin chi tiết của một nhà trạm phao đã tồn tại. Màn hình hiển thị đầy đủ các nhóm thông tin: thông tin cơ bản, thông tin khác, vị trí GIS, file đính kèm, trạng thái & kiểm toán, danh sách phao tiêu liên kết, thông tin vận hành khai thác, thông tin bảo trì và thông tin sự cố. Tất cả các trường đều ở chế độ read-only. Người dùng có thể chuyển đến các thao tác chỉnh sửa (F-081), phê duyệt (F-083) hoặc xóa (F-082) từ màn hình chi tiết.

## 2. Trường dữ liệu

Bảng mô tả các trường hiển thị trên màn hình chi tiết (nguồn: Excel sheet `QL Nhà trạm phao tiêu`, cột "Xem chi tiết"):

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Đơn vị quản lý | Có | Text (read-only) | Hiển thị tên đơn vị từ orgUnitId |
| 2 | Đơn vị khai thác | Có | Text (read-only) | |
| 3 | Thuộc cảng biển | Có | Text (read-only) | |
| 4 | Thuộc luồng hàng hải | Có | Text (read-only) | |
| 5 | Tuyến luồng hàng hải | Không | Text (read-only) | |
| 6 | Mã nhà trạm | Có | Text (read-only) | NT-{seq} |
| 7 | Tên nhà trạm | Có | Text (read-only) | |
| 8 | Địa điểm (Tỉnh/TP) | Có | Text (read-only) | |
| 9 | Địa điểm chi tiết | Không | Text (read-only) | |
| 10 | Thời điểm xây dựng | Không | Text (read-only) | |
| 11 | Tình trạng | Có | Text (read-only) | |
| 12 | Tổng diện tích (m²) | Không | Text (read-only) | |
| 13 | Diện tích sử dụng (m²) | Không | Text (read-only) | |
| 14 | Số lượng nhân sự bố trí | Không | Text (read-only) | |
| 15 | Năm bảo trì gần nhất | Không | Text (read-only) | |
| 16 | Ghi chú | Không | Text (read-only) | |
| 17 | Loại đối tượng | Không | Text (read-only) | GIS |
| 18 | Biểu tượng | Không | Text (read-only) | |
| 19 | Hệ quy chiếu | Không | Text (read-only) | |
| 20 | Quy tắc hiển thị | Không | Text (read-only) | |
| 21 | Tọa độ GIS | Không | Map/LocationInformationForm (read-only) | Hiển thị trên bản đồ |
| 22 | File đính kèm | Không | FileTable (read-only) | Bảng file đính kèm |
| 23 | Trạng thái | Có | Badge (read-only) | DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, REJECTED, DELETED |
| 24 | Ngày cập nhật | Có | Text (read-only) | |
| 25 | Cán bộ cập nhật | Có | Text (read-only) | |
| 26 | Ngày gửi phê duyệt | Có | Text (read-only) | |
| 27 | Cán bộ gửi phê duyệt | Có | Text (read-only) | |
| 28 | Ngày phê duyệt cấp Cảng vụ/Chi cục | Có | Text (read-only) | Cấp 1 |
| 29 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | Có | Text (read-only) | Cấp 1 |
| 30 | Nội dung phê duyệt cấp Cảng vụ/Chi cục | Không | Text (read-only) | Cấp 1 |
| 31 | Ngày phê duyệt cấp Cục | Có | Text (read-only) | Cấp 2 |
| 32 | Cán bộ phê duyệt cấp Cục | Có | Text (read-only) | Cấp 2 |
| 33 | Nội dung phê duyệt cấp Cục | Không | Text (read-only) | Cấp 2 |
| 34 | Phân loại | Có | Text (read-only) | Danh sách phao tiêu |
| 35 | Phân loại phao | Có | Text (read-only) | |
| 36 | Phân loại tiêu | Có | Text (read-only) | |
| 37 | Mã phao, tiêu | Không | Text (read-only) | |
| 38 | Tên phao, tiêu | Không | Text (read-only) | |
| 39 | Mã kế hoạch vận hành | Không | Text (read-only) | |
| 40 | Tên kế hoạch vận hành | Không | Text (read-only) | |
| 41 | Ngày bắt đầu vận hành | Không | Text (read-only) | |
| 42 | Ngày kết thúc vận hành | Không | Text (read-only) | |
| 43 | Mã kế hoạch bảo trì | Không | Text (read-only) | |
| 44 | Tên kế hoạch bảo trì | Không | Text (read-only) | |
| 45 | Thời gian bắt đầu bảo trì | Không | Text (read-only) | |
| 46 | Thời gian kết thúc bảo trì | Không | Text (read-only) | |
| 47 | Mã sự cố | Không | Text (read-only) | |
| 48 | Loại sự cố | Không | Text (read-only) | |
| 49 | Địa điểm sự cố | Không | Text (read-only) | |
| 50 | Thời gian sự cố | Không | Text (read-only) | |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.7 (trạng thái lưu dạng số, không lưu chữ).
- Màn hình chi tiết hiển thị badge trạng thái tương ứng màu sắc:
  - DRAFT (xám), PENDING_APPROVAL (vàng), APPROVED_L1 (xanh dương), APPROVED_L2 (xanh lá), PUBLISHED (xanh đậm), REJECTED (đỏ), DELETED (xám đậm)
- Không có thao tác phê duyệt trực tiếp trên màn hình chi tiết — chuyển đến F-083 để phê duyệt.
- Tất cả các trường ở chế độ read-only — không cho chỉnh sửa trực tiếp.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-084-01 | Chỉ hiển thị thông tin nhà trạm phao thuộc phạm vi người dùng (data scope) | Read |
| BR-084-02 | Admin Cục xem thêm metadata: người tạo, người sửa, thời gian tạo/cập nhật | Read |
| BR-084-03 | Danh sách phao tiêu liên kết hiển thị read-only từ bảng phao tiêu | Read |
| BR-084-04 | Thông tin vận hành, bảo trì, sự cố hiển thị read-only từ các bảng liên quan | Read |
| BR-084-05 | File đính kèm hiển thị bảng file với nút tải xuống | Read |
| BR-084-06 | Tọa độ GIS hiển thị trên bản đồ (nếu có) | Read |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-084-01** — Xem chi tiết thành công: hệ thống trả về HTTP 200 + toàn bộ thông tin nhà trạm phao.
- **AC-084-02** — Nhà trạm phao không tồn tại: hệ thống trả về HTTP 404 + thông báo "Không tìm thấy nhà trạm phao".
- **AC-084-03** — Không có quyền: hệ thống trả về HTTP 403 Forbidden.
- **AC-084-04** — Admin Cục: hệ thống hiển thị thêm metadata người tạo/người sửa/thời gian tạo/cập nhật.
- **AC-084-05** — Badge trạng thái: hệ thống hiển thị badge màu đúng theo trạng thái hiện tại.

### 4.3. User Stories kế thừa (nếu có)

- **US-084-01:** Là người dùng có quyền, tôi muốn xem toàn bộ thông tin chi tiết của nhà trạm phao để nắm rõ dữ liệu trước khi thực hiện thao tác chỉnh sửa hoặc phê duyệt.
- **US-084-02:** Là Admin Cục, tôi muốn xem thêm metadata người tạo/người sửa/thời gian để phục vụ công tác kiểm tra, giám sát.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem chi tiết nhà trạm phao | `nhatramphao:read` |

**Admin Cục:** Full quyền xem + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — hiển thị badge trạng thái với 7 màu tương ứng |
| 2 | Có bước phê duyệt không | Không — chỉ xem, không phê duyệt trực tiếp |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — chỉ xem được nhà trạm phao thuộc đơn vị mình quản lý hoặc đơn vị con |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — Danh sách phao tiêu, vận hành, bảo trì, sự cố chỉ hiện khi có dữ liệu liên quan |
| 5 | Quyền riêng | `nhatramphao:read` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không — chỉ hiển thị file đính kèm đã có |
| 8 | Giao diện khác mẫu chung | Có — hiển thị bản đồ GIS + bảng file đính kèm + timeline phê duyệt |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/nhatram-phao/{id}` | Lấy thông tin chi tiết nhà trạm phao | `nhatramphao:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `nha_tram_phao` (Nhà trạm phao):**
- `id` UUID PK
- `code` VARCHAR UNIQUE (NT-{seq})
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
- `approvalLevel` SMALLINT DEFAULT 0 (LEVEL_0)
- `approvedByL1` UUID FK
- `approvedAtL1` TIMESTAMP
- `approvalNoteL1` TEXT
- `approvedByL2` UUID FK
- `approvedAtL2` TIMESTAMP
- `approvalNoteL2` TEXT
- `rejectionReason` TEXT
- `createdBy` UUID FK
- `createdAt` TIMESTAMP NOT NULL
- `updatedBy` UUID FK
- `updatedAt` TIMESTAMP
- `deletedAt` TIMESTAMP (soft-delete)

**Bảng `nha_tram_phao_buoy` (Danh sách phao tiêu liên kết):**
- `id` UUID PK 🔴
- `nhaTramPhaoId` UUID NOT NULL FK 🔴
- `buoyId` UUID NOT NULL FK 🔴
- `classification` VARCHAR 🔴
- `buoyClassification` VARCHAR 🔴
- `buoyMarkClassification` VARCHAR 🔴
- `buoyCode` VARCHAR 🔴
- `buoyName` VARCHAR 🔴

**Bảng `nha_tram_phao_operation` (Thông tin vận hành khai thác):**
- `id` UUID PK 🔴
- `nhaTramPhaoId` UUID NOT NULL FK 🔴
- `planCode` VARCHAR 🔴
- `planName` VARCHAR 🔴
- `startDate` DATE 🔴
- `endDate` DATE 🔴

**Bảng `nha_tram_phao_maintenance` (Thông tin bảo trì):**
- `id` UUID PK 🔴
- `nhaTramPhaoId` UUID NOT NULL FK 🔴
- `planCode` VARCHAR 🔴
- `planName` VARCHAR 🔴
- `startTime` TIMESTAMP 🔴
- `endTime` TIMESTAMP 🔴

**Bảng `nha_tram_phao_incident` (Thông tin sự cố):**
- `id` UUID PK 🔴
- `nhaTramPhaoId` UUID NOT NULL FK 🔴
- `incidentCode` VARCHAR 🔴
- `incidentType` VARCHAR 🔴
- `location` VARCHAR 🔴
- `incidentTime` TIMESTAMP 🔴
