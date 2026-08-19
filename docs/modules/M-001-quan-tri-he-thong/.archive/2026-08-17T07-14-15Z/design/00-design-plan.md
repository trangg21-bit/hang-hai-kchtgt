# Design Plan — TRI-1786936397148-3956 · Thêm trường "Cấp đơn vị" (`rank`) cho đơn vị (F-003 / M-001)

## 0. Metadata

| Field | Value |
|---|---|
| Triage | `TRI-1786936397148-3956` (change_class `C3`; one-way door: schema migration `src/main/resources/db/migration/V20260817100000__add_org_unit_rank.sql`) |
| Module / Feature | `M-001-quan-tri-he-thong` / `F-003-quan-ly-don-vi` |
| Stage | `engineering-solution-designer` |
| Entry points | `/organizations` (drawer tạo mới / sửa / xem chi tiết), routed `/organizations/create` và `/organizations/:id/edit` |
| Prior stage | `engineering-business-analyst` Pass — BA spec ghi `AC-003-09..19`, `BR-003-09..16`, `AMBIGUITY-003` |
| Write boundary | CHỈ `docs/modules/M-001-quan-tri-he-thong/design/00-design-plan.md`. Toàn bộ `src/**` + `frontend/**` READ-ONLY (seat design không code) |
| Verified-anchor note | Mọi claim về hành vi hiện tại trong tài liệu này đều trỏ `file:line` đã mở trong phiên này (ADR 0039) |

## 1. Bối cảnh & mục tiêu

Màn hình Quản lý đơn vị cần thêm dropdown **"Cấp đơn vị"** gồm 3 giá trị (Cục / Chi cục–Cảng vụ–Công ty bảo đảm / Đại diện) xuất hiện ở **cả 3 bề mặt**: drawer tạo mới, drawer/sửa, xem chi tiết (và form routed). Giá trị lưu dưới DB là `SMALLINT` (ordinal) tại cột `rank` bảng `org_units`, map qua enum Java `OrgUnitRank` + `AttributeConverter`. Dữ liệu cũ được backfill một lần theo độ sâu cây (`level`).

Mục tiêu thiết kế: mirror tối đa pattern **đã tồn tại** của `OrgUnitStatus` / `OrgUnitStatusConverter` / `operational_status` để không tạo seam mới, giữ wire contract nhất quán, và tách **write scope backend vs frontend** thành 2 wave độc lập.

## 2. Hiện trạng — seam (anchor đã mở phiên này)

### 2.1 Backend

| Vùng | Anchor | Hiện trạng |
|---|---|---|
| Enum không annotation | `orgunit/entity/OrgUnitStatus.java:1-15` | Plain enum (`DRAFT, PENDING, APPROVED, REJECTED`), **KHÔNG** `@JsonValue` → Jackson serialize **theo NAME** (mặc định) |
| Converter | `orgunit/entity/OrgUnitStatusConverter.java:8-27` | `@Converter(autoApply = true)` + `AttributeConverter<OrgUnitStatus, Short>`; `convertToDatabaseColumn` → `(short) attribute.ordinal()` (null-safe); `convertToEntityAttribute` → range-guard `dbData >= 0 && dbData < values.length` else `null` |
| Cột enum trong entity | `orgunit/entity/OrgUnit.java:94-95` | `@Column(nullable = false, columnDefinition = "SMALLINT") private OrgUnitStatus status;` — không khai báo tên cột (default `status`) |
| Cột `level` | `orgunit/entity/OrgUnit.java:120-121` | `@Column(nullable = false) private Integer level;` (root = 1, con của root = 2, ...) |
| Lombok entity | `orgunit/entity/OrgUnit.java:42-46` | `@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder` — **hiện KHÔNG có** `@FieldNameConstants` |
| Create defaults | `orgunit/service/OrganizationService.java:307-310` (builder block) | `.status(request.getStatus() != null ? request.getStatus() : OrgUnitStatus.DRAFT)` và `.operationalStatus(... ? ... : OperationalStatus.OPERATIONAL)` — pattern ternary default; `parent` được load trước builder (lines 283-292); `level` tính sau qua `materializedPathService.calculateLevel(computedPath)` |
| Update partial | `orgunit/service/OrganizationService.java:400-418` (scalar block) | `if (request.getX() != null) unit.setX(request.getX());` cho name/description/address/detailAddress/phone/contactPerson/operationalStatus |
| Dev-local migrator | `orgunit/config/OrgUnitSchemaMigrator.java:21-24` | `CommandLineRunner @Order(0)`: `ALTER TABLE org_units ADD COLUMN IF NOT EXISTS operational_status SMALLINT NOT NULL DEFAULT 1` + `CREATE INDEX IF NOT EXISTS`; log tiếng Việt |
| Migration precedent | `src/main/resources/db/migration/V20260730150000__add_org_unit_operational_status.sql:1-6` | `ADD COLUMN IF NOT EXISTS operational_status SMALLINT NOT NULL DEFAULT 1` |
| Jackson config | `src/main/resources/application.yml:26-29` | Chỉ `write-dates-as-timestamps: false` + `default-property-inclusion: non_null`; **KHÔNG** flag case-insensitive enum → deserialize enum theo NAME chính xác (valueOf) |
| Enum custom (pattern bị loại) | `common/entity/OperationalStatus.java:5-46` | Enum có `@JsonValue` + `@JsonCreator` — pattern "full-custom"; **không** dùng cho `rank` (xem D1) |
| DTO request | `orgunit/dto/CreateOrgUnitRequest.java:13-50`, `UpdateOrgUnitRequest.java:13-46` | `@Data`, field enum không annotation (`private OrgUnitStatus status;`, `private OperationalStatus operationalStatus;`) |
| DTO response | `orgunit/dto/OrgUnitResponse.java:18-73` | `@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor @JsonInclude(NON_EMPTY)`; `from()` map từng getter (`.status(entity.getStatus())`, `.level(entity.getLevel())` ...) |

### 2.2 Frontend

| Vùng | Anchor | Hiện trạng |
|---|---|---|
| Service types + mappers | `frontend/src/services/organizationService.ts` (833 dòng) | Grep `rank` → **0 matches** (chưa có wiring nào). Interface `Organization` (lines 12-29) có `status`/`operationalStatus` nhưng không có `rank`; `CreateOrganizationPayload` (31-46), `UpdateOrganizationPayload` (48-66) |
| Normalization pattern | `organizationService.ts:121-122` | `status: (item.status?.toLowerCase() as Organization["status"]) ?? "draft"` — response enum serialize NAME → frontend normalize lowercase (chỉ áp dụng cho `status`/`operationalStatus`; `rank` dùng thẳng NAME, không lowercase — xem D6) |
| Các mapper cần thêm rank | `organizationService.ts:121-122, 237-238, 379-380, 430-431, 506, 571-572, 651-654, 713, 749, 785, 818` | mapOrgUnit (85), getList, getById, getTree (2 site), getChildren, create, update, approve, reject, submit, search |
| Payload body | `organizationService.ts:588` (create), `:651-654` (update) | Body dựng field-by-field (`code: payload.code ?? ...`) → cần thêm `rank` tường minh |
| Drawer UnitList | `frontend/src/pages/organizations/UnitList.tsx:13` (token imports), `:132-152` (handleSubmit create/update payload), `:115-127` (openEditModal/openViewModal setFieldsValue), `:466` (detailRowStyle — detail rows), `:378` + `:406` (label "Cấp đơn vị" + cell `Cấp {level}` — **giữ nguyên**) | Form.Item dùng `labelProps(...)`, `marginBottom: spaceFormField`, Input/Select `borderRadius: radiusPill, height: 40` (pattern ở tail drawer) |
| Form routed | `frontend/src/pages/organizations/UnitForm.tsx:20-45` (getById load edit), `:102-147` (handleSubmit payloads) | Dùng component `FormField` (`type="select"` + `options` + `required`); button `borderRadius: radiusPill, height: 40` |
| Tokens | `frontend/src/tokens.ts:62` (`radiusPill = 999`), `:68` (`spaceFormField = 12`), presets `:123-205` | Có sẵn mọi token cần thiết; **cấm hardcode** hex/spacing/font-size |

### 2.3 Migration target chưa tồn tại

`src/main/resources/db/migration/V20260817100000__add_org_unit_rank.sql` chưa tồn tại (glob `V2026*.sql` — max hiện có `V20260804125200...`; BA spec dòng 219 xác nhận). Đây là one-way door của triage C3.

## 3. Quyết định thiết kế (D1..D7)

### D1 — Enum `OrgUnitRank` + serialization **theo NAME** (giải quyết `AMBIGUITY-003`)

File mới `orgunit/entity/OrgUnitRank.java`, plain enum **không `@JsonValue`**, mirror `OrgUnitStatus.java:9-14`:

```java
public enum OrgUnitRank {
    CUC,                                  // 0 — "Cục"
    CHI_CUC_CANG_VU_CONG_TY_BAO_DAM,      // 1 — "Chi cục/ Cảng vụ/ Công ty bảo đảm"
    DAI_DIEN                              // 2 — "Đại diện"
}
```

**Quyết định (resolve `AMBIGUITY-003`):** wire format JSON của `rank` là **tên enum** (`"CUC"`, `"CHI_CUC_CANG_VU_CONG_TY_BAO_DAM"`, `"DAI_DIEN"`) — Jackson mặc định serialize/deserialize theo NAME vì enum không annotation và `application.yml:26-29` không bật case-insensitive. DB vẫn là ordinal `SMALLINT` 0/1/2 qua converter (D2).

**Đã loại (rejected):**
- Pattern `@JsonValue`/`@JsonCreator` full-custom như `OperationalStatus.java:5-46` — cần code thủ công cho từng enum, không nhất quán với `OrgUnitStatus`.
- Wire format theo ordinal (0/1/2) — lệch với mọi enum hiện có trong module (đều serialize NAME), buộc frontend map số↔tên ở mọi mapper.

**Hệ quả bắt buộc cho frontend:** mọi giá trị gửi/nhận là NAME (uppercase chính xác); `RANK_OPTIONS`/`RANK_LABELS` keyed **theo NAME** (D6). Điều này **thay thế** cách viết "RANK_OPTIONS (3 giá trị 0/1/2) + RANK_LABELS (0/1/2)" trong BA spec AC-003-16 — mục 8 ghi resolution đầy đủ để QA lấy oracle đúng.

### D2 — `OrgUnitRankConverter`

File mới `orgunit/entity/OrgUnitRankConverter.java`, copy cấu trúc `OrgUnitStatusConverter.java:8-27`:

```java
@Converter(autoApply = true)
public class OrgUnitRankConverter implements AttributeConverter<OrgUnitRank, Short> {
    // convertToDatabaseColumn: null → null; else (short) attribute.ordinal()
    // convertToEntityAttribute: null → null; range-guard [0..2] else null  (BR-003-10)
}
```

### D3 — Entity `OrgUnit.rank` + `@FieldNameConstants`

- Thêm field (mirror `OrgUnit.java:94-95` của `status`):
  ```java
  /** Cấp đơn vị (rank) — CUC(0), CHI_CUC_CANG_VU_CONG_TY_BAO_DAM(1), DAI_DIEN(2). BR-003-09 */
  @Column(nullable = false, columnDefinition = "SMALLINT")
  private OrgUnitRank rank;
  ```
  Không cần `@Enumerated` (converter `autoApply=true` đã cover, đúng pattern `status`).
- Thêm `@FieldNameConstants` vào class-level Lombok (AGENTS.md: entity cập nhật bắt buộc khai báo). Lưu ý: sinh constant chỉ cho field **declared** trong `OrgUnit` (field thừa kế từ `BaseEntity` không có constant) — hành vi Lombok chuẩn, không thay đổi hành vi hiện tại; không cần `@Builder.Default` vì `create()` luôn set rank tường minh (D5).
- Không dùng tên cột `rank` bị reserved: PostgreSQL xem `RANK` là non-reserved keyword, dùng được làm tên cột; field name = column name → không cần `@Column(name=...)`.

### D4 — Migration `V20260817100000__add_org_unit_rank.sql` + `OrgUnitSchemaMigrator`

**Flyway (one-way door, chạy 1 lần trên DB thật):**

```sql
-- Cấp đơn vị: 0=CUC, 1=CHI_CUC_CANG_VU_CONG_TY_BAO_DAM, 2=DAI_DIEN
ALTER TABLE org_units ADD COLUMN rank SMALLINT NOT NULL DEFAULT 0;
UPDATE org_units SET rank = CASE
    WHEN level <= 1 THEN 0
    WHEN level = 2 THEN 1
    ELSE 2
END;
ALTER TABLE org_units ALTER COLUMN rank DROP DEFAULT;
```

- `level` là `NOT NULL` (`OrgUnit.java:120-121`) → không cần nhánh NULL; CASE theo đúng BR-003-11 (level<=1→0, level=2→1, else→2).
- `DROP DEFAULT` sau backfill để mọi insert sau phải qua service (BR-003-12/13 đảm bảo luôn có rank tường minh).
- Không tạo index: không có query lọc theo `rank` (khác `operational_status` có index riêng — không mirror điểm đó).

**Dev-local `OrgUnitSchemaMigrator`** (thêm vào `run()`, sau statement `operational_status`, `OrgUnitSchemaMigrator.java:21-24`):

```java
jdbcTemplate.execute("ALTER TABLE org_units ADD COLUMN IF NOT EXISTS rank SMALLINT NOT NULL DEFAULT 0");
log.info("Đã kiểm tra cấu trúc cấp đơn vị.");
```

- Idempotent (`IF NOT EXISTS`), mirror `operational_status`. **Giữ `DEFAULT 0`** ở dev-local (không DROP như Flyway) — vô hại vì service luôn set `rank` tường minh khi tạo (D5); tránh phức tạp cho môi trường không chạy Flyway. Ghi log lỗi tiếng Việt theo pattern hiện có.

### D5 — DTO + `OrganizationService`

**DTO (3 file):**
- `CreateOrgUnitRequest.java` (sau `operationalStatus`, dòng 49): `private OrgUnitRank rank;` — optional, không validation annotation (BR-003-12 fallback; required-ness là ràng buộc UI theo AC-003-15).
- `UpdateOrgUnitRequest.java` (sau `operationalStatus`): `private OrgUnitRank rank;` — optional, partial (BR-003-13).
- `OrgUnitResponse.java`: thêm field `private OrgUnitRank rank;` (sau `operationalStatus`, dòng 25) + trong `from()`: `.rank(entity.getRank())` (sau `.operationalStatus(...)`).
- Import bằng `import` đầu file (cấm fully-qualified name); DTO giữ Lombok hiện có (`@Data` / builder).

**`OrganizationService.create()`** — thêm vào builder block (sau `.operationalStatus(...)`, `OrganizationService.java:307-310`):

```java
.rank(resolveRank(request.getRank(), parent))
```

với private helper (đặt cạnh `validateParentEligibility`):

```java
private OrgUnitRank resolveRank(OrgUnitRank requested, OrgUnit parent) {
    if (requested != null) return requested;                       // (a) gửi rank → dùng thẳng
    if (parent == null) return OrgUnitRank.CUC;                    // (b) root → CUC
    return parent.getLevel() != null && parent.getLevel() == 1
            ? OrgUnitRank.CHI_CUC_CANG_VU_CONG_TY_BAO_DAM          // (c) cha level 1 → Chi cục/Cảng vụ/CTBD
            : OrgUnitRank.DAI_DIEN;                                // (d) cha khác → Đại diện
}
```

Khớp AC-003-12 (a/b/c/d) và BR-003-12. `parent` đã được load sẵn trước builder (`OrganizationService.java:283-292`).

**`OrganizationService.update()`** — thêm vào scalar block (sau `operationalStatus`, `OrganizationService.java:400-418`):

```java
if (request.getRank() != null)
    unit.setRank(request.getRank());
```

Partial update — không gửi `rank` → giữ giá trị cũ (AC-003-13, BR-003-13).

### D6 — Frontend: `RANK_OPTIONS`/`RANK_LABELS` keyed **theo NAME** + dropdown 3 bề mặt + mapper wiring

**`frontend/src/services/organizationService.ts` (WO-06):**

```ts
export type OrgUnitRankName = "CUC" | "CHI_CUC_CANG_VU_CONG_TY_BAO_DAM" | "DAI_DIEN";

export const RANK_LABELS: Record<OrgUnitRankName, string> = {
  CUC: "Cục",
  CHI_CUC_CANG_VU_CONG_TY_BAO_DAM: "Chi cục/ Cảng vụ/ Công ty bảo đảm",
  DAI_DIEN: "Đại diện",
};

export const RANK_OPTIONS: { value: OrgUnitRankName; label: string }[] = [
  { value: "CUC", label: "Cục" },
  { value: "CHI_CUC_CANG_VU_CONG_TY_BAO_DAM", label: "Chi cục/ Cảng vụ/ Công ty bảo đảm" },
  { value: "DAI_DIEN", label: "Đại diện" },
];
```

- `Organization`, `CreateOrganizationPayload`, `UpdateOrganizationPayload`: thêm `rank?: OrgUnitRankName;`.
- **Mọi mapper** thêm `rank: item.rank as OrgUnitRankName | undefined,` (passthrough, **không** `.toLowerCase()` — response đã là NAME uppercase; `status`/`operationalStatus` giữ nguyên lowercase-normalize hiện có): mapOrgUnit (85), getList (121-122 vùng), getById (237-238), getTree (379-380, 430-431), getChildren (506), create (571-572), update (651-654), approve (713), reject (749), submit (785), search (818). Mock fallback (`MOCK_ORGANIZATIONS`) không có `rank` → undefined, hiển thị "—" (đúng AC-003-17).
- **Body create/update** thêm `rank: payload.rank` tường minh (body dựng field-by-field, `organizationService.ts:588` và `:651-654`).
- Viết file theo đúng convention hiện có: import `type` riêng, không hardcode label tiếng Việt ngoài `RANK_LABELS`.

**`frontend/src/pages/organizations/UnitList.tsx` (WO-07, drawer):**
- Import thêm `RANK_OPTIONS, RANK_LABELS` từ `organizationService` (dòng 8 hiện có).
- `openEditModal`/`openViewModal` (`:115-127`): thêm `rank: org.rank,` vào `form.setFieldsValue(...)`.
- Form drawer (vùng form tail, pattern `operationalStatus` Form.Item): thêm
  ```tsx
  <Form.Item name="rank" {...labelProps('Cấp đơn vị')} style={{ marginBottom: spaceFormField }}
      rules={[{ required: true, message: 'Vui lòng chọn cấp đơn vị' }]}>
    <Select placeholder="Chọn cấp đơn vị" style={{ borderRadius: radiusPill, height: 40 }} options={RANK_OPTIONS} />
  </Form.Item>
  ```
  — Select bắt buộc ở cả tạo mới và sửa (AC-003-15); token `radiusPill`/`spaceFormField` từ `tokens.ts:62,68`, label qua `labelProps()`, KHÔNG hardcode màu/spacing.
- `handleSubmit` (`:132-152`): thêm `rank: values.rank,` vào payload của cả `create` lẫn `update`.
- Drawer xem chi tiết (vùng `detailRowStyle`, `:466`): thêm detail row `"Cấp đơn vị"` → `RANK_LABELS[(org.rank as OrgUnitRankName)] ?? '—'` (AC-003-17; null/undefined → "—").

**`frontend/src/pages/organizations/UnitForm.tsx` (WO-07, form routed):**
- Import `RANK_OPTIONS` từ service.
- Load edit (`:20-45`): thêm `rank: data.rank,` vào `initialData` và `form.setFieldsValue(...)`.
- `handleSubmit` (`:102-147`): thêm `rank: values.rank,` vào payload `UpdateOrganizationPayload` và `CreateOrganizationPayload`.
- Form: thêm
  ```tsx
  <FormField type="select" name="rank" label="Cấp đơn vị" required options={RANK_OPTIONS} />
  ```
  (đặt sau `parentId` FormField, trước `operationalStatus`; dùng component `FormField` như các field khác).

### D7 — Exclusions (giữ nguyên, không đụng)

- **Cột danh sách "Cấp đơn vị"** (`UnitList.tsx:378` header, `:406` cell): tiếp tục render `Cấp {level}` từ độ sâu cây — KHÔNG đổi (BR-003-15, AC-003-18). `rank` độc lập với `level`.
- **`OrgUnitType` + `OrgUnitTypeConverter`** (deprecated): không sửa, không khôi phục, không suy rank từ `unitType` (BR-003-16).
- **Không seed permission mới** — quyền `orgunit:manage`/`orgunit:approve` giữ nguyên (brief: "NO new permission seeding").
- Không tạo index cho `rank`; không đổi migration/endpoint khác; không đụng `RolePermissionSeeder`.

## 4. Luồng dữ liệu (wire ↔ DB)

| Lớp | Biểu diễn `rank` |
|---|---|
| DB (`org_units.rank`) | `SMALLINT` ordinal: `0` / `1` / `2` |
| JPA entity `OrgUnit.rank` | `OrgUnitRank` enum (converter `autoApply=true`) |
| JSON response (`OrgUnitResponse`) | NAME: `"CUC"` / `"CHI_CUC_CANG_VU_CONG_TY_BAO_DAM"` / `"DAI_DIEN"` (Jackson default; null bị bỏ do `non_null` inclusion → frontend thấy `undefined` → hiển thị "—") |
| JSON request (create/update) | NAME uppercase chính xác (Jackson deserialize theo `valueOf`, không case-insensitive — `application.yml:26-29`) |
| UI | Label tiếng Việt có dấu qua `RANK_LABELS` / `RANK_OPTIONS` |

Minh họa 1 luồng tạo mới: `Select value="CUC"` → payload `rank: "CUC"` → Jackson `valueOf` → `OrgUnitRank.CUC` → converter `(short) 0` → DB `0`. Đọc lại: DB `0` → converter `CUC` → response `"rank":"CUC"` → `mapOrgUnit` passthrough → detail row `RANK_LABELS["CUC"]` = "Cục".

## 5. Ánh xạ AC → thiết kế → oracle kiểm tra

| AC (BA spec) | Thiết kế | Oracle kiểm chứng |
|---|---|---|
| AC-003-09 (enum 3 giá trị + converter) | D1 + D2 | `mvn clean compile` pass; enum đủ 3 constant đúng thứ tự; converter `@Converter(autoApply=true)` `AttributeConverter<OrgUnitRank, Short>` |
| AC-003-10 (migration + backfill + DROP DEFAULT) | D4 (Flyway) | Chạy migration trên DB có dữ liệu cũ: cột `rank SMALLINT NOT NULL` tồn tại; row `level<=1`→0, `level=2`→1, else→2; default đã bị drop |
| AC-003-11 (SchemaMigrator dev-local) | D4 (migrator) | `ALTER TABLE org_units ADD COLUMN IF NOT EXISTS rank SMALLINT NOT NULL DEFAULT 0`; chạy lại không lỗi (idempotent) |
| AC-003-12 (create: request ?? suy từ cha) | D5 `resolveRank` | 4 ca (a) có rank (b) null+root (c) null+cha level1 (d) null+cha level2 → đúng CUC/CHI_CUC.../DAI_DIEN |
| AC-003-13 (update partial) | D5 | Body có `rank` → đổi; body không có `rank` → giữ nguyên |
| AC-003-14 (entity + response có rank) | D3 + D5 | `OrgUnit.rank` `@Column(columnDefinition="SMALLINT")`; `OrgUnitResponse.from()` map `.rank(...)`; GET trả `rank` |
| AC-003-15 (Select bắt buộc tạo/sửa) | D6 (WO-07) | Submit thiếu rank → "Vui lòng chọn cấp đơn vị", không gọi API; chọn đủ → payload kèm `rank` |
| AC-003-16 (RANK_OPTIONS/LABELS + mapper + payload) | D6 (WO-06) | Export `RANK_OPTIONS`/`RANK_LABELS` keyed NAME; mọi mapper map `rank`; body create/update gửi `rank` (QA oracle theo mục 8: giá trị = NAME, không phải số) |
| AC-003-17 (xem chi tiết hiển thị) | D6 (WO-07) | Drawer chi tiết dòng "Cấp đơn vị" = `RANK_LABELS[rank]`; rank null → "—" |
| AC-003-18 (không đổi cột list + OrgUnitType) | D7 | `UnitList.tsx:378/406` vẫn `Cấp {level}`; `OrgUnitType`/converter giữ nguyên |
| AC-003-19 (build + typecheck) | WO-01..07 | `mvn clean compile` (root) + `npx tsc --noEmit` (frontend) đều pass |

## 6. Work orders (WO-01..WO-07)

**Hai write scope tách biệt, không chồng file:**

- **Backend wave** (1 dev): `orgunit/entity/*`, `orgunit/dto/*`, `orgunit/service/*`, `orgunit/config/*`, `db/migration/*` → WO-01..WO-05.
- **Frontend wave** (1 dev): `frontend/src/services/organizationService.ts`, `frontend/src/pages/organizations/UnitList.tsx`, `frontend/src/pages/organizations/UnitForm.tsx` → WO-06..WO-07.

Wire contract là seam giữa 2 wave: `rank?: "CUC" | "CHI_CUC_CANG_VU_CONG_TY_BAO_DAM" | "DAI_DIEN"` trong request/response JSON — 2 wave chạy song song được, chỉ cần khớp contract này.

### WO-01 (backend) — `OrgUnitRank` + `OrgUnitRankConverter`
- **Tạo mới** `src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnitRank.java`: plain enum `CUC, CHI_CUC_CANG_VU_CONG_TY_BAO_DAM, DAI_DIEN` — KHÔNG `@JsonValue`, KHÔNG `@JsonCreator` (mirror `OrgUnitStatus.java:9-14`). Javadoc ghi ordinal + nhãn tiếng Việt.
- **Tạo mới** `src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnitRankConverter.java`: `@Converter(autoApply = true)` `AttributeConverter<OrgUnitRank, Short>`, ordinal + range-guard (copy `OrgUnitStatusConverter.java:8-27`).
- **Không** sửa file khác. Verify: `mvn clean compile` (root) pass. Oracle: 2 file tồn tại, đúng annotation; build pass.

### WO-02 (backend) — Entity `OrgUnit.rank`
- `src/main/java/com/hanghai/kchtg/orgunit/entity/OrgUnit.java`: enum cùng package `orgunit.entity` nên KHÔNG cần import; thêm field `rank` `@Column(nullable = false, columnDefinition = "SMALLINT")` (sau block `operationalStatus`, `:99-101`), thêm `@FieldNameConstants` vào class-level Lombok.
- Verify: `mvn clean compile` pass. Oracle: field + annotation đúng; build pass.

### WO-03 (backend) — Migration + `OrgUnitSchemaMigrator`
- **Tạo mới** `src/main/resources/db/migration/V20260817100000__add_org_unit_rank.sql` (SQL mục D4, đúng thứ tự: ADD → UPDATE backfill → DROP DEFAULT).
- `src/main/java/com/hanghai/kchtg/orgunit/config/OrgUnitSchemaMigrator.java`: thêm statement `ADD COLUMN IF NOT EXISTS rank SMALLINT NOT NULL DEFAULT 0` sau `operational_status` (`:21-24`) + log tiếng Việt; giữ idempotent.
- Verify: `mvn clean compile` pass (migration không chạy khi compile — oracle backfill là chạy Flyway trên DB dev). Oracle: file SQL đúng nội dung; migrator idempotent.

### WO-04 (backend) — DTOs
- `CreateOrgUnitRequest.java` + `UpdateOrgUnitRequest.java`: thêm field `private OrgUnitRank rank;` (import đầu file).
- `OrgUnitResponse.java`: field `private OrgUnitRank rank;` + `.rank(entity.getRank())` trong `from()`.
- Verify: `mvn clean compile` pass. Oracle: 3 DTO có field; `from()` map đầy đủ.

### WO-05 (backend) — `OrganizationService` create/update
- `OrganizationService.java`: helper `resolveRank(OrgUnitRank requested, OrgUnit parent)` (mục D5); builder create thêm `.rank(resolveRank(request.getRank(), parent))`; scalar block update thêm `if (request.getRank() != null) unit.setRank(request.getRank());`.
- Verify: `mvn clean compile` pass. Oracle: 4 ca AC-003-12 + 2 ca AC-003-13 (đơn vị kiểm thử của QA).

### WO-06 (frontend) — `organizationService.ts`
- Thêm `OrgUnitRankName`, `RANK_LABELS`, `RANK_OPTIONS` (mục D6); thêm `rank?` vào `Organization`, `CreateOrganizationPayload`, `UpdateOrganizationPayload`; **mọi mapper** passthrough `rank: item.rank as OrgUnitRankName | undefined` (11 site liệt kê mục 2.2); body create/update thêm `rank: payload.rank`.
- Verify: `npx tsc --noEmit` (chạy trong `frontend/`) pass. Oracle: grep `rank` xuất hiện ở đúng 11 mapper + 2 payload; typecheck pass.

### WO-07 (frontend) — `UnitList.tsx` + `UnitForm.tsx`
- `UnitList.tsx`: import `RANK_OPTIONS, RANK_LABELS`; setFieldsValue (edit/view) thêm `rank`; Form.Item Select "Cấp đơn vị" required (pattern `operationalStatus`, token `radiusPill`/`spaceFormField`/`labelProps`); handleSubmit thêm `rank: values.rank` (create + update); detail row `RANK_LABELS[rank] ?? '—'` ở vùng `detailRowStyle` (`:466`). **KHÔNG** đổi `:378`/`:406`.
- `UnitForm.tsx`: import `RANK_OPTIONS`; load edit thêm `rank`; handleSubmit thêm `rank: values.rank` (cả 2 payload); thêm `<FormField type="select" name="rank" label="Cấp đơn vị" required options={RANK_OPTIONS} />`.
- Verify: `npx tsc --noEmit` (chạy trong `frontend/`) pass. Oracle: 3 bề mặt có dropdown bắt buộc; view hiển thị label; list column không đổi.

## 7. Rủi ro & lưu ý

1. **Jackson deserialize theo NAME chính xác** (`application.yml:26-29` không case-insensitive): frontend phải gửi đúng uppercase name. `RANK_OPTIONS.value` chính là tên enum → an toàn; cấm frontend tự `.toLowerCase()` khi gửi.
2. **AC-003-16 viết "0/1/2"**: wording của BA trước resolution; design này keyed theo NAME (mục 8). QA oracle phải theo design, không theo số.
3. **Response thiếu `rank`** (null bị bỏ bởi `default-property-inclusion: non_null`): frontend luôn xử lý `undefined` → "—" (AC-003-17).
4. **`@FieldNameConstants` thêm mới** vào `OrgUnit` (hiện chưa có): additive, chỉ sinh constant cho field declared; không ảnh hưởng code đang chạy.
5. **Dev-local migrator giữ `DEFAULT 0`** trong khi Flyway drop default: cố ý (mirror `operational_status` precedent); vô hại vì service luôn set rank tường minh.
6. **One-way door**: migration đã chạy không có downgrade; backfill một lần theo `level` tại thời điểm chạy — không tự ý thêm logic khác vào migration.
7. **Tên cột `rank`**: hợp lệ trong PostgreSQL (non-reserved); không cần quote.

## 8. Resolution `AMBIGUITY-003` (JSON serialization của `OrgUnitRank`)

**Câu hỏi:** enum `OrgUnitRank` serialize theo tên hay theo ordinal?

**Quyết định:** **Theo tên (NAME)** — enum không `@JsonValue`, mirror `OrgUnitStatus.java:9-14`; DB giữ ordinal qua converter. Frontend `RANK_OPTIONS`/`RANK_LABELS` keyed theo NAME; payload gửi NAME uppercase chính xác (khớp `valueOf` mặc định của Jackson, `application.yml:26-29`).

**Lý do:** (1) nhất quán toàn module — mọi enum org-unit (`status`, `operationalStatus` response) đều serialize NAME; (2) zero-mapping — mappers passthrough thẳng, không cần bảng số↔tên; (3) ordinal wire sẽ phá convention hiện có và buộc frontend map 2 chiều ở mọi mapper.

**Hệ quả so với BA spec:** dòng "RANK_OPTIONS (3 giá trị 0/1/2) + RANK_LABELS (0/1/2)" của AC-003-16 và dòng "RANK_OPTIONS map theo ordinal số (0/1/2)" của bảng AMBIGUITY-003 (BA spec dòng 329) được **thay thế** bằng NAME-keyed (D6). Giá trị ordinal 0/1/2 chỉ tồn tại ở DB (SMALLINT) và `OrgUnitRank.ordinal()`. Điều này đã được định nghĩa trong design decision của dispatch; nếu QA phát hiện lệch kiểu giữa backend/contract, báo PMO trước khi code (theo đúng ghi chú AMBIGUITY-003).

---

*End of design plan — TRI-1786936397148-3956.*
