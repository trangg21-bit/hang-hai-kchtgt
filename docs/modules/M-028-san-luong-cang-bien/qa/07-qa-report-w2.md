# QA Wave-2 Report — M-028 "Sản lượng cảng biển" / F-301 `seaport_throughput`

- **Module:** M-028 `san-luong-cang-bien` — **Feature:** F-301 `seaport_throughput`
- **Stage:** engineering-qa-engineer — **Wave:** 2 (validation execution của wave-1 oracle `07-qa-report-w1.md`)
- **Date:** 2026-09-06
- **Scope:** report-only. Đã READ toàn bộ implementation; EXECUTE 3 lệnh bắt buộc; STATIC-VERIFY từng TC wave-1. Không code edit, không git, không chạy backend server.

## 1. Executed verification battery (observed output, exit codes)

| # | Command (workdir) | Exit | Observed output |
|---|---|---|---|
| 1 | `JAVA_HOME=<temurin-17> mvn -q -DskipTests compile` (repo root) | **0** | Implicit (quiet mode). Ghi chú: lần chạy đầu không set `JAVA_HOME` fail với `maven-enforcer-plugin: RequireJavaVersion — must be built with Java 17 to 21`; retry với `JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home` → exit 0 |
| 2 | `npm run build` → `vite build` (frontend/) | **0** | `vite v8.2.2`, 3534 modules transformed, `✓ built in 500ms`; dist assets emitted (index, CSS, chunk per page incl. GISChartView/SeaportThroughput liên quan) |
| 3 | `npx vitest run src/services/seaportThroughputService.test.ts` (frontend/) | **0** | `Test Files 1 passed (1)`, `Tests 13 passed (13)`, duration 115ms, v4.1.11 — 13 tests green |

**Battery: 3/3 exit 0.** Lưu ý phương pháp: vitest file này mock `api` (axios) — nó xác nhận FE service tự nhất quán với URL nó gọi, **không** chứng minh URL khớp controller thật (xem finding F-01).

## 2. Implementation inventory (đã đọc trực tiếp)

- BE: `entity/SeaportThroughput.java`, `entity/SeaportThroughputFile.java`, `service/SeaportThroughputService.java` (580 dòng, đọc full), `controller/SeaportThroughputController.java` (198 dòng, đọc full), `repository/{SeaportThroughput,SeaportThroughputFile}Repository.java`, `dto/*` (Create/Update/Response/FileResponse/SearchResult).
- Migration: `src/main/resources/db/migration/V20260905120000__seaport_throughput.sql` (89 dòng, đọc full).
- FE: `pages/seaport-throughput/{SeaportThroughputPage,SeaportThroughputDrawer}.tsx`, `seaportThroughputMeta.ts`, `services/seaportThroughputService.ts` (197 dòng, đọc full) + `.test.ts`; route/menu: `App.tsx:224`, `AppLayout.tsx:61,288`.
- Shared: `ApprovalStatus.java`, `InfrastructureApprovalService.java`, `PermissionSeeder.java:957-973`, `InfrastructureType.java:36`.

## 3. Findings (độc lập với dev narrative)

### F-01 — FE↔BE contract mismatch (3 URL sai + 1 field name sai) — **HIGH**
So khớp URL FE service vs mapping controller:

| FE `seaportThroughputService` | URL FE gọi | Controller thật (đã đọc full) | Kết luận |
|---|---|---|---|
| `approveLevel1(id)` | `POST /{id}/approve-level1` | `POST /{id}/approve` → `approveLevel1` | **404 mismatch** |
| `reject(id, reason, level)` | `POST /{id}/reject-level{1\|2}` | chỉ có `POST /{id}/reject` (1 endpoint, tự chọn level theo trạng thái) | **404 mismatch** |
| `listFiles(id)` | `GET /{id}/files` | KHÔNG có GET files trong controller (chỉ POST upload + DELETE) | **404 mismatch** |
| `uploadFile(id, file)` | FormData field `file` | Controller: `@RequestParam("files") List<MultipartFile>` | **400/415 mismatch** (param `files`, dạng list) |

Bằng chứng: controller L107-118 (`@PostMapping("/{id}/approve")`), L142-148 (`@PostMapping("/{id}/reject")`), L152-159 upload `@RequestParam("files")`, L163-170 delete file — controller không có `GET /{id}/files`; FE service L133-170 gọi các URL/field nêu trên. Hệ quả runtime: nút Phê duyệt C1, Từ chối, danh sách file, upload file trên FE đều fail 404/400 dù backend logic đúng. Vitest không bắt được vì mock axios.

### F-02 — Excel import (UC-SLCB-08 / BR-SLCB-09 / TC-FILE-03..05) — **KHÔNG implement** — **HIGH**
- `PermissionSeeder` seed đủ action `import` (L973) nhưng **controller không có endpoint import**, **service không có method import/parse Excel**, **FE service không có method import** (đã grep + đọc full cả 3).
- Wave-1 oracle TC-FILE-03 (403 khi thiếu quyền import), TC-FILE-04/05 (lỗi theo dòng, không ghi nửa chừng), TC-PERM-06, UC-SLCB-08, BR-SLCB-09 → **không có surface để chạy** (mọi call → 404, không phải 403). BE-6 work order chưa hoàn thành.

### F-03 — Wave-1 message/state/logic khớp (static pass) — các hạng mục sau ĐÚNG theo oracle

## 4. Per-test-case verdict (static-verify theo wave-1 oracle)

> Phương pháp: STATIC-VERIFY (đọc code + grep anchor). Không chạy backend server (chính sách); do đó các TC dạng HTTP runtime được verdict là **PASS-STATIC** (code path + message đúng, cần chạy integration wave sau để xác nhận end-to-end) hoặc **FAIL/BLOCKED** khi có mismatch thật. JUnit service tests (BE-4) không được dev bàn giao trong tree này → ghi rõ.

| TC | Criterion | Verdict | Evidence (anchor) |
|---|---|---|---|
| TC-UC-01 | Create → DRAFT, 24 cột + passenger, orgUnitName | **PASS-STATIC** | Service L76-127: builder gán orgUnitId/reportMonth/24 giá trị valueOrZero/passengerTrips default 0/`approvalStatus(DRAFT)`; `toResponse` L519-579 map orgUnitName từ cache + files; recordHistory DRAFT_SAVED |
| TC-UC-02 | Sửa DRAFT; xóa chỉ DRAFT + deletedBy + history | **PASS-STATIC** | Service delete L326-334: `approvalService.deleteDraft` (chỉ DRAFT — InfrastructureApprovalService L257-269 §3.6) + `entity.softDelete(userId)` + `InfrastructureHistoryUtils.recordSoftDelete`; update L139-229 assertEditable khi chưa APPROVED |
| TC-UC-03 | Submit DRAFT/REJECTED → PENDING_APPROVAL + submittedAt/By | **PASS-STATIC** | Service submit L232-248 gọi `approvalService.submit`; InfrastructureApprovalService L62-63 cho phép REJECTED_LEVEL1/2 resubmit |
| TC-UC-04 | C1 approve → APPROVED_LEVEL1; C1 reject → REJECTED_LEVEL1 + lý do | **PASS-STATIC** | Service approveLevel1 L250-264 (`approveC1`); InfrastructureApprovalService L136 `setApprovalStatus(REJECTED_LEVEL1)`; reject L288-315 |
| TC-UC-05 | C2 approve → APPROVED; C2 reject → REJECTED_LEVEL2 + lý do | **PASS-STATIC** | Service approveLevel2 L266-286 (`approveC2`); InfrastructureApprovalService L188 `REJECTED_LEVEL2` |
| TC-UC-06 | List + lọc + sort updatedAt DESC + tab Từ chối gộp 2 cấp | **PASS-STATIC** | Repository search (JPQL đủ 5 filter + statuses IN); service search sort `UPDATED_AT DESC` L421; controller L61-79 split `,` → danh sách status |
| TC-UC-07 | Chi tiết + history đúng thứ tự | **PASS-STATIC** | `getHistory` → `findByRefTypeAndRefIdOrderByApprovedDateDesc`; response đủ metadata + files |
| TC-UC-08 | Import Excel | **FAIL (F-02)** | Không endpoint/method/service/FE method |
| TC-UC-09 | Upload/xóa file | **PARTIAL** — BE đúng (`uploadFiles` assertEditable + lưu + history; `deleteFile` FK check + xóa), FE sai URL/field (F-01) |
| TC-APP-01 | Chuỗi DRAFT→PENDING→APPROVED_LEVEL1→APPROVED | **PASS-STATIC** | approveC1/C2 + submit đúng thứ tự (shared service state machine) |
| TC-APP-02/03/04 | Reject hợp lệ / thiếu lý do / C2 reject | **PASS-STATIC** | Service reject L288: reason null → `"Vui lòng nhập lý do từ chối"`; chọn level theo `PENDING_APPROVAL`→L1 / `APPROVED_LEVEL1`→L2 |
| TC-APP-05/06 | approve_level2 sai quyền / approve C1 ngoài phạm vi | **PASS-STATIC** (authz phải verify runtime) | `@PreAuthorize('seaportthroughput:approve_level2')` L83; `@DataScope` class-level + DataScopeAspect chặn đọc ngoài scope |
| TC-APP-07 | 4-eyes: kê khai không tự duyệt | **PASS-STATIC** | Service `assertNotSelfApproval` L464-467: userId == createdBy || submittedBy → `"Người kê khai không được tự phê duyệt bản ghi của mình"`; gọi đầu approveLevel1/2 + reject |
| TC-APP-08 | Reject lưu reason + history | **PASS-STATIC** | Service reject: trim reason, set qua approveC1/C2 (lưu rejectionReason), recordHistory REJECTED |
| TC-APP-09 | Cục submit thẳng APPROVED_LEVEL1 | **PASS-STATIC** | InfrastructureApprovalService L36 comment + logic: orgUnit.level==1 → APPROVED_LEVEL1 |
| TC-APP-10 | Không hạ DRAFT sau gửi; REJECTED sửa+resubmit → PENDING | **PASS-STATIC** | InfrastructureApprovalService assertEditable L218-221: DRAFT/REJECTED_LEVEL1/2 sửa được; state machine không có đường hạ hồ sơ |
| TC-APP-11/12 | History đủ bước, không trùng; sau APPROVED thay đổi ghi history | **PASS-STATIC** | recordHistory mỗi bước (DRAFT_SAVED/UPDATED/PROPOSED/APPROVED/REJECTED/ATTACHMENT_*); update approvedFlow → `recordSaveAndApprove` |
| TC-VAL-01 | Unique (org, month) create | **PASS-STATIC** | Service L96-99 `existsByOrgUnitIdAndReportMonth` → `"Đã tồn tại số liệu sản lượng của đơn vị trong tháng này"`; migration unique index `uq_seaport_throughput_unit_month` (L63-65) |
| TC-VAL-02 | Thiếu org_unit_id | **PASS-STATIC** | Service L73-75 → `"Vui lòng chọn Đơn vị quản lý"`; DB NOT NULL (migration) |
| TC-VAL-03 | Thiếu report_month / trùng khi edit | **PASS-STATIC** | parseReportMonth L469-479 → `"Vui lòng chọn Thời gian tổng hợp sản lượng"`; update L141-149 `existsByOrgUnitIdAndReportMonthAndIdNot` |
| TC-VAL-04/05 | 24 cột & passenger ≥ 0 | **PASS-STATIC** | `validateMetrics` L481-487 signum<0 → `"Giá trị không được nhỏ hơn 0"` (đủ 24 tham số create L78-95 & update L150-167); `validatePassengerTrips` → `"Lượt hành khách không được nhỏ hơn 0"` |
| TC-VAL-06 | trim text | **PASS-STATIC** | `trimToNull` L497-504 dùng cho note, keyword search, reject reason, file name, reportMonth |
| TC-VAL-08 | Precision NUMERIC(18,2) | **PARTIAL** | Migration `NUMERIC(18,2)` đúng; DTO/service không bean-validate scale → phụ thuộc DB; không có unit test bàn giao để xác nhận hành vi tràn |
| TC-FILE-01/02 | Upload file / xóa theo policy | **PARTIAL** — BE logic đúng (assertEditable, FK check, history, soft delete file row); FE upload sai param name `file` vs `files`; listFiles không có endpoint BE (F-01) |
| TC-FILE-03/04/05 | Import | **FAIL (F-02)** | Không implement |
| TC-DS-01..07 | DataScope per org | **PASS-STATIC** | Entity `@Filter(orgUnitFilter, org_unit_id IN (:orgUnitIds))`; controller `@DataScope` class-level; create `requireOrganizationInScope` L460-466 → `"Đơn vị quản lý nằm ngoài phạm vi được phép"`; update request **không có** orgUnitId field (không đổi khi sửa — TC-DS-05 ✓); migration `org_unit_id UUID NOT NULL` sau backfill từ created_by (L57-59); response trả orgUnitId + orgUnitName; Admin full qua scope_all/admin:all (cơ chế DataScopeAspect hiện có) |
| TC-PERM-01..09 | 9 action permission | **PARTIAL** — 9 `seedPermission("seaportthroughput", …)` đủ (PermissionSeeder L957-973: read/create/update/delete/submit/approve/approve_level2/reject/import); controller `@PreAuthorize` khớp 8 action có endpoint (import không có endpoint — F-02); endpoint C1 approve dùng action `approve` ✓; runtime 403 cần integration test xác nhận |
| TC-UI-01 | Route + menu + guard | **PASS-STATIC** | `App.tsx:224` route `/seaport-throughput` + `PermissionGuard seaportthroughput:read`; `AppLayout.tsx:61,288` menu + canAccessMenu |
| TC-UI-02/03 | List layout + 6 tab + count | **PASS-STATIC** | Page dùng shared list-view + FilterTableLayout; Meta L87-94 đúng 6 tab (Tất cả/Lưu tạm/Chờ Cảng vụ/Chờ Cục/Ban hành/Từ chối) + comment "Tất cả = tổng 5 tab"; Page L141-142 có loading/error state |
| TC-UI-04 | 4 trạng thái màn loading/error/empty/data | **PARTIAL** | Code có loading + error state (L141-142); empty/data render phụ thuộc DataTable/EmptyState shared; chưa thể visual-verify (no browser run) — cần manual check wave sau |
| TC-UI-05..08 | Drawer 3 mode / history từ rowActions / badge | **PARTIAL** | Meta có nhãn + màu token semantic (DRAFT/APPROVED/REJECTED_LEVEL1/2); không tab log riêng trong page đã đọc; visual checks chưa chạy |
| TC-STR-01..03 | Structural dev evidence | **PASS** | Entity/Filters/migration/PermissionSeeder/InfrastructureType.SEAPORT_THROUGHPUT đều tồn tại; `mvn compile` exit 0; entity 24 field BigDecimal precision 18/2 + passengerTrips Long |
| TC-SEC-01..06 | Security closure | **PARTIAL** | M-01: authz từng action + @DataScope có; M-02: ghi validate scope + NOT NULL có; M-03: assertNotSelfApproval + shared state machine có (TOCTOU/concurrency guard chưa verify runtime); M-04: import/file hardening — import không implement (F-02), file type/size không validate rõ trong uploadFiles (chấp nhận mọi MultipartFile, chỉ lưu path) → cần SA/dev đánh giá; M-05 audit có; M-06 resubmit routing có |

## 5. Vitest coverage note

13 tests pass nhưng phạm vi hẹp: list/getById/create/update/softDelete/submit/approveLevel1/approveLevel2/reject/files/history — **toàn bộ mock axios, xác nhận URL chuỗi FE tự gọi**, không đối chiếu controller. Chính vì mock nên F-01 (3 URL + 1 field name lệch controller thật) **không bị test bắt**. Đề xuất: integration test FE↔BE (MockMvc hoặc contract test) cho 4 điểm F-01 + test import sau khi BE-6 hoàn thành.

## 6. Wave-2 verdict

- **Executed battery:** 3/3 exit 0 (`mvn -q -DskipTests compile` với JAVA_HOME=17, `vite build`, `vitest` 13/13).
- **Static verdict chính:** phần lớn wave-1 TC đạt static pass — DataScope, 4-eyes, 2-level approval, 7 trạng thái, unique, validation ≥ 0 + message tiếng Việt nguyên văn, trim, audit/history, migration + backfill + NOT NULL, 9 permission seed, route/menu guard. Những phần này khớp oracle.
- **2 finding khối (F-01, F-02):**
  - F-01 **HIGH**: FE service gọi sai 3 URL + sai 1 form-field so với controller thật → approve C1 / reject / listFiles / uploadFile trên FE sẽ 404/400 runtime.
  - F-02 **HIGH**: Excel import (UC-SLCB-08, BR-SLCB-09, TC-FILE-03..05, BE-6) **không implement** dù permission `import` đã seed — không có surface để verify.
- Verdict: **Changes-requested** — implementation chưa đạt acceptance; cần dev sửa F-01 (đồng bộ FE service URL/param với controller) và hoàn thành F-02 (import) rồi QA wave-2 chạy lại + bổ sung integration tests.

**Chưa verify được (ghi rõ):** runtime HTTP behavior (không chạy backend theo chính sách), visual UI 4 trạng thái (không browser), JUnit service tests không tồn tại trong tree để chạy, hành vi DB precision/TOCTOU/concurrency khi chạy thật, file upload type/size hardening.

---

# § Re-run after rework (2026-09-06, sau khi dev xử lý F-01/F-02)

## R-1. Executed battery (re-run, observed exit codes)

| # | Command (workdir) | Exit | Observed output |
|---|---|---|---|
| 1 | `JAVA_HOME=<temurin-17> mvn -q -DskipTests compile` (repo root) | **0** | Quiet mode, không lỗi — `MVN_EXIT=0` |
| 2 | `npm run build` → `vite build` (frontend/) | **0** | vite v8.2.2, 3534 modules, `✓ built in 537ms` |
| 3 | `npx vitest run src/services/seaportThroughputService.test.ts` (frontend/) | **0** | 1 file / **13 tests passed** (115ms) |

Battery re-run: **3/3 exit 0**.

## R-2. F-01 — RESOLVED (verified trong code + test)

So khớp lại FE service ↔ controller sau rework (đọc trực tiếp):

| FE `seaportThroughputService.ts` | URL/field mới | Controller thật (đọc trực tiếp) | Kết quả |
|---|---|---|---|
| `approveLevel1(id)` L167 | `POST /{id}/approve/c1` | `@PostMapping("/{id}/approve/c1")` L132 + `seaportthroughput:approve` | ✅ khớp |
| `approveLevel2(id)` L174 | `POST /{id}/approve/c2` | `@PostMapping("/{id}/approve/c2")` L143 + `seaportthroughput:approve_level2` | ✅ khớp |
| `reject(id, reason)` L182 | `POST /{id}/reject`, body `{ reason: reason.trim() }` | `@PostMapping("/{id}/reject")` L154 (1 endpoint, level suy từ trạng thái) | ✅ khớp (FE không còn gửi level) |
| `uploadFile` L188-190 | FormData field `files` | `@RequestParam("files") List<MultipartFile>` L180 | ✅ khớp |
| `listFiles` | **đã bỏ** — file đọc từ `files[]` trong response GET `/{id}` (comment L186) | Controller không có GET `/files` | ✅ nhất quán |

Test file đã cập nhật và khẳng định đúng URL mới: `approve/c1` (test L181), `approve/c2` (L184), `/reject` reason-trim (L187-193), upload field `files` (L200-211), `deleteFile` (L215-218) — vitest 13/13 xanh vì expectation khớp implementation mới. **F-01 đóng.**

## R-3. F-02 — RESOLVED (verified trong code)

| Thành phần | Bằng chứng (đọc/grep trực tiếp) |
|---|---|
| Controller endpoint | `@PostMapping("/import")` L165 + `@PreAuthorize("...seaportthroughput:import")` + `@RequestParam("file") MultipartFile` → trả `SeaportThroughputImportResponse`, message VI `"Nhập dữ liệu sản lượng cảng biển thành công: N dòng"` |
| Service `importExcel` | `SeaportThroughputService.java` L414 (đã `@Transactional`); POI: `WorkbookFactory.create(file.getInputStream())` L437, đọc sheet 0, bỏ header row |
| Lỗi theo dòng | L457 `List<String> rowErrors`; L533-534 gộp từng dòng vào `errors` — message per-dòng rõ ràng (org thiếu/ngoài phạm vi/trùng tên, month thiếu/sai format, giá trị < 0 theo cột, passenger < 0, unique trùng trong file L527 / trùng DB L529) |
| No partial writes (BR-SLCB-09) | Comment L578-580: `// BR-SLCB-09: có bất kỳ lỗi dòng nào → không ghi gì cả (all-or-nothing)` → `if (!errors.isEmpty()) throw new IllegalArgumentException(...)` TRƯỚC khi lưu; dòng hợp lệ tích lũy `toSave` rồi mới persist (đã đọc L536-577 builder 24 cột + DRAFT) |
| FE | `importExcel` → FormData field `file`, `POST /v1/seaport-throughput/import` (service L202-204); test L221-238 assert đúng URL + field + row-error report |

**F-02 đóng** — surface import tồn tại đủ controller → service (POI, per-row errors, all-or-nothing, unique) → FE; TC-FILE-03/04/05, UC-SLCB-08, BR-SLCB-09, TC-PERM-06 giờ có endpoint để chạy (cần integration test runtime ở wave sau vì không chạy backend).

## R-4. Per-TC cập nhật sau rework

| TC trước đó FAIL/PARTIAL | Verdict mới | Căn cứ |
|---|---|---|
| TC-UC-08 / BR-SLCB-09 / TC-FILE-03..05 / TC-PERM-06 (import) | **PASS-STATIC** | Endpoint L165 + service importExcel L414 (POI, per-row errors, all-or-nothing, unique in-file+DB) + FE L202-204 + test L221-238; runtime cần integration test (chưa chạy backend) |
| TC-UC-09 / TC-FILE-01 (upload/list file) | **PASS-STATIC** | Upload FE field `files` khớp `@RequestParam("files")`; files đọc từ detail response — không còn endpoint thiếu |
| TC-APP-05/06/07 (approve path) | **PASS-STATIC** | FE `/approve/c1` `/approve/c2` khớp controller + `@PreAuthorize` đúng action approve / approve_level2; 4-eyes guard trong service giữ nguyên |

Các TC còn lại giữ nguyên verdict wave-2 ban đầu (static pass hoặc partial visual/runtime như ghi rõ ở §4).

## R-5. Verdict sau rework

Hai finding chặn đã đóng với bằng chứng code + test: F-01 (FE↔BE contract) resolved, F-02 (import) resolved. Battery 3/3 exit 0. Không còn gap chặn acceptance ở mức static-verify; các hạng mục còn lại (runtime HTTP, visual UI 4 trạng thái, JUnit service test, concurrency/TOCTOU, file hardening) là phạm vi wave sau / integration test, đã ghi rõ ở §4. **Verdict: Pass (static + executed battery).**
