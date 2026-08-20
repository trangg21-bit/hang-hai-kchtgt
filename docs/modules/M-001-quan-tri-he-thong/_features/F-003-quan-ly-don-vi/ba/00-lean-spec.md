---
feature-id: F-003
document: lean-spec
output-mode: lean
last-updated: 2026-08-17T00:00:00Z
---

# Feature F-003: Quản lý đơn vị — Lean Business Analysis Spec

## 1. Summary

| Field | Value |
|---|---|
| Feature ID | F-003 |
| Feature Name | Quản lý đơn vị |
| Slug | quan-ly-don-vi |
| Module | M-001 (Quản trị hệ thống) |
| Classification | local |
| Priority | high |
| Complexity | Simple (8 business rules, 1 actor) |
| Tech Stack | Spring Boot + Spring Security + JWT + ReactJS + MSSQL 2022 |

**Business Intent:** Quản lý cấu trúc tổ chức đơn vị hành chính theo hệ thống phân cấp tối đa 3 cấp, bao gồm tạo mới, chỉnh sửa, xóa và tra cứu thông tin đơn vị.

**Scope expansion TRI-1786936397148-3956:** bổ sung Cấp đơn vị (rank — enum `OrgUnitRank` lưu SMALLINT) chọn được khi tạo/sửa và hiển thị khi xem chi tiết; chi tiết tại `docs/modules/M-001-quan-tri-he-thong/ba/00-lean-spec.md`.

---

## 2. Scope

### In Scope

| # | Capability | Description |
|---|---|---|
| 1 | Xem cây cấu trúc đơn vị | Hiển thị cây phân cấp (tối đa 3 cấp), hỗ trợ expand/collapse (trừ cấp 3) |
| 2 | Tạo đơn vị mới | Tên, mã (unique), đơn vị cha (không bắt buộc), tỉnh/thành phố, địa chỉ, SĐT, trạng thái |
| 3 | Chỉnh sửa đơn vị | Cập nhật tên, đơn vị cha, địa điểm, SĐT, trạng thái |
| 4 | Xóa đơn vị | Chỉ xóa khi không có đơn vị con và không có người dùng trực thuộc |
| 5 | Xem chi tiết đơn vị | Hiển thị toàn bộ thông tin đơn vị (chế độ chỉ xem) |
| 6 | Tìm kiếm và lọc | Tìm theo tên/mã |
| 7 | Chọn Cấp đơn vị (rank) | Chọn Cục / Chi cục/ Cảng vụ/ Công ty bảo đảm / Đại diện khi tạo/sửa; hiển thị read-only ở chi tiết — scope expansion TRI-1786936397148-3956 |

### Out of Scope

| # | Capability | Reason |
|---|---|---|
| 1 | Di chuyển đơn vị | Không thuộc phạm vi |
| 2 | Quản lý nhân sự trực thuộc | Thuộc F-001 (User Management) |
| 3 | Phân cấp quá 3 cấp | Giới hạn nghiệp vụ |
| 4 | Xuất báo cáo org chart | Không yêu cầu |
| 5 | Hệ số (coefficient) | Không thuộc phạm vi |

---

## 3. Actors & Permissions

| Actor | Access |
|---|---|
| Người dùng được phân quyền | Xem, tạo, sửa, xóa đơn vị (theo phân quyền hệ thống) |

Quyền hạn cụ thể (xem, tạo, sửa, xóa) theo phân quyền hệ thống.

---

## 4. User Stories (MoSCoW)

| ID | Story | Priority |
|---|---|---|
| US-003-01 | Là người dùng được phân quyền, tôi muốn xem cây cấu trúc đơn vị phân cấp để nắm được tổ chức hệ thống | Must |
| US-003-02 | Là người dùng có quyền tạo, tôi muốn tạo đơn vị mới với tên, mã, địa điểm, SĐT và trạng thái | Must |
| US-003-03 | Là người dùng có quyền sửa, tôi muốn chỉnh sửa thông tin đơn vị | Must |
| US-003-04 | Là người dùng có quyền xóa, tôi muốn xóa đơn vị khi không còn ràng buộc | Should |
| US-003-06 | Là người dùng, tôi muốn xem chi tiết đơn vị để biết đầy đủ thông tin | Should |
| US-003-07 | Là người dùng, tôi muốn tìm kiếm và lọc đơn vị theo tên/mã | Must |

---

## 5. Acceptance Criteria

| ID | Criterion | Negative Path |
|---|---|---|
| AC-003-01 | Mã đơn vị (code) phải duy nhất trong toàn hệ thống; không được trùng khi tạo mới | Tạo với mã đã tồn tại → "Mã đơn vị đã tồn tại" |
| AC-003-02 | Không cho phép tạo vòng lặp phân cấp (circular reference) | Chọn chính nó hoặc đơn vị con làm cha → lỗi |
| AC-003-03 | Đơn vị cha không bắt buộc; để trống → đơn vị cấp cao nhất | Tạo không chọn cha → level=1 |
| AC-003-04 | Hệ thống phân cấp giới hạn tối đa 3 cấp | Cố gắng tạo cấp 4 → lỗi |
| AC-003-05 | Không cho phép xóa đơn vị còn đơn vị con hoặc có người dùng trực thuộc | Xóa đơn vị có ràng buộc → lỗi kèm thông báo cụ thể |
| AC-003-06 | Cấp bậc (level) được tính tự động theo độ sâu trong cây | Tạo đơn vị con → level = level cha + 1 |
| AC-003-07 | Tên đơn vị không được để trống, tối đa 200 ký tự | Để trống → "Tên đơn vị không được để trống" |
| AC-003-08 | Đơn vị cấp 3 không có chức năng collapse/expand trên cây | Cấp 3 → không hiển thị mũi tên mở rộng |
| AC-003-09 | Enum OrgUnitRank đúng 3 giá trị theo thứ tự CUC(0), CHI_CUC_CANG_VU_CONG_TY_BAO_DAM(1), DAI_DIEN(2); OrgUnitRankConverter (@Converter autoApply) map SMALLINT ordinal | Ordinal ngoài 0..2 → null (range-guard) |
| AC-003-10 | Migration V20260817100000__add_org_unit_rank.sql: ADD COLUMN rank SMALLINT NOT NULL DEFAULT 0 → backfill level≤1→0 / level=2→1 / else→2 → DROP DEFAULT | Dữ liệu cũ giữ nguyên, mọi dòng có rank hợp lệ |
| AC-003-11 | OrgUnitSchemaMigrator bổ sung cột rank (ADD COLUMN IF NOT EXISTS rank SMALLINT NOT NULL DEFAULT 0) cho dev-local không chạy Flyway | Chạy lại không lỗi (idempotent) |
| AC-003-12 | create(): rank = request.getRank() nếu gửi, else suy từ cha (cha null→CUC; cha level==1→CHI_CUC_CANG_VU_CONG_TY_BAO_DAM; else→DAI_DIEN) | — |
| AC-003-13 | update(): rank chỉ được set khi request.getRank() != null (partial update) | Body không gửi rank → giữ giá trị cũ |
| AC-003-14 | Entity OrgUnit có field rank @Column(columnDefinition = "SMALLINT"); OrgUnitResponse.rank + from() map .rank(entity.getRank()) | — |
| AC-003-15 | Select "Cấp đơn vị" bắt buộc ở tạo/sửa (drawer UnitList + form UnitForm), options từ RANK_OPTIONS | Không chọn → "Vui lòng chọn cấp đơn vị", không gọi API |
| AC-003-16 | RANK_OPTIONS + RANK_LABELS export từ organizationService.ts; mọi mapper map rank; body create/update gửi rank | — |
| AC-003-17 | Xem chi tiết hiển thị dòng "Cấp đơn vị" = RANK_LABELS[rank] | rank null → "—" |
| AC-003-18 | Cột danh sách "Cấp đơn vị" (Cấp {level}) và enum OrgUnitType giữ nguyên không đổi | — |
| AC-003-19 | mvn clean compile -q và npx tsc --noEmit đều pass | — |

---

## 6. Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-003-01 | Mã đơn vị (code) phải là duy nhất trong toàn hệ thống | Tạo/Sửa đơn vị | Dữ liệu master |
| BR-003-02 | Không cho phép tạo vòng lặp phân cấp (circular reference) | Phân cấp | Integrity constraint |
| BR-003-03 | Đơn vị gốc không có đơn vị cha; không chọn đơn vị cha khi tạo → đơn vị cấp cao nhất | Tạo đơn vị | Nghiệp vụ |
| BR-003-04 | Hệ thống phân cấp giới hạn tối đa 3 cấp | Phân cấp | Nghiệp vụ |
| BR-003-05 | Không cho phép xóa đơn vị còn đơn vị con hoặc có người dùng trực thuộc | Xóa đơn vị | Integrity constraint |
| BR-003-06 | Cấp bậc (level) được tính tự động theo độ sâu trong cây | Tính toán level | Business logic |
| BR-003-07 | Tên đơn vị không được để trống, tối đa 200 ký tự | Validation | UI/UX |
| BR-003-08 | Trên cây đơn vị, đơn vị cấp nhỏ nhất (cấp 3) không có chức năng collapse/expand | Hiển thị cây | UI/UX |
| BR-003-09 | Cấp đơn vị (rank) lưu SMALLINT theo ordinal enum OrgUnitRank (0/1/2) qua OrgUnitRankConverter autoApply | Entity/DB | Scope expansion TRI-1786936397148-3956 |
| BR-003-10 | Miền giá trị rank cố định 3 giá trị; ordinal ngoài khoảng hoặc null → entity nhận null | Converter | Pattern converter autoApply |
| BR-003-11 | Dữ liệu cũ backfill một lần theo level (≤1→0, =2→1, else→2) trong Flyway V20260817100000__add_org_unit_rank.sql; DROP DEFAULT sau backfill; OrgUnitSchemaMigrator thêm cột cho dev-local | Migration | done_oracle TRI-1786936397148-3956 |
| BR-003-12 | Tạo đơn vị: rank = request.getRank() nếu gửi, else suy từ cha (cha null→CUC; cha level==1→CHI_CUC_CANG_VU_CONG_TY_BAO_DAM; else→DAI_DIEN) | Tạo đơn vị | Scope expansion TRI-1786936397148-3956 |
| BR-003-13 | Sửa đơn vị là partial update: rank chỉ set khi request.getRank() != null | Sửa đơn vị | Scope expansion TRI-1786936397148-3956 |
| BR-003-14 | Identifier dùng tiếng Anh chuẩn (rank, OrgUnitRank, RANK_OPTIONS, RANK_LABELS); nhãn UI tiếng Việt có dấu (Cấp đơn vị, Cục, Chi cục/ Cảng vụ/ Công ty bảo đảm, Đại diện) | Toàn module | AGENTS.md naming convention |
| BR-003-15 | rank độc lập với level (độ sâu cây); cột danh sách "Cấp đơn vị" (Cấp {level}) giữ nguyên, không hiển thị rank trong bảng | List UI | Brief exclusions TRI-1786936397148-3956 |
| BR-003-16 | Enum deprecated OrgUnitType + OrgUnitTypeConverter không sửa/khôi phục; rank không suy ra từ unitType | Toàn module | Brief exclusions TRI-1786936397148-3956 |

---

## 7. Entities

| Entity | Key Fields | Notes |
|---|---|---|
| **Đơn vị** | id, name, code (unique), parent_id (nullable FK), level (tự tính theo cây), rank (SMALLINT — Cấp đơn vị: Cục/Chi cục/ Cảng vụ/ Công ty bảo đảm/Đại diện), operational_status (Sử dụng/Không sử dụng), province, address, detail_address, phone, path, sort_order, contact_person, created_at, updated_at, deleted_at | Bảng chính `org_units`, tự tham chiếu qua parent_id |

Trạng thái vận hành (operational_status):
| Giá trị | Mô tả |
|---|---|
| Sử dụng | Đơn vị đang hoạt động |
| Không sử dụng | Đơn vị ngừng hoạt động |

> Kiểm toán: bảng `unit_history` ghi sự kiện **CREATED** khi tạo mới đơn vị (audit tạo mới — giữ nguyên).

---

## 8. Screens Summary

| Màn hình | Mô tả |
|---|---|
| Cấu trúc cây đơn vị | Cây phân cấp + tìm kiếm/lọc + thao tác trên dòng (Xem, Sửa, Xóa) |
| Xem chi tiết | 8 trường thông tin (Label, thêm Cấp đơn vị) + thanh thao tác (Sửa, Xóa, Quay lại) |
| Tạo mới / Chỉnh sửa | Form 8 trường (thêm Cấp đơn vị) + nút Lưu (luôn enable, validate khi nhấn) |
| Xác nhận xóa | Modal cảnh báo ràng buộc |

---

## 9. Form Fields (Tạo mới / Chỉnh sửa)

| # | Field | Type | Required | Notes |
|---|---|---|---|---|
| 1 | Tên đơn vị | Textbox | Có | 2-200 ký tự |
| 2 | Mã đơn vị | Textbox | Có (tạo) / Không (sửa) | 2-30 ký tự, unique, chỉ sửa khi tạo |
| 3 | Đơn vị cha | Tree Selector | Không | Để trống = cấp cao nhất |
| 4 | Địa điểm (Tỉnh/TP) | Dropdown | Có | Danh mục hành chính |
| 5 | Địa điểm chi tiết | Textbox | Không | Tối đa 500 ký tự |
| 6 | Số điện thoại | Textbox | Không | 10-11 chữ số |
| 7 | Trạng thái | Dropdown | Có | Sử dụng / Không sử dụng. Mặc định: Sử dụng (tạo mới). |
| 8 | Cấp đơn vị | Dropdown (Select) | Có | Cục / Chi cục/ Cảng vụ/ Công ty bảo đảm / Đại diện (RANK_OPTIONS); pre-populate rank khi sửa — scope expansion TRI-1786936397148-3956 |
| — | Nút Lưu | Button | — | Luôn enable, validate khi nhấn |

---

## 10. Test Scenarios

| ID | Scenario | Expected Result |
|---|---|---|
| TS-003-01 | Tạo đơn vị với mã unique | Đơn vị được tạo, level tự động tính |
| TS-003-02 | Tạo đơn vị với mã trùng | Lỗi "Mã đơn vị đã tồn tại" |
| TS-003-03 | Tạo đơn vị không chọn đơn vị cha | Đơn vị cấp cao nhất, level=1 |
| TS-003-04 | Tạo đơn vị cấp 4 | Lỗi "Vượt quá 3 cấp" |
| TS-003-05 | Xóa đơn vị có đơn vị con | Lỗi kèm số lượng đơn vị con |
| TS-003-06 | Xóa đơn vị có người dùng | Lỗi "đang có người dùng trực thuộc" |
| TS-003-07 | Xóa đơn vị không ràng buộc | Xóa thành công |
| TS-003-08 | Cây hiển thị đúng 3 cấp, cấp 3 không expand | Kiểm tra UI |
| TS-003-09 | Tìm kiếm theo tên/mã | Kết quả chính xác |

---

## 11. Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Q1: Creates new domain elements? | Yes | Entity Đơn vị với self-referencing FK |
| Q2: Affects system architecture? | No | Sử dụng stack hiện có |
| Q3: Approach clear from existing architecture? | Yes | Tree pattern đơn giản |

**Triage Verdict:** Route to engineering-system-architect (Q1=Yes).
