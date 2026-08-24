---
id: F-101
name: "Quản lý Đài Inmarsat - Phê duyệt"
slug: phe-duyet-dai-inmarsat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:06Z"
last-updated: "2026-08-24"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Đài Inmarsat - Phê duyệt

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-101
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

Tính năng cho phép người phê duyệt (approver_L1, approver_L2) xem xét và phê duyệt/từ chối một Đài Inmarsat đã được tạo ở trạng thái `DRAFT`. Quy trình phê duyệt 2 cấp: Cấp 1 (Cảng vụ/Chi cục) → Cấp 2 (Cục). Sau khi phê duyệt cấp 1, bản ghi chuyển sang `APPROVED_L1`; sau khi phê duyệt cấp 2, bản ghi chuyển sang `APPROVED` (PUBLISHED). Người từ chối phải nhập lý do. Hệ thống ghi nhận toàn bộ lịch sử phê duyệt.

## 2. Trường dữ liệu

Bảng mô tả các trường liên quan đến quy trình phê duyệt (theo sheet "Đài Inmarsat" — cột "Xem chi tiết" = true, các trường trạng thái & kiểm toán):

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Đơn vị quản lý | Có | SelectOrgCode | Mã đơn vị (orgUnitId) — scope filter |
| 2 | Đơn vị khai thác | Có | SelectCateOther | |
| 3 | Mã đài | Có | Input (disabled, tự sinh INMARSAT-{seq}) | |
| 4 | Tên đài | Có | InputTextArea | |
| 5 | Địa điểm (Tỉnh/TP) | Có | SelectCateOther | |
| 6 | Địa điểm chi tiết | Có | InputTextArea | |
| 7 | Tình trạng | Có | SelectAppParams | |
| 8 | Vùng phủ sóng | Không | InputTextArea | Thông tin đặc thù Inmarsat |
| 9 | Dịch vụ cung cấp | Không | SelectAppParams (multi-select) | Thông tin đặc thù Inmarsat |
| 10 | Tần số liên lạc | Không | InputTextArea | Thông tin đặc thù Inmarsat |
| 11 | Ghi chú | Không | InputTextArea | |
| 18 | Trạng thái | Có | Badge (read-only) | DRAFT → PENDING_APPROVAL → APPROVED_L1 → APPROVED_L2 → PUBLISHED |
| 21 | Ngày gửi phê duyệt | Có | Text (read-only) | Tự động khi operator gửi duyệt |
| 22 | Cán bộ gửi phê duyệt | Có | Text (read-only) | |
| 23 | Ngày phê duyệt cấp Cảng vụ/Chi cục | Có | Text (read-only) | Cấp 1 |
| 24 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | Có | Text (read-only) | Cấp 1 |
| 25 | Nội dung phê duyệt | Không | Text (read-only) | Cấp 1 |
| 26 | Ngày phê duyệt cấp Cục | Có | Text (read-only) | Cấp 2 |
| 27 | Cán bộ phê duyệt cấp Cục | Có | Text (read-only) | Cấp 2 |
| 28 | Nội dung phê duyệt | Không | Text (read-only) | Cấp 2 |

## 3. Trạng thái và phê duyệt

- **Quy trình phê duyệt 2 cấp:**
  1. **Cấp 1 (Cảng vụ/Chi cục):** Từ `DRAFT` → `APPROVED_L1`. Approver nhập lý do/phê duyệt.
  2. **Cấp 2 (Cục):** Từ `APPROVED_L1` → `APPROVED` (PUBLISHED). Approver nhập lý do/phê duyệt.
- Nếu từ chối ở bất kỳ cấp nào: chuyển sang `REJECTED`, ghi `rejectionReason`.
- Trạng thái lưu dạng số trong DB (xem `StationStatus` enum trong `00-lean-spec.md`).
- Không cho phép tự duyệt (4-eyes principle): người tạo không được phép phê duyệt bản ghi của mình.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-101-01 | Chỉ cho phép phê duyệt bản ghi ở trạng thái `DRAFT` (cấp 1) hoặc `APPROVED_L1` (cấp 2) | Approve |
| BR-101-02 | Phê duyệt cấp 1: `DRAFT` → `APPROVED_L1`; cấp 2: `APPROVED_L1` → `APPROVED` (PUBLISHED) | Approve |
| BR-101-03 | Từ chối ở bất kỳ cấp: chuyển sang `REJECTED`, bắt buộc nhập `rejectionReason` | Reject |
| BR-101-04 | Không cho phép tự duyệt (4-eyes principle): người tạo bản ghi không được phê duyệt bản ghi của mình | Approve/Reject |
| BR-101-05 | Ghi nhận bản ghi lịch sử APPROVE_L1, APPROVE_L2, REJECT | Approve/Reject |
| BR-101-06 | Chỉ approver_L1 mới được duyệt cấp 1; chỉ approver_L2 mới được duyệt cấp 2 | Approve |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-101-01** — Phê duyệt cấp 1 thành công: Khi approver_L1 duyệt bản ghi ở trạng thái DRAFT, hệ thống chuyển sang APPROVED_L1, trả về HTTP 200.
- **AC-101-02** — Phê duyệt cấp 2 thành công: Khi approver_L2 duyệt bản ghi ở trạng thái APPROVED_L1, hệ thống chuyển sang APPROVED (PUBLISHED), trả về HTTP 200.
- **AC-101-03** — Từ chối: Khi approver từ chối, hệ thống chuyển sang REJECTED, bắt buộc nhập lý do, trả về HTTP 200.
- **AC-101-04** — Tự duyệt bị chặn: Khi người tạo cố gắng duyệt bản ghi của mình, hệ thống từ chối (HTTP 403).

### 4.3. User Stories kế thừa (nếu có)

- **US-101-01:** Là approver_L1, tôi muốn phê duyệt/từ chối Đài Inmarsat ở cấp Cảng vụ/Chi cục để đưa vào quy trình phê duyệt cấp cao hơn.
- **US-101-02:** Là approver_L2, tôi muốn phê duyệt/từ chối Đài Inmarsat ở cấp Cục để hoàn tất quy trình.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Phê duyệt Đài Inmarsat | `coastal-station-inmarsat:approve` |
| Từ chối Đài Inmarsat | `coastal-station-inmarsat:reject` |

**Admin Cục:** Full quyền + xem thêm metadata người tạo/người sửa/thời gian (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — DRAFT → PENDING_APPROVAL → APPROVED_L1 → APPROVED_L2 → PUBLISHED → REJECTED |
| 2 | Có bước phê duyệt không | Có — 2 cấp (Cảng vụ/Chi cục → Cục) |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` bắt buộc, filter theo subtree đơn vị cha, Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `coastal-station-inmarsat:approve`, `coastal-station-inmarsat:reject` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/stations/inmarsat/{id}/approve` | Phê duyệt Đài Inmarsat (cấp 1 hoặc 2) | `coastal-station-inmarsat:approve` |
| POST | `/api/v1/stations/inmarsat/{id}/reject` | Từ chối Đài Inmarsat | `coastal-station-inmarsat:reject` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `coastal_station_inmarsat` (Đài Inmarsat):**
🔴 `id` UUID PK, 🔴 `org_unit_id` UUID FK → `org_unit`, 🔴 `operator_org_id` UUID FK, 🔴 `device_code` VARCHAR(50) UNIQUE (tự sinh INMARSAT-{seq}), 🔴 `device_name` VARCHAR(255), 🔴 `location_province` VARCHAR(255), 🔴 `location_detail` TEXT, 🔴 `status` INT (StationStatus enum), 🔴 `coverage_zone` TEXT, 🔴 `services` TEXT (multi-select JSON), 🔴 `frequency` TEXT, 🔴 `notes` TEXT, 🔴 `object_type` VARCHAR(20) (Điểm/Đường/Vùng), 🔴 `symbol` VARCHAR(100), 🔴 `coordinate_system` VARCHAR(50), 🔴 `display_rule` TEXT, 🔴 `latitude` DECIMAL, 🔴 `longitude` DECIMAL, 🔴 `created_by` UUID, 🔴 `created_at` TIMESTAMP, 🔴 `updated_by` UUID, 🔴 `updated_at` TIMESTAMP, 🔴 `deleted_at` TIMESTAMP, 🔴 `deleted_by` UUID
