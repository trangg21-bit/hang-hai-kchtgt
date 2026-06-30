---
id: F-061
name: ""Quan ly Tram radar - Lich su""
slug: quan-ly-tram-radar-lich-su
module-id: M-003
status: proposed
classification: local
priority: P1
created: ""2026-06-30T00:00:00Z""
last-updated: ""2026-06-30T00:00:00Z""
locked-fields: []
consumed_by_modules: []
---

# Feature: Quan ly Tram radar - Lich su

## Description
Theo doi lich su thay doi cua Tram radar, bao gom cac thao tac tao moi, cap nhat, phe duyet, va xoa qua cac thoi diem.

## Business Intent
Bao toan va hien thi lich su thay doi cua Tram radar de hoi mo, kiem toan va dieu tra su kien khi can thiet.

## Flow Summary
1. Chon Tram radar can xem lich su
2. He thong hien thi danh sach cac thao tac da thuc hien
3. Xem chi tiet tung thao tac: nguoi thuc hien, thoi gian, noi dung thay doi

## Acceptance Criteria
- [x] Hien thi lich su thay doi cua Tram radar
- [x] Bao gom cac thao tac: tao, cap nhat, phe duyet, xoa
- [x] Hien thi nguoi thuc hien + thoi gian + noi dung
- [x] Sap xep lich su theo thoi gian giam dan
- [x] Hien thi chi tiet so thay doi (truoc/sau) cua tung cap nhat

## Business Rules
| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-061-01 | Theo doi lich su thay doi | History | UC-3319 |
| BR-061-02 | Bao toan toan bo lich su thao tac | History | DESIGN.md |

## Roles + Permissions
| Role | Level | Notes |
|---|---|---|
| A-003 (Chuyen vien) | Xem lich su | Toan bo lich su |
| A-002 (Lanh dao) | Xem lich su | Toan bo lich su |
| A-004 (Lanh dao Cuc) | Xem lich su | Toan bo lich su |

## Entities
| Entity | Table | Description |
|---|---|---|
| TramRadar | tram_radar | Entity chinh |
| TramRadarAttachment | attachment | Tai lieu dinh kem |
| ChangeLog | change_log | Lich su thay doi |
| TramRadarLocation | tram_radar_location | Vtri Tram radar

## Design Reference
- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
- BA Spec: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md
- Source: UC-3319
