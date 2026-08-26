---
id: AM-ee0b93be2bcb8b91
kind: fact
topic: toolchain-manhhv1
tags: []
importance: 0.7
agent: 
created: 2026-08-20T03:23:51.657Z
updated: 2026-08-20T03:23:51.657Z
---

Máy manhhv1 (win32, shell cmd.exe) KHÔNG có mvn trong PATH, không có maven wrapper trong repo, không có psql/docker → không thể chạy mvn clean compile hay query PostgreSQL từ đây. JDK 17 Temurin có sẵn. User chạy Spring Boot từ IDE (log devtools restartedMain).
