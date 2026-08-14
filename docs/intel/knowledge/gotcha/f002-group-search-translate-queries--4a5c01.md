---
id: AM-4a5c01b43bc8e49f
kind: gotcha
topic: f002-group-search-translate-queries
tags: []
importance: 0.7
agent: 
created: 2026-08-14T04:39:02.535Z
updated: 2026-08-14T04:39:02.535Z
---

F-002 (Quản lý nhóm người dùng) tìm kiếm không dấu dùng hàm translate() (KHÔNG dùng immutable_unaccent như F-001): GroupRepository.searchAndFilter / countByFiltersAndStatus / searchAndFilterMyGroups so khớp tên/mã bằng cast(function('translate', LOWER(COALESCE(g.name/code,'')), '<dấu>', '<ascii>') as string) LIKE. Ba query này có block search gần giống nhau nhưng KHÔNG byte-identical (countByFiltersAndStatus kết thúc bằng 'AND cast(g.status as integer) = :status' còn searchAndFilter có ':status IS NULL OR'). Khi tách filter phải sửa từng query riêng (replaceAll không hit đủ) rồi grep xác nhận không còn g.description/:search sót.
