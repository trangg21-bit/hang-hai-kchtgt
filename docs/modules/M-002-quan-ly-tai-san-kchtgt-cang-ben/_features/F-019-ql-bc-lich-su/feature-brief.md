---
id: F-019
name: Quản lý Bến cảng - Lịch sử
slug: ql-bc-lich-su
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-16T04:41:00Z
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Bến cảng - Lịch sử

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-019 — Quản lý Bến cảng - Lịch sử
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng thường (chỉ xem, không tạo/sửa/xóa)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG (lịch sử thay đổi — mục 3.4). File này CHỈ ghi phần RIÊNG của chức năng.

---

## 1. Mô tả ngắn

Cho phép người dùng có quyền `berth:read` xem toàn bộ lịch sử thay đổi của một Bến cảng: các lần tạo, cập nhật từng trường, phê duyệt/trả về và xóa — hiển thị theo dòng thời gian (mới nhất trên cùng) với chi tiết trường thay đổi, giá trị cũ/mới, người thực hiện, thời gian; phục vụ kiểm toán và đánh giá tiến trình hạ tầng. Hỗ trợ phân trang (20/50), lọc theo loại sự kiện, theo trường thay đổi, theo người thực hiện và khoảng thời gian. Lịch sử là dữ liệu bất biến — chỉ đọc, không sửa/xóa.

## 2. Trường dữ liệu

Không có form nhập liệu — hiển thị từ bảng nhật ký thay đổi (change log) + nhật ký phê duyệt (approval log):

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | entityId (berthId) | Có | UUID | Bến cảng cần xem lịch sử |
| 2 | eventType | Có (hiển thị) | Enum: TAO_MOI / CAP_NHAT / PHE_DUYET / TU_CHOI / XOA | Loại sự kiện |
| 3 | changedField | Không | Text | Trường thay đổi (sự kiện Cập nhật) |
| 4 | oldValue / newValue | Không | Text | Giá trị cũ / mới (văn bản hóa để dễ đọc) |
| 5 | changedBy / changedAt | Có (hiển thị) | UUID / TIMESTAMP | Người thực hiện, thời gian |
| 6 | reason / ghi chú | Không | Text | Lý do (Phê duyệt/Từ chối) hoặc ghi chú |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.4 (lịch sử thay đổi: ghi ai làm, làm lúc nào; xóa mềm ghi `deletedAt`/`deletedBy`) và mục 3.5 (quy trình 2 cấp theo `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`).
- Lịch sử hợp nhất một dòng thời gian: sự kiện Tạo mới (từ F-014), Cập nhật (F-015), Xóa (F-016), Phê duyệt/Từ chối (F-017 — kèm `cap` cấp duyệt và lý do).
- Dữ liệu lịch sử bất biến: chỉ được thêm mới, không cho phép sửa hoặc xóa.
- Chức năng chỉ xem — không thay đổi trạng thái.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-019-01 | Mọi thay đổi của Bến cảng đều phải ghi vào lịch sử — không cho phép bỏ qua | Audit |
| BR-019-02 | Lịch sử chỉ được thêm mới, không sửa/xóa | Audit |
| BR-019-03 | Các sự kiện từ F-014, F-015, F-016, F-017 hợp nhất vào cùng dòng thời gian | View |
| BR-019-04 | Giá trị cũ/mới lưu dạng văn bản hóa để hiển thị dễ đọc | View |
| BR-019-05 | Sắp xếp giảm dần theo thời gian (mới nhất trên cùng); phân trang 20/50 | View |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem lịch sử thay đổi của Bến cảng | `berth:read` |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Xem lịch sử đầy đủ |
| Quản trị viên / Quản lý cảng | Xem lịch sử đầy đủ |
| Nhân viên vận hành | Xem lịch sử (trường kỹ thuật bị ẩn — SA chốt danh sách) |
| Khách ngoài | Không có quyền truy cập |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — xem đầy đủ lịch sử kèm người thực hiện, thời gian (phục vụ kiểm toán).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — hiển thị sự kiện của 7 trạng thái chung |
| 2 | Có bước phê duyệt không | Không — chỉ xem lịch sử |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị (orgUnitId — tài liệu nền mục 3.3) |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — trường kỹ thuật ẩn với một số vai trò (SA chốt danh sách) |
| 5 | Quyền riêng | `berth:read` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Không (dùng FilterBar + DataTable + Pagination) |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/berths/{id}/history` | Lịch sử thay đổi của Bến cảng: eventType, field, oldValue, newValue, changedBy, changedAt, reason; query: eventType, field, changedBy, from/to, page, size | `berth:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `change_log` (nhật ký thay đổi — dùng chung module):** id (UUID PK), entityType, entityId (UUID), 🔴 eventType (VARCHAR 20 — TAO_MOI / CAP_NHAT / XOA), changedField, oldValue, newValue, changedBy (UUID), changedAt (TIMESTAMP), reason (VARCHAR 500, nullable).

**Bảng `approval_log` (nhật ký phê duyệt — từ F-017):** id, entityType, entityId, cap (CANG_VU/CUC), action (APPROVE/REJECT), approvedBy, approvedAt, reason — hợp nhất vào dòng thời gian lịch sử (chỉ đọc).
