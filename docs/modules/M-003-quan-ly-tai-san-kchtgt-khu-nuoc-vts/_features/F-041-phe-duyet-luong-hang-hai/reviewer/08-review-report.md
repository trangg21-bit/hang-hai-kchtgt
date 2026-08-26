# Code Review Report — F-041 Phê duyệt 2 cấp Luồng hàng hải (M-003, Wave 1)

- **Stage:** engineering-code-reviewer
- **Ngày review:** 2026-08-26
- **Diff baseline:** working tree vs `ed400cf7` (F-038 state) — **F-041 là verify-only, không có delta code**
- **Nguồn đối chiếu:** `feature-brief.md`, `design/00-design-plan.md` (xác nhận hiện trạng), dev reports BE/FE, QA report
- **Verdict: Approved** (không có finding)

## 1. Phạm vi review

Không có file nào thay đổi trong pipeline này cho F-041 (xác nhận: diff làm việc của pipeline chỉ chạm `NavigationChannelService.update/softDelete/getHistory` + FE list/types; các method `submit`/`approveC1`/`approveC2`/`rejectLevel1`/`rejectLevel2` giữ nguyên từ F-038 — chỉ đổi số dòng do thêm code phía trên cùng file). Review = xác nhận hiện trạng theo yêu cầu brief ("verify-only, KHÔNG sửa").

## 2. Đối chiếu spec — kết quả xác nhận

| Yêu cầu (AC/BR) | Kết quả xác nhận (source mở trong phiên) | Verdict |
|---|---|---|
| AC-041-01/02: submit → PENDING_APPROVAL (Cảng vụ) / APPROVED_LEVEL1 (Cục, Rule 14) | `InfrastructureApprovalService.submit` :50-95 — guard DRAFT/PROPOSED/REJECTED_LEVEL1/REJECTED_LEVEL2/REJECTED; `isDepartmentLevelUser` (OrgUnitRank.DEPARTMENT / level==1) → bỏ vòng 1 | **PASS** |
| AC-041-03/06: duyệt/trả về C1 → APPROVED_LEVEL1 / REJECTED_LEVEL1 + #52-#54 + history APPROVED/REJECTED LEVEL_1 | `approveC1` :99-143 — guard PENDING_APPROVAL/PROPOSED; ghi `approverLevel1`/`approvedDateLevel1`/`level1ApprovalContent`; history qua `recordHistory` | **PASS** |
| AC-041-04: reject thiếu lý do → chặn | `if (reason == null || reason.trim().isEmpty()) throw new IllegalArgumentException("Lý do từ chối là bắt buộc")` (C1 :117, C2 :176) | **PASS** |
| AC-041-05/07: 4-eyes — người tạo không tự duyệt; C2 ≠ C1 | `approveC1`: `createdBy.equals(userId)` chặn; `approveC2`: `approverLevel1.equals(userId)` chặn + `createdBy` chặn. Điều kiện tiên quyết: `createdBy` phải được populate — đã xác nhận `@EnableJpaAuditing` (KchtgApplication.java:13) + `AuditorAwareImpl` (config/AuditorAwareImpl.java:16) tồn tại | **PASS** |
| AC-041-08/09: duyệt/trả về C2 → APPROVED / REJECTED_LEVEL2 + #55-#57 + history LEVEL_2 | `approveC2` :152-201 — guard APPROVED_LEVEL1; ghi `approverLevel2`/`approvedDateLevel2`/`level2ApprovalContent`; history LEVEL_2 | **PASS** |
| AC-041-10: gửi lại sau reject → submit OK, timestamp refresh, reset approver | `submit`: cho phép REJECTED_LEVEL1/2; `setSubmittedAt(now)` luôn refresh; reset `approverLevel1/2` + `approvedDateLevel1/2`; `setRejectionReason(null)` | **PASS** |
| AC-041-11: người duyệt từ session; thiếu quyền → 403 | Controller `currentUserId(authentication)` (chỉ lấy từ principal, DTO `ApprovalRequest` không có field userId); `@PreAuthorize` `navigationchannel:approvec1/approvec2/update`; 9 permission `navigationchannel:*` seed đủ (PermissionSeeder.java:294-310) | **PASS** |
| History phê duyệt PROPOSED/APPROVED/REJECTED + approvalLevel | `recordHistory` :301-320; enum `ApprovalHistoryStatus` đủ; `InfrastructureApprovalServiceTest` 14/14 pass (surefire report hiện hữu) | **PASS** |
| Tương tác F-039: sửa reset DRAFT → submit lại được | BR-041-01: DRAFT ∈ tập cho phép submit — không cần đổi approval service | **PASS** |

## 3. Findings

Không có. Verify-only, không phát hiện lệch hành vi so với spec/design.

## 4. Verification đã chạy (tái lập trong phiên review)

| Lệnh | Kết quả |
|---|---|
| `mvn.cmd test "-Dtest=NavigationChannelServiceTest,NavigationChannelServiceLifecycleTest"` | **18/18 pass**, BUILD SUCCESS |
| `npx tsc --noEmit` (frontend/) | exit 0 |
| `target/surefire-reports/com.hanghai.kchtg.common.service.InfrastructureApprovalServiceTest.txt` | Tests run: 14, Failures: 0, Errors: 0 (đọc report hiện hữu) |

## 5. Pre-existing errors ngoài phạm vi (PMO đã verify)

`FlywayMigrationTest` ×2 (`buoy_station.code`) + `BeaconStationServiceTest$CreateTests` ×2 (beacon scope) — xác nhận trong `target/surefire-reports/*.txt`, KHÔNG chấm fail F-041.

## 6. Kết luận

**Approved.** State machine 2 cấp, Rule 14, 4-eyes (kèm điều kiện tiên quyết auditing đã xác nhận), lý do bắt buộc, người duyệt từ session, history phê duyệt — tất cả đáp ứng AC-041-01..11 theo source anchors + unit test; không có delta code trong wave này.
