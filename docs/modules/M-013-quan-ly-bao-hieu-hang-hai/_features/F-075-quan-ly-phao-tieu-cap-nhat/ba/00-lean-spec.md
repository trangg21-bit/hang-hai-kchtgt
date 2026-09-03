---
feature-id: F-075
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Cập nhật Phao tiêu

## Summary

Hệ thống cho phép người dùng có quyền `buoy:update` cập nhật hồ sơ Phao tiêu theo các trường Excel có cờ "Sửa" = true (ma trận F-074, #1-#33, trừ #24 Thời điểm sửa chữa gần nhất có Sửa=false). Cập nhật chỉ áp dụng field có trong request (`FieldWriteGuard`), không ghi đè field thiếu; trường read-only #34-#56 không nhận từ client. Hành động `action` hỗ trợ `submit`/`approved` khi cập nhật (mirror create). History `UPDATE` chỉ ghi khi bản ghi đã được duyệt (theo code hiện tại) + `ChangeHistoryService.recordChanges("Buoy", ...)`.

> ⚠ **Drift tài liệu:** brief cũ mô tả entity `Beacon`; hiện trạng là `Buoy` (`/api/buoys`, PUT `/{id}`), permission `buoy:update`. Không lan truyền nội dung cũ; không sửa feature-brief.md hay src/**.

## Scope

| | Items |
|---|---|
| In scope | Cập nhật trường Sửa=true theo Excel; áp dụng field có trong request; cập nhật GIS/spatial object khi có tọa độ mới; action `submit`/`approved` trên update; ghi history theo điều kiện đã duyệt; phân quyền `buoy:update`; data scope. |
| Out of scope | Tạo mới (F-074); xóa (F-076); phê duyệt (F-077); chi tiết (F-078); lịch sử (F-079); sửa trường read-only. |
| Assumptions | Bản ghi tồn tại trong phạm vi đơn vị; section kỹ thuật là đề xuất BA để SA chốt. |

### Field Coverage Matrix (feature-scoped — ma trận đầy đủ 56 trường tại F-074)

| # | Label | Technical field | Control | Required | Visibility (Sửa) |
|---|---|---|---|---|---|
| 1 | Mã phao, tiêu | `code` | Input (disabled) | Không | Không sửa sau tạo. |
| 2 | Tên phao, tiêu | `name` | InputTextArea | Có | Sửa được; `@NotBlank` nếu gửi. |
| 3 | Phân loại | `classification` | SelectAppParams | Có | Sửa được. |
| 4 | Phân loại phao | `classificationBuoy` | SelectAppParams | Không | Sửa được. |
| 5 | Phân loại tiêu | `classificationMark` | SelectAppParams | Không | Sửa được. |
| 6 | Đơn vị quản lý | `orgUnitId` / `unitId` | SelectOrgCode | Có | Sửa được; phải trong phạm vi. |
| 7 | Thuộc nhà trạm | `buoyStationId` | SelectKcht (ATHH, NT) | Có | Sửa được; đổi nhà trạm ảnh hưởng mã sinh (SA chốt có đổi mã không). |
| 8 | Địa điểm (Tỉnh/TP) | `provinceId` | SelectCateOther | Không | Sửa được. |
| 9 | Địa điểm chi tiết | `locationDetail` | InputTextArea | Không | Sửa được. |
| 10 | Tình trạng | `condition` | SelectAppParams | Có | Sửa được. |
| 11-27 | Chỉ số tổng hợp + Thời điểm + Đặc tính ánh sáng | `shape`, `structure`, `area`, `bodyHeight`, `diameter`, `beaconLight`, `towerHeight`, `lightHeight`, `lightModel`, `towerColor`, `powerSupply`, `range`, `commissionedDate`, `lightColor`, `flashType`, `period` | Theo F-074 | Không (trừ #18, #22) | Sửa được. |
| 24 | Thời điểm sửa chữa gần nhất | `lastRepairDate` | DatePicker | Không | **Không sửa** (Excel Sửa=false). |
| 28-32 | GIS (tọa độ, loại đối tượng, biểu tượng, hệ quy chiếu, quy tắc hiển thị) | `coordinates`/`longitude`/`latitude`, `geometryType`, `mapSymbolId`, `coordinateSystem`, `displayRule` | LocationInformationForm/Select | Không | Sửa được; cập nhật WKT spatial object. |
| 33 | File đính kèm | `attachments` | UploadFileTable | Không | Qua endpoint riêng. |
| 34-56 | Vận hành, bảo trì, sự cố, xử lý & theo dõi | `operation*`, `maintenance*`, `incident*`, `approvalStatus`... | Read-only | Không | Không sửa. |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-075-01 | Chuyên viên | Cập nhật thông tin phao tiêu (vị trí, đặc tính, phân loại) | Hồ sơ phản ánh hiện trạng | Must Have |
| US-075-02 | Chuyên viên | Chỉ gửi trường cần sửa | Tránh ghi đè | Must Have |
| US-075-03 | Chuyên viên | Cập nhật kèm gửi duyệt/duyệt thẳng | Linh hoạt luồng | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-075-01 | US-075-01 | Cập nhật thành công | Given bản ghi tồn tại, user có `buoy:update`, trong phạm vi; When PUT `/api/buoys/{id}`; Then field gửi được cập nhật, field không gửi giữ nguyên | FieldWriteGuard. |
| AC-075-02 | US-075-02 | Cập nhật từng phần | Given request chỉ gồm `name`; When cập nhật; Then chỉ `name` đổi | Không ghi đè null. |
| AC-075-03 | US-075-01 | Cập nhật GIS | Given gửi `coordinates`/`longitude`/`latitude`; When cập nhật; Then validate + cập nhật WKT spatial object | Kinh độ -180..180, vĩ độ -90..90. |
| AC-075-04 | US-075-03 | Action submit/approved | Given cập nhật kèm `action`; When lưu; Then `submit` → `PENDING_APPROVAL`; `approved` → `PUBLISHED` (ghi field duyệt) | Mirror create. |
| AC-075-05 | US-075-01 | History | Given bản ghi đã duyệt; When cập nhật; Then history `UPDATE` + `recordChanges("Buoy", ...)` | Code: chỉ khi record đã approved. |
| AC-075-06 | US-075-01 | Phân quyền + scope | Given thiếu `buoy:update` hoặc ngoài phạm vi; When cập nhật; Then HTTP 403 / từ chối | — |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-075-01 | Chỉ áp dụng field có trong request; field thiếu giữ nguyên | AC-075-01/02 | Không. |
| BR-075-02 | #24 `lastRepairDate` không sửa (Excel Sửa=false); #34-#56 read-only không nhận từ client | AC-075-01 | Không. |
| BR-075-03 | GIS: cập nhật tọa độ qua spatial object; không gửi → giữ nguyên vị trí | AC-075-03 | Không. |
| BR-075-04 | `action` trên update: `submit` → `PENDING_APPROVAL`; `approved` → `PUBLISHED` + ghi field duyệt | AC-075-04 | Không. |
| BR-075-05 | History `UPDATE` chỉ khi bản ghi đã duyệt (hành vi code); luôn `recordChanges` cho thay đổi | AC-075-05 | SA xác nhận điều kiện. |
| BR-075-06 | Data scope + permission `buoy:update` (fallback `data:update`) | AC-075-06 | ROLE_SYSTEM_ADMIN. |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Data integrity | Update từng phần không mất dữ liệu | Không ghi đè ngoài ý muốn. |
| Security | RBAC + data scope | 403 khi vi phạm. |
| Auditability | `updatedAt`/`updatedBy` + history | Truy vết. |
| UX | Message tiếng Việt có dấu | Không hardcode UI. |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-075-01 | AC-075-01/02 | Happy path: update từng phần, field khác giữ nguyên | Integration |
| TS-075-02 | AC-075-03 | Happy path: cập nhật tọa độ → spatial object đổi | Integration |
| TS-075-03 | AC-075-04 | Boundary: action `submit`/`approved` trên update | Integration |
| TS-075-04 | AC-075-05 | Happy path: history UPDATE khi đã duyệt | Integration |
| TS-075-05 | AC-075-06 | Security: thiếu permission / ngoài scope → 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No - reuse | Cập nhật trên `Buoy` hiện có. |
| Architecture affected? | No | PUT `/api/buoys/{id}` đã implement. |
| Implementation clear? | Yes | Trường sửa được + action + GIS observable. |
| Documentation risk | Medium | Drift brief cũ; SA chốt đổi nhà trạm có đổi mã không. |
| **Verdict** | `Ready for Solution Designer review` | Khớp `BuoyService.update` + Excel. |
