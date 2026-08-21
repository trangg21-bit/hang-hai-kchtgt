---
module-id: M-002
module-name: Quản lý tài sản KCHTGT - Cảng & Bến
document: base-pattern
version: 1.0
last-updated: 2026-08-21
---

# M-002: Quản lý tài sản KCHTGT - Cảng & Bến — Tài liệu nền dùng chung

## Tài liệu này dùng để làm gì?

Phân hệ Quản lý tài sản KCHTGT - Cảng & Bến có **30 chức năng** (F-008..F-037) thuộc **5 nhóm thực thể**: Cảng biển (Port), Bến cảng (Berth), Cầu cảng (Pier), Cảng cạn (DryPort), Vùng nước (WaterZone). Giữa chúng có nhiều quy định được **lặp lại** (cách làm màn hình, cách phân quyền, phạm vi dữ liệu theo đơn vị, cách ghi lịch sử, quy trình phê duyệt...).

**Phần chung ở đây = những quy định được nhiều chức năng trong module dùng lại** — xác định bằng cách **so sánh các chức năng với nhau** (cái gì lặp lại ở 2+ chức năng thì gom vào đây), không phải khái niệm trừu tượng.

Tài liệu này gom phần chung đó vào **một chỗ**, để mỗi chức năng chỉ cần một tài liệu ngắn ghi **phần riêng của nó** — không phải viết lại những thứ giống nhau 30 lần.

## Ai cần đọc?

| Người đọc | Đọc phần nào |
|---|---|
| Người quản lý, người review | Mục 1 đến 3 — để hiểu phân hệ quy định gì |
| Người viết tài liệu (BA) | Cả tài liệu, đặc biệt mục 4 |
| Người lập trình (dev) | **Mục 3 trước khi code** — đây là quy tắc nghiệp vụ bắt buộc phải làm đúng |

---

## 1. Năm chức năng của phân hệ

> **Phạm vi áp dụng:** tài liệu này là khung cho các chức năng **quản lý dạng CRUD** (danh sách + thêm/sửa/xóa + trạng thái + phê duyệt + lịch sử) của 5 nhóm thực thể. Mỗi nhóm thực thể là **một resource quyền riêng** (xem mục 3.1). Phần đặc thù của từng chức năng nằm trong tài liệu của chính chức năng đó.

| Chức năng (nhóm thực thể) | Làm gì | Có gì đặc biệt |
|---|---|---|
| Cảng biển — Port (F-008..F-012) | Tạo mới, cập nhật, xóa, phê duyệt, xem Cảng biển | **Có bước phê duyệt 2 cấp** (quy trình chung mục 3.5); F-013 — quản lý lịch sử Cảng biển — **đã hủy** theo rà soát URD |
| Bến cảng — Berth (F-014..F-019) | Tạo mới, cập nhật, xóa, phê duyệt, xem, lịch sử Bến cảng | **Có bước phê duyệt 2 cấp** (quy trình chung mục 3.5) |
| Cầu cảng — Pier (F-020..F-025) | Tạo mới, cập nhật, xóa, phê duyệt, xem, lịch sử Cầu cảng | **Có bước phê duyệt 2 cấp** (quy trình chung mục 3.5) |
| Cảng cạn — DryPort (F-026..F-031) | Tạo mới, cập nhật, xóa, phê duyệt, xem, lịch sử Cảng cạn | **Có bước phê duyệt 2 cấp** (quy trình chung mục 3.5) |
| Vùng nước — WaterZone (F-032..F-037) | Tạo mới, cập nhật, xóa, phê duyệt, xem, lịch sử Vùng nước | **Có bước phê duyệt 2 cấp** (quy trình chung mục 3.5) |

> Tổng 30 chức năng (F-008..F-037), trong đó **29 hoạt động**; F-013 (quản lý lịch sử Cảng biển) đã hủy theo rà soát URD. Mỗi cluster gồm 6 thao tác: tạo mới, cập nhật, xóa, phê duyệt, xem, xem lịch sử thay đổi — mỗi thao tác là một feature-brief riêng (riêng Cảng biển thiếu feature lịch sử do F-013 hủy).

## 2. Quy định chung — đọc thêm ở 3 chỗ này

Đây là quy định chung **của toàn bộ hệ thống** (không riêng phân hệ này), đã có sẵn, không chép lại ở đây — chỉ cần biết chỗ nào chứa gì:

| Chỗ đọc | Chứa gì | Dùng khi nào |
|---|---|---|
| `docs/conventions/` (list-screen-ui-standard, form-and-list-patterns, management-screen-ui-standard, approval-2-level-spec) | Cách dựng màn danh sách, form, cửa sổ: dùng 5 phần dùng chung (ScreenHeader, FilterBar, StatusTabs, DataTable, Pagination), kích thước chuẩn (nút tròn, cao 40px, khoảng cách 12px); quy ước màn hình phê duyệt 2 cấp | Khi làm hoặc kiểm tra bất kỳ màn hình nào |
| `frontend/src/theme.ts` và `frontend/src/tokens.ts` | Toàn bộ màu sắc, khoảng cách, cỡ chữ, style preset đã định sẵn. **Cấm** ghi thẳng giá trị (ví dụ cấm viết màu `#12468C` vào code) | Khi viết giao diện — lấy màu từ đây |
| `AGENTS.md` mục "Permission Registration for New Modules" và "Data Scope Convention" | Mô hình phân quyền **động theo nhóm người dùng và từng tài khoản** (xem mục 3.1); quy định **Admin Cục** xem thêm AGENTS.md mục "Feature Brief Template Convention"; cơ chế phạm vi dữ liệu theo đơn vị (xem mục 3.3) | Khi cần hiểu mô hình phân quyền, quyền Admin Cục, hoặc phạm vi dữ liệu |

## 3. Quy tắc nghiệp vụ chung của phân hệ (đọc kỹ trước khi làm)

**3.1. Phân quyền**
- Phân quyền theo **nhóm người dùng** và **từng tài khoản**: quản trị viên mở màn hình **Phân quyền nhóm** (F-002) để **tích chọn (checkbox)** quyền trên cây quyền cho một nhóm; gán quyền trực tiếp cho từng tài khoản qua màn **Quản lý tài khoản** (API `/users/{id}/permissions`).
- **Mỗi nhóm thực thể = MỘT resource quyền**:

| Nhóm thực thể | Resource quyền |
|---|---|
| Cảng biển | `port` |
| Bến cảng | `berth` |
| Cầu cảng | `pier` |
| Cảng cạn | `dryport` |
| Vùng nước | `waterzone` |

- Tên quyền theo mẫu **"việc:thao tác"** (`<resource>:<action>`), ví dụ `port:create`, `berth:update`, `pier:delete`, `waterzone:approve`. Danh sách action đầy đủ của từng feature do feature-brief của chính feature đó khai báo (mục 4 của tài liệu riêng) — 5 cluster đều có đủ nhóm thao tác: tạo (`create`), cập nhật (`update`), xóa (`delete`), phê duyệt (`approve`), xem (`read`).
- **Quyền mới phải được đăng ký** vào `src/main/java/com/hanghai/kchtg/config/PermissionSeeder.java` (`seedPermission(definitions, resource, action)` trong `run()`) thì mới xuất hiện trong cây quyền để tích chọn. Quên đăng ký → quyền không tồn tại trong DB → `@PreAuthorize` không khớp → **403 Forbidden** với mọi tài khoản (trừ ROLE_SYSTEM_ADMIN / ROLE_SUPER_ADMIN).
- Máy chủ kiểm tra **từng thao tác** theo đúng quyền này (`PermissionMiddleware` + `@PreAuthorize`) — không có quyền thì bị chặn (lỗi 403), không phải chỉ ẩn nút ở màn hình.
- **Nhóm người dùng là động**: thêm mới, sửa, xóa, đổi quyền bất kỳ lúc nào. **Quyền của một tài khoản = quyền gán riêng + quyền của các nhóm tài khoản đang thuộc** (khớp `User.getAllPermissions()`). Riêng các quyền đặc biệt `group:manage`, `admin:all`, `orgunit:scope_all`, `*` chỉ được gán **trực tiếp** cho tài khoản; nhóm **không thừa kế** được các quyền này.
- **Không còn vai trò cố định** — mô hình phân quyền cũ (gán quyền theo vai trò) đã được bỏ; quyền được gán **động** qua nhóm/tài khoản như trên.
- Riêng tài khoản **quản trị hệ thống** (ROLE_SYSTEM_ADMIN / ROLE_SUPER_ADMIN) được **vượt qua mọi kiểm tra quyền**.
- **Ranh giới:** mục này mô tả **cơ chế chung**; mỗi chức năng khai báo cụ thể ai được thao tác gì (bảng vai trò × thao tác) ở **mục 4** của tài liệu riêng.

**3.2. Admin Cục**
- Riêng tài khoản **Admin Cục** được dùng **full quyền** — toàn bộ thao tác trong hệ thống — và được xem thêm thông tin nhạy cảm: **người tạo, người sửa cuối, thời gian tạo, thời gian cập nhật**. Các tài khoản khác **không thấy** những thông tin này.
- Mọi feature-brief của phân hệ **bắt buộc** khai báo dòng Admin Cục ở mục 4 (có đặc biệt gì / không — mặc định theo mục này).

**3.3. Phạm vi dữ liệu theo đơn vị (data scope)**
- Quy tắc chung toàn hệ thống: **đơn vị nào chỉ xem dữ liệu đơn vị đó; đơn vị cha xem được đơn vị con (subtree); Cục xem full** (qua `orgunit:scope_all` / `admin:all` / `*`).
- Cơ chế chuẩn duy nhất: `DataScopeAspect` (`security/aspect/DataScopeAspect.java`) + Hibernate global filter `orgUnitFilter` (`@FilterDef` ở `common/entity/BaseEntity.java`).
- **Entity nghiệp vụ của 5 cluster BẮT BUỘC:**
  1. Có trường đơn vị (`orgUnitId` / `unitId` / `owningOrgId` UUID) + khai `@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")` (cột khác tên thì đổi condition tương ứng).
  2. Controller khai `@DataScope` (class-level) — nếu không, filter không bao giờ được kích hoạt (no-op).
  3. Khi tạo/sửa **PHẢI gán đơn vị** (từ request hoặc fallback đơn vị của user thao tác) — **cấm để cột đơn vị NULL** (NULL → user cấp đơn vị thấy 0 bản ghi; lỗi đã gặp ở Buoy/BeaconLight/Coastal station).
  4. Chiều GHI phải validate đơn vị trong phạm vi user — `OrgUnitScopeService.Scope.allows(...)` / `requireOrganizationInScope` (lỗ hổng đã gặp ở ShipRepairFacility).
  5. Migration thay đổi schema BẮT BUỘC kèm **backfill** dữ liệu cũ (`org_unit_id` NULL → gán từ `created_by`), không chỉ thêm cột.
- Lỗ hổng đã gặp và cách tránh: `docs/intel/data-scope-gap-report.md`.
- Hiển thị: entity/request chỉ lưu/truyền `orgUnitId`; response trả cả `orgUnitId` + `orgUnitName` (ánh xạ bằng `OrgUnitCacheService`, không gọi API danh sách để đổi mã thành tên). Frontend chỉ gọi danh sách/cây đơn vị cho Select/Cascader/TreeSelect; chọn đơn vị dùng **dạng cây** (TreeSelect/Cascader), không dùng Select phẳng.
- **Ngoại lệ đã chốt:** Dashboard trang chủ (lãnh đạo xem con số tổng hợp) — không áp dụng cho 5 cluster này; mọi ngoại lệ khác phải được BA/SA chốt và ghi rõ trong feature-brief (mục 5, dòng 3).

**3.4. Lịch sử thay đổi và xóa mềm**
- Mọi thao tác thay đổi dữ liệu (tạo, sửa, duyệt, trả về, xóa) phải ghi **ai làm, làm lúc nào** (truyền đầy đủ `operatorId`, `createdBy`, `updatedBy`, `deletedBy`...) và ghi vào sổ theo dõi lịch sử. Tái sử dụng `ApprovalHistoryUtils.recordSoftDelete(...)` và `EntityUpdateUtils.copyPropertiesIfPresent(...)` cho mọi thực thể hạ tầng.
- Xóa là **xóa mềm**: đánh dấu đã xóa chứ không xóa hẳn khỏi cơ sở dữ liệu (soft delete, không hard delete). Quy tắc riêng về trạng thái "Đã xóa (lịch sử)" của hồ sơ KCHT (chỉ xóa được khi đang "Lưu tạm") theo quy trình phê duyệt — xem mục 3.5.
- Các màn hình **xem lịch sử** (feature `*-lich-su` của từng cluster) hiển thị sổ theo dõi này; chi tiết do feature-brief của từng feature khai báo.

**3.5. Trạng thái và quy trình phê duyệt (2 cấp)**
- Toàn bộ 5 cluster dùng **chung một quy trình** nhập và phê duyệt hồ sơ KCHT (tối đa 2 cấp), quy định tại **`QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`** (workspace root) và bản quy ước màn hình tại `docs/conventions/approval-2-level-spec.md`. **Không chép lại nội dung quy trình vào đây — đọc trực tiếp file đó trước khi làm.** Tóm tắt để định hướng: quy trình giống nhau cho mọi loại KCHT; số vòng duyệt (1 hoặc 2) phụ thuộc **đơn vị gửi**, không phụ thuộc loại; quyền duyệt gắn với **chức vụ người duyệt** (lãnh đạo Cảng vụ/Chi cục duyệt vòng 1, lãnh đạo Cục duyệt vòng 2); hồ sơ **Đã duyệt** mới chính thức có hiệu lực và được đưa vào báo cáo.
- Hồ sơ trải qua **7 trạng thái** (6 trạng thái hoạt động + 1 trạng thái lưu trữ, theo mục 1 của file chuẩn). Bản đồ sang enum `ApprovalStatus` (`src/main/java/com/hanghai/kchtg/common/entity/ApprovalStatus.java`):

| # | Trạng thái nghiệp vụ (QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md mục 1) | ApprovalStatus | Giá trị DB |
|---|---|---|---|
| 1 | Lưu tạm | `DRAFT` | 0 |
| 2 | Chờ Cảng vụ / Chi cục duyệt | `PROPOSED` | 1 |
| 3 | Chờ Cục duyệt | `PENDING_APPROVAL` | 2 |
| 4 | Bị Cảng vụ / Chi cục trả về | `APPROVED_LEVEL1` | 3 |
| 5 | Bị Cục trả về | `APPROVED_LEVEL2` | 4 |
| 6 | Đã duyệt | `APPROVED` | 5 |
| 7 | Đã xóa (lịch sử) | `REJECTED` | 6 |

> **Bảng mapping này là đề xuất của BA — SA chốt khi duyệt tài liệu.**
- Trạng thái lưu trong cơ sở dữ liệu dưới dạng **số nguyên** (INT/SMALLINT/TINYINT), map trên Java bằng enum với `@Enumerated(EnumType.ORDINAL)` — **không lưu chuỗi** (theo quy ước AGENTS.md "Ánh xạ Enum xuống Database"). Không hardcode giá trị enum dạng String — dùng tham chiếu từ enum (ví dụ `ApprovalStatus.APPROVED.name()`).
- Chức năng `phe-duyet` của từng cluster mô tả đầy đủ quy trình riêng (vòng 1/vòng 2, chuyển trạng thái, popup lý do trả về...) trong feature-brief của nó, **không lặp lại** ở đây.

---

## 4. Mỗi chức năng có một tài liệu riêng — gồm các phần sau

> Cấu trúc chi tiết theo mẫu `docs/feature-brief-template.md` (khuôn BA điền): **7 mục, đúng thứ tự, đúng tiêu đề** — không đảo thứ tự, không bỏ mục (mục không áp dụng ghi "không" kèm lý do). Tài liệu chức năng CHỈ ghi phần RIÊNG của chức năng, không lặp lại phần chung:

1. **Mô tả ngắn**: chức năng này làm gì, ai dùng (3–5 dòng)
2. **Trường dữ liệu**: bảng `# / Trường / Bắt buộc / Kiểu-ràng buộc / Ghi chú` — khớp cấu trúc hồ sơ thực tế, không gán dữ liệu giả lập cho trường DB không có
3. **Trạng thái và phê duyệt**: theo mục 3.5 của tài liệu này; chức năng `phe-duyet` mô tả đầy đủ quy trình; chức năng khác ghi rõ trạng thái áp dụng (vd: chỉ ở trạng thái Lưu tạm mới xóa được — xem file chuẩn)
4. **Quy tắc và phân quyền riêng**: chỉ ghi quy tắc **chưa có** trong tài liệu này; phân quyền dạng `<resource>:<action>` (resource theo mục 3.1) + bảng vai trò × thao tác + **dòng khai báo Admin Cục** (có đặc biệt gì / không — mặc định theo mục 3.2)
5. **Điểm khác biệt so với mẫu chung** — *mục đích:* **mỗi feature-brief đều có bảng này, BA điền cho CHÍNH chức năng đang viết**. Mỗi dòng là một câu hỏi "chức năng này có đặc điểm X không" — trả lời **"có"** = dev phải xử lý thêm điều đó, trả lời **"không"** = không phải bận tâm. Người đọc nhìn bảng là biết ngay chức năng cần làm gì đặc biệt, không cần đọc cả tài liệu. **Điền đủ 8 dòng, không bỏ trống**:

| # | Điểm cần khai báo | Mặc định (không đặc biệt thì ghi gì) | Khai báo của chức năng này |
|---|---|---|---|
| 1 | Trạng thái riêng | Không có | |
| 2 | Có bước phê duyệt không | Không | |
| 3 | Có lọc theo cha-con / đơn vị không | Theo đơn vị | |
| 4 | Có trường chỉ hiện trong điều kiện nào không | Không | |
| 5 | Quyền riêng | Theo mẫu "việc:thao tác" | |
| 6 | Có đường dẫn dùng chung không cần đăng nhập không | Không | |
| 7 | Có tải lên tệp không | Không | |
| 8 | Giao diện có khác mẫu chung không | Không | |

**Ví dụ minh họa** (đã điền sẵn cho chức năng "Phê duyệt Cảng biển" — chỉ để tham khảo cách điền, không phải nội dung của chức năng khác):

| # | Điểm cần khai báo | Mặc định | Khai báo của chức năng "Phê duyệt Cảng biển" |
|---|---|---|---|
| 1 | Trạng thái riêng | Không có | Không — dùng 7 trạng thái chung (mục 3.5) |
| 2 | Có bước phê duyệt không | Không | Có — phê duyệt 2 cấp theo QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md |
| 3 | Có lọc theo cha-con / đơn vị không | Theo đơn vị | Theo đơn vị (mục 3.3) |
| 4 | Có trường chỉ hiện trong điều kiện nào không | Không | Không |
| 5 | Quyền riêng | Theo mẫu "việc:thao tác" | `port:approve` |
| 6 | Có đường dẫn dùng chung không cần đăng nhập không | Không | Không |
| 7 | Có tải lên tệp không | Không | Không |
| 8 | Giao diện có khác mẫu chung không | Không | Không |

6. **Phần kỹ thuật — đường dẫn gọi dữ liệu**: bảng Method / Đường dẫn / Mô tả / Quyền — **đề xuất của BA, SA chốt**
7. **Phần kỹ thuật — cấu trúc bảng**: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ — **đề xuất của BA, SA chốt**

> Mục 6–7 là **ý kiến đề xuất của BA, không phải quyết định cuối cùng** — SA chịu trách nhiệm chốt; khi review tài liệu **không bắt lỗi** phần này.

**Quy tắc quan trọng:** muốn thay đổi quy định chung ở mục 3 → **sửa tài liệu này trước**, rồi mới sửa tài liệu của từng chức năng — không để tài liệu chức năng mâu thuẫn với tài liệu này.

---

## 5. Tóm tắt

> Phân hệ Quản lý tài sản KCHTGT - Cảng & Bến có 5 nhóm thực thể (Cảng biển, Bến cảng, Cầu cảng, Cảng cạn, Vùng nước) với 30 chức năng CRUD (F-008..F-037; F-013 đã hủy). Phần giống nhau giữa chúng nằm gọn trong tài liệu này (mục 3): phân quyền theo resource riêng của từng cluster (`port` / `berth` / `pier` / `dryport` / `waterzone`), Admin Cục full quyền + xem metadata, phạm vi dữ liệu theo đơn vị (`orgUnitFilter` + `@DataScope`), lịch sử thay đổi + xóa mềm, và quy trình phê duyệt 2 cấp chung (tham chiếu `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`, 7 trạng thái → enum `ApprovalStatus`). Mỗi chức năng chỉ cần một tài liệu ngắn ghi phần riêng, theo mẫu ở mục 4.
