---
id: F-003
name: Quản lý đơn vị
slug: quan-ly-don-vi
module-id: M-001
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-20
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý đơn vị

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-003
**Module:** M-001 — Quản trị hệ thống
**Loại:** chức năng thường (không có bước phê duyệt)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (TKCT)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

---

## 1. Mô tả ngắn

Quản lý tổ chức đơn vị phân cấp của hệ thống (Cục, Chi cục, Cảng vụ, Trung tâm): tạo mới, chỉnh sửa, xóa mềm, xây dựng cây cấu trúc tổ chức tối đa 3 cấp và tra cứu thông tin đơn vị. Mỗi đơn vị mang thuộc tính **Cấp đơn vị (rank)** — Cục / Chi cục / Cảng vụ / Công ty bảo đảm / Đại diện (scope expansion TRI-1786936397148-3956). Trạng thái duy nhất của đơn vị là **trạng thái vận hành** (`operational_status`: Sử dụng / Không sử dụng).

## 2. Trường dữ liệu

### 2.1. Form Tạo mới / Chỉnh sửa đơn vị (drawer dùng chung — 8 trường)

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Tên đơn vị | Có | Text, max 200 ký tự | AC-003-07 |
| 2 | Mã đơn vị | Có | Text, 2-30 ký tự, unique toàn hệ thống | AC-003-01, BR-013; read-only khi sửa |
| 3 | Đơn vị cha | Không | TreeSelect dạng cây (parentId) | Để trống = cấp cao nhất (AC-003-03) |
| 4 | Cấp đơn vị (rank) | Có | Select: Cục / Chi cục / Cảng vụ / Công ty bảo đảm / Đại diện | AC-003-15; BR-018/019 |
| 5 | Địa điểm Tỉnh/TP | Không | Select (province) | — |
| 6 | Địa chỉ chi tiết | Không | Text | — |
| 7 | Số điện thoại | Không | Text | — |
| 8 | Trạng thái vận hành | Có | Select: Sử dụng / Không sử dụng; default Sử dụng | SMALLINT (1/0) |

> Khi sửa: rank chỉ được set khi request gửi non-null (partial update — BR-020).

## 3. Trạng thái và phê duyệt

- Trạng thái duy nhất: `operational_status` (SMALLINT: 1=Sử dụng, 0=Không sử dụng), mặc định Sử dụng.
- **Không có bước phê duyệt** — luồng phê duyệt đơn vị đã bị loại bỏ (scope-shrink TRI-1786950754582-5a51).
- Không xóa cứng — xóa mềm (`deleted_at`).

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-013 | Mã đơn vị phải unique toàn hệ thống | Create/Update |
| BR-014 | Không được xóa đơn vị còn đơn vị con hoặc có người dùng trực thuộc | Delete |
| BR-016 | Đơn vị phân cấp cha/con (tree), tối đa 3 cấp | Hierarchy |
| BR-018 | Cấp đơn vị (rank) lưu SMALLINT theo ordinal enum `OrgUnitRank` (0=Cục, 1=Chi cục/Cảng vụ/Công ty bảo đảm, 2=Đại diện) qua `OrgUnitRankConverter` (`@Converter(autoApply=true)`) | Create/Update |
| BR-019 | Tạo đơn vị: rank = request.getRank() nếu gửi, else suy từ cha (cha null → CUC; cha level==1 → CHI_CUC_CANG_VU_CONG_TY_BAO_DAM; else → DAI_DIEN); dữ liệu cũ backfill một lần theo level (≤1→0, =2→1, else→2) qua Flyway `V20260817100000__add_org_unit_rank.sql` | Create |
| BR-020 | Sửa đơn vị là partial update: rank chỉ set khi non-null; cột danh sách "Cấp đơn vị" (tree level `Cấp {level}`) và enum `OrgUnitType` giữ nguyên không đổi | Update |

### 4.2. Acceptance Criteria kế thừa (AC-003-01..AC-003-19)

- **AC-003-01** — Mã đơn vị duy nhất: code phải duy nhất toàn hệ thống; trùng khi tạo → thông báo "Mã đơn vị đã tồn tại".
- **AC-003-02** — Chống vòng lặp phân cấp: không cho chọn chính nó hoặc đơn vị con làm cha → lỗi.
- **AC-003-03** — Đơn vị cha không bắt buộc: để trống → đơn vị cấp cao nhất (level=1).
- **AC-003-04** — Giới hạn 3 cấp: cố gắng tạo cấp 4 → lỗi.
- **AC-003-05** — Ràng buộc xóa: không xóa đơn vị còn đơn vị con hoặc có người dùng trực thuộc → lỗi kèm thông báo cụ thể.
- **AC-003-06** — Level tự động: level = level cha + 1 (root=1).
- **AC-003-07** — Tên đơn vị bắt buộc, tối đa 200 ký tự; để trống → "Tên đơn vị không được để trống".
- **AC-003-08** — Cây cấp 3 không có chức năng collapse/expand (không hiển thị mũi tên mở rộng).
- **AC-003-09** — Enum `OrgUnitRank` đúng 3 giá trị theo thứ tự CUC(0), CHI_CUC_CANG_VU_CONG_TY_BAO_DAM(1), DAI_DIEN(2); `OrgUnitRankConverter` map SMALLINT ordinal; ordinal ngoài 0..2 → null (range-guard).
- **AC-003-10** — Migration `V20260817100000__add_org_unit_rank.sql`: ADD COLUMN rank SMALLINT NOT NULL DEFAULT 0 → backfill level≤1→0 / level=2→1 / else→2 → DROP DEFAULT.
- **AC-003-11** — `OrgUnitSchemaMigrator` bổ sung cột rank cho dev-local không chạy Flyway (idempotent).
- **AC-003-12** — create(): rank = request.getRank() nếu gửi, else suy từ cha (cha null → CUC; cha level==1 → CHI_CUC_CANG_VU_CONG_TY_BAO_DAM; else → DAI_DIEN).
- **AC-003-13** — update() partial: rank chỉ set khi request.getRank() != null.
- **AC-003-14** — Entity `OrgUnit` có field `rank` `@Column(columnDefinition = "SMALLINT")`; `OrgUnitResponse` có `rank` + `from()` map `.rank(entity.getRank())`.
- **AC-003-15** — Select "Cấp đơn vị" bắt buộc ở tạo/sửa (options từ `RANK_OPTIONS`); không chọn → "Vui lòng chọn cấp đơn vị", không gọi API.
- **AC-003-16** — `RANK_OPTIONS` + `RANK_LABELS` export từ `organizationService.ts`; mọi mapper map `rank`; body create/update gửi `rank`.
- **AC-003-17** — Xem chi tiết hiển thị dòng "Cấp đơn vị" = `RANK_LABELS[rank]`; rank null → "—".
- **AC-003-18** — Cột danh sách "Cấp đơn vị" (`Cấp {level}`) và enum `OrgUnitType` giữ nguyên không đổi.
- **AC-003-19** — `mvn clean compile -q` và `npx tsc --noEmit` đều pass.

### 4.3. User Stories kế thừa (US-003-01..US-003-10)

**Mức Must:**
- **US-003-01:** Xem cây cấu trúc đơn vị phân cấp để nắm tổ chức hệ thống.
- **US-003-02:** Tạo đơn vị mới với tên, mã, địa điểm, SĐT và trạng thái vận hành.
- **US-003-03:** Chỉnh sửa thông tin đơn vị.
- **US-003-07:** Tìm kiếm và lọc đơn vị theo tên/mã.
- **US-003-08:** Chọn "Cấp đơn vị" khi tạo đơn vị mới để gán đúng cấp quản lý.
- **US-003-09:** Chỉnh sửa và xem "Cấp đơn vị" trong drawer sửa/chi tiết.

**Mức Should:**
- **US-003-04:** Xóa đơn vị khi không còn ràng buộc.
- **US-003-06:** Xem chi tiết đơn vị để biết đầy đủ thông tin.
- **US-003-10:** Dữ liệu đơn vị cũ vẫn hiển thị đúng sau nâng cấp (backfill theo cấp cây).

**Mức Could:** Không có.

### 4.4. Phân quyền riêng

| Thao tác | Quyền |
|---|---|
| Xem cây / danh sách / chi tiết / tìm kiếm đơn vị | `orgunit:read` |
| Tạo / Sửa / Xóa đơn vị | `orgunit:manage` |
| Danh sách đơn vị (directory/options, cache frontend) | `isAuthenticated()` (đã đăng nhập) |

**Admin Cục:** mặc định theo tài liệu nền mục 3.8 — full quyền + xem thêm metadata (người tạo, người sửa cuối, thời gian tạo/cập nhật); các tài khoản khác không thấy các trường này.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — `operational_status`: Sử dụng / Không sử dụng (mặc định Sử dụng) |
| 2 | Có bước phê duyệt không | Không |
| 3 | Lọc cha-con / theo đơn vị | Có — đơn vị phân cấp cha/con (TreeSelect); hiển thị dạng cây 3 cấp |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — rank chỉ nhập khi tạo; khi sửa chỉ set khi gửi non-null; cấp 3 không expand/collapse |
| 5 | Quyền riêng | `orgunit:read`, `orgunit:manage` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Có — danh sách hiển thị dạng cây (tree) 3 cấp có expand/collapse; cột "Cấp đơn vị" hiển thị `Cấp {level}` |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/org-units` | Danh sách đơn vị (phân trang) | `isAuthenticated()` |
| GET | `/api/org-units/options` | Directory list (cache frontend) | `isAuthenticated()` |
| GET | `/api/org-units/tree` | Cây tổ chức | `orgunit:read` |
| GET | `/api/org-units/{id}` | Chi tiết đơn vị | `orgunit:read` |
| GET | `/api/org-units/search` | Tìm kiếm theo tên/mã | `orgunit:read` |
| POST | `/api/org-units` | Tạo đơn vị mới (gửi `rank`; thiếu thì suy từ cha — BR-019) | `orgunit:manage` |
| PUT | `/api/org-units/{id}` | Chỉnh sửa đơn vị (partial update — BR-020) | `orgunit:manage` |
| DELETE | `/api/org-units/{id}` | Xóa mềm đơn vị | `orgunit:manage` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `org_units` (đơn vị):** id (UUID PK), name (VARCHAR(200) NOT NULL), code (VARCHAR(50) UNIQUE NOT NULL), parent_id (UUID FK → org_units, NULL = cấp cao nhất), operational_status (SMALLINT NOT NULL DEFAULT 1), level (INT NOT NULL — tự tính), 🔴 rank (SMALLINT NOT NULL — 0=Cục, 1=Chi cục/Cảng vụ/Công ty bảo đảm, 2=Đại diện), province (FK → provinces), path + sort_order (truy vấn cây Materialized Path), detail_address / address / phone / contact_person, created_at / updated_at / deleted_at (soft delete).

**Bảng `unit_history` (lịch sử thay đổi):** id, unit_id (FK → org_units), action (ghi CREATED khi tạo mới đơn vị), performed_by, performed_at, notes.

**Bảng `organization_chart` (cây tổ chức):** id, unit_id (FK → org_units, unique), parent_id (FK → org_units), level, sort_order, effective_date.

> Ghi chú: cột `coefficient` đã được loại bỏ khỏi schema (migration V44 drop column + check constraint `chk_org_unit_coefficient_positive`).
