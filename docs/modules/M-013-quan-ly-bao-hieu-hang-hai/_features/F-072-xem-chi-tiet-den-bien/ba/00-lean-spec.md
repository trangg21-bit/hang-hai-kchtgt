---
feature-id: F-072
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Xem chi tiết Đèn biển (và nhà trạm)

## Summary

Hệ thống cho phép người dùng có quyền `beaconstation:read` (hoặc `data:read`) xem chi tiết hồ sơ Đèn biển: toàn bộ 57 trường Excel (tất cả đều có cờ "Xem chi tiết" = true) theo 5 TAB: Thông tin chung, Vị trí (GIS), File đính kèm, Vận hành & bảo trì, Xử lý & theo dõi. Các trường #35-#57 hiển thị read-only; không tạo placeholder khi nguồn dữ liệu liên quan (vận hành/bảo trì/sự cố) rỗng. Tên đơn vị quản lý hiển thị qua `OrgUnitCacheService` (`unitName` trong response), không gọi API danh sách chỉ để ánh xạ ID→tên. Admin Cục xem thêm metadata nhạy cảm qua `read:restricted`/`read:confidential`.

> ⚠ **Drift tài liệu:** brief cũ mô tả entity `Beacon`; hiện trạng `BeaconStation` (`/api/beacon-stations/{id}`, `BeaconStationResponse`). Không lan truyền nội dung cũ; không sửa feature-brief.md hay src/**.

## Scope

| | Items |
|---|---|
| In scope | Xem chi tiết 57 trường theo 5 TAB; hiển thị read-only #35-#57; `orgUnitName` qua cache; file đính kèm theo entity `BEACON_LIGHT`; tọa độ GIS từ spatial object; phân quyền `beaconstation:read`; Admin Cục xem metadata nhạy cảm. |
| Out of scope | Tạo (F-068); cập nhật (F-069); xóa (F-070); phê duyệt (F-071); lịch sử (F-073). |
| Assumptions | Response `BeaconStationResponse` đã chứa `unitName` + các field; bản ghi thuộc phạm vi đơn vị user (data scope); section kỹ thuật là đề xuất BA để SA chốt. |

### Field Coverage Matrix (feature-scoped — ma trận đầy đủ 57 trường tại F-068)

| # | Label | Technical field | Control | Required | Visibility / behavior |
|---|---|---|---|---|---|
| 1-28 | Thông tin chung (TAB 1) | `code`, `name`, `orgUnitId`/`unitName`, `seaportId`, `operator`, `provinceId`, `detailedLocation`, `operationalStatus`, `primaryLightModel`, `backupLightModel`, `type`, `region`, `identifyingFeature`, `shape`, `towerHeight`, `lightHeight`, `geographicRange`, `lightRange`, `towerColor`, `powerSupply`, `commissionedDate`, `lastRepairDate`, `location`, `structure`, `area`, `stationArea`, `staffCount`, `note` | Theo F-068 | — | CT=true cho tất cả; hiển thị theo control. |
| 29-33 | Vị trí (GIS) (TAB 2) | `geometryType`, `mapSymbolId`, `coordinateSystem`, `displayRule`, `spatialId`/WKT | Select/Icon/Bảng tọa độ | — | CT=true; tọa độ đọc từ `GisSpatialObject` (spatial_id). |
| 34 | File đính kèm (TAB 3) | `attachments` | UploadFileTable (read) | — | CT=true; GET `/api/beacon-stations/{id}/attachments`. |
| 35-46 | Vận hành & bảo trì (TAB 4) | `operationPlan*`, `maintenancePlan*`, `incident*` | Text (read-only) | — | CT=true; hiển thị rỗng/null có kiểm soát nếu nguồn chưa có — không placeholder (entity Đèn biển chưa có cột, nguồn từ nghiệp vụ liên quan — SA chốt). |
| 47-57 | Xử lý & theo dõi (TAB 5) | `updatedAt`, `updatedBy`, `submitted*`, `level1*`, `level2*`, `rejectionReason`, `approvalStatus` | Read-only | — | CT=true; nguồn workflow phê duyệt (xem F-071 drift về C2). |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-072-01 | Chuyên viên / người xem có quyền | Xem đầy đủ thông tin Đèn biển theo TAB | Nắm hiện trạng hồ sơ trước khi thao tác | Must Have |
| US-072-02 | Admin Cục | Xem thêm người tạo/sửa cuối, thời gian (metadata nhạy cảm) | Theo dõi trách nhiệm cập nhật | Should Have |
| US-072-03 | Người xem | Thấy đúng tên đơn vị quản lý, không phải ID | Đọc hiểu nhanh | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-072-01 | US-072-01 | Hiển thị chi tiết | Given bản ghi trong phạm vi, user có `beaconstation:read`; When GET `/api/beacon-stations/{id}`; Then trả về 57 trường theo 5 TAB, đúng control | — |
| AC-072-02 | US-072-03 | Tên đơn vị | When xem chi tiết; Then `orgUnitName`/`unitName` hiển thị từ response (cache), không gọi API danh sách để map ID | `OrgUnitCacheService`. |
| AC-072-03 | US-072-01 | Read-only vận hành/bảo trì | Given nguồn vận hành/bảo trì/sự cố rỗng; When xem; Then hiển thị rỗng/null có kiểm soát, không placeholder | — |
| AC-072-04 | US-072-02 | Admin Cục | Given user Admin Cục; When xem chi tiết; Then xem được metadata nhạy cảm (người tạo/sửa cuối, thời gian) | Quyền `read:restricted`/`read:confidential`. |
| AC-072-05 | US-072-01 | Phân quyền + scope | Given thiếu `beaconstation:read` hoặc ngoài phạm vi; When gọi; Then HTTP 403 / không trả bản ghi | — |
| AC-072-06 | US-072-01 | Bản ghi đã xóa | Given bản ghi đã xóa; When gọi; Then không trả về (SQLRestriction) | — |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-072-01 | Chi tiết hiển thị đúng 57 trường Excel theo 5 TAB; control theo ma trận F-068 | AC-072-01 | Không. |
| BR-072-02 | Tên đơn vị quản lý hiển thị qua `OrgUnitCacheService` (`unitName`); frontend không tự map ID→tên bằng API danh sách | AC-072-02 | Không. |
| BR-072-03 | Không gán placeholder/dữ liệu giả cho #35-#46 khi nguồn rỗng; hiển thị rỗng/null có kiểm soát | AC-072-03 | Không. |
| BR-072-04 | Metadata nhạy cảm (người tạo/sửa cuối, thời gian) chỉ hiển thị cho Admin Cục và user có `read:restricted`/`read:confidential` | AC-072-04 | ROLE_SYSTEM_ADMIN. |
| BR-072-05 | Permission `beaconstation:read` (fallback `data:read`) + data scope theo đơn vị | AC-072-05 | Cục full scope. |
| BR-072-06 | Bản ghi soft-deleted không hiển thị | AC-072-06 | Không. |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Chi tiết 1 bản ghi + attachments + GIS trả nhanh; không N+1 | SA/Dev chốt chỉ số. |
| Security | RBAC đọc + data scope; metadata nhạy cảm giới hạn | 403 khi vi phạm. |
| UX | Label tiếng Việt có dấu; TAB theo Excel | Không hardcode UI. |
| Reliability | Hiển thị null có kiểm soát, không crash | Không placeholder. |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-072-01 | AC-072-01 | Happy path: GET chi tiết trả đủ 57 trường / 5 TAB | Integration |
| TS-072-02 | AC-072-02 | Happy path: `unitName` hiển thị đúng từ cache | Integration |
| TS-072-03 | AC-072-03 | Boundary: nguồn vận hành/bảo trì rỗng → hiển thị rỗng, không placeholder | Integration |
| TS-072-04 | AC-072-05 | Security: thiếu `beaconstation:read` → 403; ngoài scope → không trả bản ghi | Security |
| TS-072-05 | AC-072-06 | Negative: bản ghi đã xóa → không trả về | Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No - reuse | Đọc `BeaconStation` + spatial object + attachments hiện có. |
| Architecture affected? | No | GET `/api/beacon-stations/{id}` + `/attachments` đã implement. |
| Implementation clear? | Yes | Ma trận + nguồn hiển thị observable. |
| Documentation risk | Medium | Drift brief cũ; nguồn #35-#46 cho Đèn biển cần SA chốt. |
| **Verdict** | `Ready for Solution Designer review` | Khớp `BeaconStationResponse` + Excel 57 trường. |
