---
id: F-038
name: "Quan ly Luong hang hai - Tao moi"
slug: quan-ly-luong-hang-hai-tao-moi
module-id: M-003
status: proposed
classification: local
priority: P0
created: "2026-06-29T00:00:00Z"
last-updated: "2026-06-29T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quan ly Luong hang hai - Tao moi

## Description
Chuyen vien co the tao moi luong hang hai. Luong hang hai phai duoc phe duyet truoc khi chinh thuc ghi nhan. Du lieu sau khi tao mac dinh co trang thai PROPOSED, chuyen vien co the cap nhat tai lieu, sau do gui cho phe duyet 2 cap: phong (C1) → Cuc (C2). Thong tin luong hang bao gom loai tau, so luong, ngay ghi nhan, gio dien, tai trong, dien tich dang bo, va ghi chu (tuy chon).

## Business Intent
Ky luong thong tin luong hang tai cac khu vuc khu nuoc va VTS, phuc vu cong tac quan ly tai san KCHTGT. Thong tin luong hang bao gom loai tau, so luong, ngay ghi nhan, gio dien, tai trong, dien tich dang bo, va ghi chu.

## Flow Summary
1. Chuyen vien truy cap module Luong hang hai → nut "Tao moi"
2. Chuyen vien nhap thong tin: loai_tau, so_luong, ngay_ghi_nhan, gio_dien, tai_trong, dien_tich_dang_bo, ghi_chu (tuy chon)
3. He thong kiem tra buoc: loai_tau (max 100 ky tu), so_luong (> 0), ngay_ghi_nhan (<= hom nay)
4. He thong luu du lieu voi trang thai = PROPOSED
5. Chuyen vien gui cho phe duyet → Ban ghi cho phe duyet tai cap phong (C1)
6. Sau phe duyet C1 thanh cong → trang thai chuyen thanh UNDER_REVIEW
7. Sau phe duyet C2 thanh cong → trang thai chuyen thanh APPROVED, chinh thuc ghi nhan

## Acceptance Criteria
- [x] Tao moi Luong hang hai thanh cong
- [x] Trang thai mac dinh = PROPOSED sau khi tao
- [x] Ye cau buoc: loai_tau (max 100), so_luong (> 0), ngay_ghi_nhan (<= hom nay)
- [x] Loai tau, so luong, ngay ghi nhan, gio dien, tai trong, dien tich dang bo, ghi chu (tuy chon)

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

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| A-003 (Chuyen vien) | Tao/Cap nhat/Xoa | Chi du lieu PROPOSED/UNDER_REVIEW/REJECTED |
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
| BR-038-01 | Luong hang hai phai duoc phe duyet | Create | UC-3346 |
| BR-038-02 | Trang thai mac dinh = PROPOSED sau khi tao | Create | DESIGN.md |
| BR-038-03 | loai_tau buoc, max 100 ky tu | Create | DESIGN.md |
| BR-038-04 | so_luong buoc, > 0 | Create | DESIGN.md |
| BR-038-05 | ngay_ghi_nhan buoc, <= hom nay | Create | DESIGN.md |
| BR-038-06 | Du lieu khong duoc phe duyet cap nhat sau khi APPROVED | Create | DESIGN.md |

## Technical Details

### REST Endpoint
- `POST /api/v1/luong-hang-hai` — Tao moi luong hang hai
- Request body: `LuongHangHaiCreateDTO`
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

## Testing Strategy
- Unit tests: Entity builder, getters/setters, JPA lifecycle callbacks
- Service tests: Create luong hang hai → validate → luu → tra ve PROPOSED
- Controller tests: POST /api/v1/luong-hang-hai, validation error handling, auth filters
- Integration: Tao moi + gui phe duyet + phe duyet C1 + phe duyet C2, toan bo workflow
- All unit tests must pass before feature seal

## Design Reference
- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
- BA Spec: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md
- Tech-Lead Plan: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/tech-lead/04-plan.md
- Source: UC-3346
