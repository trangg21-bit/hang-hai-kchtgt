---
id: F-058
name: ""Quan ly Tram radar - Xoa""
slug: quan-ly-tram-radar-xoa
module-id: M-003
status: proposed
classification: local
priority: P1
created: ""2026-06-30T00:00:00Z""
last-updated: ""2026-06-30T00:00:00Z""
locked-fields: []
consumed_by_modules: []
---

# Feature: Quan ly Tram radar - Xoa

## Description
Xoa Tram radar chi duoc thuc hien tren du lieu da duoc phe duyet. He thong thuc hien xoa co dan (soft delete) de bao toan lich su.

## Business Intent
Xoa thong tin Tram radar khi khong con su dung, chi cho phep xoa tren du lieu da duoc phe duyet de bao dao an toan du lieu.

## Flow Summary
1. Chuyen vien chon Tram radar can xoa
2. He thong kiem tra trang thai (chi xoa du lieu APPROVED)
3. Xoa co dan (soft delete), danh dau da bi xoa
4. Khong co phe duyet them cho thao tac xoa

## Acceptance Criteria
- [x] Xoa Tram radar thanh cong (soft delete)
- [x] Chi duoc xoa du lieu da duoc phe duyet
- [x] Bao toan lich su thao tac xoa
- [x] Hien thi thong bao xac nhan truoc khi xoa
- [x] Du lieu da bi xoa khong hien thi trong tra cuu

## Business Rules
| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-058-01 | Xoa chi voi du lieu da duoc phe duyet | Delete | UC-3317 |
| BR-058-02 | Xoa co dan (soft delete) | Delete | DESIGN.md |

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
- Source: UC-3317
