---
id: F-060
name: ""Xem chi tiet Tram radar""
slug: xem-chi-tiet-tram-radar
module-id: M-003
status: proposed
classification: local
priority: P0
created: ""2026-06-30T00:00:00Z""
last-updated: ""2026-06-30T00:00:00Z""
locked-fields: []
consumed_by_modules: []
---

# Feature: Xem chi tiet Tram radar

## Description
Tra cuu, xem chi tiet Tram radar, bao gom thong tin co ban, thong so ky thuat va van ban dinh kem lien quan.

## Business Intent
Cho phep cac don vi lien quan tra cuu, xem chi tiet Tram radar da duoc phe duyet, bao gom toan bo thong tin va van ban dinh kem.

## Flow Summary
1. User tra cuu Tram radar theo tieu chi tim kiem
2. He thong hien thi danh sach ket qua
3. Chon Tram radar de xem chi tiet
4. Hien thi toan bo thong tin + van ban dinh kem

## Acceptance Criteria
- [x] Tra cuu Tram radar thanh cong
- [x] Xem chi tiet Tram radar bao gom toan bo thong tin
- [x] Hien thi van ban dinh kem lien quan
- [x] Chi xem du lieu da duoc phe duyet (APPROVED)
- [x] Hien thi thong tin da duoc phe duyet cap 1 va cap 2
- [x] Cho phep tai xuat van ban dinh kem

## Business Rules
| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-060-01 | Tra cuu, xem chi tiet + van ban dinh kem | Read | UC-3314 |
| BR-060-02 | Chi xem du lieu da duoc phe duyet | Read | DESIGN.md |

## Roles + Permissions
| Role | Level | Notes |
|---|---|---|
| A-003 (Chuyen vien) | Xem | Toan bo du lieu |
| A-002 (Lanh dao) | Xem | Toan bo du lieu |
| A-004 (Lanh dao Cuc) | Xem | Toan bo du lieu |

## Entities
| Entity | Table | Description |
|---|---|---|
| TramRadar | tram_radar | Entity chinh |
| TramRadarAttachment | attachment | Tai lieu dinh kem |

## Design Reference
- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
- BA Spec: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md
- Source: UC-3314
