---
id: AM-3ccdd2949acbcd26
kind: decision
topic: detail-view-pattern
tags: []
importance: 0.7
agent: 
created: 2026-08-17T03:17:54.798Z
updated: 2026-08-17T03:17:54.798Z
---

Màn chi tiết (view) phải dùng grid label:value với preset detailRowStyle/detailLabelColStyle/detailValueStyle (tokens.ts Section 5.12), KHÔNG render Form disabled (input xám mờ). Reference: UsersPage.tsx detail drawer + GroupList.tsx .detail-grid. UnitList.tsx 'Chi tiết đơn vị' đã chuyển từ <Form disabled={isViewing}> sang detail rows 2026-08-17; value '—' hiển thị màu textSecondary.
