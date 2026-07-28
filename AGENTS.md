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

| File                                      | Vai trò                                          | Agent nào phải đọc        |
| ----------------------------------------- | ------------------------------------------------ | ------------------------- |
| `docs/feature-brief-template.md`          | Template 10-section cho mọi feature-brief.md     | **BA** (business analyst) |

### Cấu trúc 10 section bắt buộc

Mọi file `feature-brief.md` **PHẢI** tuân thủ đúng cấu trúc 10 section, đúng thứ tự, đúng tiêu đề:

| #   | Section                              | Nội dung                                                                 |
| --- | ------------------------------------ | ------------------------------------------------------------------------ |
| 1   | Tổng quan                            | 1.1 Tính năng này làm gì / 1.2 Tại sao cần / 1.3 Luồng hoạt động chính  |
| 2   | Ai dùng? Dùng như thế nào?           | Bảng phân quyền RBAC 7 role + logic Admin Cục đặc biệt                   |
| 3   | User Stories                         | Must / Should / Could, định dạng US-{XXX}-XX                             |
| 4   | Yêu cầu chức năng (Acceptance Criteria) | AC-{XXX}-XX, mỗi AC kèm xử lý khi lỗi                                |
| 5   | Quy tắc nghiệp vụ (Business Rules)   | BR-{XXX}-XX, định dạng bảng: ID / Rule / Applies-to / Source             |
| 6   | Mô hình dữ liệu                      | Bảng DB, 🔴 đỏ = trường mới, ~~gạch ngang~~ = trường cần loại bỏ         |
| 7   | API Endpoints                        | Bảng Method / Endpoint / Mô tả / Phân quyền                              |
| 8   | Chi tiết nghiệp vụ từng phần         | Triển khai chi tiết từng phần (bỏ nếu không áp dụng)                     |
| 9   | Yêu cầu phi chức năng                | Hiệu năng / Mở rộng / Bảo mật / Độ tin cậy / UX / Pháp lý               |
| 10  | Yêu cầu giao diện người dùng         | Token theme + bảng cột chi tiết (STT/Tên trường/Loại ĐK/Edit/Bắt buộc/Default/Mô tả) |

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
