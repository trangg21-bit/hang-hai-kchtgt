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

## Mandatory Planning Discipline (MANDATORY — Lên kế hoạch trước khi viết code)

Trước khi thực hiện bất kỳ thay đổi code nào (Backend, Frontend, CSDL, Cấu hình), AI Agent **BẮT BUỘC** phải lên kế hoạch (Plan) chi tiết:
1. **Mục tiêu & Phân tích nguyên nhân**: Nêu rõ vấn đề, nguyên nhân cốt lõi và yêu cầu từ User.
2. **Danh sách file bị ảnh hưởng**: Liệt kê chính xác các file sẽ tạo mới hoặc sửa đổi.
3. **Phân tích ảnh hưởng liên đới (Impact Analysis)**: BẮT BUỘC phân tích kỹ lưỡng các tác động phụ có thể xảy ra đối với những màn hình, module, API hoặc chức năng khác trong toàn hệ thống. Nếu có khả năng gây ảnh hưởng đến chức năng khác, BẮT BUỘC PHẢI HỎI Ý KIẾN NGƯỜI DÙNG NGAY trước khi thực hiện.
4. **Giải pháp chi tiết**: Thiết kế giải pháp kỹ thuật, cấu trúc DTO/Entity/Components, tuân thủ nghiêm ngặt các quy tắc kiến trúc (không FQCN, dùng constants/enum, chuẩn hóa semantic tokens, hỗ trợ tìm tiếng Việt không dấu, auto-sync tài liệu SDLC).
5. **Kế hoạch kiểm thử (Verification Plan)**: Các bước xác minh (`mvn test`, `npm run build`, kiểm tra giao diện).

Chỉ bắt tay vào sửa code sau khi đã có plan rõ ràng và người dùng đã xác nhận, không sửa lan man ngoài phạm vi.

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

## Style Preset System (MANDATORY — áp dụng cho MỌI component UI)

### Single source of truth

`frontend/src/tokens.ts` Section 5 chứa **46 preset** đóng gói sẵn cho từng khu vực màn hình. Mỗi preset = 1 `React.CSSProperties` object, dùng token semantic bên trong. Dev import về dùng luôn, không tự ráp token thủ công.

Tra cứu đầy đủ: [`them-token-specification (1).md`](them-token-specification%20(1).md) Section 5.

### Quy tắc dùng preset

1. **LUÔN dùng preset mặc định trước** — không tự ráp token khi đã có preset
2. **Override bằng spread + token** khi cần custom:
   ```ts
   // ✅ ĐÚNG — spread preset + override bằng token
   <Input style={{ ...inputStyle, width: 200 }} />
   <Button style={{ ...primaryButtonStyle, marginLeft: spaceMd }} />

   // ❌ SAI — hardcode giá trị thô ngoài thang số
   <Input style={{ ...inputStyle, marginBottom: 14 }} />
   <Button style={{ ...primaryButtonStyle, background: '#ff6600' }} />
   ```
3. **Layout property được phép dùng số thô**: `width`, `flex`, `minWidth`, `maxWidth` — vì đây là bố cục, không phải token thị giác
4. **Pattern lặp ≥ 3 lần** → thêm preset mới vào `tokens.ts` Section 5, không copy-paste

### Bảng: custom hợp lệ vs cấm

| Property | Hợp lệ (override bằng) | Cấm (hardcode) |
|----------|------------------------|----------------|
| Màu sắc | Token trong palette 13 màu | `#ff6600` |
| Spacing | `spaceXs`, `spaceSm`, `spaceMd`, `spaceLg`, `spaceXl`, `spaceFormField` | `6`, `14`, `18` |
| Font-size | `fontSizeSm`, `fontSizeMd`, `fontSizeLg`, `fontSizeBreadcrumb` | `12`, `14`, `16` |
| Border-radius | `radiusSm`, `radiusMd`, `radiusLg`, `radiusPill` | `6`, `10` |
| Font-weight | `fontWeightNormal`, `fontWeightMedium`, `fontWeightBold` | `450`, `550`, `700` |
| Màu trạng thái | `statusOperational`, `statusAttention`, `statusCritical` | `#1BAF7A` |
| Layout | `width: 200`, `flex: 1`, `minWidth: 280` | — |

### Agent workflow

```
PMO Lead
  ├── Đọc them-token-specification (1).md Section 5 → biết 46 preset
  └── Dispatch Dev → PHẢI chép constraints sau vào prompt:
        "Trước khi code UI, đọc frontend/src/tokens.ts để biết 46 style preset.
         Tra cứu them-token-specification (1).md Section 5.
         Dùng preset mặc định, KHÔNG tự ráp token thủ công.
         Khi cần custom: spread preset + override bằng token (KHÔNG hardcode).
         Layout property (width, flex, minWidth) được phép dùng số.
         Pattern lặp ≥ 3 lần → báo PMO để thêm preset mới vào tokens.ts."
```

## Form & List UI Convention (MANDATORY — áp dụng cho MỌI màn danh sách và popup)

### List Screen Pattern

Mọi màn hình danh sách (quản lý người dùng, nhóm người dùng, đơn vị, v.v.) **PHẢI** dùng 5 components share từ `frontend/src/components/list-view/`:

| Component      | Vai trò                                                  |
| -------------- | -------------------------------------------------------- |
| `ScreenHeader` | Breadcrumb + nút hành động (Thêm mới, Xuất Excel)        |
| `FilterBar`    | Ô tìm kiếm, select lọc, date range + nút Tìm kiếm/Reload |
| `StatusTabs`   | Tab trạng thái kèm số lượng                              |
| `DataTable`    | Bảng dữ liệu có sort + dropdown hành động                |
| `Pagination`   | Điều hướng trang                                         |

Chi tiết kích thước và contract giao diện dùng chung được quy định tại
[`docs/conventions/list-screen-ui-standard.md`](docs/conventions/list-screen-ui-standard.md).
Developer/AI phải đọc tài liệu này trước khi tạo hoặc chỉnh sửa màn hình danh sách.

Quy tắc bắt buộc cho bảng danh sách:

- Bảng rỗng vẫn giữ chiều cao thân bảng theo `--list-table-scroll-y`; EmptyState không được làm thanh cuộn ngang nằm giữa bảng.
- Thanh cuộn ngang phải nằm ở đáy thân bảng; sau khi lọc/reset, `DataTable` phải đưa `scrollLeft` về `0` để cột đầu tiên không bị che.
- Cột thao tác luôn là cột cuối cùng và chỉ cột thao tác được cố định bên phải; không để cột dữ liệu hoặc tiêu đề lộ ra phía sau.
- Nếu bộ cột thực tế ngắn hơn kích thước tối thiểu chung, dùng `scroll={{ x: 'max-content' }}` thay vì ép chiều rộng dư gây lệch cột.
- Kiểm tra cả bốn trạng thái `loading`, `error`, `empty`, `data` trước khi hoàn tất màn hình.

### Bộ lọc đơn vị phân cấp (MANDATORY)

- Mọi filter đơn vị phải dùng dropdown dạng cây (`TreeSelect`/`Cascader`) khi có `parentId`; không dùng `Select` phẳng.
- Dựng cây từ `id`, `name`, `code`, `parentId`; không dùng `path` ở frontend.
- Giữ giá trị chọn là `orgUnitId` khi gọi API; backend chịu trách nhiệm giới hạn phạm vi theo quyền.
- Tuân thủ reference và chi tiết tại [`docs/conventions/list-screen-ui-standard.md`](docs/conventions/list-screen-ui-standard.md).

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
- **BẮT BUỘC hỗ trợ tìm kiếm tiếng Việt không dấu** trên mọi `Select` có `showSearch`: dùng `filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}` (import `normalizeSearchText` từ `components/org-unit`). **CẤM** so sánh chuỗi thô `.toLowerCase().includes(...)`.

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
         Filter đơn vị có parentId phải dùng TreeSelect/Cascader dạng cây, giữ value là orgUnitId.
         Form.Item marginBottom = spaceFormField (12px).
         Input/Select borderRadius = radiusPill (999px), height = 40.
         MỌI Select có showSearch PHẢI dùng normalizeSearchText để tìm kiếm tiếng Việt không dấu.
         Xem UsersPage.tsx làm mẫu chuẩn.
         Đọc docs/conventions/form-and-list-patterns.md để biết chi tiết."
```

**⚠️ PMO LEAD: workers KHÔNG đọc AGENTS.md. Bạn PHẢI copy quy tắc trên vào brief và luôn gửi kèm link `docs/conventions/form-and-list-patterns.md`.**

## Feature Brief Template Convention (MANDATORY — mọi BA agent làm feature-brief PHẢI đọc)

### Single source of truth

Toàn bộ cấu trúc tài liệu đặc tả nghiệp vụ (feature-brief.md) được định nghĩa tại **1 file duy nhất**:

| File                             | Vai trò                                      | Agent nào phải đọc        |
| -------------------------------- | -------------------------------------------- | ------------------------- |
| `docs/feature-brief-template.md` | Template 7-section cho mọi feature-brief.md | **BA** (business analyst) |

### Cấu trúc 7 section bắt buộc

Mọi file `feature-brief.md` **PHẢI** tuân thủ đúng cấu trúc 7 section, đúng thứ tự, đúng tiêu đề (theo `docs/feature-brief-template.md`):

| #   | Section                                 | Nội dung                                                                             |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | Mô tả ngắn                              | 3–5 dòng: chức năng này làm gì, ai dùng                                              |
| 2   | Trường dữ liệu                          | Bảng: # / Trường / Bắt buộc / Kiểu-ràng buộc / Ghi chú                               |
| 3   | Trạng thái và phê duyệt                 | Theo tài liệu nền (mục 3.7); chức năng có bước phê duyệt thì mô tả đầy đủ quy trình  |
| 4   | Quy tắc và phân quyền riêng             | Chỉ ghi quy tắc **chưa có** trong tài liệu nền; phân quyền dạng `<resource>:<action>` + bảng vai trò × thao tác + **Admin Cục** |
| 5   | Điểm khác biệt so với mẫu chung         | Bảng 8 dòng bắt buộc điền đủ, không bỏ trống                                         |
| 6   | Phần kỹ thuật — đường dẫn gọi dữ liệu   | Bảng Method / Đường dẫn / Mô tả / Quyền — **đề xuất của BA, SA chốt**                |
| 7   | Phần kỹ thuật — cấu trúc bảng           | 🔴 = trường mới, ~~gạch ngang~~ = trường cần loại bỏ — **đề xuất, SA chốt**           |

### Quy tắc bắt buộc

1. **KHÔNG đảo thứ tự** 7 section — thứ tự cố định như trên
2. **KHÔNG bỏ section** — section không áp dụng thì ghi "không"/"không áp dụng" kèm lý do; mục 3–5 không được để trống
3. **KHÔNG thay đổi tiêu đề section** — tiêu đề cố định như template
4. **KHÔNG bỏ logic Admin Cục** (mục 4) — mọi feature phải khai báo phân quyền đặc biệt này
5. **Mục 6–7 là đề xuất của BA** — người thiết kế kỹ thuật (SA) chốt; khi review **không bắt lỗi** phần này
6. **KHÔNG hardcode màu/spacing/font-size** — giao diện theo convention chung (`docs/conventions/` + `theme.ts` + `tokens.ts`), không mô tả lại trừ khi khác mẫu (khai báo ở mục 5, dòng 8)
7. **Trước khi viết bất kỳ feature-brief.md nào**, BA PHẢI đọc `docs/feature-brief-template.md` + tài liệu nền của module để biết phần CHUNG (không lặp lại) và phần RIÊNG
8. **Muốn thay đổi quy định chung → sửa tài liệu nền TRƯỚC**, rồi mới sửa feature-brief — không để feature-brief mâu thuẫn với tài liệu nền

### BỎ khỏi template

- **Kịch bản kiểm thử** — thuộc về QA, không nằm trong feature-brief
- **Môi trường kỹ thuật** — thuộc về SA/Dev, không nằm trong feature-brief

### Agent workflow

```
PMO Lead
  ├── Đọc AGENTS.md (file này)
  └── Dispatch BA → PHẢI chép các constraints sau vào prompt:
        "Trước khi viết feature-brief.md, đọc docs/feature-brief-template.md làm template chuẩn
         + tài liệu nền của module (phần CHUNG — không lặp lại trong brief).
         Tuân thủ đúng 7 section, đúng thứ tự, đúng tiêu đề.
         Mục 3–5 không được để trống — không có gì thì ghi 'không'.
         Mục 4: khai báo Admin Cục + phân quyền dạng <resource>:<action> + bảng vai trò × thao tác.
         Mục 6–7: là đề xuất của BA — SA chốt, không bắt lỗi khi review.
         KHÔNG hardcode màu/spacing trong mô tả giao diện — theo convention chung.
         BỎ: Kịch bản kiểm thử, Môi trường kỹ thuật."
```

**⚠️ PMO LEAD: workers KHÔNG đọc AGENTS.md. Bạn PHẢI copy các quy tắc trên vào từng brief BA. Nếu không, BA sẽ tự bịa cấu trúc feature-brief không đúng template.**

## SDLC convention

All SDLC scaffolding goes through `ai-kit` CLI (ADR-005).
Skills MUST NOT Write/mkdir under docs/{modules,features,hotfixes}/**.

### Bắt buộc tự động cập nhật tài liệu (Auto-Sync SDLC Documentation)

Mỗi khi AI thực hiện bất kỳ thay đổi nào liên quan đến:
1. **Cấu trúc CSDL / Entity / DTO / Schema**: thêm, sửa, xóa trường, đổi kiểu dữ liệu (vd: UUID, Enum, bỏ approved_level1/2).
2. **Luồng nghiệp vụ & Phê duyệt**: cơ chế duyệt C1/C2, popup xác nhận/lý do, quy tắc chống tự duyệt (4-eyes principle), phân quyền.
3. **Giao diện người dùng**: bố cục layout, danh sách & thứ tự cột trên bảng danh sách, popup/modal/drawer, các trường form.
4. **Quy ước hiển thị dữ liệu hoặc danh mục API Endpoints**.

**QUY TẮC BẮT BUỘC**: AI Agent **PHẢI TỰ ĐỘNG** tìm các file tài liệu đặc tả liên quan (`docs/modules/.../feature-brief.md`, `ui-spec.md`, `DESIGN.md`, `docs/conventions/...`) để cập nhật đồng bộ ngay trong cùng lượt xử lý code, **tuyệt đối không để xảy ra tình trạng code một đằng tài liệu một nẻo (Documentation Drift)** mà không cần User phải nhắc nhở.

## Permission Registration for New Modules (MANDATORY — mọi Dev thêm module mới PHẢI đọc)

Khi phát triển module/chức năng mới có yêu cầu phân quyền, Dev **BẮT BUỘC** đăng ký permission trong file:

```
src/main/java/com/hanghai/kchtg/config/PermissionSeeder.java
```

### Mô hình phân quyền (thực tế hệ thống)

- Phân quyền **động theo nhóm người dùng và từng tài khoản**: quản trị viên tích chọn (checkbox) các quyền trên cây quyền cho một nhóm (màn hình Phân quyền nhóm F-002) hoặc gán trực tiếp cho một tài khoản (màn Quản lý tài khoản đã có UI gán quyền trực tiếp — `UsersPage.tsx`, API `/users/{id}/permissions`).
- **Nhóm người dùng là động** — có thể thêm mới, sửa, xóa, đổi quyền bất kỳ lúc nào.
- **Quyền của một tài khoản = quyền gán riêng + quyền của các nhóm tài khoản đang thuộc** — `User.getAllPermissions()` đã đúng mô hình này (không tính vai trò; quyền đặc biệt `group:manage`, `admin:all`, `orgunit:scope_all` chỉ gán trực tiếp, nhóm không thừa kế được).
- Máy chủ kiểm tra **từng thao tác** theo quyền `<resource>:<action>` (`PermissionMiddleware` + `@PreAuthorize`) — không có quyền → **403 Forbidden**.
- Tài khoản quản trị hệ thống (ROLE_SYSTEM_ADMIN) vượt qua mọi kiểm tra quyền.
- Tài khoản **Admin Cục** — mọi feature phải khai báo phân quyền Admin Cục (xem mục Feature Brief Template Convention); Admin Cục được xem thêm các thông tin nhạy cảm mà tài khoản khác không thấy (người tạo, người sửa cuối, thời gian tạo/cập nhật).

### Quy trình bắt buộc

1. **Thêm `seedPermission(definitions, resource, action)`** cho từng permission của module mới trong `run()` của `PermissionSeeder.java`. Format: `<resource>:<action>` (vd: `navigationchannel:create`).

2. **Không còn bước gán vào role** — permission mới sau khi seed sẽ tự xuất hiện trong cây quyền để gán cho nhóm/tài khoản.

3. **Kiểm tra `run()` (PermissionSeeder)** — chạy mỗi lần khởi động: với mỗi permission đã seed, nếu chưa có trong DB (`findByCode`) thì tự động insert. Chỉ hoạt động nếu Dev đã thêm `seedPermission()`.

### Hậu quả nếu bỏ qua

- Permission không tồn tại trong DB → `@PreAuthorize` trên controller không khớp → **403 Forbidden** với mọi user (trừ ROLE_SYSTEM_ADMIN / ROLE_SUPER_ADMIN — 2 quyền này vượt qua mọi kiểm tra)
- Cây phân quyền trong popup Phân quyền nhóm (F-002) sẽ không hiển thị chức năng mới → không ai tích chọn được quyền cho nhóm/tài khoản

### Agent workflow

```
PMO Lead
  └── Dispatch Dev làm module mới → PHẢI chép constraint sau vào prompt:
        "Sau khi tạo controller với @PreAuthorize, vào PermissionSeeder.java
         thêm seedPermission(definitions, resource, action) cho từng permission mới
         trong run(). Lưu ý: phân quyền thực tế là động qua nhóm/tài khoản —
         không còn bước gán role."
```

## Data Scope Convention (MANDATORY — mọi Dev/BA làm entity nghiệp vụ PHẢI đọc)

Mô hình phân quyền dữ liệu theo đơn vị (quyết định nghiệp vụ chốt 2026-08-20, rà soát cross-module): **đơn vị nào chỉ xem dữ liệu đơn vị đó; đơn vị cha xem được đơn vị con (subtree); Cục xem full** (qua `orgunit:scope_all` / `admin:all` / `*`). Cơ chế chuẩn duy nhất: `DataScopeAspect` (`security/aspect/DataScopeAspect.java`) + Hibernate global filter `orgUnitFilter` (`@FilterDef` ở `common/entity/BaseEntity.java`).

### Quy tắc bắt buộc cho entity nghiệp vụ MỚI

1. **Entity nghiệp vụ mới BẮT BUỘC có trường đơn vị** (`orgUnitId` / `unitId` / `owningOrgId` UUID) + khai `@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")` (nếu cột tên khác thì đổi condition tương ứng — vd `unit_id IN (...)`).
2. **Controller BẮT BUỘC khai `@DataScope`** (class-level) để aspect bật filter — nếu không, filter không bao giờ được kích hoạt (no-op).
3. **Khi tạo/sửa PHẢI gán đơn vị** (từ request hoặc fallback đơn vị của user thao tác) — **cấm để cột đơn vị NULL** khi bản ghi là dữ liệu nghiệp vụ (NULL → user cấp đơn vị thấy 0 bản ghi: lỗi đã gặp ở Buoy/BeaconLight/Coastal station).
4. **Chiều GHI phải validate đơn vị trong phạm vi user** (`OrgUnitScopeService.Scope.allows(...)` / `requireOrganizationInScope` kiểu `UserGroupService.java:78`) — không cho gán dữ liệu vào đơn vị ngoài phạm vi (lỗ hổng đã gặp ở ShipRepairFacility).
5. **Migration thay đổi schema BẮT BUỘC kèm backfill** cho dữ liệu cũ (`org_unit_id` NULL → gán từ `created_by`), không chỉ thêm cột.
6. **Ngoại lệ đã chốt** (không cần scope): Dashboard trang chủ (lãnh đạo xem con số tổng hợp). Mọi ngoại lệ khác phải được BA/SA chốt và ghi rõ trong feature-brief.

### Quy tắc cho BA viết feature-brief

- **Bảng "Điểm khác biệt so với mẫu chung" (mục 5, dòng 3 — "Lọc cha-con / theo đơn vị") PHẢI được BA khai báo đầy đủ** (có/không, cơ chế: trường đơn vị nào, filter, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
- Feature-brief mô tả dữ liệu nghiệp vụ theo đơn vị PHẢI khai báo: trường đơn vị bắt buộc/không, nguồn gán đơn vị khi tạo, chiều ghi có validate phạm vi không.

### Agent workflow

```
PMO Lead
  └── Dispatch Dev làm module/entity mới → PHẢI chép constraints sau vào prompt:
        "Entity nghiệp vụ mới PHẢI có orgUnitId + @Filter(orgUnitFilter) + controller @DataScope.
         Khi create/update PHẢI gán đơn vị (không để NULL) và validate đơn vị trong phạm vi
         OrgUnitScopeService. Migration thay đổi schema phải kèm backfill dữ liệu cũ.
         Đọc docs/intel/data-scope-gap-report.md để biết lỗ hổng đã gặp."
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
   | **Feature Brief** | `docs/modules/M-{xxx}-{slug}/_features/F-{xxx}-{slug}/feature-brief.md` | Mô tả ngắn, Trường dữ liệu, Trạng thái và phê duyệt, Quy tắc và phân quyền riêng (dạng resource:action), Điểm khác biệt (8 dòng), Phần kỹ thuật (đường dẫn gọi dữ liệu + cấu trúc bảng) | **Luôn luôn** — khi code một feature cụ thể                       |

   **Workflow bắt buộc khi bắt đầu code một module/feature:**

   ```
   Bước 1: Xác định Module ID (M-xxx) và Feature ID (F-xxx) đang làm
   Bước 2: Đọc docs/modules/M-{xxx}-{slug}/ba/00-lean-spec.md
           → Nắm Use Cases, Business Rules, Domain Model, Trạng thái, Validation
   Bước 3: Đọc docs/modules/M-{xxx}-{slug}/_features/F-{xxx}-{slug}/feature-brief.md
           → Nắm Mô tả ngắn, Trường dữ liệu, Trạng thái và phê duyệt, Quy tắc và phân quyền riêng, Điểm khác biệt, Phần kỹ thuật
   Bước 4: Đối chiếu từng điểm trước khi viết code:
           ✅ Tên Entity/bảng có khớp tài liệu?
           ✅ Các trường DTO (required/optional, kiểu dữ liệu, validation) có khớp?
           ✅ Trạng thái mặc định khi tạo mới có đúng? (VD: PROPOSED)
           ✅ Quy trình phê duyệt (mấy cấp, chuyển trạng thái) có đúng?
           ✅ Business Rules (BR-xxx) trong lean-spec có được implement đầy đủ?
           ✅ Phân quyền riêng (dạng resource:action) có khớp?
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
   - **TUÂN THỦ TUYỆT ĐỐI TÀI LIỆU BRIEF (FEATURE BRIEF & LEAN SPEC)**:
     - AI chỉ được phép lập trình, xây dựng giao diện và xử lý logic nghiệp vụ theo đúng cấu trúc cột, trường dữ liệu, acceptance criteria và business rules đã định nghĩa trong tài liệu brief (`feature-brief.md` và `00-lean-spec.md`).
   - Luôn kiểm tra cấu trúc dữ liệu thực tế và các màn hình quản lý CRUD trước khi đề xuất chỉnh sửa logic báo cáo hoặc nghiệp vụ.
   - Không tự động gán dữ liệu giả lập (placeholder/hardcoded) cho các cột khi database thực tế không hỗ trợ trường tương ứng.
   - **TẠO SCRIPT SQL CHO THAY ĐỔI DB THEO TIMESTAMP**: Khi thao tác liên quan đến thay đổi cấu trúc DB (schema, index, migrations...), bắt buộc phải tạo script SQL Flyway tương ứng (đặt trong thư mục `src/main/resources/db/migration/`) theo định dạng timestamp 14 chữ số `VYYYYMMDDHHmmss__<mo_ta_ngan_tieng_anh>.sql` (ví dụ: `V20260824210500__add_missing_indexes_for_vts.sql`). **TUYỆT ĐỐI CẤM** đặt số thứ tự tuần tự `V122`, `V123`... để tránh xung đột version.
   - **BẮT BUỘC RÀ SOÁT TÀI LIỆU & HH.CSDL**: Khi thực hiện sửa đổi, thêm mới, hoặc tìm kiếm/tra cứu bất kỳ chức năng nào, AI bắt buộc phải đối chiếu chi tiết cấu trúc dữ liệu và logic nghiệp vụ với tài liệu đặc tả dự án gốc (`hh.csdl`) trước khi đưa ra phương án thực thi.
   - **KHÔNG TỰ ĐỘNG THỰC HIỆN CÁC THAO TÁC GIT (ADD, COMMIT, PUSH)**: Trợ lý AI tuyệt đối không được tự ý chạy các lệnh `git add`, `git commit` hay `git push` lên kho lưu trữ sau khi sửa đổi mã nguồn. Mọi thay đổi phải được giữ ở trạng thái local (unstaged) để người dùng tự kiểm thử, kiểm tra độ chính xác và trực tiếp quyết định thực hiện commit/push.
   - **QUY ƯỚC ĐẶT TÊN ĐA NGÔN NGỮ (ENGLISH FOR CODE - VIETNAMESE FOR TEXT)**:
      - Tên bảng CSDL, tên cột, tên biến Java, tên thuộc tính DTO, tham số API JSON và Endpoint REST BẮT BUỘC 100% dùng **tiếng Anh chuẩn** (ví dụ: `decision` thay vì `quyetDinh`, `rejectionReason` thay vì `lyDoTuChoi`).
      - Thông báo lỗi trả về cho client, Toast message và nội dung giao diện BẮT BUỘC 100% là **tiếng Việt có dấu** rõ nghĩa.
   - **QUY CHUẨN KIẾN TRÚC MÀN HÌNH CHỨC NĂNG HẠ TẦNG (MANDATORY INFRASTRUCTURE ARCHITECTURE)**:
      - Mọi màn hình chức năng quản lý tài sản kết cấu hạ tầng (KCHTGT) mới hoặc chỉnh sửa BẮT BUỘC 100% tuân theo tài liệu đặc tả chuẩn tại `docs/conventions/infrastructure-feature-standard-architecture.md`:
        1. **Tầng 1 (Entity/DTO/Repository)**: Entity/DTO có `@FieldNameConstants`, kế thừa `BaseEntity` & implements `ApprovableEntity`. Query JPQL tìm kiếm bắt buộc có mệnh đề DataScope: `(:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds) AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)`.
        2. **Tầng 2 (Service/Controller)**: Inject `OrgUnitScopeService`, dùng `resolveEffectiveScope` và `validateAllowedOrgUnit`. Tái sử dụng `ApprovalHistoryUtils.recordSoftDelete(...)` và `EntityUpdateUtils.copyPropertiesIfPresent(...)`. Cấm dùng FQCN trong code (import tường minh). Thêm `@PreAuthorize("<resource>:<action>")` và seed quyền vào `PermissionSeeder.java`. Cung cấp endpoint siêu nhẹ `GET /api/v1/<res>/options`.
        3. **Tầng 3 (Frontend UI)**: Sử dụng `FilterTableLayout`. Cây đơn vị lọc `OrgUnitTreeSelect` dùng `placeholder="Tất cả"`, `allowClear`, `listHeight={256}`, mặc định mở rộng toàn bộ nhánh (`treeDefaultExpandAll={true}`), **CẤM** dùng `allLabel="Tất cả"` và `showPath` trong sidebar lọc để tránh lệch giao diện so với màn VTS. Form nhập liệu dùng `AppDrawer` với `size="50%"` và Pill radius (`radiusPill`, height: 40px). Nạp dữ liệu dropdown liên kết bắt buộc gọi `<res>CRUD.getOptions()` (cấm gọi phân trang `size=200`). Các dropdown con phụ thuộc (`portId`, `vtsSystemId`, `vtsOperationCenterId`...) **BẮT BUỘC** tự động lọc theo `orgUnitId` đang chọn (Cascading Filter) và **tự động reset giá trị về `undefined`** khi đổi đơn vị quản lý (áp dụng đồng bộ cả ở sidebar lọc danh sách và form drawer). Cột bảng dùng `label` + `ellipsis: false` và cấp đủ `width` (hiển thị trọn vẹn 100% chữ không bị `...`), cột thao tác **BẮT BUỘC** truyền qua prop `rowActions={rowActions}` của `DataTable` (**CẤM** tự thêm cột Thao tác thủ công vào mảng `columns` để tránh lệch icon 3 gạch ngang và bị cắt chữ).
   - **QUY CHUẨN PHÊ DUYỆT 2 CẤP & NGUYÊN TẮC 4 MẮT (4-EYES PRINCIPLE)**:
     - Tập đóng 7 trạng thái chuẩn: `DRAFT (0)`, `PENDING_APPROVAL (2)`, `APPROVED_LEVEL1 (3)`, `REJECTED_LEVEL1 (8)`, `REJECTED_LEVEL2 (9)`, `APPROVED (5)`, `ARCHIVED (7)`. Cấm dùng các mã legacy `PROPOSED(1)`, `APPROVED_LEVEL2(4)`, `REJECTED(6)`.
     - Người tạo (`createdBy`) tuyệt đối không được tự duyệt bản ghi của chính mình (Backend gọi `validateNotSelfApproval`; Frontend disable nút duyệt kèm tooltip). Thao tác Trả về/Từ chối bắt buộc mở popup nhập lý do.
   - **QUY CHUẨN MÀN HÌNH DANH SÁCH & FORM CHUNG**:
     - Cột STT: `align: 'center'`, cố định trái `60px`, tính theo `(page - 1) * pageSize + index + 1`.
     - Căn lề: Chữ căn trái, số liệu căn phải có dấu phân cách hàng nghìn, ngày tháng / Badge trạng thái / thao tác căn giữa.
     - Badge 2 cột trạng thái độc lập (`approvalStatus` và `conditionStatus`): `minWidth: 125px`, `align: 'center'`, dùng màu semantic từ `tokens.ts`.
     - Menu thao tác dòng (`rowActions`): Xem chi tiết luôn hiện; Sửa/Xóa/Gửi duyệt khi DRAFT/REJECTED; Duyệt C1/C2 khi Chờ duyệt và không vi phạm chống tự duyệt; Xóa có Modal Confirm.
     - Drawer Form chuẩn 5 tab: 1. Thông tin chung; 2. Thông số kỹ thuật; 3. Vị trí GIS; 4. Tệp đính kèm; 5. Lịch sử phê duyệt.
     - Tự động `.trim()` mọi ô tìm kiếm và trường văn bản trước khi gửi API.
     - Phân trang: Backend 0-indexed (`apiPage = current - 1`), Frontend 1-indexed. Ngày tháng format `DD/MM/YYYY` (hoặc `DD/MM/YYYY HH:mm`) bằng `dayjs`.
     - Xuất Excel: Tên file `<ten_chuc_nang>_<YYYYMMDD>.xlsx`, xuất theo bộ lọc và data scope.
   - **TƯƠNG THÍCH ĐA CSDL CHO RUNNER & MIGRATOR**:
     - Các lớp `CommandLineRunner`, `ApplicationRunner`, `JdbcTemplate` chạy trong Spring context bắt buộc phải tương thích với cả H2 in-memory DB (test) và PostgreSQL (production).
     - Truy vấn `information_schema` dùng `LOWER(table_name) = '...' AND LOWER(column_name) = '...'`.
     - Dùng cú pháp ANSI SQL chuẩn (như `CURRENT_TIMESTAMP`) và xử lý backfill qua JDBC Java.
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
   - **CẤM HARDCODE CHUỖI VÀ BẮT BUỘC DÙNG CONSTANTS/ENUM**:
     - Tất cả class Entity và DTO cập nhật bắt buộc phải khai báo `@FieldNameConstants` từ Lombok.
     - Tuyệt đối KHÔNG hardcode tên thuộc tính dạng String thủ công (như `"provinceId"`, `"systemName"`, `"approvalStatus"`, `"deletedAt"`). BẮT BUỘC dùng hằng số compile-time do Lombok sinh ra (ví dụ: `VtsSystem.Fields.systemName`, `EntityFields.DELETED_AT`).
     - Tuyệt đối KHÔNG hardcode giá trị Enum dạng String thủ công (như `"APPROVED"`, `"REJECTED"`, `"PROPOSED"`). BẮT BUỘC dùng tham chiếu từ Enum (ví dụ: `ApprovalStatus.APPROVED.name()`).
     - Tái sử dụng `ApprovalHistoryUtils.recordSoftDelete(...)` và `EntityUpdateUtils.copyPropertiesIfPresent(...)` cho mọi thực thể hạ tầng.
   - **QUY ƯỚC ĐẶT TÊN ĐA NGÔN NGỮ (ENGLISH FOR CODE - VIETNAMESE FOR TEXT)**:
     - Tên bảng CSDL, tên cột, tên biến Java, tên thuộc tính DTO, tham số API JSON và Endpoint REST BẮT BUỘC 100% dùng **tiếng Anh chuẩn** (ví dụ: `decision` thay vì `quyetDinh`, `rejectionReason` thay vì `lyDoTuChoi`).
     - Thông báo lỗi trả về cho client, Toast message và nội dung giao diện BẮT BUỘC 100% là **tiếng Việt có dấu** rõ nghĩa.
