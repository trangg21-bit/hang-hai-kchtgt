---
id: AM-8a3c11f2ed418504
kind: gotcha
topic: orgunit-datafixer-validation
tags: []
importance: 0.8
agent: 
created: 2026-08-20T03:23:51.059Z
updated: 2026-08-20T03:23:51.059Z
---

OrgUnitDataFixer (ApplicationRunner @Order(1)) fixOrphans() update mọi org_unit có parent_id IS NULL không phải root đầu; nếu DB có bản ghi code NULL/'' (DDL tạo org_units không NOT NULL) thì Hibernate onPreUpdate validate @NotBlank code → ConstraintViolationException chặn toàn bộ app start. Fix: skip bản ghi code blank + chỉ chọn root có code. Dữ liệu code rỗng là tồn đọng, không do seeder/source hiện tại sinh ra.
