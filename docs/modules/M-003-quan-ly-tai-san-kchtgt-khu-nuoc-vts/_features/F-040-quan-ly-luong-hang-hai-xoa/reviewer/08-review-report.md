# Code Review Report — F-040 Xóa (soft delete) Luồng hàng hải (M-003, Wave 1)

- **Stage:** engineering-code-reviewer
- **Ngày review:** 2026-08-26
- **Diff baseline:** working tree vs `ed400cf7` (F-038 state)
- **Nguồn đối chiếu:** `feature-brief.md`, `design/00-design-plan.md` (D1/D2/D3, WO-F040-BE-1/FE-1), dev reports BE/FE, QA report
- **Verdict: Approved** (1 finding Low đã được FE dev + QA flag từ trước, không chặn)

## 1. Phạm vi diff đã review

| File | Thay đổi trong pipeline này | Anchor |
|---|---|---|
| `src/main/java/com/hanghai/kchtg/navigationchannel/service/NavigationChannelService.java` | D2: ghi history `DELETED` qua `ApprovalHistoryUtils.recordSoftDelete` sau `repo.save` (caller đầu tiên của utility); D1 giữ guard `APPROVED`-only | `softDelete()` :441-463 |
| `frontend/src/pages/navigationchannel/NavigationChannelList.tsx` | D3: gating nút Xóa theo `record.approvalStatus === 'APPROVED'` | `:337` |
| `src/test/java/com/hanghai/kchtg/navigationchannel/NavigationChannelServiceLifecycleTest.java` | 2 test: `softDelete_approved_recordsDeleteHistory`, `softDelete_draft_stillRejected` | toàn file |

## 2. Đối chiếu spec/design

| Yêu cầu (design/brief) | Kết quả code | Verdict |
|---|---|---|
| D1: giữ guard `APPROVED`-only (BR-040-01), message "Chỉ có luồng hàng hải đã duyệt mới có thể xóa mềm" | `if (nc.getApprovalStatus() != ApprovalStatus.APPROVED) throw new IllegalStateException(...)` đúng nguyên văn; đồng bộ 2 module sibling VTS/Cơ sở sửa chữa (quyết định SA có trade-off ghi rõ) | **PASS** |
| D2: `ApprovalHistoryUtils.recordSoftDelete(approvalHistoryRepo, id, InfrastructureType.NAVIGATION_CHANNEL, operatorId, "Xóa luồng hàng hải")` sau `repo.save`, cùng `@Transactional` | Đúng nguyên văn; utility ghi `status=DELETED`, `approvalLevel=LEVEL_0`, `approvedBy=operatorId`, `changedField=EntityFields.DELETED_AT`, `previousValue="null"`, `newValue="đã xóa mềm"` | **PASS** |
| Audit `operatorId` từ session | Controller `currentUserId(authentication)` → `service.softDelete(id, userId)`; `nc.softDelete(operatorId)` (BaseEntity) gán `deletedAt`+`deletedBy`; history `approvedBy` = operatorId — không nhận từ client | **PASS** |
| GIS cleanup cùng transaction (BR-040-03) | `if (nc.getSpatialId() != null) gisSpatialObjectService.delete(...)` trước `repo.save`, cùng method `@Transactional` | **PASS** |
| D3: FE nút Xóa chỉ khi `APPROVED` | `hasPerm('navigationchannel:delete') && record.approvalStatus === 'APPROVED'` | **PASS** |
| AC-040-03/04: hồ sơ đã xóa ẩn khỏi list/search/detail; truy cập lại → "Không tìm thấy" | `@SQLRestriction("deleted_at IS NULL")` (BaseEntity.java:23) + `findByDeletedAtIsNull` + `findById` empty → `orElseThrow` | **PASS** |
| Data scope khi xóa | `findById` đi qua `orgUnitFilter` (bật bởi `@DataScope` class-level controller — DataScopeAspect.java:145) → hồ sơ ngoài phạm vi không tìm thấy → bị chặn | **PASS** |

## 3. Findings

| # | Mức | Finding | Anchor | Bằng chứng | Hướng sửa |
|---|---|---|---|---|---|
| F1 | **Low** (đã PMO/QA ghi nhận) | **Thiếu popup xác nhận trước khi xóa.** Design plan D3 ghi "UI giữ popup xác nhận hiện có" nhưng handler hiện tại gọi thẳng `navigationChannelCRUD.delete(record.id)` — không có `Popconfirm`/`Modal.confirm`. F-040 brief §5.8 khai báo "dùng popup xác nhận (Modal) theo convention chung" → lệch giữa design và code. Thao tác xóa là phá hủy (dù soft) nên cần xác nhận. Không thuộc AC wave này (server vẫn chặn non-APPROVED + scope) | `NavigationChannelList.tsx` delete handler :344-358 (sau gating :337) | Đọc source trực tiếp; FE dev report F-040 "Finding (báo SA/PMO)"; QA report F-040 F1 | Bổ sung `Modal.confirm`/`Popconfirm` theo list-screen convention ở wave sau — chủ sở hữu SA/PMO |

## 4. Verification đã chạy (tái lập trong phiên review)

| Lệnh | Kết quả |
|---|---|
| `mvn.cmd test "-Dtest=NavigationChannelServiceTest,NavigationChannelServiceLifecycleTest"` | **18/18 pass** (gồm 2 test F-040), BUILD SUCCESS |
| `npx tsc --noEmit` (frontend/) | exit 0 |

## 5. Pre-existing errors ngoài phạm vi (PMO đã verify)

`FlywayMigrationTest` ×2 (`buoy_station.code`) + `BeaconStationServiceTest$CreateTests` ×2 (beacon scope) — xác nhận trong `target/surefire-reports/*.txt`, không liên quan navigationchannel, KHÔNG chấm fail F-040.

## 6. Kết luận

**Approved.** Toàn bộ AC-040-01..06 + D1-D3 khớp; audit `operatorId` từ session đầy đủ (deletedAt/deletedBy + history DELETED). 1 finding Low (F1 — thiếu popup xác nhận xóa) đã được flag bởi FE dev + QA, giao SA/PMO wave sau, không chặn verdict.
