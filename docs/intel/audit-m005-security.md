# Security Audit: M-005 Controllers

**Audit date:** 2026-07-08
**Scope:** All 10 controllers and 10 `*Request.java` DTOs under `assetmovement/`
**Tools:** Manual code review (all files read in full)

---

## Controller: TaiSanKCHTController
**File:** `src/main/java/com/hanghai/kchtg/assetmovement/controller/TaiSanKCHTController.java`

| Endpoint | Method | @PreAuthorize? | Input Validation? | Notes |
|---|---|---|---|---|
| `/api/v1/asset/tai-san` | POST | ✅ `@auth.check(authentication, 'asset:tai-san')` | ❌ No `@Valid` on `@RequestBody TaiSanKCHTRequest` | `@Valid` / `@NotNull` missing on all fields |
| `/api/v1/asset/tai-san/{id}` | GET | ✅ | N/A | Path variable only, no body needed |
| `/api/v1/asset/tai-san` | GET | ✅ | N/A | Query params only |
| `/api/v1/asset/tai-san/{id}` | PUT | ✅ | ❌ No `@Valid` on `@RequestBody TaiSanKCHTRequest` | Same as POST |
| `/api/v1/asset/tai-san/{id}` | DELETE | ✅ | N/A | Path variable only |

**ApiResponse usage:** ✅ Consistent — all endpoints wrap in `ApiResponse.success(...)`.

---

## Controller: YeuCauGiamTaiSanController
**File:** `src/main/java/com/hanghai/kchtg/assetmovement/controller/YeuCauGiamTaiSanController.java`

| Endpoint | Method | @PreAuthorize? | Input Validation? | Notes |
|---|---|---|---|---|
| `/api/v1/asset/yeu-cau-giam` | POST | ✅ `asset:yeu-cau-giam` | ❌ No `@Valid` | |
| `/api/v1/asset/yeu-cau-giam/{id}` | GET | ✅ | N/A | |
| `/api/v1/asset/yeu-cau-giam` | GET | ✅ | N/A | Query params only |
| `/api/v1/asset/yeu-cau-giam/{id}` | PUT | ✅ | ❌ No `@Valid` | |
| `/api/v1/asset/yeu-cau-giam/{id}` | DELETE | ✅ | N/A | |
| `/api/v1/asset/yeu-cau-giam/{id}/approve` | POST | ✅ | ⚠️ `@RequestBody(required=false) Map` — unchecked map | No DTO, raw Map parsed; `remarks` can be null |
| `/api/v1/asset/yeu-cau-giam/{id}/reject` | POST | ✅ | ⚠️ Same as approve | No DTO, raw Map parsed |

**ApiResponse usage:** ✅ Consistent.

---

## Controller: YeuCauBienDongController
**File:** `src/main/java/com/hanghai/kchtg/assetmovement/controller/YeuCauBienDongController.java`

| Endpoint | Method | @PreAuthorize? | Input Validation? | Notes |
|---|---|---|---|---|
| `/api/v1/asset/yeu-cau-bien-dong` | POST | ✅ `asset:yeu-cau-bien-dong` | ❌ No `@Valid` | |
| `/api/v1/asset/yeu-cau-bien-dong/{id}` | GET | ✅ | N/A | |
| `/api/v1/asset/yeu-cau-bien-dong` | GET | ✅ | N/A | Query params only |
| `/api/v1/asset/yeu-cau-bien-dong/{id}` | PUT | ✅ | ❌ No `@Valid` | |
| `/api/v1/asset/yeu-cau-bien-dong/{id}` | DELETE | ✅ | N/A | |

**ApiResponse usage:** ✅ Consistent.

---

## Controller: KeHoachKiemKeController
**File:** `src/main/java/com/hanghai/kchtg/assetmovement/controller/KeHoachKiemKeController.java`

| Endpoint | Method | @PreAuthorize? | Input Validation? | Notes |
|---|---|---|---|---|
| `/api/v1/asset/ke-hoach-kiem-ke` | POST | ✅ `asset:ke-hoach-kiem-ke` | ❌ No `@Valid` | |
| `/api/v1/asset/ke-hoach-kiem-ke/{id}` | GET | ✅ | N/A | |
| `/api/v1/asset/ke-hoach-kiem-ke` | GET | ✅ | N/A | Query params only |
| `/api/v1/asset/ke-hoach-kiem-ke/{id}` | PUT | ✅ | ❌ No `@Valid` | |
| `/api/v1/asset/ke-hoach-kiem-ke/{id}` | DELETE | ✅ | N/A | |

**ApiResponse usage:** ✅ Consistent.

---

## Controller: TaiSanKiemKeController
**File:** `src/main/java/com/hanghai/kchtg/assetmovement/controller/TaiSanKiemKeController.java`

| Endpoint | Method | @PreAuthorize? | Input Validation? | Notes |
|---|---|---|---|---|
| `/api/v1/asset/tai-san-kiem-ke` | POST | ✅ `asset:tai-san-kiem-ke` | ❌ No `@Valid` | |
| `/api/v1/asset/tai-san-kiem-ke/{id}` | GET | ✅ | N/A | |
| `/api/v1/asset/tai-san-kiem-ke` | GET | ✅ | N/A | Query params only |
| `/api/v1/asset/tai-san-kiem-ke/{id}` | PUT | ✅ | ❌ No `@Valid` | |
| `/api/v1/asset/tai-san-kiem-ke/{id}` | DELETE | ✅ | N/A | |

**ApiResponse usage:** ✅ Consistent.

---

## Controller: KhaiThacTaiSanController
**File:** `src/main/java/com/hanghai/kchtg/assetmovement/controller/KhaiThacTaiSanController.java`

| Endpoint | Method | @PreAuthorize? | Input Validation? | Notes |
|---|---|---|---|---|
| `/api/v1/asset/khai-thac` | POST | ✅ `asset:khai-thac` | ❌ No `@Valid` | |
| `/api/v1/asset/khai-thac/{id}` | GET | ✅ | N/A | |
| `/api/v1/asset/khai-thac` | GET | ✅ | N/A | Query params only |
| `/api/v1/asset/khai-thac/{id}` | PUT | ✅ | ❌ No `@Valid` | |
| `/api/v1/asset/khai-thac/{id}` | DELETE | ✅ | N/A | |

**ApiResponse usage:** ✅ Consistent.

---

## Controller: YeuCauTangTaiSanController
**File:** `src/main/java/com/hanghai/kchtg/assetmovement/controller/YeuCauTangTaiSanController.java`

| Endpoint | Method | @PreAuthorize? | Input Validation? | Notes |
|---|---|---|---|---|
| `/api/v1/asset/yeu-cau-tang` | POST | ✅ `asset:yeu-cau-tang` | ❌ No `@Valid` | |
| `/api/v1/asset/yeu-cau-tang/{id}` | GET | ✅ | N/A | |
| `/api/v1/asset/yeu-cau-tang` | GET | ✅ | N/A | Query params only |
| `/api/v1/asset/yeu-cau-tang/{id}` | PUT | ✅ | ❌ No `@Valid` | |
| `/api/v1/asset/yeu-cau-tang/{id}` | DELETE | ✅ | N/A | |
| `/api/v1/asset/yeu-cau-tang/{id}/approve` | POST | ✅ | ⚠️ `@RequestBody(required=false) Map` — unchecked map | No DTO |
| `/api/v1/asset/yeu-cau-tang/{id}/reject` | POST | ✅ | ⚠️ Same as approve | No DTO |

**ApiResponse usage:** ✅ Consistent.

---

## Controller: BaoCaoKiemKeController
**File:** `src/main/java/com/hanghai/kchtg/assetmovement/controller/BaoCaoKiemKeController.java`

| Endpoint | Method | @PreAuthorize? | Input Validation? | Notes |
|---|---|---|---|---|
| `/api/v1/asset/bao-cao-kiem-ke` | POST | ✅ `asset:bao-cao-kiem-ke` | ❌ No `@Valid` | |
| `/api/v1/asset/bao-cao-kiem-ke/{id}` | GET | ✅ | N/A | |
| `/api/v1/asset/bao-cao-kiem-ke` | GET | ✅ | N/A | Query params only |
| `/api/v1/asset/bao-cao-kiem-ke/{id}` | PUT | ✅ | ❌ No `@Valid` | |
| `/api/v1/asset/bao-cao-kiem-ke/{id}` | DELETE | ✅ | N/A | |

**ApiResponse usage:** ✅ Consistent.

---

## Controller: LuuPheDuyetController
**File:** `src/main/java/com/hanghai/kchtg/assetmovement/controller/LuuPheDuyetController.java`

| Endpoint | Method | @PreAuthorize? | Input Validation? | Notes |
|---|---|---|---|---|
| `/api/v1/asset/luu-phe-duyệt` | POST | ✅ `asset:luu-phe-duyệt` | ❌ No `@Valid` | ⚠️ Vietnamese diacritics in URL path (`duyệt`) |
| `/api/v1/asset/luu-phe-duyệt/{id}` | GET | ✅ | N/A | Same URL issue |
| `/api/v1/asset/luu-phe-duyệt` | GET | ✅ | N/A | Same URL issue |
| `/api/v1/asset/luu-phe-duyệt/{id}` | PUT | ✅ | ❌ No `@Valid` | Same URL issue |
| `/api/v1/asset/luu-phe-duyệt/{id}` | DELETE | ✅ | N/A | Same URL issue |

**ApiResponse usage:** ✅ Consistent.

---

## Controller: HoSoXuLyTaiSanController
**File:** `src/main/java/com/hanghai/kchtg/assetmovement/controller/HoSoXuLyTaiSanController.java`

| Endpoint | Method | @PreAuthorize? | Input Validation? | Notes |
|---|---|---|---|---|
| `/api/v1/asset/ho-so-xu-ly` | POST | ✅ `asset:ho-so-xu-ly` | ❌ No `@Valid` | |
| `/api/v1/asset/ho-so-xu-ly/{id}` | GET | ✅ | N/A | |
| `/api/v1/asset/ho-so-xu-ly` | GET | ✅ | N/A | Query params only |
| `/api/v1/asset/ho-so-xu-ly/{id}` | PUT | ✅ | ❌ No `@Valid` | |
| `/api/v1/asset/ho-so-xu-ly/{id}` | DELETE | ✅ | N/A | |

**ApiResponse usage:** ✅ Consistent.

---

## DTO Validation

| DTO | Has Bean Validation imports? | Fields with validation | Gaps |
|---|---|---|---|
| `TaiSanKCHTRequest.java` | ❌ No validation imports at all | None — 10 plain fields, all `String` / `BigDecimal` / `UUID` / enum | **CRITICAL:** `maTaiSan` (Mã tài sản), `tenTaiSan`, `giaTri`, `nguyenGia` — no `@NotNull`, `@NotEmpty`, `@Positive`, `@Size` |
| `YeuCauGiamTaiSanRequest.java` | ❌ | None — 6 plain fields | **HIGH:** `soLuong` is `int` (primitive, defaults to 0); `taiSanId` is `UUID` but no `@NotNull` |
| `YeuCauBienDongRequest.java` | ❌ | None — 4 plain fields | **HIGH:** `soLuong` is `int` (primitive, defaults to 0); `loaiBienDong` is a raw `String`, not typed enum |
| `KeHoachKiemKeRequest.java` | ❌ | None — 7 plain fields | **HIGH:** `ngayBatDau` / `ngayKetThuc` are `Instant` — no `@NotNull`, no `@Future` |
| `TaiSanKiemKeRequest.java` | ❌ | None — 10 plain fields | **HIGH:** `keHoachId`, `taiSanId` without `@NotNull`; `soLuongKyHienTai` / `soLuongKyThucTe` are primitives |
| `KhaiThacTaiSanRequest.java` | ❌ | None — 6 plain fields | **HIGH:** `taiSanId` no `@NotNull`; `doanhThu`, `haoMon` are `BigDecimal` no `@Positive` |
| `YeuCauTangTaiSanRequest.java` | ❌ | None — 6 plain fields | **HIGH:** `soLuong` primitive; `taiSanId` no `@NotNull` |
| `BaoCaoKiemKeRequest.java` | ❌ | None — 6 plain fields | **HIGH:** `keHoachId` no `@NotNull`; `tongSoLuong`, `soLuongChenhLech` are primitives |
| `LuuPheDuyetRequest.java` | ❌ | None — 5 plain fields | **HIGH:** `yeuCauId` no `@NotNull`; `ketQua` is raw `String` not typed enum |
| `HoSoXuLyTaiSanRequest.java` | ❌ | None — 6 plain fields | **HIGH:** `taiSanId` no `@NotNull`; `loaiXuLy` is raw `String` not typed enum |

**Key observation:** Zero DTOs use any Jakarta/Javax Bean Validation annotations (`@NotNull`, `@NotEmpty`, `@NotBlank`, `@Size`, `@Positive`, etc.). Zero controllers pass `@Valid` on `@RequestBody`. The project has `spring-boot-starter-validation` on classpath, so the infrastructure is ready — the annotations are simply missing.

---

## Summary

### Endpoints without `@PreAuthorize`?
**✅ None found.** All 10 controllers — every single endpoint — has `@PreAuthorize("@auth.check(authentication, '…')")`. This is excellent.

### Are there any endpoints without auth?
**✅ No.** Every mapped method is protected. The permission string follows a consistent `asset:<resource>` naming pattern.

### Is `ApiResponse` used consistently?
**✅ Yes.** All 10 controllers consistently wrap responses in `ApiResponse.success(...)` with Vietnamese message strings. No endpoint returns raw objects.

### Is input validation present (`@Valid`, `@NotNull`, etc.)?
**❌ NO — CRITICAL GAP.** This is the single biggest finding.

---

## Findings by Severity

### CRITICAL

| # | Finding | File:Line | 
|---|---|---|
| 1 | **No input validation on ANY `@RequestBody`** — all 20 POST/PUT endpoints accept unchecked request bodies. There are no `@Valid` annotations and no Bean Validation annotations on any DTO field. An attacker can send `null` required fields, negative numbers for prices/quantities, excessively long strings, or garbage data. | All 10 controllers + all 10 DTOs |
| 2 | **Vietnamese diacritics in URL path** — `@RequestMapping("/api/v1/asset/luu-phe-duyệt")` contains `ệ` (non-ASCII). This breaks RFC 3986 compliance and may cause encoding mismatch between client and server depending on browser/HTTP-client behaviour. | `LuuPheDuyetController.java:13` |

### HIGH

| # | Finding | File:Line |
|---|---|---|
| 3 | **Unvalidated `Map<String, String>` request bodies** — `/approve` and `/reject` endpoints in `YeuCauGiamTaiSanController` and `YeuCauTangTaiSanController` accept `@RequestBody(required=false) java.util.Map<String, String>` without any DTO or validation. `remarks` is extracted unchecked. No defence against injection in the `remarks` value. | `YeuCauGiamTaiSanController.java:84,95` / `YeuCauTangTaiSanController.java:84,95` |
| 4 | **Primitive `int` fields default to 0** — `soLuong`, `soLuongKyHienTai`, `soLuongKyThucTe`, `tongSoLuong`, `soLuongChenhLech` are primitive `int` (not `Integer`), so they default to 0 when omitted from JSON. This silently corrupts business data (creates requests with quantity 0, no way to distinguish "not sent" from "intentionally 0"). | `YeuCauGiamTaiSanRequest.java:10`, `YeuCauBienDongRequest.java:9`, `YeuCauTangTaiSanRequest.java:10`, `TaiSanKiemKeRequest.java:14:15`, `BaoCaoKiemKeRequest.java:9:10` |
| 5 | **Missing `@NotNull` on foreign-key UUIDs** — `taiSanId`, `keHoachId`, `yeuCauId`, `loaiTaiSanId` are nullable UUIDs but have no `@NotNull` validation. API accepts null without failing fast. | All 10 DTOs (each has at least one nullable FK UUID) |
| 6 | **No string length constraints** — Fields like `tenTaiSan`, `moTa`, `lyDo`, `ghiChu`, `maTaiSan`, `viTri`, `thongSoKyThuat`, `nguonKinhPhi` have no `@Size` or `@NotBlank`. Arbitrarily large payloads pass through to persistence. | All 10 DTOs — all String fields |

### MEDIUM

| # | Finding | File:Line |
|---|---|---|
| 7 | **Duplicate permission strings for approve/reject** — The `approve` and `reject` endpoints use the same permission as CRUD (`asset:yeu-cau-giam`, `asset:yeu-cau-tang`). Consider a separate `asset:yeu-cau-giam:approve` permission for finer-grained access control. | `YeuCauGiamTaiSanController.java:84,95` / `YeuCauTangTaiSanController.java:84,95` |
| 8 | **No CSRF protection visible** — Not a controller-level finding per se, but worth noting if the security config doesn't disable CSRF for non-browser clients. | (Not in scope — would need SecurityConfig review) |

### Recommended fixes (highest priority)

1. **Add `@Valid` on every `@RequestBody`** — all 20 POST/PUT endpoints across all 10 controllers.
2. **Add Bean Validation annotations to all DTO fields** — at minimum:
   - `@NotNull` on all business-required UUIDs (`taiSanId`, `keHoachId`, `yeuCauId`, etc.)
   - `@NotBlank` on `maTaiSan`, `tenTaiSan`, `loaiBienDong`, `loaiXuLy`, `ketQua`
   - `@Positive` on `giaTri`, `nguyenGia`, `soLuong`, `doanhThu`, `haoMon`
   - `@Size(max=…)` on String fields (e.g. `@Size(max=255)` on `moTa`, `lyDo`, `ghiChu`)
3. **Replace primitive `int` with `@NotNull Integer`** on quantity fields so missing JSON values fail validation instead of silently defaulting to 0.
4. **Create DTOs for approve/reject endpoints** instead of using raw `Map<String, String>`.
5. **Fix the Vietnamese diacritics in `LuuPheDuyetController` URL path** — replace `duyệt` with `duyet`.
