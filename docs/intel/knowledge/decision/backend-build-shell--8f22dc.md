---
id: AM-8f22dcd08c81ada1
kind: decision
topic: backend-build-shell
tags: []
importance: 0.8
agent: 
created: 2026-08-14T07:18:19.395Z
updated: 2026-08-14T07:18:19.395Z
---

Backend build: `mvn` KHÔNG có trên PATH của shell AI Studio và dự án KHÔNG có mvnw wrapper — không thể chạy mvn clean compile/install từ bash; user build & chạy bằng IntelliJ (Maven bundled). Verification backend trong shell chỉ có thể dựa vào đọc code cẩn thận.
