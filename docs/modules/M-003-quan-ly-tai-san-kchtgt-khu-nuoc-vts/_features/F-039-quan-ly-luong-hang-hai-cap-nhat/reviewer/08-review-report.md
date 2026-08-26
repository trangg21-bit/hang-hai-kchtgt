# Code Review Report — F-039 Cập nhật Luồng hàng hải (M-003, Wave 1)

- **Stage:** engineering-code-reviewer
- **Ngày review:** 2026-08-26
- **Diff baseline:** working tree vs `ed400cf7` (F-038 state)
- **Nguồn đối chiếu:** `feature-brief.md`, `design/00-design-plan.md` (D1/D2/D3/D4, WO-F039-BE-1/FE-1), dev reports BE/FE, QA report
- **Verdict: Approved** (1 finding mức Low, không chặn)

## 1. Phạm vi diff đã review

| File | Thay đổi trong pipeline này | Anchor |
|---|---|---|
| `src/main/java/com/hanghai/kchtg/navigationchannel/service/NavigationChannelService.java` | D1 guard trạng thái; D2 no-op early-return + reset DRAFT + xóa 9 field workflow; D3 `EntityUpdateUtils.copyPropertiesIfPresent` + trim normalize + history `UPDATED`; helpers diff/history | `update()` :222-404; helpers :750-1011 |
| `frontend/src/pages/navigationchannel/NavigationChannelList.tsx` | D4 gating nút Sửa theo trạng thái | `:60-66` (hằng số), `:334` (điều kiện) |
| `src/test/java/com/hanghai/kchtg/navigationchannel/NavigationChannelServiceLifecycleTest.java` | 12 test Mockito (6 test F-039 + 2 F-040 + 2 F-043 + 2 getHistory) | toàn file |

Không sửa DTO/entity/repository/controller/migration cho F-039 (đúng ràng buộc design mục 7).

## 2. Đối chiếu spec/design

| Yêu cầu (design/brief) | Kết quả code | Verdict |
|---|---|---|
| D1: chỉ sửa DRAFT/PENDING_APPROVAL/APPROVED_LEVEL1/REJECTED_LEVEL1/REJECTED_LEVEL2; chặn APPROVED/APPROVED_LEVEL2 message "Hồ sơ đã được phê duyệt..."; trạng thái khác message kèm `getLabel()` | Đúng nguyên văn design; so sánh enum object, không hardcode string; `@SQLRestriction` chặn hồ sơ xóa mềm trước đó | **PASS** |
| D2: có thay đổi thật + trạng thái ≠ DRAFT → `DRAFT` + null 9 field workflow; no-op → trả nguyên vẹn, không history/không đổi `updatedBy`/`updatedAt` | `hasFieldChanges = !previousValues.isEmpty()`; early-return trước `setUpdatedBy`; reset đủ 9 field (`submittedAt/By`, `approverLevel1/2`, `approvedDateLevel1/2`, `rejectionReason`, `level1/2ApprovalContent`) | **PASS** |
| D3: copyPropertiesIfPresent ignore `{orgUnitId, securityLevel, geometryType, coordinates, routeDetails, coordinateList, attachments}`; trim lại 9 string field; `orgUnitId`/`securityLevel` validate thủ công; history UPDATED/LEVEL_0 sau save cùng transaction với `changedField`/`previousValue`/`newValue` | Đúng ignore list 7 field (hằng số `NavigationChannelUpdateRequest.Fields.*`); trim đủ 9 field; write-scope `Scope.allows` + `RecordSecurityLevel.validateAssignment` giữ nguyên; history ghi sau `repo.save` trong `@Transactional` | **PASS** |
| Mass-assignment | `NavigationChannelUpdateRequest` chỉ chứa field #1-#46; `channelCode`/`routeCode`/#47-#71 không tồn tại trong DTO → không thể ghi; `FieldWriteGuard.validateObject` + `FieldVisibilityContext.assertWritable` (trong utility) gating kép | **PASS** |
| 4-eyes (câu hỏi review) | Không áp dụng cho thao tác sửa (edit ≠ approval); 4-eyes nằm ở approval service (F-041, đã verify) | **PASS** |
| D4: FE nút Sửa chỉ hiển thị khi permission + trạng thái ∈ 5 giá trị | `EDITABLE_APPROVAL_STATUSES.includes(record.approvalStatus)` khớp D1 | **PASS** |

## 3. Findings

| # | Mức | Finding | Anchor | Bằng chứng | Hướng sửa |
|---|---|---|---|---|---|
| F1 | **Low** | **Whitespace-only edit gây reset DRAFT giả + history UPDATED giả.** `copyPropertiesIfPresent` ghi `previousValues` ở giá trị RAW (chưa trim); sau đó normalize trim gán lại giá trị đã trim. Nếu request gửi `" Tên "` mà entity đang `"Tên"`, `previousValues` không rỗng → `hasFieldChanges=true` → hồ sơ `PENDING_APPROVAL`/`APPROVED_LEVEL1` bị reset về DRAFT + xóa field workflow + 1 dòng history với `previousValue` == `newValue` dù giá trị lưu cuối cùng không đổi. | `update()`: copy block :232-239 → trim :261-270 → `hasFieldChanges` :353-355 | Đọc source trực tiếp; sequence: copy (set raw, ghi previous) → trim (set về giá trị cũ) → check map. Không có test phủ case này | So sánh sau trim (bỏ qua thay đổi khi giá trị đã normalize bằng giá trị cũ) trước khi quyết định `hasFieldChanges`; hoặc trim trước khi copy. Wave sau, không chặn |
| F2 | Info | Test unit không phủ oracle (4)/(5) design: thay thế `routeDetails` → `changedField` chứa "Chi tiết tuyến luồng"; payload kèm `channelCode`/#47-#71 bị bỏ qua. Hiện phủ bằng source-verified (DTO không có field) + test `update_withChange...` | `LifecycleTest` | So QA report F-039 mục 2 (source-verified) | Bổ sung test khi có môi trường integration; không chặn |

## 4. Verification đã chạy (tái lập trong phiên review)

| Lệnh | Kết quả |
|---|---|
| `mvn.cmd test "-Dtest=NavigationChannelServiceTest,NavigationChannelServiceLifecycleTest"` | **18/18 pass** (Lifecycle 12 + Service 6), BUILD SUCCESS |
| `npx tsc --noEmit` (frontend/) | exit 0 |

## 5. Pre-existing errors ngoài phạm vi (PMO đã verify)

`FlywayMigrationTest` ×2 (`V20260822130000:49` — `buoy_station.code` không tồn tại, SQLState 42703) + `BeaconStationServiceTest$CreateTests` ×2 (`AccessDeniedException` tại `BeaconStationService.java:202`). Đã xác nhận trong `target/surefire-reports/*.txt` — không liên quan navigationchannel, KHÔNG chấm fail F-039.

## 6. Kết luận

**Approved.** Toàn bộ AC-039-01..07 + design deltas D1-D4 khớp; 18/18 test + tsc xanh. 1 finding Low (F1, edge whitespace-only) đề xuất xử lý wave sau, không vi phạm AC nào.
