---
id: AM-46e0894dd1962af2
kind: gotcha
topic: local-maven-env
tags: []
importance: 0.9
agent: 
created: 2026-08-21T09:28:35.150Z
updated: 2026-08-21T09:28:35.150Z
---

Máy dev không có Maven trong PATH (chỉ JDK 17 Adoptium). Muốn chạy mvn local: tải apache-maven-3.9.9-bin.zip từ repo.maven.apache.org bằng curl kèm --ssl-no-revoke (máy báo CRYPT_E_REVOCATION_OFFLINE nếu thiếu), giải nén vào thư mục scratch rồi chạy mvn.cmd. ~/.m2 đã warm dependencies nên mvn test chạy được. Dockerfile.backend build bằng maven:3.9-eclipse-temurin-17 với 'mvn package -DskipTests' — vẫn compile toàn bộ test (testCompile) nên test lệch chữ ký service làm hỏng build CI.
