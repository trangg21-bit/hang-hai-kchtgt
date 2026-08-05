# hang-hai-kchtgt

workspace-type: mono
repo-type: mono
stack: none
framework: spring-boot
cli: mvn

## Vite Dev-Mode Re-Export Bug (MANDATORY — read before touching tokens or re-exports)

Vite v8 dev mode does **NOT** resolve `export { x } from './module'` bindings when `x` is referenced in the same module body. This throws `ReferenceError: x is not defined` at browser runtime, but **production build (`vite build`) passes without error**.

```ts
// ❌ BROKEN in Vite dev (ReferenceError at runtime):
export { dataNavy } from "./tokens";
export const colors = [dataNavy]; // dataNavy is not defined!

// ✅ FIX — explicit import, then re-export:
import { dataNavy } from "./tokens";
export { dataNavy };
export const colors = [dataNavy]; // works
```

**Always use import-then-export pattern** when the same file needs to both re-export a token AND use it in computed values. Applies to `tokens-dashboard.ts`, `tokens.ts` layers, and any barrel file that computes derived values from re-exports.

## Framework discipline (MANDATORY — read before delegating code work)

This project is built on **spring-boot**. Its CLI/generator is `mvn`. Prefer the framework's CLI/generators over hand-writing files:

- Scaffold components / entities / migrations / modules via the framework CLI (`mvn ...`) — hand-written files drift from the framework's expected structure and can break builds, dependency injection, or schema sync. Frameworks like ASP.NET Zero (ABP), Angular, NestJS, and Nx all enforce CLI-based generation.
- When unsure of the exact command or its current-version syntax, resolve live docs via context7 (`resolve-library-id` → `get-library-docs`) BEFORE generating.
- Main / project manager MUST carry these constraints into every worker task brief (workers do not read this file).

## UI Theme Convention (MANDATORY — mọi agent làm frontend PHẢI đọc)

### Single source of truth

Toàn bộ token thiết kế, CSS class, và cấu trúc layout được định nghĩa tại **3 file**:

| Thứ tự đọc | File                                    | Vai trò                                                          | Agent nào phải đọc                |
| ---------- | --------------------------------------- | ---------------------------------------------------------------- | --------------------------------- |
| 1          | `frontend/src/theme.ts`                 | Design tokens + AntD ConfigProvider + globalCssVars + Rules 1-14 | **Tất cả** (BA, Dev, QA, Auditor) |
| 2          | `frontend/src/components/AppLayout.tsx` | Layout chung cho 22 module (Sidebar + Topbar)                    | **Dev, QA**                       |
| 3          | `docs/intel/ui-audit-report.md`         | Danh sách pass/fail từng UI component                            | **PMO lead** trước khi dispatch   |

### Cách dùng theme token

```ts
// ✅ ĐÚNG — dùng token từ theme.ts
import { colors } from '../theme';
style={{ color: colors.sidebarBg }}

// ✅ ĐÚNG — dùng CSS variable
className="sidebar-header"

// ❌ SAI — hardcode màu
style={{ color: '#12468C' }}
```

### Quy tắc bắt buộc

1. **KHÔNG hardcode màu hex**, spacing, font-size trong component
2. **KHÔNG tự tạo Layout/Sider/Menu riêng** — dùng chung `AppLayout.tsx`
3. **KHÔNG tự bịa class CSS** — tất cả class chuẩn đã có trong `theme.ts` globalCssVars
4. **Trước khi viết bất kỳ component UI nào**, developer PHẢI đọc `theme.ts` để biết có sẵn những class nào
5. **Trước khi dispatch developer**, PMO lead PHẢI đọc `docs/intel/ui-audit-report.md` để biết trạng thái UI hiện tại

### Agent workflow

```
PMO Lead
  ├── Đọc AGENTS.md (file này)
  ├── Đọc docs/intel/ui-audit-report.md → biết pass/fail UI
  └── Dispatch Dev → PHẢI chép các constraints sau vào prompt:
        "Trước khi code, đọc frontend/src/theme.ts để biết token + class chuẩn.
         Đọc frontend/src/components/AppLayout.tsx để biết cấu trúc layout.
         KHÔNG hardcode màu hex. KHÔNG tự tạo Layout/Sider/Menu.
         Dùng class BEM có sẵn trong globalCssVars."
```

**⚠️ PMO LEAD: workers KHÔNG đọc AGENTS.md. Bạn PHẢI copy các quy tắc trên vào từng brief developer. Nếu không, developer sẽ hardcode màu và tự bịa Layout.**

## Semantic Token System (MANDATORY — áp dụng cho MỌI component UI mới)

`frontend/src/tokens.ts` là kiến trúc token ngữ nghĩa, bổ sung cho `theme.ts`. Trong khi `theme.ts` quản lý AntD ConfigProvider + Layout + Sidebar, thì `tokens.ts` quản lý **vai trò** của màu sắc và thang số trong component.

### 7 nguyên lý (bắt buộc tuân thủ)

| #   | Nguyên lý                           | Ý nghĩa                                                                                                       |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | **Token vai trò, không giá trị**    | `statusOperational` — không phải `greenColor`. Token trả lời "tại sao", không phải "cái gì"                   |
| 2   | **Palette đóng (13 màu)**           | Không thêm token màu mới nếu không design review                                                              |
| 3   | **Thang số — cấm giá trị giữa**     | Radius: 4/8/12/999. Font: 11/13/15/20/28. Weight: 400/500/600. Spacing: 4/8/12/16/24/32. Cấm 6, 7, 10, 14, 18 |
| 4   | **Thứ bậc text**                    | `textPrimary` (số KPI) → `textSecondary` (nhãn) → `textTertiary` (metadata) — nhất quán mọi màn               |
| 5   | **Accent budget ≤ 3**               | `actionPrimary` xuất hiện tối đa 3 lần/màn hình                                                               |
| 6   | **Nhiệt độ màu**                    | Tất cả surface xám dùng chung undertone lạnh                                                                  |
| 7   | **Quy ước loại ND → cách thể hiện** | metadata → `metaStyle`, card → `cardStyle`, action → `actionStyle`, badge → `badgeBaseStyle`                  |

### Cách dùng

```ts
// ✅ ĐÚNG — dùng semantic token từ tokens.ts
import { statusOperational, fontSizeStat, spaceMd, cardStyle } from '../tokens';
style={{ color: statusOperational, fontSize: fontSizeStat }}

// ❌ SAI — hardcode giá trị dù đúng visual
style={{ color: '#1BAF7A', fontSize: 28 }}
```

### Cách dùng chung với theme.ts

```ts
// tokens.ts: semantic role tokens (cho component nội dung)
import { statusOperational, textPrimary, spaceMd } from "../tokens";

// theme.ts: layout/infrastructure tokens (cho sidebar, header, AntD config)
import { colors, layout } from "../theme";
```

### Agent workflow cho UI mới

```
PMO Lead
  ├── Đọc tokens.ts → biết 13 token màu + thang số
  └── Dispatch Dev → PHẢI chép constraints vào prompt:
        "Trước khi code, đọc frontend/src/tokens.ts để biết semantic token.
         Import từ tokens.ts (không hardcode hex/spacing/font-size).
         Tuân thủ accent budget ≤ 3 lần actionPrimary/màn.
         Cấm dùng giá trị ngoài thang: radius 6/7/10, font 12/14/16/18/24, spacing 10/14/18."
```

## Form & List UI Convention (MANDATORY — áp dụng cho MỌI màn danh sách và popup)

### List Screen Pattern

Mọi màn hình danh sách (quản lý người dùng, vai trò, đơn vị, v.v.) **PHẢI** dùng 5 components share từ `frontend/src/components/list-view/`:

| Component      | Vai trò                                                  |
| -------------- | -------------------------------------------------------- |
| `ScreenHeader` | Breadcrumb + nút hành động (Thêm mới, Xuất Excel)        |
| `FilterBar`    | Ô tìm kiếm, select lọc, date range + nút Tìm kiếm/Reload |
| `StatusTabs`   | Tab trạng thái kèm số lượng                              |
| `DataTable`    | Bảng dữ liệu có sort + dropdown hành động                |
| `Pagination`   | Điều hướng trang                                         |

### Form/Modal Pattern

Mọi form trong modal popup **PHẢI** dùng:

```ts
// ✅ ĐÚNG — tokens từ tokens.ts
import { spaceFormField, radiusPill } from '../tokens';

<Form.Item style={{ marginBottom: spaceFormField }}>...</Form.Item>
<Input style={{ borderRadius: radiusPill, height: 40 }} />
<Modal footer={[
  <Button style={{ borderRadius: radiusPill, height: 40 }}>Hủy</Button>,
  <Button type="primary" style={{ borderRadius: radiusPill, height: 40 }}>Tạo mới</Button>,
]} />
```

- **KHÔNG** hardcode margin-bottom Form.Item — dùng `spaceFormField` (12px)
- **KHÔNG** hardcode border-radius — dùng `radiusPill` (999px) cho Input, Select, Button
- `height: 40` cho mọi Input, Select
- `labelProps()` helper cho label style nhất quán
- Modal footer: Cancel (outlined) + Submit (primary), cả hai pill radius

### Reference Implementation

Xem `frontend/src/pages/UsersPage.tsx` — đây là mẫu chuẩn cho cả list screen + form modal.

Chi tiết xem tại: [`docs/conventions/form-and-list-patterns.md`](docs/conventions/form-and-list-patterns.md)

### Agent workflow

```
PMO Lead
  └── Dispatch Dev làm màn danh sách / popup → PHẢI chép constraints vào prompt:
        "Dùng ScreenHeader + FilterBar + StatusTabs + DataTable + Pagination
         từ frontend/src/components/list-view/.
         KHÔNG tự tạo search/filter UI riêng, KHÔNG tự tạo table riêng.
         Form.Item marginBottom = spaceFormField (12px).
         Input/Select borderRadius = radiusPill (999px), height = 40.
         Xem UsersPage.tsx làm mẫu chuẩn.
         Đọc docs/conventions/form-and-list-patterns.md để biết chi tiết."
```

**⚠️ PMO LEAD: workers KHÔNG đọc AGENTS.md. Bạn PHẢI copy quy tắc trên vào brief và luôn gửi kèm link `docs/conventions/form-and-list-patterns.md`.**

## Feature Brief Template Convention (MANDATORY — mọi BA agent làm feature-brief PHẢI đọc)

### Single source of truth

Toàn bộ cấu trúc tài liệu đặc tả nghiệp vụ (feature-brief.md) được định nghĩa tại **1 file duy nhất**:

| File                             | Vai trò                                      | Agent nào phải đọc        |
| -------------------------------- | -------------------------------------------- | ------------------------- |
| `docs/feature-brief-template.md` | Template 10-section cho mọi feature-brief.md | **BA** (business analyst) |

### Cấu trúc 10 section bắt buộc

Mọi file `feature-brief.md` **PHẢI** tuân thủ đúng cấu trúc 10 section, đúng thứ tự, đúng tiêu đề:

| #   | Section                                 | Nội dung                                                                             |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | Tổng quan                               | 1.1 Tính năng này làm gì / 1.2 Tại sao cần / 1.3 Luồng hoạt động chính               |
| 2   | Ai dùng? Dùng như thế nào?              | Bảng phân quyền RBAC 7 role + logic Admin Cục đặc biệt                               |
| 3   | User Stories                            | Must / Should / Could, định dạng US-{XXX}-XX                                         |
| 4   | Yêu cầu chức năng (Acceptance Criteria) | AC-{XXX}-XX, mỗi AC kèm xử lý khi lỗi                                                |
| 5   | Quy tắc nghiệp vụ (Business Rules)      | BR-{XXX}-XX, định dạng bảng: ID / Rule / Applies-to / Source                         |
| 6   | Mô hình dữ liệu                         | Bảng DB, 🔴 đỏ = trường mới, ~~gạch ngang~~ = trường cần loại bỏ                     |
| 7   | API Endpoints                           | Bảng Method / Endpoint / Mô tả / Phân quyền                                          |
| 8   | Chi tiết nghiệp vụ từng phần            | Triển khai chi tiết từng phần (bỏ nếu không áp dụng)                                 |
| 9   | Yêu cầu phi chức năng                   | Hiệu năng / Mở rộng / Bảo mật / Độ tin cậy / UX / Pháp lý                            |
| 10  | Yêu cầu giao diện người dùng            | Token theme + bảng cột chi tiết (STT/Tên trường/Loại ĐK/Edit/Bắt buộc/Default/Mô tả) |

### Quy tắc bắt buộc

1. **KHÔNG đảo thứ tự** 10 section — thứ tự cố định như trên
2. **KHÔNG bỏ section** — nếu section không áp dụng, ghi rõ "Không áp dụng" kèm lý do
3. **KHÔNG thay đổi tiêu đề section** — tiêu đề cố định như template
4. **KHÔNG tự bịa định dạng ID** — AC/BR/US luôn theo format `{PREFIX}-{XXX}-{XX}`
5. **KHÔNG bỏ logic Admin Cục** (section 2.2) — mọi feature phải khai báo phân quyền đặc biệt này
6. **KHÔNG hardcode màu/spacing/font-size** trong section 10 — dùng token từ `theme.ts` và `tokens.ts`
7. **Trước khi viết bất kỳ feature-brief.md nào**, BA PHẢI đọc `docs/feature-brief-template.md` để nắm cấu trúc chuẩn

### BỎ khỏi template

- **Kịch bản kiểm thử** — thuộc về QA, không nằm trong feature-brief
- **Môi trường kỹ thuật** — thuộc về SA/Dev, không nằm trong feature-brief

### Agent workflow

```
PMO Lead
  ├── Đọc AGENTS.md (file này)
  └── Dispatch BA → PHẢI chép các constraints sau vào prompt:
        "Trước khi viết feature-brief.md, đọc docs/feature-brief-template.md làm template chuẩn.
         Tuân thủ đúng 10 section, đúng thứ tự, đúng tiêu đề.
         Format AC: AC-{XXX}-XX, BR: BR-{XXX}-XX, US: US-{XXX}-XX.
         KHÔNG bỏ section 2.2 (logic Admin Cục).
         Section 6: dùng 🔴 đỏ cho trường mới, ~~gạch ngang~~ cho trường cần loại bỏ.
         Section 10: dùng token từ theme.ts + tokens.ts, không hardcode giá trị.
         BỎ: Kịch bản kiểm thử, Môi trường kỹ thuật."
```

**⚠️ PMO LEAD: workers KHÔNG đọc AGENTS.md. Bạn PHẢI copy các quy tắc trên vào từng brief BA. Nếu không, BA sẽ tự bịa cấu trúc feature-brief không đúng template.**

## SDLC convention

All SDLC scaffolding goes through `ai-kit` CLI (ADR-005).
Skills MUST NOT Write/mkdir under docs/{modules,features,hotfixes}/\*\*.

## Permission Registration for New Modules (MANDATORY — mọi Dev thêm module mới PHẢI đọc)

Khi phát triển module/chức năng mới có yêu cầu phân quyền, Dev **BẮT BUỘC** đăng ký permission trong file:

```
src/main/java/com/hanghai/kchtg/config/RolePermissionSeeder.java
```

### Quy trình bắt buộc

1. **Thêm `seedPermission()`** cho từng permission của module mới trong cả 2 method: `run()` và `upsertMissingPermissions()`. Format: `<resource>:<action>` (vd: `navigationchannel:create`).

2. **Gán permission vào role** — thêm permission code vào danh sách `rolePermissionMap` của từng role phù hợp trong method `run()` và `rolePermMap` trong `upsertMissingPermissions()`.

3. **Kiểm tra `upsertMissingPermissions()`** — method này chạy mỗi lần khởi động, tự động thêm permission mới (đã seed) vào role đã tồn tại. Chỉ hoạt động nếu Dev đã thêm `seedPermission()`.

### Hậu quả nếu bỏ qua

- Permission không tồn tại trong DB → `@PreAuthorize` trên controller không khớp → **403 Forbidden** với mọi user kể cả Admin
- Cây phân quyền trong popup Phân quyền nhóm (F-002) sẽ không hiển thị chức năng mới

### Agent workflow

```
PMO Lead
  └── Dispatch Dev làm module mới → PHẢI chép constraint sau vào prompt:
        "Sau khi tạo controller với @PreAuthorize, vào RolePermissionSeeder.java
         thêm seedPermission() cho từng permission mới trong cả run() và
         upsertMissingPermissions(), rồi gán vào đúng role."
```

## AI Checklist for Reports & Gaps (BẮT BUỘC TUÂN THỦ)

Mỗi lần thực hiện rà soát, sửa đổi báo cáo hoặc logic nghiệp vụ, AI **phải luôn luôn kiểm tra trực tiếp** các điểm sau trước khi tiến hành viết code:

1. **Kiểm chứng Sự tồn tại của Màn hình Quản trị (Management UI)**:
   - Kiểm tra xem đối tượng dữ liệu trong báo cáo đã có màn hình quản lý (CRUD) và Route trên Frontend chưa.
   - Không được giả định màn hình đã tồn tại khi chỉ thấy dữ liệu thô (GIS point/polygon).

2. **Xác minh Thực thể Dữ liệu (Real Data Entity & Schema)**:
   - Kiểm tra xem đối tượng trong báo cáo là dữ liệu GIS thuần túy (Point/Polygon thô) hay là thực thể nghiệp vụ có cấu trúc thuộc tính chi tiết giống dự án gốc `hh.csdl` (Ví dụ: dữ liệu của bảng `KCHT_CB` gồm Khu neo đậu, Khu chuyển tải, Bến phao, Khu tránh trú bão...).
   - Nếu phát hiện thiếu thực thể hoặc trường thuộc tính nghiệp vụ, phải báo cáo rõ ràng trạng thái trống (empty/null) của dữ liệu cho người dùng trước khi map tạm.

3. **Nguyên tắc "Data thật - Không gán mặc định"**:
   - Tuân thủ yêu cầu: Không tự động gán dữ liệu giả lập hoặc mặc định (placeholder/hardcoded) cho các cột báo cáo khi database thực tế không có trường dữ liệu tương ứng.

4. **Nguyên tắc "Bảo tồn Code & Không Revert File"**:
   - Trợ lý AI tuyệt đối không được tự ý xóa các đoạn mã nguồn đang hoạt động, xóa tính năng đã phát triển hoặc tự ý revert/reset file về trạng thái cũ trừ khi có yêu cầu chỉ định trực tiếp và rõ ràng từ người dùng.

5. **Nguyên tắc "Naming Convention Đa Ngôn Ngữ"**:
   - Tên cột, tên bảng trong CSDL (Database), tên biến Java (Backend) và tên biến ở Frontend (TypeScript/JavaScript) **BẮT BUỘC** phải được đặt bằng **tiếng Anh** chuẩn.
   - Ngược lại, các message hiển thị thông báo lỗi, xử lý ngoại lệ (Exception handle) trả về cho người dùng và toàn bộ nội dung text hiển thị trên giao diện Frontend (Label, Button, Toast...) **BẮT BUỘC** phải là **tiếng Việt có dấu** rõ nghĩa.

6. **Đối chiếu Logic Nghiệp vụ với BA Lean Spec & Brief (BẮT BUỘC)**:

   **Quy tắc vàng:** Trước khi viết BẤT KỲ logic nghiệp vụ nào (Entity, Service, Controller, DTO, Frontend form/validation), AI **BẮT BUỘC** phải đọc và đối chiếu với 2 loại tài liệu BA tương ứng của module/feature đang làm.

   **Cấu trúc tài liệu BA trong dự án:**

   | Loại tài liệu     | Đường dẫn                                                               | Nội dung                                                                                                                                               | Khi nào đọc                                                       |
   | ----------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
   | **BA Lean Spec**  | `docs/modules/M-{xxx}-{slug}/ba/00-lean-spec.md`                        | Use Cases, Business Rules, Domain Model, Trạng thái, Quy trình phê duyệt, Validation rules chi tiết                                                    | **Luôn luôn** — đây là nguồn sự thật duy nhất cho logic nghiệp vụ |
   | **Module Brief**  | `docs/modules/M-{xxx}-{slug}/module-brief.md`                           | Tổng quan module, danh sách features, status, dependencies                                                                                             | Khi cần hiểu scope tổng thể của module                            |
   | **Feature Brief** | `docs/modules/M-{xxx}-{slug}/_features/F-{xxx}-{slug}/feature-brief.md` | Flow chi tiết, Acceptance Criteria, DTO fields, REST endpoint, Business Rules, Roles & Permissions, Entities, Validation rules cho từng feature cụ thể | **Luôn luôn** — khi code một feature cụ thể                       |

   **Workflow bắt buộc khi bắt đầu code một module/feature:**

   ```
   Bước 1: Xác định Module ID (M-xxx) và Feature ID (F-xxx) đang làm
   Bước 2: Đọc docs/modules/M-{xxx}-{slug}/ba/00-lean-spec.md
           → Nắm Use Cases, Business Rules, Domain Model, Trạng thái, Validation
   Bước 3: Đọc docs/modules/M-{xxx}-{slug}/_features/F-{xxx}-{slug}/feature-brief.md
           → Nắm Flow, Acceptance Criteria, DTO fields, REST endpoint, Roles
   Bước 4: Đối chiếu từng điểm trước khi viết code:
           ✅ Tên Entity/bảng có khớp tài liệu?
           ✅ Các trường DTO (required/optional, kiểu dữ liệu, validation) có khớp?
           ✅ Trạng thái mặc định khi tạo mới có đúng? (VD: PROPOSED)
           ✅ Quy trình phê duyệt (mấy cấp, chuyển trạng thái) có đúng?
           ✅ Business Rules (BR-xxx) có được implement đầy đủ?
           ✅ Roles & Permissions có khớp?
           ✅ REST endpoint path và method có đúng?
   Bước 5: Nếu phát hiện BẤT KỲ sai lệch nào giữa code và tài liệu
           → DỪNG LẠI, báo cáo chi tiết cho người dùng, KHÔNG tự ý giả định
   ```

   **Ví dụ:** Khi code feature F-038 (Tạo mới Luồng hàng hải) thuộc M-003:
   - Đọc `docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md`
   - Đọc `docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/_features/F-038-quan-ly-luong-hang-hai-tao-moi/feature-brief.md`
   - Đối chiếu: trạng thái mặc định = PROPOSED, phê duyệt 2 cấp (C1→C2), các trường bắt buộc (loại tàu, số lượng, ngày ghi nhận), validation rules (BR-038-01 đến BR-038-06)

7. **Xử lý Dữ liệu Đầu vào (Input Processing)**:
   - Tất cả các trường nhập liệu văn bản (đặc biệt là ô tìm kiếm, form nhập liệu) bắt buộc phải được xử lý loại bỏ khoảng trắng thừa (`.trim()`) ở đầu và cuối chuỗi trước khi gửi API hoặc đưa vào hàm lọc dữ liệu, tránh trường hợp tìm kiếm không ra kết quả do lỗi gõ phím của người dùng.

8. **Ghi nhận Dữ liệu Kiểm toán (Audit Logs)**:
   - Khi thực hiện các thao tác thay đổi dữ liệu (đặc biệt là Xóa mềm - Soft Delete, Thêm mới, Cập nhật), AI bắt buộc phải đảm bảo truyền đầy đủ các thông tin kiểm toán (như `operatorId`, `deletedBy`, `updatedBy`...) vào các hàm xử lý tương ứng của Entity (ví dụ: `softDelete(operatorId)`) để lưu lại lịch sử thay đổi chính xác trong cơ sở dữ liệu.

## Cache hiển thị tên đơn vị quản lý (MANDATORY)

- Entity và request chỉ lưu/truyền `orgUnitId` (UUID/FK); response dùng cho hiển thị phải trả cả `orgUnitId` và `orgUnitName`.
- Backend phải ánh xạ tên bằng `OrgUnitCacheService`; không truy vấn đơn vị theo từng bản ghi và không để frontend gọi API danh sách chỉ để ánh xạ ID sang tên.
- Frontend chỉ gọi danh sách/cây đơn vị cho Select, Cascader và bộ lọc; cột và màn chi tiết hiển thị trực tiếp `orgUnitName` từ response.
- Cache `orgUnitDirectory` không có TTL và tồn tại đến khi dữ liệu đơn vị thay đổi.
- Mọi luồng thêm, sửa, xóa mềm, duyệt, từ chối hoặc thay đổi trạng thái/cây đơn vị phải gọi `orgUnitCacheService.evictAfterCommit()`; chỉ xóa cache sau khi transaction commit thành công.
- Khi cache miss, nạp một lần toàn bộ đơn vị đang hoạt động thành `Map<UUID, String>`; không gán tên giả nếu ID không còn tồn tại.
- Nếu triển khai nhiều backend instance, phải bổ sung cơ chế invalidation phân tán (Redis hoặc sự kiện); không dựa riêng vào Caffeine cục bộ.

# Local Agent Customization Rules (Workspace-Scoped)

> [!IMPORTANT]
> Đây là file cấu hình hướng dẫn và nguyên tắc hoạt động cho tất cả các AI Coding Assistant (Antigravity, Claude, v.v.) khi làm việc trong Workspace này.
> Mọi AI bắt buộc phải đọc và tuân thủ các chỉ thị trong file này trước khi thực hiện bất kỳ chỉnh sửa nào.

## 📌 Hướng dẫn & Ràng buộc nghiệp vụ (User Custom Rules)

_Ghi lại các lưu ý, quy trình hoặc yêu cầu đặc biệt của bạn ở đây để AI luôn tuân theo mỗi khi pair-programming._

1. **Nguyên tắc chung**:
   - **TUÂN THỦ TUYỆT ĐỐ TÀI LIỆU BRIEF (FEATURE BRIEF & LEAN SPEC)**:
     - AI chỉ được phép lập trình, xây dựng giao diện và xử lý logic nghiệp vụ theo đúng cấu trúc cột, trường dữ liệu, acceptance criteria và business rules đã định nghĩa trong tài liệu brief (`feature-brief.md` và `00-lean-spec.md`).
   - Luôn kiểm tra cấu trúc dữ liệu thực tế và các màn hình quản lý CRUD trước khi đề xuất chỉnh sửa logic báo cáo hoặc nghiệp vụ.
   - Không tự động gán dữ liệu giả lập (placeholder/hardcoded) cho các cột khi database thực tế không hỗ trợ trường tương ứng.
   - **TẠO SCRIPT SQL CHO THAY ĐỔI DB**: Khi thao tác liên quan đến thay đổi cấu trúc DB (schema, index, migrations...), bắt buộc phải tạo script SQL Flyway tương ứng (đặt trong thư mục `src/main/resources/db/migration/`) để khi đưa lên môi trường khác (UAT, Production) cấu trúc DB sẽ khớp 100%.
   - **BẮT BUỘC RÀ SOÁT TÀI LIỆU & HH.CSDL**: Khi thực hiện sửa đổi, thêm mới, hoặc tìm kiếm/tra cứu bất kỳ chức năng nào, AI bắt buộc phải đối chiếu chi tiết cấu trúc dữ liệu và logic nghiệp vụ với tài liệu đặc tả dự án gốc (`hh.csdl`) trước khi đưa ra phương án thực thi.
   - **KHÔNG TỰ ĐỘNG THỰC HIỆN CÁC THAO TÁC GIT (ADD, COMMIT, PUSH)**: Trợ lý AI tuyệt đối không được tự ý chạy các lệnh `git add`, `git commit` hay `git push` lên kho lưu trữ sau khi sửa đổi mã nguồn. Mọi thay đổi phải được giữ ở trạng thái local (unstaged) để người dùng tự kiểm thử, kiểm tra độ chính xác và trực tiếp quyết định thực hiện commit/push.
   - **KHÔNG TỰ Ý CHẠY BACKEND (BE)**: Trợ lý AI tuyệt đối không được tự ý chạy/khởi động server Backend (Spring Boot). Khi có thay đổi code Backend, AI chỉ cần chạy lệnh `mvn clean compile` hoặc `mvn clean install` để xác nhận dự án biên dịch thành công.
   - **TÍNH ĐỒNG BỘ GIỮA CÁC MÀN HÌNH CÙNG MENU**: Đa phần cấu trúc các màn hình trong cùng một cụm menu sẽ có tính chất và chức năng tương tự nhau. Khi phát hiện và sửa bất kỳ lỗi nào ở một màn hình, AI bắt buộc phải rà soát và kiểm tra xem lỗi đó có xuất hiện trên tất cả các màn hình còn lại trong cùng cụm menu đó hay không để thực hiện sửa đổi đồng bộ.
   - **TỰ ĐỘNG CHÈN DỮ LIỆU MẪU**: Đối với mỗi màn hình/chức năng chưa có dữ liệu (hoặc bảng trống trong CSDL), AI cần tự động kết nối trực tiếp vào cơ sở dữ liệu (sử dụng thông tin kết nối từ các file cấu hình như `.env`) và thực hiện insert dữ liệu mẫu để người dùng có thể kiểm thử ngay lập tức. **KHÔNG** sử dụng Java Data Seeder (tránh việc yêu cầu khởi động lại ứng dụng và tránh xung đột dữ liệu).
   - **MỞ POPUP CHO THAO TÁC CHI TIẾT/CRUD**: Hầu hết các màn hình chức năng (đặc biệt là quản lý KCHT) chỉ có trang Danh sách (List) là một trang định tuyến độc lập (routed page). Tất cả các thao tác khác như thêm mới (Create), sửa (Edit), xem chi tiết/xem trước (Preview/Detail) đều bắt buộc phải hiển thị và thực hiện dưới dạng mở Popup/Modal (hộp thoại) ngay trên trang Danh sách, tránh chuyển hướng sang trang mới.
   - **VIỆT HÓA THÔNG BÁO LỖI**: Khi rà soát mã nguồn (cả Frontend và Backend), nếu phát hiện các thông điệp thông báo lỗi (error messages), thông báo thành công hoặc các câu text thông báo đang ở dạng tiếng Anh hoặc tiếng Việt không dấu, AI cần chủ động sửa đổi lại thành tiếng Việt chuẩn, có dấu rõ nghĩa.
   - **KHÔNG TỰ Ý XÓA CODE HOẶC REVERT FILE**: Trợ lý AI tuyệt đối không được tự ý xóa các đoạn code đang chạy, các tính năng đã có hoặc tự ý revert/reset file mã nguồn về trạng thái cũ trừ khi nhận được yêu cầu chỉ định trực tiếp và rõ ràng từ người dùng.

2. **Cách viết code & Framework**:
   - Tuân thủ cấu trúc của Spring Boot (Backend) và React + Ant Design (Frontend) hiện tại của dự án.
   - **Tối ưu hóa hiệu năng & DB**: Luôn chú ý thiết kế cấu trúc DB chuẩn hóa, tận dụng Index phù hợp trên các trường tìm kiếm/lọc thường xuyên, và tối ưu hóa hiệu năng truy vấn SQL/JPQL (tránh lỗi N+1, hạn chế quét toàn bảng, tránh lạm dụng LIKE không tối ưu). Kiểm tra biên dịch bằng Maven / Typescript kỹ lưỡng trước khi hoàn thành công việc.
   - **QUY TẮC IMPORT & LOMBOK CHO DTO/ENTITY**: KHÔNG viết đường dẫn class đầy đủ (fully qualified name, ví dụ `com.hanghai.kchtg...`) vào trực tiếp trong code, bắt buộc phải dùng lệnh `import` ở đầu file và sử dụng tên class ngắn gọn. Các class DTO bắt buộc phải sử dụng các annotation của Lombok: `@Getter`, `@Setter`. Nếu cần constructor không tham số thì dùng `@NoArgsConstructor`, nếu cần constructor đầy đủ tham số thì dùng `@AllArgsConstructor`. Tránh việc code tay (hard-code) getter/setter/constructor.

3. **Lưu ý nghiệp vụ dự án**:
   - **ĐỒNG BỘ 100% VỚI DỰ ÁN GỐC**: Khi phát triển hoặc sửa đổi bất kỳ thực thể/giao diện nào (ví dụ: quản lý biểu tượng bản đồ), bắt buộc phải đối chiếu và kiểm tra kỹ dự án gốc `hh.csdl` (cấu trúc bảng cơ sở dữ liệu, các DTOs API và mã nguồn React UI) để lập trình các trường dữ liệu, tính năng (như uploader/base64) và bố cục giao diện khớp 100% với dự án gốc, tránh tự thiết kế khác biệt.
   - **ĐỒNG BỘ HIỂN THỊ KCHT LÊN BẢN ĐỒ**: Tất cả các đối tượng hàng hải như Cảng biển, Đèn biển, Bến cảng, Phao tiêu, Đê kè, Luồng hàng hải... gọi chung là **KCHT (Kết cấu hạ tầng hàng hải)**. Tất cả các đối tượng này bắt buộc phải được hiển thị lên bản đồ theo cơ chế đồng bộ và nhất quán giống nhau.
   - **ÁNH XẠ ENUM XUỐNG DATABASE**: Đối với những trường có giá trị cố định (ví dụ: trạng thái, loại đối tượng), bắt buộc phải lưu ở Database dưới dạng số nguyên (INT/SMALLINT/TINYINT) và map trên Java thành Enum sử dụng `@Enumerated(EnumType.ORDINAL)`. Tuyệt đối không lưu giá trị chuỗi (VARCHAR) xuống Database cho các trường Enum để tối ưu hiệu năng và dung lượng.
