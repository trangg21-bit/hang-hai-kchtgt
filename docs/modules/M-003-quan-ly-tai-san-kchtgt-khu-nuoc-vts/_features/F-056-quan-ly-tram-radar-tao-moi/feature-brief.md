---
id: F-056
name: ""Quan ly Tram radar - Tao moi""
slug: quan-ly-tram-radar-tao-moi
module-id: M-003
status: proposed
classification: local
priority: P0
created: ""2026-06-30T00:00:00Z""
last-updated: ""2026-06-30T00:00:00Z""
locked-fields: []
consumed_by_modules: []
---

# Feature: Quan ly Tram radar - Tao moi

## Description
Chuyen vien co the tao moi Tram radar. Du lieu phai duoc phe duyet truoc khi chinh thuc ghi nhan.

## Business Intent
Ky luong thong tin Tram radar tai cac khu vuc khu nuoc & VTS, phuc vu cong tác quan ly tai san KCHTGT.

## Flow Summary
1. Chuyen vien nhap thong tin Tram radar
2. He thong luu du lieu voi trang thai = PROPOSED
3. Phe duyet 2 cap: phong (C1) → Cuc (C2)
4. Sau phe duyet C2 → APPROVED

## Acceptance Criteria
- [x] Tao moi Tram radar thanh cong
- [x] Trang thai mac dinh = PROPOSED
- [x] Phe duyet 2 cap: phong → Cuc
- [x] Khong cho phep tao moi Tram radar trung lap
- [x] Hien thi thong bao thanh cong sau khi tao moi

## Business Rules
| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-056-01 | Tram radar phai duoc phe duyet | Create | UC-3315 |
| BR-056-02 | Trang thai mac dinh = PROPOSED | Create | DESIGN.md |

## Roles + Permissions
| Role | Level | Notes |
|---|---|---|
| A-003 (Chuyen vien) | Tao/Cap nhat/Xoa | Chi du lieu PROPOSED/UNDER_REVIEW/REJECTED |
| A-002 (Lanh dao) | Phe duyet C1 (Phong) | PROPOSED → UNDER_REVIEW |
| A-004 (Lanh dao Cuc) | Phe duyet C2 (Cuc) | UNDER_REVIEW → APPROVED |

## Entities
| Entity | Table | Description |
|---|---|---|
| TramRadar | tram_radar | Entity chinh |
| TramRadarAttachment | attachment | Tai lieu dinh kem |
| TramRadarLocation | tram_radar_location | Vtri Tram radar

## Design Reference
- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
- BA Spec: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md
- Source: UC-3315
