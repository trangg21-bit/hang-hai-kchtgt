# Báo cáo đồng bộ tài liệu BA theo Excel "HH_Tính năng & danh sách các trường thông tin" — 2026-08-28

| Mục | Nội dung |
|---|---|
| Người lập | AI Studio (build seat) |
| Ngày | 2026-08-28 |
| Nguồn đối chiếu 1 | `HH_Tính năng & danh sách các trường thông tin.xlsx` (workspace root) — **cập nhật 2026-08-28** (174KB → 260KB, +42 sheet mới) |
| Nguồn đối chiếu 2 | 3 CSV trong `docs/inputs/` (QL bến phao, Khu tránh trú bão, Khu chuyển tải) — bản dùng để code |
| Nguồn đối chiếu 3 | Handoff docs `docs/intel/handoff-2026-08-27-*.md` + code đã commit (entity/DTO/controller/frontend) |
| Mục đích | Bổ sung lean-spec/feature-brief còn thiếu cho các module KCHT để tài liệu khớp 100% với Excel mới và code đã ship |
| Trạng thái | ✅ **Hoàn thành 5/5 module** (108 file tài liệu BA) |

---

## 1. Phạm vi

Sheet "DS bảng" trong Excel liệt kê STT 1–29 (trừ #6 "QL TT quy hoạch bến cảng HH" — đánh dấu chưa làm). Đối chiếu từng sheet với module/feature trên hệ thống phát hiện: **16/28 sheet có tài liệu đầy đủ, 4 sheet có code nhưng KHÔNG có feature-brief/lean-spec** (Bến phao, Khu neo đậu, Khu chuyển tải, Khu tránh trú bão), và nhiều sheet có brief nhưng thiếu lean-spec.

---

## 2. Kết quả triển khai (5/5 module Pass)

| Module | Nội dung | Kết quả | File tạo |
|---|---|---|---|
| M-013 | Phao tiêu + Đèn biển | ✅ Pass | 12 `ba/00-lean-spec.md` (F-068..F-079) + module anchor |
| M-014 | Nhà trạm (phao/đèn/phao tiêu) | ✅ Pass | 16 `ba/00-lean-spec.md` (F-080..F-095) + module anchor |
| **M-1025** *(module mới)* | 3 khu nước: Khu chuyển tải / Khu tránh trú bão / Khu neo đậu | ✅ Pass | 18 feature-brief (F-300..F-317) + 18 lean-spec + module anchor |
| **M-026** *(module mới)* | Bến phao (BuoyBerth) | ✅ Pass | 6 feature-brief (F-318..F-323) + 6 lean-spec + module anchor |
| M-015 | 5 Đài: TTDH / Inmarsat / Cospas-Sarsat / LRIT / TTXLTT Hà Nội | ✅ Pass | 30 `ba/00-lean-spec.md` (F-092..F-121) + module anchor |

**Tổng: 108 file tài liệu BA.** Tất cả `ai-kit-verify --as-gate` đạt `would_pass: true`, 0 blocking findings mới. Không sửa code, migration, PermissionSeeder.

### Module mới scaffold (do giới hạn S-004)

- **M-002** (Cảng & Bến) đã đủ 30/30 features, **M-003** (Khu nước & VTS) đã 39/30 → máy từ chối thêm feature. Theo triage gốc (`TRI-1787812046828-a57e` ghi "Tạo module mới BuoyBerth") và quyết định user 2026-08-28, 2 cụm được scaffold thành module mới:
  - **M-1025** `quan-ly-khu-nuoc-kchtgt` — 3 entity, auto-code `{portCode}-CT-{seq}` / `-TTB-{seq}` / `-ND-{seq}`
  - **M-026** `quan-ly-ben-phao` — auto-code `{portCode}-BP-{seq}`
- Permissions `anchorage:*` / `transferarea:*` / `stormshelter:*` / `buoyberth:*` **đã seed sẵn** (10 quyền mỗi loại) — ghi trong brief section 4, không seed lại.

---

## 3. ⚠️ Phát hiện bảo mật (cần xử lý riêng, đã lưu memory)

| # | Phát hiện | Bằng chứng | Chủ sở hữu xử lý |
|---|---|---|---|
| 1 | **`@PreAuthorize` bị comment out** trong cả 3 controller TransferArea / StormShelterArea / Anchorage (chú thích "TAM THOI COMMENT DE GỠ CHẶN PHÂN QUYỀN") — permission đã seed nhưng KHÔNG enforced, mọi user authenticated gọi được API | `M-1025` BA analysis; `@DataScope` (orgUnitFilter) vẫn hoạt động | SA/PMO chốt re-enable |
| 2 | **Đèn biển (BeaconStation) chỉ phê duyệt 1 cấp** — không có `approveL2`, `approverId` qua `@RequestParam` (`BeaconStationController.java:145`); Phao tiêu (Buoy) có đủ 2 cấp (`approveL2`, `BuoyService.java:618`) | grep controller/service M-013 | backend-developer rework |
| 3 | 2 endpoint đài VTS/Cospas CRUD thiếu `@PreAuthorize` method-level | M-015 BA observation | SA/PMO |

---

## 4. Drift tài liệu ↔ code đã ghi nhận (không sửa code)

### M-013 (Phao tiêu + Đèn biển)
- feature-brief/tech-spec mô tả `Beacon`/`BeaconLight` nhưng code thực là **`BeaconStation`** (`beacon_light`, `/api/beacon-stations`, mã `DBNT-%06d`) và **`Buoy`** (`/api/buoys`, mã `{stationCode}-PT-%03d`).

### M-1025 (3 khu nước)
- Storm-shelter CSV #16 "Cỡ tàu (DWT)" + #20 "Ghi chú" = all-flags FALSE → **DB-parity-only** (đã bỏ khỏi UI).
- Tỉnh/TP filter hiển thị dù CSV `Filter=FALSE`; `Input` thay vì `InputTextArea` cho Tên/Địa điểm.
- `buoyStationId` semantics = **BuoyBerth (M-002)**, không phải BuoyStation.

### M-026 (Bến phao)
- `mooring_water_area_scope` VARCHAR(1000) vs FE maxLength 2000; `public_decision` VARCHAR(500) vs FE 2000.
- `orgUnitId` không `@NotNull` trong `CreateBuoyBerthRequest` dù CSV ghi "bắt buộc" (service auto-assign từ `port.getOrgUnitId()`).
- `cargoThroughput` **bắt buộc** (code `@NotNull`, CSV không ghi, user xác nhận required) — đã ghi vào brief.
- `classification` = VARCHAR(100) Cấp đặc biệt/1/2/3/4, không phải catalog enum.
- Thứ tự trường khác nhau giữa CSV / Excel (Mã, Tên lên đầu) / form đã implement.

### M-015 (5 Đài)
- enum `conditionStatus` **STRING** vs convention INT/ORDINAL.
- VTS + Cospas thiếu `generateCode()` (Excel có auto-code).
- Endpoint `approve-l1/l2` vs `approve-c1/c2`; entity `CoastalStationHaiphong` vs tên hiển thị "Đài TTXLTT Hà Nội".
- feature-brief "pending after create" vs code `DRAFT`.

---

## 5. Việc còn tồn đọng

| # | Việc | Chủ sở hữu | Ghi chú |
|---|---|---|---|
| 1 | Re-enable `@PreAuthorize` 3 controller khu nước + 2 endpoint đài | SA/PMO → backend dev | Lỗ hổng bảo mật đang hoạt động |
| 2 | Fix phê duyệt 1 cấp Đèn biển → 2 cấp | backend dev | Đồng bộ với Phao tiêu |
| 3 | **M-015 re-seal** — sau reopen để ở `in-progress@engineering-business-analyst`; re-close cần 12 stage pass hoặc human CLI | User / orchestrator | CLI `ai-kit` trên máy đang hỏng (shim trỏ nhầm `C:\Users\trangtt1\.ai-kit\bin\ai-kit.mjs`, đã ghi knowledge base `AM-80d53a…`) |
| 4 | M-1025 / M-026 pipeline tiếp tục (designer → dev → reviewer) | PMO | Claim đang giữ, chưa terminal |
| 5 | Sheet mới trong Excel (30→43, QL Tài sản 44→67, 68→71) — chưa có feature tương ứng | BA/SA chốt phạm vi | 42 sheet mới: Tàu biển, Văn bản pháp lý, Đề nghị xử lý tài sản, Kiểm kê, Sản lượng cảng biển, 24 sheet Tài sản (có cột Khai thác/Tăng-Giảm nguyên giá), Nhóm người dùng/Đơn vị/Người dùng/Phê duyệt |
| 6 | Sheet "QL TT quy hoạch bến cảng HH" (#6) | BA | Đánh dấu "chưa làm" trong DS bảng |

---

## 6. Bài học kỹ thuật (gotcha mới ghi nhận)

- **S-004 giới hạn 30 features/module**: M-002 (30/30), M-003 (39/30) chặn mọi scaffold mới. Module mới M-NNN là exit chuẩn khi module đầy (khớp triage gốc).
- **Route BA-direct-write module-scoped** (`AM-fd31ebbe50b45dba`): dispatch BA với module-level `ba/00-lean-spec.md` làm scope anchor — chạy được trên module legacy/done, không cần reopen khi claim còn hiệu lực.
- **Module done/sealed** cần `op=reopen` + claim; frontmatter phải sạch schema v2 (xóa `sealed`, `source-file-count`, `test-file-count`, `test-method-count`, `aggregate-id`, `name`; `feature-req` dạng object).
- **Module doc-parity không nên khai `depends-on`** sang module khác đang `skipped` — gây claim-dependency-gate (gotcha `AM-2371d95406e5b397`).

---

*File này là workspace intel (tương tự `ui-audit-report.md`, `data-scope-gap-report.md`) — không phải artifact Document Studio.*
