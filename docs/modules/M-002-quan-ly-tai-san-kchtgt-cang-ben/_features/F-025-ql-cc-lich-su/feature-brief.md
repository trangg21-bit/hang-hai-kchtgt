---
id: F-025
name: Lịch sử Cầu cảng
slug: ql-cc-lich-su
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Lịch sử Cầu cảng

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-025 — Lịch sử Cầu cảng
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng thường (chỉ xem, không tạo/sửa/xóa)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG (lịch sử thay đổi — mục 3.4). File này CHỈ ghi phần RIÊNG của chức năng.

---

## 1. Mô tả ngắn

Cho phép người dùng có quyền `pier:read` xem toàn bộ lịch sử thay đổi của một Cầu cảng: tạo mới (F-020), cập nhật (F-021), phê duyệt/từ chối (F-023), xóa mềm (F-022) — hiển thị dạng **card box** theo thời gian giảm dần (mới nhất trên đầu), mỗi card gồm metadata (thời gian, người thực hiện) và danh sách trường thay đổi (giá trị cũ → mới, phân biệt màu sắc). Hỗ trợ lọc theo khoảng thời gian, người thực hiện, loại hành động. Dữ liệu read-only, bất biến, lưu trữ vĩnh viễn phục vụ kiểm toán.

## 2. Trường dữ liệu

Không có form nhập liệu — hiển thị từ bảng nhật ký thay đổi (change log) + nhật ký phê duyệt (approval log):

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | pierId | Có | UUID | Cầu cảng cần xem lịch sử |
| 2 | actionType | Có (hiển thị) | Enum: TAO_MOI / CAP_NHAT / PHE_DUYET / TU_CHOI / XOA_MEM | Badge màu theo loại hành động |
| 3 | fieldChanged | Không | Text | Trường bị thay đổi (hiển thị tiếng Việt) |
| 4 | oldValue / newValue | Không | Text | Giá trị cũ / mới; tạo mới → "Tạo mới"; xóa mềm → "Xóa mềm" |
| 5 | changedBy / changedAt | Có (hiển thị) | UUID / TIMESTAMP (HH:mm:ss dd/MM/yyyy) | Người thực hiện (từ tài khoản đăng nhập, không giả mạo), thời gian |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.4 (lịch sử thay đổi; xóa mềm ghi `deletedAt`/`deletedBy`) và mục 3.5 (quy trình 2 cấp theo `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`).
- Lịch sử hợp nhất một dòng thời gian từ các sự kiện của F-020, F-021, F-022, F-023 (phê duyệt/từ chối kèm cấp duyệt và lý do).
- Dữ liệu lịch sử bất biến: chỉ được bổ sung, không sửa/xóa; lưu trữ vĩnh viễn.
- Chức năng chỉ xem — không thay đổi trạng thái.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-025-01 | Ghi nhận tự động mọi thao tác (tạo, cập nhật, phê duyệt, từ chối, xóa mềm) — không bỏ qua thay đổi nào | Audit |
| BR-025-02 | Lịch sử bất biến — read-only, không sửa/xóa bởi bất kỳ ai | Audit |
| BR-025-03 | Lưu trữ vĩnh viễn phục vụ kiểm toán | Audit |
| BR-025-04 | Tên người thực hiện tự động lấy từ tài khoản đăng nhập | Audit |
| BR-025-05 | Thay đổi quan trọng (phê duyệt, từ chối, đổi trạng thái) làm nổi bật bằng badge màu | View |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem lịch sử thay đổi của Cầu cảng | `pier:read` |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Xem đầy đủ |
| Quản lý tài sản / Lãnh đạo / Kiểm toán viên | Xem đầy đủ |
| Nhân viên vận hành | Xem |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — xem đầy đủ lịch sử kèm người thực hiện, thời gian (phục vụ kiểm toán).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — hiển thị sự kiện của 7 trạng thái chung |
| 2 | Có bước phê duyệt không | Không — chỉ xem lịch sử |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị (orgUnitId — tài liệu nền mục 3.3) |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `pier:read` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Không (card box + FilterBar + Pagination) |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/pier/{id}/history` | Lịch sử thay đổi của Cầu cảng: actionType, field, oldValue, newValue, changedBy, changedAt; query: actionType, field, changedBy, from/to, page, size | `pier:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `change_log` (nhật ký thay đổi — dùng chung module):** id (UUID PK), entityType, entityId (UUID), 🔴 actionType (VARCHAR 20 — TAO_MOI / CAP_NHAT / PHE_DUYET / TU_CHOI / XOA_MEM), fieldChanged, oldValue, newValue, changedBy (UUID), changedAt (TIMESTAMP), reason (VARCHAR 500, nullable).

**Bảng `approval_log` (nhật ký phê duyệt — từ F-023):** id, entityType, entityId, cap (cấp duyệt), action (APPROVE/REJECT), approvedBy, approvedAt, reason — hợp nhất vào dòng thời gian lịch sử (chỉ đọc).
