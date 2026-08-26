---
id: AM-496e5700817fd05e
kind: gotcha
topic: port-pages-lint-debt
tags: []
importance: 0.6
agent: 
created: 2026-08-20T07:12:23.238Z
updated: 2026-08-20T07:12:23.238Z
---

eslint toàn file của 4 màn cảng biển/bến cảng/cầu cảng/cảng cạn (PortListPage, BerthList, PierList, DryPortList) đang nợ ~364 lỗi có sẵn (no-unused-vars, no-explicit-any, a11y, hooks deps...) — không dùng eslint toàn file làm cổng verify khi sửa các file này, chỉ check dòng đã sửa.
