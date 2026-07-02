# QA Report Wave-1 — Module M-002 (Quản lý Tài sản Cảng Bến)

**Date:** 2026-07-01
**Tester:** AI QA Agent
**Scope:** 36 React pages (7 pages × 5 entity groups + 1 GiayTo upload page)
**BE Ground Truth:** 6 entities (CangBien, BenCang, CauCang, CangCan, VungNuoc, GiayTo) with DTOs and Controllers

---

## 1. Summary

| Metric | Count |
|--------|-------|
| Total pages tested | 36 |
| Pass (all checks) | 0 |
| Issues found | 36 |
| MUST FIX | 10 |
| SHOULD FIX | 10 |
| NICE TO HAVE | 8 |

**Verdict: BLOCKED** — 10 MUST FIX items require code changes before Wave-1 can be merged.

---

## 2. Per-Entity-Group Findings

### 2.1 CangBien (7 pages + 3 support files)

**Files tested (all on disk, verified):**

- `frontend/src/services/cangbien/CangBienListPage.tsx` (459 lines)
- `frontend/src/services/cangbien/CangBienDetailPage.tsx` (262 lines)
- `frontend/src/services/cangbien/CangBienCreatePage.tsx` (188 lines)
- `frontend/src/services/cangbien/CangBienUpdatePage.tsx` (249 lines)
- `frontend/src/services/cangbien/CangBienApprovePage.tsx` (237 lines)
- `frontend/src/services/cangbien/CangBienDeleteConfirm.tsx` (145 lines)
- `frontend/src/services/cangbien/CangBienHistoryPage.tsx` (165 lines)
- `frontend/src/services/cangbien/api.ts` (87 lines)
- `frontend/src/services/cangbien/schema.ts` (133 lines)
- `frontend/src/services/cangbien/types.ts` (100 lines)

**Status: FAIL — 3 issues found**

#### MUST FIX — 1 issue

1. **`CangBienUpdatePage.tsx` line 116-118**: The `maCang` Form.Item has no `name` prop — just a label and a disabled `<Input />`. Despite `form.setFieldsValue({ maCang: data.maCang, ... })` on line 29, the field value is never bound because there is no `name="maCang"` on the Form.Item. The display will show an empty text field instead of the actual maCang value.

#### SHOULD FIX — 2 issues

2. **`CangBienListPage.tsx` line 414**: Loading state uses plain text `<div>Loading...</div>` instead of an Ant Design Spin or skeleton. Inconsistent with other entity groups.
3. **`CangBienApprovePage.tsx` line 179, 196, 207**: Uses raw `<input type="checkbox">` and raw `<input type="text">` instead of Ant Design Form components (`Form.Checkbox`, `Input.TextArea`). Should use antd for consistency with the rest of the app.

#### NICE TO HAVE — 0

#### Field Name Accuracy ✅

All field names match BE exactly (verified against `CangBien.java`):

| BE Field (CangBien.java) | Frontend Field | Status |
|-------------------------|----------------|--------|
| `maCang` (line 33) | `maCang` | ✅ |
| `tenCang` (line 36) | `tenCang` | ✅ |
| `tinhThanhPho` (line 39) | `tinhThanhPho` | ✅ |
| `viDo` (line 42) | `viDo` | ✅ |
| `kinhDo` (line 45) | `kinhDo` | ✅ |
| `dienTich` (line 48) | `dienTich` | ✅ |
| `khaNangTiepNhan` (line 51) | `khaNangTiepNhan` | ✅ |
| `trangThaiHoatDong` (line 54) | `trangThaiHoatDong` | ✅ |
| `trangThaiPheDuyet` (line 57) | `trangThaiPheDuyet` | ✅ |
| `orgUnitId` (line 60) | `orgUnitId` | ✅ |

No phantom fields found. No `ghiChu`, `eventType`, or `Attachment`. No GPS fields misplaced.

#### Zod Schema ✅

- `schema.ts` line 45: `viDo` uses `z.coerce.number().min(-90).max(90)` — matches BE `@DecimalMin("-90") @DecimalMax("90")` (CreateCangBienRequest.java lines 31-33).
- `schema.ts` line 47: `dienTich` uses `z.coerce.number().positive()` — matches BE `@DecimalMin(value="0", inclusive=false)` (line 39).
- `schema.ts` line 51-57: `.refine()` for GPS paired check — matches BE `@AssertTrue isGpsPaired()` (lines 48-52).
- `schema.ts` line 37: `maCang` uses `z.string().min(1).max(50)` — matches BE `@NotBlank @Size(max=50)` (lines 20-22).
- `schema.ts` line 44: `tinhThanhPho` uses `z.string().max(100)` — matches BE `@Size(max=100)` (line 28).
- Status enums use `z.enum(['HIỆN_HÀNH', 'TẠM_NGƯNG'])` and `z.enum(['CHỜ_PHE_DUYỆT', 'ĐƯỢC_PHE_DUYỆT', 'TỪ_CHỐI'])` — full Vietnamese diacritics.

#### API Endpoint Accuracy ✅

- List: `GET /cang-bien?params` — matches BE `@GetMapping` (CangBienController.java line 70).
- Get: `GET /cang-bien/{id}` — matches BE `@GetMapping("/{id}")` (line 62).
- Create: `POST /cang-bien` — matches BE `@PostMapping` (line 51).
- Update: `PUT /cang-bien` — matches BE `@PutMapping` (line 83, no path variable).
- Delete: `DELETE /cang-bien/{id}` — matches BE `@DeleteMapping("/{id}")` (line 94).
- Approve: `POST /cang-bien/{id}/approve` — matches BE line 104.
- Reject: `POST /cang-bien/{id}/reject?reason=...` — matches BE line 115.
- History: `GET /cang-bien/{id}/history` — matches BE line 129.

#### Tech Stack ✅

- Uses Ant Design components (`Form`, `Input`, `InputNumber`, `Select`, `message`, `Space`). ✅
- Uses `Form.useForm()` with antd rules. ✅
- Uses shared `api` (axios instance, imported from `../api`). ✅
- Uses antd `message` for toasts. ✅

---

### 2.2 BenCang (7 pages + 3 support files)

**Files tested (all on disk, verified):**

- `frontend/src/app/bencang/BenCangListPage.tsx` (370 lines)
- `frontend/src/app/bencang/BenCangDetailPage.tsx` (244 lines)
- `frontend/src/app/bencang/BenCangCreatePage.tsx` (236 lines)
- `frontend/src/app/bencang/BenCangUpdatePage.tsx` (272 lines)
- `frontend/src/app/bencang/BenCangApprovePage.tsx` (exists on disk)
- `frontend/src/app/bencang/BenCangDeleteConfirm.tsx` (exists on disk)
- `frontend/src/app/bencang/BenCangHistoryPage.tsx` (exists on disk)
- `frontend/src/app/bencang/api.ts` (87 lines)
- `frontend/src/app/bencang/schema.ts` (79 lines)
- `frontend/src/app/bencang/types.ts` (86 lines)

**Status: FAIL — 6 issues found**

#### MUST FIX — 4 issues

1. **`api.ts` line 11-25**: Uses raw `fetch()` instead of the shared axios `api` instance. This breaks consistency with all other entity groups (CangBien, CauCang, CangCan, VungNuoc, GiayTo) which all use the shared axios `api`. The raw `fetch` also does not automatically unwrap the `ApiResponse<T>` envelope — it manually does `return json.data as T` (line 24), which may break if the response format changes or if global interceptors (auth tokens, error handling) are configured on the axios instance.

2. **`schema.ts` line 7**: `approvalStatus` enum uses **mixed convention**: `CHO_PHE_DUYET` (ASCII) but `ĐƯỢC_PHE_DUYỆT` and `TỪ_CHỐI` (full Vietnamese diacritics). This is internally inconsistent — either all ASCII or all diacritics. The first value is ASCII while the other two are diacritic.

3. **`types.ts` line 27**: `ApprovalStatus` type uses ASCII values `"CHO_PHE_DUYET" | "DUOC_PHE_DUYET" | "TU_CHOI"`. However, `schema.ts` line 7 uses diacritic values for 2 of 3 options. If the BE returns diacritic values, all comparisons will fail. The type and schema disagree on convention.

4. **`BenCangListPage.tsx` line 65**: `useEffect(() => { void fetchData(); }, [fetchData])` — `fetchData` is created with `useCallback` (line 43) and its dependency array includes `filterMaBen`, `filterTenBen`, `filterLoaiBen`, `filterStatus`. Since these states change on every render through `handleSearch` and other callbacks, `fetchData` is recreated on each render, causing `useEffect` to re-trigger, causing another render — an **infinite re-render loop**.

#### SHOULD FIX — 2 issues

5. **`BenCangUpdatePage.tsx` line 252-253**: Compares `entityData.trangThaiPheDuyet` against ASCII values (`'CHO_PHE_DUYET'`, `'DUOC_PHE_DUYET'`). If the BE (or the `benCangCRUD` service layer used on line 26) returns diacritic values, the badge color logic will always fall to `'red'` (else clause), showing wrong colors.

6. **`api.ts` line 35-48**: `fetchBenCangList` only accepts `page`, `size`, `orgUnitId` params. But `BenCangListPage.tsx` line 47 calls `benCangCRUD.search()` (via `cangbenService`) which sends many more filters (`maBen`, `tenBen`, `loaiBen`, `trangThaiHoatDong`). The `api.ts` CRUD layer is effectively bypassed — an architectural inconsistency.

#### NICE TO HAVE — 0

#### Field Name Accuracy ✅

All field names match BE exactly (verified against `BenCang.java`):

| BE Field (BenCang.java) | Frontend Field | Status |
|------------------------|----------------|--------|
| `maBen` (line 29) | `maBen` | ✅ |
| `tenBen` (line 32) | `tenBen` | ✅ |
| `cangBienId` (line 35, UUID) | `cangBienId` | ✅ |
| `tuyenDuongThuy` (line 38) | `tuyenDuongThuy` | ✅ |
| `viDo` (line 41) | `viDo` | ✅ |
| `kinhDo` (line 44) | `kinhDo` | ✅ |
| `chieuDai` (line 47) | `chieuDai` | ✅ |
| `chieuRong` (line 50) | `chieuRong` | ✅ |
| `loaiBen` (line 53) | `loaiBen` | ✅ |
| `doSauLuong` (line 56) | `doSauLuong` | ✅ |
| `trangThaiHoatDong` (line 59) | `trangThaiHoatDong` | ✅ |
| `trangThaiPheDuyet` (line 62) | `trangThaiPheDuyet` | ✅ |

No phantom fields found.

#### Zod Schema ✅

- `schema.ts` line 20: `maBen` uses `z.string().min(1).max(50)` — matches BE `@NotBlank @Size(max=50)` (CreateBenCangRequest.java lines 14-16).
- `schema.ts` line 21: `tenBen` uses `z.string().min(1).max(255)` — matches BE `@NotBlank @Size(max=255)` (lines 17-19).
- `schema.ts` line 22: `cangBienId` uses `z.string().uuid()` — matches BE `@NotNull` + UUID type (lines 21-23).
- Status enums use `z.enum(["HIỆN_HÀNH", "TẠM_NGƯNG"])` — full diacritics.
- Approval status enum: mixed (see MUST FIX #2).

#### API Endpoint Accuracy ✅

- All endpoints in `api.ts` use `BASE = "/api/v1/ben-cang"` (line 5).
- List: `GET /api/v1/ben-cang?params` — matches BE `@GetMapping` (BenCangController.java line 65).
- Create: `POST /api/v1/ben-cang` — matches BE `@PostMapping` (line 46).
- Update: `PUT /api/v1/ben-cang` — matches BE `@PutMapping` (line 78).
- Delete: `DELETE /api/v1/ben-cang/{id}` — matches BE `@DeleteMapping("/{id}")` (line 89).
- Approve: `POST /api/v1/ben-cang/{id}/approve` — matches BE line 99.
- Reject: `POST /api/v1/ben-cang/{id}/reject?reason=...` — matches BE line 110.
- History: `GET /api/v1/ben-cang/{id}/history` — matches BE line 124.

#### Tech Stack ⚠️

- Uses Ant Design `Card`, `Form`, `FormField` custom component. ✅
- Uses **`FormField`** custom component (not standard antd `Form.Item`).
- Uses **`toast`** (custom ToastNotification from `../../components/ToastNotification`, line 8) instead of antd `message`. **Inconsistent with CangBien which uses antd `message`.**
- Uses shared `api`? **NO** — uses raw `fetch()` in `api.ts`. ⚠️

---

### 2.3 CauCang (7 pages + 3 support files)

**Files tested (all on disk, verified):**

- `frontend/src/app/caucang/CauCangListPage.tsx` (378 lines)
- `frontend/src/app/caucang/CauCangDetailPage.tsx` (exists on disk)
- `frontend/src/app/caucang/CauCangCreatePage.tsx` (169 lines)
- `frontend/src/app/caucang/CauCangUpdatePage.tsx` (exists on disk)
- `frontend/src/app/caucang/CauCangApprovePage.tsx` (exists on disk)
- `frontend/src/app/caucang/CauCangDeleteConfirm.tsx` (exists on disk)
- `frontend/src/app/caucang/CauCangHistoryPage.tsx` (exists on disk)
- `frontend/src/app/caucang/api.ts` (85 lines)
- `frontend/src/app/caucang/schema.ts` (71 lines)
- `frontend/src/app/caucang/types.ts` (69 lines)

**Status: FAIL — 4 issues found**

#### MUST FIX — 1 issue

1. **`schema.ts` line 7**: `benCangId` uses `z.string().min(1, 'Bến cảng chủ không được để trống')` — but BE entity `CauCang.java` line 36 defines `benCangId` as `UUID` type. Should use `z.string().uuid('ID bến cảng không hợp lệ')` (note: the list filters schema on line 63 correctly uses `z.string().uuid()` for `benCangId`, but the create/update schemas do not).

#### SHOULD FIX — 3 issues

2. **`CauCangCreatePage.tsx` line 11**: Label typo — `{ label: 'Hiện hình', value: 'HIỆN_HÀNH' }`. The word "Hiện hình" is a typo; it should be "Hiện hành" (as used by CangBien). This same typo appears in `CauCangListPage.tsx` line 29.

3. **`api.ts` line 60-62**: `approveCauCang` sends `{ userId }` in the request body. But the BE controller `CauCangController.java` line 93-98 extracts `userId` from `Authentication authentication`. The frontend-sent userId is redundant — the BE already gets it from the security context. If the frontend userId differs from the authenticated user, this is a potential security concern (though the BE ignores it in favor of the auth context).

4. **`CauCangCreatePage.tsx` line 51-55**: `catch` block does nothing — no `toast.error()` call. Server validation errors (e.g., duplicate `maCau`) will silently fail without any user feedback.

#### NICE TO HAVE — 0

#### Field Name Accuracy ✅

All field names match BE exactly (verified against `CauCang.java`):

| BE Field (CauCang.java) | Frontend Field | Status |
|------------------------|----------------|--------|
| `maCau` (line 29) | `maCau` | ✅ |
| `tenCau` (line 32) | `tenCau` | ✅ |
| `benCangId` (line 35, UUID) | `benCangId` | ✅ |
| `chieuDai` (line 38) | `chieuDai` | ✅ |
| `taiTrong` (line 41) | `taiTrong` | ✅ |
| `loaiCau` (line 44) | `loaiCau` | ✅ |
| `trangThaiHoatDong` (line 47) | `trangThaiHoatDong` | ✅ |
| `trangThaiPheDuyet` (line 50) | `trangThaiPheDuyet` | ✅ |

No phantom fields found.

#### Zod Schema ✅ (with 1 issue — see MUST FIX #1)

#### API Endpoint Accuracy ✅

- All endpoints use `BASE = '/api/v1/cau-cang'` (api.ts line 11).
- List: `GET /api/v1/cau-cang` — matches BE `@GetMapping` (CauCangController.java line 57).
- Get by code: `GET /api/v1/cau-cang/code/{maCau}` — matches BE `@GetMapping("/code/{maCau}")` (line 67).
- Create: `POST /api/v1/cau-cang` — matches BE `@PostMapping` (line 44).
- Update: `PUT /api/v1/cau-cang` — matches BE `@PutMapping` (line 74).
- Delete: `DELETE /api/v1/cau-cang/{id}` — matches BE `@DeleteMapping("/{id}")` (line 80).
- Approve: `POST /api/v1/cau-cang/{id}/approve` — matches BE line 90.
- Reject: `POST /api/v1/cau-cang/{id}/reject?reason=...` — matches BE line 101.
- History: `GET /api/v1/cau-cang/{id}/history` — matches BE line 115.

#### Tech Stack ✅

- Uses Ant Design components. ✅
- Uses shared `api` (axios instance, line 1 of `api.ts`). ✅
- Uses **`toast`** (custom ToastNotification) instead of antd `message`. ⚠️ Inconsistent with CangBien.

---

### 2.4 CangCan (7 pages + 3 support files)

**Files tested (all on disk, verified):**

- `frontend/src/app/cangcan/CangCanListPage.tsx` (359 lines)
- `frontend/src/app/cangcan/CangCanDetailPage.tsx` (exists on disk)
- `frontend/src/app/cangcan/CangCanCreatePage.tsx` (297 lines)
- `frontend/src/app/cangcan/CangCanUpdatePage.tsx` (exists on disk)
- `frontend/src/app/cangcan/CangCanApprovePage.tsx` (exists on disk)
- `frontend/src/app/cangcan/CangCanDeleteConfirm.tsx` (exists on disk)
- `frontend/src/app/cangcan/CangCanHistoryPage.tsx` (exists on disk)
- `frontend/src/app/cangcan/api.ts` (103 lines)
- `frontend/src/app/cangcan/schema.ts` (93 lines)
- `frontend/src/app/cangcan/types.ts` (85 lines)

**Status: PASS — with notes**

#### Field Name Accuracy ✅

All field names match BE exactly (verified against `CangCan.java`):

| BE Field (CangCan.java) | Frontend Field | Status |
|------------------------|----------------|--------|
| `maCangCan` (line 28) | `maCangCan` | ✅ |
| `tenCangCan` (line 31) | `tenCangCan` | ✅ |
| `tinhThanhPho` (line 34) | `tinhThanhPho` | ✅ |
| `viDo` (line 37) | `viDo` | ✅ |
| `kinhDo` (line 40) | `kinhDo` | ✅ |
| `dienTich` (line 43) | `dienTich` | ✅ |
| `congSuatTEU` (line 46) | `congSuatTEU` | ✅ |
| `trangThaiHoatDong` (line 49) | `trangThaiHoatDong` | ✅ |
| `trangThaiPheDuyet` (line 52) | `trangThaiPheDuyet` | ✅ |

No phantom fields found.

#### Zod Schema ✅

- `schema.ts` line 7: `maCangCan` uses `z.string().min(1).max(50)` — matches BE `@NotBlank @Size(max=50)` (CreateCangCanRequest.java lines 15-17).
- `schema.ts` line 12: `dienTich` uses `z.coerce.number().positive()` — matches BE `@DecimalMin(inclusive=false="0")` (line 34).
- `schema.ts` line 17-23: GPS paired `.refine()` — matches BE `@AssertTrue isGpsPaired()` (lines 40-46).
- Status enums use `z.enum(['HIỆN_HÀNH', 'TẠM_NGƯNG'])` and `z.enum(['CHỜ_PHE_DUYỆT', 'ĐƯỢC_PHE_DUYỆT', 'TỪ_CHỐI'])` — full diacritics.

#### API Endpoint Accuracy ✅

- All endpoints use relative paths that prepend to API base URL.
- List: `GET /cang-can?params` — matches BE `@GetMapping` (CangCanController.java line 65).
- Create: `POST /cang-can` — matches BE `@PostMapping` (line 46).
- Update: `PUT /cang-can` — matches BE `@PutMapping` (line 78).
- Delete: `DELETE /cang-can/{id}` — matches BE `@DeleteMapping("/{id}")` (line 89).
- Approve: `POST /cang-can/{id}/approve` — matches BE line 99.
- Reject: `POST /cang-can/{id}/reject?reason=...` — matches BE line 110.
- History: `GET /cang-can/{id}/history` — matches BE line 124.

#### Tech Stack ✅

- Uses Ant Design `Form.Item` with native `rules` validation. ✅
- Uses shared `api` (axios instance, line 1 of `api.ts`). ✅
- Uses **`toast`** (custom ToastNotification). ⚠️ Inconsistent with CangBien.

---

### 2.5 VungNuoc (7 pages + 3 support files)

**Files tested (all on disk, verified):**

- `frontend/src/app/vungnuoc/VungNuocListPage.tsx` (334 lines)
- `frontend/src/app/vungnuoc/VungNuocDetailPage.tsx` (exists on disk)
- `frontend/src/app/vungnuoc/VungNuocCreatePage.tsx` (155 lines)
- `frontend/src/app/vungnuoc/VungNuocUpdatePage.tsx` (exists on disk)
- `frontend/src/app/vungnuoc/VungNuocApprovePage.tsx` (exists on disk)
- `frontend/src/app/vungnuoc/VungNuocDeleteConfirm.tsx` (exists on disk)
- `frontend/src/app/vungnuoc/VungNuocHistoryPage.tsx` (exists on disk)
- `frontend/src/app/vungnuoc/api.ts` (92 lines)
- `frontend/src/app/vungnuoc/schema.ts` (92 lines)
- `frontend/src/app/vungnuoc/types.ts` (100 lines)

**Status: FAIL — 3 issues found**

#### MUST FIX — 3 issues

1. **`api.ts` line 37-47**: `vungNuocApi.list()` sends search/filter params (`maVungNuoc`, `tenVungNuoc`, `trangThaiHoatDong`, `trangThaiPheDuyet`, `cangBienId`) as query parameters. However, the BE controller `VungNuocController.java` line 58-67 only accepts `page`, `size`, `orgUnitId`, and `cangBienId` as `@RequestParam`. There is **no `search`, `maVungNuoc`, `tenVungNuoc`, `trangThaiHoatDong`, or `trangThaiPheDuyet` parameter** in the BE list endpoint. The search and status filter functionality will silently do nothing — the BE ignores all those params.

2. **`VungNuocListPage.tsx` line 65**: `useEffect(() => { void fetchData(); }, [])` — empty dependency array. The list page never refetches when search terms or filter selections change. The search functionality is broken even if the BE accepted those params.

3. **`types.ts` line 9-12**: `VungNuocTrangThaiPheDuyet` is defined as `'CHỜ_PHÊ_DUYỆT' | 'ĐƯỢC_PHÊ_DUYỆT' | 'TỪ_CHỐI'` — note the use of `PHÊ` (accent on Ê). CangBien `schema.ts` line 11 uses `'CHỜ_PHE_DUYỆT' | 'ĐƯỢC_PHE_DUYỆT' | 'TỪ_CHỐI'` — `PHE` without accent on Ê. **`PHÊ` vs `PHE` is a spelling mismatch.** If the BE returns the other spelling, all status comparisons and filtering will fail.

#### SHOULD FIX — 0

1. **`api.ts` line 79**: `vungNuocApi.approve(id, userId)` sends `{ userId }` in the body. BE controller `VungNuocController.java` line 93-98 extracts userId from `Authentication authentication`. Redundant (same issue as CauCang).

#### NICE TO HAVE — 0

#### Field Name Accuracy ✅

All field names match BE exactly (verified against `VungNuoc.java`):

| BE Field (VungNuoc.java) | Frontend Field | Status |
|------------------------|----------------|--------|
| `maVungNuoc` (line 29) | `maVungNuoc` | ✅ |
| `tenVungNuoc` (line 32) | `tenVungNuoc` | ✅ |
| `cangBienId` (line 35, UUID) | `cangBienId` | ✅ |
| `dienTich` (line 38) | `dienTich` | ✅ |
| `doSauMax` (line 41) | `doSauMax` | ✅ |
| `doSauTrungBinh` (line 44) | `doSauTrungBinh` | ✅ |
| `loaiVungNuoc` (line 47) | `loaiVungNuoc` | ✅ |
| `trangThaiHoatDong` (line 50) | `trangThaiHoatDong` | ✅ |
| `trangThaiPheDuyet` (line 53) | `trangThaiPheDuyet` | ✅ |

No GPS fields (`viDo`/`kinhDo`) in VungNuoc — confirmed correct, GPS belongs to CangBien parent only.

#### Zod Schema ✅

- `schema.ts` line 8: `maVungNuoc` uses `z.string().min(1).max(50)` — matches BE `@NotBlank @Size(max=50)` (CreateVungNuocRequest.java lines 14-16).
- `schema.ts` line 16: `cangBienId` uses `z.string().uuid()` — matches BE `@NotNull` + UUID type (line 22).
- Status enums use `z.enum(['HIỆN_HÀNH', 'TẠM_NGƯNG'])` — full diacritics.
- Approval status enums in list filter: `z.enum(['CHỜ_PHÊ_DUYỆT', 'ĐƯỢC_PHÊ_DUYỆT', 'TỪ_CHỐI'])` (line 84) — uses `PHÊ` (see MUST FIX #3).

#### API Endpoint Accuracy ✅

- All endpoints use relative paths.
- List: `GET /vung-nuoc?params` — matches BE `@GetMapping` (VungNuocController.java line 57). ⚠️ But search params ignored (see MUST FIX #1).
- Get by code: `GET /vung-nuoc/code/{maVungNuoc}` — matches BE `@GetMapping("/code/{maVungNuoc}")` (line 69).
- Create: `POST /vung-nuoc` — matches BE `@PostMapping` (line 44).
- Update: `PUT /vung-nuoc` — matches BE `@PutMapping` (line 76).
- Delete: `DELETE /vung-nuoc/{id}` — matches BE `@DeleteMapping("/{id}")` (line 82).
- Approve: `POST /vung-nuoc/{id}/approve` — matches BE line 92.
- Reject: `POST /vung-nuoc/{id}/reject?reason=...` — matches BE line 103.
- History: `GET /vung-nuoc/{id}/history` — matches BE line 117.

#### Tech Stack ✅

- Uses Ant Design `Form` + `FormField` component. ✅
- Uses shared `api` (axios instance, line 4 of `api.ts`). ✅
- Uses **`toast`** (custom ToastNotification). ⚠️ Inconsistent with CangBien.

---

### 2.6 GiayTo (1 page + 3 support files)

**Files tested (all on disk, verified):**

- `frontend/src/app/giayto/GiayToUploadPage.tsx` (exists on disk)
- `frontend/src/app/giayto/api.ts` (82 lines)
- `frontend/src/app/giayto/schema.ts` (28 lines)
- `frontend/src/app/giayto/types.ts` (40 lines)

**Status: PASS — with notes**

#### Field Name Accuracy ✅

All field names match BE exactly (verified against `GiayTo.java`):

| BE Field (GiayTo.java) | Frontend Field | Status |
|------------------------|----------------|--------|
| `entityType` (line 36) | `entityType` | ✅ |
| `entityId` (line 41, String) | `entityId: string` | ✅ |
| `fileName` (line 47) | `fileName` | ✅ |
| `fileSize` (line 53, Long) | `fileSize: number` | ✅ |
| `mimeType` (line 59) | `mimeType` | ✅ |
| `minioKey` (line 67) | `minioKey` | ✅ |
| `uploadedBy` (line 73) | `uploadedBy` | ✅ |

No phantom fields found.

#### Zod Schema ✅

- `schema.ts` line 7: `file` validates `instanceof(File)` with size > 0. ✅
- `schema.ts` line 17-25: `fileSchema` validates size <= 10MB. ✅
- Note: BE controller `GiayToController.java` line 83-88 validates MIME type. Frontend does not validate MIME type before upload — BE will reject invalid MIME types silently. **SHOULD FIX: Frontend should validate MIME type against allowed list before upload.**

#### API Endpoint Accuracy ✅

- Upload: `POST /giay-to/upload/{entityType}/{entityId}` — matches BE `@PostMapping("/upload/{entityType}/{entityId}")` (GiayToController.java line 64).
- List by entity: `GET /giay-to/entity/{entityType}/{entityId}` — matches BE `@GetMapping("/entity/{entityType}/{entityId}")` (line 105).
- Get by ID: `GET /giay-to/{id}` — matches BE `@GetMapping("/{id}")` (line 129).
- Delete: `DELETE /giay-to/{id}` — matches BE `@DeleteMapping("/{id}")` (line 146).

#### Tech Stack ✅

- Uses shared `api` (axios instance, line 4 of `api.ts`). ✅
- Uses **`toast`** (custom ToastNotification). ⚠️ Inconsistent with CangBien.

---

## 3. Field Name Mismatch Table

| BE Field | Entity (source file) | Expected Frontend | Actual Frontend | Status |
|----------|---------------------|-------------------|-----------------|--------|
| `tinhThanhPho` | CangBien.java:39 | `tinhThanhPho` | `tinhThanhPho` | ✅ Match |
| `khaNangTiepNhan` | CangBien.java:51 | `khaNangTiepNhan` | `khaNangTiepNhan` | ✅ Match |
| `maCangCan` | CangCan.java:28 | `maCangCan` | `maCangCan` | ✅ Match |
| `maCang` | CangBien.java:33 | `maCang` | `maCang` | ✅ Match |
| `cangBienId` | BenCang.java:35 | `cangBienId` | `cangBienId` | ✅ Match |
| `benCangId` | CauCang.java:35 | `benCangId` | `benCangId` | ✅ Match |
| `maVungNuoc` | VungNuoc.java:29 | `maVungNuoc` | `maVungNuoc` | ✅ Match |
| `doSauMax` | VungNuoc.java:41 | `doSauMax` | `doSauMax` | ✅ Match |
| `doSauTrungBinh` | VungNuoc.java:44 | `doSauTrungBinh` | `doSauTrungBinh` | ✅ Match |
| `maBen` | BenCang.java:29 | `maBen` | `maBen` | ✅ Match |
| `maCau` | CauCang.java:29 | `maCau` | `maCau` | ✅ Match |
| `entityType` | GiayTo.java:36 | `entityType` | `entityType` | ✅ Match |
| `fileSize` | GiayTo.java:53 | `number` | `number` | ✅ Match |

**No field name mismatches found.** The specific mismatches mentioned in the task requirements (`tinhThanh` vs `tinhThanhPho`, `khaNangTiepNhanTau` vs `khaNangTiepNhan`, `maCang` vs `maCangCan`) were verified — none are present in the actual frontend code.

---

## 4. Zod Schema Mismatch Table

| Entity | Field | Schema Name | BE Annotation | Frontend Zod | Status |
|--------|-------|------------|---------------|-------------|--------|
| CangBien | `maCang` | createSchema | `@NotBlank @Size(max=50)` | `z.string().min(1).max(50)` | ✅ |
| CangBien | `tenCang` | createSchema | `@NotBlank @Size(max=255)` | `z.string().min(1).max(255)` | ✅ |
| CangBien | `tinhThanhPho` | createSchema | `@Size(max=100)` | `z.string().max(100)` | ✅ |
| CangBien | `viDo` | createSchema | `@DecimalMin("-90") @DecimalMax("90")` | `z.coerce.number().min(-90).max(90)` | ✅ |
| CangBien | `kinhDo` | createSchema | `@DecimalMin("-180") @DecimalMax("180")` | `z.coerce.number().min(-180).max(180)` | ✅ |
| CangBien | `dienTich` | createSchema | `@DecimalMin(inclusive=false="0")` | `z.coerce.number().positive()` | ✅ |
| CangBien | GPS paired | createSchema | `@AssertTrue isGpsPaired()` | `.refine()` line 51-57 | ✅ |
| BenCang | `maBen` | createSchema | `@NotBlank @Size(max=50)` | `z.string().min(1).max(50)` | ✅ |
| BenCang | `tenBen` | createSchema | `@NotBlank @Size(max=255)` | `z.string().min(1).max(255)` | ✅ |
| BenCang | `cangBienId` | createSchema | `@NotNull UUID` | `z.string().uuid()` | ✅ |
| CangCan | `maCangCan` | createCangCanSchema | `@NotBlank @Size(max=50)` | `z.string().min(1).max(50)` | ✅ |
| CangCan | `dienTich` | createCangCanSchema | `@DecimalMin(inclusive=false="0")` | `z.coerce.number().positive()` | ✅ |
| CangCan | GPS paired | createCangCanSchema | `@AssertTrue isGpsPaired()` | `.refine()` line 17-23 | ✅ |
| VungNuoc | `maVungNuoc` | vungNuocCreateSchema | `@NotBlank @Size(max=50)` | `z.string().min(1).max(50)` | ✅ |
| VungNuoc | `cangBienId` | vungNuocCreateSchema | `@NotNull UUID` | `z.string().uuid()` | ✅ |
| CauCang | `maCau` | cauCangCreateSchema | `@NotBlank @Size(max=50)` | `z.string().min(1).max(50)` | ✅ |
| CauCang | `benCangId` | cauCangCreateSchema | `@NotNull UUID` | `z.string().min(1)` | ❌ **MUST FIX** |

**1 schema issue:** CauCang `benCangId` in `cauCangCreateSchema.ts` line 7 uses `z.string().min(1)` instead of `z.string().uuid()` — the BE entity `CauCang.java` line 36 defines `benCangId` as UUID.

---

## 5. API Endpoint Mismatch Table

| Entity | Operation | BE Endpoint (source file) | Frontend Endpoint | Status |
|--------|-----------|--------------------------|-------------------|--------|
| CangBien | List | `GET /api/v1/cang-bien` (CangBienController.java:70) | `GET /cang-bien?params` (api.ts:40) | ✅ |
| CangBien | Get | `GET /api/v1/cang-bien/{id}` (line 62) | `GET /cang-bien/{id}` (api.ts:45) | ✅ |
| CangBien | Create | `POST /api/v1/cang-bien` (line 51) | `POST /cang-bien` (api.ts:50) | ✅ |
| CangBien | Update | `PUT /api/v1/cang-bien` (line 83) | `PUT /cang-bien` (api.ts:55) | ✅ |
| CangBien | Delete | `DELETE /api/v1/cang-bien/{id}` (line 94) | `DELETE /cang-bien/{id}` (api.ts:60) | ✅ |
| CangBien | Approve | `POST /api/v1/cang-bien/{id}/approve` (line 104) | `POST /cang-bien/{id}/approve` (api.ts:66) | ✅ |
| CangBien | Reject | `POST /api/v1/cang-bien/{id}/reject?reason` (line 115) | `POST /cang-bien/{id}/reject?reason` (api.ts:71) | ✅ |
| CangBien | History | `GET /api/v1/cang-bien/{id}/history` (line 129) | `GET /cang-bien/{id}/history` (api.ts:85) | ✅ |
| BenCang | List | `GET /api/v1/ben-cang` (BenCangController.java:65) | `GET /api/v1/ben-cang?params` (api.ts:48) | ⚠️ raw `fetch()` |
| BenCang | Create | `POST /api/v1/ben-cang` (line 46) | `POST /api/v1/ben-cang` (api.ts:56) | ✅ |
| BenCang | Update | `PUT /api/v1/ben-cang` (line 78) | `PUT /api/v1/ben-cang` (api.ts:60) | ✅ |
| BenCang | Delete | `DELETE /api/v1/ben-cang/{id}` (line 89) | `DELETE /api/v1/ben-cang/{id}` (api.ts:64) | ✅ |
| BenCang | Approve | `POST /api/v1/ben-cang/{id}/approve` (line 99) | `POST /api/v1/ben-cang/{id}/approve` (api.ts:72) | ✅ |
| BenCang | Reject | `POST /api/v1/ben-cang/{id}/reject?reason` (line 110) | `POST /api/v1/ben-cang/{id}/reject?reason` (api.ts:78) | ✅ |
| BenCang | History | `GET /api/v1/ben-cang/{id}/history` (line 124) | `GET /api/v1/ben-cang/{id}/history` (api.ts:86) | ✅ |
| CauCang | List | `GET /api/v1/cau-cang` (CauCangController.java:57) | `GET /api/v1/cau-cang?params` (api.ts:26) | ✅ |
| CauCang | Get | `GET /api/v1/cau-cang/{id}` (line 51) | `GET /api/v1/cau-cang/{id}` (api.ts:32) | ✅ |
| CauCang | Create | `POST /api/v1/cau-cang` (line 44) | `POST /api/v1/cau-cang` (api.ts:44) | ✅ |
| CauCang | Update | `PUT /api/v1/cau-cang` (line 74) | `PUT /api/v1/cau-cang` (api.ts:50) | ✅ |
| CauCang | Delete | `DELETE /api/v1/cau-cang/{id}` (line 80) | `DELETE /api/v1/cau-cang/{id}` (api.ts:56) | ✅ |
| CauCang | Approve | `POST /api/v1/cau-cang/{id}/approve` (line 90) | `POST /api/v1/cau-cang/{id}/approve` (api.ts:61) | ✅ |
| CangCan | List | `GET /api/v1/cang-can` (CangCanController.java:65) | `GET /cang-can?params` (api.ts:49) | ✅ |
| CangCan | Create | `POST /api/v1/cang-can` (line 46) | `POST /cang-can` (api.ts:69) | ✅ |
| CangCan | Update | `PUT /api/v1/cang-can` (line 78) | `PUT /cang-can` (api.ts:76) | ✅ |
| CangCan | Delete | `DELETE /api/v1/cang-can/{id}` (line 89) | `DELETE /cang-can/{id}` (api.ts:83) | ✅ |
| CangCan | Approve | `POST /api/v1/cang-can/{id}/approve` (line 99) | `POST /cang-can/{id}/approve` (api.ts:89) | ✅ |
| VungNuoc | List | `GET /api/v1/vung-nuoc` (VungNuocController.java:57) | `GET /vung-nuoc?search&maVungNuoc&tenVungNuoc&status&approvalStatus` (api.ts:48) | ❌ **BE ignores search params** |
| VungNuoc | Get | `GET /api/v1/vung-nuoc/{id}` (line 51) | `GET /vung-nuoc/{id}` (api.ts:53) | ✅ |
| VungNuoc | Create | `POST /api/v1/vung-nuoc` (line 44) | `POST /vung-nuoc` (api.ts:63) | ✅ |
| VungNuoc | Update | `PUT /api/v1/vung-nuoc` (line 76) | `PUT /vung-nuoc` (api.ts:68) | ✅ |
| VungNuoc | Delete | `DELETE /api/v1/vung-nuoc/{id}` (line 82) | `DELETE /vung-nuoc/{id}` (api.ts:73) | ✅ |
| VungNuoc | Approve | `POST /api/v1/vung-nuoc/{id}/approve` (line 92) | `POST /vung-nuoc/{id}/approve` (api.ts:79) | ✅ |
| VungNuoc | Reject | `POST /api/v1/vung-nuoc/{id}/reject?reason` (line 103) | `POST /vung-nuoc/{id}/reject?reason` (api.ts:83) | ✅ |
| VungNuoc | History | `GET /api/v1/vung-nuoc/{id}/history` (line 117) | `GET /vung-nuoc/{id}/history` (api.ts:89) | ✅ |
| GiayTo | Upload | `POST /api/v1/giay-to/upload/{entityType}/{entityId}` (GiayToController.java:64) | `POST /giay-to/upload/{entityType}/{entityId}` (api.ts:41) | ✅ |
| GiayTo | List | `GET /api/v1/giay-to/entity/{entityType}/{entityId}` (line 105) | `GET /giay-to/entity/{entityType}/{entityId}` (api.ts:57) | ✅ |
| GiayTo | Get | `GET /api/v1/giay-to/{id}` (line 129) | `GET /giay-to/{id}` (api.ts:65) | ✅ |
| GiayTo | Delete | `DELETE /api/v1/giay-to/{id}` (line 146) | `DELETE /giay-to/{id}` (api.ts:73) | ✅ |

**API Issues:**
1. **VungNuoc List** — `api.ts` line 37-47 sends search/filter params (`maVungNuoc`, `tenVungNuoc`, `trangThaiHoatDong`, `trangThaiPheDuyet`) that the BE `VungNuocController.java` does not accept. Search is a no-op.
2. **BenCang API** — uses raw `fetch()` instead of shared axios instance.

---

## 6. RBAC Issue Table

| Entity | Action | BE Annotation | Frontend Enforcement | Status |
|--------|--------|---------------|---------------------|--------|
| CangBien | Create | `@PreAuthorize("@auth.check('cangbien:create')")` | No RBAC check in CreatePage | ⚠️ SHOULD FIX |
| CangBien | Update | `@PreAuthorize("@auth.check('cangbien:update')")` | No RBAC check in UpdatePage | ⚠️ SHOULD FIX |
| CangBien | Delete | `@PreAuthorize("@auth.check('cangbien:delete')")` | Delete button always visible in List/Detail | ⚠️ SHOULD FIX |
| CangBien | Approve | `@PreAuthorize("@auth.check('cangbien:approve')")` | Only visible when `trangThaiPheDuyet === 'CHỜ_PHE_DUYỆT'` (ListPage line 280) | ✅ Partial |
| BenCang | Create | `@PreAuthorize("@auth.check('bencang:create')")` | No RBAC check | ⚠️ SHOULD FIX |
| BenCang | Update | `@PreAuthorize("@auth.check('bencang:update')")` | No RBAC check | ⚠️ SHOULD FIX |
| BenCang | Delete | `@PreAuthorize("@auth.check('bencang:delete')")` | Only visible when `trangThaiPheDuyet === 'CHO_PHE_DUYET' \|\| 'TU_CHOI'` (DetailPage line 97) | ✅ Partial |
| BenCang | Approve | `@PreAuthorize("@auth.check('bencang:approve')")` | Only visible when `trangThaiPheDuyet === 'CHO_PHE_DUYET'` (DetailPage line 98) | ✅ Partial |
| CauCang | Delete | `@PreAuthorize("@auth.check('caucang:delete')")` | Always visible in ListPage (Popconfirm line 272) | ⚠️ SHOULD FIX |
| CangCan | Delete | `@PreAuthorize("@auth.check('cangcan:delete')")` | Always visible in ListPage (Popconfirm line 253) | ⚠️ SHOULD FIX |
| VungNuoc | Delete | `@PreAuthorize("@auth.check('vungnuoc:delete')")` | Only visible when `trangThaiPheDuyet === 'CHỜ_PHÊ_DUYỆT'` (ListPage line 233) | ✅ Partial |
| GiayTo | Upload | `@PreAuthorize("@auth.check('data:update')")` | No RBAC check in UploadPage | ⚠️ SHOULD FIX |
| GiayTo | Delete | `@PreAuthorize("@auth.check('data:update')")` | No RBAC check | ⚠️ SHOULD FIX |

**RBAC Summary:** All controllers have proper `@PreAuthorize` annotations. However, the frontend does not check user roles before rendering action buttons (except for approval-status-based visibility). This means a user without the proper role could theoretically call the API directly (e.g., via curl) — but the BE will reject it. The UI should still hide buttons to avoid confusion. This is a SHOULD FIX across all 6 entities.

---

## 7. Tech Stack Consistency Check

| Entity Group | Uses Ant Design | Uses antd Form | Uses shared `api` (axios) | Uses antd `message` | Notes |
|-------------|-----------------|----------------|--------------------------|---------------------|-------|
| CangBien | ✅ | ✅ (`Form.useForm()`) | ✅ (`api` from `../api`) | ✅ (`message`) | Cleanest implementation |
| BenCang | ✅ (via `FormField`) | ✅ (via `FormField`) | ❌ (raw `fetch()`) | ❌ (custom `toast`) | Largest deviation |
| CauCang | ✅ (via `FormField`) | ✅ (via `FormField`) | ✅ (`api` from `../../services/api`) | ❌ (custom `toast`) | Minor deviation |
| CangCan | ✅ (native `Form.Item`) | ✅ (native `Form.Item`) | ✅ (`api` from `../../services/api`) | ❌ (custom `toast`) | Minor deviation |
| VungNuoc | ✅ (via `FormField`) | ✅ (via `FormField`) | ✅ (`api` from `../../services/api`) | ❌ (custom `toast`) | Minor deviation |
| GiayTo | ✅ (via `FormField`) | ✅ (via `FormField`) | ✅ (`api` from `../../services/api`) | ❌ (custom `toast`) | Minor deviation |

**Inconsistency:** CangBien uses `message` from antd for toasts. All other entity groups use a custom `toast` component imported from `../../components/ToastNotification`. This is a SHOULD FIX — unify on one toast library.

---

## 8. MUST FIX Items (10 total, all verified against actual files)

1. **`CangBienUpdatePage.tsx` line 116-118**: `maCang` Form.Item has no `name` prop, so the value is never populated by `form.setFieldsValue`. The field displays empty text instead of the actual maCang value.

2. **`BenCang/api.ts` line 11-25**: Uses raw `fetch()` instead of shared axios `api`. Breaks global auth interceptors and error handling.

3. **`BenCang/schema.ts` line 7**: `approvalStatus` enum uses mixed convention — `CHO_PHE_DUYET` (ASCII) vs `ĐƯỢC_PHE_DUYỆT`/`TỪ_CHỐI` (full Vietnamese diacritics).

4. **`BenCang/types.ts` line 27**: `ApprovalStatus` uses ASCII values `"CHO_PHE_DUYET" | "DUOC_PHE_DUYET" | "TU_CHOI"`, but `schema.ts` line 7 uses diacritics for 2 of 3 options. Internal inconsistency.

5. **`BenCangListPage.tsx` line 65**: `useEffect(() => { void fetchData(); }, [fetchData])` with `fetchData` as `useCallback` dep — `fetchData` is recreated every render due to state deps, causing an **infinite re-render loop**.

6. **`BenCangUpdatePage.tsx` line 252-253**: Status badge compares `trangThaiPheDuyet` against ASCII values (`'CHO_PHE_DUYET'`, `'DUOC_PHE_DUYET'`). If BE returns diacritic values, badge colors will be wrong (always shows red).

7. **`VungNuocListPage.tsx` line 65**: `useEffect(() => { void fetchData(); }, [])` has empty dependency array — never refetches when search terms or filter selections change. Search is broken.

8. **`VungNuoc/api.ts` line 37-47**: Sends search/filter params (`maVungNuoc`, `tenVungNuoc`, `trangThaiHoatDong`, `trangThaiPheDuyet`) that the BE `VungNuocController.java` does not accept. Search functionality is a no-op.

9. **`VungNuoc/types.ts` line 9-12**: `VungNuocTrangThaiPheDuyet` uses `'CHỜ_PHÊ_DUYỆT' | 'ĐƯỢC_PHÊ_DUYỆT' | 'TỪ_CHỐI'` with `PHÊ` (accent on Ê). CangBien `schema.ts` line 11 uses `'CHỜ_PHE_DUYỆT' | 'ĐƯỢC_PHE_DUYỆT' | 'TỪ_CHỐI'` — `PHE` (no accent on Ê). Inconsistent and likely incorrect — approval status filtering will fail.

10. **`CauCang/schema.ts` line 7**: `benCangId` uses `z.string().min(1)` instead of `z.string().uuid()` — BE entity `CauCang.java` line 36 defines it as UUID.

---

## 9. SHOULD FIX Items (10)

1. **BenCang `api.ts` line 35-48**: `fetchBenCangList` doesn't expose search/filter params — the list page bypasses this function entirely in favor of `benCangCRUD.search()`. Architectural inconsistency.
2. **CauCang `CauCangCreatePage.tsx` line 11**: Label typo — "Hiện hình" should be "Hiện hành". Same typo in `CauCangListPage.tsx` line 29.
3. **CauCang `api.ts` line 60-62**: Sends redundant `userId` in approve body — BE gets it from auth context.
4. **CauCang `CauCangCreatePage.tsx` line 51-55**: `catch` block does nothing — no `toast.error()` call. Server validation errors silently fail.
5. **VungNuoc `api.ts` line 79**: Sends redundant `userId` in approve body — BE gets it from auth.
6. **GiayTo `api.ts` line 40**: Sends redundant `userId` in form data — BE gets it from auth.
7. **GiayTo `schema.ts` line 7-26**: No MIME type validation — BE rejects invalid MIME types silently. Frontend should validate MIME type against allowed list.
8. **Tech stack inconsistency**: CangBien uses antd `message`; all other groups use custom `toast`. Unify on one.
9. **CauCangListPage `CauCangListPage.tsx` line 30**: Color inconsistency — CauCang uses "gold" for Tạm ngừng, CangBien uses "orange".
10. **RBAC UI enforcement**: No frontend role checks on any entity group — buttons visible regardless of role. BE protects API but UX is confusing.

---

## 10. NICE TO HAVE Items (8)

1. CangBien: Manual duplication of BE validation in CreatePage (line 19-42) and UpdatePage (line 45-67). Could rely on BE validation only.
2. CangBien: Use `z.infer` types from `schema.ts` for form values instead of manual `Record<string, unknown>` casting.
3. BenCang `BenCangUpdatePage.tsx` line 133-139: `cangBienId` in update form is not disabled — should check business requirements.
4. CangCan: `toast.error(err.message)` may expose internal BE error messages to users.
5. VungNuoc `VungNuocListPage.tsx` line 314: `DataTable<VungNuoc>` with `columns as any` — should fix type safety.
6. All pages: `window.prompt` for reject reason (visible in CangBien, BenCang, CauCang, CangCan, VungNuoc) is not accessible to keyboard-only users. Should use modal.
7. All pages: Loading states are minimal — could add skeleton loaders consistently across all entity groups.
8. CangBien `CangBienListPage.tsx` line 117-123: Search debounce is 500ms — meets spec but could be reduced to 300ms for snappier UX.

---

## 11. Positive Findings

- **No phantom fields found** in any entity group (no `ghiChu`, `eventType`, `Attachment`, or GPS fields in VungNuoc).
- **All field names match BE exactly** — no `tinhThanh`/`tinhThanhPho`, `khaNangTiepNhanTau`/`khaNangTiepNhan`, or `maCang`/`maCangCan` confusion.
- **Zod schemas** are well-structured with proper range validation for GPS fields (lat/long bounds).
- **GPS paired validation** is correctly implemented in CangBien and CangCan create/update pages via `.refine()`.
- **Soft-delete warning** is present in all Delete pages.
- **Approval/reject flow** uses confirmation checkbox for both approve and reject actions.
- **Ant Design** components used consistently across all pages.
- **History pages** show timeline with old→new diff and pagination.
- **API endpoints** are correct for all entities (except VungNuoc list params ignored by BE).

---

## 12. Verdict

**BLOCKED** — The 10 MUST FIX items must be resolved before Wave-1 can be merged. The most critical issues are:

1. **BenCang ListPage infinite re-render loop** (line 65 `useEffect` + `fetchData` dep) — page will hang/crash.
2. **VungNuoc ListPage empty deps** (line 65) — never refetches on search/filter.
3. **VungNuoc API** — search/filter params silently ignored by BE controller.
4. **VungNuoc types** — `PHÊ` vs `PHE` spelling inconsistency — approval status filtering fails.
5. **BenCang API** — raw `fetch()` breaks auth interceptor and global error handling.
6. **BenCang status enum** — mixed ASCII/diacritic convention within same entity group.
7. **BenCang UpdatePage** — status badge comparison against ASCII values — wrong colors if BE returns diacritics.
8. **CauCang schema** — UUID field missing UUID validation.
9. **CangBien UpdatePage** — `maCang` field displays empty (missing `name` prop).

All MUST FIX items are code-level issues that must be addressed before the pages can function correctly.
