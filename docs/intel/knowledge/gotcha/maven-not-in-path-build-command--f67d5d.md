---
id: AM-f67d5db1cd846df8
kind: gotcha
topic: maven-not-in-path-build-command
tags: []
importance: 0.9
agent: 
created: 2026-08-22T10:12:36.411Z
updated: 2026-08-22T10:12:36.411Z
---

Maven KHÔNG nằm trong PATH của shell AI Studio (máy manhhv1). Cách verify backend: dùng Maven di động đã tải về %TEMP%\ai-studio\apache-maven-3.9.9\bin\mvn.cmd (cache ~/.m2 có sẵn nên build offline nhanh). Không có mvnw trong repo, không có winget/choco.
