---
id: AM-79b43f1a1a66cacf
kind: fact
topic: dev-db-access
tags: []
importance: 0.8
agent: 
created: 2026-08-19T09:16:27.852Z
updated: 2026-08-19T09:16:27.852Z
---

Dev DB PostgreSQL: jdbc:postgresql://10.0.229.20:5432/vmd_csdl_v2, user admin / pass Etc@1234 (default trong application-local.yml). Máy KHÔNG có psql, python, node client — cách truy vấn/sửa DB duy nhất đã kiểm chứng: viết file .java trong scratch (C:\Users\manhhv1\AppData\Local\Temp\ai-studio) + javac/java với classpath ~/.m2/repository/org/postgresql/postgresql/42.7.4/postgresql-42.7.4.jar (Java 17 Temurin có sẵn).
