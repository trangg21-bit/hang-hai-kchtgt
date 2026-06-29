# Compile Verification — `assetmovement` Package

## Command

```
mvn clean compile  (D:\project\hang-hai-kchtgt)
```

## Overall Result

**BUILD FAILURE** — 1 compilation error in the `assetmovement` package.

| Metric | Value |
|--------|-------|
| Source files compiled | 699 |
| Total errors | 1 |
| Total warnings | 11 (all `@Builder` initialiser-expression warnings — non-blocking) |
| Compile time | 24.046 s |

---

## `assetmovement` Errors (verbatim)

| # | File | Line:Col | Error |
|---|------|----------|-------|
| 1 | `src/main/java/com/hanghai/kchtg/assetmovement/service/YeuCauBienDongService.java` | 124:33 | `cannot find symbol — symbol: method getTaiSanId() — location: variable entity of type com.hanghai.kchtg.assetmovement.entity.YeuCauBienDong` |

### Root Cause

`YeuCauBienDong.java` (66 fields) is missing the `private UUID taiSanId` field that its peer entities all declare:

| Entity | Has `taiSanId`? |
|--------|:---:|
| `YeuCauBienDong` | **No** |
| `YeuCauTangTaiSan` | Yes (line 28) |
| `YeuCauGiamTaiSan` | Yes (line 28) |
| `YeuCauBienDong` peers (`KhaiThacTaiSan`, `TaiSanKiemKe`, `HoSoXuLyTaiSan`) | Yes |

The `@Data` annotation on `YeuCauBienDong` generates getters/setters from declared fields — but `taiSanId` is not declared, so `getTaiSanId()` does not exist. Line 124 of `YeuCauBienDongService.java` invokes `entity.getTaiSanId()`, causing the compilation failure.

---

## Warnings (assetmovement-internal, non-blocking)

11 `@Builder` initialiser-expression warnings across assetmovement entities (all same pattern — `@Builder.Default` is needed on fields with inline initialisers):

- `BaoCaoKiemKe.java:[53,21]`
- `HoSoXuLyTaiSan.java:[62,21]`
- `KhaiThacTaiSan.java:[50,21]`
- `TaiSanKCHT.java:[76,21]`
- `KeHoachKiemKe.java:[59,21]`
- `LuuPheDuyet.java:[45,21]`
- `YeuCauTangTaiSan.java:[65,21]`
- `YeuCauGiamTaiSan.java:[64,21]`
- `YeuCauBienDong.java:[55,21]`
- `TaiSanKiemKe.java:[47,21]`

Plus 1 non-assetmovement warning in `tai/entity/BaseTai.java:[57,21]`.

---

## Artifacts Produced

- `compile-result.txt` — full raw `mvn clean compile` output

## Verdict

```xml
<verdict_envelope>
  <verdict>Blocked</verdict>
  <confidence>high</confidence>
  <structured_summary>
    <key_findings>
      <item>1 compilation error in assetmovement package — YeuCauBienDongService.java:[124,33] calls getTaiSanId() on entity that lacks the taiSanId field.</item>
      <item>11 non-blocking @Builder warnings in assetmovement entity classes.</item>
      <item>699 source files compiled; build failed.</item>
    </key_findings>
    <artifacts_produced>
      <item>compile-result.txt</item>
    </artifacts_produced>
  </structured_summary>
  <blockers>
    <item>YeuCauBienDong entity is missing the taiSanId field required by YeuCauBienDongService.java line 124. Entity must either add `private UUID taiSanId;` or the service must stop calling getTaiSanId().</item>
  </blockers>
</verdict_envelope>
```
