---
id: AM-30270e2d5b9eec2c
kind: gotcha
topic: db-connection-app-vs-env
tags: []
importance: 0.9
agent: 
created: 2026-08-20T03:54:04.134Z
updated: 2026-08-20T03:54:04.134Z
---

App Spring Boot KHÔNG tự đọc .env — profile prod dùng default của application.yml: DB thật app đang chạy là jdbc:postgresql://10.0.229.20:5432/vmd_csdl_v2_dev (admin/Etc@1234). DB vmd_csdl_v2 trong .env (vmd_mtis_geo) là DB GIS khác — KHÔNG có bảng buoy, đừng nhầm khi sửa schema. Dùng JDBC driver ~/.m2 (postgresql-42.7.4.jar) + script scratch để query, không có psql.
