---
id: AM-8a6c2376be142235
kind: decision
topic: unaccent-search-6-kcht-modules
tags: []
importance: 0.85
agent: 
created: 2026-08-22T10:12:36.836Z
updated: 2026-08-22T10:12:36.836Z
---

Tìm kiếm không dấu (accent-insensitive) đã áp dụng immutable_unaccent CẢ 2 VẾ (cột + keyword) cho 6 repository: Port/Pier/Berth/DryPort (port package) + Buoy + BuoyStation (gồm searchFiltered lẫn searchGis). Migration index: V20260822120000__add_unaccent_port_buoy_search_indexes.sql. Test chứng minh: PortSearchRepositoryTest (8 test, H2). LƯU Ý: VtsSystemRepository vẫn chỉ unaccent 1 vế (gõ có dấu không khớp) — pattern chưa đồng nhất.
