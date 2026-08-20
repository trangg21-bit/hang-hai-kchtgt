# Code Review — TRI-1786936397148-3956 · F-003 "Cấp đơn vị" (`rank`)

**Verdict: PASS** — no blocking code defect survives reproduction. 10/10 checklist areas verified against the real diff; rank-specific tests reproduced green (23/23), frontend production build green. 5 non-blocking findings (F1–F5) are recorded for routing to BA / PMO — none alters the correctness of the shipped rank code.

---

## 1. Scope inspected

Reviewed the **real working-tree diff** (`git diff`) plus direct reads of new files, and reproduced the QA claims:

| Layer | Files |
|---|---|
| Entity/converter (new) | `OrgUnitRank.java`, `OrgUnitRankConverter.java`, `OrgUnitRankConverterTest.java` |
| Entity/DTO | `OrgUnit.java`, `CreateOrgUnitRequest.java`, `UpdateOrgUnitRequest.java`, `OrgUnitResponse.java` |
| Service/config | `OrganizationService.java`, `OrgUnitSchemaMigrator.java`, `OrgUnitDataFixer.java` |
| Seeders | `DataSeeder.java`, `M001DataSeeder.java` |
| Migration | `src/main/resources/db/migration/V20260817100000__add_org_unit_rank.sql` |
| Frontend | `services/organizationService.ts`, `pages/organizations/UnitList.tsx`, `pages/organizations/UnitForm.tsx` |
| Tests | `orgunit/entity/OrgUnitRankConverterTest.java`, `orgunit/service/OrganizationServiceTest.java` (RankResolutionTests) |

**Reproduced evidence (executed this session):**
- `mvn test -Dtest=OrgUnitRankConverterTest,OrganizationServiceTest` → `Tests run: 23, Failures: 0, Errors: 0, Skipped: 0`, BUILD SUCCESS (converter 5/5, RankResolutionTests 5/5, plus Hierarchy 2, Approval 5, DeleteGuard 3, UniqueCode 3).
- `npm run build` (vite, cwd `frontend/`) → exit 0, 4034 modules transformed (chunk-size warning only, pre-existing).
- No hardcoded `"rank"` field-name string literals in backend (`grep "\"rank\"|'rank'" src/main/java → 0 matches`).

---

## 2. Per-item checklist findings (10/10)

### (1) Enum 3 values exact + NAME serialization (no `@JsonValue`) — ✅ PASS
`OrgUnitRank.java` declares exactly `CUC`, `CHI_CUC_CANG_VU_CONG_TY_BAO_DAM`, `DAI_DIEN` in that order, with **no `@JsonValue`** (plain enum). Spot-check of the mirror target `OrgUnitStatus.java` confirms it too is a plain enum with no `@JsonValue` → Jackson serializes both by NAME. Wire contract = NAME, matching design D1.

### (2) Converter autoApply ordinal + range-guard — ✅ PASS
`OrgUnitRankConverter.java:6` `@Converter(autoApply = true)`; `:14` `(short) attribute.ordinal()` null-safe; `:23-24` range guard `dbData >= 0 && dbData < values.length` else `null` (BR-003-10). Mirrors `OrgUnitStatusConverter` exactly. Five discriminating tests cover ordinal write, null write, ordinal read, out-of-range `-1`/`3`, null read — all green.

### (3) `OrgUnit.rank` SMALLINT NOT NULL + `@FieldNameConstants` — ✅ PASS
`OrgUnit.java:48` `@FieldNameConstants` added at class level; `:99-101` field `@Column(nullable = false, columnDefinition = "SMALLINT") private OrgUnitRank rank;` — **no `@Enumerated`** (converter-only, mirroring `status`), field name = column name so no `@Column(name=…)`.

### (4) Migration exact + no downgrade risk on the one-way door — ✅ PASS
`V20260817100000__add_org_unit_rank.sql` is byte-exact to design D4:
```sql
ALTER TABLE org_units ADD COLUMN rank SMALLINT NOT NULL DEFAULT 0;
UPDATE org_units SET rank = CASE WHEN level <= 1 THEN 0 WHEN level = 2 THEN 1 ELSE 2 END;
ALTER TABLE org_units ALTER COLUMN rank DROP DEFAULT;
```
Forward-only one-way door: `ADD COLUMN … DEFAULT 0` guarantees no null-violation on existing rows, backfill maps level→ordinal exactly per BR-003-11, `DROP DEFAULT` forces app-layer rank. No downgrade script is required or expected for Flyway forward migrations; no destructive operation exists. **Note:** backfill covers *all* rows including soft-deleted (see F2).

### (5) `OrgUnitSchemaMigrator` dev-local idempotent — ✅ PASS
`jdbcTemplate.execute("ALTER TABLE org_units ADD COLUMN IF NOT EXISTS rank SMALLINT NOT NULL DEFAULT 0")` + Vietnamese log `"Đã kiểm tra cấu trúc cấp đơn vị."`. `IF NOT EXISTS` makes it idempotent across double-start. Backfill is intentionally omitted in dev-local (accepted by design D4; see F3).

### (6) DTO rank fields + response `from()` mapping — ✅ PASS
`CreateOrgUnitRequest.rank` (optional, no validation annotation), `UpdateOrgUnitRequest.rank` (optional, partial), `OrgUnitResponse.rank` + `.rank(entity.getRank())` in `from()`. Lombok `@Data` retained, imports at top (no FQN).

### (7) `OrganizationService` resolveRank + create/update null-guard — ✅ PASS
`OrganizationService.java:312` `.rank(resolveRank(request.getRank(), parent))` in the `create()` builder (parent loaded at `:285-292` before the builder). `:421-422` update null-guard `if (request.getRank() != null) unit.setRank(request.getRank());`. `:443` `resolveRank` matches design D5 exactly: requested wins → parent null → `CUC` → parent level 1 → `CHI_CUC_CANG_VU_CONG_TY_BAO_DAM` → else `DAI_DIEN`. Consistent with the migration backfill (child level = parent level + 1).

### (8) Seeders `rankForLevel` consistency + NOT NULL fix — ✅ PASS
`DataSeeder`, `M001DataSeeder`, `OrgUnitDataFixer` each define an identical `rankForLevel` (`level<=1→CUC`, `==2→CHI_CUC…`, `else→DAI_DIEN`) and set `.rank(rankForLevel(...))` at every direct `OrgUnit.builder()` site — required because the migration drops the column default. Consistent with the backfill mapping (checklist 8's "NOT NULL fix").

### (9) Frontend NAME-keyed + mappers + payloads + required Select (3 surfaces) + `—` fallback — ✅ PASS
`organizationService.ts`: `OrgUnitRankName` union + `RANK_LABELS`/`RANK_OPTIONS` all **keyed by NAME**; `rank?: OrgUnitRankName` on `Organization` + both payloads; `rank: item.rank as OrgUnitRankName | undefined` passthrough (no `.toLowerCase()`, correct since wire is already uppercase NAME) in `mapOrgUnit` and every list/tree/children/approve/reject/submit/search mapper; `create`/`update` bodies send `rank: payload.rank`.
`UnitList.tsx`: drawer form required Select `:497-498` `rules={[{required:true, message:'Vui lòng chọn cấp đơn vị'}]}`; create/edit payloads `:145`/`:155` `rank: values.rank`; edit/view prefill `:112`/`:128` `rank: org.rank`; view detail row `:458` `RANK_LABELS[editingOrg.rank as OrgUnitRankName] ?? '—'`.
`UnitForm.tsx`: `FormField type="select" name="rank" label="Cấp đơn vị" required options={RANK_OPTIONS}`; `rank` in `initialData`/`setFieldsValue`/both payloads. All three surfaces (create drawer, edit drawer, view read-only) + routed form covered.

### (10) Exclusions honored — ✅ PASS
- List column still renders **tree depth, not rank**: `UnitList.tsx:408` `… ? \`Cấp ${org.level}\` : '—'` (BR-003-15).
- `OrgUnitType` untouched (not in working-tree diff).
- No new permission seeding — `RolePermissionSeeder.java` not modified.
- No `@Enumerated` on `rank` (converter-only).
- No hardcoded field-name strings (grep 0 matches); `@FieldNameConstants` present.
- Vietnamese log text with diacritics (`"Đã kiểm tra cấu trúc cấp đơn vị."`).

---

## 3. Findings (non-blocking — route to owners)

| ID | Severity | Finding | Evidence | Owner / action |
|---|---|---|---|---|
| F1 | **Medium** | **BA lean-spec still contradicts the shipped wire format.** `ba/00-lean-spec.md` documents `rank` as **ordinal numeric** (`:279` "rank gửi dưới dạng số nguyên (ordinal 0/1/2)… theo ORDINAL" + example payload `"rank": 1`; `:306` "Options từ RANK_OPTIONS: 0/1/2"; `AMBIGUITY-003` "RANK_OPTIONS map theo ordinal số… gửi ordinal (number)") — while design D1, the implementation, and QA oracle w2 all use **NAME**. SA design D1 explicitly superseded this wording but never updated the BA artifact. A future maintainer following AGENTS.md ("BA spec là nguồn sự thật") would send numeric `rank` and break Jackson `valueOf`. **The code is correct; the spec is stale.** | `ba/00-lean-spec.md:279,306`, AMBIGUITY-003; design `00-design-plan.md` D1 | BA rework: reconcile lines 279/306/AMBIGUITY-003 to NAME |
| F2 | Minor | BA spec migration snippet appends `WHERE deleted_at IS NULL` to the backfill; design D4 + actual migration backfill **all** rows. Design is more correct (soft-deleted rows still need a non-null rank); divergence is immaterial but should be reconciled. | `ba/00-lean-spec.md:209` vs `V20260817100000__add_org_unit_rank.sql` | BA (doc sync) |
| F3 | Info | `OrgUnitSchemaMigrator` adds `rank … DEFAULT 0` **without** backfilling by level — pre-existing dev-local rows become `CUC(0)` regardless of depth. Accepted by design D4 (dev-local only; `create()` always sets rank explicitly; production covered by Flyway backfill). | `OrgUnitSchemaMigrator.java:30` | None (design-accepted) — note for release/UAT |
| F4 | **Medium** | **Diff entanglement / scope hygiene.** The uncommitted `UnitList.tsx` diff interleaves the F-003 rank hunks with unrelated concurrent-item edits: `Modal`→`modal` + `toast,{modal}` (M-1003 antd static-message), `useAuthStore`→`usePermissionStore` + `userService` import (M-1004 field-level authorization / user decision `unit-list-columns`), token-import swap `detailRowStyle/detailLabelColStyle/detailValueStyle` in + `fontSizeLg` out. The rank hunks themselves are correct and build green on the current tree, but per-item attribution in `UnitList.tsx` is not cleanly separable; if these ship in one commit, the rank change carries unrelated edits. | `UnitList.tsx:1-22` import block diff | PMO/Dev: verify per-item attribution before commit |
| F5 | Info | Required-message wording split: drawer uses AC-003-15's `"Vui lòng chọn cấp đơn vị"` (`UnitList.tsx:497`) while `UnitForm` gets FormField's auto message `"Vui lòng nhập cấp đơn vị"` (`FormField.tsx:74`). Matches design D6 (no custom message for FormField), but "nhập" is slightly off for a Select. | `UnitList.tsx:497` vs `FormField.tsx:73-74` | Dev (optional polish) |

---

## 4. Knowledge audit (code-reviewer duty)

This run's committed knowledge contributions are **sound**: `AM-e7c90c47a76adcf9` (rank NAME serialization decision), `AM-c7e2dfb18907a584` (seeder NOT-NULL builder-site lesson), `AM-cdbbb2b58d0b3ee5` (BA anchor-edit-target rule) are accurate, attributed, and worth a future seat's read. One duplication noted: `AM-afdc5ec230911c94` and `AM-46ca1bd22287eba6` both re-state "root `tsc --noEmit` is vacuous / use `tsconfig.app.json`" (third variant in `AM-63404d3bd3e206af`) — converge these onto one topic at next release. Recorded `AM-25e30bc50e7bed3f` (F1 stale-BA-spec ordinal wording) this session.

---

## 5. Untested edges (remain for release/UAT)

- Flyway migration execution against a real DB with existing rows (backfill matrix, column metadata, DROP DEFAULT) — SQL verified byte-exact only (no DB/server start).
- `OrgUnitSchemaMigrator` double-start idempotency at runtime.
- Live `POST`/`PUT` wire round-trip (NAME serialization end-to-end) — substituted by `RankResolutionTests` (5/5) + static Jackson default.
- Browser required-select submit block and detail `'—'` rendering — substituted by rule + fallback static verification.
- TC-N-02 live chain (DB `rank=5` → GET omits → UI `'—'`) — substituted by range-guard test + `NON_EMPTY` + `?? '—'`.

---

## 6. Verdict

**PASS.** All ten review checklist areas are satisfied by the implementation and confirmed against the real diff with executed reproduction (`mvn test` 23/23 green, `npm run build` exit 0). F1–F5 are non-blocking: F1/F2 are upstream BA-spec consistency items, F3 is design-accepted dev-local behavior, F4 is a working-tree attribution concern (rank hunks correct), F5 is a wording nit. No code modified by this review.
