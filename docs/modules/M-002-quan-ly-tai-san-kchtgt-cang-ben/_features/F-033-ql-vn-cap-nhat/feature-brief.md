---
id: F-033
name: Quản lý Vùng nước - Cập nhật
slug: ql-vn-cap-nhat
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Vùng nước - Cập nhật

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-033 — Quản lý Vùng nước - Cập nhật
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng có bước phê duyệt (thay đổi độ sâu → phê duyệt lại)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung. (Nội dung merge từ F-033 BE + F-091 UI.)

---

## 1. Mô tả ngắn

Cho phép người dùng có thẩm quyền (`waterzone:update`) cập nhật thông tin Vùng nước qua modal form pre-populated từ GET API. `waterZoneCode` bất biến (read-only); trạng thái phê duyệt hiển thị dạng badge không sửa được. Mọi thay đổi ghi vào lịch sử tự động. **Thay đổi độ sâu (maxDepth/avgDepth) kích hoạt phê duyệt lại** — hồ sơ vào quy trình phê duyệt (F-035). Không cập nhật được bản ghi đã xóa mềm.

## 2. Trường dữ liệu

Cấu trúc theo entity `WaterZone` (bảng `water_zones`) — danh sách trường giống F-032 (mục 2). Điểm khác biệt:

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | waterZoneCode | Có | Text (VARCHAR 50) | **Read-only — bất biến** (gray bg, skip tab order) |
| 2 | approvalStatus | Có (hiển thị) | Enum `ApprovalStatus` | **Badge read-only** — không sửa được trên form |
| 3 | waterZoneName, portId, area, maxDepth, avgDepth, waterZoneType, operationalStatus | Có* | Theo entity | Editable; validation giống F-032 |
| 4 | orgUnitId | Có | TreeSelect (UUID) | Theo tài liệu nền mục 3.3 — gán khi tạo, không đổi |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.5 (7 trạng thái → enum `ApprovalStatus`) và quy trình 2 cấp tại `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`.
- Chỉ cập nhật được hồ sơ ở trạng thái cho phép sửa (theo file chuẩn); cảnh báo khi hồ sơ đang trong quá trình phê duyệt trước khi cập nhật (cho phép tiếp tục sau xác nhận).
- **Thay đổi độ sâu → kích hoạt phê duyệt lại** (hồ sơ vào quy trình phê duyệt tại F-035).
- Bản ghi đã xóa mềm (`deletedAt != null`) → chặn cập nhật.
- Mọi cập nhật: ghi lịch sử thay đổi (từng trường: old → new) + thông tin kiểm toán (operatorId, updatedBy, updatedAt).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-033-01 | `waterZoneCode` bất biến sau khi tạo | Update |
| BR-033-02 | Chỉ cập nhật được hồ sơ ở trạng thái cho phép sửa (theo file chuẩn) | Update |
| BR-033-03 | Thay đổi maxDepth / avgDepth → kích hoạt phê duyệt lại | Update |
| BR-033-04 | `deletedAt != null` → không được cập nhật | Update |
| BR-033-05 | Mọi cập nhật ghi lịch sử thay đổi tự động | Update |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem vùng nước (pre-fill) | `waterzone:read` |
| Cập nhật Vùng nước | `waterzone:update` |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Toàn quyền |
| Lãnh đạo (LeDuan) | Cập nhật |
| Chuyên viên Cục / Cảng vụ | Cập nhật trong phạm vi đơn vị |
| Doanh nghiệp cảng | Cập nhật trong phạm vi đơn vị |
| Nhân viên vận hành | Không cập nhật |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — cập nhật không giới hạn đơn vị + xem metadata người tạo/người sửa/thời gian.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng 7 trạng thái chung |
| 2 | Có bước phê duyệt không | Có — thay đổi độ sâu kích hoạt phê duyệt lại |
| 3 | Lọc cha-con / theo đơn vị | Có — theo đơn vị (orgUnitId) + theo Cảng biển mẹ (portId) |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — waterZoneCode + approvalStatus read-only |
| 5 | Quyền riêng | `waterzone:update` (kèm `waterzone:read`) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không (đính kèm quản lý tại F-032/F-036) |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/water-zones/{id}` | Pre-populate form | `waterzone:read` |
| PUT | `/api/v1/water-zones/{id}` | Cập nhật (partial — chỉ gửi trường thay đổi + id) | `waterzone:update` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `water_zones`:** cấu trúc giống F-032 (mục 7) — F-033 không thêm trường; waterZoneCode bất biến.

**Bảng `change_log` / `lich_su_thay_doi` (nhật ký thay đổi — dùng chung module):** id (UUID PK), entityType, entityId (UUID), action (CREATE / UPDATE), field, oldValue, newValue, changedBy (UUID), changedAt (TIMESTAMP) — ghi tự động, bất biến.
