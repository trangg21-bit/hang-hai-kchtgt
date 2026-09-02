---
id: F-322
name: "Xem danh sách & Chi tiết Bến phao"
slug: xem-bp
module-id: M-026
status: proposed
classification: local
priority: medium
created: 2026-08-28
last-updated: 2026-08-28
locked-fields: []
consumed_by_modules: []
---

# Lean Spec — F-322 Xem danh sách & Chi tiết Bến phao

**Module:** M-026 — Quản lý Bến phao
**Phần chung:** `ba/00-lean-spec.md` (module mục 4, 10) + `list-screen-ui-standard.md` + `form-and-list-patterns.md` + `infrastructure-feature-standard-architecture.md`.
**Nguồn:** CSV "QL bến phao" + code hiện trạng (READ ONLY): `BuoyBerthController.findAll/getById`, `BuoyBerthRepository.searchBuoyBerths`, `BuoyBerthListPage.tsx`, `BuoyBerthDetailContent.tsx`.

## 1. Mục đích & phạm vi

Màn danh sách `/buoy-berth` với bộ lọc đầy đủ + drawer chi tiết 7 tab (Thông tin chung, GIS, File đính kèm, Kết cấu hạ tầng, Vận hành & bảo trì, Xử lý & theo dõi, Phê duyệt/Lịch sử). **Ngoài phạm vi:** mọi thao tác ghi dữ liệu (F-318..F-321, F-323 chỉ đọc lịch sử).

## 2. Use Cases

- UC-01 Tìm kiếm/lọc danh sách (orgUnit cây, từ khóa Mã+Tên không dấu, portId cascading, waterwayId, classification, provinceId, operationalStatus, approvalStatus tabs, khoảng ngày cập nhật).
- UC-02 Xem chi tiết hồ sơ (7 tab).
- UC-03 Xem GIS (DMS compact + symbol preview) + tải file đính kèm.
- UC-04 Xem tab "Kết cấu hạ tầng": 2 loại KCHT con (Khu neo đậu, Khu tránh, trú bão) + mở drawer con chi tiết.
- UC-05 Xem tab "Vận hành & bảo trì" (vận hành khai thác, bảo trì, sự cố — read-only).
- UC-06 Xem tab "Xử lý & theo dõi" (approval-audit columns).

## 3. Business Rules (BR-322-NN)

| ID | Quy tắc | Oracle kiểm chứng |
|---|---|---|
| BR-322-01 | Danh sách loại bản ghi đã xóa (`deletedAt IS NULL`); phân trang size 20 | Hồ sơ ARCHIVED không xuất hiện |
| BR-322-02 | Tìm kiếm không dấu Mã+Tên (immutable_unaccent); cascading portId/waterwayId theo orgUnitId + reset con | Tìm "haiphong" ra "Hải Phòng"; đổi đơn vị cha → cảng không thuộc bị reset |
| BR-322-03 | OrgUnitTreeSelect cây, value = orgUnitId; backend DataScope | User đơn vị không thấy hồ sơ đơn vị khác |
| BR-322-04 | securityLevel: bản ghi RESTRICTED/CONFIDENTIAL cần `read:restricted`/`read:confidential` | User thiếu quyền → không thấy bản ghi (recordSecurityLevelFilter) |
| BR-322-05 | Response kèm tên: orgUnitName/portName/operatingOrgName (cache/repo) | API trả tên; FE không map ID→tên |
| BR-322-06 | Tab KCHT: search anchorage/storm-shelter theo buoyStationId; drawer con `AppDrawer size={950}` px cố định | Mở chi tiết KCHT con hiển thị đúng loại + tên |
| BR-322-07 | Tiêu đề cột đủ 100% chữ; nội dung dài `...` + tooltip; badge pill chuẩn | Chụp UI: không cột nào bị cắt chữ; badge tròn 2 đầu |
| BR-322-08 | 4 trạng thái loading/error/empty/data; scrollLeft về 0 sau lọc | Reload/filter → cột đầu tiên không bị che |

## 4. Luồng chính

1. Vào menu "Quản lý bến phao" → GET `/api/v1/buoy-berth` với filter mặc định (DataScope).
2. Lọc/đổi tab → gọi lại với params; StatusTabs hiển thị số lượng.
3. Bấm "Chi tiết" (hoặc dòng) → AppDrawer 7 tab, nạp `GET /{id}` + attachments + KCHT con.
4. Tab GIS hiển thị tọa độ từ `spatialId`; tab KCHT mở drawer con khi bấm Tên/👁.

**Luồng lỗi:** hồ sơ ngoài phạm vi → 404/không hiển thị; API lỗi → EmptyState/error với thông báo tiếng Việt.

## 5. Trạng thái

7 trạng thái chuẩn hiển thị qua badge (Lưu tạm/Chờ Cảng vụ/Chờ Cục/Đã duyệt/Từ chối C1/Từ chối C2; ARCHIVED không hiển thị). **⚠️ Drift c.6:** FE hiện tự khai map nhãn thay vì dùng chung `ApprovalStatusBadge`.

## 6. Validation

Không có nhập liệu. Chỉ kiểm tra quyền đọc + DataScope + securityLevel.

## 7. Data scope & phân quyền

- DataScope: đơn vị nào xem dữ liệu đơn vị đó; cha xem subtree; Cục xem full; securityLevel filter.
- Quyền: `buoyberth:read`, `buoyberth:read:restricted`, `buoyberth:read:confidential`. Admin Cục full + metadata.

## 8. Tài liệu tham chiếu

`ba/00-lean-spec.md` (module mục 4, 10) · feature-brief F-322 · `BuoyBerthRepository.searchBuoyBerths` · `BuoyBerthController.findAll/getById` · `BuoyBerthListPage.tsx` · `BuoyBerthDetailContent.tsx`.
