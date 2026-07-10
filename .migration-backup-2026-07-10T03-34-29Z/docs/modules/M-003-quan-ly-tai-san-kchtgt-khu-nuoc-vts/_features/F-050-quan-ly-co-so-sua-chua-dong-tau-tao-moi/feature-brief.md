---
id: F-050
name: "Quan ly Co so sua chua, dong tau - Tao moi"
slug: quan-ly-co-so-sua-chua-dong-tau-tao-moi
module-id: M-003
status: proposed
classification: local
priority: P0
created: "2026-06-29T00:00:00Z"
last-updated: "2026-06-29T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quan ly Co so sua chua, dong tau - Tao moi

## Description
Chuyen vien co the tao moi co so sua chua, dong tau. Co so sua chua, dong tau phai duoc phe duyet truoc khi chinh thuc ghi nhan. Du lieu sau khi tao mac dinh co trang thai PROPOSED, chuyen vien co the cap nhat tai lieu, sau do gui cho phe duyet 2 cap: phong (C1) → Cuc (C2). Thong tin co so sua chua, dong tau bao gom ten co so, dia chi, loai hinh dich vu (sua chua hoac dong moi), nang luc tiep nhan tau, trang thiet bi chinh, dien tich, so dien thoai, email, va ghi chu (tuy chon).

## Business Intent
Ky luong thong tin co so sua chua, dong tau tai cac khu vuc khu nuoc & VTS, phuc vu cong tac quan ly tai san KCHTGT. Thong tin co so sua chua, dong tau bao gom ten co so, dia chi, loai hinh dich vu (sua chua/dong moi), nang luc tiep nhan DWT, trang thiet bi chinh, dien tich, so dien thoai, email, va ghi chu.

## Flow Summary
1. Chuyen vien truy cap module Co so sua chua, dong tau → nut "Tao moi"
2. Chuyen vien nhap thong tin: ten_co_so (buoc), dia_chi (buoc), loai_hinh_dv (buoc: sua_chua/dong_moi), nang_luc_tiep_nhan (buoc, > 0), trang_bi_chinh, dien_tich, so_dien_thoai (optional, format VND/international), email (optional, format email hop le), ghi_chu (tuy chon)
3. He thong kiem tra buoc: ten_co_so (max 200 ky tu), dia_chi (max 500 ky tu), loai_hinh_dv (co gia tri), nang_luc_tiep_nhan (> 0), dien_tich (>= 0, optional)
4. He thong luu du lieu voi trang thai = PROPOSED
5. Chuyen vien gui cho phe duyet → Ban ghi cho phe duyet tai cap phong (C1)
6. Sau phe duyet C1 thanh cong → trang thai chuyen thanh UNDER_REVIEW
7. Sau phe duyet C2 thanh cong → trang thai chuyen thanh APPROVED, chinh thuc ghi nhan

## Acceptance Criteria
- [x] Tao moi Co so sua chua, dong tau thanh cong
- [x] Trang thai mac dinh = PROPOSED sau khi tao
- [x] Ye cau buoc: ten_co_so (max 200), dia_chi (max 500), loai_hinh_dv, nang_luc_tiep_nhan (> 0)
- [x] So dien thoai (format hop le, optional), email (format hop le, optional), dien_tich (>= 0, optional), ghi_chu (max 500, optional)
- [x] Phe duyet 2 cap: phong → Cuc

## In Scope
- Tao moi co so sua chua, dong tau (F-050)
- Cap nhat co so sua chua, dong tau (F-051)
- Xoa co so sua chua, dong tau (F-052)
- Phe duyet co so sua chua, dong tau (F-053, 2 cap: phong → Cuc)
- Xem chi tiet (F-054)
- Lich su thay doi (F-055)

## Out of Scope
- Phuc vu thong ke, bao cao
- Tich hop voi he thong khac (Phase 1)
- Email/SMS notification
- Export Excel/PDF
- Nhap nhieu co so cung luc (batch import)

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| A-003 (Chuyen vien) | Tao/Cap nhat/Xoa | Chi du lieu PROPOSED/UNDER_REVIEW/REJECTED |
| A-002 (Lanh dao) | Phe duyet C1 (Phong) | PROPOSED → UNDER_REVIEW |
| A-004 (Lanh dao Cuc) | Phe duyet C2 (Cuc) | UNDER_REVIEW → APPROVED |

## Entities

| Entity | Table | Primary Key | Description |
|---|---|---|---|
| CoSoSuaChuaDongTau | co_sua_chua_dong_tau | id | Entity chinh, 16 fields |
| CoSoSuaChuaDongTauAttachment | co_sua_chua_dong_tau_attachment | id | Tai lieu dinh kem (MinIO) |
| PheDuyetLichSu | phe_duyet_lich_su | id | History log |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-050-01 | Co so sua chua, dong tau phai duoc phe duyet | Create | UC-3300 |
| BR-050-02 | Trang thai mac dinh = PROPOSED sau khi tao | Create | DESIGN.md |
| BR-050-03 | ten_co_so buoc, max 200 ky tu | Create | DESIGN.md |
| BR-050-04 | dia_chi buoc, max 500 ky tu | Create | DESIGN.md |
| BR-050-05 | loai_hinh_dv buoc (sua_chua/ong_moi) | Create | DESIGN.md |
| BR-050-06 | nang_luc_tiep_nhan buoc, > 0 DWT | Create | DESIGN.md |
| BR-050-07 | dien_tich >= 0 (neu cap nhat) | Create | DESIGN.md |

## Technical Details

### REST Endpoint
- `POST /api/v1/co-sua-chua-dong-tau` — Tao moi co so sua chua, dong tau
- Request body: `CoSoSuaChuaDongTauCreateDTO`
- Response: `CoSoSuaChuaDongTauDTO` (trang thai = PROPOSED)

### DTO Fields
- `ten_co_so` (String, required, max 200) — ten co so sua chua, dong tau
- `dia_chi` (String, required, max 500) — dia chi co so
- `loai_hinh_dv` (Enum, required) — loai dich vu: SUA_CHUA, DONG_MOI
- `nang_luc_tiep_nhan` (Integer, required, > 0) — nang luc tiep nhan (DWT)
- `trang_bi_chinh` (String, optional, max 1000) — trang thiet bi chinh
- `dien_tich` (BigDecimal, optional, >= 0) — dien tich khu voc (m2)
- `so_dien_thoai` (String, optional, format VND/international) — so dien thoai lien he
- `email` (String, optional, format email hop le) — email lien he
- `ghi_chu` (String, optional, max 500) — ghi chu them

### Validation Rules
- `ten_co_so`: not blank, max 200 characters
- `dia_chi`: not blank, max 500 characters
- `loai_hinh_dv`: not null, one of [SUA_CHUA, DONG_MOI]
- `nang_luc_tiep_nhan`: >= 1, integer
- `dien_tich`: >= 0 (if provided)
- `so_dien_thoai`: valid phone format (if provided)
- `email`: valid email format (if provided)

## Testing Strategy
- Unit tests: Entity builder, getters/setters, JPA lifecycle callbacks
- Service tests: Create co so sua chua, dong tau → validate → luu → tra ve PROPOSED
- Controller tests: POST /api/v1/co-sua-chua-dong-tau, validation error handling, auth filters
- Integration: Tao moi + gui phe duyet + phe duyet C1 + phe duyet C2, toan bo workflow
- Negative tests: Tao thieu truong buoc → 400, so_luong <= 0 → 400
- All unit tests must pass before feature seal

## Design Reference
- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
- BA Spec: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md
- Tech-Lead Plan: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/tech-lead/04-plan.md
- Source: UC-3300
