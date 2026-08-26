---
id: AM-f2e61cb2033c5d2c
kind: gotcha
topic: buoy-lstpage-tsc-errors
tags: []
importance: 0.6
agent: 
created: 2026-08-24T01:12:15.092Z
updated: 2026-08-24T01:12:15.092Z
---

2026-08-24: BuoyListPage.tsx có 6 lỗi tsc pre-existing không liên quan code sửa: TreeSelect unused (8), BUOY_TYPE_MAP unused (32), allData unused (253), orgTree unused (279), BeaconStatus vs APPROVED_L1 type mismatch (1495), ddToDms type mismatch (1843). Không do thay đổi buoy form gây ra — xác nhận bằng diff chỉ 2 file thay đổi.
