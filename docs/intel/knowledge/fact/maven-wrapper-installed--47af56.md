---
id: AM-47af562406fb40ae
kind: fact
topic: maven-wrapper-installed
tags: []
importance: 0.8
agent: 
created: 2026-08-17T06:44:33.204Z
updated: 2026-08-17T06:44:33.204Z
---

Đã thêm Maven Wrapper vào repo (2026-08-17): .mvn/wrapper/maven-wrapper.properties (Maven 3.9.9) + mvnw.cmd (chuẩn Apache 3.3.2). Máy KHÔNG có mvn/winget trên PATH nên build backend = .\mvnw.cmd clean compile; lần đầu tự tải Maven dist về ~/.m2/wrapper. Chưa có script bash mvnw (vượt LOC budget tripwire). JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot
