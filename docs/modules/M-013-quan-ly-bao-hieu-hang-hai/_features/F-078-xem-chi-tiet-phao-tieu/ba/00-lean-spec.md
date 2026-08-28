---
feature-id: F-078
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Xem chi tiết Phao tiêu

## Summary

Hệ thống cho phép người dùng có quyền `buoy:read` (hoặc `data:read`) xem chi tiết hồ sơ Phao tiêu: toàn bộ 56 trường Excel theo 5 TAB: Thông tin chung, Vị trí (GIS), File đính kèm, Vận hành & bảo trì, Xử lý & theo dõi. Các trường #34-#56 hiển thị read-only; không tạo placeholder khi nguồn rỗng. Tên đơn vị quản lý và tên nhà trạm hiển thị qua `OrgUnitCacheService` (`unitName`/`buoyStationName` trong response). Admin Cục xem thêm metadata nhạy cảm qua `read:restricted`/`read:confidential`.

> ⚠ **Drift tài liệu:** brief cũ mô tả entity `Beacon`; hiện trạng `Buoy` (`/api/buoys/{id}`, `BuoyResponse`). Không lan truyền nội dung cũ; không sửa feature-brief.md hay src/**.

## Scope

| | Items |
|---|---|
| In scope | Xem chi tiết 56 trường theo 5 TAB; read-only #34-#56; `unitName`/`buoyStationName` qua cache; file đính kèm (`BUOY`); tọa độ GIS; phân quyền `buoy:read`; Admin Cục metadata nhạy cảm. |
| Out of scope | Tạo (F-074); cập nhật (F-075); xóa (F-076); phê duyệt (F-077); lịch sử (F-079). |
| Assumptions | Response `BuoyResponse` đã chứa `unitName`, `buoyStationName` và đủ field; bản ghi thuộc phạm vi đơn vị; section kỹ thuật là đề xuất BA để SA chốt. |

### Field Coverage Matrix (feature-scoped — ma trận đầy đủ 56 trường tại F-074)

| # | Label | Technical field | Control | Required | Visibility / behavior |
|---|---|---|---|---|---|
| 1-27 | Thông tin chung (TAB 1) | `code`, `name`, `classification`, `classificationBuoy`, `classificationMark`, `orgUnitId`/`unitName`, `buoyStationId`/`buoyStationName`, `provinceId`, `locationDetail`, `condition`, `shape`, `structure`, `area`, `bodyHeight`, `diameter`, `beaconLight`, `towerHeight`, `lightHeight`, `lightModel`, `towerColor`, `powerSupply`, `range`, `commissionedDate`, `lastRepairDate`, `lightColor`, `flashType`, `period` | Theo F-074 | — | CT=true cho tất cả. |
| 28-32 | Vị trí (GIS) (TAB 2) | `coordinates`, `longitude`, `latitude`, `geometryType`, `mapSymbolId`, `coordinateSystem`, `displayRule` | LocationInformationForm/Select | — | CT=true; tọa độ từ spatial object + response. |
| 33 | File đính kèm (TAB 3) | `attachments` | UploadFileTable (read) | — | CT=true; entityType `BUOY`. |
| 34-45 | Vận hành & bảo trì (TAB 4) | `operationPlanCode/Name/StartDate/EndDate`, `maintenancePlanCode/Name/StartTime/EndTime`, `incidentCode/Type/Location/Time` | Text (read-only) | — | CT=true; entity `Buoy` đã có cột; hiển thị rỗng/null có kiểm soát nếu nguồn chưa có — không placeholder. |
| 46-56 | Xử lý & theo dõi (TAB 5) | `approvalStatus`, `updatedAt`, `updatedBy`, `submittedForApprovalAt/By`, `level1ApprovedDate/By/Content`, `level2ApprovedDate/By/Content` | Read-only | — | CT=true; nguồn workflow phê duyệt (F-077). |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-078-01 | Chuyên viên / người xem | Xem đầy đủ thông tin Phao tiêu theo TAB | Nắm hiện trạng hồ sơ | Must Have |
| US-078-02 | Admin Cục | Xem metadata nhạy cảm | Theo dõi trách nhiệm | Should Have |
| US-078-03 | Người xem | Thấy đúng tên đơn vị quản lý, tên nhà trạm | Đọc hiểu nhanh | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-078-01 | US-078-01 | Hiển thị chi tiết | Given bản ghi trong phạm vi, user có `buoy:read`; When GET `/api/buoys/{id}`; Then trả về 56 trường theo 5 TAB | — |
| AC-078-02 | US-078-03 | Tên đơn vị/nhà trạm | When xem; Then `unitName`/`buoyStationName` từ response (cache), không gọi API map ID→tên | `OrgUnitCacheService`. |
| AC-078-03 | US-078-01 | Read-only | Given nguồn vận hành/bảo trì/sự cố rỗng; When xem; Then rỗng/null có kiểm soát, không placeholder | — |
| AC-078-04 | US-078-02 | Admin Cục | Given user Admin Cục; When xem; Then xem metadata nhạy cảm | `read:restricted`/`read:confidential`. |
| AC-078-05 | US-078-01 | Phân quyền + scope | Given thiếu `buoy:read` hoặc ngoài phạm vi; When gọi; Then HTTP 403 / không trả bản ghi | — |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-078-01 | Chi tiết hiển thị đúng 56 trường Excel theo 5 TAB; control theo F-074 | AC-078-01 | Không. |
| BR-078-02 | Tên đơn vị/nhà trạm qua cache (`OrgUnitCacheService`); không map ID→tên bằng API danh sách | AC-078-02 | Không. |
| BR-078-03 | Không placeholder cho #34-#45 khi nguồn rỗng | AC-078-03 | Không. |
| BR-078-04 | Metadata nhạy cảm chỉ hiển thị cho Admin Cục + `read:restricted`/`read:confidential` | AC-078-04 | ROLE_SYSTEM_ADMIN. |
| BR-078-05 | Permission `buoy:read` (fallback `data:read`) + data scope | AC-078-05 | Cục full scope. |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Chi tiết 1 bản ghi + attachments + GIS; không N+1 | SA/Dev chốt. |
| Security | RBAC đọc + data scope; metadata giới hạn | 403 khi vi phạm. |
| UX | Label tiếng Việt có dấu; TAB theo Excel | Không hardcode UI. |
| Reliability | Null có kiểm soát, không crash | Không placeholder. |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-078-01 | AC-078-01 | Happy path: GET chi tiết trả đủ 56 trường / 5 TAB | Integration |
| TS-078-02 | AC-078-02 | Happy path: `unitName`/`buoyStationName` hiển thị đúng | Integration |
| TS-078-03 | AC-078-03 | Boundary: nguồn rỗng → hiển thị rỗng, không placeholder | Integration |
| TS-078-04 | AC-078-05 | Security: thiếu quyền / ngoài scope → 403 / không trả bản ghi | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No - reuse | Đọc `Buoy` + spatial + attachments hiện có. |
| Architecture affected? | No | GET `/api/buoys/{id}` đã implement. |
| Implementation clear? | Yes | Ma trận + nguồn hiển thị observable. |
| Documentation risk | Medium | Drift brief cũ. |
| **Verdict** | `Ready for Solution Designer review` | Khớp `BuoyResponse` + Excel 56 trường. |
