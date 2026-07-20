---
id: F-066
name: "Xem chi tiet He thong VTS"
slug: xem-chi-tiet-he-thong-vts
module-id: M-003
status: proposed
classification: local
priority: P0
created: "2026-06-30T00:00:00Z"
last-updated: "2026-06-30T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Xem chi tiet He thong VTS

## Description
Chuyen vien co the tra cuu, xem chi tiet He thong VTS bao gom thong tin co ban, dieu kien, nang luc, van ban dinh kem.

## Business Intent
Tra cuu thong tin He thong VTS tai cac khu vuc khu nuoc & VTS nhanh chong, chính xác, phuc vu cong tác quan ly, bao cao va quyét đinh đầu tư phát triển KCHTGT.

## Flow Summary
1. Chuyen vien nhap tieu chi tra cuu (ten, dia diem, trang thai, nam...)
2. He thong liet ke ket qua tra cuu theo tieu chi da chon
3. Chuyen vien chon mot He thong VTS de xem chi tiet
4. He thong hien thi toan bo thong tin + van ban dinh kem + lich su phe duyet

## Acceptance Criteria
- [x] Tra cuu He thong VTS theo nhieu tieu chi
- [x] Xem chi tiet He thong VTS (thong tin co ban, dieu kien, nang luc)
- [x] Hien thi van ban dinh kem lien quan
- [x] Hien thi thong tin phe duyet va trang thai hien tai

## Business Rules
| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-066-01 | Tra cuu theo tieu chi: ten, dia diem, trang thai, nam | Read | UC-3308 |
| BR-066-02 | Xem chi tiet toan bo thong tin He thong VTS | Read | DESIGN.md |
| BR-066-03 | Hien thi van ban dinh kem lien quan | Read | UC-3308 |

## Roles + Permissions
| Role | Level | Notes |
|---|---|---|
| A-003 (Chuyen vien) | Xem/Tra cuu | Toan bo du lieu |
| A-002 (Lanh dao) | Xem/Tra cuu | Toan bo du lieu |
| A-004 (Lanh dao Cuc) | Xem/Tra cuu | Toan bo du lieu |

## Entities
| Entity | Table | Description |
|---|---|---|
| HeThongVTS | he_thong_vts | Entity chinh |
| HeThongVTSAttachment | attachment | Tai lieu dinh kem |
| HeThongVTSApproval | he_thong_vts_approval | Thong tin phe duyet |

## Design Reference
- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
- BA Spec: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md
- Source: UC-3308
