# Implementation Summary — M-028 "Sản lượng cảng biển" / F-301 `seaport_throughput` (Backend, Wave 1)

- **Module:** M-028 `san-luong-cang-bien` — **Feature:** F-301 `seaport_throughput`
- **Seat:** engineering-backend-developer — **Wave:** 1 — **Date:** 2026-09-06
- **Nguồn:** `design/00-design-plan.md` (BE-1..6, REST §3, schema §2, state machine §2.3), `ba/00-lean-spec.md` (9 UC / 15 BR / §5 permissions / §6 DataScope / §8 validation), `qa/07-qa-report-w1.md` (acceptance oracle — exact VI messages + endpoint paths), `_features/F-301-san-luong-cang-bien/feature-brief.md` (§2 29 trường / §7 schema).
- **Code mẫu:** `navigationchannel/*` (entity/controller/service), `common/service/InfrastructureApprovalService.java`, `common/entity/BaseApprovableEntity.java`, `common/util/InfrastructureHistoryUtils.java`, `config/PermissionSeeder.java`.

## 1. Work-order mapping (BE-1..6)

| Work order | Deliverable | Status |
|---|---|---|
| BE-1 | Package `com.hanghai.kchtg.seaportthroughput` + entity `SeaportThroughput` (extends `BaseApprovableEntity`, `@Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")`, 24 cột DECIMAL EN + `passenger_trips`, `report_month DATE`, `note`) | Done — `entity/SeaportThroughput.java` |
| BE-1 | Entity con `SeaportThroughputFile` (extends `BaseEntity`, `throughput_id` FK + `file_name`/`file_path`/`file_size`/`file_type`) | Done — `entity/SeaportThroughputFile.java` |
| BE-2 | Repository `SeaportThroughputRepository` (unique check BR-SLCB-01, paged `search` với filter status list/org/month/date-range/keyword) + `SeaportThroughputFileRepository` | Done — `repository/*.java` |
| BE-3 | Service `SeaportThroughputService` — submit/approve C1/C2/assert qua `InfrastructureApprovalService` (truyền `InfrastructureType.SEAPORT_THROUGHPUT`), 4-eyes, reject có lý do, delete draft, history, files, org-scope gán/validate, `orgUnitCacheService.evictAfterCommit()` | Done — `service/SeaportThroughputService.java` |
| BE-4 | DTO Lombok `@Getter/@Setter/@NoArgsConstructor/@AllArgsConstructor` (+`@Builder`, `@FieldNameConstants` trên request) — Create/Update/Response/FileResponse/SearchResult | Done — `dto/*.java` |
| BE-5 | Controller `SeaportThroughputController` `@RestController @RequestMapping("/api/v1/seaport-throughput") @DataScope` + `@PreAuthorize("@auth.check(authentication, 'seaportthroughput:<action>')")`, trả `ApiResponse<T>`, 12 endpoint | Done — `controller/SeaportThroughputController.java` |
| BE-6 | `PermissionSeeder` seed 9 action `seaportthroughput:*` + `InfrastructureType.SEAPORT_THROUGHPUT` + migration `V20260905120000__seaport_throughput.sql` (2 bảng, index, unique `(org_unit_id, report_month)`, `org_unit_id NOT NULL` + backfill từ `created_by`) | Done |

## 2. REST endpoints (12)

Base `/api/v1/seaport-throughput` — class-level `@DataScope` + `@PreAuthorize` per action:

| Method + Path | Action | Ghi chú |
|---|---|---|
| `GET ""` | `read` | page/size mặc định 0/20, sort `updatedAt` DESC; filter `orgUnitId`, `approvalStatus` (comma-list, "Từ chối" = 2 cấp REJECTED), `reportMonth` yyyy-MM, `updatedFrom/To`, `keyword` |
| `GET /{id}` | `read` | chi tiết + `orgUnitName` (OrgUnitCacheService) + files |
| `GET /{id}/history` | `read` | rows `infrastructure_history` refType `SEAPORT_THROUGHPUT` |
| `POST ""` | `create` | → `DRAFT`; message "Tạo mới sản lượng cảng biển thành công" |
| `PUT /{id}` | `update` | DRAFT/REJECTED_* qua `assertEditable`; APPROVED qua `recordSaveAndApprove` (giữ trạng thái, ghi history) |
| `DELETE /{id}` | `delete` | chỉ DRAFT (`deleteDraft` + `softDelete` + history DELETED) |
| `POST /{id}/submit` | `submit` | chuyển `PENDING_APPROVAL` (cấp Cục → thẳng `APPROVED_LEVEL1` theo `OrgUnit.level`, rule 14) |
| `POST /{id}/approve/c1` | `approve` | C1: `PENDING_APPROVAL` → `APPROVED_LEVEL1` |
| `POST /{id}/approve/c2` | `approve_level2` | C2: `APPROVED_LEVEL1` → `APPROVED` (ban hành) |
| `POST /{id}/reject` | `reject` | theo trạng thái hiện tại → `REJECTED_LEVEL1` hoặc `REJECTED_LEVEL2` |
| `POST /import` | `import` | Excel (MultipartFile) — parse theo cột §2.1, báo lỗi theo dòng, không ghi nửa chừng (BR-SLCB-09) |
| `POST /{id}/files` | `update` | upload MultipartFile → dòng `seaport_throughput_file` + history ATTACHMENT_UPLOADED |
| `DELETE /{id}/files/{fileId}` | `update` | xóa file con + history ATTACHMENT_DELETED |

> **Đã chốt theo rework QA F-01:** path C1/C2 theo design plan §3 (L92-98, authoritative): `POST /{id}/approve/c1` và `POST /{id}/approve/c2` — action `approve` / `approve_level2` không đổi (lean-spec §5 + QA L27). Không dùng `/{id}/approve` / `/{id}/approve-level2`.

## 3. Validation & message VI (theo QA oracle §7)

| Case | Message chính xác |
|---|---|
| Thiếu đơn vị quản lý | `Vui lòng chọn Đơn vị quản lý` |
| Đơn vị ngoài phạm vi DataScope | `Đơn vị quản lý nằm ngoài phạm vi được phép` |
| Thiếu tháng tổng hợp | `Vui lòng chọn Thời gian tổng hợp sản lượng` |
| Trùng (đơn vị, tháng) BR-SLCB-01 | `Đã tồn tại số liệu sản lượng của đơn vị trong tháng này` |
| Chỉ tiêu < 0 (24 cột DECIMAL) | `Giá trị không được nhỏ hơn 0` |
| passenger_trips < 0 | `Lượt hành khách không được nhỏ hơn 0` |
| Tự duyệt bản ghi của mình (4-eyes) | `Người kê khai không được tự phê duyệt bản ghi của mình` |
| Reject thiếu lý do | `Vui lòng nhập lý do từ chối` |
| Reject sai trạng thái | `Bản ghi không ở trạng thái chờ phê duyệt nên không thể từ chối` |

- Text input trim (`.trim()`) — `note`, `keyword`, `reportMonth`, `reason`, tên file.
- Không hardcode chuỗi field/enum: tham chiếu `EntityFields.UPDATED_AT`, `BaseApprovableEntity.Fields.approvalStatus`; so sánh enum dùng `ApprovalStatus.X`; lưu DB qua `@Enumerated(EnumType.ORDINAL)` SMALLINT.
- `@FieldNameConstants` trên entity + request DTO; `@Getter/@Setter/@NoArgsConstructor/@AllArgsConstructor` Lombok; không dùng fully-qualified name trong thân code.

## 4. DataScope

- Entity kế thừa `org_unit_id` từ `BaseApprovableEntity`; migration `org_unit_id UUID NOT NULL` (backfill `created_by` trước khi SET NOT NULL — table mới nên no-op an toàn).
- `@Filter(orgUnitFilter)` trên entity; controller class-level `@DataScope` bật Hibernate global filter khi đọc.
- Chiều GHI: `OrgUnitScopeService.currentUserScope().allows(orgUnitId)` + tồn tại đơn vị (OrgUnitCacheService) — chặn gán đơn vị ngoài phạm vi, không bao giờ NULL.

## 5. PermissionSeeder (9 action mới)

`read, create, update, delete, submit, import, approve, approve_level2, reject` — resource `seaportthroughput` (không gạch nối, theo lean-spec §5 / QA L27; feature-brief §4.4 dùng `seaport-throughput` là BA-proposal OR-01). `import` được seed đủ permission (BE-6); endpoint Excel parse chi tiết để QA wave-2 định nghĩa oracle đúng (BR-09 all-or-nothing) — controller có sẵn seam.

## 6. Files changed / added

- M `src/main/java/com/hanghai/kchtg/gis/search/dto/InfrastructureType.java` (+`SEAPORT_THROUGHPUT`)
- M `src/main/java/com/hanghai/kchtg/config/PermissionSeeder.java` (+9 seedPermission)
- A `src/main/java/com/hanghai/kchtg/seaportthroughput/entity/SeaportThroughput.java`
- A `src/main/java/com/hanghai/kchtg/seaportthroughput/entity/SeaportThroughputFile.java`
- A `src/main/java/com/hanghai/kchtg/seaportthroughput/repository/SeaportThroughputRepository.java`
- A `src/main/java/com/hanghai/kchtg/seaportthroughput/repository/SeaportThroughputFileRepository.java`
- A `src/main/java/com/hanghai/kchtg/seaportthroughput/dto/SeaportThroughputCreateRequest.java` / `SeaportThroughputUpdateRequest.java` / `SeaportThroughputResponse.java` / `SeaportThroughputFileResponse.java` / `SearchResultResponse.java`
- A `src/main/java/com/hanghai/kchtg/seaportthroughput/service/SeaportThroughputService.java`
- A `src/main/java/com/hanghai/kchtg/seaportthroughput/controller/SeaportThroughputController.java`
- A `src/main/resources/db/migration/V20260905120000__seaport_throughput.sql`

## 7. Verify (bắt buộc)

- Command: `JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home mvn -q -DskipTests compile`
- Kết quả: **PASS — exit code 0** (re-run trên trạng thái file cuối: job_076b23a1d001pZFyVyRq0ymTdv, `MVN_EXIT=0`, 12.6s, không output = BUILD SUCCESS với `-q`). Maven-enforcer yêu cầu JDK 17–21; PATH mặc định không qua enforcer nên chạy với `JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home` (JDK 17 duy nhất cài trên máy).

## 8. Rework F-01/F-02 (QA wave-2 — Changes-requested đã xử lý)

| Rework | Nội dung thay đổi |
|---|---|
| F-01 (1) | Controller: `@PostMapping("/{id}/approve")` → `@PostMapping("/{id}/approve/c1")` (action `seaportthroughput:approve` giữ nguyên) |
| F-01 (2) | Controller: `@PostMapping("/{id}/approve-level2")` → `@PostMapping("/{id}/approve/c2")` (action `seaportthroughput:approve_level2` giữ nguyên) |
| F-02 | Controller `POST /import` (`@PreAuthorize seaportthroughput:import`, `@RequestParam("file") MultipartFile`) + service `SeaportThroughputService.importExcel(file, userId)` |

Path chốt theo design plan §3 L92-98 (authoritative); `/{id}/reject` và `/{id}/files` upload/delete không đổi. Service import: POI `WorkbookFactory` (.xlsx/.xls), cột 0 = Tên đơn vị quản lý (resolve trong DataScope + OrgUnitCacheService), cột 1 = `yyyy-MM`, cột 2-25 = 24 chỉ tiêu đúng thứ tự §2.1, cột 26 = passenger_trips, cột 27 = note; header dòng 0 tự phát hiện. Mọi lỗi dòng được gom `Dòng n: <msg VI>` và ném `IllegalArgumentException` — **không ghi dòng nào** (BR-SLCB-09 all-or-nothing); unique `(org_unit_id, report_month)` chống trùng trong file lẫn DB; thành công tạo toàn bộ `DRAFT` + history DRAFT_SAVED.

Verify rework: `JAVA_HOME=...temurin-17 mvn -q -DskipTests compile` → exit 0 (job_076d0ec80001K0u73iM0bWER5P, `MVN_EXIT=0`, 12.7s).

## 9. Risks / hand-off cho wave-2

- `import` (Excel) đã implement theo contract §8 (POI WorkbookFactory, lỗi theo dòng, all-or-nothing BR-SLCB-09, unique); còn lại: QA wave-2 xác nhận file Excel thực tế khớp thứ tự cột §2.1 (design L190 — nếu lệch chỉ chỉnh mapping, không đổi schema).
- File upload chặn khi bản ghi APPROVED qua `assertEditable` (policy "lưu & ban hành lại" cho thao tác file sau ban hành chưa lập trình đầy đủ — báo SA/PMO).
- History viết theo bước (DRAFT_SAVED / PROPOSED / APPROVED / REJECTED / UPDATED / DELETED / ATTACHMENT_*) để khớp TC-APP-01 + TC-UC-07; shared `InfrastructureApprovalService` không tự ghi history các bước duyệt.
- Không chạy backend server; không git commit (tuân thủ work-order).
