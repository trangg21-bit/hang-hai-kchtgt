---
id: F-320
name: "Quản lý Bến phao - Xóa"
slug: ql-bp-xoa
module-id: M-026
status: proposed
classification: local
priority: medium
created: "2026-08-28"
last-updated: "2026-08-28"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Bến phao - Xóa

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-320
**Module:** M-026 — Quản lý Bến phao
**Loại:** chức năng thường (không có bước phê duyệt)
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (TKCT)

> **Trước khi viết:** đọc tài liệu nền của module (`ba/00-lean-spec.md`) để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):** xóa chỉ áp dụng trên hồ sơ thuộc phạm vi đơn vị user (DataScope đọc bản ghi trước khi xóa); ngoài phạm vi → không tìm thấy/không xóa được. Khai báo đầy đủ ở mục 5, dòng 3 — SA chốt khi duyệt.

---

## 1. Mô tả ngắn

Cán bộ Cảng vụ/Chi cục xóa hồ sơ bến phao đang ở trạng thái "Lưu tạm" (DRAFT) qua nút "Xóa" trong menu thao tác trên dòng. Xóa là **xóa mềm**: hồ sơ chuyển sang `ARCHIVED` (Đã xóa — lịch sử), không xóa vật lý khỏi CSDL, không hiển thị trong danh sách. Bản ghi GIS tương ứng cũng được xóa. Hồ sơ ở mọi trạng thái khác (kể cả Đã duyệt) đều không xóa được — hết giá trị sử dụng thì đổi Tình trạng hoạt động, không xóa.

## 2. Trường dữ liệu

Không có form nhập liệu. Thao tác xóa: popup xác nhận hiển thị Mã + Tên bến phao, nút "Hủy" / "Xóa". Xác nhận xóa phải gõ đúng mã bến phao (chống xóa nhầm) — theo mẫu chung màn KCHT.

## 3. Trạng thái và phê duyệt

- Trạng thái lưu dạng số, theo tài liệu nền mục 3.7.
- **Không có bước phê duyệt.**
- Chỉ xóa hồ sơ `DRAFT` (0), do **người nhập** thực hiện, cần quyền `buoyberth:delete`. Mọi trạng thái khác — kể cả `APPROVED` — đều **từ chối** (tài liệu chung mục 3.6: xóa hồ sơ Đã duyệt nhẹ hơn sửa mà lại dễ hơn → không cho phép).
- Sau xóa: `deletedAt`/`deletedBy` được ghi (qua `entity.softDelete(userId)`), hồ sơ chuyển `ARCHIVED`, biến mất khỏi danh sách và mọi dropdown options (APPROVED ONLY).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-320-01 | Chỉ xóa khi `approvalStatus = DRAFT`; nút "Xóa" chỉ hiện trên dòng DRAFT (FE) và BE trả lỗi "Chỉ được xóa bến phao ở trạng thái Nháp" khi vi phạm | Delete |
| BR-320-02 | Xóa mềm: ghi `deletedAt`/`deletedBy` (qua `softDelete(operatorId)`), không xóa vật lý; hồ sơ không xuất hiện ở danh sách/options | Delete |
| BR-320-03 | Nếu bản ghi có `spatialId` (GIS) → xóa luôn đối tượng GIS tương ứng; không để rác `gis_spatial_objects` | Delete |
| BR-320-04 | Xóa phải trong phạm vi DataScope của user (đơn vị con/cha theo quyền); ngoài phạm vi → không tìm thấy hồ sơ | Delete |
| BR-320-05 | Không xóa hồ sơ đã gửi duyệt, đang chờ duyệt, đã duyệt hoặc đã bị từ chối; hết giá trị sử dụng → đổi `operationalStatus` (không xóa) | Delete |
| BR-320-06 | Sau khi xóa thành công: toast "Xóa bến phao thành công", danh sách reload; cache đơn vị/tên được evict (`evictAfterCommit`) | Delete |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-320-01 — Xóa DRAFT thành công:** Hồ sơ DRAFT có nút "Xóa"; xác nhận đúng mã → hồ sơ biến mất khỏi danh sách, truy vấn `GET /{id}` trả về bản ghi có `deletedAt` hoặc không còn trong list.
- **AC-320-02 — Chặn xóa sai trạng thái:** Hồ sơ `APPROVED_LEVEL1`/`APPROVED` không hiển thị nút "Xóa"; gọi thẳng `DELETE /api/v1/buoy-berth/{id}` → bị từ chối với thông báo tiếng Việt, trạng thái không đổi.
- **AC-320-03 — Xóa GIS đi kèm:** Sau khi xóa hồ sơ có tọa độ, `gis_spatial_objects` không còn bản ghi `BUOY_BERTH_{code}`.

### 4.3. User Stories kế thừa (nếu có)

- **US-320-01:** Là cán bộ Cảng vụ, tôi muốn xóa hồ sơ nhập nhầm đang ở Lưu tạm để không đưa dữ liệu sai vào luồng duyệt.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xóa hồ sơ DRAFT | `buoyberth:delete` |

**Admin Cục:** full quyền `buoyberth:*` + xem thêm metadata — theo tài liệu nền mục 3.7/3.8, không có quyền riêng ngoài seed. **10 quyền `buoyberth:*` ĐÃ SEED — không seed lại.**

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không có — xóa mềm chuyển sang `ARCHIVED` (7) theo tài liệu chung mục 3.6 |
| 2 | Có bước phê duyệt không | Không — xóa là thao tác hành chính trên hồ sơ DRAFT |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — chỉ xóa được hồ sơ trong phạm vi DataScope của user |
| 4 | Trường chỉ hiện trong điều kiện nào | Nút "Xóa" chỉ hiện khi `approvalStatus = DRAFT` |
| 5 | Quyền riêng | `buoyberth:delete` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không (file đính kèm của hồ sơ bị xóa đi cùng hồ sơ soft-delete) |
| 8 | Giao diện khác mẫu chung | Không — popup xác nhận theo mẫu chung màn KCHT |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| DELETE | `/api/v1/buoy-berth/{id}` | Xóa mềm hồ sơ DRAFT (ghi deletedAt/deletedBy + xóa GIS nếu có) | `buoyberth:delete` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `buoy_berths` — liên quan Xóa:** 🔴 `deleted_at` TIMESTAMP, 🔴 `deleted_by` UUID (kế thừa `BaseEntity`; index `idx_buoy_berths_deleted_at` partial `WHERE deleted_at IS NULL` đã có). Không thay đổi cột dữ liệu. Hồ sơ xóa giữ nguyên dữ liệu để đối chiếu lịch sử (ARCHIVED only, không hiển thị).
