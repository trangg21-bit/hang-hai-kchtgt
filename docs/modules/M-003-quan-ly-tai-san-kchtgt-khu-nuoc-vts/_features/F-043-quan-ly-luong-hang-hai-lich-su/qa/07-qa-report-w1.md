# QA Report — F-043 Lịch sử thay đổi Luồng hàng hải (M-003) — Wave 1

- **Feature:** F-043 (M-003) — Lịch sử thay đổi/phê duyệt Luồng hàng hải
- **Stage:** engineering-qa-engineer-wave-1
- **Ngày chạy:** 2026-08-26 09:41 (+07)
- **Nguồn kiểm chứng:** feature-brief.md, ba/00-lean-spec.md, design/00-design-plan.md (D1/D2/D3/D4, WO-F043-BE-1/FE-1), dev/05-dev-w1-history-navigation-channel.md, dev/05-fe-dev-w1-history-navigation-channel.md
- **Phạm vi:** Delta BE (ghi history `CREATED` khi tạo) + FE type fix `HistoryEntry.id: string`; sự kiện `UPDATED`/`DELETED` do F-039/F-040 ghi. Phía đọc `getHistory` giữ nguyên từ F-038 (design D3) — **QA phát hiện 2 AC đọc không được thỏa mãn, xem mục 3.**

## 1. Verification commands — output thực tế

| # | Lệnh | Kết quả | Exit |
|---|---|---|---|
| 1 | `C:\Users\trangtt1\scoop\apps\maven\current\bin\mvn.cmd test "-Dtest=NavigationChannelServiceTest,NavigationChannelServiceLifecycleTest"` (workdir: workspace root) | `Tests run: 16, Failures: 0, Errors: 0, Skipped: 0` — `NavigationChannelServiceLifecycleTest` 10/10, `NavigationChannelServiceTest` 6/6; `BUILD SUCCESS`, `Total time: 12.570 s` | 0 |
| 2 | `npx tsc --noEmit` (workdir: `frontend/`) | (no output) | 0 |
| 3 | `npx vite build` (workdir: `frontend/`) | `✓ 4044 modules transformed.` `✓ built in 1.10s`; warning chunk > 500 kB là cảnh báo có sẵn toàn repo | 0 |

## 2. Acceptance oracle — AC → test case → verdict

| AC-ID | Oracle | Kết quả thực tế | Verdict |
|---|---|---|---|
| AC-043-01 | Timeline đầy đủ: sự kiện theo thứ tự thời gian giảm dần (mới nhất trước) | **Ghi sự kiện:** tạo → `CREATED`/LEVEL_0 (`create` `:157-160`, test `create_recordsCreatedHistory` pass); sửa có thay đổi → `UPDATED`/LEVEL_0 + `changedField` (F-039 D3, test pass); xóa `APPROVED` → `DELETED`/LEVEL_0 (F-040 D2, test pass); submit → `PROPOSED`/LEVEL_0, duyệt C1/C2 → `APPROVED`/LEVEL_1/2, trả về → `REJECTED`/LEVEL_1/2 (`InfrastructureApprovalService.recordHistory`). **Đọc:** `getHistory` dùng `approvalHistoryRepo.findByRefTypeAndRefIdOrderByApprovedDateDesc` — order `approved_date DESC` do repository đảm bảo | **PASS** |
| AC-043-02 | Sự kiện reject có `reason` | Source: reject C1/C2 lưu lý do vào history (`recordHistory` reason param) + entity `rejectionReason`; `getHistory` map `reason(h.getReason())` | **PASS** (source-verified) |
| AC-043-03 | Hồ sơ chưa có sự kiện → `[]`, không lỗi | Source: `findByRefTypeAndRefIdOrderByApprovedDateDesc` trả danh sách rỗng → `getHistory` map → `[]` (HTTP 200) | **PASS** (source-verified) |
| AC-043-04 | Hồ sơ không tồn tại/đã xóa mềm → lỗi tiếng Việt "Không tìm thấy luồng hàng hải với id" (HTTP 400-family) | **KHÔNG được thực thi.** `getHistory` (`NavigationChannelService.java:526-550`) truy vấn thẳng `approval_history` theo `refType`+`refId` — **không** gọi `repo.findById` (không có existence check), **không** bị chặn bởi `@SQLRestriction("deleted_at IS NULL")` (filter chỉ áp dụng trên entity `NavigationChannel`, không áp dụng `ApprovalHistory`). Hành vi thực tế: id chưa từng tồn tại → `[]` (200); hồ sơ đã xóa mềm → trả toàn bộ lịch sử kể cả sự kiện DELETED (200). Design plan D3 nhận định "filter deleted_at IS NULL chặn" là **không đúng** cho query path này | **FAIL** |
| AC-043-05 | Thiếu `navigationchannel:history` → 403; UI không hiển thị timeline | Controller `GET /{id}/history` `@PreAuthorize("@auth.check(authentication, 'navigationchannel:history')")` (`NavigationChannelController.java:128-132`); seed `PermissionSeeder.java:310`; FE `HistoryTimeline` chỉ render trong detail (`NavigationChannelForm.tsx:771`) | **PASS** (source-verified) |
| AC-043-06 | Hồ sơ ngoài phạm vi đơn vị → không trả lịch sử (data scope, không rò rỉ) | **KHÔNG được thực thi.** `ApprovalHistory` (common/entity/ApprovalHistory.java:14-25) **không khai báo** `@Filter(name="orgUnitFilter")`/`recordSecurityLevelFilter`; `DataScopeAspect` chỉ bật filter trên session cho entity có khai báo — query history không bị org-unit scope. User có `navigationchannel:history` từ đơn vị A đọc được history (tên người duyệt, thời điểm, lý do) của hồ sơ đơn vị B nếu biết id. Vi phạm data scope convention MANDATORY (AGENTS.md) và BR-043-05/AC-043-06 | **FAIL** |

### Design deltas (SA chốt D1/D2/D3/D4)

| Delta | Oracle | Kết quả thực tế | Verdict |
|---|---|---|---|
| D1 enum đã đủ, không migration | Không mở rộng `ApprovalHistoryStatus` | `ApprovalHistoryStatus.java`: `CREATED(0)`, `PROPOSED(1)`, `APPROVED(3)`, `REJECTED(4)`, `UPDATED(5)`, `DELETED(6)` — đã tồn tại; không có file migration mới cho F-043 | **PASS** |
| D2-CREATED | Tạo → 1 dòng `CREATED`/LEVEL_0/`approvedBy`=userId/reason "Tạo mới luồng hàng hải"; tạo thất bại (write-scope) → không ghi | `create` `:157-160` ghi sau block retry + GIS, trước `return`; test `create_recordsCreatedHistory` + `create_outOfScope_skipsHistory` pass | **PASS** |
| D4 FE type fix | `HistoryEntry.id: number` → `string` | `types/navigationChannel.ts:231` `id: string`; tsc + build xanh; render path không dùng `id` | **PASS** |

## 3. Findings (F-043)

| # | Mức | Mô tả | Bằng chứng | Chủ sở hữu |
|---|---|---|---|---|
| F1 | **Cao (fail AC-043-04)** | GET `/{id}/history` không kiểm tra sự tồn tại/trạng thái xóa của hồ sơ: trả `[]` hoặc toàn bộ history thay vì lỗi "Không tìm thấy luồng hàng hải với id" 400-family | `NavigationChannelService.getHistory` (`:526-550`) query `approvalHistoryRepo.findByRefTypeAndRefIdOrderByApprovedDateDesc` — không có `findById`/`orElseThrow`; `ApprovalHistoryRepository.java:13`; `ApprovalHistory` không có `@SQLRestriction` | BE (sửa read path: thêm existence check — ví dụ load `NavigationChannel` qua `findById` trước khi trả history) |
| F2 | **Cao (fail AC-043-06)** | History không bị org-unit data scope: user bất kỳ có `navigationchannel:history` đọc được history hồ sơ ngoài phạm vi đơn vị của mình (rò rỉ tên người duyệt/thời điểm/lý do) | `ApprovalHistory.java:14-25` không khai `@Filter`; `DataScopeAspect` chỉ kích hoạt filter cho entity có khai báo; `ApprovalHistoryRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc` không join `navigation_channel` | BE/SA (chốt cơ chế scope: load hồ sơ trước theo `@DataScope` rồi mới đọc history, hoặc khai filter/join org_unit_id) |
| F3 | Thông tin | Cả 2 gap đều nằm ở read path có từ F-038, **không phải regression do delta wave này** (delta CREATED + type FE đúng và được test). Nhưng AC-043-04/06 là acceptance criteria của F-043 nên tính vào verdict feature | — | — |

## 4. Pre-existing errors ngoài phạm vi (PMO đã verify độc lập — QA xác nhận qua surefire report)

- `FlywayMigrationTest` ×2 — `V20260822130000__add_unaccent_port_buoy_search_indexes.sql:49` (`buoy_station.code` không tồn tại, SQLState 42703) — module buoy_station migration.
- `BeaconStationServiceTest$CreateTests` ×2 — `AccessDeniedException` tại `BeaconStationService.java:202` (module beacon, org-unit scope).
- Bằng chứng: surefire reports (xem F-039 QA report mục 4). **KHÔNG chấm fail F-043 vì các lỗi này.**

## 5. Coverage đã chạy / chưa chạy

- Đã chạy: 3 gate thực thi + rà soát source toàn bộ write path (CREATED/UPDATED/DELETED/PROPOSED/APPROVED/REJECTED) + read path (order DESC, map tên user, guard RBAC).
- Chưa chạy (giới hạn): GET `/{id}/history` end-to-end qua HTTP để chứng minh hành vi `[]`/history-trả-về (không thể chạy — Spring context fail do Flyway pre-existing); kết luận AC-043-04/06 dựa trên bằng chứng source trực tiếp (query path không có existence check/scope).

## 6. Verdict

**Changes-requested** — Delta wave này (CREATED + type FE) PASS; AC-043-01/02/03/05 PASS; **AC-043-04 và AC-043-06 FAIL** (read path history không có existence check và không bị org-unit data scope — bằng chứng source trực tiếp, pre-existing từ F-038 nhưng thuộc acceptance criteria F-043). Hành động tiếp theo: BE bổ sung existence check + cơ chế scope cho `getHistory` (giao SA chốt cơ chế), sau đó QA chạy lại.
