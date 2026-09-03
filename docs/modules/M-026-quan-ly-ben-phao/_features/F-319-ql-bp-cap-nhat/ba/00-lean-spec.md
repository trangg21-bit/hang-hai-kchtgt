---
id: F-319
name: "Quản lý Bến phao - Cập nhật"
slug: ql-bp-cap-nhat
module-id: M-026
status: proposed
classification: local
priority: medium
created: 2026-08-28
last-updated: 2026-08-28
locked-fields: []
consumed_by_modules: []
---

# Lean Spec — F-319 Cập nhật Bến phao

**Module:** M-026 — Quản lý Bến phao
**Phần chung:** `ba/00-lean-spec.md` (module) + `approval-2-level-spec.md` mục 3.9 (ma trận chỉnh sửa KCHT).
**Nguồn:** CSV "QL bến phao" + code hiện trạng (READ ONLY): `BuoyBerthService.update`, `UpdateBuoyBerthRequest`, `BuoyBerthForm.tsx` (edit mode).

## 1. Mục đích & phạm vi

Cho phép sửa hồ sơ bến phao theo đúng ma trận trạng thái (mục 3): `DRAFT`/`REJECTED_*` sửa bình thường + gửi lại; đang chờ duyệt đóng băng; `APPROVED` chỉ người có quyền phê duyệt sửa qua "Lưu và phê duyệt" (giữ `APPROVED`). **Ngoài phạm vi:** đổi mã bến phao (bất biến), sửa khi đang chờ duyệt.

## 2. Use Cases

- UC-01 Sửa hồ sơ DRAFT → giữ DRAFT.
- UC-02 Sửa hồ sơ REJECTED_LEVEL1/2 → "Lưu và gửi phê duyệt" → `APPROVED_LEVEL1`.
- UC-03 Sửa hồ sơ APPROVED (quyền phê duyệt) → "Lưu và phê duyệt" → giữ APPROVED.
- UC-04 Đổi cảng biển → reset cascading + gán lại orgUnitId; GIS đồng bộ.
- UC-05 Thêm/xóa file đính kèm.

## 3. Business Rules (BR-319-NN)

| ID | Quy tắc | Oracle kiểm chứng |
|---|---|---|
| BR-319-01 | Sửa theo ma trận trạng thái: DRAFT/REJECTED_* OK; APPROVED_LEVEL1/2 đóng băng (ẩn nút + BE từ chối) | PUT hồ sơ APPROVED_LEVEL1 → 403 "Không thể sửa hồ sơ đang trong quy trình phê duyệt" |
| BR-319-02 | `buoyBerthCode` bất biến — không có trong UpdateRequest | PUT không chứa code; DB giữ nguyên |
| BR-319-03 | `saveAction`: DRAFT→DRAFT; SUBMIT→APPROVED_LEVEL1; SAVE_AND_APPROVE→APPROVED (ghi submitted+C1+C2); không truyền trên APPROVED → hạ APPROVED_LEVEL1 (⚠️ drift c.6) | PUT hồ sơ APPROVED không saveAction → trạng thái thành APPROVED_LEVEL1 (hành vi hiện tại) |
| BR-319-04 | `orgUnitId` không sửa tay (disabled, trừ Admin hệ thống); đổi portId → gán lại từ port | Sửa đổi port → orgUnitId trong DB = orgUnitId của port mới |
| BR-319-05 | Chiều ghi validate DataScope | PUT port ngoài phạm vi → từ chối |
| BR-319-06 | Cập nhật trường có giá trị (`copyPropertiesIfPresent`); GIS cập nhật giữ spatialId | Sửa tọa độ → `gis_spatial_objects` cập nhật cùng spatial_id |
| BR-319-07 | Sửa REJECTED_* bắt buộc gửi lại duyệt (re-submit vào vòng 1) | Sửa + lưu tạm → vẫn REJECTED_*; gửi duyệt → APPROVED_LEVEL1 |

## 4. Luồng chính

1. User bấm "Chỉnh sửa" trên dòng (nút hiện theo trạng thái + quyền) → drawer "Cập nhật hồ sơ" nạp `GET /{id}`.
2. Sửa trường được phép; Mã + Đơn vị quản lý disabled (trừ Admin hệ thống).
3. Bấm nút theo trạng thái: Lưu tạm / Lưu và gửi phê duyệt / Lưu và phê duyệt.
4. PUT `/api/v1/buoy-berth`; toast "Cập nhật thành công"; danh sách reload.

**Luồng lỗi:** trạng thái không cho sửa → ẩn nút; validation → lỗi trên form; hồ sơ APPROVED + user không có quyền → không thấy nút "Chỉnh sửa".

## 5. Trạng thái

Theo ma trận mục 3.9 tài liệu chung (bảng đầy đủ tại feature-brief F-319 mục 3). Lưu ý drift c.6 về bản đồ nhãn trạng thái hiện tại của code/FE.

## 6. Validation (tóm tắt)

`id` NotNull · các trường sửa theo ma trận (Edit=TRUE) · `@DecimalMin("0")` số · maxLength theo ma trận (drift c.1/c.2 độ lệch FE vs DB).

## 7. Data scope & phân quyền

- `orgUnitId` tự gán lại khi đổi cảng biển; validate DataScope chiều ghi.
- Quyền: `buoyberth:update` (DRAFT/REJECTED_* + submit), `buoyberth:approvec2`/`approve` (sửa APPROVED), `buoyberth:update` (file). Admin Cục full + metadata.
- ⚠️ Drift c.7: `@PreAuthorize` đang comment — đã ghi nhận, không sửa.

## 8. Tài liệu tham chiếu

`ba/00-lean-spec.md` (module) · feature-brief F-319 · `BuoyBerthService.java:133` (update) + `:498` (applySaveAction) · `UpdateBuoyBerthRequest.java` · `BuoyBerthForm.tsx` (edit mode, `saveAction !== 'UPDATE'`).
