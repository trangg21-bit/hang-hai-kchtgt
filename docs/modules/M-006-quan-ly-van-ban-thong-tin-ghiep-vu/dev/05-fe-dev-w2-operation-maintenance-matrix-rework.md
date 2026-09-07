# FE Wave-2 Rework — F-129 OperationList + F-130 MaintenanceList (ma trận Excel §2 + xác nhận/result + phân quyền theo action)

- module: M-006, features F-129 / F-130
- stage: engineering-frontend-developer (wave 2 — rework theo QA acceptance-map wave-2: Changes-requested, DEFECT-01/02/03)
- ngày: 2026-09-05
- phạm vi ghi: CHỈ `frontend/src/pages/document/OperationList.tsx`, `frontend/src/pages/document/MaintenanceList.tsx` (viết lại toàn bộ, additive theo contract BE đã xác minh) + file summary này. KHÔNG đụng PermissionSeeder, backend, migration, theme.ts, tokens.ts, list-view, briefs, design, module state. Không chạy git.

## 1. Anchor xác minh (mở trực tiếp 2026-09-05)

| # | Anchor | Nội dung xác minh |
|---|---|---|
| 1 | `src/main/java/com/hanghai/kchtg/config/PermissionSeeder.java:132-140, 832-853` | Seed thật: `document:manage/read/create/update/delete/approve`; `maintenanceplan:manage/read/create/update/delete/report`; `operationplan:manage/read/create/update/delete`. KHÔNG có `document:write` → `canWrite='document:write'` (w1, OperationList.tsx:90 cũ) sai code. |
| 2 | `OperationPlanController.java:50,73,82,~29` + `MaintenancePlanController.java:52,75,84,97` | `@PreAuthorize` theo cặp `operationplan:<action>` OR `document:<action>`; `POST /{id}/confirmation` = update; `POST /result` = `maintenanceplan:report` OR `maintenanceplan:update` OR `document:update`. |
| 3 | `OperationPlanCreateRequest.java` (full), `MaintenancePlanCreateRequest.java` (full) | Request header-only: orgUnitId, operatingOrgUnitId, infrastructureType, code, name, content, expectedStartDate/EndDate, note + trường legacy. KHÔNG chứa danh sách con work/file. |
| 4 | `OperationPlanService.java` (create/update body), `MaintenancePlanService.java` (create/update body) | Service map header fields; code tự sinh khi request.code rỗng; orgUnitId fallback + `requireOrganizationInScope`; KHÔNG persist child row nào từ request. |
| 5 | `OperationConfirmationCreateRequest.java`, `MaintenanceResultRequest.java`, `OperationPlanResponse.java`, `MaintenancePlanResponse.java`, `MaintenancePlanWorkResponse.java`, `MaintenancePlanFileResponse.java` | Tên field đúng cho form xác nhận/kết quả + hiển thị; response có orgUnitName/code/workItems/files/confirmations/results. |
| 6 | `OperationStatus.java`, `MaintenanceStatus.java` | Enum code backend: OP = CHO_DOI_PHUY/DANG_TIEP_NHAN/DA_PHE_DUYET/DANG_THANH_HANH/HOAN_THANH/TRI_HOAI/HUY; MT = CHO_DOI_PHUY/DANG_THUC_HIEN/HOAN_THANH/TRI_HOAI. |
| 7 | `frontend/src/components/list-view/DataTable.tsx:63-90`, `FilterTableLayout.tsx:6-14`, `Pagination.tsx:6-10`, `ScreenHeader.tsx:5-25`, `frontend/src/components/org-unit/*` | Contract component dùng chung; `FilterOrgUnitTreeSelect` / `FormOrgUnitTreeSelect` cho filter sidebar + form drawer. |

## 2. Files changed

| File | Thay đổi | Liên quan defect |
|---|---|---|
| `frontend/src/pages/document/OperationList.tsx` | Viết lại: form create/edit thu gom đủ field ma trận F-129 (orgUnitId qua OrgUnitTreeSelect, operatingOrgUnitId, infrastructureType, code read-only disabled, name, content, note, expectedStartDate/EndDate + legacy operationDate/pier/equipment/startTime/endTime/status); payload gửi đúng tên field BE; view drawer hiển thị header + workItems + files + mục "Xác nhận vận hành" chỉ khi `status === 'HOAN_THANH'` (hiển thị bản ghi xác nhận có sẵn hoặc nút mở Modal `POST /api/v1/operation-plans/{id}/confirmation`); cổng quyền theo action. | DEFECT-01, DEFECT-02, DEFECT-03 |
| `frontend/src/pages/document/MaintenanceList.tsx` | Tương tự cho F-130: estimated dates/cost giữ nguyên, thêm orgUnitId/operatingOrgUnitId/infrastructureType/name/content/note + nhãn "Tên công việc bảo trì"; mục "Xác nhận kết quả bảo trì" chỉ khi `HOAN_THANH` → Modal `POST /api/v1/maintenance-plans/result` (maintenancePlanId, actualStartDate/EndDate, resultDescription/Note, replacedParts, downtimeDuration, recorder, recordedDate); cổng quyền theo action (kể cả `maintenanceplan:report`). | DEFECT-01, DEFECT-02, DEFECT-03 |

## 3. Ánh xạ defect → fix

- **DEFECT-01 (HIGH) — đóng**: interface + form + payload 2 màn chứa toàn bộ field Create/Edit=TRUE mà BE accept (anchor #3/#4): `orgUnitId` (OrgUnitTreeSelect, bắt buộc, giữ value=orgUnitId), `operatingOrgUnitId`, `infrastructureType`, `name`, `content`, `note`, `expectedStartDate/EndDate` (F-129; F-130 vẫn dùng estimatedStartDate/EndDate sẵn có), `code` hiển thị read-only disabled và KHÔNG gửi lên (BE tự sinh — anchor #4), `.trim()` mọi text input, payload chỉ chứa key BE chấp nhận.
  - `infrastructureType`: dùng Input nhập mã enum (design-plan §2.2.6: FE "đọc danh mục từ danh sách KCHT-type sẵn có" nhưng grep toàn frontend KHÔNG có danh mục InfrastructureType FE nào; không tự bịa danh mục enum → Input text trung thực với dữ liệu, không phát minh giá trị).
- **DEFECT-02 (MEDIUM) — đóng phần BE cho phép + deferral có anchor**:
  - ĐÃ CÀI: luồng Xác nhận vận hành (F-129) gọi `POST /api/v1/operation-plans/{id}/confirmation` và Xác nhận kết quả bảo trì (F-130) gọi `POST /api/v1/maintenance-plans/result` với body khớp 100% field DTO (anchor #5); cả hai chỉ hiển thị khi `status === 'HOAN_THANH'` (đúng brief §2 + design §2.6 constraint 7 + BR-129-02/BR-130-02/BR-130-06); sau ghi nhận reload chi tiết để hiện bản ghi.
  - DEFERRED (có anchor, không bỏ im): chỉnh sửa từng dòng child **work/file** trong create/edit drawer KHÔNG thể wire được vì BE không có write path: request create/update header-only (anchor #3), service không persist child (anchor #4), controller KHÔNG có endpoint CRUD cho operation_plan_work/file, maintenance_plan_work/file (đối chiếu design §2.3 "FE gọi nguyên trạng endpoint CRUD đã tồn tại — không tạo đường dẫn mới"; chỉ có confirmation/result là write path child). Hiển thị read-only workItems/files trong view drawer (design §2.6 constraint 4, bảng con trong drawer dùng `DRAWER_TABLE_SCROLL_Y.detailView`). Upload file xác nhận/file kế hoạch: không có endpoint BE để FE gọi trong module này (LegalDocument dùng `/attachments` riêng của nó) → nằm ngoài khả năng gọi của 2 màn này; design §5 mục 2 chốt TAB asset/liên kết thuộc module tài sản. Ghi chú `SIMPLIFICATION` ngay đầu mỗi file.
- **DEFECT-03 (LOW-MEDIUM) — đóng**: bỏ `document:write`; mỗi page tự khai báo cổng theo đúng bộ code seed + `@PreAuthorize` BE (anchor #1/#2): canRead/create/update/delete = `hasAnyPermission([operationplan:* | maintenanceplan:*, document:* cùng action])`; canRecordResult thêm `maintenanceplan:report`. Cột menu hành động dòng (view/edit/delete) render theo từng cổng — đúng mẫu LegalDocumentList (hasPerm per action, :431-445/:538).

## 4. Tuân thủ convention (AGENTS.md)

- Đọc `frontend/src/theme.ts`, `tokens.ts` (preset + thang số), `themetokenchk.ts` (`getDatePickerProps`, `DRAWER_TABLE_SCROLL_Y`), `components/AppLayout.tsx` gián tiếp qua AppLayout routes (không sửa). Không hardcode hex/spacing/font — chỉ dùng token (inputStyle/selectStyle/textAreaStyle/primaryButtonStyle/spaceFormField/spaceSm/radiusPill/fontSizeMd/fontWeightMedium từ tokens.ts; màu trạng thái từ `useThemeToken()`). Form.Item marginBottom=spaceFormField; badge pill chuẩn (radiusPill 999px, 2px 10px, fontSizeMd 13, fontWeightMedium 500, `background ${color}15`, `border ${color}40`); tiêu đề cột hiển thị đủ, cell text ellipsis + `cellTitle`; cột thao tác để DataTable tự gắn cố định phải; 4 trạng thái loading/error/empty/data qua FilterTableLayout (loading/error/errorMessage/onRetry) + DataTable + Pagination; identifier tiếng Anh, label/toast tiếng Việt có dấu; không dùng antd Tag; import-then-export không dính (không re-export token).

## 5. Verify (đã chạy, exit 0)

- `cd frontend && npx tsc --noEmit` → **exit 0, no output** (2026-09-05).
- `cd frontend && npm run build` → **exit 0** (vite build, 3528 modules, 588ms).
- LSP diagnostics 2 file: chỉ còn biome `noExplicitAny` warnings (cùng lớp warning có sẵn project-wide theo w1 record — không phải lỗi mới, không phải tsc).
- Backend không đụng → không cần mvn. Không chạy dev server → CHƯA có browser/visual evidence (render thực tế, focus/keyboard) — chỉ source-verified + typecheck/build.

## 6. Risks / ghi chú cho QA wave-3

- Child work/file chỉ đọc (deferral có anchor §3); file upload của 2 màn này không có endpoint BE.
- `operatingOrgUnitId` hiển thị raw UUID trong view drawer (response BE không có operatingOrgUnitName — không tự bịa tên).
- DatePicker showTime: format `DD/MM/YYYY HH:mm` ↔ payload ISO `YYYY-MM-DDTHH:mm:ss`; LocalTime legacy `HH:mm:ss`.
- Client-side phân trang/filter (fetch size=1000) giữ nguyên như w1 (SIMPLIFICATION ghi đầu file) — nâng cấp khi BE trả totalElements.
