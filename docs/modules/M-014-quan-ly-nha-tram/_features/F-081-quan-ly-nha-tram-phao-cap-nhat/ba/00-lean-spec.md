---
feature-id: F-081
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Cập nhật Nhà trạm phao

## Summary

Tính năng cho phép người dùng có quyền `buoystation:update` cập nhật hồ sơ Nhà trạm phao (`BuoyStation`, `@Table buoy_station`) qua `PUT /api/v1/buoy-station/{id}`. Quy tắc sửa theo trạng thái (approval-2-level-spec mục 3.9): `DRAFT`/`REJECTED_LEVEL1`/`REJECTED_LEVEL2` → cho sửa + gửi lại; `PENDING_APPROVAL`/`APPROVED_LEVEL1`/`ARCHIVED` → cấm sửa (403); `APPROVED` → chỉ người có `buoystation:approvec2` sửa qua "Lưu và phê duyệt", hồ sơ giữ nguyên `APPROVED`. Cập nhật dùng `EntityUpdateUtils.copyPropertiesIfPresent` (chỉ copy field present, không ghi đè NULL), ghi diff vào nhật ký thay đổi. Nguồn field map: sheet "QL Nhà trạm phao tiêu" (sheet thay thế cho "QL Nhà trạm phao" không tồn tại, dùng chung F-080..F-085).

## Scope

| | Items |
|---|---|
| In scope | Cập nhật hồ sơ theo field map `BuoyStation` #1-#22; kiểm tra trạng thái cho phép sửa theo ma trận T12; cập nhật GIS/tọa độ/file đính kèm; "Lưu và phê duyệt" cho hồ sơ `APPROVED` (giữ nguyên trạng thái, ghi nhật ký); ghi diff thay đổi; data scope theo `unitId`; phân quyền `buoystation:update`. |
| Out of scope | Sửa code/schema; phê duyệt (F-083); xóa (F-082); lịch sử (F-085); sửa bản ghi `Buoy` con (module khác, chỉ đọc); migration. |
| Assumptions | User đăng nhập có quyền phù hợp; hồ sơ tồn tại và thuộc phạm vi đơn vị user; phần kỹ thuật là đề xuất BA, SA chốt. |

### Field Coverage Matrix

Nguồn: Excel sheet "QL Nhà trạm phao tiêu" (sheet thay thế cho "QL Nhà trạm phao"). Cột DS = Danh sách, Lọc = Bộ lọc, CT = Xem chi tiết, Tạo/Sửa = Form tạo mới/chỉnh sửa.

| # | Label | Technical field | Control | Required | DS | Lọc | CT | Tạo | Sửa |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Mã nhà trạm | `code` | Input (disabled, tự sinh `NT-{seq}`) | Không (auto) | Có | Có | Có | Có | Có |
| 2 | Tên nhà trạm | `name` | InputTextArea | **Có** | Có | Có | Có | Có | Có |
| 3 | Đơn vị quản lý | `unitId` | SelectOrgCode | **Có (khi tạo)** | Có | Có | Có | Có | Có |
| 4 | Đơn vị khai thác | `operatingOrgId` | SelectCateOther | **Có** | Có | Không | Có | Có | Có |
| 5 | Thuộc cảng biển | `portId` | SelectKcht (CB) | Không | Có | Có | Có | Có | Có |
| 6 | Thuộc luồng hàng hải | `waterwayId` | SelectKcht (LHH) | **Có** | Có | Có | Có | Có | Có |
| 7 | Tuyến luồng hàng hải | `waterwayRouteId` | SelectKcht (LHH_TL) | Không | Không | Không | Có | Có | Có |
| 8 | Địa điểm (Tỉnh/TP) | `province` / `provinceId` | SelectCateOther | **Có** | Không | Có | Có | Có | Có |
| 9 | Địa điểm chi tiết | `address` | InputTextArea | Không | Không | Không | Có | Có | Có |
| 10 | Thời điểm xây dựng | `constructionDate` | DatePicker | Không | Không | Không | Có | Có | Có |
| 11 | Tình trạng | `condition` (entity còn `status` StationStatus) | SelectAppParams | **Có** | Có | Có | Có | Có | Có |
| 12 | Tổng diện tích (m²) | `totalArea` | InputDecimal | Không | Không | Không | Có | Có | Có |
| 13 | Diện tích sử dụng (m²) | `usableArea` | InputDecimal | Không | Không | Không | Có | Có | Có |
| 14 | Số lượng nhân sự bố trí | `staffCount` | Input | **Có** | Không | Không | Có | Có | Có |
| 15 | Năm bảo trì gần nhất | `lastMaintenanceYear` | DatePicker (năm) | Không | Không | Không | Có | Có | Có |
| 16 | Ghi chú | `note` | InputTextArea | Không | Không | Không | Có | Có | Có |
| 17 | Loại đối tượng | `objectType` / `geometryType` | Select (Điểm/Đường/Vùng) | Không | Không | Không | Có | Có | Có |
| 18 | Biểu tượng | `icon` | Select | Không | Không | Không | Có | Có | Có |
| 19 | Hệ quy chiếu | `coordinateSystem` | Text | Không | Không | Không | Có | Có | Có |
| 20 | Quy tắc hiển thị | `displayFormat` | Text | Không | Không | Không | Có | Có | Có |
| 21 | Tọa độ GIS | `latitude`/`longitude`/`coordinates` | LocationInformationForm | Không | Không | Không | Có | Có | Có |
| 22 | File đính kèm | `attachments` | UploadFileTable | Không | Không | Không | Có | Có | Có |
| 23-27 | Danh sách phao tiêu (Mã/Tên/Phân loại/Phân loại phao/Phân loại tiêu) | `buoy.*` (child read-only) | Text (read-only) | — | 25,26: Có | 25,26: Có | Có | Không | Không |
| 28-31 | Thông tin vận hành khai thác | `operationPlan*` | Text (read-only) | — | Không | Không | Có | Không | Không |
| 32-35 | Thông tin bảo trì | `maintenancePlan*` | Text (read-only) | — | Không | Không | Có | Không | Không |
| 36-39 | Thông tin sự cố | `incident*` | Text (read-only) | — | Không | Không | Có | Không | Không |
| 40 | Trạng thái | `approvalStatus` | Badge (read-only) | — | Có | Có | Có | Không | Không |
| 41 | Ngày cập nhật | `updatedAt` | Text (read-only) | — | Có | Có | Có | Không | Không |
| 42 | Cán bộ cập nhật | `updatedBy` | Text (read-only) | — | Có | Không | Có | Không | Không |
| 43 | Ngày gửi phê duyệt | `sentApprovedDate` | Text (read-only) | — | Có | Không | Có | Không | Không |
| 44 | Cán bộ gửi phê duyệt | `sentApprovedBy` | Text (read-only) | — | Có | Không | Có | Không | Không |
| 45 | Ngày phê duyệt cấp Cảng vụ/Chi cục | `level1ApprovedDate` | Text (read-only) | — | Có | Không | Có | Không | Không |
| 46 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | `level1ApprovedBy` | Text (read-only) | — | Có | Không | Có | Không | Không |
| 47 | Nội dung phê duyệt | `level1ApprovalContent` | Text (read-only) | — | Không | Không | Có | Không | Không |
| 48 | Ngày phê duyệt cấp Cục | `level2ApprovedDate` | Text (read-only) | — | Có | Không | Có | Không | Không |
| 49 | Cán bộ phê duyệt cấp Cục | `level2ApprovedBy` | Text (read-only) | — | Có | Không | Có | Không | Không |
| 50 | Nội dung phê duyệt | `level2ApprovalContent` | Text (read-only) | — | Không | Không | Có | Không | Không |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-081-01 | Chuyên viên | Sửa hồ sơ nhà trạm đang `DRAFT` hoặc bị trả về | Hoàn thiện hồ sơ trước khi gửi duyệt | Must Have |
| US-081-02 | Chuyên viên | Sửa và gửi lại sau khi bị reject (vòng 1 hoặc vòng 2) | Không tắc quy trình phê duyệt | Must Have |
| US-081-03 | Người có quyền `approvec2` | Sửa hồ sơ `APPROVED` qua "Lưu và phê duyệt" | Cập nhật hồ sơ đang hiệu lực không mất trạng thái | Must Have |
| US-081-04 | Người dùng | Không sửa được hồ sơ đang chờ duyệt | Bảo toàn nội dung cán bộ đã đọc | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-081-01 | US-081-01 | Sửa hồ sơ DRAFT | Given hồ sơ `DRAFT` và user có `buoystation:update`; When PUT `/api/v1/buoy-station/{id}`; Then cập nhật các field present, `updatedBy/updatedAt` ghi từ session, diff ghi nhật ký | Không ghi đè field NULL bằng request |
| AC-081-02 | US-081-04 | Cấm sửa khi chờ duyệt | Given hồ sơ `PENDING_APPROVAL`/`APPROVED_LEVEL1`; When PUT; Then 403 "Không thể sửa hồ sơ đang trong quy trình phê duyệt"; UI ẩn nút sửa | Ma trận T12 bắt buộc, không tự viết lại điều kiện |
| AC-081-03 | US-081-02 | Sửa và gửi lại sau reject | Given hồ sơ `REJECTED_LEVEL1`/`REJECTED_LEVEL2`; When PUT kèm submit; Then cập nhật và chuyển về `PENDING_APPROVAL` (vòng 1) | Re-submit luôn vào lại vòng 1 |
| AC-081-04 | US-081-03 | Lưu và phê duyệt hồ sơ APPROVED | Given hồ sơ `APPROVED` và user có `buoystation:approvec2`; When PUT (Lưu và phê duyệt); Then cập nhật nội dung, hồ sơ GIỮ NGUYÊN `APPROVED`, bản cũ ghi nhật ký | Tuyệt đối không hạ về `DRAFT` |
| AC-081-05 | US-081-01 | Data scope khi sửa | Given hồ sơ ngoài phạm vi đơn vị user; When PUT; Then 403 và không cập nhật | `validateAllowedOrgUnit` |
| AC-081-06 | US-081-01 | Field read-only | Given payload gửi `approvalStatus`/`approvalLevel`/`level*Approved*`/`operationPlan*`; When PUT; Then server bỏ qua hoặc trả lỗi rõ nghĩa | Không cho client ghi metadata |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-081-01 | Ma trận sửa theo trạng thái (approval-2-level-spec mục 3.9): `DRAFT`/`REJECTED_LEVEL1`/`REJECTED_LEVEL2` cho sửa; `PENDING_APPROVAL`/`APPROVED_LEVEL1`/`ARCHIVED` cấm; `APPROVED` chỉ sửa qua "Lưu và phê duyệt" với `approvec2` | AC-081-02, AC-081-04 | Không |
| BR-081-02 | Dùng chung `EntityUpdateUtils.copyPropertiesIfPresent` — chỉ copy field present; không ghi đè bằng NULL | AC-081-01 | Không |
| BR-081-03 | `code` không được sửa qua PUT (mã tự sinh `NT-{seq}` cố định) | AC-081-01 | Không |
| BR-081-04 | `unitId` thay đổi phải nằm trong phạm vi user (data scope); cấm gán đơn vị ngoài phạm vi | AC-081-05 | Admin Cục/Cục full scope |
| BR-081-05 | Metadata phê duyệt và dữ liệu vận hành/bảo trì/sự cố là read-only trong update | AC-081-06 | Không |
| BR-081-06 | "Lưu và phê duyệt" ghi bản cũ vào nhật ký thay đổi, giữ `APPROVED`, ghi `updatedBy/updatedAt` | AC-081-04 | Không |
| BR-081-07 | Permission `buoystation:update` (hoặc `data:update`) cho sửa; `buoystation:approvec2` cho "Lưu và phê duyệt"; thiếu quyền → 403 và ẩn nút | AC-081-01, AC-081-04 | ROLE_SYSTEM_ADMIN vượt qua |
| BR-081-08 | Text input phải trim trước khi lưu | AC-081-01 | Không |

## Domain Model

Như F-080 (cùng entity `BuoyStation`, `@Table buoy_station`, `@Filter(orgUnitFilter)` condition `unit_id IN`, `@DataScope` trên controller). Lưu ý drift enum: `approvalStatus` của `BuoyStation` lưu ORDINAL + smallint (đúng AGENTS.md); `BeaconStation` lưu STRING (xem F-086).

## 2-level approval flow (góc độ sửa)

- `DRAFT`/`REJECTED_LEVEL1`/`REJECTED_LEVEL2` → bộ nút `Hủy` · `Lưu tạm` · `Lưu và gửi phê duyệt`; submit → `PENDING_APPROVAL`.
- `APPROVED` → bộ nút `Hủy` · `Lưu và phê duyệt` (nút xanh lá), giữ `APPROVED`.
- Dùng chung `canEditApprovalRecord()` (frontend `utils/approvalEditPolicy.ts`) và `InfrastructureApprovalService.assertEditable()` (backend) — CẤM tự viết lại điều kiện.

## Validation Rules

- Chặn PUT khi trạng thái không cho sửa (403, message tiếng Việt).
- Không cho sửa `code`; không nhận metadata phê duyệt từ client.
- Trim text; không âm cho số liệu (đề xuất, SA chốt).
- Đơn vị mới phải trong phạm vi user.

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-081-01 | AC-081-01 | Happy path: sửa `DRAFT` thành công, field present được cập nhật, diff ghi nhật ký | Integration |
| TS-081-02 | AC-081-02 | Negative: PUT hồ sơ `PENDING_APPROVAL` → 403 | Integration |
| TS-081-03 | AC-081-03 | Boundary: sửa + gửi lại từ `REJECTED_LEVEL2` → `PENDING_APPROVAL` (vòng 1) | Integration |
| TS-081-04 | AC-081-04 | Approval: "Lưu và phê duyệt" hồ sơ `APPROVED` giữ nguyên trạng thái | Integration |
| TS-081-05 | AC-081-05 | Security: sửa hồ sơ ngoài phạm vi đơn vị → 403 | Security |
| TS-081-06 | AC-081-06 | Negative: payload gửi `approvalStatus` bị bỏ qua | Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - target aggregate revision | Cùng target `BuoyStation`; cần đối chiếu field map với entity hiện tại. |
| Architecture affected? | Low/Medium | `PUT /api/v1/buoy-station/{id}` + `buoystation:update` + Data Scope đã có; SA chốt chi tiết. |
| Implementation clear? | Yes | Ma trận sửa theo trạng thái, copyPropertiesIfPresent, giữ `APPROVED` khi lưu và phê duyệt là rõ ràng. |
| Documentation risk | Medium | Feature-brief F-081 dẫn `PUT /api/v1/buoys/{id}` + bảng `buoy_station_changes` — drift: endpoint thực tế `/api/v1/buoy-station/{id}`, nhật ký qua `infrastructure_history`; ghi nhận, không sửa brief. |
| **Verdict** | `Ready for Solution Designer review` | BA spec định nghĩa ma trận trạng thái sửa, behavior "Lưu và phê duyệt", data scope và permission boundary. |
