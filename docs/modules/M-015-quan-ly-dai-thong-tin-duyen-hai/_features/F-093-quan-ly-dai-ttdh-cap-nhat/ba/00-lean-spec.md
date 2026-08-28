---
feature-id: F-093
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Cập nhật Đài TTDH (CoastalStationVTS)

## Summary

Tính năng cho phép cập nhật hồ sơ Đài TTDH. **ĐÃ XÁC MINH:** endpoint `PUT /api/v1/stations/coastal/{id}` → `CoastalStationVTSService.updateStation` (gọi `FieldWriteGuard.validateObject(request)` + `approvalService.assertEditable(entity)` + `validateCoordinates`). **ĐIỂM KHÁC BIỆT TTDH:** Excel sheet "Đài TTDH" quy định **Sửa = F cho TOÀN BỘ TAB1** (Mã đài, Tên đài, Đơn vị quản lý, Đơn vị khai thác, Phân loại đài, Địa điểm Tỉnh/TP, Địa điểm chi tiết, Tình trạng, Vùng phủ sóng, Dịch vụ cung cấp, Ghi chú) — chỉ TAB2 GIS + TAB3 File được sửa. Đây là điểm khác 4 nhóm đài còn lại (Sửa = T toàn TAB1). **Quy tắc sửa theo trạng thái** (`approval-2-level-spec.md` §3.9, `assertEditable`): DRAFT/REJECTED_LEVEL1/REJECTED_LEVEL2 sửa được; PENDING_APPROVAL/APPROVED_LEVEL1 đóng băng (403); APPROVED chỉ sửa qua "Lưu và phê duyệt" (`requiresSaveAndApprove`). Ghi history `StationHistoryActionType.UPDATE`. DRIFT #3 (endpoint approve-l1/l2) không liên quan update; DRIFT #2 (thiếu generateCode) ghi nhận ở F-092.

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-093-01 | Người nhập | Mở hồ sơ DRAFT → Chỉnh sửa | Sửa TAB2 GIS/TAB3 File (TAB1 readonly) → "Lưu tạm" | Bản ghi giữ `DRAFT`, history `UPDATE`, `updatedAt/updatedBy` đổi |
| UC-093-02 | Người nhập | Hồ sơ REJECTED_LEVEL1/2 | Sửa + "Lưu và gửi phê duyệt" | Quay lại `PENDING_APPROVAL` (re-submit vào vòng 1) |
| UC-093-03 | Người có quyền duyệt | Hồ sơ APPROVED | "Lưu và phê duyệt" | Giữ `APPROVED`, ghi nhật ký thay đổi, KHÔNG hạ DRAFT |
| UC-093-04 | Hệ thống | Update khi đang chờ duyệt | `assertEditable` | 403 "Không thể sửa hồ sơ đang trong quy trình phê duyệt" |

## Scope

| | Items |
|---|---|
| In scope | Cập nhật theo ma trận Excel (chỉ GIS + file cho TTDH); kiểm tra trạng thái editable; ghi history UPDATE; quyền `coastalstation:update`; data scope unitId. |
| Out of scope | Sửa code/schema; phê duyệt (F-095); xóa (F-094); auto-code. |
| Assumptions | TAB1 không sửa theo Excel là ràng buộc UI nghiệp vụ; backend vẫn nhận request đầy đủ (quyết định field-level guard thuộc SA). |

## Field Coverage Matrix

Nguồn: Excel sheet "Đài TTDH" (~line 1510) — giống F-092, cột Sửa là cột quan trọng nhất cho feature này (toàn F, trừ TAB2/TAB3).

| # | Tên trường (Excel) | Technical field | Loại điều khiển | DS | Lọc | CT | Tạo | Sửa |
|---|---|---|---|---|---|---|---|---|
| 1 | Mã đài | `code` | Input (disabled, tự sinh DTTDH-{seq}) | T | T | T | T | F |
| 2 | Tên đài (bắt buộc) | `name` | InputTextArea | T | T | T | T | F |
| 3 | Đơn vị quản lý (bắt buộc) | `unitId` | SelectOrgCode | T | T | T | T | F |
| 4 | Đơn vị khai thác | — | SelectCateOther | T | F | T | T | F |
| 5 | Phân loại đài (bắt buộc) | — | SelectAppParams | T | T | T | T | F |
| 6 | Địa điểm (Tỉnh/TP) (bắt buộc) | `provinceId` | SelectCateOther | T | T | T | T | F |
| 7 | Địa điểm chi tiết (bắt buộc) | `locationAddress` | InputTextArea | F | F | T | T | F |
| 8 | Tình trạng (bắt buộc) | `isActive` | SelectAppParams | T | T | T | T | F |
| 9 | Vùng phủ sóng | `coverageArea` | InputTextArea | F | F | T | T | F |
| 10 | Dịch vụ cung cấp | `servicesProvided` | SelectAppParams (multi-select) | F | F | T | T | F |
| 11 | Ghi chú | `description` | InputTextArea | F | F | T | T | F |
| TAB2 | Vị trí (GIS) | `objectType`/`symbol`/`coordinateSystem`/`displayRule`/`latitude`/`longitude` | Select/Text/LongLatTable | F | F | T | T | T |
| TAB3 | File đính kèm | attachment | UploadFileTable | F | F | T | T | T |
| TAB4 | Vận hành & bảo trì (read-only) | từ module VH&BT | Text (read-only) | F | F | T | F | F |
| TAB5 | Xử lý & theo dõi | `approvalStatus`/`updatedAt`/`submittedAt`/`approverLevel1/2`... | Badge/Text (read-only) | T/F | T/F | T | F | F |

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-093-01 | Chỉ sửa được hồ sơ ở DRAFT/REJECTED_LEVEL1/REJECTED_LEVEL2 (với quyền update) — `assertEditable` | AC-093-01 | PENDING/APPROVED_LEVEL1 → 403 |
| BR-093-02 | Hồ sơ APPROVED chỉ sửa qua "Lưu và phê duyệt", cần quyền `coastalstation:approvec2`, giữ nguyên APPROVED | AC-093-02 | Không hạ DRAFT |
| BR-093-03 | TTDH: TAB1 không cho sửa (Excel) — UI readonly; chỉ GIS + file editable | AC-093-03 | Khác 4 nhóm đài còn lại |
| BR-093-04 | Sau sửa: `updatedAt` đổi, ghi history `UPDATE` (old/new value) | AC-093-04 | `historyService.recordHistory` |
| BR-093-05 | Sửa từ REJECTED + gửi lại → `PENDING_APPROVAL`, re-submit vào vòng 1 | AC-093-05 | `approvalService.submit` |
| BR-093-06 | Tọa độ sửa phải hợp lệ — `validateCoordinates` | AC-093-06 | |
| BR-093-07 | Quyền: `coastalstation:update` (fallback `station:update`, `data:update`, `admin:all`) | AC-093-07 | |

## Domain Model

Giống F-092: `CoastalStationVTS` (`coastal_station_vts`), các cột GIS `latitude/longitude` + `spatialId`, `updatedAt/updatedBy` cập nhật qua `@PreUpdate`. `assertEditable` (InfrastructureApprovalService §3.9).

## Approval flow (2 cấp C1→C2)

Không chuyển trạng thái khi sửa DRAFT. Sửa REJECTED_* + gửi lại → PENDING_APPROVAL. Sửa APPROVED giữ APPROVED (recordSaveAndApprove). Đóng băng PENDING_APPROVAL/APPROVED_LEVEL1.

## Validation Rules

- `FieldWriteGuard.validateObject(request)` — chống ghi trường không được phép.
- `assertEditable` — 403 nếu PENDING_APPROVAL/APPROVED_LEVEL1/ARCHIVED.
- Tọa độ hợp lệ khi sửa GIS.
- Trường bắt buộc vẫn validate như tạo mới nếu được sửa.

## Acceptance Criteria (observable)

| ID | Given/When/Then |
|---|---|
| AC-093-01 | Given hồ sơ DRAFT, When PUT hợp lệ, Then 200 + `updatedAt` đổi + history UPDATE; Given hồ sơ PENDING_APPROVAL, When PUT, Then 403 |
| AC-093-02 | Given hồ sơ APPROVED + user có `approvec2`, When "Lưu và phê duyệt", Then giữ APPROVED, không hạ DRAFT |
| AC-093-03 | Given form sửa TTDH, Then TAB1 (11 trường) hiển thị disabled/readonly, TAB2/TAB3 editable |
| AC-093-04 | Khi sửa thành công, Then history UPDATE có old/new value |
| AC-093-05 | Given REJECTED_LEVEL1, When sửa + gửi lại, Then PENDING_APPROVAL |
| AC-093-06 | Given tọa độ sai, When sửa GIS, Then 400 |
| AC-093-07 | Given user không có `coastalstation:update`, When PUT, Then 403 |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Chỉ dùng field hiện có |
| Architecture affected? | Low | Chỉ số ít entity có conditionStatus String; TTDH dùng isActive |
| Implementation clear? | Yes | assertEditable + FieldWriteGuard + recordHistory đã có |
| Documentation risk | Low | Excel TTDH Sửa=F TAB1 là ràng buộc cần Dev/QA bám |
| **Verdict** | `Ready for Solution Designer review` | Spec rõ ràng; điểm khác biệt TTDH (TAB1 readonly) được khai báo |
