---
id: F-130
name: Quản lý thông tin bảo trì
slug: quan-ly-thong-tin-bao-tri
module-id: M-006
status: proposed
classification: local
priority: medium
created: 2026-09-02
last-updated: 2026-09-04
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý thông tin bảo trì

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-130
**Module:** M-006 — Quản lý văn bản & thông tin nghiệp vụ
**Loại:** chức năng thường (không có bước phê duyệt)
**Tham chiếu:** tài liệu nền `docs/modules/M-006-quan-ly-van-ban-thong-tin-ghiep-vu/ba/00-lean-spec.md` của M-006 (khối vận hành & bảo trì) + tài liệu yêu cầu gốc (TKCT) + nguồn sự thật Excel `./HH_Tính năng & danh sách các trường thông tin_2.9.xlsx` sheet `30->43` cụm #36 "Thông tin bảo trì".

> **⚠️ Data Scope:** Trường "Đơn vị quản lý" (`org_unit_id`, `SelectOrgCode`) là trường đơn vị phân quyền dữ liệu — xem mục 5 dòng 3 và AGENTS.md mục Data Scope Convention. **Hiện trạng (2026-09-04):** entity `MaintenancePlan` (package `document`) và controller `/api/v1/maintenance-plans` CHƯA có cột `org_unit_id`/`@DataScope` — mục 7 đánh 🔴 và ghi rõ đề xuất để SA chốt.

---

## 1. Mô tả ngắn

Chức năng quản lý kế hoạch bảo trì KCHT: lập kế hoạch bảo trì (đơn vị quản lý, đơn vị bảo trì, loại KCHT, tên công việc, loại công việc, nội dung, thời gian dự kiến, trạng thái), liệt kê danh sách công trình và kinh phí bảo trì, đính kèm tệp kế hoạch; khi kế hoạch ở trạng thái "Hoàn thành" thì ghi nhận kết quả xác nhận bảo trì thực tế (ngày thực tế, nội dung kết quả, ghi chú) kèm tệp xác nhận. Người dùng: cán bộ đơn vị quản lý KCHT (tạo/sửa/ghi nhận), lãnh đạo/cục tra cứu. Thông tin kế hoạch được hiển thị read-only trong TAB 4 "Vận hành & bảo trì" trên drawer tài sản KCHT. Backend đã có sẵn trong package `com.hanghai.kchtg.document` (entity `MaintenancePlan`/`MaintenanceResult`, controller `/api/v1/maintenance-plans`) — §6/§7 ghi theo mã nguồn thật, các điểm lệch với Excel đánh dấu rõ để SA chốt.

## 2. Trường dữ liệu

Nguồn: ma trận Excel cụm #36 (25 trường) — **đối chiếu lại 2026-09-04, khớp 25/25**. Cờ: ✓ = có (true), — = không (false). Cột **Bắt buộc** không có trong Excel → **không xác định ở cấp Excel**.

| # | Nhóm (TAB) | Trường | Loại điều khiển | DS | Lọc | Xem | Tạo | Sửa |
|---|---|---|---|---|---|---|---|---|
| 1 | Kế hoạch bảo trì | Đơn vị quản lý | SelectOrgCode | ✓ | ✓ | ✓ | ✓ | ✓ |
| 2 | Kế hoạch bảo trì | Đơn vị bảo trì | SelectOrgCode | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3 | Kế hoạch bảo trì | Loại kết cấu hạ tầng bảo trì | Select | ✓ | ✓ | ✓ | ✓ | ✓ |
| 4 | Kế hoạch bảo trì | Mã kế hoạch bảo trì | Input Text (disabled, tự sinh) | ✓ | ✓ | ✓ | ✓ | ✓ |
| 5 | Kế hoạch bảo trì | Tên kế hoạch bảo trì | InputTextArea | ✓ | ✓ | ✓ | ✓ | ✓ |
| 6 | Kế hoạch bảo trì | Thời gian bắt đầu bảo trì dự kiến | DatePicker | ✓ | — | ✓ | ✓ | ✓ |
| 7 | Kế hoạch bảo trì | Thời gian kết thúc bảo trì dự kiến | DatePicker | ✓ | — | ✓ | ✓ | ✓ |
| 8 | Kế hoạch bảo trì | Tên công việc bảo trì | InputTextArea | — | — | ✓ | ✓ | ✓ |
| 9 | Kế hoạch bảo trì | Loại công việc bảo trì | Select | ✓ | ✓ | ✓ | ✓ | ✓ |
| 10 | Kế hoạch bảo trì | Nội dung bảo trì | InputTextArea | — | — | ✓ | ✓ | ✓ |
| 11 | Kế hoạch bảo trì | Trạng thái bảo trì | Select | ✓ | ✓ | ✓ | ✓ | ✓ |
| 12 | Kế hoạch bảo trì | Ghi chú | InputTextArea | — | — | ✓ | ✓ | ✓ |
| 13 | File kế hoạch bảo trì | Tên file | Upload/Attachment | — | — | ✓ | ✓ | ✓ |
| 14 | Danh sách công trình | Mã kết cấu hạ tầng | Select | — | — | ✓ | ✓ | ✓ |
| 15 | Danh sách công trình | Tên kết cấu hạ tầng | Input Text (disabled) | — | — | ✓ | ✓ | ✓ |
| 16 | Danh sách công trình | Thuộc cảng biển | Input Text (disabled) | — | — | ✓ | ✓ | ✓ |
| 17 | Danh sách công trình | Địa điểm | InputTextArea (disabled) | — | — | ✓ | ✓ | ✓ |
| 18 | Danh sách công trình | Kinh phí bảo trì | InputDecimal | — | — | ✓ | ✓ | ✓ |
| 19 | Xác nhận bảo trì (hiện khi trạng thái = Hoàn thành) | Thời gian bắt đầu bảo trì | DatePicker | — | — | ✓ | — | ✓ |
| 20 | Xác nhận bảo trì (hiện khi trạng thái = Hoàn thành) | Thời gian kết thúc bảo trì | DatePicker | — | — | ✓ | — | ✓ |
| 21 | Xác nhận bảo trì (hiện khi trạng thái = Hoàn thành) | Nội dung kết quả bảo trì | InputTextArea | — | — | ✓ | — | ✓ |
| 22 | Xác nhận bảo trì (hiện khi trạng thái = Hoàn thành) | Ghi chú (kết quả) | InputTextArea | — | — | ✓ | — | ✓ |
| 23 | File xác nhận bảo trì | Tên file | Upload/Attachment | — | — | ✓ | — | ✓ |
| 24 | Trạng thái | Cán bộ cập nhật | Text (hiển thị, không nhập) | — | — | ✓ | — | — |
| 25 | Trạng thái | Ngày cập nhật | DatePicker (hiển thị, không nhập) | — | — | ✓ | — | — |

## 3. Trạng thái và phê duyệt

- Excel cụm #36 **không khai báo luồng phê duyệt** (không có cấp C1/C2, không phát sinh approval log) — chỉ là trạng thái nghiệp vụ nội bộ của kế hoạch bảo trì.
- Trạng thái nằm ở trường "Trạng thái bảo trì" (số 11); TAB "Xác nhận bảo trì" (số 19–23) chỉ hiển thị/ghi nhận khi **trạng thái = Hoàn thành**.
- Hiện trạng backend: entity `MaintenancePlan` lưu cột `status` bằng `MaintenanceStatus` enum (`@Enumerated(EnumType.STRING)`), gồm 4 giá trị: `CHO_DOI_PHUY`, `DANG_THUC_HIEN`, `HOAN_THANH`, `TRI_HOAI` (`src/main/java/com/hanghai/kchtg/document/entity/MaintenanceStatus.java`). Mốc "Hoàn thành" của Excel ánh xạ `HOAN_THANH`. Danh sách giá trị hiển thị và nhãn tiếng Việt: **SA chốt** (không dùng mã legacy `PROPOSED(1)/APPROVED_LEVEL2(4)/REJECTED(6)`).
- Ghi nhận kết quả khi Hoàn thành: backend THẬT đã có endpoint `POST /api/v1/maintenance-plans/result` lưu `MaintenanceResult` (xem §6). Tạo mới: service nhận `status` từ request, chưa ép mặc định → đề xuất mặc định `CHO_DOI_PHUY` khi không truyền (SA chốt).

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-130-01 | Mã kế hoạch bảo trì tự sinh, không cho nhập tay (backend hiện chưa có cơ chế sinh mã — cần bổ sung ở lượt mở rộng). | Create |
| BR-130-02 | TAB "Xác nhận bảo trì" chỉ hiển thị/ghi nhận khi trạng thái = Hoàn thành (`HOAN_THANH`). | Update |
| BR-130-03 | "Đơn vị quản lý" là trường đơn vị phân quyền dữ liệu; khi tạo/sửa phải gán `org_unit_id` trong phạm vi người dùng (không để NULL). Hiện entity/controller chưa có cột này — xem mục 7. | Create / Update |
| BR-130-04 | Trong Danh sách công trình, Tên KCHT / Thuộc cảng biển / Địa điểm tự điền từ Mã KCHT (disabled). | Create / Update |
| BR-130-05 | Cán bộ cập nhật / Ngày cập nhật (số 24–25) do hệ thống tự điền (`updated_by`/`updated_at`), không cho nhập. | Create / Update |
| BR-130-06 | Khi Hoàn thành, kết quả thực tế ghi vào `maintenance_results` qua `POST /result`; ghi đủ `recorder`/`recorded_date` (kiểm toán). | Update |
| BR-130-07 | Thời gian thực tế của xác nhận phải nằm trong/không trước thời gian dự kiến của kế hoạch (ràng buộc ngày). | Update |
| BR-130-08 | Mọi thao tác thay đổi ghi đủ thông tin kiểm toán (`updated_by`); khi chuyển sang xóa mềm phải dùng soft-delete có `deleted_by`. | Create / Update / Delete |

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem danh sách / chi tiết | `maintenanceplan:read` |
| Tạo mới | `maintenanceplan:create` |
| Sửa / ghi nhận xác nhận bảo trì | `maintenanceplan:update` |
| Ghi nhận kết quả (`POST /result`) | `maintenanceplan:report` |
| Xóa | `maintenanceplan:delete` |
| Quản trị cây quyền | `maintenanceplan:manage` (seed có sẵn) |

Controller hiện dùng `@PreAuthorize("@auth.check(authentication, 'maintenanceplan:<action>') or @auth.check(authentication, 'document:<action>')")` — fallback quyền `document:*` của F-128; `POST /result` chấp nhận `maintenanceplan:report` hoặc `maintenanceplan:update` (`src/main/java/com/hanghai/kchtg/document/controller/MaintenancePlanController.java`).

**Admin Cục:** full quyền + xem metadata người tạo/người sửa/thời gian (`created_by`/`created_at`/`updated_by`/`updated_at`), xem full dữ liệu mọi đơn vị.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — "Trạng thái bảo trì": enum `MaintenanceStatus` 4 giá trị (CHO_DOI_PHUY/DANG_THUC_HIEN/HOAN_THANH/TRI_HOAI); mốc kích hoạt xác nhận = `HOAN_THANH`; danh sách hiển thị SA chốt |
| 2 | Có bước phê duyệt không | Không — Excel không khai báo luồng duyệt C1/C2, không phát sinh approval log |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường "Đơn vị quản lý" `org_unit_id`, lọc subtree qua `@DataScope`; **hiện entity/controller CHƯA có cột/filter** → mục 7 đánh 🔴, SA chốt cơ chế (Data Scope Convention) |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — TAB "Xác nhận bảo trì" + "File xác nhận" (số 19–23) chỉ hiện khi trạng thái = Hoàn thành |
| 5 | Quyền riêng | `maintenanceplan:read/create/update/delete/report` (+ `manage` seed, fallback `document:*` trong `@PreAuthorize`) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — Upload/Attachment (file kế hoạch số 13, file xác nhận số 23) |
| 8 | Giao diện khác mẫu chung | Không — theo list-screen + form/drawer convention |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT của BA — đối chiếu controller THẬT `src/main/java/com/hanghai/kchtg/document/controller/MaintenancePlanController.java`, SA chốt)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/maintenance-plans?page&size` | Danh sách kế hoạch (phân trang, mặc định 20) | `maintenanceplan:read` |
| GET | `/api/v1/maintenance-plans/{id}` | Chi tiết kế hoạch | `maintenanceplan:read` |
| POST | `/api/v1/maintenance-plans` | Tạo mới kế hoạch (body `MaintenancePlanCreateRequest`) | `maintenanceplan:create` |
| PUT | `/api/v1/maintenance-plans/{id}` | Sửa kế hoạch | `maintenanceplan:update` |
| DELETE | `/api/v1/maintenance-plans/{id}` | Xóa (hiện là xóa vật lý `deleteById`) | `maintenanceplan:delete` |
| POST | `/api/v1/maintenance-plans/result` | Ghi nhận kết quả bảo trì (body `MaintenanceResultRequest` → `MaintenanceResult`) | `maintenanceplan:report` hoặc `maintenanceplan:update` |
| GET | `/api/v1/maintenance-plans/equipment/{equipment}` | Lọc theo thiết bị | `maintenanceplan:read` |
| GET | `/api/v1/maintenance-plans/status/{status}` | Lọc theo trạng thái (tên enum, uppercase) | `maintenanceplan:read` |
| GET | `/api/v1/maintenance-plans/type/{type}` | Lọc theo loại bảo trì (`MaintenanceType`: DINH_KY/SUA_CHUA_LON/SUA_CHUA_KHAN_CAP) | `maintenanceplan:read` |
| GET | `/api/v1/maintenance-plans/date-range?start&end` | Lọc theo khoảng ngày dự kiến | `maintenanceplan:read` |

> Đề xuất bổ sung (chưa có trong controller — SA chốt): (1) lọc theo đơn vị/trạng thái trên danh sách theo ma trận §2 sau khi bổ sung `org_unit_id`; (2) ánh xạ trường Excel 19–22 (Xác nhận bảo trì) sang trường `MaintenanceResult` hiện có (`actual_start_date`, `actual_end_date`, `result_description`, `replaced_parts`, `downtime_duration`) hoặc thêm trường khi cần. Mọi cột "Quyền" thực tế còn kèm fallback `or document:<action>`.

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT của BA — đã đối chiếu entity THẬT `src/main/java/com/hanghai/kchtg/document/entity/MaintenancePlan.java`, SA chốt)

Quy ước: 🔴 = trường Excel #36 CHƯA có trong entity/bảng thật (cần thêm); ~~gạch ngang~~ = trường brief cũ/legacy KHÔNG có trong Excel (đề xuất loại bỏ); không ký hiệu = trường đang tồn tại ở entity thật.

**Bảng `maintenance_plans` (entity `MaintenancePlan`, package `document` — TÊN BẢNG THẬT):** hiện có `id`, `equipment`, `maintenance_type` (`MaintenanceType`), `estimated_start_date`, `estimated_end_date`, `status` (`MaintenanceStatus`), `estimated_cost`, `created_by`, `created_at`, `updated_by`, `updated_at`.

Theo Excel #36, đề xuất bổ sung (SA chốt ánh xạ/đổi tên cột hiện có): 🔴 `org_unit_id` (Đơn vị quản lý — cột đơn vị phân quyền, kèm `@Filter(orgUnitFilter)` + controller `@DataScope` + backfill migration), 🔴 `maintenance_unit_id` (Đơn vị bảo trì), 🔴 `infrastructure_type` (Loại KCHT bảo trì), 🔴 `code` (Mã kế hoạch — tự sinh), 🔴 `name` (Tên kế hoạch), 🔴 `work_name` (Tên công việc bảo trì), 🔴 `work_type` (Loại công việc bảo trì), 🔴 `content` (Nội dung bảo trì), 🔴 `note` (Ghi chú).

> Ghi chú ánh xạ (SA chốt): `estimated_start_date`/`estimated_end_date` ≈ Excel số 6–7 "Thời gian bắt đầu/kết thúc dự kiến" — giữ nguyên; `maintenance_type` (DINH_KY/SUA_CHUA_LON/SUA_CHUA_KHAN_CAP) có thể ánh xạ "Loại công việc bảo trì" (số 9); `estimated_cost` hiện đặt cấp kế hoạch, Excel đặt "Kinh phí bảo trì" (số 18) TRONG dòng công trình — SA chốt nơi lưu; `equipment` không thuộc ma trận Excel — đề xuất giữ (đang được UI lọc dùng) hoặc chuyển bảng con.

**Bảng con `maintenance_results` (entity `MaintenanceResult` — ĐANG TỒN TẠI, ghi khi Hoàn thành):** `id`, `maintenance_plan_id` (FK), `actual_start_date`, `actual_end_date`, `result_description`, `replaced_parts`, `downtime_duration`, `recorder`, `recorded_date`. — Ánh xạ trực tiếp Xác nhận bảo trì Excel số 19–22 (SA chốt map từng trường: 19–20 → `actual_start_date`/`actual_end_date`; 21 "Nội dung kết quả bảo trì" và 22 "Ghi chú (kết quả)" → `result_description`; nếu cần tách Ghi chú thì 🔴 thêm `result_note`).

**Bảng con mới theo Excel #36 (chưa tồn tại — đề xuất BA):**
- `maintenance_work` (Danh sách công trình, số 14–18): 🔴 `maintenance_plan_id` (FK), 🔴 `infrastructure_id` (Mã KCHT), 🔴 `infrastructure_name` (Tên KCHT — tự điền), 🔴 `port_id` (Thuộc cảng biển — tự điền), 🔴 `location` (Địa điểm — tự điền), 🔴 `cost` (Kinh phí bảo trì, InputDecimal).
- `maintenance_plan_file` (tệp kế hoạch, số 13): 🔴 `maintenance_plan_id`, 🔴 `file_name` (Tên file), 🔴 `file_path` (lưu qua hạ tầng file/MinIO).
- `maintenance_confirm_file` (tệp xác nhận, số 23): 🔴 `maintenance_result_id` (FK — hoặc gắn theo kế hoạch), 🔴 `file_name`.

**~~Bảng/entity legacy của brief cũ~~:** brief cũ (F-130 legacy) chưa từng có §2/§7 và không tham chiếu entity nào đang tồn tại — không có tham chiếu legacy cần giữ; mọi cấu trúc bảng lấy theo `maintenance_plans` + `maintenance_results` thật và ma trận Excel #36 ở trên.

> Ghi chú: các trường số 1–25 của Excel #36 đã được liệt kê đầy đủ ở §2 và §7 (kể cả File kế hoạch, Danh sách công trình kèm Kinh phí bảo trì, Xác nhận bảo trì, File xác nhận, Cán bộ cập nhật/Ngày cập nhật — 2 trường cuối ánh xạ `updated_by`/`updated_at` sẵn có). Brief đã đối chiếu với backend thật ngày 2026-09-04.
