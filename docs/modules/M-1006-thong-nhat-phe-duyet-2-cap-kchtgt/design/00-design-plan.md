---
feature-id: M-1006
stage: design
agent: engineering-solution-designer
verdict: Ready
last-updated: 2026-08-21
source-of-truth: docs/modules/M-1006-thong-nhat-phe-duyet-2-cap-kchtgt/ba/00-lean-spec.md
---

# Thiết kế kỹ thuật: Cơ chế phê duyệt 2 cấp KCHT thống nhất (M-1006)

## 1. Tóm tắt (Summary)

Thiết kế này chốt **DP-1..DP-10** của BA lean-spec và đưa 5 cụm triển khai phê duyệt đang lệch nhau về **MỘT engine phê duyệt dùng chung**: mở rộng `ApprovalWorkflowService` (`port/service/shared/`) thành state machine 2 cấp thật (vòng 1 = Cảng vụ/Chi cục, vòng 2 = Cục; phân cấp theo đơn vị gửi — quy tắc 14; 4-eyes; reject bắt buộc lý do ≥ 10 ký tự; approval log + change log đầy đủ; soft-delete chỉ từ Lưu tạm). Toàn bộ 28 loại KCHT ủy quyền vào engine; hành vi chuẩn duy nhất là `docs/modules/M-1006-thong-nhat-phe-duyet-2-cap-kchtgt/sa/00-lean-architecture.md` (spec dùng chung) mà mọi feature-brief tham chiếu.

**Ngữ nghĩa canonical (chốt DP-1) — level-completed semantics:**
`APPROVED_LEVEL1` = "vòng 1 (Cảng vụ/Chi cục) **đã duyệt xong**, hồ sơ đang chờ vòng 2 (Cục)". `APPROVED_LEVEL2` **không được dùng** trong luồng thống nhất (giữ lại trong enum để ổn định ORDINAL + tương thích dữ liệu Berth cũ). Trạng thái chờ vòng 1 = `PENDING_APPROVAL`; chờ vòng 2 = `APPROVED_LEVEL1`. Ngữ nghĩa này khớp tên enum + 3/4 cụm 2 cấp hiện có (Buoy `APPROVED_L1`, CoastalStationVTS `APPROVED_LEVEL1`, GIS `APPROVED_L1`); chỉ Berth đọc ngược ("cấp đang chờ") — Berth là cụm bespoke đang bị thay thế, submit của Berth phải đổi (xem mục 8, 9).

## 2. Hiện trạng đã xác minh (Current state — mở file trong phiên này)

| # | Pattern | Anchor đã mở | Hành vi thực tế |
|---|---|---|---|
| 1 | 1 cấp dùng chung | `port/service/shared/ApprovalWorkflowService.java:43-68` (approve), `:82-112` (reject), `:122-124` (resetToPending) | Chỉ nhận `PENDING_APPROVAL` → `APPROVED`/`REJECTED`; không có L1/L2, không cap, không 4-eyes, không ghi log gửi. Reject set `REJECTED` tại `PortApprovalService.java:77`, `WaterZoneApprovalService.java:51`; cả 4 service (Port/Pier/WaterZone/DryPort) ủy quyền qua field inject `ApprovalWorkflowService` tại `PortApprovalService.java:38`, `WaterZoneApprovalService.java:30`, `PierApprovalService.java:30`, `DryPortApprovalService.java:31` |
| 2 | 2 cấp bespoke | `port/service/BerthApprovalService.java:36-65` | `cap=CANG_VU`: gate `APPROVED_LEVEL1` → `APPROVED_LEVEL2` (:40-44); `cap=CUC`: gate `APPROVED_LEVEL2` → `APPROVED` (:48-52); reject set `REJECTED` + cap tại `BerthApprovalService.java:69-82`. Submit set `APPROVED_LEVEL1` tại `BerthService.java:388` và `BerthService.java:593` — ngữ nghĩa "cấp đang chờ" |
| 3 | Beacon không nhất quán | `beacon/service/BeaconLightService.java:395-412` (approveL1: String "PENDING_APPROVAL" → setStatus("APPROVED") — nhảy thẳng hết 2 vòng); `beacon/service/BuoyService.java:574-585` (approveL1 "PENDING_APPROVAL"→"APPROVED_L1"), `:603-613` (approveL2 "APPROVED_L1"→"PUBLISHED"), `:641-651` (reject→"REJECTED") | Cùng cụm 2 hành vi khác nhau; status dùng **String** thay vì `ApprovalStatus` |
| 4 | Station 1 cổng + userId cứng | `station/service/CoastalStationVTSService.java:144-201` (approveStation(id, boolean, Long userId); 4-eyes :149; level-walk theo `approvalLevel.ordinal()` :158-170; reject :184-185 **reset về PROPOSED/PENDING_APPROVAL** — không có trạng thái bị trả về); `:203-227` rejectStation (reason ≥ 10 ký tự, reset về chờ). Controller cứng `userId = 1L` + TODO Wave 2: `CoastalStationVTSController.java:80-82,91-93`; `CoastalStationLRITController.java:96,105`; `CoastalStationInmarsatController.java:89,98`; `CoastalStationHaiphongController.java:87,96`; `CoastalStationCospasSarsatController.java:89,98` | 1 cổng approveStation không phân biệt vòng; userId không lấy từ security context; reject không tạo trạng thái "bị trả về" |
| 5 | 2 cấp tham chiếu (GIS) | `gis/point/service/PointObjectService.java:136-146` (approveL1 gate `Status.PENDING_APPROVAL` → `APPROVED_L1`), `:164-173` (approveL2 → `PUBLISHED`); `gis/line/service/LineObjectService.java:146-155,174-183` giống hệt | Đúng 2 cấp (level-completed) nhưng dùng enum nội bộ của module (`PointObject.ApprovalStatus`, `Status`) thay vì `common/entity/ApprovalStatus` |

**Enum / entity dùng chung (đã xác minh):**
- `common/entity/ApprovalStatus.java`: `DRAFT(0), PROPOSED(1), PENDING_APPROVAL(2), APPROVED_LEVEL1(3), APPROVED_LEVEL2(4), APPROVED(5), REJECTED(6)`; `fromString` map alias legacy (`PORT_AUTHORITY`/`CHO_PD_CAP_CUC`→PENDING_APPROVAL, `APPROVED_L1`→APPROVED_LEVEL1, `PUBLISHED`→APPROVED, `TU_CHOI`→REJECTED, `NHAP`→DRAFT). Lưu DB dạng số nguyên (`@Enumerated(ORDINAL)` — AGENTS.md).
- `common/enums/ApprovalLevel.java`: `LEVEL_0(0), LEVEL_1(1), LEVEL_2(2)` — bộ ghi nhận cấp đã xử lý, không phải trạng thái workflow.
- `port/entity/ApprovalLog.java`: bảng `approval_logs`, INSERT-only, có sẵn cột `entityType, entityId, decision, reason, decidedBy, decidedAt, cap` — **`cap` đã tồn tại** (discriminator cho DP-3).
- `port/entity/ChangeLog.java`: bảng `change_logs` với `entityType, entityId, fieldName, oldValue, newValue, changedBy, changedAt` — mẫu change log chung cho DP-8.
- `orgunit/entity/OrgUnit.java:47` (class), `:106` (`private Integer level`), `:125` (root `level=0`). **Cây đơn vị (M001DataSeeder.java:69-91): root = "Cục Hàng hải và Đường thủy Việt Nam" `level=1`, Cảng vụ `level=2`** — khớp mã cũ `AUTH_ORG_ORG_LEVEL_1_CODE = "G17.43"` (Cục = level 1). Độ sâu tối đa 3 (`OrganizationService.java:440-455`).
- `config/PermissionSeeder.java:46` (run), `:60` (Map definitions), `:63+` `seedPermission(definitions, resource, action, name, description)` — mẫu đăng ký permission `<resource>:<action>`.
- Migration cao nhất hiện có: `V120__ensure_vts_system_enum_storage.sql` → migration kế tiếp là **V121**.

## 3. Quyết định thiết kế — DP-1..DP-10 (SA chốt)

| DP | Chốt | Lý do / bằng chứng |
|---|---|---|
| **DP-1** | **Phương án A — level-completed semantics** (xem mục 1): `PENDING_APPROVAL` = chờ vòng 1; `APPROVED_LEVEL1` = vòng 1 xong, chờ vòng 2; `APPROVED_LEVEL2` = **không dùng** trong luồng thống nhất (giữ enum cho ORDINAL + dữ liệu cũ); `APPROVED` = đã duyệt; `REJECTED_LEVEL1`/`REJECTED_LEVEL2` = bị trả về vòng 1/vòng 2 (DP-3 — user-confirmed split) | Khớp tên enum + 3 cụm 2 cấp hiện có (Buoy/GIS/VTS) + mọi đường submit hiện có đều set PENDING_APPROVAL. Chỉ Berth đọc ngược — Berth bị thay thế bởi engine nên không giữ ngữ nghĩa cũ. Hệ quả bắt buộc: `BerthService.java:388,593` đổi submit sang engine (mục 8, 9) |
| **DP-2** | Thêm `ARCHIVED(7)` **cuối enum** `ApprovalStatus` + map `fromString("ARCHIVED"/"DA_XOA")` → ARCHIVED | Thêm cuối = không đổi ordinal giá trị cũ → an toàn `@Enumerated(ORDINAL)`, **không cần DDL**. Đóng tập 7 trạng thái (AC-25) |
| **DP-3** | **Tách `REJECTED` (user-confirmed):** `REJECTED` → `REJECTED_LEVEL1` (vòng 1 trả về) + `REJECTED_LEVEL2` (vòng 2 trả về) — thay thế giá trị REJECTED đơn; **ordinal chính xác chốt khi implement** (không xung đột `ARCHIVED(7)`); migration ánh xạ dữ liệu cũ theo `approval_logs.cap` | Bỏ phương án discriminator `cap`-only: đọc-side phải lateral join/window mỗi hàng (chi phí) + mơ hồ khi một hồ sơ bị trả về nhiều lần ở 2 vòng khác nhau |
| **DP-4** | "Người gửi thuộc cấp Cục" ⇔ **`orgUnit.level == 1` của đơn vị người gửi** — **level-based, không hardcode mã đơn vị (user-confirmed)** (root "Cục Hàng hải và Đường thủy Việt Nam" = level 1, đã xác minh M001DataSeeder.java:69-91; khớp G17.43 cũ) | Trường `level` có sẵn + index (`OrgUnit.java:39`). Bỏ phương án match theo code/type (dễ vỡ khi đổi mã). Engine nhận `senderOrgUnitLevel` tại thời điểm submit và ghi vào approval log (spec 6.1) |
| **DP-5** | `ApprovalStatus` (cột ORDINAL) là **nguồn sự thật duy nhất** của workflow; String status (Buoy `"APPROVED_L1"/"PUBLISHED"`, `StationStatus`) trở thành enum **hiển thị suy ra** từ ApprovalStatus trong response mapper — không ghi độc lập | Loại drift 2 cột; các alias trong `fromString` đã sẵn sàng cho việc đọc dữ liệu cũ |
| **DP-6** | Lý do từ chối: **trim, không rỗng, ≥ 10 ký tự** — message "Lý do từ chối phải có ít nhất 10 ký tự" | Khớp chuẩn đang có: `CoastalStationVTSService.java:211-214`, `BuoyStationService.java:495-499`; VR-003 |
| **DP-7** | Quy tắc 6 kiểm soát ở mức **state machine + change log**: từ `REJECTED_LEVEL1`/`REJECTED_LEVEL2` chỉ đi tiếp bằng `engine.saveAndSubmit(...)` — (a) lưu bản sửa, (b) ghi 1 dòng change log, (c) `REJECTED_LEVEL1|LEVEL2 → PENDING_APPROVAL`. `submit()` trần từ trạng thái bị trả về bị chặn (N11). **Không** enforce diff nội dung | Diff dễ false-positive (đổi thứ tự/format); dòng change log là bằng chứng "đã sửa" đúng mức "tối thiểu" BA đề xuất |
| **DP-8** | **1 cơ chế change log chung**: dùng `ChangeLog` (`change_logs`) cho mọi thực thể KCHT — engine ghi before-image trên saveAndSubmit / saveAndApprove / softDelete; `BeaconHistoryService`/`StationHistoryService` giữ bảng lịch sử UI riêng nhưng **không** còn là nguồn ghi nhận workflow | 1 bảng = truy vết thống nhất, đúng mẫu BA; giữ module history chỉ cho timeline hiển thị |
| **DP-9** | **Không dùng `PROPOSED`** trong luồng thống nhất (user-confirmed): tạo = `DRAFT`, submit = `PENDING_APPROVAL` (hoặc `APPROVED_LEVEL1` nếu người gửi cấp Cục). `PROPOSED` giữ nguyên giá trị enum cho dữ liệu legacy; engine coi `PROPOSED` như DRAFT-equivalent ở thao tác sửa đầu tiên | Tránh đổi ordinal; AC-02/04/05/06 viết theo tên trạng thái nghiệp vụ nên không đổi |
| **DP-10** | **1 resource dùng chung `kcht`** với 9 action: `kcht:create, kcht:update, kcht:delete, kcht:submit, kcht:approve_level1, kcht:approve_level2, kcht:reject, kcht:view, kcht:view_sensitive` (ma trận vai trò × thao tác theo spec §8) | Quy tắc 8: quyền theo chức vụ không theo loại; 28× permissions là quá mức. Các permission cũ (`buoystation:approve*`, `data:approve*`, ...) giữ seed để không phá gán quyền nhóm hiện có — endpoint mới dùng `kcht:*` |

## 4. Thiết kế cơ chế dùng chung (Shared approval engine)

### 4.1. Engine — mở rộng `port/service/shared/ApprovalWorkflowService.java` (giữ tên class)

Lớp này đã tự khai báo "single source of truth for approval state-machine logic" và đã được 4 approval service port inject — mở rộng tại chỗ là thay đổi nhỏ nhất, không tạo seam mới. (Phương án thay thế — class mới ở package trung lập `common/` — bị bác: tạo seam mới + chạm import của 5 file thêm; ghi ở Trade-off record.)

**API đề xuất (contract mới của engine):**

```java
// Submit: quyết định số vòng tại thời điểm gửi (spec 6.1, BR-003/014)
ApprovalStatus submit(String currentStatus, String entityType, String entityId,
                      String submittedBy, Integer senderOrgUnitLevel);
// senderOrgUnitLevel == 1 (Cục)  -> PENDING_APPROVAL --> APPROVED_LEVEL1 (bỏ vòng 1)
// senderOrgUnitLevel != 1        -> PENDING_APPROVAL
// Ghi approval log SUBMIT (actor + thời điểm); cap trong log do engine tính từ
// senderOrgUnitLevel — không từ request (MF-06).

// Vòng 1 (Cảng vụ / Chi cục) — BR-004/005/008/015/016/020
ApprovalStatus approveLevel1(String currentStatus, String entityType, String entityId,
                             String decidedBy, String submittedBy);
ApprovalStatus rejectLevel1(String currentStatus, String entityType, String entityId,
                            String decidedBy, String submittedBy, String reason);

// Vòng 2 (Cục)
ApprovalStatus approveLevel2(String currentStatus, String entityType, String entityId,
                             String decidedBy, String submittedBy);
ApprovalStatus rejectLevel2(String currentStatus, String entityType, String entityId,
                            String decidedBy, String submittedBy, String reason);

// Quy tắc 6 (T10/T11): bắt buộc sửa rồi gửi lại — caller đã lưu bản sửa + ghi change log trước
ApprovalStatus saveAndSubmit(String currentStatus, String entityType, String entityId,
                             String operatorId, Integer senderOrgUnitLevel);

// UC-8 / T12: Lưu và phê duyệt hồ sơ Đã duyệt — caller ghi before-image vào change_logs trước
ApprovalStatus saveAndApprove(String currentStatus, String entityType, String entityId,
                              String operatorId);

// T13: soft-delete chỉ từ DRAFT (BR-017) -> ARCHIVED
ApprovalStatus softDelete(String currentStatus, String entityType, String entityId,
                          String deletedBy);

// T14: dữ liệu tích hợp lưu thẳng Đã duyệt (BR-009) — không ghi log user
ApprovalStatus directApprove(String entityType, String entityId, String systemActor);
```

**Vòng duyệt là đầu ra của state machine, không phải đầu vào (MF-02/A7):** `approveLevel1/approveLevel2/rejectLevel1/rejectLevel2` **không nhận tham số `cap`** — engine suy ra vòng từ trạng thái hiện tại của entity: `PENDING_APPROVAL` → vòng 1, `APPROVED_LEVEL1` → vòng 2. `cap` (CANG_VU|CUC) chỉ xuất hiện trong approval log do engine ghi — không bao giờ lấy từ request body.

**Nội quy chung của mọi method:**
1. Parse + gate trạng thái (bảng mục 5) — sai trạng thái → `IllegalStateException` (422) + message tiếng Việt có dấu, **không ghi log thừa** (idempotent, NFR Reliability).
2. 4-eyes (BR-015, MF-05): `decidedBy.equals(submittedBy)` → chặn **ở cả 2 vòng**, message "Bạn không thể phê duyệt bản do chính mình gửi"; Berth bắt buộc ủy quyền qua engine (không giữ 4-eyes riêng).
3. Reject: reason sau trim ≥ 10 ký tự **ở cả 2 vòng** (BR-016, DP-6, MF-09) → message "Lý do từ chối phải có ít nhất 10 ký tự".
4. Ghi `ApprovalLog` INSERT-only: `entityType, entityId, decision (APPROVED|REJECTED|SUBMIT), reason, decidedBy, decidedAt, cap (CANG_VU|CUC)` (BR-007/020, MF-07 — xem 4.4). Submit cũng ghi 1 bản (quy tắc 7).
5. Trả status mới; per-type service set lên entity + save (engine không sở hữu repository entity — giữ kiến trúc hiện tại: engine nhận trạng thái chuỗi).
6. **Scope-check trước mọi transition (MF-06):** caller xác nhận `entity.orgUnitId ∈ OrgUnitScopeService.Scope.allows(actor)` trước khi gọi bất kỳ method transition nào; `senderOrgUnitLevel` tính từ org unit của **principal** (security context) tại thời điểm submit — không từ request.

**Lưu ý triển khai:** các method hiện có `approve/reject/resetToPending` giữ nguyên (deprecate) để không phá luồng đang chạy trong lúc di trú; **cuối wave bắt buộc xóa toàn bộ caller còn lại của 3 method cũ (MF-09)**.

### 4.2. Phân cấp theo đơn vị gửi (quy tắc 14 / BR-003 / BR-014 / DP-4)

- Tại submit, per-type service lấy đơn vị của **người gửi** từ security context (userId → UserService/UserGroupService → orgUnitId → `OrgUnit.level`) và truyền `senderOrgUnitLevel` vào `engine.submit(...)` — **bắt buộc từ principal, không từ request (MF-06)**.
- `senderOrgUnitLevel == 1` (Cục) → hồ sơ về **`APPROVED_LEVEL1`** ("Chờ Cục duyệt") — bỏ vòng 1, không bao giờ đi qua `PENDING_APPROVAL` (AC-03). Ngược lại → `PENDING_APPROVAL` (AC-02).
- Số vòng quyết định **tại thời điểm gửi** và ghi vào approval log (spec 6.1).

### 4.3. 4-eyes (BR-015) và reject-reason (BR-016)

- 4-eyes nằm **trong engine** (mọi method duyệt/từ chối) — thay cho bản sao đang có ở từng service (`CoastalStationVTSService.java:149`); per-type service truyền `submittedBy` = người tạo/gửi hồ sơ (lấy từ `createdBy`/`submittedForApprovalBy` của entity).
- Reject-reason trong engine — bỏ bản sao ở `CoastalStationVTSService.java:211-214`, `BuoyStationService.java:495-499`, `ApprovalWorkflowService.reject`.

### 4.4. Nhật ký đầy đủ (BR-007/011/020, spec 6.2, DP-8)

- **Approval log** (`approval_logs`): engine ghi mọi submit/approve/reject — INSERT-only, cấm UPDATE/DELETE (AC-20). **DB-layer enforcement (MF-07):** migration thêm trigger `BEFORE UPDATE OR DELETE ON approval_logs` → `RAISE EXCEPTION` (hoặc `REVOKE UPDATE/DELETE`); repository chỉ lộ read + insert.
- **Change log** (`change_logs`, mẫu `ChangeLog`): per-type service ghi before-image trước khi lưu bản sửa trong `saveAndSubmit`, `saveAndApprove`, `softDelete` (DP-8). "Lưu và phê duyệt" (T12) bắt buộc ghi bản cũ trước khi cập nhật.
- Audit params (`operatorId/deletedBy/updatedBy`) truyền đầy đủ theo AGENTS.md.

### 4.5. Soft-delete (BR-017, T13, N04)

- Chỉ hợp lệ từ `DRAFT`; engine chuyển `DRAFT → ARCHIVED`; entity set `deletedAt + deletedBy` (per-type service); bản ghi giữ trong DB, loại khỏi truy vấn danh sách thường, không gửi/duyệt/sửa được (BR-019). Ghi 1 bản nhật ký DELETE (change log).

### 4.6. Khóa sửa khi đang chờ (BR-019, N09)

- Per-type service kiểm tra trạng thái trước khi cho sửa: `PENDING_APPROVAL`/`APPROVED_LEVEL1` → chặn (chỉ đọc); `ARCHIVED` → chặn mọi thao tác; `REJECTED_LEVEL1`/`REJECTED_LEVEL2` → chỉ `saveAndSubmit`; `APPROVED` → chỉ `saveAndApprove` (T12).

## 5. Bảng chuyển trạng thái — triển khai (mỗi dòng = 1 test case, khớp spec mục 4)

| TT | Từ | Hành động (engine method) | Sang | Guard / ghi chú |
|---|---|---|---|---|
| T01 | (mới) | create → `DRAFT` | Lưu tạm | `kcht:create`; gán orgUnitId (VR-001/005) |
| T02 | (mới) | `submit(..., senderLevel != 1)` | `PENDING_APPROVAL` | ghi log SUBMIT cap CANG_VU |
| T03 | (mới) | `submit(..., senderLevel == 1)` | `APPROVED_LEVEL1` | ghi log SUBMIT cap CUC (quy tắc 14) |
| T04 | `DRAFT` | `submit(senderLevel != 1)` | `PENDING_APPROVAL` | như T02 |
| T05 | `DRAFT` | `submit(senderLevel == 1)` | `APPROVED_LEVEL1` | như T03 |
| T06 | `PENDING_APPROVAL` | `approveLevel1` | `APPROVED_LEVEL1` | gate PENDING_APPROVAL; log APPROVED cap CANG_VU |
| T07 | `PENDING_APPROVAL` | `rejectLevel1(reason)` | `REJECTED_LEVEL1` | reason ≥ 10; log REJECTED cap CANG_VU |
| T08 | `APPROVED_LEVEL1` | `approveLevel2` | `APPROVED` | gate APPROVED_LEVEL1; log APPROVED cap CUC |
| T09 | `APPROVED_LEVEL1` | `rejectLevel2(reason)` | `REJECTED_LEVEL2` | log REJECTED cap CUC |
| T10 | `REJECTED_LEVEL1` | `saveAndSubmit(senderLevel != 1)` | `PENDING_APPROVAL` | change log bắt buộc (DP-7); log SUBMIT |
| T11 | `REJECTED_LEVEL2` | `saveAndSubmit(senderLevel != 1)` | `PENDING_APPROVAL` | **luôn về vòng 1** (AC-14, user-confirmed); change log bắt buộc |
| T12 | `APPROVED` | `saveAndApprove` | `APPROVED` | before-image vào change_logs; không duyệt lại (BR-018) |
| T13 | `DRAFT` | `softDelete` | `ARCHIVED` | set deletedAt/deletedBy; log DELETE |
| T14 | (bất kỳ) | `directApprove` | `APPROVED` | chỉ kênh tích hợp (BR-009); không log user |

**Ca cấm (implement thành guard chặn trước gate):**

| TT | Từ | Hành động cấm | Guard trong | Message (tiếng Việt) |
|---|---|---|---|---|
| N01 | `PENDING_APPROVAL` | `approveLevel2` (nhảy vòng) | `approveLevel2` gate | "Hồ sơ chưa qua duyệt cấp Cảng vụ/Chi cục" |
| N02 | `APPROVED_LEVEL1` | `approveLevel1`/`rejectLevel1` (duyệt ngược) | `approveLevel1`/`rejectLevel1` gate | "Hồ sơ đã qua vòng 1, không thể duyệt ngược" |
| N03 | `DRAFT` | submit thiếu trường bắt buộc | per-type DTO validate (VR-002) | "Chưa điền đủ thông tin bắt buộc" |
| N04 | ≠ `DRAFT` | `softDelete` | `softDelete` gate | "Chỉ có thể xóa hồ sơ ở trạng thái Lưu tạm" |
| N05/N06 | chờ (2 vòng) | tự duyệt (4-eyes) | engine (decidedBy == submittedBy) | "Bạn không thể phê duyệt bản do chính mình gửi" |
| N07/N08 | chờ (2 vòng) | reject thiếu lý do | engine reject-reason | "Lý do từ chối là bắt buộc" / "Lý do từ chối phải có ít nhất 10 ký tự" |
| N09 | chờ (2 vòng) | sửa nội dung | per-type update guard (BR-019) | "Hồ sơ đang chờ phê duyệt, không thể sửa" |
| N10 | `APPROVED` | `submit` lại | `submit` gate (chỉ `saveAndApprove`) | "Hồ sơ đã duyệt, chỉ được sửa bằng 'Lưu và phê duyệt'" |
| N11 | `REJECTED_LEVEL1`/`REJECTED_LEVEL2` | `submit` trần (không sửa) | `submit` gate (chỉ `saveAndSubmit`) | "Hồ sơ bị trả về phải sửa rồi gửi lại" |

## 6. Ánh xạ Acceptance Criteria (QA oracle — spec §11)

| AC | Thiết kế đáp ứng | Oracle kiểm chứng |
|---|---|---|
| AC-01 | create → `DRAFT`; orgUnitId bắt buộc | entity `DRAFT`, không có log; chỉ scope đơn vị X thấy |
| AC-02 | `submit(senderLevel != 1)` | status `PENDING_APPROVAL`; 1 log SUBMIT |
| AC-03 | `submit(senderLevel == 1)` | status `APPROVED_LEVEL1`; không đi qua `PENDING_APPROVAL` |
| AC-04 | DTO validate trước submit | 4xx, status không đổi, không log |
| AC-05 | `approveLevel1` + `kcht:approve_level1` + 4-eyes | status `APPROVED_LEVEL1`; log APPROVED cap CANG_VU |
| AC-06 | `rejectLevel1(reason ≥ 10)` | status `REJECTED_LEVEL1`; reason lưu; log REJECTED cap CANG_VU |
| AC-07 | `approveLevel2` + `kcht:approve_level2` | status `APPROVED`; log APPROVED cap CUC |
| AC-08 | `rejectLevel2(reason)` | status `REJECTED_LEVEL2`; log REJECTED cap CUC |
| AC-09 | engine reject-reason | 4xx "Lý do từ chối là bắt buộc", không log |
| AC-10/11 | engine 4-eyes | 403/422 "Bạn không thể phê duyệt bản do chính mình gửi" |
| AC-12 | N01 guard | chặn, status không đổi |
| AC-13 | N02 guard | chặn, status không đổi |
| AC-14 | `saveAndSubmit` → luôn `PENDING_APPROVAL` + change log | status về vòng 1; change_logs có bản sửa |
| AC-15 | `saveAndApprove` | status giữ `APPROVED`; change_logs có bản cũ |
| AC-16 | `softDelete` | `ARCHIVED` + deletedAt; không hiển thị; log DELETE |
| AC-17 | N04 guard | chặn, message VR-009 |
| AC-18 | `directApprove` | `APPROVED` thẳng, không log user |
| AC-19 | 21 file cùng ủy quyền 1 engine | chạy AC-01..17 trên từng loại cho hành vi đồng nhất |
| AC-20 | approval log INSERT-only; change log đủ actor/time | DB constraint/không có UPDATE/DELETE path |
| AC-21 | `@PreAuthorize kcht:approve_level1/2, kcht:reject` | 403, status không đổi |
| AC-22 | `kcht:view_sensitive` (Admin Cục) | response thêm người tạo/sửa cuối/thời gian |
| AC-23 | `OrgUnitScopeService.allows(...)` chiều GHI | chặn, không ghi |
| AC-24 | `@DataScope` + `orgUnitFilter` | danh sách theo đơn vị + subtree |
| AC-25 | Luôn thuộc đúng 1 trong 7 trạng thái nghiệp vụ; ánh xạ enum: DRAFT, PENDING_APPROVAL, APPROVED_LEVEL1, APPROVED, REJECTED_LEVEL1, REJECTED_LEVEL2, ARCHIVED (+ PROPOSED/APPROVED_LEVEL2 legacy không dùng) | không giá trị khác |

## 7. Phân quyền — kế hoạch PermissionSeeder (DP-10)

Trong `config/PermissionSeeder.java:run()` (sau nhóm port/beacon hiện có), thêm 9 dòng `seedPermission(definitions, "kcht", "<action>", "<tên VN>", "<mô tả VN>")`:

| Resource:action | Tên hiển thị (tiếng Việt) |
|---|---|
| `kcht:create` | Tạo mới / Lưu tạm hồ sơ KCHT |
| `kcht:update` | Cập nhật hồ sơ KCHT |
| `kcht:delete` | Xóa hồ sơ KCHT (chỉ Lưu tạm) |
| `kcht:submit` | Gửi duyệt hồ sơ KCHT |
| `kcht:approve_level1` | Phê duyệt vòng 1 (Cảng vụ / Chi cục) |
| `kcht:approve_level2` | Phê duyệt vòng 2 (Cục) |
| `kcht:reject` | Từ chối hồ sơ KCHT |
| `kcht:view` | Xem hồ sơ KCHT (theo phạm vi đơn vị) |
| `kcht:view_sensitive` | Xem thông tin nhạy cảm (Admin Cục) |

- 21 file đổi `@PreAuthorize` sang `kcht:*` (controller: `@auth.check(authentication, 'kcht:approve_level1')`...) — **bắt buộc trên MỌI endpoint phê duyệt của cả 21 file (MF-03)**.
- Permission cũ (`buoystation:approve*`, `data:approve*`, `beacon:approve*`...) **giữ nguyên seed** (không xóa — tránh phá gán quyền nhóm hiện có); đánh dấu deprecate ở lần dọn sau.
- Không gán vào role — cây quyền tự nhận permission mới sau seed (AGENTS.md).

## 8. Kế hoạch migration (chỉ khi enum/giá trị dữ liệu đổi)

1. **`ApprovalStatus` thêm `ARCHIVED(7)` (user-confirmed)** — thêm cuối enum: **không đổi ordinal**, không DDL → **không cần file Flyway** cho bản thân enum. Kèm map `fromString` cho `"ARCHIVED"`/`"DA_XOA"`, `"REJECTED_LEVEL1"`/`"REJECTED_L1"`, `"REJECTED_LEVEL2"`/`"REJECTED_L2"` (`TU_CHOI` → `REJECTED_LEVEL1` mặc định khi thiếu level).
2. **Backfill dữ liệu Berth (bắt buộc — ngữ nghĩa đổi chiều, DP-1):** hồ sơ Berth đang `APPROVED_LEVEL1` theo nghĩa cũ ("chờ Cảng vụ") sẽ bị engine đọc thành "chờ Cục" → sai luồng. Migration dữ liệu đề xuất **`V121__normalize_berth_approval_status.sql`** (implementer xác nhận kiểu `entity_id` của `approval_logs` trước khi chạy):
   ```sql
   -- Berth đang APPROVED_LEVEL1 (3) mà CHƯA có quyết định APPROVED cap=CANG_VU
   -- => thực chất đang chờ vòng 1 => chuyển về PENDING_APPROVAL (2)
   UPDATE berths b
   SET approval_status = 2
   WHERE b.approval_status = 3
     AND NOT EXISTS (
       SELECT 1 FROM approval_logs l
       WHERE l.entity_type = 'Berth' AND l.entity_id = b.id::text
         AND l.decision = 'APPROVED' AND l.cap = 'CANG_VU'
     );
   ```
   (Bảng `berths`, cột `approval_status` — xác minh tại `port/entity/Berth.java:28,76-78`; cột `cap` — `ApprovalLog.java`; migration mới nhất hiện có là V120 nên file kế tiếp là V121.)
3. **Tách `REJECTED` (user-confirmed, DP-3):** migration ánh xạ dữ liệu `REJECTED` hiện có theo `approval_logs.cap` mới nhất — cap `CANG_VU` → `REJECTED_LEVEL1`, cap `CUC` → `REJECTED_LEVEL2` (bản ghi không có log REJECTED → mặc định `REJECTED_LEVEL1`); `REJECTED_LEVEL1/LEVEL2` thay thế giá trị `REJECTED` đơn — **ordinal chính xác chốt khi implement, không xung đột `ARCHIVED(7)`**.
4. **`APPROVED_LEVEL2` (user-confirmed):** legacy, **không dùng** trong luồng thống nhất — **không migration**.
5. **`PROPOSED` legacy:** không cần migration — engine coi `PROPOSED` như DRAFT-equivalent ở thao tác sửa đầu tiên (DP-9).
6. **Trạng thái bị trả về** nay nằm trong enum entity (`REJECTED_LEVEL1`/`REJECTED_LEVEL2`) — không cần cột discriminator hay lateral join khi đọc.

## 9. Work-order decomposition — 2 cluster (write-scope rời nhau, không file nào ở cả 2)

**Integration point duy nhất giữa 2 cluster:** (a) enum `common/entity/ApprovalStatus.java` (thêm ARCHIVED — **Cluster A sở hữu**), (b) spec dùng chung `docs/modules/M-1006-thong-nhat-phe-duyet-2-cap-kchtgt/sa/00-lean-architecture.md` + `ba/00-lean-spec.md` (mục 3-6). Cluster B **chỉ đọc** contract từ spec/enum, không sửa enum.

**Quy tắc chung cho cả 2 cluster:** mọi thay đổi giữ `orgUnitId` + `@Filter(orgUnitFilter)` + controller `@DataScope` (AGENTS.md Data Scope Convention); identifier tiếng Anh, message tiếng Việt có dấu; enum `@Enumerated(ORDINAL)`; DTO Lombok `@Getter/@Setter`; approval log INSERT-only.

### Yêu cầu bảo mật bắt buộc (MF-01..MF-09 — từ security audit, hard requirements cho cả 2 cluster)

| MF | Yêu cầu | Acceptance (QA trace) |
|---|---|---|
| MF-01 | Bỏ hardcode `userId = 1L` ở 5 controller CoastalStation (VTS/LRIT/Inmarsat/Haiphong/CospasSarsat) — actor từ SecurityContext/JWT | Endpoint duyệt/từ chối ghi đúng actor thật; không còn literal `1L` trong controller |
| MF-02 | Vòng duyệt từ trạng thái entity (A7): `PENDING_APPROVAL` → vòng 1, `APPROVED_LEVEL1` → vòng 2; không nhận `cap` từ request | Gửi `cap` giả trong request → bị bỏ qua, vòng vẫn do state quyết định |
| MF-03 | Seed đủ 9 permission `kcht:*` trong `config/PermissionSeeder.java` + `@PreAuthorize` trên mọi endpoint phê duyệt (21 file) | Thiếu quyền → 403, status không đổi; cây quyền hiển thị 9 permission mới |
| MF-04 | Engine gate N01/N02 (không nhảy vòng / không duyệt ngược); reject vòng 2 yêu cầu quyền `kcht:approve_level2` | AC-12/AC-13 + reject vòng 2 với user chỉ có `kcht:reject` → 403 |
| MF-05 | 4-eyes trong engine cả 2 vòng (`decidedBy != submittedBy`/`createdBy`); Berth ủy quyền qua engine | AC-10/AC-11; Berth tự duyệt → 422, không ghi log |
| MF-06 | `senderOrgUnitLevel` tính từ org unit của principal tại submit (SUBMIT log kèm cap do engine tính); chiều GHI `OrgUnitScopeService.allows(...)`; scope-check `entity.orgUnitId ∈ scope(actor)` trước mọi transition | AC-02/03/23; submit/gửi với unit ngoài phạm vi → chặn |
| MF-07 | `approval_logs` INSERT-only ở DB layer (trigger `BEFORE UPDATE/DELETE` hoặc REVOKE); repository chỉ read + insert | UPDATE/DELETE trực tiếp bảng → DB chặn (AC-20) |
| MF-08 | `@Version` optimistic lock trên entity KCHT di trú; gate + update trong 1 transaction | 2 request duyệt đồng thời → 1 thành công, 1 `OptimisticLockException`, không double-transition. *Lưu ý: thêm `@Version` là thay đổi trên entity — ngoài 21 file; cần orchestrator xếp vào wave entity/migration hoặc mở rộng write-scope* |
| MF-09 | Engine enforce reject reason trim ≥ 10 ký tự cả 2 vòng — áp dụng cho từng mức trả về `REJECTED_LEVEL1`/`REJECTED_LEVEL2`; cuối wave xóa caller của `approve/reject/resetToPending` cũ | AC-09; không còn call-site legacy |

### Cluster A — "Shared engine + port family" (6 file pattern + 2 integration-point file)

| # | File | Việc phải làm |
|---|---|---|
| A1 | `src/main/java/com/hanghai/kchtg/common/entity/ApprovalStatus.java` *(integration point)* | Thêm `ARCHIVED(7)` cuối enum + map `fromString` ("ARCHIVED"/"DA_XOA"); **không** đổi ordinal cũ |
| A2 | `src/main/java/com/hanghai/kchtg/port/service/shared/ApprovalWorkflowService.java` | Mở rộng thành engine 2 cấp: thêm `submit/approveLevel1/rejectLevel1/approveLevel2/rejectLevel2/saveAndSubmit/saveAndApprove/softDelete/directApprove` (mục 4.1) + guards N01-N11 + 4-eyes + reject-reason + ghi ApprovalLog (cap CANG_VU/CUC); giữ `approve/reject/resetToPending` (deprecate) |
| A3 | `src/main/java/com/hanghai/kchtg/port/service/PortApprovalService.java` | Ủy quyền toàn bộ sang engine (submit/L1/L2/reject) |
| A4 | `src/main/java/com/hanghai/kchtg/port/service/PierApprovalService.java` | như A3 |
| A5 | `src/main/java/com/hanghai/kchtg/port/service/WaterZoneApprovalService.java` | như A3 |
| A6 | `src/main/java/com/hanghai/kchtg/port/service/DryPortApprovalService.java` | như A3 |
| A7 | `src/main/java/com/hanghai/kchtg/port/service/BerthApprovalService.java` | Bỏ gate bespoke `:40-56`; **vòng duyệt xác định server-side từ trạng thái entity** — `PENDING_APPROVAL` → vòng 1, `APPROVED_LEVEL1` → vòng 2; **không nhận `cap` từ request (MF-02/A7)**; `cap` chỉ là đầu ra engine ghi vào log; ủy quyền qua engine (MF-05); reject → engine |
| A8 | `src/main/java/com/hanghai/kchtg/port/service/BerthService.java` *(call-site redirect — nằm ngoài 21 file)* | Đổi `:388` và `:593`: `setApprovalStatus(APPROVED_LEVEL1)` → gọi `engine.submit(...)` (kết quả `PENDING_APPROVAL` hoặc `APPROVED_LEVEL1` theo sender level) |

**Oracle Cluster A:** `mvn -DskipTests compile` xanh; Port/Pier/WaterZone/DryPort/Berth chạy đủ AC-01..AC-17 qua endpoint; Berth submit tạo `PENDING_APPROVAL` (không còn `APPROVED_LEVEL1`); thỏa MF-02/A7 (vòng từ state, không từ request), MF-05 (Berth qua engine), MF-07 (trigger DB), MF-08 (@Version), MF-09 (xóa caller legacy).

### Cluster B — "Beacon + station + GIS family" (15 file)

| # | File | Việc phải làm |
|---|---|---|
| B1 | `src/main/java/com/hanghai/kchtg/beacon/service/BeaconLightService.java` | `approveL1` (:395-412) → engine `approveLevel1`; **thêm** `approveL2`; bỏ nhảy thẳng `setStatus("APPROVED")`; status String → `ApprovalStatus` (DP-5); reject → engine |
| B2 | `src/main/java/com/hanghai/kchtg/beacon/service/BuoyService.java` | String status ("APPROVED_L1"/"PUBLISHED") → `ApprovalStatus`; `approveL1/L2/reject` (:574-651) → engine; PUBLISHED chỉ còn là alias hiển thị |
| B3 | `src/main/java/com/hanghai/kchtg/station/service/CoastalStationVTSService.java` | Thay `approveStation(id, boolean, Long userId)` (:144-201) bằng `approveL1/approveL2/reject` qua engine; reject tạo `REJECTED_LEVEL1`/`REJECTED_LEVEL2` theo vòng (không reset về PROPOSED :184-185); `submittedBy` = creator (giữ logic 4-eyes :149 qua engine) |
| B4 | `src/main/java/com/hanghai/kchtg/station/service/CoastalStationLRITService.java` | như B3 |
| B5 | `src/main/java/com/hanghai/kchtg/station/service/CoastalStationInmarsatService.java` | như B3 |
| B6 | `src/main/java/com/hanghai/kchtg/station/service/CoastalStationHaiphongService.java` | như B3 |
| B7 | `src/main/java/com/hanghai/kchtg/station/service/CoastalStationCospasSarsatService.java` | như B3 |
| B8 | `src/main/java/com/hanghai/kchtg/gis/point/service/PointObjectService.java` | Bỏ enum nội bộ (`PointObject.ApprovalStatus`, `Status`); dùng `common/entity/ApprovalStatus`; approveL1/L2 → engine; giữ sync GIS sau L2 |
| B9 | `src/main/java/com/hanghai/kchtg/gis/line/service/LineObjectService.java` | như B8 |
| B10 | `src/main/java/com/hanghai/kchtg/gis/polygon/service/PolygonObjectService.java` | như B8 |
| B11 | `src/main/java/com/hanghai/kchtg/station/controller/CoastalStationVTSController.java` | Bỏ `userId = 1L` + TODO Wave 2 (:80-82,91-93) → actor từ SecurityContext (MF-01); endpoint tách `/approve-l1`, `/approve-l2`, `/reject`; `@PreAuthorize` `kcht:approve_level1/approve_level2/reject` (MF-03) |
| B12 | `src/main/java/com/hanghai/kchtg/station/controller/CoastalStationLRITController.java` | như B11 (bỏ `1L` :96,105) |
| B13 | `src/main/java/com/hanghai/kchtg/station/controller/CoastalStationInmarsatController.java` | như B11 (bỏ `1L` :89,98) |
| B14 | `src/main/java/com/hanghai/kchtg/station/controller/CoastalStationHaiphongController.java` | như B11 (bỏ `1L` :87,96) |
| B15 | `src/main/java/com/hanghai/kchtg/station/controller/CoastalStationCospasSarsatController.java` | như B11 (bỏ `1L` :89,98) |

**Oracle Cluster B:** `mvn -DskipTests compile` xanh; beacon/station/GIS chạy AC-01..AC-25; endpoint station không còn tham số userId 1L (actor từ JWT); reject tạo trạng thái "Bị trả về" hiển thị đúng cap; thỏa MF-01 (bỏ `userId = 1L`, actor từ SecurityContext), MF-03 (@PreAuthorize `kcht:*` mọi endpoint), MF-04 (reject vòng 2 cần `kcht:approve_level2`), MF-06 (scope-check trước transition).

> **Giải thích con số 21:** 16 file service (A2-A7 + B1-B10) + 5 controller station (B11-B15) = **21 file**, 2 cluster rời nhau. `ApprovalStatus.java` (A1) và `BerthService.java` (A8) là 2 file integration-point/call-site bổ sung thuộc write-scope Cluster A — được liệt kê tường minh ở trên, không tính vào 21. `BuoyStationService.java`/`BuoyStationController.java` **ngoài phạm vi** module này (đã có approveL1/L2 đúng hình thái level-completed) — ghi nhận 2 khuyết tật cho wave sau: (1) `BuoyStationService.approveL2` (:475) set `APPROVED_LEVEL1` thay vì `APPROVED`; (2) `BuoyStationController` nhận `approverId` qua `@RequestParam` (:123,:134) — client tự khai người duyệt, phải chuyển sang security context + `kcht:*`.

## 10. Trade-off record

| Quyết định | Chọn | Bác | Lý do |
|---|---|---|---|
| Engine | Mở rộng `ApprovalWorkflowService` tại chỗ | Class mới ở `common/` | Đã là seam "shared" + 4 service đang inject; class mới = thêm seam + chạm import 5 file; chi phí di trú tăng không đáng |
| Ngữ nghĩa enum (DP-1) | Level-completed (Phương án A) | Level-pending (khớp Berth) | Đa số 2-cấp hiện có + tên enum; Berth là cụm bị thay |
| 2 trạng thái trả về (DP-3) | **Tách `REJECTED_LEVEL1`/`REJECTED_LEVEL2` (user-confirmed)** | Discriminator `cap`-only trên approval_logs | Trạng thái bị trả về nằm ngay trong enum entity (không lateral join khi đọc, không mơ hồ khi bị trả về nhiều lần); ordinal chốt khi implement, không xung đột `ARCHIVED(7)` |
| Cấp Cục (DP-4) | `orgUnit.level == 1` | Match code/type | level đã có sẵn + index; code dễ đổi |
| Quy tắc 6 (DP-7) | State machine + change log | Diff nội dung | Diff false-positive; change log đủ bằng chứng "đã sửa" |
| Change log (DP-8) | 1 bảng chung `change_logs` | Giữ riêng từng module | Truy vết thống nhất; module history giữ cho UI |
| Resource phân quyền (DP-10) | `kcht` chung | `kcht.<type>` (28×) | Quy tắc 8: theo chức vụ không theo loại |

## 11. Ngoài phạm vi / follow-up

- `BuoyStationService`/`BuoyStationController`: 2 khuyết tật nêu ở mục 9 — wave sau (không thuộc 21 file).
- Frontend (28 màn) đổi nhãn trạng thái sang tên nghiệp vụ tiếng Việt + tab lọc (NFR UX) — wave frontend riêng.
- Dashboard tổng hợp (ngoại lệ data scope đã chốt) — không đổi.
- Không sửa `ba/00-lean-spec.md`, `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`, `_state.md`, `module-brief.md` (ràng buộc out-of-scope).

## 12. References

| Tài liệu | Vai trò |
|---|---|
| `docs/modules/M-1006-.../ba/00-lean-spec.md` | Nguồn sự thật: 7 trạng thái, T01-T14/N01-N11, BR-001..020, AC-01..25, DP-1..10 |
| `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (root) | Tài liệu nghiệp vụ gốc (nguồn của lean-spec) |
| `docs/modules/M-1006-thong-nhat-phe-duyet-2-cap-kchtgt/sa/00-lean-architecture.md` | **Spec dùng chung** — mọi feature-brief 28 loại tham chiếu phần phê duyệt |
| Các anchor code liệt kê mục 2 | Hiện trạng đã xác minh trong phiên này |
| `AGENTS.md` | Conventions: PermissionSeeder, Data Scope, enum ORDINAL, naming EN/VN |
