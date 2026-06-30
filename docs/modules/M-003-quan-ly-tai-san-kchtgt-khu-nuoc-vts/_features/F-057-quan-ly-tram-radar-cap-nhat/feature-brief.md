---
id: F-057
name: ""Quan ly Tram radar - Cap nhat""
slug: quan-ly-tram-radar-cap-nhat
module-id: M-003
status: proposed
classification: local
priority: P0
created: ""2026-06-30T00:00:00Z""
last-updated: ""2026-06-30T00:00:00Z""
locked-fields: []
consumed_by_modules: []
---

# Feature: Quan ly Tram radar - Cap nhat

## Description
Chuyen vien co the cap nhat thong tin Tram radar. Sua doi chi duoc tren du lieu da duoc phe duyet va phai duoc phe duyet lai sau khi sua.

## Business Intent
Cap nhat thong tin Tram radar khi co thay doi, phuc vu cong tác quan ly tai san KCHTGT tai cac khu vuc khu nuoc & VTS.

## Flow Summary
1. Chuyen vien chon Tram radar can cap nhat
2. He thong kiem tra trang thai (chi cap nhat du lieu APPROVED)
3. Sau khi cap nhat → trang thai chuyen ve UNDER_REVIEW
4. Phe duyet 2 cap: phong (C1) → Cuc (C2)
5. Sau phe duyet C2 → APPROVED

## Acceptance Criteria
- [x] Cap nhat Tram radar thanh cong
- [x] Chi duoc cap nhat du lieu da duoc phe duyet
- [x] Sau cap nhat → chuyen ve UNDER_REVIEW
- [x] Phe duyet 2 cap: phong → Cuc

## Business Rules
| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-057-01 | Cap nhat Tram radar phai duoc phe duyet | Update | UC-3316 |
| BR-057-02 | Chi cap nhat du lieu da duoc phe duyet | Update | DESIGN.md |
| BR-057-03 | Sau cap nhat chuyen ve UNDER_REVIEW | Update | DESIGN.md |

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

## Design Reference
- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
- BA Spec: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md
- Source: UC-3316
