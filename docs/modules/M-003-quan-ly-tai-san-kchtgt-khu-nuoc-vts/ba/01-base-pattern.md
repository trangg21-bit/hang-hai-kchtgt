---
module-id: M-003
module-name: Quản lý tài sản KCHTGT - Khu nước & VTS
document: base-pattern
version: 1.0
last-updated: 2026-08-23
---

# M-003: Quản lý tài sản KCHTGT - Khu nước & VTS — Tài liệu nền dùng chung

## Tài liệu này dùng để làm gì?

Phân hệ Quản lý tài sản KCHTGT - Khu nước & VTS có **30 chức năng** (F-038..F-067) thuộc **5 nhóm thực thể**: Luồng hàng hải (LuongHangHai), Đê/kè (DeKe), Cơ sở sửa chữa đóng tàu (CoSuaChuaDongTau), Trạm radar (TramRadar), Hệ thống VTS (HeThongVTS). Giữa chúng có nhiều quy định được **lặp lại** (cách làm màn hình, cách phân quyền, phạm vi dữ liệu theo đơn vị, cách ghi lịch sử, quy trình phê duyệt...).

**Phần chung ở đây = những quy định được nhiều chức năng trong module dùng lại** — xác định bằng cách **so sánh các chức năng với nhau** (cái gì lặp lại ở 2+ chức năng thì gom vào đây), không phải khái niệm trừu tượng.

Tài liệu này gom phần chung đó vào **một chỗ**, để mỗi chức năng chỉ cần một tài liệu ngắn ghi **phần riêng của nó** — không phải viết lại những thứ giống nhau 30 lần.

## Ai cần đọc?

| Người đọc | Đọc phần nào |
|---|---|
| Người quản lý, người review | Mục 1 đến 3 — để hiểu phân hệ quy định gì |
| Người viết tài liệu (BA) | Cả tài liệu, đặc biệt mục 4 |
| Người lập trình (dev) | **Mục 3 trước khi code** — đây là quy tắc nghiệp vụ bắt buộc phải làm đúng |

---

## 1. Năm nhóm thực thể của phân hệ

> **Phạm vi áp dụng:** tài liệu này là khung cho các chức năng **quản lý dạng CRUD** (danh sách + thêm/sửa/xóa + trạng thái + phê duyệt + lịch sử) của 5 nhóm thực thể. Mỗi nhóm thực thể là **một resource quyền riêng** (xem mục 3.1). Phần đặc thù của từng chức năng nằm trong tài liệu của chính chức năng đó.

| Chức năng (nhóm thực thể) | Làm gì | Có gì đặc biệt |
|---|---|---|
| Luồng hàng hải — LuongHangHai (F-038..F-043) | Tạo mới, cập nhật, xóa, phê duyệt, xem, lịch sử Luồng hàng hải | **Có bước phê duyệt 2 cấp** (quy trình chung mục 3.5) |
| Đê/kè — DeKe (F-044..F-049) | Tạo mới, cập nhật, xóa, phê duyệt, xem, lịch sử Đê/kè | **Có bước phê duyệt 2 cấp** (quy trình chung mục 3.5); ⚠️ F-048 bị trùng ID giữa brief UI "Danh sách Đê/kè" và brief BE "Xem chi tiết Đê/kè" — xem `ba/00-ui-be-merge-report.md` |
| Cơ sở sửa chữa đóng tàu — CoSuaChuaDongTau (F-050..F-055) | Tạo mới, cập nhật, xóa, phê duyệt, xem, lịch sử Cơ sở sửa chữa đóng tàu | **Có bước phê duyệt 2 cấp** (quy trình chung mục 3.5) |
| Trạm radar — TramRadar (F-056..F-061) | Tạo mới, cập nhật, xóa, phê duyệt, xem, lịch sử Trạm radar | **Có bước phê duyệt 2 cấp** (quy trình chung mục 3.5) |
| Hệ thống VTS — HeThongVTS (F-062..F-067) | Tạo mới, cập nhật, xóa, phê duyệt, xem, lịch sử Hệ thống VTS | **Có bước phê duyệt 2 cấp** (quy trình chung mục 3.5) |

> Tổng 30 chức năng (F-038..F-067), mỗi cluster gồm 6 thao tác: tạo mới, cập nhật, xóa, phê duyệt, xem, xem lịch sử thay đổi — mỗi thao tác là một feature-brief riêng. Ngoài 30 feature BE, module còn có **2 feature-brief UI danh sách chưa đăng ký** trong projection (`F-068-quan-ly-tram-radar-xem-danh-sach`, `F-XX1-quan-ly-co-so-sua-chua-dong-tau-danh-sach`) — mapping hợp nhất sang feature BE xem `ba/00-ui-be-merge-report.md`.

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
| Luồng hàng hải | `luonghanghai` |
| Đê/kè | `deke` |
| Cơ sở sửa chữa đóng tàu | `cosuachua` |
| Trạm radar | `tramradar` |
| Hệ thống VTS | `vts` |

- Tên quyền theo mẫu **"việc:thao tác"** (`<resource>:<action>`), ví dụ `luonghanghai:create`, `deke:update`, `cosuachua:delete`, `tramradar:approve`, `vts:read`. Danh sách action đầy đủ của từng feature do feature-brief của chính feature đó khai báo (mục 4 của tài liệu riêng) — 5 cluster đều có đủ nhóm thao tác: tạo (`create`), cập nhật (`update`), xóa (`delete`), phê duyệt (`approve`), xem (`read`); riêng thao tác phê duyệt phân tách theo cấp (`approve:c1` / `approve:c2` — vòng 1/vòng 2, xem mục 3.5) và thao tác lịch sử dùng `history`.
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
- **Ngoại lệ đã chốt:** Dashboard trang chủ (lãnh đạo xem con số tổng hợp) — không áp dụng cho 5 cluster này; mọi ngoại lệ khác phải được BA/SA chốt và ghi rõ trong feature-brief (mục 5, dòng 3). Các brief UI danh sách của module (F-068, F-XX1, brief UI Đê/kè) đều yêu cầu **lọc theo `orgUnitId`** (người dùng chỉ thấy dữ liệu đơn vị mình, Admin Cục xem full) — khớp quy tắc này.

**3.4. Lịch sử thay đổi và xóa mềm**
- Mọi thao tác thay đổi dữ liệu (tạo, sửa, duyệt, trả về, xóa) phải ghi **ai làm, làm lúc nào** (truyền đầy đủ `operatorId`, `createdBy`, `updatedBy`, `deletedBy`...) và ghi vào sổ theo dõi lịch sử. Tái sử dụng `ApprovalHistoryUtils.recordSoftDelete(...)` và `EntityUpdateUtils.copyPropertiesIfPresent(...)` cho mọi thực thể hạ tầng.
- Xóa là **xóa mềm**: đánh dấu đã xóa chứ không xóa hẳn khỏi cơ sở dữ liệu (soft delete, không hard delete). Quy tắc riêng về trạng thái "Đã xóa (lịch sử)" của hồ sơ KCHT (chỉ xóa được khi đang "Lưu tạm") theo quy trình phê duyệt — xem mục 3.5.
- Các màn hình **xem lịch sử** (feature `*-lich-su` của từng cluster) hiển thị sổ theo dõi này; chi tiết do feature-brief của từng feature khai báo.

**3.5. Trạng thái và quy trình phê duyệt (2 cấp)**
- Toàn bộ 5 cluster dùng **chung một quy trình** nhập và phê duyệt hồ sơ KCHT (tối đa 2 cấp), quy định tại **`docs/conventions/approval-2-level-spec.md`** (mục 3.1 — 7 trạng thái chuẩn; mục 3.2..3.8 — 2 vòng duyệt, chống tự duyệt 4-eyes, lý do từ chối bắt buộc, nhật ký phê duyệt, xóa mềm, phân quyền + Admin Cục, data scope) và tài liệu gốc nghiệp vụ `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root). **Không chép lại toàn bộ nội dung quy trình vào đây — đọc trực tiếp các file đó trước khi làm.** Tóm tắt để định hướng: số vòng duyệt (1 hoặc 2) phụ thuộc **đơn vị gửi**, không phụ thuộc loại; quyền duyệt gắn với **chức vụ người duyệt** (lãnh đạo Cảng vụ/Chi cục duyệt vòng 1, lãnh đạo Cục duyệt vòng 2); hồ sơ **Đã duyệt** mới chính thức có hiệu lực và được đưa vào báo cáo.
- Hồ sơ trải qua **7 trạng thái** (6 trạng thái hoạt động + 1 trạng thái lưu trữ, theo `docs/conventions/approval-2-level-spec.md` mục 3.1). Bản đồ sang enum `ApprovalStatus` (`src/main/java/com/hanghai/kchtg/common/entity/ApprovalStatus.java`):

| # | Trạng thái nghiệp vụ (approval-2-level-spec.md mục 3.1) | ApprovalStatus | Giá trị DB |
|---|---|---|---|
| 1 | Lưu tạm | `DRAFT` | 0 |
| 2 | Chờ Cảng vụ / Chi cục duyệt | `PENDING_APPROVAL` | 2 |
| 3 | Chờ Cục duyệt | `APPROVED_LEVEL1` | 3 |
| 4 | Bị Cảng vụ / Chi cục trả về | `REJECTED_LEVEL1` | 8 |
| 5 | Bị Cục trả về | `REJECTED_LEVEL2` | 9 |
| 6 | Đã duyệt | `APPROVED` | 5 |
| 7 | Đã xóa (lịch sử) | `ARCHIVED` | 7 |

> **Tập đóng 7 trạng thái** (đã chốt — M-1006 DP-9/AC-25). `PROPOSED` (1), `APPROVED_LEVEL2` (4), `REJECTED` (6) là giá trị **legacy** giữ trong enum để đọc dữ liệu cũ, **không dùng trong luồng thống nhất**. ⚠️ `DESIGN.md` của module còn mô tả mô hình **4 trạng thái cũ** (PROPOSED / UNDER_REVIEW / APPROVED / REJECTED) — **không lấy làm chuẩn**; khi code lấy bảng 7 trạng thái ở đây làm chuẩn (xem thêm `ba/00-ui-be-merge-report.md` mục 4.2).
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

**Ví dụ minh họa** (đã điền sẵn cho chức năng "Phê duyệt Trạm radar" — chỉ để tham khảo cách điền, không phải nội dung của chức năng khác):

| # | Điểm cần khai báo | Mặc định | Khai báo của chức năng "Phê duyệt Trạm radar" |
|---|---|---|---|
| 1 | Trạng thái riêng | Không có | Không — dùng 7 trạng thái chung (mục 3.5) |
| 2 | Có bước phê duyệt không | Không | Có — phê duyệt 2 cấp theo docs/conventions/approval-2-level-spec.md |
| 3 | Có lọc theo cha-con / đơn vị không | Theo đơn vị | Theo đơn vị (mục 3.3) |
| 4 | Có trường chỉ hiện trong điều kiện nào không | Không | Không |
| 5 | Quyền riêng | Theo mẫu "việc:thao tác" | `tramradar:approve:c1` / `tramradar:approve:c2` |
| 6 | Có đường dẫn dùng chung không cần đăng nhập không | Không | Không |
| 7 | Có tải lên tệp không | Không | Không |
| 8 | Giao diện có khác mẫu chung không | Không | Không |

6. **Phần kỹ thuật — đường dẫn gọi dữ liệu**: bảng Method / Đường dẫn / Mô tả / Quyền — **đề xuất của BA, SA chốt**
7. **Phần kỹ thuật — cấu trúc bảng**: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ — **đề xuất của BA, SA chốt**

> Mục 6–7 là **ý kiến đề xuất của BA, không phải quyết định cuối cùng** — SA chịu trách nhiệm chốt; khi review tài liệu **không bắt lỗi** phần này.

**Quy tắc quan trọng:** muốn thay đổi quy định chung ở mục 3 → **sửa tài liệu này trước**, rồi mới sửa tài liệu của từng chức năng — không để tài liệu chức năng mâu thuẫn với tài liệu này.

---

## 5. Tóm tắt

> Phân hệ Quản lý tài sản KCHTGT - Khu nước & VTS có 5 nhóm thực thể (Luồng hàng hải, Đê/kè, Cơ sở sửa chữa đóng tàu, Trạm radar, Hệ thống VTS) với 30 chức năng CRUD (F-038..F-067). Phần giống nhau giữa chúng nằm gọn trong tài liệu này (mục 3): phân quyền theo resource riêng của từng cluster (`luonghanghai` / `deke` / `cosuachua` / `tramradar` / `vts`), Admin Cục full quyền + xem metadata, phạm vi dữ liệu theo đơn vị (`orgUnitFilter` + `@DataScope`), lịch sử thay đổi + xóa mềm, và quy trình phê duyệt 2 cấp chung (tham chiếu `docs/conventions/approval-2-level-spec.md` mục 3.1, 7 trạng thái → enum `ApprovalStatus`). Mỗi chức năng chỉ cần một tài liệu ngắn ghi phần riêng, theo mẫu ở mục 4.
