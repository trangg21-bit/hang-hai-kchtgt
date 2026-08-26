# QA Report — F-039 Cập nhật Luồng hàng hải (M-003) — Wave 1

- **Feature:** F-039 (M-003) — Cập nhật Luồng hàng hải
- **Stage:** engineering-qa-engineer-wave-1
- **Ngày chạy:** 2026-08-26 09:41 (+07)
- **Nguồn kiểm chứng:** feature-brief.md, ba/00-lean-spec.md, design/00-design-plan.md (D1/D2/D3/D4, WO-F039-BE-1/FE-1), dev/05-dev-w1-update-navigation-channel.md, dev/05-fe-dev-w1-update-navigation-channel.md
- **Phạm vi:** Delta BE (guard trạng thái + reset DRAFT + history UPDATED) + gating FE nút Sửa. KHÔNG sửa code trong lượt QA này (verify-only).

## 1. Verification commands — output thực tế

| # | Lệnh | Kết quả | Exit |
|---|---|---|---|
| 1 | `C:\Users\trangtt1\scoop\apps\maven\current\bin\mvn.cmd test "-Dtest=NavigationChannelServiceTest,NavigationChannelServiceLifecycleTest"` (workdir: workspace root) | `Tests run: 16, Failures: 0, Errors: 0, Skipped: 0` — `NavigationChannelServiceLifecycleTest` 10/10 (2.350 s), `NavigationChannelServiceTest` 6/6 (2.011 s); `BUILD SUCCESS`, `Total time: 12.570 s` | 0 |
| 2 | `npx tsc --noEmit` (workdir: `frontend/`) | (no output) | 0 |
| 3 | `npx vite build` (workdir: `frontend/`) | `✓ 4044 modules transformed.` `✓ built in 1.10s`; warning chunk > 500 kB là cảnh báo có sẵn toàn repo | 0 |

Ghi chú: `mvn` không có trên PATH — dùng full path `C:\Users\trangtt1\scoop\apps\maven\current\bin\mvn.cmd` (như dev report); giá trị `-Dtest=...` phải đặt trong dấu nháy kép (PowerShell parse lỗi nếu không).

## 2. Acceptance oracle — AC → test case → verdict

| AC-ID | Oracle | Kết quả thực tế | Verdict |
|---|---|---|---|
| AC-039-01 | Partial update #1-#46, field không gửi giữ nguyên, `updatedAt`/`updatedBy` mới từ session | `update_withChange_resetsDraftClearsWorkflowAndRecordsHistory` pass; source `NavigationChannelService.update` dùng `EntityUpdateUtils.copyPropertiesIfPresent` (ignore `orgUnitId`/`securityLevel`/`geometryType`/`coordinates`/`routeDetails`/`coordinateList`/`attachments`), set `updatedBy` từ param controller `currentUserId(authentication)`; no-op không đổi audit (`update_noOp_keepsStateAndSkipsHistoryAndSave` pass) | **PASS** |
| AC-039-02 | Đổi `orgUnitId` ngoài phạm vi → từ chối, DB không đổi | Source `update` `:242-259`: `if (req.getOrgUnitId() != null && !orgUnitScopeService.currentUserScope().allows(...)) throw new AccessDeniedException` (write-scope BR-038-04) | **PASS** (source-verified) |
| AC-039-03 | Payload kèm `channelCode`/`routeCode`/#47-#71 → bị bỏ qua | `NavigationChannelUpdateRequest.java` không khai báo `channelCode`, `routeCode`, `#47-#71` (chỉ #1-#46 write surface) — client không thể gửi | **PASS** (source-verified) |
| AC-039-04 | Gửi `routeDetails` → thay thế toàn bộ cùng transaction, `routeCode` tự sinh | Source `update`: format-compare cũ/mới → `clear()` + `addAll(details)` (cascade + orphanRemoval); ghi flag `routeDetails` vào `previousValues`/`manualNewValues` → `changedField` | **PASS** (source-verified) |
| AC-039-05 | Text thừa khoảng trắng → lưu đã trim | Source `update` `:261-270`: normalize `trimToNull` lại 9 string field sau reflection copy | **PASS** (source-verified) |
| AC-039-06 | Hồ sơ không tồn tại/đã xóa mềm → lỗi tiếng Việt, không tạo bản ghi | Source `update`: `repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy luồng hàng hải với id: " + id))`; hồ sơ xóa mềm bị chặn bởi `@SQLRestriction("deleted_at IS NULL")` (BaseEntity) | **PASS** (source-verified) |
| AC-039-07 | Thiếu `navigationchannel:update` → 403; UI không hiển thị nút Sửa | Controller `PUT /{id}` `@PreAuthorize("@auth.check(authentication, 'navigationchannel:update')")`; permission đã seed (`PermissionSeeder.java:303`); FE gating `hasPerm('navigationchannel:update') && EDITABLE_APPROVAL_STATUSES.includes(record.approvalStatus)` (`NavigationChannelList.tsx:334`) | **PASS** (source-verified) |

### Design deltas (SA chốt D1/D2/D3/D4 — BR-039-08)

| Delta | Oracle | Kết quả thực tế | Verdict |
|---|---|---|---|
| D1 guard trạng thái | PUT `APPROVED`/`APPROVED_LEVEL2` → 400-family "Hồ sơ đã được phê duyệt..."; trạng thái ngoài tập → message kèm `getLabel()` | Source `update` `:220-231`: `editable` = {DRAFT, PENDING_APPROVAL, APPROVED_LEVEL1, REJECTED_LEVEL1, REJECTED_LEVEL2}; `APPROVED`/`APPROVED_LEVEL2` → `IllegalStateException("Hồ sơ đã được phê duyệt, không thể sửa trực tiếp. Vui lòng tạo hồ sơ mới để thay đổi.")`; khác → `"...Trạng thái hiện tại: " + currentStatus.getLabel()`. Test pass: `update_rejectsApprovedStatus`, `update_rejectsApprovedLevel2`, `update_rejectsArchivedWithCurrentStatusLabel` | **PASS** |
| D2 reset DRAFT + xóa workflow | PUT có thay đổi từ trạng thái ≠ DRAFT → `approvalStatus=DRAFT` + 9 field workflow null; PUT no-op → nguyên vẹn, không history/không đổi audit | Source `update` `:353-379`: `hasFieldChanges = !previousValues.isEmpty()`; no-op → early return `toResponse(nc)`; có thay đổi + `currentStatus != DRAFT` → set DRAFT + null `submittedAt/By`, `approverLevel1/2`, `approvedDateLevel1/2` (cast `(LocalDateTime) null` tránh overload LocalDate), `rejectionReason`, `level1/2ApprovalContent`. Test pass: `update_noOp_keepsStateAndSkipsHistoryAndSave`, `update_withChange_resetsDraftClearsWorkflowAndRecordsHistory`, `update_fromDraft_keepsDraftAndRecordsHistory` | **PASS** |
| D3 history UPDATED | PUT có thay đổi → 1 dòng `approval_history` status ordinal 5 (UPDATED), LEVEL_0, `changedField` = danh sách field đổi | Source `update` `:381-401`: `approvalHistoryRepo.save(ApprovalHistory.builder()...status(ApprovalHistoryStatus.UPDATED).approvalLevel(ApprovalLevel.LEVEL_0).approvedBy(updatedBy).reason("Cập nhật thông tin").changedField(formatChangedFields(previousValues))...)` sau `repo.save` cùng transaction | **PASS** |
| D4 FE gating nút Sửa | Hồ sơ ngoài tập 5 trạng thái không hiển thị nút Sửa dù có quyền | Source `NavigationChannelList.tsx:60-66`: `EDITABLE_APPROVAL_STATUSES = ['DRAFT','PENDING_APPROVAL','APPROVED_LEVEL1','REJECTED_LEVEL1','REJECTED_LEVEL2']`; `:334` dùng `hasPerm && EDITABLE_APPROVAL_STATUSES.includes(...)` | **PASS** (source-verified) |

## 3. Findings

| # | Mức | Mô tả | Chủ sở hữu |
|---|---|---|---|
| F1 | Thông tin | Oracle tích hợp (PUT qua HTTP với Spring context) không chạy được trong workspace: Flyway pre-existing `V20260822130000` làm context bootstrap fail. Delta được bảo phủ bằng 6 unit test Mockito thuần + source anchors — không phải lỗi regression. | — |

## 4. Pre-existing errors ngoài phạm vi (PMO đã verify độc lập — QA xác nhận qua surefire report)

- `FlywayMigrationTest` ×2 — `V20260822130000__add_unaccent_port_buoy_search_indexes.sql:49` tạo index trên `buoy_station.code`, cột không tồn tại (`ERROR: column "code" does not exist`, SQLState 42703) — module buoy_station migration, không liên quan navigationchannel.
- `BeaconStationServiceTest$CreateTests` ×2 — `AccessDeniedException` tại `BeaconStationService.java:202` ("Bạn không có quyền tạo đèn biển ngoài phạm vi đơn vị được phân quyền") — module beacon, org-unit scope.
- Bằng chứng: `target/surefire-reports/com.hanghai.kchtg.migration.FlywayMigrationTest.txt`, `target/surefire-reports/com.hanghai.kchtg.beacon.BeaconStationServiceTest$CreateTests.txt`. **KHÔNG chấm fail F-039 vì các lỗi này.**

## 5. Coverage đã chạy / chưa chạy

- Đã chạy: 3 gate thực thi (mvn scoped 16/16, tsc, vite build) + rà soát source từng AC.
- Chưa chạy (ghi nhận giới hạn): PUT end-to-end qua HTTP, UI E2E 2 chiều gating — cần backend chạy được (chặn bởi Flyway pre-existing) + môi trường UI.

## 6. Verdict

**PASS** — toàn bộ AC-039-01..07 + design deltas D1-D4 thỏa mãn bằng test thực thi (6/6 unit test F-039 trong LifecycleTest) + source anchors; 3 gate (16/16, tsc, vite build) đều xanh.
