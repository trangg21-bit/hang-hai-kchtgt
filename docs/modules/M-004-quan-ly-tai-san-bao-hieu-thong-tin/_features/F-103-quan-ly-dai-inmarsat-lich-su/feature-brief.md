---
id: F-103
name: "Quản lý Đài Inmarsat - Lịch sử"
slug: quan-ly-dai-inmarsat-lich-su
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:06Z"
last-updated: "2026-08-24"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Đài Inmarsat - Lịch sử

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-103
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng thường (không có bước phê duyệt)
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (TKCT)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **"Điểm khác biệt so với mẫu chung"** (mục 5, dòng 3 — *"Lọc cha-con / theo đơn vị"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Tính năng cho phép người dùng tra cứu lịch sử thay đổi của một Đài Inmarsat cụ thể. Hệ thống ghi nhận mọi thao tác: tạo mới (CREATE), cập nhật (UPDATE), xóa mềm (SOFT_DELETE), phê duyệt L1 (APPROVE_L1), phê duyệt L2 (APPROVE_L2) và từ chối (REJECT). Mỗi bản ghi lịch sử chứa `actionType`, `changedField`, `previousValue`, `newValue`, `changedBy`, `changedAt` và `details`. API GET trả về danh sách sắp xếp theo thời gian giảm dần.

## 2. Trường dữ liệu

Bảng mô tả các trường của bản ghi lịch sử (theo `StationHistory` entity trong `00-lean-spec.md`):

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Action type | Có | Text (read-only) | CREATE, UPDATE, SOFT_DELETE, APPROVE_L1, APPROVE_L2, REJECT |
| 2 | Trường thay đổi | Có | Text (read-only) | Tên trường bị thay đổi (vd: `device_name`, `status`, `frequency`) |
| 3 | Giá trị cũ | Có | Text (read-only) | Giá trị trước khi thay đổi |
| 4 | Giá trị mới | Có | Text (read-only) | Giá trị sau khi thay đổi |
| 5 | Người thay đổi | Có | Text (read-only) | Tên user thực hiện thao tác |
| 6 | Thời gian thay đổi | Có | Text (read-only) | Timestamp của thao tác |
| 7 | Chi tiết | Không | Text (read-only) | Thông tin bổ sung (vd: lý do từ chối, nội dung phê duyệt) |

## 3. Trạng thái và phê duyệt

- **Không có bước phê duyệt** trong chức năng xem lịch sử — chỉ hiển thị thông tin.
- Lịch sử được ghi nhận tự động cho mọi thao tác CRUD + phê duyệt.
- Bản ghi soft-delete vẫn giữ lịch sử (xem BR-009 trong `00-lean-spec.md`).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-103-01 | Ghi nhận tự động mọi thao tác: CREATE, UPDATE, SOFT_DELETE, APPROVE_L1, APPROVE_L2, REJECT | History |
| BR-103-02 | Danh sách lịch sử sắp xếp theo `changedAt` giảm dần (mới nhất lên đầu) | History |
| BR-103-03 | Chỉ hiển thị lịch sử của bản ghi thuộc phạm vi đơn vị của user | History |
| BR-103-04 | Bản ghi soft-delete vẫn giữ toàn bộ lịch sử trước đó | History |
| BR-103-05 | Admin Cục xem thêm metadata người thực hiện thao tác | History |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-103-01** — Tra cứu hợp lệ: Khi gọi API với entityId hợp lệ, hệ thống trả về HTTP 200 kèm danh sách bản ghi lịch sử.
- **AC-103-02** — Đầy đủ action types: Danh sách bao gồm CREATE, UPDATE, SOFT_DELETE, APPROVE_L1, APPROVE_L2, REJECT.
- **AC-103-03** — Hiển thị chính xác: Mỗi bản ghi hiển thị chính xác `changedField`, `previousValue`, `newValue`, `changedBy`, `changedAt`.

### 4.3. User Stories kế thừa (nếu có)

- **US-103-01:** Là admin/operator, tôi muốn xem lịch sử thay đổi của một Đài Inmarsat để kiểm toán và truy xuất nguồn gốc dữ liệu.
- **US-103-02:** Là lãnh đạo, tôi muốn xem ai đã thay đổi thông số kỹ thuật của Đài Inmarsat và khi nào để hỗ trợ điều tra.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem lịch sử Đài Inmarsat | `coastal-station-inmarsat:read` |

**Admin Cục:** Full quyền + xem thêm metadata người thực hiện thao tác (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không |
| 2 | Có bước phê duyệt không | Không |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — chỉ hiển thị lịch sử của bản ghi thuộc phạm vi đơn vị user |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `coastal-station-inmarsat:read` (chung với xem chi tiết) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/stations/inmarsat/{id}/history` | Xem lịch sử thay đổi Đài Inmarsat | `coastal-station-inmarsat:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `station_history` (Lịch sử thay đổi):**
🔴 `id` UUID PK, 🔴 `entity_type` VARCHAR(50) (CoastalStationInmarsat), 🔴 `entity_id` UUID FK → `coastal_station_inmarsat`, 🔴 `action_type` VARCHAR(20) (CREATE/UPDATE/SOFT_DELETE/APPROVE_L1/APPROVE_L2/REJECT), 🔴 `changed_field` VARCHAR(100), 🔴 `previous_value` TEXT, 🔴 `new_value` TEXT, 🔴 `changed_by` UUID, 🔴 `changed_at` TIMESTAMP, 🔴 `details` TEXT
