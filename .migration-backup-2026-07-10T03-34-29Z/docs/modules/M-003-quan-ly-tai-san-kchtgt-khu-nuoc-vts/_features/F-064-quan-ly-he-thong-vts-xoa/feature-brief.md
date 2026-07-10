---
id: F-064
name: "Quan ly He thong VTS - Xoa"
slug: quan-ly-he-thong-vts-xoa
module-id: M-003
status: proposed
classification: local
priority: P1
created: "2026-06-30T00:00:00Z"
last-updated: "2026-06-30T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quan ly He thong VTS - Xoa

## Description
Chuyen vien co the xoa He thong VTS. Dieu kien: chi xoa du lieu da duoc phe duyet (APPROVED) va chuyen sang trang thai DA XOA.

## Business Intent
Giai toan cac ban ghi He thong VTS khong con hieu luc hoac trung lap, phuc vu cong tác quan ly tai san KCHTGT theo quy che quan ly dau tư.

## Flow Summary
1. Chuyen vien chon He thong VTS can xoa
2. He thong kiem tra trang thai: chi cho phep xoa du lieu APPROVED
3. He thong chuyen trang thai → DA XOA (soft delete)
4. Ghi nhan nguoi xoa, thoi gian xoa vao logs
5. Du lieu v cung co the tra ve (un-delete) nham dung dung thoi gian

## Acceptance Criteria
- [x] Chi cho phep xoa du lieu APPROVED
- [x] Soft delete (khong xoa khoi co so du lieu)
- [x] Ghi nhan nguoi xoa va thoi gian xoa
- [x] Co the hoi phuc du lieu da xoa (neu can)

## Business Rules
| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-064-01 | Xoa chi voi du lieu da duoc phe duyet | Delete | UC-3311 |
| BR-064-02 | Soft delete — khong xoa khoi CSDL | Delete | DESIGN.md |
| BR-064-03 | Ghi nhan nguoi xoa va thoi gian xoa | Delete | UC-3311 |

## Roles + Permissions
| Role | Level | Notes |
|---|---|---|
| A-003 (Chuyen vien) | Xoa | Chi du lieu APPROVED |
| A-002 (Lanh dao) | Chuyen nghiep | Quan ly du lieu da xoa |
| A-004 (Lanh dao Cuc) | Chuyen nghiep | Phê duyệt khôi phục (nếu cần) |

## Entities
| Entity | Table | Description |
|---|---|---|
| HeThongVTS | he_thong_vts | Entity chinh |
| HeThongVTSAttachment | attachment | Tai lieu dinh kem |
| HeThongVTSDeleteLog | he_thong_vts_delete_log | Nguoi xoa, thoi gian, ly do |

## Design Reference
- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
- BA Spec: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md
- Source: UC-3311
