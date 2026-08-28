# 05-dev-w2-production-fix-verify

> Nhánh: `feat/fix-f038-prod` (= code deploy `etc/main` 6f1f850d — thông tin caller-supplied, không chạy git theo ràng buộc).
> Nhiệm vụ: XÁC MINH 3 lỗi production F-038 (Luồng hàng hải) đã chẩn đoán là DO THIẾU MIGRATION trên DB production — KHÔNG sửa code.
> Phạm vi: read-only `src/main/java/.../navigationchannel/**`, `src/main/resources/db/migration/**`. Không chạy backend server, không git.

## 1. Kết quả `mvn -DskipTests compile`

- Lệnh thực thi: `mvn -DskipTests compile` (Maven 3.9.16 — `C:\my-tools\apache-maven-3.9.16\bin\mvn.cmd`, `JAVA_HOME` = temurin 17; `mvn` không có trên PATH, không có `mvnw` ở repo root).
- **Exit code: 0**
- **BUILD SUCCESS** — `Total time: 33.632 s` — `Finished at: 2026-08-26T15:05:12+07:00` — `Compiling 1148 source files with javac [debug parameters release 17]`.
- Warning duy nhất: `accesslog/service/LogService.java` dùng deprecated API (deprecation warning, không phải lỗi).

## 2. Kết quả test scoped navigation channel

- Lệnh thực thi: `mvn test -Dtest=NavigationChannelServiceTest,NavigationChannelControllerTest,NavigationChannelServiceLifecycleTest`
- **Exit code: 0** — **BUILD SUCCESS** — `Total time: 01:01 min` — `Finished at: 2026-08-26T15:06:44+07:00`.
- Surefire reports (`target/surefire-reports/*.txt`):

| Test class | Tests run | Failures | Errors | Skipped |
|---|---|---|---|---|
| `com.hanghai.kchtg.navigationchannel.service.NavigationChannelServiceTest` | 12 | 0 | 0 | 0 |
| `com.hanghai.kchtg.navigationchannel.NavigationChannelServiceTest` | 6 | 0 | 0 | 0 |
| `com.hanghai.kchtg.navigationchannel.controller.NavigationChannelControllerTest` | 8 | 0 | 0 | 0 |
| `com.hanghai.kchtg.navigationchannel.NavigationChannelServiceLifecycleTest` | 12 | 0 | 0 | 0 |
| **Tổng** | **38** | **0** | **0** | **0** |

- **LƯU Ý quan trọng**: `NavigationChannelServiceLifecycleTest.java` KHÔNG tồn tại trong `src/test` trên nhánh này (chỉ có 3 file test nguồn: 2× `NavigationChannelServiceTest` ở 2 package + `NavigationChannelControllerTest`). Class này vẫn chạy 12/12 vì `.class` CŨ còn trong `target/test-classes` (Surefire quét `target`, Maven không clean). Đây không phải lỗi code; khi dọn test source cần `mvn clean` để xóa class stale.
- Không có test fail pre-existing ngoài phạm vi navigationchannel (toàn bộ 4 class đều thuộc navigationchannel; BUILD SUCCESS).

## 3. Đối chiếu entity ↔ migration (file:line)

### 3.1 `security_level` (SMALLINT NOT NULL)
- Entity: `src/main/java/com/hanghai/kchtg/common/entity/BaseApprovableEntity.java:26-31` — `@Enumerated(EnumType.ORDINAL) @Column(name = "security_level", nullable = false, columnDefinition = "SMALLINT")`.
- Migration: `V20260818130000__add_record_security_level_all_entities.sql`:
  - `:12` — `'navigation_channel'` nằm trong danh sách bảng của DO block.
  - `:34` — `ALTER TABLE %I ADD COLUMN IF NOT EXISTS security_level SMALLINT`.
  - `:37` — backfill `security_level = 0` cho hàng NULL.
  - `:40` — `SET DEFAULT 0`; `:41` — `SET NOT NULL`; `:45` — CHECK `security_level BETWEEN 0 AND 2`.
- **Khớp** ✓ (SMALLINT NOT NULL, ordinal 0 = NORMAL).

### 3.2 `condition_status` + `submitted_at`/`submitted_by` + `level1/2_approval_content`
- Entity: `NavigationChannel.java:51` (`condition_status` SMALLINT NOT NULL, `@Builder.Default` = OPERATIONAL); `BaseApprovableEntity.java:86-91` (`submitted_at`, `submitted_by`); `BaseApprovableEntity.java:93-98` (`level1_approval_content`, `level2_approval_content`).
- Migration: `V20260825120000__navigation_channel_excel_71_fields.sql`:
  - `:78` — `ADD COLUMN IF NOT EXISTS condition_status SMALLINT NOT NULL DEFAULT 0`.
  - `:79` — `submitted_at TIMESTAMP`; `:80` — `submitted_by UUID`.
  - `:81` — `level1_approval_content VARCHAR(2000)`; `:82` — `level2_approval_content VARCHAR(2000)`.
  - `:95` — backfill `condition_status = 0`; `:112` — `org_unit_id SET NOT NULL` (kèm RAISE EXCEPTION nếu còn NULL, `:108`).
  - DO block `:327-330` thêm 4 cột approval cho các bảng hạ tầng khác.
- **Khớp** ✓.

### 3.3 `InfrastructureHistory` (history create/update/delete)
- Entity: `src/main/java/com/hanghai/kchtg/common/entity/InfrastructureHistory.java:26-33` — `@Table(name = "infrastructure_history")` + các cột `id, ref_id, ref_type, approval_level, status, approved_by, approved_date, reason, changed_field, previous_value, new_value`.
- Migration: `V20260825162500__unify_all_history_to_infrastructure_history.sql`:
  - `:4` — `CREATE TABLE IF NOT EXISTS infrastructure_history`.
  - `:7` `ref_type VARCHAR(64) NOT NULL`, `:8` `approval_level VARCHAR(32)`, `:11` `approved_date TIMESTAMP`, `:12` `reason TEXT`, `:13` `changed_field VARCHAR(255)`, `:14-15` `previous_value/new_value TEXT`, `:16` `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`.
  - `:19-21` — 3 index (`idx_infra_history_ref`, `idx_infra_history_ref_id_date`, `idx_infra_history_approved_by`).
  - Cuối file — `DROP TABLE IF EXISTS approval_history / dike_revetment_approval_history / beacon_history / station_history / change_logs / approval_logs CASCADE`.
- **Khớp** ✓. Ghi chú: `reason`/`changed_field` khác biệt nhỏ kiểu cột so với `length` khai báo trong entity (TEXT vs VARCHAR(500)/1000) — nhưng `spring.jpa.hibernate.ddl-auto=none` (`application.yml:29`, `application.yml:176`, `application-local.properties:13`, `application-local.yml:27`) → KHÔNG có schema validation runtime → không phải lỗi chặn.

### 3.4 Các cột còn lại của `NavigationChannel` (spot-check có migration tạo)
- CREATE TABLE `navigation_channel`: `V20260803370000__repair_all_schema_types_and_columns.sql:7090`; các cột (ADD COLUMN IF NOT EXISTS): `channel_name :7110`, `channel_code :7145`, `seaport_id :7152`, `operating_unit_id :7159`, `detailed_location :7172`, `latest_maintenance_year :7193`, `org_unit_id :7235`, `approval_status :7242`, `approver_level1 :7256`, `approved_date_level1 :7263`, `approver_level2 :7277`, `approved_date_level2 :7284`, `rejection_reason :7291`, `created_at :7305`, `updated_at :7312`, `created_by :7319`, `updated_by :7326`, `spatial_id :7333`, `deleted_at :7375`, `deleted_by :7382`.
- Rename legacy → English: `V62.1__rename_luong_hang_hai_to_navigation_channel.sql:17,22` (`dia_diem_chi_tiet`→`detailed_location`, `nam_bao_tri_gan_nhat`→`latest_maintenance_year`); `V20260825120000:30-62` (9 cột: `management_station`, `station_count`, `station_staff_count`, `station_area_square_meters`, `latest_station_repair_month`, `latest_dredging_volume_cubic_meters`, `buoy_count`, `beacon_count`, `notes`); cột mới #19-21/#39-44 tại `:69-77`.
- `approval_status` ordinal: `V20260807000000__unify_approval_status_ordinals.sql:12` (`UPDATE navigation_channel SET approval_status = CASE ...`).
- `channel_route_detail` (entity `ChannelRouteDetail.java:34-85`): rename 15 cột tại `V20260825120000:178-238` (`sequence_no`, `route_classification`, `route_code`, `route_name`, `route_type`, `turning_basin_location`, `vertical_clearance_meters`, `channel_length_kilometers`, `maximum_design_width_meters`, `minimum_design_width_meters`, `design_depth_meters`, `current_depth_meters`, `design_slope`, `minimum_curve_radius_meters`, `route_latest_dredging_volume_cubic_meters`); sửa type `design_slope` `:260-264`; `route_latest_maintenance_year :269`; `route_grade :270`; audit columns `:271-274`; `navigation_channel_id SET NOT NULL :282`.
- `navigation_channel_coordinate` (entity `NavigationChannelCoordinate.java:34-40`): `CREATE TABLE IF NOT EXISTS public.navigation_channel_coordinate` tại `V20260825120000:289`; `navigation_channel_id UUID NOT NULL :291`, `sequence_no INTEGER NOT NULL :292`, `longitude NUMERIC(10,7) :293`, `latitude NUMERIC(9,7) :294`; FK ON DELETE CASCADE `:306`.

### 3.5 Kết luận entity ↔ migration
- **KHÔNG có cột entity nào thiếu migration tạo** (kỳ vọng: không — xác nhận ĐÚNG). Mọi cột của `NavigationChannel` (+ `BaseApprovableEntity`/`BaseEntity`), `ChannelRouteDetail`, `NavigationChannelCoordinate`, `InfrastructureHistory` đều có nguồn CREATE/ALTER trong các migration nêu trên.
- Phạm vi: 3 nhóm cột thuộc chẩn đoán production được kiểm tra đầy đủ từng cột; các cột còn lại spot-check xác nhận có migration tạo (không re-derive toàn bộ 71 trường).
- 3 lỗi production = **THIẾU MIGRATION trên DB production, không phải lỗi code** — xác nhận đúng với chẩn đoán; không cần sửa code (không phát hiện lỗi runtime thật có bằng chứng).

## 4. Migration cần chạy production

### 4.1 3 migration bắt buộc (nguyên nhân 3 lỗi production)
| Migration | Nội dung | Trạng thái trên nhánh này |
|---|---|---|
| `V20260818130000__add_record_security_level_all_entities.sql` | `security_level` SMALLINT NOT NULL DEFAULT 0 (có `navigation_channel`) + CHECK 0..2 + index | Tồn tại ✓ |
| `V20260825120000__navigation_channel_excel_71_fields.sql` | 71-field schema: rename 9 cột legacy, +14 cột mới (`condition_status`, 4 approval fields...), backfill + `org_unit_id` NOT NULL, `channel_route_detail`, `navigation_channel_coordinate` | Tồn tại ✓ |
| `V20260825162500__unify_all_history_to_infrastructure_history.sql` | Tạo `infrastructure_history` + index + DROP `approval_history`/`change_logs`/`approval_logs`/... | Tồn tại ✓ |

### 4.2 Lưu ý deploy
- **21 migration etc/main-only**: thông tin từ brief (caller-supplied) — các migration có trên `etc/main` nhưng không có trên nhánh này; KHÔNG thể xác minh local vì không chạy git. Phải đối chiếu danh sách migration giữa 2 nhánh trước khi deploy.
- **Cảnh báo checksum `V20260822130000__add_unaccent_port_buoy_search_indexes.sql`**: file TỒN TẠI trong checkout này (`src/main/resources/db/migration/`). Caller báo file đã bị SỬA trên `etc/main` sau khi production đã apply bản gốc → Flyway sẽ báo checksum mismatch ở bước validate khi deploy lần tới. Cần xử lý trước (`flyway repair` hoặc validate thủ công), nếu không deploy có thể fail trước khi chạy 3 migration bắt buộc.

## 5. Ràng buộc & phạm vi đã tuân thủ
- KHÔNG sửa code (không phát hiện lỗi code thật có bằng chứng; mọi kiểm tra Pass).
- KHÔNG đụng migration files, KHÔNG chạy backend server, KHÔNG git.
- `docs/conventions/workers-rule-pack.md` (seat Backend) KHÔNG tồn tại trên checkout này (`glob **/workers-rule-pack.md`, `**/rule-pack*.md`, `**/workers-rule*` đều rỗng; read lỗi) → không thể đọc theo yêu cầu brief; thay thế bằng AGENTS.md + role skills (`implement-backend-runtime.md`).

## 6. Kết luận
1. `mvn -DskipTests compile`: **BUILD SUCCESS, exit 0** (1148 source files).
2. `mvn test -Dtest=...` (scoped navigation channel): **BUILD SUCCESS, exit 0 — 38/38 test pass, 0 failure/error/skip** (gồm 1 class stale `.class` không có source).
3. Entity ↔ migration: **khớp — không cột nào thiếu migration** (file:line ở mục 3).
4. Hành động tiếp theo thuộc deployment: chạy 3 migration bắt buộc + xử lý checksum `V20260822130000` + đối chiếu 21 migration etc/main-only.
