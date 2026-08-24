---
id: F-097
name: Quản lý Đài TTDH - Lịch sử
slug: quan-ly-dai-ttdh-lich-su
module-id: M-004
status: proposed
classification: local
priority: medium
created: 2026-07-07T03:32:57Z
last-updated: 2026-08-23
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Đài TTDH - Lịch sử

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-097
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng có bước phê duyệt
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (TKCT)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **\"Điểm khác biệt so với mẫu chung\"** (mục 5, dòng 3 — *\"Lọc cha-con / theo đơn vị\"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

> **⚠️ LƯU Ý QUAN TRỌNG — Sửa (S) = false toàn bộ trường:**
> Sheet Excel `Đài TTDH` đánh dấu **Sửa = false** cho TOÀN BỘ trường (cột \"Sửa\" trống). Feature F-097 (Lịch sử) là màn hình read-only — không cho phép sửa bất kỳ trường nào. Ghi chú này được thêm dưới dạng banner để cảnh báo mâu thuẫn với F-093 (Cập nhật).

---

## 1. Mô tả ngắn

Cho phép cán bộ nghiệp vụ xem lịch sử thay đổi của một Đài Thông tin Duyên hải (TTDH). Lịch sử ghi nhận mọi thao tác: tạo mới (CREATE), cập nhật (UPDATE), xóa mềm (DELETE), phê duyệt cấp 1 (APPROVE_L1), phê duyệt cấp 2 (APPROVE_L2), từ chối (REJECT). Mỗi mốc lịch sử hiển thị: action type, trường thay đổi, giá trị cũ/mới (nếu là UPDATE), nội dung phê duyệt/từ chối (nếu là APPROVE/REJECT), người thực hiện, thời gian. Lịch sử sắp xếp theo `changedAt DESC`, immutable — không sửa, không xóa.

## 2. Trường dữ liệu

Feature F-097 (Lịch sử) **không có trường dữ liệu để chỉnh sửa** — chỉ là màn hình xem lịch sử read-only. Các trường hiển thị trong lịch sử:

| STT | Tên trường (theo Excel) | Loại điều khiển | Bắt buộc | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| — | Action type | Badge (read-only) | Có | Có | Có | Có | Không | Không | CREATE, UPDATE, DELETE, APPROVE_L1, APPROVE_L2, REJECT |
| — | Changed field | Text (read-only) | Không | Không | Có | Có | Không | Không | Tên trường thay đổi (UPDATE) |
| — | Previous value | Text (read-only) | Không | Không | Không | Có | Không | Không | Giá trị cũ (UPDATE) |
| — | New value | Text (read-only) | Không | Không | Không | Có | Không | Không | Giá trị mới (UPDATE) |
| — | Approval level | Badge (read-only) | Không | Không | Có | Có | Không | Không | L1 hoặc L2 (APPROVE/REJECT) |
| — | Approval content | Text (read-only) | Không | Không | Không | Có | Không | Không | Nội dung phê duyệt (APPROVE) |
| — | Rejection reason | Text (read-only) | Không | Không | Không | Có | Không | Không | Lý do từ chối (REJECT) |
| — | Changed by | Text (read-only) | Có | Có | Có | Có | Không | Không | Người thực hiện |
| — | Changed at | Text (read-only) | Có | Có | Có | Có | Không | Không | Thời gian thay đổi |
| — | Filter: action type | Select | Không | — | Có | — | Không | Không | Lọc theo action type |
| — | Filter: date range | DateRange | Không | — | Có | — | Không | Không | Lọc theo khoảng thời gian |

**⚠️ Ghi chú về trường Sửa=false toàn bộ:** Sheet Excel đánh dấu cột \"Sửa\" trống (false) cho tất cả trường. Feature F-097 (Lịch sử) là màn hình read-only — không cho phép sửa bất kỳ trường nào.

## 3. Trạng thái và phê duyệt

- **7 trạng thái** (lưu dạng số trong DB, không lưu chữ):
  1. `DRAFT` (0) — Nháp
  2. `PROPOSED` (1) — Đã gửi phê duyệt
  3. `APPROVED_L1` (2) — Đã duyệt cấp 1 (Cảng vụ / Chi cục)
  4. `APPROVED_L2` (3) — Đã duyệt cấp 2 (Cục)
  5. `ACTIVE` (4) — Đang hoạt động
  6. `SUSPENDED` (5) — Tạm ngừng
  7. `DELETED` (6) — Đã xóa (soft delete)

- **Action types trong lịch sử:**
  - `CREATE` — Tạo mới bản ghi (DRAFT)
  - `UPDATE` — Cập nhật thông tin
  - `DELETE` — Xóa mềm (DELETED)
  - `APPROVE_L1` — Duyệt cấp 1 (Cảng vụ/Chi cục)
  - `APPROVE_L2` — Duyệt cấp 2 (Cục)
  - `REJECT` — Từ chối (quay về DRAFT)

- **Lịch sử immutable:**
  - Không sửa, không xóa bất kỳ mốc lịch sử nào.
  - Sắp xếp theo `changedAt DESC` (mới nhất lên đầu).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/01-base-pattern.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-097-01 | Mọi thao tác CRUD + APPROVE + REJECT đều ghi station_history | History |
| BR-097-02 | UPDATE ghi changedField, previousValue, newValue | History |
| BR-097-03 | Lịch sử immutable — không sửa, không xóa | History |
| BR-097-04 | Sắp xếp changedAt DESC | History |
| BR-097-05 | Filter theo action type và khoảng thời gian | History |
| BR-097-06 | APPROVE/REJECT ghi approvalLevel, approvalContent/rejectionReason | History |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-097-01** — GET /{id}/history → danh sách sắp xếp theo changedAt DESC.
- **AC-097-02** — Đầy đủ action types: CREATE, UPDATE, DELETE, APPROVE_L1, APPROVE_L2, REJECT.
- **AC-097-03** — UPDATE hiển thị diff: changedField, previousValue, newValue.
- **AC-097-04** — APPROVE/REJECT hiển thị nội dung: approvalContent hoặc rejectionReason.
- **AC-097-05** — Filter: Theo action type, khoảng thời gian.
- **AC-097-06** — BE audit log: Tự động ghi trong mọi service method.

### 4.3. User Stories kế thừa (nếu có)

- **US-097-01:** Như một cán bộ nghiệp vụ, tôi muốn xem lịch sử thay đổi của một Đài TTDH để theo dõi toàn bộ hoạt động.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem lịch sử Đài TTDH | `coastalstation:history` |

**Admin Cục:** full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 7 trạng thái: DRAFT, PROPOSED, APPROVED_L1, APPROVED_L2, ACTIVE, SUSPENDED, DELETED |
| 2 | Có bước phê duyệt không | Không — màn lịch sử chỉ xem, không phê duyệt |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — chỉ xem lịch sử bản ghi trong phạm vi đơn vị của user |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — changedField/previousValue/newValue chỉ hiện cho UPDATE; approvalContent/rejectionReason chỉ hiện cho APPROVE/REJECT |
| 5 | Quyền riêng | `coastalstation:history` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Có — timeline dọc với dot màu theo action type, filter bar: select action type + date range |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/coastalstations/{id}/history` | Xem lịch sử thay đổi | `coastalstation:history` |
| GET | `/api/v1/coastalstations/{id}/history?actionType=UPDATE&fromDate=...&toDate=...` | Lọc lịch sử theo action type + thời gian | `coastalstation:history` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `station_history` (Lịch sử thay đổi):**

| Trường | Kiểu | Ghi chú |
|---|---|---|
| id | UUID | Primary key |
| entity_id | UUID | FK → coastal_station.id |
| action_type | VARCHAR(20) | CREATE, UPDATE, DELETE, APPROVE_L1, APPROVE_L2, REJECT |
| changed_field | VARCHAR(100) | Tên trường thay đổi (UPDATE) |
| previous_value | TEXT | Giá trị cũ (UPDATE) |
| new_value | TEXT | Giá trị mới (UPDATE) |
| approval_level | VARCHAR(10) | L1 hoặc L2 (APPROVE/REJECT) |
| rejection_reason | TEXT | Lý do từ chối (REJECT) |
| approval_content | TEXT | Nội dung phê duyệt (APPROVE) |
| changed_by | UUID | Người thực hiện |
| changed_at | TIMESTAMP | Thời gian thay đổi |

🔴 **Chỉ số cần thêm:**
- Index trên `entity_id + changed_at DESC` (tối ưu truy vấn lịch sử).
- Index trên `action_type` (tối ưu lọc theo action type).
