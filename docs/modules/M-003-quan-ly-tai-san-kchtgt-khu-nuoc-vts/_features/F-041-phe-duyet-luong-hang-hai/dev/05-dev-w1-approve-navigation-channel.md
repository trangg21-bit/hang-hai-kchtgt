# Dev Report BE — F-041 Phê duyệt 2 cấp Luồng hàng hải (kiểm chứng — không sửa)

- **Feature:** F-041 (M-003) — Phê duyệt 2 cấp Luồng hàng hải
- **Stage:** engineering-backend-developer-wave-1
- **Ngày:** 2026-08-26
- **Design plan:** `_features/F-041-phe-duyet-luong-hang-hai/design/00-design-plan.md` (xác nhận hiện trạng — **không có delta BE**)

## Kết luận

**Backend đã implement từ F-038 (commit ed400cf7) — phiên này chỉ kiểm chứng, KHÔNG sửa file nào thuộc F-041.** Toàn bộ state machine submit/duyệt/trả về C1-C2, Rule 14, 4-eyes, lý do bắt buộc, history phê duyệt chạy qua `InfrastructureApprovalService` dùng chung — đúng design plan F-041 mục 2-3.

## Anchor kiểm chứng (đã mở trong phiên này)

| Hạng mục | Anchor |
|---|---|
| Endpoint submit | `NavigationChannelController.java:75-83` — `POST /{id}/submit-approval`, guard `navigationchannel:update` |
| Endpoint duyệt/trả về C1 | `NavigationChannelController.java:84-92` (`POST /{id}/approve/c1` guard `navigationchannel:approvec1`); `:105-114` (`POST /{id}/reject-level-1` cùng guard) |
| Endpoint duyệt/trả về C2 | `NavigationChannelController.java:94-103` (`POST /{id}/approve/c2` guard `navigationchannel:approvec2`); `:116-124` (`POST /{id}/reject-level-2`) |
| Người duyệt từ session | `NavigationChannelController.java:157-163` (`currentUserId`) |
| Service submit → `InfrastructureApprovalService.submit` (Rule 14) | `NavigationChannelService.java:466-472` |
| Service approveC1/approveC2 | `NavigationChannelService.java:474-493` |
| Service rejectLevel1/rejectLevel2 (luôn REJECTED ở level tương ứng) | `NavigationChannelService.java:495-513` |
| History phê duyệt PROPOSED/APPROVED/REJECTED + approvalLevel | `InfrastructureApprovalService` (không sửa — chỉ đọc tham chiếu; đã đọc `recordHistory` vùng `:301-320` theo design plan) |
| Data scope | `NavigationChannelController.java:25` `@DataScope` class-level |

## Thay đổi

**Không có.** Không sửa `InfrastructureApprovalService`, `ApprovalStatus`, endpoint, permission, `NavigationChannelService` (các method submit/approve/reject giữ nguyên từ F-038; anchor nêu trên là vị trí hiện tại sau khi F-039/F-040 thêm dòng trong cùng file).

## Kết quả verify (output thực tế)

**`mvn -DskipTests compile`** (Maven 3.9.16, `C:\Users\trangtt1\scoop\apps\maven\current\bin\mvn.cmd`, workdir workspace root):

```
[INFO] Compiling 1104 source files with javac [debug parameters release 17] to target\classes
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  21.978 s
```
Exit code: 0.

**`mvn test`**:

```
[ERROR] Tests run: 989, Failures: 0, Errors: 4, Skipped: 0
```
- Toàn bộ test liên quan navigationchannel pass: `NavigationChannelServiceLifecycleTest` 10/10, `NavigationChannelServiceTest` 6/6 (surefire reports `target/surefire-reports/`).
- 4 errors thuộc 2 class **pre-existing, ngoài phạm vi**: (1) `FlywayMigrationTest` ×2 — migration `V20260822130000:49` (`buoy_station.code` không tồn tại), đã ghi nhận tại `NavigationChannelServiceTest.java:26-27` từ F-038; (2) `BeaconStationServiceTest$CreateTests` ×2 — `AccessDeniedException` tại `BeaconStationService.java:202` (module beacon, org-unit scope) — không liên quan F-041/navigationchannel. Cùng con số 989/0/4 ở cả 2 lần chạy (09:08 và 09:16).

## Ghi chú

- Integration test chuỗi submit→C1→C2 (WO-F041-BE-V1) không thể chạy trong workspace hiện tại vì context bootstrap fail do Flyway pre-existing — thuộc về QA/verifier, cần migration fix trước (xem gotcha `flyway-v20260822130000-breaks-context`).
