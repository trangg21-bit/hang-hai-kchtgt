---
id: F-039
name: "Quan ly Luong hang hai - Cap nhat"
slug: quan-ly-luong-hang-hai-cap-nhat
module-id: M-003
status: proposed
classification: local
priority: P0
created: "2026-06-29T00:00:00Z"
last-updated: "2026-06-29T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quan ly Luong hang hai - Cap nhat

## Description
Chuyen vien co the cap nhat luong hang hai do minh tao (trang thai PROPOSED, UNDER_REVIEW, hoac REJECTED). Cap nhat luong hang hai phai duoc phe duyet lai tu 2 cap: phong (C1) → Cuc (C2). He thong ghi nhan lich su thay doi moi lan cap nhat du lieu. Du lieu da APPROED khong duoc phe cap nhat (chi co the tao moi ban ghi khac).

## Business Intent
Duy tri thong tin luong hang tai cac khu vuc khu nuoc va VTS luon chinh xac va cap nhat. Chuyen vien co the sua doi, bo sung thong tin luong hang da tao, sau do gui lai quy trinh phe duyet 2 cap de kieem tra, chap nhan thay doi.

## Flow Summary
1. Chuyen vien chon luong hang hai can cap nhat (trang thai PROPOSED/UNDER_REVIEW/REJECTED)
2. Chuyen vien sua cac truong: loai_tau, so_luong, ngay_ghi_nhan, gio_dien, tai_trong, dien_tich_dang_bo, ghi_chu
3. He thong kiem tra buoc: loai_tau (max 100 ky tu), so_luong (> 0), ngay_ghi_nhan (<= hom nay)
4. He thong luu thay doi, ghi vao phe_duyet_lich_su (change_log)
5. Cap nhat trang thai → PROPOSED (neu dang UNDER_REVIEW/REJECTED)
6. Chuyen vien gui cho phe duyet lai → quy trinh 2 cap C1 → C2

## Acceptance Criteria
- [x] Cap nhat Luong hang hai thanh cong
- [x] Trang thai tro ve PROPOSED sau khi cap nhat (neu dang UNDER_REVIEW/REJECTED)
- [x] Ye cau buoc: loai_tau (max 100), so_luong (> 0), ngay_ghi_nhan (<= hom nay)
- [x] Ghi nhan lich su thay doi vao phe_duyet_lich_su
- [x] Cap nhat du lieu da APPROVED → khong duoc phep (tra ve loi)

## In Scope
- Tao moi luong hang hai (F-038)
- Cap nhat luong hang hai (F-039)
- Xoa luong hang hai (F-040)
- Phe duyet luong hang hai (F-041, 2 cap: phong → Cuc)
- Xem chi tiet (F-042)
- Lich su thay doi (F-043)

## Out of Scope
- Phuc vu thong ke, bao cao
- Tich hop voi he thong khac (Phase 1)
- Email/SMS notification
- Export Excel/PDF
- Cap nhat dong batch nhieu luong hang hai

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| A-003 (Chuyen vien) | Cap nhat | Chi du lieu PROPOSED/UNDER_REVIEW/REJECTED, co the cap nhat |
| A-002 (Lanh dao) | Phe duyet C1 (Phong) | PROPOSED → UNDER_REVIEW |
| A-004 (Lanh dao Cuc) | Phe duyet C2 (Cuc) | UNDER_REVIEW → APPROVED |

## Entities

| Entity | Table | Primary Key | Description |
|---|---|---|---|
| LuongHangHai | luong_hang_hai | id | Entity chinh, 32 fields |
| LuongHangHaiAttachment | luong_hang_hai_attachment | id | Tai lieu dinh kem (MinIO) |
| PheDuyetLichSu | phe_duyet_lich_su | id | History log |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-039-01 | Cap nhat Luong hang hai phai duoc phe duyet | Update | UC-3347 |
| BR-039-02 | Trang thai tro ve PROPOSED sau khi cap nhat | Update | DESIGN.md |
| BR-039-03 | Du lieu da APPROVED → khong duoc phe cap nhat | Update | DESIGN.md |
| BR-039-04 | loai_tau buoc, max 100 ky tu | Update | DESIGN.md |
| BR-039-05 | so_luong buoc, > 0 | Update | DESIGN.md |
| BR-039-06 | ngay_ghi_nhan buoc, <= hom nay | Update | DESIGN.md |
| BR-039-07 | Ghi nhan thay doi vao phe_duyet_lich_su | Update | DESIGN.md |

## Technical Details

### REST Endpoint
- `PUT /api/v1/luong-hang-hai/{id}` — Cap nhat luong hang hai
- Request body: `LuongHangHaiUpdateDTO`
- Response: `LuongHangHaiDTO` (trang thai = PROPOSED)

### DTO Fields
- `loai_tau` (String, required, max 100) — loai tau
- `so_luong` (Integer, required, > 0) — so luong
- `ngay_ghi_nhan` (LocalDate, required, <= hom nay) — ngay ghi nhan
- `gio_dien` (LocalDateTime, optional) — gio dien
- `tai_trong` (BigDecimal, optional) — tai trong
- `dien_tich_dang_bo` (BigDecimal, optional) — dien tich dang bo
- `ghi_chu` (String, optional, max 500) — ghi chu

### Validation Rules
- `loai_tau`: not blank, max 100 characters
- `so_luong`: >= 1, integer
- `ngay_ghi_nhan`: not null, <= current date
- `tai_trong`: >= 0 (if provided)
- `dien_tich_dang_bo`: >= 0 (if provided)
- `status`: khong duoc = APPROED (tra ve 403 Forbidden)

## Testing Strategy
- Unit tests: Entity builder, getters/setters, JPA lifecycle callbacks
- Service tests: Update luong hang hai → validate → luu → ghi history → tra ve PROPOSED
- Controller tests: PUT /api/v1/luong-hang-hai/{id}, validation error handling, auth filters
- Integration: Update → gui phe duyet → phe duyet C1 → phe duyet C2, toan bo workflow
- Negative tests: Update APPROVED → 403, validation error → 400
- All unit tests must pass before feature seal

## Design Reference
- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
- BA Spec: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md
- Tech-Lead Plan: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/tech-lead/04-plan.md
- Source: UC-3347
