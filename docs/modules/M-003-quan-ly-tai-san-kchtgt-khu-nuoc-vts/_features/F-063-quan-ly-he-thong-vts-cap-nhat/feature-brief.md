---
id: F-063
name: "Quan ly He thong VTS - Cap nhat"
slug: quan-ly-he-thong-vts-cap-nhat
module-id: M-003
status: proposed
classification: local
priority: P0
created: "2026-06-30T00:00:00Z"
last-updated: "2026-06-30T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quan ly He thong VTS - Cap nhat

## Description
Chuyen vien co the cap nhat thong tin He thong VTS da ton tai. Moi thay doi phai duoc phe duyet truoc khi chinh thuc ghi nhan.

## Business Intent
Ke to Update thong tin He thong VTS tai cac khu vuc khu nuoc & VTS khi co thay doi ve dieu kien, nang luc hoac pham vi hoat dong, phuc vu cong tác quan ly tai san KCHTGT.

## Flow Summary
1. Chuyen vien chon He thong VTS can cap nhat
2. He thong kiem tra trang thai: chi cap nhat du lieu PROPOSED/UNDER_REVIEW/REJECTED
3. Chuyen vien sua cac truong thong tin can cap nhat
4. He thong cap nhat va luu voi trang thai = UNDER_REVIEW (tra ve C1 xem xet)
5. Phe duyet 2 cap: phong (C1) → Cuc (C2)
6. Sau phe duyet C2 → quay lai trang thai cu (APPROVED)

## Acceptance Criteria
- [x] Cap nhat He thong VTS thanh cong
- [x] Chi cap nhat du lieu PROPOSED/UNDER_REVIEW/REJECTED
- [x] Phe duyet 2 cap: phong → Cuc
- [x] Ghi nhan lich su thay doi sau phe duyet

## Business Rules
| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-063-01 | Cap nhat He thong VTS phai duoc phe duyet | Update | UC-3310 |
| BR-063-02 | Chi cap nhat du lieu PROPOSED/UNDER_REVIEW/REJECTED | Update | DESIGN.md |
| BR-063-03 | Phe duyet 2 cap: phong → Cuc | Update | UC-3310 |

## Roles + Permissions
| Role | Level | Notes |
|---|---|---|
| A-003 (Chuyen vien) | Cap nhat | Chi du lieu PROPOSED/UNDER_REVIEW/REJECTED |
| A-002 (Lanh dao) | Phe duyet C1 (Phong) | UNDER_REVIEW → DUOC PHENOA (truyen Cuc) |
| A-004 (Lanh dao Cuc) | Phe duyet C2 (Cuc) | DUOC PHENOA → APPROVED |

## Entities
| Entity | Table | Description |
|---|---|---|
| HeThongVTS | he_thong_vts | Entity chinh |
| HeThongVTSAttachment | attachment | Tai lieu dinh kem |
| HeThongVTSChangeLog | he_thong_vts_change_log | Lich su thay doi |

## Design Reference
- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
- BA Spec: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md
- Source: UC-3310
