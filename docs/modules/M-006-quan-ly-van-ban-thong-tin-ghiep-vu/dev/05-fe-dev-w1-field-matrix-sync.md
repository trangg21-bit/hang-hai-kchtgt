# Dev Summary — M-006 field-matrix sync (F-131 / F-132-134 / F-128 confirm)

- stage: engineering-frontend-developer, wave 1
- task: sync `frontend/src/pages/document/{IncidentList,PortPlanningList,LegalDocumentList}.tsx` + FE contract layer to BA brief matrices + design plan D1 (§2.1 D7-FINAL)
- date: 2026-09-05
- verdict: **Pass** — typecheck exit 0; biome lint clean on changed files; no hardcoded colors/spacing (grep-verified).

## 1. What changed

**Contract layer (write scope extended by dispatcher):**
- `frontend/src/services/document/types.ts` — replaced legacy Vietnamese-shaped `SuCoCreateRequest/SuCoResponse/QuyHoachBenCangCreateRequest/QuyHoachBenCangResponse` with D1 shapes: incident (`code`, `orgUnitId/orgUnitName`, `incidentType`, `occurredFrom/occurredTo`, `location`, `infrastructureType/id/name`, `description`, `damageStatus`, `processingStatus`, `severityLevel`, `note`, children `incidentEvolution/incidentHandling/incidentFiles` + INFO/RESULT category type, audit fields) and planning (`decisionNumber/decisionDate`, `planningGroup` SEAPORT|DRY_PORT, `seaportId/seaportGroup/dryPortId`, `planToYear`, 6 Kế hoạch textareas, `status` DRAFT|EFFECTIVE|REPLACED|HISTORY, children `cargoForecasts`, `planningCategories` w/ phase, `planningFiles`). LegalDocument* block untouched (F-128 unchanged).
- `frontend/src/services/document/api.ts` — `fetchIncidentList` params per §7.1 (keyword/orgUnitId/occurredFrom|To/processingStatus/incidentType/damageStatus) against GET `/v1/incidents`, tolerant Page normalization incl. `statusCounts`; added `fetchIncidentById`. `fetchPortPlanningList` extended (orgUnitId/decisionNumber/decisionFrom|To) + `statusCounts` passthrough; added `fetchPortPlanningById`. create/update/delete kept (routes unchanged per D1).

**IncidentList.tsx (F-131, rewrite ~1100 lines):**
- List columns: Mã sự cố, Loại sự cố, Thời gian xảy ra (range), Địa điểm, Mức độ nghiêm trọng, Tình trạng thiệt hại, Đơn vị quản lý, Trạng thái (Pill Badge), Ngày cập nhật; rowActions Xem/Chỉnh sửa/Xóa gated by `incident:read|create|update|delete` (+`document:*` fallback).
- StatusTabs by processingStatus with counts (`statusCounts`) + colors; server paging via Pagination.
- Filters: keyword, org-unit TreeSelect (`FilterOrgUnitTreeSelect`), Loại sự cố, RangePicker khoảng ngày xảy ra (sidebar helper).
- View drawer (Tabs): Thông tin chung Descriptions + child DataTables Diễn biến / Chỉ đạo xử lý / Tệp đính kèm with `DRAWER_TABLE_SCROLL_Y.pureTable`; detail loaded via `fetchIncidentById`.
- Create/Edit drawer: orgUnit (FormOrgUnitTreeSelect, required), incidentType (Input, free text per D7-FINAL), code read-only auto (server, BR-131-01), RangePicker thời gian (showTime), location, KCHT type Select (InfrastructureType code→VN map — sibling-page precedent label map, not an invented option list) + Mã/Tên KCHT, description, severityLevel select, damageStatus Input (free text per D7-FINAL), processingStatus select (default RECEIVED), note; child Form.List rows: Diễn biến (from/to/event), Chỉ đạo xử lý (handler/content/date/measure/result/note — gated to RESOLVED/UNRESOLVED/CLOSED per F-131), Tệp (fileName + fileCategory INFO/RESULT).

**PortPlanningList.tsx (F-132/133/134, rewrite ~1300 lines):**
- List columns: Số quyết định, Ngày quyết định, Nhóm, Cảng biển/cảng cạn quy hoạch, Đơn vị quản lý, Trạng thái (Pill), Ngày cập nhật; rowActions gated by `portplanning:*`.
- StatusTabs by planning status w/ counts; filters: keyword, org-unit tree, Nhóm select + branch Cảng biển/Cảng cạn pickers (record pickers, master data), decision-date range.
- View drawer (Tabs): Thông tin chung + Dự báo hàng hóa + Danh mục quy hoạch chi tiết + File đính kèm child DataTables (DRAWER_TABLE_SCROLL_Y.pureTable).
- Create/Edit drawer: orgUnit + Số/Ngày quyết định (required), Nhóm (SEAPORT/DRY_PORT, BR-132-01 branch visibility), branch record pickers from `/v1/ports`/`/v1/dry-ports` (master data, store UUID), Nhóm cảng biển free text, planToYear (year picker), 6 Kế hoạch textareas; Dự báo hàng hóa child rows (classification free text, cảng/bến/cầu record picker `/v1/ports`/`/v1/berths`/`/v1/piers`, container/general/liquid min-max, auto Tổng cộng disabled per BR-132-02, note); Danh mục chi tiết child rows (phase Hiện trạng/Sau quy hoạch, classification, port name, exploitation function, berthCount, length, shipSize, capacity, landArea, waterArea, note); files (fileName rows, uploaded post-create — see limitations).

**LegalDocumentList.tsx (F-128 confirm)** — untouched, no drift requiring fix (details in earlier blocked-phase summary retained).

## 2. Evidence (all executed this session)

- `cd frontend && npx tsc --noEmit -p tsconfig.json` → exit 0 (run after final edit batch).
- `npx biome lint` on the 4 changed files → exit 0, no diagnostics.
- Typed grep for `#[hex]|rgba(|fontSize: <int>|margin…: <int>px|padding: <int>` across both pages → 0 matches (no hardcoded colors/spacing/font sizes).
- Enums/catalog wire values: ProcessingStatus/PlanningStatus/PortPlanningGroup maps + numeric-ordinal fallbacks (D4–D6); no invented option lists — free-text fields per §2.1 D7-FINAL; port pickers load live master data from endpoints proven in `portService.ts` (`/v1/ports`, `/v1/berths`, `/v1/piers`, `/v1/dry-ports`).

## 3. Conventions honored

Semantic tokens + presets (`borderDefault`, `radiusSm`, `fontSizeSm`, pill `${color}15/${color}40` + `radiusPill` + `fontWeightMedium`), `DRAWER_TABLE_SCROLL_Y` for drawer child tables, list-view components (ScreenHeader/FilterTableLayout/DataTable/Pagination), org-unit TreeSelects (value = orgUnitId), form spacing `spaceFormField`, inputs radiusPill, date-picker popup helpers (`getDatePickerProps`/`getRangePickerProps`/`getSidebarRangePickerProps`), VN-diacritic UI text + English identifiers.

## 4. Limitations / follow-ups (non-blocking)

1. **File binary upload** for incident/planning file children has no endpoint defined in design §7 (D1): children are sent as metadata rows (`fileName`, `fileCategory` / file upload ids). Upload wiring must follow the backend's file endpoints when they land (see api.ts `fileUploadIds`).
2. **Planning category phase codes** (`HIEN_TRANG`/`SAU_QUY_HOACH`) are FE-local constants — confirm with the backend D9 extension (`planning_categories` currently has no phase column in `PlanningCategory.java`).
3. **Master pickers** load the first 200 records per list endpoint (no remote search yet) — acceptable v1; search-on-type can be layered later.
4. **`updatedByName`/`securityLevel`** display for Admin Cục remains gated by backend/permission policy — not added to audit columns (see blocked-phase F-128 notes).
5. Status tab counts show 0 when the backend search response does not yet return `statusCounts` (field added to both list mappers).

## 5. Verification summary (per acceptance)

(1) typecheck exit 0 ✔ · (2) IncidentList + PortPlanningList bind/display/filter/edit brief-matrix fields per design plan ✔ · LegalDocument confirmed unchanged ✔ · (3) no hardcoded hex/spacing/font-size (grep 0 hits), no invented catalog values (free text per D7-FINAL; enum maps sourced from design §2.1/§7) ✔ · (4) this summary + verdict ✔.
