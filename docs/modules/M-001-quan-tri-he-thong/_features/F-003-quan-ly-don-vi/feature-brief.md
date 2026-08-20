---
id: F-003
name: Quản lý đơn vị
slug: quan-ly-don-vi
module-id: M-001
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-17T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý đơn vị

**Tài liệu:** BA Feature Brief
**Feature:** F-003
**Module:** M-001 — Quản trị hệ thống
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-17

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Quản lý tổ chức đơn vị phân cấp của hệ thống (Cục, Chi cục, Cảng vụ, Trung tâm): tạo mới, chỉnh sửa, xóa mềm, xây dựng cây cấu trúc tổ chức tối đa 3 cấp và tra cứu thông tin đơn vị. Đơn vị có thể phân cấp cha/con với hệ số (coefficient) phục vụ nghiệp vụ tính toán và báo cáo. Mỗi đơn vị mang thuộc tính **Cấp đơn vị (rank)** — Cục / Chi cục/ Cảng vụ/ Công ty bảo đảm / Đại diện (scope expansion TRI-1786936397148-3956). Trạng thái duy nhất của đơn vị là **trạng thái vận hành** (`operational_status`: Sử dụng / Không sử dụng).

### 1.2. Tại sao cần tính năng này?

Hệ thống cần quản lý cấu trúc tổ chức đơn vị một cách có hệ thống, cho phép cán bộ quản trị tạo mới và duy trì thông tin các đơn vị trực thuộc, đảm bảo việc phân quyền và chia sẻ dữ liệu theo đúng cấu trúc phân cấp tổ chức hiện hành.

### 1.3. Luồng hoạt động chính

Quản trị hệ thống truy cập module Quản lý đơn vị từ sidebar → chọn tạo đơn vị mới hoặc quản lý đơn vị hiện có → điền thông tin (tên, mã đơn vị unique, loại đơn vị, Cấp đơn vị, địa chỉ, hệ số coefficient, mô tả) → lưu → đơn vị được tạo với trạng thái vận hành Sử dụng → hiển thị cây cấu trúc phân cấp với khả năng mở rộng từng nhánh. Quy trình bao gồm:

1. Tạo đơn vị với mã duy nhất trong hệ thống (kèm chọn Cấp đơn vị).
2. Chỉnh sửa thông tin đơn vị (tên, mã, loại, Cấp đơn vị, hệ số, địa chỉ) — cập nhật từng phần.
3. Xóa mềm đơn vị (không xóa nếu có cán bộ/đối tượng liên quan).
4. Xem cây tổ chức phân cấp với hỗ trợ mở rộng/thu gọn các nhánh (cấp 3 không expand/collapse).
5. Tìm kiếm theo tên/mã, xem chi tiết, phân trang danh sách.

---

## 2. Ai dùng? Dùng như thế nào?

Quyền thao tác và xem tính năng được áp dụng theo hệ thống phân quyền tập trung của hệ thống. Mỗi vai trò người dùng sẽ có phạm vi truy cập và thao tác khác nhau trên tính năng này, được kiểm soát bởi cơ chế RBAC (Role-Based Access Control).

### 2.1. Logic phân quyền chung

Các thao tác trong tính năng được bảo vệ bởi các quyền tương ứng (`orgunit:manage` cho tạo/sửa/xóa, `orgunit:read` cho xem). Người dùng chỉ có thể thực hiện những thao tác mà vai trò của họ được cấp quyền:

| Vai trò | Quyền xem | Quyền thao tác | Phạm vi dữ liệu | Ghi chú |
|---|---|---|---|---|
| system-admin | Xem toàn bộ dữ liệu đơn vị | Tạo, sửa, xóa đơn vị (`orgunit:manage`) | Toàn hệ thống | Quyền cao nhất |
| admin (Security) | Theo phân quyền hệ thống | Theo phân quyền hệ thống | Theo phân quyền hệ thống | |
| admin-operation | Theo phân quyền hệ thống | Theo phân quyền hệ thống | Theo phân quyền hệ thống | |
| admin | Theo phân quyền hệ thống | Theo phân quyền hệ thống | Theo phân quyền hệ thống | |
| Lãnh đạo | Xem danh sách/chi tiết đơn vị (`orgunit:read`) | — | Toàn hệ thống | Chỉ xem |
| Cán bộ | Xem đơn vị trong phạm vi được phân quyền | Tạo đơn vị trong phạm vi đơn vị được phân quyền | Phạm vi đơn vị được phân quyền | |
| Cá nhân | Xem đơn vị của mình | — | Đơn vị của mình | |

### 2.2. Logic phân quyền đặc biệt cho tài khoản Admin Cục

Đối với tài khoản **Admin Cục**, áp dụng logic phân quyền đặc biệt sau:

- **Xem full dữ liệu:** Admin Cục có quyền xem toàn bộ dữ liệu trên hệ thống, không giới hạn phạm vi đơn vị hay khu vực.
- **Xem thông tin người chỉnh sửa:** Với mỗi bản ghi, Admin Cục thấy được thông tin người chỉnh sửa cuối cùng (họ tên, tên đăng nhập).
- **Xem thời gian cập nhật:** Admin Cục thấy được thời gian cập nhật cuối cùng của dữ liệu (timestamp).
- **Xem người tạo mới:** Admin Cục thấy được thông tin người tạo mới bản ghi (họ tên, tên đăng nhập).
- **Xem thời gian tạo mới:** Admin Cục thấy được thời gian tạo mới dữ liệu (timestamp).

> **Ghi chú:** Các trường `người tạo mới`, `thời gian tạo mới`, `người chỉnh sửa`, `thời gian cập nhật` được ghi nhận qua audit (`unit_history` CREATED khi tạo) và chỉ hiển thị đối với tài khoản Admin Cục. Với các vai trò khác, các trường này bị ẩn khỏi giao diện.

---

## 3. User Stories

### Mức Must (bắt buộc có)

- **US-003-01:** Là người dùng được phân quyền, tôi muốn xem cây cấu trúc đơn vị phân cấp để nắm được tổ chức hệ thống.
- **US-003-02:** Là người dùng có quyền tạo, tôi muốn tạo đơn vị mới với tên, mã, địa điểm, SĐT và trạng thái vận hành.
- **US-003-03:** Là người dùng có quyền sửa, tôi muốn chỉnh sửa thông tin đơn vị.
- **US-003-07:** Là người dùng, tôi muốn tìm kiếm và lọc đơn vị theo tên/mã.
- **US-003-08:** Là Admin/Cán bộ, tôi muốn chọn "Cấp đơn vị" (Cục / Chi cục/ Cảng vụ/ Công ty bảo đảm / Đại diện) khi tạo đơn vị mới để gán đúng cấp quản lý cho đơn vị (scope expansion TRI-1786936397148-3956).
- **US-003-09:** Là Admin, tôi muốn chỉnh sửa và xem "Cấp đơn vị" của đơn vị trong drawer sửa/chi tiết để cập nhật hoặc tra cứu (scope expansion TRI-1786936397148-3956).

### Mức Should (nên có)

- **US-003-04:** Là người dùng có quyền xóa, tôi muốn xóa đơn vị khi không còn ràng buộc.
- **US-003-06:** Là người dùng, tôi muốn xem chi tiết đơn vị để biết đầy đủ thông tin.
- **US-003-10:** Là người dùng, tôi muốn dữ liệu đơn vị cũ vẫn hiển thị đúng sau khi nâng cấp (backfill theo cấp cây) để không phải nhập lại thủ công (scope expansion TRI-1786936397148-3956).

### Mức Could (có thể có sau)

- Không có.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

Mỗi yêu cầu dưới đây mô tả một điều hệ thống phải làm được, kèm theo cách xử lý khi có lỗi hoặc dữ liệu không như mong đợi.

**AC-003-01 — Mã đơn vị duy nhất:** Mã đơn vị (code) phải duy nhất trong toàn hệ thống; không được trùng khi tạo mới. Khi lỗi: tạo với mã đã tồn tại → thông báo "Mã đơn vị đã tồn tại".

**AC-003-02 — Chống vòng lặp phân cấp:** Không cho phép tạo vòng lặp phân cấp (circular reference). Khi lỗi: chọn chính nó hoặc đơn vị con làm cha → lỗi.

**AC-003-03 — Đơn vị cha không bắt buộc:** Đơn vị cha không bắt buộc; để trống → đơn vị cấp cao nhất. Khi lỗi: không áp dụng — tạo không chọn cha → level=1.

**AC-003-04 — Giới hạn 3 cấp:** Hệ thống phân cấp giới hạn tối đa 3 cấp. Khi lỗi: cố gắng tạo cấp 4 → lỗi.

**AC-003-05 — Ràng buộc xóa:** Không cho phép xóa đơn vị còn đơn vị con hoặc có người dùng trực thuộc. Khi lỗi: xóa đơn vị có ràng buộc → lỗi kèm thông báo cụ thể.

**AC-003-06 — Level tự động:** Cấp bậc (level) được tính tự động theo độ sâu trong cây. Khi lỗi: không áp dụng — tạo đơn vị con → level = level cha + 1.

**AC-003-07 — Tên đơn vị bắt buộc:** Tên đơn vị không được để trống, tối đa 200 ký tự. Khi lỗi: để trống → "Tên đơn vị không được để trống".

**AC-003-08 — Cây cấp 3:** Đơn vị cấp 3 không có chức năng collapse/expand trên cây. Khi lỗi: không áp dụng — cấp 3 → không hiển thị mũi tên mở rộng.

**AC-003-09 — Enum OrgUnitRank:** Enum đúng 3 giá trị theo thứ tự CUC(0), CHI_CUC_CANG_VU_CONG_TY_BAO_DAM(1), DAI_DIEN(2); OrgUnitRankConverter (`@Converter(autoApply = true)`) map SMALLINT ordinal. Khi lỗi: ordinal ngoài 0..2 → null (range-guard).

**AC-003-10 — Migration rank:** Migration `V20260817100000__add_org_unit_rank.sql`: ADD COLUMN rank SMALLINT NOT NULL DEFAULT 0 → backfill level≤1→0 / level=2→1 / else→2 → DROP DEFAULT. Khi lỗi: dữ liệu cũ giữ nguyên, mọi dòng có rank hợp lệ.

**AC-003-11 — SchemaMigrator dev-local:** `OrgUnitSchemaMigrator` bổ sung cột rank (`ADD COLUMN IF NOT EXISTS rank SMALLINT NOT NULL DEFAULT 0`) cho dev-local không chạy Flyway. Khi lỗi: chạy lại không lỗi (idempotent).

**AC-003-12 — create() nhận rank:** create(): rank = request.getRank() nếu gửi, else suy từ cha (cha null → CUC; cha level==1 → CHI_CUC_CANG_VU_CONG_TY_BAO_DAM; else → DAI_DIEN). Khi lỗi: không áp dụng.

**AC-003-13 — update() partial:** update(): rank chỉ được set khi request.getRank() != null (partial update). Khi lỗi: body không gửi rank → giữ giá trị cũ.

**AC-003-14 — Entity + response:** Entity OrgUnit có field `rank` `@Column(columnDefinition = "SMALLINT")`; OrgUnitResponse có `rank` và `from()` map `.rank(entity.getRank())`. Khi lỗi: không áp dụng.

**AC-003-15 — Select "Cấp đơn vị" bắt buộc:** Select "Cấp đơn vị" bắt buộc ở tạo/sửa (drawer UnitList + form UnitForm), options từ `RANK_OPTIONS`. Khi lỗi: không chọn → "Vui lòng chọn cấp đơn vị", không gọi API.

**AC-003-16 — RANK_OPTIONS/RANK_LABELS:** `RANK_OPTIONS` + `RANK_LABELS` export từ `organizationService.ts`; mọi mapper map `rank`; body create/update gửi `rank`. Khi lỗi: không áp dụng.

**AC-003-17 — Hiển thị chi tiết:** Xem chi tiết hiển thị dòng "Cấp đơn vị" = `RANK_LABELS[rank]`. Khi lỗi: rank null → "—".

**AC-003-18 — Giữ nguyên cột list + OrgUnitType:** Cột danh sách "Cấp đơn vị" (`Cấp {level}`) và enum OrgUnitType giữ nguyên không đổi. Khi lỗi: không áp dụng.

**AC-003-19 — Build pass:** `mvn clean compile -q` và `npx tsc --noEmit` đều pass. Khi lỗi: không áp dụng.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

Các quy tắc này là "luật chơi" mà mọi thành phần trong hệ thống phải tuân thủ:

**BR-013 — Mã đơn vị unique:** Mã đơn vị phải unique trong hệ thống (Create/Update Unit).

**BR-014 — Ràng buộc xóa:** Không được xóa đơn vị có cán bộ/đối tượng liên quan (Delete Unit).

**BR-016 — Phân cấp cha/con:** Đơn vị có thể phân cấp cha/con (tree structure), tối đa 3 cấp (Hierarchy).

**BR-017 — Hệ số coefficient:** Hệ số (coefficient) phải > 0 và có tối đa 2 chữ số thập phân (Unit Data).

**BR-018 — Rank lưu SMALLINT:** Cấp đơn vị (rank) lưu dưới DB dạng SMALLINT theo ordinal của enum OrgUnitRank (0=Cục, 1=Chi cục/ Cảng vụ/ Công ty bảo đảm, 2=Đại diện) qua OrgUnitRankConverter (`@Converter(autoApply = true)`) (Create/Update Unit — scope expansion TRI-1786936397148-3956).

**BR-019 — Rank khi tạo + backfill:** Tạo đơn vị: rank = request.getRank() nếu gửi, else suy từ cha (cha null → CUC; cha level==1 → CHI_CUC_CANG_VU_CONG_TY_BAO_DAM; else → DAI_DIEN); dữ liệu cũ backfill một lần theo level (≤1→0, =2→1, else→2) qua Flyway `V20260817100000__add_org_unit_rank.sql` (Create Unit — scope expansion TRI-1786936397148-3956).

**BR-020 — Sửa partial + giữ nguyên cột list:** Sửa đơn vị là partial update: rank chỉ được set khi request.getRank() != null; cột danh sách "Cấp đơn vị" (tree level `Cấp {level}`) và enum OrgUnitType giữ nguyên không đổi (Update Unit — scope expansion TRI-1786936397148-3956).

---

## 6. Mô hình dữ liệu

Tính năng này sửa đổi bảng dữ liệu sau trong cơ sở dữ liệu:

> **Quy ước đánh dấu:**
> - <span style="color:red;font-weight:bold">🔴 Chữ màu đỏ</span> = **trường mới cần thêm** vào bảng hiện có.
> - ~~Chữ gạch ngang~~ = **trường không cần thiết**, cần loại bỏ khỏi bảng.
> - Các trường không được đánh dấu là các trường hiện có, được giữ nguyên.

### 6.1. Bảng `org_units` — Đơn vị

Bảng chính, lưu thông tin đơn vị phân cấp (tự tham chiếu qua `parent_id`). Scope-shrink TRI-1786950754582-5a51: schema được điều chỉnh bởi migration Flyway drop (xem design plan) — trạng thái duy nhất còn lại là `operational_status`.

Các trường thông tin:

- **id:** UUID, khóa chính, duy nhất cho mỗi dòng
- **name:** VARCHAR(200) NOT NULL — tên đơn vị
- **code:** VARCHAR(50) NOT NULL, unique — mã đơn vị
- **parent_id:** UUID FK → org_units (NULL = cấp cao nhất)
- **operational_status:** SMALLINT NOT NULL DEFAULT 1 — trạng thái vận hành (Sử dụng / Không sử dụng)
- **level:** INT NOT NULL — độ sâu cây, tự tính (root = 1, con của root = 2, cháu = 3)
- **rank:** SMALLINT NOT NULL — Cấp đơn vị: 0=Cục, 1=Chi cục/ Cảng vụ/ Công ty bảo đảm, 2=Đại diện (enum `OrgUnitRank` qua `OrgUnitRankConverter`; thêm từ scope expansion TRI-1786936397148-3956)
- **province:** INT FK → provinces.id — địa điểm tỉnh/thành phố
- **path, sort_order:** phục vụ truy vấn cây
- **detail_address, address, phone, contact_person:** thông tin liên hệ/địa chỉ
- **created_at, updated_at, deleted_at:** audit + xóa mềm (soft delete)

### 6.2. Bảng `unit_history` — Lịch sử thay đổi

- **id:** khóa chính
- **unit_id:** FK → org_units
- **action:** loại sự kiện — ghi **CREATED** khi tạo mới đơn vị (audit tạo mới, giữ nguyên)
- **performed_by, performed_at, notes:** người thao tác, thời điểm, ghi chú

### 6.3. Bảng `organization_chart` — Cây tổ chức

- **id, unit_id** (FK → org_units, unique), **parent_id** (FK → org_units), **level, sort_order, effective_date**

---

## 7. API Endpoints

Hệ thống cung cấp các API để phục vụ các thao tác liên quan đến tính năng (base path `/api/org-units`, controller `OrgUnitController`):

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/org-units` | Danh sách đơn vị (phân trang) | `isAuthenticated()` |
| GET | `/api/org-units/options` | Directory list (cache frontend) | `isAuthenticated()` |
| GET | `/api/org-units/tree` | Cây tổ chức | `orgunit:read` |
| GET | `/api/org-units/{id}` | Chi tiết đơn vị | `orgunit:read` |
| GET | `/api/org-units/search` | Tìm kiếm theo tên/mã | `orgunit:read` |
| POST | `/api/org-units` | Tạo đơn vị mới (gửi `rank`; nếu thiếu, backend suy từ cha — BR-019) | `orgunit:manage` |
| PUT | `/api/org-units/{id}` | Chỉnh sửa đơn vị (partial update — BR-020) | `orgunit:manage` |
| DELETE | `/api/org-units/{id}` | Xóa mềm đơn vị | `orgunit:manage` |

---

## 8. Chi tiết nghiệp vụ từng phần

### 8.1. Tạo đơn vị mới

Người dùng mở drawer "Thêm mới đơn vị" (hoặc form routed `/organizations/create`) → điền tên (bắt buộc, tối đa 200 ký tự), mã đơn vị (bắt buộc khi tạo, unique, 2-30 ký tự), đơn vị cha (không bắt buộc — để trống = cấp cao nhất), địa điểm tỉnh/thành phố, địa chỉ chi tiết, số điện thoại, trạng thái vận hành (mặc định Sử dụng), **Cấp đơn vị (rank — bắt buộc)** → gửi `POST /api/org-units` → hệ thống kiểm tra mã unique, tính `level` tự động, lưu `rank` (request-first, fallback suy từ cha), ghi `unit_history` action **CREATED** → toast "Đã tạo mới" và refresh cây.

### 8.2. Chỉnh sửa đơn vị

Mở drawer "Sửa thông tin đơn vị" → các trường pre-populate (Select "Cấp đơn vị" hiển thị `rank` hiện tại) → gửi `PUT /api/org-units/{id}` → cập nhật từng phần: chỉ các trường gửi non-null mới thay đổi (BR-020) → toast "Đã cập nhật".

### 8.3. Xóa mềm đơn vị

Chỉ xóa khi đơn vị không còn đơn vị con và không có người dùng trực thuộc (AC-003-05, BR-014). Xóa mềm (soft delete — `deleted_at`), không xóa cứng. Xác nhận bằng modal cảnh báo ràng buộc.

### 8.4. Cây cấu trúc tổ chức

Hiển thị cây phân cấp tối đa 3 cấp (AC-003-04), expand/collapse từng nhánh (cấp 3 không có chức năng này — AC-003-08), truy vấn theo `path` (Materialized Path). Cột danh sách "Cấp đơn vị" hiển thị `Cấp {level}` theo độ sâu cây — không hiển thị rank trong bảng (BR-020).

### 8.5. Tìm kiếm, lọc, phân trang

Tìm kiếm theo tên/mã (`GET /api/org-units/search`), danh sách phân trang (Spring Pageable, default 20, max 100), cây và danh sách đồng bộ sau mỗi thao tác.

### 8.6. Ngoài phạm vi

- Tổ chức lại cơ cấu đơn vị (reorg) — không thuộc phạm vi
- Tích hợp danh bạ công ty — không thuộc phạm vi
- Tự động tạo đơn vị theo dự án — không thuộc phạm vi

---

## 9. Yêu cầu phi chức năng

### 9.1. Hiệu năng

- Cột `rank` không dùng làm bộ lọc/tìm kiếm → không thêm index mới; không tăng chi phí truy vấn danh sách.
- Tránh N+1 khi dựng cây; tận dụng `path` cho truy vấn phân cấp.

### 9.2. Khả năng mở rộng

- Phân cấp tối đa 3 cấp; `rank` (cấp quản lý) độc lập với `level` (độ sâu cây).
- Schema thay đổi qua migration Flyway (one-way-door C3), idempotent cho môi trường dev-local (`OrgUnitSchemaMigrator` dùng `IF NOT EXISTS`).

### 9.3. Bảo mật

- Phân quyền RBAC được áp dụng trên tất cả các API liên quan (`orgunit:manage` / `orgunit:read`).
- Jakarta Validation (`@NotNull`, `@Size`, ...) trên DTO; không có permission mới.

### 9.4. Độ tin cậy

- Xóa mềm (soft delete), không xóa cứng khi có dữ liệu liên quan.
- Audit qua `unit_history` (sự kiện **CREATED** khi tạo mới — giữ nguyên).
- Migration chạy một lần (Flyway); backfill theo `level` đảm bảo 100% dòng cũ có `rank` hợp lệ.

### 9.5. Trải nghiệm người dùng

- Giao diện responsive: trên điện thoại (dưới 768px), thanh menu thu gọn.
- Có loading skeleton khi đang tải dữ liệu; có trạng thái rỗng (empty state) với hướng dẫn thân thiện.
- Tuân thủ tiêu chuẩn trợ năng WCAG 2.1 AA.

### 9.6. Tuân thủ pháp lý

- Tên cột/field/identifier dùng tiếng Anh chuẩn (`rank`, `OrgUnitRank`, `RANK_OPTIONS`, `RANK_LABELS`); toàn bộ text hiển thị UI dùng tiếng Việt có dấu (BR-013..BR-020 theo AGENTS.md naming convention).

---

## 10. Yêu cầu giao diện người dùng

> **Nguyên tắc cốt lõi:** Mọi giá trị màu sắc, khoảng cách, kích thước chữ trong giao diện đều được định nghĩa tập trung tại 2 file `frontend/src/theme.ts` (layout, màu nền sidebar/header) và `frontend/src/tokens.ts` (màu chữ, màu trạng thái, thang số). Tuyệt đối không hardcode giá trị hex hay pixel trong component.

### 10.1. Bố cục chung

Màn hình Quản lý đơn vị dùng chung bố cục toàn hệ thống (`AppLayout.tsx`):

- **Thanh menu trái (sidebar):** dùng `colors.sidebarBg`, mục đang chọn dùng token accent của theme; khi thu gọn (trên điện thoại) rộng 80px và chuyển thành nút hamburger.
- **Thanh tiêu đề trên cùng (header):** cao 64px, nền trắng, chứa tên người dùng và avatar.
- **Vùng nội dung chính:** nền `surfacePage`, giúp các card trắng (`surfaceCard`) bên trong nổi bật hơn.

### 10.2. Hệ thống màu sắc

Mỗi màu sắc trong giao diện được gán một "vai trò" rõ ràng. Developer không được dùng màu theo cảm tính mà phải import đúng token từ `tokens.ts` / `theme.ts`:

| Khi cần... | Dùng token |
|---|---|
| Tiêu đề trang, số liệu quan trọng | `textPrimary` |
| Nhãn field, mô tả | `textSecondary` |
| Thời gian, trạng thái phụ, caption | `textTertiary` |
| Nền card, modal, bảng | `surfaceCard` |
| Nền vùng nội dung chính | `surfacePage` |
| Viền card, đường kẻ | `borderDefault` |
| Nút chính, link | `actionPrimary` |
| Trạng thái vận hành Sử dụng / Không sử dụng | `statusOperational` / `statusCritical` (hoặc token trạng thái tương ứng) |

### 10.3. Thang số — chỉ dùng giá trị cho phép

**Khoảng cách (spacing):** 4, 8, 12, 16, 24, 32 (px) — 12px là khoảng cách mặc định giữa các trường trong form (`spaceFormField`), 16px là padding mặc định của card (`spaceMd`).

**Bo góc (radius):** 4, 8, 12, 999 (px) — 999px dạng pill (`radiusPill`) dùng cho input, select, button.

**Cỡ chữ (font size):** 11, 13, 15, 20, 28 (px) — nhãn/nội dung dùng `fontSizeSm`/`fontSizeMd`, tiêu đề dùng `fontSizeLg`/`fontSizeStat`.

**Độ đậm chữ (font weight):** 400 (nội dung), 500 (nhãn, nút), 600 (số liệu quan trọng, tiêu đề).

**Font chữ:** `'Inter', -apple-system, BlinkMacSystemFont, sans-serif` cho toàn bộ văn bản.

> **Cấm tuyệt đối:** dùng giá trị ngoài thang số (spacing 6/10/14/18, radius 6/7/10, font-size 12/14/16/24, weight 450/550/700).

### 10.4. Style có sẵn — dùng lại, đừng tự chế

- **Thời gian, caption:** dùng `metaStyle`
- **Card nội dung:** dùng `cardStyle`
- **Tag trạng thái:** dùng `badgeBaseStyle`
- **Link, nút text:** dùng `actionStyle`
- **Đường kẻ ngăn cách:** dùng `dividerStyle`
- Pattern lặp ≥ 3 lần → báo PMO để thêm preset mới vào `tokens.ts`, không copy-paste.

### 10.5. Giới hạn màu nhấn — tối đa 3 lần mỗi màn

Màu `actionPrimary` là màu nhấn mạnh nhất, dùng cho các hành động chính; xuất hiện tối đa 3 lần trên toàn bộ màn hình Quản lý đơn vị: (1) nút "Thêm mới" trên `ScreenHeader`; (2) nút "Lưu" trong drawer/form; (3) link "Xem chi tiết" (nếu có). Các màu trạng thái và màu chữ không tính vào giới hạn này.

### 10.6. Màn hình danh sách (Cấu trúc cây đơn vị)

Màn hình chính sử dụng các component dùng chung toàn hệ thống từ `frontend/src/components/list-view/` — không được tự tạo lại:

1. **ScreenHeader:** breadcrumb "Quản trị hệ thống > Quản lý đơn vị" + nút "Thêm mới" (hành động chính).
2. **FilterBar:** ô tìm kiếm theo tên/mã + nút Tìm kiếm/Reload.
3. **StatusTabs:** tab theo trạng thái vận hành (Tất cả / Sử dụng / Không sử dụng), mỗi tab hiển thị số lượng. Tab đang chọn có đường gạch chân màu `actionPrimary`.
4. **DataTable:** bảng dữ liệu với tiêu đề cột cố định khi cuộn (sticky header), dòng được tô sáng khi di chuột (hover row). Các cột hiển thị:

| Cột | Nội dung | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Ghi chú |
|---|---|---|---|---|---|---|
| STT | Số thứ tự dòng | Text (tự động) | Không | Có | Tự động đánh số | |
| Tên đơn vị | Tên đơn vị | Text | Không | Có | — | |
| Mã đơn vị | Mã đơn vị | Text | Không | Có | — | |
| Cấp đơn vị | Cấp {level} (độ sâu cây) | Text | Không | Có | Tự động | Không hiển thị rank (BR-020) |
| Trạng thái | Sử dụng / Không sử dụng | Tag | Không | Có | — | Theo `operational_status` |
| Thao tác | Xem / Sửa / Xóa | Dropdown | Không | — | — | Cột cuối, cố định bên phải |

5. **Pagination:** thanh điều hướng trang ở cuối bảng, hiển thị tổng số dòng và số trang.

### 10.7. Drawer/Modal (Tạo mới / Chỉnh sửa / Xem chi tiết / Xác nhận xóa)

- **Drawer Tạo mới / Chỉnh sửa:** form 8 trường (Tên đơn vị, Mã đơn vị, Đơn vị cha — TreeSelect, Địa điểm Tỉnh/TP, Địa điểm chi tiết, Số điện thoại, Trạng thái — Sử dụng/Không sử dụng, **Cấp đơn vị — Select bắt buộc** từ `RANK_OPTIONS`); nút Lưu luôn enable, validate khi nhấn.
- **Drawer Xem chi tiết:** 8 trường thông tin dạng read-only (nhãn `textSecondary`, giá trị `textPrimary`; "Cấp đơn vị" = `RANK_LABELS[rank]`, null → "—") + thanh thao tác (Sửa, Xóa, Quay lại).
- **Modal Xác nhận xóa:** cảnh báo ràng buộc; nút Hủy (outlined) + Xóa (danger), cả hai dạng pill (`radiusPill`, `height: 40`).
- Form.Item `marginBottom: spaceFormField`; Input/Select `borderRadius: radiusPill`, `height: 40`; label dùng `labelProps()`.

### 10.8. Các trạng thái giao diện

Giao diện phải xử lý đầy đủ các trạng thái sau:

- **Đang tải:** hiển thị spinner của Ant Design hoặc khung xương (skeleton) — không hiển thị bảng trống gây hiểu nhầm là không có dữ liệu.
- **Không có dữ liệu:** hiển thị biểu tượng và dòng chữ "Không có đơn vị nào" với màu chữ `textSecondary` và cỡ chữ `fontSizeMd`; bảng rỗng vẫn giữ chiều cao thân bảng theo `--list-table-scroll-y`.
- **Lỗi tải dữ liệu:** hiển thị cảnh báo đỏ và nút "Thử lại" màu `actionPrimary`.

### 10.9. Phân quyền hiển thị

Giao diện tự động ẩn/hiện các thành phần dựa trên vai trò người dùng:

| Vai trò | Thấy thành phần nào | Ghi chú |
|---|---|---|
| system-admin | Toàn bộ màn hình + nút thao tác (Thêm mới, Sửa, Xóa) | |
| admin (Security) | Theo phân quyền hệ thống | |
| admin-operation | Theo phân quyền hệ thống | |
| admin thường / Cán bộ | Danh sách/cây + nút thao tác theo quyền được cấp | |
| Lãnh đạo | Danh sách/cây, xem chi tiết — không có nút thao tác | |
| Cá nhân | Chỉ đơn vị của mình | |
| Admin Cục | Xem full dữ liệu + thông tin người tạo, người sửa, thời gian tạo, thời gian cập nhật | Logic đặc biệt (xem mục 2.2) |

### 10.10. Giao diện trên điện thoại

Khi màn hình nhỏ hơn 768px:

- Thanh menu trái thu gọn thành nút hamburger 80px
- Bảng dữ liệu chuyển thành dạng thẻ (card)
- Thanh lọc chuyển thành panel có thể gập/mở
- Modal thu nhỏ còn 90% chiều rộng màn hình
