---
id: F-009
name: Quản lý Cảng biển - Cập nhật
slug: ql-cb-cap-nhat
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:19Z
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Cảng biển - Cập nhật

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-009 — Quản lý Cảng biển - Cập nhật
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng có bước phê duyệt (cập nhật → duyệt lại theo quy trình 2 cấp)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

---

## 1. Mô tả ngắn

Cho phép người dùng có thẩm quyền (`port:update`) cập nhật thông tin của một Cảng biển đã tồn tại: tên cảng, vị trí địa lý, diện tích, khả năng tiếp nhận tàu, chỉ số tổng hợp, tọa độ GPS và công trình KCHT. Form điền sẵn (pre-fill) từ API; mã cảng (`portCode`) là read-only. Mỗi lần cập nhật thành công, trạng thái phê duyệt được đưa về trạng thái chờ duyệt và phải được duyệt lại (quy trình 2 cấp); hệ thống tự động ghi nhật ký thay đổi (change log).

## 2. Trường dữ liệu

Cấu trúc theo entity `Port` (bảng `ports`) — danh sách trường giống F-008 (mục 2). Điểm khác biệt của F-009:

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | portCode | Có | Text (VARCHAR 50) | **Read-only — không thể thay đổi sau khi tạo** |
| 2 | portName | Có | Text (VARCHAR 255) | Bắt buộc |
| 3 | orgUnitId | Có | TreeSelect (UUID) | Đơn vị quản lý; validate trong phạm vi user (tài liệu nền mục 3.3) |
| 4 | coordinates[] | Có* | Danh sách (latitude [-90,90], longitude [-180,180]) | GPS phải cung cấp cùng nhau (paired); ≥ 1 tọa độ khi gửi duyệt lại |
| 5 | area, maxVesselCapacity | Không | Number (DECIMAL) ≥ 0 | — |
| 6 | Các trường khác của `Port` | Không | Theo entity | Trường bắt buộc khi gửi duyệt giống F-008 (province, portClass...) |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.5 (7 trạng thái → enum `ApprovalStatus`) và quy trình 2 cấp tại `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`.
- **Sau mỗi lần cập nhật thành công:** hồ sơ được đưa về trạng thái chờ duyệt và **phải duyệt lại** (không giữ trạng thái đã duyệt cũ) — mọi cập nhật đều phải qua phê duyệt để đảm bảo toàn vẹn dữ liệu.
- Chỉ được cập nhật khi hồ sơ ở trạng thái cho phép sửa (Lưu tạm / bị trả về — theo file chuẩn); cảnh báo khi cảng đang trong quá trình phê duyệt hoặc đã bị xóa mềm.
- Mỗi lần cập nhật: ghi change log (bản cũ trước khi cập nhật) + đầy đủ thông tin kiểm toán (operatorId, updatedBy, updatedAt).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-009-01 | `portCode` không thể thay đổi sau khi tạo (read-only, server từ chối nếu payload đổi mã) | Update |
| BR-009-02 | Tọa độ GPS phải cung cấp cùng nhau: latitude [-90, 90], longitude [-180, 180]; area [0, 5000] | Update |
| BR-009-03 | Cập nhật thành công → reset trạng thái về chờ duyệt, phải duyệt lại (quy trình 2 cấp) | Update |
| BR-009-04 | Tự động tạo change log cho mọi thay đổi (bản cũ lưu trước khi cập nhật) | Update |
| BR-009-05 | Trùng `portCode`/lỗi xung đột → HTTP 409, không ghi đè | Update |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem cảng để cập nhật (pre-fill) | `port:read` |
| Cập nhật Cảng biển | `port:update` |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Toàn quyền |
| Admin, Lãnh đạo | Cập nhật, Xem |
| Chuyên viên Cục / Chuyên viên Cảng vụ / Doanh nghiệp cảng | Cập nhật trong phạm vi đơn vị mình |
| Nhân viên vận hành | Xem (không cập nhật) |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — full quyền + xem metadata người tạo/người sửa/thời gian.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng 7 trạng thái chung; cập nhật reset về trạng thái chờ duyệt |
| 2 | Có bước phê duyệt không | Có — mọi cập nhật phải duyệt lại (quy trình 2 cấp) |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị (orgUnitId — tài liệu nền mục 3.3) |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `port:update` (kèm `port:read` để pre-fill) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không (đính kèm quản lý tại F-008/F-012) |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/ports/{id}` | Lấy thông tin hiện tại để pre-fill form | `port:read` |
| PUT | `/api/v1/ports/{id}` | Cập nhật Cảng biển (kèm coordinates[], infrastructure[]); trả về bản ghi với trạng thái chờ duyệt + change log | `port:update` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `ports`:** cấu trúc giống F-008 (mục 7) — không thêm trường mới ở F-009; `portCode` bất biến.

**Bảng `change_log` (nhật ký thay đổi — dùng chung module):** id (UUID PK), entityType, entityId (UUID), changeType (UPDATE), changedField, oldValue, newValue, changedBy (UUID), changedAt — ghi tự động mỗi lần cập nhật (bản cũ trước khi cập nhật).
