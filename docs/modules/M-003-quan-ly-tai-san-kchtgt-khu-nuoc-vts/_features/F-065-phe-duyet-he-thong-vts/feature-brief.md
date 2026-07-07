---
id: F-065
name: "Phe duyet He thong VTS"
slug: phe-duyet-he-thong-vts
module-id: M-003
status: proposed
classification: local
priority: P0
created: "2026-06-30T00:00:00Z"
last-updated: "2026-06-30T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Phe duyet He thong VTS

## Description
Quy trinh phe duyet 2 cap cho He thong VTS: Cap C1 (Truong Phong) → Cap C2 (Giam Cuc), tu trang thai PROPOSED/UNDER_REVIEW den APPROVED.

## Business Intent
Đảm bảo mọi thay đổi về Hệ thống VTS đều được xem xét, phê duyệt chặt chẽ theo đúng phân cấp quản lý, đảm bảo tính chính xác và hợp lệ của dữ liệu phục vụ công tác quản lý tài sản KCHTGT khu nước & VTS.

## Flow Summary
1. Chuyen vien gui y kiến PROPOSED/UPDATE (C1)
2. Truong Phong xem xet → Phê duyệt C1 → UNDER_REVIEW (Chuyen Cuc)
3. Giam Cuc xem xét chi tiết → Phê duyệt C2 → APPROVED
4. Nếu từ chối ở bất kỳ cấp nào → trạng thái REJECTED (tra lại Chuyen vien)

## Acceptance Criteria
- [x] Phe duyet 2 cap: phong (C1) → Cuc (C2)
- [x] Cap C1 chuyen PROPOSED → UNDER_REVIEW
- [x] Cap C2 chuyen UNDER_REVIEW → APPROVED
- [x] Từ chối ở bất kỳ cấp → REJECTED (tra lại cho Chuyen vien)
- [x] Ghi nhan lich sử phê duyệt (ai phê duyệt, khi nào, kết quả)

## Business Rules
| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-065-01 | 2 cấp duyệt: phong (C1) → Cuc (C2) | Approval | UC-3312 |
| BR-065-02 | Cap C1: PROPOSED → UNDER_REVIEW | Approval | DESIGN.md |
| BR-065-03 | Cap C2: UNDER_REVIEW → APPROVED | Approval | UC-3312 |
| BR-065-04 | Tu choi ở bất kỳ cấp → REJECTED | Approval | DESIGN.md |

## Roles + Permissions
| Role | Level | Notes |
|---|---|---|
| A-003 (Chuyen vien) | Gui xet duyet | Tao cap nhat → gui C1 xem xét |
| A-002 (Lanh dao Phong) | Phe duyet C1 | PROPOSED → UNDER_REVIEW / REJECTED |
| A-004 (Lanh dao Cuc) | Phe duyet C2 | UNDER_REVIEW → APPROVED / REJECTED |

## Entities
| Entity | Table | Description |
|---|---|---|
| HeThongVTS | he_thong_vts | Entity chinh |
| HeThongVTSApproval | he_thong_vts_approval | Lich su phe duyet 2 cap |
| HeThongVTSAttachment | attachment | Tai lieu dinh kem |

## Design Reference
- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
- BA Spec: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md
- Source: UC-3312
