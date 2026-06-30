---
id: F-040
name: "Quan ly Luong hang hai - Xoa"
slug: quan-ly-luong-hang-hai-xoa
module-id: M-003
status: proposed
classification: local
priority: P1
created: "2026-06-29T00:00:00Z"
last-updated: "2026-06-29T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quan ly Luong hang hai - Xoa

## Description
Chuyen vien co the xoa luong hang hai da tao. Xoa chi voi du lieu da duoc phe duyet (trang thai APPROVED). He thong thuc hien xoa co che (soft delete) — co the phuc hoi sau nay neu can. Soft delete giu lai thong tin de theo doi tai lieu lien quan (tai lieu dinh kem, phe duyet lich su).

## Business Intent
Cho phep chuyen vien lo bo cac luong hang hai khong con dung, chi voi nhung du lieu da duoc phe duyet 2 cap (APPROVED). Soft delete giup bao toan thong tin lich su de audit, trong khi co phuc hoi khi can.

## Flow Summary
1. Chuyen vien chon luong hang hai can xoa (phai co trang thai = APPROVED)
2. He thong kiem tra dieu kien: chi duoc xoa neu trang thai = APPROVED
3. He thong hien hop thong bao xac nhan: "Ban co muon xoa Luong hang hai nay?"
4. Chuyen vien xac nhan → he thong thuc hien soft delete (dat flag is_deleted = true)
5. He thong ghi vao phe_duyet_lich_su (action = DELETE, ghi chu = "Chuyen vien xoa")
6. Luong hang hai bi xoa khong hien thi trong danh sach (truy van loai tru is_deleted)
7. Soft delete: co the phuc hoi bang quy trinh admin

## Acceptance Criteria
- [x] Xoa Luong hang hai thanh cong (soft delete)
- [x] Xoa chi voi du lieu da duoc phe duyet (trang thai = APPROVED)
- [x] Soft delete → luu thong tin, co the phuc hoi
- [x] Xoa → ghi vao phe_duyet_lich_su
- [x] Du lieu da xoa khong hien thi trong danh sach (truy van loai tru is_deleted)

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
- Hard delete (khong the phuc hoi)

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| A-003 (Chuyen vien) | Xoa | Chi du lieu APPROVED, soft delete |
| A-002 (Lanh dao) | Phe duyet C1 (Phong) | PROPOSED → UNDER_REVIEW |
| A-004 (Lanh dao Cuc) | Phe duyet C2 (Cuc) | UNDER_REVIEW → APPROVED |

## Entities

| Entity | Table | Primary Key | Description |
|---|---|---|---|
| LuongHangHai | luong_hang_hai | id | Entity chinh, 32 fields, co truong is_deleted (boolean) |
| LuongHangHaiAttachment | luong_hang_hai_attachment | id | Tai lieu dinh kem (MinIO) |
| PheDuyetLichSu | phe_duyet_lich_su | id | History log |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-040-01 | Xoa chi voi du lieu da duoc phe duyet | Delete | UC-3348 |
| BR-040-02 | Trang thai phai = APPROVED | Delete | DESIGN.md |
| BR-040-03 | Soft delete (is_deleted = true) | Delete | DESIGN.md |
| BR-040-04 | Ghi vao phe_duyet_lich_su khi xoa | Delete | DESIGN.md |
| BR-040-05 | Soft delete → co the phuc hoi | Delete | DESIGN.md |

## Technical Details

### REST Endpoint
- `DELETE /api/v1/luong-hang-hai/{id}` — Xoa co che (soft delete) luong hang hai
- Response: 204 No Content (thanh cong)

### Validation Rules
- `status`: chi duoc xoa neu = APPROVED (neu khong phai → 403 Forbidden)
- `is_deleted`: soft delete → dat is_deleted = true, khong xoa physically

## Testing Strategy
- Unit tests: Entity builder, getters/setters, JPA lifecycle callbacks
- Service tests: Delete luong hang hai (APPROVED) → soft delete → ghi history
- Controller tests: DELETE /api/v1/luong-hang-hai/{id}, validation, auth filters
- Integration: Delete → soft delete → kiem tra danh sach (tru soft-deleted)
- Negative tests: Delete du lieu khong APPROVED → 403, Delete da xoa → 404
- All unit tests must pass before feature seal

## Design Reference
- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
- BA Spec: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md
- Tech-Lead Plan: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/tech-lead/04-plan.md
- Source: UC-3348
