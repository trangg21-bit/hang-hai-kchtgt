---
id: AM-66974be642b3b8c2
kind: decision
topic: running-db-connection
tags: []
importance: 0.9
agent: 
created: 2026-08-20T07:46:47.967Z
updated: 2026-08-20T07:46:47.967Z
---

Trên máy này app Spring Boot chạy từ IntelliJ (port 8080, profile local) KẾT NỐI DB vmd_csdl_v2 chứ KHÔNG phải vmd_csdl_v2_dev: pg_stat_activity trên 10.0.229.20 cho thấy 10.8.75.81 (máy này) có 2 conn JDBC tới vmd_csdl_v2 (user admin). DB_NAME bị override trong run config IDEA (application-local.yml default là vmd_csdl_v2_dev). Kiểm tra DB thật bằng pg_stat_activity chứ đừng tin default application.yml.
