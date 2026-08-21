---
id: F-031
name: Quản lý Cảng cạn - Lịch sử thay đổi
slug: ql-cct-lich-su
module-id: M-002
status: done
classification: local
priority: medium
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Cảng cạn - Lịch sử thay đổi

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-031 — Lịch sử thay đổi Cảng cạn
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng thường (backend ghi log tự động; chưa có UI riêng)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG (lịch sử thay đổi — mục 3.4). File này CHỈ ghi phần RIÊNG của chức năng.

---

## 1. Mô tả ngắn

Tự động ghi nhận mọi thay đổi dữ liệu Cảng cạn vào bảng `change_history` ở tầng backend: mỗi khi người dùng thực hiện thao tác **Lưu tạm / Lưu và phê duyệt** (F-026, F-027) hoặc **Xóa** (F-028), hệ thống ghi lại hành động (CREATE/UPDATE/DELETE), trường bị thay đổi, giá trị cũ → mới, người thực hiện, thời gian. Dữ liệu lịch sử **bất biến** (không sửa/xóa). **Hiện tại F-031 là backend-only** — chưa có giao diện người dùng riêng; việc hiển thị sẽ bổ sung sau nếu có yêu cầu.

## 2. Trường dữ liệu

Không có form nhập liệu — ghi từ bảng `change_history`:

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | id | Có | UUID | PK |
| 2 | entityId | Có | UUID (FK → dry_ports.id) | Cảng cạn bị thay đổi |
| 3 | entityType | Có | NVARCHAR (50) | "DRY_PORT" |
| 4 | actionType | Có | NVARCHAR (20) — CREATE / UPDATE / DELETE | Loại hành động |
| 5 | fieldName | Không | NVARCHAR (100) | Tên trường thay đổi |
| 6 | oldValue / newValue | Không | Text | Giá trị cũ / mới |
| 7 | changedBy / changedAt | Có | UUID / TIMESTAMP | Người thực hiện, thời gian |
| 8 | deletedBy, deletedAt | Có (khi DELETE) | UUID / TIMESTAMP | Ghi khi xóa (F-028) |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.4 (lịch sử thay đổi; xóa mềm ghi `deletedAt`/`deletedBy`) và mục 3.5 (quy trình 2 cấp theo `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`).
- Ghi `change_history` cùng transaction với thao tác chính — lỗi ghi log → rollback toàn bộ.
- Dữ liệu lịch sử bất biến — không có API sửa/xóa; lưu vĩnh viễn.
- Hiện tại không có UI riêng (backend-only); Admin Cục truy vấn qua công cụ quản trị nội bộ.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-031-01 | Lịch sử thay đổi bất biến — không thể xóa hoặc sửa bản ghi trong `change_history` | Audit |
| BR-031-02 | Bản ghi CREATE khi tạo mới (F-026); mỗi trường điền tạo 1 dòng CREATE | F-026 |
| BR-031-03 | Bản ghi UPDATE mỗi lần Lưu và phê duyệt (F-027) — chỉ ghi trường thực sự thay đổi (old_value ≠ new_value) | F-027 |
| BR-031-04 | Bản ghi DELETE khi xóa (F-028) — ghi `deletedBy` và `deletedAt` | F-028 |
| BR-031-05 | Transaction atomic — ghi `change_history` cùng transaction với thao tác chính; lỗi → rollback | Backend |
| BR-031-06 | Backend-only — chưa có UI/API công khai cho end-user xem lịch sử | Toàn bộ |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Ghi log (backend tự động) | Không cần quyền người dùng — hệ thống ghi |
| Xem lịch sử (khi có UI sau này) | `dryport:history` (đề xuất — SA chốt) |

| Vai trò điển hình | Thao tác |
|---|---|
| Tất cả vai trò | Không tương tác trực tiếp — backend tự ghi log |
| Admin Cục | Truy vấn qua DB nội bộ (phục vụ kiểm toán) |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — truy xuất toàn bộ lịch sử thay đổi mọi đơn vị qua công cụ quản trị nội bộ.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — ghi sự kiện của 7 trạng thái chung |
| 2 | Có bước phê duyệt không | Không — backend ghi log tự động |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị (orgUnitId — tài liệu nền mục 3.3) |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | Không có quyền riêng (backend-only); xem sau này dùng `dryport:history` (đề xuất) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Không — chưa có UI (backend-only) |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| (nội bộ) | — | Ghi `change_history` trong cùng transaction với F-026/F-027/F-028 | Backend |
| GET | `/api/v1/dry-ports/{id}/history` | (Đề xuất cho UI sau) Lịch sử thay đổi của Cảng cạn | `dryport:history` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `change_history` (nhật ký thay đổi — dùng chung module):** id (UUID PK), entityId (UUID, FK → dry_ports.id), entityType (NVARCHAR 50 — "DRY_PORT"), actionType (NVARCHAR 20 — CREATE / UPDATE / DELETE), fieldName (NVARCHAR 100), oldValue (TEXT, nullable), newValue (TEXT), changedBy (UUID), changedAt (TIMESTAMP) — read-only, bất biến; ghi trong transaction với thao tác chính.
