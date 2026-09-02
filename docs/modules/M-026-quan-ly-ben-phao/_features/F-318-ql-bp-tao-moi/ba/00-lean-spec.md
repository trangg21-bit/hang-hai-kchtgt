---
id: F-318
name: "Quản lý Bến phao - Tạo mới"
slug: ql-bp-tao-moi
module-id: M-026
status: proposed
classification: local
priority: medium
created: 2026-08-28
last-updated: 2026-08-28
locked-fields: []
consumed_by_modules: []
---

# Lean Spec — F-318 Tạo mới Bến phao

**Module:** M-026 — Quản lý Bến phao
**Phần chung:** `docs/modules/M-026-quan-ly-ben-phao/ba/00-lean-spec.md` (ma trận 57 trường, mã tự sinh, DataScope, phân quyền) + `docs/feature-brief-template.md` + `approval-2-level-spec.md`.
**Nguồn:** CSV "QL bến phao" + Excel sheet "QL bến phao" (thứ tự form chuẩn) + code hiện trạng (READ ONLY): `BuoyBerthService.create`, `CreateBuoyBerthRequest`, `BuoyBerthController`.

## 1. Mục đích & phạm vi

Cho phép cán bộ Cảng vụ/Chi cục tạo hồ sơ bến phao (buoy berth) thuộc cảng biển đã được duyệt, lưu tạm hoặc gửi duyệt ngay. **Ngoài phạm vi:** sửa (F-319), xóa (F-320), duyệt (F-321), xem (F-322), lịch sử (F-323); KHÔNG đụng BuoyStation (Nhà trạm Phao, tiêu).

## 2. Use Cases

- UC-01 Sinh mã tự động `{portCode}-BP-{seq:03d}` trước khi nhập form.
- UC-02 Điền 26 trường thông tin + tab GIS + file đính kèm.
- UC-03 Lưu tạm (`saveAction=DRAFT`) → hồ sơ `DRAFT`.
- UC-04 Lưu và gửi phê duyệt (`saveAction=SUBMIT`) → hồ sơ `APPROVED_LEVEL1`, ghi `submittedForApprovalAt/By`.
- UC-05 Upload file đính kèm sau khi hồ sơ có id (≤ 10MB).

## 3. Business Rules (BR-318-NN)

| ID | Quy tắc | Oracle kiểm chứng |
|---|---|---|
| BR-318-01 | Tạo mới chỉ từ drawer trên màn danh sách `/buoy-berth`; không route riêng | UI: không có route `/buoy-berth/new` |
| BR-318-02 | Mã tự sinh `{portCode}-BP-{seq:03d}`; seq = max hiện có (chưa xóa) + 1; mã bất biến, disabled | Gọi `GET /generate-code?portId=…` 2 lần → seq tăng 1; lưu xong gọi update → mã không đổi |
| BR-318-03 | `buoyBerthName`, `portId`, `provinceId`, `operationalStatus`, `cargoThroughput` bắt buộc (BE `@NotNull`/`@NotBlank`) | POST thiếu 1 trường → 400 + message tiếng Việt có dấu |
| BR-318-04 | Cảng biển cha phải `APPROVED` | POST với port DRAFT → lỗi "cảng biển cha phải ở trạng thái được phê duyệt" |
| BR-318-05 | `orgUnitId` gán tự động từ `port.orgUnitId` (không lấy từ request) | Tạo với orgUnitId khác → DB lưu orgUnitId của port; cột không NULL |
| BR-318-06 | Chiều ghi validate DataScope — không gán vào đơn vị ngoài phạm vi | POST port ngoài phạm vi → AccessDenied |
| BR-318-07 | Số ≥ 0; `lastInspectionDate` gửi `YYYY-MM` chuyển `YYYY-MM-DD` | POST `lastInspectionDate: "2026-02"` → lưu `2026-02-01` (không lỗi parse) |
| BR-318-08 | GIS: `GisSpatialObjectService` với type POLYGON_BUOY_BERTH(37), tên `BUOY_BERTH_{code}` | Tạo có tọa độ → có bản ghi trong `gis_spatial_objects` refId = id hồ sơ |

## 4. Luồng chính

1. User mở drawer "Thêm mới hồ sơ" (có `buoyberth:create`).
2. Chọn cảng biển → FE gọi `generate-code` → hiển thị Mã (disabled).
3. Điền form theo thứ tự Excel: Mã → Tên → Đơn vị quản lý → Cảng biển → Luồng HH → Tỉnh/TP → Địa điểm chi tiết → Phân cấp → Tình trạng → [Kỹ thuật & đăng kiểm] → [Công bố] → [Phạm vi khu nước] → GIS → File.
4. Bấm "Lưu tạm" hoặc "Lưu và gửi phê duyệt" → POST `/api/v1/buoy-berth` với `saveAction`.
5. Nếu có file → upload từng file vào `/api/v1/buoy-berth/{id}/attachments`.
6. Toast thành công; drawer đóng; danh sách reload.

**Luồng lỗi:** validation → hiện lỗi trên form (tiếng Việt), không gửi API; port không APPROVED → toast lỗi; mất kết nối → giữ nguyên form, không mất dữ liệu nhập.

## 5. Trạng thái

Mới tạo = `DRAFT` (0) hoặc `APPROVED_LEVEL1` (3) nếu gửi duyệt ngay. Chi tiết 7 trạng thái + chuyển tiếp: tài liệu chung mục 5 (F-321).

## 6. Validation (tóm tắt)

`buoyBerthName` NotBlank+max255 · `portId`/`provinceId`/`operationalStatus`/`cargoThroughput` NotNull · số `@DecimalMin("0")` · `detailedLocation` max500 · `publicDecision` max500 (FE 2000 — drift c.2) · `mooringWaterAreaScope` max1000 (FE 2000 — drift c.1) · `operatingOrgId` FE required, BE không NotNull (drift c.4).

## 7. Data scope & phân quyền

- `orgUnitId` bắt buộc khi lưu, tự gán từ port; controller `@DataScope`; chiều ghi validate phạm vi.
- Quyền: `buoyberth:create` (tạo), `buoyberth:update` (upload file). Admin Cục full `buoyberth:*` + metadata.
- ⚠️ Drift c.7: `@PreAuthorize` đang comment trong controller — đã ghi nhận, không sửa.

## 8. Tài liệu tham chiếu

`ba/00-lean-spec.md` (module) · feature-brief F-318 · `BuoyBerthService.java:72-131` (create) + `:285-301` (generateBuoyBerthCode) · `CreateBuoyBerthRequest.java` · `BuoyBerthForm.tsx:398-584`.
