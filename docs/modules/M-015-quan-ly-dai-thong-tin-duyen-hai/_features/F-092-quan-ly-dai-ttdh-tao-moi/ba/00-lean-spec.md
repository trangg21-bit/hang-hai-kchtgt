---
feature-id: F-092
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Tạo mới Đài TTDH (CoastalStationVTS)

## Summary

Tính năng cho phép người dùng có quyền tạo mới hồ sơ Đài Thông tin duyên hải (TTDH). **ĐÃ XÁC MINH:** feature dùng entity `CoastalStationVTS` (`@Table coastal_station_vts`) + controller `CoastalStationVTSController` (`@RequestMapping("/api/v1/stations/coastal")`, `@DataScope`, `@Filter(orgUnitFilter, condition = "unit_id IN (:orgUnitIds)")`). Excel sheet "Đài TTDH" (~line 1510) là nguồn ma trận trường. Hồ sơ tạo mới ở trạng thái `StationStatus.DRAFT` + `ApprovalStatus.DRAFT` (`@PrePersist setDefaultStatus` — bình luận code: "Tạo mới luôn ở Lưu tạm"), **DRIFT #5 (feature-brief):** brief F-092 ghi "Bản ghi được lưu ở trạng thái 'Chờ phê duyệt' (pending) sau khi tạo" — code thực tế là `DRAFT`, chỉ chuyển `PENDING_APPROVAL` khi gọi submit. **DRIFT #2 (auto-code):** Excel ghi "Mã đài tự sinh DTTDH-{seq}" nhưng `CoastalStationVTSService` KHÔNG có `generateCode()` — mã lấy trực tiếp từ `request.getStationCode()` (`entity.setCode(request.getStationCode())`, bắt buộc client truyền). **DRIFT #3 (endpoint):** endpoint duyệt dùng tên `approve-l1`/`approve-l2` (không phải `approve-c1`/`approve-c2` như LRIT/Haiphong). Enum `status`/`approvalStatus` lưu ORDINAL smallint (đúng convention INT).

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-092-01 | Chuyên viên/người nhập | Mở form "Tạo mới Đài TTDH" | Điền TAB1 Thông tin chung (11 trường), TAB2 GIS (5 trường), TAB3 File đính kèm → bấm "Lưu tạm" hoặc "Lưu và gửi phê duyệt" | Hồ sơ `DRAFT` (hoặc `PENDING_APPROVAL` nếu gửi duyệt), có `code`, ghi history `CREATE` |
| UC-092-02 | Hệ thống | Submit | Gọi `POST /api/v1/stations/coastal` → service `createStation` → `FieldWriteGuard.validateObject(request)` → validate tọa độ → `repository.save` → `historyService.recordHistory` | 200 + entity; mã trùng → 400 "Mã đã tồn tại" |

## Scope

| | Items |
|---|---|
| In scope | Tạo mới hồ sơ Đài TTDH theo Excel sheet "Đài TTDH" (TAB1 11 trường, TAB2 GIS, TAB3 file); trạng thái khởi tạo `DRAFT`; ghi history `CREATE`; validate trường bắt buộc (Tên đài, Đơn vị quản lý, Phân loại đài, Địa điểm Tỉnh/TP, Địa điểm chi tiết, Tình trạng); phân quyền `coastalstation:create`; data scope theo `unitId`. |
| Out of scope | Sửa code/schema; phê duyệt (F-095); xóa (F-094); lịch sử (F-097); xem chi tiết (F-096); migration; auto-code sinh phía server (chưa có trong code — ghi nhận drift, SA chốt). |
| Assumptions | User đăng nhập có quyền; danh mục (đơn vị, tỉnh/TP, AppParams) đã có nguồn; phần kỹ thuật là đề xuất BA, SA chốt. |

## Field Coverage Matrix

Nguồn: Excel sheet "Đài TTDH" (~line 1510) — 8 cột lấy chính xác. Cột DS = Danh sách, Lọc = Bộ lọc, CT = Xem chi tiết, Tạo/Sửa = Form tạo mới/chỉnh sửa.

| # | Tên trường (Excel) | Technical field | Loại điều khiển | DS | Lọc | CT | Tạo | Sửa |
|---|---|---|---|---|---|---|---|---|
| TAB1 | Thông tin chung | | | F | F | F | F | F |
| 1 | Mã đài | `code` | Input (disabled, tự sinh DTTDH-{seq}) | T | T | T | T | F |
| 2 | Tên đài (bắt buộc) | `name` | InputTextArea | T | T | T | T | F |
| 3 | Đơn vị quản lý (bắt buộc) | `unitId` | SelectOrgCode | T | T | T | T | F |
| 4 | Đơn vị khai thác | — (chưa có cột; đề xuất `operatingOrgId`) | SelectCateOther | T | F | T | T | F |
| 5 | Phân loại đài (bắt buộc) | — (đề xuất `stationType` từ AppParams) | SelectAppParams | T | T | T | T | F |
| 6 | Địa điểm (Tỉnh/TP) (bắt buộc) | `provinceId` | SelectCateOther | T | T | T | T | F |
| 7 | Địa điểm chi tiết (bắt buộc) | `locationAddress` | InputTextArea | F | F | T | T | F |
| 8 | Tình trạng (bắt buộc) | `isActive` (Boolean) | SelectAppParams | T | T | T | T | F |
| 9 | Vùng phủ sóng | `coverageArea` | InputTextArea | F | F | T | T | F |
| 10 | Dịch vụ cung cấp | `servicesProvided` | SelectAppParams (multi-select) | F | F | T | T | F |
| 11 | Ghi chú | `description` | InputTextArea | F | F | T | T | F |
| TAB2 | Vị trí (GIS) | | | F | F | T | T | T |
| 12 | Loại đối tượng | `objectType`/`geometryType` | Select (Điểm/Đường/Vùng) | F | F | T | T | T |
| 13 | Biểu tượng | `symbol` | Select | F | F | T | T | T |
| 14 | Hệ quy chiếu | `coordinateSystem` (mặc định WGS84) | Text | F | F | T | T | T |
| 15 | Quy tắc hiển thị | `displayRule` | Text | F | F | T | T | T |
| 16 | Tọa độ | `latitude`/`longitude` (+ `spatialId`) | LongLatTable | F | F | T | T | T |
| TAB3 | File đính kèm | | | F | F | F | T | T |
| 17 | File đính kèm | attachment (bảng file riêng) | UploadFileTable | F | F | T | T | T |
| TAB4 | Vận hành & bảo trì (read-only) | từ module VH&BT | Text (read-only) | F | F | T | F | F |
| TAB5 | Xử lý & theo dõi | | | F | F | F | F | F |
| 30 | Trạng thái | `approvalStatus` | Badge (read-only) | T | T | T | F | F |
| 31 | Ngày cập nhật | `updatedAt` | Text (read-only) | T | T | T | F | F |
| 32 | Cán bộ cập nhật | `updatedBy` | Text (read-only) | T | F | T | F | F |
| 33 | Ngày gửi phê duyệt | `submittedAt` | Text (read-only) | T | F | T | F | F |
| 34 | Cán bộ gửi phê duyệt | `submittedBy` | Text (read-only) | T | F | T | F | F |
| 35 | Ngày phê duyệt cấp Cảng vụ/Chi cục | `approvedDateLevel1` | Text (read-only) | T | F | T | F | F |
| 36 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | `approverLevel1` | Text (read-only) | T | F | T | F | F |
| 37 | Nội dung phê duyệt | từ history | Text (read-only) | F | F | T | F | F |
| 38 | Ngày phê duyệt cấp Cục | `approvedDateLevel2` | Text (read-only) | T | F | T | F | F |
| 39 | Cán bộ phê duyệt cấp Cục | `approverLevel2` | Text (read-only) | T | F | T | F | F |
| 40 | Nội dung phê duyệt | từ history | Text (read-only) | F | F | T | F | F |

> Ghi chú mapping: TAB1 mục 4/5/9/10 chưa có cột tương ứng trong `CoastalStationVTS` hiện tại (entity có `frequencyBand`, `transmitPower`, `equipmentType`, `locationAddress`, `contactPerson`, `contactPhone` — lệch với Excel) — SA chốt bổ sung cột hoặc ánh xạ danh mục. TTDH là entity duy nhất có Sửa=F cho toàn bộ TAB1 (khác Inmarsat/LRIT/Cospas/TTXLTT).

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-092-01 | Trạng thái khởi tạo: `approvalStatus = DRAFT` + `status = StationStatus.DRAFT` | AC-092-02 | Khớp code `@PrePersist setDefaultStatus` |
| BR-092-02 | Mã đài bắt buộc duy nhất; trùng → 400 "Mã đã tồn tại" | AC-092-03 | `repository.findByCode` |
| BR-092-03 | Trường bắt buộc theo Excel: Tên đài, Đơn vị quản lý, Phân loại đài, Địa điểm (Tỉnh/TP), Địa điểm chi tiết, Tình trạng — thiếu → chặn lưu/gửi | AC-092-04 | Validation ở DTO/form |
| BR-092-04 | Tọa độ GIS phải hợp lệ (kinh/vĩ độ trong dải VN) — `validateCoordinates` | AC-092-05 | Code `CoastalStationVTSService.validateCoordinates` |
| BR-092-05 | Sau khi tạo ghi history `StationHistoryActionType.CREATE` | AC-092-06 | `historyService.recordHistory` |
| BR-092-06 | Phân quyền tạo: `coastalstation:create` (fallback `station:create`, `data:create`, `admin:all`) | AC-092-07 | ROLE_SYSTEM_ADMIN vượt qua |
| BR-092-07 | Data scope: đơn vị quản lý `unitId` phải nằm trong phạm vi user (`@DataScope` + `@Filter` unit_id) | AC-092-08 | Không gán đơn vị ngoài phạm vi |
| BR-092-08 | Mã đài: Excel quy định tự sinh `DTTDH-{seq}` — **DRIFT:** code hiện nhận từ request, chưa sinh phía server | AC-092-09 | SA chốt |

## Domain Model

`CoastalStationVTS` (`coastal_station_vts`): `id` UUID, `provinceId`, `code`(50), `name`(255), `description`(1000), `unitId` UUID (orgUnit — `getOrgUnitId()`), `spatialId`, `isActive`, `status` (ORDINAL smallint), `approvalStatus` (ORDINAL smallint), `approvalLevel` (ORDINAL), `submittedAt/submittedBy`, `approverLevel1/approvedDateLevel1`, `approverLevel2/approvedDateLevel2`, `approvedBy/approvedDate`, `rejectionReason`(1000), `frequencyBand`, `transmitPower`, `equipmentType`, `locationAddress`(1000), `contactPerson`, `contactPhone`. `@SQLRestriction("deleted_at IS NULL")`, `@Filter(orgUnitFilter, condition="unit_id IN (:orgUnitIds)")`. Implements `ApprovableEntity`.

## Approval flow (2 cấp C1→C2)

Áp dụng tài liệu nền `docs/conventions/approval-2-level-spec.md` §3 (7 trạng thái, chống tự duyệt 4-eyes, từ chối ≥10 ký tự). TTDH endpoint dùng tên `approve-l1`/`approve-l2` (drift #3).

| Từ | Hành động | Sang | Ai | Quyền |
|---|---|---|---|---|
| DRAFT (0) | submit | PENDING_APPROVAL (2) | Người nhập | `coastalstation:create/update` |
| DRAFT | reject/delete | — | — | chỉ DRAFT mới xóa được (`assertDeletable`) |
| PENDING_APPROVAL (2) | approve-l1 | APPROVED_LEVEL1 (3) | Cảng vụ/Chi cục | `coastalstation:approvec1` |
| PENDING_APPROVAL (2) | reject | REJECTED_LEVEL1 (8) | Cảng vụ/Chi cục | `coastalstation:reject` |
| APPROVED_LEVEL1 (3) | approve-l2 | APPROVED (5) | Cục | `coastalstation:approvec2` |
| APPROVED_LEVEL1 (3) | reject | REJECTED_LEVEL2 (9) | Cục | `coastalstation:reject` |
| REJECTED_* (8/9) | sửa + gửi lại | PENDING_APPROVAL (2) | Người nhập | `coastalstation:update` |
| APPROVED (5) | sửa "Lưu và phê duyệt" | APPROVED (5) | Người có quyền duyệt | `coastalstation:approvec2` |

4-eyes: `InfrastructureApprovalService.approveC1` chặn `createdBy == userId`; `approveC2` chặn trùng người duyệt C1 và trùng người tạo.

## Validation Rules

- Submit chỉ từ `DRAFT`/`REJECTED_*` (`InfrastructureApprovalService.submit` — "Chỉ có thể gửi duyệt hồ sơ ở trạng thái Lưu tạm hoặc Bị trả về").
- approve-l1 chỉ từ `PENDING_APPROVAL`; approve-l2 chỉ từ `APPROVED_LEVEL1`.
- Reject: `rejectionReason` bắt buộc ≥ 10 ký tự (chặn "Lý do từ chối là bắt buộc").
- Update: `assertEditable` — chặn sửa khi `PENDING_APPROVAL`/`APPROVED_LEVEL1` (403 "Không thể sửa hồ sơ đang trong quy trình phê duyệt").
- Tạo mới: `FieldWriteGuard.validateObject(request)` + `validateCoordinates(longitude, latitude)`.
- Thiếu quyền → 403; approver lấy từ session.

## Acceptance Criteria (observable)

| ID | Given/When/Then |
|---|---|
| AC-092-01 | Given user có quyền `coastalstation:create`, When gửi POST /api/v1/stations/coastal hợp lệ, Then 200 + entity có `approvalStatus=DRAFT`, `status=DRAFT`, `isActive=true` |
| AC-092-02 | Khi tạo xong, Then history `CREATE` tồn tại cho entity (kiểm tra GET /{id}/history) |
| AC-092-03 | Given mã trùng, When tạo, Then 400 "Mã đã tồn tại" |
| AC-092-04 | Given thiếu trường bắt buộc (VD tên đài), When tạo, Then chặn, thông báo tiếng Việt có dấu |
| AC-092-05 | Given tọa độ ngoài dải (VD lat > 90), When tạo, Then 400 lỗi tọa độ |
| AC-092-06 | Given user không có quyền tạo, When POST, Then 403 |
| AC-092-07 | Given user cấp đơn vị, When tạo gán `unitId` ngoài phạm vi, Then từ chối (data scope) |
| AC-092-08 | Given bấm "Lưu và gửi phê duyệt", Then `approvalStatus=PENDING_APPROVAL` + `submittedAt/submittedBy` được set |
| AC-092-09 | **Drift test:** Excel quy định mã tự sinh `DTTDH-{seq}`; hiện tại server không sinh — ghi nhận, chờ SA chốt |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - target aggregate revision | Entity `CoastalStationVTS` thiếu cột cho Đơn vị khai thác/Phân loại đài/Vùng phủ sóng/Dịch vụ cung cấp (Excel) — SA chốt bổ sung |
| Architecture affected? | Low-Medium | Endpoint approve-l1/l2 lệch tên với chuẩn approve-c1/c2 (drift #3); thiếu generateCode (drift #2) |
| Implementation clear? | Mostly | Create + DRAFT + history rõ; auto-code là drift cần quyết định |
| Documentation risk | Medium | Feature-brief ghi "pending sau khi tạo" — sai với code DRAFT (drift #5); ghi nhận, không sửa brief |
| **Verdict** | `Ready for Solution Designer review` | BA spec định nghĩa trạng thái DRAFT, ma trận trường Excel, ghi nhận 3 drift |
