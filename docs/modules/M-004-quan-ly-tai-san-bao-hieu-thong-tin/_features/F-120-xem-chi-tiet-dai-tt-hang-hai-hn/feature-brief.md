---
id: F-120
name: "Xem chi tiết Đài TT Hàng hải HN"
slug: xem-chi-tiet-dai-tt-hang-hai-hn
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:30Z"
last-updated: 2026-08-24
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Xem chi tiết Đài TT Hàng hải HN

**Tài liệu:** BA Feature Brief
**Feature:** F-120
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng có bước phê duyệt

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **\"Điểm khác biệt so với mẫu chung\"** (mục 5, dòng 3 — *\"Lọc cha-con / theo đơn vị\"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Tính năng cho phép người dùng có quyền xem chi tiết thông tin một Đài Thông tin Hàng hải Hà Nội. Hiển thị toàn bộ thông tin theo 5 nhóm: cơ bản (đơn vị quản lý, đơn vị khai thác, mã đài, tên đài, địa điểm, tình trạng), đặc thù TTXLTT (dịch vụ cung cấp, ghi chú), GIS (loại đối tượng, biểu tượng, hệ quy chiếu, quy tắc hiển thị, tọa độ), file đính kèm, và trạng thái phê duyệt (7 trạng thái, thông tin phê duyệt C1/C2). Hiển thị read-only các khối vận hành khai thác, bảo trì, sự cố. Hiển thị badge trạng thái với 7 màu tương ứng.

## 2. Trường dữ liệu

Bảng mô tả các trường hiển thị trên trang chi tiết:

| # | Tên trường (theo Excel) | Loại điều khiển | Bắt buộc | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Đơn vị quản lý (bắt buộc) | SelectOrgCode | Có | Có | Có | Có | — | — | Chỉ hiển thị |
| 2 | Đơn vị khai thác | SelectCateOther | Không | Có | — | Có | — | — | Chỉ hiển thị |
| 3 | Mã đài | Input (disabled, tự sinh TTXLTT-{seq}) | Có | Có | Có | Có | — | — | Chỉ hiển thị |
| 4 | Tên đài (bắt buộc) | InputTextArea | Có | Có | Có | Có | — | — | Chỉ hiển thị |
| 5 | Địa điểm (Tỉnh/TP) (bắt buộc) | SelectCateOther | Có | Có | Có | Có | — | — | Chỉ hiển thị |
| 6 | Địa điểm chi tiết (bắt buộc) | InputTextArea | Có | Có | Có | Có | — | — | Chỉ hiển thị |
| 7 | Tình trạng (bắt buộc) | SelectAppParams | Có | Có | Có | Có | — | — | Chỉ hiển thị |
| 8 | Dịch vụ cung cấp | SelectAppParams (multi-select) | Không | — | — | Có | — | — | Chỉ hiển thị |
| 9 | Ghi chú | InputTextArea | Không | — | — | Có | — | — | Chỉ hiển thị |
| 10 | Loại đối tượng | Select (Điểm/Đường/Vùng) | Không | — | — | Có | — | — | Chỉ hiển thị |
| 11 | Biểu tượng | Select | Không | — | — | Có | — | — | Chỉ hiển thị |
| 12 | Hệ quy chiếu | Text | Không | — | — | Có | — | — | Chỉ hiển thị |
| 13 | Quy tắc hiển thị | Text | Không | — | — | Có | — | — | Chỉ hiển thị |
| 14 | Tọa độ | LongLatTable | Không | — | — | Có | — | — | Chỉ hiển thị |
| 15 | File đính kèm | UploadFileTable | Không | — | — | Có | — | — | Chỉ hiển thị |
| 16 | Trạng thái | Badge (read-only) | Có | Có | Có | Có | — | — | Hiển thị trạng thái hiện tại với 7 màu |
| 17 | Ngày cập nhật | Text (read-only) | Có | Có | Có | Có | — | — | — |
| 18 | Cán bộ cập nhật | Text (read-only) | Có | — | — | Có | — | — | — |
| 19 | Ngày gửi phê duyệt | Text (read-only) | Có | — | — | Có | — | — | — |
| 20 | Cán bộ gửi phê duyệt | Text (read-only) | Có | — | — | Có | — | — | — |
| 21 | Ngày phê duyệt cấp Cảng vụ/Chi cục | Text (read-only) | Có | — | — | Có | — | — | Cấp C1 |
| 22 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | Text (read-only) | Có | — | — | Có | — | — | Cấp C1 |
| 23 | Nội dung phê duyệt | Text (read-only) | Không | — | — | Có | — | — | Cấp C1 |
| 24 | Ngày phê duyệt cấp Cục | Text (read-only) | Có | — | — | Có | — | — | Cấp C2 |
| 25 | Cán bộ phê duyệt cấp Cục | Text (read-only) | Có | — | — | Có | — | — | Cấp C2 |
| 26 | Nội dung phê duyệt | Text (read-only) | Không | — | — | Có | — | — | Cấp C2 |
| 27 | Mã kế hoạch (vận hành) | Text (read-only) | Không | — | — | Có | — | — | Read-only vận hành |
| 28 | Tên kế hoạch (vận hành) | Text (read-only) | Không | — | — | Có | — | — | Read-only vận hành |
| 29 | Ngày bắt đầu (vận hành) | Text (read-only) | Không | — | — | Có | — | — | Read-only vận hành |
| 30 | Ngày kết thúc (vận hành) | Text (read-only) | Không | — | — | Có | — | — | Read-only vận hành |
| 31 | Mã kế hoạch (bảo trì) | Text (read-only) | Không | — | — | Có | — | — | Read-only bảo trì |
| 32 | Tên kế hoạch (bảo trì) | Text (read-only) | Không | — | — | Có | — | — | Read-only bảo trì |
| 33 | Thời gian bắt đầu (bảo trì) | Text (read-only) | Không | — | — | Có | — | — | Read-only bảo trì |
| 34 | Thời gian kết thúc (bảo trì) | Text (read-only) | Không | — | — | Có | — | — | Read-only bảo trì |
| 35 | Mã sự cố | Text (read-only) | Không | — | — | Có | — | — | Read-only sự cố |
| 36 | Loại sự cố | Text (read-only) | Không | — | — | Có | — | — | Read-only sự cố |
| 37 | Địa điểm (sự cố) | Text (read-only) | Không | — | — | Có | — | — | Read-only sự cố |
| 38 | Thời gian (sự cố) | Text (read-only) | Không | — | — | Có | — | — | Read-only sự cố |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.7 (trạng thái lưu dạng số, không lưu chữ).
- Hiển thị badge trạng thái với 7 màu:
  - **Lưu tạm** (xám nhạt) — status = 0
  - **Chờ duyệt cấp Cảng vụ/Chi cục** (vàng) — status = 1
  - **Từ chối cấp Cảng vụ/Chi cục** (cam) — status = 2
  - **Chờ duyệt cấp Cục** (xanh dương) — status = 3
  - **Từ chối cấp Cục** (cam đậm) — status = 4
  - **Đã phê duyệt** (xanh lá) — status = 5
  - **Lịch sử** (xám đậm) — status = 6
- Hiển thị approvalLevel badge (chưa gửi / C1 / C2).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/01-base-pattern.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-120-01 | Hiển thị toàn bộ thông tin theo 5 nhóm: cơ bản, đặc thù TTXLTT, GIS, file đính kèm, phê duyệt | Read |
| BR-120-02 | Hiển thị badge trạng thái với 7 màu tương ứng | Read |
| BR-120-03 | Hiển thị approvalLevel badge (chưa gửi / C1 / C2) | Read |
| BR-120-04 | Hiển thị read-only các khối vận hành khai thác, bảo trì, sự cố | Read |
| BR-120-05 | Hiển thị metadata người tạo/người sửa/thời gian (Admin Cục) | Read |
| BR-120-06 | Filter theo đơn vị: đơn vị nào chỉ xem dữ liệu đơn vị đó; đơn vị cha xem subtree; Cục xem full | Read |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-120-01** — Hiển thị đầy đủ: Xem chi tiết trả về HTTP 200 với toàn bộ thông tin 5 nhóm.
- **AC-120-02** — Badge trạng thái: Hiển thị đúng badge màu theo 7 trạng thái.
- **AC-120-03** — Filter theo đơn vị: Chỉ hiển thị dữ liệu trong phạm vi đơn vị của user.
- **AC-120-04** — Admin Cục: Hiển thị thêm metadata người tạo/người sửa/thời gian tạo/cập nhật.

### 4.3. User Stories kế thừa (nếu có)

- **US-120-01:** Là người dùng có quyền xem, tôi muốn xem chi tiết toàn bộ thông tin Đài TT Hàng hải HN theo 5 nhóm để nắm rõ thông tin đài.
- **US-120-02:** Là Admin Cục, tôi muốn xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật khi xem chi tiết.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem chi tiết | `coastalstationhaiphong:read` |
| Xem danh sách | `coastalstationhaiphong:read` |

**Admin Cục:** full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 7 trạng thái với badge 7 màu tương ứng |
| 2 | Có bước phê duyệt không | Có — 2 cấp (hiển thị thông tin phê duyệt C1/C2) |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` (đơn vị quản lý), filter theo subtree đơn vị cha, Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `coastalstationhaiphong:read` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Có — 5 nhóm thông tin: cơ bản, đặc thù TTXLTT, GIS, file đính kèm, vận hành/bảo trì/sự cố (read-only) |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/stations/coastal-haiphong/{id}` | Xem chi tiết đài TT Hàng hải HN | `coastalstationhaiphong:read` |
| GET | `/api/v1/stations/coastal-haiphong` | Danh sách đài TT Hàng hải HN (phân trang, lọc) | `coastalstationhaiphong:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `coastal_station_haiphong` (Đài Thông tin Hàng hải Hà Nội):**

- `id` UUID PK — không thay đổi
- `code` VARCHAR(50) UNIQUE — không thay đổi
- `name` VARCHAR(255) NOT NULL — không thay đổi
- `org_unit_id` UUID NOT NULL — không thay đổi
- `operating_unit_id` UUID — không thay đổi
- `province_id` UUID NOT NULL — không thay đổi
- `detailed_location` VARCHAR(500) NOT NULL — không thay đổi
- `usage_status` SMALLINT NOT NULL — không thay đổi
- `services_provided` TEXT — không thay đổi
- `remarks` VARCHAR(2000) — không thay đổi
- `geometry_type` VARCHAR(20) — không thay đổi
- `map_symbol_id` UUID — không thay đổi
- `coordinate_system` VARCHAR(100) — không thay đổi
- `display_rule` TEXT — không thay đổi
- `coordinates` TEXT — không thay đổi
- `status` SMALLINT NOT NULL DEFAULT 0 — không thay đổi
- `approval_level` SMALLINT DEFAULT 0 — không thay đổi
- `approved_by` UUID — không thay đổi
- `approved_date` TIMESTAMP — không thay đổi
- `rejection_reason` VARCHAR(500) — không thay đổi
- `approval_content` TEXT — không thay đổi
- `submitted_by` UUID — không thay đổi
- `submitted_date` TIMESTAMP — không thay đổi
- `updated_by` UUID — không thay đổi
- `updated_at` TIMESTAMP — không thay đổi
- `created_by` UUID NOT NULL — không thay đổi
- `created_at` TIMESTAMP NOT NULL — không thay đổi
- `deleted_at` TIMESTAMP — không thay đổi
- ~~deletedAt~~ — CoastalStationVTS dùng status "Lịch sử" thay vì soft-delete

**Bảng `coastal_station_haiphong_attachment` (File đính kèm):**
- Hiển thị danh sách file đính kèm

**Bảng `coastal_station_haiphong_operational_plan` (Vận hành khai thác - read-only):**
- Hiển thị read-only

**Bảng `coastal_station_haiphong_maintenance` (Bảo trì - read-only):**
- Hiển thị read-only

**Bảng `coastal_station_haiphong_incident` (Sự cố - read-only):**
- Hiển thị read-only
