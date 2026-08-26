---
feature-id: F-039
document: lean-spec
output-mode: lean
last-updated: 2026-08-26
---
# Cập nhật Luồng hàng hải

## Summary

Hệ thống cho phép người dùng có `navigationchannel:update` chỉnh sửa hồ sơ Luồng hàng hải đã tồn tại theo kiểu partial update trên write surface #1-#46 (giống F-038): chỉ các trường gửi trong request được áp dụng, `channelCode`/`routeCode` và #47-#71 không nhận từ client, text trim trước khi lưu, `updatedBy`/`updatedAt` ghi từ session. Nếu request đổi `orgUnitId` thì đơn vị mới phải nằm trong phạm vi đơn vị user. Code hiện tại không có guard trạng thái: hồ sơ chưa xóa ở trạng thái nào (kể cả `APPROVED`) cũng nhận PUT; update không reset về `DRAFT` và không ghi history `UPDATE` — điểm này lệch với kỳ vọng work order ban đầu và cần PMO chốt (brief mục 3 đã ghi chú).

## Scope

| | Items |
|---|---|
| In scope | Cập nhật partial #1-#46 của `NavigationChannel`; thay thế toàn bộ bảng con `routeDetails`/`coordinateList`/`attachments` khi gửi (cùng transaction); đồng bộ GIS spatial object khi gửi `coordinates`; validate write-scope `orgUnitId`; ghi `updatedBy`/`updatedAt` từ session; từ chối update hồ sơ không tồn tại/đã xóa mềm; endpoint `PUT /api/v1/navigation-channel/{id}` với quyền `navigationchannel:update`. |
| Out of scope | Thay đổi schema; bổ sung guard trạng thái/reset DRAFT/ghi history UPDATE (chờ PMO chốt — nếu chốt làm sẽ là task dev riêng); các bước phê duyệt (F-041); xóa (F-040); màn chi tiết (F-042). |
| Assumptions | Entity `NavigationChannel` và các bảng con đã có theo F-038; user đã đăng nhập và có quyền; frontend dùng chung `NavigationChannelForm.tsx` chế độ edit (prefill từ GET detail). |

### Field Coverage Matrix

| # | Label | Technical field | Control | Required | Visibility / behavior |
|---|---|---|---|---|---|
| 1 | Mức độ bảo mật | `securityLevel` | Enum select | Không | Chỉ áp dụng khi gửi; validate theo quyền user. |
| 2 | Đơn vị quản lý (#1) | `orgUnitId` | TreeSelect | Không (khi gửi) | Nếu gửi phải trong phạm vi user (`Scope.allows`); ngoài phạm vi → từ chối. |
| 3 | Hồ sơ chính #2-#21 | `seaportId`, `operatingUnitId`, `channelName`, `provinceId`, `detailedLocation`, `conditionStatus`, `managementStation`, `stationCount`, `stationStaffCount`, `stationAreaSquareMeters`, `latestStationRepairMonth`, `latestMaintenanceYear`, `latestDredgingVolumeCubicMeters`, `buoyCount`, `beaconCount`, `notes`, `announcementDecisionNumber`, `announcementDecisionDate`, `announcementDecisionIssuer` | Theo F-038 | Không | Partial update; text trim. |
| 4 | Tuyến luồng #22-#38 | `routeDetails` | Bảng con | Không | Gửi → thay thế toàn bộ; `routeCode` tự sinh. |
| 5 | Bảo vệ/bản đồ #39-#44 | `protectionScopeMeters`, `protectionNotes`, `geometryType`, `mapIconId`, `coordinateReferenceSystem`, `displayRule`, `coordinates` | Theo F-038 | Không | `coordinates` rỗng → xóa spatial object; khác → tạo/cập nhật GIS. |
| 6 | Tọa độ #45 | `coordinateList` | Bảng con | Không | Gửi → thay thế toàn bộ. |
| 7 | File đính kèm #46 | `attachments` | UploadFileTable | Không | Gửi → xóa cũ (refType=NAVIGATION_CHANNEL), lưu danh sách mới. |
| 8 | Mã tự sinh | `channelCode` (#4), `routeCode` (#23) | — | — | Không có trong DTO update; không sửa được. |
| 9 | #47-#71 | — | — | — | Không có trong DTO update; gửi → bỏ qua. |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-039-01 | Chuyên viên | Sửa các trường #1-#46 của hồ sơ Luồng hàng hải đã tạo | Cập nhật đúng thông tin KCHT khi có thay đổi | Must Have |
| US-039-02 | Chuyên viên | Chỉ gửi các trường cần sửa (partial update) | Cập nhật nhanh, không nhập lại toàn bộ form | Must Have |
| US-039-03 | Chuyên viên | Gửi lại hồ sơ sau khi sửa vào quy trình phê duyệt 2 cấp | Thay đổi được kiểm soát | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-039-01 | US-039-01 | Cập nhật partial thành công | Given user có `navigationchannel:update` và hồ sơ tồn tại; When gửi PUT với một số trường #1-#46; Then chỉ các trường gửi được áp dụng, field khác giữ nguyên, response phản ánh dữ liệu mới, `updatedAt`/`updatedBy` đổi | Audit từ session. |
| AC-039-02 | US-039-01 | Đổi đơn vị ngoài phạm vi | Given request đổi `orgUnitId` ngoài phạm vi; When gửi PUT; Then API từ chối và dữ liệu không đổi | Message tiếng Việt "Đơn vị quản lý nằm ngoài phạm vi được phân quyền". |
| AC-039-03 | US-039-01 | Chặn field read-only | Given request gửi `channelCode`/`routeCode`/#47-#71; When gửi PUT; Then server bỏ qua, không lưu | DTO không chứa các field này. |
| AC-039-04 | US-039-02 | Thay thế bảng con | Given request gửi `routeDetails`; When gửi PUT; Then danh sách tuyến luồng cũ bị thay thế toàn bộ cùng transaction, `routeCode` tự sinh | Lỗi một dòng → rollback toàn bộ update. |
| AC-039-05 | US-039-01 | Trim input | Given text có khoảng trắng thừa; When gửi PUT; Then giá trị lưu đã trim | — |
| AC-039-06 | US-039-01 | Hồ sơ không tồn tại | Given id không tồn tại hoặc đã xóa mềm; When gửi PUT; Then trả lỗi tiếng Việt, không tạo bản ghi | HTTP 400-family. |
| AC-039-07 | US-039-01 | Phân quyền | Given user thiếu `navigationchannel:update`; When gửi PUT; Then HTTP 403; UI không hiển thị nút Sửa | — |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-039-01 | Partial update: chỉ field trong request được áp dụng | AC-039-01 | Không. |
| BR-039-02 | Đổi `orgUnitId` phải nằm trong phạm vi đơn vị user | AC-039-02 | Admin Cục/Cục full scope theo permission hệ thống. |
| BR-039-03 | `channelCode`/`routeCode`/#47-#71 không nằm trong DTO update | AC-039-03 | Không. |
| BR-039-04 | Trim mọi text input trước khi lưu | AC-039-05 | Không. |
| BR-039-05 | `updatedBy`/`updatedAt` từ session, không nhận từ client | AC-039-01 | Không. |
| BR-039-06 | Bảng con gửi → thay thế toàn bộ cùng transaction | AC-039-04 | Không. |
| BR-039-07 | Hồ sơ không tồn tại/đã xóa → lỗi tiếng Việt, không tạo mới | AC-039-06 | Không. |
| BR-039-08 | Update hiện tại không đổi `approvalStatus`, không guard trạng thái (lệch kỳ vọng work order — chờ PMO chốt) | toàn bộ | Quyết định PMO. |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Data integrity | Update parent + bảng con trong một transaction | Không bản ghi mồ côi khi lỗi. |
| Security | RBAC `navigationchannel:update` + write-scope `orgUnitId` | HTTP 403 khi thiếu quyền hoặc ngoài phạm vi. |
| Auditability | `updatedBy`/`updatedAt` từ session | Truy vết được người sửa cuối. |
| UX | Label tiếng Việt có dấu; technical keys English | Không hardcode màu/spacing/font. |
| Reliability | Không gán placeholder cho field không gửi | Field không gửi giữ nguyên giá trị. |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-039-01 | AC-039-01 | Happy path: PUT với subset field → chỉ field đó đổi, response + audit mới | Integration |
| TS-039-02 | AC-039-02 | Negative: đổi `orgUnitId` ngoài phạm vi → từ chối, DB không đổi | Security |
| TS-039-03 | AC-039-03 | Negative: payload kèm `channelCode`/#47-#71 → bị bỏ qua, giá trị cũ giữ nguyên | Integration |
| TS-039-04 | AC-039-04 | Boundary: một route detail lỗi → rollback toàn bộ update | Integration |
| TS-039-05 | AC-039-05 | Boundary: text có khoảng trắng thừa → lưu đã trim | Integration |
| TS-039-06 | AC-039-06 | Negative: update hồ sơ không tồn tại/đã xóa → lỗi tiếng Việt | Integration |
| TS-039-07 | AC-039-07 | Security: thiếu `navigationchannel:update` → 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No - reuse | Dùng entity/bảng con/schema F-038 hiện có; không thêm field mới. |
| Architecture affected? | No | Endpoint PUT `/api/v1/navigation-channel/{id}` đã tồn tại (NavigationChannelController.java:58-64); permission đã seed. |
| Implementation clear? | Yes | Partial-update behavior, write-scope, child replacement và trim là observable và đã implement. |
| Documentation risk | Medium | Có 1 điểm lệch giữa kỳ vọng work order (guard trạng thái + reset DRAFT + history UPDATE) và code hiện tại — đã ghi chú ở brief mục 3, chờ PMO chốt hướng (giữ code hay bổ sung task dev). |
| **Verdict** | `Ready for Solution Designer review` | BA spec mô tả đúng behavior code hiện tại với anchor; điểm lệch đã nêu rõ để PMO quyết định. |
