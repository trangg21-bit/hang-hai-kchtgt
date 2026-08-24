---
id: F-037
name: Quản lý Vùng nước - Lịch sử
slug: ql-vn-lich-su
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Vùng nước - Lịch sử

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-037 — Quản lý Vùng nước - Lịch sử
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng thường (chỉ xem, không tạo/sửa/xóa)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG (lịch sử thay đổi — mục 3.4). File này CHỈ ghi phần RIÊNG của chức năng. (Nội dung merge từ F-037 BE + F-102 UI.)

---

## 1. Mô tả ngắn

Cho phép người dùng có quyền `waterzone:history` xem toàn bộ lịch sử thay đổi của một Vùng nước theo timeline: dòng đầu tiên là indicator "Tạo mới" (CREATE, oldValue = null), các dòng sau là "Cập nhật" (UPDATE) — hiển thị trường thay đổi, giá trị cũ → mới, người thực hiện, thời gian. Hỗ trợ lọc theo trường thay đổi; click dòng → drawer chi tiết. Dữ liệu lịch sử bất biến (không sửa/xóa), phục vụ kiểm toán và truy vết.

## 2. Trường dữ liệu

Không có form nhập liệu — hiển thị từ bảng nhật ký thay đổi:

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | waterZoneId | Có | UUID | Vùng nước cần xem lịch sử |
| 2 | action | Có (hiển thị) | Enum: CREATE / UPDATE | Bản ghi đầu CREATE (oldValue = null); sau UPDATE (oldValue ≠ newValue) |
| 3 | field | Không | NVARCHAR (100) | Tên trường thay đổi |
| 4 | oldValue / newValue | Không | TEXT | Giá trị cũ / mới |
| 5 | changedBy / changedAt | Có (hiển thị) | UUID / TIMESTAMP (yyyy-MM-dd HH:mm:ss) | Người thực hiện, thời gian |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.4 (lịch sử thay đổi: ghi ai làm, làm lúc nào) và mục 3.5 (quy trình 2 cấp theo `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`).
- Lịch sử sắp xếp `changedAt` giảm dần (mới nhất trên cùng); dòng đầu tiên là sự kiện tạo mới.
- Dữ liệu lịch sử bất biến — không xóa, không sửa, chỉ bổ sung.
- Chức năng chỉ xem — không thay đổi trạng thái.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-037-01 | Bản ghi đầu: action = CREATE, oldValue = null | View |
| BR-037-02 | Bản ghi sau: action = UPDATE, oldValue ≠ newValue | View |
| BR-037-03 | Sắp xếp changedAt DESC | View |
| BR-037-04 | Lịch sử bất biến — không xóa, không sửa, chỉ bổ sung | Audit |
| BR-037-05 | Lọc theo trường thay đổi (dropdown Field) | View |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem lịch sử thay đổi của Vùng nước | `waterzone:history` (đề xuất — SA chốt) |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Xem đầy đủ |
| Lãnh đạo (LeDuan) | Xem đầy đủ |
| Chuyên viên Cục / Cảng vụ | Xem đầy đủ |
| Doanh nghiệp cảng | Xem đầy đủ |
| Nhân viên vận hành | Không xem |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — xem toàn bộ lịch sử, không giới hạn (phục vụ kiểm toán).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — hiển thị sự kiện của 7 trạng thái chung |
| 2 | Có bước phê duyệt không | Không — chỉ xem lịch sử |
| 3 | Lọc cha-con / theo đơn vị | Có — theo đơn vị (orgUnitId) + theo Cảng biển mẹ (portId) |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `waterzone:history` (đề xuất — SA chốt) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Không (timeline + dropdown Field filter + drawer) |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/water-zones/{id}/history` | Lịch sử thay đổi của Vùng nước: field, oldValue, newValue, changedBy, changedAt, action; query: field, page, size | `waterzone:history` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `change_log` / `lich_su_thay_doi` (nhật ký thay đổi — dùng chung module):** id (UUID PK), entityType, entityId (UUID), action (NVARCHAR 20 — CREATE / UPDATE), field (NVARCHAR 100), oldValue (TEXT, nullable — null cho CREATE), newValue (TEXT), changedBy (UUID), changedAt (TIMESTAMP) — bất biến, chỉ bổ sung.
