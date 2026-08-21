---
id: F-034
name: Quản lý Vùng nước - Xóa
slug: ql-vn-xoa
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Vùng nước - Xóa

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-034 — Quản lý Vùng nước - Xóa
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng thường (xóa mềm, không có bước phê duyệt)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung. (Nội dung merge từ F-034 BE + F-101 UI.)

---

## 1. Mô tả ngắn

Cho phép người dùng có thẩm quyền (`waterzone:delete`) xóa mềm một Vùng nước qua modal xác nhận với checkbox confirm: đánh dấu `deletedAt`/`deletedBy`, bản ghi không bị xóa vật lý, ẩn khỏi danh sách mặc định nhưng vẫn lưu trữ để truy xuất và kiểm toán. Vùng nước là **leaf entity — không cần child guard check**. Xác nhận có chủ đích (checkbox "Tôi xác nhận muốn xóa vùng nước này").

> **⚠️ Điểm chốt cần SA xác nhận:** brief merge cũ (F-034 BE + F-101 UI) quy định **chỉ xóa được Vùng nước đã được phê duyệt (APPROVED)**. Quy trình chung tại `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (mục 1) quy định **chỉ xóa được hồ sơ ở trạng thái Lưu tạm**. Tài liệu này tuân theo quy trình chung (tài liệu nền mục 3.4/3.5 + file chuẩn) — **SA chốt** quy tắc cuối cùng và cập nhật 2 tài liệu cho đồng bộ.

## 2. Trường dữ liệu

Không có form nhập liệu mới — thao tác trên bản ghi `WaterZone` hiện có.

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | id | Có | UUID | Khóa chính của vùng nước cần xóa |
| 2 | waterZoneCode, waterZoneName, portId (tên cảng) | Có (hiển thị) | Text / UUID | Hiển thị trong modal xác nhận |
| 3 | approvalStatus | Có (kiểm tra) | Enum `ApprovalStatus` | Điều kiện xóa theo SA chốt (xem ghi chú mục 1) |
| 4 | deletedBy, deletedAt | Có (hệ thống) | UUID / TIMESTAMP | Ghi nhận người xóa, thời gian xóa |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.4 (xóa mềm, ghi `deletedAt`/`deletedBy`) và mục 3.5 (trạng thái hồ sơ; quy trình 2 cấp theo `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`).
- Theo quy trình chung (file chuẩn mục 1): **chỉ xóa được hồ sơ ở trạng thái Lưu tạm**; sau khi xóa, hồ sơ chuyển trạng thái "Đã xóa (lịch sử)" — lưu để đối chiếu, không hiển thị trên màn hình. *(Brief merge cũ quy định chỉ xóa bản ghi Đã duyệt — SA chốt, xem ghi chú mục 1.)*
- Không có bước phê duyệt cho thao tác xóa; xóa là xóa mềm (không xóa cứng); Vùng nước là leaf entity — không child guard.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-034-01 | Xóa mềm: `deletedAt = now()` + `deletedBy` (operatorId), không xóa vật lý | Delete |
| BR-034-02 | Không child guard — Vùng nước là leaf entity | Delete |
| BR-034-03 | Chỉ người có `waterzone:delete` được xóa (nút hiển thị theo quyền) | RBAC |
| BR-034-04 | Điều kiện trạng thái khi xóa theo SA chốt (quy trình chung: chỉ Lưu tạm — xem ghi chú mục 1) | Delete |
| BR-034-05 | Bản ghi đã xóa (`deletedAt != null`) → không hiển thị, không xóa lại | Delete |
| BR-034-06 | Xác nhận có chủ đích: checkbox confirm trong modal | Delete |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem vùng nước | `waterzone:read` |
| Xóa mềm Vùng nước | `waterzone:delete` |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Toàn quyền |
| Lãnh đạo (LeDuan) | Xóa |
| Chuyên viên Cục / Cảng vụ | Không xóa |
| Doanh nghiệp cảng | Không xóa |
| Nhân viên vận hành | Không xóa |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — toàn quyền xóa + xem metadata người tạo, người xóa, thời gian xóa.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng trạng thái chung; điều kiện trạng thái khi xóa theo SA chốt (xem ghi chú mục 1) |
| 2 | Có bước phê duyệt không | Không — xóa mềm trực tiếp, không qua phê duyệt |
| 3 | Lọc cha-con / theo đơn vị | Có — theo đơn vị (orgUnitId) + theo Cảng biển mẹ (portId); leaf entity, không child guard |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `waterzone:delete` (kèm `waterzone:read`) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/water-zones/{id}` | Pre-check trạng thái trước khi xóa | `waterzone:delete` |
| DELETE | `/api/v1/water-zones/{id}` | Xóa mềm: set `deletedAt = now()`, ghi nhật ký | `waterzone:delete` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `water_zones`:** không thêm/sửa trường ở F-034 — sử dụng cột xóa mềm từ `BaseEntity`: `deleted_at` (TIMESTAMP, nullable) + `deleted_by` (UUID, nullable); `@SQLRestriction("deleted_at IS NULL")` tự loại bản ghi đã xóa khỏi truy vấn mặc định. Ghi nhận thao tác xóa vào change log.
