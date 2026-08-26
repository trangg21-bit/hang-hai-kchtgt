# QA Report — F-041 Phê duyệt 2 cấp Luồng hàng hải (M-003) — Wave 1

- **Feature:** F-041 (M-003) — Phê duyệt Luồng hàng hải (C1: Cảng vụ/Chi cục → C2: Cục)
- **Stage:** engineering-qa-engineer-wave-1
- **Ngày chạy:** 2026-08-26 09:41 (+07)
- **Nguồn kiểm chứng:** feature-brief.md, ba/00-lean-spec.md, design/00-design-plan.md (xác nhận hiện trạng — không delta), dev/05-dev-w1-approve-navigation-channel.md, dev/05-fe-dev-w1-approve-navigation-channel.md
- **Phạm vi:** Verify-only — state machine 2 cấp, Rule 14, 4-eyes, lý do bắt buộc, history phê duyệt đã implement từ F-038 (commit ed400cf7) qua `InfrastructureApprovalService` dùng chung; wave này không sửa code.

## 1. Verification commands — output thực tế

| # | Lệnh | Kết quả | Exit |
|---|---|---|---|
| 1 | `C:\Users\trangtt1\scoop\apps\maven\current\bin\mvn.cmd test "-Dtest=NavigationChannelServiceTest,NavigationChannelServiceLifecycleTest"` (workdir: workspace root) | `Tests run: 16, Failures: 0, Errors: 0, Skipped: 0` — `NavigationChannelServiceLifecycleTest` 10/10, `NavigationChannelServiceTest` 6/6; `BUILD SUCCESS`, `Total time: 12.570 s` | 0 |
| 2 | `npx tsc --noEmit` (workdir: `frontend/`) | (no output) | 0 |
| 3 | `npx vite build` (workdir: `frontend/`) | `✓ 4044 modules transformed.` `✓ built in 1.10s`; warning chunk > 500 kB là cảnh báo có sẵn toàn repo | 0 |
| 4 | (bổ sung) `target/surefire-reports/com.hanghai.kchtg.common.service.InfrastructureApprovalServiceTest.txt` | `Tests run: 14, Failures: 0, Errors: 0, Skipped: 0` — state machine approval dùng chung được unit-test xanh | — |

## 2. Acceptance oracle — AC → test case → verdict

| AC-ID | Oracle | Kết quả thực tế (source anchor) | Verdict |
|---|---|---|---|
| AC-041-01 | Submit từ Cảng vụ/Chi cục → `PENDING_APPROVAL` + #50-#51 + history `PROPOSED`/LEVEL_0 | `InfrastructureApprovalService.submit`: guard submit (DRAFT/PROPOSED/REJECTED_LEVEL1/REJECTED_LEVEL2/REJECTED) → `isDepartmentLevelUser(userId)` false → `PENDING_APPROVAL`; `setSubmittedAt(now)`/`setSubmittedBy(userId)`; `recordHistory(...LEVEL_0, PROPOSED, ...)` | **PASS** |
| AC-041-02 | Submit từ cấp Cục → thẳng `APPROVED_LEVEL1` (Rule 14) | `submit`: `isDepartmentLevelUser` = `OrgUnitRank.DEPARTMENT` hoặc `level == 1` → `APPROVED_LEVEL1` | **PASS** |
| AC-041-03 | Duyệt C1 → `APPROVED_LEVEL1` + #52-#54 + history `APPROVED`/LEVEL_1 | `approveC1`: guard `PENDING_APPROVAL`/`PROPOSED` → `setApprovalStatus(APPROVED_LEVEL1)` + ghi `approverLevel1`/`approvedDateLevel1`/`level1ApprovalContent` (BaseApprovableEntity) + `recordHistory(...LEVEL_1, APPROVED, ...)` | **PASS** |
| AC-041-04 | Reject C1 thiếu lý do → bị chặn, trạng thái không đổi | `approveC1` reject nhánh: `if (reason == null/blank) throw new IllegalArgumentException("Lý do từ chối là bắt buộc")` | **PASS** |
| AC-041-05 | Người tạo tự duyệt → bị chặn 4-eyes | `approveC1`: `if (entity.getCreatedBy() != null && entity.getCreatedBy().equals(userId)) throw new IllegalStateException("Bạn không thể phê duyệt bản do chính mình gửi (4-eyes principle)")` | **PASS** |
| AC-041-06 | Reject C1 có lý do → `REJECTED_LEVEL1` + history `REJECTED`/LEVEL_1 | `approveC1` reject nhánh: `setApprovalStatus(REJECTED_LEVEL1)` + lưu lý do + `recordHistory(...LEVEL_1, REJECTED, ...)` | **PASS** |
| AC-041-07 | C2 trùng C1 → bị chặn 4-eyes | `approveC2`: `if (entity.getApproverLevel1() != null && entity.getApproverLevel1().equals(userId)) throw new IllegalStateException("Người phê duyệt C2 không được trùng với người phê duyệt C1 (4-eyes principle)")` | **PASS** |
| AC-041-08 | Duyệt C2 → `APPROVED` + #55-#57 + history `APPROVED`/LEVEL_2 | `approveC2`: guard `APPROVED_LEVEL1` → `setApprovalStatus(APPROVED)` + `approverLevel2`/`approvedDateLevel2`/`level2ApprovalContent` + `recordHistory(...LEVEL_2, APPROVED, ...)` | **PASS** |
| AC-041-09 | Reject C2 có lý do → `REJECTED_LEVEL2` + history | `approveC2` reject nhánh: `setApprovalStatus(REJECTED_LEVEL2)` + lý do bắt buộc + `recordHistory(...LEVEL_2, REJECTED, ...)` | **PASS** |
| AC-041-10 | Gửi lại sau reject → submit thành công, timestamp refresh, reset approver | `submit`: guard cho phép REJECTED_LEVEL1/REJECTED_LEVEL2; `setSubmittedAt(now)` luôn refresh; reset `approverLevel1/2` + `approvedDateLevel1/2` (khi về PENDING_APPROVAL reset cả C1); `setRejectionReason(null)` | **PASS** |
| AC-041-11 | Thiếu `approvec1`/`approvec2` → 403 | Controller: `/approve/c1` + `/reject-level-1` guard `navigationchannel:approvec1`; `/approve/c2` + `/reject-level-2` guard `navigationchannel:approvec2`; submit guard `navigationchannel:update`; seed đủ (`PermissionSeeder.java:306-308`); người duyệt từ `currentUserId(authentication)` (controller `:157-163`), DTO `ApprovalRequest` không có field `userId` | **PASS** |

### BR check

| BR | Kết quả | Verdict |
|---|---|---|
| BR-041-01..09 (submit guard, Rule 14, guard C1/C2, 4-eyes ×2, session-only, lý do bắt buộc, history PROPOSED/APPROVED/REJECTED + approvalLevel, level1/2ApprovalContent cả 2 nhánh) | Tất cả có mặt trong `InfrastructureApprovalService` + controller (anchor mục 2); `InfrastructureApprovalServiceTest` 14/14 pass | **PASS** |

## 3. Findings

| # | Mức | Mô tả | Chủ sở hữu |
|---|---|---|---|
| F1 | Thông tin | Chuỗi integration submit→C1→C2 (WO-F041-BE-V1) không chạy được trong workspace: Spring context bootstrap fail do Flyway pre-existing `V20260822130000`. Thay thế bằng source anchors + unit test `InfrastructureApprovalServiceTest` 14/14 + `NavigationChannelServiceLifecycleTest` 10/10 (trong đó có luồng F-039 reset DRAFT → submit lại được theo BR-041-01). | — |

## 4. Pre-existing errors ngoài phạm vi (PMO đã verify độc lập — QA xác nhận qua surefire report)

- `FlywayMigrationTest` ×2 — `V20260822130000__add_unaccent_port_buoy_search_indexes.sql:49` (`buoy_station.code` không tồn tại, SQLState 42703) — module buoy_station migration.
- `BeaconStationServiceTest$CreateTests` ×2 — `AccessDeniedException` tại `BeaconStationService.java:202` (module beacon, org-unit scope).
- Bằng chứng: surefire reports (xem F-039 QA report mục 4). **KHÔNG chấm fail F-041 vì các lỗi này.**

## 5. Coverage đã chạy / chưa chạy

- Đã chạy: 3 gate thực thi + rà soát source toàn bộ state machine + surefire `InfrastructureApprovalServiceTest` 14/14.
- Chưa chạy (giới hạn): HTTP end-to-end (submit/approve/reject qua REST với authentication), UI E2E luồng duyệt — cần backend + môi trường UI.

## 6. Verdict

**PASS** — toàn bộ AC-041-01..11 + BR-041-01..09 thỏa mãn theo source anchors (state machine, Rule 14, 4-eyes, lý do bắt buộc, người duyệt từ session) + `InfrastructureApprovalServiceTest` 14/14 + 3 gate xanh. Không có delta code trong wave này (verify-only) — không phát hiện lệch hành vi.
