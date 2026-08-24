---
id: F-113
name: "Phê duyệt Đài LRIT"
slug: phe-duyet-dai-lrit
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:22Z"
last-updated: "2026-08-23"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Phê duyệt Đài LRIT

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-113
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng có bước phê duyệt
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **\"Điểm khác biệt so với mẫu chung\"** (mục 5, dòng 3 — *\"Lọc cha-con / theo đơn vị\"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Tính năng phê duyệt 2 cấp cho Đài LRIT: Cấp L1 (Cảng vụ/Chi cục) và Cấp L2 (Cục). Operator gửi bản ghi từ trạng thái DRAFT → PROPOSED → PENDING_APPROVAL. Approver L1 phê duyệt (chuyển APPROVED_LEVEL1) hoặc từ chối (chuyển REJECTED). Nếu được L1 duyệt, bản ghi chuyển APPROVED_LEVEL2 → PENDING_APPROVAL (chờ L2). Approver L2 phê duyệt cuối (chuyển APPROVED/PUBLISHED) hoặc từ chối (chuyển REJECTED). Từ chối ở bất kỳ cấp nào → REJECTED, operator có thể sửa và gửi lại.

## 2. Trường dữ liệu

Bảng mô tả các trường liên quan đến quy trình phê duyệt, trích từ sheet Excel \"Đài LRIT\":

| # | Tên trường (theo Excel) | Loại điều khiển | Bắt buộc | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| **Thông tin cơ bản** | | | | | | | | | |
| 1 | Đơn vị quản lý (bắt buộc) | SelectOrgCode | Có | Có | Có | Có | Có | Có | FK → org_unit |
| 2 | Đơn vị khai thác | SelectCateOther | Có | Không | Có | Có | Có | Có | |
| 3 | Mã đài | Input (disabled, tự sinh LRIT-{seq}) | Có | Có | Có | Có | Có | Có | Tự sinh, bất biến |
| 4 | Tên đài (bắt buộc) | InputTextArea | Có | Có | Có | Có | Có | Có | |
| 5 | Địa điểm (Tỉnh/TP) (bắt buộc) | SelectCateOther | Có | Có | Có | Có | Có | Có | |
| 6 | Địa điểm chi tiết (bắt buộc) | InputTextArea | Có | Không | Có | Có | Có | Có | |
| 7 | Tình trạng (bắt buộc) | SelectAppParams | Có | Có | Có | Có | Có | Có | Enum trạng thái kỹ thuật |
| **Thông tin đặc thù LRIT** | | | | | | | | | |
| 8 | Vùng phủ sóng | InputTextArea | Không | Không | Có | Có | Có | Có | |
| 9 | Dịch vụ cung cấp | SelectAppParams (multi-select) | Không | Không | Có | Có | Có | Có | |
| 10 | Ghi chú | InputTextArea | Không | Không | Có | Có | Có | Có | |
| **Vị trí (GIS)** | | | | | | | | | |
| 11 | Loại đối tượng | Select (Điểm/Đường/Vùng) | Không | Không | Không | Có | Có | Có | GIS |
| 12 | Biểu tượng | Select | Không | Không | Không | Có | Có | Có | GIS |
| 13 | Hệ quy chiếu | Text | Không | Không | Không | Có | Có | Có | GIS (WGS84) |
| 14 | Quy tắc hiển thị | Text | Không | Không | Không | Có | Có | Có | GIS |
| 15 | Tọa độ | LongLatTable | Không | Không | Không | Có | Có | Có | GIS |
| **File đính kèm** | | | | | | | | | |
| 16 | File đính kèm | UploadFileTable | Không | Không | Có | Có | Có | Có | |
| **Trạng thái & Kiểm toán** (chỉ hiển thị, không tạo/sửa) | | | | | | | | | |
| 17 | Trạng thái | Badge (read-only) | Có | Có | Có | Có | Không | Không | 7 trạng thái |
| 18 | Ngày cập nhật | Text (read-only) | Có | Có | Có | Có | Không | Không | |
| 19 | Cán bộ cập nhật | Text (read-only) | Có | Không | Có | Có | Không | Không | |
| 20 | Ngày gửi phê duyệt | Text (read-only) | Có | Không | Có | Có | Không | Không | |
| 21 | Cán bộ gửi phê duyệt | Text (read-only) | Có | Không | Có | Có | Không | Không | |
| 22 | Ngày phê duyệt cấp Cảng vụ/Chi cục | Text (read-only) | Có | Không | Có | Có | Không | Không | Cấp L1 |
| 23 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | Text (read-only) | Có | Không | Có | Có | Không | Không | Cấp L1 |
| 24 | Nội dung phê duyệt | Text (read-only) | Không | Không | Có | Có | Không | Không | Cấp L1 |
| 25 | Ngày phê duyệt cấp Cục | Text (read-only) | Có | Không | Có | Có | Không | Không | Cấp L2 |
| 26 | Cán bộ phê duyệt cấp Cục | Text (read-only) | Có | Không | Có | Có | Không | Không | Cấp L2 |
| 27 | Nội dung phê duyệt | Text (read-only) | Không | Không | Có | Có | Không | Không | Cấp L2 |
| **Thông tin vận hành khai thác** (read-only) | | | | | | | | | |
| 28 | Mã kế hoạch | Text (read-only) | Không | Không | Có | Có | Không | Không | |
| 29 | Tên kế hoạch | Text (read-only) | Không | Không | Có | Có | Không | Không | |
| 30 | Ngày bắt đầu | Text (read-only) | Không | Không | Có | Có | Không | Không | |
| 31 | Ngày kết thúc | Text (read-only) | Không | Không | Có | Có | Không | Không | |
| **Thông tin bảo trì** (read-only) | | | | | | | | | |
| 32 | Mã kế hoạch | Text (read-only) | Không | Không | Có | Có | Không | Không | |
| 33 | Tên kế hoạch | Text (read-only) | Không | Không | Có | Có | Không | Không | |
| 34 | Thời gian bắt đầu | Text (read-only) | Không | Không | Có | Có | Không | Không | |
| 35 | Thời gian kết thúc | Text (read-only) | Không | Không | Có | Có | Không | Không | |
| **Thông tin sự cố** (read-only) | | | | | | | | | |
| 36 | Mã sự cố | Text (read-only) | Không | Không | Có | Có | Không | Không | |
| 37 | Loại sự cố | Text (read-only) | Không | Không | Có | Có | Không | Không | |
| 38 | Địa điểm | Text (read-only) | Không | Không | Có | Có | Không | Không | |
| 39 | Thời gian | Text (read-only) | Không | Không | Có | Có | Không | Không | |

## 3. Trạng thái và phê duyệt

- **7 trạng thái** theo `ApprovalStatus` enum (lưu dạng số trong DB):
  - **0 — DRAFT** (Lưu tạm): Trạng thái mặc định khi tạo mới.
  - **1 — PROPOSED** (Đề nghị phê duyệt): Operator nhấn \"Gửi phê duyệt\" → chuyển sang trạng thái này.
  - **2 — PENDING_APPROVAL** (Chờ duyệt cấp Cảng vụ/Chi cục): Chờ Approver L1 xử lý.
  - **3 — APPROVED_LEVEL1** (Đã duyệt cấp Cảng vụ/Chi cục): Approver L1 đã phê duyệt.
  - **4 — APPROVED_LEVEL2** (Đã duyệt cấp Cục): Chờ Approver L2 phê duyệt cuối.
  - **5 — APPROVED** (Đã phê duyệt / Published): Hoàn thành 2 cấp, đưa vào vận hành.
  - **6 — REJECTED** (Từ chối): Bị từ chối ở bất kỳ cấp nào.
- **Luồng phê duyệt 2 cấp:**
  1. DRAFT → PROPOSED (Operator gửi)
  2. PROPOSED → PENDING_APPROVAL (Chờ L1)
  3. PENDING_APPROVAL → APPROVED_LEVEL1 (L1 duyệt) hoặc → REJECTED (L1 từ chối)
  4. APPROVED_LEVEL1 → APPROVED_LEVEL2 → PENDING_APPROVAL (Chờ L2)
  5. PENDING_APPROVAL → APPROVED (L2 duyệt) hoặc → REJECTED (L2 từ chối)
- **Từ chối ở bất kỳ cấp:** Ghi `rejectionReason` (lý do từ chối) → REJECTED. Operator sửa → PROPOSED → tiếp tục.
- **4-eyes principle:** Người gửi phê duyệt không được tự phê duyệt bản ghi của mình.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-113-01 | Chỉ gửi phê duyệt khi trạng thái = DRAFT | Submit |
| BR-113-02 | Phê duyệt 2 cấp: L1 (Cảng vụ/Chi cục) → L2 (Cục) | Approve |
| BR-113-03 | Từ chối ở bất kỳ cấp → REJECTED, ghi rejectionReason | Reject |
| BR-113-04 | 4-eyes principle: người gửi không được tự phê duyệt | Approve/Reject |
| BR-113-05 | L1 chỉ duyệt được bản ghi thuộc phạm vi đơn vị mình quản lý | Approve |
| BR-113-06 | L2 chỉ duyệt được bản ghi đã được L1 phê duyệt (APPROVED_LEVEL1) | Approve |
| BR-113-07 | Ghi audit log: actionType APPROVE_L1/APPROVE_L2/REJECT, changedBy, changedAt | Approve/Reject |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-113-01** — Gửi phê duyệt thành công: Trạng thái DRAFT → PROPOSED → PENDING_APPROVAL, HTTP 200.
- **AC-113-02** — L1 phê duyệt: Trạng thái APPROVED_LEVEL1, ghi approvalLevel1Date/By/Content, HTTP 200.
- **AC-113-03** — L2 phê duyệt: Trạng thái APPROVED (PUBLISHED), ghi approvalLevel2Date/By/Content, HTTP 200.
- **AC-113-04** — Từ chối: Ghi rejectionReason, trạng thái REJECTED, HTTP 200.
- **AC-113-05** — Tự phê duyệt (4-eyes): Hệ thống từ chối, HTTP 403.
- **AC-113-06** — L2 duyệt khi chưa qua L1: Hệ thống từ chối, HTTP 403.

### 4.3. User Stories kế thừa (nếu có)

- **US-113-01:** As an operator, I want to submit an LRIT station for approval so that it goes through the 2-level review process.
- **US-113-02:** As an approver L1, I want to review and approve/reject LRIT stations in my scope so that data quality is maintained.
- **US-113-03:** As an approver L2, I want to do final approval so that stations can be published for operational use.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Gửi phê duyệt | `coastal_station_lrit:submit` |
| Phê duyệt L1 | `coastal_station_lrit:approve_l1` |
| Phê duyệt L2 | `coastal_station_lrit:approve_l2` |
| Từ chối | `coastal_station_lrit:reject` |
| Xem danh sách | `coastal_station_lrit:read` |
| Xem chi tiết | `coastal_station_lrit:read` |

**Admin Cục:** Full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật/người duyệt/thời gian duyệt (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 7 trạng thái; luồng 2 cấp (L1 → L2) |
| 2 | Có bước phê duyệt không | Có — 2 cấp bắt buộc (Cảng vụ/Chi cục → Cục) |
| 3 | Lọc cha-con / theo đơn vị | Có — L1 duyệt theo phạm vi đơn vị; L2 duyệt toàn Cục |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `coastal_station_lrit:submit`, `coastal_station_lrit:approve_l1`, `coastal_station_lrit:approve_l2`, `coastal_station_lrit:reject` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — File đính kèm (UploadFileTable) |
| 8 | Giao diện khác mẫu chung | Có — 3 khối read-only (vận hành, bảo trì, sự cố) + 5 trường GIS |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/stations/lrit/{id}/submit` | Gửi phê duyệt (DRAFT → PROPOSED) | `coastal_station_lrit:submit` |
| POST | `/api/v1/stations/lrit/{id}/approve` | Phê duyệt (L1 hoặc L2 tùy trạng thái) | `coastal_station_lrit:approve_l1` hoặc `approve_l2` |
| POST | `/api/v1/stations/lrit/{id}/reject` | Từ chối (ghi rejectionReason) | `coastal_station_lrit:reject` |
| GET | `/api/v1/stations/lrit/{id}` | Xem chi tiết | `coastal_station_lrit:read` |
| GET | `/api/v1/stations/lrit/{id}/history` | Lịch sử thay đổi | `coastal_station_lrit:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `coastal_station_lrit` (Đài LRIT):**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | UUID | Có | Primary key |
| `org_unit_id` | UUID | Có | FK → org_unit, DataScopeAspect |
| `operating_org_id` | UUID | Có | FK → org_unit (đơn vị khai thác) |
| `code` | VARCHAR(50) | Có | Tự sinh `LRIT-{seq}`, unique, bất biến |
| `name` | TEXT | Có | Tên đài |
| `location_province` | VARCHAR(200) | Có | Địa điểm Tỉnh/TP |
| `location_detail` | TEXT | Không | Địa điểm chi tiết |
| `status` | SMALLINT | Có | ApprovalStatus enum (0-6) |
| `operational_status` | SMALLINT | Có | Tình trạng kỹ thuật |
| `coverage_area` | TEXT | Không | Vùng phủ sóng |
| `services_provided` | JSON/TEXT | Không | Multi-select dịch vụ |
| `notes` | TEXT | Không | Ghi chú |
| `object_type` | VARCHAR(20) | Không | GIS: Điểm/Đường/Vùng |
| `symbol` | VARCHAR(100) | Không | GIS: Biểu tượng |
| `coordinate_system` | VARCHAR(50) | Không | GIS: Hệ quy chiếu |
| `display_rule` | TEXT | Không | GIS: Quy tắc hiển thị |
| `coordinates` | JSON/TEXT | Không | GIS: Tọa độ LongLatTable |
| `approval_level1_date` | TIMESTAMP | Không | Ngày duyệt cấp L1 |
| `approval_level1_by` | UUID | Không | Người duyệt L1 |
| `approval_level1_content` | TEXT | Không | Nội dung duyệt L1 |
| `approval_level2_date` | TIMESTAMP | Không | Ngày duyệt cấp L2 |
| `approval_level2_by` | UUID | Không | Người duyệt L2 |
| `approval_level2_content` | TEXT | Không | Nội dung duyệt L2 |
| `submitted_at` | TIMESTAMP | Không | Ngày gửi phê duyệt |
| `submitted_by` | UUID | Không | Người gửi phê duyệt |
| `created_by` | UUID | Có | Người tạo |
| `created_at` | TIMESTAMP | Có | Thời gian tạo |
| `updated_by` | UUID | Không | Người sửa cuối |
| `updated_at` | TIMESTAMP | Không | Thời gian sửa cuối |
| `deleted_at` | TIMESTAMP | Không | Soft-delete |
| ~~terminalId~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel — thay bằng code~~ |
| ~~imoNumber~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~reportingInterval~~ | ~~INT~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~antennaHeight~~ | ~~DECIMAL~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~powerOutput~~ | ~~DECIMAL~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~antennaType~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~dataFormat~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel~~ |
| ~~communicationChannel~~ | ~~VARCHAR~~ | ~~~~ | ~~Không còn theo Excel~~ |
