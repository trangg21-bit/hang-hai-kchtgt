---
id: F-129
name: Quản lý thông tin vận hành khai thác
slug: quan-ly-thong-tin-van-hanh
module-id: M-006
status: proposed
classification: local
priority: high
created: 2026-09-02
last-updated: 2026-09-04
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý thông tin vận hành khai thác

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-129
**Module:** M-006 — Quản lý văn bản & thông tin nghiệp vụ
**Loại:** chức năng thường (không có bước phê duyệt)
**Tham chiếu:** tài liệu nền `docs/modules/M-006-quan-ly-van-ban-thong-tin-ghiep-vu/ba/00-lean-spec.md` của M-006 (khối vận hành & bảo trì) + tài liệu yêu cầu gốc (TKCT) + nguồn sự thật Excel `./HH_Tính năng & danh sách các trường thông tin_2.9.xlsx` sheet `30->43` cụm #35 "QL TT vận hành khai thác".

> **⚠️ Data Scope:** Trường "Đơn vị quản lý" (`org_unit_id`, `SelectOrgCode`) là trường đơn vị phân quyền dữ liệu — xem mục 5 dòng 3 và AGENTS.md mục Data Scope Convention. **Hiện trạng (2026-09-04):** entity `OperationPlan` (package `document`) và controller `/api/v1/operation-plans` CHƯA có cột `org_unit_id`/`@DataScope` — mục 7 đánh 🔴 và ghi rõ đề xuất để SA chốt.

---

## 1. Mô tả ngắn

Chức năng quản lý thông tin vận hành khai thác kết cấu hạ tầng hàng hải (KCHT): lập kế hoạch vận hành khai thác (đơn vị quản lý, đơn vị vận hành, loại KCHT, nội dung, thời gian dự kiến), liệt kê danh sách công trình thuộc kế hoạch, đính kèm tệp kế hoạch; khi kế hoạch ở trạng thái "Hoàn thành" thì ghi nhận kết quả xác nhận vận hành thực tế (thời gian hoạt động, tình trạng, công suất, tần suất sự cố) kèm tệp xác nhận. Người dùng: cán bộ đơn vị quản lý KCHT (tạo/sửa/ghi nhận), lãnh đạo/cục tra cứu. Thông tin kế hoạch được hiển thị read-only trong TAB 4 "Vận hành & bảo trì" trên drawer tài sản KCHT (xem 3 CSV: `docs/inputs/HH_Tính năng & danh sách các trường thông tin(QL bến phao).csv`, `docs/inputs/HH_Tính năng & danh sách các trường thông tin(Khu tránh, trú bão).csv`, `docs/inputs/HH_Tính năng & danh sách các trường thông tin(Khu chuyển tải).csv`). Backend đã có sẵn trong package `com.hanghai.kchtg.document` (entity `OperationPlan`/`OperationDetail`/`OperationReport`, controller `/api/v1/operation-plans`) — §6/§7 ghi theo mã nguồn thật, các điểm lệch với Excel đánh dấu rõ để SA chốt.

## 2. Trường dữ liệu

Nguồn: ma trận Excel cụm #35 (30 trường) — **đối chiếu lại 2026-09-04, khớp 30/30**. Cờ: ✓ = có (true), — = không (false). Cột **Bắt buộc** không có trong Excel → **không xác định ở cấp Excel**.

| # | Nhóm (TAB) | Trường | Loại điều khiển | DS | Lọc | Xem | Tạo | Sửa |
|---|---|---|---|---|---|---|---|---|
| 1 | Kế hoạch vận hành khai thác | Đơn vị quản lý | SelectOrgCode | ✓ | ✓ | ✓ | ✓ | ✓ |
| 2 | Kế hoạch vận hành khai thác | Đơn vị vận hành khai thác | SelectOrgCode | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3 | Kế hoạch vận hành khai thác | Loại kết cấu hạ tầng | Select | ✓ | ✓ | ✓ | ✓ | ✓ |
| 4 | Kế hoạch vận hành khai thác | Mã kế hoạch vận hành khai thác | Input Text (disabled, tự sinh) | ✓ | ✓ | ✓ | ✓ | ✓ |
| 5 | Kế hoạch vận hành khai thác | Tên kế hoạch vận hành khai thác | InputTextArea | ✓ | ✓ | ✓ | ✓ | ✓ |
| 6 | Kế hoạch vận hành khai thác | Nội dung kế hoạch vận hành khai thác | InputTextArea | — | — | ✓ | ✓ | ✓ |
| 7 | Kế hoạch vận hành khai thác | Trạng thái vận hành khai thác | Select | ✓ | ✓ | ✓ | ✓ | ✓ |
| 8 | Kế hoạch vận hành khai thác | Ngày bắt đầu vận hành khai thác dự kiến | DatePicker | ✓ | — | ✓ | ✓ | ✓ |
| 9 | Kế hoạch vận hành khai thác | Ngày kết thúc vận hành khai thác dự kiến | DatePicker | ✓ | — | ✓ | ✓ | ✓ |
| 10 | Kế hoạch vận hành khai thác | Ghi chú | InputTextArea | — | — | ✓ | ✓ | ✓ |
| 11 | Danh sách công trình | Mã kết cấu hạ tầng | Select | — | — | ✓ | ✓ | ✓ |
| 12 | Danh sách công trình | Tên kết cấu hạ tầng | Input Text | — | — | ✓ | ✓ | ✓ |
| 13 | Danh sách công trình | Địa điểm | Input Text | — | — | ✓ | ✓ | ✓ |
| 14 | Danh sách công trình | Thuộc cảng biển | Select | — | — | ✓ | ✓ | ✓ |
| 15 | File kế hoạch vận hành khai thác | Loại kế hoạch vận hành khai thác | Select | — | — | ✓ | ✓ | ✓ |
| 16 | File kế hoạch vận hành khai thác | Tên file | Upload/Attachment | — | — | ✓ | ✓ | ✓ |
| 17 | Xác nhận vận hành khai thác (hiện khi trạng thái = Hoàn thành) | Ngày bắt đầu vận hành khai thác | DatePicker | — | — | ✓ | — | ✓ |
| 18 | Xác nhận vận hành khai thác (hiện khi trạng thái = Hoàn thành) | Ngày kết thúc vận hành khai thác | DatePicker | — | — | ✓ | — | ✓ |
| 19 | Xác nhận vận hành khai thác (hiện khi trạng thái = Hoàn thành) | Thời gian hoạt động | Input Text | — | — | ✓ | — | ✓ |
| 20 | Xác nhận vận hành khai thác (hiện khi trạng thái = Hoàn thành) | Tình trạng hoạt động | Select | — | — | ✓ | — | ✓ |
| 21 | Xác nhận vận hành khai thác (hiện khi trạng thái = Hoàn thành) | Thời gian ngừng hoạt động | Input Text | — | — | ✓ | — | ✓ |
| 22 | Xác nhận vận hành khai thác (hiện khi trạng thái = Hoàn thành) | Tần suất sự cố | Input Text | — | — | ✓ | — | ✓ |
| 23 | Xác nhận vận hành khai thác (hiện khi trạng thái = Hoàn thành) | Công suất tối đa | Input Text | — | — | ✓ | — | ✓ |
| 24 | Xác nhận vận hành khai thác (hiện khi trạng thái = Hoàn thành) | Công suất thực tế | Input Text | — | — | ✓ | — | ✓ |
| 25 | Xác nhận vận hành khai thác (hiện khi trạng thái = Hoàn thành) | Nội dung kết quả vận hành khai thác | InputTextArea | — | — | ✓ | — | ✓ |
| 26 | Xác nhận vận hành khai thác (hiện khi trạng thái = Hoàn thành) | Ghi chú (kết quả) | InputTextArea | — | — | ✓ | — | ✓ |
| 27 | File xác nhận vận hành khai thác | Loại xác nhận vận hành khai thác | Select | — | — | ✓ | — | ✓ |
| 28 | File xác nhận vận hành khai thác | Tên file | Upload/Attachment | — | — | ✓ | — | ✓ |
| 29 | Trạng thái | Cán bộ cập nhật | Text (hiển thị, không nhập) | ✓ | — | ✓ | — | — |
| 30 | Trạng thái | Ngày cập nhật | DatePicker (hiển thị, không nhập) | ✓ | — | ✓ | — | — |

## 3. Trạng thái và phê duyệt

- Excel cụm #35 **không khai báo luồng phê duyệt** (không có cấp C1/C2, không phát sinh approval log) — chỉ là trạng thái nghiệp vụ nội bộ của kế hoạch.
- Trạng thái nằm ở trường "Trạng thái vận hành khai thác" (số 7); TAB "Xác nhận vận hành khai thác" chỉ hiển thị/ghi nhận khi **trạng thái = Hoàn thành**.
- Hiện trạng backend: entity `OperationPlan` lưu cột `status` bằng `OperationStatus` enum (`@Enumerated(EnumType.STRING)`), gồm 7 giá trị: `CHO_DOI_PHUY`, `DANG_TIEP_NHAN`, `DA_PHE_DUYET`, `DANG_THANH_HANH`, `HOAN_THANH`, `TRI_HOAI`, `HUY` (`src/main/java/com/hanghai/kchtg/document/entity/OperationStatus.java`). Mốc "Hoàn thành" của Excel ánh xạ `HOAN_THANH`. Danh sách giá trị hiển thị đầy đủ và ánh xạ enum → nhãn tiếng Việt: **SA chốt** (không dùng mã legacy `PROPOSED(1)/APPROVED_LEVEL2(4)/REJECTED(6)`).
- Tạo mới: service hiện nhận `status` từ request, chưa ép mặc định → đề xuất mặc định `CHO_DOI_PHUY` khi không truyền (SA chốt).

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-129-01 | Mã kế hoạch vận hành khai thác tự sinh, không cho nhập tay (backend hiện chưa có cơ chế sinh mã — cần bổ sung ở lượt mở rộng). | Create |
| BR-129-02 | TAB "Xác nhận vận hành khai thác" chỉ hiển thị/ghi nhận khi trạng thái = Hoàn thành (`HOAN_THANH`). | Update |
| BR-129-03 | "Đơn vị quản lý" là trường đơn vị phân quyền dữ liệu; khi tạo/sửa phải gán `org_unit_id` trong phạm vi người dùng (không để NULL). Hiện entity/controller chưa có cột này — xem mục 7. | Create / Update |
| BR-129-04 | Cán bộ cập nhật / Ngày cập nhật (số 29–30) do hệ thống tự điền (`updated_by`/`updated_at`), không cho nhập. | Create / Update |
| BR-129-05 | Trong Danh sách công trình, Tên KCHT / Địa điểm / Thuộc cảng biển tự điền từ Mã KCHT (disabled). | Create / Update |
| BR-129-06 | Ràng buộc lịch hiện có (mô hình scheduling): chặn trùng `operation_date` + `start_time`/`end_time` + `pier`/`equipment` — service `hasConflictSchedule`, endpoint `GET /conflict`. | Create / Update |
| BR-129-07 | Mọi thao tác thay đổi ghi đủ thông tin kiểm toán (`updated_by`); khi chuyển sang xóa mềm phải dùng soft-delete có `deleted_by`. | Create / Update / Delete |

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem danh sách / chi tiết | `operationplan:read` |
| Tạo mới | `operationplan:create` |
| Sửa / ghi nhận xác nhận vận hành | `operationplan:update` |
| Xóa | `operationplan:delete` |
| Quản trị cây quyền | `operationplan:manage` (seed có sẵn) |

Controller hiện dùng `@PreAuthorize("@auth.check(authentication, 'operationplan:<action>') or @auth.check(authentication, 'document:<action>')")` — fallback quyền `document:*` của F-128 (`src/main/java/com/hanghai/kchtg/document/controller/OperationPlanController.java`). Nếu cần tách quyền riêng cho "ghi nhận xác nhận" thì đề xuất seed thêm `operationplan:report` (SA chốt).

**Admin Cục:** mặc định theo tài liệu nền — full quyền + xem thêm metadata người tạo/người sửa/thời gian (`created_by`/`created_at`/`updated_by`/`updated_at`), xem full dữ liệu mọi đơn vị.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — "Trạng thái vận hành khai thác": enum `OperationStatus` 7 giá trị (CHO_DOI_PHUY/DANG_TIEP_NHAN/DA_PHE_DUYET/DANG_THANH_HANH/HOAN_THANH/TRI_HOAI/HUY); mốc kích hoạt xác nhận = `HOAN_THANH`; danh sách hiển thị SA chốt |
| 2 | Có bước phê duyệt không | Không — Excel không khai báo luồng duyệt C1/C2, không phát sinh approval log |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường "Đơn vị quản lý" `org_unit_id`, lọc subtree qua `@DataScope`; **hiện entity/controller CHƯA có cột/filter** → mục 7 đánh 🔴, SA chốt cơ chế (Data Scope Convention) |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — TAB "Xác nhận vận hành khai thác" + nhóm "File xác nhận" (số 17–28) chỉ hiện khi trạng thái = Hoàn thành |
| 5 | Quyền riêng | `operationplan:read/create/update/delete` (+ `manage` seed, fallback `document:*` trong `@PreAuthorize`) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — Upload/Attachment (file kế hoạch số 15–16, file xác nhận số 27–28) |
| 8 | Giao diện khác mẫu chung | Không — theo list-screen + form/drawer convention |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT của BA — đối chiếu controller THẬT `src/main/java/com/hanghai/kchtg/document/controller/OperationPlanController.java`, SA chốt)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/operation-plans?page&size` | Danh sách kế hoạch (phân trang, mặc định 20) | `operationplan:read` |
| GET | `/api/v1/operation-plans/{id}` | Chi tiết kế hoạch | `operationplan:read` |
| POST | `/api/v1/operation-plans` | Tạo mới kế hoạch (body `OperationPlanCreateRequest`) | `operationplan:create` |
| PUT | `/api/v1/operation-plans/{id}` | Sửa kế hoạch | `operationplan:update` |
| DELETE | `/api/v1/operation-plans/{id}` | Xóa (hiện là xóa vật lý `deleteById`) | `operationplan:delete` |
| GET | `/api/v1/operation-plans/date/{operationDate}` | Lọc theo ngày vận hành | `operationplan:read` |
| GET | `/api/v1/operation-plans/status/{status}` | Lọc theo trạng thái (tên enum, uppercase) | `operationplan:read` |
| GET | `/api/v1/operation-plans/pier/{pier}` | Lọc theo cầu cảng | `operationplan:read` |
| GET | `/api/v1/operation-plans/equipment/{equipment}` | Lọc theo thiết bị | `operationplan:read` |
| GET | `/api/v1/operation-plans/conflict?operationDate&startTime&endTime&pier&equipment` | Kiểm tra trùng lịch (mô hình scheduling hiện có) | `operationplan:read` |

> Đề xuất bổ sung (chưa có trong controller — SA chốt): (1) endpoint ghi nhận kết quả xác nhận vận hành theo Excel số 17–28 (vd `PUT /api/v1/operation-plans/{id}/confirmation`); (2) lọc theo đơn vị/trạng thái trên danh sách theo ma trận §2 sau khi bổ sung `org_unit_id`. Mọi cột "Quyền" thực tế còn kèm fallback `or document:<action>`.

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT của BA — đã đối chiếu entity THẬT `src/main/java/com/hanghai/kchtg/document/entity/OperationPlan.java`, SA chốt)

Quy ước: 🔴 = trường Excel #35 CHƯA có trong entity/bảng thật (cần thêm); ~~gạch ngang~~ = trường brief cũ/legacy KHÔNG có trong Excel (đề xuất loại bỏ); không ký hiệu = trường đang tồn tại ở entity thật.

**Bảng `operation_plans` (entity `OperationPlan`, package `document` — TÊN BẢNG THẬT):** hiện có `id`, `operation_date`, `pier`, `equipment`, `start_time`, `end_time`, `status` (`OperationStatus`), `created_by`, `created_at`, `updated_by`, `updated_at`.

Theo Excel #35, đề xuất bổ sung (SA chốt ánh xạ/đổi tên cột hiện có): 🔴 `org_unit_id` (Đơn vị quản lý — cột đơn vị phân quyền, kèm `@Filter(orgUnitFilter)` + controller `@DataScope` + backfill migration), 🔴 `operation_unit_id` (Đơn vị vận hành khai thác), 🔴 `infrastructure_type` (Loại KCHT), 🔴 `code` (Mã kế hoạch — tự sinh), 🔴 `name` (Tên kế hoạch), 🔴 `content` (Nội dung kế hoạch), 🔴 `expected_start_date` (Ngày bắt đầu dự kiến), 🔴 `expected_end_date` (Ngày kết thúc dự kiến), 🔴 `note` (Ghi chú).

> Ghi chú ánh xạ (SA chốt): `operation_date`/`start_time`/`end_time` hiện có theo mô hình "lịch ca" KHÁC ngữ nghĩa "ngày bắt đầu/kết thúc dự kiến" của Excel; `pier`/`equipment` không thuộc ma trận Excel — đề xuất giữ (UI lịch + `GET /conflict` đang dùng) hoặc chuyển sang bảng con khi tái cấu trúc; SA quyết.

**Bảng con `operation_details` (entity `OperationDetail` — ĐANG TỒN TẠI):** `id`, `operation_plan_id` (FK), `description`, `estimated_volume`, `actual_volume`, `notes`. Ngữ nghĩa hiện tại = khối lượng ca vận hành, KHÔNG khớp "Danh sách công trình" của Excel → đề xuất SA giữ cho mô hình lịch ca và tạo bảng con mới dưới đây cho ma trận Excel.

**Bảng con mới theo Excel #35 (chưa tồn tại — đề xuất BA):**
- `operation_plan_work` (Danh sách công trình, số 11–14): 🔴 `operation_plan_id` (FK), 🔴 `infrastructure_id` (Mã KCHT), 🔴 `infrastructure_name` (Tên KCHT — tự điền), 🔴 `location` (Địa điểm — tự điền), 🔴 `port_id` (Thuộc cảng biển — tự điền).
- `operation_plan_file` (tệp kế hoạch, số 15–16): 🔴 `operation_plan_id`, 🔴 `file_type` (Loại kế hoạch), 🔴 `file_name` (Tên file), 🔴 `file_path` (lưu qua hạ tầng file/MinIO).
- `operation_confirmation` (Xác nhận vận hành — chỉ ghi khi Hoàn thành, số 17–26): 🔴 `operation_plan_id`, 🔴 `actual_start_date`, 🔴 `actual_end_date`, 🔴 `operating_time` (Thời gian hoạt động), 🔴 `operating_status` (Tình trạng hoạt động), 🔴 `downtime` (Thời gian ngừng hoạt động), 🔴 `incident_frequency` (Tần suất sự cố), 🔴 `max_capacity` (Công suất tối đa), 🔴 `actual_capacity` (Công suất thực tế), 🔴 `result_content` (Nội dung kết quả), 🔴 `result_note` (Ghi chú kết quả).
- `operation_confirm_file` (tệp xác nhận, số 27–28): 🔴 `operation_confirmation_id` (FK), 🔴 `file_type` (Loại xác nhận), 🔴 `file_name`.

**~~KeHoachVanHanh~~** (entity legacy của brief cũ, package `vanban`): KHÔNG tồn tại trong mã nguồn hiện tại (grep toàn `src/main/java` = 0 hit). Đề xuất: **bỏ hoàn toàn tham chiếu legacy, đồng bộ về entity `OperationPlan` (package `document`)** — không tạo/tái sử dụng tên legacy.

> Ghi chú: các trường số 1–30 của Excel #35 đã được liệt kê đầy đủ ở §2 và §7 (kể cả nhóm Danh sách công trình, tệp kế hoạch, xác nhận, tệp xác nhận, Cán bộ cập nhật/Ngày cập nhật — 2 trường cuối ánh xạ `updated_by`/`updated_at` sẵn có). Brief đã đối chiếu với backend thật ngày 2026-09-04.
