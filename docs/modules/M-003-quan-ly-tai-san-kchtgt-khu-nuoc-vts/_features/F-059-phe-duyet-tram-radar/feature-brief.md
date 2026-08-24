---
id: F-059
name: ""Phe duyet Tram radar""
slug: phe-duyet-tram-radar
module-id: M-003
status: proposed
classification: local
priority: P0
created: ""2026-06-30T00:00:00Z""
last-updated: ""2026-06-30T00:00:00Z""
locked-fields: []
consumed_by_modules: []
---

# Feature: Phe duyet Tram radar

## Description
He thong thuc hien phe duyet 2 cap doi voi Tram radar: Cap 1 (Phong) va Cap 2 (Cuc). Chi sau khi duoc phe duyet Cap 2 du lieu moi co trang thai APPROVED.

## Business Intent
Dieu khien chat luong du lieu Tram radar thong qua quy trinh phe duyet 2 cap, bao dam thong tin quan ly tai san KCHTGT chinh xac.

## Flow Summary
1. Khi Chuyen vien tao moi hoac cap nhat → trang thai = DRAFT (Lưu tạm)
2. Chuyen vien gui duyet → trang thai = PENDING_APPROVAL (Cho Cang vu/Chi cuc duyet)
3. Lanh dao Phong (C1) xem va phe duyet: PENDING_APPROVAL → APPROVED_LEVEL1 (Cho Cuc duyet)
4. Lanh dao Cuc (C2) xem va phe duyet: APPROVED_LEVEL1 → APPROVED
5. Neu tu choi o cap 1 → trang thai = REJECTED_LEVEL1; tu choi o cap 2 → trang thai = REJECTED_LEVEL2

## Acceptance Criteria
- [x] Phe duyet 2 cap: Phong → Cuc
- [x] PENDING_APPROVAL → APPROVED_LEVEL1 (Cap 1)
- [x] APPROVED_LEVEL1 → APPROVED (Cap 2)
- [x] Tu choi o cap 1 → REJECTED_LEVEL1; tu choi o cap 2 → REJECTED_LEVEL2

## Business Rules
| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-059-01 | 2 cap phe duyet: phong → Cuc | Approval | UC-3318 |
| BR-059-02 | Cap 1 (Phong): PENDING_APPROVAL → APPROVED_LEVEL1 | Approval | DESIGN.md |
| BR-059-03 | Cap 2 (Cuc): APPROVED_LEVEL1 → APPROVED | Approval | DESIGN.md |
| BR-059-04 | Tu choi o cap 1 → REJECTED_LEVEL1; tu choi o cap 2 → REJECTED_LEVEL2 | Approval | DESIGN.md |

## Roles + Permissions
| Role | Level | Notes |
|---|---|---|
| A-003 (Chuyen vien) | Tao/Cap nhat/Xoa | Chi du lieu DRAFT/PENDING_APPROVAL/APPROVED_LEVEL1/REJECTED_LEVEL1/REJECTED_LEVEL2 |
| A-002 (Lanh dao) | Phe duyet C1 (Phong) | PENDING_APPROVAL → APPROVED_LEVEL1 |
| A-004 (Lanh dao Cuc) | Phe duyet C2 (Cuc) | APPROVED_LEVEL1 → APPROVED |

## Entities
| Entity | Table | Description |
|---|---|---|
| TramRadar | tram_radar | Entity chinh |
| TramRadarAttachment | attachment | Tai lieu dinh kem |
| ApprovalLog | approval_log | Log phe duyet |

## Design Reference
- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
- BA Spec: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md
- Source: UC-3318
