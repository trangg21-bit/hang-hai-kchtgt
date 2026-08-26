---
feature-id: F-039
module-id: M-003
document: design-plan
stage: engineering-solution-designer
status: accepted
last-updated: 2026-08-26
source-of-truth:
  - _features/F-039-quan-ly-luong-hang-hai-cap-nhat/feature-brief.md
  - _features/F-039-quan-ly-luong-hang-hai-cap-nhat/ba/00-lean-spec.md
---

# Design Plan — F-039 Cập nhật Luồng hàng hải (M-003)

## 1. Mục đích và phạm vi

F-039 cho phép user có `navigationchannel:update` cập nhật partial #1-#46 của hồ sơ
`NavigationChannel` đã tồn tại (endpoint `PUT /api/v1/navigation-channel/{id}` đã implement ở F-038,
commit ed400cf7). File này CHỈ chốt phần RIÊNG của F-039: **3 gap do BA flag** (guard trạng thái,
reset về `DRAFT` sau khi sửa, ghi history `UPDATE`) + gating nút Sửa trên FE. KHÔNG lặp lại schema
71 trường / bảng con / migration `V20260825120000` / data scope đã chốt tại design plan F-038.

Thiết kế này chốt: (a) quy tắc trạng thái cho phép sửa, (b) cơ chế reset `DRAFT` + xóa field
workflow cũ, (c) cơ chế ghi history `UPDATED` (tái dùng `EntityUpdateUtils.copyPropertiesIfPresent`
theo ràng buộc AGENTS.md), (d) work orders BE/FE tách file. Mọi nhận định "hiện trạng" đều được mở
và dẫn nguồn `Basename.ext:line` trong phiên này.

## 2. Hiện trạng code (đã verify — anchor)

| Hạng mục | Hiện trạng | Anchor |
|---|---|---|
| Endpoint update | `PUT /{id}` guard `navigationchannel:update`, đọc `userId` từ `Authentication` | `NavigationChannelController.java:60-68`, `:159-165` |
| `service.update` | Partial update thủ công (if-non-null per field); **KHÔNG có guard trạng thái** — hồ sơ chưa xóa ở trạng thái nào (kể cả `APPROVED`) cũng nhận PUT; **KHÔNG reset `DRAFT`**; **KHÔNG ghi history `UPDATE`**; có write-scope `orgUnitId` + validate `securityLevel` | `NavigationChannelService.java:206-335` (guard trạng thái vắng tại `:208-210`; write-scope `:212-215`; setter thủ công `:217-289`; thay thế bảng con `:292-315`; GIS `:317-330`; save `:331-332`) |
| Audit | `nc.setUpdatedBy(updatedBy)` luôn gọi khi update (kể cả no-op) | `NavigationChannelService.java:289` |
| Enum trạng thái | `ApprovalStatus` 10 giá trị ORDINAL — `DRAFT(0)`, `PENDING_APPROVAL(2)`, `APPROVED_LEVEL1(3)`, `APPROVED_LEVEL2(4 legacy)`, `APPROVED(5)`, `REJECTED(6 legacy)`, `ARCHIVED(7)`, `REJECTED_LEVEL1(8)`, `REJECTED_LEVEL2(9)` | `ApprovalStatus.java:4-13` |
| History enum | `ApprovalHistoryStatus.UPDATED(5)` **đã tồn tại** — không cần mở rộng enum | `ApprovalHistoryStatus.java:10` |
| Utils tái dùng | `EntityUpdateUtils.copyPropertiesIfPresent` quét field non-null DTO → entity, ghi `previousValues`, hỗ trợ `ignoreFields`; pattern đã dùng ở VtsSystemService (copy + `hasFieldChanges` + history UPDATED) | `EntityUpdateUtils.java:30-80`; `VtsSystemService.java:540,647-670` |
| Pattern sibling | VtsSystemService chặn sửa khi `APPROVED` (message tiếng Việt), reset workflow + ghi history UPDATED chỉ khi có thay đổi | `VtsSystemService.java:516-518,647-670` |
| FE nút Sửa | Hiển thị theo permission `navigationchannel:update`, KHÔNG theo trạng thái | `NavigationChannelList.tsx:322-325` |

## 3. Quyết định thiết kế (SA chốt delta BA flag)

### D1 — Guard trạng thái khi sửa

Chốt theo intent work order: **chỉ sửa được ở `DRAFT`, `PENDING_APPROVAL`, `APPROVED_LEVEL1`,
`REJECTED_LEVEL1`, `REJECTED_LEVEL2`**. Mọi trạng thái khác (đặc biệt `APPROVED`=5 và
`APPROVED_LEVEL2`=4 legacy) bị từ chối.

- Vị trí: đầu `service.update`, ngay sau `findById` (`NavigationChannelService.java:207-210`).
- Cơ chế: check enum theo đối tượng (không hardcode string):
  ```java
  ApprovalStatus current = nc.getApprovalStatus() != null ? nc.getApprovalStatus() : ApprovalStatus.DRAFT;
  boolean editable = current == ApprovalStatus.DRAFT
          || current == ApprovalStatus.PENDING_APPROVAL
          || current == ApprovalStatus.APPROVED_LEVEL1
          || current == ApprovalStatus.REJECTED_LEVEL1
          || current == ApprovalStatus.REJECTED_LEVEL2;
  ```
- Message (tiếng Việt có dấu, kiểu sibling `VtsSystemService.java:516-518`):
  - `APPROVED`/`APPROVED_LEVEL2`: `"Hồ sơ đã được phê duyệt, không thể sửa trực tiếp. Vui lòng tạo hồ sơ mới để thay đổi."`
  - còn lại: `"Chỉ có thể sửa hồ sơ ở trạng thái Lưu tạm, Chờ phê duyệt, Đã duyệt C1 hoặc Bị trả về. Trạng thái hiện tại: " + current.getLabel()`.
- Hồ sơ đã xóa mềm: đã bị chặn bởi `@SQLRestriction("deleted_at IS NULL")` (`BaseEntity.java:23`) → `findById` trả "Không tìm thấy luồng hàng hải với id" (BR-039-07) — không thêm code.

### D2 — Sau khi sửa có thay đổi: reset về `DRAFT` + xóa field workflow cũ

Chốt theo intent work order ("sửa xong về DRAFT"): nếu có thay đổi thực sự và trạng thái hiện tại
khác `DRAFT`, đặt `approvalStatus = DRAFT` và **xóa toàn bộ field workflow phê duyệt cũ** để hồ sơ
phải đi lại quy trình 2 cấp (F-041), tránh dữ liệu duyệt cũ gây hiểu nhầm:

`submittedAt=null, submittedBy=null, approverLevel1=null, approvedDateLevel1=null,
approverLevel2=null, approvedDateLevel2=null, rejectionReason=null,
level1ApprovalContent=null, level2ApprovalContent=null` (field từ `BaseApprovableEntity.java:44-77`).

- **No-op update (không có field/bảng con/attachment/GIS nào đổi) → trả về hồ sơ hiện tại nguyên
  vẹn**: KHÔNG reset trạng thái, KHÔNG ghi history, KHÔNG đổi `updatedBy`/`updatedAt` (sửa hành vi
  lệch tại `NavigationChannelService.java:289`). Pattern `hasFieldChanges` theo
  `VtsSystemService.java:647`.

### D3 — Ghi history `UPDATED` (delta BA flag #1)

- Cơ chế: **KHÔNG mở rộng enum, KHÔNG thêm bảng/cột** — `ApprovalHistoryStatus.UPDATED(5)` đã có
  (`ApprovalHistoryStatus.java:10`), bảng `approval_history` đã có đủ cột `changed_field`,
  `previous_value`, `new_value` (`ApprovalHistory.java:54-62`). Không cần migration.
- Vị trí: cuối `service.update`, sau `repo.save(nc)` (`NavigationChannelService.java:331-332`), trong
  cùng transaction (`@Transactional` sẵn tại `:205`).
- Nội dung dòng history: `status=UPDATED`, `approvalLevel=LEVEL_0`, `approvedBy=updatedBy`,
  `reason="Cập nhật thông tin"`, `changedField` = danh sách field đổi (join `", "`),
  `previousValue`/`newValue` = giá trị cũ/mới định dạng (pattern `VtsSystemService.java:655-670`).
- Nguồn diff:
  - Field đơn: thay block setter thủ công (`:217-289`) bằng
    `EntityUpdateUtils.copyPropertiesIfPresent(req, nc, previousValues, <ignore>)` —
    ignore bằng hằng số `@FieldNameConstants` của DTO
    (`NavigationChannelUpdateRequest.Fields.*`, `NavigationChannelUpdateRequest.java:25`):
    `orgUnitId`, `securityLevel`, `geometryType`, `coordinates`, `routeDetails`, `coordinateList`,
    `attachments` (5 field cuối có xử lý riêng ở D2/D4; `coordinates` là WKT string trong DTO nhưng
    `List` trong entity — bắt buộc ignore để tránh ClassCast, y như `VtsSystemService.java:543-547`).
  - Sau copy, **normalize trim**: áp lại `trimToNull(...)` cho các string field đã copy
    (`channelName`, `detailedLocation`, `managementStation`, `notes`,
    `announcementDecisionNumber`, `announcementDecisionIssuer`, `protectionNotes`,
    `coordinateReferenceSystem`, `displayRule`) để giữ BR-039-04.
  - Bảng con/attachment/GIS: giữ nguyên block thay thế (`:292-315`, `:317-330`) và ghi flag thay
    đổi thủ công vào `previousValues` (vd `"routeDetails"`, `"coordinateList"`,
    `"attachments"`, `"coordinates"`) khi danh sách/GIS thực sự đổi — phục vụ `hasFieldChanges` +
    `changedField` đầy đủ.
- `orgUnitId`/`securityLevel` vẫn validate + set thủ công như hiện tại (`:212-219`) để giữ
  write-scope `Scope.allows` và `RecordSecurityLevel.validateAssignment`.

### D4 — FE gating nút Sửa theo trạng thái

- `NavigationChannelList.tsx:322-325`: nút Sửa chỉ hiển thị khi có `navigationchannel:update` **VÀ**
  `record.approvalStatus` ∈ {DRAFT, PENDING_APPROVAL, APPROVED_LEVEL1, REJECTED_LEVEL1,
  REJECTED_LEVEL2}. Dùng `APPROVAL_STATUS_OPTIONS`/label map có sẵn (`types/navigationChannel.ts:31-41`).
- `NavigationChannelForm.tsx` (modal edit): không cần guard riêng — nút Sửa đã bị chặn ở danh sách;
  nếu mở thẳng bằng URL/detail action, API trả 400-family message tiếng Việt (D1) là đủ.

## 4. Mapping acceptance criteria

| AC | Thiết kế đáp ứng | Oracle kiểm chứng |
|---|---|---|
| AC-039-01..07 | Partial update #1-#46 + trim + write-scope + từ chối read-only field — **giữ nguyên** từ F-038 | TS-039-01..07 |
| BR-039-08 (guard) | D1 + D2 | PUT hồ sơ `APPROVED` → 400-family "Hồ sơ đã được phê duyệt..."; PUT `PENDING_APPROVAL` có thay đổi → `approval_status=0` + field workflow null + 1 dòng `approval_history` status ordinal 5 |
| History UPDATE | D3 | PUT no-op → không dòng history, `approval_status` giữ nguyên, `updated_at` không đổi; PUT có thay đổi → `changed_field` chứa tên field đổi |

## 5. Work orders — tách file BE/FE (disjoint)

### Backend
| WO | File | Nội dung | Oracle |
|---|---|---|---|
| WO-F039-BE-1 | `src/main/java/com/hanghai/kchtg/navigationchannel/service/NavigationChannelService.java` | D1: guard trạng thái sau `findById` (`:208`); D2: reset DRAFT + xóa field workflow khi `hasFieldChanges` và trạng thái ≠ DRAFT; no-op early-return trước khi set `updatedBy`; D3: thay setter thủ công bằng `EntityUpdateUtils.copyPropertiesIfPresent` (ignore list ở D3) + trim lại string field + flag bảng con/GIS + ghi `ApprovalHistory` UPDATED/LEVEL_0 sau `save`. Import bổ sung: `EntityUpdateUtils`, `ApprovalHistoryStatus`, `ApprovalLevel` (đã có), `NavigationChannelUpdateRequest.Fields` | `mvn -DskipTests compile`; integration test: (1) PUT `APPROVED` → 400-family, DB không đổi; (2) PUT `PENDING_APPROVAL` có thay đổi → status=DRAFT, workflow null, 1 dòng history UPDATED; (3) PUT no-op → không history, status giữ nguyên; (4) PUT kèm `routeDetails` → bảng con thay thế + `changedField` chứa `routeDetails`; (5) PUT payload kèm `channelCode`/`#47-#71` → bỏ qua (DTO không có) |

Thứ tự thực thi: WO-F039-BE-1 (độc lập, không phụ thuộc WO khác).

### Frontend
| WO | File | Nội dung | Oracle |
|---|---|---|---|
| WO-F039-FE-1 | `frontend/src/pages/navigationchannel/NavigationChannelList.tsx` | D4: gating nút Sửa (`:322-325`) theo trạng thái cho phép; giữ gating permission hiện có | UI test: hồ sơ `APPROVED` không hiển thị nút Sửa dù có `navigationchannel:update`; hồ sơ `DRAFT`/`REJECTED_LEVEL1` hiển thị |

## 6. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| `copyPropertiesIfPresent` copy `coordinates` (String) vào `coordinates` (List) → ClassCast | Trung bình | Bắt buộc ignore `coordinates`+`geometryType` trong ignore list (đã chốt D3); test (4) bắt kịp |
| Reflection copy bỏ qua trim → lệch BR-039-04 | Trung bình | Bước normalize trim sau copy (D3) — test (5) assert không còn khoảng trắng thừa |
| Reset DRAFT vô tình xóa dữ liệu duyệt hợp lệ | Thấp | Chỉ reset khi `hasFieldChanges`; no-op giữ nguyên trạng thái |
| FE gating sai tập trạng thái → user không sửa được | Thấp | Tập trạng thái khớp D1 (5 giá trị), test UI 2 chiều |

## 7. Ràng buộc bắt buộc (nhắc lại cho implementer)

- Tên field/API English chuẩn; message/label UI tiếng Việt có dấu.
- KHÔNG hardcode field/enum string — dùng `NavigationChannelUpdateRequest.Fields.*`,
  `ApprovalStatus.X.name()`, `ApprovalHistoryStatus.UPDATED` (không viết số 5).
- Enum xuống DB giữ `@Enumerated(EnumType.ORDINAL)` + SMALLINT; không đổi `ApprovalStatus` 10 giá trị.
- Tái dùng `EntityUpdateUtils.copyPropertiesIfPresent`; KHÔNG viết lại bảng con/attachment/GIS logic
  đã verify ở `:292-330`.
- Không chạy backend; xác nhận bằng `mvn -DskipTests compile` + test theo oracle ở mục 5.
- KHÔNG sửa file thuộc F-038 đã chốt (migration, DTO create/response) trừ `NavigationChannelService.update`.
