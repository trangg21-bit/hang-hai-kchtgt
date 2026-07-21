
---
feature-id: M-002
stage: validation
agent: engineering-qa-engineer
wave: 1
verdict: Changes-requested
critical-ac-total: 6
critical-ac-verified: 0
last-updated: 2026-07-21
---

# QA Report — M-002 Cảng & Bến Pages UI Spec Validation

## Feature/Change Overview

Validate 10 existing frontend pages (cangben module) against 36 designer UI specs across 6 domains. This is a static-analysis white-box validation of UI-spec compliance for:
- **5 List pages**: CangBienList, BenCangList, CauCangList, CangCanList, VungNuocList
- **5 Form pages**: CangBienForm, BenCangForm, CauCangForm, CangCanForm, VungNuocForm

## Test Scope

### Included
- List page column structure, dataIndex, filter controls, component architecture per spec
- Form page field set, required/optional correctness, field types, status values, parent entity references
- Theme compliance: hardcoded hex colors, token usage, component patterns (FilterBar, ScreenHeader, DataTable)

### Excluded
- Runtime verification (no live server available for this wave)
- GiayTo domain (only 1 upload spec, no page file exists — noted as gap)
- Detail, update, approve, delete, history UI specs (only list + create mapped to existing pages)
- Independent black-box/UAT acceptance testing (Test Studio responsibility)

## Requirement Coverage Matrix

| Domain | Spec Ref | List Page | Form Page | List Status | Form Status | Specs Mapped |
|--------|----------|-----------|-----------|-------------|-------------|-------------|
| Cảng biển (cangbien) | 01-list, 03-create | CangBienList | CangBienForm | ⚠️ Partial | ❌ Major gaps | 7 specs |
| Bến cảng (bencang) | 01-list, 03-create | BenCangList | BenCangForm | ⚠️ Partial | ❌ Major gaps | 7 specs |
| Cầu cảng (caucang) | 01-list, 03-create | CauCangList | CauCangForm | ⚠️ Partial | ❌ Major gaps | 7 specs |
| Cảng cạn (cangcan) | 01-list, 03-create | CangCanList | CangCanForm | ❌ Legacy | ❌ Major gaps | 7 specs |
| Vùng nước (vungnuoc) | 01-list, 03-create | VungNuocList | VungNuocForm | ❌ Legacy | ❌ Major gaps | 7 specs |
| Giấy tờ (giayto) | 01-upload | — | — | N/A | N/A | 1 spec (no page) |

### GiayTo gap
The giayto domain has a spec (`01-upload-ui-spec.md`) describing a `GiayToUploadModal` but no corresponding page file exists in `frontend/src/pages/cangben/`. Spec describes a modal, not a standalone page.

## Test Strategy

Static analysis: read every page source file and compare against the corresponding designer list and create UI specs. Verification items per page:

- **List pages**: Columns present (dataIndex, label, width, render function), filter controls match spec, component architecture (ScreenHeader+FilterBar+DataTable vs legacy Card+Row+Col), status badges use semantic tokens, createdAt column present, parent entity name vs raw UUID display.
- **Form pages**: Field names match spec, required/optional correctness, field type (Input/Select/Number), parent entity ID as Select dropdown vs text Input, status enum values (HIỆN_HÀNH/TẠM_NGƯNG vs custom), trangThaiPheDuyet presence, GPS optional/paired validation.
- **Theme compliance**: Any hardcoded hex/rgb colors (should import from tokens.ts), component pattern alignment (list-view vs legacy), inline style values vs tokens.

## Test Cases (Analytical — no execution, wave 1 authoring)

| ID | Page | Check | Expected | Actual | Pass/Fail |
|----|------|-------|----------|--------|-----------|
| TC-01 | CangBienList | Uses ScreenHeader+FilterBar+DataTable | list-view components | ✅ Yes | PASS |
| TC-02 | CangBienList | Columns match spec (maCang, tenCang, tinhThanhPho, dienTich, khaNangTiepNhan, trangThaiHoatDong, trangThaiPheDuyet, createdAt) | Spec fields present | ✅ Has all, plus viDo/kinhDo (not spec'd) | PASS with note |
| TC-03 | CangBienList | Filter controls per spec | search + status + approvalStatus + orgUnitId | ❌ Only search filter | FAIL |
| TC-04 | CangBienList | STATUS_STYLE_MAP uses semantic tokens | statusOperational/statusAttention/statusCritical | ❌ Hardcoded hex #1BAF7A, #EDA100, #E34948 | FAIL |
| TC-05 | CangBienForm | viDo/kinhDo optional | Not required | ❌ Marked required | FAIL |
| TC-06 | CangBienForm | trangThaiPheDuyet Select in create mode | Present | ❌ Missing | FAIL |
| TC-07 | CangBienForm | trangThaiHoatDong enum values | HIỆN_HÀNH / TẠM_NGƯNG | ❌ ACTIVE / SUSPENDED / INACTIVE | FAIL |
| TC-08 | CangBienForm | trangThaiPheDuyet default | CHỜ_PHE_DUYỆT | ❌ DRAFT | FAIL |
| TC-09 | CangBienForm | khaNangTiepNhan optional | Not required | ❌ Marked required | FAIL |
| TC-10 | CangBienForm | GPS pair constraint validation | Zod .refine() | ❌ Only individual range checks | FAIL |
| TC-11 | BenCangList | Uses ScreenHeader+FilterBar+DataTable | list-view components | ✅ Yes | PASS |
| TC-12 | BenCangList | cangBienId as Select filter | Present | ✅ Present | PASS |
| TC-13 | BenCangList | STATUS_STYLE_MAP uses semantic tokens | statusOperational/statusAttention/statusCritical | ❌ Hardcoded hex | FAIL |
| TC-14 | BenCangForm | cangBienId as Select dropdown | Select loaded from API | ❌ Text Input | FAIL |
| TC-15 | BenCangForm | loaiBen as free text | Free text Input | ❌ Select enum WATER/SHORE/BREAKWATER | FAIL |
| TC-16 | BenCangForm | viDo/kinhDo optional | Not required | ❌ Marked required | FAIL |
| TC-17 | BenCangForm | chieuDai, chieuRong, doSauLuong optional | Not required | ❌ All marked required | FAIL |
| TC-18 | BenCangForm | trangThaiHoatDong values | HIỆN_HÀNH / TẠM_NGƯNG | ❌ ACTIVE / INACTIVE / MAINTENANCE | FAIL |
| TC-19 | CauCangList | Uses ScreenHeader+FilterBar+DataTable | list-view components | ✅ Yes | PASS |
| TC-20 | CauCangList | trangThaiHoatDong dataIndex correct | trangThaiHoatDong | ✅ Yes | PASS |
| TC-21 | CauCangList | benCangId filter present | Select dropdown filter | ❌ Missing | FAIL |
| TC-22 | CauCangForm | benCangId as Select dropdown | Select loaded from API | ❌ Text Input | FAIL |
| TC-23 | CauCangForm | loaiCau as free text | Free text Input | ❌ Select enum STRAIGHT/ANGLED/T_SHAPED | FAIL |
| TC-24 | CauCangForm | chieuDai, taiTrong optional | Not required | ❌ Both marked required | FAIL |
| TC-25 | CauCangForm | trangThaiHoatDong values | HIỆN_HÀNH / TẠM_NGƯNG | ❌ ACTIVE / INACTIVE / MAINTENANCE | FAIL |
| TC-26 | CangCanList | Uses ScreenHeader+FilterBar+DataTable | list-view components | ❌ Legacy Card+Row+Col pattern | FAIL |
| TC-27 | CangCanList | dataIndex for status fields | trangThaiHoatDong, trangThaiPheDuyet | ❌ isActive, approvalStatus | FAIL |
| TC-28 | CangCanList | createdAt column | Present | ❌ Missing | FAIL |
| TC-29 | CangCanList | Filter controls per spec | search + status + approvalStatus | ❌ Custom Input+Select controls | FAIL |
| TC-30 | CangCanForm | viDo/kinhDo optional | Not required | ❌ Marked required | FAIL |
| TC-31 | CangCanForm | tinhThanhPho optional | Not required | ❌ Marked required | FAIL |
| TC-32 | CangCanForm | congSuatTEU optional | Not required | ❌ Marked required | FAIL |
| TC-33 | CangCanForm | trangThaiPheDuyet Select in create | Present | ❌ Missing | FAIL |
| TC-34 | CangCanForm | trangThaiHoatDong values | HIỆN_HÀNH / TẠM_NGƯNG | ❌ ACTIVE / INACTIVE / MAINTENANCE | FAIL |
| TC-35 | CangCanForm | trangThaiPheDuyet default | CHỜ_PHE_DUYỆT | ❌ DRAFT | FAIL |
| TC-36 | CangCanForm | GPS pair constraint validation | Zod .refine() | ❌ Only individual range checks | FAIL |
| TC-37 | VungNuocList | Uses ScreenHeader+FilterBar+DataTable | list-view components | ❌ Legacy Card+Row+Col pattern | FAIL |
| TC-38 | VungNuocList | dataIndex for status fields | trangThaiHoatDong, trangThaiPheDuyet | ❌ isActive, approvalStatus | FAIL |
| TC-39 | VungNuocList | createdAt column | Present | ❌ Missing | FAIL |
| TC-40 | VungNuocList | cangBienId shows entity name | tenCangBien clickable link | ❌ Raw UUID | FAIL |
| TC-41 | VungNuocList | cangBienId filter present | Select dropdown filter | ❌ Missing | FAIL |
| TC-42 | VungNuocForm | cangBienId as Select dropdown | Select loaded from API | ❌ Text Input | FAIL |
| TC-43 | VungNuocForm | dienTich, doSauMax, doSauTrungBinh optional | Not required | ❌ All marked required | FAIL |
| TC-44 | VungNuocForm | loaiVungNuoc as free text | Free text Input | ❌ Select enum with fixed values | FAIL |
| TC-45 | VungNuocForm | trangThaiHoatDong values | HIỆN_HÀNH / TẠM_NGƯNG | ❌ ACTIVE / INACTIVE / MAINTENANCE | FAIL |

## Execution Results

| Result | Count |
|--------|-------|
| PASS | 5 |
| FAIL | 40 |
| TOTAL | 45 |

Wave 1 (authoring) — no runtime execution performed. All 45 test cases are analytical comparisons of source code against designer specs. No build or test runner was invoked.

## Defects Found

### Blocker/Critical Defects

| ID | Severity | Domain | Page | Description | Expected | Actual |
|----|----------|--------|------|-------------|----------|--------|
| DEF-001 | Critical | cangcan | CangCanList | Legacy architecture — does not use list-view shared components | ScreenHeader+FilterBar+DataTable | Custom Card+Row+Col with old DataTable |
| DEF-002 | Critical | vungnuoc | VungNuocList | Legacy architecture — does not use list-view shared components | ScreenHeader+FilterBar+DataTable | Custom Card+Row+Col with old DataTable |
| DEF-003 | Critical | cangcan | CangCanList | Wrong dataIndex names for status fields | trangThaiHoatDong / trangThaiPheDuyet | isActive / approvalStatus |
| DEF-004 | Critical | vungnuoc | VungNuocList | Wrong dataIndex names for status fields | trangThaiHoatDong / trangThaiPheDuyet | isActive / approvalStatus |
| DEF-005 | Critical | all forms (5) | All *Form pages | Wrong trangThaiHoatDong enum values | HIỆN_HÀNH / TẠM_NGƯNG | ACTIVE / INACTIVE / MAINTENANCE or ACTIVE / SUSPENDED / INACTIVE |
| DEF-006 | Critical | all forms (5) | All *Form pages | Approval workflow uses L1/L2 pattern, spec defines single approve/reject | Direct approve/reject based on trangThaiPheDuyet | Multi-level (DRAFT→PENDING_APPROVAL→APPROVED_L1→...) |
| DEF-007 | Critical | bencang | BenCangForm | cangBienId is text Input instead of Select dropdown | Select dropdown loaded from API | Free-text Input |
| DEF-008 | Critical | caucang | CauCangForm | benCangId is text Input instead of Select dropdown | Select dropdown loaded from API | Free-text Input |
| DEF-009 | Critical | vungnuoc | VungNuocForm | cangBienId is text Input instead of Select dropdown | Select dropdown loaded from API | Free-text Input |
| DEF-010 | Critical | bencang | BenCangForm | loaiBen uses fixed enum instead of free text | Free text Input | Select enum (WATER/SHORE/BREAKWATER) |
| DEF-011 | Critical | caucang | CauCangForm | loaiCau uses fixed enum instead of free text | Free text Input | Select enum (STRAIGHT/ANGLED/T_SHAPED) |
| DEF-012 | Critical | vungnuoc | VungNuocForm | loaiVungNuoc uses fixed enum instead of free text | Free text Input | Select enum (NEO_DAU/KIEM_DICH/...) |
| DEF-013 | Critical | cangbien | CangBienForm | trangThaiPheDuyet Select missing in create mode | Present with CHỜ_PHE_DUYỆT default | Absent |
| DEF-014 | Critical | cangcan | CangCanForm | trangThaiPheDuyet Select missing in create mode | Present with CHỜ_PHE_DUYỆT default | Absent |

### Major Defects

| ID | Severity | Domain | Page | Description | Expected | Actual |
|----|----------|--------|------|-------------|----------|--------|
| DEF-015 | Major | cangbien | CangBienForm | viDo/kinhDo marked required | Optional (spec §2: @DecimalMin/@DecimalMax, optional) | required prop=true |
| DEF-016 | Major | bencang | BenCangForm | viDo/kinhDo marked required | Optional | required prop=true |
| DEF-017 | Major | cangcan | CangCanForm | viDo/kinhDo marked required | Optional | required prop=true |
| DEF-018 | Major | cangbien | CangBienForm | khaNangTiepNhan marked required | Optional | required prop=true |
| DEF-019 | Major | bencang | BenCangForm | chieuDai, chieuRong, doSauLuong marked required | All optional | All marked required |
| DEF-020 | Major | caucang | CauCangForm | chieuDai, taiTrong marked required | All optional | Both marked required |
| DEF-021 | Major | cangcan | CangCanForm | congSuatTEU marked required | Optional | required prop=true |
| DEF-022 | Major | cangcan | CangCanForm | tinhThanhPho marked required | Optional (spec §2: @Size(max=100), optional) | required prop=true |
| DEF-023 | Major | vungnuoc | VungNuocForm | dienTich, doSauMax, doSauTrungBinh marked required | All optional | All marked required |
| DEF-024 | Major | cangbien | CangBienForm | trangThaiPheDuyet default value | 'CHỜ_PHE_DUYỆT' | 'DRAFT' |
| DEF-025 | Major | cangcan | CangCanForm | trangThaiPheDuyet default value | 'CHỜ_PHE_DUYỆT' | 'DRAFT' |
| DEF-026 | Major | cangbien | CangBienForm | GPS pair constraint missing | Zod .refine() with paired-or-both-empty rule | Individual range checks only |
| DEF-027 | Major | cangcan | CangCanForm | GPS pair constraint missing | Zod .refine() with paired-or-both-empty rule | Individual range checks only |
| DEF-028 | Major | cangcan | CangCanList | Missing createdAt column | Present in spec column list | Absent |
| DEF-029 | Major | vungnuoc | VungNuocList | Missing createdAt column | Present in spec column list | Absent |
| DEF-030 | Major | vungnuoc | VungNuocList | cangBienId shows raw UUID | tenCangBien clickable link | Raw UUID string |
| DEF-031 | Major | cangbien | CangBienList | Filter missing status filters | status + approvalStatus | Only search |
| DEF-032 | Major | cangbien | CangBienForm | tinhThanhPho uses Select from VIETNAM_PROVINCES | Free text Input | Select dropdown |
| DEF-033 | Major | caucang | CauCangList | Missing benCangId filter | benCangFilter for parent BenCang | Absent |

### Minor/Observation Defects

| ID | Severity | Domain | Page | Description |
|----|----------|--------|------|-------------|
| DEF-034 | Minor | all list (5) | All *List pages | STATUS_STYLE_MAP uses hardcoded hex (#1BAF7A, #EDA100, #E34948) instead of semantic tokens (statusOperational, statusAttention, statusCritical) |
| DEF-035 | Minor | all list (5) | All *List pages | APPROVAL_STYLE_MAP uses hardcoded hex instead of semantic tokens |
| DEF-036 | Minor | all list (5) | All *List pages | ma* columns rendered with `<Tag color="cyan">` — hardcoded AntD Tag color |
| DEF-037 | Minor | cangcan | CangCanList | Hardcoded font size `style={{ fontSize: 13 }}` instead of fontSizeMd |
| DEF-038 | Minor | vungnuoc | VungNuocList | Hardcoded font size `style={{ fontSize: 13 }}` instead of fontSizeMd |
| DEF-039 | Minor | all form (5) | All *Form pages | L1/L2 approval workflow references don't match spec's direct approve/reject model |
| DEF-040 | Minor | cangbien | CangBienList | viDo/kinhDo columns present in list — spec says display in detail, not list |

## NFR Observations

- **Maintainability**: 2 of 5 list pages (CangCanList, VungNuocList) use a legacy component pattern that duplicates the shared list-view components. This creates maintenance burden — 3 domains follow the shared pattern, 2 do not.
- **Consistency**: Status badge rendering is inconsistent across pages. CangBienList/BenCangList/CauCangList use custom inline badge spans, while CangCanList/VungNuocList use AntD `<Tag>` component. Neither uses the `.status-badge` CSS classes defined in theme.ts.
- **Token compliance**: All pages import semantic tokens from `tokens.ts` but frequently hardcode equivalent hex values instead (statusOperational=#1BAF7A is hardcoded in STATUS_STYLE_MAP as '#1BAF7A').
- **Approval workflow**: All 5 form pages implement a 2-level approval (L1→L2) pattern that does not match the spec's single approve/reject state machine based on `trangThaiPheDuyet` enum (CHỜ_PHE_DUYỆT / ĐƯỢC_PHE_DUYỆT / TỪ_CHỐI).

## Regression Impact Assessment

| Area | Impact | Rationale |
|------|--------|-----------|
| Shared list-view components | Low | Only CangCanList/VungNuocList need migration; other 3 already use them |
| Semantic token system | Low | Token values already match hardcoded hex — visual change minimal on update |
| API contract (status enums) | **HIGH** | ACTIVE/INACTIVE vs HIỆN_HÀNH/TẠM_NGƯNG — must align with BE enum values |
| Approval state machine | **HIGH** | DRAFT/PENDING/APPROVED_L1/APPROVED_L2 vs CHỜ_PHE_DUYỆT/ĐƯỢC_PHE_DUYỆT/TỪ_CHỐI — fundamental behavioral mismatch |
| Field required/optional | Medium | Marking optional fields as required blocks form submission for legitimate use cases |

## Test Limitations / Gaps

1. **Static analysis only**: No runtime execution could be performed. The FilterBar, DataTable, and ScreenHeader component implementations were inspected but not tested with live data or API integration.
2. **GiayTo domain**: No page files exist for this domain. The spec describes a modal (not a standalone page), which should be implemented as a reusable component.
3. **Spec versions**: Designer specs describe idealized UI. Implementation may be constrained by BE API shapes or available service methods not visible in frontend code alone.
4. **Custom DataTable vs list-view DataTable**: CangCanList and VungNuocList import from `../../components/DataTable` (custom component), not `../../components/list-view/DataTable`. The custom DataTable may have incompatible prop interfaces.
5. **Status value alignment with BE**: The actual BE enum values are not confirmed. If BE uses ACTIVE/INACTIVE, the forms would match BE but not the designer spec. This requires BA clarification.

## Release Recommendation

**DO NOT RELEASE** — 40 gaps found across 10 pages. Critical defects include legacy component architecture (2 list pages), wrong dataIndex names (2 list pages), wrong status enum values across all 5 form pages, parent entity IDs as text inputs (3 forms), hardcoded enums vs free text (3 forms), missing trangThaiPheDuyet fields (2 forms), and an approval workflow that does not match the spec.

## QA Verdict

**Changes-requested** — 14 Critical + 19 Major + 7 Minor/Observation defects. The feature is not ready for release. Requires:

1. **Must-fix (Blocker)**: Migrate CangCanList and VungNuocList to shared list-view components (ScreenHeader+FilterBar+DataTable)
2. **Must-fix (Critical)**: Correct status dataIndex names: `isActive`→`trangThaiHoatDong`, `approvalStatus`→`trangThaiPheDuyet`
3. **Must-fix (Critical)**: Align all form trangThaiHoatDong values with spec enum: `HIỆN_HÀNH`/`TẠM_NGƯNG`
4. **Must-fix (Critical)**: Replace parent entity ID text inputs with API-loaded Select dropdowns (cangBienId, benCangId)
5. **Must-fix (Critical)**: Change loaiBen/loaiCau/loaiVungNuoc from fixed Select enums to free text Inputs
6. **Must-fix (Critical)**: Add trangThaiPheDuyet Select in CangBienForm and CangCanForm create modes
7. **Must-fix (Critical)**: Make viDo/kinhDo optional across all forms that require it (CangBien, BenCang, CangCan)
8. **Must-fix (Critical)**: Remove unnecessary `required` from spec-optional fields (khaNangTiepNhan, chieuDai, chieuRong, doSauLuong, taiTrong, dienTich, congSuatTEU)
9. **Should-fix (Major)**: Replace hardcoded hex colors in STATUS_STYLE_MAP/APPROVAL_STYLE_MAP with semantic tokens
10. **Should-fix (Major)**: Add GPS pair constraint validation (CangBienForm, CangCanForm)
11. **Should-fix (Major)**: Add missing filter controls (CangBienList, CauCangList, VungNuocList)
12. **Should-fix (Major)**: Add createdAt column to CangCanList and VungNuocList
13. **Should-fix (Major)**: Show cangBienId as entity name in VungNuocList
14. **Should-fix (Major)**: Change tinhThanhPho from Select to Input in CangBienForm per spec
