---
feature-id: M-1006
stage: design
agent: utility-security-auditor
verdict: Pass
last-updated: 2026-08-21
---

# Threat Model — Quy trình phê duyệt 2 cấp KCHT thống nhất (M-1006)

## 1. Phạm vi đánh giá (Review scope)

| Miền bảo mật | Đánh giá | Ghi chú |
|---|---|---|
| Authentication / Identity binding | ✅ | Nguy cơ actor giả mạo (userId cứng `1L`, cap/approverId do client khai) |
| Authorization (RBAC/permission) | ✅ | Bộ permission `kcht:*` mới, `@PreAuthorize`, quyền theo chức vụ (quy tắc 8) |
| Data protection (data scope) | ✅ | orgUnitId + `orgUnitFilter` + `@DataScope`; phạm vi trên approve/reject/history |
| Input validation | ✅ | entityType whitelist, UUID, reject-reason ≥ 10 ký tự |
| Audit / non-repudiation | ✅ | `approval_logs` INSERT-only, `change_logs`, chống sửa/xóa log |
| Business-rule integrity | ✅ | 4-eyes (BR-015), không nhảy vòng (quy tắc 4/N01-N02), phân cấp theo đơn vị gửi (quy tắc 14) |
| Compliance | ✅ | Xem mục 5 |

**Bề mặt tấn công (threat surface):** endpoint duyệt/từ chối/gửi của 28 loại KCHT (hiện đang tách rời ở 5+ pattern), engine dùng chung `ApprovalWorkflowService`, bảng `approval_logs`/`change_logs`, cây đơn vị (OrgUnit.level — đầu vào của quyết định phân cấp), kênh tích hợp ngoài (lưu thẳng Đã duyệt — T14).

**Cơ sở:** `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (quy tắc 1-14), `ba/00-lean-spec.md` (BR-001..020, AC-01..25, N01-N11), `design/00-design-plan.md` (DP-1..10, engine API, work orders A1-A8/B1-B15), `sa/00-lean-architecture.md` (spec chung). Code xác minh trực tiếp trong phiên này — danh sách anchor ở mục 8.

## 2. Tài sản (Assets) & Trust boundaries

| Tài sản | Tính bảo mật cần | Mô tả |
|---|---|---|
| Hồ sơ KCHT (28 loại) | Toàn vẹn (trạng thái duyệt), bảo mật (phạm vi đơn vị), sẵn sàng | Trạng thái `ApprovalStatus` là nguồn sự thật duy nhất (DP-5) |
| Quyết định phê duyệt | Non-repudiation | Chỉ hồ sơ Đã duyệt vào báo cáo tổng hợp (quy tắc 12) — quyết định có giá trị pháp lý quản lý |
| `approval_logs` / `change_logs` | Toàn vẹn, bất biến | Bằng chứng "ai duyệt, lúc nào, lý do gì" (quy tắc 7, 11) |
| Danh tính + quyền người dùng | Xác thực, ủy quyền | Mô hình permission động (`User.getAllPermissions()` — `user/entity/User.java:129`), không còn Role |
| Cây đơn vị (`OrgUnit.level`) | Toàn vẹn | `level==1` (Cục) là đầu vào quyết định bỏ qua vòng 1 (DP-4) — nếu sai nguồn dữ liệu → lạm dụng phân cấp |

**Trust boundaries (4) và data path đã trace:**

- **B1 — Browser ↔ API (HTTPS/JWT):** `create → DRAFT` (kcht:create), `submit` (kcht:submit) với `senderOrgUnitLevel` lấy từ **principal** → `PENDING_APPROVAL` hoặc `APPROVED_LEVEL1`. Yêu cầu: actor từ SecurityContext, không nhận userId/cap từ request, DTO validate (N03).
- **B2 — API ↔ Engine (`ApprovalWorkflowService`):** `approveLevel1/rejectLevel1/approveLevel2/rejectLevel2/saveAndSubmit/saveAndApprove/softDelete/directApprove`. Yêu cầu: `@PreAuthorize kcht:*` ở controller; engine gate trạng thái (N01/N02/N10/N11) + 4-eyes (decidedBy ≠ submittedBy) + reject-reason ≥ 10 ký tự; ghi `ApprovalLog` (cap CANG_VU/CUC) trong cùng transaction.
- **B3 — Engine/Service ↔ DB:** `orgUnitFilter` (`common/entity/BaseEntity.java:34-38`) do `DataScopeAspect` bật (`security/aspect/DataScopeAspect.java:145-146`); chiều GHI validate `OrgUnitScopeService.allows(...)` (`orgunit/service/OrgUnitScopeService.java:97`); `approval_logs` INSERT-only; khóa lạc quan chống chuyển trạng thái đồng thời; migration V121 backfill Berth.
- **B4 — Kênh tích hợp ngoài ↔ API (T14):** `directApprove` lưu thẳng Đã duyệt, chỉ qua kênh tích hợp có xác thực riêng, không tạo log user, không gọi được từ endpoint UI.

## 3. Phát hiện STRIDE (Security findings)

| ID | Domain | Finding | Severity | Evidence (file:line — xác minh phiên này) | Remediation |
|---|---|---|---|---|---|
| T-01 | Spoofing / Identity | **Actor phê duyệt cứng `userId = 1L`** ở cả 5 controller CoastalStation — mọi caller của `/approve` `/reject` hành động dưới danh tính user 1 (admin), làm giả mạo người duyệt + đầu độc audit log | **Critical** | `station/controller/CoastalStationVTSController.java:81,92`; `CoastalStationLRITController.java:96,105`; `CoastalStationInmarsatController.java:89,98`; `CoastalStationHaiphongController.java:87,96`; `CoastalStationCospasSarsatController.java:89,98` (đều `1L`); `CoastalStationVTSService.java:144,172` (`setApprovedBy(String.valueOf(userId))`) | Thiết kế B11-B15: bỏ `1L`, actor = principal từ JWT (SecurityContext); test bằng 2 tài khoản phân biệt (AC-10/11) |
| T-02 | Escalation | **Cấp duyệt do client khai (`cap` từ request)** — Berth hiện cho `request.getCap()` chọn thẳng vòng CUC; design A7 *giữ nguyên* ánh xạ "cap từ request → approveLevel2" → bất kỳ ai có quyền duyệt đều duyệt được vòng 2 | **High** | `port/controller/BerthController.java:120-121,130-131` (`request.getCap()`), `@PreAuthorize('berth:approve')` dùng chung 2 vòng; `port/service/BerthApprovalService.java:40-56` (gate theo cap); design-plan §9 A7 | Engine xác định vòng **từ trạng thái entity** (PENDING_APPROVAL→L1, APPROVED_LEVEL1→L2), KHÔNG từ client; xóa tham số cap khỏi DTO endpoint thống nhất |
| T-03 | Authorization | **Thiếu seed permission `kcht:*` + thiếu `@PreAuthorize` trên endpoint duyệt hiện tại** — nếu không seed đủ 9 quyền → 403 mọi user (AGENTS.md) hoặc vẫn chạy theo quyền cũ lỏng lẻo (`berth:approve` gộp 2 vòng); station approve/reject hiện **không có** method-level authorization | **High** | `config/PermissionSeeder.java:46,63+` — grep `"kcht"` = 0 match; `station/controller/CoastalStationVTSController.java:20-30,75,86` — không có `@PreAuthorize`; `BerthController.java:118-131` | Seed đủ 9 dòng `seedPermission(definitions,"kcht",...)` (design §7); `@PreAuthorize`/`@auth.check` trên MỌI endpoint duyệt của 21 file; quyền cũ không gate endpoint mới (deprecate, không re-wire) |
| T-04 | Escalation | **Người duyệt vòng 1 hành động ở vòng 2 / nhảy vòng** — chỉ chặn được khi có ĐỦ 2 lớp: (a) `@PreAuthorize kcht:approve_level2` và (b) engine gate N01 (approveLevel2 chỉ nhận APPROVED_LEVEL1); thiếu 1 lớp → duyệt thẳng/duyệt ngược (N01/N02) | **High** | design-plan §4.1/§5 N01-N02; `port/service/shared/ApprovalWorkflowService.java:43-66` (hiện chỉ nhận PENDING_APPROVAL→APPROVED, không phân vòng) | Bắt buộc đủ 2 lớp (AC-12/13); gate nằm trong cùng transaction với load entity (chống TOCTOU) |
| T-05 | 4-eyes bypass | **Berth path hiện KHÔNG có 4-eyes** (người tạo tự duyệt được, nếu có `berth:approve`); station có 4-eyes nhưng so sánh qua `String.valueOf(userId)` vs `creatorId` — nguồn id không chuẩn hóa; engine mới phải so trên **cùng canonical id (UUID string)** ở cả 2 vòng | **High** | `port/service/BerthApprovalService.java:36-82` (không có check creator); `station/service/CoastalStationVTSService.java:149` (`creatorId.equals(String.valueOf(userId))`) | 4-eyes nằm trong engine (design §4.3), `submittedBy` = `createdBy`/`submittedForApprovalBy` của entity, so canonical; AC-10/11 trên mọi loại |
| T-06 | Delegation abuse (quy tắc 14) | **`senderOrgUnitLevel` phải lấy từ đơn vị của PRINCIPAL, không từ request và không từ orgUnitId của hồ sơ** — nếu lấy từ hồ sơ, user cấp dưới có thể gán `orgUnitId` thuộc Cục (khi chiều GHI không validate scope) để **bỏ qua vòng 1** | **High** | design-plan §4.2 (sender level từ security context — đúng hướng); `orgunit/service/OrgUnitScopeService.java:33,65,97`; BR-003/014, AC-03/23 | Bắt buộc: (a) sender level từ principal tại thời điểm submit, ghi vào SUBMIT log; (b) chiều GHI `OrgUnitScopeService.allows(...)` trên create/update (AC-23); (c) test âm: user cấp Cảng vụ không thể skip vòng 1 |
| T-07 | Delegation ambiguity | **`saveAndSubmit` cho sender cấp Cục (senderLevel==1) chưa được định nghĩa** — design T11 chỉ xử lý `senderLevel != 1 → PENDING_APPROVAL`; theo quy tắc 14 + note mục 7 của tài liệu gốc, "Gửi duyệt" của người gửi cấp Cục luôn vào thẳng Chờ Cục duyệt, trong khi AC-14 ghi "luôn về vòng 1" → mâu thuẫn cần chốt, nếu không Cục gửi lại sau khi bị Cục trả về sẽ vào sai vòng | **Medium** | design-plan §5 T10/T11 (chỉ `senderLevel != 1`); `ba/00-lean-spec.md` AC-14 + BR-014; QUY-TRINH mục 7 note phân cấp | SA chốt 1 luật duy nhất (đề xuất: re-derive theo sender level như submit — Cục → APPROVED_LEVEL1); thêm test case TC tương ứng |
| T-08 | Data-scope leakage | **Approve/reject/history chưa được yêu cầu kiểm tra phạm vi đơn vị** — (a) `getAllHistory` của Berth đọc toàn bộ change log không filter scope; (b) engine nhận entityId nhưng chưa có yêu cầu xác minh `entity.orgUnitId ∈ scope(actor)` trước khi chuyển trạng thái → IDOR xuyên đơn vị; (c) `approval_logs` không có cột orgUnit → phải scope qua join entity | **High** | `port/service/BerthApprovalService.java:100-120` (`getAllHistory` đọc tất cả); `port/controller/BerthController.java:139-144` (history); `port/entity/ApprovalLog.java` (không cột org); AC-23/24 | Bắt buộc: mọi transition (approve/reject/submit/saveAndSubmit) verify `entity.orgUnitId ∈ scope(actor)` trước khi gọi engine; history/log endpoints gắn `@DataScope` hoặc filter tường minh; test IDOR chéo đơn vị |
| T-09 | Audit tampering | **INSERT-only chỉ là quy ước code, chưa enforce ở tầng DB** — `ApprovalLog` có `@Setter`, repository kế thừa `JpaRepository` (có sẵn `delete/deleteAll`), không trigger/revoke; `decidedBy` phải gắn principal | **High** | `port/entity/ApprovalLog.java` (comment "INSERT-only" nhưng `@Setter` + `created_at updatable=false`); `port/repository/ApprovalLogRepository.java:18` (`extends JpaRepository`); AC-20 | Bắt buộc: trigger `BEFORE UPDATE/DELETE` trên `approval_logs` (hoặc revoke quyền app user), repository chỉ read+insert, không có `save(existing)` path; AC-20 kiểm tra ở DB |
| T-10 | Skip-round / Replay | **Không có khóa lạc quan cho chuyển trạng thái** — 2 approver duyệt đồng thời cùng đọc PENDING_APPROVAL → cả 2 ghi APPROVED_LEVEL1/APPROVED (last-write-wins, 2 log APPROVED) → phá 4-eyes/toàn vẹn quyết định | **High** | `port/service/shared/ApprovalWorkflowService.java:42-66` (`@Transactional` nhưng không `@Version`/lock); entity port chưa xác minh `@Version` | Engine + per-type service: `@Version` (hoặc pessimistic lock) trên entity; gate+update trong 1 transaction; test concurrency (2 request song song → 1 thành công) |
| T-11 | Reject-reason bypass | **Engine hiện chỉ check `isBlank`** (không ≥ 10 ký tự); engine mới phải enforce trim + ≥ 10 ở cả 2 vòng; phương thức cũ `approve/reject/resetToPending` còn sống trong thời gian di trú → caller có thể đi đường cũ bỏ qua guard | **High** | `port/service/shared/ApprovalWorkflowService.java:97-99` (`reason.isBlank()`); BR-016/DP-6; AC-09; design §4.1 "giữ deprecate" | Engine mới enforce `reason.trim().length() >= 10`; xóa method cũ khi kết thúc wave (closure criteria); test N07/N08 |
| T-12 | Escalation | **`kcht:reject` là quyền đơn cho cả 2 vòng — chưa định nghĩa thẩm quyền vòng khi reject** — nếu chỉ có kcht:reject, người vòng 1 có thể reject hồ sơ ở vòng 2 (trạng thái APPROVED_LEVEL1); cần: vòng xác định từ state, reject vòng N phải có cùng thẩm quyền chức vụ như approve vòng N (kcht:approve_levelN) | **High** | `ba/00-lean-spec.md:192` (`kcht:reject` — "server xác định vòng theo đơn vị/chức vụ"); design §7 | Chốt rule: rejectLevel2 yêu cầu actor có `kcht:approve_level2` (Cục) hoặc tách `kcht:reject_level1/2`; test: user vòng 1 reject ở vòng 2 → bị chặn |
| T-13 | Input validation | **`entityType` là String tự do vào `approval_logs`** — phải là whitelist đóng 28 loại (chống log injection / ghi log dưới entityType khác); `entityId` phải là UUID hợp lệ; reason giới hạn độ dài | **Medium** | `port/entity/ApprovalLog.java` (`entityType` length 50, không enum); design §4.1 (engine nhận `entityType` string) | Engine nhận entityType từ hằng số đóng (enum/constants 28 loại), validate UUID, reason ≤ 2000 ký tự |
| T-14 | Trust boundary B4 | **`directApprove` (T14) phải chỉ gọi được từ kênh tích hợp có xác thực riêng** — nếu lộ qua endpoint user thì bất kỳ user nào có quyền cũng lưu thẳng Đã duyệt, phá toàn bộ quy trình | **Medium** | QUY-TRINH mục 7 (hàng "Dữ liệu tích hợp lưu thẳng"); BR-009; AC-18; design §4.1 `directApprove` | Kênh tích hợp dùng service-credential/mTLS riêng; `directApprove` không nằm trong controller user; test AC-18 (UI không tái hiện được) |
| T-15 | Data protection | **`kcht:view_sensitive` (Admin Cục)** — lọc trường nhạy cảm (người tạo/sửa cuối, thời gian) phải tập trung ở response mapper, không rò rỉ qua endpoint history/log | **Low** | AC-22; `ba/00-lean-spec.md:194` | Response mapper dùng chung; test: user thường không thấy trường nhạy cảm kể cả qua history |
| T-16 | Interim exposure | **Trong thời gian di trú, các đường phê duyệt cũ (1-level `approve/reject`, station không `@PreAuthorize`, `AdminAutoApproval` bypass SoD) vẫn sống** — cửa sổ rủi ro; `AdminAutoApproval` cho ROLE_SYSTEM_ADMIN clear cả 2 vòng trong 1 bước là trade-off có chủ đích (docstring) nhưng không được phép rò rỉ xuống quyền thường | **Medium** | `security/AdminAutoApproval.java` (ADMIN_AUTHORITIES sys-admin); `station/service/CoastalStationVTSService.java:154-162` (nhánh auto-approve); design §4.1 "giữ deprecate... xóa cuối wave" | Closure criteria: cuối wave xóa method cũ + nhánh auto-approve theo engine; giữ AdminAutoApproval chỉ cho ROLE_SYSTEM_ADMIN và không reachable qua `kcht:approve_level1` path |

## 4. Yêu cầu kiểm soát bảo mật (Security-control requirements — implementer MUST satisfy)

| # | Yêu cầu | Cơ chế thiết kế | Ánh xạ permission/rule |
|---|---|---|---|
| R-01 | Actor phê duyệt/gửi/từ chối LUÔN từ SecurityContext (JWT subject) — cấm userId/cap/approverId từ request | Engine nhận `decidedBy`/`submittedBy` từ principal; controller bỏ tham số client | kcht:submit / approve_level1 / approve_level2 / reject (T-01, T-02) |
| R-02 | Vòng duyệt xác định từ trạng thái entity + thẩm quyền chức vụ, không từ client | Engine gate N01/N02; controller `@PreAuthorize kcht:approve_level1|2`; reject vòng N đòi thẩm quyền vòng N | Quy tắc 4, 8; BR-004/008 (T-04, T-12) |
| R-03 | 4-eyes ở cả 2 vòng, so trên canonical id | Engine: `decidedBy.equals(submittedBy)` → chặn "Bạn không thể phê duyệt bản do chính mình gửi" | BR-015; AC-10/11 (T-05) |
| R-04 | Phân cấp quy tắc 14: sender level từ đơn vị PRINCIPAL tại submit, ghi vào SUBMIT log; chốt luật re-submit cho sender Cục | `orgUnit.level == 1` (DP-4); `saveAndSubmit` re-derive theo sender | BR-003/014; AC-03/14 (T-06, T-07) |
| R-05 | Data scope: mọi transition + mọi read (list, history, log) đều trong phạm vi đơn vị | `@DataScope` + `orgUnitFilter`; `OrgUnitScopeService.allows` chiều GHI; scope check entity trước engine; log read join entity | BR-001; AC-23/24 (T-08) |
| R-06 | Audit bất biến: `approval_logs`/`change_logs` INSERT-only ở DB | Trigger/revoke UPDATE-DELETE; repository read+insert; actor + decidedAt server-set | Quy tắc 7, 11; BR-007/020; AC-20 (T-09) |
| R-07 | Chống skip-round/replay: gate + update trong 1 transaction, khóa lạc quan | `@Version`/pessimistic lock trên entity; N01/N02/N10/N11 | Quy tắc 4; BR-004/006 (T-10) |
| R-08 | Reject-reason: trim, không rỗng, ≥ 10 ký tự, cả 2 vòng; không đi đường cũ | Engine reject guard (DP-6); xóa method legacy cuối wave | BR-016; AC-09; N07/N08 (T-11) |
| R-09 | Seed đủ 9 permission `kcht:*` + `@PreAuthorize` mọi endpoint duyệt | `seedPermission(definitions,"kcht","<action>",...)` trong `PermissionSeeder.run()` | DP-10; AC-21 (T-03) |
| R-10 | T14 `directApprove` chỉ qua kênh tích hợp xác thực riêng, không log user | Service-credential/mTLS; không nằm trong controller user | BR-009; AC-18 (T-14) |
| R-11 | Input đóng: entityType whitelist 28 loại, entityId UUID, reason ≤ 2000 | Validate ở engine + DTO | BR-010 (T-13) |
| R-12 | `kcht:view_sensitive` tập trung ở response mapper; không rò rỉ qua history | Mapper chung | AC-22 (T-15) |

## 5. Compliance considerations

| Standard | Requirement | Status | Gap |
|---|---|---|---|
| Luật An toàn thông tin mạng 2015 (86/2015/QH13) — kiểm soát truy cập, ghi nhật ký, bảo vệ dữ liệu | Phân quyền chi tiết + audit trail | Thiết kế đáp ứng một phần | INSERT-only chưa enforce ở DB (R-06); actor cần từ principal (R-01) |
| Nghị định 85/2016/NĐ-CP — bảo đảm ATTT theo cấp độ | Phân loại cấp độ, biện pháp kỹ thuật tương ứng | Chưa xác định cấp độ hệ thống | Cần xác định cấp độ (3/4) trước khi vận hành; kiểm thử an toàn theo cấp độ |
| Governance nội bộ: 4-eyes / SoD (chống tự duyệt, tách nhiệm vụ duyệt-gửi) | Không ai tự duyệt bản mình gửi, cả 2 vòng | Thiết kế có (engine) | Berth path hiện không có (T-05); AdminAutoApproval bypass có chủ đích — chỉ sys-admin (T-16) |
| Audit & non-repudiation (ISO 27001 A.12.4 / kiểm toán nội bộ) | Nhật ký bất biến, đủ actor + thời điểm | Thiết kế INSERT-only | Cần trigger DB + test AC-20 ở DB (T-09) |

## 6. Must-fix items (chặn gate — implementer phải thỏa mãn)

| ID | Finding | Owner (theo design work-order) | Expected evidence | Closure criteria |
|---|---|---|---|---|
| MF-01 | T-01: actor cứng `1L` (Critical) | Cluster B — B11..B15 | grep toàn repo: 0 match `userId = 1L`/`1L` trong controller station; approve/reject đọc principal | AC-10/11 chạy với 2 tài khoản riêng; audit log ghi đúng decidedBy |
| MF-02 | T-02: cap do client khai chọn vòng (High) | Cluster A — A2/A7 + controller | Endpoint thống nhất không có tham số cap; vòng từ state | Test: gọi approveLevel2 trên PENDING_APPROVAL → chặn; Berth submit → PENDING_APPROVAL |
| MF-03 | T-03: thiếu seed `kcht:*` + thiếu `@PreAuthorize` (High) | Cluster A/B toàn bộ 21 file | 9 dòng `seedPermission(definitions,"kcht",...)` trong `PermissionSeeder.run()`; `@PreAuthorize`/`@auth.check` trên mọi endpoint duyệt | AC-21: user thiếu quyền → 403, trạng thái không đổi |
| MF-04 | T-04 + T-12: nhảy vòng / duyệt ngược / reject sai thẩm quyền (High) | Cluster A — A2 engine | Gate N01/N02 trong engine; reject vòng 2 đòi thẩm quyền vòng 2 | AC-12/13 pass; user vòng 1 reject ở vòng 2 → chặn |
| MF-05 | T-05: 4-eyes thiếu ở Berth + so canonical id (High) | Cluster A — A2/A7 | 4-eyes trong engine; Berth qua engine | AC-10/11 pass trên port family + Berth |
| MF-06 | T-06 + T-08: lạm dụng phân cấp + IDOR chéo đơn vị (High) | Cluster A/B per-type service + controller | Sender level từ principal; `OrgUnitScopeService.allows` chiều GHI; scope check entity trước mọi transition; history/log có scope | AC-03/23/24 pass; test IDOR: user đơn vị X duyệt/xem hồ sơ đơn vị Y → chặn |
| MF-07 | T-09: INSERT-only chưa enforce DB (High) | Cluster A — A2 + migration | Trigger/revoke trên `approval_logs`; repository không delete | UPDATE/DELETE trên approval_logs thất bại ở DB; AC-20 pass |
| MF-08 | T-10: thiếu khóa lạc quan chống chuyển trạng thái đồng thời (High) | Cluster A — A2 + entity | `@Version` trên entity KCHT; gate+update 1 transaction | Test concurrency 2 request song song → đúng 1 chuyển trạng thái, 1 log |
| MF-09 | T-11: reject-reason ≥ 10 ký tự ở engine, không đi đường cũ (High) | Cluster A — A2 | Engine guard trim ≥ 10 cả 2 vòng; method legacy xóa cuối wave | AC-09, N07/N08 pass |

## 7. Should-fix items (nên làm — không chặn gate)

| ID | Finding | Risk if deferred | Priority |
|---|---|---|---|
| SF-01 | T-13: entityType whitelist + UUID validate | Log poisoning / ghi log sai đối tượng → phá giá trị truy vết | Cao |
| SF-02 | T-07: chốt luật `saveAndSubmit` cho sender cấp Cục | Cục gửi lại sau khi bị Cục trả về vào sai vòng (hoặc bị chặn oan) — sai nghiệp vụ quy tắc 14 | Cao |
| SF-03 | T-14: cơ chế xác thực kênh tích hợp cho `directApprove` | Lộ endpoint → lưu thẳng Đã duyệt hàng loạt, phá quy trình | Cao |
| SF-04 | T-16: xóa method legacy + nhánh auto-approve cũ cuối wave | Cửa sổ rủi ro kéo dài; 2 luồng song song dễ lệch | Trung bình |
| SF-05 | T-15: lọc `view_sensitive` tập trung | Rò rỉ metadata nhạy cảm qua endpoint khác | Trung bình |
| SF-06 | Quyền cũ (`buoystation:approve*`, `berth:approve`...) giữ seed — đảm bảo KHÔNG gate endpoint mới | Gán quyền cũ vô tình mở endpoint mới | Trung bình |
| SF-07 | Migration V121 backfill Berth — rà soát trước khi chạy | Dữ liệu Berth đổi nghĩa trạng thái → sai luồng nếu backfill sai điều kiện | Trung bình |

## 8. Rủi ro tồn đọng (Residual risks)

1. **Chất lượng gán quyền (quy tắc 8):** thẩm quyền "theo chức vụ" chỉ chặt bằng việc admin gán đúng `kcht:approve_level1/2`. Nếu gán nhầm `kcht:approve_level2` cho user cấp Cảng vụ, engine không tự phát hiện (không có check org-level của actor trong engine — R-02 chỉ bắt buộc reject; cân nhắc bổ sung kiểm tra `actor.orgUnit.level` tương ứng vòng trong controller).
2. **AdminAutoApproval** (sys-admin clear cả 2 vòng 1 bước) là bypass SoD có chủ đích — chấp nhận với điều kiện chỉ ROLE_SYSTEM_ADMIN và không reachable qua path `kcht:*` thường; giữ nguyên ở wave sau.
3. **Quy tắc 6 (DP-7)** kiểm soát bằng state machine + change log, không diff nội dung — về lý thuyết người dùng có thể gửi lại với thay đổi tối thiểu/không thay đổi nếu caller quên ghi change log. Yêu cầu bổ sung: engine hoặc service phải xác minh tồn tại ≥ 1 dòng change_logs giữa 2 lần gửi (R-07 mở rộng).
4. **LSP/impact không chạy được** (thiếu JDK 21 trong môi trường) — các con số call-site dựa trên grep trực tiếp, không phải symbol-aware; danh sách 21 file theo design §9 là giới hạn dưới, cần rà soát lại khi có toolchain.
5. **Phân loại cấp độ ATTT (Nghị định 85/2016/NĐ-CP)** chưa được xác định cho hệ thống — ảnh hưởng mức yêu cầu kiểm thử/giám sát khi vận hành.

## 9. Bằng chứng (verified this session)

| Claim | Evidence |
|---|---|
| userId=1L cứng ở 5 controller station | CoastalStationVTSController.java:81,92; LRIT:96,105; Inmarsat:89,98; Haiphong:87,96; CospasSarsat:89,98 |
| Station approve/reject không @PreAuthorize, class có @DataScope | CoastalStationVTSController.java:20-30,75,86 |
| CoastalStationVTSService: 4-eyes :149; level-walk :154-170; reject reset PROPOSED/PENDING :184-185; setApprovedBy(String.valueOf(userId)) :172 | station/service/CoastalStationVTSService.java |
| Engine hiện tại 1 cấp: approve PENDING→APPROVED :43-66; reject PENDING→REJECTED chỉ check isBlank :82-112; resetToPending :122 | port/service/shared/ApprovalWorkflowService.java |
| Berth: gate theo cap request :40-56; KHÔNG 4-eyes; reject không check độ dài reason; getAllHistory đọc tất cả :100-120 | port/service/BerthApprovalService.java |
| Berth controller: cap từ request :120-121,130-131; `berth:approve` dùng chung approve+reject; history `berth:history` | port/controller/BerthController.java |
| Chưa có permission `kcht:*` nào seed; mẫu seedPermission có sẵn :63+ | config/PermissionSeeder.java (grep `"kcht"` = 0 match) |
| approval_logs: cột cap/decidedBy/decidedAt; INSERT-only chỉ là comment; JpaRepository có delete | port/entity/ApprovalLog.java; port/repository/ApprovalLogRepository.java:18 |
| orgUnitFilter @FilterDef; DataScopeAspect bật filter; OrgUnitScopeService.allows | common/entity/BaseEntity.java:34-38; security/aspect/DataScopeAspect.java:145-146; orgunit/service/OrgUnitScopeService.java:97 |
| Mô hình permission động | user/entity/User.java:129 getAllPermissions() |
| AdminAutoApproval: chỉ sys-admin, bypass SoD có chủ đích | security/AdminAutoApproval.java |
| Intel: actor-registry.json là role cũ (A-001..A-008), sitemap.json chỉ route frontend, không có permission-matrix.json | docs/intel/actor-registry.json; docs/intel/sitemap.json — **intel-drift: false** (thiết kế theo mô hình permission động hiện tại, không ràng buộc role cũ; bộ `kcht:*` là mới nên intel chưa phủ — không phải drift) |

> **Ghi chú xác minh:** mọi anchor trên được mở/đọc trực tiếp trong phiên này (read/grep). `impact`/`lsp` không chạy được do thiếu JDK 21 trong môi trường — thay bằng grep toàn cục; số lượng call-site xem là lower bound.

## 10. Căn cứ Knowledge Base (ai-mcp_kb-query, domain=security)

| Finding/R | KB entry (id, verified 2026-08) | Áp dụng |
|---|---|---|
| T-08 (IDOR chéo đơn vị), R-05 | `kb-fcdfc0494629b767` — "Broken access control and IDOR: authorize every object access server-side": mọi truy cập object phải có check authorization phía server theo object cụ thể; UUID chỉ là defense-in-depth, không thay thế check | Scope check entity trước mọi transition + history/log endpoints (MF-06) |
| T-09 (INSERT-only), R-06 | `kb-ec57779b5b64c469` — "Injection... least-privilege database accounts limit the damage": tài khoản DB đặc quyền tối thiểu; fix mang tính cấu trúc, không phải quy ước code | Trigger/revoke UPDATE-DELETE trên `approval_logs` (MF-07) — enforce ở tầng DB, không chỉ comment |
| T-01, T-02, T-04, T-08 (phân hạng) | `kb-0309e880693bbe0a` — OWASP Top 10:2025: A01 Broken Access Control (#1), A07 Authentication Failures, A08 Software and Data Integrity Failures, A09 Security Logging and Alerting Failures | Phân hạng: T-01 → A07; T-02/T-04/T-08 → A01; T-09/T-10 → A08/A09 |
| R-02 (2 lớp chặn nhảy vòng) | `kb-e24306618f81b39e` — 4-Layer Defense-in-Depth: quyết định chính sách được enforce xác định trước khi tới đích, không chỉ "khó xảy ra" | Gate engine + `@PreAuthorize` = 2 lớp bắt buộc (MF-04) |
| Quy trình review | `kb-3d3f9c70a0e3a9dc` — "Security-sensitive changes need mandatory review": thay đổi auth/RBAC/phân quyền phải có review bảo mật riêng + ghi ADR/design note | M-1006 chạm toàn bộ permission engine — cần security review riêng ở stage review + ghi chú quyết định (đã có trong design-plan) |
| 4-eyes/SoD, reject-reason, phân cấp quy tắc 14 | **Không có entry KB** cho approval-workflow/SoD cụ thể — các quy tắc này grounded trực tiếp ở `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (quy tắc 4, 7, 8, 14 + mục 7) và `ba/00-lean-spec.md` (BR-015/016/020) — nguồn được ủy quyền cao hơn KB | Không thay thế; KB chỉ bổ trợ phân hạng + biện pháp kỹ thuật |
