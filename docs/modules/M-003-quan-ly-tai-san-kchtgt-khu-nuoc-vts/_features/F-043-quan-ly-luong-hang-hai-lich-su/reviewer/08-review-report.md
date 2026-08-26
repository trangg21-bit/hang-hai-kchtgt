# Code Review Report — F-043 Lịch sử thay đổi Luồng hàng hải (M-003, Wave 1)

- **Stage:** engineering-code-reviewer
- **Ngày review:** 2026-08-26
- **Diff baseline:** working tree vs `ed400cf7` (F-038 state)
- **Nguồn đối chiếu:** `feature-brief.md`, `design/00-design-plan.md` (D1/D2/D3/D4, WO-F043-BE-1/FE-1), dev report F-043 rev.2, QA report
- **Verdict: Approved** — QA verdict "Changes-requested" (2 blocker AC-043-04/06) đã được dev rev.2 khắc phục và phiên này tái lập verify; không còn finding mở

## 1. Phạm vi diff đã review

| File | Thay đổi trong pipeline này | Anchor |
|---|---|---|
| `src/main/java/com/hanghai/kchtg/navigationchannel/service/NavigationChannelService.java` | D2-CREATED: ghi history `CREATED`/LEVEL_0 sau create (sau block retry + GIS, trước return); rev.2: guard existence + data scope đầu `getHistory` | `create()` :164-174; `getHistory()` :526-553 |
| `frontend/src/types/navigationChannel.ts` | D4: `HistoryEntry.id: number` → `string` (BE trả UUID) | `:231` |
| `src/test/java/com/hanghai/kchtg/navigationchannel/NavigationChannelServiceLifecycleTest.java` | 4 test F-043: `create_recordsCreatedHistory`, `create_outOfScope_skipsHistory`, `getHistory_nonExistentId_throwsAndSkipsHistoryQuery`, `getHistory_existingId_returnsEntries` | toàn file |

Sự kiện `UPDATED` (F-039 D3) và `DELETED` (F-040 D2) ghi ở 2 WO khác — đã review và xác nhận trong report F-039/F-040.

## 2. Đối chiếu spec/design

| Yêu cầu (AC/BR) | Kết quả code | Verdict |
|---|---|---|
| D1: không mở rộng enum, không migration | `ApprovalHistoryStatus` giữ nguyên (CREATED=0, PROPOSED=1, APPROVED=3, REJECTED=4, UPDATED=5, DELETED=6); không file migration mới; không tạo code APPROVE_C1/... | **PASS** |
| D2-CREATED: tạo → 1 dòng `CREATED`/LEVEL_0/`approvedBy=userId`/reason "Tạo mới luồng hàng hải"; tạo thất bại (write-scope) → không ghi | Đúng; ghi sau block retry codegen → chỉ 1 dòng kể cả collision; cùng `@Transactional` với create (rollback sạch nếu GIS fail); test `create_outOfScope_skipsHistory` chứng minh không ghi khi bị chặn | **PASS** |
| Sự kiện phê duyệt (PROPOSED/APPROVED/REJECTED) + UPDATED + DELETED đủ 6 loại | PROPOSED/APPROVED/REJECTED từ `InfrastructureApprovalService`; UPDATED từ F-039; DELETED từ F-040 — đủ chuỗi CREATED → PROPOSED → APPROVED/REJECTED → UPDATED → DELETED | **PASS** |
| AC-043-01: thứ tự `approved_date DESC` | `findByRefTypeAndRefIdOrderByApprovedDateDesc` + index `(ref_type, ref_id, approved_date DESC)`; `@PrePersist` gán `approvedDate` khi builder không set | **PASS** |
| AC-043-02: reject có `reason` | `recordHistory` (approval service) truyền reason; `getHistory` map `reason` | **PASS** |
| AC-043-03: hồ sơ không có sự kiện → `[]` | Repository trả list rỗng → map → `[]` (200) | **PASS** |
| **AC-043-04 (QA blocker 1 — đã fix rev.2):** hồ sơ không tồn tại/đã xóa mềm → 400-family "Không tìm thấy luồng hàng hải với id" | `getHistory` mở đầu bằng `repo.findById(id).orElseThrow(IllegalArgumentException("Không tìm thấy luồng hàng hải với id: " + id))`; hồ sơ xóa mềm bị chặn bởi `@SQLRestriction("deleted_at IS NULL")`; test `getHistory_nonExistentId_throwsAndSkipsHistoryQuery` (không gọi history query khi empty) | **PASS** |
| **AC-043-06 (QA blocker 2 — đã fix rev.2):** hồ sơ ngoài phạm vi đơn vị → không rò rỉ history | Guard `repo.findById` đi qua `orgUnitFilter` (bật bởi `@DataScope` class-level — xác nhận `DataScopeAspect.processDataScope` :145 enable filter với subtree IDs) → record ngoài scope empty → `orElseThrow` trước khi chạm `approval_history`; history query sau đó chỉ đọc dòng của record đã nằm trong scope → **không còn rò rỉ**. KHÔNG thêm `@Filter` vào `ApprovalHistory` (đúng — entity dùng chung, không có `orgUnitId`) | **PASS** |
| AC-043-05: thiếu `navigationchannel:history` → 403; UI không hiển thị timeline khi không quyền | Controller `GET /{id}/history` `@PreAuthorize("...navigationchannel:history")`; seed `PermissionSeeder.java:310`; `HistoryTimeline` chỉ render trong detail | **PASS** |
| D4: `HistoryEntry.id` string | `types/navigationChannel.ts:231`; tsc + build xanh; render path (`HistoryTimeline`) không đọc `id` → không đổi hành vi; các module khác có type riêng, không ảnh hưởng | **PASS** |

## 3. Findings

| # | Mức | Finding | Anchor | Bằng chứng | Trạng thái |
|---|---|---|---|---|---|
| F1 | Cao (đã đóng) | AC-043-04: `getHistory` không existence check → trả `[]`/history của hồ sơ đã xóa (QA flag lúc 09:41) | `getHistory()` (bản trước rev.2) | QA report F-043 F1 | **Đã fix** — guard `repo.findById().orElseThrow` rev.2 (dev report F-043 mục Rework), test mới + re-run 18/18 |
| F2 | Cao (đã đóng) | AC-043-06: history không bị org-unit scope → rò rỉ tên người duyệt/lý do cho user ngoài phạm vi (QA flag lúc 09:41) | `getHistory()` (bản trước rev.2); `ApprovalHistory` không có `@Filter` | QA report F-043 F2 | **Đã fix** — guard phía `NavigationChannel` (entity có `@Filter` + `@DataScope` bật) chặn trước khi đọc history; không rò rỉ |
| F3 | Info | Gốc rễ 2 blocker là read path có từ F-038 (không phải regression delta wave này), nhưng thuộc acceptance criteria F-043 nên QA chấm đúng | — | QA report F-043 F3 | Đã đóng bởi rev.2 |

## 4. Verification đã chạy (tái lập trong phiên review)

| Lệnh | Kết quả |
|---|---|
| `mvn.cmd test "-Dtest=NavigationChannelServiceTest,NavigationChannelServiceLifecycleTest"` | **18/18 pass** (12 lifecycle gồm 2 test getHistory mới + 6 service), BUILD SUCCESS |
| `npx tsc --noEmit` (frontend/) | exit 0 |
| Xác nhận cơ chế scope: `DataScopeAspect.java:145` (`session.enableFilter("orgUnitFilter")`), `NavigationChannel.java:22` (`@Filter orgUnitFilter`), `NavigationChannelController.java:25` (`@DataScope`) | đọc source trực tiếp |

## 5. Pre-existing errors ngoài phạm vi (PMO đã verify)

`FlywayMigrationTest` ×2 (`buoy_station.code`) + `BeaconStationServiceTest$CreateTests` ×2 (beacon scope) — xác nhận trong `target/surefire-reports/*.txt`, KHÔNG chấm fail F-043.

## 6. Kết luận

**Approved.** Delta wave (CREATED + type FE) đúng; 2 blocker QA (AC-043-04/06) đã được rev.2 khắc phục bằng guard existence + data scope đầu `getHistory` — cơ chế xác nhận hoạt động (filter orgUnit active trong request `@DataScope`). Toàn bộ AC-043-01..06 + D1-D4 thỏa; 18/18 test + tsc xanh. Không còn finding mở.
