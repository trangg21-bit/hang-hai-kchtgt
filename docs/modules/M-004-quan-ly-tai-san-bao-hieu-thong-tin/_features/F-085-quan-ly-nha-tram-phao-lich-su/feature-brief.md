---
id: F-085
name: Lịch sử Nhà trạm phao
slug: quan-ly-nha-tram-phao-lich-su
module-id: M-004
status: proposed
classification: local
priority: medium
created: 2026-07-07T03:32:42Z
last-updated: 2026-08-23
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Lịch sử Nhà trạm phao

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-085
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng thường (không có bước phê duyệt) — tra cứu lịch sử thay đổi nhà trạm phao
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (Excel `HH_Tính năng & danh sách các trường thông tin.xlsx`, sheet `QL Nhà trạm phao tiêu`)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **"Điểm khác biệt so với mẫu chung"** (mục 5, dòng 3 — *"Lọc cha-con / theo đơn vị"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Cho phép mọi người dùng có quyền `nhatramphao:read` tra cứu lịch sử thay đổi của nhà trạm phao. Lịch sử bao gồm các hành động: CREATE (tạo mới), UPDATE (cập nhật), APPROVE_L1 (phê duyệt cấp 1), APPROVE_L2 (phê duyệt cấp 2), REJECT (từ chối), SOFT_DELETE (xóa mềm). Người dùng có thể lọc theo entityId, actionType, khoảng thời gian. Hệ thống trả về danh sách phân trang, sắp xếp theo thời gian giảm dần. Tất cả thông tin lịch sử là read-only — không thể sửa/xóa.

## 2. Trường dữ liệu

Bảng mô tả các trường hiển thị trên màn hình lịch sử (nguồn: Excel sheet `QL Nhà trạm phao tiêu`, cột "Xem chi tiết" — các trường trạng thái & kiểm toán):

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | ID bản ghi lịch sử | Có | UUID (read-only) | |
| 2 | ID nhà trạm phao | Có | UUID (read-only) | Liên kết đến nhà trạm phao |
| 3 | Loại hành động | Có | Badge (read-only) | CREATE, UPDATE, APPROVE_L1, APPROVE_L2, REJECT, SOFT_DELETE |
| 4 | Trường thay đổi | Không | Text (read-only) | Tên trường bị thay đổi |
| 5 | Giá trị trước | Không | Text (read-only) | Giá trị cũ |
| 6 | Giá trị sau | Không | Text (read-only) | Giá trị mới |
| 7 | Người thực hiện | Có | Text (read-only) | changedBy |
| 8 | Thời gian thực hiện | Có | Text (read-only) | changedAt |
| 9 | Lý do | Không | Text (read-only) | reason (phê duyệt/từ chối) |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.7 (trạng thái lưu dạng số, không lưu chữ).
- Lịch sử thay đổi là **read-only** — không thể sửa/xóa bản ghi lịch sử.
- Không có bước phê duyệt cho thao tác tra cứu lịch sử.
- Lịch sử được ghi tự động bởi hệ thống khi thực hiện bất kỳ thao tác CRUD hoặc phê duyệt nào trên nhà trạm phao.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-085-01 | Lịch sử chỉ đọc (read-only) — không thể sửa/xóa bản ghi lịch sử | Read |
| BR-085-02 | Chỉ hiển thị lịch sử nhà trạm phao thuộc phạm vi người dùng (data scope) | Read |
| BR-085-03 | Lọc theo actionType: CREATE, UPDATE, APPROVE_L1, APPROVE_L2, REJECT, SOFT_DELETE | Read |
| BR-085-04 | Lọc theo khoảng thời gian (from/to) | Read |
| BR-085-05 | Sắp xếp theo thời gian thực hiện giảm dần (mới nhất trước) | Read |
| BR-085-06 | Phân trang: mặc định 20 bản ghi/page | Read |
| BR-085-07 | Admin Cục xem thêm metadata người thực hiện đầy đủ | Read |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-085-01** — Tra cứu không có filter: hệ thống trả về danh sách tất cả lịch sử nhà trạm phao (phân trang, mặc định 20 bản ghi), HTTP 200.
- **AC-085-02** — Tra cứu với filter entityId: hệ thống trả về lịch sử chỉ của nhà trạm phao đó.
- **AC-085-03** — Tra cứu với filter actionType=APPROVE_L2: hệ thống trả về lịch sử chỉ gồm các hành động phê duyệt L2.
- **AC-085-04** — Tra cứu với filter from/to: hệ thống trả về lịch sử trong khoảng thời gian chỉ định.
- **AC-085-05** — Sắp xếp: hệ thống trả về danh sách sắp xếp theo changedAt giảm dần.
- **AC-085-06** — Không có quyền: hệ thống trả về HTTP 403 Forbidden.

### 4.3. User Stories kế thừa (nếu có)

- **US-085-01:** Là người dùng có quyền, tôi muốn tra cứu lịch sử thay đổi của nhà trạm phao để theo dõi toàn bộ quá trình tạo, sửa, phê duyệt và xóa.
- **US-085-02:** Là người dùng có quyền, tôi muốn lọc lịch sử theo hành động (phê duyệt, từ chối, cập nhật) để nhanh chóng tìm thấy thông tin cần thiết.
- **US-085-03:** Là Admin Cục, tôi muốn xem đầy đủ thông tin người thực hiện và thời gian để phục vụ công tác kiểm tra, giám sát.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem lịch sử nhà trạm phao | `nhatramphao:read` |

**Admin Cục:** Full quyền xem lịch sử + xem thêm metadata người thực hiện đầy đủ (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — lịch sử không có trạng thái riêng |
| 2 | Có bước phê duyệt không | Không — lịch sử chỉ đọc |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — chỉ xem được lịch sử nhà trạm phao thuộc đơn vị mình quản lý hoặc đơn vị con |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — Lý do chỉ hiện với hành động APPROVE/REJECT |
| 5 | Quyền riêng | `nhatramphao:read` (chung với xem chi tiết) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Có — hiển thị timeline thay đổi |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/nhatram-phao/{id}/history` | Lấy lịch sử thay đổi nhà trạm phao | `nhatramphao:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `nha_tram_phao_history` (Lịch sử nhà trạm phao):**
- `id` UUID PK 🔴
- `nhaTramPhaoId` UUID NOT NULL FK 🔴
- `actionType` VARCHAR NOT NULL (CREATE/UPDATE/APPROVE_L1/APPROVE_L2/REJECT/SOFT_DELETE) 🔴
- `changedField` VARCHAR 🔴
- `previousValue` TEXT 🔴
- `newValue` TEXT 🔴
- `changedBy` UUID NOT NULL FK 🔴
- `changedAt` TIMESTAMP NOT NULL 🔴
- `reason` TEXT 🔴
- `diffData` JSONB 🔴
