---
id: F-079
name: "Quản lý Phao tiêu - Lịch sử"
slug: quan-ly-phao-tieu-lich-su
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07"
last-updated: "2026-08-24"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Phao tiêu - Lịch sử

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-079
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng thường (không có bước phê duyệt)
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (TKCT) + Excel `HH_Tính năng & danh sách các trường thông tin.xlsx` sheet "QL Phao tiêu"

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **"Điểm khác biệt so với mẫu chung"** (mục 5, dòng 3 — *"Lọc cha-con / theo đơn vị"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Cho phép người dùng xem lịch sử thao tác trên các phao tiêu thông qua bảng `beacon_history` với điều kiện lọc `beaconType = 'BUOY'`. Lịch sử ghi lại tất cả các hành động: CREATE (tạo mới), UPDATE (cập nhật — ghi danh sách trường thay đổi), SUBMIT (gửi phê duyệt), APPROVE_L1 (phê duyệt cấp 1), APPROVE_L2 (phê duyệt cấp 2), REJECT (từ chối — ghi lý do), SOFT_DELETE (xóa mềm). Mỗi bản ghi lịch sử bao gồm: entityId, actionType, changedField, previousValue (JSON), newValue (JSON), changedBy, changedAt. Đây là yêu cầu bắt buộc trong quản lý tài sản công, cho phép cơ quan quản lý và thanh tra tra cứu ai đã thay đổi gì, khi nào.

## 2. Trường dữ liệu

Bảng mô tả các trường hiển thị trên màn hình lịch sử phao tiêu:

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Mã phao tiêu (entityId) | Không | Text (read-only) | UUID của phao tiêu — Excel row 8 |
| 2 | Tên phao tiêu | Không | Text (read-only) | Hiển thị tên phao tiêu tương ứng |
| 3 | Loại hành động (actionType) | Không | Badge (read-only) | CREATE/UPDATE/SUBMIT/APPROVE_L1/APPROVE_L2/REJECT/SOFT_DELETE |
| 4 | Trường thay đổi (changedField) | Không | Text (read-only) | Danh sách trường thay đổi khi UPDATE — Excel row 9, 14-38 |
| 5 | Giá trị cũ (previousValue) | Không | JSON (read-only) | Hiển thị dạng diff |
| 6 | Giá trị mới (newValue) | Không | JSON (read-only) | Hiển thị dạng diff |
| 7 | Người thực hiện (changedBy) | Không | Text (read-only) | Tên người dùng — Excel row 44, 46, 48, 51 |
| 8 | Thời gian (changedAt) | Không | Text (read-only) | Timestamp — Excel row 43, 45, 47, 50 |
| 9 | Lý do từ chối (rejectionReason) | Không | Text (read-only) | Chỉ hiện khi actionType = REJECT — Excel row 49, 52 |

## 3. Trạng thái và phê duyệt

- **Không có bước phê duyệt** — đây là chức năng xem lịch sử, không thay đổi trạng thái.
- Các actionType được ghi nhận:
  - **CREATE**: Khi tạo mới phao tiêu (status = DRAFT)
  - **UPDATE**: Khi cập nhật thông tin phao tiêu (ghi danh sách trường thay đổi)
  - **SUBMIT**: Khi gửi phao tiêu đi phê duyệt (DRAFT → PENDING_APPROVAL)
  - **APPROVE_L1**: Khi phê duyệt cấp 1 (PENDING_APPROVAL → APPROVED_LEVEL1)
  - **APPROVE_L2**: Khi phê duyệt cấp 2 (APPROVED_LEVEL1 → APPROVED_LEVEL2/PUBLISHED)
  - **REJECT**: Khi từ chối phao tiêu (→ DRAFT, ghi lý do từ chối)
  - **SOFT_DELETE**: Khi xóa mềm phao tiêu (status → DELETED, deletedAt được điền)

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-079-01 | Lịch sử chỉ hiển thị bản ghi có beaconType = 'BUOY' | BeaconHistory |
| BR-079-02 | UPDATE ghi danh sách các trường đã thay đổi vào changedField | BeaconHistory.changedField |
| BR-079-03 | UPDATE ghi previousValue và newValue dưới dạng JSON | BeaconHistory.previousValue, newValue |
| BR-079-04 | REJECT bắt buộc ghi rejectionReason vào bản ghi lịch sử | BeaconHistory.rejectionReason |
| BR-079-05 | Soft-delete được ghi nhận qua hành động SOFT_DELETE | BeaconHistory — BR-009 |
| BR-079-06 | Lịch sử sắp xếp theo thời gian giảm dần (changedAt DESC) | Query |
| BR-079-07 | Không cho phép xóa bản ghi lịch sử | Audit trail immutability |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-079-01** — Xem danh sách lịch sử phao tiêu thành công: Hệ thống trả về HTTP 200 với danh sách beacon_history có beaconType = 'BUOY', sắp xếp theo changedAt DESC.
- **AC-079-02** — Lịch sử hiển thị đầy đủ các actionType: CREATE, UPDATE, SUBMIT, APPROVE_L1, APPROVE_L2, REJECT, SOFT_DELETE.
- **AC-079-03** — Mỗi bản ghi lịch sử bao gồm: entityId, actionType, changedBy, changedAt, previousValue, newValue.
- **AC-079-04** — Đối với hành động UPDATE, trường changedField hiển thị danh sách các trường đã thay đổi (vd: "name, color, shape, nextInspectionDate").
- **AC-079-05** — Đối với hành động REJECT, trường rejectionReason hiển thị lý do từ chối (≥ 10 ký tự).
- **AC-079-06** — Mọi vai trò (kể cả viewer) đều có thể xem lịch sử.
- **AC-079-07** — Admin Cục xem thêm metadata: tên người thực hiện (changedBy name), tên phao tiêu tương ứng (entityId → buoy.name).

### 4.3. User Stories kế thừa (nếu có)

- **US-079-01:** Là operator, tôi muốn xem lịch sử thay đổi của phao tiêu để biết ai đã sửa thông tin và sửa cái gì.
- **US-079-02:** Là approver_L1/L2, tôi muốn xem lịch sử phê duyệt để hiểu quá trình duyệt của phao tiêu.
- **US-079-03:** Là admin, tôi muốn xem toàn bộ audit trail (ai, khi nào, thay đổi gì) để phục vụ thanh tra, kiểm toán.
- **US-079-04:** Là viewer, tôi muốn xem lịch sử để hiểu quá trình hình thành dữ liệu phao tiêu.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem lịch sử | `buoy:read` |

**Admin Cục:** Full quyền + xem thêm metadata: tên người thực hiện (changedBy name), tên phao tiêu tương ứng (entityId → buoy.name).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — chỉ hiển thị actionType badge (CREATE/UPDATE/SUBMIT/APPROVE_L1/APPROVE_L2/REJECT/SOFT_DELETE) |
| 2 | Có bước phê duyệt không | Không — chỉ xem lịch sử phê duyệt, không thao tác |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — filter beacon_history theo subtree đơn vị của các phao tiêu thuộc phạm vi user |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — rejectionReason chỉ hiện khi actionType = REJECT; previousValue/newValue chỉ hiện khi actionType = UPDATE |
| 5 | Quyền riêng | `buoy:read` (dùng chung với các chức năng xem khác) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Có — hiển thị dạng timeline (dòng thời gian) thay vì bảng danh sách thông thường |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/beacon-history?type=BUOY&page={page}&size={size}` | Xem danh sách lịch sử phao tiêu (beacon_history WHERE beaconType='BUOY', phân trang) | `buoy:read` |
| GET | `/api/beacon-history/{id}` | Xem chi tiết một bản ghi lịch sử | `buoy:read` |
| GET | `/api/buoys/{id}/history` | Xem lịch sử của một phao tiêu cụ thể (beacon_history WHERE beaconType='BUOY' AND entityId={id}) | `buoy:read` |
| GET | `/api/users/{id}/name` | Tra cứu tên người dùng (cho hiển thị changedBy name) | `user:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `beacon_history` (Lịch sử thao tác báo hiệu):**

- `id` (UUID, PK) — Mã định danh bản ghi lịch sử
- `entityId` (UUID, FK → buoy.id / beacon_light.id / nha_tram_phao.id) — Mã phao tiêu / đèn biển / nhà trạm
- `beaconType` (VARCHAR(50), NOT NULL) — Loại báo hiệu: 'BUOY' / 'BEACON_LIGHT' / 'NHA_TRAM_PHAO' / 'NHA_TRAM_DEN'
- `actionType` (VARCHAR(50), NOT NULL) — Loại hành động: CREATE / UPDATE / SUBMIT / APPROVE_L1 / APPROVE_L2 / REJECT / SOFT_DELETE
- `changedField` (TEXT) — Danh sách trường thay đổi khi UPDATE (vd: "name, color, shape")
- `previousValue` (JSON) — Giá trị cũ trước khi thay đổi
- `newValue` (JSON) — Giá trị mới sau khi thay đổi
- `changedBy` (UUID, FK → app_user.id) — Người thực hiện thao tác
- `changedAt` (TIMESTAMP, NOT NULL) — Thời gian thực hiện
- `rejectionReason` (TEXT, nullable) — Lý do từ chối (chỉ hiện khi actionType = REJECT)
- Index: `idx_beacon_history_beacon_type` (beaconType)
- Index: `idx_beacon_history_entity_id` (entityId)
- Index: `idx_beacon_history_changed_at` (changedAt DESC)
