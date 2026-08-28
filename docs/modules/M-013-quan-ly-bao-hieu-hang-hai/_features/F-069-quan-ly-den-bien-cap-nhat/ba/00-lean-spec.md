---
feature-id: F-069
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Cập nhật Đèn biển (và nhà trạm)

## Summary

Hệ thống cho phép người dùng có quyền `beaconstation:update` cập nhật hồ sơ Đèn biển đã tồn tại theo các trường Excel có cờ "Sửa" = true (ma trận F-068, #1-#34). Cập nhật chỉ áp dụng field có mặt trong request (cơ chế `FieldWriteGuard`/copy-if-present), không ghi đè field thiếu; trường read-only #35-#57 không nhận từ client. Loại đèn biển (`type`) không được thay đổi sau khi đã phê duyệt (`APPROVED_L2`/`PUBLISHED`). Hành động `action` hỗ trợ `submit` (lưu và gửi duyệt) khi cập nhật. History `UPDATE` chỉ ghi khi bản ghi đã được duyệt (theo code hiện tại).

> ⚠ **Drift tài liệu:** brief cũ mô tả entity `Beacon` (`/api/v1/beacons`); hiện trạng code là `BeaconStation` (`/api/beacon-stations`, table `beacon_light`), permission `beaconstation:update`. Không lan truyền nội dung cũ; không sửa feature-brief.md hay src/**.

## Scope

| | Items |
|---|---|
| In scope | Cập nhật các trường Sửa=true theo Excel (#1-#34); áp dụng field có trong request; chặn đổi `type` sau phê duyệt; cập nhật GIS/spatial object khi có tọa độ; ghi history `UPDATE` theo điều kiện đã duyệt; phân quyền `beaconstation:update`; data scope theo đơn vị. |
| Out of scope | Tạo mới (F-068); xóa (F-070); phê duyệt (F-071); xem chi tiết (F-072); lịch sử (F-073); sửa trường read-only #35-#57. |
| Assumptions | Bản ghi tồn tại và thuộc phạm vi đơn vị user; action `submit` trên update tương tự create (→ `PENDING_APPROVAL`); section kỹ thuật là đề xuất BA để SA chốt. |

### Field Coverage Matrix (feature-scoped — ma trận đầy đủ 57 trường tại F-068)

| # | Label | Technical field | Control | Required | Visibility (Sửa) |
|---|---|---|---|---|---|
| 1 | Mã đèn biển | `code` | Input (disabled) | Không | Hiển thị disabled, không sửa; mã cố định sau tạo. |
| 2 | Tên đèn biển | `name` | InputTextArea | Có | Sửa được; `@NotBlank` nếu gửi. |
| 3 | Đơn vị quản lý | `orgUnitId` / `unitId` | SelectOrgCode | Có | Sửa được; phải trong phạm vi user (data scope). |
| 4 | Thuộc cảng biển | `seaportId` | SelectKcht (CB) | Không | Sửa được. |
| 5 | Đơn vị vận hành | `operator` | SelectCateOther | Không | Sửa được. |
| 6 | Địa điểm (Tỉnh/TP) | `provinceId` | SelectCateOther | Không | Sửa được. |
| 7 | Địa điểm chi tiết | `detailedLocation` | InputTextArea | Không | Sửa được. |
| 8 | Tình trạng | `operationalStatus` | SelectAppParams | Không | Sửa được. |
| 9 | Chủng loại đèn chính | `primaryLightModel` | Input | Không | Sửa được. |
| 10 | Chủng loại đèn dự phòng | `backupLightModel` | Input | Không | Sửa được. |
| 11 | Cấp trạm đèn / Loại đèn biển | `type` | SelectAppParams | Không | Sửa được nhưng bị chặn khi đã duyệt (BR-069-02). |
| 12 | Địa bàn | `region` | InputTextArea | Không | Sửa được. |
| 13 | Đặc điểm nhận dạng | `identifyingFeature` | InputTextArea | Không | Sửa được. |
| 14 | Hình dạng | `shape` | InputTextArea | Không | Sửa được. |
| 15 | Chiều cao tháp đèn (m) | `towerHeight` | InputDecimal | Không | Sửa được. |
| 16 | Chiều cao tâm sáng (m) | `lightHeight` | InputDecimal | Không | Sửa được. |
| 17 | Tầm hiệu lực địa lý | `geographicRange` | Input | Không | Sửa được. |
| 18 | Tầm hiệu lực ánh sáng | `lightRange` | InputDecimal | Không | Sửa được; `0.01..60.0`. |
| 19 | Màu sắc tháp đèn | `towerColor` | InputTextArea | Không | Sửa được. |
| 20 | Nguồn năng lượng | `powerSupply` | InputTextArea | Không | Sửa được. |
| 21 | Thời điểm đưa vào sử dụng | `commissionedDate` | DatePicker | Không | Sửa được. |
| 22 | Thời điểm sửa chữa gần nhất | `lastRepairDate` | DatePicker | Không | Sửa được. |
| 23 | Địa điểm đặt trạm đèn | `location` | InputTextArea | Không | Sửa được. |
| 24 | Kết cấu | `structure` | InputTextArea | Không | Sửa được. |
| 25 | Diện tích (m²) | `area` | InputDecimal | Không | Sửa được. |
| 26 | Diện tích sử dụng trạm đèn (m²) | `stationArea` | InputDecimal | Không | Sửa được. |
| 27 | Số lượng nhân sự bố trí | `staffCount` | InputTextArea | Không | Sửa được. |
| 28 | Ghi chú | `note` | InputTextArea | Không | Sửa được. |
| 29-32 | GIS (loại đối tượng, biểu tượng, hệ quy chiếu, quy tắc hiển thị) | `geometryType`, `mapSymbolId`, `coordinateSystem`, `displayRule` | Select/SelectIcon | Không | Sửa được. |
| 33 | Tọa độ (GIS) | `spatialId` / WKT POINT | LongLatTable | Không | Sửa qua spatial object; nếu không gửi giữ nguyên vị trí hiện có. |
| 34 | Danh sách file | `attachments` | UploadFileTable | Không | Sửa qua endpoint riêng (upload/delete attachment). |
| 35-46 | Vận hành, bảo trì, sự cố | — | Text (read-only) | Không | Không sửa. |
| 47-57 | Xử lý & theo dõi, trạng thái | `updatedAt`, `updatedBy`, `approvalStatus`... | Read-only | Không | Không sửa; hệ thống ghi. |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-069-01 | Chuyên viên | Cập nhật thông tin kỹ thuật, vị trí, GIS của Đèn biển | Hồ sơ luôn phản ánh hiện trạng thực tế | Must Have |
| US-069-02 | Chuyên viên | Chỉ gửi trường cần sửa, không phải gửi lại toàn bộ hồ sơ | Tiết kiệm thao tác, tránh ghi đè dữ liệu | Must Have |
| US-069-03 | Chuyên viên | Hệ thống chặn đổi loại đèn biển sau khi đã duyệt | Bảo toàn quyết định phê duyệt | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-069-01 | US-069-01 | Cập nhật thành công | Given bản ghi tồn tại, user có `beaconstation:update`, trong phạm vi đơn vị; When PUT `/api/beacon-stations/{id}` với field hợp lệ; Then field được cập nhật, các field không gửi giữ nguyên | FieldWriteGuard: chỉ áp dụng field có trong request. |
| AC-069-02 | US-069-02 | Cập nhật từng phần | Given request chỉ gồm `name`; When cập nhật; Then chỉ `name` đổi, các field khác không đổi | Không ghi đè bằng null. |
| AC-069-03 | US-069-03 | Chặn đổi loại sau duyệt | Given `status` = `APPROVED_L2`/`PUBLISHED`; When gửi `type` khác; Then từ chối "Loại đèn biển không thể thay đổi khi đèn biển đã được phê duyệt." | — |
| AC-069-04 | US-069-01 | Bản ghi đã xóa | Given bản ghi `status=DELETED`; When cập nhật; Then "Đèn biển đã bị xóa" (EntityNotFoundException) | — |
| AC-069-05 | US-069-01 | Action submit | Given cập nhật kèm `action=submit`; When lưu; Then bản ghi chuyển `PENDING_APPROVAL` + `approvalLevel=1` | Chỉ khi trạng thái hiện tại cho phép. |
| AC-069-06 | US-069-01 | History | Given bản ghi đã được duyệt; When cập nhật; Then ghi history `UPDATE` (BeaconHistory/`infrastructure_history`) | Code: history UPDATE chỉ khi record đã approved. |
| AC-069-07 | US-069-01 | Phân quyền + scope | Given thiếu `beaconstation:update` hoặc ngoài phạm vi; When cập nhật; Then HTTP 403 | — |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-069-01 | Chỉ áp dụng field có trong request (`FieldWriteGuard`); field không gửi giữ nguyên giá trị cũ | AC-069-01/02 | Không. |
| BR-069-02 | `type` không thay đổi khi `status` = `APPROVED_L2` hoặc `PUBLISHED` | AC-069-03 | Không. |
| BR-069-03 | Bản ghi `status=DELETED` không cập nhật được | AC-069-04 | Không. |
| BR-069-04 | Trường read-only #35-#57 không nhận từ client; server bỏ qua | AC-069-01 | Không. |
| BR-069-05 | History `UPDATE` chỉ ghi khi bản ghi đã được duyệt (hành vi code hiện tại); thao tác update vẫn lưu dữ liệu | AC-069-06 | SA xác nhận có cần đổi điều kiện ghi history. |
| BR-069-06 | Data scope: không sửa bản ghi ngoài phạm vi đơn vị; GIS tọa độ giữ nguyên nếu không gửi | AC-069-07 | Cục full scope. |
| BR-069-07 | Permission `beaconstation:update` (fallback `data:update`) | AC-069-07 | ROLE_SYSTEM_ADMIN vượt qua. |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Data integrity | Update từng phần không ghi đè field khác; không null hóa field thiếu | Không mất dữ liệu ngoài ý muốn. |
| Security | RBAC + data scope | 403 khi vi phạm. |
| Auditability | Ghi `updatedAt`/`updatedBy` + history theo điều kiện | Truy vết thay đổi. |
| UX | Message tiếng Việt có dấu | Không hardcode UI. |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-069-01 | AC-069-01/02 | Happy path: update một phần field, các field khác giữ nguyên | Integration |
| TS-069-02 | AC-069-03 | Negative: đổi `type` sau khi duyệt → chặn | Integration |
| TS-069-03 | AC-069-04 | Negative: update bản ghi đã xóa → "Đèn biển đã bị xóa" | Integration |
| TS-069-04 | AC-069-05 | Happy path: update + `action=submit` → `PENDING_APPROVAL` | Integration |
| TS-069-05 | AC-069-07 | Security: thiếu permission / ngoài scope → 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No - reuse | Cập nhật trên entity `BeaconStation` hiện có, không thêm field. |
| Architecture affected? | No | PUT `/api/beacon-stations/{id}` + `FieldWriteGuard` đã implement. |
| Implementation clear? | Yes | Trường sửa được, chặn đổi type sau duyệt, history theo điều kiện — observable từ code. |
| Documentation risk | Medium | Drift brief cũ (`Beacon`); ghi nhận, không lan truyền. |
| **Verdict** | `Ready for Solution Designer review` | Khớp `BeaconStationService.update` (copy-if-present, BR-069-02 type guard, DELETED check). |
