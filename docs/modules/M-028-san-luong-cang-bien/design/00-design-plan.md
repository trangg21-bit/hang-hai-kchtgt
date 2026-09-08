# Design Plan — Module M-028 "Sản lượng cảng biển" / Feature F-301 `seaport_throughput`

- **Module:** M-028 `san-luong-cang-bien` — **Feature:** F-301 `seaport_throughput`
- **Seat:** engineering-solution-designer — **Ngày:** 2026-09-06
- **Nguồn:** `ba/00-lean-spec.md` (9 use cases, domain model, BR-SLCB-01..15), `_features/F-301-san-luong-cang-bien/feature-brief.md` (29 trường STT 1–29), `module-brief.md`, `docs/conventions/approval-2-level-spec.md`, AGENTS.md (DataScope / PermissionSeeder / FieldNameConstants / UI token convention).
- **Stack (đã kiểm chứng trong repo):** Spring Boot (`src/main/java/com/hanghai/kchtg/**`, Maven), React + AntD (`frontend/src/**`). Mọi identifier kỹ thuật (package, class, cột DB, field, tên biến) = **tiếng Anh chuẩn**; message/giao diện = **tiếng Việt có dấu**.

---

## 1. Quyết định thiết kế (SA chốt — giải quyết các mục chờ SA của BA)

| # | Quyết định | Lựa chọn | Lý do / bằng chứng | Loại bỏ |
|---|---|---|---|---|
| DP-1 | Entity riêng hay tái dùng legacy | **Entity riêng** `SeaportThroughput` trong **package mới `com.hanghai.kchtg.seaportthroughput`** (entity/dto/repository/service/controller — cấu trúc 5 thư mục như `navigationchannel/`, `shipportcall/`) | `com.hanghai.kchtg.statistics` chứa service legacy của module Thống kê chuyên đề (M-017, đã sealed) — nơi **tiêu thụ** số liệu (báo cáo khối lượng F-165/166/168/169), không phải nơi kê khai nguồn. Lean-spec §11 mục 2 + module-brief + intake đều đề xuất entity riêng. M-017 bị seal: tuyệt đối không mở rộng package legacy. | Tái dùng `statistics/PortThroughputService`, `CargoVolumeService`, `StatisticsForm` |
| DP-2 | Base class entity | `SeaportThroughput extends BaseApprovableEntity` (`common/entity/BaseApprovableEntity.java:46`) + `@Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")` trên class | Precedent chuẩn: `NavigationChannel extends BaseApprovableEntity` (`navigationchannel/entity/NavigationChannel.java:28,35`). Kế thừa trọn bộ cột approval 2 cấp + audit (`BaseEntity`): `approval_status` (SMALLINT ORDINAL, `@PrePersist` mặc định `DRAFT`), `submitted_at/by`, `approver_level1/2`, `approved_date_level1/2`, `level1/2_approval_content` (VARCHAR 2000), `rejection_reason` (500), `created_by/at`, `updated_by/at`, `deleted_by/at`, `org_unit_id`, `province_id`, `spatial_id`. | Tự khai báo lại ~15 cột approval (lệch M-1006, vỡ `ApprovableEntity` → không dùng được shared `InfrastructureApprovalService`) |
| DP-3 | Schema số liệu | **24 cột DECIMAL cố định + `passenger_trips`** (phẳng, 1:1 Excel cụm #33 / URD III.7.53), không bảng con `throughput_detail` | Chốt theo lean-spec §3.1/§11 mục 1: form Excel cố định 3 nhóm × 8 chỉ tiêu; import Excel không cần normalize; unique nghiệp vụ `(org_unit_id, report_month)`. Bảng con 8 dòng × 3 nhóm chỉ lợi khi tuyến mở rộng động — ngoài yêu cầu hiện tại. | `throughput_detail(route_type, cargo_type, ton, ton_km)` |
| DP-4 | Enum trạng thái | Dùng **enum dùng chung `ApprovalStatus`** (`common/entity/ApprovalStatus.java:10`): `DRAFT(0)`, `PENDING_APPROVAL(2)`, `APPROVED_LEVEL1(3)`, `APPROVED(5)` (= Ban hành), `REJECTED_LEVEL1(8)`, `REJECTED_LEVEL2(9)`, `ARCHIVED(7)` — lưu `SMALLINT` qua `@Enumerated(EnumType.ORDINAL)`; KHÔNG tạo enum riêng của module | Tên draft trong F-301 §3 (`PENDING_L1`/`PENDING_L2`, `REJECTED`) là đề xuất BA → **thay thế**: `PENDING_L1`→`PENDING_APPROVAL`, `PENDING_L2`→`APPROVED_LEVEL1`, từ chối = `REJECTED_LEVEL1`/`REJECTED_LEVEL2`. `fromString()` sẵn sàng alias `APPROVED_L1/L2`, `REJECTED_L1/L2` (payload đã đọc). `PROPOSED(1)`, `APPROVED_LEVEL2(4)`, `REJECTED(6)` là legacy — module không dùng. | Enum riêng, lưu VARCHAR, chuỗi hardcode |
| DP-5 | Resource + URL | Resource permission **`seaportthroughput`** (không gạch nối) — 9 action; REST base **`/api/v1/seaport-throughput`** (kebab) | Resource chuẩn theo lean-spec §5/§11 mục 3 + triage + module-brief (class `SeaportThroughput`). URL theo kebab-case như `NavigationChannelController` (`@RequestMapping("/api/v1/navigation-channel")`, `navigationchannel/controller/NavigationChannelController.java:29-34`). 9 action theo lean-spec §5: `read, create, update, delete, submit, import, approve, approve_level2, reject` — khác style `navigationchannel:approvec1/approvec2` vì M-028 sở hữu taxonomy riêng (không phải 28 loại KCHT dùng chung resource `kcht` theo approval-2-level-spec §3.7). | `/api/seaport-throughput` (bỏ `v1`), resource `seaport-throughput` (gạch nối), `approvec1/approvec2` |
| DP-6 | DataScope | `org_unit_id UUID NOT NULL`; entity `@Filter(orgUnitFilter)`; controller class-level `@DataScope` (`security.annotation.DataScope`); chiều tạo gán đơn vị = user thao tác (fallback) hoặc chọn trong phạm vi; **chiều ghi validate** `OrgUnitScopeService` trước khi lưu; response trả `orgUnitId` + `orgUnitName` (map `OrgUnitCacheService`); mọi luồng thêm/sửa/xóa/duyệt/từ chối gọi `orgUnitCacheService.evictAfterCommit()` | AGENTS.md Data Scope Convention + lean-spec §6: không ngoại lệ — kể cả báo cáo downstream đọc theo phạm vi user. Ngoại lệ §7 mục 3 feature-brief = "không". `OrgUnitScopeService` tại `orgunit/service/OrgUnitScopeService.java:28`, `OrgUnitCacheService` tại `orgunit/service/OrgUnitCacheService.java:25`. | Cho `org_unit_id` NULL, gán unit ngoài phạm vi, bỏ filter |
| DP-7 | File đính kèm | **Bảng con riêng `seaport_throughput_file`** (entity `SeaportThroughputFile extends BaseEntity` — không kế thừa approval) theo lean-spec §3.2 / F-301 STT 29 | Spec chốt bảng con (`throughput_id` FK, `file_name`, `file_path`…). Lịch sử thao tác file sau khi `APPROVED` vẫn ghi vào **bảng tập trung `infrastructure_history`** (không tạo bảng lịch sử riêng) — xem DP-8. | Tái dùng `InfrastructureAttachment` trung tâm (gắn taxonomy KCHT asset — throughput là bản ghi số liệu, không phải tài sản GIS) |
| DP-8 | Kiểm toán & phê duyệt | Tái dùng hạ tầng dùng chung: `common/service/InfrastructureApprovalService.java` (`submit`, `approveC1` L40/L116, `approveC2` L161, `assertEditable` L233, `assertDeletable` L290, `recordSaveAndApprove` L338 — tất cả nhận `ApprovableEntity`, `common/entity/ApprovableEntity.java`), `ApprovalHistoryUtils` (soft delete + history); lịch sử ghi bảng tập trung `infrastructure_history` qua `refType`; **bổ sung 1 member `SEAPORT_THROUGHPUT` vào enum `InfrastructureType`** (`gis/search/dto/InfrastructureType.java`) | `NavigationChannelService` truyền `InfrastructureType.NAVIGATION_CHANNEL` cho submit/history/attachment (`navigationchannel/service/NavigationChannelService.java:152,160,313,448`). Enum phẳng đã chứa member phi-GIS (`LEGAL_DOCUMENT`, `AIS_SYSTEM`, `VTS_ASSIST`, `CCTV`…) → thêm member là additive, converter `StringToInfrastructureTypeConverter` chỉ map chuỗi request, `KchtGis155Service` duyệt theo type được request (không duyệt `values()` toàn bộ) → không ảnh hưởng GIS search. Không tạo bảng lịch sử riêng (cấm theo lean-spec §10). | Bảng history riêng; dùng `ref_type NULL`; sửa luồng GIS search |
| DP-9 | Import Excel + ràng buộc | Import = **báo lỗi theo dòng, không ghi nửa chừng** (BR-SLCB-09); unique `(org_unit_id, report_month)` enforce cả DB lẫn service (BR-SLCB-01); 24 cột DECIMAL ≥ 0 mặc định 0; `passenger_trips` BIGINT ≥ 0; text `.trim()` trước khi lưu/lọc (BR-SLCB-14/15) | Lean-spec §7/§8/§11 mục 6. Message tiếng Việt theo §8: "Đã tồn tại số liệu sản lượng của đơn vị trong tháng này", "Giá trị không được nhỏ hơn 0"… | Import all-or-nothing, ghi nửa chừng |
| DP-10 | Bản ghi cấp Cục & thời điểm khóa | Người thuộc đơn vị cấp Cục submit thẳng tới `APPROVED_LEVEL1` (bỏ vòng 1) theo `OrgUnit.level` (BR-SLCB-13/lean §11 mục 7); khóa sửa khi `APPROVED` (kể cả `report_month`, org — disabled), chỉ còn luồng theo dõi/phê duyệt (BR-SLCB-04/05, §11 mục 4) | Quy tắc chung approval-2-level-spec §3 đã chốt; `InfrastructureApprovalService.submit/approveC1` xử lý theo trạng thái hiện tại + `OrgUnit.level`. | Cho sửa thoải mái sau ban hành |

**Reconcile chuỗi định danh (BA UNRESOLVED đã chốt):** permission/resource/`@PreAuthorize` = `seaportthroughput:*` (không gạch nối, lean-spec §5/§11 mục 3); URL path = `/api/v1/seaport-throughput`; class/entity/table = `SeaportThroughput` / `seaport_throughput`.

---

## 2. Mô hình dữ liệu

### 2.1 `SeaportThroughput` → bảng `seaport_throughput` (1 dòng = 1 đơn vị × 1 tháng)

Kế thừa `BaseApprovableEntity` → cột gồm **khối base** (sao chép đúng khối base trong `V20260830000000__create_ship_repair_yards.sql` L15-19/L35: `org_unit_id`, `province_id`, `approval_status SMALLINT NOT NULL DEFAULT 0`, `spatial_id`, `id`; thêm `NOT NULL` cho `org_unit_id`) + khối riêng:

| Nhóm | Cột (EN — chuẩn) | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|
| Định danh nghiệp vụ | `org_unit_id` | `UUID NOT NULL` | Đơn vị quản lý (DataScope); index + unique |
| | `report_month` | `DATE NOT NULL` | Chỉ lưu ngày đầu tháng `YYYY-MM-01`; unique `(org_unit_id, report_month)` |
| | `note` | `TEXT NULL` | Ghi chú (STT 3), trim |
| 24 chỉ tiêu DECIMAL | `domestic_container_ton`, `domestic_container_ton_km`, `domestic_dry_ton`, `domestic_dry_ton_km`, `domestic_liquid_ton`, `domestic_liquid_ton_km`, `domestic_other_ton`, `domestic_other_ton_km` (STT 4–11); `foreign_*` cùng 8 tên (STT 12–19); `route_*` cùng 8 tên (STT 20–27) | `NUMERIC(18,2) NOT NULL DEFAULT 0` | Số ≥ 0; cấm NULL (mặc định 0). Cargo order cố định: container → dry → liquid → other, mỗi loại cặp `(ton, ton_km)` |
| Hành khách | `passenger_trips` | `BIGINT NOT NULL DEFAULT 0` | Số nguyên ≥ 0 (STT 28) |
| Approval (kế thừa) | `approval_status`, `submitted_at`, `submitted_by`, `approver_level1`, `approved_date_level1`, `level1_approval_content`, `approver_level2`, `approved_date_level2`, `level2_approval_content`, `rejection_reason` | theo `BaseApprovableEntity` | KHÔNG tạo lại cột — tên canonical của base thay thế tên đề xuất `approved_l1_at/…` trong brief §7 |
| Base (kế thừa, không dùng) | `province_id INTEGER NULL`, `spatial_id UUID NULL` | NULL | M-028 không phải tài sản GIS — chấp nhận 2 cột NULL do kế thừa base (giống mọi entity `extends BaseApprovableEntity`); ghi chú trong entity Javadoc |
| Audit | `created_by`, `created_at`, `updated_by`, `updated_at`, `deleted_by`, `deleted_at` | BaseEntity | — |

Lombok: `@Getter @Setter @NoArgsConstructor @AllArgsConstructor @SuperBuilder @FieldNameConstants` (bắt buộc — AGENTS.md), `@EqualsAndHashCode(callSuper = false)` như base; mọi tham chiếu tên field dùng `SeaportThroughput.Fields.*` (KHÔNG hardcode chuỗi thuộc tính), mọi so sánh enum dùng `ApprovalStatus.X` (KHÔNG hardcode chuỗi trạng thái). Kiểu trạng thái: `@Enumerated(EnumType.ORDINAL) @Column(columnDefinition = "SMALLINT")` (kế thừa base).

### 2.2 `SeaportThroughputFile` → bảng `seaport_throughput_file` (bảng con)

`extends BaseEntity` (chỉ audit), không approval:

| Cột | Kiểu / ràng buộc |
|---|---|
| `id` | `UUID PK` |
| `throughput_id` | `UUID NOT NULL` → `REFERENCES seaport_throughput(id)` (`ON DELETE CASCADE`) — index |
| `file_name` | `VARCHAR(255) NOT NULL` (trim; hiển thị trên UploadFileTable STT + Tên file) |
| `file_path` | `VARCHAR(1000) NOT NULL` (đường dẫn/token file đã lưu theo cơ chế storage hiện có của project) |
| `file_size` | `BIGINT NULL` (bytes) |
| `file_type` | `VARCHAR(100) NULL` (MIME) |
| `created_by`, `created_at` | BaseEntity (cán bộ upload) |

Quyền thao tác file: xóa/upload theo đúng policy sửa bản ghi (chỉ khi chưa ban hành, hoặc qua luồng lưu & ban hành lại khi `APPROVED` — ghi `infrastructure_history`); xóa file soft chỉ là xóa dòng con.

### 2.3 Trạng thái & chuyển trạng thái (canonical, 7 trạng thái module dùng)

| Trạng thái | Ordinal | Nhãn hiển thị module | Chuyển tới |
|---|---|---|---|
| `DRAFT` | 0 | Lưu tạm | `PENDING_APPROVAL` (gửi duyệt), `ARCHIVED` (xóa mềm) |
| `PENDING_APPROVAL` | 2 | Chờ Cảng vụ/Chi cục duyệt | `APPROVED_LEVEL1` (C1 đồng ý) / `REJECTED_LEVEL1` (C1 từ chối) |
| `APPROVED_LEVEL1` | 3 | Chờ Cục duyệt | `APPROVED` (C2 ban hành) / `REJECTED_LEVEL2` (C2 từ chối) |
| `REJECTED_LEVEL1` | 8 | Từ chối Cảng vụ/Chi cục | `PENDING_APPROVAL` (sửa + gửi lại) |
| `REJECTED_LEVEL2` | 9 | Từ chối Cục | `PENDING_APPROVAL` (sửa + gửi lại) |
| `APPROVED` | 5 | **Ban hành** | chỉ luồng theo dõi/`recordSaveAndApprove` |
| `ARCHIVED` | 7 | Đã xóa (Lịch sử) | — (chỉ từ `DRAFT`) |

Bất biến (approval-2-level-spec §3 + lean §4): đúng thứ tự 2 vòng; cấp Cục kê khai → submit thẳng `APPROVED_LEVEL1` (BR-SLCB-13); **4-eyes** — người kê khai không tự duyệt (guard trong service; message "Người kê khai không được tự phê duyệt bản ghi của mình"); từ chối bắt buộc lý do (message "Vui lòng nhập lý do từ chối"); không hạ hồ sơ về `DRAFT` sau khi đã gửi; chỉ xóa khi `DRAFT` (`assertDeletable`); không ghi dòng chuyển trạng thái trùng lặp vào `infrastructure_history` (metadata trên entity là nguồn); sau `APPROVED`, thay đổi dữ liệu/file ghi `infrastructure_history` (trước/sau).

---

## 3. REST API (backend)

Base: `/api/v1/seaport-throughput` — controller `SeaportThroughputController` đặt `@RestController @RequestMapping("/api/v1/seaport-throughput") @RequiredArgsConstructor @DataScope` (class-level, như NavigationChannelController L29-34). Mọi endpoint trả `ApiResponse<T>` (`common/dto/ApiResponse.java`) với message tiếng Việt; `@PreAuthorize("@auth.check(authentication, 'seaportthroughput:<action>')")`.

| Method + Path | Quyền (`seaportthroughput:*`) | Body / Param | Mô tả + message mẫu |
|---|---|---|---|
| `GET /api/v1/seaport-throughput` | `read` | `orgUnitId` UUID?, `approvalStatus` String? (hỗ trợ danh sách phân tách phẩy — tab "Từ chối" gộp 2 cấp), `reportMonth` `yyyy-MM`?, `updatedFrom`/`updatedTo`?, `keyword`?, `page` (0), `size` (20) | Danh sách + lọc (sidebar FilterTableLayout), sort mặc định `updatedAt` DESC |
| `GET /api/v1/seaport-throughput/{id}` | `read` | — | Chi tiết đầy đủ (orgUnitId+orgUnitName, 24 chỉ tiêu, passenger, note, file list, approval metadata, tracking) |
| `POST /api/v1/seaport-throughput` | `create` | `SeaportThroughputCreateRequest` | Tạo mới → `DRAFT`. Message: "Tạo mới sản lượng cảng biển thành công" |
| `PUT /api/v1/seaport-throughput/{id}` | `update` | `SeaportThroughputUpdateRequest` | Sửa khi `DRAFT`/`PENDING_APPROVAL`/`APPROVED_LEVEL1`/`REJECTED_*` (assertEditable); `org_unit_id`, `report_month` không đổi khi sửa |
| `DELETE /api/v1/seaport-throughput/{id}` | `delete` | — | Xóa mềm chỉ khi `DRAFT` (`assertDeletable` + `ApprovalHistoryUtils.recordSoftDelete`) |
| `POST /api/v1/seaport-throughput/{id}/submit` | `submit` | — | Gửi phê duyệt: `DRAFT`/`REJECTED_*` → `PENDING_APPROVAL` (đơn vị cấp Cục → `APPROVED_LEVEL1`); set `submitted_at/by` |
| `POST /api/v1/seaport-throughput/{id}/approve/c1` | `approve` | `ApprovalRequest` (common dto: nội dung quyết định + lý do) | Duyệt cấp 1 (Cảng vụ/Chi cục): `PENDING_APPROVAL` → `APPROVED_LEVEL1`; 4-eyes |
| `POST /api/v1/seaport-throughput/{id}/approve/c2` | `approve_level2` | `ApprovalRequest` | Duyệt cấp 2 (Cục): `APPROVED_LEVEL1` → `APPROVED` (Ban hành) — set `approverLevel2`, `approvedDateLevel2`, `level2ApprovalContent` |
| `POST /api/v1/seaport-throughput/{id}/reject` | `reject` | `ApprovalRequest` (bắt buộc reason) | Từ chối theo trạng thái hiện tại: từ `PENDING_APPROVAL` → `REJECTED_LEVEL1`; từ `APPROVED_LEVEL1` → `REJECTED_LEVEL2`; lưu `rejection_reason` |
| `GET /api/v1/seaport-throughput/{id}/history` | `read` | — | `List<HistoryEntry>` từ bảng tập trung `infrastructure_history` (refType `SEAPORT_THROUGHPUT`) — màn Lịch sử (rowActions) |
| `POST /api/v1/seaport-throughput/import` | `import` | `MultipartFile` (Excel) | Import số liệu theo dòng; **báo lỗi theo dòng, không ghi nửa chừng** (BR-SLCB-09); không trùng (đơn vị, tháng) |
| `POST /api/v1/seaport-throughput/{id}/files` | `update` | `MultipartFile` | Upload file đính kèm → thêm dòng `seaport_throughput_file` |
| `DELETE /api/v1/seaport-throughput/{id}/files/{fileId}` | `update` | — | Xóa file đính kèm (chỉ khi bản ghi chưa ban hành; sau `APPROVED` ghi history) |

Lưu ý quyền (khác NavigationChannel, nơi submit dùng `update` và từ chối dùng `approvec1/approvec2`): M-028 có **action riêng** `submit`, `reject`, `import` theo lean-spec §5 — controller/service dùng đúng 9 action trên.

**Service (`SeaportThroughputService`)**: tái dùng `InfrastructureApprovalService` cho submit/approve/assert (truyền `InfrastructureType.SEAPORT_THROUGHPUT`); logic nghiệp vụ module giữ trong service: unique check (BR-SLCB-01), org scope gán/validate (DP-6), skip vòng 1 theo `OrgUnit.level`, mapping `orgUnitName` qua `OrgUnitCacheService`, `evictAfterCommit()` sau mọi thay đổi ghi, trim text, nhóm lỗi import. Không tự viết lại guard trạng thái ở controller (như mọi module KCHT).

---

## 4. Migration plan (Flyway)

**Một file duy nhất: `src/main/resources/db/migration/V20260905120000__seaport_throughput.sql`** (tên bắt buộc theo brief). Nội dung:

1. `CREATE TABLE seaport_throughput` — khối base sao chép từ `V20260830000000__create_ship_repair_yards.sql` (L15-19: `org_unit_id UUID`, `province_id INTEGER`, `approval_status SMALLINT NOT NULL DEFAULT 0`, `spatial_id UUID`; L35) **với `org_unit_id UUID NOT NULL`**; `id UUID PRIMARY KEY`; khối riêng §2.1 (24 cột `NUMERIC(18,2) NOT NULL DEFAULT 0`, `passenger_trips BIGINT NOT NULL DEFAULT 0`, `report_month DATE NOT NULL`, `note TEXT`, audit + approval base columns).
2. `CREATE UNIQUE INDEX uq_seaport_throughput_unit_month ON seaport_throughput(org_unit_id, report_month);`
3. `CREATE INDEX idx_seaport_throughput_org_unit ON seaport_throughput(org_unit_id);` + `idx_..._approval_status`, `idx_..._report_month`.
4. `CREATE TABLE seaport_throughput_file` (§2.2) + `idx_seaport_throughput_file_parent ON seaport_throughput_file(throughput_id);` + FK `REFERENCES seaport_throughput(id) ON DELETE CASCADE`.
5. **Backfill: không áp dụng** — bảng mới, không có dữ liệu cũ (không phải migration thêm cột).
6. Không tạo bảng history riêng (bảng tập trung `infrastructure_history` đã tồn tại).

**Ngoài migration — 2 thay đổi code đồng hành (cùng work order backend):**
- `PermissionSeeder.java` — trong `run()` thêm **9 dòng** `seedPermission(definitions, "seaportthroughput", "<action>", "<label VI>", "<mô tả VI>")` cho `read, create, update, delete, submit, import, approve, approve_level2, reject` (định dạng dòng giống `PermissionSeeder.java:55-79`, VD `user:manage`, `orgunit:create`). Thiếu 1 action → 403 với mọi user không phải admin (AGENTS.md).
- `gis/search/dto/InfrastructureType.java` — thêm member `SEAPORT_THROUGHPUT` (cuối enum, additive; không đụng converter/GIS service).

---

## 5. Cấu trúc Frontend (FE)

Trang mới **`frontend/src/pages/SeaportThroughputPage.tsx`** + route EN (`/seaport-throughput` — identifier kỹ thuật) + menu theo cơ chế module. Bắt buộc đọc trước khi code: `frontend/src/theme.ts`, `frontend/src/tokens.ts`, `frontend/src/components/AppLayout.tsx`, `docs/conventions/list-screen-ui-standard.md`, `frontend/src/pages/UsersPage.tsx` (mẫu chuẩn); KHÔNG hardcode màu/spacing/font-size.

**Danh sách (List):** `ScreenHeader` + `FilterTableLayout` (`hideFilterToggle={true}`, sidebar 280px overflowY auto, đáy 2 nút Reload + Tìm kiếm) chứa `FilterBar` + `StatusTabs` + `DataTable` + `Pagination` (từ `frontend/src/components/list-view/` — đã kiểm chứng tồn tại). Cột (theo CRUD matrix, chỉ `List=TRUE`): Đơn vị quản lý (`orgUnitName`), Thời gian tổng hợp (`report_month` MM/YYYY), Cán bộ cập nhật, Ngày cập nhật, Trạng thái (Pill Badge chuẩn — `ApprovalStatusBadge`), Thao tác (cố định phải). StatusTabs **6 tab**: Tất cả | Lưu tạm | Chờ Cảng vụ duyệt | Chờ Cục duyệt | Ban hành | Từ chối; count "Tất cả" = tổng 5 tab; tab "Từ chối" gộp `REJECTED_LEVEL1`+`REJECTED_LEVEL2`. Bộ lọc: OrgUnitTreeSelect cây (`orgUnitId`), ô từ khóa, chọn tháng `reportMonth`, RangePicker Ngày cập nhật, StatusTabs (`approvalStatus`).

**Nhãn badge module** (map local — enum dùng chung nhưng nhãn Excel #33): `DRAFT`→Lưu tạm, `PENDING_APPROVAL`→Chờ Cảng vụ duyệt, `APPROVED_LEVEL1`→Chờ Cục duyệt, `APPROVED`→**Ban hành**, `REJECTED_LEVEL1`→Từ chối Cảng vụ, `REJECTED_LEVEL2`→Từ chối Cục, `ARCHIVED`→Đã xóa; màu semantic theo chuẩn AGENTS.md (`#0E6FD6/#93A3B3/#EDA100/#0284C7/#1BAF7A/#E34948`) qua token, không hardcode.

**Drawer (create/edit/view — không route riêng, trên trang danh sách):**
- Tab Thông tin chung: trường `org_unit_id` (OrgUnitTreeSelect; **disabled khi edit**), `report_month` (DatePicker chọn tháng `MM/YYYY`, disabled khi `APPROVED`), 3 nhóm chỉ tiêu có tiêu đề nhóm (Sản lượng vận tải trong nước / nước ngoài / theo tuyến vận chuyển), mỗi nhóm 8 ô `InputDecimal` — cặp (Tấn) và (Tấn - Km) cho container/dry/liquid/other; `passenger_trips` (Input số); `note` (InputTextArea). Các ô Input `borderRadius: radiusPill`, `height: 40`, `Form.Item marginBottom: spaceFormField` — token/preset từ `tokens.ts`, không số thô (trừ layout width).
- UploadFileTable: danh sách file con (STT + Tên file + xóa) — `seaport_throughput_file`.
- Mục toggle "Thông tin phê duyệt" nằm trong Tab Thông tin chung (submitted/approved/rejected theo cấp + nội dung phê duyệt); **KHÔNG tạo tab log riêng**; "Lịch sử" mở từ `rowActions` (không phải tab) — theo AGENTS.md.
- Kiểm tra đủ 4 trạng thái màn: `loading / error / empty / data`.
- `rowActions` theo status: DRAFT → Sửa/Xóa/Gửi duyệt; PENDING_APPROVAL/APPROVED_LEVEL1 → Xem chi tiết (+ Phê duyệt/Từ chối nếu user có quyền cấp tương ứng & khác người kê khai — 4-eyes); REJECTED_* → Sửa/Gửi lại; APPROVED → Xem chi tiết (chỉ đọc + luồng theo dõi). Nút hiển thị dùng `frontend/src/utils/approvalEditPolicy.ts` (`canDeleteApprovalRecord` etc. — đã kiểm chứng tồn tại) + quyền `seaportthroughput:*` của user (ẩn nút khi thiếu quyền — không dựa vào 403).

**API layer FE:** `frontend/src/api/seaportThroughput.ts` (EN tên hàm/service); type theo DTO backend §3. Xử lý `.trim()` mọi text trước khi gửi; message lỗi tiếng Việt có dấu từ backend giữ nguyên.

---

## 6. Phân tách task (work orders)

### 6.1 engineering-backend-developer-wave-1

| # | Work order | Đầu ra kiểm chứng được |
|---|---|---|
| BE-1 | **Migration + seeder + enum**: tạo `V20260905120000__seaport_throughput.sql` (đúng tên, 2 bảng + index/FK §4); thêm 9 dòng `seedPermission(definitions,"seaportthroughput",…)` trong `PermissionSeeder.run()`; thêm member `SEAPORT_THROUGHPUT` vào `InfrastructureType` | File migration tồn tại đúng tên; `mvn -DskipTests compile` Pass; grep 9 action trong PermissionSeeder |
| BE-2 | **Entity + Repository**: `SeaportThroughput extends BaseApprovableEntity` + `@Filter(orgUnitFilter)` + `@FieldNameConstants`; 24 field BigDecimal + `passengerTrips` Long + `reportMonth` LocalDate + `note`; `SeaportThroughputFile extends BaseEntity`; 2 repository (search động theo filter §3; unique check) | Compile Pass; entity có đủ 24 cột EN + không hardcode chuỗi trạng thái/tên field |
| BE-3 | **DTO**: `Create/Update/Response` (+ nested `FileResponse`), `SearchResultResponse`; validate: 24 số ≥ 0, `passengerTrips` ≥ 0, `reportMonth` bắt buộc, text trim; `@Getter/@Setter` Lombok | Compile Pass; validate khớp lean §8 |
| BE-4 | **Service**: CRUD + submit + approve C1/C2 + reject + history — tái dùng `InfrastructureApprovalService`, `OrgUnitScopeService` (validate ghi), `OrgUnitCacheService` (orgUnitName + `evictAfterCommit`), skip vòng 1 theo `OrgUnit.level`, unique (BR-SLCB-01), chỉ xóa khi DRAFT qua `ApprovalHistoryUtils`; file add/delete; 4-eyes + rejection reason bắt buộc | Compile Pass; unit test (JUnit qua runner trực tiếp với file test cụ thể) cho: unique vi phạm → message §8, reject không lý do → lỗi, người kê khai tự duyệt → lỗi, submit từ cấp Cục → `APPROVED_LEVEL1`, delete khi không DRAFT → lỗi |
| BE-5 | **Controller** `SeaportThroughputController` (@DataScope, 12 endpoint §3, `@PreAuthorize` đúng 9 action, message VI) + xử lý exception qua `GlobalExceptionHandler` | Compile Pass; ánh xạ endpoint↔quyền khớp bảng §3 |
| BE-6 | **Import Excel** (multipart, `.xlsx`): đọc theo dòng, lỗi theo dòng không ghi nửa chừng (BR-SLCB-09), không trùng (đơn vị, tháng) | Compile Pass; unit test: file có 1 dòng lỗi → không dòng nào được lưu |

Constraint chung (copy từ AGENTS.md vào brief dev): mọi identifier EN; message VI có dấu; `@FieldNameConstants`; enum lưu ORDINAL; không import FQN (dùng `import`); migration mới đi kèm script Flyway; không chạy backend (chỉ `mvn -DskipTests compile` / runner trực tiếp file test); KHÔNG đụng `com.hanghai.kchtg.statistics` và mọi file M-017.

### 6.2 engineering-frontend-developer-wave-1

| # | Work order | Đầu ra kiểm chứng được |
|---|---|---|
| FE-1 | **API + types**: `frontend/src/api/seaportThroughput.ts` + types khớp DTO BE §3 (gồm orgUnitName, approval metadata) | TS compile Pass; tên field khớp 100% DTO backend (không bịa `createdAt` thay vì `createdDate` kiểu lỗi cũ) |
| FE-2 | **List screen** `SeaportThroughputPage.tsx`: ScreenHeader + FilterTableLayout(`hideFilterToggle`) + StatusTabs 6 tab (count Tất cả = tổng; Từ chối gộp 2 cấp) + DataTable (cột §5, Pill Badge, cột thao tác cuối cố định phải, scrollLeft reset) + Pagination; 4 trạng thái loading/error/empty/data | TS compile Pass; visual kiểm thủ công theo chuẩn bảng danh sách |
| FE-3 | **Drawer create/edit form**: org (disabled khi edit), tháng MM/YYYY, 3 nhóm × 8 InputDecimal + passenger + note; token/preset từ `tokens.ts`, `spaceFormField`, `radiusPill`, height 40; xử lý trim; unique month error hiển thị message backend | TS compile Pass |
| FE-4 | **Drawer view + approval + file**: mục "Thông tin phê duyệt" trong Tab Thông tin chung; rowActions theo status dùng `approvalEditPolicy.ts` + quyền user (Phê duyệt/Từ chối kèm popup lý do — không tự duyệt); UploadFileTable add/delete; Drawer scroll theo `DRAWER_TABLE_SCROLL_Y` (`themetokenchk.ts`) | TS compile Pass |
| FE-5 | **Lịch sử + route/menu**: mở "Lịch sử" từ rowActions (drawer đọc `/{id}/history`); đăng ký route + menu (EN slug) + kiểm tra cả 4 trạng thái màn | TS compile Pass; route/menu hiển thị đúng phân quyền |

Constraint chung FE (copy từ AGENTS.md): đọc `theme.ts`/`tokens.ts`/`AppLayout.tsx`/`UsersPage.tsx` trước; KHÔNG hardcode màu hex/spacing/font-size; KHÔNG tự tạo Layout/Sider/Menu riêng; preset có sẵn dùng trước, override bằng spread + token; import-then-export khi vừa re-export vừa dùng token (Vite dev bug); dọn 100% unused import/var (IDE/TS/ESLint zero error-warning); text VI có dấu.

---

## 7. Ánh xạ acceptance → design element → oracle

| Yêu cầu (spec/BR) | Thiết kế đáp ứng | Oracle kiểm chứng |
|---|---|---|
| 1 dòng/đơn vị/tháng, không trùng | DP-3 + unique `(org_unit_id, report_month)` DB + service check (BE-4) | Unit test BE-4; migration có UNIQUE index |
| 24 chỉ tiêu + hành khách nhập số ≥ 0 mặc định 0 | §2.1 24 cột `NUMERIC(18,2) DEFAULT 0` + `passenger_trips BIGINT` + DTO validate | Migration DDL; compile + test BE-3 |
| DataScope theo đơn vị (cha xem con, Cục full) | DP-6: entity `@Filter`, controller `@DataScope`, gán/validate `OrgUnitScopeService`, DDL `org_unit_id NOT NULL` | Code review theo checklist AGENTS (5 điểm); test scope nếu có sẵn helper |
| Phê duyệt 2 cấp Cảng vụ/Chi cục → Cục, 7 trạng thái, 4-eyes, lý do từ chối | DP-2/DP-4 + shared `InfrastructureApprovalService` + §2.3 | Unit test BE-4 (4-eyes, reject reason, skip cấp Cục); FE-4 ẩn nút đúng |
| Lịch sử tập trung, không tab log riêng | DP-8 (central `infrastructure_history`, refType `SEAPORT_THROUGHPUT`); FE-5 rowActions | Test history endpoint trả rows; FE visual |
| Permission động từng action | BE-1 9 `seedPermission`; BE-5 `@PreAuthorize` theo §3 | Grep PermissionSeeder; compile; manual 403 check |
| Import lỗi theo dòng, không ghi nửa chừng | DP-9/BE-6 | Unit test BE-6 |
| UI theo convention (list-view, token, badge, drawer) | §5 + FE work orders | Code review + visual theo `ui-audit-report.md` |

---

## 8. Rủi ro & tồn đọng (không blocking)

1. **Base columns thừa** `province_id`/`spatial_id` (NULL) do kế thừa `BaseApprovableEntity` — chấp nhận (precedent toàn bộ module KCHT); ghi chú Javadoc để không bị hiểu nhầm là thiếu dữ liệu.
2. **Tên action khác style navigationchannel** (`approve/approve_level2/reject/submit/import` vs `approvec1/approvec2`) — chốt theo lean-spec §5 (taxonomy module riêng); nếu review M-1006 muốn thống nhất → đổi tên action + `@PreAuthorize` + seeder là thay đổi cục bộ, không đụng enum.
3. **Excel import**: template/format cột chưa có file mẫu chốt — BE-6 đọc theo mapping STT 4–27 đã chốt §2.1; xác nhận file Excel thực tế khi có (nếu lệch → chỉnh mapping, không đổi schema).
4. Không áp dụng cho deliverable này: 3 CSV mới (QL bến phao / Khu tránh trú bão / Khu chuyển tải) thuộc module khác, không phụ thuộc M-028 — không đọc vào thiết kế.

## 9. Tham chiếu (anchors đã mở phiên này)

- `docs/modules/M-028-san-luong-cang-bien/ba/00-lean-spec.md` (§1-12: domain model §3, approval §4, phân quyền §5, DataScope §6, BR §7, validation §8, UI §9, audit §10, SA-pending §11)
- `docs/modules/M-028-san-luong-cang-bien/_features/F-301-san-luong-cang-bien/feature-brief.md` (§2 29 trường L46-48 + STT 4-27; §3; §4; §6 endpoints; §7 schema)
- `docs/conventions/approval-2-level-spec.md` (§3.5-3.7: history sau APPROVED, xóa DRAFT-only, phân quyền/Admin Cục)
- `src/main/java/com/hanghai/kchtg/common/entity/ApprovalStatus.java` (ordinal 0-9 + alias)
- `src/main/java/com/hanghai/kchtg/common/entity/BaseApprovableEntity.java` (Fields, cột approval chuẩn, PrePersist DRAFT)
- `src/main/java/com/hanghai/kchtg/navigationchannel/entity/NavigationChannel.java:28,35` (mẫu `@Filter` + `extends BaseApprovableEntity`)
- `src/main/java/com/hanghai/kchtg/navigationchannel/controller/NavigationChannelController.java:29-159` (mẫu @DataScope/@PreAuthorize/endpoint submit-approve-c1-c2-reject/history)
- `src/main/java/com/hanghai/kchtg/common/service/InfrastructureApprovalService.java` (submit L40, approveC1 L116, approveC2 L161, assertEditable L233, assertDeletable L290, recordSaveAndApprove L338)
- `src/main/java/com/hanghai/kchtg/navigationchannel/service/NavigationChannelService.java:152,160,313,448` (truyền `InfrastructureType.NAVIGATION_CHANNEL`)
- `src/main/java/com/hanghai/kchtg/gis/search/dto/InfrastructureType.java` (enum phẳng 36 member, có member phi-GIS)
- `src/main/java/com/hanghai/kchtg/config/PermissionSeeder.java:55-79` (mẫu `seedPermission(definitions, resource, action, label, desc)`)
- `src/main/resources/db/migration/V20260830000000__create_ship_repair_yards.sql:15-19,35,53-54` (khối base column + index)
- `frontend/src/components/list-view/`, `frontend/src/utils/approvalEditPolicy.ts`, `frontend/src/components/shared/ApprovalStatusBadge.tsx` (tồn tại — kiểm chứng glob)
