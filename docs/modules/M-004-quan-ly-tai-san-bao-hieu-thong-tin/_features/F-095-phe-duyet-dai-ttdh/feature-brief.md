---
id: F-095
name: Phê duyệt Đài TTDH
slug: phe-duyet-dai-ttdh
module-id: M-004
status: proposed
classification: local
priority: high
created: 2026-07-07T03:32:57Z
last-updated: 2026-08-23
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Phê duyệt Đài TTDH

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-095
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng có bước phê duyệt
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (TKCT)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **\"Điểm khác biệt so với mẫu chung\"** (mục 5, dòng 3 — *\"Lọc cha-con / theo đơn vị\"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

> **⚠️ LƯU Ý QUAN TRỌNG — Sửa (S) = false toàn bộ trường:**
> Sheet Excel `Đài TTDH` đánh dấu **Sửa = false** cho TOÀN BỘ trường (cột \"Sửa\" trống). Feature F-095 (Phê duyệt) không liên quan đến sửa trường — chỉ duyệt/từ chối. Ghi chú này được thêm dưới dạng banner để cảnh báo mâu thuẫn với F-093 (Cập nhật).

---

## 1. Mô tả ngắn

Cho phép cán bộ phê duyệt (Cảng vụ/Chi cục — cấp 1, Cục — cấp 2) xem xét, duyệt hoặc từ chối một Đài Thông tin Duyên hải (TTDH) đang ở trạng thái chờ phê duyệt. Phê duyệt 2 cấp: cấp 1 (Cảng vụ/Chi cục) → cấp 2 (Cục). Khi từ chối, bắt buộc nhập lý do. Sau khi cấp 2 duyệt, bản ghi chuyển sang ACTIVE.

## 2. Trường dữ liệu

Bảng mô tả các trường hiển thị trên màn hình phê duyệt, trích từ sheet `Đài TTDH` trong Excel `HH_Tính năng & danh sách các trường thông tin.xlsx`:

| STT | Tên trường (theo Excel) | Loại điều khiển | Bắt buộc | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Đơn vị quản lý (bắt buộc) | SelectOrgCode | Có | Có | Có | Có | Không | Không | Read-only trên màn phê duyệt |
| 2 | Đơn vị khai thác | SelectCateOther | Có | Không | Không | Có | Không | Không | Read-only |
| 3 | Phân loại đài (bắt buộc) | SelectAppParams | Có | Có | Có | Có | Không | Không | Read-only |
| 4 | Mã đài | Input (disabled, tự sinh DTTDH-{seq}) | Có | Có | Có | Có | Không | Không | Read-only |
| 5 | Tên đài (bắt buộc) | InputTextArea | Có | Có | Có | Có | Không | Không | Read-only |
| 6 | Địa điểm (Tỉnh/TP) (bắt buộc) | SelectCateOther | Có | Có | Có | Có | Không | Không | Read-only |
| 7 | Địa điểm chi tiết (bắt buộc) | InputTextArea | Có | Không | Không | Có | Không | Không | Read-only |
| 8 | Tình trạng (bắt buộc) | SelectAppParams | Có | Có | Có | Có | Không | Không | Read-only |
| 9 | Vùng phủ sóng | InputTextArea | Không | Không | Không | Có | Không | Không | Read-only |
| 10 | Dịch vụ cung cấp | SelectAppParams (multi-select) | Không | Không | Không | Có | Không | Không | Read-only |
| 11 | Ghi chú | InputTextArea | Không | Không | Không | Có | Không | Không | Read-only |
| 12 | Loại đối tượng | Select (Điểm/Đường/Vùng) | Không | Không | Không | Có | Không | Không | GIS — read-only |
| 13 | Biểu tượng | Select | Không | Không | Không | Có | Không | Không | GIS |
| 14 | Hệ quy chiếu | Text | Không | Không | Không | Có | Không | Không | GIS |
| 15 | Quy tắc hiển thị | Text | Không | Không | Không | Có | Không | Không | GIS |
| 16 | Tọa độ | LongLatTable | Không | Không | Không | Có | Không | Không | GIS — WGS84 |
| 17 | File đính kèm | UploadFileTable | Không | Không | Không | Có | Không | Không | Read-only |
| 18 | Trạng thái | Badge (read-only) | Có | Có | Có | Có | Không | Không | PROPOSED / APPROVED_L1 / APPROVED_L2 |
| 19 | Ngày cập nhật | Text (read-only) | Không | Có | Có | Có | Không | Không | Read-only |
| 20 | Cán bộ cập nhật | Text (read-only) | Không | Có | Có | Có | Không | Không | Read-only |
| 21 | Ngày gửi phê duyệt | Text (read-only) | Không | Có | Có | Có | Không | Không | Read-only |
| 22 | Cán bộ gửi phê duyệt | Text (read-only) | Không | Có | Có | Có | Không | Không | Read-only |
| 23 | Ngày phê duyệt cấp Cảng vụ/Chi cục | Text (read-only) | Không | Có | Có | Có | Không | Không | Chỉ hiện sau khi cấp 1 duyệt |
| 24 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | Text (read-only) | Không | Có | Có | Có | Không | Không | Chỉ hiện sau khi cấp 1 duyệt |
| 25 | Nội dung phê duyệt | Text (read-only) | Không | Không | Không | Có | Không | Không | Chỉ hiện sau khi cấp 1 duyệt |
| 26 | Ngày phê duyệt cấp Cục | Text (read-only) | Không | Có | Có | Có | Không | Không | Chỉ hiện sau khi cấp 2 duyệt |
| 27 | Cán bộ phê duyệt cấp Cục | Text (read-only) | Không | Có | Có | Có | Không | Không | Chỉ hiện sau khi cấp 2 duyệt |
| 28 | Nội dung phê duyệt | Text (read-only) | Không | Không | Không | Có | Không | Không | Chỉ hiện sau khi cấp 2 duyệt |
| 29 | Mã kế hoạch (vận hành) | Text (read-only) | Không | Không | Không | Có | Không | Không | Read-only |
| 30 | Tên kế hoạch (vận hành) | Text (read-only) | Không | Không | Không | Có | Không | Không | Read-only |
| 31 | Ngày bắt đầu (vận hành) | Text (read-only) | Không | Không | Không | Có | Không | Không | Read-only |
| 32 | Ngày kết thúc (vận hành) | Text (read-only) | Không | Không | Không | Có | Không | Không | Read-only |
| 33 | Mã kế hoạch (bảo trì) | Text (read-only) | Không | Không | Không | Có | Không | Không | Read-only |
| 34 | Tên kế hoạch (bảo trì) | Text (read-only) | Không | Không | Không | Có | Không | Không | Read-only |
| 35 | Thời gian bắt đầu (bảo trì) | Text (read-only) | Không | Không | Không | Có | Không | Không | Read-only |
| 36 | Thời gian kết thúc (bảo trì) | Text (read-only) | Không | Không | Không | Có | Không | Không | Read-only |
| 37 | Mã sự cố | Text (read-only) | Không | Không | Không | Có | Không | Không | Read-only |
| 38 | Loại sự cố | Text (read-only) | Không | Không | Không | Có | Không | Không | Read-only |
| 39 | Địa điểm (sự cố) | Text (read-only) | Không | Không | Không | Có | Không | Không | Read-only |
| 40 | Thời gian (sự cố) | Text (read-only) | Không | Không | Không | Có | Không | Không | Read-only |

**⚠️ Ghi chú về trường Sửa=false toàn bộ:** Sheet Excel đánh dấu cột \"Sửa\" trống (false) cho tất cả 40 trường. Feature F-095 (Phê duyệt) không cho phép sửa bất kỳ trường nào — chỉ duyệt/từ chối.

## 3. Trạng thái và phê duyệt

- **7 trạng thái** (lưu dạng số trong DB, không lưu chữ):
  1. `DRAFT` (0) — Nháp
  2. `PROPOSED` (1) — Đã gửi phê duyệt
  3. `APPROVED_L1` (2) — Đã duyệt cấp 1 (Cảng vụ / Chi cục)
  4. `APPROVED_L2` (3) — Đã duyệt cấp 2 (Cục)
  5. `ACTIVE` (4) — Đang hoạt động
  6. `SUSPENDED` (5) — Tạm ngừng
  7. `DELETED` (6) — Đã xóa (soft delete)

- **Phê duyệt 2 cấp:**
  - **Cấp 1 (Cảng vụ / Chi cục):**
    - Xem danh sách bản ghi ở trạng thái `PROPOSED` (1).
    - Quyết định: **DUYỆT** → chuyển sang `APPROVED_L1` (2); **TỪ CHỐI** → quay về `DRAFT` (0), bắt buộc nhập lý do.
    - Khi duyệt: ghi nhận `approved_l1_at`, `approved_l1_by`, `approved_l1_content`.
  - **Cấp 2 (Cục):**
    - Xem danh sách bản ghi ở trạng thái `APPROVED_L1` (2).
    - Quyết định: **DUYỆT** → chuyển sang `ACTIVE` (4); **TỪ CHỐI** → quay về `DRAFT` (0), bắt buộc nhập lý do.
    - Khi duyệt: ghi nhận `approved_l2_at`, `approved_l2_by`, `approved_l2_content`.

- **Luồng trạng thái:**
  ```
  PROPOSED → APPROVED_L1 (cấp 1 duyệt) → APPROVED_L2 (cấp 2 duyệt) → ACTIVE
  PROPOSED → DRAFT (cấp 1 từ chối)
  APPROVED_L1 → DRAFT (cấp 2 từ chối)
  ```

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/01-base-pattern.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-095-01 | Cấp 1 chỉ xem bản ghi PROPOSED; cấp 2 chỉ xem bản ghi APPROVED_L1 | Approval |
| BR-095-02 | Từ chối ở bất kỳ cấp → quay về DRAFT, bắt buộc nhập lý do | Approval |
| BR-095-03 | Duyệt cấp 2 → chuyển sang ACTIVE | Approval |
| BR-095-04 | Ghi nhận approved_l1_at/by/content, approved_l2_at/by/content | Approval |
| BR-095-05 | Mọi thao tác phê duyệt ghi vào station_history | Approval |
| BR-095-06 | Không thể tự duyệt bản ghi do chính mình tạo (4-eyes principle) | Approval |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-095-01** — Cấp 1 chỉ thấy danh sách bản ghi PROPOSED; cấp 2 chỉ thấy APPROVED_L1.
- **AC-095-02** — Từ chối bắt buộc nhập lý do; không cho phép từ chối mà không có lý do.
- **AC-095-03** — Duyệt cấp 2 → bản ghi ACTIVE, hiển thị badge xanh.
- **AC-095-04** — Audit log ghi nhận approvalLevel, approvalContent/rejectionReason.

### 4.3. User Stories kế thừa (nếu có)

- **US-095-01:** Như một cán bộ Cảng vụ/Chi cục, tôi muốn duyệt/từ chối các Đài TTDH ở cấp 1.
- **US-095-02:** Như một cán bộ Cục, tôi muốn duyệt/từ chối các Đài TTDH đã được cấp 1 duyệt.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Duyệt cấp 1 | `coastalstation:approve-l1` |
| Duyệt cấp 2 | `coastalstation:approve-l2` |
| Từ chối | `coastalstation:reject` |

**Admin Cục:** full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 7 trạng thái: DRAFT, PROPOSED, APPROVED_L1, APPROVED_L2, ACTIVE, SUSPENDED, DELETED |
| 2 | Có bước phê duyệt không | Có — 2 cấp: Cảng vụ/Chi cục (cấp 1) → Cục (cấp 2) |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — filter theo subtree đơn vị cha, Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — trường phê duyệt cấp 1/2 chỉ hiện sau khi được duyệt tương ứng |
| 5 | Quyền riêng | `coastalstation:approve-l1`, `coastalstation:approve-l2`, `coastalstation:reject` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Có — màn phê duyệt 2 cấp với badge trạng thái, form lý do từ chối |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/coastalstations?status=PROPOSED` | Danh sách chờ duyệt cấp 1 | `coastalstation:read` |
| GET | `/api/v1/coastalstations?status=APPROVED_L1` | Danh sách chờ duyệt cấp 2 | `coastalstation:read` |
| POST | `/api/v1/coastalstations/{id}/approve-l1` | Duyệt cấp 1 | `coastalstation:approve-l1` |
| POST | `/api/v1/coastalstations/{id}/approve-l2` | Duyệt cấp 2 | `coastalstation:approve-l2` |
| POST | `/api/v1/coastalstations/{id}/reject` | Từ chối (nhập lý do) | `coastalstation:reject` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `coastal_station` (Đài Thông tin Duyên hải):**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| id | UUID | Có | Primary key |
| org_unit_id | UUID | Có | Đơn vị quản lý, FK → org_unit |
| operating_unit_id | UUID | Không | Đơn vị khai thác, FK → org_unit |
| code | VARCHAR(50) | Có | Mã đài tự sinh `DTTDH-{seq}`, unique, immutable |
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

🔴 **Trường mới cần thêm:** `submitted_at`, `submitted_by`, `approved_l1_at`, `approved_l1_by`, `approved_l1_content`, `approved_l2_at`, `approved_l2_by`, `approved_l2_content`, `rejection_reason`.

**Bảng `station_history` (Lịch sử thay đổi):**

| Trường | Kiểu | Ghi chú |
|---|---|---|
| id | UUID | Primary key |
| entity_id | UUID | FK → coastal_station.id |
| action_type | VARCHAR(20) | CREATE, UPDATE, DELETE, APPROVE_L1, APPROVE_L2, REJECT |
| changed_field | VARCHAR(100) | Tên trường thay đổi |
| previous_value | TEXT | Giá trị cũ |
| new_value | TEXT | Giá trị mới |
| approval_level | VARCHAR(10) | L1 hoặc L2 |
| rejection_reason | TEXT | Lý do từ chối |
| approval_content | TEXT | Nội dung phê duyệt |
| changed_by | UUID | Người thực hiện |
| changed_at | TIMESTAMP | Thời gian thay đổi |
