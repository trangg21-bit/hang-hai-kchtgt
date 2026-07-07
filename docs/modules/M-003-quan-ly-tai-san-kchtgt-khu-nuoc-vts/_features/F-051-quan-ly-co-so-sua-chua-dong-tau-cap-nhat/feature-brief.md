---
id: F-051
name: "Quan ly Co so sua chua, dong tau - Cap nhat"
slug: quan-ly-co-so-sua-chua-dong-tau-cap-nhat
module-id: M-003
status: proposed
classification: local
priority: P0
created: "2026-06-29T00:00:00Z"
last-updated: "2026-06-29T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quan ly Co so sua chua, dong tau - Cap nhat

## Description
Chuyen vien co the cap nhat co so sua chua, dong tau do minh tao (trang thai PROPOSED, UNDER_REVIEW, hoac REJECTED). Cap nhat co so sua chua, dong tau phai duoc phe duyet lai tu 2 cap: phong (C1) → Cuc (C2). He thong ghi nhan lich su thay doi moi lan cap nhat du lieu. Du lieu da APPROVED khong duoc phe cap nhat (chi co the tao moi ban ghi khac).

## Business Intent
Duy tri thong tin co so sua chua, dong tau tai cac khu vuc khu nuoc va VTS luon chinh xac va cap nhat. Chuyen vien co the sua doi, bo sung thong tin co so da tao (nang luc tiep nhan, trang bi, dia chi…), sau do gui lai quy trinh phe duyet 2 cap de kieem tra, chap nhan thay doi.

## Flow Summary
1. Chuyen vien chon co so sua chua, dong tau can cap nhat (trang thai PROPOSED/UNDER_REVIEW/REJECTED)
2. Chuyen vien sua cac truong: ten_co_so, dia_chi, loai_hinh_dv, nang_luc_tiep_nhan, trang_bi_chinh, dien_tich, so_dien_thoai, email, ghi_chu
3. He thong kiem tra buoc: ten_co_so (max 200), dia_chi (max 500), loai_hinh_dv, nang_luc_tiep_nhan (> 0), dien_tich (>= 0)
4. He thong luu thay doi, ghi vao phe_duyet_lich_su (change_log)
5. Cap nhat trang thai → PROPOSED (neu dang UNDER_REVIEW/REJECTED)
6. Chuyen vien gui cho phe duyet lai → quy trinh 2 cap C1 → C2

## Acceptance Criteria
- [x] Cap nhat Co so sua chua, dong tau thanh cong
- [x] Trang thai tro ve PROPOSED sau khi cap nhat (neu dang UNDER_REVIEW/REJECTED)
- [x] Ye cau buoc: ten_co_so (max 200), dia_chi (max 500), loai_hinh_dv, nang_luc_tiep_nhan (> 0)
- [x] Ghi nhan lich su thay doi vao phe_duyet_lich_su
- [x] Cap nhat du lieu da APPROVED → khong duoc phep (tra ve loi)

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
- Cap nhat dong batch nhieu co so sua chua, dong tau

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| A-003 (Chuyen vien) | Cap nhat | Chi du lieu PROPOSED/UNDER_REVIEW/REJECTED, co the cap nhat |
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
| BR-051-01 | Cap nhat Co so sua chua, dong tau phai duoc phe duyet | Update | UC-3301 |
| BR-051-02 | Trang thai tro ve PROPOSED sau khi cap nhat | Update | DESIGN.md |
| BR-051-03 | Du lieu da APPROVED → khong duoc phe cap nhat | Update | DESIGN.md |
| BR-051-04 | ten_co_so buoc, max 200 ky tu | Update | DESIGN.md |
| BR-051-05 | dia_chi buoc, max 500 ky tu | Update | DESIGN.md |
| BR-051-06 | loai_hinh_dv buoc (sua_chua/ong_moi) | Update | DESIGN.md |
| BR-051-07 | nang_luc_tiep_nhan buoc, > 0 | Update | DESIGN.md |
| BR-051-08 | Ghi nhan thay doi vao phe_duyet_lich_su | Update | DESIGN.md |

## Technical Details

### REST Endpoint
- `PUT /api/v1/co-sua-chua-dong-tau/{id}` — Cap nhat co so sua chua, dong tau
- Request body: `CoSoSuaChuaDongTauUpdateDTO`
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
- `status`: khong duoc = APPROVED (tra ve 403 Forbidden)

## Testing Strategy
- Unit tests: Entity builder, getters/setters, JPA lifecycle callbacks
- Service tests: Update co so sua chua, dong tau → validate → luu → ghi history → tra ve PROPOSED
- Controller tests: PUT /api/v1/co-sua-chua-dong-tau/{id}, validation error handling, auth filters
- Integration: Update → gui phe duyet → phe duyet C1 → phe duyet C2, toan bo workflow
- Negative tests: Update APPROVED → 403, validation error → 400
- All unit tests must pass before feature seal

## Design Reference
- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
- BA Spec: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md
- Tech-Lead Plan: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/tech-lead/04-plan.md
- Source: UC-3301
