# hang-hai-kchtgt

workspace-type: mono
repo-type: mono
stack: none
framework: spring-boot
cli: mvn

## Framework discipline (MANDATORY — read before delegating code work)

This project is built on **spring-boot**. Its CLI/generator is `mvn`. Prefer the framework's CLI/generators over hand-writing files:

- Scaffold components / entities / migrations / modules via the framework CLI (`mvn ...`) — hand-written files drift from the framework's expected structure and can break builds, dependency injection, or schema sync. Frameworks like ASP.NET Zero (ABP), Angular, NestJS, and Nx all enforce CLI-based generation.
- When unsure of the exact command or its current-version syntax, resolve live docs via context7 (`resolve-library-id` → `get-library-docs`) BEFORE generating.
- Main / project manager MUST carry these constraints into every worker task brief (workers do not read this file).

## UI Theme Convention (MANDATORY — mọi agent làm frontend PHẢI đọc)

### Single source of truth

Toàn bộ token thiết kế, CSS class, và cấu trúc layout được định nghĩa tại **3 file**:

| Thứ tự đọc | File | Vai trò | Agent nào phải đọc |
|---|---|---|---|
| 1 | `frontend/src/theme.ts` | Design tokens + AntD ConfigProvider + globalCssVars + Rules 1-14 | **Tất cả** (BA, Dev, QA, Auditor) |
| 2 | `frontend/src/components/AppLayout.tsx` | Layout chung cho 22 module (Sidebar + Topbar) | **Dev, QA** |
| 3 | `docs/intel/ui-audit-report.md` | Danh sách pass/fail từng UI component | **PMO lead** trước khi dispatch |

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

## SDLC convention

All SDLC scaffolding goes through `ai-kit` CLI (ADR-005).
Skills MUST NOT Write/mkdir under docs/{modules,features,hotfixes}/**.

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

