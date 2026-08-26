---
id: AM-44cc80b6777c65f8
kind: gotcha
topic: port-family-permissions-not-seeded
tags: []
importance: 0.75
agent: 
created: 2026-08-18T01:36:27.249Z
updated: 2026-08-18T01:36:27.249Z
---

RolePermissionSeeder.java KHÔNG tồn tại trong repo (AGENTS.md tham chiếu stale); seeder quyền thật là src/main/java/com/hanghai/kchtg/config/PermissionSeeder.java (chỉ có run(), không có upsertMissingPermissions). KHÔNG migration nào seed permission port/berth/pier/dryport — V87 chỉ rename rows có sẵn từ DB cũ, V20260812200000 chỉ insert orgunit:scope_all + admin:all → DB mới (fresh) sẽ THIẾU toàn bộ permission family cảng biển; ALWAYS_ALLOWED_RESOURCES={port,berth,pier} chỉ che chắn 3 resource đó, dryport:* bị enforce thật → cảng cạn 403 trên DB mới.
