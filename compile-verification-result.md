# AssetMovement Module — Compile Verification Result

## 1. Overall Compilation Status: **FAIL**

`mvn clean compile` completed but **BUILD FAILURE** with 17 compilation errors and 11 warnings.
The assetmovement module is the **sole source of all errors** — no other module packages reported errors.

- **Total source files compiled:** 699
- **Errors in assetmovement:** 17
- **Warnings in assetmovement:** 10 (of 11 total project warnings; 1 is from `tai/entity/BaseTai.java`)

---

## 2. Verbatim assetmovement Errors

### HoSoXuLyTaiSanService.java (2 errors)

| # | File:Line | Error |
|---|-----------|-------|
| 1 | `HoSoXuLyTaiSanService.java:[31,60]` | `incompatible types: com.hanghai.kchtg.assetmovement.entity.LoaiXuLy cannot be converted to java.lang.String` |
| 2 | `HoSoXuLyTaiSanService.java:[68,96]` | `incompatible types: com.hanghai.kchtg.assetmovement.entity.LoaiXuLy cannot be converted to java.lang.String` |

**Root cause:** Repository method expects `LoaiXuLy` enum but callers pass `String` (or vice versa).

### TaiSanKiemKeService.java (6 errors)

| # | File:Line | Error |
|---|-----------|-------|
| 3 | `TaiSanKiemKeService.java:[31,36]` | `cannot find symbol: method getGiaTriSach()` — location: `TaiSanKiemKeRequest` |
| 4 | `TaiSanKiemKeService.java:[32,38]` | `cannot find symbol: method getGiaTriThucTe()` — location: `TaiSanKiemKeRequest` |
| 5 | `TaiSanKiemKeService.java:[34,32]` | `cannot find symbol: method getGhiChu()` — location: `TaiSanKiemKeRequest` |
| 6 | `TaiSanKiemKeService.java:[74,103]` | `incompatible types: java.lang.String cannot be converted to com.hanghai.kchtg.assetmovement.entity.TrangThaiKiemKe` |
| 7 | `TaiSanKiemKeService.java:[75,20]` | `cannot find symbol: method getGhiChu()` — location: `TaiSanKiemKeRequest` |
| 8 | `TaiSanKiemKeService.java:[75,66]` | `cannot find symbol: method getGhiChu()` — location: `TaiSanKiemKeRequest` |
| 9 | `TaiSanKiemKeService.java:[93,35]` | `incompatible types: <nulltype> cannot be converted to int` |

**Root cause:** DTO (`TaiSanKiemKeRequest`) is missing getter methods (`getGiaTriSach`, `getGiaTriThucTe`, `getGhiChu`) and a type mismatch on `TrangThaiKiemKe` vs `String`.

### YeuCauGiamTaiSanService.java (8 errors)

| # | File:Line | Error |
|---|-----------|-------|
| 10 | `YeuCauGiamTaiSanService.java:[31,58]` | `incompatible types: java.lang.String cannot be converted to com.hanghai.kchtg.assetmovement.entity.NguyenNhanGiam` |
| 11 | `YeuCauGiamTaiSanService.java:[33,40]` | `cannot find symbol: method getBienBanKiemTra()` — location: `YeuCauGiamTaiSanRequest` |
| 12 | `YeuCauGiamTaiSanService.java:[34,37]` | `cannot find symbol: method getHaoMonLucKe()` — location: `YeuCauGiamTaiSanRequest` |
| 13 | `YeuCauGiamTaiSanService.java:[35,38]` | `cannot find symbol: method getGiaTriConLai()` — location: `YeuCauGiamTaiSanRequest` |
| 14 | `YeuCauGiamTaiSanService.java:[36,30]` | `cannot find symbol: method getMoTa()` — location: `YeuCauGiamTaiSanRequest` |
| 15 | `YeuCauGiamTaiSanService.java:[63,20]` | `cannot find symbol: method getMoTa()` — location: `YeuCauGiamTaiSanRequest` |
| 16 | `YeuCauGiamTaiSanService.java:[63,62]` | `cannot find symbol: method getMoTa()` — location: `YeuCauGiamTaiSanRequest` |
| 17 | `YeuCauGiamTaiSanService.java:[79,26]` | `incompatible types: <nulltype> cannot be converted to int` |

**Root cause:** DTO (`YeuCauGiamTaiSanRequest`) is missing getter methods (`getBienBanKiemTra`, `getHaoMonLucKe`, `getGiaTriConLai`, `getMoTa`) and a type mismatch on `NguyenNhanGiam` vs `String`.

---

## 3. Verbatim assetmovement Warnings

10 of 11 project-wide warnings are in assetmovement. All are the same pattern — `@Builder` ignoring initializing expressions:

| # | File:Line | Warning |
|---|-----------|---------|
| 1 | `TaiSanKCHT.java:[76,21]` | `@Builder will ignore the initializing expression entirely. If you want the initializing expression to serve as default, add @Builder.Default.` |
| 2 | `KhaiThacTaiSan.java:[50,21]` | Same as above |
| 3 | `HoSoXuLyTaiSan.java:[62,21]` | Same as above |
| 4 | `YeuCauGiamTaiSan.java:[64,21]` | Same as above |
| 5 | `YeuCauBienDong.java:[55,21]` | Same as above |
| 6 | `YeuCauTangTaiSan.java:[65,21]` | Same as above |
| 7 | `LuuPheDuyet.java:[45,21]` | Same as above |
| 8 | `KeHoachKiemKe.java:[59,21]` | Same as above |
| 9 | `TaiSanKiemKe.java:[47,21]` | Same as above |
| 10 | `BaoCaoKiemKe.java:[53,21]` | Same as above |

---

## 4. Summary Table

| Aspect | Value |
|--------|-------|
| **Compile status** | **FAIL** |
| **Total errors** | 17 (all in assetmovement) |
| **Total warnings** | 10 in assetmovement (plus 1 in `tai/entity/BaseTai.java`) |
| **Files with errors** | 3 — `HoSoXuLyTaiSanService.java`, `TaiSanKiemKeService.java`, `YeuCauGiamTaiSanService.java` |
| **Error categories** | (a) DTO missing getters (8 errors), (b) Type mismatch — enum vs String (4 errors), (c) Type mismatch — null vs int (2 errors), (d) LoaiXuLy vs String (2 errors) |
| **Other modules** | Clean — no errors outside assetmovement |

## 5. Confidence

**high** — verified against full `mvn clean compile` output (699 source files, 17 errors all traced to assetmovement package files).

## 6. Maven command evidence

```
Command: mvn clean compile
Exit code: 1 (BUILD FAILURE)
Total time: 14.750 s
Compiling 699 source files with javac [debug parameters release 17] to target\classes
```
