---
id: F-052
name: "Quan ly Co so sua chua, dong tau - Xoa"
slug: quan-ly-co-so-sua-chua-dong-tau-xoa
module-id: M-003
status: proposed
classification: local
priority: P1
created: "2026-06-29T00:00:00Z"
last-updated: "2026-06-29T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quan ly Co so sua chua, dong tau - Xoa

## Description
Chuyen vien co the xoa co so sua chua, dong tau da tao. Xoa chi voi du lieu da duoc phe duyet (trang thai APPROVED). He thong thuc hien xoa co che (soft delete) — co the phuc hoi sau nay neu can. Soft delete giu lai thong tin de theo doi tai lieu lien quan (tai lieu dinh kem, phe duyet lich su).

## Business Intent
Cho phep chuyen vien lo bo cac co so sua chua, dong tau khong con dung, chi voi nhung du lieu da duoc phe duyet 2 cap (APPROVED). Soft delete giup bao toan thong tin lich su de audit, trong khi co phuc hoi khi can. Theo quy trinh, chi co the xoa co so sua chua, dong tau khi du lieu da duoc phe duyet, phuc vu cong tac quan ly tai san KCHTGT.

## Flow Summary
1. Chuyen vien chon co so sua chua, dong tau can xoa (phai co trang thai = APPROVED)
2. He thong kiem tra dieu kien: chi duoc xoa neu trang thai = APPROVED
3. He thong hien hop thong bao xac nhan: "Ban co muon xoa co so sua chua, dong tau nay?"
4. Chuyen vien xac nhan → he thong thuc hien soft delete (dat flag is_deleted = true)
5. He thong ghi vao phe_duyet_lich_su (action = DELETE, ghi chu = "Chuyen vien xoa")
6. Co so sua chua, dong tau bi xoa khong hien thi trong danh sach (truy van loai tru is_deleted)
7. Soft delete: co the phuc hoi bang quy trinh admin

## Acceptance Criteria
- [x] Xoa Co so sua chua, dong tau thanh cong (soft delete)
- [x] Xoa chi voi du lieu da duoc phe duyet (trang thai = APPROVED)
- [x] Soft delete → luu thong tin, co the phuc hoi
- [x] Xoa → ghi vao phe_duyet_lich_su
- [x] Du lieu da xoa khong hien thi trong danh sach (truy van loai tru is_deleted)

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
| CoSoSuaChuaDongTau | co_sua_chua_dong_tau | id | Entity chinh, 16 fields, co truong is_deleted (boolean) |
| CoSoSuaChuaDongTauAttachment | co_sua_chua_dong_tau_attachment | id | Tai lieu dinh kem (MinIO) |
| PheDuyetLichSu | phe_duyet_lich_su | id | History log |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-052-01 | Xoa chi voi du lieu da duoc phe duyet | Delete | UC-3302 |
| BR-052-02 | Trang thai phai = APPROVED | Delete | DESIGN.md |
| BR-052-03 | Soft delete (is_deleted = true) | Delete | DESIGN.md |
| BR-052-04 | Ghi vao phe_duyet_lich_su khi xoa | Delete | DESIGN.md |
| BR-052-05 | Soft delete → co the phuc hoi | Delete | DESIGN.md |

## Technical Details

### REST Endpoint
- `DELETE /api/v1/co-sua-chua-dong-tau/{id}` — Xoa co che (soft delete) co so sua chua, dong tau
- Response: 204 No Content (thanh cong)

### Validation Rules
- `status`: chi duoc xoa neu = APPROVED (neu khong phai → 403 Forbidden)
- `is_deleted`: soft delete → dat is_deleted = true, khong xoa physically

## Testing Strategy
- Unit tests: Entity builder, getters/setters, JPA lifecycle callbacks
- Service tests: Delete co so sua chua, dong tau (APPROVED) → soft delete → ghi history
- Controller tests: DELETE /api/v1/co-sua-chua-dong-tau/{id}, validation, auth filters
- Integration: Delete → soft delete → kiem tra danh sach (tru soft-deleted)
- Negative tests: Delete du lieu khong APPROVED → 403, Delete da xoa → 404
- All unit tests must pass before feature seal

## Design Reference
- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
- BA Spec: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md
- Tech-Lead Plan: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/tech-lead/04-plan.md
- Source: UC-3302
