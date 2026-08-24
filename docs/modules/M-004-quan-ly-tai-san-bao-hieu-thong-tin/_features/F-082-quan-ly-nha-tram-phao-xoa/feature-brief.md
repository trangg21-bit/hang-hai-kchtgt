---
id: F-082
name: Quản lý Nhà trạm phao - Xóa
slug: quan-ly-nha-tram-phao-xoa
module-id: M-004
status: proposed
classification: local
priority: medium
created: 2026-07-07T03:32:42Z
last-updated: 2026-08-23
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Nhà trạm phao - Xóa

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-082
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng thường (không có bước phê duyệt) — xóa mềm nhà trạm phao
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (Excel `HH_Tính năng & danh sách các trường thông tin.xlsx`, sheet `QL Nhà trạm phao tiêu`)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **"Điểm khác biệt so với mẫu chung"** (mục 5, dòng 3 — *"Lọc cha-con / theo đơn vị"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Cho phép cán bộ nghiệp vụ (operator) xóa mềm (soft-delete) một nhà trạm phao đã tồn tại. Xóa mềm giữ lại bản ghi trong cơ sở dữ liệu nhưng đánh dấu `deletedAt` và loại bỏ khỏi danh sách hiển thị mặc định. Người dùng phải xác nhận trước khi xóa. Hệ thống ghi nhận lịch sử thay đổi (audit log) với action type `SOFT_DELETE`. Không thể xóa nhà trạm phao đã bị xóa mềm.

## 2. Trường dữ liệu

Không có trường dữ liệu nhập vào — đây là thao tác xóa mềm, chỉ cần `id` của nhà trạm phao.

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | ID nhà trạm phao | Có | UUID — từ danh sách hoặc chi tiết | Không có form nhập, hệ thống truyền từ UI |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.7 (trạng thái lưu dạng số, không lưu chữ).
- Xóa mềm chuyển trạng thái thành `DELETED` (mã ApprovalStatus = 6) và ghi `deletedAt`.
- Nhà trạm phao đã xóa mềm không hiển thị trong danh sách mặc định (có bộ lọc "Tất cả" để xem cả đã xóa).
- Không có bước phê duyệt cho thao tác xóa mềm — người dùng xác nhận trực tiếp trên UI.
- Nhà trạm phao đã xóa mềm không thể xóa lại — chỉ có thể khôi phục (nếu có tính năng khôi phục, thuộc feature khác).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-082-01 | Xóa mềm — không xóa bản ghi khỏi DB, chỉ đánh dấu `deletedAt` và chuyển status=DELETED | Delete |
| BR-082-02 | Không thể xóa nhà trạm phao đã xóa mềm (status=DELETED) — hệ thống trả về lỗi | Delete |
| BR-082-03 | Không thể xóa nhà trạm phao đang trong trạng thái PENDING_APPROVAL — phải hủy gửi phê duyệt trước | Delete |
| BR-082-04 | Khi xóa, hệ thống ghi audit log với actionType=SOFT_DELETE, changedBy, changedAt | Delete |
| BR-082-05 | Chỉ người có quyền `nhatramphao:delete` mới được xóa | Delete |
| BR-082-06 | Chỉ xóa được nhà trạm phao thuộc đơn vị mình quản lý hoặc đơn vị con (data scope) | Delete |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-082-01** — Xóa mềm thành công: hệ thống chuyển status=DELETED, ghi deletedAt, trả về HTTP 200.
- **AC-082-02** — Nhà trạm phao đã xóa mềm: hệ thống trả về HTTP 400 + thông báo "Nhà trạm phao đã bị xóa trước đó".
- **AC-082-03** — Nhà trạm phao đang chờ phê duyệt: hệ thống trả về HTTP 400 + thông báo "Không thể xóa nhà trạm đang chờ phê duyệt".
- **AC-082-04** — Audit log: hệ thống ghi nhận hành động SOFT_DELETE với đầy đủ thông tin changedBy, changedAt.
- **AC-082-05** — Xác nhận xóa: UI hiển thị popup xác nhận trước khi thực hiện xóa.

### 4.3. User Stories kế thừa (nếu có)

- **US-082-01:** Là cán bộ nghiệp vụ, tôi muốn xóa mềm nhà trạm phao không còn sử dụng để loại bỏ khỏi danh sách hiển thị mà vẫn giữ lịch sử kiểm toán.
- **US-082-02:** Là cán bộ nghiệp vụ, tôi muốn hệ thống yêu cầu xác nhận trước khi xóa để tránh xóa nhầm.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xóa mềm nhà trạm phao | `nhatramphao:delete` |

**Admin Cục:** Full quyền xóa mềm + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — chuyển sang DELETED khi xóa mềm |
| 2 | Có bước phê duyệt không | Không — xóa mềm không yêu cầu phê duyệt |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — chỉ xóa được nhà trạm phao thuộc đơn vị mình quản lý hoặc đơn vị con |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `nhatramphao:delete` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Không — dùng chung popup xác nhận xóa từ list-view/ |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| DELETE | `/api/v1/nhatram-phao/{id}` | Xóa mềm nhà trạm phao | `nhatramphao:delete` |

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
- `deletedAt` TIMESTAMP — ghi khi xóa mềm
- `deletedBy` UUID FK — ghi người xóa
