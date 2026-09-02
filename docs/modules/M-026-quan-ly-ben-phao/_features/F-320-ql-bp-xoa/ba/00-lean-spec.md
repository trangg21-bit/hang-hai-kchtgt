---
id: F-320
name: "Quản lý Bến phao - Xóa"
slug: ql-bp-xoa
module-id: M-026
status: proposed
classification: local
priority: medium
created: 2026-08-28
last-updated: 2026-08-28
locked-fields: []
consumed_by_modules: []
---

# Lean Spec — F-320 Xóa Bến phao

**Module:** M-026 — Quản lý Bến phao
**Phần chung:** `ba/00-lean-spec.md` (module) + `approval-2-level-spec.md` mục 3.6 (xóa mềm KCHT).
**Nguồn:** code hiện trạng (READ ONLY): `BuoyBerthService.softDelete`.

## 1. Mục đích & phạm vi

Xóa hồ sơ bến phao ở trạng thái `DRAFT` (nhập nhầm, không còn giá trị). Xóa mềm → `ARCHIVED`, không xóa vật lý, không hiển thị sau xóa; xóa kèm bản ghi GIS. **Ngoài phạm vi:** xóa hồ sơ đã gửi duyệt/đã duyệt/đang chờ (bị từ chối — đổi Tình trạng hoạt động thay vì xóa).

## 2. Use Cases

- UC-01 Xóa hồ sơ DRAFT trong phạm vi đơn vị (popup xác nhận gõ mã).
- UC-02 Xóa GIS đi kèm khi hồ sơ có tọa độ.

## 3. Business Rules (BR-320-NN)

| ID | Quy tắc | Oracle kiểm chứng |
|---|---|---|
| BR-320-01 | Chỉ xóa khi `approvalStatus = DRAFT`; nút Xóa chỉ hiện trên dòng DRAFT | DELETE hồ sơ APPROVED → 400 "Chỉ được xóa bến phao ở trạng thái Nháp"; UI: dòng APPROVED không có nút Xóa |
| BR-320-02 | Xóa mềm: ghi `deletedAt`/`deletedBy` qua `softDelete(operatorId)`; không xóa vật lý | Sau DELETE: `GET /{id}` vẫn trả bản ghi (có deletedAt) hoặc list không chứa; DB còn hàng |
| BR-320-03 | Xóa GIS khi `spatialId != null` | Sau xóa: không còn `gis_spatial_objects` với refId = id hồ sơ |
| BR-320-04 | Xóa trong DataScope của user | DELETE hồ sơ ngoài phạm vi → không tìm thấy/từ chối |
| BR-320-05 | Hồ sơ không DRAFT không xóa được — hết giá trị thì đổi operationalStatus | Xem BR-320-01 |
| BR-320-06 | Sau xóa: toast + reload; `evictAfterCommit` (cache tên) | UI: danh sách mất dòng; cache đơn vị mới |

## 4. Luồng chính

1. User bấm "Xóa" trên dòng DRAFT → popup xác nhận (hiện Mã + Tên, yêu cầu gõ đúng mã).
2. Xác nhận → DELETE `/api/v1/buoy-berth/{id}`.
3. Thành công: toast "Xóa bến phao thành công", danh sách reload; hồ sơ thành ARCHIVED, không hiển thị.

**Luồng lỗi:** gõ sai mã → chặn xóa; trạng thái không DRAFT → từ chối với thông báo tiếng Việt.

## 5. Trạng thái

DRAFT (0) → ARCHIVED (7). Không có bước phê duyệt.

## 6. Validation

Không có form. Chỉ kiểm tra trạng thái DRAFT + DataScope + mã xác nhận (FE).

## 7. Data scope & phân quyền

- DataScope: chỉ xóa hồ sơ trong phạm vi đơn vị user.
- Quyền: `buoyberth:delete`. Admin Cục full + metadata.

## 8. Tài liệu tham chiếu

`ba/00-lean-spec.md` (module) · feature-brief F-320 · `BuoyBerthService.java:270-281` (softDelete) · `BuoyBerthController.java` (DELETE /{id}).
