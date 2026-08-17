---
id: F-003
name: Quản lý đơn vị
slug: quan-ly-don-vi
module-id: M-001
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-17
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý đơn vị

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-003
**Module:** M-001 — Quản trị hệ thống
**Loại:** chức năng có bước phê duyệt (phê duyệt đơn vị mới / thay đổi quan trọng)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (TKCT)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

---

## 1. Mô tả ngắn

Quản lý cấu trúc tổ chức đơn vị phân cấp của hệ thống (Cục, Chi cục, Cảng vụ, Trung tâm — tối đa 3 cấp) theo cây cha-con: tạo mới, chỉnh sửa, xóa mềm, **phê duyệt/chấp thuận đơn vị** (workflow), xây dựng và duyệt cây tổ chức (expand/collapse, trừ cấp 3). Đơn vị có thể mang hệ số (coefficient, > 0, tối đa 2 chữ số thập phân) phục vụ tính toán và báo cáo. Loại đơn vị (unitType) tự động suy ra từ đơn vị cha. Đơn vị mới hoặc thay đổi quan trọng phải qua phê duyệt: Chờ phê duyệt → Sử dụng / bị từ chối. Các màn hình khác dùng chung cây đơn vị qua TreeSelect/Cascader (tài liệu nền mục 3.3).

## 2. Trường dữ liệu

### 2.1. Form Tạo mới / Chỉnh sửa đơn vị

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Tên đơn vị | Có | Text, 2-200 ký tự | BR-003-07 |
| 2 | Mã đơn vị | Có (tạo) / Không (sửa) | Text, 2-30 ký tự; unique toàn hệ thống | BR-003-01; chỉ sửa khi tạo |
| 3 | Đơn vị cha | Không | TreeSelect dạng cây | Để trống = đơn vị cấp cao nhất (level 1); chống vòng lặp (BR-003-02); tối đa 3 cấp (BR-003-04) |
| 4 | Địa điểm (Tỉnh/TP) | Có | Dropdown danh mục hành chính | — |
| 5 | Địa điểm chi tiết | Không | Text, max 500 ký tự | — |
| 6 | Số điện thoại | Không | 10-11 chữ số nếu nhập | — |
| 7 | Hệ số (coefficient) | Không | DECIMAL(5,2); > 0, tối đa 2 chữ số thập phân | — |
| 8 | Trạng thái | Có | Select: Sử dụng / Không sử dụng; default Sử dụng | "Chờ phê duyệt" do hệ thống gán, không chọn thủ công |

### 2.2. Màn hình chi tiết đơn vị (read-only)

| # | Trường | Ghi chú |
|---|---|---|
| 1 | Tên đơn vị, Mã đơn vị, Đơn vị cha, Địa điểm (Tỉnh/TP), Địa điểm chi tiết, Số điện thoại, Hệ số, Trạng thái, Ngày tạo | Thanh thao tác: Sửa, Xóa, Phê duyệt, Quay lại |

## 3. Trạng thái và phê duyệt

Theo tài liệu nền (mục 3.7) — trạng thái lưu dạng **số** (INT):

| Giá trị | Mô tả |
|---|---|
| Sử dụng | Đơn vị đang hoạt động (kích hoạt chính thức) |
| Không sử dụng | Đơn vị ngừng hoạt động |
| Chờ phê duyệt | Do hệ thống gán (không chọn thủ công) khi tạo đơn vị mới hoặc có thay đổi quan trọng |

**Quy trình phê duyệt:** tạo đơn vị mới / thay đổi quan trọng → đơn vị ở trạng thái **Chờ phê duyệt** → tài khoản có quyền duyệt đơn vị (`orgunit:approve`) xem xét → **Phê duyệt**: chuyển sang **Sử dụng** (đơn vị được kích hoạt chính thức) hoặc **Từ chối**: không kích hoạt. Mọi thao tác thay đổi dữ liệu ghi nhận ai làm, lúc nào (mục 3.8 nền); xóa là xóa mềm (`deletedAt`).

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (BR-003-01..BR-003-08 + BR-013..BR-015 — kế thừa từ brief cũ + lean-spec)

- BR-003-01 (BR-013) — Mã đơn vị (code) unique toàn hệ thống; trùng khi tạo → "Mã đơn vị đã tồn tại".
- BR-003-02 — Không cho phép tạo vòng lặp phân cấp (circular reference): không chọn chính nó hoặc đơn vị con làm cha → lỗi.
- BR-003-03 — Đơn vị gốc không có đơn vị cha; không chọn cha khi tạo → đơn vị cấp cao nhất (level 1).
- BR-003-04 — Hệ thống phân cấp giới hạn tối đa 3 cấp; cố tạo cấp 4 → lỗi.
- BR-003-05 (BR-014) — Không cho phép xóa đơn vị còn đơn vị con hoặc có người dùng trực thuộc (cán bộ/đối tượng liên quan); xóa → lỗi kèm thông báo cụ thể.
- BR-003-06 — Cấp bậc (level) tính tự động theo độ sâu trong cây: tạo đơn vị con → level = level cha + 1.
- BR-003-07 — Tên đơn vị không được để trống, tối đa 200 ký tự; để trống → "Tên đơn vị không được để trống".
- BR-003-08 — Đơn vị cấp 3 (cấp nhỏ nhất) không có chức năng collapse/expand trên cây.
- BR-015 — Chỉ tài khoản có quyền duyệt đơn vị (`orgunit:approve`) mới được phê duyệt/từ chối đơn vị (brief cũ: "Chỉ Admin mới có quyền duyệt đơn vị" — đã chuyển sang mô hình phân quyền động).
- Bổ sung từ brief cũ: hệ số (coefficient) hợp lệ khi > 0 và tối đa 2 chữ số thập phân; loại đơn vị (unitType) tự động suy ra từ parentId (không nhập tay).

### 4.2. Acceptance criteria kế thừa (AC-003-01..AC-003-08 + AC từ brief cũ)

- AC-003-01 — Mã đơn vị unique toàn hệ thống; trùng khi tạo → "Mã đơn vị đã tồn tại".
- AC-003-02 — Không cho tạo vòng lặp phân cấp; chọn chính nó hoặc đơn vị con làm cha → lỗi.
- AC-003-03 — Đơn vị cha không bắt buộc; để trống → đơn vị cấp cao nhất, level=1.
- AC-003-04 — Giới hạn tối đa 3 cấp; cố tạo cấp 4 → lỗi.
- AC-003-05 — Không cho xóa đơn vị còn đơn vị con hoặc có người dùng trực thuộc; xóa → lỗi kèm thông báo cụ thể (kèm số lượng ràng buộc).
- AC-003-06 — Level tính tự động theo độ sâu trong cây.
- AC-003-07 — Tên đơn vị bắt buộc, max 200 ký tự.
- AC-003-08 — Đơn vị cấp 3 không hiển thị mũi tên mở rộng trên cây.
- (Brief cũ) — Tạo/chỉnh sửa/xóa đơn vị thành công với mã unique và hệ số hợp lệ; phê duyệt/từ chối theo workflow chính xác (pending → approved/rejected), trạng thái thay đổi đúng quy trình; cây phân cấp cha/con chính xác với hỗ trợ mở rộng, thu gọn và truy vấn theo path.

### 4.3. User stories kế thừa (US-003-01..US-003-07, MoSCoW)

- US-003-01 (Must) — Xem cây cấu trúc đơn vị phân cấp để nắm được tổ chức hệ thống.
- US-003-02 (Must) — Tạo đơn vị mới (tên, mã, địa điểm, SĐT, trạng thái). US-003-03 (Must) — Sửa thông tin đơn vị.
- US-003-04 (Should) — Xóa đơn vị khi không còn ràng buộc. US-003-05 (Should) — Phê duyệt đơn vị đang chờ.
- US-003-06 (Should) — Xem chi tiết đơn vị. US-003-07 (Must) — Tìm kiếm và lọc đơn vị theo tên/mã và trạng thái.

### 4.4. Phân quyền riêng

Quyền theo mẫu `<resource>:<action>`, gán động qua nhóm/tài khoản (tài liệu nền mục 3.2); quyền mới phải đăng ký trong `PermissionSeeder.java`.

| Thao tác | Quyền cần có | Ghi chú |
|---|---|---|
| Xem danh sách / cây / chi tiết đơn vị | `orgunit:read` | — |
| Tạo đơn vị (yêu cầu mới) | `orgunit:manage` | Đơn vị mới → Chờ phê duyệt |
| Sửa thông tin đơn vị | `orgunit:manage` | — |
| Xóa đơn vị (xóa mềm) | `orgunit:manage` | Không xóa nếu còn con/người dùng trực thuộc (BR-003-05) |
| Phê duyệt / Từ chối đơn vị | `orgunit:approve` | Chỉ tài khoản có quyền này mới duyệt (BR-015) |

Bảng vai trò × thao tác (mô hình cũ — **đã thay thế** bằng bảng trên): Admin full access (tạo/sửa/xóa/duyệt); Lãnh đạo approve; Cán bộ view + create; Cá nhân view (chỉ đơn vị của mình). Trong mô hình động, các phạm vi này thể hiện qua tổ hợp quyền + đơn vị trực thuộc (tài liệu nền 3.2); ROLE_SYSTEM_ADMIN / ROLE_SUPER_ADMIN vượt qua mọi kiểm tra quyền.

**Admin Cục:** mặc định theo tài liệu nền mục 3.8 — full quyền + xem thêm metadata (người tạo, người sửa cuối, thời gian tạo/cập nhật) trên màn chi tiết đơn vị; các tài khoản khác không thấy các trường này.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 3 trạng thái INT: Sử dụng / Không sử dụng / Chờ phê duyệt (hệ thống gán) |
| 2 | Có bước phê duyệt không | Có — đơn vị mới / thay đổi quan trọng: Chờ phê duyệt → Phê duyệt (Sử dụng) / Từ chối; người duyệt: tài khoản có quyền `orgunit:approve` |
| 3 | Lọc cha-con / theo đơn vị | Có — bản thân chức năng là quản lý cây đơn vị cha-con (TreeSelect, tối đa 3 cấp, level tự động) |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — Mã đơn vị chỉ nhập khi tạo (read-only khi sửa); Trạng thái "Chờ phê duyệt" do hệ thống gán (không hiện trong lựa chọn thủ công); nút Phê duyệt chỉ hiện khi đơn vị ở trạng thái Chờ phê duyệt |
| 5 | Quyền riêng | `orgunit:read`, `orgunit:manage`, `orgunit:approve` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Có — màn hình chính là cây tổ chức phân cấp (expand/collapse, cấp 3 không expand) kèm tìm kiếm/lọc, không phải bảng phẳng thông thường; màn chi tiết có thanh thao tác (Sửa, Xóa, Phê duyệt, Quay lại) |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/org-units` | Danh sách đơn vị (phân trang, lọc tên/mã/loại/hệ số) | JWT (controller: `isAuthenticated()`) |
| GET | `/api/org-units/tree` | Cây tổ chức (tree structure, expand theo level) | `orgunit:read` |
| GET | `/api/org-units/{id}` | Chi tiết đơn vị | `orgunit:read` |
| POST | `/api/org-units` | Tạo đơn vị mới (→ Chờ phê duyệt nếu cần duyệt) | `orgunit:manage` |
| PUT | `/api/org-units/{id}` | Chỉnh sửa đơn vị | `orgunit:manage` |
| DELETE | `/api/org-units/{id}` | Xóa mềm đơn vị (chặn nếu còn con/người dùng) | `orgunit:manage` |
| POST | `/api/org-units/{id}/submit` | Gửi yêu cầu phê duyệt đơn vị | `orgunit:manage` |
| POST | `/api/org-units/{id}/approve` | Duyệt đơn vị (Chờ phê duyệt → Sử dụng) | `orgunit:approve` |
| POST | `/api/org-units/{id}/reject` | Từ chối đơn vị | `orgunit:approve` |

> Đường dẫn thực tế theo `OrgUnitController.java` (`@RequestMapping("/api/org-units")`); `/api/units` cũ không còn. Controller còn có: `GET /options`, `GET /{id}/subtree`, `GET ?parentId`, `GET /search`, `GET /filter` (guard `orgunit:read` hoặc `isAuthenticated`).

Ghi chú: các endpoint chung `GET /api/users`, `GET /api/groups`, `GET /api/symbols`, `GET /api/connections` trong bảng API của brief cũ **không còn liệt kê ở đây** (thuộc F-001/F-002/F-006/F-004); `GET /api/roles` không còn — bảng Role đã bị loại bỏ trong mô hình phân quyền động.

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `Unit` (đơn vị):** id (PK), name (VARCHAR(100) NOT NULL — tên đơn vị, max 200 ký tự), code (VARCHAR(30) UNIQUE NOT NULL — mã đơn vị), unitType (VARCHAR(30) NOT NULL — loại đơn vị, tự suy từ parentId), description (TEXT), province (VARCHAR — tỉnh/thành phố), address (TEXT — địa điểm chi tiết), phone (VARCHAR(20)), coefficient (DECIMAL(5,2) — >0, tối đa 2 chữ số thập phân), status (INT: 0=Không sử dụng, 1=Sử dụng, 2=Chờ phê duyệt — theo mục 3.7 nền; brief cũ ghi VARCHAR), parentId (FK → Unit, NULL — đơn vị cha), level (INT DEFAULT 1 — tự tính), sortOrder (INT DEFAULT 0), createdAt, updatedAt, approvedAt (TIMESTAMP NULL), deletedAt (TIMESTAMP NULL — xóa mềm).

**Bảng `UnitHistory`:** id, unitId (FK → Unit), action (VARCHAR(30) NOT NULL), performedBy (FK → UserAccount), performedAt, notes (TEXT) — nhật ký thay đổi (mục 3.8 nền).

**Bảng `OrganizationChart`:** id, unitId (FK → Unit UNIQUE), parentId (FK → Unit NULL), level, sortOrder, effectiveDate — dữ liệu cây (SA chốt có cần giữ hay dựng trực tiếp từ Unit.parentId/level).

**Bảng liên quan:** org_units được tham chiếu bởi mọi màn hình có trường đơn vị (orgUnitId; tên hiển thị qua `OrgUnitCacheService` — mục 3.3 nền); UserAccount (F-001); cây đơn vị dùng chung cho filter TreeSelect/Cascader.
