---
id: F-010
name: Quản lý Cảng biển - Xóa
slug: ql-cb-xoa
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-16T04:40:19Z
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Cảng biển - Xóa

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-010 — Quản lý Cảng biển - Xóa
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng thường (xóa mềm, không có bước phê duyệt)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

---

## 1. Mô tả ngắn

Cho phép người dùng có thẩm quyền (`port:delete`) xóa một Cảng biển khỏi hệ thống bằng cơ chế **xóa mềm** (soft delete — đánh dấu `deletedAt`/`deletedBy`, không xóa bản ghi khỏi DB) để bảo tồn dữ liệu lịch sử phục vụ kiểm toán và báo cáo. Trước khi xóa, hệ thống kiểm tra dữ liệu liên quan (child guard: Bến cảng, Vùng nước) và yêu cầu xác nhận có chủ đích (nhập chính xác tên cảng hoặc "XÓA"). Theo quy trình chung, chỉ xóa được hồ sơ ở trạng thái **Lưu tạm**.

## 2. Trường dữ liệu

Không có form nhập liệu mới — thao tác trên bản ghi `Port` hiện có. Dữ liệu tham chiếu cho xác nhận: id, portCode, portName, approvalStatus (chỉ xóa khi `DRAFT` — Lưu tạm).

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | id | Có | UUID | Khóa chính của cảng cần xóa |
| 2 | portCode, portName | Có (hiển thị) | Text | Hiển thị trong dialog xác nhận; người dùng nhập lại chính xác để xác nhận |
| 3 | approvalStatus | Có (kiểm tra) | Enum `ApprovalStatus` | Chỉ xóa khi ở trạng thái Lưu tạm (`DRAFT`) |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.4 (xóa mềm, ghi `deletedAt`/`deletedBy`) và mục 3.5 (trạng thái hồ sơ).
- Theo `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (mục 1): **chỉ xóa được hồ sơ đang ở trạng thái Lưu tạm**; sau khi xóa, hồ sơ chuyển trạng thái "Đã xóa (lịch sử)" — lưu để đối chiếu, không hiển thị trên màn hình.
- Không cho phép xóa khi cảng đang trong quá trình phê duyệt hoặc có dữ liệu con chưa xử lý.
- Không có bước phê duyệt cho thao tác xóa; xóa là xóa mềm (không xóa cứng, không cascade delete).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-010-01 | Xóa mềm: gán `deletedAt = now()` + `deletedBy` (operatorId), không xóa bản ghi khỏi DB | Delete |
| BR-010-02 | Child guard: nếu tồn tại ≥ 1 Bến cảng (`berth`) hoặc Vùng nước (`water_zone`) liên kết → HTTP 409 "Cảng này có X berth và Y water_zone liên kết, không thể xóa" | Delete |
| BR-010-03 | Chỉ xóa được hồ sơ ở trạng thái Lưu tạm (`DRAFT`) — theo `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` | Delete |
| BR-010-04 | Xác nhận có chủ đích: người dùng phải nhập chính xác tên cảng hoặc "XÓA" trước khi xóa | Delete |
| BR-010-05 | Khôi phục trong 90 ngày kể từ ngày xóa (khôi phục = xóa `deletedAt`/`deletedBy`) | Restore |
| BR-010-06 | Không xóa cứng, không xóa hàng loạt, không cascade delete | Delete |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem cảng (danh sách/chi tiết) | `port:read` |
| Xóa mềm Cảng biển | `port:delete` |
| Khôi phục cảng đã xóa | `port:delete` (hoặc quyền khôi phục riêng do SA chốt) |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Toàn quyền |
| Admin, Lãnh đạo | Xóa, Xem, Khôi phục |
| Chuyên viên Cục / Chuyên viên Cảng vụ / Doanh nghiệp cảng | Không có quyền xóa |
| Nhân viên vận hành | Xem (không xóa) |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — full quyền + xem metadata người tạo/người sửa/thời gian.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng trạng thái chung; chỉ xóa được ở trạng thái Lưu tạm |
| 2 | Có bước phê duyệt không | Không — xóa mềm trực tiếp, không qua phê duyệt |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị (orgUnitId — tài liệu nền mục 3.3) |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `port:delete` (kèm `port:read`) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/ports/{id}/children` | Kiểm tra dữ liệu con (berth, water_zone) trước khi xóa | `port:delete` |
| DELETE | `/api/v1/ports/{id}` | Xóa mềm: set `deletedAt = now()`, ghi nhật ký | `port:delete` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `ports`:** không thêm/sửa trường ở F-010 — sử dụng cột xóa mềm từ `BaseEntity`: `deleted_at` (TIMESTAMP, nullable) + `deleted_by` (UUID, nullable); `@SQLRestriction("deleted_at IS NULL")` tự loại bản ghi đã xóa khỏi truy vấn mặc định. Không thêm cột `status='da_xoa'` riêng — trạng thái "Đã xóa (lịch sử)" theo tài liệu nền mục 3.5.
