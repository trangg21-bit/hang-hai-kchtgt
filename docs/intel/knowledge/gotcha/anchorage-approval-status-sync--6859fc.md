---
id: AM-6859fc0c85ea3b4c
kind: gotcha
topic: anchorage-approval-status-sync
tags: []
importance: 0.5
agent: 
created: 2026-08-25T08:56:47.456Z
updated: 2026-08-25T08:56:52.021Z
---

FE AnchorageListPage: approvalStatus keys đã sync theo chuẩn Berth — dùng ApprovalStatus enum (DRAFT/APPROVED_LEVEL1/APPROVED_LEVEL2/APPROVED/REJECTED) thay vì legacy (NHAP/CHO_PHE_DUYET/DA_PHE_DUYET/TU_CHOI). TAB_STATUS_LIST, TAB_QUERY_MAP, APPROVAL_STYLE_MAP, rowActions đã update. filterApprovalStatus đã bỏ khỏi fetchData dependency list. FE compile OK (tsc --noEmit, exit 0).
