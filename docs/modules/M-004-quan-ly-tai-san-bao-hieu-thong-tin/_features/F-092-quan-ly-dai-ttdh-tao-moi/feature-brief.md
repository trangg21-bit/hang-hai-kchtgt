---
id: F-092
name: Quản lý Đài TTDH - Tạo mới
slug: quan-ly-dai-ttdh-tao-moi
module-id: M-004
status: proposed
classification: local
priority: medium
created: 2026-07-07T03:32:57Z
last-updated: 2026-08-23
locked-fields: []
consumed_by_modules: []
x-legacy:
  source-paths:
    - src/main/java/com/hanghai/kchtg/station/
---

# Đặc tả nghiệp vụ: Quản lý Đài TTDH - Tạo mới

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-092
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng có bước phê duyệt
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (TKCT)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **\"Điểm khác biệt so với mẫu chung\"** (mục 5, dòng 3 — *\"Lọc cha-con / theo đơn vị\"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

> **⚠️ LƯU Ý QUAN TRỌNG — Sửa (S) = false toàn bộ trường:**
> Sheet Excel `Đài TTDH` đánh dấu **Sửa = false** cho TOÀN BỘ trường (cột \"Sửa\" trống). Tuy nhiên feature F-093 (Cập nhật) vẫn tồn tại trong hệ thống. Ghi chú này được thêm dưới dạng banner để cảnh báo mâu thuẫn — **KHÔNG tự xóa feature cập nhật**. Khi triển khai F-093, cần xác nhận lại với BA/SA về việc có cho phép sửa trường nào không.

---

## 1. Mô tả ngắn

Cho phép cán bộ nghiệp vụ tạo mới một Đài Thông tin Duyên hải (TTDH) trong hệ thống. Form tạo mới bao gồm 3 nhóm thông tin: (A) thông tin chung hành chính — đơn vị quản lý, tên đài, phân loại, địa điểm, tình trạng; (B) thông tin đặc thù MVT — vùng phủ sóng, dịch vụ cung cấp, ghi chú; (C) vị trí GIS — loại đối tượng, biểu tượng, hệ quy chiếu, tọa độ WGS84, file đính kèm. Sau khi tạo, bản ghi ở trạng thái DRAFT, cần qua phê duyệt 2 cấp (Cảng vụ/Chi cục → Cục) trước khi thành ACTIVE.

## 2. Trường dữ liệu

Bảng mô tả các trường trên form tạo mới, trích từ sheet `Đài TTDH` trong Excel `HH_Tính năng & danh sách các trường thông tin.xlsx`:

| STT | Tên trường (theo Excel) | Loại điều khiển | Bắt buộc | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Đơn vị quản lý (bắt buộc) | SelectOrgCode | Có | Có | Có | Có | Có | Không | Mặc định theo đơn vị user; Admin Cục được chọn đơn vị khác |
| 2 | Đơn vị khai thác | SelectCateOther | Có | Không | Không | Có | Có | Không | Có thể khác đơn vị quản lý |
| 3 | Phân loại đài (bắt buộc) | SelectAppParams | Có | Có | Có | Có | Có | Không | Dropdown: Loại I → Loại V |
| 4 | Mã đài | Input (disabled, tự sinh DTTDH-{seq}) | Có | Có | Có | Có | Có | Không | Hệ thống tự sinh, immutable |
| 5 | Tên đài (bắt buộc) | InputTextArea | Có | Có | Có | Có | Có | Không | Tối đa 255 ký tự |
| 6 | Địa điểm (Tỉnh/TP) (bắt buộc) | SelectCateOther | Có | Có | Có | Có | Có | Không | |
| 7 | Địa điểm chi tiết (bắt buộc) | InputTextArea | Có | Không | Không | Có | Có | Không | Tối đa 500 ký tự |
| 8 | Tình trạng (bắt buộc) | SelectAppParams | Có | Có | Có | Có | Có | Không | Chưa khai thác / Đang khai thác / Dừng khai thác |
| 9 | Vùng phủ sóng | InputTextArea | Không | Không | Không | Có | Có | Không | |
| 10 | Dịch vụ cung cấp | SelectAppParams (multi-select) | Không | Không | Không | Có | Có | Không | 9 dịch vụ cố định |
| 11 | Ghi chú | InputTextArea | Không | Không | Không | Có | Có | Không | Tối đa 2000 ký tự |
| 12 | Loại đối tượng | Select (Điểm/Đường/Vùng) | Không | Không | Không | Có | Có | Có | GIS — read-only vận hành/bảo trì/sự cố |
| 13 | Biểu tượng | Select | Không | Không | Không | Có | Có | Có | GIS |
| 14 | Hệ quy chiếu | Text | Không | Không | Không | Có | Có | Có | GIS |
| 15 | Quy tắc hiển thị | Text | Không | Không | Không | Có | Có | Có | GIS |
| 16 | Tọa độ | LongLatTable | Không | Không | Không | Có | Có | Có | GIS — WGS84, bảng động thêm/xóa dòng |
| 17 | File đính kèm | UploadFileTable | Không | Không | Không | Có | Có | Có | Quyết định thành lập, hồ sơ kỹ thuật, ảnh hiện trạng |

**⚠️ Ghi chú về trường Sửa=false toàn bộ:** Sheet Excel đánh dấu cột \"Sửa\" trống (false) cho tất cả 17 trường trên form tạo mới. Tuy nhiên F-093 (Cập nhật) vẫn tồn tại — cần xác nhận lại với BA/SA khi triển khai.

## 3. Trạng thái và phê duyệt

- **7 trạng thái** (lưu dạng số trong DB, không lưu chữ):
  1. `DRAFT` (0) — Nháp, bản ghi vừa tạo
  2. `PROPOSED` (1) — Đã gửi phê duyệt
  3. `APPROVED_L1` (2) — Đã duyệt cấp 1 (Cảng vụ / Chi cục)
  4. `APPROVED_L2` (3) — Đã duyệt cấp 2 (Cục)
  5. `ACTIVE` (4) — Đang hoạt động
  6. `SUSPENDED` (5) — Tạm ngừng
  7. `DELETED` (6) — Đã xóa (soft delete)

- **Phê duyệt 2 cấp:**
  - **Cấp 1 (Cảng vụ / Chi cục):** Xem bản ghi ở trạng thái PROPOSED, quyết định DUYỆT hoặc TỪ CHỐI. Khi từ chối: bắt buộc nhập lý do.
  - **Cấp 2 (Cục):** Chỉ xem bản ghi đã được cấp 1 duyệt (APPROVED_L1), quyết định DUYỆT hoặc TỪ CHỐI. Khi từ chối: bắt buộc nhập lý do.
  - Sau khi cấp 2 duyệt → chuyển sang ACTIVE.
  - Trường từ chối ở bất kỳ cấp nào → quay về DRAFT, gửi lại người tạo biết.

- **Luồng trạng thái:**
  ```
  DRAFT → PROPOSED (người tạo gửi) → APPROVED_L1 (cấp 1 duyệt) → APPROVED_L2 (cấp 2 duyệt) → ACTIVE
  DRAFT ← REJECT (từ chối ở cấp 1 hoặc cấp 2)
  ACTIVE → SUSPENDED (tạm ngừng)
  ACTIVE → DELETED (xóa mềm)
  ```

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/01-base-pattern.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-092-01 | Mã đài tự sinh format `DTTDH-{seq}`, không cho người dùng nhập | Create |
| BR-092-02 | Đơn vị quản lý mặc định theo đơn vị user đăng nhập; Admin Cục được chọn đơn vị khác | Create |
| BR-092-03 | Tình trạng mặc định khi tạo mới: `CHUA_KHAI_THAC` (Chưa khai thác/vận hành) | Create |
| BR-092-04 | Trạng thái là tình trạng vận hành thực tế, KHÔNG phải trạng thái phê duyệt | Create/Update |
| BR-092-05 | Phê duyệt 2 cấp: Cảng vụ/Chi cục → Cục; từ chối ở bất kỳ cấp → quay DRAFT | Approval |
| BR-092-06 | Lý do từ chối bắt buộc ở cả 2 cấp | Approval |
| BR-092-07 | GIS 5 trường (loại đối tượng, biểu tượng, hệ quy chiếu, quy tắc hiển thị, tọa độ) — read-only ở khối vận hành/bảo trì/sự cố | Create/Update |
| BR-092-08 | File đính kèm: upload nhiều file (quyết định thành lập, hồ sơ kỹ thuật, ảnh hiện trạng) | Create |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-092-01** — Form tạo mới đầy đủ 3 nhóm thông tin (hành chính, MVT, GIS). Khi thiếu trường bắt buộc: hiển thị lỗi validation tiếng Việt.
- **AC-092-02** — Mã đài tự sinh duy nhất, không trùng lặp. Khi trùng: hệ thống tự tăng seq.
- **AC-092-03** — Sau khi tạo, bản ghi ở trạng thái DRAFT, chưa cần phê duyệt để lưu.
- **AC-092-04** — Upload file đính kèm hỗ trợ nhiều file, định dạng PDF/JPG/PNG.

### 4.3. User Stories kế thừa (nếu có)

- **US-092-01:** Như một cán bộ nghiệp vụ, tôi muốn tạo mới một Đài TTDH với đầy đủ thông tin hành chính, MVT và vị trí GIS để quản lý tài sản.
- **US-092-02:** Như một cán bộ nghiệp vụ, tôi muốn hệ thống tự sinh mã đài theo format quy định để không phải nhập thủ công.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Tạo mới Đài TTDH | `coastalstation:create` |
| Xem danh sách Đài TTDH | `coastalstation:read` |
| Xem chi tiết Đài TTDH | `coastalstation:read` |
| Gửi phê duyệt Đài TTDH | `coastalstation:propose` |

**Admin Cục:** full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 7 trạng thái: DRAFT, PROPOSED, APPROVED_L1, APPROVED_L2, ACTIVE, SUSPENDED, DELETED |
| 2 | Có bước phê duyệt không | Có — 2 cấp: Cảng vụ/Chi cục (cấp 1) → Cục (cấp 2) |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` bắt buộc, filter theo subtree đơn vị cha, Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `coastalstation:create`, `coastalstation:read`, `coastalstation:propose` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — file đính kèm (quyết định thành lập, hồ sơ kỹ thuật, ảnh hiện trạng) |
| 8 | Giao diện khác mẫu chung | Có — form 3 nhóm thông tin (hành chính, MVT, GIS) + bảng tọa độ động + upload file |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/coastalstations` | Tạo mới Đài TTDH | `coastalstation:create` |
| GET | `/api/v1/coastalstations` | Danh sách Đài TTDH (phân trang + lọc) | `coastalstation:read` |
| GET | `/api/v1/coastalstations/{id}` | Xem chi tiết Đài TTDH | `coastalstation:read` |
| PUT | `/api/v1/coastalstations/{id}` | Cập nhật Đài TTDH | `coastalstation:update` |
| DELETE | `/api/v1/coastalstations/{id}` | Xóa mềm Đài TTDH | `coastalstation:delete` |
| POST | `/api/v1/coastalstations/{id}/propose` | Gửi phê duyệt | `coastalstation:propose` |
| POST | `/api/v1/coastalstations/{id}/approve-l1` | Duyệt cấp 1 | `coastalstation:approve-l1` |
| POST | `/api/v1/coastalstations/{id}/approve-l2` | Duyệt cấp 2 | `coastalstation:approve-l2` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `coastal_station` (Đài Thông tin Duyên hải):**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| id | UUID | Có | Primary key |
| org_unit_id | UUID | Có | Đơn vị quản lý, FK → org_unit |
| operating_unit_id | UUID | Không | Đơn vị khai thác, FK → org_unit |
| code | VARCHAR(50) | Có | Mã đài tự sinh `DTTDH-{seq}`, unique |
| name | VARCHAR(255) | Có | Tên đài |
| station_level | SMALLINT | Có | Phân loại: 0=Loại I, 1=Loại II, ..., 4=Loại V |
| province_id | UUID | Có | Tỉnh/TP, FK → province |
| detailed_location | VARCHAR(500) | Có | Địa điểm chi tiết |
| usage_status | SMALLINT | Có | Tình trạng: 0=Chưa khai thác, 1=Đang khai thác, 2=Dừng khai thác |
| coverage_area | TEXT | Không | Vùng phủ sóng |
| services_provided | JSON | Không | Dịch vụ cung cấp (mảng 9 dịch vụ cố định) |
| remarks | VARCHAR(2000) | Không | Ghi chú |
| geometry_type | VARCHAR(20) | Không | GIS: Point/Line/Polygon |
| map_symbol_id | UUID | Không | GIS: biểu tượng |
| coordinate_system | VARCHAR(100) | Không | GIS: hệ quy chiếu |
| display_rule | TEXT | Không | GIS: quy tắc hiển thị |
| coordinates | JSON | Không | GIS: tọa độ WGS84 (mảng {lat, lon}) |
| approval_status | SMALLINT | Có | Trạng thái phê duyệt: 0=DRAFT, 1=PROPOSED, 2=APPROVED_L1, 3=APPROVED_L2, 4=ACTIVE, 5=SUSPENDED, 6=DELETED |
| submitted_at | TIMESTAMP | Không | Ngày gửi phê duyệt |
| submitted_by | UUID | Không | Cán bộ gửi phê duyệt |
| approved_l1_at | TIMESTAMP | Không | Ngày phê duyệt cấp Cảng vụ/Chi cục |
| approved_l1_by | UUID | Không | Cán bộ phê duyệt cấp Cảng vụ/Chi cục |
| approved_l1_content | TEXT | Không | Nội dung phê duyệt cấp 1 |
| approved_l2_at | TIMESTAMP | Không | Ngày phê duyệt cấp Cục |
| approved_l2_by | UUID | Không | Cán bộ phê duyệt cấp Cục |
| approved_l2_content | TEXT | Không | Nội dung phê duyệt cấp 2 |
| rejection_reason | TEXT | Không | Lý do từ chối |
| deleted_at | TIMESTAMP | Không | Xóa mềm |
| deleted_by | UUID | Không | Người xóa |
| created_by | UUID | Có | Người tạo |
| created_at | TIMESTAMP | Có | Thời gian tạo |
| updated_by | UUID | Không | Người sửa cuối |
| updated_at | TIMESTAMP | Không | Thời gian sửa cuối |

🔴 **Trường mới cần thêm:** `operating_unit_id`, `coverage_area`, `services_provided`, `geometry_type`, `map_symbol_id`, `coordinate_system`, `display_rule`, `coordinates`, `submitted_at`, `submitted_by`, `approved_l1_at`, `approved_l1_by`, `approved_l1_content`, `approved_l2_at`, `approved_l2_by`, `approved_l2_content`, `rejection_reason`.
