---
feature-id: M-028/F-301
stage: design
agent: utility-security-auditor
verdict: Pass
last-updated: 2026-09-06
intel-drift: false (permission-matrix.json absent — deferred to review stage; intra-spec identifier conflicts recorded §8)
---

# Threat Model — M-028 "Sản lượng cảng biển" (F-301 `seaport_throughput`) — DESIGN PASS

> Đây là lượt **security design** (threat model) đọc từ đặc tả — CHƯA review code.
> Nguồn đọc trực tiếp: `docs/modules/M-028-san-luong-cang-bien/ba/00-lean-spec.md`
> (223 dòng), `_features/F-301-san-luong-cang-bien/feature-brief.md` (250 dòng),
> `docs/conventions/approval-2-level-spec.md` (241 dòng), `module-brief.md`,
> `docs/intel/actor-registry.json`. Không tồn tại report security cũ trong
> `security/` (chỉ `.gitkeep`) → tạo mới. Không có SA design hay code để đối chiếu
> (folder `design/`, `designer/`, `reviewer/`, `qa/` chỉ chứa `.gitkeep`).

## 1. Phạm vi đánh giá (Review scope)

| Chiều | Giá trị |
|---|---|
| Invoke-mode | `design` (threat model trên specification) |
| Domains đánh giá | Authentication/Authorization (permission `seaportthroughput:*`, `@PreAuthorize`), DataScope theo đơn vị (`DataScopeAspect` + `orgUnitFilter` + `OrgUnitScopeService`), Phê duyệt 2 cấp + 4-eyes, File upload (`seaport_throughput_file` + import Excel), Input validation, Output encoding, Audit/logging, Compliance |
| Tài sản bảo vệ (crown jewels) | Số liệu sản lượng cảng biển **đã ban hành (`APPROVED`)** — nguồn chính thức cho báo cáo thống kê (URD III.7.53/54, UC #148/#149); tính toàn vẹn + không chối bỏ của chuỗi phê duyệt |
| Trust boundaries | TB-1 Browser/UI ↔ REST API; TB-2 Controller ↔ Service (tầng nghiệp vụ); TB-3 Service ↔ DB (Hibernate + orgUnitFilter); TB-4 Upload/Import ↔ File store; TB-5 Download file ↔ File store → Browser; TB-6 Audit/history ↔ DB `infrastructure_history` |
| Ngoài phạm vi | Review code, pentest, kiểm thử — thuộc lượt security `review` sau khi có implementation |

## 2. Sơ đồ trust boundaries & luồng dữ liệu

```mermaid
flowchart LR
    subgraph TB1["TB-1 Browser/UI (untrusted)"]
        UI[React App: list/drawer/UploadFileTable]
    end
    subgraph TB2["TB-2 Controller (Spring MVC)"]
        C[SeaportThroughputController<br/>@PreAuthorize + @DataScope]
    end
    subgraph TB3["TB-3 Service & DB"]
        S[Service: submit/approve/import<br/>4-eyes + state machine + OrgUnitScopeService]
        DB[(seaport_throughput /<br/>seaport_throughput_file)]
        H[infrastructure_history]
    end
    subgraph TB4["TB-4/5 File store"]
        FS[(file store / blob)]
    end
    UI -- "GET /api/seaport-throughput* (JWT)" --> C
    UI -- "POST/PUT/DELETE + submit/approve/reject + upload/import" --> C
    C -- "query orgUnitFilter ON (DataScopeAspect)" --> S
    S --> DB
    S -- "append-only transition/audit rows" --> H
    C -- "upload stream (sanitized)" --> FS
    C -- "download (authz + scope re-check)" --> FS
    FS -- "file stream" --> UI
```

### Trace luồng dữ liệu — ≥1 đường / trust boundary (yêu cầu design mode)

1. **TB-1 (Browser → API):** `GET /api/seaport-throughput?orgUnitId=..&reportMonth=..` — UI gửi JWT/session; controller phải đòi quyền `seaportthroughput:read` (`@PreAuthorize`) TRƯỚC khi vào service. Client là **không tin cậy**: tham số lọc (`orgUnitId`, `reportMonth`, `updatedFrom/To`) phải là input có kiểu (UUID/date), không bao giờ nối chuỗi vào query; scope do backend quyết, client chỉ thu hẹp thêm.
2. **TB-2 (Controller → Service):** `POST /api/seaport-throughput/{id}/approve` — sau `@PreAuthorize("hasAuthority('seaportthroughput:approve')")`, service phải kiểm tra **trên bản ghi**: (a) bản ghi tồn tại & `org_unit_id` nằm trong subtree phạm vi user đang gọi, (b) trạng thái đúng = `PENDING_APPROVAL`, (c) 4-eyes: user ≠ `submitted_by`/`created_by`, (d) ghi `approved_l1_*` + audit. Đây là nơi duy nhất được phép quyết định chuyển trạng thái — controller không được tự set `approval_status`.
3. **TB-3 (Service → DB):** Mọi query đọc entity qua Hibernate phải nằm dưới `@DataScope` (controller class-level) để `DataScopeAspect` bật global filter `orgUnitFilter` (`org_unit_id IN (:orgUnitIds)`). Query dùng native SQL / `JdbcTemplate` / entity-graph / subquery sẽ **vô hiệu hóa filter** → phải scope thủ công hoặc cấm. Ghi: service gọi `OrgUnitScopeService.Scope.allows(...)` trước insert/update; `org_unit_id` NOT NULL.
4. **TB-4 (Upload/Import → File store):** `POST /api/seaport-throughput/import` + `POST /{id}/files` — luồng byte không tin cậy từ file Excel/đính kèm đi vào parser + storage; phải sanitize filename, sinh tên lưu trữ ngẫu nhiên, giới hạn kích thước, allowlist extension, không đặt file vào thư mục web thực thi được. Mỗi dòng import phải được validate scope riêng (xem T-05).
5. **TB-5 (Download → Browser):** `GET` file đính kèm — endpoint phải đòi quyền (`read`/`update` theo thao tác) và **re-check DataScope theo `throughput_id` cha**; không được phục vụ file qua static resource handler (bỏ qua filter + authz).
6. **TB-6 (Audit):** Mọi chuyển trạng thái/sửa/xóa/upload/import ghi `operatorId` + lý do (từ chối) vào `infrastructure_history` (append-only); `GET /{id}/history` phải đòi `read` + scope — lịch sử chứa danh tính người duyệt (nhạy cảm, Admin Cục mới thấy metadata mở rộng).

## 3. Findings (threat model — thiết kế, chưa phải lỗi code)

| ID | Domain | Threat / Finding | Severity | Evidence (spec) | Security requirement (cho implementer) |
|---|---|---|---|---|---|
| T-01 | Authorization (endpoint) | Endpoint thiếu `@PreAuthorize` đúng permission → chuyên viên gọi thẳng `approve`/`approve_level2`/`reject`, hoặc permission không được seed trong `PermissionSeeder` → mọi user (trừ ROLE_SYSTEM_ADMIN) 403 hoặc — tệ hơn — quyền bị gán sai nhóm | **High** | Lean-spec §5 (9 permission, resource chuẩn `seaportthroughput`); feature-brief §4.4/§6; AGENTS.md "Permission Registration" | Mỗi endpoint khai đúng 1 permission theo bảng §5; mọi action mới đăng ký `seedPermission(...)` trong `run()`; matrix thao tác×vai trò (brief §4.4 / lean-spec §5) là nguồn chốt; permission string thống nhất 1 nguồn hằng số, không hardcode rải rác |
| T-02 | Authorization (record-level) | Chỉ lọc ở tầng list, còn endpoint `{id}` (detail/history/files/reject) không kiểm tra bản ghi thuộc subtree user → **IDOR cross-đơn vị**: user Cảng vụ A đọc/duyệt/xóa bản ghi đơn vị B bằng cách đoán UUID | **High** | Lean-spec §6 (DataScope theo subtree, chiều GHI validate `OrgUnitScopeService`); approval spec §3.8 | Mọi endpoint `{id}` (kể cả history, file download, approve/reject) phải resolve entity qua repository có filter `orgUnitFilter` đang bật HOẶC kiểm tra tường minh `Scope.allows(record.orgUnitId)` trước khi thao tác; không tin object tồn tại = được phép |
| T-03 | DataScope (chiều ghi) | Gán `org_unit_id` từ client tùy ý / để NULL / đổi được khi sửa → dữ liệu lọt ra ngoài phạm vi hoặc mất khỏi mọi scope (NULL = 0 bản ghi hiển thị). Lỗi lịch sử đã gặp: Buoy/BeaconLight/Coastal station, ShipRepairFacility (docs/intel/data-scope-gap-report.md) | **High** | Lean-spec §6 + BR-SLCB-02/11 + §8 validation (`org_unit_id` bắt buộc, không đổi khi sửa); AGENTS.md Data Scope Convention | Create: gán = đơn vị user (fallback) hoặc chọn trong phạm vi, validate `Scope.allows` trước lưu, DB NOT NULL + CHECK không cho NULL; Edit: `org_unit_id` không nhận từ request (giữ nguyên bản ghi cũ); Import: **từng dòng** phải trong phạm vi |
| T-04 | 4-eyes / State machine | Người kê khai tự duyệt bản ghi mình (kiểm tra ở UI, bỏ qua ở API) hoặc chuyển trạng thái sai thứ tự / nhảy vòng / hạ về `DRAFT`; TOCTOU: 2 request approve đồng thời trên cùng bản ghi → double-approve | **High** | Lean-spec §4 (bảng chuyển trạng thái, "mỗi dòng = 1 test case"), BR-SLCB-06/07/12/13/14; approval spec §3.2/§3.3 (quy tắc 4, 8, 14) | 4-eyes so sánh **user hiện tại vs `created_by`/`submitted_by`** ở service (không chỉ UI); transition chỉ qua 1 service chuẩn (`assertTransitionable` + `@Version` optimistic lock hoặc `UPDATE ... WHERE approval_status = :expected`); cấm controller tự set status; re-submit từ `REJECTED_LEVEL1/2` chỉ khi đã sửa; từ chối bắt buộc lý do ≥ 10 ký tự (quy tắc 5) |
| T-05 | DataScope (import) | Import Excel nhận cột "Đơn vị quản lý" và tạo/sửa bản ghi cho đơn vị ngoài phạm vi user, hoặc import đè lên bản ghi `APPROVED`/đang `PENDING_APPROVAL` | **High** | BR-SLCB-09 (validate cột; dòng lỗi rõ; không ghi nửa chừng), UC-SLCB-08; approval spec §3.2 (không nhảy vòng) | Mỗi dòng import: map đơn vị qua cây OrgUnit (không nhận tên tự do — BR-11) → `Scope.allows`; chỉ áp dụng cho bản ghi `DRAFT`/`REJECTED_*`; trùng (đơn vị, tháng) → lỗi theo dòng; commit nguyên khối hoặc báo cáo lỗi theo dòng theo quyết định SA (đang UNRESOLVED) — cấm trạng thái nửa chừng mơ hồ |
| T-06 | File upload (storage) | Upload file độc hại: tên chứa `../` (path traversal), extension nguy hiểm (.jsp/.html), kích thước lớn (DoS), nội dung không đúng loại khai báo; file lưu trong webroot thực thi được | **High** | Lean-spec §3.2 (`seaport_throughput_file`: `file_name`, `file_path`/blob ref); feature-brief §2 trường 29 + §7 | Tên lưu trữ = UUID ngẫu nhiên do server sinh (giữ `file_name` gốc chỉ ở DB); whitelist extension theo URD (xlsx/pdf/doc…); cap kích thước (vd 10 MB/file — SA chốt); lưu ngoài webroot/object store không thực thi; download qua endpoint có authz + scope (không static serve); xóa file chỉ khi bản ghi chưa ban hành (UC-SLCB-09) |
| T-07 | Excel import (parser) | File `.xlsx` là ZIP độc hại: zip-bomb, quá nhiều sheet/dòng (DoS parser), macro/ô chứa công thức nguy hiểm (formula injection khi xuất lại), header sai cột → ghi sai số liệu | Medium | BR-SLCB-09; UC-SLCB-08; feature-brief §6 `POST /api/seaport-throughput/import` | Chỉ nhận `.xlsx` (không macro `.xlsm`); giới hạn tổng dung lượng giải nén/số dòng/sheet (Apache POI `XSSFWorkbook` + kiểm tra entry count/uncompressed size); khớp header theo đúng danh sách cột §2; không export lại nội dung ô dạng formula từ input (write values) |
| T-08 | Audit / non-repudiation | Thiếu ghi nhận operator ở một số thao tác (import, xóa file, sửa sau ban hành) → không truy vết được ai đưa số liệu chính thức sai; history ghi đè/sửa xóa được; `GET /history` lộ danh tính người duyệt ngoài phạm vi | Medium | BR-SLCB-10; lean-spec §10; approval spec §3.5/§3.6 | Mọi mutation truyền đủ `operatorId/updatedBy/deletedBy` (bao gồm `ApprovalHistoryUtils.recordSoftDelete`); history append-only (không UPDATE/DELETE dòng); chỉ ghi `infrastructure_history` theo đúng quy tắc approval spec §3.5 (không trùng lặp dòng chuyển trạng thái); endpoint history: quyền `read` + DataScope |
| T-09 | Concurrency / toàn vẹn số liệu | 2 user submit/import cùng lúc cho cùng (đơn vị, tháng) → 2 bản ghi `APPROVED` (vi phạm BR-SLCB-01/03) hoặc unique race ở DB | Medium | BR-SLCB-01/03; lean-spec §3.1 unique `(org_unit_id, report_month)` | DB unique constraint dạng partial `UNIQUE (org_unit_id, report_month) WHERE deleted_at IS NULL` (soft-delete không chặn tái tạo); xử lý lỗi → message tiếng Việt chuẩn (BR-01) |
| T-10 | State machine (resubmit cấp Cục) | Theo bảng chuyển trạng thái chung, re-submit từ `REJECTED_LEVEL2` luôn về `PENDING_APPROVAL` (vòng 1) — nhưng bản ghi do user cấp Cục tạo (BR-13) không có Cảng vụ/Chi cục để duyệt vòng 1 → hồ sơ kẹt vĩnh viễn | Medium | Lean-spec §4 (dòng `REJECTED_LEVEL2 → PENDING_APPROVAL`); BR-SLCB-13; approval spec §3.2 (re-submit vào vòng 1 "đã chốt") | Đích re-submit phải tính theo `OrgUnit.level` của người gửi như submit lần đầu (cấp Cục → `APPROVED_LEVEL1` chờ C2); bổ sung test case; SA chốt trước khi scaffold |
| T-11 | Sensitive metadata (Admin Cục) | DTO trả về thừa metadata nhạy cảm (created_by/updated_by, nội dung phê duyệt) cho user thường; hoặc Admin Cục không thấy được phần mở rộng → sai nguyên tắc phân quyền thông tin | Low | Lean-spec §5 (Admin Cục xem thêm metadata; approval spec §3.7 view_sensitive); §9 UI (nội dung phê duyệt chỉ ở Detail) | Tách DTO: `response` chuẩn (không `createdBy/updatedBy`) vs DTO mở rộng chỉ trả khi user có quyền Admin Cục (`admin:all`/`orgunit:scope_all`); không dùng chung 1 entity serialize thẳng ra JSON |
| T-12 | Authn/CSRF & transport | Nếu phiên dùng cookie (không phải JWT header) mà thiếu CSRF token → state-changing bị CSRF; không có HTTPS ở môi trường triển khai | Low | Feature brief §5 dòng 6 ("không có đường dùng chung không cần đăng nhập") | Giữ cơ chế authn hiện có của dự án (JWT/security filter chuẩn); nếu cookie session → bật CSRF cho POST/PUT/DELETE; production bắt buộc TLS; không thêm endpoint public |
| T-13 | Input validation & encoding | `note`, `file_name`, `rejection_reason`, nội dung import không trim/không kiểm tra độ dài; hiển thị lại nội dung Excel mà không encode (React tự escape nhưng HTML/rich text nếu dùng `dangerouslySetInnerHTML` sẽ XSS) | Low | BR-SLCB-15 (trim); §8 validation; approval spec §3.4 (lý do ≥ 10 ký tự) | Validate server-side (length, trim, ≥0 cho DECIMAL, month hợp lệ); không dùng `dangerouslySetInnerHTML`; không xuất nội dung ô Excel dạng formula ra UI/report |

## 4. Compliance considerations

| Standard / Policy | Requirement | Status | Gap |
|---|---|---|---|
| OWASP Top 10:2021 A01 Broken Access Control | Endpoint + record-level authz, DataScope, 4-eyes | Design đã đặc tả (lean-spec §4–§6); chưa có code | T-01 → T-05 phải đóng ở implementation + security review |
| OWASP Top 10:2021 A04 Insecure Design | State machine đóng 7 trạng thái, không nhảy vòng, không tự duyệt | Design đã đặc tả (lean-spec §4, approval spec §3.1–§3.3) | T-04, T-10 (resubmit cấp Cục) |
| OWASP Top 10:2021 A08 Software & Data Integrity | Import Excel + upload file không tin cậy; audit không thể chối bỏ | Design yêu cầu sanitize + append-only | T-06 → T-08; chưa có cơ chế quét malware của nền tảng — SA xác nhận có/không |
| AGENTS.md Data Scope Convention (quyết định 2026-08-20) | Entity có `org_unit_id` NOT NULL + `@Filter(orgUnitFilter)`; controller `@DataScope`; GHI validate `OrgUnitScopeService`; migration kèm backfill | Lean-spec §6 tuân thủ đầy đủ; exception: **không có** | Theo dõi ở review: mọi query native/join có filter không; backfill khi migration |
| AGENTS.md Permission Registration | Mọi permission mới seed trong `PermissionSeeder.run()` | Lean-spec §5 liệt kê 9 action | Identifier chưa chốt (xem §8) — seed sai tên = 403 toàn module |
| approval-2-level-spec §3.7 (DP-10) | Granularity resource đã chốt: dùng chung `kcht` + 9 action | **Xung đột** với lean-spec §5 (`seaportthroughput:*`) — cần SA phân định phạm vi DP-10 (28 loại KCHT asset) vs bản ghi số liệu M-028 | §8 OR-01 |
| URD MTIS VMD III.7.53/54 (UC #148/#149) | Số liệu ban hành là nguồn chính thức; lịch sử hình thành + phê duyệt truy vết được | Design: `APPROVED` khóa sửa (BR-05); metadata + history | T-08 (audit) |

## 5. Must-fix items (security requirements — implementer phải thỏa trước/sau scaffold)

| ID | Finding | Owner | Expected evidence | Closure criteria |
|---|---|---|---|---|
| M-01 | T-01/T-02 — Endpoint + record-level authz, DataScope mọi endpoint `{id}` | engineering-backend-developer | Controller: `@PreAuthorize` mỗi endpoint + `@DataScope` class-level; service gọi `OrgUnitScopeService.requireOrganizationInScope(...)` trên detail/approve/reject/file/history | Test 403 khi user thiếu permission; test IDOR: user đơn vị A không đọc/duyệt/sửa/xóa được bản ghi đơn vị B (kể cả qua `{id}` trực tiếp và `/history`, `/files`) |
| M-02 | T-03 — Ghi đúng & không NULL `org_unit_id` | engineering-backend-developer | Create gán đơn vị từ user/validate scope; Edit không nhận `orgUnitId` từ request; DB NOT NULL | Test tạo với `org_unit_id` ngoài phạm vi → 4xx "Đơn vị quản lý nằm ngoài phạm vi được phép"; không tồn tại bản ghi NULL; migration có backfill |
| M-03 | T-04 — 4-eyes + state machine server-side + chống TOCTOU | engineering-backend-developer | So user hiện tại vs `created_by`/`submitted_by`; transition qua 1 service chuẩn; optimistic lock/conditional UPDATE; reject ≥ 10 ký tự | Test người kê khai tự approve → 4xx "Người kê khai không được tự phê duyệt bản ghi của mình"; approve 2 request song song → đúng 1 lần chuyển trạng thái; mọi chuyển trạng thái đúng bảng lean-spec §4 |
| M-04 | T-05 — Import validate scope từng dòng + không đụng bản ghi đã ban hành/đang duyệt | engineering-backend-developer | Mỗi dòng: map OrgUnit qua cache → `Scope.allows`; chỉ ghi vào `DRAFT`/`REJECTED_*`; unique (đơn vị, tháng) | Test file import chứa đơn vị ngoài phạm vi → dòng đó báo lỗi, không ghi; không đè được bản ghi `APPROVED`/`PENDING_APPROVAL` |
| M-05 | T-06 — File upload/download an toàn | engineering-backend-developer | Tên lưu UUID, whitelist extension, cap size, storage ngoài webroot, download có authz + scope | Test upload tên `../x`/`.jsp` → từ chối; download file bản ghi ngoài phạm vi → 403; xóa file bản ghi đã ban hành → từ chối |
| M-06 | Permission identifier chốt trước scaffold (OR-01/OR-02 §8) | engineering-system-architect | Quyết định resource: `seaportthroughput` (lean-spec §5) hay `kcht` (approval spec §3.7 DP-10); cập nhật feature-brief §4.4/§6 cho hết `seaport-throughput` | 1 chuỗi duy nhất dùng cho `@PreAuthorize` + `PermissionSeeder` + frontend `hasPermission`; grep toàn repo không còn chuỗi gạch nối lạc |

## 6. Should-fix items

| ID | Finding | Risk if deferred | Priority |
|---|---|---|---|
| S-01 | T-07 — Excel parser hardening (zip-bomb, sheet/dòng cap, header khớp) | DoS parser / ghi sai số liệu do sai cột | High |
| S-02 | T-09 — DB partial unique `(org_unit_id, report_month) WHERE deleted_at IS NULL` | 2 bản ghi ban hành cùng (đơn vị, tháng) → số liệu chính thức trùng/không nhất quán | High |
| S-03 | T-08 — Audit append-only + đủ operator mọi mutation; endpoint history scope | Không truy vết được nguồn số liệu sai khi thanh tra; lộ metadata | Medium |
| S-04 | T-10 — Re-submit cấp Cục về `APPROVED_LEVEL1` (theo `OrgUnit.level`) | Hồ sơ cấp Cục bị từ chối cấp 2 sẽ kẹt vĩnh viễn ở `PENDING_APPROVAL` | Medium |
| S-05 | T-11 — Tách DTO chuẩn vs DTO Admin Cục (không leak `created_by`/`updated_by`) | Lộ metadata nhạy cảm cho user thường | Medium |
| S-06 | T-12/T-13 — CSRF nếu cookie session; trim + length check; cấm `dangerouslySetInnerHTML` | XSS/CSRF tiềm năng ở màn chi tiết/import | Low |

## 7. Kết luận

- Thiết kế đặc tả M-028/F-301 đã phủ đúng 4 trụ security của module: authz theo permission
  (`seaportthroughput:*`), DataScope theo đơn vị (gán/validate, cấm NULL, subtree), phê duyệt
  2 cấp + 4-eyes, file/import upload. Không phát hiện thiếu sót thiết kế nghiêm trọng trong
  specification; các mục T-01…T-13 là **yêu cầu security implementer phải thỏa**, không phải
  lỗi code hiện hữu (chưa có code).
- Hai quyết định thiết kế **bắt buộc SA chốt trước scaffold** (xem §8): chuỗi permission
  resource, và đích re-submit cho bản ghi cấp Cục (BR-13 × bảng chuyển trạng thái chung).
- Security review (lượt `review`, file `06-security-review.md`) sẽ kiểm chứng các closure
  criteria M-01…M-05 trên code thật.

## 8. Intel-drift & open items cho SA

| ID | Vấn đề | Trạng thái |
|---|---|---|
| OR-01 | Resource permission: feature-brief §4.4/§6 ghi `seaport-throughput` (gạch nối); lean-spec §5 chốt `seaportthroughput`; approval spec §3.7 DP-10 chốt granularity dùng chung `kcht` + 9 action ("endpoint mới dùng `kcht:*`") | UNRESOLVED — SA phân định phạm vi DP-10 (28 loại hồ sơ KCHT asset) có áp dụng cho bản ghi số liệu thống kê M-028 hay không; chốt 1 chuỗi trước khi scaffold (M-06) |
| OR-02 | Luồng "Lưu và phê duyệt trực tiếp từ cấp Cục" (approval spec §3.5: 1 user tự ghi `approverLevel1` + `approverLevel2`) — M-028 lean-spec KHÔNG đưa luồng này (giữ submit → Lãnh đạo Cục duyệt, 4-eyes vẹn toàn) | M-028 giữ nguyên 4-eyes; implementer KHÔNG được tự áp dụng §3.5 cho module này (vi phạm BR-SLCB-07) |
| OR-03 | Import: all-or-nothing vs báo cáo lỗi theo dòng (BR-SLCB-09, lean-spec §11 #6) | UNRESOLVED — SA chốt; cả 2 phương án đều phải giữ "không ghi nửa chừng" + validate scope từng dòng |
| OR-04 | Quét malware file upload: nền tảng có service scan sẵn không | SA xác nhận; nếu không có, ghi rõ giới hạn (whitelist + size cap) trong design |
| Intel note | Tier-1: `actor-registry.json`, `sitemap.json` tồn tại (actor generic — không có slug chi tiết Admin Cục/Lãnh đạo…); `permission-matrix.json`, `integrations.json`, `data-model.json`, `security-design.json` **không tồn tại** trong `docs/intel` | Không thể đối chiếu permission matrix ở design pass — chuyển sang review pass (đối chiếu `PermissionSeeder` + DB) |

## 9. Tài liệu tham chiếu

- `docs/modules/M-028-san-luong-cang-bien/ba/00-lean-spec.md` (223 dòng) — §4 trạng thái, §5 phân quyền, §6 DataScope, §7 BR-SLCB-01…15, §8 validation
- `docs/modules/M-028-san-luong-cang-bien/_features/F-301-san-luong-cang-bien/feature-brief.md` (250 dòng) — §2 file đính kèm, §3 phê duyệt, §4.4 phân quyền, §6 API, §7 schema
- `docs/conventions/approval-2-level-spec.md` (241 dòng) — §3.1 7 trạng thái, §3.2 2 vòng + level, §3.3 4-eyes, §3.4 lý do từ chối, §3.5 audit/direct-approve, §3.6 soft-delete, §3.7 DP-10, §3.8 data scope
- `AGENTS.md` — Data Scope Convention, Permission Registration, mô hình phân quyền động
- `docs/intel/actor-registry.json`, `docs/intel/sitemap.json` (Tier-1 intel; permission-matrix không tồn tại)
- `docs/intel/data-scope-gap-report.md` (lỗ hổng lịch sử: NULL org_unit_id, ghi ngoài phạm vi)
