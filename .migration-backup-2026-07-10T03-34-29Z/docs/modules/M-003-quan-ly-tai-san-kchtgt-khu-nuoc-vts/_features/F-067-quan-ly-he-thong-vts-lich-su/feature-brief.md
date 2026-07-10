---
id: F-067
name: "Quan ly He thong VTS - Lich su"
slug: quan-ly-he-thong-vts-lich-su
module-id: M-003
status: proposed
classification: local
priority: P1
created: "2026-06-30T00:00:00Z"
last-updated: "2026-06-30T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quan ly He thong VTS - Lich su

## Description
Theo doi lich su thay doi cua He thong VTS: du lieu da thay doi, nguoi thay doi, thoi gian, ly do. Bao gom ca lich su phe duyet va lich su xoa.

## Business Intent
Tao trong su tin cayer cho viec theo doi, kiem toan toan bo quy trinh quan ly tai san He thong VTS — tu khi tao moi, qua cap nhat, phe duyet, den khi xoa, phuc vu cong tác bao cao, kiem toan va quyét định quản lý KCHTGT.

## Flow Summary
1. He thong tu dong ghi nhan moi thay doi (thong tin, trang thai, phe duyet, xoa)
2. Chuyen vien chon He thong VTS can xem lich su
3. He thong liet ke theo thu tu thoi gian: ngay → thay doi → nguoi thay doi → ly do
4. Chuyen vien co the xem goi y chi tiet tung muc thay doi

## Acceptance Criteria
- [x] Theo doi lich su thay doi thong tin
- [x] Theo doi lich su phe duyet (C1, C2)
- [x] Theo doi lich su xoa (soft delete)
- [x] Hien thi nguoi thay doi, thoi gian, ly do
- [x] Liet ke theo thu tu thoi gian (tu moi cu nhat)

## Business Rules
| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-067-01 | Theo doi lich su thay doi toan bo | Audit | LINE-3313 |
| BR-067-02 | Ghi nhan nguoi thay doi, thoi gian, ly do | Audit | DESIGN.md |
| BR-067-03 | Liet ke theo thu tu thoi gian (moi cu nhat) | Audit | DESIGN.md |

## Roles + Permissions
| Role | Level | Notes |
|---|---|---|
| A-003 (Chuyen vien) | Xem lich su | Toan bo du lieu |
| A-002 (Lanh dao) | Xem lich su | Toan bo du lieu |
| A-004 (Lanh dao Cuc) | Xem lich su | Toan bo du lieu |

## Entities
| Entity | Table | Description |
|---|---|---|
| HeThongVTS | he_thong_vts | Entity chinh |
| HeThongVTSChangeLog | he_thong_vts_change_log | Lich su thay doi |
| HeThongVTSApproval | he_thong_vts_approval | Lich su phe duyet |
| HeThongVTSDeleteLog | he_thong_vts_delete_log | Lich su xoa |

## Design Reference
- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
- BA Spec: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md
- Source: LINE-3313
