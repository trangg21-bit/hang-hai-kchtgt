---
id: F-119
name: "Phê duyệt Đài TT Hàng hải HN"
slug: phe-duyet-dai-tt-hang-hai-hn
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:30Z"
last-updated: 2026-08-24
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Phê duyệt Đài TT Hàng hải HN

**Tài liệu:** BA Feature Brief
**Feature:** F-119
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng có bước phê duyệt

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **\"Điểm khác biệt so với mẫu chung\"** (mục 5, dòng 3 — *\"Lọc cha-con / theo đơn vị\"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Tính năng cho phép người phê duyệt (Cảng vụ/Chi cục và Cục) duyệt hoặc từ chối một Đài Thông tin Hàng hải Hà Nội đã được gửi duyệt. Quy trình 2 cấp: Cấp 1 (Cảng vụ/Chi cục) duyệt → chuyển sang Chờ duyệt cấp Cục; Cấp 2 (Cục) duyệt → chuyển sang Đã phê duyệt. Từ chối ở cấp nào → sửa + gửi lại → về Chờ duyệt cấp đó. Phê duyệt trực tiếp chỉ thực hiện được ở Cấp Cục khi bản ghi còn ở trạng thái Lưu tạm. Self-approval prevention: người gửi không thể duyệt chính bản ghi mình gửi.

## 2. Trường dữ liệu

Bảng mô tả các trường liên quan đến quy trình phê duyệt:

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
| 16 | Trạng thái | Badge (read-only) | Có | Có | Có | Có | — | — | Hiển thị trạng thái hiện tại |
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
- **Quy trình phê duyệt 2 cấp:**
  - **Cấp 1 (Cảng vụ/Chi cục):** Chờ duyệt cấp Cảng vụ/Chi cục → Duyệt → Chờ duyệt cấp Cục / Từ chối → Từ chối cấp Cảng vụ/Chi cục.
  - **Cấp 2 (Cục):** Chờ duyệt cấp Cục → Duyệt → Đã phê duyệt / Từ chối → Từ chối cấp Cục.
  - **7 trạng thái:** Lưu tạm (0), Chờ duyệt cấp Cảng vụ/Chi cục (1), Từ chối cấp Cảng vụ/Chi cục (2), Chờ duyệt cấp Cục (3), Từ chối cấp Cục (4), Đã phê duyệt (5), Lịch sử (6).
  - **Từ chối ở cấp nào → sửa + gửi lại → về Chờ duyệt cấp đó.**
  - **Phê duyệt trực tiếp:** Chỉ thực hiện được ở Cấp Cục khi bản ghi còn ở trạng thái Lưu tạm (0) → chuyển thẳng sang Đã phê duyệt (5).
  - **Self-approval prevention:** Người gửi không thể duyệt chính bản ghi mình gửi.
  - **Bản ghi trạng thái Lịch sử → không thể duyệt/từ chối.**

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/01-base-pattern.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-119-01 | Duyệt/Từ chối phải nhập nội dung phê duyệt | Approve, Reject |
| BR-119-02 | Từ chối: lý do ≥ 10 ký tự | Reject |
| BR-119-03 | Phê duyệt trực tiếp chỉ Cấp Cục khi status = Lưu tạm | Approve |
| BR-119-04 | Từ chối chỉ thực hiện được khi không ở trạng thái Lịch sử | Reject |
| BR-119-05 | Lịch sử không thể duyệt/từ chối | Approve, Reject |
| BR-119-06 | Gửi lại từ Từ chối → về Chờ duyệt cấp tương ứng | Submit |
| BR-119-07 | Self-approval prevention: người gửi không thể duyệt chính bản ghi mình gửi | Approve |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-119-01** — Duyệt C1 thành công: Cảng vụ/Chi cục duyệt → chuyển sang Chờ duyệt cấp Cục, HTTP 200.
- **AC-119-02** — Duyệt C2 thành công: Cục duyệt → chuyển sang Đã phê duyệt, HTTP 200.
- **AC-119-03** — Từ chối C1: Cảng vụ/Chi cục từ chối (nhập lý do ≥ 10 ký tự) → chuyển sang Từ chối cấp Cảng vụ/Chi cục, HTTP 200.
- **AC-119-04** — Từ chối C2: Cục từ chối → chuyển sang Từ chối cấp Cục, HTTP 200.
- **AC-119-05** — Phê duyệt trực tiếp: Cục duyệt trực tiếp từ trạng thái Lưu tạm → chuyển sang Đã phê duyệt, HTTP 200.
- **AC-119-06** — Self-approval prevention: Người gửi không thể duyệt chính bản ghi mình gửi → HTTP 400.
- **AC-119-07** — Từ chối duyệt Lịch sử: Bản ghi trạng thái Lịch sử → HTTP 400 "Đài TTDH ở trạng thái Lịch sử không thể phê duyệt".

### 4.3. User Stories kế thừa (nếu có)

- **US-119-01:** Là người phê duyệt cấp Cảng vụ/Chi cục, tôi muốn duyệt/từ chối bản ghi Đài TT Hàng hải HN được gửi duyệt để đẩy quy trình phê duyệt.
- **US-119-02:** Là người phê duyệt cấp Cục, tôi muốn duyệt/từ chối bản ghi đã được Cảng vụ/Chi cục phê duyệt, hoặc phê duyệt trực tiếp từ trạng thái Lưu tạm.
- **US-119-03:** Là cán bộ nghiệp vụ, tôi muốn sửa bản ghi bị từ chối và gửi duyệt lại để quay lại quy trình phê duyệt.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Duyệt đài | `coastalstationhaiphong:approve` |
| Từ chối đài | `coastalstationhaiphong:reject` |
| Gửi duyệt | `coastalstationhaiphong:submit` |
| Xem danh sách | `coastalstationhaiphong:read` |
| Xem chi tiết | `coastalstationhaiphong:read` |

**Admin Cục:** full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 7 trạng thái (Lưu tạm, Chờ duyệt CC, Từ chối CC, Chờ duyệt Cục, Từ chối Cục, Đã phê duyệt, Lịch sử) |
| 2 | Có bước phê duyệt không | Có — 2 cấp (Cảng vụ/Chi cục → Cục) + phê duyệt trực tiếp từ Cục |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` (đơn vị quản lý), filter theo subtree đơn vị cha, Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `coastalstationhaiphong:approve`, `coastalstationhaiphong:reject`, `coastalstationhaiphong:submit` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Có — Modal phê duyệt: textarea "Nội dung phê duyệt" (required), nút Duyệt (primary) / Từ chối (danger) |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/stations/coastal-haiphong/{id}/approve` | Duyệt (C1/C2/trực tiếp) | `coastalstationhaiphong:approve` |
| POST | `/api/v1/stations/coastal-haiphong/{id}/reject` | Từ chối | `coastalstationhaiphong:reject` |
| POST | `/api/v1/stations/coastal-haiphong/{id}/submit` | Gửi duyệt | `coastalstationhaiphong:submit` |
| GET | `/api/v1/stations/coastal-haiphong` | Danh sách đài TT Hàng hải HN (phân trang, lọc) | `coastalstationhaiphong:read` |
| GET | `/api/v1/stations/coastal-haiphong/{id}` | Xem chi tiết đài TT Hàng hải HN | `coastalstationhaiphong:read` |

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
- `status` SMALLINT NOT NULL DEFAULT 0 — **chuyển trạng thái theo quy trình phê duyệt**
- `approval_level` SMALLINT DEFAULT 0 — **cấp phê duyệt hiện tại (0=chưa gửi, 1=C1, 2=C2)**
- `approved_by` UUID — **người phê duyệt**
- `approved_date` TIMESTAMP — **ngày phê duyệt**
- `rejection_reason` VARCHAR(500) — **lý do từ chối**
- `approval_content` TEXT — **nội dung phê duyệt**
- `submitted_by` UUID — **người gửi duyệt**
- `submitted_date` TIMESTAMP — **ngày gửi duyệt**
- `updated_by` UUID — người cập nhật
- `updated_at` TIMESTAMP — thời gian cập nhật
- `created_by` UUID NOT NULL — người tạo (không thay đổi)
- `created_at` TIMESTAMP NOT NULL — thời gian tạo (không thay đổi)
- `deleted_at` TIMESTAMP — xóa mềm
- ~~deletedAt~~ — CoastalStationVTS dùng status "Lịch sử" thay vì soft-delete

**Bảng `coastal_station_haiphong_attachment` (File đính kèm):**
- Không thay đổi khi phê duyệt

**Bảng `coastal_station_haiphong_operational_plan` (Vận hành khai thác - read-only):**
- Không thay đổi khi phê duyệt

**Bảng `coastal_station_haiphong_maintenance` (Bảo trì - read-only):**
- Không thay đổi khi phê duyệt

**Bảng `coastal_station_haiphong_incident` (Sự cố - read-only):**
- Không thay đổi khi phê duyệt
