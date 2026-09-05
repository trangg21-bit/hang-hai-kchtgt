---
module-id: M-006
features: F-128, F-129, F-130, F-131, F-132, F-133, F-134
document: lean-spec
output-mode: ba-analysis
last-updated: "2026-09-05"
module-name: Quản lý văn bản & Thông tin nghiệp vụ
stack: Spring Boot, MSSQL Server, ReactJS + Ant Design, MinIO
actors: A-003 (Chuyên viên/Cán bộ đơn vị quản lý KCHT), A-002 (Lãnh đạo/Cục), A-001 (Admin Cục)
complexity: high
---

# BA Analysis — M-006 cụm sheet 30->43 (F-128, F-129 → F-134)

> Phạm vi tài liệu: khối nghiệp vụ "Văn bản & Thông tin nghiệp vụ" của Module M-006 gồm 7 tính năng thuộc cụm sheet `30->43` của `./HH_Tính năng & danh sách các trường thông tin_2.9.xlsx`: F-128 (Văn bản pháp lý — #31), F-129 (Vận hành khai thác — #35), F-130 (Bảo trì — #36), F-131 (Sự cố — #37), F-132/133/134 (Quy hoạch bến cảng: tạo mới / tra cứu / cập nhật — #38).
> Ngôn ngữ: nội dung nghiệp vụ tiếng Việt có dấu; mọi định danh kỹ thuật (tên bảng, field, tham số API, quyền) dùng tiếng Anh chuẩn theo quy ước dự án.
> Tài liệu kế thừa & thay thế bản gốc (F-129/F-130) đã lưu tại `.archive/2026-09-05T09-48-07Z/ba/00-lean-spec.md` — nội dung khối F-129/F-130 được giữ nguyên, bổ sung khối F-128/F-131/F-132-134.

## 1. Tổng quan

### 1.1. Mục đích

Đặc tả nền (lean spec) cho khối nghiệp vụ **Văn bản pháp lý + Vận hành / Bảo trì / Sự cố / Quy hoạch bến cảng KCHT hàng hải**. Backend thực tế tập trung tại package `src/main/java/com/hanghai/kchtg/document/` (KHÔNG còn package `vanban` — đã kiểm chứng 0 file). Khối F-129/F-130/F-131/F-132-134 hiển thị thêm **read-only** trong TAB 4 "Vận hành & bảo trì" của drawer tài sản KCHT các module quản lý tài sản (tham chiếu 3 CSV: QL bến phao / Khu tránh trú bão / Khu chuyển tải thuộc module khác, không nằm phạm vi M-006).

### 1.2. Phạm vi

| # | Feature ID | Tên tính năng | Nguồn Excel | Actor chính |
|---|-----------|--------------|-------------|-------------|
| 1 | F-128 | Quản lý văn bản pháp lý | sheet #31 "Văn bản pháp lý" | Cán bộ đơn vị (A-003) |
| 2 | F-129 | Quản lý thông tin vận hành khai thác | sheet #35 (30 trường) | Cán bộ đơn vị (A-003) |
| 3 | F-130 | Quản lý thông tin bảo trì | sheet #36 (25 trường) | Cán bộ đơn vị (A-003) |
| 4 | F-131 | Quản lý thông tin sự cố | sheet #37 (24 trường) | Cán bộ đơn vị (A-003) |
| 5 | F-132 | Tạo mới quy hoạch bến cảng | sheet #38 (41 trường, dùng chung F-132/133/134) | Cán bộ đơn vị (A-003) |
| 6 | F-133 | Tra cứu quy hoạch bến cảng | sheet #38 (chỉ đọc) | A-003 / A-002 |
| 7 | F-134 | Cập nhật quy hoạch bến cảng | sheet #38 | Cán bộ đơn vị (A-003) |

**Ngoài phạm vi:** F-135 (Văn bản - Tìm kiếm) chưa nằm trong lượt này; 3 CSV `docs/inputs/...` thuộc module tài sản khác. Không thiết kế code; tài liệu là đề xuất BA để SA chốt.

### 1.3. Hiện trạng backend (đã đối chiếu — nguồn anchor)

Backend **đã có sẵn** trong `src/main/java/com/hanghai/kchtg/document/` (mô hình đơn giản hơn ma trận Excel):

| Thực tế backend | Anchor |
|---|---|
| `LegalDocument`(LegalDocument.java:31) — bảng `legal_documents`(LegalDocument.java:24), extends `BaseEntity`(BaseEntity.java): document_name, document_number, issuing_authority, issue_date, effective_date, expiration_date, validity_status, document_type, application_area, signer, security_level, description; audit created_by/updated_by/deleted_at kế thừa BaseEntity(BaseEntity.java:76,84,61) | `LegalDocument.java` |
| `AttachedDocument`(document/entity/AttachedDocument.java) — tệp văn bản (attached_documents); lịch sử dùng chung ghi qua `InfrastructureHistoryRepository`(common/repository/InfrastructureHistoryRepository.java) với `InfrastructureType.LEGAL_DOCUMENT`(gis/search/dto/InfrastructureType.java:29) | — |
| `Incident`(Incident.java) — severity_level, description, processing_status, reporter + audit; con `ProcessingProgress`(ProcessingProgress.java:22) | `Incident.java` |
| `OperationPlan`(OperationPlan.java:30) / `MaintenancePlan`(MaintenancePlan.java:30) + `OperationStatus`(OperationStatus.java:6) / `MaintenanceStatus`(MaintenanceStatus.java:6) + `MaintenanceResult`(MaintenanceResult.java:23) | xem §3.1 |
| `PortPlanning`(PortPlanning.java:25) — bảng `port_planning`(PortPlanning.java:20): projectName(PortPlanning.java:32), approvalAuthority, approvalDate, applicationScope, mapScale, status(PortPlanning.java:48, kiểu `PlanningStatus`(PortPlanning.java:48)), filePath + con `PlanningCategory`(PlanningCategory.java:22) | `PortPlanning.java:32,48` |
| Controllers/resource: các endpoint /api/legal-documents, /api/incidents, /api/portplannings, /api/v1/operation-plans, /api/v1/maintenance-plans; quyền khai theo `<resource>:<action>`(PermissionSeeder.java:132-140,832-853); fallback `document:*`(PermissionSeeder.java:132-140) | `document/controller/*.java`, `config/PermissionSeeder.java` |
| Data Scope: LegalDocument kế thừa BaseEntity (có org_unit_id); F-129/F-130 đã đóng org_unit_id + @Filter(orgUnitFilter) (entity) + @DataScope (controller) — lỗ hổng còn lại là F-131 Incident và F-132-134 PortPlanning (chưa có org_unit_id/filter); chi tiết symbol-anchor xem §3.1 dòng 4 | grep `orgUnitId`/`@DataScope`/`orgUnitFilter` toàn `document/` (xác minh 2026-09-05) |
| Legacy `com.hanghai.kchtg.vanban` KHÔNG tồn tại (grep 0 hit) — mọi tham chiếu brief cũ phải đổi sang `document` | grep (từ khóa `vanban`) |

### 1.4. Phân loại độ phức tạp

**High** (tổng hợp): CRUD + tệp đính kèm + trạng thái nghiệp vụ + ghi nhận kết quả theo trạng thái (F-129/130/131), hồ sơ + danh mục con (F-132-134); **không khai báo luồng phê duyệt C1/C2** trong Excel cho các cụm #31/#35/#36/#37/#38 → không phát sinh approval log (chỉ ghi lịch sử thay đổi nội bộ).

---

## 2. Khối F-128 — Văn bản pháp lý (sheet #31)

### 2.1. Use Cases

**UC-128-01 — Ghi nhận văn bản pháp lý mới** (A-003, `legaldocument:create`): nhập Tên văn bản, Số hiệu văn bản, Cơ quan ban hành văn bản, Ngày ban hành, Ngày bắt đầu hiệu lực, Ngày kết thúc hiệu lực, Người ký, Mức độ bảo mật, Phạm vi áp dụng, Nội dung/Trích yếu + tải tệp đính kèm (nhiều file). Trạng thái hiệu lực hệ thống tự tính theo ngày. Lưu → ghi `approval_history` (`ref_type = LEGAL_DOCUMENT`) → toast tiếng Việt.

**UC-128-02 — Tra cứu / xem chi tiết** (A-003/A-002, `legaldocument:read`): lọc theo từ khóa (Tên/Số hiệu), trạng thái hiệu lực, cơ quan ban hành; xem chi tiết + danh sách tệp + lịch sử thay đổi.

**UC-128-03 — Cập nhật / tải-xóa tệp** (`legaldocument:update`): sửa các trường cho phép; văn bản "Đã hết hiệu lực" **khóa sửa nội dung chính** (BR-128-03); thao tác tải/xóa tệp sinh đúng 1 bản ghi lịch sử tương ứng (BR-128-05).

**UC-128-04 — Xóa / vô hiệu hóa** (`legaldocument:delete`): chỉ Admin Cục / ROLE_SYSTEM_ADMIN; xóa mềm theo quy ước entity (truyền `deletedBy/operatorId`).

**UC-128-05 — Cảnh báo hết hiệu lực:** lịch định kỳ (xem `LegalDocumentExpiryScheduler`) cập nhật `validity_status` và cảnh báo văn bản sắp hết hiệu lực.

### 2.2. Business Rules (F-128)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-128-01 | Văn bản phải có đầy đủ Tên văn bản, Số hiệu văn bản, Cơ quan ban hành trước khi lưu | Create |
| BR-128-02 | Ngày bắt đầu hiệu lực ≥ Ngày ban hành; Ngày kết thúc hiệu lực > Ngày bắt đầu hiệu lực | Create/Update |
| BR-128-03 | Văn bản "Đã hết hiệu lực" không sửa nội dung chính | Update |
| BR-128-04 | Mọi thay đổi ghi `approval_history` với `ref_type = LEGAL_DOCUMENT` | Create/Update/Delete |
| BR-128-05 | Tải/xóa tệp sinh đúng 1 bản ghi lịch sử (Tải lên tệp / Xóa tệp), không sinh bản ghi Cập nhật trống | Update |
| BR-128-06 | Trim khoảng trắng đầu/cuối mọi ô nhập liệu trước khi lưu/tìm kiếm | Create/Update/Filter |

### 2.3. Ma trận trường (tóm tắt — đầy đủ tại feature-brief F-128 §2)

Nhóm Thông tin chung: Tên văn bản (InputTextArea), Số hiệu văn bản, Cơ quan ban hành văn bản, Ngày ban hành (DatePicker), Ngày bắt đầu/kết thúc hiệu lực (DatePicker — tự tính), Trạng thái hiệu lực (Select — tự đặt, chỉ Xem), Người ký, Mức độ bảo mật (Select), Phạm vi áp dụng, Nội dung/Trích yếu — toàn bộ cờ DS/Lọc/Xem/Tạo/Sửa theo brief §2. Nhóm File văn bản pháp lý: Tên file (Upload/Attachment — Xem/Tạo/Sửa). Nhóm Thông tin cập nhật: Cán bộ cập nhật / Ngày cập nhật (read-only).

### 2.4. API đề xuất (SA chốt)

| Method | Đường dẫn | Quyền |
|---|---|---|
| GET | `/api/legal-documents` (+ `/{id}`) | `legaldocument:read` |
| POST | `/api/legal-documents` | `legaldocument:create` |
| PUT | `/api/legal-documents/{id}` | `legaldocument:update` |
| DELETE | `/api/legal-documents/{id}` | `legaldocument:delete` |
| POST/DELETE | `/api/legal-documents/{id}/attachments[/{attachmentId}]` | `legaldocument:update` |
| GET | `/api/legal-documents/expiring` | `legaldocument:read` |

---

## 3. Khối F-129/F-130 — Vận hành khai thác & Bảo trì (sheet #35/#36) — GIỮ NGUYÊN từ bản gốc

> Nội dung sau kế thừa nguyên trạng từ `.archive/2026-09-05T09-48-07Z/ba/00-lean-spec.md` (F-129 → F-130), không thay đổi ngữ nghĩa.

### 3.1. Hiện trạng backend

| Thực tế backend | Anchor |
|---|---|
| `OperationPlan`(OperationPlan.java:30) — bảng `operation_plans`(OperationPlan.java:23): operation_date, pier, equipment, start_time, end_time, status, audit + 1–N `operationDetails`(OperationPlan.java:96) | `OperationPlan.java` |
| `OperationStatus`(OperationStatus.java:6) — 7 giá trị (CHO_DOI_PHUY…HOAN_THANH…HUY), cột `status` lưu STRING(OperationPlan.java:51-53) | `OperationStatus.java` |
| `MaintenancePlan`(MaintenancePlan.java:30) — bảng `maintenance_plans`(MaintenancePlan.java:23): equipment, maintenance_type, estimated_start_date/end_date, status, estimated_cost, audit | `MaintenancePlan.java` |
| `MaintenanceStatus`(MaintenanceStatus.java:6) — 4 giá trị; `MaintenanceType`(MaintenanceType.java:6) — 3 giá trị | `MaintenanceStatus.java`, `MaintenanceType.java` |
| Kết quả bảo trì: `MaintenanceResult`(MaintenanceResult.java:23) — ghi qua POST /result: `recordResult`(MaintenancePlanService.java:155) | `MaintenancePlanService.java` |
| Báo cáo định kỳ: `createReport`(OperationPlanService.java:177) — KHÁC ngữ nghĩa "xác nhận kế hoạch" (xem MaintenancePlanService) | `OperationPlanService.java` |
| Controller: /api/v1/operation-plans, /api/v1/maintenance-plans (xem OperationPlanController.java / MaintenancePlanController.java); quyền `operationplan:*`(PermissionSeeder.java:832-853) / `maintenanceplan:*`(PermissionSeeder.java:832-853); fallback `document:*`(PermissionSeeder.java:132-140) | `PermissionSeeder.java` |
| Đã có `org_unit_id`(OperationPlan.java:55-56) + `@Filter(orgUnitFilter)`(OperationPlan.java:29) (entity) + `@DataScope`(OperationPlanController.java:29) (controller); delete = xóa vật lý; không tự sinh code | grep xác minh 2026-09-05 |

### 3.2. Business Rules

- **BR-129-01/BR-130-01:** Mã kế hoạch tự sinh (hiện chưa có cơ chế — đề xuất bổ sung).
- **BR-129-02/BR-130-02:** TAB "Xác nhận vận hành/bảo trì" chỉ hiển thị/ghi nhận khi trạng thái = **Hoàn thành** (`HOAN_THANH`).
- **BR-129-03/BR-130-03:** "Đơn vị quản lý" là trường phân quyền dữ liệu → bắt buộc gán `org_unit_id` trong phạm vi người dùng khi tạo/sửa (cột `org_unit_id` đã có tại entity — SA chốt validate chiều ghi theo `OrgUnitScopeService`).
- **BR-129-04/BR-130-05:** Cán bộ cập nhật / Ngày cập nhật hệ thống tự điền (`updated_by/updated_at`).
- **BR-129-05/BR-130-04:** Trong Danh sách công trình: Tên KCHT/Địa điểm/Thuộc cảng biển tự điền từ Mã KCHT (disabled).
- **BR-129-06:** Ràng buộc lịch hiện có (`hasConflictSchedule`, `GET /conflict`) — chỉ áp dụng khi giữ mô hình scheduling.
- **BR-129-07/BR-130-07:** Trạng thái mặc định khi tạo nếu không truyền (đề xuất `CHO_DOI_PHUY`).
- **BR-130-06:** Khi Hoàn thành, kết quả ghi `maintenance_results` qua `POST /result`; ghi 1 hay nhiều lần → SA chốt.

### 3.3. Domain Model (ký hiệu ✅ tồn tại / ⚠️ đề xuất — SA chốt)

- ✅ `operation_plans` + `operation_details`; ⚠️ bổ sung `org_unit_id, operation_unit_id, infrastructure_type, code, name, content, expected_start_date, expected_end_date, note`; ⚠️ bảng con `operation_plan_work`, `operation_plan_file`, `operation_confirmation`.
- ✅ `maintenance_plans` + `maintenance_results`; ⚠️ bổ sung `org_unit_id, maintenance_unit_id, infrastructure_type, code, name, work_name, work_type, content, note`; ⚠️ bảng con `maintenance_work`, `maintenance_plan_file`, `maintenance_confirmation` (hoặc ánh xạ `maintenance_results`).
- ✅ `operation_reports` / `maintenance_reports` giữ nguyên (báo cáo định kỳ).
- **TAB 4 drawer tài sản:** các module tài sản hiển thị read-only "Thông tin vận hành khai thác" / "Thông tin bảo trì" qua liên kết asset (infrastructure_id) từ bảng con công trình — backend giới hạn theo quyền; không gọi danh sách để ánh xạ tên.

### 3.4. Trạng thái & Validation (F-129/130)

- Không có luồng phê duyệt C1/C2; Enum THẬT lưu STRING (lệch quy ước ORDINAL → SA chốt khi tái cấu trúc); Excel chỉ chốt mốc **Hoàn thành** → `HOAN_THANH`; không dùng mã legacy `PROPOSED(1)/APPROVED_LEVEL2(4)/REJECTED(6)`.
- Validation: V-1 bắt buộc không xác định ở cấp Excel (đề xuất: trường cờ Xem/Tạo = ✓ trong nhóm Kế hoạch là bắt buộc); V-2 thứ tự ngày; V-3 data scope; V-4 chặn trùng lịch; V-5 Mã KCHT tồn tại + không trùng asset; V-6 số thập phân ≥ 0 (precision 15, scale 2); V-7 trim chuỗi; V-8 kiểm toán đủ `updated_by/operatorId`; V-9 tệp qua MinIO/file_path.

### 3.5. Phân quyền (F-129/130)

`operationplan: manage/read/create/update/delete`; `maintenanceplan: manage/read/create/update/delete/report`. Bảng vai trò × thao tác: A-003 xem scope đơn vị + tạo/sửa/xóa (trước Hoàn thành) + ghi nhận kết quả; A-002 xem theo nhóm; **Admin Cục xem full xuyên đơn vị + metadata nhạy cảm**; ROLE_SYSTEM_ADMIN vượt mọi kiểm tra.

---

## 4. Khối F-131 — Thông tin sự cố (sheet #37)

### 4.1. Use Cases

**UC-131-01 — Ghi nhận sự cố** (A-003, `incident:create`): nhập Đơn vị quản lý (SelectOrgCode — trường đơn vị phân quyền), Loại sự cố (Select), Mã sự cố (tự sinh, disabled), Thời gian xảy ra sự cố (RangePicker), Địa điểm xảy ra sự cố, Loại KCHT xảy ra sự cố + Mã/Tên KCHT (chọn Mã → tự điền Tên disabled), Nội dung sự cố, Tình trạng thiệt hại, Trạng thái sự cố (Select), Ghi chú; khai báo **Diễn biến sự cố** (Thời gian từ-đến + Sự kiện), tệp thông tin sự cố.

**UC-131-02 — Chỉ đạo / xử lý sự cố** (`incident:update`): TAB "Chỉ đạo xử lý sự cố / xử lý sự cố" **chỉ hiển thị khi trạng thái ∈ {Đã xử lý đang theo dõi, Không thể xử lý, Đã đóng}**: Cán bộ chỉ đạo xử lý (Select trong bảng), Nội dung chỉ đạo, Ngày chỉ đạo, Biện pháp xử lý, Kết quả xử lý, Ghi chú (xử lý) + tệp kết quả xử lý.

**UC-131-03 — Tra cứu / cập nhật / xóa** (`incident:read/update/delete`): lọc Đơn vị quản lý, Loại sự cố, Trạng thái (StatusTabs); chi tiết theo trạng thái; xóa mềm.

### 4.2. Business Rules (F-131)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-131-01 | Mã sự cố tự sinh, disabled | Create |
| BR-131-02 | Tên KCHT tự điền khi chọn Mã KCHT (disabled) | Create/Update |
| BR-131-03 | TAB chỉ đạo/xử lý chỉ hiện khi trạng thái ∈ {Đã xử lý đang theo dõi, Không thể xử lý, Đã đóng} | Update |
| BR-131-04 | "Đơn vị quản lý" = trường phân quyền dữ liệu (`orgUnitId`) — gán trong phạm vi, không NULL | Create/Update |
| BR-131-05 | Cán bộ cập nhật / Ngày cập nhật tự điền, không nhập | Update |
| BR-131-06 | Trim chuỗi trước khi lưu/tìm kiếm | Create/Update/Filter |

### 4.3. Ma trận trường & bảng (tóm tắt — đầy đủ tại feature-brief F-131 §2/§7)

24 trường (cụm #37): nhóm Thông tin sự cố (1–12), Diễn biến sự cố (13–14), File thông tin sự cố (15), Chỉ đạo xử lý sự cố (16–21), File kết quả xử lý (22), Trạng thái — Cán bộ cập nhật/Ngày cập nhật (23–24). Bảng đề xuất: `incident`, `incident_evolution`, `incident_handling`, `incident_file` (chi tiết F-131 §7, các trường 🔴 là đề xuất).

### 4.4. API đề xuất (SA chốt)

| Method | Đường dẫn | Quyền |
|---|---|---|
| GET | `/api/incidents` (+ `/{id}`) | `incident:read` |
| POST | `/api/incidents` | `incident:create` |
| PUT | `/api/incidents/{id}` | `incident:update` |
| DELETE | `/api/incidents/{id}` | `incident:delete` |

---

## 5. Khối F-132/133/134 — Quy hoạch bến cảng (sheet #38)

### 5.1. Use Cases

**UC-132-01 — Tạo mới quy hoạch bến cảng** (A-003, `portplanning:create`): nhập thông tin chung (Đơn vị quản lý — SelectOrgCode, Số quyết định quy hoạch, Ngày quyết định, Cảng biển quy hoạch, Nhóm = Cảng biển/Cảng cạn — nhánh động theo Nhóm), Kế hoạch quy hoạch (Dự báo đến năm, Nội dung, Nhu cầu sử dụng đất và mặt nước, Nhu cầu vốn đầu tư, Giải pháp thực hiện, Dự án ưu tiên đầu tư, Tổ chức thực hiện), Dự báo hàng hóa thông qua cảng (theo Phân loại CB/BC/CC + cảng-bến-cầu cụ thể + min/max 3 nhóm hàng + Ghi chú), Danh mục quy hoạch chi tiết — Hiện trạng & Sau quy hoạch (Số lượng cầu cảng, Chiều dài, Cỡ tàu, Công suất, Diện tích vùng đất/nước), File đính kèm.

**UC-133-01 — Tra cứu** (`portplanning:read`, chỉ đọc): danh sách + chi tiết hồ sơ quy hoạch + danh mục con; tải tệp đính kèm.

**UC-134-01 — Cập nhật / điều chỉnh** (`portplanning:update`): sửa hồ sơ + danh mục con; trạng thái ban hành (lưu tạm / ban hành / lịch sử); file đính kèm cập nhật được.

### 5.2. Business Rules (F-132/133/134)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-132-01 | "Đơn vị quản lý" (`orgUnitId`) = trường phân quyền dữ liệu — gán trong phạm vi, không NULL; đơn vị cha xem subtree, Cục xem full | Create/Update/Read |
| BR-132-02 | Trường "Cảng biển quy hoạch / Nhóm cảng biển" (Nhóm = Cảng biển) và "Cảng cạn quy hoạch" (Nhóm = Cảng cạn) hiển thị **theo nhánh điều kiện** của trường "Nhóm" | Create |
| BR-132-03 | Dự báo hàng hóa + danh mục chi tiết là bảng con nhiều dòng; giá trị min ≤ max (DoubleInput, tự tính Tổng cộng) | Create/Update |
| BR-132-04 | Số quyết định quy hoạch + Ngày quyết định bắt buộc khi tạo hồ sơ | Create |
| BR-132-05 | Cán bộ cập nhật / Ngày cập nhật tự điền; trạng thái (lưu tạm/ban hành/lịch sử) hiển thị dạng badge | Update |
| BR-132-06 | Trim chuỗi trước khi lưu/tìm kiếm | Create/Update/Filter |

### 5.3. Ma trận trường & entity (tóm tắt — đầy đủ tại feature-brief F-132 §2 dùng chung F-132/133/134; 41 trường cụm #38)

- Entity THẬT: `PortPlanning`(PortPlanning.java:25) — bảng `port_planning`(PortPlanning.java:20): projectName(PortPlanning.java:32), approvalAuthority, approvalDate, applicationScope, mapScale, status(PortPlanning.java:48, kiểu `PlanningStatus`(PortPlanning.java:48)), filePath + con `PlanningCategory`(PlanningCategory.java:22) (danh mục quy hoạch chi tiết theo phase Hiện trạng/Sau quy hoạch)
- Nhóm TAB theo Excel: Thông tin chung (1–5 + nhánh 6–8), Kế hoạch quy hoạch (11–17), Dự báo hàng hóa (18–24), Danh mục quy hoạch chi tiết Hiện trạng (25–32) / Sau quy hoạch (33–38), File đính kèm (39), Thông tin cập nhật (40–41). Bảng con đề xuất: `port_planning_cargo_forecast`, `port_planning_detail`, `port_planning_file` — SA chốt ánh xạ sang `PlanningCategory` hiện có.
- Cờ DS/Lọc/Xem/Tạo/Sửa từng trường chi tiết tại F-132 §2 (dòng 1–41); F-133 §2 dùng cho chế độ Xem, F-134 §2 dùng cho chế độ Sửa của cùng ma trận.

### 5.4. API đề xuất (SA chốt)

| Method | Đường dẫn | Quyền |
|---|---|---|
| GET | `/api/portplannings` (+ `/{id}`) | `portplanning:read` |
| POST | `/api/portplannings` | `portplanning:create` |
| PUT | `/api/portplannings/{id}` | `portplanning:update` |
| DELETE | `/api/portplannings/{id}` | `portplanning:delete` |

---

## 6. Phân quyền tổng hợp (`<resource>:<action>`) & Admin Cục

| Resource | read | create | update | delete | Ghi chú |
|---|---|---|---|---|---|
| `legaldocument` | ✓ | ✓ | ✓ | ✓ | xóa/vô hiệu hóa chỉ Admin Cục; seed trong `PermissionSeeder` |
| `operationplan` | ✓ | ✓ | ✓ | ✓ | (+ `manage`); report theo bảo trì |
| `maintenanceplan` | ✓ | ✓ | ✓ | ✓ | (+ `manage`/`report`) |
| `incident` | ✓ | ✓ | ✓ | ✓ | |
| `portplanning` | ✓ | ✓ | ✓ | ✓ | F-133 chỉ cần read; F-134 chỉ cần update |

**Bảng vai trò × thao tác (phân quyền động theo nhóm/tài khoản):**

| Vai trò / nhóm | Xem (đơn vị + subtree) | Xem full | Tạo | Sửa | Xóa | Ghi nhận kết quả |
|---|---|---|---|---|---|---|
| Cán bộ đơn vị (A-003) | ✓ (orgUnit scope) | — | ✓ | ✓ | ✓ (trước khi chốt trạng thái) | ✓ |
| Lãnh đạo Cảng vụ/Chi cục, Lãnh đạo Cục (A-002) | ✓ (scope theo nhóm) | tùy nhóm | — | — | — | — |
| **Admin Cục** | ✓ full (xuyên đơn vị) | ✓ | ✓ | ✓ | ✓ | ✓ |

**Admin Cục (bắt buộc khai báo):** xem full dữ liệu mọi đơn vị (không giới hạn subtree) + metadata nhạy cảm (người tạo, người sửa cuối, thời gian tạo/cập nhật). ROLE_SYSTEM_ADMIN vượt mọi kiểm tra quyền như chuẩn hệ thống.

---

## 7. Điểm lệch hiện trạng ↔ Excel — việc cần SA chốt

| # | Lệch | Gợi ý BA |
|---|---|---|
| 1 | F-128 legacy package `vanban` đã xóa; code thật tại `document` (`LegalDocument`) — brief cũ dẫn sai đường dẫn | Đã sửa source-paths tại feature-brief F-128; SA rà lại tên repository/controller thật |
| 2 | F-129/F-130 đã đóng Data Scope (`org_unit_id` + `@Filter(orgUnitFilter)` + `@DataScope`); F-131 `Incident` và F-132-134 `PortPlanning` chưa có `org_unit_id`/filter dù Excel có Đơn vị quản lý | Bổ sung cột + filter + backfill cho F-131/F-132-134 theo Data Scope Convention (migration kèm backfill) |
| 3 | F-131/F-132-134 chưa đối chiếu toàn bộ entity/DTO với ma trận Excel (trạng thái lưu số theo quy ước) | SA đối chiếu: enum/status, bảng con, quyền `incident:*`/`portplanning:*` seed |
| 4 | Entity `PortPlanning` hiện có (projectName/status) đơn giản hơn ma trận 41 trường | Mở rộng entity + child `PlanningCategory`/bảng con theo F-132 §7 (đề xuất) |
| 5 | Enum hiện có lưu STRING + tên không theo quy ước; delete xóa vật lý ở vài service | SA chốt tái cấu trúc enum/soft-delete (ngoài phạm vi BA) |
| 6 | Excel không có cột "Bắt buộc" → mức bắt buộc không xác định ở cấp Excel | Dự kiến theo cờ Xem/Tạo = ✓ trong nhóm chính; SA chốt cùng Dev |

## 8. Giả định & ẩn số

- Cột "Bắt buộc" không có trong Excel → không bịa; các danh sách giá trị Select (Loại sự cố, Loại KCHT, Nhóm, Trạng thái...) và danh sách trạng thái chi tiết ngoài mốc đã chốt → **SA chốt**.
- TAB 4 drawer tài sản: 3 CSV cho thấy chỉ hiển thị read-only; chi tiết từng asset thuộc module sở hữu — tài liệu này chỉ chốt ngữ nghĩa liên kết (liên kết asset qua `infrastructure_id`).
- Tài liệu này là đề xuất BA; feature-brief §6/§7 và mọi tên bảng/field/cột ở trên chờ người thiết kế kỹ thuật (SA) chốt.
